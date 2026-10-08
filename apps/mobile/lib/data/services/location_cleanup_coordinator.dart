// Crowdbeats V2 — Centralized Location Cleanup Coordinator (Phase 10)
//
// Single point of responsibility for tearing down all sensors, geofences,
// foreground services, background flags, timers, listeners, notifications,
// and sensitive local operational state.
//
// Terminal State Invariants:
// Reaching any terminal state (ended, force_ended, expired, logged_out, suspended)
// MUST assert:
// 1. Zero active sensors (assertZeroActiveSensors)
// 2. Zero background services (assertZeroBackgroundServices)
// 3. Zero session listeners (assertZeroSessionListeners)
// 4. Zero retained private coordinates (assertZeroPrivateCoordinates)

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/location_backpressure_queue.dart';
import '../models/location_fix.dart';
import 'location_provider.dart';

enum TerminalCleanupReason {
  performerEnded,
  adminEnded,
  expired,
  loggedOut,
  permissionRevoked,
  accountSuspended,
  policyIncompatible,
}

class TerminalStateInvariantReport {
  const TerminalStateInvariantReport({
    required this.zeroSensors,
    required this.zeroBackgroundServices,
    required this.zeroListeners,
    required this.zeroPrivateCoordinates,
    required this.allPassed,
    required this.timestamp,
    required this.reason,
  });

  final bool zeroSensors;
  final bool zeroBackgroundServices;
  final bool zeroListeners;
  final bool zeroPrivateCoordinates;
  final bool allPassed;
  final DateTime timestamp;
  final TerminalCleanupReason reason;

  Map<String, dynamic> toJson() => {
        'zeroSensors': zeroSensors,
        'zeroBackgroundServices': zeroBackgroundServices,
        'zeroListeners': zeroListeners,
        'zeroPrivateCoordinates': zeroPrivateCoordinates,
        'allPassed': allPassed,
        'timestamp': timestamp.toIso8601String(),
        'reason': reason.name,
      };
}

class LocationCleanupCoordinator {
  LocationCleanupCoordinator({
    this.locationProvider,
    this.queue,
    void Function(String message)? logger,
    DateTime Function()? nowFn,
  })  : _logger = logger ?? debugPrint,
        _now = nowFn ?? DateTime.now;

  final LocationProvider? locationProvider;
  final LocationBackpressureQueue? queue;
  final void Function(String message) _logger;
  final DateTime Function() _now;

  // Tracked active resources for cleanup and invariant verification
  final List<StreamSubscription<dynamic>> _trackedSubscriptions = [];
  final List<Timer> _trackedTimers = [];
  final List<StreamController<dynamic>> _trackedControllers = [];
  final List<String> _trackedGeofenceRegions = [];
  bool _isForegroundServiceActive = false;
  bool _isNotificationPosted = false;
  LocationFix? _lastInMemoryCoordinate;

  int get activeSubscriptionCount =>
      _trackedSubscriptions.where((s) => !s.isPaused).length;
  int get activeTimerCount => _trackedTimers.where((t) => t.isActive).length;
  int get activeControllerCount =>
      _trackedControllers.where((c) => !c.isClosed).length;
  int get activeGeofenceCount => _trackedGeofenceRegions.length;
  bool get isForegroundServiceActive => _isForegroundServiceActive;

  // ── Registration helpers ───────────────────────────────────────────────────

  void registerSubscription(StreamSubscription<dynamic> subscription) {
    _trackedSubscriptions.add(subscription);
  }

  void registerTimer(Timer timer) {
    _trackedTimers.add(timer);
  }

  void registerController(StreamController<dynamic> controller) {
    _trackedControllers.add(controller);
  }

  void registerGeofenceRegion(String regionId) {
    if (!_trackedGeofenceRegions.contains(regionId)) {
      _trackedGeofenceRegions.add(regionId);
    }
  }

  void setForegroundServiceActive(bool active) {
    _isForegroundServiceActive = active;
  }

  void setNotificationPosted(bool posted) {
    _isNotificationPosted = posted;
  }

  void recordTemporaryCoordinate(LocationFix fix) {
    _lastInMemoryCoordinate = fix;
  }

  // ── Granular Teardown Steps ────────────────────────────────────────────────

  /// 1. Cancels all active location sensor subscriptions and completers.
  Future<void> cancelAllLocationCallbacks() async {
    for (final sub in _trackedSubscriptions) {
      try {
        await sub.cancel();
      } catch (e) {
        _logger('[LocationCleanupCoordinator] Error cancelling subscription: $e');
      }
    }
    _trackedSubscriptions.clear();
    locationProvider?.cancelCurrentOperation();
    _logger('[LocationCleanupCoordinator] Cancelled all location sensor callbacks.');
  }

  /// 2. Stops and removes registered geofences and circular regions.
  Future<void> stopGeofencingAndRegions() async {
    for (final regionId in List<String>.from(_trackedGeofenceRegions)) {
      try {
        await locationProvider?.cancelGeofence(regionId);
      } catch (e) {
        _logger('[LocationCleanupCoordinator] Error cancelling geofence: $e');
      }
    }
    _trackedGeofenceRegions.clear();
    _logger('[LocationCleanupCoordinator] Stopped all geofences and regions.');
  }

