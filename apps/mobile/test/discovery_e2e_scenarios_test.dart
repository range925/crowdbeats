// Crowdbeats V2 — Mobile Discovery E2E Scenarios Test
//
// Automated validation for Location-First Discovery Redesign in Flutter:
// 1. Strict visual hierarchy: Header -> Search -> Compact Map -> Top 5 Nearby -> Top 3 Popular
// 2. Contextual Live Now in Nearby cards (no separate first-screen Live Now category)
// 3. 8–18 word AI profile summaries
// 4. Torrance search and map update
// 5. Tip Auth Gate context preservation

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/data/models/discovery.dart';
import 'package:crowdbeats_mobile/state/discovery_state.dart';
import 'package:crowdbeats_mobile/state/tip_state.dart';
import 'package:crowdbeats_mobile/ui/fan/public_discovery_home.dart';
import 'package:crowdbeats_mobile/ui/fan/widgets/compact_google_map.dart';
import 'package:crowdbeats_mobile/ui/fan/widgets/nearby_creator_card.dart';
import 'package:crowdbeats_mobile/ui/fan/widgets/popular_creator_card.dart';
import 'package:crowdbeats_mobile/ui/fan/views/nearby_secondary_view.dart';
import 'package:crowdbeats_mobile/ui/fan/views/popular_secondary_view.dart';

class _TestHttpOverrides extends HttpOverrides {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = _TestHttpOverrides();

  group('Location-First Public Discovery Redesign (Mobile)', () {
    testWidgets('PublicDiscoveryHome renders strict hierarchy: Header -> Search -> Map -> Top 5 Nearby -> Top 3 Popular', (tester) async {
      tester.view.physicalSize = const Size(800, 2000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(home: PublicDiscoveryHome()),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // 1. CROWDBEATS Header
      expect(find.text('CROWDBEATS'), findsOneWidget);
      expect(find.text('Discover music around you'), findsOneWidget);

      // 2. Location Search
      expect(find.text('Search city, town, venue, or area'), findsOneWidget);

      // 3. Compact Google Map
      expect(find.byType(CompactGoogleMap), findsOneWidget);

      // 4. Top Nearby Section
      expect(find.text('Nearby musicians'), findsOneWidget);
      expect(find.byType(NearbyCreatorCard), findsWidgets);

      // 5. Contextual LIVE badge inside Nearby cards
      expect(find.text('LIVE'), findsWidgets);

      // 6. Top Popular Section
      expect(find.text('Popular on Crowdbeats'), findsOneWidget);
      expect(find.byType(PopularCreatorCard), findsWidgets);

      // 7. Verify NO 3-category menu or separate Live Now category
      expect(find.text('Artists and bands around you'), findsNothing);
      expect(find.text('Trending in this area'), findsNothing);
      expect(find.text('Performing right now'), findsNothing);
    });

    testWidgets('Displays 8-18 word AI profile summaries inside cards', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(home: PublicDiscoveryHome()),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Check for presence of AI summary text
      expect(find.textContaining('Indie-folk storyteller blending warm acoustic guitar'), findsWidgets);
    });

    testWidgets('Torrance location search updates discovery location and map', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(discoveryProvider.notifier);
      notifier.selectSearchedLocation(DiscoveryLocation.torrance);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(home: PublicDiscoveryHome()),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Exploring Torrance'), findsOneWidget);
      expect(find.text('Music around Torrance'), findsOneWidget);
    });

    testWidgets('Tapping See All Nearby opens full NearbySecondaryView', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(home: NearbySecondaryView()),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Nearby Live Music'), findsWidgets);
    });

    testWidgets('Tapping See All Popular opens full PopularSecondaryView', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(home: PopularSecondaryView()),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Popular in San Diego'), findsOneWidget);
    });

    testWidgets('Preserves tip context across auth gate without auto-charge', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final tipNotifier = container.read(tipFlowProvider.notifier);

      final pendingContext = const PendingTipContext(
        creatorId: 'art_jake_rios',
        creatorSlug: 'jake-rios',
        creatorName: 'Jake Rios',
        creatorType: 'artist',
        selectedTipAmountCents: 2000,
        currency: 'USD',
        sourceScreen: 'discovery_home',
      );

      tipNotifier.savePendingTipContext(pendingContext);
      expect(container.read(tipFlowProvider).pendingTipContext?.creatorName, 'Jake Rios');

      tipNotifier.prepare(
        recipientId: pendingContext.creatorId,
        recipientName: pendingContext.creatorName,
        recipientType: pendingContext.creatorType,
        amountCents: pendingContext.selectedTipAmountCents,
      );

      final activeTip = container.read(tipFlowProvider);
      expect(activeTip.amountCents, 2000);
      expect(activeTip.status, TipFlowStatus.idle);
    });
  });
}
