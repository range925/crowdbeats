// Crowdbeats V2 — Camera Nearby Service
//
// Wraps getNearbyLivePerformers Cloud Function.
// Uses server-authoritative matching with 100m radius and 50m accuracy threshold.

import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/camera_tipping.dart';

@immutable
class NearbyPerformersResult {
  const NearbyPerformersResult({
    required this.candidates,
    required this.requiresChooser,
    required this.queriedAt,
    this.radiusMeters = 100,
  });

  final List<NearbyPerformerCandidate> candidates;
  final bool requiresChooser;
  final DateTime queriedAt;
  final int radiusMeters;
}

class CameraNearbyService {
  CameraNearbyService({FirebaseFunctions? functions})
      : _functions = functions ?? FirebaseFunctions.instance;

  final FirebaseFunctions _functions;

  Future<NearbyPerformersResult> getNearbyLivePerformers({
    required double lat,
    required double lng,
    required double accuracyMeters,
    String? clientSessionId,
  }) async {
    final callable = _functions.httpsCallable('getNearbyLivePerformers');
    final response = await callable.call<Map<String, dynamic>>({
      'query': {
        'lat': lat,
        'lng': lng,
        'accuracyMeters': accuracyMeters,
        'timestamp': DateTime.now().toUtc().toIso8601String(),
        // ignore: use_null_aware_elements
        if (clientSessionId != null) 'clientSessionId': clientSessionId,
      },
    });

    final data = response.data;
    final rawCandidates = (data['candidates'] as List<dynamic>?) ?? [];
    final candidates = rawCandidates
        .map((c) => NearbyPerformerCandidate.fromMap(Map<String, dynamic>.from(c as Map)))
        .toList();

    return NearbyPerformersResult(
      candidates: candidates,
      requiresChooser: (data['requiresChooser'] as bool?) ?? (candidates.length > 1),
      queriedAt: DateTime.tryParse(data['queriedAt'] as String? ?? '') ?? DateTime.now(),
      radiusMeters: (data['radiusMeters'] as num?)?.toInt() ?? 100,
    );
  }
}

/// Fake service for deterministic unit/widget testing.
class FakeCameraNearbyService extends CameraNearbyService {
  FakeCameraNearbyService({
    this.mockCandidates = const [],
    this.mockRequiresChooser = false,
  });

  final List<NearbyPerformerCandidate> mockCandidates;
  final bool mockRequiresChooser;

  @override
  Future<NearbyPerformersResult> getNearbyLivePerformers({
    required double lat,
    required double lng,
    required double accuracyMeters,
    String? clientSessionId,
  }) async {
    final bool requiresChooser =
        mockRequiresChooser || mockCandidates.length > 1 || accuracyMeters > 50;

    return NearbyPerformersResult(
      candidates: mockCandidates,
      requiresChooser: requiresChooser,
      queriedAt: DateTime.now(),
      radiusMeters: 100,
    );
  }
}

final cameraNearbyServiceProvider = Provider<CameraNearbyService>((ref) {
  return CameraNearbyService();
});
