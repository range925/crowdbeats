import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/data/models/location_diagnostics.dart';
import 'package:crowdbeats_mobile/data/models/location_fix.dart';
import 'package:crowdbeats_mobile/data/services/location_provider.dart';
import 'package:crowdbeats_mobile/state/location_provider_state.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/ui/components/cb_context_switcher_pill.dart';
import 'package:crowdbeats_mobile/ui/location/what_fans_will_see_card.dart';
import 'package:crowdbeats_mobile/ui/location/creator_audience_nearby_modal.dart';
import 'package:crowdbeats_mobile/ui/creator/live/live_session_active_view.dart';
import 'package:crowdbeats_mobile/ui/creator/live/live_checkin_sheet.dart';

class _FakeLocationProvider implements LocationProvider {
  _FakeLocationProvider({
    LocationPermissionState initialState = LocationPermissionState.foregroundPrecise,
  }) : currentState = initialState;

  LocationPermissionState currentState;
  int stopContinuousCalls = 0;

  @override
  LocationMode get currentMode => LocationMode.liveStationary;

  @override
  Future<bool> isPermissionGranted() async => true;

  @override
  Future<LocationPermissionResult> requestPermission() async =>
      LocationPermissionResult.granted;

  @override
  Future<LocationPermissionState> getPermissionState() async => currentState;

  @override
  Future<LocationPermissionState> requestFullPermissionState() async => currentState;

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
  Future<void> stopContinuous() async {
    stopContinuousCalls++;
  }

  @override
  Future<LocationFix?> cachedFix({Duration maxAge = const Duration(minutes: 5)}) async => null;

  @override
  void cancelCurrentOperation() {}

  @override
  Stream<LocationFix> startAdaptive(LocationMode targetMode) => const Stream.empty();

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
  LocationDiagnostics get diagnostics => const LocationDiagnostics(
        provider: 'fake',
        mode: 'liveStationary',
      );

  @override
  Map<String, Object?> diagnosticsSnapshot() => diagnostics.toJson();
}

void main() {
  group('Phase 3 — Creator Live Session Controls & Privacy Disclosures', () {
    testWidgets('WhatFansWillSeeCard: renders venue-based stationary explanation', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: WhatFansWillSeeCard(
              isVenue: true,
              venueName: 'The Wiltern',
              venueCityState: 'Los Angeles, CA',
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('WHAT FANS WILL SEE'), findsOneWidget);
      expect(find.text('The Wiltern'), findsOneWidget);
      expect(find.text('Canonical Pin'), findsOneWidget);
      expect(find.textContaining('Public map displays the venue’s verified pin'), findsOneWidget);
      expect(find.textContaining('exact coordinates are never shown'), findsOneWidget);
    });

    testWidgets('WhatFansWillSeeCard: renders coarse ~100m grid centroid explanation for mobile session', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: WhatFansWillSeeCard(
              isVenue: false,
              neighborhoodArea: 'Downtown Arts District (~100m grid cell)',
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('WHAT FANS WILL SEE'), findsOneWidget);
      expect(find.text('Coarse Grid'), findsOneWidget);
      expect(find.text('Downtown Arts District (~100m grid cell)'), findsOneWidget);
      expect(find.textContaining('Public map shows a rounded neighborhood zone centroid'), findsOneWidget);
      expect(find.textContaining('Device GPS, speed, and heading are never shared'), findsOneWidget);
    });

    testWidgets('CreatorAudienceNearbyModal: explains 5-fan threshold for aggregate demand vs individual opt-in', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (ctx) => ElevatedButton(
                onPressed: () => CreatorAudienceNearbyModal.show(ctx),
                child: const Text('Open Modal'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      expect(find.text('How Audience Nearby Works'), findsOneWidget);
      expect(find.text('Aggregate Crowd Radar (Demand)'), findsOneWidget);
      expect(find.textContaining('zones appear only when at least 5 fans are present'), findsOneWidget);
      expect(find.text('Individually Opted-In Supporters'), findsOneWidget);
      expect(find.textContaining('Supporters who appear with name and avatar have explicitly chosen'), findsOneWidget);
      expect(find.textContaining('Near Me searches, tipping, following, and attending do NOT share location'), findsOneWidget);
    });

    testWidgets('LiveSessionActiveView: displays session controls, pause/resume sharing, and audience nearby info', (tester) async {
      final fakeProvider = _FakeLocationProvider();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(fakeProvider),
            creatorContextProvider.overrideWith(
              (ref) => CreatorContextNotifier(
                initialContext: const CreatorContextItem(
                  id: 'c1',
                  name: 'The Echoes',
                  type: 'solo',
                  role: 'SOLO_ARTIST',
                ),
              ),
            ),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: LiveSessionActiveView(),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('STAGE LIVE'), findsOneWidget);
      expect(find.text('The Echoes'), findsOneWidget);
      expect(find.text('LOCATION & PRIVACY CONTROLS'), findsOneWidget);
      expect(find.byKey(const Key('btn_audience_nearby_info')), findsOneWidget);
      expect(find.byKey(const Key('btn_toggle_mobile_sharing')), findsOneWidget);
      expect(find.byKey(const Key('btn_change_privacy_mode')), findsOneWidget);
      expect(find.byKey(const Key('btn_view_location_explanation')), findsOneWidget);
      expect(find.byKey(const Key('btn_open_device_settings')), findsOneWidget);

      // Tap Pause Mobile Sharing
      await tester.tap(find.byKey(const Key('btn_toggle_mobile_sharing')));
      await tester.pumpAndSettle();

      expect(fakeProvider.stopContinuousCalls, equals(1));
      expect(find.text('Resume Mobile GPS'), findsOneWidget);

      // Open Audience Nearby modal
      await tester.tap(find.byKey(const Key('btn_audience_nearby_info')));
      await tester.pumpAndSettle();

      expect(find.text('How Audience Nearby Works'), findsOneWidget);
    });

    testWidgets('LiveCheckinSheet: blocks unauthorized band member from checking in', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(_FakeLocationProvider()),
            creatorContextProvider.overrideWith(
              (ref) => CreatorContextNotifier(
                initialContext: const CreatorContextItem(
                  id: 'band_1',
                  name: 'Rock Collective',
                  type: 'band',
                  role: 'BAND_MEMBER', // Non-admin band member
                ),
              ),
            ),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: LiveCheckinSheet(),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify warning message is displayed
      expect(find.text('Only the Band Founder or Admin can start live sessions for this band.'), findsOneWidget);

      // Verify Start button is disabled
      final btnFinder = find.widgetWithText(ElevatedButton, 'Go Live & Broadcast');
      expect(btnFinder, findsOneWidget);
      final btn = tester.widget<ElevatedButton>(btnFinder);
      expect(btn.onPressed, isNull);
    });
  });
}
