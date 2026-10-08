// Crowdbeats V2 — Camera Nearby Matching Coordinator State
//
// Invariants:
// - Debounce: 15s throttle between server checks.
// - Movement: min 25m displacement trigger.
// - Accuracy: >50m triggers chooser requirement.
// - Cooldown: 30-min dismiss cooldown per act.
// - Video recording: queues tip intent until recording finalizes safely.

import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/camera_tipping.dart';
import '../data/services/camera_nearby_service.dart';
import '../data/models/location_fix.dart';

class CameraMatchingNotifier extends StateNotifier<CameraNearbyMatchState> {
  CameraMatchingNotifier({
    required this.service,
    Set<String>? alreadyTippedSessionIds,
  })  : _alreadyTippedSessionIds = alreadyTippedSessionIds ?? {},
        super(const CameraNearbyMatchState());

  final CameraNearbyService service;
  final Set<String> _alreadyTippedSessionIds;

  double? _lastCheckedLat;
  double? _lastCheckedLng;
  DateTime? _lastQueryTime;
  final Set<String> _promptedActSessionKeys = {};
  bool _isRecordingVideo = false;

  bool get isRecordingVideo => _isRecordingVideo;

  void setRecordingVideo(bool recording) {
    _isRecordingVideo = recording;
  }

  /// Evaluates new location sample and triggers nearby check if criteria are met.
  Future<void> onLocationUpdate(LocationFix fix) async {
    // 1. Max age check (30 seconds)
    final age = DateTime.now().difference(fix.timestamp);
    if (age.inSeconds > 30) return;

    final now = DateTime.now();

    // 2. 15-second throttle
    if (_lastQueryTime != null && now.difference(_lastQueryTime!).inSeconds < 15) {
      // Check 25m movement exception
      if (_lastCheckedLat != null && _lastCheckedLng != null) {
        final dist = _approxDistanceMeters(_lastCheckedLat!, _lastCheckedLng!, fix.latitude, fix.longitude);
        if (dist < 25.0) {
          return; // Throttled and hasn't moved 25m
        }
      } else {
        return; // Throttled
      }
    }

    _lastQueryTime = now;
    _lastCheckedLat = fix.latitude;
    _lastCheckedLng = fix.longitude;

    state = state.copyWith(isLoading: true);

    try {
      final result = await service.getNearbyLivePerformers(
        lat: fix.latitude,
        lng: fix.longitude,
        accuracyMeters: fix.accuracyMeters,
      );

      // Filter out already tipped sessions and dismissed acts
      final eligibleCandidates = result.candidates.where((c) {
        if (_alreadyTippedSessionIds.contains(c.activeSessionId)) return false;
        if (state.isActDismissed(c.performerId)) return false;
        return true;
      }).toList();

      final requiresChooser =
          result.requiresChooser || eligibleCandidates.length > 1 || fix.accuracyMeters > 50;

      NearbyPerformerCandidate? selected;
      if (eligibleCandidates.isNotEmpty) {
        // Cap: 1 prompt per act/session per camera session
        final top = eligibleCandidates.first;
        final promptKey = '${top.performerId}_${top.activeSessionId}';
        if (!_promptedActSessionKeys.contains(promptKey)) {
          _promptedActSessionKeys.add(promptKey);
          selected = top;
        } else if (state.selectedCandidate != null) {
          selected = state.selectedCandidate;
        }
      }

      state = state.copyWith(
        candidates: eligibleCandidates,
        selectedCandidate: selected,
        clearSelectedCandidate: selected == null,
        requiresChooser: requiresChooser,
        isLoading: false,
        lastCheckedAt: now,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false);
    }
  }

  /// Handles user tapping Dismiss on banner: 30-minute cooldown for this act.
  void dismissCandidate(String actId) {
    final updatedDismissed = Set<String>.from(state.dismissedActIds)..add(actId);
    final cooldownExpiry = DateTime.now().add(const Duration(minutes: 30));

    state = state.copyWith(
      clearSelectedCandidate: true,
      dismissedActIds: updatedDismissed,
      dismissedUntil: cooldownExpiry,
    );
  }

  /// Selects a candidate explicitly from the Chooser sheet.
  void selectCandidate(NearbyPerformerCandidate candidate) {
    state = state.copyWith(
      selectedCandidate: candidate,
      requiresChooser: false,
    );
  }

  /// Queues tip intent if video is currently recording.
  /// Returns true if queued, false if it can proceed immediately.
  bool queueOrProceedTip({
    required NearbyPerformerCandidate candidate,
    int defaultAmountCents = 500,
    String? mediaDraftPath,
  }) {
    if (_isRecordingVideo) {
      state = state.copyWith(
        queuedTipIntent: QueuedCameraTipIntent(
          candidate: candidate,
          defaultAmountCents: defaultAmountCents,
          queuedAt: DateTime.now(),
          mediaDraftPath: mediaDraftPath,
        ),
      );
      return true;
    }
    return false;
  }

  /// Clears the queued tip intent once checkout is initiated.
  void clearQueuedTipIntent() {
    state = state.copyWith(clearQueuedTipIntent: true);
  }

  /// Reset state when camera session closes.
  void resetSession() {
    _lastCheckedLat = null;
    _lastCheckedLng = null;
    _lastQueryTime = null;
    _promptedActSessionKeys.clear();
    _isRecordingVideo = false;
    state = const CameraNearbyMatchState();
  }

  double _approxDistanceMeters(double lat1, double lng1, double lat2, double lng2) {
    // Equirectangular approximation for small distances
    const double r = 6371000;
    final double dLat = (lat2 - lat1) * 3.141592653589793 / 180.0;
    final double dLng = (lng2 - lng1) * 3.141592653589793 / 180.0;
    final double a = dLat * dLat + dLng * dLng;
    return r * a; // approximate meters
  }
}

final cameraMatchingProvider =
    StateNotifierProvider.autoDispose<CameraMatchingNotifier, CameraNearbyMatchState>((ref) {
  final service = ref.watch(cameraNearbyServiceProvider);
  return CameraMatchingNotifier(service: service);
});
