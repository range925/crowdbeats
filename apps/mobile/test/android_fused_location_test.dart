// Crowdbeats V2 — Android Fused Location Provider Acceptance Tests (Phase 4)
//
// Verifies:
// 1. DISCOVERY: cached fix preference, balanced power fallback, timeout, immediate cancellation.
// 2. CHECK_IN: balanced accuracy initial request, escalation to high accuracy when needed,
//    immediate sensor shutdown upon first acceptable fix.
// 3. LIVE_STATIONARY: zero continuous GPS tracking, low-power geofence registration and exit signal.
// 4. LIVE_MOBILE: foreground service configuration, ongoing notification, wake lock avoidance,
//    adaptive rate controller (5s foreground, 30s background, 60s stationary), clean teardown.
// 5. BACKPRESSURE: bounded offline queue (cap 30), drop oldest on overflow, batch draining and retry.
// 6. MOCK RISK: spoof detection as risk signal rather than fatal crash.
// 7. DIAGNOSTICS: complete telemetry metrics with strictly ZERO coordinate leakage.

import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';

import 'package:crowdbeats_mobile/data/models/location_backpressure_queue.dart';
import 'package:crowdbeats_mobile/data/models/location_diagnostics.dart';
import 'package:crowdbeats_mobile/data/models/location_fix.dart';
import 'package:crowdbeats_mobile/data/services/android_fused_location_provider.dart';
import 'package:crowdbeats_mobile/data/services/location_provider.dart';

Position _createPosition({
  required double lat,
  required double lng,
  double accuracy = 10.0,
  DateTime? timestamp,
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
    speed: 0.0,
    speedAccuracy: 0.0,
    isMocked: isMocked,
  );
}

