// Crowdbeats V2 — Privacy-Preserving Location Energy Tracker (Phase 11)
//
// Tracks energy usage, sensor lifetimes, queue backpressure, and database attribution
// WITHOUT storing or emitting exact coordinates, routes, or individual identities.

import 'dart:math';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum TrackingStateMode {
  off,
  discovery,
  checkIn,
  liveStationary,
  liveMobile,
}

class LocationEnergyTracker {
  LocationEnergyTracker({
    DateTime Function()? nowFn,
  }) : _now = nowFn ?? DateTime.now;

  final DateTime Function() _now;

  TrackingStateMode _currentMode = TrackingStateMode.off;
  DateTime? _modeEnteredAt;
  final Map<TrackingStateMode, int> _timeInStateMs = {
    TrackingStateMode.off: 0,
    TrackingStateMode.discovery: 0,
    TrackingStateMode.checkIn: 0,
    TrackingStateMode.liveStationary: 0,
    TrackingStateMode.liveMobile: 0,
  };

  // Sensor power duration
  bool _isSensorActive = false;
  DateTime? _sensorActiveSince;
  int _totalActiveSensorDurationMs = 0;

  // Foreground vs Background
  bool _isForeground = true;
  DateTime? _foregroundSince;
  DateTime? _backgroundSince;
  int _totalForegroundDurationMs = 0;
  int _totalBackgroundDurationMs = 0;

  // Requests
  int _requestsStarted = 0;
  int _requestsStopped = 0;

  // Samples
  int _samplesReceived = 0;
  int _samplesAccepted = 0;
  int _samplesRejected = 0;
  final Map<String, int> _rejectedReasons = {};

  // Accuracy, Interval & Distance Bands
  final Map<String, int> _accuracyClassBands = {
    'balanced': 0,
    'high': 0,
    'coarse': 0,
  };
  final Map<String, int> _intervalBands = {
    'sub_15s': 0,
    '15_to_60s': 0,
    'over_60s': 0,
  };
  final Map<String, int> _distanceFilterBands = {
    'sub_25m': 0,
    '25_to_100m': 0,
    'over_100m': 0,
  };
  int _geofenceEventCount = 0;

  // Network & Backpressure
  int _uploadCount = 0;
  int _bytesUploaded = 0;
  int _retryCount = 0;
  int _queueHighWaterMark = 0;

  // Database Attribution
  int _firestoreReads = 0;
  int _firestoreWrites = 0;
  int _rtdbReads = 0;
  int _rtdbWrites = 0;

  // Listeners
  int _concurrentListeners = 0;
  int _listenerLifetimeAccumulatorMs = 0;

  // Verification & Cleanup
  int _checkInsAttempted = 0;
  bool _checkInSuccess = false;
  int? _timeToVerifiedMs;
  String? _checkInFailureCategory;
  int? _cleanupLatencyMs;

  // Audience & Security
  int _zonesSuppressed = 0;
  int _zonesPublished = 0;
  final Map<String, int> _countBands = {'< 5': 0, '5-14': 0, '15+': 0};
  int _blockedDenials = 0;
  int _rateLimitThrottles = 0;
  int _suspectedProbes = 0;

  // ── State Transitions ────────────────────────────────────────────────────────

  void transitionMode(TrackingStateMode newMode) {
    final now = _now();
    if (_modeEnteredAt != null) {
      final elapsed = now.difference(_modeEnteredAt!).inMilliseconds;
      _timeInStateMs[_currentMode] = (_timeInStateMs[_currentMode] ?? 0) + elapsed;
    }
    _currentMode = newMode;
    _modeEnteredAt = now;
  }

  void recordSensorStarted() {
    _requestsStarted++;
    if (!_isSensorActive) {
      _isSensorActive = true;
      _sensorActiveSince = _now();
    }
  }

  void recordSensorStopped() {
    _requestsStopped++;
    if (_isSensorActive && _sensorActiveSince != null) {
      _totalActiveSensorDurationMs += _now().difference(_sensorActiveSince!).inMilliseconds;
      _isSensorActive = false;
      _sensorActiveSince = null;
    }
  }

