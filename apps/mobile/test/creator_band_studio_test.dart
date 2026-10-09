// Crowdbeats V2 — Phase 10: Band Mobile Studio, Governance, Splits & Treasury Test Suite
// Verifies:
// 1. Explicit Personal Identity (Elena Cruz, BAND_FOUNDER, 40% Split) vs Band Identity (The Midnight Echoes).
// 2. Band Management Roster, Role Authority, and 7-day TTL Invitations (Resend, Revoke, Re-invite).
// 3. Ownership Transfer Modal enforcing exact "TRANSFER OWNERSHIP" input phrase and Last-Owner Protection.
// 4. Split Contract Editor 100% mathematical invariant, effective timing invariant, and voting modal quorum.
// 5. Band Treasury Ledger with Largest Remainder Method (OD-09) breakdown and personal split withdrawal.
// 6. Safe live session termination dialog ending band sets and clearing live pins.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/ui/components/cb_context_switcher_pill.dart';
import 'package:crowdbeats_mobile/ui/creator/dashboard/band_mobile_dashboard.dart';
import 'package:crowdbeats_mobile/ui/creator/band/band_management_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/band/band_split_editor_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/band/band_split_voting_modal.dart';
import 'package:crowdbeats_mobile/ui/creator/band/band_treasury_screen.dart';

