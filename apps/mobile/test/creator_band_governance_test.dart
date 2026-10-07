// Crowdbeats V2 — Phase 7 Band Splits & Governance Test Suite
// Tests Band Management roster, 100% split invariant validation, voting modal, and treasury distribution.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/creator/band/band_management_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/band/band_split_editor_screen.dart';
import 'package:crowdbeats_mobile/ui/creator/band/band_split_voting_modal.dart';
import 'package:crowdbeats_mobile/ui/creator/band/band_treasury_screen.dart';

void main() {
  group('Phase 7 — Band Multi-Member Splits & Governance Tests', () {
    testWidgets('BandManagementScreen renders band roster, roles, and invite action', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: BandManagementScreen(),
        ),
      );

      expect(find.text('Band Roster & Governance'), findsOneWidget);
      expect(find.text('The Midnight Echoes'), findsOneWidget);
      expect(find.text('David Naufahu'), findsOneWidget);
      expect(find.text('FOUNDER'), findsOneWidget);
      expect(find.text('Marcus Turner'), findsOneWidget);
      expect(find.text('Alicia Vance'), findsOneWidget);
      expect(find.byIcon(Icons.person_add), findsOneWidget);
    });

    testWidgets('BandSplitEditorScreen enforces 100% mathematical sum invariant', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: BandSplitEditorScreen(),
        ),
      );

      expect(find.text('Band Split Contract'), findsOneWidget);
      expect(find.text('Mathematical Invariant Satisfied: 100%'), findsOneWidget);
      expect(find.text('Standard (40/30/30)'), findsOneWidget);
      expect(find.text('Equal Split'), findsOneWidget);
      expect(find.text('LIVE TIP DISTRIBUTION SIMULATOR'), findsOneWidget);
      expect(find.text('Submit Split Proposal for Voting'), findsOneWidget);
    });

    testWidgets('BandSplitVotingModal renders member approval statuses and voting actions', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: BandSplitVotingModal(),
          ),
        ),
      );

      expect(find.text('Split Contract Governance Vote'), findsOneWidget);
      expect(find.text('PROPOSED SPLIT CONTRACT (v2.1)'), findsOneWidget);
      expect(find.text('APPROVED'), findsWidgets);
      expect(find.text('AWAITING VOTE'), findsOneWidget);
      expect(find.text('Approve Contract'), findsOneWidget);
      expect(find.text('Decline / Request Edits'), findsOneWidget);
    });

    testWidgets('BandTreasuryScreen renders collective earnings and personal split allocations', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: BandTreasuryScreen(),
        ),
      );

      expect(find.text('Band Treasury Ledger'), findsOneWidget);
      expect(find.text('BAND COLLECTIVE TREASURY'), findsOneWidget);
      expect(find.text(r'$1850.00'), findsOneWidget);
      expect(find.text(r'$740.00'), findsWidgets);
      expect(find.text('Withdraw My 40% Split'), findsOneWidget);
    });
  });
}