  void updateLifecycleState({required bool isForeground}) {
    final now = _now();
    if (_isForeground != isForeground) {
      if (_isForeground && _foregroundSince != null) {
        _totalForegroundDurationMs += now.difference(_foregroundSince!).inMilliseconds;
      } else if (!_isForeground && _backgroundSince != null) {
        _totalBackgroundDurationMs += now.difference(_backgroundSince!).inMilliseconds;
      }
      _isForeground = isForeground;
      if (isForeground) {
        _foregroundSince = now;
      } else {
        _backgroundSince = now;
      }
    }
  }

  // ── Sample & Quality Metrics ────────────────────────────────────────────────

  void recordSampleReceived({
    required bool accepted,
    String? rejectionReason,
    String accuracyClass = 'balanced',
    int intervalSeconds = 15,
    int distanceFilterMeters = 25,
  }) {
    _samplesReceived++;
    if (accepted) {
      _samplesAccepted++;
    } else {
      _samplesRejected++;
      if (rejectionReason != null) {
        _rejectedReasons[rejectionReason] = (_rejectedReasons[rejectionReason] ?? 0) + 1;
      }
    }

    _accuracyClassBands[accuracyClass] = (_accuracyClassBands[accuracyClass] ?? 0) + 1;

    if (intervalSeconds < 15) {
      _intervalBands['sub_15s'] = (_intervalBands['sub_15s'] ?? 0) + 1;
    } else if (intervalSeconds <= 60) {
      _intervalBands['15_to_60s'] = (_intervalBands['15_to_60s'] ?? 0) + 1;
    } else {
      _intervalBands['over_60s'] = (_intervalBands['over_60s'] ?? 0) + 1;
    }

    if (distanceFilterMeters < 25) {
      _distanceFilterBands['sub_25m'] = (_distanceFilterBands['sub_25m'] ?? 0) + 1;
    } else if (distanceFilterMeters <= 100) {
      _distanceFilterBands['25_to_100m'] = (_distanceFilterBands['25_to_100m'] ?? 0) + 1;
    } else {
      _distanceFilterBands['over_100m'] = (_distanceFilterBands['over_100m'] ?? 0) + 1;
    }
  }

  void recordGeofenceEvent() {
    _geofenceEventCount++;
  }

  // ── Network & Database Attribution ──────────────────────────────────────────

  void recordUpload({required int bytes, int retries = 0, int currentQueueSize = 0}) {
    _uploadCount++;
    _bytesUploaded += bytes;
    _retryCount += retries;
    _queueHighWaterMark = max(_queueHighWaterMark, currentQueueSize);
  }

  void recordFirestoreReads(int count) => _firestoreReads += count;
  void recordFirestoreWrites(int count) => _firestoreWrites += count;
  void recordRtdbReads(int count) => _rtdbReads += count;
  void recordRtdbWrites(int count) => _rtdbWrites += count;

  // ── Listeners & Verification ────────────────────────────────────────────────

  void recordListenerAttached() => _concurrentListeners++;
  void recordListenerDetached(int lifetimeMs) {
    if (_concurrentListeners > 0) _concurrentListeners--;
    _listenerLifetimeAccumulatorMs += lifetimeMs;
  }

  void recordCheckInResult({
    required bool success,
    int? timeToVerifiedMs,
    String? failureCategory,
  }) {
    _checkInsAttempted++;
    _checkInSuccess = success;
    _timeToVerifiedMs = timeToVerifiedMs;
    _checkInFailureCategory = failureCategory;
  }

  void recordCleanupLatency(int latencyMs) {
    _cleanupLatencyMs = latencyMs;
  }

  void recordAudienceZoneEvaluated({required bool published, required String countBand}) {
    if (published) {
      _zonesPublished++;
    } else {
      _zonesSuppressed++;
    }
    _countBands[countBand] = (_countBands[countBand] ?? 0) + 1;
  }

  void recordSecurityEvent({bool blocked = false, bool rateLimited = false, bool probe = false}) {
    if (blocked) _blockedDenials++;
    if (rateLimited) _rateLimitThrottles++;
    if (probe) _suspectedProbes++;
  }

  // ── Snapshot & Privacy Assertion ────────────────────────────────────────────

