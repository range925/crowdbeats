// Crowdbeats V2 — Money Model (Dart Parity, Phase 3)
//
// Dart parity for: packages/contracts/src/common/money.ts
// Invariants:
// - amountCents is always a non-negative integer
// - currency is a supported ISO 4217 code
// - splitBps values must total exactly 10000
// - Largest Remainder Method (OD-09) used for band split distribution

// ─── Currency ─────────────────────────────────────────────────────────────────

enum Iso4217CurrencyCode {
  usd('USD'),
  eur('EUR'),
  gbp('GBP'),
  cad('CAD'),
  aud('AUD');

  const Iso4217CurrencyCode(this.value);
  final String value;

  static Iso4217CurrencyCode fromString(String s) =>
      Iso4217CurrencyCode.values.firstWhere((e) => e.value == s,
          orElse: () => throw ArgumentError('Unsupported currency: $s'));
}

// ─── Money Amount ─────────────────────────────────────────────────────────────

class MoneyAmount {
  const MoneyAmount({required this.amountCents, required this.currency});

  final int amountCents;
  final Iso4217CurrencyCode currency;

  void validate() {
    if (amountCents < 0) {
      throw ArgumentError('amountCents must be non-negative. Got $amountCents');
    }
  }

  factory MoneyAmount.fromJson(Map<String, dynamic> json) => MoneyAmount(
        amountCents: json['amountCents'] as int,
        currency: Iso4217CurrencyCode.fromString(json['currency'] as String),
      );

  Map<String, dynamic> toJson() => {
        'amountCents': amountCents,
        'currency': currency.value,
      };

  @override
  String toString() => '${currency.value} ${(amountCents / 100).toStringAsFixed(2)}';
}

// ─── Platform Fee Constants ───────────────────────────────────────────────────

// Platform fee in basis points. 600 = 6.00% Crowdbeats Platform Fee.
const int kPlatformFeeBps = 600;

// Mandatory disclosure notice
const String kPlatformFeeDisclosure =
    'Crowdbeats charges a 6% platform fee. Stripe payment-processing and applicable Stripe Connect fees are additional.';

// Fan refund window. OD-10 default: 24 hours.
const Duration kFanRefundWindow = Duration(hours: 24);

// Minimum payout in cents. OD-10 default: $10.00.
const int kPayoutMinimumCents = 1000;

// ─── Band Split ───────────────────────────────────────────────────────────────

const int kSplitTotalBps = 10000;

class MemberSplitBps {
  const MemberSplitBps({required this.uid, required this.splitBps});

  final String uid;
  final int splitBps;

  factory MemberSplitBps.fromJson(Map<String, dynamic> json) => MemberSplitBps(
        uid: json['uid'] as String,
        splitBps: json['splitBps'] as int,
      );

  Map<String, dynamic> toJson() => {'uid': uid, 'splitBps': splitBps};
}

void validateSplitConfig(List<MemberSplitBps> members) {
  if (members.isEmpty) throw ArgumentError('Split config must have at least one member.');
  final total = members.fold<int>(0, (sum, m) => sum + m.splitBps);
  if (total != kSplitTotalBps) {
    throw ArgumentError('Split total must be $kSplitTotalBps bps. Got $total.');
  }
}

// Largest Remainder Method (OD-09) for integer cent distribution.
Map<String, int> distributeLargestRemainder(int amountCents, List<MemberSplitBps> members) {
  validateSplitConfig(members);
  final exactShares = members.map((m) {
    final exact = amountCents * m.splitBps / kSplitTotalBps;
    return _Share(uid: m.uid, exact: exact, floor: exact.floor(), remainder: exact % 1);
  }).toList();

  final floorTotal = exactShares.fold<int>(0, (s, e) => s + e.floor);
  final remainderCents = amountCents - floorTotal;

  final result = {for (final s in exactShares) s.uid: s.floor};
  final sorted = List<_Share>.from(exactShares)..sort((a, b) => b.remainder.compareTo(a.remainder));
  for (var i = 0; i < remainderCents; i++) {
    result[sorted[i].uid] = result[sorted[i].uid]! + 1;
  }
  return result;
}

class _Share {
  _Share({required this.uid, required this.exact, required this.floor, required this.remainder});
  final String uid;
  final double exact;
  final int floor;
  final double remainder;
}

// ─── Fee Breakdown ────────────────────────────────────────────────────────────

class FeeBreakdown {
  const FeeBreakdown({
    required this.grossAmountCents,
    required this.platformFeeCents,
    this.stripeFeeCents = 0,
    int? totalDeductionsCents,
    required this.netAmountCents,
    required this.currency,
    this.platformFeePercent = 6.0,
    this.stripeFeePercent = 2.9,
    this.stripeFixedFeeCents = 30,
    this.stripeDailyRateDate = '',
  }) : totalDeductionsCents = totalDeductionsCents ?? (platformFeeCents + stripeFeeCents);

  final int grossAmountCents;
  final int platformFeeCents;
  final int stripeFeeCents;
  final int totalDeductionsCents;
  final int netAmountCents;
  final Iso4217CurrencyCode currency;
  final double platformFeePercent;
  final double stripeFeePercent;
  final int stripeFixedFeeCents;
  final String stripeDailyRateDate;
}

FeeBreakdown calculateFeeBreakdown(
  int grossAmountCents,
  Iso4217CurrencyCode currency, {
  int feeBps = kPlatformFeeBps,
  int stripeBps = 290,
  int stripeFixedCents = 30,
  String stripeDailyRateDate = '',
}) {
  final platformFeeCents = (grossAmountCents * feeBps ~/ 10000);
  final stripeFeeCents = (grossAmountCents * stripeBps ~/ 10000) + stripeFixedCents;
  final totalDeductionsCents = platformFeeCents + stripeFeeCents;
  final netAmountCents = grossAmountCents > totalDeductionsCents
      ? grossAmountCents - totalDeductionsCents
      : 0;
  return FeeBreakdown(
    grossAmountCents: grossAmountCents,
    platformFeeCents: platformFeeCents,
    stripeFeeCents: stripeFeeCents,
    totalDeductionsCents: totalDeductionsCents,
    netAmountCents: netAmountCents,
    currency: currency,
    platformFeePercent: feeBps / 100.0,
    stripeFeePercent: stripeBps / 100.0,
    stripeFixedFeeCents: stripeFixedCents,
    stripeDailyRateDate: stripeDailyRateDate,
  );
}
