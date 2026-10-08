// Crowdbeats V2 — Camera Nearby Tipping Test Fixtures & Deterministic Harness
//
// Independent QA fixtures providing mathematical certainty for:
// 1. Deterministic GPS locations and Haversine distances
// 2. Accuracy levels (20m fine vs 80m coarse, 50m chooser threshold)
// 3. Performer check-in variations (single, multiple, none, out-of-range, blocked, band)
// 4. Time-based throttling (15s query limit, 30-min dismiss cooldown)
// 5. Camera capture lifecycle and queued tipping intents

import 'dart:math' as math;
import 'package:flutter/material.dart';

// ── 1. Coordinate & Spatial Constants ─────────────────────────────────────────

class TestGpsLocation {
  const TestGpsLocation({
    required this.latitude,
    required this.longitude,
    required this.accuracyMeters,
    required this.timestamp,
  });

  final double latitude;
  final double longitude;
  final double accuracyMeters;
  final DateTime timestamp;

  TestGpsLocation copyWith({
    double? latitude,
    double? longitude,
    double? accuracyMeters,
    DateTime? timestamp,
  }) {
    return TestGpsLocation(
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      accuracyMeters: accuracyMeters ?? this.accuracyMeters,
      timestamp: timestamp ?? this.timestamp,
    );
  }
}

/// Fan Anchor Location (Torrance Downtown benchmark)
final kFanUserGps = TestGpsLocation(
  latitude: 33.835800,
  longitude: -118.340600,
  accuracyMeters: 20, // Fine accuracy by default
  timestamp: DateTime.parse('2026-10-05T03:00:00Z'),
);

/// Candidate 1: Maya Chen (Solo Artist, ~45.0m away -> Within 100m)
const kMayaChenCheckIn = TestPerformerSession(
  performerId: 'artist-maya-chen',
  performerType: 'artist',
  performerName: 'Maya Chen',
  performerAvatarUrl: 'https://cdn.crowdbeats.app/avatars/maya.jpg',
  activeSessionId: 'session-maya-101',
  locationType: 'street',
  venueName: 'Torrance Square Walk',
  latitude: 33.836205,
  longitude: -118.340600,
  genres: ['Indie Acoustic', 'Folk'],
  defaultTipAmountCents: 500,
);

/// Candidate 2: The Neon Waves (Band collective, ~89.0m away -> Within 100m)
const kNeonWavesCheckIn = TestPerformerSession(
  performerId: 'band-neon-waves',
  performerType: 'band',
  performerName: 'The Neon Waves',
  performerAvatarUrl: 'https://cdn.crowdbeats.app/avatars/neon_waves.jpg',
  activeSessionId: 'session-neon-202',
  locationType: 'venue',
  venueName: 'The Redondo Stage',
  latitude: 33.836600,
  longitude: -118.340600,
  genres: ['Synthwave', 'Indie Rock'],
  defaultTipAmountCents: 500,
);

/// Candidate 3: Acoustic Sunset (Solo Artist, ~133.4m away -> Excluded by 100m radius)
const kOutOfRangeCheckIn = TestPerformerSession(
  performerId: 'artist-sunset',
  performerType: 'artist',
  performerName: 'Acoustic Sunset',
  performerAvatarUrl: 'https://cdn.crowdbeats.app/avatars/sunset.jpg',
  activeSessionId: 'session-sunset-303',
  locationType: 'street',
  latitude: 33.837000,
  longitude: -118.340600,
  genres: ['Acoustic'],
  defaultTipAmountCents: 500,
);

/// Candidate 4: Blocked Performer (~33.3m away -> Excluded by social safety block list)
const kBlockedPerformerCheckIn = TestPerformerSession(
  performerId: 'artist-blocked-99',
  performerType: 'artist',
  performerName: 'Blocked Artist',
  performerAvatarUrl: 'https://cdn.crowdbeats.app/avatars/blocked.jpg',
  activeSessionId: 'session-blocked-404',
  locationType: 'street',
  latitude: 33.836100,
  longitude: -118.340600,
  genres: ['Noise'],
  defaultTipAmountCents: 500,
);

