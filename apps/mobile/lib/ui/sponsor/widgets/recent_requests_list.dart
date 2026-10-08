// Crowdbeats V2 — Recent Applicant Requests List
// Displays pending sponsorship applications awaiting review from talent or venues.
// Includes talent avatar, pitch snippet, compensation amount, and review trigger.

import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../models/sponsor_models.dart';
import 'application_review_modal.dart';

class RecentRequestsList extends StatelessWidget {
  const RecentRequestsList({
    super.key,
    required this.requests,
    required this.onAccept,
    required this.onCounterOffer,
    required this.onDecline,
    this.onViewAll,
  });

  final List<SponsorshipApplication> requests;
  final ValueChanged<SponsorshipApplication> onAccept;
  final void Function(SponsorshipApplication app, int counterCents, String note) onCounterOffer;
  final void Function(SponsorshipApplication app, String? reason) onDecline;
  final VoidCallback? onViewAll;

  @override
  Widget build(BuildContext context) {
    if (requests.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(CbSpacing.s5),
        decoration: BoxDecoration(
          color: CbColors.surface1,
          borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
          border: Border.all(color: const Color(0x1AFFFFFF)),
        ),
        child: const Center(
          child: Column(
            children: [
              Icon(Icons.mark_email_read_outlined, color: CbColors.textMuted, size: 32),
              SizedBox(height: CbSpacing.s2),
              Text(
                'All caught up!',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              SizedBox(height: 2),
              Text(
                'No pending sponsorship requests awaiting review.',
                style: TextStyle(color: CbColors.textSecondary, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: requests.map((app) {
        return _RequestItemCard(
          application: app,
          onTap: () => _openReviewModal(context, app),
        );
      }).toList(),
    );
  }

  void _openReviewModal(BuildContext context, SponsorshipApplication app) {
    ApplicationReviewModal.show(
      context,
      application: app,
      onAccept: () => onAccept(app),
      onCounterOffer: (cents, note) => onCounterOffer(app, cents, note),
      onDecline: (reason) => onDecline(app, reason),
    );
  }
}

class _RequestItemCard extends StatelessWidget {
  const _RequestItemCard({
    required this.application,
    required this.onTap,
  });

  final SponsorshipApplication application;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final talent = application.talent;
    final formattedDate =
        '${application.eventDate.month}/${application.eventDate.day}';

    return Container(
      margin: const EdgeInsets.only(bottom: CbSpacing.s3),
      decoration: BoxDecoration(
        color: CbColors.surface1,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(color: const Color(0x1AFFFFFF)),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        child: InkWell(
          borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(CbSpacing.s4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar / Badge
                CircleAvatar(
                  radius: 24,
                  backgroundColor: CbColors.purpleDim,
                  child: Text(
                    talent.name.substring(0, talent.name.length >= 2 ? 2 : 1).toUpperCase(),
                    style: const TextStyle(
                      color: CbColors.purpleLight,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ),
                const SizedBox(width: CbSpacing.s3),
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(
                            child: Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    talent.name,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
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
                          ),
                          Text(
                            formatCurrencyCents(application.proposedCompensationCents),
                            style: const TextStyle(
                              color: CbColors.liveGreen,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${application.eventName} · $formattedDate',
                        style: const TextStyle(
                          color: CbColors.purpleLight,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        application.proposalText,
                        style: const TextStyle(
                          color: CbColors.textMuted,
                          fontSize: 12,
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: CbSpacing.s3),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${application.deliverables.length} deliverables requested',
                            style: const TextStyle(
                              color: CbColors.textSecondary,
                              fontSize: 11,
                            ),
                          ),
                          // Min 48x48 touch target review CTA
                          Semantics(
                            button: true,
                            label: 'Review application for ${talent.name}',
                            child: SizedBox(
                              height: 48,
                              child: TextButton(
                                onPressed: onTap,
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  backgroundColor: CbColors.surface2,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                                    side: const BorderSide(color: Color(0x338B5CF6)),
                                  ),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'Review',
                                      style: TextStyle(
                                        color: CbColors.purpleLight,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    SizedBox(width: 4),
                                    Icon(Icons.arrow_forward, color: CbColors.purpleLight, size: 12),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
