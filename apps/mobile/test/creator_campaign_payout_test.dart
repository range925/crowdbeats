// Crowdbeats V2 — Phase 11 Campaign Lifecycle, Rewards & Payout Settlement Test Suite
// Verifies 5-step campaign wizard, draft resume, moderation states, test pledge, RBAC & payout recovery.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/creator/campaigns/campaign_creation_wizard.dart';
import 'package:crowdbeats_mobile/ui/creator/campaigns/creator_campaigns_tab.dart';
import 'package:crowdbeats_mobile/ui/creator/finance/creator_balances_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/finance/creator_payout_request_sheet.dart';
import 'package:crowdbeats_mobile/ui/creator/finance/creator_payout_history_screen.dart';

void main() {
  group('Phase 11 — Campaign Lifecycle, Rewards, Payout Eligibility & Cash-Out Tests', () {
    setUp(() {
      CampaignCreationWizard.persistedDraft = null;
    });

    testWidgets('1. 5-step Campaign Creation Wizard navigation and contract validations', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      bool campaignCreated = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CampaignCreationWizard(
              onCampaignCreated: () => campaignCreated = true,
            ),
          ),
        ),
      );

      // Step 1: Story
      expect(find.text('Campaign Creation Wizard'), findsOneWidget);
      expect(find.text('Step 1 of 5 · Story'), findsOneWidget);
      expect(find.text('Draft auto-saved'), findsOneWidget);
      expect(find.text('CAMPAIGN TITLE'), findsOneWidget);
      expect(find.text('PROJECT STORY & CREATIVE PITCH'), findsOneWidget);

      // Advance to Step 2: Goal & Rewards
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      expect(find.text('Step 2 of 5 · Goal & Rewards'), findsOneWidget);
      expect(find.text(r'GOAL (USD $)'), findsOneWidget);
      expect(find.text('DURATION (DAYS)'), findsOneWidget);
      expect(find.text('REWARD TIERS'), findsOneWidget);
      expect(find.text('Digital Download + Bonus Track'), findsOneWidget);
      expect(find.text('Signed Limited Edition Vinyl'), findsOneWidget);

      // Advance to Step 3: Details
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      expect(find.text('Step 3 of 5 · Details'), findsOneWidget);
      expect(find.text('PROJECT CATEGORY'), findsOneWidget);
      expect(find.text('CREATOR LOCATION'), findsOneWidget);
      expect(find.text('ESTIMATED REWARD FULFILLMENT'), findsOneWidget);
      expect(find.text('Reward Fulfillment Integrity'), findsOneWidget);

      // Advance to Step 4: Review
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      expect(find.text('Step 4 of 5 · Review'), findsOneWidget);
      expect(find.text('FEE TRANSPARENCY & NET DISCLOSURE'), findsOneWidget);
      expect(find.text('Crowdbeats Platform Fee (6.0%):'), findsOneWidget);
      expect(find.text('Estimated Net Payout upon Success:'), findsOneWidget);
      expect(find.text('All-or-Nothing'), findsOneWidget);

      // Advance to Step 5: Launch
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      expect(find.text('Step 5 of 5 · Launch'), findsOneWidget);
      expect(find.text('Ready for Submission'), findsOneWidget);
      expect(find.text('Moderation & Review Notice'), findsOneWidget);
      expect(find.text('SUBMITTED FOR REVIEW'), findsOneWidget);
      expect(find.text('Submit for Review'), findsOneWidget);

      // Submit
      await tester.tap(find.text('Submit for Review'));
      await tester.pumpAndSettle();

      expect(campaignCreated, isTrue);
    });

    testWidgets('2. Draft auto-save and draft resume across recoverable sessions', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      // Initialize with custom draft in persisted memory
      CampaignCreationWizard.persistedDraft = CampaignDraft(
        title: 'Acoustic Tour Fundraiser',
        story: 'Fundraising for a 12-city acoustic theatre tour with intimate fan meet-and-greets and exclusive vinyl.',
        goalDollars: 8500,
        days: 45,
        category: 'Tour & Travel',
        location: 'Austin, TX',
        estimatedDelivery: 'December 2026',
        tiers: [
          RewardTierItem(id: 't_tour', title: 'Tour Poster + Stems', amountDollars: 20, description: 'Commemorative tour poster'),
        ],
        savedAt: DateTime.now(),
        step: 2,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CampaignCreationWizard(
              onCampaignCreated: () {},
            ),
          ),
        ),
      );

      // Verify Resume banner is shown
      expect(find.text('Unsaved draft found · Resume or Discard'), findsOneWidget);
      expect(find.text('Resume'), findsOneWidget);
      expect(find.text('Discard'), findsOneWidget);

      // Tap Resume
      await tester.tap(find.text('Resume'));
      await tester.pumpAndSettle();

      // Banner dismissed, step 2 active with draft data
      expect(find.text('Unsaved draft found · Resume or Discard'), findsNothing);
      expect(find.text('Step 2 of 5 · Goal & Rewards'), findsOneWidget);
      expect(find.text('Tour Poster + Stems'), findsOneWidget);
      expect(find.text(r'$20'), findsOneWidget);
    });

    testWidgets('3. Campaign moderation states filtering (Draft, Pending Review, Active, Rejected, Completed)', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorCampaignsTab(),
        ),
      );

      // Initially on 'All Statuses'
      expect(find.text('ACTIVE CAMPAIGN'), findsOneWidget);
      expect(find.text('PENDING REVIEW'), findsOneWidget);
      expect(find.text('DRAFT'), findsOneWidget);
      expect(find.text('REJECTED'), findsOneWidget);
      expect(find.text('COMPLETED'), findsOneWidget);

      // Filter to Pending Review only
      await tester.tap(find.text('Pending Review'));
      await tester.pumpAndSettle();

      expect(find.text('PENDING REVIEW'), findsOneWidget);
      expect(find.text('Trust & Safety review in progress · Estimated completion < 24h'), findsOneWidget);
      expect(find.text('ACTIVE CAMPAIGN'), findsNothing);

      // Filter to Rejected only
      await tester.tap(find.text('Rejected'));
      await tester.pumpAndSettle();

      expect(find.text('REJECTED'), findsOneWidget);
      expect(find.text('Revise & Resubmit'), findsOneWidget);
      expect(find.text('PENDING REVIEW'), findsNothing);

      // Filter to Completed only
      await tester.tap(find.text('Completed'));
      await tester.pumpAndSettle();

      expect(find.text('COMPLETED'), findsOneWidget);
      expect(find.text('124% Funded'), findsOneWidget);
      expect(find.text('REJECTED'), findsNothing);
    });

    testWidgets('4. Test backer pledge contribution simulation and reward tracking', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorCampaignsTab(),
        ),
      );

      // Baseline figures
      expect(find.text(r'$3450'), findsOneWidget);
      expect(find.text('28'), findsOneWidget);
      expect(find.text('11 / 100 claimed'), findsOneWidget);

      // Tap Test Pledge ($45)
      await tester.tap(find.text(r'Test Pledge ($45)'));
      await tester.pumpAndSettle();

      // Pledged dollars should increment by $45 ($3,495), backer count to 29, vinyl claimed to 12
      expect(find.text(r'$3495'), findsOneWidget);
      expect(find.text('29'), findsOneWidget);
      expect(find.text('12 / 100 claimed'), findsOneWidget);
      expect(find.textContaining(r'Test pledge received! +$45 USD'), findsOneWidget);
    });

    testWidgets('5. Role-Based Access Control: Solo/Band access payouts, Fan persona is barred', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      // Solo Artist can access payout controls
      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorBalancesScreen(role: 'SOLO_ARTIST'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Request Payout'), findsOneWidget);
      expect(find.text('HELD IN ESCROW'), findsOneWidget);

      // Fan persona is strictly barred
      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorBalancesScreen(role: 'FAN'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Request Payout'), findsNothing);
      expect(find.textContaining('Fan accounts cannot initiate bank cash-outs'), findsOneWidget);
    });

    testWidgets('6. Cash-out flow: ACH vs Instant Payout fee calculations and transfer submission', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      double? submittedAmount;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (ctx) => ElevatedButton(
                onPressed: () => CreatorPayoutRequestSheet.show(
                  ctx,
                  availableBalanceDollars: 1500.0,
                  onPayoutSubmitted: (amt) => submittedAmount = amt,
                ),
                child: const Text('Open Payout Sheet'),
              ),
            ),
          ),
        ),
      );

      // Open sheet
      await tester.tap(find.text('Open Payout Sheet'));
      await tester.pumpAndSettle();

      expect(find.text('Chase Checking (•••• 4821)'), findsOneWidget);
      expect(find.text('Standard ACH'), findsOneWidget);
      expect(find.text('Instant Payout'), findsOneWidget);
      expect(find.text('Net Amount to Bank:'), findsOneWidget);

      // Switch to Instant Payout (1.0% fee)
      await tester.tap(find.text('Instant Payout'));
      await tester.pumpAndSettle();

      expect(find.text('Instant Payout Fee (1.0%):'), findsOneWidget);
      expect(find.text('-\$15.00'), findsOneWidget);
      expect(find.text(r'$1485.00'), findsOneWidget);

      // Submit payout
      await tester.tap(find.text('Confirm & Transfer Funds'));
      await tester.pump(const Duration(milliseconds: 700));
      await tester.pumpAndSettle();

      expect(submittedAmount, equals(1500.0));
    });

    testWidgets('7. Payout history failed state display and interactive settlement retry recovery', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: CreatorPayoutHistoryScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Debit •••• 1089'), findsOneWidget);
      expect(find.text('FAILED'), findsOneWidget);
      expect(find.text('Expired Debit Card credentials'), findsOneWidget);
      expect(find.text('Retry Settlement'), findsOneWidget);

      // Tap Retry Settlement
      await tester.tap(find.text('Retry Settlement'));
      await tester.pumpAndSettle();

      // State is recovered to PAID
      expect(find.text('Settlement retried successfully! Transferred \$820.00 to Chase Checking.'), findsOneWidget);
      expect(find.text('Expired Debit Card credentials'), findsNothing);
    });
  });
}