void main() {
  group('Phase 10 — Band Mobile Studio, Governance & Splits Test Suite', () {
    testWidgets('BandMobileDashboard renders explicit personal vs band identity, role badges, and trust caption', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      const bandItem = CreatorContextItem(
        id: 'band_midnight',
        name: 'The Midnight Echoes',
        type: 'band',
        role: 'BAND_FOUNDER',
      );

      final container = ProviderContainer(
        overrides: [
          creatorContextProvider.overrideWith((ref) => CreatorContextNotifier(
                initialContext: bandItem,
                initialAvailable: const [bandItem],
              )),
        ],
      );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: BandMobileDashboard(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // 1. Explicit Personal vs Band Identity
      expect(find.text('PERSONAL: Elena Cruz'), findsOneWidget);
      expect(find.text('The Midnight Echoes'), findsWidgets);
      expect(find.text('BAND_FOUNDER'), findsOneWidget);
      expect(find.text('40% Active Split Allocation'), findsOneWidget);

      // 2. Band Command Center Hero (Idle Stage)
      expect(find.text('READY TO PERFORM'), findsOneWidget);
      expect(find.text('Check in to start tipping & appear on the live map'), findsOneWidget);
      expect(find.text('Check In & Go Live'), findsWidgets);

      // 3. Financial Metrics & Escrow Transparency
      expect(find.text('BAND TREASURY'), findsOneWidget);
      expect(find.text(r'$1,850.00'), findsOneWidget);
      expect(find.text('YOUR SPLIT (40%)'), findsOneWidget);
      expect(find.text(r'$740.00'), findsWidgets);
      expect(
        find.text('Only settled funds marked "Available" can be paid out. Band treasury distributed according to unanimous split contract.'),
        findsOneWidget,
      );

      // 4. Quick Actions
      expect(find.text('Check In Band'), findsOneWidget);
      expect(find.text('Present QR'), findsOneWidget);
      expect(find.text('Treasury'), findsOneWidget);
      expect(find.text('Splits'), findsOneWidget);
      expect(find.text('Members'), findsOneWidget);
    });

    testWidgets('BandManagementScreen manages roster, roles, and 7-day TTL invitation lifecycle', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: BandManagementScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // 1. Roster and roles
      expect(find.text('Band Roster & Governance'), findsOneWidget);
      expect(find.text('The Midnight Echoes'), findsOneWidget);
      expect(find.text('David Naufahu'), findsOneWidget);
      expect(find.text('FOUNDER'), findsOneWidget);
      expect(find.text('Marcus Turner'), findsOneWidget);
      expect(find.text('Alicia Vance'), findsOneWidget);
      expect(find.text('Sarah Jenkins'), findsOneWidget);
      expect(find.text('ADMIN'), findsOneWidget);

      // 2. Pending and Expired Invitations (7-day TTL)
      expect(find.text('INVITATIONS (7-DAY TTL)'), findsOneWidget);
      expect(find.text('Leo Hayes'), findsOneWidget);
      expect(find.text('PENDING'), findsOneWidget);
      expect(find.text('Expires in 4 days'), findsOneWidget);
      expect(find.text('Jordan Bell'), findsOneWidget);
      expect(find.text('EXPIRED'), findsOneWidget);
      expect(find.text('7-day TTL elapsed'), findsOneWidget);

      // Test Resend action on pending invite
      expect(find.text('Resend'), findsOneWidget);
      await tester.tap(find.text('Resend'));
      await tester.pumpAndSettle();
      expect(find.text('Expires in 7 days'), findsOneWidget);

      // Test Re-invite action on expired invite
      expect(find.text('Re-invite'), findsOneWidget);
      await tester.tap(find.text('Re-invite'));
      await tester.pumpAndSettle();
      expect(find.text('New 7-day invitation sent to Jordan Bell.'), findsOneWidget);

      // Test Revoke action on invite
      expect(find.text('Revoke'), findsWidgets);
      await tester.tap(find.text('Revoke').first);
      await tester.pumpAndSettle();
      expect(find.text('Invitation for Leo Hayes revoked.'), findsOneWidget);
    });

    testWidgets('BandManagementScreen enforces last-owner protection and ownership transfer confirmation phrase', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: BandManagementScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // 1. Verify governance and failsafes section
      expect(find.text('FOUNDER GOVERNANCE & FAILSAFES'), findsOneWidget);
      expect(find.text('Last Owner Protection Active'), findsOneWidget);
      expect(find.text('Active Campaign & Unpaid Balance Lock'), findsOneWidget);

      // 2. Attempt to remove the Founder (David Naufahu) via remove button
      final removeButtons = find.byIcon(Icons.remove_circle_outline);
      expect(removeButtons, findsWidgets);
      await tester.tap(removeButtons.first);
      await tester.pumpAndSettle();

      // Verify Last Owner Protection alert dialog pops up
      expect(find.text('The band founder cannot be removed from the band roster without first transferring ownership to another active member.'), findsOneWidget);
      await tester.tap(find.text('Understood'));
      await tester.pumpAndSettle();

      // 3. Open Transfer Band Ownership Dialog
      await tester.tap(find.text('Transfer Band Ownership'));
      await tester.pumpAndSettle();

      expect(find.text('SELECT SUCCESSOR'), findsOneWidget);
      expect(find.text('Type "TRANSFER OWNERSHIP" to confirm:'), findsOneWidget);

      // Confirm button is initially disabled
      final confirmBtnFinder = find.widgetWithText(ElevatedButton, 'Confirm Transfer');
      expect(tester.widget<ElevatedButton>(confirmBtnFinder).enabled, isFalse);

      // Enter invalid phrase
      await tester.enterText(find.byType(TextField).last, 'transfer');
      await tester.pumpAndSettle();
      expect(tester.widget<ElevatedButton>(confirmBtnFinder).enabled, isFalse);

      // Enter exact confirmation phrase "TRANSFER OWNERSHIP"
      await tester.enterText(find.byType(TextField).last, 'TRANSFER OWNERSHIP');
      await tester.pumpAndSettle();
      expect(tester.widget<ElevatedButton>(confirmBtnFinder).enabled, isTrue);

      // Tap confirm transfer
      await tester.tap(confirmBtnFinder);
      await tester.pumpAndSettle();

      expect(find.textContaining('Band ownership successfully transferred'), findsOneWidget);
    });

    testWidgets('BandSplitEditorScreen enforces 100% mathematical invariant, effective timing invariant, and voting quorum', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: BandSplitEditorScreen(userRole: 'BAND_FOUNDER'),
        ),
      );
      await tester.pumpAndSettle();

      // 1. Invariant & Effective Timing Banners
      expect(find.text('Band Split Contract'), findsOneWidget);
      expect(find.text('Mathematical Invariant Satisfied: 100%'), findsOneWidget);
      expect(find.text('Effective Timing Invariant'), findsOneWidget);
      expect(
        find.text('Takes effect for all future stage tips upon unanimous approval. Historical tips remain allocated according to previous contract.'),
        findsOneWidget,
      );
      expect(find.text('AUTHORITY: BAND_FOUNDER'), findsOneWidget);

      // 2. Odd-cents largest remainder notice
      expect(find.textContaining('Largest Remainder Method (OD-09)'), findsOneWidget);

      // 3. Open Voting Modal
      final submitBtnFinder = find.widgetWithText(ElevatedButton, 'Submit Split Proposal for Voting');
      expect(tester.widget<ElevatedButton>(submitBtnFinder).enabled, isTrue);
      await tester.tap(submitBtnFinder);
      await tester.pumpAndSettle();

      // 4. Verify voting modal quorum status
      expect(find.text('Split Contract Governance Vote'), findsOneWidget);
      expect(find.text('PROPOSED SPLIT CONTRACT (v2.1)'), findsOneWidget);
      expect(find.text('APPROVED'), findsWidgets);
      expect(find.text('AWAITING VOTE'), findsOneWidget);

      // Member approves
      await tester.tap(find.text('Approve Contract'));
      await tester.pumpAndSettle();
      expect(find.text('You approved the proposed split contract!'), findsOneWidget);
    });

    testWidgets('BandTreasuryScreen renders collective treasury, OD-09 note, and handles split withdrawal', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: BandTreasuryScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // 1. Treasury ledger & OD-09 note
      expect(find.text('Band Treasury Ledger'), findsOneWidget);
      expect(find.text('BAND COLLECTIVE TREASURY'), findsOneWidget);
      expect(find.text(r'$1850.00'), findsOneWidget);
      expect(find.text('Largest Remainder Method (OD-09)'), findsOneWidget);
      expect(find.text(r'$740.00'), findsWidgets);

      // 2. Withdraw split
      final withdrawBtnFinder = find.widgetWithText(ElevatedButton, 'Withdraw My 40% Split');
      expect(tester.widget<ElevatedButton>(withdrawBtnFinder).enabled, isTrue);

      await tester.tap(withdrawBtnFinder);
      await tester.pumpAndSettle();

      // Check snackbar feedback and button disabled
      expect(find.text(r'Payout of $740.00 initiated to your personal bank account!'), findsOneWidget);
      expect(tester.widget<ElevatedButton>(withdrawBtnFinder).enabled, isFalse);
    });

    testWidgets('BandMobileDashboard handles safe live session termination dialog', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      const bandLiveItem = CreatorContextItem(
        id: 'band_midnight',
        name: 'The Midnight Echoes',
        type: 'band',
        role: 'BAND_FOUNDER',
        hasActiveLiveSession: true,
      );

      final container = ProviderContainer(
        overrides: [
          creatorContextProvider.overrideWith((ref) => CreatorContextNotifier(
                initialContext: bandLiveItem,
                initialAvailable: const [bandLiveItem],
              )),
        ],
      );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: BandMobileDashboard(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // 1. Live Session Active Hero
      expect(find.text('LIVE SESSION ACTIVE'), findsOneWidget);
      expect(find.text('Performing at The Casbah (San Diego, CA)'), findsOneWidget);
      expect(find.text('End Live'), findsOneWidget);

      // 2. Tap End Live to trigger safety confirmation dialog
      await tester.tap(find.text('End Live'));
      await tester.pumpAndSettle();

      expect(find.text('End Live Band Performance?'), findsOneWidget);
      expect(
        find.text('This will stop broadcasting The Midnight Echoes on the live map and reconcile all collected tips to the band treasury.'),
        findsOneWidget,
      );
      expect(find.text('Keep Playing'), findsOneWidget);
      expect(find.text('End Set'), findsOneWidget);

      // Tap End Set
      await tester.tap(find.text('End Set'));
      await tester.pumpAndSettle();

      // Stage returns to idle
      expect(find.text('READY TO PERFORM'), findsOneWidget);
    });
  });
}
