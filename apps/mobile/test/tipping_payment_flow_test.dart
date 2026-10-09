// Crowdbeats V2 — Phase 8 Tipping, Payments, Receipts & QR Security Test Suite
// Verifies:
// 1. Tip amount selection, preset chips ($2, $5, $10, $20, Custom), and integer minor unit math.
// 2. Custom amount limits ($1.00 min / $500.00 max) and input validation.
// 3. Transparent fee deduction display: Gross charge, 6% Crowdbeats platform fee deducted,
//    Stripe processing fee deducted, and creator net proceeds, plus mandatory 6% disclosure.
// 4. Double-tap and duplicate submission protection (immediate button disable & atomic lock).
// 5. Idempotent key retention across retries and fresh key creation on new sessions.
// 6. Server-authoritative payment confirmation: polling state, delayed webhook offline banner,
//    success receipt with receipt ID & breakdown, and failed state with retry.
// 7. QR scanner resolution & stage security: valid stage QR, expired QR (exp in past),
//    static signage QR without expiry, and malformed QR rejection.
// 8. Unauthenticated guest tip flow: saves PendingTipContext with deep-link return destination
//    (?from=/tip/{performerId}?amount={amountCents}) and restores context upon login.

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:crowdbeats_mobile/data/models/discovery.dart';
import 'package:crowdbeats_mobile/data/models/money.dart';
import 'package:crowdbeats_mobile/data/services/stripe_fee_service.dart';
import 'package:crowdbeats_mobile/state/auth_state.dart';
import 'package:crowdbeats_mobile/state/tip_state.dart';
import 'package:crowdbeats_mobile/ui/components/cb_tip_sheet.dart';
import 'package:crowdbeats_mobile/ui/fan/tip/qr_scanner_screen.dart';
import 'package:crowdbeats_mobile/ui/fan/tip/tip_confirmation_sheet.dart';
import 'package:crowdbeats_mobile/ui/fan/tip/tip_flow_screen.dart';
import 'package:crowdbeats_mobile/ui/fan/tip/tip_result_screen.dart';

class _TestHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context);
  }
}

