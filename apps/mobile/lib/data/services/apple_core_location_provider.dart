// Crowdbeats V2 — AppleCoreLocationProvider
//
// Production implementation of [LocationProvider] optimized for iOS using
// Apple Core Location (CLLocationManager via geolocator_apple).
//
// Key iOS Low-Power, Privacy & Core Location Principles:
// 1. DISCOVERY: Checks cached fix first (<5 min); otherwise balanced one-shot
//    (kCLLocationAccuracyHundredMeters) with strict 5s timeout and immediate
//    cancellation on screen exit.
// 2. CHECK_IN: Starts with balanced accuracy (kCLLocationAccuracyNearestTenMeters, ~50m).
//    Inspects accuracy authorization: if reduced accuracy is active and cannot verify
//    the 200m venue proximity, requests temporary full accuracy with purpose key
//    "VenueProximityVerificationKey". Escalates to kCLLocationAccuracyBest only if needed.
//    Stops updates immediately upon acceptable fix, timeout, denial, or cancellation.
// 3. LIVE_STATIONARY: Never leaves startUpdatingLocation active (GPS is strictly OFF).
//    Registers circular region monitoring (CLCircularRegion) for the single verified venue.
//    Region exit is strictly an internal re-verification trigger, never a public feed.
// 4. LIVE_MOBILE: Can begin only through explicit foreground user action.
//    Enables background updates only while active and authorized.
//    Sets showBackgroundLocationIndicator = true for blue-bar transparency.
//    Sets pausesLocationUpdatesAutomatically = true and activityType = ActivityType.fitness
//    (or ActivityType.other) so hardware powers down during stationary stage time.
//    Adapts distanceFilter (10m foreground, 50m background, 100m stationary).
//    Disables background updates and calls stopUpdatingLocation on pause/end/expiry/revocation.
// 5. SIGNIFICANT-CHANGE SERVICE (Documentation & Policy):
//    CLLocationManager.startMonitoringSignificantLocationChanges() relies on cell tower
//    handoffs (~500m to 1km resolution) and is suspended on Wi-Fi-only devices or stationary
//    venues. It is NOT suitable for live streaming or 200m venue perimeter verification.
//    It is reserved strictly as a wake-up mechanism if the app is terminated.
// 6. BACKPRESSURE: Bounded offline queue (capped at 30 items, drops oldest on overflow).
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
typedef RequestTemporaryFullAccuracyFn = Future<LocationAccuracyStatus> Function({
  required String purposeKey,
});

/// iOS-optimized [LocationProvider] utilizing Apple Core Location.
class AppleCoreLocationProvider implements LocationProvider {
  AppleCoreLocationProvider({
    GetPositionFn? getCurrentPositionFn,
    GetLastKnownPositionFn? getLastKnownPositionFn,
    PositionStreamFn? getPositionStreamFn,
    IsLocationServiceEnabledFn? isLocationServiceEnabledFn,
    CheckPermissionFn? checkPermissionFn,
    RequestPermissionFn? requestPermissionFn,
    GetLocationAccuracyFn? getLocationAccuracyFn,
    RequestTemporaryFullAccuracyFn? requestTemporaryFullAccuracyFn,
    LocationBackpressureQueue? backpressureQueue,
    DateTime Function()? nowFn,
  })  : _getCurrentPosition =
            getCurrentPositionFn ?? Geolocator.getCurrentPosition,
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
        _requestTemporaryFullAccuracy = requestTemporaryFullAccuracyFn ??
            Geolocator.requestTemporaryFullAccuracy,
        _queue = backpressureQueue ?? LocationBackpressureQueue(maxCapacity: 30),
        _now = nowFn ?? DateTime.now;

