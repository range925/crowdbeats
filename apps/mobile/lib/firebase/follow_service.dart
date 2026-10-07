// Crowdbeats V2 — Follow Service (Phase 6)
//
// Calls Cloud Function callables for follow/unfollow.
// Streams the fan's follow list from Firestore.

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';

class FollowService {
  FollowService._();
  static final FollowService instance = FollowService._();

  FirebaseFunctions get _functions => FirebaseFunctions.instance;
  FirebaseFirestore get _db => FirebaseFirestore.instance;

  // ── Follow an artist ───────────────────────────────────────────────────────

  Future<void> followArtist(String artistId) async {
    final callable = _functions.httpsCallable('followArtist');
    await callable.call<dynamic>(<String, dynamic>{'artistId': artistId});
  }

  // ── Unfollow an artist ─────────────────────────────────────────────────────

  Future<void> unfollowArtist(String artistId) async {
    final callable = _functions.httpsCallable('unfollowArtist');
    await callable.call<dynamic>(<String, dynamic>{'artistId': artistId});
  }

  // ── Is following stream ────────────────────────────────────────────────────

  /// Streams whether the authenticated user follows a given artist.
  Stream<bool> isFollowingStream(String fanUid, String artistId) {
    final docId = '${fanUid}_$artistId';
    return _db
        .collection('follows')
        .doc(docId)
        .snapshots()
        .map((snap) => snap.exists);
  }

  // ── Fan's follows list ─────────────────────────────────────────────────────

  /// Streams the list of artists the fan follows, ordered by most recently followed.
  Stream<List<Map<String, dynamic>>> followsStream(String fanUid) {
    return _db
        .collection('follows')
        .where('fanUid', isEqualTo: fanUid)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map((d) => d.data()).toList());
  }
}
