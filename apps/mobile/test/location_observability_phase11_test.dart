// Crowdbeats V2 — Phase 11: Location Observability & Energy Tests (Mobile)
//
// Tests energy telemetry accumulation, zero-coordinate assertions,
// Remote Config bounds and emergency kill switches, and debug diagnostics UI.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/data/services/location_energy_tracker.dart';
import 'package:crowdbeats_mobile/data/services/location_remote_config_service.dart';
import 'package:crowdbeats_mobile/data/services/location_cleanup_coordinator.dart';
import 'package:crowdbeats_mobile/ui/debug/location_energy_diagnostics_screen.dart';

void main() {
  group('Phase 11: Location Quality & Energy Observability (Mobile)', () {
    late DateTime mockTime;
    late LocationEnergyTracker tracker;

    setUp(() {
      mockTime = DateTime(2026, 9, 21, 12, 0, 0);
      tracker = LocationEnergyTracker(nowFn: () => mockTime);
    });

    test('1. Tracks state durations and sensor active time accurately', () {
      // Transition to discovery for 5 seconds
      tracker.transitionMode(TrackingStateMode.discovery);
      mockTime = mockTime.add(const Duration(seconds: 5));

      // Sensor active for 2 seconds
      tracker.recordSensorStarted();
      mockTime = mockTime.add(const Duration(seconds: 2));
      tracker.recordSensorStopped();

      // Transition to live stationary for 10 seconds
      tracker.transitionMode(TrackingStateMode.liveStationary);
      mockTime = mockTime.add(const Duration(seconds: 10));

      final snapshot = tracker.toSnapshotJson(appVersion: '2.0.0');
      final timeInState = snapshot['timeInStateMs'] as Map<String, dynamic>;

      expect(timeInState['discovery'], 7000);
      expect(timeInState['live_stationary'], 10000);
      expect(snapshot['activeSensorDurationMs'], 2000);
      expect((snapshot['locationRequests'] as Map<String, dynamic>)['started'], 1);
      expect((snapshot['locationRequests'] as Map<String, dynamic>)['stopped'], 1);
    });

    test('2. Records sample quality, accuracy bands, and rejected reasons', () {
      tracker.recordSampleReceived(
        accepted: true,
        accuracyClass: 'high',
        intervalSeconds: 10,
        distanceFilterMeters: 10,
      );
      tracker.recordSampleReceived(
        accepted: false,
        rejectionReason: 'mock_gps_detected',
        accuracyClass: 'coarse',
        intervalSeconds: 30,
        distanceFilterMeters: 50,
      );

      final snapshot = tracker.toSnapshotJson(appVersion: '2.0.0');
      final sampleCounts = snapshot['sampleCounts'] as Map<String, dynamic>;
      final accuracyBands = snapshot['accuracyClassBands'] as Map<String, dynamic>;

      expect(sampleCounts['received'], 2);
      expect(sampleCounts['accepted'], 1);
      expect(sampleCounts['rejected'], 1);
      final reasons = sampleCounts['rejectedReasons'] as Map<String, dynamic>;
      expect(reasons['mock_gps_detected'], 1);
      expect(accuracyBands['high'], 1);
      expect(accuracyBands['coarse'], 1);
    });

    test('3. Records network telemetry, upload counts, and queue high-water marks', () {
      tracker.recordUpload(bytes: 256, retries: 0, currentQueueSize: 5);
      tracker.recordUpload(bytes: 512, retries: 1, currentQueueSize: 18);
      tracker.recordUpload(bytes: 128, retries: 0, currentQueueSize: 12);

      final snapshot = tracker.toSnapshotJson(appVersion: '2.0.0');
      final network = snapshot['networkTelemetry'] as Map<String, dynamic>;

      expect(network['uploadCount'], 3);
      expect(network['bytesUploaded'], 256 + 512 + 128);
      expect(network['retryCount'], 1);
      expect(network['queueHighWaterMark'], 18);
    });

    test('4. Enforces database read and write attribution tracking', () {
      tracker.recordFirestoreReads(14);
      tracker.recordFirestoreWrites(3);
      tracker.recordRtdbReads(2);
      tracker.recordRtdbWrites(1);

      final snapshot = tracker.toSnapshotJson(appVersion: '2.0.0');
      final db = snapshot['databaseAttribution'] as Map<String, dynamic>;

      expect(db['firestoreReads'], 14);
      expect(db['firestoreWrites'], 3);
      expect(db['rtdbReads'], 2);
      expect(db['rtdbWrites'], 1);
    });

    test('5. Enforces zero-coordinate privacy assertion on snapshot JSON', () {
      // Normal snapshot succeeds
      final snapshot = tracker.toSnapshotJson(appVersion: '2.0.0');
      expect(() => LocationEnergyTracker.assertZeroCoordinates(snapshot), returnsNormally);

      // Injecting a forbidden coordinate key throws StateError
      final leakedMap = Map<String, Object?>.from(snapshot);
      leakedMap['latitude'] = 34.0522;
      expect(
        () => LocationEnergyTracker.assertZeroCoordinates(leakedMap),
        throwsStateError,
      );

      final leakedAddressMap = Map<String, Object?>.from(snapshot);
      leakedAddressMap['street'] = '100 Main St';
      expect(
        () => LocationEnergyTracker.assertZeroCoordinates(leakedAddressMap),
        throwsStateError,
      );
    });

    test('6. LocationRemoteConfigService clamps bounds and supports emergency kill switches', () {
      final service = LocationRemoteConfigService();

      // Verify defaults
      expect(service.isMobileTrackingAllowed, true);
      expect(service.isPublicPresenceAllowed, true);
      expect(service.isCrowdRadarAllowed, true);
      expect(service.isAudienceVisibilityAllowed, true);
      expect(service.policy.minUploadIntervalSeconds, 15);
      expect(service.policy.maxQueueCapacity, 30);

      // Emergency kill switch
      service.setKillSwitch(mobileTracking: false);
      expect(service.isMobileTrackingAllowed, false);
      expect(service.isPublicPresenceAllowed, true);

      // Clamping bounds from remote map
      service.updateFromMap({
        'mobileTrackingEnabled': false,
        'minUploadIntervalSeconds': 1, // Below min 5 -> clamped to 5
        'maxQueueCapacity': 100, // Above max 50 -> clamped to 50
        'velocityCapMps': 200, // Above max 100 -> clamped to 100
      });

      expect(service.isMobileTrackingAllowed, false);
      expect(service.policy.minUploadIntervalSeconds, 5);
      expect(service.policy.maxQueueCapacity, 50);
      expect(service.policy.velocityCapMps, 100);
    });

    testWidgets('7. LocationEnergyDiagnosticsScreen renders KPIs and emergency kill switches', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final energyTracker = LocationEnergyTracker();
      energyTracker.recordUpload(bytes: 1024, currentQueueSize: 4);

      final remoteConfig = LocationRemoteConfigService();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationEnergyTrackerProvider.overrideWithValue(energyTracker),
            locationRemoteConfigServiceProvider.overrideWithValue(remoteConfig),
          ],
          child: const MaterialApp(
            home: LocationEnergyDiagnosticsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify UI sections render
      expect(find.text('Location & Energy Observability'), findsOneWidget);
      expect(find.text('Privacy Invariant: Zero Coordinates Leaked'), findsOneWidget);
      expect(find.text('Remote Config & Emergency Kill Switches'), findsOneWidget);
      expect(find.text('Mobile Location Tracking'), findsOneWidget);
      expect(find.text('Bytes Uploaded'), findsOneWidget);
      expect(find.text('1024 B'), findsOneWidget);

      // Verify toggling kill switch updates state
      await tester.tap(find.widgetWithText(SwitchListTile, 'Mobile Location Tracking'));
      await tester.pumpAndSettle();

      expect(remoteConfig.isMobileTrackingAllowed, false);
    });

    testWidgets('8. Invariant self-check button evaluates clean state cleanly', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final cleanupCoordinator = LocationCleanupCoordinator();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationCleanupCoordinatorProvider.overrideWithValue(cleanupCoordinator),
          ],
          child: const MaterialApp(
            home: LocationEnergyDiagnosticsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      final verifyButton = find.text('Verify All 4 Invariants');
      expect(verifyButton, findsOneWidget);

      await tester.tap(verifyButton);
      await tester.pumpAndSettle();

      expect(find.text('All 4 terminal invariants verified. 0 leaks.'), findsOneWidget);
    });
  });
}
