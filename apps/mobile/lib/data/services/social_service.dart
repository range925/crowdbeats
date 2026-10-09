// Crowdbeats V2 — Social & Messaging Service (Phase 8)
//
// Full client wrapper for social relationships, follows, 1-to-1 messaging,
// and safety actions (block, restrict, report) via Cloud Functions.

import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final socialServiceProvider = Provider<SocialService>((ref) {
  return SocialService.instance;
});

class SocialRelationshipState {
  const SocialRelationshipState({
    required this.isFollowing,
    required this.followsViewer,
    required this.canMessage,
    required this.isBlocked,
    required this.isRestricted,
  });

  final bool isFollowing;
  final bool followsViewer;
  final bool canMessage;
  final bool isBlocked;
  final bool isRestricted;

  factory SocialRelationshipState.fromMap(Map<String, dynamic> map) {
    return SocialRelationshipState(
      isFollowing: map['isFollowing'] as bool? ?? false,
      followsViewer: map['followsViewer'] as bool? ?? false,
      canMessage: map['canMessage'] as bool? ?? false,
      isBlocked: map['isBlocked'] as bool? ?? false,
      isRestricted: map['isRestricted'] as bool? ?? false,
    );
  }
}

class SocialService {
  SocialService({FirebaseFunctions? functions}) : _injectedFunctions = functions;
  SocialService._() : _injectedFunctions = null;
  static final SocialService instance = SocialService._();

  final FirebaseFunctions? _injectedFunctions;
  FirebaseFunctions get _functions => _injectedFunctions ?? FirebaseFunctions.instance;

  // ── Follow Operations ───────────────────────────────────────────────────────

