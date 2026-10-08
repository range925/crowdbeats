// Crowdbeats V2 — Camera-Triggered Nearby Performer Tipping Models
//
// Invariants:
// - Proximity via GPS only; no biometrics, no facial recognition, no media analysis.
// - Default amount: $5.00 USD (500 cents).
// - Unobtrusive queued tip intent during video recording.
// - Dismiss cooldown: 30 minutes.

import 'package:flutter/foundation.dart';

@immutable
class NearbyPerformerCandidate {
  const NearbyPerformerCandidate({
    required this.performerId,
    required this.performerType,
    required this.performerName,
    this.performerAvatarUrl,
    required this.activeSessionId,
    this.locationType = 'street',
    this.venueName,
    required this.distanceMeters,
    this.genres = const [],
    this.bio,
    this.defaultTipAmountCents = 500, // $5.00 default
  });

  final String performerId;
  final String performerType; // 'artist' | 'band'
  final String performerName;
  final String? performerAvatarUrl;
  final String activeSessionId;
  final String locationType; // 'venue' | 'street'
  final String? venueName;
  final double distanceMeters;
  final List<String> genres;
  final String? bio;
  final int defaultTipAmountCents;

  factory NearbyPerformerCandidate.fromMap(Map<String, dynamic> map) {
    return NearbyPerformerCandidate(
      performerId: (map['performerId'] ?? '') as String,
      performerType: (map['performerType'] ?? 'artist') as String,
      performerName: (map['performerName'] ?? 'Live Performer') as String,
      performerAvatarUrl: map['performerAvatarUrl'] as String?,
      activeSessionId: (map['activeSessionId'] ?? '') as String,
      locationType: (map['locationType'] ?? 'street') as String,
      venueName: map['venueName'] as String?,
      distanceMeters: ((map['distanceMeters'] as num?)?.toDouble()) ?? 0.0,
      genres: (map['genres'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
      bio: map['bio'] as String?,
      defaultTipAmountCents: (map['defaultTipAmountCents'] as num?)?.toInt() ?? 500,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'performerId': performerId,
      'performerType': performerType,
      'performerName': performerName,
      'performerAvatarUrl': performerAvatarUrl,
      'activeSessionId': activeSessionId,
      'locationType': locationType,
      'venueName': venueName,
      'distanceMeters': distanceMeters,
      'genres': genres,
      'bio': bio,
      'defaultTipAmountCents': defaultTipAmountCents,
    };
  }
}

@immutable
class QueuedCameraTipIntent {
  const QueuedCameraTipIntent({
    required this.candidate,
    required this.defaultAmountCents,
    required this.queuedAt,
    this.mediaDraftPath,
  });

  final NearbyPerformerCandidate candidate;
  final int defaultAmountCents;
  final DateTime queuedAt;
  final String? mediaDraftPath;
}

@immutable
class CameraNearbyMatchState {
  const CameraNearbyMatchState({
    this.candidates = const [],
    this.selectedCandidate,
    this.requiresChooser = false,
    this.isLoading = false,
    this.lastCheckedAt,
    this.dismissedActIds = const {},
    this.dismissedUntil,
    this.queuedTipIntent,
  });

  final List<NearbyPerformerCandidate> candidates;
  final NearbyPerformerCandidate? selectedCandidate;
  final bool requiresChooser;
  final bool isLoading;
  final DateTime? lastCheckedAt;
  final Set<String> dismissedActIds;
  final DateTime? dismissedUntil;
  final QueuedCameraTipIntent? queuedTipIntent;

  bool isActDismissed(String actId) {
    if (dismissedUntil != null && DateTime.now().isBefore(dismissedUntil!)) {
      return dismissedActIds.contains(actId);
    }
    return false;
  }

  CameraNearbyMatchState copyWith({
    List<NearbyPerformerCandidate>? candidates,
    NearbyPerformerCandidate? selectedCandidate,
    bool clearSelectedCandidate = false,
    bool? requiresChooser,
    bool? isLoading,
    DateTime? lastCheckedAt,
    Set<String>? dismissedActIds,
    DateTime? dismissedUntil,
    QueuedCameraTipIntent? queuedTipIntent,
    bool clearQueuedTipIntent = false,
  }) {
    return CameraNearbyMatchState(
      candidates: candidates ?? this.candidates,
      selectedCandidate: clearSelectedCandidate ? null : (selectedCandidate ?? this.selectedCandidate),
      requiresChooser: requiresChooser ?? this.requiresChooser,
      isLoading: isLoading ?? this.isLoading,
      lastCheckedAt: lastCheckedAt ?? this.lastCheckedAt,
      dismissedActIds: dismissedActIds ?? this.dismissedActIds,
      dismissedUntil: dismissedUntil ?? this.dismissedUntil,
      queuedTipIntent: clearQueuedTipIntent ? null : (queuedTipIntent ?? this.queuedTipIntent),
    );
  }
}
