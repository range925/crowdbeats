// Crowdbeats V2 — Tip Record Model (Dart Parity, Phase 3)
//
// Dart parity for: packages/contracts/src/financial/tip.ts

import 'money.dart';

enum TipStatus {
  pending, succeeded, distributed, refunded, failed, disputed;

  static TipStatus fromString(String s) => TipStatus.values.firstWhere(
      (e) => e.name == s, orElse: () => throw ArgumentError('Unknown TipStatus: $s'));
}

class TipRecord {
  const TipRecord({
    required this.tipId,
    required this.fanUid,
    required this.recipientId,
    required this.recipientType,
    required this.recipientName,
    required this.amountCents,
    required this.platformFeeCents,
    required this.netAmountCents,
    required this.currency,
    required this.status,
    required this.isAnonymous,
    required this.createdAt,
    required this.updatedAt,
    this.sessionId,
    this.message,
    this.refundedAt,
    this.refundReason,
    this.disputedAt,
  });

  final String tipId;
  final String fanUid;
  final String recipientId;
  final String recipientType;
  final String recipientName;
  final String? sessionId;
  final int amountCents;
  final int platformFeeCents;
  final int netAmountCents;
  final Iso4217CurrencyCode currency;
  final TipStatus status;
  final String? message;
  final bool isAnonymous;
  final String createdAt;
  final String updatedAt;
  final String? refundedAt;
  final String? refundReason;
  final String? disputedAt;

  factory TipRecord.fromJson(Map<String, dynamic> json) => TipRecord(
        tipId: json['tipId'] as String,
        fanUid: json['fanUid'] as String,
        recipientId: json['recipientId'] as String,
        recipientType: json['recipientType'] as String,
        recipientName: json['recipientName'] as String,
        amountCents: json['amountCents'] as int,
        platformFeeCents: json['platformFeeCents'] as int,
        netAmountCents: json['netAmountCents'] as int,
        currency: Iso4217CurrencyCode.fromString(json['currency'] as String),
        status: TipStatus.fromString(json['status'] as String),
        isAnonymous: json['isAnonymous'] as bool,
        createdAt: json['createdAt'] as String,
        updatedAt: json['updatedAt'] as String,
        sessionId: json['sessionId'] as String?,
        message: json['message'] as String?,
        refundedAt: json['refundedAt'] as String?,
        refundReason: json['refundReason'] as String?,
        disputedAt: json['disputedAt'] as String?,
      );
}

const int kTipMinimumCents = 100;
const int kTipMaximumCents = 50000;
const int kTipMessageMax = 200;
