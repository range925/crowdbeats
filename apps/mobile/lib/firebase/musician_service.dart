// Crowdbeats V2 — Musician Service (Phase 7)
//
// Callable wrappers for all performer-facing Cloud Functions:
// - Session: generateQrToken, (startSession/endSession already in tip_service.dart)
// - Connect: createConnectLink, getConnectStatus
// - Campaign: CRUD
// - Payout: requestPayout
//
// All money in amountCents (int). No raw Stripe data stored.

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// ── Data models ───────────────────────────────────────────────────────────────

class QrToken {
  const QrToken({
    required this.tokenId,
    required this.sessionId,
    required this.expiresAtMs,
    required this.sig,
  });

  final String tokenId;
  final String sessionId;
  final int expiresAtMs;
  final String sig;

  factory QrToken.fromMap(Map<String, dynamic> m) => QrToken(
        tokenId: m['tokenId'] as String,
        sessionId: m['sessionId'] as String,
        expiresAtMs: (m['expiresAtMs'] as num).toInt(),
        sig: m['sig'] as String,
      );

  /// Returns true if token is still valid with at least [bufferMs] remaining.
  bool isValid({int bufferMs = 0}) =>
      DateTime.now().millisecondsSinceEpoch < expiresAtMs - bufferMs;

  /// Milliseconds remaining until expiry.
  int get remainingMs =>
      expiresAtMs - DateTime.now().millisecondsSinceEpoch;

  /// Seconds remaining until expiry (floor).
  int get remainingSeconds => (remainingMs / 1000).floor().clamp(0, 9999);
}

class ConnectStatus {
  const ConnectStatus({
    this.accountId,
    required this.chargesEnabled,
    required this.payoutsEnabled,
    required this.requiresAction,
    this.actionType,
  });

  final String? accountId;
  final bool chargesEnabled;
  final bool payoutsEnabled;
  final bool requiresAction;
  final String? actionType;

  factory ConnectStatus.fromMap(Map<String, dynamic> m) => ConnectStatus(
        accountId: m['accountId'] as String?,
        chargesEnabled: (m['chargesEnabled'] as bool?) ?? false,
        payoutsEnabled: (m['payoutsEnabled'] as bool?) ?? false,
        requiresAction: (m['requiresAction'] as bool?) ?? true,
        actionType: m['actionType'] as String?,
      );

  bool get isFullyEnabled => chargesEnabled && payoutsEnabled;
}

class Campaign {
  const Campaign({
    required this.campaignId,
    required this.creatorId,
    required this.title,
    required this.description,
    required this.goalCents,
    required this.pledgedCents,
    required this.backerCount,
    required this.currency,
    required this.status,
    required this.deadline,
    required this.rewardTiers,
    required this.mediaUrls,
    this.publishedAt,
  });

  final String campaignId;
  final String creatorId;
  final String title;
  final String description;
  final int goalCents;
  final int pledgedCents;
  final int backerCount;
  final String currency;
  final String status;
  final String deadline;
  final List<Map<String, dynamic>> rewardTiers;
  final List<String> mediaUrls;
  final DateTime? publishedAt;

  double get progressFraction =>
      goalCents > 0 ? (pledgedCents / goalCents).clamp(0.0, 1.0) : 0.0;

  int get daysRemaining {
    final d = DateTime.tryParse(deadline);
    if (d == null) return 0;
    return d.difference(DateTime.now()).inDays.clamp(0, 9999);
  }

  factory Campaign.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final m = doc.data()!;
    return Campaign(
      campaignId: m['campaignId'] as String? ?? doc.id,
      creatorId: m['creatorId'] as String,
      title: m['title'] as String,
      description: m['description'] as String? ?? '',
      goalCents: (m['goalCents'] as num).toInt(),
      pledgedCents: (m['pledgedCents'] as num? ?? 0).toInt(),
      backerCount: (m['backerCount'] as num? ?? 0).toInt(),
      currency: m['currency'] as String? ?? 'USD',
      status: m['status'] as String,
      deadline: m['deadline'] as String,
      rewardTiers: (m['rewardTiers'] as List?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
      mediaUrls: (m['mediaUrls'] as List?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      publishedAt: m['publishedAt'] != null
          ? (m['publishedAt'] as Timestamp).toDate()
          : null,
    );
  }
}

class Payout {
  const Payout({
    required this.payoutId,
    required this.amountCents,
    required this.currency,
    required this.status,
    required this.createdAt,
  });

  final String payoutId;
  final int amountCents;
  final String currency;
  final String status;
  final DateTime createdAt;

