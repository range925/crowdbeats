// Crowdbeats V2 — PopularCreatorCard Widget
//
// Compact horizontal profile card for Top 3 Popular performers:
// - Rank indicator badge (#1, #2, #3)
// - Profile avatar
// - Artist/Band name + verified badge
// - Genre + performance context
// - 8–18 word AI summary
// - Tip button + View Profile

import 'package:flutter/material.dart';
import '../../../data/models/discovery.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../tip/tip_flow_screen.dart';
import '../public_profile_screen.dart';

class PopularCreatorCard extends StatelessWidget {
  const PopularCreatorCard({
    super.key,
    required this.performer,
    required this.rank,
    this.isSelected = false,
    this.onTap,
    this.onTapTip,
  });

  final PublicPerformer performer;
  final int rank; // 1, 2, or 3
  final bool isSelected;
  final VoidCallback? onTap;
  final VoidCallback? onTapTip;

  @override
  Widget build(BuildContext context) {
    final summary = performer.aiCardSummary ??
        (performer.type == 'band'
            ? 'Independent band performing original music and connecting with fans through Crowdbeats.'
            : 'Independent musician bringing original live music to the Crowdbeats community.');

    final rankColor = rank == 1
        ? CbColors.rankGold
        : (rank == 2 ? CbColors.rankSilver : CbColors.rankBronze);

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
                : (rank == 1
                    ? const Color(0x66F59E0B)
                    : const Color(0x1FFFFFFF)),
            width: isSelected ? 2.0 : (rank == 1 ? 1.5 : 1.0),
          ),
          boxShadow: [
            if (isSelected)
              BoxShadow(
                color: CbColors.purpleMain.withValues(alpha: 0.35),
                blurRadius: 16,
                spreadRadius: 1,
              ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Rank Badge (#1, #2, #3)
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: rankColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: rankColor.withValues(alpha: 0.5), width: 1),
                  ),
                  child: Center(
                    child: Text(
                      '#$rank',
                      style: TextStyle(
                        color: rankColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),

                // Avatar (48px)
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
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
                            style: const TextStyle(fontSize: 20),
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 12),

                // Name & Genres
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
                      Text(
                        performer.genres.isNotEmpty ? performer.genres.first : 'Trending Artist',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
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

            // AI Profile Summary
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
