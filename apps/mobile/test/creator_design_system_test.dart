// Crowdbeats V2 — Creator Design System & Component Test Suite (Phase 1)
// Tests token semantics, dynamic text scaling, contrast, and accessibility.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';

void main() {
  group('Phase 1 — Creator Design System Components', () {
    testWidgets('CbGlassCard renders child with semantic label and handles tap', (tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CbGlassCard(
              semanticLabel: 'Earnings summary card',
              onTap: () => tapped = true,
              child: const Text('Earnings Content'),
            ),
          ),
        ),
      );

      expect(find.text('Earnings Content'), findsOneWidget);
      expect(
        find.byWidgetPredicate((w) => w is Semantics && w.properties.label == 'Earnings summary card'),
        findsOneWidget,
      );

      await tester.tap(find.text('Earnings Content'));
      await tester.pump();
      expect(tapped, isTrue);
    });

    testWidgets('CbMetricCard renders title, value, timeframe and opens definition dialog', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CbMetricCard(
              title: 'AVAILABLE BALANCE',
              value: r'$480.00',
              timeframe: 'Tonight',
              definition: 'Funds available for instant withdrawal.',
              icon: Icons.account_balance_wallet,
            ),
          ),
        ),
      );

      expect(find.text('AVAILABLE BALANCE'), findsOneWidget);
      expect(find.text(r'$480.00'), findsOneWidget);
      expect(find.text('Tonight'), findsOneWidget);

      // Tap info icon to open definition dialog
      await tester.tap(find.byIcon(Icons.info_outline));
      await tester.pumpAndSettle();

      expect(find.text('Funds available for instant withdrawal.'), findsOneWidget);
      expect(find.text('Got it'), findsOneWidget);

      await tester.tap(find.text('Got it'));
      await tester.pumpAndSettle();
      expect(find.text('Funds available for instant withdrawal.'), findsNothing);
    });

    testWidgets('CbContextSwitcherPill opens bottom sheet with Solo and Band contexts', (tester) async {
      CreatorContextItem? selected;

      const soloCtx = CreatorContextItem(
        id: 'ctx_solo',
        name: 'Elena Cruz (Solo)',
        type: 'solo',
        role: 'SOLO_ARTIST',
      );

      const bandCtx = CreatorContextItem(
        id: 'ctx_band',
        name: 'The Midnight Echoes',
        type: 'band',
        role: 'BAND_FOUNDER',
        hasActiveLiveSession: true,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CbContextSwitcherPill(
              activeContext: soloCtx,
              availableContexts: const [soloCtx, bandCtx],
              onSelectContext: (c) => selected = c,
            ),
          ),
        ),
      );

      expect(find.text('Elena Cruz (Solo)'), findsOneWidget);

      // Tap to open context bottom sheet
      await tester.tap(find.text('Elena Cruz (Solo)'));
      await tester.pumpAndSettle();

      expect(find.text('Switch Creator Context'), findsOneWidget);
      expect(find.text('The Midnight Echoes'), findsOneWidget);
      expect(find.text('LIVE'), findsOneWidget);

      // Select band context
      await tester.tap(find.text('The Midnight Echoes'));
      await tester.pumpAndSettle();

      expect(selected, isNotNull);
      expect(selected!.id, equals('ctx_band'));
      expect(selected!.name, equals('The Midnight Echoes'));
    });

    testWidgets('CbLiveHeroBanner displays Ready to perform and Live session states', (tester) async {
      bool primaryTapped = false;
      bool endTapped = false;

      // 1. Idle state
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CbLiveHeroBanner(
              isLive: false,
              onPrimaryAction: () => primaryTapped = true,
            ),
          ),
        ),
      );

      expect(find.text('READY TO PERFORM'), findsOneWidget);
      expect(find.text('Check In & Go Live'), findsOneWidget);

      await tester.tap(find.text('Check In & Go Live'));
      await tester.pump();
      expect(primaryTapped, isTrue);

      // 2. Active Live state
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CbLiveHeroBanner(
              isLive: true,
              venueName: 'Sunset Lounge',
              listenerCount: 42,
              onPrimaryAction: () {},
              onSecondaryAction: () => endTapped = true,
            ),
          ),
        ),
      );

      expect(find.text('LIVE SESSION ACTIVE'), findsOneWidget);
      expect(find.text('Performing at Sunset Lounge'), findsOneWidget);
      expect(find.text('42 tuned in'), findsOneWidget);
      expect(find.text('Present QR Tipping Token'), findsOneWidget);
      expect(find.text('End Live'), findsOneWidget);

      await tester.tap(find.text('End Live'));
      await tester.pump();
      expect(endTapped, isTrue);
    });

    testWidgets('Components scale gracefully under 1.5x accessibility text scaling', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: MediaQuery(
              data: MediaQueryData(textScaler: TextScaler.linear(1.5)),
              child: CbMetricCard(
                title: 'AVAILABLE BALANCE',
                value: r'$480.00',
                timeframe: 'Tonight',
              ),
            ),
          ),
        ),
      );

      expect(find.text('AVAILABLE BALANCE'), findsOneWidget);
      expect(find.text(r'$480.00'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });
}
