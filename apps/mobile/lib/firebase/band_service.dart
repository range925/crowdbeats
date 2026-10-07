import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';

/// Service singleton managing Band Cloud Functions calls for Phase 8.
class BandService {
  BandService._();
  static final BandService instance = BandService._();

  final FirebaseFunctions _functions =
      FirebaseFunctions.instanceFor(region: 'us-central1');

  /// Creates a new band entity. Caller becomes BAND_FOUNDER with 100% split v1.
  Future<Map<String, dynamic>> createBand({
    required String name,
    String? bio,
    List<String> genres = const [],
  }) async {
    try {
      final callable = _functions.httpsCallable('createBand');
      final result = await callable.call<Map<String, dynamic>>({
        'name': name,
        'bio': bio,
        'genres': genres,
      });
      return Map<String, dynamic>.from(result.data);
    } catch (e) {
      debugPrint('[BandService] createBand error: $e');
      rethrow;
    }
  }

  /// Invites a new member by email with specified role.
  Future<Map<String, dynamic>> inviteBandMember({
    required String bandId,
    required String email,
    String role = 'BAND_MEMBER',
  }) async {
    try {
      final callable = _functions.httpsCallable('inviteBandMember');
      final result = await callable.call<Map<String, dynamic>>({
        'bandId': bandId,
        'email': email,
        'role': role,
      });
      return Map<String, dynamic>.from(result.data);
    } catch (e) {
      debugPrint('[BandService] inviteBandMember error: $e');
      rethrow;
    }
  }

  /// Responds to a band invitation (accept or decline).
  Future<Map<String, dynamic>> respondToInvitation({
    required String invitationId,
    required String response, // 'accept' or 'decline'
  }) async {
    try {
      final callable = _functions.httpsCallable('respondToBandInvitation');
      final result = await callable.call<Map<String, dynamic>>({
        'invitationId': invitationId,
        'response': response,
      });
      return Map<String, dynamic>.from(result.data);
    } catch (e) {
      debugPrint('[BandService] respondToInvitation error: $e');
      rethrow;
    }
  }

  /// Updates a member role (BAND_ADMIN or BAND_MEMBER).
  Future<Map<String, dynamic>> updateMemberRole({
    required String bandId,
    required String memberUid,
    required String newRole,
  }) async {
    try {
      final callable = _functions.httpsCallable('updateBandMemberRole');
      final result = await callable.call<Map<String, dynamic>>({
        'bandId': bandId,
        'memberUid': memberUid,
        'newRole': newRole,
      });
      return Map<String, dynamic>.from(result.data);
    } catch (e) {
      debugPrint('[BandService] updateMemberRole error: $e');
      rethrow;
    }
  }

  /// Removes a member or voluntarily leaves a band.
  Future<void> removeMember({
    required String bandId,
    required String memberUid,
    String? reason,
  }) async {
    try {
      final callable = _functions.httpsCallable('removeBandMember');
      await callable.call<Map<String, dynamic>>({
        'bandId': bandId,
        'memberUid': memberUid,
        'reason': reason,
      });
    } catch (e) {
      debugPrint('[BandService] removeMember error: $e');
      rethrow;
    }
  }

  /// Transfers BAND_FOUNDER role with typed confirmation phrase.
  Future<void> transferOwnership({
    required String bandId,
    required String targetUid,
    required String confirmationPhrase,
  }) async {
    try {
      final callable = _functions.httpsCallable('transferBandOwnership');
      await callable.call<Map<String, dynamic>>({
        'bandId': bandId,
        'targetUid': targetUid,
        'confirmationPhrase': confirmationPhrase,
      });
    } catch (e) {
      debugPrint('[BandService] transferOwnership error: $e');
      rethrow;
    }
  }

  /// Sets versioned split configuration totaling exactly 10,000 bps (100.00%).
  Future<Map<String, dynamic>> setBandSplitConfig({
    required String bandId,
    required List<Map<String, dynamic>> splits,
  }) async {
    try {
      final callable = _functions.httpsCallable('setBandSplitConfig');
      final result = await callable.call<Map<String, dynamic>>({
        'bandId': bandId,
        'splits': splits,
      });
      return Map<String, dynamic>.from(result.data);
    } catch (e) {
      debugPrint('[BandService] setBandSplitConfig error: $e');
      rethrow;
    }
  }

  /// Fetches band treasury overview, member balances, and Connect KYC statuses.
  Future<Map<String, dynamic>> getBandTreasury({required String bandId}) async {
    try {
      final callable = _functions.httpsCallable('getBandTreasury');
      final result = await callable.call<Map<String, dynamic>>({
        'bandId': bandId,
      });
      return Map<String, dynamic>.from(result.data);
    } catch (e) {
      debugPrint('[BandService] getBandTreasury error: $e');
      rethrow;
    }
  }
}
