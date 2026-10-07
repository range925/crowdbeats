// Crowdbeats V2 — Creator Performance & Venue Analytics Test Suite
// Verifies Solo Musician & Band Studio Performance & Venue Analytics:
// Dual-context header, hero metric grid, secondary stats, venue leaderboard,
// recent gigs with fee breakdown, band split distribution, timeframe filtering, and studio navigation.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/creator/analytics/creator_analytics_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/creator_shell.dart';

void main() {
  group('Creator Performance & Venue Analytics Tests', () {
    testWidgets('Renders in Solo Musician mode with Elena Cruz context, hero metrics & venues', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorAnalyticsScreen(
            isBand: false,
            entityId: 'artist_elena_cruz',
            entityName: 'Elena Cruz',
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Header & Context
      expect(find.text('Performance & Venue Analytics'), findsOneWidget);
      expect(find.text('SOLO ARTIST'), findsOneWidget);
      expect(find.text('Elena Cruz'), findsOneWidget);
      expect(find.text('Live Metric Engine'), findsOneWidget);

      // Hero Metrics Grid
      expect(find.text('TOTAL TIP REVENUE'), findsOneWidget);
      expect(find.text(r'$4820.00'), findsOneWidget);
      expect(find.text('AVG REVENUE / SHOW'), findsOneWidget);
      expect(find.text(r'$172.14'), findsOneWidget);
      expect(find.text('SHOWS PERFORMED'), findsOneWidget);
      expect(find.text('28 shows'), findsOneWidget);
      expect(find.text('FANS REACHED'), findsOneWidget);
      expect(find.text('3,450 fans'), findsOneWidget);

      // Secondary Stats
      expect(find.text('REPEAT TIPPER RATIO'), findsOneWidget);
      expect(find.text('28.4%'), findsOneWidget);
      expect(find.text('AVG TIP SIZE'), findsOneWidget);
      expect(find.text(r'$18.50'), findsOneWidget);
      expect(find.text('9:30 PM (Acoustic Encore)'), findsOneWidget);

      // Venue Leaderboard & Gigs
      expect(find.text('VENUE PERFORMANCE & LEADERBOARD'), findsOneWidget);
      expect(find.text('The Casbah'), findsWidgets);
      expect(find.text('RECENT PERFORMANCE GIGS & PAYOUTS'), findsOneWidget);
      expect(find.text('LIVE SET TIPPING VELOCITY'), findsOneWidget);
    });

    testWidgets('Renders in Band Studio mode with Midnight Echoes context & member split yield', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorAnalyticsScreen(
            isBand: true,
            entityId: 'band_midnight_echoes',
            entityName: 'The Midnight Echoes',
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Band Header & Metrics
      expect(find.text('BAND STUDIO'), findsOneWidget);
      expect(find.text('The Midnight Echoes'), findsOneWidget);
      expect(find.text(r'$12450.00'), findsOneWidget);
      expect(find.text(r'$296.43'), findsOneWidget);
      expect(find.text('42 shows'), findsOneWidget);
      expect(find.text('14,200 fans'), findsOneWidget);

      // Band Split Yield
      expect(find.text('BAND MEMBER SPLIT YIELD (NET POOL):'), findsWidgets);
      expect(find.text('Elena Cruz (40%)'), findsWidgets);
      expect(find.text('Marcus Vance (25%)'), findsWidgets);
      expect(find.text('Chloe Bennett (10%)'), findsWidgets);
    });

    testWidgets('Timeframe filter chips switch between All Time, 30 Days, and 7 Days', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorAnalyticsScreen(
            isBand: false,
            entityId: 'artist_test',
            entityName: 'Test Musician',
          ),
        ),
      );
      await tester.pumpAndSettle();

      final chip30d = find.text('30 Days');
      expect(chip30d, findsOneWidget);
      await tester.tap(chip30d);
      await tester.pumpAndSettle();

      // 30-day stats update
      expect(find.text(r'$1420.00'), findsOneWidget);
      expect(find.text('8 shows'), findsOneWidget);

      final chip7d = find.text('7 Days');
      expect(chip7d, findsOneWidget);
      await tester.tap(chip7d);
      await tester.pumpAndSettle();

      // 7-day stats update
      expect(find.text(r'$385.00'), findsOneWidget);
      expect(find.text('2 shows'), findsOneWidget);
    });

    testWidgets('Export report button copies summary and displays SnackBar', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorAnalyticsScreen(
            isBand: false,
            entityId: 'artist_elena_cruz',
            entityName: 'Elena Cruz',
          ),
        ),
      );
      await tester.pumpAndSettle();

      final exportBtn = find.byIcon(Icons.share_outlined);
      expect(exportBtn, findsOneWidget);
      await tester.tap(exportBtn);
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.text('Performance analytics report copied to clipboard!'), findsOneWidget);
    });

    testWidgets('CreatorStudioTab navigates to CreatorAnalyticsScreen when Performance & Venue Analytics is tapped', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorShell(initialTab: 4),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final analyticsTile = find.text('Performance & Venue Analytics');
      expect(analyticsTile, findsOneWidget);

      await tester.tap(analyticsTile);
      await tester.pumpAndSettle();

      // Verify on CreatorAnalyticsScreen
      expect(find.text('Performance & Venue Analytics'), findsOneWidget);
      expect(find.text('SOLO ARTIST'), findsOneWidget);
      expect(find.text('Elena Cruz (Solo)'), findsOneWidget);
      expect(find.text('VENUE PERFORMANCE & LEADERBOARD'), findsOneWidget);
    });

    testWidgets('Interactive Gig Revenue Bar Chart, Conversion Grid & Venue Share render properly', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorAnalyticsScreen(
            isBand: false,
            entityId: 'artist_elena_cruz',
            entityName: 'Elena Cruz',
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Useful Graphs: Gig Revenue Trajectory & Venue Share
      expect(find.text('GIG REVENUE TRAJECTORY (LAST 6 SHOWS)'), findsOneWidget);
      expect(find.text('Tip Yield per Gig & Benchmark'), findsOneWidget);
      expect(find.text('Today'), findsOneWidget);
      expect(find.text('VENUE REVENUE DISTRIBUTION SHARE'), findsOneWidget);

      // Useful Grids: 2x2 Performance Efficiency & Conversion Grid
      expect(find.text('CONVERSION & STAGE METRICS'), findsOneWidget);
      expect(find.text('TIP CONVERSION'), findsOneWidget);
      expect(find.text('46.8%'), findsOneWidget);
      expect(find.text('AVG TIP / FAN'), findsOneWidget);
      expect(find.text(r'$1.40'), findsOneWidget);
      expect(find.text('STAGE VELOCITY'), findsOneWidget);
      expect(find.text(r'$114.76/hr'), findsOneWidget);
      expect(find.text('QR CONVERSION'), findsOneWidget);
      expect(find.text('78.2%'), findsOneWidget);

      // Useful Cards: Fee Breakdown & Daily Rate
      expect(find.text('NET PAYOUT & FEE PIPELINE'), findsOneWidget);
      expect(find.text('Daily Rate Synced'), findsOneWidget);
      expect(find.text('6.00%'), findsOneWidget);
      expect(find.text('2.9% + 30¢'), findsOneWidget);
    });

    testWidgets('Solo Musician Dashboard renders direct Performance & Venue Analytics action item', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorShell(initialTab: 0),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify dashboard action item exists
      final analyticsActionItem = find.text('View Performance & Venue Analytics');
      expect(analyticsActionItem, findsOneWidget);

      await tester.tap(analyticsActionItem);
      await tester.pumpAndSettle();

      // Verify navigated into CreatorAnalyticsScreen
      expect(find.text('Performance & Venue Analytics'), findsOneWidget);
      expect(find.text('SOLO ARTIST'), findsOneWidget);
      expect(find.text('Elena Cruz (Solo)'), findsOneWidget);
    });
  });
}

