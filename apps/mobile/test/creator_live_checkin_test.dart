// Crowdbeats V2 — Live Check-In, Rotating QR & Session Management Test Suite (Phase 4)
// Tests Venue Check-In, Street Mode, Rotating QR generator, Live Session Active Nerve Centre & Band Split Summary.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/creator/live/creator_live_tab.dart';
import 'package:crowdbeats_mobile/ui/creator/live/live_checkin_sheet.dart';
import 'package:crowdbeats_mobile/ui/creator/live/rotating_qr_modal.dart';
import 'package:crowdbeats_mobile/ui/creator/live/session_summary_modal.dart';

void main() {
  group('Phase 4 — Live Check-In, Rotating QR & Session Lifecycle Tests', () {
    testWidgets('CreatorLiveTab renders Idle Stage Launchpad with checklist when idle', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CreatorLiveTab(),
          ),
        ),
      );

      expect(find.text('Ready to take the stage?'), findsOneWidget);
      expect(find.text('Check In & Go Live'), findsOneWidget);
      expect(find.text('STAGE CHECKLIST'), findsOneWidget);
      expect(find.text('Stripe Payouts Active'), findsOneWidget);
      expect(find.text('Anti-Tamper QR Configured'), findsOneWidget);
    });

    testWidgets('LiveCheckinSheet supports Venue mode and Street/Permit mode selection', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: LiveCheckinSheet(),
            ),
          ),
        ),
      );

      // Verify Venue mode
      expect(find.text('Live Stage Check-In'), findsOneWidget);
      expect(find.text('🏢 Verified Venue'), findsOneWidget);
      expect(find.text('🎸 Street / Permit'), findsOneWidget);
      expect(find.text('Sunset Lounge'), findsOneWidget);
      expect(find.text('The Casbah'), findsOneWidget);

      // Toggle to Street / Permit mode
      await tester.tap(find.text('🎸 Street / Permit'));
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('GPS Freshness Verified'), findsOneWidget);
      expect(find.text('City Busking / Street Permit Active'), findsOneWidget);
    });

    testWidgets('RotatingQrModal displays rotating anti-tamper countdown and static backup switch', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: RotatingQrModal(
              performerName: 'Elena Cruz',
              sessionId: 'session_test_123',
            ),
          ),
        ),
      );

      expect(find.text('Stage Tip QR'), findsOneWidget);
      expect(find.text('Elena Cruz'), findsOneWidget);
      expect(find.text('Scan to Tip Elena Cruz'), findsOneWidget);
      expect(find.text('Static Signage Backup'), findsOneWidget);
      expect(find.text('Copy Link'), findsOneWidget);
      expect(find.text('Add to Wallet'), findsOneWidget);

      // Toggle static backup
      await tester.tap(find.byType(Switch));
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('STATIC BACKUP QR'), findsOneWidget);
    });

    testWidgets('SessionSummaryModal calculates Band splits and displays reconciled metrics', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      bool doneCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SessionSummaryModal(
              performerName: 'The Midnight Echoes',
              venueName: 'The Casbah',
              durationText: '2h 15m',
              grossTipsCents: 20000, // $200.00
              tipCount: 18,
              newFollowers: 12,
              isBand: true,
              userSplitPercent: 40,
              onDone: () => doneCalled = true,
            ),
          ),
        ),
      );

      expect(find.text('Performance Completed!'), findsOneWidget);
      expect(find.text(r'$200.00'), findsOneWidget);
      expect(find.text('Your Split (40%):'), findsOneWidget);
      expect(find.text(r'$80.00'), findsOneWidget);
      expect(find.text('18'), findsOneWidget);
      expect(find.text('+12'), findsOneWidget);

      await tester.tap(find.text('Back to Creator Dashboard'));
      expect(doneCalled, isTrue);
    });
  });
}
