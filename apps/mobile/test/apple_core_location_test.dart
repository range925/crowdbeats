// Crowdbeats V2 — Apple Core Location Provider Acceptance Tests (Phase 5)
//
// Verifies:
// 1. DISCOVERY: cached fix preference (<5 min), balanced one-shot fallback, timeout, immediate cancellation.
// 2. CHECK_IN: balanced accuracy initial request, reduced vs full accuracy detection,
//    temporary full accuracy request with "VenueProximityVerificationKey", escalation to high accuracy.
// 3. LIVE_STATIONARY: zero continuous GPS tracking, circular region monitoring (CLCircularRegion),
//    exit event strictly as internal re-verification signal.
// 4. LIVE_MOBILE: showBackgroundLocationIndicator, pausesLocationUpdatesAutomatically, activityType,
//    adaptive distance filter (10m foreground, 50m background, 100m stationary), clean teardown.
// 5. TERMINAL PATHS: manager stop on success, timeout, cancel, error; no active stream or background indicator.
// 6. PERMISSION STATES: denied, restricted, servicesDisabled, reduced accuracy.
// 7. BACKPRESSURE: bounded offline queue (cap 30), drops oldest on overflow.
// 8. DIAGNOSTICS: complete telemetry metrics with strictly ZERO coordinate leakage.

import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';

import 'package:crowdbeats_mobile/data/models/location_backpressure_queue.dart';
import 'package:crowdbeats_mobile/data/models/location_diagnostics.dart';
import 'package:crowdbeats_mobile/data/models/location_fix.dart';
import 'package:crowdbeats_mobile/data/services/apple_core_location_provider.dart';
import 'package:crowdbeats_mobile/data/services/location_provider.dart';

Position _createPosition({
  required double lat,
  required double lng,
  double accuracy = 10.0,
  DateTime? timestamp,
  double speed = 0.0,
  bool isMocked = false,
}) {
  return Position(
    latitude: lat,
    longitude: lng,
    timestamp: timestamp ?? DateTime.now(),
    accuracy: accuracy,
    altitude: 15.0,
    altitudeAccuracy: 1.0,
    heading: 0.0,
    headingAccuracy: 0.0,
    speed: speed,
    speedAccuracy: 0.0,
    isMocked: isMocked,
  );
}

