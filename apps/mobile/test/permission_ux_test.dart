import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/data/models/location_diagnostics.dart';
import 'package:crowdbeats_mobile/data/models/location_fix.dart';
import 'package:crowdbeats_mobile/data/services/location_provider.dart';
import 'package:crowdbeats_mobile/state/location_provider_state.dart';
import 'package:crowdbeats_mobile/ui/location/location_permission_state_view.dart';
import 'package:crowdbeats_mobile/ui/location/accuracy_upgrade_dialog.dart';
import 'package:crowdbeats_mobile/ui/location/location_pre_permission_dialog.dart';
import 'package:crowdbeats_mobile/ui/location/mobile_session_disclosure_dialog.dart';

class _FakeLocationProvider implements LocationProvider {
  _FakeLocationProvider({
    LocationPermissionState initialState = LocationPermissionState.notDetermined,
  }) : currentState = initialState;

  LocationPermissionState currentState;
  int openSettingsCount = 0;
  int requestTemporaryCount = 0;
  int requestFullCount = 0;

  @override
  LocationMode get currentMode => LocationMode.off;

  @override
  Future<bool> isPermissionGranted() async => currentState.isGranted;

  @override
  Future<LocationPermissionResult> requestPermission() async =>
      currentState.isGranted
          ? LocationPermissionResult.granted
          : LocationPermissionResult.denied;

  @override
  Future<LocationPermissionState> getPermissionState() async => currentState;

  @override
  Future<LocationPermissionState> requestFullPermissionState() async {
    requestFullCount++;
    return currentState;
  }

  @override
  Future<bool> requestTemporaryFullAccuracy({required String purposeKey}) async {
    requestTemporaryCount++;
    return true;
  }

  @override
  Future<bool> openSettings() async {
    openSettingsCount++;
    return true;
  }

  @override
  Future<LocationFix?> requestOneShot({
    LocationMode targetMode = LocationMode.discovery,
    Duration timeout = const Duration(seconds: 15),
  }) async => null;

  @override
  Stream<LocationFix> streamContinuous() => const Stream.empty();

  @override
  Future<void> stopContinuous() async {}

  @override
  Future<LocationFix?> cachedFix({Duration maxAge = const Duration(minutes: 5)}) async => null;

  @override
  void cancelCurrentOperation() {}

  @override
  Stream<LocationFix> startAdaptive(LocationMode targetMode) => const Stream.empty();

  @override
  Future<void> stopAdaptive() async {}

  @override
  Stream<GeofenceEvent> monitorGeofence({
    required LocationFix centre,
    required double radiusMeters,
    required String regionId,
  }) => const Stream.empty();

  @override
  Future<void> cancelGeofence(String regionId) async {}

  @override
  LocationDiagnostics get diagnostics => const LocationDiagnostics(
        provider: 'fake',
        mode: 'off',
      );

  @override
  Map<String, Object?> diagnosticsSnapshot() => diagnostics.toJson();
}

