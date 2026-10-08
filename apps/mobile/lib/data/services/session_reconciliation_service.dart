// Crowdbeats V2 — Session Reconciliation Service (Phase 10)
//
// Manages startup reconciliation, app wake/resume recovery, offline check-in truthfulness,
// server lease authority synchronization, zero silent background tracking restarts,
// and fan visibility grant reconciliation.

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../state/creator_context_state.dart';
import 'location_cleanup_coordinator.dart';
import 'location_provider.dart';

enum CreatorRecoveryState {
  connected,
  reconnecting,
  needsPermission,
  needsReverification,
  expired,
  endedByAdmin,
}

@immutable
class SessionReconciliationResult {
  const SessionReconciliationResult({
    required this.isLive,
    required this.status,
    required this.serverTimestamp,
    this.sessionId,
    this.endsAt,
    this.leaseRemainingSeconds,
    this.clockSkewSeconds = 0,
    this.terminalReason,
    this.recoveryState = CreatorRecoveryState.connected,
    this.fanGrants = const [],
    this.isAccountSuspended = false,
  });

  final bool isLive;
  final String status;
  final DateTime serverTimestamp;
  final String? sessionId;
  final DateTime? endsAt;
  final int? leaseRemainingSeconds;
  final int clockSkewSeconds;
  final TerminalCleanupReason? terminalReason;
  final CreatorRecoveryState recoveryState;
  final List<Map<String, dynamic>> fanGrants;
  final bool isAccountSuspended;
}

class SessionReconciliationService {
  SessionReconciliationService({
    required this.ref,
    FirebaseFunctions? functions,
    this.cleanupCoordinator,
    this.locationProvider,
    DateTime Function()? nowFn,
    void Function(String message)? logger,
  })  : _injectedFunctions = functions,
        _now = nowFn ?? DateTime.now,
        _logger = logger ?? debugPrint;

  final Ref ref;
  final FirebaseFunctions? _injectedFunctions;
  final LocationCleanupCoordinator? cleanupCoordinator;
  final LocationProvider? locationProvider;
  final DateTime Function() _now;
  final void Function(String message) _logger;

  FirebaseFunctions get _functions =>
      _injectedFunctions ?? FirebaseFunctions.instance;

