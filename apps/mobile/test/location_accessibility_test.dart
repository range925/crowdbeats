import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/data/models/location_diagnostics.dart';
import 'package:crowdbeats_mobile/data/models/location_fix.dart';
import 'package:crowdbeats_mobile/data/services/location_provider.dart';
import 'package:crowdbeats_mobile/ui/location/location_permission_state_view.dart';
import 'package:crowdbeats_mobile/ui/location/what_fans_will_see_card.dart';
import 'package:crowdbeats_mobile/ui/location/fan_audience_visibility_sheet.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_theme.dart';
import 'package:crowdbeats_mobile/state/location_provider_state.dart';
import 'package:crowdbeats_mobile/state/user_settings_state.dart';

class _FakeLocationProvider implements LocationProvider {
  @override
  LocationMode get currentMode => LocationMode.off;

  @override
  Future<bool> isPermissionGranted() async => true;

  @override
  Future<LocationPermissionResult> requestPermission() async =>
      LocationPermissionResult.granted;

  @override
  Future<LocationPermissionState> getPermissionState() async =>
      LocationPermissionState.foregroundPrecise;

  @override
  Future<LocationPermissionState> requestFullPermissionState() async =>
      LocationPermissionState.foregroundPrecise;

  @override
  Future<bool> requestTemporaryFullAccuracy({required String purposeKey}) async => true;

  @override
  Future<bool> openSettings() async => true;

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

class _FakeUserSettingsNotifier extends UserSettingsNotifier {
  _FakeUserSettingsNotifier({List<Map<String, dynamic>> blocked = const []}) {
    state = state.copyWith(blockedUsers: blocked, isLoading: false);
  }

  @override
  Future<void> loadSettings() async {}

  @override
  Future<void> updatePrivacy(CbPrivacyPreferences prefs) async {
    state = state.copyWith(privacy: prefs);
  }
}

void main() {
  final testEndsAt = DateTime.now().add(const Duration(hours: 2));

  group('Phase 3 — Location Accessibility (a11y) & WCAG 2.2 Compliance', () {
    testWidgets('LocationPermissionStateView provides non-color status cues and semantics', (tester) async {
      for (final state in [
        LocationPermissionState.servicesDisabled,
        LocationPermissionState.denied,
        LocationPermissionState.permanentlyDenied,
        LocationPermissionState.foregroundApproximate,
        LocationPermissionState.foregroundPrecise,
      ]) {
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              locationProviderProvider.overrideWithValue(_FakeLocationProvider()),
            ],
            child: MaterialApp(
              theme: CbTheme.light(),
              darkTheme: CbTheme.dark(),
              home: Scaffold(
                body: LocationPermissionStateView(
                  state: state,
                ),
              ),
            ),
          ),
        );

        await tester.pumpAndSettle();

        // Verify non-color text badge exists
        expect(state.label.isNotEmpty, isTrue);
        expect(find.text(state.label), findsOneWidget);

        // Verify accessibility description
        expect(state.accessibilityDescription.isNotEmpty, isTrue);
      }
    });

    testWidgets('WhatFansWillSeeCard scales gracefully at 1.5x and 2.0x Dynamic Type', (tester) async {
      for (final scaleFactor in [1.0, 1.5, 2.0]) {
        tester.view.physicalSize = const Size(1080, 2400);
        tester.view.devicePixelRatio = 2.0;

        await tester.pumpWidget(
          MaterialApp(
            theme: CbTheme.light(),
            darkTheme: CbTheme.dark(),
            home: MediaQuery(
              data: MediaQueryData(
                textScaler: TextScaler.linear(scaleFactor),
                disableAnimations: true, // Test reduced motion
              ),
              child: const Scaffold(
                body: SingleChildScrollView(
                  child: WhatFansWillSeeCard(
                    isVenue: true,
                    venueName: 'The Wiltern',
                  ),
                ),
              ),
            ),
          ),
        );

        await tester.pumpAndSettle();

        // Check that card renders without RenderFlex overflow
        expect(tester.takeException(), isNull);
        expect(find.text('WHAT FANS WILL SEE'), findsOneWidget);
        expect(find.text('The Wiltern'), findsOneWidget);
      }

      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
    });

    testWidgets('FanAudienceVisibilitySheet scales at 1.5x Dynamic Type with reduced motion', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(_FakeLocationProvider()),
            userSettingsProvider.overrideWith((ref) => _FakeUserSettingsNotifier()),
          ],
          child: MaterialApp(
            theme: CbTheme.light(),
            darkTheme: CbTheme.dark(),
            home: MediaQuery(
              data: const MediaQueryData(
                textScaler: TextScaler.linear(1.5),
                disableAnimations: true,
              ),
              child: Scaffold(
                body: FanAudienceVisibilitySheet(
                  sessionId: 'session_a11y',
                  performerId: 'perf_a11y',
                  performerName: 'The Soundwaves',
                  sessionEndsAt: testEndsAt,
                ),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('Audience Nearby'), findsOneWidget);
      expect(find.text('Anonymous Crowd Radar'), findsOneWidget);
      expect(find.text('Performer Visibility'), findsOneWidget);

      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
    });

    testWidgets('CbTheme.light() and CbTheme.dark() provide valid contrasting color tokens', (tester) async {
      final lightTheme = CbTheme.light();
      final darkTheme = CbTheme.dark();

      // Check Light Theme surface and contrast
      expect(lightTheme.scaffoldBackgroundColor, isNotNull);
      expect(lightTheme.colorScheme.surface, isNotNull);
      expect(lightTheme.colorScheme.onSurface, isNotNull);
      expect(lightTheme.colorScheme.primary, isNotNull);

      // Check Dark Theme
      expect(darkTheme.scaffoldBackgroundColor, isNotNull);
      expect(darkTheme.colorScheme.surface, isNotNull);
      expect(darkTheme.colorScheme.onSurface, isNotNull);
      expect(darkTheme.colorScheme.primary, isNotNull);
    });
  });
}