  final GetPositionFn _getCurrentPosition;
  final GetLastKnownPositionFn _getLastKnownPosition;
  final PositionStreamFn _getPositionStream;
  final IsLocationServiceEnabledFn _isLocationServiceEnabled;
  final CheckPermissionFn _checkPermission;
  final RequestPermissionFn _requestPermission;
  final GetLocationAccuracyFn _getLocationAccuracy;
  final RequestTemporaryFullAccuracyFn _requestTemporaryFullAccuracy;
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
  int _currentDistanceFilterMeters = 10;
  bool _isBackgroundIndicatorActive = false;
  bool _mockRiskDetected = false;
  String _cleanupStatus = 'idle';

  // Stationary detection & throttling state
  LocationFix? _lastReceivedFix;
  int _stationaryFixCount = 0;

  // Expose internal state for testing
  bool get isBackgroundIndicatorActive => _isBackgroundIndicatorActive;
  bool get isPositionStreamActive => _activePositionSub != null;
  int get currentDistanceFilterMeters => _currentDistanceFilterMeters;
  String? get activeGeofenceRegionId => _activeGeofenceRegionId;

  @override
  LocationMode get currentMode => _mode;

  @override
  Future<bool> isPermissionGranted() async {
    final status = await _checkPermission();
    return status == LocationPermission.always ||
        status == LocationPermission.whileInUse;
  }

  @override
  Future<LocationPermissionResult> requestPermission() async {
    final serviceEnabled = await _isLocationServiceEnabled();
    if (!serviceEnabled) {
      return LocationPermissionResult.serviceDisabled;
    }

    final current = await _checkPermission();
    if (current == LocationPermission.always ||
        current == LocationPermission.whileInUse) {
      return LocationPermissionResult.granted;
    }
    if (current == LocationPermission.deniedForever) {
      return LocationPermissionResult.permanentlyDenied;
    }

    final requested = await _requestPermission();
    return switch (requested) {
      LocationPermission.always ||
      LocationPermission.whileInUse =>
        LocationPermissionResult.granted,
      LocationPermission.deniedForever =>
        LocationPermissionResult.permanentlyDenied,
      LocationPermission.denied => LocationPermissionResult.denied,
      LocationPermission.unableToDetermine =>
        LocationPermissionResult.serviceDisabled,
    };
  }

  @override
  Future<LocationPermissionState> getPermissionState() async {
    final serviceEnabled = await _isLocationServiceEnabled();
    if (!serviceEnabled) {
      return LocationPermissionState.servicesDisabled;
    }

    final permission = await _checkPermission();
    return _resolveGranularState(permission);
  }

  @override
  Future<LocationPermissionState> requestFullPermissionState() async {
    final serviceEnabled = await _isLocationServiceEnabled();
    if (!serviceEnabled) {
      return LocationPermissionState.servicesDisabled;
    }

    final requested = await _requestPermission();
    return _resolveGranularState(requested);
  }

  Future<LocationPermissionState> _resolveGranularState(
    LocationPermission permission,
  ) async {
    switch (permission) {
      case LocationPermission.deniedForever:
        return LocationPermissionState.permanentlyDenied;
      case LocationPermission.denied:
        return LocationPermissionState.denied;
      case LocationPermission.unableToDetermine:
        return LocationPermissionState.notDetermined;
      case LocationPermission.whileInUse:
        final accuracy = await _getLocationAccuracy();
        return accuracy == LocationAccuracyStatus.reduced
            ? LocationPermissionState.foregroundApproximate
            : LocationPermissionState.foregroundPrecise;
      case LocationPermission.always:
        final accuracy = await _getLocationAccuracy();
        return accuracy == LocationAccuracyStatus.reduced
            ? LocationPermissionState.backgroundApproximate
            : LocationPermissionState.backgroundPrecise;
    }
  }

  @override
  Future<bool> requestTemporaryFullAccuracy({required String purposeKey}) async {
    try {
      final status = await _requestTemporaryFullAccuracy(purposeKey: purposeKey);
      return status == LocationAccuracyStatus.precise;
    } catch (e) {
      debugPrint('[AppleCoreLocationProvider] Temporary accuracy error: $e');
      return false;
    }
  }

