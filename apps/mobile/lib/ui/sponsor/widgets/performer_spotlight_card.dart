// Crowdbeats V2 — Performer Spotlight Card
// Displays rich talent details: artist/band photo, Solo/Band badge, verified checkmark,
// listener/draw count, engagement rate, bookmark button, and "Offer Sponsorship" button.

import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../models/sponsor_models.dart';

class PerformerSpotlightCard extends StatelessWidget {
  const PerformerSpotlightCard({
    super.key,
    required this.talent,
    required this.onToggleBookmark,
    required this.onOfferSponsorship,
    this.onTapCard,
  });

  final TalentProfile talent;
  final VoidCallback onToggleBookmark;
  final ValueChanged<TalentProfile> onOfferSponsorship;
  final VoidCallback? onTapCard;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: CbSpacing.s4),
      decoration: BoxDecoration(
        color: CbColors.surface1,
        borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
        border: Border.all(
          color: const Color(0x2BFFFFFF),
          width: 1,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x40000000),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
        child: InkWell(
          borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
          onTap: onTapCard ?? () => _showTalentDetailSheet(context),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Rich Hero Media Container
              Stack(
                children: [
                  Container(
                    height: 140,
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      color: CbColors.surface2,
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(CbSpacing.radiusXl),
                      ),
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          CbColors.purpleDim,
                          Color(0xFF1E2032),
                        ],
                      ),
                    ),
                    child: Center(
                      child: Icon(
                        talent.type == 'Venue'
                            ? Icons.stadium
                            : (talent.type == 'Band' ? Icons.groups : Icons.mic_external_on),
                        size: 48,
                        color: CbColors.purpleLight.withValues(alpha: 0.4),
                      ),
                    ),
                  ),

                  // Gradient Dark Overlay for text legibility
                  Positioned.fill(
                    child: Container(
                      decoration: const BoxDecoration(
                        borderRadius: BorderRadius.vertical(
                          top: Radius.circular(CbSpacing.radiusXl),
                        ),
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Color(0xCC151722),
                            Color(0xFF151722),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Top Left Badges (Solo / Band / Venue & Genre)
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
                            borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                            border: Border.all(color: const Color(0x33FFFFFF)),
                          ),
                          child: Text(
                            talent.type.toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: CbColors.purpleDim,
                            borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                            border: Border.all(color: const Color(0x338B5CF6)),
                          ),
                          child: Text(
                            talent.primaryGenre,
                            style: const TextStyle(
                              color: CbColors.purpleLight,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Top Right Bookmark Button (Min 48x48dp touch target)
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Semantics(
                      button: true,
                      label: talent.isBookmarked
                          ? 'Remove ${talent.name} from saved bookmarks'
                          : 'Save ${talent.name} to bookmarks',
                      child: IconButton(
                        iconSize: 22,
                        padding: const EdgeInsets.all(13), // 22 + 26 = 48dp
                        icon: Icon(
                          talent.isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                          color: talent.isBookmarked ? CbColors.purpleLight : Colors.white70,
                        ),
                        onPressed: onToggleBookmark,
                      ),
                    ),
                  ),

                  // Bottom Overlay: Performer Name & Verified Badge
                  Positioned(
                    bottom: 8,
                    left: 14,
                    right: 14,
                    child: Row(
                      children: [
                        Flexible(
                          child: Text(
                            talent.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (talent.isVerified) ...[
                          const SizedBox(width: 6),
                          const Icon(Icons.verified, color: CbColors.verifiedBlue, size: 18),
                        ],
                      ],
                    ),
                  ),
                ],
              ),

              // Card Body
              Padding(
                padding: const EdgeInsets.all(CbSpacing.s4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Bio / Location
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, color: CbColors.textMuted, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          talent.location,
                          style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      talent.bio,
                      style: const TextStyle(
                        color: CbColors.textSecondary,
                        fontSize: 13,
                        height: 1.35,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: CbSpacing.s4),

                    // Metrics Strip
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s3, vertical: 8),
                      decoration: BoxDecoration(
                        color: CbColors.surface2,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                        border: Border.all(color: const Color(0x14FFFFFF)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildStatColumn('Followers', formatCompactNumber(talent.followerCount)),
                          Container(width: 1, height: 24, color: const Color(0x1AFFFFFF)),
                          _buildStatColumn('Avg Draw', '${talent.averageDraw} cap'),
                          Container(width: 1, height: 24, color: const Color(0x1AFFFFFF)),
                          _buildStatColumn(
                            'Engagement',
                            '${talent.engagementRate}%',
                            valueColor: CbColors.liveGreen,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: CbSpacing.s4),

                    // Offer Sponsorship Button (Min 48x48dp touch target)
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: FilledButton.icon(
                        onPressed: () => onOfferSponsorship(talent),
                        style: FilledButton.styleFrom(
                          backgroundColor: CbColors.purpleMain,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                          ),
                        ),
                        icon: const Icon(Icons.handshake_outlined, size: 18),
                        label: const Text(
                          'Offer Sponsorship',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatColumn(String label, String value, {Color? valueColor}) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(color: CbColors.textMuted, fontSize: 11),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            color: valueColor ?? Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  void _showTalentDetailSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(CbSpacing.s5),
        decoration: const BoxDecoration(
          color: CbColors.surface1,
          borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
          border: Border(top: BorderSide(color: Color(0x338B5CF6), width: 1)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      talent.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '${talent.type} · ${talent.primaryGenre} · ${talent.location}',
                style: const TextStyle(color: CbColors.purpleLight, fontSize: 13),
              ),
              const SizedBox(height: CbSpacing.s3),
              Text(
                talent.bio,
                style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: CbSpacing.s4),
              const Text(
                'Recent Performance Venues',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              ),
              const SizedBox(height: CbSpacing.s2),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: talent.recentVenues.map((v) {
                  return Chip(
                    backgroundColor: CbColors.surface2,
                    label: Text(v, style: const TextStyle(color: Colors.white70, fontSize: 11)),
                  );
                }).toList(),
              ),
              const SizedBox(height: CbSpacing.s5),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    onOfferSponsorship(talent);
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: CbColors.purpleMain,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    ),
                  ),
                  child: const Text('Initiate Sponsorship Offer'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