  factory Payout.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final m = doc.data()!;
    return Payout(
      payoutId: m['payoutId'] as String? ?? doc.id,
      amountCents: (m['amountCents'] as num).toInt(),
      currency: m['currency'] as String? ?? 'USD',
      status: m['status'] as String,
      createdAt: (m['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

class MusicianService {
  MusicianService._();
  static final MusicianService instance = MusicianService._();

  final _functions = FirebaseFunctions.instanceFor(region: 'us-central1');
  final _db = FirebaseFirestore.instance;

  // ── QR token ───────────────────────────────────────────────────────────────

  Future<QrToken> generateQrToken(String sessionId) async {
    final callable = _functions.httpsCallable('generateQrToken');
    final result = await callable.call<Map<String, dynamic>>({'sessionId': sessionId});
    return QrToken.fromMap(result.data);
  }

  // ── Stripe Connect ─────────────────────────────────────────────────────────

  Future<String> createConnectLink() async {
    final callable = _functions.httpsCallable('createConnectLink');
    final result = await callable.call<Map<String, dynamic>>(<String, dynamic>{});
    return result.data['accountLinkUrl'] as String;
  }

  Future<ConnectStatus> getConnectStatus() async {
    final callable = _functions.httpsCallable('getConnectStatus');
    final result = await callable.call<Map<String, dynamic>>(<String, dynamic>{});
    return ConnectStatus.fromMap(result.data);
  }

  // ── Campaigns ─────────────────────────────────────────────────────────────

  Future<String> createCampaign({
    required String title,
    required String description,
    required int goalCents,
    required String currency,
    required String deadline,
  }) async {
    final callable = _functions.httpsCallable('createCampaign');
    final result = await callable.call<Map<String, dynamic>>({
      'title': title,
      'description': description,
      'goalCents': goalCents,
      'currency': currency,
      'deadline': deadline,
    });
    return result.data['campaignId'] as String;
  }

  Future<void> submitCampaign(String campaignId) async {
    final callable = _functions.httpsCallable('submitCampaign');
    await callable.call<Map<String, dynamic>>({'campaignId': campaignId});
  }

  Future<void> publishCampaign(String campaignId) async {
    final callable = _functions.httpsCallable('publishCampaign');
    await callable.call<Map<String, dynamic>>({'campaignId': campaignId});
  }

  Future<void> cancelCampaign(String campaignId, {String? reason}) async {
    final callable = _functions.httpsCallable('cancelCampaign');
    await callable.call<Map<String, dynamic>>({
      'campaignId': campaignId,
      'reason': ?reason,
    });
  }

  Future<void> postUpdate(String campaignId, String body) async {
    final callable = _functions.httpsCallable('postCampaignUpdate');
    await callable.call<Map<String, dynamic>>({
      'campaignId': campaignId,
      'body': body,
    });
  }

  Stream<List<Campaign>> myCampaignsStream(String uid) => _db
      .collection('campaigns')
      .where('creatorId', isEqualTo: uid)
      .orderBy('createdAt', descending: true)
      .snapshots()
      .map((snap) => snap.docs
          .map((d) => Campaign.fromDoc(d))
          .toList());

  Stream<Campaign?> campaignStream(String campaignId) => _db
      .collection('campaigns')
      .doc(campaignId)
      .snapshots()
      .map((d) => d.exists ? Campaign.fromDoc(d) : null);

  // ── Payouts ───────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> requestPayout({
    required int amountCents,
    String currency = 'USD',
  }) async {
    final callable = _functions.httpsCallable('requestPayout');
    final result = await callable.call<Map<String, dynamic>>({
      'amountCents': amountCents,
      'currency': currency,
    });
    return result.data;
  }

  Stream<List<Payout>> payoutsStream(String uid) => _db
      .collection('payouts')
      .where('recipientId', isEqualTo: uid)
      .orderBy('createdAt', descending: true)
      .limit(20)
      .snapshots()
      .map((snap) => snap.docs
          .map((d) => Payout.fromDoc(d))
          .toList());
}

// ── Riverpod providers ────────────────────────────────────────────────────────

/// Campaigns stream for signed-in musician.
final myCampaignsProvider = StreamProvider.autoDispose.family<List<Campaign>, String>(
  (ref, uid) => MusicianService.instance.myCampaignsStream(uid),
);

/// Individual campaign stream.
final campaignProvider = StreamProvider.autoDispose.family<Campaign?, String>(
  (ref, campaignId) => MusicianService.instance.campaignStream(campaignId),
);

/// Payouts stream for signed-in musician.
final payoutsStreamProvider = StreamProvider.autoDispose.family<List<Payout>, String>(
  (ref, uid) => MusicianService.instance.payoutsStream(uid),
);
