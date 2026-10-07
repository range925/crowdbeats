// Crowdbeats V2 — Creator Context State & Notifier (Phase 2)
// Single-UID creator context switching for Solo and Band memberships.
// Enforces live session conflict protection: prevents switching into another context
// while an active stage session is live.

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../ui/components/cb_context_switcher_pill.dart';

import '../data/services/session_reconciliation_service.dart';

enum CreatorCheckInStatus {
  none,
  pending,
  verified,
  unavailable,
}

@immutable
class CreatorContextState {
  final CreatorContextItem activeContext;
  final List<CreatorContextItem> availableContexts;
  final bool isLoading;
  final String? conflictError;

  /// The server-assigned session ID for the active live session, if any.
  /// Set when startSession succeeds; cleared when endSession completes.
  final String? activeSessionId;

  /// Server-authoritative lease expiry for the active session.
  /// Kept up-to-date by [SessionHeartbeatNotifier] after each heartbeat.
  final DateTime? sessionEndsAt;

  /// Check-in truthfulness status (Phase 10: strictly zero optimistic verified pins).
  final CreatorCheckInStatus checkInStatus;

  /// High-level actionable creator recovery state.
  final CreatorRecoveryState recoveryState;

  const CreatorContextState({
    required this.activeContext,
    required this.availableContexts,
    this.isLoading = false,
    this.conflictError,
    this.activeSessionId,
    this.sessionEndsAt,
    this.checkInStatus = CreatorCheckInStatus.none,
    this.recoveryState = CreatorRecoveryState.connected,
  });

  bool get isSolo => activeContext.isSolo;
  bool get isBand => !activeContext.isSolo;

  /// Whether a real server session is currently live.
  bool get hasLiveSession => activeSessionId != null;

  CreatorContextState copyWith({
    CreatorContextItem? activeContext,
    List<CreatorContextItem>? availableContexts,
    bool? isLoading,
    String? conflictError,
    CreatorCheckInStatus? checkInStatus,
    CreatorRecoveryState? recoveryState,
    // Use Object() sentinel to distinguish "pass null explicitly" from "omit".
    Object? activeSessionId = _sentinel,
    Object? sessionEndsAt = _sentinel,
  }) {
    return CreatorContextState(
      activeContext: activeContext ?? this.activeContext,
      availableContexts: availableContexts ?? this.availableContexts,
      isLoading: isLoading ?? this.isLoading,
      conflictError: conflictError,
      checkInStatus: checkInStatus ?? this.checkInStatus,
      recoveryState: recoveryState ?? this.recoveryState,
      activeSessionId: activeSessionId == _sentinel
          ? this.activeSessionId
          : activeSessionId as String?,
      sessionEndsAt: sessionEndsAt == _sentinel
          ? this.sessionEndsAt
          : sessionEndsAt as DateTime?,
    );
  }
}

// Sentinel object for nullable copyWith fields.
const _sentinel = Object();

class CreatorContextNotifier extends StateNotifier<CreatorContextState> {
  CreatorContextNotifier({
    CreatorContextItem? initialContext,
    List<CreatorContextItem>? initialAvailable,
  }) : super(
          CreatorContextState(
            activeContext: initialContext ??
                const CreatorContextItem(
                  id: 'solo_default',
                  name: 'Elena Cruz (Solo)',
                  type: 'solo',
                  role: 'SOLO_ARTIST',
                ),
            availableContexts: initialAvailable ??
                const [
                  CreatorContextItem(
                    id: 'solo_default',
                    name: 'Elena Cruz (Solo)',
                    type: 'solo',
                    role: 'SOLO_ARTIST',
                  ),
                  CreatorContextItem(
                    id: 'band_midnight',
                    name: 'The Midnight Echoes',
                    type: 'band',
                    role: 'BAND_FOUNDER',
                  ),
                ],
          ),
        );

  /// Switches active context if no active live session conflict exists.
  /// If the current context is live, blocks switching and records a conflictError.
  bool switchContext(CreatorContextItem newContext) {
    if (state.activeContext.hasActiveLiveSession) {
      state = state.copyWith(
        conflictError: 'Cannot switch context while a live stage session is active. End current session first.',
      );
      return false;
    }

    state = state.copyWith(
      activeContext: newContext,
      conflictError: null,
    );
    return true;
  }

  /// Called after a successful [startSession] callable response.
  ///
  /// Stores the server-assigned [sessionId] and server-authoritative [endsAt],
  /// and marks the active context as live. GPS is stopped by the caller
  /// immediately before this method is invoked.
  void setSessionActive({
    required String sessionId,
    required DateTime endsAt,
  }) {
    _setLiveContextFlag(true);
    state = state.copyWith(
      activeSessionId: sessionId,
      sessionEndsAt: endsAt,
      checkInStatus: CreatorCheckInStatus.verified,
      recoveryState: CreatorRecoveryState.connected,
      conflictError: null,
    );
  }

  /// Called after a successful [endSession] callable response (or on TTL expiry
  /// detected client-side). Clears all session fields and resets the live flag.
  void clearSession() {
    _setLiveContextFlag(false);
    state = state.copyWith(
      activeSessionId: null,
      sessionEndsAt: null,
      checkInStatus: CreatorCheckInStatus.none,
      conflictError: null,
    );
  }

  void setCheckInStatus(CreatorCheckInStatus status) {
    state = state.copyWith(checkInStatus: status);
  }

  void setRecoveryState(CreatorRecoveryState recoveryState) {
    state = state.copyWith(recoveryState: recoveryState);
  }

  /// Called by [SessionHeartbeatNotifier] after a successful heartbeat response.
  /// Updates the lease expiry without touching any other fields.
  void updateEndsAt(DateTime newEndsAt) {
    state = state.copyWith(sessionEndsAt: newEndsAt);
  }

  /// Legacy helper used by pre-Phase-B UI code.
  ///
  /// Prefer [setSessionActive] / [clearSession] for new call sites.
  @Deprecated('Use setSessionActive / clearSession in Phase B+ code.')
  void setLiveStatus(bool isLive) {
    _setLiveContextFlag(isLive);
  }

  void clearConflictError() {
    state = state.copyWith(conflictError: null);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  void _setLiveContextFlag(bool isLive) {
    final updatedActive = CreatorContextItem(
      id: state.activeContext.id,
      name: state.activeContext.name,
      type: state.activeContext.type,
      role: state.activeContext.role,
      photoUrl: state.activeContext.photoUrl,
      hasActiveLiveSession: isLive,
    );

    final updatedList = state.availableContexts.map((c) {
      if (c.id == updatedActive.id) return updatedActive;
      return c;
    }).toList();

    state = state.copyWith(
      activeContext: updatedActive,
      availableContexts: updatedList,
    );
  }
}

final creatorContextProvider =
    StateNotifierProvider<CreatorContextNotifier, CreatorContextState>((ref) {
  return CreatorContextNotifier();
});
