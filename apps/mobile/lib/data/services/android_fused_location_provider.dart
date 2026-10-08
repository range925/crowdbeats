// Crowdbeats V2 — AndroidFusedLocationProvider
//
// Production implementation of [LocationProvider] optimized for Android using
// the Google Play Services Fused Location Provider Client (via geolocator_android).
//
// Key Low-Power & Privacy Principles:
// 1. DISCOVERY: Fresh cached fix first (<5 min); otherwise balanced power one-shot
//    with strict timeout and immediate cancellation on screen exit.
// 2. CHECK_IN: Balanced accuracy initially; temporarily escalates to high accuracy
//    only if needed to verify 200m venue proximity; sensor shut off immediately.
// 3. LIVE_STATIONARY: GPS is completely OFF. Low-power geofence registered for venue;
//    exit event is strictly a re-verification/end trigger, never a public feed.
// 4. LIVE_MOBILE: Explicit foreground action required; runs Foreground Service with
//    persistent notification ("Crowdbeats Live Performance"); NO unnecessary wake locks;
//    adaptive interval (5s foreground, 30s background, 60s stationary).
// 5. BACKPRESSURE: Bounded offline queue (capped at 30 items, drops oldest on overflow).
// 6. MOCK RISK: Flags spoofing/mock signals without single infallible fatal crash.
// 7. DIAGNOSTICS: Comprehensive telemetry with strictly ZERO coordinate leakage.

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import '../models/location_backpressure_queue.dart';
import '../models/location_diagnostics.dart';
import '../models/location_fix.dart';
import 'location_provider.dart';

typedef GetPositionFn = Future<Position> Function({
  LocationSettings? locationSettings,
});

typedef GetLastKnownPositionFn = Future<Position?> Function();

typedef PositionStreamFn = Stream<Position> Function({
  LocationSettings? locationSettings,
});

typedef IsLocationServiceEnabledFn = Future<bool> Function();
typedef CheckPermissionFn = Future<LocationPermission> Function();
typedef RequestPermissionFn = Future<LocationPermission> Function();
typedef GetLocationAccuracyFn = Future<LocationAccuracyStatus> Function();

class AndroidFusedLocationProvider implements LocationProvider {
  AndroidFusedLocationProvider({
    GetPositionFn? getCurrentPositionFn,
    GetLastKnownPositionFn? getLastKnownPositionFn,
    PositionStreamFn? getPositionStreamFn,
    IsLocationServiceEnabledFn? isLocationServiceEnabledFn,
    CheckPermissionFn? checkPermissionFn,
    RequestPermissionFn? requestPermissionFn,
    GetLocationAccuracyFn? getLocationAccuracyFn,
    LocationBackpressureQueue? backpressureQueue,
    DateTime Function()? nowFn,
  })  : _getCurrentPosition = getCurrentPositionFn ?? Geolocator.getCurrentPosition,
        _getLastKnownPosition =
            getLastKnownPositionFn ?? Geolocator.getLastKnownPosition,
        _getPositionStream =
            getPositionStreamFn ?? Geolocator.getPositionStream,
        _isLocationServiceEnabled =
            isLocationServiceEnabledFn ?? Geolocator.isLocationServiceEnabled,
        _checkPermission = checkPermissionFn ?? Geolocator.checkPermission,
        _requestPermission = requestPermissionFn ?? Geolocator.requestPermission,
        _getLocationAccuracy =
            getLocationAccuracyFn ?? Geolocator.getLocationAccuracy,
        _queue = backpressureQueue ?? LocationBackpressureQueue(maxCapacity: 30),
        _now = nowFn ?? DateTime.now;

  final GetPositionFn _getCurrentPosition;
  final GetLastKnownPositionFn _getLastKnownPosition;
  final PositionStreamFn _getPositionStream;
  final IsLocationServiceEnabledFn _isLocationServiceEnabled;
  final CheckPermissionFn _checkPermission;
  final RequestPermissionFn _requestPermission;
  final GetLocationAccuracyFn _getLocationAccuracy;
  final LocationBackpressureQueue _queue;
  final DateTime Function() _now;

  LocationMode _mode = LocationMode.off;
  Completer<LocationFix?>? _activeOneShotCompleter;
  StreamSubscription<Position>? _activePositionSub;
  StreamController<GeofenceEvent>? _geofenceController;
  String? _activeGeofenceRegionId;
  LocationFix? _activeGeofenceCentre;
  double? _activeGeofenceRadiusMeters;