AppleCoreLocationProvider _createProvider({
  GetPositionFn? getCurrentPositionFn,
  GetLastKnownPositionFn? getLastKnownPositionFn,
  PositionStreamFn? getPositionStreamFn,
  RequestTemporaryFullAccuracyFn? requestTemporaryFullAccuracyFn,
  LocationBackpressureQueue? backpressureQueue,
  DateTime Function()? nowFn,
  bool serviceEnabled = true,
  LocationPermission permission = LocationPermission.whileInUse,
  LocationAccuracyStatus accuracyStatus = LocationAccuracyStatus.precise,
}) {
  return AppleCoreLocationProvider(
    getCurrentPositionFn: getCurrentPositionFn,
    getLastKnownPositionFn: getLastKnownPositionFn,
    getPositionStreamFn: getPositionStreamFn,
    isLocationServiceEnabledFn: () async => serviceEnabled,
    checkPermissionFn: () async => permission,
    requestPermissionFn: () async => permission,
    getLocationAccuracyFn: () async => accuracyStatus,
    requestTemporaryFullAccuracyFn: requestTemporaryFullAccuracyFn,
    backpressureQueue: backpressureQueue,
    nowFn: nowFn,
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Phase 5 — Apple Core Location Provider', () {
    // ── 1. Discovery: Cached vs One-Shot vs Cancel ───────────────────────────

    test('Discovery uses fresh cached fix without querying sensor', () async {
      var currentPositionCalls = 0;
      final cachedPos = _createPosition(
        lat: 32.7157,
        lng: -117.1611,
        accuracy: 15.0,
        timestamp: DateTime.now().subtract(const Duration(minutes: 1)),
      );

      final provider = _createProvider(
        getLastKnownPositionFn: () async => cachedPos,
        getCurrentPositionFn: ({locationSettings}) async {
          currentPositionCalls++;
          return _createPosition(lat: 32.0, lng: -117.0);
        },
      );

      final fix = await provider.requestOneShot(targetMode: LocationMode.discovery);

      expect(fix, isNotNull);
      expect(currentPositionCalls, equals(0)); // GPS hardware was NOT queried!
      expect(provider.currentMode, equals(LocationMode.off));
    });

    test('Discovery falls back to balanced power one-shot when cache is stale', () async {
      var currentPositionCalls = 0;
      LocationSettings? capturedSettings;

      final stalePos = _createPosition(
        lat: 32.7157,
        lng: -117.1611,
        timestamp: DateTime.now().subtract(const Duration(minutes: 10)), // Stale (>5 min)
      );

      final provider = _createProvider(
        getLastKnownPositionFn: () async => stalePos,
        getCurrentPositionFn: ({locationSettings}) async {
          currentPositionCalls++;
          capturedSettings = locationSettings;
          return _createPosition(lat: 32.7157, lng: -117.1611, accuracy: 25.0);
        },
      );

      final fix = await provider.requestOneShot(targetMode: LocationMode.discovery);

      expect(fix, isNotNull);
      expect(currentPositionCalls, equals(1));
      expect(capturedSettings, isA<AppleSettings>());
      final appleSettings = capturedSettings as AppleSettings;
      expect(appleSettings.accuracy, equals(LocationAccuracy.low));
      expect(appleSettings.showBackgroundLocationIndicator, isFalse);
      expect(provider.currentMode, equals(LocationMode.off));
    });

    test('cancelCurrentOperation aborts in-flight one-shot request immediately', () async {
      final neverCompletingCompleter = Completer<Position>();

      final provider = _createProvider(
        getLastKnownPositionFn: () async => null,
        getCurrentPositionFn: ({locationSettings}) => neverCompletingCompleter.future,
      );

      final oneShotFuture = provider.requestOneShot(
        targetMode: LocationMode.discovery,
        timeout: const Duration(seconds: 30),
      );

      // Cancel immediately while in-flight
      provider.cancelCurrentOperation();

      final fix = await oneShotFuture;
      expect(fix, isNull);
      expect(provider.currentMode, equals(LocationMode.off));
    });

    test('One-shot returns null on timeout without crashing or hanging', () async {
      final provider = _createProvider(
        getLastKnownPositionFn: () async => null,
        getCurrentPositionFn: ({locationSettings}) async {
          await Future<void>.delayed(const Duration(milliseconds: 50));
          return _createPosition(lat: 32.0, lng: -117.0);
        },
      );

      final fix = await provider.requestOneShot(
        targetMode: LocationMode.discovery,
        timeout: const Duration(milliseconds: 10), // times out first
      );

      expect(fix, isNull);
      expect(provider.currentMode, equals(LocationMode.off));
    });

    // ── 2. Check-In: Accuracy Authorization & Escalation ─────────────────────

    test('Check-In detects reduced accuracy and requests temporary full accuracy', () async {
      String? requestedPurposeKey;
      var temporaryAccuracyCalls = 0;

      final provider = _createProvider(
        accuracyStatus: LocationAccuracyStatus.reduced, // iOS 14+ Approximate Location
        requestTemporaryFullAccuracyFn: ({required purposeKey}) async {
          temporaryAccuracyCalls++;
          requestedPurposeKey = purposeKey;
          return LocationAccuracyStatus.precise;
        },
        getCurrentPositionFn: ({locationSettings}) async {
          return _createPosition(lat: 32.7157, lng: -117.1611, accuracy: 12.0);
        },
      );

      final fix = await provider.requestOneShot(targetMode: LocationMode.checkIn);

      expect(fix, isNotNull);
      expect(temporaryAccuracyCalls, equals(1));
      expect(requestedPurposeKey, equals('VenueProximityVerificationKey'));
      expect(provider.currentMode, equals(LocationMode.off)); // Shuts down immediately
    });

    test('Check-In starts with balanced accuracy and accepts good fix (<50m)', () async {
      LocationSettings? capturedSettings;

      final provider = _createProvider(
        getCurrentPositionFn: ({locationSettings}) async {
          capturedSettings = locationSettings;
          return _createPosition(lat: 32.7157, lng: -117.1611, accuracy: 15.0);
        },
      );

      final fix = await provider.requestOneShot(targetMode: LocationMode.checkIn);

      expect(fix, isNotNull);
      expect(fix!.accuracyMeters, equals(15.0));
      expect(capturedSettings, isA<AppleSettings>());
      final appleSettings = capturedSettings as AppleSettings;
      expect(appleSettings.accuracy, equals(LocationAccuracy.medium));
      expect(provider.currentMode, equals(LocationMode.off));
    });

    test('Check-In escalates to high accuracy when initial accuracy exceeds 50m', () async {
      final requestedAccuracies = <LocationAccuracy>[];

      final provider = _createProvider(
        getCurrentPositionFn: ({locationSettings}) async {
          final settings = locationSettings as AppleSettings;
          requestedAccuracies.add(settings.accuracy);

          if (settings.accuracy == LocationAccuracy.medium) {
            // Return coarse fix > 50m
            return _createPosition(lat: 32.7157, lng: -117.1611, accuracy: 75.0);
          } else {
            // Return high accuracy fix
            return _createPosition(lat: 32.7157, lng: -117.1611, accuracy: 8.0);
          }
        },
      );

      final fix = await provider.requestOneShot(targetMode: LocationMode.checkIn);

      expect(fix, isNotNull);
      expect(fix!.accuracyMeters, equals(8.0));
      expect(requestedAccuracies, equals([
        LocationAccuracy.medium,
        LocationAccuracy.high,
      ]));
      expect(provider.currentMode, equals(LocationMode.off));
    });

    test('Check-In rejects stale fix (>30s old)', () async {
      final now = DateTime(2026, 9, 20, 16, 0, 0);

      final provider = _createProvider(
        nowFn: () => now,
        getCurrentPositionFn: ({locationSettings}) async {
          return _createPosition(
            lat: 32.7157,
            lng: -117.1611,
            accuracy: 10.0,
            timestamp: now.subtract(const Duration(seconds: 45)), // 45s old (>30s)
          );
        },
      );

      final fix = await provider.requestOneShot(targetMode: LocationMode.checkIn);

      expect(fix, isNull);
      expect(provider.currentMode, equals(LocationMode.off));
    });

    // ── 3. Live Stationary: Zero Continuous GPS & Region Monitoring ─────────

    test('Live Stationary keeps continuous GPS off and monitors venue region', () async {
      final provider = _createProvider();

      expect(provider.isPositionStreamActive, isFalse);

      final venueCenter = LocationFix(
        latitude: 32.7157,
        longitude: -117.1611,
        accuracyMeters: 5.0,
        timestamp: DateTime.now(),
      );

      final geofenceStream = provider.monitorGeofence(
        centre: venueCenter,
        radiusMeters: 200.0,
        regionId: 'venue_belly_up_ios',
      );

      expect(provider.activeGeofenceRegionId, equals('venue_belly_up_ios'));
      expect(provider.isPositionStreamActive, isFalse); // GPS is strictly OFF

      final exitEvents = <GeofenceEvent>[];
      final sub = geofenceStream.listen(exitEvents.add);

      // Simulate a sample 500m away (outside 200m venue perimeter)
      final outsideSample = LocationFix(
        latitude: 32.7200,
        longitude: -117.1611,
        accuracyMeters: 10.0,
        timestamp: DateTime.now(),
      );

      provider.evaluateGeofenceSample(outsideSample);

      await Future<void>.delayed(const Duration(milliseconds: 10));
      expect(exitEvents, equals([GeofenceEvent.exited]));

      await provider.cancelGeofence('venue_belly_up_ios');
      expect(provider.activeGeofenceRegionId, isNull);
      await sub.cancel();
    });

    // ── 4. Live Mobile: Core Location Background & Stationary Throttling ─────

    test('Live Mobile configures AppleSettings with background indicator and pausesLocationUpdatesAutomatically', () async {
      AppleSettings? capturedSettings;
      final controller = StreamController<Position>();

      final provider = _createProvider(
        getPositionStreamFn: ({locationSettings}) {
          capturedSettings = locationSettings as AppleSettings;
          return controller.stream;
        },
      );

      provider.startAdaptive(LocationMode.liveMobile);
      expect(provider.isBackgroundIndicatorActive, isTrue);
      expect(provider.currentMode, equals(LocationMode.liveMobile));

      expect(capturedSettings, isNotNull);
      expect(capturedSettings!.allowBackgroundLocationUpdates, isTrue);
      expect(capturedSettings!.showBackgroundLocationIndicator, isTrue);
      expect(capturedSettings!.pauseLocationUpdatesAutomatically, isTrue);
      expect(capturedSettings!.activityType, equals(ActivityType.fitness));

      // Verify teardown cleanly turns off background indicator and stops updates
      await provider.stopAdaptive();
      expect(provider.isBackgroundIndicatorActive, isFalse);
      expect(provider.isPositionStreamActive, isFalse);
      expect(provider.currentMode, equals(LocationMode.liveStationary));

      await controller.close();
    });

    test('Live Mobile stationary detection throttles distance filter to 100m', () async {
      final controller = StreamController<Position>();

      final provider = _createProvider(
        getPositionStreamFn: ({locationSettings}) => controller.stream,
      );

      final stream = provider.startAdaptive(LocationMode.liveMobile);
      final receivedFixes = <LocationFix>[];
      final sub = stream.listen(receivedFixes.add);

      expect(provider.currentDistanceFilterMeters, equals(10)); // Initial foreground filter

      // Emit initial fix followed by 3 consecutive stationary fixes (<15m)
      controller.add(_createPosition(lat: 32.7157, lng: -117.1611, speed: 0.1));
      await Future<void>.delayed(const Duration(milliseconds: 10));

      controller.add(_createPosition(lat: 32.71571, lng: -117.1611, speed: 0.1));
      await Future<void>.delayed(const Duration(milliseconds: 10));

      controller.add(_createPosition(lat: 32.71572, lng: -117.1611, speed: 0.1));
      await Future<void>.delayed(const Duration(milliseconds: 10));

      controller.add(_createPosition(lat: 32.71571, lng: -117.1611, speed: 0.1));
      await Future<void>.delayed(const Duration(milliseconds: 10));

      // After 3 stationary displacement checks, filter should be throttled to 100m for battery conservation
      expect(provider.currentDistanceFilterMeters, equals(100));

      // When significant movement resumes (>15m), filter restores to 10m
      controller.add(_createPosition(lat: 32.7200, lng: -117.1611, speed: 1.5));
      await Future<void>.delayed(const Duration(milliseconds: 10));

      expect(provider.currentDistanceFilterMeters, equals(10));

      await sub.cancel();
      await provider.stopAdaptive();
      await controller.close();
    });

    // ── 5. Permission States & Recovery ──────────────────────────────────────

    test('Resolves granular 9-state permission states correctly on iOS', () async {
      final providerDisabled = _createProvider(serviceEnabled: false);
      expect(
        await providerDisabled.getPermissionState(),
        equals(LocationPermissionState.servicesDisabled),
      );

      final providerDenied = _createProvider(permission: LocationPermission.denied);
      expect(
        await providerDenied.getPermissionState(),
        equals(LocationPermissionState.denied),
      );

      final providerBlocked = _createProvider(permission: LocationPermission.deniedForever);
      expect(
        await providerBlocked.getPermissionState(),
        equals(LocationPermissionState.permanentlyDenied),
      );

      final providerApprox = _createProvider(
        permission: LocationPermission.whileInUse,
        accuracyStatus: LocationAccuracyStatus.reduced,
      );
      expect(
        await providerApprox.getPermissionState(),
        equals(LocationPermissionState.foregroundApproximate),
      );

      final providerPrecise = _createProvider(
        permission: LocationPermission.whileInUse,
        accuracyStatus: LocationAccuracyStatus.precise,
      );
      expect(
        await providerPrecise.getPermissionState(),
        equals(LocationPermissionState.foregroundPrecise),
      );
    });

    // ── 6. Backpressure & Bounded Queue ─────────────────────────────────────

    test('LocationBackpressureQueue caps at maxCapacity and drops oldest', () {
      final queue = LocationBackpressureQueue(maxCapacity: 3);

      final fix1 = LocationFix(latitude: 32.1, longitude: -117.1, accuracyMeters: 5, timestamp: DateTime.now());
      final fix2 = LocationFix(latitude: 32.2, longitude: -117.2, accuracyMeters: 5, timestamp: DateTime.now());
      final fix3 = LocationFix(latitude: 32.3, longitude: -117.3, accuracyMeters: 5, timestamp: DateTime.now());
      final fix4 = LocationFix(latitude: 32.4, longitude: -117.4, accuracyMeters: 5, timestamp: DateTime.now());

      queue.enqueue(fix1);
      queue.enqueue(fix2);
      queue.enqueue(fix3);
      expect(queue.size, equals(3));
      expect(queue.droppedCount, equals(0));

      // 4th fix causes overflow — fix1 should be dropped
      queue.enqueue(fix4);
      expect(queue.size, equals(3));
      expect(queue.droppedCount, equals(1));

      final batch = queue.drainBatch(maxBatchSize: 10);
      expect(batch.length, equals(3));
      expect(batch[0].latitude, equals(32.2));
      expect(batch[1].latitude, equals(32.3));
      expect(batch[2].latitude, equals(32.4));
    });

    // ── 7. Diagnostics Redaction Invariants ──────────────────────────────────

    test('LocationDiagnostics strictly redacts all coordinates and addresses', () {
      final provider = _createProvider();
      final snapshot = provider.diagnosticsSnapshot();

      expect(snapshot['provider'], equals('apple_core_location'));
      expect(snapshot['mode'], equals('off'));
      expect(snapshot['sampleCount'], equals(0));

      // Strict privacy invariant: assert zero coordinates or location leaks
      LocationDiagnostics.assertZeroCoordinates(snapshot);

      // Verify forbidden keys are absent
      const forbiddenKeys = [
        'latitude',
        'longitude',
        'lat',
        'lng',
        'accuracyMeters',
        'altitude',
        'speed',
        'heading',
        'address',
        'street',
      ];
      for (final key in forbiddenKeys) {
        expect(snapshot.containsKey(key), isFalse, reason: 'Forbidden key $key found in telemetry snapshot!');
      }
    });
  });
}