AndroidFusedLocationProvider _createProvider({
  GetPositionFn? getCurrentPositionFn,
  GetLastKnownPositionFn? getLastKnownPositionFn,
  PositionStreamFn? getPositionStreamFn,
  LocationBackpressureQueue? backpressureQueue,
  DateTime Function()? nowFn,
  bool serviceEnabled = true,
  LocationPermission permission = LocationPermission.whileInUse,
  LocationAccuracyStatus accuracyStatus = LocationAccuracyStatus.precise,
}) {
  return AndroidFusedLocationProvider(
    getCurrentPositionFn: getCurrentPositionFn,
    getLastKnownPositionFn: getLastKnownPositionFn,
    getPositionStreamFn: getPositionStreamFn,
    isLocationServiceEnabledFn: () async => serviceEnabled,
    checkPermissionFn: () async => permission,
    requestPermissionFn: () async => permission,
    getLocationAccuracyFn: () async => accuracyStatus,
    backpressureQueue: backpressureQueue,
    nowFn: nowFn,
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Phase 4 — Android Fused Location Provider', () {
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
      expect(currentPositionCalls, equals(0)); // GPS was NOT queried!
      expect(provider.currentMode, equals(LocationMode.discovery));
      expect(provider.diagnostics.acceptedCount, equals(1));
    });

    test('Discovery falls back to balanced power one-shot when cache is stale', () async {
      var currentPositionCalls = 0;
      LocationAccuracy? requestedAccuracy;

      // Stale cache (15 min old, exceeds 5 min maxAge)
      final stalePos = _createPosition(
        lat: 32.7157,
        lng: -117.1611,
        accuracy: 15.0,
        timestamp: DateTime.now().subtract(const Duration(minutes: 15)),
      );

      final freshPos = _createPosition(
        lat: 32.7158,
        lng: -117.1612,
        accuracy: 12.0,
        timestamp: DateTime.now(),
      );

      final provider = _createProvider(
        getLastKnownPositionFn: () async => stalePos,
        getCurrentPositionFn: ({locationSettings}) async {
          currentPositionCalls++;
          requestedAccuracy = locationSettings?.accuracy;
          return freshPos;
        },
      );

      final fix = await provider.requestOneShot(targetMode: LocationMode.discovery);

      expect(fix, isNotNull);
      expect(currentPositionCalls, equals(1));
      expect(requestedAccuracy, equals(LocationAccuracy.medium)); // Balanced power
      expect(provider.diagnostics.sampleCount, equals(2)); // 1 stale cached + 1 fresh
    });

    test('cancelCurrentOperation aborts in-flight one-shot request immediately', () async {
      final completer = Completer<Position>();

      final provider = _createProvider(
        getLastKnownPositionFn: () async => null,
        getCurrentPositionFn: ({locationSettings}) => completer.future,
      );

      final futureFix = provider.requestOneShot(targetMode: LocationMode.discovery);

      // Cancel before completion
      provider.cancelCurrentOperation();

      final fix = await futureFix;
      expect(fix, isNull);
    });

    test('One-shot returns null on timeout without crashing or hanging', () async {
      final provider = _createProvider(
        getLastKnownPositionFn: () async => null,
        getCurrentPositionFn: ({locationSettings}) async {
          await Future.delayed(const Duration(milliseconds: 50));
          return _createPosition(lat: 32.0, lng: -117.0);
        },
      );

      final fix = await provider.requestOneShot(
        targetMode: LocationMode.discovery,
        timeout: const Duration(milliseconds: 10), // Short timeout
      );

      expect(fix, isNull);
    });

    // ── 2. Check-In & Accuracy Escalation ────────────────────────────────────

    test('Check-In starts with balanced accuracy and accepts good fix (<50m)', () async {
      var callCount = 0;
      LocationAccuracy? initialAccuracy;

      final goodPos = _createPosition(
        lat: 32.7157,
        lng: -117.1611,
        accuracy: 25.0, // Within 50m venue radius policy
        timestamp: DateTime.now(),
      );

      final provider = _createProvider(
        getLastKnownPositionFn: () async => null,
        getCurrentPositionFn: ({locationSettings}) async {
          callCount++;
          initialAccuracy = locationSettings?.accuracy;
          return goodPos;
        },
      );

      final fix = await provider.requestOneShot(targetMode: LocationMode.checkIn);

      expect(fix, isNotNull);
      expect(callCount, equals(1)); // No escalation needed
      expect(initialAccuracy, equals(LocationAccuracy.medium));
      expect(provider.currentMode, equals(LocationMode.checkIn));
    });

    test('Check-In escalates to high accuracy when initial accuracy exceeds 50m', () async {
      var callCount = 0;
      final accuraciesRequested = <LocationAccuracy>[];

      final lowAccuracyPos = _createPosition(
        lat: 32.7157,
        lng: -117.1611,
        accuracy: 85.0, // Exceeds 50m threshold
        timestamp: DateTime.now(),
      );

      final escalatedPos = _createPosition(
        lat: 32.7157,
        lng: -117.1611,
        accuracy: 12.0, // High accuracy fix
        timestamp: DateTime.now(),
      );

      final provider = _createProvider(
        getLastKnownPositionFn: () async => null,
        getCurrentPositionFn: ({locationSettings}) async {
          callCount++;
          accuraciesRequested.add(locationSettings!.accuracy);
          if (callCount == 1) return lowAccuracyPos;
          return escalatedPos;
        },
      );

      final fix = await provider.requestOneShot(targetMode: LocationMode.checkIn);

      expect(fix, isNotNull);
      expect(callCount, equals(2)); // Initial + 1 escalation
      expect(accuraciesRequested[0], equals(LocationAccuracy.medium));
      expect(accuraciesRequested[1], equals(LocationAccuracy.high));
      expect(fix!.accuracyMeters, equals(12.0));
    });

    // ── 3. Live Stationary & Geofencing ──────────────────────────────────────

    test('Live Stationary keeps continuous GPS off and monitors venue geofence', () async {
      final provider = _createProvider();

      // Ensure stationary
      await provider.stopContinuous();
      expect(provider.diagnostics.isForegroundServiceRunning, isFalse);

      final centre = LocationFix(
        latitude: 32.7157,
        longitude: -117.1611,
        accuracyMeters: 10,
        timestamp: DateTime.now(),
      );

      final stream = provider.monitorGeofence(
        centre: centre,
        radiusMeters: 200.0,
        regionId: 'venue_belly_up',
      );

      expect(provider.diagnostics.geofenceRegistered, isTrue);

      final events = <GeofenceEvent>[];
      final sub = stream.listen(events.add);

      // Simulate a sample within radius
      provider.evaluateGeofenceSample(LocationFix(
        latitude: 32.71575, // ~6 meters away
        longitude: -117.1611,
        accuracyMeters: 10,
        timestamp: DateTime.now(),
      ));
      expect(events, isEmpty);

      // Simulate a sample outside radius (>200m)
      provider.evaluateGeofenceSample(LocationFix(
        latitude: 32.7200, // ~480 meters away
        longitude: -117.1611,
        accuracyMeters: 10,
        timestamp: DateTime.now(),
      ));

      await Future<void>.delayed(const Duration(milliseconds: 10));
      expect(events, contains(GeofenceEvent.exited));

      await provider.cancelGeofence('venue_belly_up');
      expect(provider.diagnostics.geofenceRegistered, isFalse);
      await sub.cancel();
    });

    // ── 4. Live Mobile: Foreground Service & Adaptive Rates ──────────────────

    test('Live Mobile configures foreground service without wake locks', () async {
      final streamController = StreamController<Position>.broadcast();
      AndroidSettings? capturedSettings;

      final provider = _createProvider(
        getPositionStreamFn: ({locationSettings}) {
          if (locationSettings is AndroidSettings) {
            capturedSettings = locationSettings;
          }
          return streamController.stream;
        },
      );

      final stream = provider.startAdaptive(LocationMode.liveMobile);
      expect(provider.diagnostics.isForegroundServiceRunning, isTrue);

      // Verify Android foreground notification configuration
      expect(capturedSettings, isNotNull);
      final fgConfig = capturedSettings!.foregroundNotificationConfig;
      expect(fgConfig, isNotNull);
      expect(fgConfig!.setOngoing, isTrue);
      expect(fgConfig.notificationTitle, contains('Crowdbeats Live'));

      // STRICT INVARIANT: Wake locks and wifi locks are disabled!
      expect(fgConfig.enableWakeLock, isFalse);
      expect(fgConfig.enableWifiLock, isFalse);

      final receivedFixes = <LocationFix>[];
      final sub = stream.listen(receivedFixes.add);

      streamController.add(_createPosition(lat: 32.7157, lng: -117.1611));
      await Future<void>.delayed(const Duration(milliseconds: 10));

      expect(receivedFixes.length, equals(1));
      expect(provider.diagnostics.sampleCount, equals(1));

      // Stop tracking cleanly
      await provider.stopContinuous();
      expect(provider.diagnostics.isForegroundServiceRunning, isFalse);
      expect(provider.diagnostics.cleanupStatus, equals('cleaned_up'));
      expect(provider.currentMode, equals(LocationMode.liveStationary));

      await sub.cancel();
      await streamController.close();
    });

    test('Live Mobile stationary detection throttles update rate', () async {
      final streamController = StreamController<Position>.broadcast();

      final provider = _createProvider(
        getPositionStreamFn: ({locationSettings}) => streamController.stream,
      );

      final stream = provider.startAdaptive(LocationMode.liveMobile);
      final sub = stream.listen((_) {});

      // Initial active interval: 5000ms
      expect(provider.diagnostics.averageRequestedIntervalMs, equals(5000));

      // Emit 3 consecutive fixes with <10m displacement
      final baseLat = 32.7157;
      final baseLng = -117.1611;

      streamController.add(_createPosition(lat: baseLat, lng: baseLng));
      streamController.add(_createPosition(lat: baseLat + 0.00001, lng: baseLng));
      streamController.add(_createPosition(lat: baseLat + 0.00002, lng: baseLng));
      streamController.add(_createPosition(lat: baseLat + 0.00001, lng: baseLng));

      await Future<void>.delayed(const Duration(milliseconds: 10));

      // Degraded to 60000ms (1 min) when stationary
      expect(provider.diagnostics.averageRequestedIntervalMs, equals(60000));

      // Resume movement (>10m displacement)
      streamController.add(_createPosition(lat: baseLat + 0.001, lng: baseLng));
      await Future<void>.delayed(const Duration(milliseconds: 10));

      // Restored to active 5000ms
      expect(provider.diagnostics.averageRequestedIntervalMs, equals(5000));

      await provider.stopContinuous();
      await sub.cancel();
      await streamController.close();
    });

    // ── 5. Backpressure & Offline Queue Cap ──────────────────────────────────

    test('LocationBackpressureQueue caps at maxCapacity and drops oldest', () {
      final queue = LocationBackpressureQueue(maxCapacity: 3);

      final fix1 = LocationFix(
        latitude: 32.1,
        longitude: -117.1,
        accuracyMeters: 10,
        timestamp: DateTime.now(),
      );
      final fix2 = LocationFix(
        latitude: 32.2,
        longitude: -117.2,
        accuracyMeters: 10,
        timestamp: DateTime.now(),
      );
      final fix3 = LocationFix(
        latitude: 32.3,
        longitude: -117.3,
        accuracyMeters: 10,
        timestamp: DateTime.now(),
      );
      final fix4 = LocationFix(
        latitude: 32.4,
        longitude: -117.4,
        accuracyMeters: 10,
        timestamp: DateTime.now(),
      );

      expect(queue.enqueue(fix1), isTrue);
      expect(queue.enqueue(fix2), isTrue);
      expect(queue.enqueue(fix3), isTrue);
      expect(queue.size, equals(3));
      expect(queue.isFull, isTrue);

      // Enqueue 4th item when cap is 3: oldest (fix1) must be dropped
      final addedWithoutDrop = queue.enqueue(fix4);
      expect(addedWithoutDrop, isFalse);
      expect(queue.size, equals(3));
      expect(queue.droppedCount, equals(1));

      final items = queue.toList();
      expect(items.first, equals(fix2));
      expect(items.last, equals(fix4));

      // Batch draining and acknowledgement
      final batch = queue.drainBatch(maxBatchSize: 2);
      expect(batch.length, equals(2));
      expect(batch, equals([fix2, fix3]));

      queue.acknowledgeBatch(batch);
      expect(queue.size, equals(1));
      expect(queue.acknowledgedCount, equals(2));
      expect(queue.toList(), equals([fix4]));
    });

    // ── 6. Mock Location Risk Signal ─────────────────────────────────────────

    test('Mock location is recorded as risk signal without fatal crash', () async {
      final mockPos = _createPosition(
        lat: 32.7157,
        lng: -117.1611,
        accuracy: 10.0,
        timestamp: DateTime.now(),
        isMocked: true,
      );

      final provider = _createProvider(
        getLastKnownPositionFn: () async => null,
        getCurrentPositionFn: ({locationSettings}) async => mockPos,
      );

      final fix = await provider.requestOneShot(targetMode: LocationMode.checkIn);

      expect(fix, isNotNull);
      expect(fix!.isMock, isTrue);
      expect(provider.diagnostics.mockRiskDetected, isTrue);
    });

    // ── 7. Diagnostics Redaction Invariant ────────────────────────────────────

    test('LocationDiagnostics strictly redacts all coordinates and addresses', () {
      final diag = const LocationDiagnostics(
        provider: 'android_fused',
        mode: 'liveMobile',
        sampleCount: 15,
        acceptedCount: 14,
        rejectedCount: 1,
        averageRequestedIntervalMs: 5000,
        uploadCount: 3,
        cleanupStatus: 'active',
        isForegroundServiceRunning: true,
        geofenceRegistered: true,
      );

      final json = diag.toJson();

      expect(json.containsKey('provider'), isTrue);
      expect(json.containsKey('sampleCount'), isTrue);
      expect(json.containsKey('acceptedCount'), isTrue);

      // INVARIANT: zero coordinates
      expect(json.containsKey('lat'), isFalse);
      expect(json.containsKey('lng'), isFalse);
      expect(json.containsKey('latitude'), isFalse);
      expect(json.containsKey('longitude'), isFalse);
      expect(json.containsKey('accuracyMeters'), isFalse);
      expect(json.containsKey('address'), isFalse);

      // Throws on prohibited key
      expect(
        () => LocationDiagnostics.assertZeroCoordinates({'lat': 32.7157}),
        throwsA(isA<AssertionError>()),
      );
      expect(
        () => LocationDiagnostics.assertZeroCoordinates({'rawCoordinates': [32.0, -117.0]}),
        throwsA(isA<AssertionError>()),
      );
    });
  });
}