  Future<void> followEntity({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    final callable = _functions.httpsCallable('followEntity');
    await callable.call<dynamic>(<String, dynamic>{
      'targetId': targetId,
      'targetType': targetType,
      'actingAsBandId': ?actingAsBandId,
      'actingAsArtistId': ?actingAsArtistId,
    });
  }

  Future<void> unfollowEntity({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    final callable = _functions.httpsCallable('unfollowEntity');
    await callable.call<dynamic>(<String, dynamic>{
      'targetId': targetId,
      'targetType': targetType,
      'actingAsBandId': ?actingAsBandId,
      'actingAsArtistId': ?actingAsArtistId,
    });
  }

  Future<void> removeFollower({
    required String followerId,
    required String followerType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    final callable = _functions.httpsCallable('removeFollower');
    await callable.call<dynamic>(<String, dynamic>{
      'followerId': followerId,
      'followerType': followerType,
      'actingAsBandId': ?actingAsBandId,
      'actingAsArtistId': ?actingAsArtistId,
    });
  }

  Future<SocialRelationshipState> getRelationshipState({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    final callable = _functions.httpsCallable('getRelationshipState');
    final result = await callable.call<dynamic>(<String, dynamic>{
      'targetId': targetId,
      'targetType': targetType,
      'actingAsBandId': ?actingAsBandId,
      'actingAsArtistId': ?actingAsArtistId,
    });

    final data = result.data as Map<String, dynamic>?;
    final stateMap = (data?['state'] as Map<dynamic, dynamic>?)?.cast<String, dynamic>() ?? {};
    return SocialRelationshipState.fromMap(stateMap);
  }

  // ── Safety Operations (Block / Restrict / Report) ──────────────────────────

  Future<void> blockEntity({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    final callable = _functions.httpsCallable('blockEntity');
    await callable.call<dynamic>(<String, dynamic>{
      'targetId': targetId,
      'targetType': targetType,
      'actingAsBandId': ?actingAsBandId,
      'actingAsArtistId': ?actingAsArtistId,
    });
  }

  Future<void> unblockEntity({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    final callable = _functions.httpsCallable('unblockEntity');
    await callable.call<dynamic>(<String, dynamic>{
      'targetId': targetId,
      'targetType': targetType,
      'actingAsBandId': ?actingAsBandId,
      'actingAsArtistId': ?actingAsArtistId,
    });
  }

  Future<void> restrictEntity({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    final callable = _functions.httpsCallable('restrictEntity');
    await callable.call<dynamic>(<String, dynamic>{
      'targetId': targetId,
      'targetType': targetType,
      'actingAsBandId': ?actingAsBandId,
      'actingAsArtistId': ?actingAsArtistId,
    });
  }

  Future<void> unrestrictEntity({
    required String targetId,
    required String targetType,
    String? actingAsBandId,
    String? actingAsArtistId,
  }) async {
    final callable = _functions.httpsCallable('unrestrictEntity');
    await callable.call<dynamic>(<String, dynamic>{
      'targetId': targetId,
      'targetType': targetType,
      'actingAsBandId': ?actingAsBandId,
      'actingAsArtistId': ?actingAsArtistId,
    });
  }

  Future<void> submitReport({
    required String targetType,
    required String targetId,
    required String violationCategory,
    required String description,
  }) async {
    final callable = _functions.httpsCallable('submitReport');
    await callable.call<dynamic>(<String, dynamic>{
      'targetType': targetType,
      'targetId': targetId,
      'violationCategory': violationCategory,
      'description': description,
    });
  }

  // ── Messaging Operations ───────────────────────────────────────────────────

  Future<Map<String, dynamic>> sendMessage({
    required String recipientId,
    required String recipientType,
    required String text,
    String? actingAsBandId,
    String? actingAsArtistId,
    String? idempotencyKey,
  }) async {
    final callable = _functions.httpsCallable('sendMessage');
    final result = await callable.call<dynamic>(<String, dynamic>{
      'recipientId': recipientId,
      'recipientType': recipientType,
      'text': text,
      'actingAsBandId': ?actingAsBandId,
      'actingAsArtistId': ?actingAsArtistId,
      'idempotencyKey': ?idempotencyKey,
    });
    return (result.data as Map<dynamic, dynamic>).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> getConversations({
    String? actingAsBandId,
    String? actingAsArtistId,
    String tab = 'inbox',
    int limit = 20,
  }) async {
    final callable = _functions.httpsCallable('getConversations');
    final result = await callable.call<dynamic>(<String, dynamic>{
      'tab': tab,
      'limit': limit,
      'actingAsBandId': ?actingAsBandId,
      'actingAsArtistId': ?actingAsArtistId,
    });
    return (result.data as Map<dynamic, dynamic>).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> getMessages({
    required String conversationId,
    String? actingAsBandId,
    String? actingAsArtistId,
    int limit = 50,
  }) async {
    final callable = _functions.httpsCallable('getMessages');
    final result = await callable.call<dynamic>(<String, dynamic>{
      'conversationId': conversationId,
      'limit': limit,
      'actingAsBandId': ?actingAsBandId,
      'actingAsArtistId': ?actingAsArtistId,
    });
    return (result.data as Map<dynamic, dynamic>).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> respondToMessageRequest({
    required String conversationId,
    required String action,
    String? actingAsBandId,
    String? actingAsArtistId,
    String? reportReason,
    String? reportDescription,
  }) async {
    final callable = _functions.httpsCallable('respondToMessageRequest');
    final result = await callable.call<dynamic>(<String, dynamic>{
      'conversationId': conversationId,
      'action': action,
      'actingAsBandId': ?actingAsBandId,
      'actingAsArtistId': ?actingAsArtistId,
      'reportReason': ?reportReason,
      'reportDescription': ?reportDescription,
    });
    return (result.data as Map<dynamic, dynamic>).cast<String, dynamic>();
  }

  Future<void> updateMessageSettings({
    required String eligibility,
    required bool pauseMessages,
    String? actingAsBandId,
  }) async {
    final callable = _functions.httpsCallable('updateMessageSettings');
    await callable.call<dynamic>(<String, dynamic>{
      'eligibility': eligibility,
      'pauseMessages': pauseMessages,
      'actingAsBandId': ?actingAsBandId,
    });
  }
}
