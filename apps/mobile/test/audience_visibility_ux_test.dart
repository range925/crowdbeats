import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/data/models/live_location.dart';
import 'package:crowdbeats_mobile/data/models/location_diagnostics.dart';
import 'package:crowdbeats_mobile/data/models/location_fix.dart';
import 'package:crowdbeats_mobile/data/services/location_provider.dart';
import 'package:crowdbeats_mobile/state/audience_visibility_state.dart';
import 'package:crowdbeats_mobile/state/user_settings_state.dart';
import 'package:crowdbeats_mobile/state/location_provider_state.dart';
import 'package:crowdbeats_mobile/ui/location/fan_audience_visibility_sheet.dart';

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

  group('Phase 3 — Fan Audience Visibility & Privacy Controls', () {
    testWidgets('FanAudienceVisibilitySheet: starts with neither option pre-selected and submit disabled', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(_FakeLocationProvider()),
            userSettingsProvider.overrideWith((ref) => _FakeUserSettingsNotifier()),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: FanAudienceVisibilitySheet(
                sessionId: 'session_123',
                performerId: 'perf_abc',
                performerName: 'The Echo Wave',
                sessionEndsAt: testEndsAt,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Audience Nearby'), findsOneWidget);
      expect(find.text('Anonymous Crowd Radar'), findsOneWidget);
      expect(find.text('Performer Visibility'), findsOneWidget);

      // Confirm button is disabled and displays prompt
      final confirmBtnFinder = find.byKey(const Key('btn_activate_visibility'));
      expect(confirmBtnFinder, findsOneWidget);
      expect(find.text('Select an Option Above'), findsOneWidget);
      final confirmBtn = tester.widget<ElevatedButton>(confirmBtnFinder);
      expect(confirmBtn.onPressed, isNull);
    });

    testWidgets('FanAudienceVisibilitySheet: selecting Anonymous Crowd Radar enables submission', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(_FakeLocationProvider()),
            userSettingsProvider.overrideWith((ref) => _FakeUserSettingsNotifier()),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: FanAudienceVisibilitySheet(
                sessionId: 'session_123',
                performerId: 'perf_abc',
                performerName: 'The Echo Wave',
                sessionEndsAt: testEndsAt,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap Anonymous Crowd Radar
      await tester.tap(find.byKey(const Key('choice_tier_aggregate')));
      await tester.pumpAndSettle();

      final confirmBtnFinder = find.byKey(const Key('btn_activate_visibility'));
      expect(find.text('Share Visibility for This Show'), findsOneWidget);
      final confirmBtn = tester.widget<ElevatedButton>(confirmBtnFinder);
      expect(confirmBtn.onPressed, isNotNull);
    });

    testWidgets('FanAudienceVisibilitySheet: selecting Performer Visibility shows coarse distance band description', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(_FakeLocationProvider()),
            userSettingsProvider.overrideWith((ref) => _FakeUserSettingsNotifier()),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: FanAudienceVisibilitySheet(
                sessionId: 'session_123',
                performerId: 'perf_abc',
                performerName: 'The Echo Wave',
                sessionEndsAt: testEndsAt,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap Performer Visibility
      await tester.tap(find.byKey(const Key('choice_tier_individual')));
      await tester.pumpAndSettle();

      expect(find.textContaining('coarse distance band (~500m) is shared'), findsOneWidget);
      expect(find.text('Share Visibility for This Show'), findsOneWidget);
    });

    testWidgets('FanAudienceVisibilitySheet: Stop Sharing button immediately revokes active grant', (tester) async {
      final container = ProviderContainer(
        overrides: [
          locationProviderProvider.overrideWithValue(_FakeLocationProvider()),
          userSettingsProvider.overrideWith((ref) => _FakeUserSettingsNotifier()),
        ],
      );

      // Pre-grant visibility for session_123
      await container.read(audienceVisibilityProvider.notifier).optIn(
            sessionId: 'session_123',
            performerId: 'perf_abc',
            performerName: 'The Echo Wave',
            tier: AudienceConsentTier.individualSession,
            expiresAt: testEndsAt,
          );

      expect(container.read(audienceVisibilityProvider).hasActiveVisibility, isTrue);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: Scaffold(
              body: FanAudienceVisibilitySheet(
                sessionId: 'session_123',
                performerId: 'perf_abc',
                performerName: 'The Echo Wave',
                sessionEndsAt: testEndsAt,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('ACTIVELY SHARING VISIBILITY'), findsOneWidget);
      expect(find.text('Stop Sharing Location'), findsOneWidget);

      await tester.tap(find.byKey(const Key('btn_stop_sharing_visibility')));
      await tester.pumpAndSettle();

      final state = container.read(audienceVisibilityProvider);
      expect(state.activeGrant, isNull);
      expect(state.hasActiveVisibility, isFalse);
    });

    testWidgets('Stealth Mode blocks sharing and informs user', (tester) async {
      final container = ProviderContainer(
        overrides: [
          locationProviderProvider.overrideWithValue(_FakeLocationProvider()),
          userSettingsProvider.overrideWith((ref) => _FakeUserSettingsNotifier()),
        ],
      );

      // Enable Stealth Mode
      container.read(audienceVisibilityProvider.notifier).setStealthMode(true);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: Scaffold(
              body: FanAudienceVisibilitySheet(
                sessionId: 'session_123',
                performerId: 'perf_abc',
                performerName: 'The Echo Wave',
                sessionEndsAt: testEndsAt,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.textContaining('Stealth Mode ("Hide me from performers") is active in Settings'), findsOneWidget);
    });

    testWidgets('Blocked performer check blocks audience visibility grant', (tester) async {
      final container = ProviderContainer(
        overrides: [
          locationProviderProvider.overrideWithValue(_FakeLocationProvider()),
          userSettingsProvider.overrideWith(
            (ref) => _FakeUserSettingsNotifier(
              blocked: [
                {
                  'id': 'perf_blocked',
                  'userId': 'perf_blocked',
                  'displayName': 'Blocked Artist',
                },
              ],
            ),
          ),
        ],
      );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: Scaffold(
              body: FanAudienceVisibilitySheet(
                sessionId: 'session_blocked',
                performerId: 'perf_blocked',
                performerName: 'Blocked Artist',
                sessionEndsAt: testEndsAt,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.textContaining('You have blocked Blocked Artist. Location sharing is disabled.'), findsOneWidget);
    });

    test('Tipping does not create an audience visibility grant or share location', () {
      final container = ProviderContainer(
        overrides: [
          locationProviderProvider.overrideWithValue(_FakeLocationProvider()),
          userSettingsProvider.overrideWith((ref) => _FakeUserSettingsNotifier()),
        ],
      );

      final state = container.read(audienceVisibilityProvider);
      expect(state.activeGrant, isNull);
      expect(state.hasActiveVisibility, isFalse);
      expect(state.consentHistory.isEmpty, isTrue);
    });
  });
}
