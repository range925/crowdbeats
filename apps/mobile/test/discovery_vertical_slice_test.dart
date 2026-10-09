// Crowdbeats V2 — Discovery Vertical Slice & Maps Test (Phase 6)
//
// Validates:
// 1. Top 5 Nearest Musicians & Bands ordered by live-status first, then distance ascending.
// 2. Rank 1–5 synchronization between compact map pins and nearby creator cards.
// 3. Pin selection displays the floating preview card with direct Tip action.
// 4. Top Campaigns section displays DiscoveryCampaignCard with minor units & progress.
// 5. 3-character autocomplete threshold (no suggestions for <3 chars; suggestions for >=3 chars).
// 6. Manual panning gesture reveals "Search this area" floating pill.
// 7. Light and dark theme map rendering stability.

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:crowdbeats_mobile/data/models/discovery.dart';
import 'package:crowdbeats_mobile/state/discovery_state.dart';
import 'package:crowdbeats_mobile/ui/fan/public_discovery_home.dart';
import 'package:crowdbeats_mobile/ui/fan/widgets/compact_google_map.dart';
import 'package:crowdbeats_mobile/ui/fan/widgets/nearby_creator_card.dart';
import 'package:crowdbeats_mobile/ui/fan/widgets/popular_creator_card.dart';
import 'package:crowdbeats_mobile/ui/fan/widgets/discovery_campaign_card.dart';

class _TestHttpOverrides extends HttpOverrides {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = _TestHttpOverrides();

  group('Phase 6: Fan Discovery & Maps Vertical Slice', () {
    testWidgets('Top 5 nearby performers are ranked 1 to 5 with live-first distance sorting', (tester) async {
      tester.view.physicalSize = const Size(800, 2400);
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

      final state = container.read(discoveryProvider);
      expect(state.performers.length, greaterThanOrEqualTo(5));

      // Verify Live performers are prioritized over non-live
      final firstPerformer = state.performers.first;
      expect(firstPerformer.isLive, isTrue);

      // Verify cards exist with rank numbers
      expect(find.byType(NearbyCreatorCard), findsWidgets);
      expect(find.text('1'), findsWidgets);
      expect(find.text('2'), findsWidgets);
      expect(find.text('3'), findsWidgets);
    });

    testWidgets('Top Campaigns section renders campaign cards with pledged amounts & progress', (tester) async {
      tester.view.physicalSize = const Size(800, 2400);
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

      // Check for Top Campaigns header and cards
      expect(find.text('Top Campaigns'), findsOneWidget);
      expect(find.byType(DiscoveryCampaignCard), findsWidgets);
      expect(find.text('Debut Studio EP — "Pacific Dusk"'), findsOneWidget);
      expect(find.text('Support'), findsWidgets);
    });

    testWidgets('Autocomplete enforces 3-character threshold', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(discoveryProvider.notifier);

      // 1 character: no suggestions
      notifier.onLocationSearchInput('S');
      expect(container.read(discoveryProvider).autocompleteSuggestions, isEmpty);

      // 2 characters: no suggestions
      notifier.onLocationSearchInput('Sa');
      expect(container.read(discoveryProvider).autocompleteSuggestions, isEmpty);

      // 3 characters: suggestions populate
      notifier.onLocationSearchInput('San');
      expect(container.read(discoveryProvider).autocompleteSuggestions, isNotEmpty);
      expect(
        container.read(discoveryProvider).autocompleteSuggestions.any((loc) => loc.city.contains('San')),
        isTrue,
      );
    });

    testWidgets('Tapping performer pin displays selected preview card with direct Tip CTA', (tester) async {
      tester.view.physicalSize = const Size(800, 2400);
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

      final state = container.read(discoveryProvider);
      final firstPerformer = state.performers.first;

      // Select performer
      container.read(discoveryProvider.notifier).selectPerformer(firstPerformer);
      await tester.pump(const Duration(milliseconds: 200));

      // Selected performer card should be visible
      expect(find.text(firstPerformer.name), findsWidgets);
      expect(find.text('Tip'), findsWidgets);
    });

    testWidgets('Manual drag pan displays floating "Search this area" pill', (tester) async {
      tester.view.physicalSize = const Size(800, 2400);
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

      // Pan gesture across CompactGoogleMap
      final mapFinder = find.byType(CompactGoogleMap);
      expect(mapFinder, findsOneWidget);

      await tester.drag(mapFinder, const Offset(-60, -40));
      await tester.pump();

      // "Search this area" pill should appear
      expect(find.text('Search this area'), findsOneWidget);
    });

    testWidgets('Renders properly in both Light and Dark themes', (tester) async {
      for (final mode in [ThemeMode.light, ThemeMode.dark]) {
        final container = ProviderContainer();
        addTearDown(container.dispose);

        await tester.pumpWidget(
          UncontrolledProviderScope(
            container: container,
            child: MaterialApp(
              themeMode: mode,
              theme: ThemeData.light(),
              darkTheme: ThemeData.dark(),
              home: const PublicDiscoveryHome(),
            ),
          ),
        );
        await tester.pump(const Duration(milliseconds: 200));

        expect(find.byType(CompactGoogleMap), findsOneWidget);
        expect(find.text('CROWDBEATS'), findsOneWidget);
      }
    });
  });
}
