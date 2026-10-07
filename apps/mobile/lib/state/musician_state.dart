// Crowdbeats V2 — Musician State (Phase 7)
//
// Manages the performer's session lifecycle and real-time tip stream.
// The tip stream Firestore subscription is started on session start and
// cancelled when the session ends or the notifier is disposed.
//
// State machine:
//   idle → starting → active → ending → idle
//
// QR lifecycle:
//   The active state holds a QrToken. When remainingSeconds <= 20,
//   the UI triggers refresh. New token is atomic (fetch then swap).

import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../firebase/musician_service.dart';
import '../firebase/tip_service.dart';

// ── Session status ─────────────────────────────────────────────────────────────

enum MusicianSessionStatus { idle, starting, active, ending }

// ── Live tip model (lightweight — full model is in tip_service) ───────────────

class LiveTip {
  const LiveTip({
    required this.tipId,
    required this.amountCents,
    required this.currency,
    required this.isAnonymous,
    this.message,
    this.displayName,
    required this.arrivedAt,
  });

  final String tipId;
  final int amountCents;
  final String currency;
  final bool isAnonymous;
  final String? message;
  final String? displayName;
  final DateTime arrivedAt;

  factory LiveTip.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final m = doc.data()!;
    return LiveTip(
      tipId: m['tipId'] as String? ?? doc.id,
      amountCents: (m['amountCents'] as num).toInt(),
      currency: m['currency'] as String? ?? 'USD',
      isAnonymous: m['isAnonymous'] as bool? ?? false,
      message: m['message'] as String?,
      displayName: m['isAnonymous'] == true ? 'Anonymous' : m['fanDisplayName'] as String?,
      arrivedAt: (m['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }
}

// ── State ─────────────────────────────────────────────────────────────────────

class MusicianSessionState {
  const MusicianSessionState({
    this.status = MusicianSessionStatus.idle,
    this.sessionId,
    this.currentToken,
    this.liveTips = const [],
    this.totalTipsCents = 0,
    this.uniqueTippers = 0,
    this.sessionStartedAt,
    this.errorMessage,
    this.isRefreshingToken = false,
  });

  final MusicianSessionStatus status;
  final String? sessionId;
  final QrToken? currentToken;
  final List<LiveTip> liveTips;
  final int totalTipsCents;
  final int uniqueTippers;
  final DateTime? sessionStartedAt;
  final String? errorMessage;
  final bool isRefreshingToken;

  bool get isActive => status == MusicianSessionStatus.active;
  bool get isIdle => status == MusicianSessionStatus.idle;

  Duration get sessionDuration =>
      sessionStartedAt != null
          ? DateTime.now().difference(sessionStartedAt!)
          : Duration.zero;

  MusicianSessionState copyWith({
    MusicianSessionStatus? status,
    String? sessionId,
    QrToken? currentToken,
    List<LiveTip>? liveTips,
    int? totalTipsCents,
    int? uniqueTippers,
    DateTime? sessionStartedAt,
    Object? errorMessage = _sentinel,
    bool? isRefreshingToken,
  }) =>
      MusicianSessionState(
        status: status ?? this.status,
        sessionId: sessionId ?? this.sessionId,
        currentToken: currentToken ?? this.currentToken,
        liveTips: liveTips ?? this.liveTips,
        totalTipsCents: totalTipsCents ?? this.totalTipsCents,
        uniqueTippers: uniqueTippers ?? this.uniqueTippers,
        sessionStartedAt: sessionStartedAt ?? this.sessionStartedAt,
        errorMessage:
            errorMessage == _sentinel ? this.errorMessage : errorMessage as String?,
        isRefreshingToken: isRefreshingToken ?? this.isRefreshingToken,
      );
}

const _sentinel = Object();

// ── Notifier ──────────────────────────────────────────────────────────────────

class MusicianSessionNotifier extends Notifier<MusicianSessionState> {
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _tipSubscription;
  final Set<String> _seenFanUids = {};

  @override
  MusicianSessionState build() {
    ref.onDispose(_cancelTipStream);
    return const MusicianSessionState();
  }

  // ── Session lifecycle ──────────────────────────────────────────────────────

  /// Start a venue or street session. Delegates to TipService.startSession.
  Future<void> startSession({
    required String performerName,
    required String performerType,
    required String locationType,
    String? venueId,
    double? lat,
    double? lng,
  }) async {
    state = state.copyWith(status: MusicianSessionStatus.starting, errorMessage: null);
    try {
      final result = await TipService.instance.startSession(
        performerName: performerName,
        performerType: performerType,
        locationType: locationType,
        venueId: venueId,
        lat: lat,
        lng: lng,
      );
      final sessionId = result['sessionId'] as String;
      final token = await MusicianService.instance.generateQrToken(sessionId);
      _startTipStream(sessionId);
      state = state.copyWith(
        status: MusicianSessionStatus.active,
        sessionId: sessionId,
        currentToken: token,
        sessionStartedAt: DateTime.now(),
        liveTips: [],
        totalTipsCents: 0,
        uniqueTippers: 0,
      );
    } on Exception catch (e) {
      state = state.copyWith(
        status: MusicianSessionStatus.idle,
        errorMessage: e.toString(),
      );
    }
  }

  /// Generate (or refresh) QR token for the active session.
  Future<void> refreshToken() async {
    final sessionId = state.sessionId;
    if (sessionId == null) return;
    state = state.copyWith(isRefreshingToken: true);
    try {
      final token = await MusicianService.instance.generateQrToken(sessionId);
      state = state.copyWith(currentToken: token, isRefreshingToken: false);
    } on Exception catch (e) {
      state = state.copyWith(isRefreshingToken: false, errorMessage: e.toString());
    }
  }

  /// End the active session.
  Future<void> endSession() async {
    final sessionId = state.sessionId;
    if (sessionId == null) return;
    state = state.copyWith(status: MusicianSessionStatus.ending);
    try {
      await TipService.instance.endSession(sessionId);
      _cancelTipStream();
      state = state.copyWith(
        status: MusicianSessionStatus.idle,
        sessionId: null,
        currentToken: null,
      );
    } on Exception catch (e) {
      // Revert to active on failure
      state = state.copyWith(
        status: MusicianSessionStatus.active,
        errorMessage: e.toString(),
      );
    }
  }

  // ── Real-time tip stream ───────────────────────────────────────────────────

  void _startTipStream(String sessionId) {
    _cancelTipStream();
    _seenFanUids.clear();

    _tipSubscription = FirebaseFirestore.instance
        .collection('tips')
        .where('sessionId', isEqualTo: sessionId)
        .where('status', isEqualTo: 'succeeded')
        .orderBy('createdAt', descending: true)
        .limit(50)
        .snapshots()
        .listen((snap) {
      final tips = snap.docs.map(LiveTip.fromDoc).toList();
      int total = 0;
      final fanUids = <String>{};
      for (final tip in tips) {
        total += tip.amountCents;
        if (!tip.isAnonymous) fanUids.add(tip.tipId);
      }
      state = state.copyWith(
        liveTips: tips,
        totalTipsCents: total,
        uniqueTippers: tips.length, // unique by tip count (fan uid not in doc for privacy)
      );
    }, onError: (_) {
      // Non-fatal: stream may briefly fail on network issues
    });
  }

  void _cancelTipStream() {
    _tipSubscription?.cancel();
    _tipSubscription = null;
  }
}

// ── Providers ─────────────────────────────────────────────────────────────────

final musicianSessionProvider =
    NotifierProvider<MusicianSessionNotifier, MusicianSessionState>(
  MusicianSessionNotifier.new,
);
