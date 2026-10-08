// Crowdbeats V2 — Nearby Performer Chooser Bottom Sheet
//
// Displayed when:
// 1. More than 1 live act is detected within 100 meters.
// 2. Device horizontal location accuracy is coarser than 50 meters.
//
// Invariants:
// - Eliminates false-positive auto-assignment.
// - Explicit user confirmation before tipping.
// - Displays band vs solo badges, distance, genres.

import 'package:flutter/material.dart';

import '../../data/models/camera_tipping.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class NearbyPerformerChooserSheet extends StatelessWidget {
  const NearbyPerformerChooserSheet({
    super.key,
    required this.candidates,
    required this.onSelect,
    this.accuracyMeters,
  });

  final List<NearbyPerformerCandidate> candidates;
  final ValueChanged<NearbyPerformerCandidate> onSelect;
  final double? accuracyMeters;

  static Future<NearbyPerformerCandidate?> show(
    BuildContext context, {
    required List<NearbyPerformerCandidate> candidates,
    double? accuracyMeters,
  }) {
    return showModalBottomSheet<NearbyPerformerCandidate>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => NearbyPerformerChooserSheet(
        candidates: candidates,
        accuracyMeters: accuracyMeters,
        onSelect: (candidate) => Navigator.of(ctx).pop(candidate),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isCoarseGps = (accuracyMeters ?? 0) > 50;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      decoration: const BoxDecoration(
        color: CbColors.bgApp,
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
        border: Border(top: BorderSide(color: CbColors.borderSubtle)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Performers Playing Nearby',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isCoarseGps
                            ? 'GPS signal is coarse (±${accuracyMeters!.toStringAsFixed(0)}m). Please select who you are watching:'
                            : 'Multiple live acts detected nearby. Select who you want to support:',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white54),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),
          const Divider(color: CbColors.borderSubtle, height: 1),

          // Candidates List
          Flexible(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: candidates.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (ctx, index) {
                final candidate = candidates[index];
                return _buildCandidateCard(ctx, candidate);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCandidateCard(BuildContext context, NearbyPerformerCandidate candidate) {
    return Semantics(
      button: true,
      label: 'Select ${candidate.performerName}, ${candidate.performerType == 'band' ? 'Band' : 'Solo Musician'}, ${candidate.distanceMeters.toStringAsFixed(0)} meters away.',
      child: InkWell(
        onTap: () => onSelect(candidate),
        borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: CbColors.surfaceCard,
            borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
            border: Border.all(color: CbColors.borderSubtle),
          ),
          child: Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 24,
                backgroundColor: candidate.performerType == 'band'
                    ? CbColors.purpleMain
                    : CbColors.heartOrange,
                backgroundImage: candidate.performerAvatarUrl != null
                    ? NetworkImage(candidate.performerAvatarUrl!)
                    : null,
                child: candidate.performerAvatarUrl == null
                    ? Icon(
                        candidate.performerType == 'band' ? Icons.groups : Icons.person,
                        color: Colors.white,
                        size: 24,
                      )
                    : null,
              ),

              const SizedBox(width: 14),

              // Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            candidate.performerName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: candidate.performerType == 'band'
                                ? CbColors.purpleMain.withValues(alpha: 0.3)
                                : CbColors.heartOrange.withValues(alpha: 0.3),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            candidate.performerType == 'band' ? 'BAND' : 'SOLO',
                            style: TextStyle(
                              color: candidate.performerType == 'band'
                                  ? const Color(0xFFC084FC)
                                  : CbColors.heartOrange,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${candidate.distanceMeters.toStringAsFixed(0)}m away${candidate.venueName != null ? ' • ${candidate.venueName}' : ''}',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                    if (candidate.genres.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 4,
                        children: candidate.genres.take(2).map((g) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.white10,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              g,
                              style: const TextStyle(color: Colors.white60, fontSize: 10),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(width: 8),

              // Select & Tip Button
              ElevatedButton(
                onPressed: () => onSelect(candidate),
                style: ElevatedButton.styleFrom(
                  backgroundColor: CbColors.heartOrange,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                  ),
                ),
                child: const Text('Tip \$5', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