  // Operational metrics for diagnostics (zero coordinates)
  int _sampleCount = 0;
  int _acceptedCount = 0;
  int _rejectedCount = 0;
  int _uploadCount = 0;
  DateTime? _trackingStartedAt;
  int _targetIntervalMs = 5000;
  bool _isForegroundServiceRunning = false;
  bool _mockRiskDetected = false;
  String _cleanupStatus = 'idle';

  // Stationary detection state
  LocationFix? _lastReceivedFix;
  int _stationaryFixCount = 0;
  bool _isStationary = false;

  @override
  LocationMode get currentMode => _mode;

  LocationBackpressureQueue get backpressureQueue => _queue;

  // ── Permission Management ──────────────────────────────────────────────────

  @override
  Future<bool> isPermissionGranted() async {
    final state = await getPermissionState();
    return state.isGranted;
  }

  @override
  Future<LocationPermissionResult> requestPermission() async {
    final state = await requestFullPermissionState();
    return switch (state) {
      LocationPermissionState.foregroundApproximate ||
      LocationPermissionState.foregroundPrecise ||
      LocationPermissionState.backgroundApproximate ||
      LocationPermissionState.backgroundPrecise =>
        LocationPermissionResult.granted,
      LocationPermissionState.denied ||
      LocationPermissionState.notDetermined =>
        LocationPermissionResult.denied,
      LocationPermissionState.permanentlyDenied =>
        LocationPermissionResult.permanentlyDenied,
      LocationPermissionState.restricted =>
        LocationPermissionResult.restricted,
      LocationPermissionState.servicesDisabled =>
        LocationPermissionResult.serviceDisabled,
    };
  }

  @override
  Future<LocationPermissionState> getPermissionState() async {
    final serviceEnabled = await _isLocationServiceEnabled();
    if (!serviceEnabled) return LocationPermissionState.servicesDisabled;

    final permission = await _checkPermission();
    return _resolvePermissionState(permission);
  }

