// Crowdbeats V2 — LocationProvider Unit Tests (Phase A)
//
// Verifies the LocationProvider interface contract using a MockLocationProvider
// injected via Riverpod's ProviderScope.overrides.
//
// These tests run in the plain dart test runner — no Flutter widget harness.
//
// Invariants verified:
// 1. requestOneShot() is called at most once per useMyLocation() invocation.
// 2. requestOneShot() returns null on permission denial → state unchanged.
// 3. isLocating transitions: false → true → false.
// 4. locationMode transitions: off → discovery on successful fix.
// 5. streamContinuous() is NEVER called by the discovery flow.
// 6. LocationFix.toString() never contains the exact latitude or longitude.
// 7. A second useMyLocation() call snaps to cached deviceLocation without GPS.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:crowdbeats_mobile/data/models/location_diagnostics.dart';
import 'package:crowdbeats_mobile/data/models/location_fix.dart';
import 'package:crowdbeats_mobile/data/services/location_provider.dart';
import 'package:crowdbeats_mobile/state/location_provider_state.dart';
import 'package:crowdbeats_mobile/state/discovery_state.dart';

// ── Mock LocationProvider ─────────────────────────────────────────────────────

class MockLocationProvider implements LocationProvider {
  MockLocationProvider({
    this.fixToReturn,
    this.permissionResult = LocationPermissionResult.granted,
    this.initialPermissionGranted = true,
    this.permissionState = LocationPermissionState.foregroundPrecise,
  });

  final LocationFix? fixToReturn;
  final LocationPermissionResult permissionResult;
  final bool initialPermissionGranted;
  LocationPermissionState permissionState;

  int oneShotCallCount = 0;
  int continuousCallCount = 0;
  LocationMode _mode = LocationMode.off;

  @override
  LocationMode get currentMode => _mode;

  @override
  Future<bool> isPermissionGranted() async => initialPermissionGranted;

  @override
  Future<LocationPermissionResult> requestPermission() async => permissionResult;

  @override
  Future<LocationPermissionState> getPermissionState() async => permissionState;

  @override
  Future<LocationPermissionState> requestFullPermissionState() async => permissionState;

  @override
  Future<bool> requestTemporaryFullAccuracy({required String purposeKey}) async => true;

  @override
  Future<bool> openSettings() async => true;