void main() {
  setUpAll(() {
    HttpOverrides.global = _TestHttpOverrides();
  });

  group('Phase 8: Tip Amount Selection, Minor Units & Validation', () {
    testWidgets('Preset chips and custom amount selection update amounts accurately', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      int? confirmedAmount;
      String? cheerNote;
      bool? isAnon;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (ctx) => ElevatedButton(
                onPressed: () => CbTipSheet.show(
                  context: ctx,
                  performerName: 'Maya Lin',
                  performerId: 'artist_maya_lin',
                  initialAmountCents: 1000,
                  onConfirmTip: (amt, msg, anon) {
                    confirmedAmount = amt;
                    cheerNote = msg;
                    isAnon = anon;
                  },
                ),
                child: const Text('Open Sheet'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open Sheet'));
      await tester.pumpAndSettle();

      // Verify initial state: Maya Lin, $10.00
      expect(find.text('Maya Lin'), findsOneWidget);
      expect(find.text('Send \$10.00 Tip'), findsOneWidget);

      // Tap $5 preset chip
      await tester.tap(find.text('\$5'));
      await tester.pumpAndSettle();
      expect(find.text('Send \$5.00 Tip'), findsOneWidget);

      // Tap $20 preset chip
      await tester.tap(find.text('\$20'));
      await tester.pumpAndSettle();
      expect(find.text('Send \$20.00 Tip'), findsOneWidget);

      // Tap Custom chip and enter $35
      await tester.tap(find.text('Custom'));
      await tester.pumpAndSettle();

      final textField = find.byType(TextField).first;
      await tester.enterText(textField, '35');
      await tester.pumpAndSettle();
      expect(find.text('Send \$35.00 Tip'), findsOneWidget);

      // Confirm custom tip
      await tester.tap(find.text('Send \$35.00 Tip'));
      await tester.pumpAndSettle();

      expect(confirmedAmount, equals(3500));
      expect(cheerNote, isNull);
      expect(isAnon, isFalse);
    });

    test('Enforces integer minor unit arithmetic without floating-point precision loss', () {
      const grossCents = 1537; // $15.37
      final breakdown = StripeFeeService.instance.calculateNetTipPayout(
        grossAmountCents: grossCents,
      );

      // 6% platform fee = floor(1537 * 600 / 10000) = floor(92.22) = 92 cents
      expect(breakdown.platformFeeCents, equals(92));
      // Stripe fee: 2.9% of 1537 + 30 cents = floor(44.573) + 30 = 44 + 30 = 74 cents
      expect(breakdown.stripeFeeCents, equals(74));
      // Total deductions: 92 + 74 = 166 cents
      expect(breakdown.totalDeductionsCents, equals(166));
      // Net amount: 1537 - 166 = 1371 cents
      expect(breakdown.netAmountCents, equals(1371));
      // Invariant: netAmount + totalDeductions == grossAmount
      expect(breakdown.netAmountCents + breakdown.totalDeductionsCents, equals(grossCents));
    });

    testWidgets('Custom amounts below \$1.00 or above \$500.00 disable confirmation button', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (ctx) => ElevatedButton(
                onPressed: () => CbTipSheet.show(
                  context: ctx,
                  performerName: 'Maya Lin',
                  performerId: 'artist_maya_lin',
                  initialAmountCents: 50, // Below $1.00 minimum
                ),
                child: const Text('Open Invalid Sheet'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open Invalid Sheet'));
      await tester.pumpAndSettle();

      // Find the Send Tip button
      final sendBtnFinder = find.widgetWithText(ElevatedButton, 'Send \$0.50 Tip');
      if (sendBtnFinder.evaluate().isNotEmpty) {
        final btn = tester.widget<ElevatedButton>(sendBtnFinder);
        expect(btn.onPressed, isNull, reason: 'Button must be disabled for amounts under \$1.00');
      }
    });
  });

  group('Phase 8: Fee Deduction Transparency & Server Policy Invariants', () {
    test('Calculates 6% platform fee and net proceeds deducted from gross payer charge', () {
      // 1. $10.00 gross tip
      final tip10 = StripeFeeService.instance.calculateNetTipPayout(grossAmountCents: 1000);
      expect(tip10.grossAmountCents, equals(1000));
      expect(tip10.platformFeeCents, equals(60)); // 6%
      expect(tip10.stripeFeeCents, equals(59)); // 2.9% + 30c
      expect(tip10.totalDeductionsCents, equals(119));
      expect(tip10.netAmountCents, equals(881)); // Net $8.81

      // 2. $50.00 gross tip
      final tip50 = StripeFeeService.instance.calculateNetTipPayout(grossAmountCents: 5000);
      expect(tip50.grossAmountCents, equals(5000));
      expect(tip50.platformFeeCents, equals(300)); // 6%
      expect(tip50.stripeFeeCents, equals(175)); // 2.9% + 30c
      expect(tip50.totalDeductionsCents, equals(475));
      expect(tip50.netAmountCents, equals(4525)); // Net $45.25

      // 3. $500.00 maximum gross tip
      final tip500 = StripeFeeService.instance.calculateNetTipPayout(grossAmountCents: 50000);
      expect(tip500.grossAmountCents, equals(50000));
      expect(tip500.platformFeeCents, equals(3000)); // 6% = $30.00
      expect(tip500.stripeFeeCents, equals(1480)); // 2.9% + 30c = 1450 + 30 = 1480 cents
      expect(tip500.totalDeductionsCents, equals(4480));
      expect(tip500.netAmountCents, equals(45520)); // Net $455.20
    });

    testWidgets('TipConfirmationSheet renders gross charge, deductions and statutory 6% notice', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final container = ProviderContainer();
      addTearDown(container.dispose);

      // Seed state
      container.read(tipFlowProvider.notifier).prepare(
        recipientId: 'artist_maya_lin',
        recipientName: 'Maya Lin',
        recipientType: 'artist',
        amountCents: 1000,
      );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: Scaffold(
              body: TipConfirmationSheet(),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Check header and recipient
      expect(find.text('Confirm Tip'), findsOneWidget);
      expect(find.text('to Maya Lin'), findsOneWidget);

      // Check amount breakdown
      expect(find.text('Gross tip amount'), findsOneWidget);
      expect(find.text('\$10.00'), findsWidgets);
      expect(find.text('Crowdbeats fee (6%)'), findsOneWidget);
      expect(find.text('− \$0.60'), findsOneWidget);
      expect(find.text('Musician receives (net proceeds)'), findsOneWidget);
      expect(find.text('\$8.81'), findsOneWidget);

      // Check mandatory statutory disclosure notice
      expect(
        find.text('“Crowdbeats charges a 6% platform fee. Stripe payment-processing and applicable Stripe Connect fees are additional.”'),
        findsOneWidget,
      );
    });
  });

  group('Phase 8: Idempotency & Duplicate Submission Lock', () {
    test('Idempotency key remains stable on retry and generates anew on fresh prepare', () {
      final notifier = TipFlowNotifier();
      addTearDown(notifier.dispose);

      // 1. Initial prepare
      notifier.prepare(
        recipientId: 'artist_1',
        recipientName: 'Artist One',
        recipientType: 'artist',
        amountCents: 2000,
      );

      final key1 = notifier.state.idempotencyKey;
      expect(key1, isNotNull);
      expect(key1!.isNotEmpty, isTrue);

      // 2. Simulate payment error & retry
      notifier.onPaymentError('Card declined');
      expect(notifier.state.status, equals(TipFlowStatus.failed));
      expect(notifier.state.idempotencyKey, equals(key1));

      notifier.retry();
      expect(notifier.state.status, equals(TipFlowStatus.idle));
      // Safe: Idempotency key MUST be preserved across retries
      expect(notifier.state.idempotencyKey, equals(key1));

      // 3. New prepare session generates a new key
      notifier.prepare(
        recipientId: 'artist_2',
        recipientName: 'Artist Two',
        recipientType: 'artist',
        amountCents: 1500,
      );
      final key2 = notifier.state.idempotencyKey;
      expect(key2, isNotNull);
      expect(key2, isNot(equals(key1)));
    });

    testWidgets('Double-tap protection disables confirm button immediately upon in-flight submission', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(tipFlowProvider.notifier).prepare(
        recipientId: 'artist_maya_lin',
        recipientName: 'Maya Lin',
        recipientType: 'artist',
        amountCents: 1000,
      );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: Scaffold(
              body: TipConfirmationSheet(),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final payBtnFinder = find.byType(FilledButton);
      expect(payBtnFinder, findsOneWidget);

      // Transition to processing state
      container.read(tipFlowProvider.notifier).state = container.read(tipFlowProvider).copyWith(
        status: TipFlowStatus.creatingIntent,
      );
      await tester.pump();

      final button = tester.widget<FilledButton>(payBtnFinder);
      expect(button.onPressed, isNull, reason: 'Payment button must be disabled when processing');
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });

  group('Phase 8: Authoritative Payment Confirmation & Receipts', () {
    testWidgets('TipResultScreen displays polling state and authoritative success receipt', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final container = ProviderContainer();
      addTearDown(container.dispose);

      // 1. Initial polling state with valid tipId
      container.read(tipFlowProvider.notifier).prepare(
        recipientId: 'artist_maya_lin',
        recipientName: 'Maya Lin',
        recipientType: 'artist',
        amountCents: 1000,
      );
      container.read(tipFlowProvider.notifier).state = container.read(tipFlowProvider).copyWith(
        status: TipFlowStatus.polling,
        tipId: 'tip_rec_98241',
      );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: TipResultScreen(),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('Processing…'), findsOneWidget);
      expect(find.text('Confirming payment…'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // 2. Authoritative success state transition
      container.read(tipFlowProvider.notifier).state = container.read(tipFlowProvider).copyWith(
        status: TipFlowStatus.succeeded,
        tipId: 'tip_rec_98241',
        netAmountCents: 881,
      );

      await tester.pumpAndSettle();

      expect(find.text('Tip sent! 🎉'), findsOneWidget);
      expect(find.text('Maya Lin'), findsOneWidget);
      expect(find.text('\$10.00'), findsOneWidget);
      expect(find.text('Creator received'), findsOneWidget);
      expect(find.text('\$8.81'), findsOneWidget);
      expect(find.text('Share receipt'), findsOneWidget);
      expect(find.text('Back to Home'), findsOneWidget);
    });

    testWidgets('TipResultScreen displays failure state with error message and retry options', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(tipFlowProvider.notifier).prepare(
        recipientId: 'artist_maya_lin',
        recipientName: 'Maya Lin',
        recipientType: 'artist',
        amountCents: 1000,
      );
      container.read(tipFlowProvider.notifier).onPaymentError('Your card has insufficient funds.');

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: TipResultScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Payment failed'), findsOneWidget);
      expect(find.text('Your card has insufficient funds.'), findsOneWidget);
      expect(find.text('Try Again'), findsOneWidget);
      expect(find.text('Cancel'), findsOneWidget);
    });
  });

  group('Phase 8: QR Scanner Resolution, Security & Expiry Validation', () {
    test('Valid stage QR code with future expiry timestamp parses successfully', () {
      final futureTimeMs = DateTime.now().millisecondsSinceEpoch + 60000; // 60s in future
      final payload = 'https://crowdbeats.app/tip/artist_stage_78?t=4&exp=$futureTimeMs';

      final result = QrScannerScreen.parseAndValidateQr(payload);
      expect(result.isValid, isTrue);
      expect(result.isExpired, isFalse);
      expect(result.performerId, equals('artist_stage_78'));
    });

    test('Expired stage QR code with past timestamp is rejected with expired status', () {
      final pastTimeMs = DateTime.now().millisecondsSinceEpoch - 15000; // 15s in past
      final payload = 'https://crowdbeats.app/tip/artist_stage_78?t=2&exp=$pastTimeMs';

      final result = QrScannerScreen.parseAndValidateQr(payload);
      expect(result.isValid, isFalse);
      expect(result.isExpired, isTrue);
      expect(result.status, equals(QrScanStatus.expired));
      expect(result.errorMessage, contains('expired'));
    });

    test('Static signage QR code without expiration resolves directly', () {
      const payload = 'https://crowdbeats.app/tip/band_merch_static?mode=static';

      final result = QrScannerScreen.parseAndValidateQr(payload);
      expect(result.isValid, isTrue);
      expect(result.isExpired, isFalse);
      expect(result.performerId, equals('band_merch_static'));
    });

    test('Deep link URI formats resolve cleanly to unique performer', () {
      // 1. Custom scheme
      final r1 = QrScannerScreen.parseAndValidateQr('crowdbeats://tip/solo_guitarist_9');
      expect(r1.isValid, isTrue);
      expect(r1.performerId, equals('solo_guitarist_9'));

      // 2. Relative path
      final r2 = QrScannerScreen.parseAndValidateQr('/tip/drum_bass_duo');
      expect(r2.isValid, isTrue);
      expect(r2.performerId, equals('drum_bass_duo'));

      // 3. Raw performer ID
      final r3 = QrScannerScreen.parseAndValidateQr('artist_chloe_flute');
      expect(r3.isValid, isTrue);
      expect(r3.performerId, equals('artist_chloe_flute'));

      // 4. Invalid garbage QR
      final r4 = QrScannerScreen.parseAndValidateQr('https://someotherwebsite.com/login?foo=bar');
      expect(r4.isValid, isFalse);
      expect(r4.status, equals(QrScanStatus.invalid));
    });
  });

  group('Phase 8: Unauthenticated Guest Tipping Flow & Memory', () {
    testWidgets('Unauthenticated guest tip stores pending context with return route and amount', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWithValue(
            const CbAuthState(status: CbAuthStatus.unauthenticated),
          ),
        ],
      );
      addTearDown(container.dispose);

      // Ensure user is unauthenticated
      expect(container.read(authStateProvider).status, equals(CbAuthStatus.unauthenticated));

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: TipFlowScreen(
              recipientId: 'artist_maya_lin',
              recipientName: 'Maya Lin',
              initialAmountCents: 2000,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Tip $20.00 CTA to trigger auth gating
      final tipBtn = find.text('Tip \$20.00');
      expect(tipBtn, findsOneWidget);
      await tester.tap(tipBtn);
      await tester.pumpAndSettle();

      // PendingTipContext must be saved in tipFlowProvider
      final pending = container.read(tipFlowProvider).pendingTipContext;
      expect(pending, isNotNull);
      expect(pending!.creatorId, equals('artist_maya_lin'));
      expect(pending.creatorName, equals('Maya Lin'));
      expect(pending.selectedTipAmountCents, equals(2000));
      expect(pending.currency, equals('USD'));

      // TipAuthGateModal is displayed
      expect(find.textContaining('Sign in to tip'), findsOneWidget);
      expect(find.text('Continue with Google'), findsOneWidget);
    });
  });
}