const double kFineAccuracyMeters = 20;
const double kCoarseAccuracyMeters = 80;
const double kChooserThresholdMeters = 50;
const double kNearbyRadiusThresholdMeters = 100;
const Duration kThrottleInterval = Duration(seconds: 15);
const Duration kDismissCooldown = Duration(minutes: 30);
const double kMovementRequeryThresholdMeters = 25;

// ── 2. Spatial Computation Helper ─────────────────────────────────────────────

/// High precision Haversine distance calculator in meters (parity with backend)
double computeHaversineMeters(
  double lat1,
  double lon1,
  double lat2,
  double lon2,
) {
  const double r = 6371000; // Earth radius in meters
  final double dLat = (lat2 - lat1) * (math.pi / 180);
  final double dLon = (lon2 - lon1) * (math.pi / 180);
  final double a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(lat1 * (math.pi / 180)) *
          math.cos(lat2 * (math.pi / 180)) *
          math.sin(dLon / 2) *
          math.sin(dLon / 2);
  final double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
  return (r * c * 10).round() / 10;
}

// ── 3. Domain Models Under Test ───────────────────────────────────────────────

class TestPerformerSession {
  const TestPerformerSession({
    required this.performerId,
    required this.performerType,
    required this.performerName,
    this.performerAvatarUrl,
    required this.activeSessionId,
    required this.locationType,
    this.venueName,
    required this.latitude,
    required this.longitude,
    required this.genres,
    this.defaultTipAmountCents = 500,
  });

  final String performerId;
  final String performerType; // 'artist' | 'band'
  final String performerName;
  final String? performerAvatarUrl;
  final String activeSessionId;
  final String locationType;
  final String? venueName;
  final double latitude;
  final double longitude;
  final List<String> genres;
  final int defaultTipAmountCents;
}

class NearbyPerformerCandidate {
  const NearbyPerformerCandidate({
    required this.performerId,
    required this.performerType,
    required this.performerName,
    this.performerAvatarUrl,
    required this.activeSessionId,
    required this.locationType,
    this.venueName,
    required this.distanceMeters,
    required this.genres,
    this.defaultTipAmountCents = 500,
  });

  final String performerId;
  final String performerType; // 'artist' | 'band'
  final String performerName;
  final String? performerAvatarUrl;
  final String activeSessionId;
  final String locationType;
  final String? venueName;
  final double distanceMeters;
  final List<String> genres;
  final int defaultTipAmountCents;
}

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

class MatchingResult {
  const MatchingResult({
    required this.candidates,
    required this.requiresChooser,
    required this.queriedAt,
    this.wasThrottled = false,
  });

  final List<NearbyPerformerCandidate> candidates;
  final bool requiresChooser;
  final DateTime queriedAt;
  final bool wasThrottled;
}

// ── 4. Location Matching Coordinator Implementation ───────────────────────────

class CameraNearbyMatchingCoordinator {
  CameraNearbyMatchingCoordinator({
    required this.activeSessions,
    Set<String>? blockedPerformerIds,
  }) : _blockedPerformerIds = blockedPerformerIds ?? <String>{};

  final List<TestPerformerSession> activeSessions;
  final Set<String> _blockedPerformerIds;

  DateTime? _lastQueryTime;
  TestGpsLocation? _lastQueryLocation;
  final Map<String, DateTime> _dismissedCooldowns = {};

  void blockPerformer(String performerId) {
    _blockedPerformerIds.add(performerId);
  }

  void unblockPerformer(String performerId) {
    _blockedPerformerIds.remove(performerId);
  }

  void dismissPerformer(String performerId, DateTime dismissedAt) {
    _dismissedCooldowns[performerId] = dismissedAt;
  }

  bool isDismissed(String performerId, DateTime now) {
    final dismissedAt = _dismissedCooldowns[performerId];
    if (dismissedAt == null) return false;
    return now.difference(dismissedAt) < kDismissCooldown;
  }

