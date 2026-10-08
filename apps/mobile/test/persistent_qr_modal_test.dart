// Crowdbeats V2 — Persistent Tipping QR & Distinction Tests

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crowdbeats_mobile/ui/components/persistent_qr_modal.dart';
import 'package:crowdbeats_mobile/ui/creator/live/rotating_qr_modal.dart';

void main() {
  group('Persistent QR Modal & Distinction Tests', () {
    testWidgets('PersistentQrModal renders canonical tip URL, immutable ID, and distinction copy for Solo Creator', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PersistentQrModal(
              performerId: 'usr_elena_cruz_123',
              performerName: 'Elena Cruz',
              isBand: false,
            ),
          ),
        ),
      );

      // Verify canonical URL and title
      expect(find.text('Direct Tipping QR Code & Links'), findsOneWidget);
      expect(find.text('Elena Cruz'), findsOneWidget);
      expect(find.text('Share your QR code so fans can open your tipping page directly.'), findsOneWidget);
      expect(find.text('https://crowdbeats.app/tip/usr_elena_cruz_123'), findsOneWidget);
      expect(find.text('Copy Direct Tip Link'), findsOneWidget);
      expect(find.text('Share Tip Link'), findsOneWidget);

      // Verify distinction callout
      expect(find.text('PERMANENT QR vs 90-SECOND LIVE STAGE QR'), findsOneWidget);
      expect(find.textContaining('Permanent QR (This Code): Never expires'), findsOneWidget);
      expect(find.textContaining('90s Dynamic Live Stage QR: Rotates on stage'), findsOneWidget);
    });

    testWidgets('PersistentQrModal renders Band entity copy when isBand is true', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PersistentQrModal(
              performerId: 'bnd_midnight_echoes',
              performerName: 'The Midnight Echoes',
              isBand: true,
            ),
          ),
        ),
      );

      expect(find.text('Band Direct Tip QR'), findsOneWidget);
      expect(find.text('The Midnight Echoes'), findsOneWidget);
      expect(find.text('Collective Band Treasury · Stripe Connect'), findsOneWidget);
      expect(find.text('https://crowdbeats.app/tip/bnd_midnight_echoes'), findsOneWidget);
      expect(find.textContaining('Tips go to the collective Band entity via Stripe Connect.'), findsOneWidget);
    });

    testWidgets('RotatingQrModal presents launcher for Permanent Tip QR & Links with clear distinction', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: RotatingQrModal(
              performerName: 'Elena Cruz',
              sessionId: 'session_xyz',
              performerId: 'usr_elena_cruz_123',
            ),
          ),
        ),
      );

      expect(find.text('View Permanent Tip QR & Links'), findsOneWidget);
      expect(find.text('DYNAMIC STAGE QR vs PERMANENT QR'), findsOneWidget);
      expect(find.textContaining('Dynamic Stage QR: Rotates every 30-90s'), findsOneWidget);
      expect(find.textContaining('Permanent Tip QR: Persistent link (https://crowdbeats.app/tip/usr_elena_cruz_123)'), findsOneWidget);
    });
  });
}
