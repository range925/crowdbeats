// Crowdbeats V2 — Sponsorship Pipeline List Item
// Displays deal summary: talent info, formatted compensation amount, deliverable count,
// and semantic status pill. Tapping triggers ApplicationReviewModal.

import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../models/sponsor_models.dart';
import 'application_review_modal.dart';

class SponsorshipListItem extends StatelessWidget {
  const SponsorshipListItem({
    super.key,
    required this.application,
    required this.onAccept,
    required this.onCounterOffer,
    required this.onDecline,
    this.onTap,
  });

  final SponsorshipApplication application;
  final VoidCallback onAccept;
  final void Function(int counterCents, String note) onCounterOffer;
  final void Function(String? reason) onDecline;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final talent = application.talent;
    final formattedDate =
        '${application.eventDate.month}/${application.eventDate.day}/${application.eventDate.year}';

    return Container(
      margin: const EdgeInsets.only(bottom: CbSpacing.s3),
      decoration: BoxDecoration(
        color: CbColors.surface1,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(
          color: const Color(0x1FFFFFFF),
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        child: InkWell(
          borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
          onTap: onTap ?? () => _openReview(context),
          child: Padding(
            padding: const EdgeInsets.all(CbSpacing.s4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Talent & Status Pill
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: CbColors.purpleDim,
                      child: Text(
                        talent.name.substring(0, talent.name.length >= 2 ? 2 : 1).toUpperCase(),
                        style: const TextStyle(
                          color: CbColors.purpleLight,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const SizedBox(width: CbSpacing.s3),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  talent.name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (talent.isVerified) ...[
                                const SizedBox(width: 4),
                                const Icon(Icons.verified, color: CbColors.verifiedBlue, size: 14),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${application.eventName} · $formattedDate',
                            style: const TextStyle(
                              color: CbColors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _buildStatusPill(application.status),
                  ],
                ),

                const SizedBox(height: CbSpacing.s3),

                // Deliverables summary pill & Venue
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, color: CbColors.textMuted, size: 13),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        '${application.venueName}, ${application.city}',
                        style: const TextStyle(color: CbColors.textMuted, fontSize: 12),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: CbSpacing.s3),
                const Divider(color: Color(0x14FFFFFF), height: 1),
                const SizedBox(height: CbSpacing.s3),

                // Bottom Row: Deliverables count & Financial compensation
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.task_alt, color: CbColors.purpleLight, size: 14),
                        const SizedBox(width: 5),
                        Text(
                          '${application.deliverables.length} Deliverables',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          formatCurrencyCents(
                            application.counterOfferCents ?? application.proposedCompensationCents,
                          ),
                          style: const TextStyle(
                            color: CbColors.liveGreen,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (application.counterOfferCents != null)
                          const Text(
                            'Counter Offer Active',
                            style: TextStyle(
                              color: CbColors.heartOrange,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusPill(ApplicationStatus status) {
    final (bg, border, fg) = switch (status) {
      ApplicationStatus.underReview => (
        const Color(0x26FB923C),
        const Color(0x4DFB923C),
        CbColors.heartOrange,
      ),
      ApplicationStatus.active => (
        const Color(0x2610B981),
        const Color(0x4D10B981),
        CbColors.liveGreen,
      ),
      ApplicationStatus.completed => (
        const Color(0x2664748B),
        const Color(0x4D64748B),
        CbColors.textSecondary,
      ),
      ApplicationStatus.declined => (
        const Color(0x26EF4444),
        const Color(0x4DEF4444),
        CbColors.errorRed,
      ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
        border: Border.all(color: border),
      ),
      child: Text(
        status.label,
        style: TextStyle(
          color: fg,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  void _openReview(BuildContext context) {
    ApplicationReviewModal.show(
      context,
      application: application,
      onAccept: onAccept,
      onCounterOffer: onCounterOffer,
      onDecline: onDecline,
    );
  }
}