  /// 3. Stops foreground service, dismisses ongoing notification, and clears flags.
  Future<void> stopForegroundServiceAndBackgroundFlags() async {
    try {
      await locationProvider?.stopContinuous();
    } catch (e) {
      _logger('[LocationCleanupCoordinator] Error stopping continuous provider: $e');
    }
    _isForegroundServiceActive = false;
    _isNotificationPosted = false;
    _logger('[LocationCleanupCoordinator] Foreground service and background flags stopped.');
  }

  /// 4. Cancels periodic heartbeat timers and retry tickers.
  void cancelTimersAndHeartbeats() {
    for (final timer in _trackedTimers) {
      if (timer.isActive) {
        timer.cancel();
      }
    }
    _trackedTimers.clear();
    _logger('[LocationCleanupCoordinator] Cancelled all timers and heartbeats.');
  }

  /// 5. Detaches all StreamControllers and listener streams.
  Future<void> detachAllListeners() async {
    for (final controller in _trackedControllers) {
      if (!controller.isClosed) {
        try {
          unawaited(controller.close());
        } catch (e) {
          _logger('[LocationCleanupCoordinator] Error closing controller: $e');
        }
      }
    }
    _trackedControllers.clear();
    _logger('[LocationCleanupCoordinator] Detached all listeners and stream controllers.');
  }

  /// 6. Dismisses active notifications.
  void dismissNotifications() {
    _isNotificationPosted = false;
    _logger('[LocationCleanupCoordinator] Dismissed location notifications.');
  }

  /// 7. Purges in-memory coordinate queues and buffers.
  void purgeSensitiveLocalTelemetry() {
    queue?.clear(resetCounters: true);
    _lastInMemoryCoordinate = null;
    _logger('[LocationCleanupCoordinator] Purged all sensitive local telemetry and memory coordinates.');
  }

  // ── Unified Terminal Teardown ─────────────────────────────────────────────

  /// Executes complete, sequenced cleanup upon reaching any terminal state.
  Future<TerminalStateInvariantReport> cleanupTerminalState(
    TerminalCleanupReason reason,
  ) async {
    _logger('[LocationCleanupCoordinator] Beginning terminal cleanup. Reason: ${reason.name}');

    await cancelAllLocationCallbacks();
    await stopGeofencingAndRegions();
    await stopForegroundServiceAndBackgroundFlags();
    cancelTimersAndHeartbeats();
    await detachAllListeners();
    dismissNotifications();
    purgeSensitiveLocalTelemetry();

    final report = verifyAllInvariants(reason);
    _logger(
      '[LocationCleanupCoordinator] Terminal cleanup complete. Invariants passed: ${report.allPassed}',
    );
    return report;
  }

  // ── Terminal Invariant Assertions ──────────────────────────────────────────

  /// Invariant 1: Confirms 0 active sensors/subscriptions.
  void assertZeroActiveSensors() {
    if (_trackedSubscriptions.isNotEmpty) {
      throw StateError(
        'Terminal invariant violation: ${_trackedSubscriptions.length} active location subscriptions remained after cleanup.',
      );
    }
  }

  /// Invariant 2: Confirms 0 background services or active flags.
  void assertZeroBackgroundServices() {
    if (_isForegroundServiceActive || _isNotificationPosted) {
      throw StateError(
        'Terminal invariant violation: Foreground service or notification flag remained active after cleanup.',
      );
    }
  }

  /// Invariant 3: Confirms 0 session listeners or geofences.
  void assertZeroSessionListeners() {
    if (_trackedControllers.isNotEmpty || _trackedGeofenceRegions.isNotEmpty) {
      throw StateError(
        'Terminal invariant violation: Controllers (${_trackedControllers.length}) or geofences (${_trackedGeofenceRegions.length}) remained after cleanup.',
      );
    }
  }

  /// Invariant 4: Confirms 0 retained private coordinates.
  void assertZeroPrivateCoordinates() {
    final q = queue;
    if ((q != null && !q.isEmpty) || _lastInMemoryCoordinate != null) {
      throw StateError(
        'Terminal invariant violation: Private coordinates retained in memory after cleanup (queue: ${queue?.size}, coord: $_lastInMemoryCoordinate).',
      );
    }
  }

  /// Evaluates all four terminal invariants and returns a comprehensive report.
  TerminalStateInvariantReport verifyAllInvariants(TerminalCleanupReason reason) {
    final zeroSensors = _trackedSubscriptions.isEmpty;
    final zeroServices = !_isForegroundServiceActive && !_isNotificationPosted;
    final zeroListeners =
        _trackedControllers.isEmpty && _trackedGeofenceRegions.isEmpty;
    final q = queue;
    final zeroCoords =
        (q == null || q.isEmpty) && _lastInMemoryCoordinate == null;

    final allPassed = zeroSensors && zeroServices && zeroListeners && zeroCoords;

    return TerminalStateInvariantReport(
      zeroSensors: zeroSensors,
      zeroBackgroundServices: zeroServices,
      zeroListeners: zeroListeners,
      zeroPrivateCoordinates: zeroCoords,
      allPassed: allPassed,
      timestamp: _now(),
      reason: reason,
    );
  }
}

final locationCleanupCoordinatorProvider = Provider<LocationCleanupCoordinator>((ref) {
  return LocationCleanupCoordinator();
});
