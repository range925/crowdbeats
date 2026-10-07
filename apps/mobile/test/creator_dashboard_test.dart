// Crowdbeats V2 — Solo & Band Mobile Dashboard Test Suite (Phase 3)
// Tests calm financial presentation, role adaptation, KYC states, quick actions & pull-to-refresh.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/creator/dashboard/creator_home_tab.dart';
import 'package:crowdbeats_mobile/ui/creator/dashboard/solo_musician_dashboard.dart';
import 'package:crowdbeats_mobile/ui/creator/dashboard/band_mobile_dashboard.dart';

void main() {
  group('Phase 3 — Solo & Band Mobile Dashboards', () {
    testWidgets('SoloMusicianDashboard renders calm financial metrics, KYC banner & quick actions', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: SoloMusicianDashboard(),
          ),
        ),
      );

      // Verify KYC Banner
      expect(find.text('Complete Stripe KYC Verification'), findsOneWidget);

      // Verify Calm Financial Metrics
      expect(find.text('AVAILABLE BALANCE'), findsOneWidget);
      expect(find.text(r'$480.00'), findsOneWidget);
      expect(find.text('Ready for payout'), findsOneWidget);
      expect(find.text('TODAY\'S TIPS'), findsOneWidget);
      expect(find.text(r'$125.00'), findsOneWidget);

      // Verify Action Item & Quick Actions
      expect(find.text('ACTION REQUIRED'), findsOneWidget);
      expect(find.text(r'Withdraw Available Funds ($480.00)'), findsOneWidget);
      expect(find.text('NEXT PERFORMANCE'), findsOneWidget);
      expect(find.text('Sunset Lounge'), findsOneWidget);
      expect(find.text('QUICK ACTIONS'), findsOneWidget);
      expect(find.text('Check In'), findsWidgets);
      expect(find.text('RECENT ACTIVITY'), findsOneWidget);
    });

    testWidgets('BandMobileDashboard renders Treasury, personal split allocation & governance item', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      container.read(creatorContextProvider.notifier).switchContext(
            const CreatorContextItem(
              id: 'band_midnight',
              name: 'The Midnight Echoes',
              type: 'band',
              role: 'BAND_FOUNDER',
            ),
          );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: BandMobileDashboard(),
          ),
        ),
      );

      // Verify Band Header & Role
      expect(find.text('The Midnight Echoes'), findsOneWidget);
      expect(find.text('Your Role: BAND_FOUNDER (40% Split)'), findsOneWidget);

      // Verify Band Treasury and Personal Split Cards
      expect(find.text('BAND TREASURY'), findsOneWidget);
      expect(find.text(r'$1,850.00'), findsOneWidget);
      expect(find.text('YOUR SPLIT (40%)'), findsOneWidget);
      expect(find.text(r'$740.00'), findsOneWidget);

      // Verify Governance Item
      expect(find.text('Split Modification Approval Required'), findsOneWidget);
      expect(find.text('VOTE'), findsOneWidget);

      // Verify Band Quick Actions
      expect(find.text('Check In Band'), findsOneWidget);
      expect(find.text('Splits'), findsOneWidget);
      expect(find.text('Members'), findsOneWidget);
    });

    testWidgets('CreatorHomeTab dynamically swaps between Solo and Band dashboard on context switch', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: CreatorHomeTab(),
          ),
        ),
      );

      // Initially Solo Dashboard
      expect(find.text('AVAILABLE BALANCE'), findsOneWidget);
      expect(find.text('BAND TREASURY'), findsNothing);

      // Switch context to Band
      container.read(creatorContextProvider.notifier).switchContext(
            const CreatorContextItem(
              id: 'band_midnight',
              name: 'The Midnight Echoes',
              type: 'band',
              role: 'BAND_FOUNDER',
            ),
          );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Now Band Dashboard
      expect(find.text('BAND TREASURY'), findsOneWidget);
      expect(find.text('AVAILABLE BALANCE'), findsNothing);
    });
  });
}