void main() {
  group('Phase 3 — Permission UX & 9 Granular States', () {
    test('All 9 LocationPermissionState values expose correct safety properties', () {
      // 1. notDetermined
      expect(LocationPermissionState.notDetermined.isGranted, isFalse);
      expect(LocationPermissionState.notDetermined.canRequestInApp, isTrue);
      expect(LocationPermissionState.notDetermined.requiresSystemSettings, isFalse);

      // 2. servicesDisabled
      expect(LocationPermissionState.servicesDisabled.isGranted, isFalse);
      expect(LocationPermissionState.servicesDisabled.requiresSystemSettings, isTrue);

      // 3. denied
      expect(LocationPermissionState.denied.isGranted, isFalse);
      expect(LocationPermissionState.denied.canRequestInApp, isTrue);

      // 4. permanentlyDenied
      expect(LocationPermissionState.permanentlyDenied.isGranted, isFalse);
      expect(LocationPermissionState.permanentlyDenied.requiresSystemSettings, isTrue);

      // 5. restricted
      expect(LocationPermissionState.restricted.isGranted, isFalse);
      expect(LocationPermissionState.restricted.canRequestInApp, isFalse);

      // 6. foregroundApproximate
      expect(LocationPermissionState.foregroundApproximate.isGranted, isTrue);
      expect(LocationPermissionState.foregroundApproximate.isApproximate, isTrue);
      expect(LocationPermissionState.foregroundApproximate.isPrecise, isFalse);
      expect(LocationPermissionState.foregroundApproximate.isBackground, isFalse);

      // 7. foregroundPrecise
      expect(LocationPermissionState.foregroundPrecise.isGranted, isTrue);
      expect(LocationPermissionState.foregroundPrecise.isPrecise, isTrue);
      expect(LocationPermissionState.foregroundPrecise.isBackground, isFalse);

      // 8. backgroundApproximate
      expect(LocationPermissionState.backgroundApproximate.isGranted, isTrue);
      expect(LocationPermissionState.backgroundApproximate.isApproximate, isTrue);
      expect(LocationPermissionState.backgroundApproximate.isBackground, isTrue);

      // 9. backgroundPrecise
      expect(LocationPermissionState.backgroundPrecise.isGranted, isTrue);
      expect(LocationPermissionState.backgroundPrecise.isPrecise, isTrue);
      expect(LocationPermissionState.backgroundPrecise.isBackground, isTrue);

      for (final state in LocationPermissionState.values) {
        expect(state.label.isNotEmpty, isTrue);
        expect(state.accessibilityDescription.isNotEmpty, isTrue);
      }
    });

    testWidgets('LocationPermissionStateView displays blocked in settings and triggers openSettings', (tester) async {
      final fakeProvider = _FakeLocationProvider(
        initialState: LocationPermissionState.permanentlyDenied,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(fakeProvider),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: LocationPermissionStateView(
                state: LocationPermissionState.permanentlyDenied,
                onOpenSettings: () => fakeProvider.openSettings(),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Blocked in Settings'), findsOneWidget);
      expect(find.text('Open System Settings'), findsOneWidget);

      await tester.tap(find.text('Open System Settings'));
      await tester.pumpAndSettle();

      expect(fakeProvider.openSettingsCount, equals(1));
    });

    testWidgets('LocationPermissionStateView displays foreground approximate with optional precision upgrade', (tester) async {
      final fakeProvider = _FakeLocationProvider(
        initialState: LocationPermissionState.foregroundApproximate,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(fakeProvider),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: LocationPermissionStateView(
                state: LocationPermissionState.foregroundApproximate,
                onRequestPrecisionUpgrade: () => fakeProvider.requestTemporaryFullAccuracy(purposeKey: 'venue_checkin'),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Approximate (While Using)'), findsOneWidget);
      expect(find.text('Upgrade to Precise Accuracy'), findsOneWidget);

      await tester.tap(find.text('Upgrade to Precise Accuracy'));
      await tester.pumpAndSettle();

      expect(fakeProvider.requestTemporaryCount, equals(1));
    });

    testWidgets('AccuracyUpgradeDialog explains 200m venue proximity need and handles user choice', (tester) async {
      final fakeProvider = _FakeLocationProvider();
      bool? dialogResult;

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(fakeProvider),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: Builder(
                builder: (ctx) => ElevatedButton(
                  onPressed: () async {
                    dialogResult = await AccuracyUpgradeDialog.show(
                      ctx,
                      venueName: 'The Roxy Theatre',
                    );
                  },
                  child: const Text('Launch Upgrade'),
                ),
              ),
            ),
          ),
        ),
      );

      // Open dialog
      await tester.tap(find.text('Launch Upgrade'));
      await tester.pumpAndSettle();

      expect(find.text('Precision Needed for Venue'), findsOneWidget);
      expect(find.textContaining('The Roxy Theatre'), findsOneWidget);
      expect(find.textContaining('200 meters'), findsOneWidget);
      expect(find.text('Use Street Mode (Approximate OK)'), findsOneWidget);
      expect(find.text('Allow Precise Once'), findsOneWidget);

      // Choose enable precise
      await tester.tap(find.text('Allow Precise Once'));
      await tester.pumpAndSettle();

      expect(dialogResult, isTrue);
    });

    testWidgets('AccuracyUpgradeDialog user can decline and keep approximate', (tester) async {
      final fakeProvider = _FakeLocationProvider();
      bool? dialogResult;

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(fakeProvider),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: Builder(
                builder: (ctx) => ElevatedButton(
                  onPressed: () async {
                    dialogResult = await AccuracyUpgradeDialog.show(
                      ctx,
                      venueName: 'The Troubadour',
                    );
                  },
                  child: const Text('Launch Upgrade'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Launch Upgrade'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Use Street Mode (Approximate OK)'));
      await tester.pumpAndSettle();

      expect(fakeProvider.requestTemporaryCount, equals(0));
      expect(dialogResult, isFalse);
    });

    testWidgets('LocationPrePermissionDialog provides upfront explanation and immediate sensor shutoff disclosure', (tester) async {
      bool? prePermissionResult;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (ctx) => ElevatedButton(
                onPressed: () async {
                  prePermissionResult = await LocationPrePermissionDialog.show(
                    ctx,
                    isVenue: true,
                    venueName: 'The Wiltern',
                    performerName: 'The Echoes',
                  );
                },
                child: const Text('Show Pre-Permission'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Show Pre-Permission'));
      await tester.pumpAndSettle();

      expect(find.text('Before Going Live'), findsOneWidget);
      expect(find.text('What We Collect'), findsOneWidget);
      expect(find.text('Why We Need It'), findsOneWidget);
      expect(find.text('When Collection Stops'), findsOneWidget);
      expect(find.textContaining('GPS is stopped at once'), findsOneWidget);

      // Cancel
      await tester.tap(find.byKey(const Key('btn_pre_permission_cancel')));
      await tester.pumpAndSettle();

      expect(prePermissionResult, isFalse);
    });

    testWidgets('MobileSessionDisclosureDialog requires explicit creator opt-in for background tracking', (tester) async {
      bool? mobileOptInResult;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (ctx) => ElevatedButton(
                onPressed: () async {
                  mobileOptInResult = await MobileSessionDisclosureDialog.show(ctx);
                },
                child: const Text('Show Mobile Disclosure'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Show Mobile Disclosure'));
      await tester.pumpAndSettle();

      expect(find.text('Mobile Live Session'), findsOneWidget);
      expect(find.text('Background Tracking Needed'), findsOneWidget);
      expect(find.text('Privacy-Preserving Neighborhood Grid'), findsOneWidget);
      expect(find.text('You Are Always in Control'), findsOneWidget);
      expect(find.text('Allow Background & Go Live Mobile'), findsOneWidget);

      // Confirm mobile opt-in
      await tester.tap(find.byKey(const Key('btn_mobile_disclosure_accept')));
      await tester.pumpAndSettle();

      expect(mobileOptInResult, isTrue);
    });
  });
}