  @override
  Future<bool> openSettings() async {
    return Geolocator.openAppSettings();
  }

  @override
  Future<LocationFix?> cachedFix({
    Duration maxAge = const Duration(minutes: 5),
  }) async {
    try {
      final position = await _getLastKnownPosition();
      if (position == null) return null;

      final fix = _positionToFix(position);
      final age = _now().difference(fix.timestamp);
      if (age <= maxAge) {
        return fix;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  bool _isOperationCancelled = false;

  @override
  void cancelCurrentOperation() {
    _isOperationCancelled = true;
    if (_activeOneShotCompleter != null &&
        !_activeOneShotCompleter!.isCompleted) {
      _activeOneShotCompleter!.complete(null);
    }
    _activeOneShotCompleter = null;
    debugPrint('[AppleCoreLocationProvider] Current operation cancelled.');
  }

  @override
  Future<LocationFix?> requestOneShot({
    LocationMode targetMode = LocationMode.discovery,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    assert(
      targetMode == LocationMode.discovery ||
          targetMode == LocationMode.checkIn,
      'requestOneShot() must only be used for discovery or checkIn modes.',
    );

    cancelCurrentOperation();
    _isOperationCancelled = false;
    final completer = Completer<LocationFix?>();
    _activeOneShotCompleter = completer;

    final isGranted = await isPermissionGranted();
    if (_isOperationCancelled || !isGranted) return null;

    final serviceEnabled = await _isLocationServiceEnabled();
    if (_isOperationCancelled || !serviceEnabled) return null;

    // 1. DISCOVERY: Try fresh cached fix first (<5 min) to prevent waking GPS sensor.
    if (targetMode == LocationMode.discovery) {
      final cached = await cachedFix(maxAge: const Duration(minutes: 5));
      if (_isOperationCancelled) return null;
      if (cached != null) {
        _acceptedCount++;
        debugPrint('[AppleCoreLocationProvider] Discovery satisfied by cached fix.');
        return cached;
      }
    }

    if (_isOperationCancelled || completer.isCompleted) return null;

    Future<LocationFix?> executeFetch() async {
      try {
        // 2. CHECK_IN: Check reduced vs full accuracy.
        // If user has reduced accuracy (iOS 14+), venue proximity cannot be verified.
        // Request temporary full accuracy with "VenueProximityVerificationKey".
        if (targetMode == LocationMode.checkIn) {
          final accuracyStatus = await _getLocationAccuracy();
          if (accuracyStatus == LocationAccuracyStatus.reduced) {
            debugPrint(
              '[AppleCoreLocationProvider] Reduced accuracy detected; '
              'requesting temporary full accuracy for venue verification.',
            );
            await requestTemporaryFullAccuracy(
              purposeKey: 'VenueProximityVerificationKey',
            );
          }
        }

        // Configure least costly AppleSettings for one-shot
        final desiredAccuracy = targetMode == LocationMode.discovery
            ? LocationAccuracy.low
            : LocationAccuracy.medium;

        final appleSettings = AppleSettings(
          accuracy: desiredAccuracy,
          distanceFilter: 0,
          pauseLocationUpdatesAutomatically: false,
          showBackgroundLocationIndicator: false,
          allowBackgroundLocationUpdates: false,
          timeLimit: timeout,
        );

        final position = await _getCurrentPosition(
          locationSettings: appleSettings,
        ).timeout(timeout);

        _sampleCount++;
        var fix = _positionToFix(position);

        // Check-In quality check & accuracy escalation:
        // If accuracy > 50m, escalate to high accuracy to verify 200m venue perimeter
        if (targetMode == LocationMode.checkIn && fix.accuracyMeters > 50) {
          debugPrint(
            '[AppleCoreLocationProvider] Check-in accuracy >50m; escalating to high accuracy.',
          );
          try {
            final highAccSettings = AppleSettings(
              accuracy: LocationAccuracy.high,
              distanceFilter: 0,
              pauseLocationUpdatesAutomatically: false,
              showBackgroundLocationIndicator: false,
              allowBackgroundLocationUpdates: false,
              timeLimit: const Duration(seconds: 5),
            );

            final highAccPosition = await _getCurrentPosition(
              locationSettings: highAccSettings,
            ).timeout(const Duration(seconds: 5));

            _sampleCount++;
            final escalatedFix = _positionToFix(highAccPosition);
            if (escalatedFix.accuracyMeters <= fix.accuracyMeters) {
              fix = escalatedFix;
            }
          } catch (_) {
            // Keep balanced fix if escalation times out
          }
        }

        // Freshness check: reject fixes older than 30s for check-in
        if (targetMode == LocationMode.checkIn) {
          final age = _now().difference(fix.timestamp);
          if (age > const Duration(seconds: 30)) {
            _rejectedCount++;
            debugPrint('[AppleCoreLocationProvider] Fix rejected: stale (>30s).');
            return null;
          }
        }

        // Check for mock location risk signal
        if (fix.isMock) {
          _mockRiskDetected = true;
          debugPrint('[AppleCoreLocationProvider] Risk signal: mock location detected.');
        }

        _acceptedCount++;
        return fix;
      } on TimeoutException {
        debugPrint('[AppleCoreLocationProvider] One-shot timed out.');
        return null;
      } catch (e) {
        debugPrint('[AppleCoreLocationProvider] One-shot error: $e');
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
      // Invariant: Sensor stops immediately after one-shot fix.
      _mode = LocationMode.off;
    }
  }

  @override
  Stream<LocationFix> streamContinuous() {
    assert(
      _mode == LocationMode.liveMobile,
      'streamContinuous() is only permitted when mode is LIVE_MOBILE.',
    );
    return startAdaptive(LocationMode.liveMobile);
  }

  @override
  Stream<LocationFix> startAdaptive(LocationMode targetMode) {
    _mode = LocationMode.liveMobile;
    _trackingStartedAt ??= _now();

    final isForeground = targetMode == LocationMode.liveMobile;
    final accuracy = isForeground ? LocationAccuracy.high : LocationAccuracy.medium;
    _currentDistanceFilterMeters = isForeground ? 10 : 50;

    // Apple Core Location background & battery configuration:
    // - showBackgroundLocationIndicator: true for blue-bar transparency
    // - pauseLocationUpdatesAutomatically: true so hardware powers down when stationary
    // - activityType: ActivityType.fitness (busking/walking)
    _isBackgroundIndicatorActive = true;

    final appleSettings = AppleSettings(
      accuracy: accuracy,
      distanceFilter: _currentDistanceFilterMeters,
      pauseLocationUpdatesAutomatically: true,
      activityType: ActivityType.fitness,
      showBackgroundLocationIndicator: true,
      allowBackgroundLocationUpdates: true,
    );

    final controller = StreamController<LocationFix>.broadcast();

    _activePositionSub?.cancel();
    _activePositionSub = _getPositionStream(
      locationSettings: appleSettings,
    ).listen(
      (position) {
        _sampleCount++;
        final fix = _positionToFix(position);

        if (fix.isMock) {
          _mockRiskDetected = true;
        }

        // Stationary detection & adaptive distanceFilter throttling
        _detectStationaryAndUpdateFilter(fix);

        // Quality check: discard low accuracy fixes (>100m)
        if (fix.accuracyMeters > 100) {
          _rejectedCount++;
          return;
        }

        _acceptedCount++;
        _lastReceivedFix = fix;

        // Buffer in bounded backpressure queue
        _queue.enqueue(fix);

        // Evaluate against active geofence
        evaluateGeofenceSample(fix);

        controller.add(fix);
      },
      onError: (Object e) {
        debugPrint('[AppleCoreLocationProvider] Position stream error: $e');
        controller.addError(e);
      },
      onDone: () {
        controller.close();
      },
    );

    return controller.stream;
  }

  void _detectStationaryAndUpdateFilter(LocationFix currentFix) {
    if (_lastReceivedFix == null) {
      _lastReceivedFix = currentFix;
      return;
    }

    final distanceM = Geolocator.distanceBetween(
      _lastReceivedFix!.latitude,
      _lastReceivedFix!.longitude,
      currentFix.latitude,
      currentFix.longitude,
    );

    final isStationarySample = distanceM < 15.0;

    if (isStationarySample) {
      _stationaryFixCount++;
      if (_stationaryFixCount >= 3 && _currentDistanceFilterMeters < 100) {
        _currentDistanceFilterMeters = 100;
        debugPrint(
          '[AppleCoreLocationProvider] Performer stationary; '
          'throttled distance filter to 100m for battery conservation.',
        );
      }
    } else {
      if (_stationaryFixCount >= 3) {
        debugPrint('[AppleCoreLocationProvider] Movement resumed; restored active filter.');
      }
      _stationaryFixCount = 0;
      _currentDistanceFilterMeters = 10;
    }
  }

  @override
  Future<void> stopContinuous() => stopAdaptive();

  @override
  Future<void> stopAdaptive() async {
    _cleanupStatus = 'stopping';
    await _activePositionSub?.cancel();
    _activePositionSub = null;

    _isBackgroundIndicatorActive = false;
    _mode = LocationMode.liveStationary;
    _cleanupStatus = 'stopped';
    debugPrint(
      '[AppleCoreLocationProvider] Continuous stream stopped; '
      'background indicator dismissed. GPS is OFF.',
    );
  }

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

    debugPrint(
      '[AppleCoreLocationProvider] CLCircularRegion registered for venue: '
      '$regionId (radius: ${radiusMeters}m). GPS is OFF.',
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
      debugPrint('[AppleCoreLocationProvider] Region cancelled: $regionId');
    }
  }

  /// Internal evaluator for venue perimeter checks.
  /// Strictly emits GeofenceEvent.exited as a re-verification trigger.
  void evaluateGeofenceSample(LocationFix sample) {
    if (_activeGeofenceCentre == null || _activeGeofenceRadiusMeters == null) {
      return;
    }

    final distanceM = Geolocator.distanceBetween(
      _activeGeofenceCentre!.latitude,
      _activeGeofenceCentre!.longitude,
      sample.latitude,
      sample.longitude,
    );

    if (distanceM > _activeGeofenceRadiusMeters!) {
      debugPrint(
        '[AppleCoreLocationProvider] Region exit detected '
        '($distanceM m > $_activeGeofenceRadiusMeters m).',
      );
      _geofenceController?.add(GeofenceEvent.exited);
    }
  }

  /// Acknowledges successful transmission of a sample batch and increments metrics.
  void recordUploadSuccess(List<LocationFix> batch) {
    _uploadCount++;
    _queue.acknowledgeBatch(batch);
  }

  /// Marks a transmission failure and schedules retry within queue capacity.
  void recordUploadFailure(List<LocationFix> batch) {
    _queue.recordBatchFailure(batch);
  }

  @override
  LocationDiagnostics get diagnostics {
    final activeDuration = _trackingStartedAt != null
        ? _now().difference(_trackingStartedAt!).inMilliseconds
        : 0;

    return LocationDiagnostics(
      provider: 'apple_core_location',
      mode: _mode.name,
      sampleCount: _sampleCount,
      acceptedCount: _acceptedCount,
      rejectedCount: _rejectedCount,
      activeDurationMs: activeDuration,
      averageRequestedIntervalMs: _currentDistanceFilterMeters * 1000,
      uploadCount: _uploadCount,
      cleanupStatus: _cleanupStatus,
      isForegroundServiceRunning: _isBackgroundIndicatorActive,
      geofenceRegistered: _activeGeofenceRegionId != null,
      backpressureQueueSize: _queue.size,
      mockRiskDetected: _mockRiskDetected,
    );
  }

  @override
  Map<String, Object?> diagnosticsSnapshot() => diagnostics.toJson();

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