  MatchingResult queryNearby({
    required TestGpsLocation currentLocation,
    bool force = false,
  }) {
    final now = currentLocation.timestamp;

    // Check 15-second throttle unless forced
    if (!force && _lastQueryTime != null) {
      final elapsed = now.difference(_lastQueryTime!);
      if (elapsed < kThrottleInterval) {
        // Also check if movement is less than 25 meters
        if (_lastQueryLocation != null) {
          final moveDist = computeHaversineMeters(
            _lastQueryLocation!.latitude,
            _lastQueryLocation!.longitude,
            currentLocation.latitude,
            currentLocation.longitude,
          );
          if (moveDist < kMovementRequeryThresholdMeters) {
            return MatchingResult(
              candidates: const [],
              requiresChooser: false,
              queriedAt: now,
              wasThrottled: true,
            );
          }
        }
      }
    }

    _lastQueryTime = now;
    _lastQueryLocation = currentLocation;

    final List<NearbyPerformerCandidate> matched = [];

    for (final session in activeSessions) {
      // Rule: Filter blocked performers
      if (_blockedPerformerIds.contains(session.performerId)) {
        continue;
      }

      // Rule: Filter dismissed performers under 30-min cooldown
      if (isDismissed(session.performerId, now)) {
        continue;
      }

      final dist = computeHaversineMeters(
        currentLocation.latitude,
        currentLocation.longitude,
        session.latitude,
        session.longitude,
      );

      // Rule: 100m distance threshold
      if (dist <= kNearbyRadiusThresholdMeters) {
        matched.add(
          NearbyPerformerCandidate(
            performerId: session.performerId,
            performerType: session.performerType,
            performerName: session.performerName,
            performerAvatarUrl: session.performerAvatarUrl,
            activeSessionId: session.activeSessionId,
            locationType: session.locationType,
            venueName: session.venueName,
            distanceMeters: dist,
            genres: session.genres,
            defaultTipAmountCents: session.defaultTipAmountCents,
          ),
        );
      }
    }

    // Sort by proximity ascending
    matched.sort((a, b) => a.distanceMeters.compareTo(b.distanceMeters));

    // Rule: Chooser triggered if >1 candidate OR accuracy > 50m
    final bool requiresChooser = matched.length > 1 ||
        currentLocation.accuracyMeters > kChooserThresholdMeters;

    return MatchingResult(
      candidates: matched,
      requiresChooser: requiresChooser,
      queriedAt: now,
    );
  }
}

// ── 5. Camera Lifecycle State Machine & UI Widgets ────────────────────────────

enum CameraPermissionState {
  notDetermined,
  granted,
  denied,
  permanentlyDenied,
}

enum CameraCaptureMode {
  photo,
  video,
}

class CameraControllerState {
  const CameraControllerState({
    this.permissionState = CameraPermissionState.granted,
    this.mode = CameraCaptureMode.photo,
    this.isRecordingVideo = false,
    this.isViewfinderActive = true,
    this.lastCapturedMediaPath,
    this.queuedTipIntent,
  });

  final CameraPermissionState permissionState;
  final CameraCaptureMode mode;
  final bool isRecordingVideo;
  final bool isViewfinderActive;
  final String? lastCapturedMediaPath;
  final QueuedCameraTipIntent? queuedTipIntent;

  CameraControllerState copyWith({
    CameraPermissionState? permissionState,
    CameraCaptureMode? mode,
    bool? isRecordingVideo,
    bool? isViewfinderActive,
    String? lastCapturedMediaPath,
    QueuedCameraTipIntent? queuedTipIntent,
    bool clearQueuedIntent = false,
  }) {
    return CameraControllerState(
      permissionState: permissionState ?? this.permissionState,
      mode: mode ?? this.mode,
      isRecordingVideo: isRecordingVideo ?? this.isRecordingVideo,
      isViewfinderActive: isViewfinderActive ?? this.isViewfinderActive,
      lastCapturedMediaPath: lastCapturedMediaPath ?? this.lastCapturedMediaPath,
      queuedTipIntent:
          clearQueuedIntent ? null : (queuedTipIntent ?? this.queuedTipIntent),
    );
  }
}

/// Glassmorphic Nearby Performer Banner
class NearbyPerformerBanner extends StatelessWidget {
  const NearbyPerformerBanner({
    super.key,
    required this.candidate,
    required this.isRecording,
    required this.onTipTap,
    required this.onDismiss,
  });

