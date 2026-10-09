// Crowdbeats V2 — Discovery Campaign Card
//
// Displays verified crowdfunding campaign cards in Fan Public Discovery:
// - Title & Creator identity (Solo Musician / Band)
// - Campaign description
// - Pledged vs Goal formatted in minor units ($pledged of $goal)
// - Progress bar and % funded
// - Backers count and days remaining
// - Support / Back CTA

import 'package:flutter/material.dart';
import '../../../data/models/discovery.dart';
import '../../theme/cb_colors.dart';
import '../tip/tip_flow_screen.dart';

class DiscoveryCampaignCard extends StatelessWidget {
  const DiscoveryCampaignCard({
    super.key,
    required this.campaign,
    this.onTap,
    this.onTapSupport,
  });

  final DiscoveryCampaign campaign;
  final VoidCallback? onTap;
  final VoidCallback? onTapSupport;

  String _formatAmount(int cents) {
    final dollars = cents / 100.0;
    if (dollars >= 1000) {
      if (dollars % 1000 == 0) {
        return '\$${(dollars / 1000).toStringAsFixed(0)}k';
      }
      return '\$${(dollars / 1000).toStringAsFixed(1)}k';
    }
    return '\$${dollars.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final progress = campaign.progressFraction;
    final percent = campaign.percentFunded;

    final cardBg = isDark ? const Color(0xFF151722) : Colors.white;
    final borderColor = isDark ? const Color(0x1FFFFFFF) : const Color(0xFFE2E8F0);
    final titleColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryText = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.05),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Creator Row
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  image: campaign.creatorPhotoUrl != null
                      ? DecorationImage(
                          image: NetworkImage(campaign.creatorPhotoUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                  color: const Color(0xFF7C3AED).withValues(alpha: 0.15),
                ),
                child: campaign.creatorPhotoUrl == null
                    ? Center(
                        child: Text(
                          campaign.creatorType.toLowerCase().contains('band') ? '🎸' : '🎤',
                          style: const TextStyle(fontSize: 18),
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      campaign.creatorName,
                      style: TextStyle(
                        color: titleColor,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.2,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      '${campaign.creatorType} · Verified Campaign',
                      style: TextStyle(
                        color: const Color(0xFFA855F7),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0x4D10B981)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.bolt_rounded, color: Color(0xFF10B981), size: 13),
                    const SizedBox(width: 2),
                    Text(
                      '$percent%',
                      style: const TextStyle(
                        color: Color(0xFF10B981),
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Title & Description
          Text(
            campaign.title,
            style: TextStyle(
              color: titleColor,
              fontSize: 16,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            campaign.description,
            style: TextStyle(
              color: secondaryText,
              fontSize: 13,
              height: 1.35,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 14),

          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: isDark ? const Color(0xFF242838) : const Color(0xFFE2E8F0),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFA855F7)),
            ),
          ),
          const SizedBox(height: 12),

          // Stats and Action
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: TextSpan(
                      text: _formatAmount(campaign.pledgedCents),
                      style: TextStyle(
                        color: titleColor,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                      children: [
                        TextSpan(
                          text: ' of ${_formatAmount(campaign.goalCents)}',
                          style: TextStyle(
                            color: secondaryText,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${campaign.backerCount} backers · ${campaign.daysRemaining} days left',
                    style: TextStyle(
                      color: secondaryText,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              ElevatedButton(
                onPressed: onTapSupport ??
                    () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => TipFlowScreen(
                            recipientId: campaign.creatorId,
                            recipientName: campaign.creatorName,
                            recipientType: campaign.creatorType,
                            avatarUrl: campaign.creatorPhotoUrl,
                            genre: 'Campaign',
                            venue: campaign.title,
                          ),
                        ),
                      );
                    },
                style: ElevatedButton.styleFrom(
                  backgroundColor: CbColors.purpleMain,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  minimumSize: const Size(80, 36),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  'Support',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
