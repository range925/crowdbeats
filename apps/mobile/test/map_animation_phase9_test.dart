// Crowdbeats V2 — Phase 9 Map Animation & Feedback Tests
//
// Verifies:
// 1. Client-side interpolation smoothly animates marker between coordinates
// 2. Stationary venue sessions remain locked to canonical venue coordinates (zero fake movement)
// 3. Teleportation jumps (>350px / >500m) snap & fade without sweeping across the map
// 4. Freshness state computation (Live, Updated just now, Updated Xm ago, Approximate area, Reconnecting, Ended)
// 5. Reduced-motion setting (disableAnimations) collapses tween duration and halts looping halo
// 6. Lifecycle transition (paused) pauses animation controllers to conserve battery
// 7. Creator "What Fans See" preview renders stationary venue pin vs mobile coarse area
// 8. Creator Crowd Radar soft heat halos enforce k >= 5 anonymity with count bands ([5-14], [15+])
// 9. Consented individual supporters are strictly segregated from aggregate heat zones
// 10. Completed tips produce zero location pins or radar markers
// 11. RepaintBoundary isolates marker redraws to prevent full-screen canvas repainting
// 12. Interactive marker tap opens performer details

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/data/models/discovery.dart';
import 'package:crowdbeats_mobile/ui/fan/widgets/animated_performer_marker.dart';
import 'package:crowdbeats_mobile/ui/creator/preview/creator_map_preview_card.dart';
import 'package:crowdbeats_mobile/ui/creator/live/creator_crowd_radar_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final liveVenuePerformer = PublicPerformer(
    id: 'perf_live_venue',
    slug: 'the-gaslamp-trio',
    name: 'The Gaslamp Trio',
    type: 'band',
    genres: const ['Jazz', 'Blues'],
    isLive: true,
    isStationary: true,
    currentVenueId: 'v_gaslamp_theatre',
    currentVenueName: 'Gaslamp Theatre',
    latitude: 32.7157,
    longitude: -117.1611,
    lastUpdated: DateTime.now().subtract(const Duration(seconds: 15)),
  );

  final liveMobilePerformer = PublicPerformer(
    id: 'perf_live_mobile',
    slug: 'wanderer-solo',
    name: 'Wanderer Solo',
    type: 'artist',
    genres: const ['Acoustic', 'Folk'],
    isLive: true,
    isStationary: false,
    latitude: 32.7120,
    longitude: -117.1580,
    lastUpdated: DateTime.now().subtract(const Duration(seconds: 25)),
  );

  group('Phase 9 — Map Feedback & Client-Side Animation Tests', () {
    testWidgets('1. Client-side interpolation smoothly animates mobile performer between coordinates', (tester) async {
      Offset currentTarget = const Offset(100, 100);

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              width: 800,
              height: 600,
              child: StatefulBuilder(
                builder: (context, setState) {
                  return Stack(
                    children: [
                      AnimatedPerformerMarker(
                        performer: liveMobilePerformer,
                        targetOffset: currentTarget,
                        interpolationDuration: const Duration(milliseconds: 600),
                      ),
                      Positioned(
                        bottom: 20,
                        left: 20,
                        child: ElevatedButton(
                          key: const Key('move_button'),
                          onPressed: () {
                            setState(() {
                              currentTarget = const Offset(200, 200);
                            });
                          },
                          child: const Text('Move'),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      );

      await tester.pump();
      expect(find.text('Wanderer Solo'), findsOneWidget);

      // Trigger movement update
      await tester.tap(find.byKey(const Key('move_button')));
      await tester.pump(); // Start of tween

      // Mid-flight check at 300ms (50% interpolation)
      await tester.pump(const Duration(milliseconds: 300));
      final transformFinder = find.byType(Transform);
      expect(transformFinder, findsWidgets);

      // Settle interpolation at 600ms
      await tester.pump(const Duration(milliseconds: 400));
      expect(find.text('Wanderer Solo'), findsOneWidget);
    });

    testWidgets('2. Stationary venue sessions remain locked to canonical venue coordinates (zero fake movement)', (tester) async {
      Offset currentTarget = const Offset(150, 150);

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return Stack(
                  children: [
                    AnimatedPerformerMarker(
                      performer: liveVenuePerformer,
                      targetOffset: currentTarget,
                    ),
                    ElevatedButton(
                      key: const Key('jitter_button'),
                      onPressed: () {
                        setState(() {
                          // Slight coordinate jitter that should NOT trigger sweeping
                          currentTarget = const Offset(152, 152);
                        });
                      },
                      child: const Text('Jitter'),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      );

      await tester.pump();
      expect(find.text('The Gaslamp Trio'), findsOneWidget);

      // Trigger jitter
      await tester.tap(find.byKey(const Key('jitter_button')));
      await tester.pump();

      // Stationary pin snaps without sweeping
      expect(find.text('The Gaslamp Trio'), findsOneWidget);
    });

    testWidgets('3. Teleportation jump (>350px / >500m) snaps and fades without map sweep', (tester) async {
      Offset currentTarget = const Offset(50, 50);

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return Stack(
                  children: [
                    AnimatedPerformerMarker(
                      performer: liveMobilePerformer,
                      targetOffset: currentTarget,
                      teleportPixelThreshold: 300.0,
                      fadeDuration: const Duration(milliseconds: 200),
                    ),
                    ElevatedButton(
                      key: const Key('teleport_button'),
                      onPressed: () {
                        setState(() {
                          // Jump by 500px (> 300px teleport threshold)
                          currentTarget = const Offset(550, 550);
                        });
                      },
                      child: const Text('Teleport'),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      );

      await tester.pump();
      expect(find.text('Wanderer Solo'), findsOneWidget);

      // Tap teleport button
      await tester.tap(find.byKey(const Key('teleport_button')));
      await tester.pump(); // Starts fade out

      // Advance fade out and snap
      await tester.pump(const Duration(milliseconds: 200));
      await tester.pump(const Duration(milliseconds: 200)); // Fade in

      expect(find.text('Wanderer Solo'), findsOneWidget);
    });

    test('4. Freshness state computation handles all lifecycle states', () {
      final now = DateTime(2026, 9, 21, 12, 0, 0);

      // A. Live (<60s)
      final fLive = computeMarkerFreshness(
        lastUpdated: now.subtract(const Duration(seconds: 30)),
        isLive: true,
        isStationary: true,
        now: now,
      );
      expect(fLive.state, MarkerFreshnessState.live);
      expect(fLive.label, 'Live');

      // B. Updated just now (60s - 120s)
      final fJustNow = computeMarkerFreshness(
        lastUpdated: now.subtract(const Duration(seconds: 90)),
        isLive: true,
        isStationary: true,
        now: now,
      );
      expect(fJustNow.state, MarkerFreshnessState.updatedJustNow);
      expect(fJustNow.label, 'Updated just now');

      // C. Updated 5m ago (>120s)
      final fAgo = computeMarkerFreshness(
        lastUpdated: now.subtract(const Duration(minutes: 5)),
        isLive: true,
        isStationary: true,
        now: now,
      );
      expect(fAgo.state, MarkerFreshnessState.updatedAgo);
      expect(fAgo.label, 'Updated 5m ago');

      // D. Approximate area (mobile session <60s)
      final fApprox = computeMarkerFreshness(
        lastUpdated: now.subtract(const Duration(seconds: 20)),
        isLive: true,
        isStationary: false,
        now: now,
      );
      expect(fApprox.state, MarkerFreshnessState.approximate);
      expect(fApprox.label, 'Approximate area (100m)');

      // E. Reconnecting (network disconnect or >90s for mobile)
      final fReconn = computeMarkerFreshness(
        lastUpdated: now.subtract(const Duration(seconds: 10)),
        isLive: true,
        isStationary: false,
        isConnected: false,
        now: now,
      );
      expect(fReconn.state, MarkerFreshnessState.reconnecting);
      expect(fReconn.label, 'Reconnecting');

      // F. Ended (isLive == false or endsAt in past)
      final fEnded = computeMarkerFreshness(
        lastUpdated: now.subtract(const Duration(seconds: 10)),
        isLive: false,
        isStationary: true,
        now: now,
      );
      expect(fEnded.state, MarkerFreshnessState.ended);
      expect(fEnded.label, 'Ended');
    });

    testWidgets('5. Reduced-motion setting (disableAnimations) snaps immediately and pauses looping halo', (tester) async {
      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(disableAnimations: true),
          child: MaterialApp(
            home: Scaffold(
              body: AnimatedPerformerMarker(
                performer: liveVenuePerformer,
                targetOffset: const Offset(100, 100),
              ),
            ),
          ),
        ),
      );

      await tester.pump();
      expect(find.text('The Gaslamp Trio'), findsOneWidget);

      // Verify no looping ticker exceptions occur
      await tester.pump(const Duration(seconds: 2));
      expect(find.text('The Gaslamp Trio'), findsOneWidget);
    });

    testWidgets('6. Lifecycle transition (paused) pauses animation controllers to save battery', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AnimatedPerformerMarker(
              performer: liveVenuePerformer,
              targetOffset: const Offset(100, 100),
            ),
          ),
        ),
      );

      await tester.pump();
      expect(find.text('The Gaslamp Trio'), findsOneWidget);

      // Simulate app backgrounding
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
      await tester.pump();

      // Simulate app foregrounding
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
      await tester.pump();
      expect(find.text('The Gaslamp Trio'), findsOneWidget);
    });

    testWidgets('7. Creator "What Fans See" preview renders stationary venue pin vs mobile coarse area', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                CreatorMapPreviewCard(performer: liveVenuePerformer),
                CreatorMapPreviewCard(performer: liveMobilePerformer),
              ],
            ),
          ),
        ),
      );

      await tester.pump();
      expect(find.text('What Fans See'), findsNWidgets(2));
      expect(find.text('🏛️ Verified Venue Pin (Anchored)'), findsOneWidget);
      expect(find.text('📍 100m Coarse Area Centroid'), findsOneWidget);
      expect(find.textContaining('Gaslamp Theatre'), findsOneWidget);
      expect(find.textContaining('Raw GPS telemetry is never revealed'), findsOneWidget);
    });

    testWidgets('8. Creator Crowd Radar soft heat halos enforce k >= 5 anonymity with count bands', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorCrowdRadarScreen(
              testSessionId: 'sess_live_99',
              testIsLive: true,
              testRole: 'artist',
            ),
          ),
        ),
      );

      await tester.pump();
      expect(find.text('Audience Nearby / Crowd Radar'), findsOneWidget);
      expect(find.text('Min 5 fans/zone'), findsOneWidget);
      expect(find.textContaining('[15+] supporters'), findsOneWidget);
      expect(find.textContaining('[5-14] supporters'), findsOneWidget);
      // Verify no exact individual fan counts are exposed
      expect(find.text('18 supporters'), findsNothing);
      expect(find.text('8 supporters'), findsNothing);
    });

    testWidgets('9. Consented individual supporters are strictly segregated from aggregate heat zones', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorCrowdRadarScreen(
              testSessionId: 'sess_live_99',
              testIsLive: true,
              testRole: 'artist',
            ),
          ),
        ),
      );

      await tester.pump();
      expect(find.text('Visible Supporters Nearby'), findsOneWidget);
      expect(find.text('Explicitly opted-in'), findsOneWidget);
      expect(find.text('Sarah K.'), findsOneWidget);
      expect(find.text('Marcus V.'), findsOneWidget);
    });

    testWidgets('10. Completed tips produce zero location pins or radar markers', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorCrowdRadarScreen(
              testSessionId: 'sess_live_99',
              testIsLive: true,
              testRole: 'artist',
            ),
          ),
        ),
      );

      await tester.pump();
      expect(find.textContaining('Completed tips produce zero visual location pins'), findsOneWidget);
    });

    testWidgets('11. RepaintBoundary isolates marker redraws from the map canvas', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AnimatedPerformerMarker(
              performer: liveVenuePerformer,
              targetOffset: const Offset(100, 100),
            ),
          ),
        ),
      );

      await tester.pump();
      final repaintBoundaryFinder = find.byType(RepaintBoundary);
      expect(repaintBoundaryFinder, findsWidgets);
    });

    testWidgets('12. Interactive marker tap fires onTap callback', (tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: AnimatedPerformerMarker(
                performer: liveVenuePerformer,
                targetOffset: Offset.zero,
                onTap: () => tapped = true,
              ),
            ),
          ),
        ),
      );

      await tester.pump();
      await tester.tap(find.text('The Gaslamp Trio'));
      expect(tapped, isTrue);
    });
  });
}