  @override
  Future<LocationFix?> requestOneShot({
    LocationMode targetMode = LocationMode.discovery,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    oneShotCallCount++;
    if (fixToReturn != null) {
      _mode = targetMode;
    }
    return fixToReturn;
  }

  @override
  Stream<LocationFix> streamContinuous() {
    continuousCallCount++;
    return const Stream.empty();
  }

  @override
  Future<void> stopContinuous() async {
    _mode = LocationMode.liveStationary;
  }

  @override
  Future<LocationFix?> cachedFix({Duration maxAge = const Duration(minutes: 5)}) async => fixToReturn;

  @override
  void cancelCurrentOperation() {}

  @override
  Stream<LocationFix> startAdaptive(LocationMode targetMode) {
    _mode = targetMode;
    return const Stream.empty();
  }

  @override
  Future<void> stopAdaptive() => stopContinuous();

  @override
  Stream<GeofenceEvent> monitorGeofence({
    required LocationFix centre,
    required double radiusMeters,
    required String regionId,
  }) => const Stream.empty();

  @override
  Future<void> cancelGeofence(String regionId) async {}

  @override
  LocationDiagnostics get diagnostics => LocationDiagnostics(
        provider: 'mock',
        mode: _mode.name,
      );

  @override
  Map<String, Object?> diagnosticsSnapshot() => diagnostics.toJson();
}

// ── Helpers ────────────────────────────────────────────────────────────────────

ProviderContainer _makeContainer(MockLocationProvider mock) {
  return ProviderContainer(
    overrides: [
      locationProviderProvider.overrideWithValue(mock),
    ],
  );
}

// Shared test fixture — not const since DateTime is not const-constructible.
final _realFix = LocationFix(
  latitude: 32.7157,
  longitude: -117.1611,
  accuracyMeters: 8,
  timestamp: DateTime.fromMillisecondsSinceEpoch(0),
  isMock: false,
);

// ── Tests ─────────────────────────────────────────────────────────────────────

void main() {
  group('LocationFix', () {
    test('toString() does not contain exact latitude', () {
      final fix = LocationFix(
        latitude: 32.715678,
        longitude: -117.16110,
        accuracyMeters: 10,
        timestamp: DateTime.now(),
      );
      final str = fix.toString();
      // Exact lat should NOT appear; only ±0.1° bucket
      expect(str.contains('32.715678'), isFalse);
      expect(str.contains('-117.1611'), isFalse);
      // Bucket values should appear
      expect(str.contains('32.7'), isTrue);
      expect(str.contains('-117.2'), isTrue);
    });

    test('isFreshFor() returns true for fresh fix', () {
      final fix = LocationFix(
        latitude: 0,
        longitude: 0,
        accuracyMeters: 5,
        timestamp: DateTime.now().subtract(const Duration(seconds: 30)),
      );
      expect(fix.isFreshFor(const Duration(minutes: 5)), isTrue);
    });

    test('isFreshFor() returns false for stale fix', () {
      final fix = LocationFix(
        latitude: 0,
        longitude: 0,
        accuracyMeters: 5,
        timestamp: DateTime.now().subtract(const Duration(minutes: 10)),
      );
      expect(fix.isFreshFor(const Duration(minutes: 5)), isFalse);
    });
  });

  group('DiscoveryNotifier — Near Me location flow', () {
    test('requestNearMeLocation sets isLocating=false after completion', () async {
      final mock = MockLocationProvider(fixToReturn: _realFix);
      final container = _makeContainer(mock);
      addTearDown(container.dispose);

      final notifier = container.read(discoveryProvider.notifier);

      await notifier.requestNearMeLocation();

      final s = container.read(discoveryProvider);
      expect(s.isLocating, isFalse);
    });

    test('requestNearMeLocation calls GPS exactly once', () async {
      final mock = MockLocationProvider(fixToReturn: _realFix);
      final container = _makeContainer(mock);
      addTearDown(container.dispose);

      await container.read(discoveryProvider.notifier).requestNearMeLocation();

      expect(mock.oneShotCallCount, equals(1));
    });

    test('requestNearMeLocation sets locationMode=discovery on success', () async {
      final mock = MockLocationProvider(fixToReturn: _realFix);
      final container = _makeContainer(mock);
      addTearDown(container.dispose);

      await container.read(discoveryProvider.notifier).requestNearMeLocation();

      expect(container.read(discoveryProvider).locationMode, equals(LocationMode.discovery));
    });

    test('requestNearMeLocation leaves locationMode=off when GPS returns null', () async {
      final mock = MockLocationProvider(fixToReturn: null);
      final container = _makeContainer(mock);
      addTearDown(container.dispose);

      await container.read(discoveryProvider.notifier).requestNearMeLocation();

      final s = container.read(discoveryProvider);
      expect(s.locationMode, equals(LocationMode.off));
      expect(s.isLocating, isFalse);
    });

    test('second useMyLocation() call snaps to cache — no additional GPS request', () async {
      final mock = MockLocationProvider(fixToReturn: _realFix);
      final container = _makeContainer(mock);
      addTearDown(container.dispose);

      final notifier = container.read(discoveryProvider.notifier);

      // First call — GPS request
      await notifier.useMyLocation();
      expect(mock.oneShotCallCount, equals(1));

      // Second call — must use cached fix, no new GPS
      await notifier.useMyLocation();
      expect(mock.oneShotCallCount, equals(1)); // still 1, not 2
    });

    test('streamContinuous is NEVER called by discovery flow', () async {
      final mock = MockLocationProvider(fixToReturn: _realFix);
      final container = _makeContainer(mock);
      addTearDown(container.dispose);

      await container.read(discoveryProvider.notifier).requestNearMeLocation();
      await container.read(discoveryProvider.notifier).useMyLocation();

      expect(mock.continuousCallCount, equals(0));
    });

    test('concurrent requestNearMeLocation calls are de-duplicated', () async {
      final mock = MockLocationProvider(fixToReturn: _realFix);
      final container = _makeContainer(mock);
      addTearDown(container.dispose);

      final notifier = container.read(discoveryProvider.notifier);

      // Fire two concurrent calls
      await Future.wait([
        notifier.requestNearMeLocation(),
        notifier.requestNearMeLocation(),
      ]);

      // Only one GPS call should have been made (second was dropped by isLocating guard)
      expect(mock.oneShotCallCount, equals(1));
    });

    test('discoveryLocation updates to device coordinates on successful fix', () async {
      final mock = MockLocationProvider(fixToReturn: _realFix);
      final container = _makeContainer(mock);
      addTearDown(container.dispose);

      await container.read(discoveryProvider.notifier).requestNearMeLocation();

      final s = container.read(discoveryProvider);
      expect(s.discoveryLocation.latitude, closeTo(32.7157, 0.001));
      expect(s.discoveryLocation.longitude, closeTo(-117.1611, 0.001));
      expect(s.deviceLocation, isNotNull);
    });

    test('discoveryLocation unchanged when fix returns null', () async {
      final mock = MockLocationProvider(fixToReturn: null);
      final container = _makeContainer(mock);
      addTearDown(container.dispose);

      final before = container.read(discoveryProvider).discoveryLocation;
      await container.read(discoveryProvider.notifier).requestNearMeLocation();
      final after = container.read(discoveryProvider).discoveryLocation;

      expect(after.placeId, equals(before.placeId));
    });
  });

  group('MockLocationProvider — interface contract', () {
    test('isPermissionGranted returns expected value', () async {
      final mock = MockLocationProvider(initialPermissionGranted: false);
      expect(await mock.isPermissionGranted(), isFalse);
    });

    test('requestPermission returns expected result', () async {
      final mock = MockLocationProvider(
        permissionResult: LocationPermissionResult.permanentlyDenied,
      );
      expect(
        await mock.requestPermission(),
        equals(LocationPermissionResult.permanentlyDenied),
      );
    });

    test('currentMode starts at off', () {
      final mock = MockLocationProvider();
      expect(mock.currentMode, equals(LocationMode.off));
    });

    test('currentMode becomes discovery after successful requestOneShot', () async {
      final mock = MockLocationProvider(fixToReturn: _realFix);
      await mock.requestOneShot(targetMode: LocationMode.discovery);
      expect(mock.currentMode, equals(LocationMode.discovery));
    });

    test('currentMode stays off when requestOneShot returns null', () async {
      final mock = MockLocationProvider(fixToReturn: null);
      await mock.requestOneShot();
      expect(mock.currentMode, equals(LocationMode.off));
    });
  });
}
