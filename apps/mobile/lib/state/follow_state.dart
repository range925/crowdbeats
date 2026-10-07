// Crowdbeats V2 — Follow State (Riverpod) — Phase 6
//
// Manages optimistic follow/unfollow with rollback on error.

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../firebase/follow_service.dart';

// ── Follows list provider ─────────────────────────────────────────────────────

/// Streams the list of all artists a fan follows.
final fanFollowsProvider = StreamProvider.family<
    List<Map<String, dynamic>>, String>((ref, fanUid) {
  return FollowService.instance.followsStream(fanUid);
});

/// Streams whether the authenticated fan follows a specific artist.
final isFollowingProvider =
    StreamProvider.family<bool, ({String fanUid, String artistId})>((ref, args) {
  return FollowService.instance.isFollowingStream(args.fanUid, args.artistId);
});

// ── Follow Action Notifier ─────────────────────────────────────────────────────

class FollowNotifier extends StateNotifier<Map<String, bool>> {
  FollowNotifier() : super({});

  /// Follow an artist with optimistic update.
  /// Rolls back state if the server call fails.
  Future<void> follow(String artistId) async {
    state = {...state, artistId: true}; // optimistic
    try {
      await FollowService.instance.followArtist(artistId);
    } catch (_) {
      state = {...state, artistId: false}; // rollback
      rethrow;
    }
  }

  /// Unfollow an artist with optimistic update.
  Future<void> unfollow(String artistId) async {
    state = {...state, artistId: false}; // optimistic
    try {
      await FollowService.instance.unfollowArtist(artistId);
    } catch (_) {
      state = {...state, artistId: true}; // rollback
      rethrow;
    }
  }
}

final followNotifierProvider =
    StateNotifierProvider<FollowNotifier, Map<String, bool>>(
  (ref) => FollowNotifier(),
);
