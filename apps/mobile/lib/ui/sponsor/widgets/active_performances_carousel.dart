// Crowdbeats V2 — Active Performances Carousel
// Displays upcoming live performances backed by the sponsor with horizontal scroll,
// date/venue, performer name, stage, live badge, and deliverable progress.

import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../models/sponsor_models.dart';

class ActivePerformancesCarousel extends StatelessWidget {
  const ActivePerformancesCarousel({
    super.key,
    required this.performances,
    this.onTapPerformance,
  });

  final List<ActivePerformance> performances;
  final ValueChanged<ActivePerformance>? onTapPerformance;

  @override
  Widget build(BuildContext context) {
    if (performances.isEmpty) {
      return Container(
        height: 140,
        margin: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
        padding: const EdgeInsets.all(CbSpacing.s4),
        decoration: BoxDecoration(
          color: CbColors.surface1,
          borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
          border: Border.all(color: const Color(0x1AFFFFFF)),
        ),
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.event_busy, color: CbColors.textMuted, size: 28),
              SizedBox(height: CbSpacing.s2),
              Text(
                'No upcoming sponsored performances this week.',
                style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
              ),
            ],
          ),
        ),
      );
    }

    return SizedBox(
      height: 190,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
        itemCount: performances.length,
        separatorBuilder: (_, _) => const SizedBox(width: CbSpacing.s3),
        itemBuilder: (context, index) {
          final perf = performances[index];
          return _PerformanceCard(
            performance: perf,
            onTap: () {
              if (onTapPerformance != null) {
                onTapPerformance!(perf);
              } else {
                _showPerformanceDetails(context, perf);
              }
            },
          );
        },
      ),
    );
  }

  void _showPerformanceDetails(BuildContext context, ActivePerformance perf) {
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
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          perf.performerName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '${perf.venueName} · ${perf.stage}',
                          style: const TextStyle(
                            color: CbColors.purpleLight,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const SizedBox(height: CbSpacing.s3),
              Container(
                padding: const EdgeInsets.all(CbSpacing.s3),
                decoration: BoxDecoration(
                  color: CbColors.surface2,
                  borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildModalStat('Audience Draw', '${perf.audienceDraw} cap'),
                    _buildModalStat('Tier', perf.sponsorshipTier),
                    _buildModalStat('Status', perf.status),
                  ],
                ),
              ),
              const SizedBox(height: CbSpacing.s4),
              const Text(
                'Deliverables Checklist',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: CbSpacing.s2),
              _buildDeliverableRow('Stage Banner Installation', true),
              _buildDeliverableRow('VIP Table Signage & Welcome Kit', true),
              _buildDeliverableRow('Live Mic Shoutout Before Encore', perf.deliverableProgress > 0.7),
              _buildDeliverableRow('Post-Event Audience Reach Recap', false),
              const SizedBox(height: CbSpacing.s4),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: CbColors.purpleMain,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    ),
                  ),
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        backgroundColor: CbColors.surface2,
                        content: Text('Contacting venue coordinator at ${perf.venueName}...'),
                      ),
                    );
                  },
                  child: const Text('Contact Venue Coordinator'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModalStat(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
      ],
    );
  }

  Widget _buildDeliverableRow(String title, bool isComplete) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(
            isComplete ? Icons.check_circle : Icons.radio_button_unchecked,
            color: isComplete ? CbColors.liveGreen : CbColors.textMuted,
            size: 18,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                color: isComplete ? Colors.white : CbColors.textSecondary,
                fontSize: 13,
                decoration: isComplete ? TextDecoration.lineThrough : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PerformanceCard extends StatelessWidget {
  const _PerformanceCard({
    required this.performance,
    required this.onTap,
  });

  final ActivePerformance performance;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isTonight = performance.status.toLowerCase().contains('tonight');
    final formattedDate =
        '${performance.performanceDate.month}/${performance.performanceDate.day} · ${performance.performanceDate.hour > 12 ? performance.performanceDate.hour - 12 : performance.performanceDate.hour}:${performance.performanceDate.minute.toString().padLeft(2, '0')} ${performance.performanceDate.hour >= 12 ? 'PM' : 'AM'}';

    return Container(
      width: 270,
      decoration: BoxDecoration(
        color: CbColors.surface1,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(
          color: isTonight ? CbColors.purpleLight.withValues(alpha: 0.6) : const Color(0x1FFFFFFF),
          width: isTonight ? 1.5 : 1.0,
        ),
        boxShadow: [
          if (isTonight)
            BoxShadow(
              color: CbColors.purpleMain.withValues(alpha: 0.25),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        child: InkWell(
          borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(CbSpacing.s4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Top Badge Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: isTonight
                              ? CbColors.statusLive.withValues(alpha: 0.2)
                              : CbColors.purpleDim,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                          border: Border.all(
                            color: isTonight ? CbColors.statusLive : const Color(0x338B5CF6),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (isTonight) ...[
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: CbColors.statusLive,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 4),
                            ],
                            Flexible(
                              child: Text(
                                performance.status,
                                style: TextStyle(
                                  color: isTonight ? CbColors.statusLive : CbColors.purpleLight,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      formattedDate,
                      style: const TextStyle(
                        color: CbColors.textMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: CbSpacing.s2),

                // Performer & Venue Info
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      performance.performerName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${performance.venueName} · ${performance.stage}',
                      style: const TextStyle(
                        color: CbColors.textSecondary,
                        fontSize: 12,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),

                const SizedBox(height: CbSpacing.s2),

                // Bottom Meta: Tier & Deliverable Progress
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            performance.sponsorshipTier,
                            style: const TextStyle(
                              color: CbColors.purpleLight,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          '${(performance.deliverableProgress * 100).toInt()}% prepped',
                          style: const TextStyle(
                            color: CbColors.textMuted,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                      child: LinearProgressIndicator(
                        value: performance.deliverableProgress,
                        backgroundColor: CbColors.surface2,
                        valueColor: const AlwaysStoppedAnimation<Color>(CbColors.purpleMain),
                        minHeight: 4,
                      ),
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
}