  final NearbyPerformerCandidate candidate;
  final bool isRecording;
  final VoidCallback onTipTap;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    if (isRecording) {
      // Quiet minimal pill during video recording
      return Semantics(
        label: 'Performer nearby: ${candidate.performerName}. Tip queued.',
        child: InkWell(
          onTap: onTipTap,
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xCC000000),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white24),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Color(0xFF22C55E),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Live nearby: ${candidate.performerName} · Queued',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Normal prominent banner
    return Semantics(
      label: 'Live nearby ${candidate.performerName}. Tap to tip five dollars.',
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xE61A1A1E),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white12),
          boxShadow: const [
            BoxShadow(
              color: Colors.black45,
              blurRadius: 16,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Avatar / Live Icon
            Stack(
              clipBehavior: Clip.none,
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: const Color(0xFF33333C),
                  child: Text(
                    candidate.performerName[0],
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
                Positioned(
                  bottom: -2,
                  right: -2,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: const Color(0xFF22C55E),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.black, width: 2),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Live nearby · ${candidate.distanceMeters.toStringAsFixed(0)}m',
                    style: const TextStyle(
                      color: Color(0xFF22C55E),
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    candidate.performerName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            // Tip $5 CTA Button (min 48x48)
            ConstrainedBox(
              constraints: const BoxConstraints(minWidth: 72, minHeight: 48),
              child: ElevatedButton(
                key: const ValueKey('tip_banner_cta_button'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8B5CF6),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                ),
                onPressed: onTipTap,
                child: const Text(
                  'Tip \$5',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(width: 4),
            // Dismiss Button (min 48x48)
            IconButton(
              key: const ValueKey('tip_banner_dismiss_button'),
              icon: const Icon(Icons.close, color: Colors.white54, size: 20),
              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
              tooltip: 'Dismiss suggestion',
              onPressed: onDismiss,
            ),
          ],
        ),
      ),
    );
  }
}

/// Performer Chooser Bottom Sheet
class NearbyPerformerChooserSheet extends StatelessWidget {
  const NearbyPerformerChooserSheet({
    super.key,
    required this.candidates,
    required this.onSelect,
  });

  final List<NearbyPerformerCandidate> candidates;
  final ValueChanged<NearbyPerformerCandidate> onSelect;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xF0121216),
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Performers Playing Nearby',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Select who you would like to support',
            style: TextStyle(color: Colors.white60, fontSize: 13),
          ),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: candidates.length,
            separatorBuilder: (_, _) => const Divider(color: Colors.white10),
            itemBuilder: (context, index) {
              final c = candidates[index];
              return Material(
                color: Colors.transparent,
                child: ListTile(
                  key: ValueKey('candidate_tile_${c.performerId}'),
                  contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: const Color(0xFF27272F),
                  child: Text(
                    c.performerName[0],
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
                title: Row(
                  children: [
                    Expanded(
                      child: Text(
                        c.performerName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0x3322C55E),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${c.distanceMeters.toStringAsFixed(0)}m',
                        style: const TextStyle(
                          color: Color(0xFF22C55E),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                subtitle: Text(
                  '${c.performerType.toUpperCase()} · ${c.genres.join(', ')}',
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
                trailing: const Icon(Icons.chevron_right, color: Colors.white38),
                onTap: () => onSelect(c),
                ),
              );
            },
          ),
        ],
      ),
    ),
  );
}
}

/// Permission Denial Recovery View
class CameraPermissionRecoveryView extends StatelessWidget {
  const CameraPermissionRecoveryView({
    super.key,
    required this.onRetryPermission,
    required this.onOpenSettings,
  });

  final VoidCallback onRetryPermission;
  final VoidCallback onOpenSettings;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.camera_alt_outlined, color: Colors.white54, size: 64),
            const SizedBox(height: 16),
            const Text(
              'Camera Access Needed',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Crowdbeats uses your camera to capture live performance moments and discover nearby musicians to tip.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.4),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              key: const ValueKey('camera_grant_retry_button'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(200, 48),
                backgroundColor: const Color(0xFF8B5CF6),
                foregroundColor: Colors.white,
              ),
              onPressed: onRetryPermission,
              child: const Text('Allow Camera Access'),
            ),
            const SizedBox(height: 12),
            TextButton(
              key: const ValueKey('camera_open_settings_button'),
              style: TextButton.styleFrom(minimumSize: const Size(200, 48)),
              onPressed: onOpenSettings,
              child: const Text(
                'Open Device Settings',
                style: TextStyle(color: Colors.white60),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
