// Crowdbeats V2 — Camera Nearby Performer Banner (Stitch Tokens)
//
// Invariants:
// - Non-intrusive floating banner over the live camera viewfinder.
// - During video recording: transitions to quiet, unobtrusive pill.
// - Touch targets >= 48x48dp.
// - Full screen-reader semantics for VoiceOver/TalkBack.
// - Never composited or rendered into the captured media file.

import 'package:flutter/material.dart';

import '../../data/models/camera_tipping.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class NearbyPerformerBanner extends StatelessWidget {
  const NearbyPerformerBanner({
    super.key,
    required this.candidate,
    required this.onTipTap,
    required this.onDismiss,
    this.isRecordingVideo = false,
    this.isTipQueued = false,
    this.onViewChooser,
  });

  final NearbyPerformerCandidate candidate;
  final VoidCallback onTipTap;
  final VoidCallback onDismiss;
  final bool isRecordingVideo;
  final bool isTipQueued;
  final VoidCallback? onViewChooser;

  @override
  Widget build(BuildContext context) {
    if (isRecordingVideo) {
      return _buildRecordingPill(context);
    }
    return _buildStandardBanner(context);
  }

  /// Minimal quiet pill during active video recording so the viewfinder is clear.
  Widget _buildRecordingPill(BuildContext context) {
    return Semantics(
      label: isTipQueued
          ? 'Tip queued for ${candidate.performerName}. Checkout will open after recording stops.'
          : 'Live performer nearby: ${candidate.performerName}. Tap to queue a five dollar tip.',
      button: !isTipQueued,
      child: GestureDetector(
        onTap: isTipQueued ? null : onTipTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xCC0B0C10),
            borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
            border: Border.all(
              color: isTipQueued ? CbColors.heartOrange : CbColors.reticleGreen.withValues(alpha: 0.6),
              width: 1.5,
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x40000000),
                blurRadius: 8,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isTipQueued ? CbColors.heartOrange : CbColors.reticleGreen,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                isTipQueued
                    ? 'Tip queued for ${candidate.performerName} (\$5)'
                    : 'Live nearby: ${candidate.performerName} · Tap to queue tip (\$5)',
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

  /// Standard glassmorphic floating banner in photo/idle mode.
  Widget _buildStandardBanner(BuildContext context) {
    return Semantics(
      label: 'Live nearby: ${candidate.performerName}, ${candidate.performerType == 'band' ? 'Band' : 'Solo Musician'}. Distance: ${candidate.distanceMeters.toStringAsFixed(0)} meters.',
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xE614161D), // 90% opacity deep dark
          borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
          border: Border.all(color: CbColors.borderSubtle, width: 1),
          boxShadow: const [
            BoxShadow(
              color: Color(0x66000000),
              blurRadius: 16,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Avatar / Icon
            _buildAvatar(),
            const SizedBox(width: 12),

            // Performer Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: CbColors.reticleGreen,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        'LIVE NEARBY • ${candidate.distanceMeters.toStringAsFixed(0)}m',
                        style: const TextStyle(
                          color: CbColors.reticleGreen,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    candidate.performerName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (candidate.venueName != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      candidate.venueName!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(width: 8),

            // Action: Tip $5 Button
            Semantics(
              button: true,
              label: 'Tip five dollars to ${candidate.performerName}',
              child: SizedBox(
                height: 40,
                child: ElevatedButton(
                  onPressed: onTipTap,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CbColors.heartOrange,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Tip \$5',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(width: 4),

            // Dismiss Button (X)
            Semantics(
              button: true,
              label: 'Dismiss suggestion for thirty minutes',
              child: IconButton(
                constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                icon: const Icon(Icons.close, color: Colors.white54, size: 18),
                onPressed: onDismiss,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    if (candidate.performerAvatarUrl != null && candidate.performerAvatarUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: 20,
        backgroundImage: NetworkImage(candidate.performerAvatarUrl!),
        backgroundColor: CbColors.surfaceCard,
      );
    }
    return CircleAvatar(
      radius: 20,
      backgroundColor: candidate.performerType == 'band' ? CbColors.purpleMain : CbColors.heartOrange,
      child: Icon(
        candidate.performerType == 'band' ? Icons.groups : Icons.person,
        color: Colors.white,
        size: 20,
      ),
    );
  }
}
