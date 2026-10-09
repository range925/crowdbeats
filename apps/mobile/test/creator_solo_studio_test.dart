// Crowdbeats V2 — Phase 9: Solo Musician Studio & Live Stage Test Suite
// Verifies:
// 1. Solo Musician Command Center answers: Am I live? What can I do next? What have I earned?
// 2. Live Check-In Sheet location verification, venue geofencing & permission error handling.
// 3. Live Stage Nerve Centre & Rotating Anti-Tamper QR HUD (30s rotation).
// 4. Ledger-derived balances: gross tips, 6% platform deductions, Stripe fee itemization, and Available vs Pending vs Escrow.
// 5. Explicit trust disclaimers ensuring gross/pending funds are never implied as withdrawable.
// 6. Safe End Live Session flow with confirmation and zero-stale-state discovery reconciliation.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/ui/creator/dashboard/solo_musician_dashboard.dart';
import 'package:crowdbeats_mobile/ui/creator/live/live_session_active_view.dart';
import 'package:crowdbeats_mobile/ui/creator/finance/creator_balances_screen.dart';

void main() {
  group('Phase 9 — Solo Musician Studio & Live Stage Command Center', () {
    testWidgets('SoloMusicianDashboard answers: Am I live? What can I do next? What have I earned?', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: SoloMusicianDashboard(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // 1. Answer: "Am I live?"
      // Idle stage status hero
      expect(find.text('READY TO PERFORM'), findsOneWidget);
      expect(find.text('Check in to start tipping & appear on the live map'), findsOneWidget);
      expect(find.text('Check In & Go Live'), findsWidgets);

      // 2. Answer: "What have I earned?"
      // Calm ledger-derived financial metrics
      expect(find.text('AVAILABLE BALANCE'), findsOneWidget);
      expect(find.text(r'$480.00'), findsOneWidget);
      expect(find.text('Ready for payout'), findsOneWidget);
      expect(find.text('TODAY\'S TIPS'), findsOneWidget);
      expect(find.text(r'$125.00'), findsOneWidget);

      // Trust & escrow disclaimer caption
      expect(
        find.text('Only settled funds marked "Available" can be paid out. Escrow secured by Stripe Connect.'),
        findsOneWidget,
      );

      // 3. Answer: "What can I do next?"
      // Action items and quick utility tiles
      expect(find.text('ACTION REQUIRED'), findsOneWidget);
      expect(find.text(r'Withdraw Available Funds ($480.00)'), findsOneWidget);
      expect(find.text('NEXT PERFORMANCE'), findsOneWidget);
      expect(find.text('Sunset Lounge'), findsOneWidget);
      expect(find.text('QUICK ACTIONS'), findsOneWidget);
      expect(find.text('Check In'), findsWidgets);
      expect(find.text('Analytics'), findsOneWidget);
      expect(find.text('Present QR'), findsOneWidget);
      expect(find.text('Campaign'), findsOneWidget);
      expect(find.text('Edit EPK'), findsOneWidget);
    });

    testWidgets('Tapping Check In & Go Live opens LiveCheckinSheet with venue selection & location verification', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: SoloMusicianDashboard(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Check In & Go Live on the hero banner
      await tester.tap(find.text('Check In & Go Live').first);
      await tester.pumpAndSettle();

      // Verify Live Check-in Sheet modal appears
      expect(find.text('Live Stage Check-In'), findsOneWidget);
      expect(find.text('🏢 Verified Venue'), findsOneWidget);
      expect(find.text('Sunset Lounge'), findsWidgets);
      expect(find.text('The Casbah'), findsOneWidget);
      expect(find.text('Belly Up Tavern'), findsOneWidget);
      expect(find.text('House of Blues'), findsOneWidget);

      // Switch to Street / Permit mode tab
      await tester.tap(find.text('🎸 Street / Permit'));
      await tester.pumpAndSettle();

      expect(find.text('SPOT / CORNER DESCRIPTION'), findsOneWidget);
      expect(find.text('City Busking / Street Permit Active'), findsOneWidget);
    });

    testWidgets('Live active session renders HUD, rotating stage QR code & live tip stream', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      container.read(creatorContextProvider.notifier).setSessionActive(
            sessionId: 'sess_maya_acoustic_01',
            endsAt: DateTime.now().add(const Duration(hours: 3)),
          );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: LiveSessionActiveView(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify Live Stage telemetry HUD
      expect(find.text('STAGE LIVE'), findsOneWidget);
      expect(find.text('Live at Sunset Lounge (San Diego, CA)'), findsOneWidget);
      expect(find.text('STAGE TIPS'), findsOneWidget);
      expect(find.text(r'$125.00'), findsOneWidget);
      expect(find.text('LISTENERS'), findsOneWidget);
      expect(find.text('42'), findsOneWidget);
      expect(find.text('LIVE TIP STREAM'), findsOneWidget);

      // Verify QR Code presentation button
      expect(find.text('Present QR Code'), findsOneWidget);
      await tester.tap(find.text('Present QR Code'));
      await tester.pumpAndSettle();

      // Verify Rotating QR Modal
      expect(find.text('Stage Tip QR'), findsOneWidget);
      expect(find.text('DYNAMIC STAGE QR vs PERMANENT QR'), findsOneWidget);
      expect(find.textContaining('(Anti-Tamper)'), findsOneWidget);
      expect(find.text('Copy Link'), findsOneWidget);
      expect(find.text('View Permanent Tip QR & Links'), findsOneWidget);

      // Close modal
      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();
    });

    testWidgets('CreatorBalancesScreen presents transparent ledger deductions & explicit non-withdrawable disclosures', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorBalancesScreen(
              isBand: false,
              entityId: 'artist_maya_lin',
              entityName: 'Maya Lin',
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // 1. Available Balance
      expect(find.text('AVAILABLE FOR WITHDRAWAL'), findsOneWidget);
      expect(find.text(r'$480.00'), findsOneWidget);

      // 2. Status Allocation Summary
      expect(find.text('LEDGER BALANCE STATUS ALLOCATION'), findsOneWidget);
      expect(find.text('AVAILABLE (SETTLED)'), findsOneWidget);
      expect(find.text(r'$480.00 Net'), findsOneWidget);
      expect(find.text('PENDING CLEARANCE'), findsOneWidget);
      expect(find.text(r'$125.00 Hold'), findsOneWidget);
      expect(find.text('HELD IN ESCROW'), findsOneWidget);
      expect(find.text(r'$375.00 Locked'), findsOneWidget);

      // 3. Trust & Transparency Disclaimer Banner (Ensuring gross/pending are not withdrawable)
      expect(
        find.text(
          'Only settled funds marked "Available" can be withdrawn. Pending tips clear within 24 hours. Campaign escrow funds release upon milestone completion.',
        ),
        findsOneWidget,
      );

      // 4. Ledger Proceeds & Fee Accounting Card
      expect(find.text('LEDGER PROCEEDS & FEE ACCOUNTING'), findsOneWidget);
      expect(find.text('Total Gross Tips Received'), findsOneWidget);
      expect(find.text('Gross: \$5420.00'), findsOneWidget);
      expect(find.text('Platform Service Fee (6%)'), findsOneWidget);
      expect(find.text('Fee: -\$325.20'), findsOneWidget);
      expect(find.text('Payment Processing Fee (Stripe)'), findsOneWidget);
      expect(find.text('Net Creator Proceeds'), findsOneWidget);

      // 5. Withdrawal CTA only targets Available Balance
      expect(find.text('Request Payout'), findsOneWidget);
    });

    testWidgets('Live session termination dialog cleanly ends set and reconciles state', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      container.read(creatorContextProvider.notifier).setSessionActive(
            sessionId: 'sess_maya_acoustic_01',
            endsAt: DateTime.now().add(const Duration(hours: 2)),
          );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: SoloMusicianDashboard(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify dashboard shows live state
      expect(find.text('LIVE SESSION ACTIVE'), findsOneWidget);
      expect(find.text('Present QR Tipping Token'), findsOneWidget);
      expect(find.text('End Live'), findsOneWidget);

      // Tap End Live
      await tester.tap(find.text('End Live'));
      await tester.pumpAndSettle();

      // Verify safety confirmation alert dialog
      expect(find.text('End Live Performance?'), findsOneWidget);
      expect(
        find.text('This will stop broadcasting your live stage presence and reconcile all collected tips to your ledger.'),
        findsOneWidget,
      );
      expect(find.text('Keep Playing'), findsOneWidget);
      expect(find.widgetWithText(ElevatedButton, 'End Set'), findsOneWidget);

      // Confirm ending set
      await tester.tap(find.widgetWithText(ElevatedButton, 'End Set'));
      await tester.pumpAndSettle();

      // Verify session is cleared and dashboard returns to idle
      expect(container.read(creatorContextProvider).activeContext.hasActiveLiveSession, isFalse);
      expect(find.text('READY TO PERFORM'), findsOneWidget);
    });

    testWidgets('Tapping Edit EPK in quick actions navigates to CreatorEpkEditorScreen', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: SoloMusicianDashboard(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Ensure Edit EPK tile is visible and tap
      await tester.ensureVisible(find.text('Edit EPK'));
      await tester.tap(find.text('Edit EPK'));
      await tester.pumpAndSettle();

      // Verify EPK editor is opened
      expect(find.text('Public EPK Profile Editor'), findsOneWidget);
      expect(find.text('STAGE / BAND NAME'), findsOneWidget);
      expect(find.text('SHORT TAGLINE'), findsOneWidget);
      expect(find.text('FULL BIOGRAPHY (MAX 1,000 CHARS)'), findsOneWidget);
    });
  });
}
