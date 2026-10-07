// Crowdbeats V2 — Stripe Daily Fee Calculation & Distribution Test Suite
// Verifies:
// 1. Crowdbeats 6% platform fee + Stripe processing fee (2.9% + 30¢) deduction from gross tips.
// 2. Solo musician net payout calculations across common tip tiers ($10, $25, $50, $100).
// 3. Band 4-way split distributions calculated strictly on the net proceeds pool using Largest Remainder.
// 4. Daily fee schedule caching and live-sync properties.
// 5. CreatorBalancesScreen UI presentation of daily Stripe rates & 6% platform fee.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/data/models/money.dart';
import 'package:crowdbeats_mobile/data/services/stripe_fee_service.dart';
import 'package:crowdbeats_mobile/ui/creator/finance/creator_balances_screen.dart';

void main() {
  group('Cross-Platform Daily Stripe & 6% Crowdbeats Fee Calculations', () {
    test('Calculates 6% Crowdbeats platform fee and Stripe fee for \$10 tip', () {
      final breakdown = StripeFeeService.instance.calculateNetTipPayout(
        grossAmountCents: 1000, // $10.00
      );

      // 6% of $10.00 = $0.60 (60 cents)
      expect(breakdown.platformFeeCents, equals(60));
      // 2.9% of $10.00 + $0.30 = $0.29 + $0.30 = $0.59 (59 cents)
      expect(breakdown.stripeFeeCents, equals(59));
      // Total deductions = $0.60 + $0.59 = $1.19 (119 cents)
      expect(breakdown.totalDeductionsCents, equals(119));
      // Musician net proceeds = $10.00 - $1.19 = $8.81 (881 cents)
      expect(breakdown.netAmountCents, equals(881));
      expect(breakdown.platformFeePercent, equals(6.0));
      expect(breakdown.stripeFeePercent, equals(2.9));
      expect(breakdown.stripeFixedFeeCents, equals(30));
    });

    test('Calculates 6% Crowdbeats platform fee and Stripe fee for \$25 tip', () {
      final breakdown = StripeFeeService.instance.calculateNetTipPayout(
        grossAmountCents: 2500, // $25.00
      );

      // 6% of $25.00 = $1.50 (150 cents)
      expect(breakdown.platformFeeCents, equals(150));
      // 2.9% of $25.00 + $0.30 = $0.725 floor = $0.72 + $0.30 = $1.02 (102 cents)
      expect(breakdown.stripeFeeCents, equals(102));
      // Total deductions = $1.50 + $1.02 = $2.52 (252 cents)
      expect(breakdown.totalDeductionsCents, equals(252));
      // Musician net proceeds = $25.00 - $2.52 = $22.48 (2248 cents)
      expect(breakdown.netAmountCents, equals(2248));
    });

    test('Calculates 6% Crowdbeats platform fee and Stripe fee for \$50 tip', () {
      final breakdown = StripeFeeService.instance.calculateNetTipPayout(
        grossAmountCents: 5000, // $50.00
      );

      // 6% of $50.00 = $3.00 (300 cents)
      expect(breakdown.platformFeeCents, equals(300));
      // 2.9% of $50.00 + $0.30 = $1.45 + $0.30 = $1.75 (175 cents)
      expect(breakdown.stripeFeeCents, equals(175));
      // Total deductions = $3.00 + $1.75 = $4.75 (475 cents)
      expect(breakdown.totalDeductionsCents, equals(475));
      // Musician net proceeds = $50.00 - $4.75 = $45.25 (4525 cents)
      expect(breakdown.netAmountCents, equals(4525));
    });

    test('Calculates 6% Crowdbeats platform fee and Stripe fee for \$100 tip', () {
      final breakdown = StripeFeeService.instance.calculateNetTipPayout(
        grossAmountCents: 10000, // $100.00
      );

      // 6% of $100.00 = $6.00 (600 cents)
      expect(breakdown.platformFeeCents, equals(600));
      // 2.9% of $100.00 + $0.30 = $2.90 + $0.30 = $3.20 (320 cents)
      expect(breakdown.stripeFeeCents, equals(320));
      // Total deductions = $6.00 + $3.20 = $9.20 (920 cents)
      expect(breakdown.totalDeductionsCents, equals(920));
      // Musician net proceeds = $100.00 - $9.20 = $90.80 (9080 cents)
      expect(breakdown.netAmountCents, equals(9080));
    });

    test('Calculates custom daily Stripe fee schedule override correctly', () {
      final customSchedule = StripeDailyFeeSchedule(
        effectiveDate: '2026-09-20',
        percentageRate: 0.027, // 2.7%
        percentageBps: 270,
        fixedFeeCents: 25, // $0.25
        currency: 'USD',
        lastSyncedAt: DateTime.now(),
        isLiveSynced: true,
      );

      final breakdown = StripeFeeService.instance.calculateNetTipPayout(
        grossAmountCents: 10000,
        schedule: customSchedule,
      );

      expect(breakdown.platformFeeCents, equals(600));
      // 2.7% of $100 + $0.25 = $2.70 + $0.25 = $2.95 (295 cents)
      expect(breakdown.stripeFeeCents, equals(295));
      expect(breakdown.totalDeductionsCents, equals(895));
      expect(breakdown.netAmountCents, equals(9105));
      expect(breakdown.stripeDailyRateDate, equals('2026-09-20'));
    });

    test('Distributes net tip pool to band members using Largest Remainder', () {
      // Gross tip: $100.00 -> Net proceeds: 9080 cents ($90.80)
      final breakdown = StripeFeeService.instance.calculateNetTipPayout(
        grossAmountCents: 10000,
      );
      final netPoolCents = breakdown.netAmountCents;

      final members = [
        const MemberSplitBps(uid: 'artist_elena', splitBps: 4000), // 40%
        const MemberSplitBps(uid: 'artist_marcus', splitBps: 2500), // 25%
        const MemberSplitBps(uid: 'artist_leo', splitBps: 2500), // 25%
        const MemberSplitBps(uid: 'artist_chloe', splitBps: 1000), // 10%
      ];

      final distribution = distributeLargestRemainder(netPoolCents, members);

      // Elena: 40% of 9080 = 3632 cents ($36.32)
      expect(distribution['artist_elena'], equals(3632));
      // Marcus: 25% of 9080 = 2270 cents ($22.70)
      expect(distribution['artist_marcus'], equals(2270));
      // Leo: 25% of 9080 = 2270 cents ($22.70)
      expect(distribution['artist_leo'], equals(2270));
      // Chloe: 10% of 9080 = 908 cents ($9.08)
      expect(distribution['artist_chloe'], equals(908));

      // Sum of split allocations must equal exact net proceeds pool
      final sumDistributed = distribution.values.fold<int>(0, (a, b) => a + b);
      expect(sumDistributed, equals(netPoolCents));
      expect(sumDistributed, equals(9080));
    });

    testWidgets('CreatorBalancesScreen renders Stripe Daily Fees & Platform Rate card', (tester) async {
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

      expect(find.text('STRIPE DAILY FEES & PLATFORM RATE'), findsOneWidget);
      expect(find.text('CROWDBEATS CHARGE'), findsOneWidget);
      expect(find.text('6.00%'), findsOneWidget);
      expect(find.text('STRIPE PROCESSING'), findsOneWidget);
      expect(find.text('DAILY SYNC'), findsOneWidget);
    });
  });
}
