// Crowdbeats V2 — Creator Double-Entry Ledger Balances Test Suite
// Verifies Solo Musician & Band Studio Double-Entry Ledger Balances:
// Calm available/pending/lifetime balances, zero-sum reconciliation,
// band treasury split allocation, credit/debit filter, payout execution, and studio navigation.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/creator/finance/creator_balances_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/studio/creator_studio_tab.dart';
import 'package:crowdbeats_mobile/ui/creator/creator_shell.dart';

void main() {
  group('Creator Double-Entry Ledger Balances Tests', () {
    testWidgets('Renders in Solo Musician mode with Elena Cruz context, calm balances & zero-sum banner', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorBalancesScreen(
              isBand: false,
              entityId: 'artist_elena_cruz',
              entityName: 'Elena Cruz',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Context Header
      expect(find.text('Balances & Financial Ledger'), findsOneWidget);
      expect(find.text('SOLO ARTIST'), findsOneWidget);
      expect(find.text('Elena Cruz'), findsOneWidget);
      expect(find.text('Zero-Sum Balanced (Δ \$0.00)'), findsOneWidget);

      // Financial Hero Card
      expect(find.text('AVAILABLE FOR WITHDRAWAL'), findsOneWidget);
      expect(find.text(r'$480.00'), findsOneWidget);
      expect(find.text('PENDING SETTLEMENT'), findsOneWidget);
      expect(find.text(r'$125.00'), findsOneWidget);
      expect(find.text('LIFETIME EARNINGS'), findsOneWidget);
      expect(find.text(r'$4820.00'), findsOneWidget);
      expect(find.text('Request Payout'), findsOneWidget);

      // Double-entry integrity banner
      expect(find.text('DOUBLE-ENTRY INTEGRITY'), findsOneWidget);
      expect(find.text('Debits: \$5425 | Credits: \$5425'), findsOneWidget);

      // Default ledger transactions
      expect(find.text('DOUBLE-ENTRY LEDGER ENTRIES'), findsOneWidget);
      expect(find.text('Direct Tip: Live Stage Performance (Casbah)'), findsOneWidget);
      expect(find.text(r'+$50.00'), findsOneWidget);
      expect(find.text('Stripe Processing & Platform Fee (2.9% + 30¢)'), findsOneWidget);
      expect(find.text(r'-$1.75'), findsOneWidget);

      // Definitions card
      expect(find.text('UNDERSTANDING YOUR BALANCES'), findsOneWidget);
      expect(find.text('Available Balance'), findsOneWidget);
      expect(find.text('Pending Settlement'), findsOneWidget);
      expect(find.text('Zero Platform Payout Fees'), findsOneWidget);
    });

    testWidgets('Renders in Band Studio mode with Midnight Echoes context & band treasury split allocation', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorBalancesScreen(
              isBand: true,
              entityId: 'band_midnight_echoes',
              entityName: 'The Midnight Echoes',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Context Header
      expect(find.text('Balances & Financial Ledger'), findsOneWidget);
      expect(find.text('BAND STUDIO'), findsOneWidget);
      expect(find.text('The Midnight Echoes'), findsOneWidget);

      // Band balances
      expect(find.text(r'$1850.00'), findsOneWidget);
      expect(find.text(r'$340.00'), findsOneWidget);
      expect(find.text(r'$12450.00'), findsOneWidget);

      // Band treasury split allocation section
      expect(find.text('BAND TREASURY SPLIT ALLOCATION'), findsOneWidget);
      expect(find.text('Active Split Agreement (v2)'), findsOneWidget);
      expect(find.text('100% Allocated'), findsOneWidget);
      expect(find.text('Elena Cruz (Lead Vocals & Guitar)'), findsOneWidget);
      expect(find.text('40%'), findsOneWidget);
      expect(find.text(r'$740.00'), findsOneWidget);
      expect(find.text('Marcus Vance (Bass & Synth)'), findsOneWidget);
      expect(find.text('25%'), findsWidgets);
      expect(find.text(r'$462.50'), findsWidgets);
      expect(find.text('Chloe Bennett (Tour Tech & Sound)'), findsOneWidget);
      expect(find.text('10%'), findsOneWidget);
      expect(find.text(r'$185.00'), findsOneWidget);
    });

    testWidgets('Double-entry ledger stream filters by Credits and Debits', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorBalancesScreen(
              isBand: false,
              entityId: 'artist_test',
              entityName: 'Test Musician',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Filter by Credits
      final creditsBtn = find.text('Credits');
      expect(creditsBtn, findsOneWidget);
      await tester.tap(creditsBtn);
      await tester.pumpAndSettle();

      // Credits visible, Debits hidden
      expect(find.text('Direct Tip: Live Stage Performance (Casbah)'), findsOneWidget);
      expect(find.text('Stripe Processing & Platform Fee (2.9% + 30¢)'), findsNothing);

      // Filter by Debits
      final debitsBtn = find.text('Debits');
      expect(debitsBtn, findsOneWidget);
      await tester.tap(debitsBtn);
      await tester.pumpAndSettle();

      // Debits visible, Credits hidden
      expect(find.text('Stripe Processing & Platform Fee (2.9% + 30¢)'), findsOneWidget);
      expect(find.text('Direct Tip: Live Stage Performance (Casbah)'), findsNothing);
    });

    testWidgets('Request payout opens sheet, submits payout, decrements balance & appends ledger debit', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorBalancesScreen(
              isBand: false,
              entityId: 'artist_elena_cruz',
              entityName: 'Elena Cruz',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Request Payout
      final payoutBtn = find.text('Request Payout');
      expect(payoutBtn, findsOneWidget);
      await tester.tap(payoutBtn);
      await tester.pumpAndSettle();

      // Payout sheet opens
      expect(find.text('Request Direct Payout'), findsOneWidget);
      expect(find.text('PAYOUT AMOUNT (USD)'), findsOneWidget);

      // Enter $100.00 in payout amount field
      await tester.enterText(find.byType(TextField), '100.00');
      await tester.pumpAndSettle();

      // Submit payout
      final submitBtn = find.text('Confirm & Transfer Funds');
      expect(submitBtn, findsOneWidget);
      await tester.tap(submitBtn);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 800));
      await tester.pumpAndSettle();

      // Balance decremented from $480.00 to $380.00
      expect(find.text(r'$380.00'), findsOneWidget);

      // SnackBar confirmation
      expect(
        find.textContaining('Payout of \$100.00'),
        findsOneWidget,
      );

      // New debit entry appended to ledger
      expect(find.text('ACH Direct Payout to Verified Bank Account'), findsOneWidget);
      expect(find.text(r'-$100.00'), findsOneWidget);
    });

    testWidgets('CreatorStudioTab navigates to CreatorBalancesScreen when Double-Entry Ledger Balances is tapped', (tester) async {
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

      final ledgerTile = find.text('Double-Entry Ledger Balances');
      expect(ledgerTile, findsOneWidget);

      await tester.tap(ledgerTile);
      await tester.pumpAndSettle();

      // Verify on CreatorBalancesScreen with Elena Cruz context
      expect(find.text('Balances & Financial Ledger'), findsOneWidget);
      expect(find.text('SOLO ARTIST'), findsOneWidget);
      expect(find.text('Elena Cruz (Solo)'), findsOneWidget);
      expect(find.text('DOUBLE-ENTRY INTEGRITY'), findsOneWidget);
    });
  });
}