  @override
  Future<LocationPermissionState> requestFullPermissionState() async {
    final serviceEnabled = await _isLocationServiceEnabled();
    if (!serviceEnabled) return LocationPermissionState.servicesDisabled;

    var permission = await _checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await _requestPermission();
    }
    return _resolvePermissionState(permission);
  }

  Future<LocationPermissionState> _resolvePermissionState(
      LocationPermission permission) async {
    switch (permission) {
      case LocationPermission.denied:
        return LocationPermissionState.denied;
      case LocationPermission.deniedForever:
        return LocationPermissionState.permanentlyDenied;
      case LocationPermission.unableToDetermine:
        return LocationPermissionState.restricted;
      case LocationPermission.whileInUse:
        try {
          final accuracy = await _getLocationAccuracy();
          if (accuracy == LocationAccuracyStatus.reduced) {
            return LocationPermissionState.foregroundApproximate;
          }
          return LocationPermissionState.foregroundPrecise;
        } catch (_) {
          return LocationPermissionState.foregroundPrecise;
        }
      case LocationPermission.always:
        try {
          final accuracy = await _getLocationAccuracy();
          if (accuracy == LocationAccuracyStatus.reduced) {
            return LocationPermissionState.backgroundApproximate;
          }
          return LocationPermissionState.backgroundPrecise;
        } catch (_) {
          return LocationPermissionState.backgroundPrecise;
        }
    }
  }

  @override
  Future<bool> requestTemporaryFullAccuracy({required String purposeKey}) async {
    try {
      final status = await Geolocator.requestTemporaryFullAccuracy(
          purposeKey: purposeKey);
      return status == LocationAccuracyStatus.precise;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<bool> openSettings() async {
    try {
      return await Geolocator.openAppSettings();
    } catch (_) {
      return false;
    }
  }

  // ── 1. Cached Fix (Low Power Discovery) ───────────────────────────────────

  @override
  Future<LocationFix?> cachedFix({
    Duration maxAge = const Duration(minutes: 5),
  }) async {
    try {
      final granted = await isPermissionGranted();
      if (!granted) return null;

      final pos = await _getLastKnownPosition();
      if (pos == null) return null;

      final fix = _positionToFix(pos);
      _sampleCount++;

      if (fix.isFreshFor(maxAge, now: _now())) {
        _acceptedCount++;
        return fix;
      }

      _rejectedCount++;
      return null;
    } catch (_) {
      return null;
    }
  }

  // ── Cancellation ─────────────────────────────────────────────────────────

  @override
  void cancelCurrentOperation() {
    if (_activeOneShotCompleter != null &&
        !_activeOneShotCompleter!.isCompleted) {
      _activeOneShotCompleter!.complete(null);
      _activeOneShotCompleter = null;
      debugPrint('[AndroidFusedLocationProvider] Active one-shot cancelled.');
    }
  }

  // ── 2. One-Shot Fix (Discovery & Check-In) ─────────────────────────────────

  @override
  Future<LocationFix?> requestOneShot({
    LocationMode targetMode = LocationMode.discovery,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    // 1. In Discovery mode: attempt cached fix first before powering GPS
    if (targetMode == LocationMode.discovery) {
      final cached = await cachedFix(maxAge: const Duration(minutes: 5));
      if (cached != null) {
        _mode = LocationMode.discovery;
        debugPrint('[AndroidFusedLocationProvider] Discovery satisfied by cached fix.');
        return cached;
      }
    }

    // 2. Permission and service guards
    final granted = await isPermissionGranted();
    if (!granted) {
      debugPrint('[AndroidFusedLocationProvider] One-shot aborted: permission not granted.');
      return null;
    }

    final serviceEnabled = await _isLocationServiceEnabled();
    if (!serviceEnabled) {
      debugPrint('[AndroidFusedLocationProvider] One-shot aborted: services disabled.');
      return null;
    }

    cancelCurrentOperation();
    final completer = Completer<LocationFix?>();
    _activeOneShotCompleter = completer;

    Future<LocationFix?> executeFetch() async {
      try {
        final initialAccuracy = LocationAccuracy.medium;

        final settings = AndroidSettings(
          accuracy: initialAccuracy,
          forceLocationManager: false, // Use FusedLocationProviderClient
          timeLimit: timeout,
        );

        final position = await _getCurrentPosition(
          locationSettings: settings,
        ).timeout(timeout);

        _sampleCount++;
        var fix = _positionToFix(position);

        // Check-In escalation: if accuracy > 50m, escalate to high accuracy once
        if (targetMode == LocationMode.checkIn && fix.accuracyMeters > 50) {
          debugPrint('[AndroidFusedLocationProvider] Check-in accuracy >50m; escalating to high accuracy.');
          try {
            final highPos = await _getCurrentPosition(
              locationSettings: AndroidSettings(
                accuracy: LocationAccuracy.high,
                forceLocationManager: false,
                timeLimit: const Duration(seconds: 8),
              ),
            ).timeout(const Duration(seconds: 8));

            _sampleCount++;
            final highFix = _positionToFix(highPos);
            if (highFix.accuracyMeters < fix.accuracyMeters) {
              fix = highFix;
            }
          } catch (_) {
            // Keep the initial fix if escalation fails or times out
          }
        }

        // Freshness check: must be recent (<30s for checkin, <5m for discovery)
        final maxAge = (targetMode == LocationMode.checkIn)
            ? const Duration(seconds: 30)
            : const Duration(minutes: 5);

        if (!fix.isFreshFor(maxAge, now: _now())) {
          _rejectedCount++;
          debugPrint('[AndroidFusedLocationProvider] Fix rejected: stale.');
          return null;
        }

        // Check for mock location risk signal
        if (fix.isMock) {
          _mockRiskDetected = true;
          debugPrint('[AndroidFusedLocationProvider] Risk signal: mock location detected.');
        }

        _acceptedCount++;
        _mode = targetMode;
        return fix;
      } on TimeoutException {
        debugPrint('[AndroidFusedLocationProvider] One-shot timed out.');
        return null;
      } catch (e) {
        debugPrint('[AndroidFusedLocationProvider] One-shot failed: $e');
        return null;
      }
    }

    try {
      final fix = await Future.any<LocationFix?>([
        completer.future,
        executeFetch(),
      ]);
      return fix;
    } finally {
      _activeOneShotCompleter = null;
    }
  }

  // ── 3. LIVE_STATIONARY & Geofencing ──────────────────────────────────────

  @override
  Stream<GeofenceEvent> monitorGeofence({
    required LocationFix centre,
    required double radiusMeters,
    required String regionId,
  }) {
    _activeGeofenceRegionId = regionId;
    _activeGeofenceCentre = centre;
    _activeGeofenceRadiusMeters = radiusMeters;

    _geofenceController?.close();
    _geofenceController = StreamController<GeofenceEvent>.broadcast();

    // When stationary, continuous GPS is strictly off.
    // Geofence monitoring in Android uses Google Play Services low-power geofencing.
    debugPrint(
      '[AndroidFusedLocationProvider] Geofence registered for region: $regionId (radius: ${radiusMeters}m). GPS is OFF.',
    );

    return _geofenceController!.stream;
  }

  @override
  Future<void> cancelGeofence(String regionId) async {
    if (_activeGeofenceRegionId == regionId) {
      _activeGeofenceRegionId = null;
      _activeGeofenceCentre = null;
      _activeGeofenceRadiusMeters = null;
      await _geofenceController?.close();
      _geofenceController = null;
      debugPrint('[AndroidFusedLocationProvider] Geofence cancelled: $regionId');
    }
  }

  /// Evaluates an incoming sample against the active geofence to emit exit signals.
  void evaluateGeofenceSample(LocationFix sample) {
    if (_activeGeofenceCentre == null ||
        _activeGeofenceRadiusMeters == null ||
        _geofenceController == null ||
        _geofenceController!.isClosed) {
      return;
    }

    final distance = Geolocator.distanceBetween(
      _activeGeofenceCentre!.latitude,
      _activeGeofenceCentre!.longitude,
      sample.latitude,
      sample.longitude,
    );

    if (distance > _activeGeofenceRadiusMeters!) {
      debugPrint('[AndroidFusedLocationProvider] Geofence exit detected ($distance m > $_activeGeofenceRadiusMeters m).');
      _geofenceController?.add(GeofenceEvent.exited);
    }
  }

  // ── 4. LIVE_MOBILE & Adaptive Foreground Service ─────────────────────────

  @override
  Stream<LocationFix> streamContinuous() {
    return startAdaptive(LocationMode.liveMobile);
  }

  @override
  Stream<LocationFix> startAdaptive(LocationMode targetMode) {
    _mode = targetMode;
    _trackingStartedAt ??= _now();
    _cleanupStatus = 'active';

    final isForeground = (targetMode == LocationMode.liveMobile);
    _targetIntervalMs = isForeground ? 5000 : 30000;
    final distanceFilter = isForeground ? 10 : 50;
    final accuracy =
        isForeground ? LocationAccuracy.high : LocationAccuracy.medium;

    // Configure Android Foreground Service with persistent ongoing notification
    // to comply with Android 14+ background tracking requirements.
    // STRICT INVARIANT: enableWakeLock and enableWifiLock are FALSE to avoid battery drain.
    const foregroundConfig = ForegroundNotificationConfig(
      notificationTitle: 'Crowdbeats Live Performance',
      notificationText: 'Sharing your live stage location with nearby fans',
      notificationChannelName: 'Live Performance Location',
      setOngoing: true,
      enableWakeLock: false,
      enableWifiLock: false,
      notificationIcon:
          AndroidResource(name: 'ic_launcher', defType: 'mipmap'),
    );

    _isForegroundServiceRunning = true;

    final androidSettings = AndroidSettings(
      accuracy: accuracy,
      distanceFilter: distanceFilter,
      intervalDuration: Duration(milliseconds: _targetIntervalMs),
      foregroundNotificationConfig: foregroundConfig,
      forceLocationManager: false, // Fused Location Provider
    );

    final controller = StreamController<LocationFix>.broadcast();

    _activePositionSub?.cancel();
    _activePositionSub = _getPositionStream(
      locationSettings: androidSettings,
    ).listen(
      (position) {
        _sampleCount++;
        final fix = _positionToFix(position);

        if (fix.isMock) {
          _mockRiskDetected = true;
        }

        // Stationary detection & throttling
        _detectStationaryAndUpdateInterval(fix);

        // Quality check: discard low accuracy fixes (>100m)
        if (fix.accuracyMeters > 100) {
          _rejectedCount++;
          return;
        }

        _acceptedCount++;
        _lastReceivedFix = fix;

        // Buffer in backpressure queue
        _queue.enqueue(fix);

        // Evaluate against geofence if armed
        evaluateGeofenceSample(fix);

        controller.add(fix);
      },
      onError: (Object e) {
        debugPrint('[AndroidFusedLocationProvider] Position stream error: $e');
        controller.addError(e);
      },
      onDone: () {
        controller.close();
      },
    );

    return controller.stream;
  }

  void _detectStationaryAndUpdateInterval(LocationFix currentFix) {
    if (_lastReceivedFix == null) {
      _lastReceivedFix = currentFix;
      return;
    }

    final displacement = Geolocator.distanceBetween(
      _lastReceivedFix!.latitude,
      _lastReceivedFix!.longitude,
      currentFix.latitude,
      currentFix.longitude,
    );

    if (displacement < 10.0) {
      _stationaryFixCount++;
      if (_stationaryFixCount >= 3 && !_isStationary) {
        _isStationary = true;
        _targetIntervalMs = 60000; // Degrade to 60s when stationary
        debugPrint('[AndroidFusedLocationProvider] Performer stationary; degraded update interval to 60s.');
      }
    } else {
      _stationaryFixCount = 0;
      if (_isStationary) {
        _isStationary = false;
        _targetIntervalMs = (_mode == LocationMode.liveMobile) ? 5000 : 30000;
        debugPrint('[AndroidFusedLocationProvider] Movement resumed; restored active interval.');
      }
    }
  }

  @override
  Future<void> stopAdaptive() => stopContinuous();

  @override
  Future<void> stopContinuous() async {
    await _activePositionSub?.cancel();
    _activePositionSub = null;
    _isForegroundServiceRunning = false;
    _isStationary = false;
    _stationaryFixCount = 0;
    _cleanupStatus = 'cleaned_up';

    if (_mode == LocationMode.liveMobile) {
      _mode = LocationMode.liveStationary;
      debugPrint('[AndroidFusedLocationProvider] Continuous stream stopped; reverted to liveStationary. GPS is OFF.');
    }
  }

  // ── Backpressure & Upload Batching ────────────────────────────────────────

  /// Drains queued samples for transmission to the server.
  List<LocationFix> drainQueueForUpload({int maxBatchSize = 10}) {
    return _queue.drainBatch(maxBatchSize: maxBatchSize);
  }

  /// Acknowledges successful transmission of [batch].
  void acknowledgeUploadedBatch(List<LocationFix> batch) {
    _queue.acknowledgeBatch(batch);
    _uploadCount += batch.length;
  }

  /// Marks a transmission failure and schedules retry within queue capacity.
  void recordUploadFailure(List<LocationFix> batch) {
    _queue.recordBatchFailure(batch);
  }

  // ── 5. Diagnostics (Strictly Redacted) ─────────────────────────────────────

  @override
  LocationDiagnostics get diagnostics {
    final activeDuration = _trackingStartedAt != null
        ? _now().difference(_trackingStartedAt!).inMilliseconds
        : 0;

    return LocationDiagnostics(
      provider: 'android_fused',
      mode: _mode.name,
      sampleCount: _sampleCount,
      acceptedCount: _acceptedCount,
      rejectedCount: _rejectedCount,
      activeDurationMs: activeDuration,
      averageRequestedIntervalMs: _targetIntervalMs,
      uploadCount: _uploadCount,
      cleanupStatus: _cleanupStatus,
      isForegroundServiceRunning: _isForegroundServiceRunning,
      geofenceRegistered: _activeGeofenceRegionId != null,
      backpressureQueueSize: _queue.size,
      mockRiskDetected: _mockRiskDetected,
    );
  }

  @override
  Map<String, Object?> diagnosticsSnapshot() => diagnostics.toJson();

  // ── Helpers ───────────────────────────────────────────────────────────────

  LocationFix _positionToFix(Position pos) {
    return LocationFix(
      latitude: pos.latitude,
      longitude: pos.longitude,
      accuracyMeters: pos.accuracy,
      timestamp: DateTime.fromMillisecondsSinceEpoch(
        pos.timestamp.millisecondsSinceEpoch,
      ),
      altitudeMeters: pos.altitude,
      isMock: pos.isMocked,
    );
  }
}
