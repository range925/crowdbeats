import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../firebase/band_service.dart';

@immutable
class BandMemberModel {
  final String uid;
  final String displayName;
  final String role;
  final int splitBps;
  final bool isActive;
  final String? photoUrl;

  const BandMemberModel({
    required this.uid,
    required this.displayName,
    required this.role,
    required this.splitBps,
    required this.isActive,
    this.photoUrl,
  });

  factory BandMemberModel.fromFirestore(
    Map<String, dynamic> data,
    String uid,
    int splitBps,
  ) {
    return BandMemberModel(
      uid: uid,
      displayName: (data['displayName'] as String?) ?? 'Member',
      role: (data['role'] as String?) ?? 'BAND_MEMBER',
      splitBps: splitBps,
      isActive: (data['isActive'] as bool?) ?? true,
      photoUrl: data['photoUrl'] as String?,
    );
  }
}

@immutable
class BandState {
  final String? activeBandId;
  final String bandName;
  final String role;
  final bool isLoading;
  final String? errorMessage;
  final List<BandMemberModel> members;
  final int splitVersion;
  final int totalTipsReceivedCents;

  const BandState({
    this.activeBandId,
    this.bandName = '',
    this.role = 'BAND_MEMBER',
    this.isLoading = false,
    this.errorMessage,
    this.members = const [],
    this.splitVersion = 1,
    this.totalTipsReceivedCents = 0,
  });

  BandState copyWith({
    String? activeBandId,
    String? bandName,
    String? role,
    bool? isLoading,
    String? errorMessage,
    List<BandMemberModel>? members,
    int? splitVersion,
    int? totalTipsReceivedCents,
  }) {
    return BandState(
      activeBandId: activeBandId ?? this.activeBandId,
      bandName: bandName ?? this.bandName,
      role: role ?? this.role,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      members: members ?? this.members,
      splitVersion: splitVersion ?? this.splitVersion,
      totalTipsReceivedCents:
          totalTipsReceivedCents ?? this.totalTipsReceivedCents,
    );
  }
}

class BandNotifier extends Notifier<BandState> {
  StreamSubscription<DocumentSnapshot>? _bandSub;
  StreamSubscription<QuerySnapshot>? _membersSub;
  StreamSubscription<DocumentSnapshot>? _splitSub;

  @override
  BandState build() {
    ref.onDispose(() {
      _bandSub?.cancel();
      _membersSub?.cancel();
      _splitSub?.cancel();
    });

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const BandState(
        isLoading: false,
        activeBandId: 'band_midnight_pulse',
        bandName: 'Midnight Pulse',
        role: 'BAND_LEADER',
        splitVersion: 2,
        totalTipsReceivedCents: 124500,
        members: [
          BandMemberModel(
            uid: 'mem_1',
            displayName: 'Elena Cruz',
            role: 'BAND_LEADER',
            splitBps: 4000,
            isActive: true,
          ),
          BandMemberModel(
            uid: 'mem_2',
            displayName: 'Marcus Cole',
            role: 'BAND_MEMBER',
            splitBps: 3000,
            isActive: true,
          ),
          BandMemberModel(
            uid: 'mem_3',
            displayName: 'Chloe Bennett',
            role: 'BAND_MEMBER',
            splitBps: 3000,
            isActive: true,
          ),
        ],
      );
    }

    _loadUserBand();
    return const BandState(isLoading: true);
  }

  Future<void> _loadUserBand() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return;
    }

    try {
      // Find bands where user is a member
      final memberQuery = await FirebaseFirestore.instance
          .collectionGroup('members')
          .where('isActive', isEqualTo: true)
          .get();

      String? foundBandId;
      String userRole = 'BAND_MEMBER';

      for (final doc in memberQuery.docs) {
        if (doc.id == user.uid && doc.reference.parent.parent != null) {
          foundBandId = doc.reference.parent.parent!.id;
          userRole = (doc.data()['role'] as String?) ?? 'BAND_MEMBER';
          break;
        }
      }

      if (foundBandId != null) {
        _subscribeToBand(foundBandId, userRole);
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      debugPrint('[BandNotifier] error loading user band: $e');
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  void _subscribeToBand(String bandId, String userRole) {
    state = state.copyWith(
      activeBandId: bandId,
      role: userRole,
      isLoading: true,
    );

    // Band metadata stream
    _bandSub = FirebaseFirestore.instance
        .collection('bands')
        .doc(bandId)
        .snapshots()
        .listen((snap) {
      if (snap.exists) {
        final data = snap.data()!;
        state = state.copyWith(
          bandName: (data['name'] as String?) ?? 'Band',
          totalTipsReceivedCents:
              (data['totalTipsReceivedCents'] as num?)?.toInt() ?? 0,
          isLoading: false,
        );
      }
    });

    // Splits stream
    _splitSub = FirebaseFirestore.instance
        .collection('bands')
        .doc(bandId)
        .collection('splitConfig')
        .doc('current')
        .snapshots()
        .listen((snap) {
      if (snap.exists) {
        final data = snap.data()!;
        final version = (data['version'] as num?)?.toInt() ?? 1;
        final splitsList = (data['splits'] as List<dynamic>?) ?? [];
        final splitMap = <String, int>{};
        for (final s in splitsList) {
          if (s is Map) {
            splitMap[s['uid'] as String] = (s['splitBps'] as num).toInt();
          }
        }

        // Re-map members with splitBps
        _subscribeToMembers(bandId, splitMap, version);
      }
    });
  }

  void _subscribeToMembers(
      String bandId, Map<String, int> splitMap, int version) {
    _membersSub?.cancel();
    _membersSub = FirebaseFirestore.instance
        .collection('bands')
        .doc(bandId)
        .collection('members')
        .where('isActive', isEqualTo: true)
        .snapshots()
        .listen((snap) {
      final membersList = snap.docs.map((d) {
        final uid = d.id;
        final splitBps = splitMap[uid] ?? 0;
        return BandMemberModel.fromFirestore(d.data(), uid, splitBps);
      }).toList();

      state = state.copyWith(
        members: membersList,
        splitVersion: version,
        isLoading: false,
      );
    });
  }

  Future<void> createBand(String name, {String? bio, List<String>? genres}) async {
    state = state.copyWith(isLoading: true);
    try {
      final res = await BandService.instance.createBand(
        name: name,
        bio: bio,
        genres: genres ?? [],
      );
      final bandId = res['bandId'] as String;
      _subscribeToBand(bandId, 'BAND_FOUNDER');
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      rethrow;
    }
  }
}

final bandProvider =
    NotifierProvider<BandNotifier, BandState>(() => BandNotifier());