  /// Reconciles creator session state on app restart, wake from background,
  /// or network reconnect.
  ///
  /// INVARIANTS:
  /// - If server says session is ended, expired, or not found:
  ///   immediately invokes [LocationCleanupCoordinator.cleanupTerminalState]
  ///   and updates local state to terminated.
  /// - Never silently restarts background mobile tracking.
  /// - Truthfully synchronizes remaining server lease.
  Future<SessionReconciliationResult> reconcileCreatorSession({
    String? sessionId,
    String? profileId,
  }) async {
    final activeSessionId = sessionId ??
        ref.read(creatorContextProvider).activeSessionId;

    if (activeSessionId == null && profileId == null) {
      return SessionReconciliationResult(
        isLive: false,
        status: 'none',
        serverTimestamp: _now(),
        recoveryState: CreatorRecoveryState.connected,
      );
    }

    final clientNow = _now();

    try {
      final callable = _functions.httpsCallable('reconcileSessionState');
      final result = await callable.call<Map<String, dynamic>>({
        'sessionId': ?activeSessionId,
        'profileId': ?profileId,
        'role': 'artist',
        'clientTimestamp': clientNow.toIso8601String(),
      });

      final data = result.data;
      final isLive = data['isLive'] as bool? ?? false;
      final status = data['status'] as String? ?? 'not_found';
      final serverTimestampStr = data['serverTimestamp'] as String?;
      final serverTimestamp = serverTimestampStr != null
          ? DateTime.parse(serverTimestampStr)
          : clientNow;
      final endsAtStr = data['endsAt'] as String?;
      final endsAt = endsAtStr != null ? DateTime.parse(endsAtStr) : null;
      final leaseRemaining = data['leaseRemainingSeconds'] as int?;
      final clockSkew = data['clockSkewSeconds'] as int? ?? 0;
      final terminalReasonStr = data['terminalReason'] as String?;
      final isSuspended = data['isAccountSuspended'] as bool? ?? false;

      // Handle account suspension
      if (isSuspended) {
        _logger('[SessionReconciliationService] Account suspended. Executing cleanup.');
        final coordinator = cleanupCoordinator;
        if (coordinator != null) {
          await coordinator.cleanupTerminalState(
            TerminalCleanupReason.accountSuspended,
          );
        }
        ref.read(creatorContextProvider.notifier).clearSession();
        return SessionReconciliationResult(
          isLive: false,
          status: 'ended',
          serverTimestamp: serverTimestamp,
          sessionId: activeSessionId,
          terminalReason: TerminalCleanupReason.accountSuspended,
          recoveryState: CreatorRecoveryState.endedByAdmin,
          isAccountSuspended: true,
        );
      }

      // Handle terminal states from server
      if (!isLive || status != 'live') {
        TerminalCleanupReason cleanupReason;
        CreatorRecoveryState recovery;

        if (status == 'admin_ended' || terminalReasonStr == 'admin_ended') {
          cleanupReason = TerminalCleanupReason.adminEnded;
          recovery = CreatorRecoveryState.endedByAdmin;
        } else if (status == 'expired' || terminalReasonStr == 'expired') {
          cleanupReason = TerminalCleanupReason.expired;
          recovery = CreatorRecoveryState.expired;
        } else {
          cleanupReason = TerminalCleanupReason.performerEnded;
          recovery = CreatorRecoveryState.expired;
        }

        _logger(
          '[SessionReconciliationService] Session terminal ($status). Tearing down local state.',
        );

        final coordinator = cleanupCoordinator;
        if (coordinator != null) {
          await coordinator.cleanupTerminalState(cleanupReason);
        }

        ref.read(creatorContextProvider.notifier).clearSession();

        return SessionReconciliationResult(
          isLive: false,
          status: status,
          serverTimestamp: serverTimestamp,
          sessionId: activeSessionId,
          endsAt: endsAt,
          terminalReason: cleanupReason,
          recoveryState: recovery,
        );
      }

      // Session is LIVE and verified by server authority
      if (endsAt != null) {
        ref.read(creatorContextProvider.notifier).updateEndsAt(endsAt);
      }

      // Check device permission state
      CreatorRecoveryState recovery = CreatorRecoveryState.connected;
      final provider = locationProvider;
      if (provider != null) {
        final perm = await provider.getPermissionState();
        if (perm == LocationPermissionState.servicesDisabled ||
            perm == LocationPermissionState.permanentlyDenied ||
            perm == LocationPermissionState.denied) {
          recovery = CreatorRecoveryState.needsPermission;
        }
      }

      // ZERO SILENT BACKGROUND RESTARTS INVARIANT:
      // We do not start background continuous GPS streaming here automatically.
      // Mobile background tracking strictly requires affirmative user initiation.

      return SessionReconciliationResult(
        isLive: true,
        status: 'live',
        serverTimestamp: serverTimestamp,
        sessionId: activeSessionId,
        endsAt: endsAt,
        leaseRemainingSeconds: leaseRemaining,
        clockSkewSeconds: clockSkew,
        recoveryState: recovery,
      );
    } catch (e) {
      _logger('[SessionReconciliationService] Reconciliation network error: $e');

      // Offline handling: check local authoritative lease
      final localEndsAt = ref.read(creatorContextProvider).sessionEndsAt;
      if (localEndsAt != null && clientNow.isAfter(localEndsAt)) {
        _logger('[SessionReconciliationService] Local lease expired while offline.');
        final coordinator = cleanupCoordinator;
        if (coordinator != null) {
          await coordinator.cleanupTerminalState(
            TerminalCleanupReason.expired,
          );
        }
        ref.read(creatorContextProvider.notifier).clearSession();
        return SessionReconciliationResult(
          isLive: false,
          status: 'expired',
          serverTimestamp: clientNow,
          sessionId: activeSessionId,
          endsAt: localEndsAt,
          terminalReason: TerminalCleanupReason.expired,
          recoveryState: CreatorRecoveryState.expired,
        );
      }

      // Still within unexpired lease window, but currently disconnected
      return SessionReconciliationResult(
        isLive: activeSessionId != null,
        status: 'reconnecting',
        serverTimestamp: clientNow,
        sessionId: activeSessionId,
        endsAt: localEndsAt,
        recoveryState: CreatorRecoveryState.reconnecting,
      );
    }
  }

  /// Reconciles active Fan audience visibility grants.
  /// If target creator session has ended, marks grant as inactive and never silently renews.
  Future<List<Map<String, dynamic>>> reconcileFanGrants(String sessionId) async {
    try {
      final callable = _functions.httpsCallable('reconcileSessionState');
      final result = await callable.call<Map<String, dynamic>>({
        'sessionId': sessionId,
        'role': 'fan',
        'clientTimestamp': _now().toIso8601String(),
      });

      final rawList = result.data['fanGrants'] as List<dynamic>? ?? [];
      return rawList.map((item) => Map<String, dynamic>.from(item as Map)).toList();
    } catch (e) {
      _logger('[SessionReconciliationService] Failed to reconcile fan grants: $e');
      return const [];
    }
  }
}

final sessionReconciliationServiceProvider =
    Provider<SessionReconciliationService>((ref) {
  return SessionReconciliationService(ref: ref);
});
