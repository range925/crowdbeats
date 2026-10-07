// Crowdbeats V2 — Tip State (Riverpod) — Phase 6b
//
// Manages the active tip flow state and tip history.
// Phase 6b adds:
//   - lastUsedPaymentMethodId (for save-card prompt after first tip)
//   - savedPaymentMethodId param to createIntent (fast-path with saved PM)
//   - onPaymentError alias
//   - savedPmPreferenceProvider (SharedPreferences flag)

import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../firebase/tip_service.dart';
import '../data/models/discovery.dart';
import '../data/services/stripe_fee_service.dart';

// ── Tip flow status ───────────────────────────────────────────────────────────

enum TipFlowStatus {
  idle,
  creatingIntent,  // createTipIntent callable in flight
  awaitingPayment, // Stripe PaymentSheet open
  polling,         // waiting for webhook to update Firestore
  succeeded,
  failed,
  cancelled,
}

// ── Active tip state ──────────────────────────────────────────────────────────

class ActiveTipState {
  const ActiveTipState({
    this.status = TipFlowStatus.idle,
    this.tipId,
    this.clientSecret,
    this.amountCents,
    this.platformFeeCents,
    this.stripeFeeCents,
    this.totalDeductionsCents,
    this.netAmountCents,
    this.stripeDailyRateDate,
    this.recipientId,
    this.recipientName,
    this.recipientType,
    this.idempotencyKey,
    this.errorMessage,
    this.lastUsedPaymentMethodId,
    this.pendingTipContext,
  });

  final TipFlowStatus status;
  final String? tipId;
  final String? clientSecret;
  final int? amountCents;
  final int? platformFeeCents;
  final int? stripeFeeCents;
  final int? totalDeductionsCents;
  final int? netAmountCents;
  final String? stripeDailyRateDate;
  final String? recipientId;
  final String? recipientName;
  final String? recipientType;
  final String? idempotencyKey;
  final String? errorMessage;

  /// Set after PaymentSheet confirms — used for the save-card prompt.
  final String? lastUsedPaymentMethodId;

  /// Preserved tip context when unauthenticated visitor triggers tip auth gate
  final PendingTipContext? pendingTipContext;


  bool get isProcessing =>
      status == TipFlowStatus.creatingIntent ||
      status == TipFlowStatus.awaitingPayment ||
      status == TipFlowStatus.polling;

  ActiveTipState copyWith({
    TipFlowStatus? status,
    String? tipId,
    String? clientSecret,
    int? amountCents,
    int? platformFeeCents,
    int? stripeFeeCents,
    int? totalDeductionsCents,
    int? netAmountCents,
    String? stripeDailyRateDate,
    String? recipientId,
    String? recipientName,
    String? recipientType,
    String? idempotencyKey,
    String? errorMessage,
    String? lastUsedPaymentMethodId,
    PendingTipContext? pendingTipContext,
    bool clearPendingContext = false,
  }) {
    return ActiveTipState(
      status: status ?? this.status,
      tipId: tipId ?? this.tipId,
      clientSecret: clientSecret ?? this.clientSecret,
      amountCents: amountCents ?? this.amountCents,
      platformFeeCents: platformFeeCents ?? this.platformFeeCents,
      stripeFeeCents: stripeFeeCents ?? this.stripeFeeCents,
      totalDeductionsCents: totalDeductionsCents ?? this.totalDeductionsCents,
      netAmountCents: netAmountCents ?? this.netAmountCents,
      stripeDailyRateDate: stripeDailyRateDate ?? this.stripeDailyRateDate,
      recipientId: recipientId ?? this.recipientId,
      recipientName: recipientName ?? this.recipientName,
      recipientType: recipientType ?? this.recipientType,
      idempotencyKey: idempotencyKey ?? this.idempotencyKey,
      errorMessage: errorMessage ?? this.errorMessage,
      lastUsedPaymentMethodId:
          lastUsedPaymentMethodId ?? this.lastUsedPaymentMethodId,
      pendingTipContext: clearPendingContext ? null : (pendingTipContext ?? this.pendingTipContext),
    );
  }
}

// ── Tip Flow Notifier ─────────────────────────────────────────────────────────

class TipFlowNotifier extends StateNotifier<ActiveTipState> {
  TipFlowNotifier() : super(const ActiveTipState());

  final _uuid = const Uuid();
  StreamSubscription<Map<String, dynamic>?>? _tipSub;

  void savePendingTipContext(PendingTipContext context) {
    state = state.copyWith(pendingTipContext: context);
  }

  void clearPendingTipContext() {
    state = state.copyWith(clearPendingContext: true);
  }

  // ── Step 1: Set performer + amount ─────────────────────────────────────────

  void prepare({
    required String recipientId,
    required String recipientName,
    required String recipientType,
    required int amountCents,
  }) {
    final breakdown = StripeFeeService.instance.calculateNetTipPayout(
      grossAmountCents: amountCents,
    );
    state = ActiveTipState(
      status: TipFlowStatus.idle,
      recipientId: recipientId,
      recipientName: recipientName,
      recipientType: recipientType,
      amountCents: amountCents,
      platformFeeCents: breakdown.platformFeeCents,
      stripeFeeCents: breakdown.stripeFeeCents,
      totalDeductionsCents: breakdown.totalDeductionsCents,
      netAmountCents: breakdown.netAmountCents,
      stripeDailyRateDate: breakdown.stripeDailyRateDate,
      idempotencyKey: _uuid.v4(),
    );
  }

