// Crowdbeats V2 — SessionHeartbeatNotifier (Phase B)
//
// Lifecycle-aware Riverpod notifier that keeps a live session alive
// by calling the heartbeatSession callable every 90 seconds.
//
// Design principles:
//   - NO GPS in heartbeats — server-side lease extension only.
//   - Timer is created only when activeSessionId is non-null.
//   - Timer is cancelled: on session end, on app lifecycle pause/detach,
//     and unconditionally in dispose().
//   - Heartbeat failures are silently retried on the next tick (not shown to UI).
//   - Only a single timer can be active at any time.

import 'dart:async';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/services/session_service.dart';
import '../data/services/session_reconciliation_service.dart';
import 'creator_context_state.dart';

// ── Provider plumbing ─────────────────────────────────────────────────────────

/// Provider exposing [SessionService] — overridable in tests with a mock.
final sessionServiceProvider = Provider<SessionService>((ref) {
  return SessionService();
});

/// Heartbeat notifier state — simple error tracking for debugging.
class SessionHeartbeatState {
  const SessionHeartbeatState({
    this.lastHeartbeatAt,
    this.lastError,
    this.consecutiveFailures = 0,
  });

  final DateTime? lastHeartbeatAt;
  final String? lastError;
  final int consecutiveFailures;

  SessionHeartbeatState copyWith({
    DateTime? lastHeartbeatAt,
    String? lastError,
    int? consecutiveFailures,
  }) {
    return SessionHeartbeatState(
      lastHeartbeatAt: lastHeartbeatAt ?? this.lastHeartbeatAt,
      lastError: lastError,
      consecutiveFailures: consecutiveFailures ?? this.consecutiveFailures,
    );
  }
}

// ── Notifier ─────────────────────────────────────────────────────────────────

class SessionHeartbeatNotifier extends StateNotifier<SessionHeartbeatState>
    with WidgetsBindingObserver {
  SessionHeartbeatNotifier(this._ref) : super(const SessionHeartbeatState()) {
    WidgetsBinding.instance.addObserver(this);
    // Watch for changes to activeSessionId and start/stop timer accordingly.
    _listenToSession();
  }

  final Ref _ref;
  Timer? _timer;
  String? _activeSessionId;
  static const _interval = Duration(seconds: 90);

  void _listenToSession() {
    _ref.listen<CreatorContextState>(creatorContextProvider, (prev, next) {
      final sessionId = next.activeSessionId;
      if (sessionId != _activeSessionId) {
        _activeSessionId = sessionId;
        if (sessionId != null) {
          _startTimer(sessionId);
        } else {
          _stopTimer();
        }
      }
    });
  }

  void _startTimer(String sessionId) {
    _stopTimer(); // Cancel any existing timer defensively.
    _timer = Timer.periodic(_interval, (_) => _doHeartbeat(sessionId));
  }

  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> _doHeartbeat(String sessionId) async {
    try {
      final service = _ref.read(sessionServiceProvider);
      final newEndsAt = await service.heartbeat(sessionId);
      if (newEndsAt != null && mounted) {
        _ref.read(creatorContextProvider.notifier).updateEndsAt(newEndsAt);
        state = state.copyWith(
          lastHeartbeatAt: DateTime.now(),
          lastError: null,
          consecutiveFailures: 0,
        );
      } else if (mounted) {
        // Session is no longer live server-side — clear it.
        _stopTimer();
        _ref.read(creatorContextProvider.notifier).setRecoveryState(CreatorRecoveryState.expired);
        _ref.read(creatorContextProvider.notifier).clearSession();
      }
    } catch (e) {
      // Silent retry on next tick; after 3 consecutive failures, transition to reconnecting.
      if (!mounted) return;
      final failures = state.consecutiveFailures + 1;
      state = state.copyWith(
        lastError: e.toString(),
        consecutiveFailures: failures,
      );
      if (failures >= 3) {
        _ref.read(creatorContextProvider.notifier).setRecoveryState(CreatorRecoveryState.reconnecting);
        _stopTimer();
      }
    }
  }

  // ── WidgetsBindingObserver ─────────────────────────────────────────────────

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.paused:
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        // Stop heartbeating when app is backgrounded — conserve battery.
        // The session lease is long enough (8h+) to survive a background period.
        _stopTimer();
      case AppLifecycleState.resumed:
        // Restart if session still active when app returns to foreground.
        final sessionId = _ref.read(creatorContextProvider).activeSessionId;
        if (sessionId != null) {
          _startTimer(sessionId);
        }
      case AppLifecycleState.inactive:
        break; // Transient; ignore.
    }
  }

  @override
  void dispose() {
    _stopTimer();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }
}

final sessionHeartbeatProvider =
    StateNotifierProvider<SessionHeartbeatNotifier, SessionHeartbeatState>((ref) {
  return SessionHeartbeatNotifier(ref);
});
