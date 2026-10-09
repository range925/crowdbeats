// Crowdbeats V2 — NearbyCreatorCard Widget
//
// Compact horizontal profile card for Top 5 Nearby performers:
// - Profile image (56px)
// - Artist/Band name + verified checkmark
// - Distance + Genre + Venue context
// - Contextual green LIVE badge when performing
// - 8–18 word AI-generated summary (based strictly on approved public data)
// - View Profile navigation + Tip button

import 'package:flutter/material.dart';
import '../../../data/models/discovery.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../tip/tip_flow_screen.dart';
import '../public_profile_screen.dart';

class NearbyCreatorCard extends StatelessWidget {
  const NearbyCreatorCard({
    super.key,
    required this.performer,
    this.isSelected = false,
    this.rank,
    this.onTap,
    this.onTapTip,
  });

  final PublicPerformer performer;
  final bool isSelected;
  final int? rank;
  final VoidCallback? onTap;
  final VoidCallback? onTapTip;

  @override
  Widget build(BuildContext context) {
    final summary = performer.aiCardSummary ??
        (performer.type == 'band'
            ? 'Independent band performing original music and connecting with fans through Crowdbeats.'
            : 'Independent musician bringing original live music to the Crowdbeats community.');

    return GestureDetector(
      onTap: onTap ??
          () {
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => PublicProfileScreen(
                  slug: performer.slug,
                  type: performer.type,
                ),
              ),
            );
          },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF151722),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected
                ? CbColors.purpleMain
                : (performer.isLive
                    ? const Color(0x6610B981)
                    : const Color(0x1FFFFFFF)),
            width: isSelected || performer.isLive ? 1.5 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: performer.isLive
                  ? const Color(0x1A10B981)
                  : Colors.black.withValues(alpha: 0.25),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Avatar, Info, and Tip Button
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                if (rank != null) ...[
                  Container(
                    width: 24,
                    height: 24,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFF7C3AED)
                          : const Color(0xFF242838),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFFA855F7)
                            : const Color(0x33FFFFFF),
                      ),
                    ),
                    child: Center(
                      child: Text(
                        '$rank',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                ],
                // Avatar (56px) with optional Live ring
                Stack(
                  children: [
                    Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: performer.isLive
                              ? const Color(0xFF10B981)
                              : Colors.white.withValues(alpha: 0.2),
                          width: performer.isLive ? 2.0 : 1.0,
                        ),
                        image: performer.photoUrl != null
                            ? DecorationImage(
                                image: NetworkImage(performer.photoUrl!),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: performer.photoUrl == null
                          ? Center(
                              child: Text(
                                performer.type == 'band' ? '🎸' : '🎤',
                                style: const TextStyle(fontSize: 24),
                              ),
                            )
                          : null,
                    ),
                    if (performer.isLive)
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.black, width: 1.5),
                          ),
                          child: const Text(
                            'LIVE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 12),

                // Name, Distance, Genres
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              performer.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                letterSpacing: -0.3,
                              ),
                            ),
                          ),
                          if (performer.isVerified) ...[
                            const SizedBox(width: 4),
                            const Icon(
                              Icons.verified_rounded,
                              color: Color(0xFF38BDF8),
                              size: 15,
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          if (performer.distanceMiles != null) ...[
                            Text(
                              '${performer.distanceMiles!.toStringAsFixed(1)} mi',
                              style: const TextStyle(
                                color: Color(0xFFA855F7),
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const Text(
                              ' · ',
                              style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                            ),
                          ],
                          Flexible(
                            child: Text(
                              performer.genres.isNotEmpty ? performer.genres.first : 'Live Music',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF94A3B8),
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          if (performer.currentVenueName != null) ...[
                            const Text(
                              ' · ',
                              style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                            ),
                            Flexible(
                              child: Text(
                                performer.currentVenueName!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Color(0xFFE2E8F0),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),

                // Tip CTA Pill
                GestureDetector(
                  onTap: onTapTip ??
                      () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => TipFlowScreen(
                              recipientId: performer.id,
                              recipientName: performer.name,
                              recipientType: performer.type,
                              avatarUrl: performer.photoUrl,
                              genre: performer.genres.isNotEmpty ? performer.genres.first : 'Live Music',
                              venue: performer.currentVenueName ?? 'Main Stage',
                            ),
                          ),
                        );
                      },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      color: CbColors.purpleMain,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                      boxShadow: [
                        BoxShadow(
                          color: CbColors.purpleMain.withValues(alpha: 0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '⚡',
                          style: TextStyle(fontSize: 12),
                        ),
                        SizedBox(width: 3),
                        Text(
                          'Tip',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 10),

            // AI Profile Summary (8–18 words)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: Text(
                '"$summary"',
                style: const TextStyle(
                  color: Color(0xFFCBD5E1),
                  fontSize: 12.5,
                  fontWeight: FontWeight.w400,
                  fontStyle: FontStyle.italic,
                  height: 1.35,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