  // ── Step 2: Create PaymentIntent ───────────────────────────────────────────

  Future<String?> createIntent({
    String? sessionId,
    String? message,
    bool isAnonymous = false,
    String currency = 'USD',
    // If provided, server attaches this PM to the PI for the fast-path
    String? savedPaymentMethodId,
  }) async {
    if (state.recipientId == null || state.amountCents == null) return null;

    state = state.copyWith(status: TipFlowStatus.creatingIntent);
    try {
      final result = await TipService.instance.createTipIntent(
        recipientId: state.recipientId!,
        recipientType: state.recipientType ?? 'artist',
        amountCents: state.amountCents!,
        currency: currency,
        sessionId: sessionId,
        message: message,
        isAnonymous: isAnonymous,
        idempotencyKey: state.idempotencyKey!,
        savedPaymentMethodId: savedPaymentMethodId,
      );

      final tipId = result['tipId'] as String;
      final clientSecret = result['clientSecret'] as String;

      state = state.copyWith(
        status: TipFlowStatus.awaitingPayment,
        tipId: tipId,
        clientSecret: clientSecret,
        platformFeeCents: (result['platformFeeCents'] as num?)?.toInt(),
        stripeFeeCents: (result['stripeFeeCents'] as num?)?.toInt(),
        totalDeductionsCents: (result['totalDeductionsCents'] as num?)?.toInt(),
        netAmountCents: (result['netAmountCents'] as num?)?.toInt(),
      );
      return clientSecret;
    } catch (e) {
      state = state.copyWith(
        status: TipFlowStatus.failed,
        errorMessage: _extractMessage(e),
      );
      return null;
    }
  }

  // ── Step 3: Payment complete — start polling Firestore ─────────────────────

  void onPaymentSheetCompleted({String? paymentMethodId}) {
    if (state.tipId == null) return;
    state = state.copyWith(
      status: TipFlowStatus.polling,
      lastUsedPaymentMethodId: paymentMethodId,
    );
    _startPolling(state.tipId!);
  }

  void onPaymentSheetCancelled() {
    state = state.copyWith(status: TipFlowStatus.cancelled);
  }

  void onPaymentSheetFailed(String message) {
    state = state.copyWith(
      status: TipFlowStatus.failed,
      errorMessage: message,
    );
  }

  /// Alias used by tip_confirmation_sheet for non-cancel Stripe errors.
  void onPaymentError(String message) => onPaymentSheetFailed(message);

  // ── Retry (same idempotency key — safe) ───────────────────────────────────

  void retry() {
    state = state.copyWith(status: TipFlowStatus.idle);
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  void reset() {
    _tipSub?.cancel();
    _tipSub = null;
    state = const ActiveTipState();
  }

  // ── Firestore polling ──────────────────────────────────────────────────────

  void _startPolling(String tipId) {
    _tipSub?.cancel();
    _tipSub = TipService.instance.tipStream(tipId).listen((data) {
      if (data == null) return;
      final tipStatus = data['status'] as String?;
      if (tipStatus == 'succeeded') {
        state = state.copyWith(status: TipFlowStatus.succeeded);
        _tipSub?.cancel();
      } else if (tipStatus == 'failed') {
        state = state.copyWith(
          status: TipFlowStatus.failed,
          errorMessage: 'Payment failed. Please try again.',
        );
        _tipSub?.cancel();
      }
    });
  }

  String _extractMessage(Object e) {
    if (e is Exception) return e.toString().replaceAll('Exception: ', '');
    return 'An unexpected error occurred.';
  }

  @override
  void dispose() {
    _tipSub?.cancel();
    super.dispose();
  }
}

// ── Providers ─────────────────────────────────────────────────────────────────

final tipFlowProvider =
    StateNotifierProvider<TipFlowNotifier, ActiveTipState>(
  (ref) => TipFlowNotifier(),
);

final fanTipHistoryProvider = StreamProvider.family<
    List<Map<String, dynamic>>, String>((ref, fanUid) {
  return TipService.instance.fanTipsStream(fanUid: fanUid);
});

final tipDocProvider =
    StreamProvider.family<Map<String, dynamic>?, String>((ref, tipId) {
  return TipService.instance.tipStream(tipId);
});

final activeSessionsProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  return TipService.instance.activeSessionsStream();
});

final activeCampaignsProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  return TipService.instance.activeCampaignsStream();
});

// ── Saved PM preference ───────────────────────────────────────────────────────

/// Whether the user has already been prompted (and possibly saved) a card.
/// Key: 'cb_has_saved_pm' in SharedPreferences.
final savedPmPreferenceProvider =
    FutureProvider.autoDispose<bool>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool('cb_has_saved_pm') ?? false;
});
