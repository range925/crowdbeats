import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/state/discovery_state.dart';
import 'package:crowdbeats_mobile/data/models/discovery.dart';
import 'package:crowdbeats_mobile/data/models/location_diagnostics.dart';
import 'package:crowdbeats_mobile/data/models/location_fix.dart';
import 'package:crowdbeats_mobile/data/services/location_provider.dart';
import 'package:crowdbeats_mobile/data/services/active_subscription_tracker.dart';
import 'package:crowdbeats_mobile/state/location_provider_state.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/ui/fan/tabs/nearby_tab.dart';
import 'package:crowdbeats_mobile/ui/creator/live/creator_crowd_radar_screen.dart';

class _TestHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context);
  }
}

class _TrackingLocationProvider implements LocationProvider {
  int oneShotCalls = 0;
  int cancelCalls = 0;
  LocationMode _mode = LocationMode.off;

  @override
  LocationMode get currentMode => _mode;

  @override
  Future<bool> isPermissionGranted() async => false;

  @override
  Future<LocationPermissionResult> requestPermission() async =>
      LocationPermissionResult.denied;

  @override
  Future<LocationFix?> requestOneShot({
    LocationMode targetMode = LocationMode.discovery,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    oneShotCalls++;
    _mode = targetMode;
    return LocationFix(
      latitude: 33.8358,
      longitude: -118.3406,
      accuracyMeters: 10.0,
      timestamp: DateTime.now(),
    );
  }

  @override
  void cancelCurrentOperation() {
    cancelCalls++;
    _mode = LocationMode.off;
  }

  @override
  Future<LocationPermissionState> getPermissionState() async =>
      LocationPermissionState.notDetermined;

  @override
  Future<LocationPermissionState> requestFullPermissionState() async =>
      LocationPermissionState.denied;

  @override
  Future<bool> requestTemporaryFullAccuracy({required String purposeKey}) async => false;

  @override
  Future<bool> openSettings() async => true;

  @override
  Stream<LocationFix> streamContinuous() => const Stream.empty();

  @override
  Future<void> stopContinuous() async {
    _mode = LocationMode.off;
  }

  @override
  Future<LocationFix?> cachedFix({Duration maxAge = const Duration(minutes: 5)}) async => null;

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
        provider: 'tracking',
        mode: 'off',
      );

  @override
  Map<String, Object?> diagnosticsSnapshot() => diagnostics.toJson();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = _TestHttpOverrides();

