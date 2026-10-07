// Crowdbeats V2 — Production Creator Fan Directory & Top Tippers Test Suite
// Verifies Solo/Band context rendering, search filtering, leaderboard tabs, stage broadcasts, and studio navigation.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/ui/creator/fans/creator_fans_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/studio/creator_studio_tab.dart';

void main() {
  group('Creator Fan Directory & Top Tippers Tests', () {
    testWidgets('Renders in Solo Musician mode with Elena Cruz context, 342 followers & broadcast CTA', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorFansScreen(
            isBand: false,
            entityId: 'solo_default',
            entityName: 'Elena Cruz',
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Fan Directory & Top Tippers'), findsOneWidget);
      expect(find.text('FAN COMMUNITY'), findsOneWidget);
      expect(find.text('SOLO ARTIST'), findsOneWidget);
      expect(find.text('342 Total Followers · 28 Backers · 84 Tippers'), findsOneWidget);
      expect(find.text('Broadcast'), findsOneWidget);
      expect(find.text('Followers (342)'), findsOneWidget);
      expect(find.text('Top Tippers'), findsOneWidget);
      expect(find.text('Backers (28)'), findsOneWidget);
      expect(find.text('Sarah Jenkins'), findsOneWidget);
      expect(find.text('SUPER FAN'), findsWidgets);
    });

    testWidgets('Renders in Band Studio mode with The Midnight Echoes context & 1,280 followers', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorFansScreen(
            isBand: true,
            entityId: 'band_midnight',
            entityName: 'The Midnight Echoes',
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Fan Directory & Top Tippers'), findsOneWidget);
      expect(find.text('FAN COMMUNITY'), findsOneWidget);
      expect(find.text('BAND STUDIO'), findsOneWidget);
      expect(find.text('1280 Total Followers · 94 Backers · 312 Tippers'), findsOneWidget);
      expect(find.text('Followers (1280)'), findsOneWidget);
      expect(find.text('Backers (94)'), findsOneWidget);
      expect(find.text('Midnight Rockers Club'), findsOneWidget);
    });

    testWidgets('Subtabs switch between Followers, Top Tippers leaderboard, and Backers list', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorFansScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Top Tippers subtab
      await tester.tap(find.text('Top Tippers'));
      await tester.pumpAndSettle();

      expect(find.text('TIMEFRAME:'), findsOneWidget);
      expect(find.text('All Time'), findsOneWidget);
      expect(find.text('#1'), findsOneWidget);
      expect(find.text('Marcus Turner'), findsOneWidget);
      expect(find.text(r'$185.00'), findsOneWidget);
      expect(find.text('Attended 6 shows'), findsOneWidget);

      // Backers subtab
      await tester.tap(find.text('Backers (28)'));
      await tester.pumpAndSettle();

      expect(find.text('VIP Guest List (\$150)'), findsOneWidget);
      expect(find.text('Signed Vinyl Tier (\$45)'), findsWidgets);
      expect(find.text('CONFIRMED'), findsWidgets);

      // Return to Followers subtab
      await tester.tap(find.text('Followers (342)'));
      await tester.pumpAndSettle();

      expect(find.text('Sarah Jenkins'), findsOneWidget);
    });

    testWidgets('Search input filters followers list by name', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorFansScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Sarah Jenkins'), findsOneWidget);
      expect(find.text('Maya Lin'), findsOneWidget);

      // Enter search query
      await tester.enterText(find.byType(TextField), 'Maya');
      await tester.pumpAndSettle();

      expect(find.text('Maya Lin'), findsOneWidget);
      expect(find.text('Sarah Jenkins'), findsNothing);

      // Enter search query with no matches
      await tester.enterText(find.byType(TextField), 'NonExistentPerson');
      await tester.pumpAndSettle();

      expect(find.text('No followers matching "nonexistentperson"'), findsOneWidget);
    });

    testWidgets('Stage Broadcast dialog opens, submits alert, and presents confirmation SnackBar', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorFansScreen(
            isBand: false,
            entityName: 'Elena Cruz',
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Broadcast button
      await tester.tap(find.text('Broadcast'));
      await tester.pumpAndSettle();

      expect(find.text('Stage Broadcast Announcement'), findsOneWidget);
      expect(find.text('Send an instant push alert to all 342 followers and checked-in audience members.'), findsOneWidget);

      // Enter announcement message in dialog
      final dialogTextField = find.descendant(of: find.byType(AlertDialog), matching: find.byType(TextField));
      await tester.enterText(dialogTextField, 'Starting acoustic set in 10 minutes at the main stage!');
      await tester.pumpAndSettle();

      // Send alert
      await tester.tap(find.text('Send Alert'));
      await tester.pumpAndSettle();

      // Dialog closed and confirmation SnackBar displayed
      expect(find.text('Stage Broadcast Announcement'), findsNothing);
      expect(find.text('Stage broadcast delivered to 342 fans!'), findsOneWidget);
    });

    testWidgets('CreatorStudioTab navigates to CreatorFansScreen when Fan Directory & Top Tippers is tapped', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: CreatorStudioTab(),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Scroll down to Audience & Marketing section
      final tileFinder = find.text('Fan Directory & Top Tippers');
      await tester.scrollUntilVisible(tileFinder, 300);
      expect(tileFinder, findsOneWidget);

      // Tap Fan Directory & Top Tippers tile
      await tester.tap(tileFinder);
      await tester.pumpAndSettle();

      // Confirm CreatorFansScreen is displayed and placeholder modal is NOT shown
      expect(find.text('Scheduled for Phase 7 Implementation'), findsNothing);
      expect(find.text('FAN COMMUNITY'), findsOneWidget);
      expect(find.text('SOLO ARTIST'), findsOneWidget);
      expect(find.text('342 Total Followers · 28 Backers · 84 Tippers'), findsOneWidget);
    });
  });
}