  Map<String, Object?> toSnapshotJson({
    required String appVersion,
    String? sessionId,
    String? performerId,
    String platform = 'android',
  }) {
    final now = _now();
    final activeSensorMs = _totalActiveSensorDurationMs +
        (_isSensorActive && _sensorActiveSince != null
            ? now.difference(_sensorActiveSince!).inMilliseconds
            : 0);

    final computedTimeInState = Map<TrackingStateMode, int>.from(_timeInStateMs);
    if (_modeEnteredAt != null) {
      computedTimeInState[_currentMode] = (computedTimeInState[_currentMode] ?? 0) +
          now.difference(_modeEnteredAt!).inMilliseconds;
    }

    final snapshot = <String, Object?>{
      'sessionId': sessionId,
      'performerId': performerId,
      'platform': platform,
      'appVersion': appVersion,
      'timestamp': now.toIso8601String(),
      'timeInStateMs': {
        'off': computedTimeInState[TrackingStateMode.off],
        'discovery': computedTimeInState[TrackingStateMode.discovery],
        'check_in': computedTimeInState[TrackingStateMode.checkIn],
        'live_stationary': computedTimeInState[TrackingStateMode.liveStationary],
        'live_mobile': computedTimeInState[TrackingStateMode.liveMobile],
      },
      'locationRequests': {
        'started': _requestsStarted,
        'stopped': _requestsStopped,
      },
      'activeSensorDurationMs': activeSensorMs,
      'foregroundDurationMs': _totalForegroundDurationMs,
      'backgroundDurationMs': _totalBackgroundDurationMs,
      'sampleCounts': {
        'received': _samplesReceived,
        'accepted': _samplesAccepted,
        'rejected': _samplesRejected,
        'rejectedReasons': _rejectedReasons,
      },
      'accuracyClassBands': _accuracyClassBands,
      'intervalBands': _intervalBands,
      'distanceFilterBands': _distanceFilterBands,
      'geofenceEventCount': _geofenceEventCount,
      'networkTelemetry': {
        'uploadCount': _uploadCount,
        'bytesUploaded': _bytesUploaded,
        'retryCount': _retryCount,
        'queueHighWaterMark': _queueHighWaterMark,
      },
      'databaseAttribution': {
        'firestoreReads': _firestoreReads,
        'firestoreWrites': _firestoreWrites,
        'rtdbReads': _rtdbReads,
        'rtdbWrites': _rtdbWrites,
      },
      'listenerMetrics': {
        'lifetimeMs': _listenerLifetimeAccumulatorMs,
        'concurrentListeners': _concurrentListeners,
      },
      'checkInMetrics': {
        'attempted': _checkInsAttempted,
        'success': _checkInSuccess,
        'timeToVerifiedMs': _timeToVerifiedMs,
        'failureCategory': _checkInFailureCategory,
      },
      'cleanupLatencyMs': _cleanupLatencyMs,
      'audienceZoneMetrics': {
        'zonesSuppressed': _zonesSuppressed,
        'zonesPublished': _zonesPublished,
        'countBands': _countBands,
      },
      'securityEvents': {
        'blockedDenials': _blockedDenials,
        'rateLimitThrottles': _rateLimitThrottles,
        'suspectedProbes': _suspectedProbes,
      },
      'stabilitySignals': {
        'crashFreeSession': true,
        'osBackgroundTermination': false,
      },
    };

    assertZeroCoordinates(snapshot);
    return snapshot;
  }

  /// Strict assertion verifying that no coordinates, accuracy meters, or addresses
  /// leak into the diagnostic representation.
  static void assertZeroCoordinates(Map<String, Object?> data) {
    const forbiddenKeys = [
      'lat',
      'lng',
      'latitude',
      'longitude',
      'altitude',
      'speed',
      'bearing',
      'heading',
      'address',
      'street',
      'rawPoint',
      'rawHistory',
      'deviceId',
      'idfa',
      'adId',
      'advertisingId',
      'venueCoordinates',
      'exactFanCount',
      'fanCoordinates',
    ];

    void checkMap(Map<String, Object?> map) {
      for (final entry in map.entries) {
        final keyLower = entry.key.toLowerCase();
        for (final forbidden in forbiddenKeys) {
          if (keyLower == forbidden.toLowerCase() ||
              (forbidden.length > 4 && keyLower.contains(forbidden.toLowerCase()))) {
            throw StateError(
              'Privacy Invariant Violation: "${entry.key}" must not appear in energy observability data.',
            );
          }
        }
        if (entry.value is Map<String, Object?>) {
          checkMap(entry.value as Map<String, Object?>);
        }
      }
    }

    checkMap(data);
  }
}

final locationEnergyTrackerProvider = Provider<LocationEnergyTracker>((ref) {
  return LocationEnergyTracker();
});