  group('Phase 8 — Two-Way, Battery- and Cost-Efficient Discovery (Mobile Tests)', () {
    test('1. City search works with location denied and zero GPS requests', () {
      final mockProvider = _TrackingLocationProvider();
      final tracker = ActiveSubscriptionTracker();
      final notifier = DiscoveryNotifier(mockProvider, tracker);

      expect(mockProvider.oneShotCalls, 0);

      // Search Torrance
      notifier.onLocationSearchInput('Torrance');
      final suggestions = notifier.state.autocompleteSuggestions;
      expect(suggestions.any((s) => s.city == 'Torrance'), true);

      // Select Torrance
      notifier.selectSearchedLocation(DiscoveryLocation.torrance);
      expect(notifier.state.discoveryLocation.city, 'Torrance');
      expect(notifier.state.isSearchAreaMode, true);

      // Zero GPS provider calls occurred
      expect(mockProvider.oneShotCalls, 0);
      notifier.dispose();
    });

    test('2. One-shot Near Me stops correctly and resets sensor', () async {
      final mockProvider = _TrackingLocationProvider();
      final tracker = ActiveSubscriptionTracker();
      final notifier = DiscoveryNotifier(mockProvider, tracker);

      await notifier.requestNearMeLocation();

      expect(mockProvider.oneShotCalls, 1);
      expect(mockProvider.cancelCalls, 1);
      expect(notifier.state.isLocating, false);
      expect(mockProvider.currentMode, LocationMode.off);
      notifier.dispose();
    });

    test('3. Viewport debounce, query caps, and overlapping geohash deduplication', () async {
      final mockProvider = _TrackingLocationProvider();
      final tracker = ActiveSubscriptionTracker();
      final notifier = DiscoveryNotifier(mockProvider, tracker);

      // Trigger viewport pan
      notifier.onViewportChanged(
        minLat: 33.80,
        maxLat: 33.86,
        minLng: -118.38,
        maxLng: -118.30,
      );
      expect(notifier.state.isDebouncing, true);

      // Wait for 300ms debounce
      await Future<void>.delayed(const Duration(milliseconds: 350));
      expect(notifier.state.isDebouncing, false);

      // Deduplication check: duplicate Jake Rios entries are collapsed to 1
      final performers = notifier.state.performers;
      final ids = performers.map((p) => p.id).toList();
      final uniqueIds = ids.toSet();
      expect(ids.length, uniqueIds.length);
      expect(notifier.state.deduplicatedCount, greaterThanOrEqualTo(1));

      // Radius cap: maxDiscoveryRadiusMiles is 50.0
      expect(DiscoveryNotifier.maxDiscoveryRadiusMiles, 50.0);
      expect(DiscoveryNotifier.maxGeohashCells, 9);
      expect(DiscoveryNotifier.maxResultsLimit, 50);

      notifier.dispose();
    });

    test('4. 2-minute memory cache reuses previous results without re-reading', () {
      final mockProvider = _TrackingLocationProvider();
      final tracker = ActiveSubscriptionTracker();
      final notifier = DiscoveryNotifier(mockProvider, tracker);

      final initialCacheHits = notifier.state.cacheHitsCount;

      // Requesting the exact same location reuses 2-minute memory cache
      notifier.selectSearchedLocation(DiscoveryLocation.sanDiego);
      expect(notifier.state.cacheHitsCount, initialCacheHits + 1);
      expect(tracker.cacheHits, 1);

      notifier.dispose();
    });

    test('5. Lifecycle listener cleanup on background and resume', () {
      final mockProvider = _TrackingLocationProvider();
      final tracker = ActiveSubscriptionTracker();
      final notifier = DiscoveryNotifier(mockProvider, tracker);

      expect(notifier.state.activeSubscriptions, 1);
      expect(tracker.activeSubscriptions, 1);

      // App backgrounded
      notifier.pauseForBackground();
      expect(notifier.state.activeSubscriptions, 0);
      expect(notifier.state.isLifecyclePaused, true);
      expect(tracker.activeSubscriptions, 0);

      // App resumed
      notifier.resumeFromBackground();
      expect(notifier.state.activeSubscriptions, 1);
      expect(notifier.state.isLifecyclePaused, false);
      expect(tracker.activeSubscriptions, 1);

      notifier.dispose();
      expect(tracker.activeSubscriptions, 0);
    });

    test('6. Expired / stale transitions: ended sessions disappear immediately', () {
      final mockProvider = _TrackingLocationProvider();
      final tracker = ActiveSubscriptionTracker();
      final notifier = DiscoveryNotifier(mockProvider, tracker);

      // luna_causey_4 has timeRemaining = 'Ended'
      final hasEndedSession = notifier.state.performers.any((p) => p.id == 'luna_causey_4');
      expect(hasEndedSession, false); // Successfully filtered out

      notifier.dispose();
    });

    test('7. Map and List consistency: share single unified stream and state', () {
      final mockProvider = _TrackingLocationProvider();
      final tracker = ActiveSubscriptionTracker();
      final notifier = DiscoveryNotifier(mockProvider, tracker);

      // Both map markers and list items read from notifier.state.performers
      final performers = notifier.state.performers;
      expect(performers.isNotEmpty, true);
      expect(notifier.state.selectedPerformer?.id, performers.first.id);

      notifier.dispose();
    });

    testWidgets('8. Guest vs authenticated tipping gate on Nearby Tab', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(_TrackingLocationProvider()),
          ],
          child: const MaterialApp(
            home: NearbyTab(),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Switch to list view to find Performer Card
      await tester.tap(find.text('List'));
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Tip'), findsWidgets);
      expect(find.text('View Profile'), findsWidgets);

      // Tapping Tip as Guest opens TipAuthGateModal (Sign in required)
      await tester.tap(find.text('Tip').first);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // Verify sign-in gate modal appears
      expect(find.textContaining('Sign in to tip'), findsOneWidget);
      expect(find.text('Continue with Google'), findsOneWidget);
    });

    testWidgets('9. Solo/Band authorization for Crowd Radar and denial for unauthorized', (tester) async {
      // Scenario A: Unauthorized (no active session)
      await tester.pumpWidget(
        ProviderScope(
          child: const MaterialApp(
            home: CreatorCrowdRadarScreen(
              testIsLive: false,
              testSessionId: null,
              testRole: 'fan',
            ),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Active Stage Session Required'), findsOneWidget);

      // Scenario B: Authorized Solo Artist with active session
      await tester.pumpWidget(
        ProviderScope(
          child: const MaterialApp(
            home: CreatorCrowdRadarScreen(
              testIsLive: true,
              testSessionId: 'session_live_123',
              testRole: 'artist',
            ),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Audience Nearby / Crowd Radar'), findsOneWidget);
      expect(find.text('Privacy-Safe Demand Signals'), findsOneWidget);
      expect(find.text('Aggregate Crowd Zones'), findsOneWidget);
      expect(find.text('Visible Supporters Nearby'), findsOneWidget);
    });

    testWidgets('10. Aggregation threshold (k >= 5) and count bands on Crowd Radar', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: const MaterialApp(
            home: CreatorCrowdRadarScreen(
              testIsLive: true,
              testSessionId: 'session_live_123',
              testRole: 'artist',
            ),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Check k >= 5 count bands
      expect(find.text('[15+] supporters'), findsOneWidget);
      expect(find.text('[5-14] supporters'), findsOneWidget);
      expect(find.text('Min 5 fans/zone'), findsOneWidget);
    });

    testWidgets('11. Opt-in supporter visibility and stage shoutout broadcast', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        ProviderScope(
          child: const MaterialApp(
            home: CreatorCrowdRadarScreen(
              testIsLive: true,
              testSessionId: 'session_live_123',
              testRole: 'artist',
            ),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Sarah K.'), findsOneWidget);
      expect(find.text('Marcus V.'), findsOneWidget);
      expect(find.text('~100m away (Front Lawn)'), findsOneWidget);

      // Tap Stage Shoutout
      await tester.tap(find.text('Send Stage Shoutout to Nearby Crowd'));
      await tester.pumpAndSettle();

      expect(find.text('Stage Shoutout'), findsOneWidget);
      expect(find.text('Broadcast'), findsOneWidget);
    });

    testWidgets('12. Responsive tablet/desktop split view renders at width >= 768', (tester) async {
      tester.view.physicalSize = const Size(1024, 768);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationProviderProvider.overrideWithValue(_TrackingLocationProvider()),
          ],
          child: const MaterialApp(
            home: NearbyTab(),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // In split view, both Map (Left panel) and List/Search (Right panel) are mounted side by side
      expect(find.byType(Row), findsWidgets);
      expect(find.text('Filters'), findsOneWidget);
      expect(find.text('Near You'), findsOneWidget);
    });
  });
}
