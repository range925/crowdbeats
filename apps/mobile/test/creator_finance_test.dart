// Crowdbeats V2 — Phase 6 Financial & Stripe Connect Test Suite
// Tests Stripe Connect KYC screen, Balances ledger, Payout sheet validation, and Payout history.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/creator/finance/stripe_connect_kyc_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/finance/creator_balances_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/finance/creator_payout_request_sheet.dart';
import 'package:crowdbeats_mobile/ui/creator/finance/creator_payout_history_screen.dart';

void main() {
  group('Phase 6 — Stripe Connect KYC, Balances & Direct Payouts Tests', () {
    testWidgets('StripeConnectKycScreen renders verified status and checklist items', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: StripeConnectKycScreen(),
        ),
      );

      expect(find.text('Stripe Connect KYC'), findsOneWidget);
      expect(find.text('ACCOUNT STATUS'), findsOneWidget);
      expect(find.text('VERIFIED & ACTIVE'), findsOneWidget);
      expect(find.text('Direct Payouts Enabled'), findsOneWidget);
      expect(find.text('Government Identity Verification'), findsOneWidget);
      expect(find.text('Direct Deposit Bank Account'), findsOneWidget);
    });

    testWidgets('CreatorBalancesScreen renders calm balance, pending funds & request payout CTA', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorBalancesScreen(),
        ),
      );

      expect(find.text('Balances & Financial Ledger'), findsOneWidget);
      expect(find.text('AVAILABLE FOR WITHDRAWAL'), findsOneWidget);
      expect(find.text(r'$480.00'), findsOneWidget);
      expect(find.text('PENDING SETTLEMENT'), findsOneWidget);
      expect(find.text('LIFETIME EARNINGS'), findsOneWidget);
      expect(find.text('Request Payout'), findsOneWidget);
    });

    testWidgets(r'CreatorPayoutRequestSheet validates minimum $10 and over-balance limits', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CreatorPayoutRequestSheet(
              availableBalanceDollars: 100,
              onPayoutSubmitted: (_) {},
            ),
          ),
        ),
      );

      expect(find.text('Request Direct Payout'), findsOneWidget);
      expect(find.text('Chase Checking (•••• 4821)'), findsOneWidget);
      expect(find.text('Confirm & Transfer Funds'), findsOneWidget);

      // Enter invalid amount under $10
      await tester.enterText(find.byType(TextField), '5.00');
      await tester.tap(find.text('Confirm & Transfer Funds'));
      await tester.pump();

      expect(find.text(r'Minimum payout amount is $10.00'), findsOneWidget);

      // Enter invalid amount over available balance
      await tester.enterText(find.byType(TextField), '500.00');
      await tester.tap(find.text('Confirm & Transfer Funds'));
      await tester.pump();

      expect(find.text(r'Amount exceeds available balance ($100.00)'), findsOneWidget);
    });

    testWidgets('CreatorPayoutHistoryScreen displays past paid transactions and bank targets', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorPayoutHistoryScreen(),
        ),
      );

      expect(find.text('Payout History & Statements'), findsOneWidget);
      expect(find.text('PAST DIRECT DEPOSITS'), findsOneWidget);
      expect(find.text('Chase •••• 4821'), findsWidgets);
      expect(find.text(r'$350.00'), findsOneWidget);
      expect(find.text('PAID'), findsWidgets);
    });
  });
}
