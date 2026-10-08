// Crowdbeats V2 — Sponsor Sponsorships Pipeline Tab
// Pipeline management with "Under Review", "Active", and "Completed" segmented tabs,
// deal volume summaries, and interactive ApplicationReviewModal triggers.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../models/sponsor_models.dart';
import '../state/sponsor_state.dart';
import '../widgets/sponsorship_list_item.dart';

class SponsorSponsorshipsTab extends ConsumerStatefulWidget {
  const SponsorSponsorshipsTab({super.key});

  @override
  ConsumerState<SponsorSponsorshipsTab> createState() => _SponsorSponsorshipsTabState();
}

class _SponsorSponsorshipsTabState extends ConsumerState<SponsorSponsorshipsTab> {
  int _selectedFilterIndex = 0; // 0: Under Review, 1: Active, 2: Completed

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(sponsorProvider);
    final notifier = ref.read(sponsorProvider.notifier);

    final underReviewList = state.underReviewApplications;
    final activeList = state.activeApplications;
    final completedList = state.completedApplications;

    final currentList = switch (_selectedFilterIndex) {
      0 => underReviewList,
      1 => activeList,
      _ => completedList,
    };

    // Calculate total committed pipeline value
    final activePipelineCents = activeList.fold<int>(
      0,
      (sum, app) => sum + (app.counterOfferCents ?? app.proposedCompensationCents),
    );

    return ListView(
      padding: const EdgeInsets.only(
        top: CbSpacing.s4,
        bottom: 100, // accommodate bottom nav bar
      ),
      children: [
        // Header
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Sponsorship Pipeline',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Manage talent proposals, active campaign milestones, and contracts.',
                style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
              ),
            ],
          ),
        ),

        const SizedBox(height: CbSpacing.s4),

        // Pipeline Metrics Snapshot Banner
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Container(
            padding: const EdgeInsets.all(CbSpacing.s4),
            decoration: BoxDecoration(
              color: CbColors.surface1,
              borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
              border: Border.all(color: const Color(0x1AFFFFFF)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Committed Active Value',
                        style: TextStyle(color: CbColors.textMuted, fontSize: 11, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        formatCurrencyCents(activePipelineCents),
                        style: const TextStyle(
                          color: CbColors.liveGreen,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(width: 1, height: 32, color: const Color(0x1AFFFFFF)),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(left: CbSpacing.s4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Total Deliverables',
                          style: TextStyle(color: CbColors.textMuted, fontSize: 11, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${activeList.fold<int>(0, (s, a) => s + a.deliverables.length)} Live Across Shows',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: CbSpacing.s4),

        // Segmented Filter Bar
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: CbColors.surface1,
              borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
              border: Border.all(color: const Color(0x1AFFFFFF)),
            ),
            child: Row(
              children: [
                _buildSegmentTab(
                  index: 0,
                  label: 'Under Review',
                  badgeCount: underReviewList.length,
                ),
                _buildSegmentTab(
                  index: 1,
                  label: 'Active',
                  badgeCount: activeList.length,
                ),
                _buildSegmentTab(
                  index: 2,
                  label: 'Completed',
                  badgeCount: completedList.length,
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: CbSpacing.s4),

        // Applications List
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: currentList.isEmpty
              ? _buildEmptyState(_selectedFilterIndex)
              : Column(
                  children: currentList.map((app) {
                    return SponsorshipListItem(
                      application: app,
                      onAccept: () {
                        notifier.acceptApplication(app.id);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            backgroundColor: CbColors.liveGreen,
                            content: Text('Accepted sponsorship deal for ${app.talent.name}!'),
                          ),
                        );
                      },
                      onCounterOffer: (counterCents, note) {
                        notifier.counterOfferApplication(app.id, counterCents, note);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            backgroundColor: CbColors.purpleMain,
                            content: Text(
                              'Counter-offer dispatched to ${app.talent.name} for ${formatCurrencyCents(counterCents)}.',
                            ),
                          ),
                        );
                      },
                      onDecline: (reason) {
                        notifier.declineApplication(app.id);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            backgroundColor: CbColors.surface2,
                            content: Text('Declined application from ${app.talent.name}.'),
                          ),
                        );
                      },
                    );
                  }).toList(),
                ),
        ),
      ],
    );
  }

  Widget _buildSegmentTab({
    required int index,
    required String label,
    required int badgeCount,
  }) {
    final isSelected = _selectedFilterIndex == index;

    return Expanded(
      child: Semantics(
        button: true,
        selected: isSelected,
        label: '$label tab, $badgeCount items',
        child: GestureDetector(
          onTap: () => setState(() => _selectedFilterIndex = index),
          child: Container(
            height: 44, // comfortable touch target
            decoration: BoxDecoration(
              color: isSelected ? CbColors.purpleMain : Colors.transparent,
              borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
              boxShadow: isSelected
                  ? const [
                      BoxShadow(
                        color: CbColors.purpleGlow,
                        blurRadius: 8,
                        offset: Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: isSelected ? Colors.white : CbColors.textSecondary,
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  ),
                ),
                if (badgeCount > 0) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.white.withValues(alpha: 0.25) : CbColors.surface2,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    ),
                    child: Text(
                      badgeCount.toString(),
                      style: TextStyle(
                        color: isSelected ? Colors.white : CbColors.purpleLight,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(int tabIndex) {
    final (title, subtitle, icon) = switch (tabIndex) {
      0 => (
        'No pending applications',
        'Inbound talent sponsorship requests will appear here for review.',
        Icons.inbox_outlined,
      ),
      1 => (
        'No active sponsorships',
        'Accepted deals and currently funded gigs will show up here.',
        Icons.campaign_outlined,
      ),
      _ => (
        'No past completed campaigns',
        'Archived sponsorships with post-event analytics will be stored here.',
        Icons.history,
      ),
    };

    return Container(
      padding: const EdgeInsets.all(CbSpacing.s6),
      margin: const EdgeInsets.only(top: CbSpacing.s4),
      decoration: BoxDecoration(
        color: CbColors.surface1,
        borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
        border: Border.all(color: const Color(0x1AFFFFFF)),
      ),
      child: Center(
        child: Column(
          children: [
            Icon(icon, color: CbColors.textMuted, size: 40),
            const SizedBox(height: CbSpacing.s3),
            Text(
              title,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
