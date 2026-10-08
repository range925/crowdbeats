// Crowdbeats V2 — Sponsor Home Dashboard Tab
// High-level overview: BudgetOverviewCard, ActivePerformancesCarousel, RecentRequestsList,
// and quick operational shortcuts.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../models/sponsor_models.dart';
import '../state/sponsor_state.dart';
import '../widgets/active_performances_carousel.dart';
import '../widgets/budget_overview_card.dart';
import '../widgets/recent_requests_list.dart';

class SponsorHomeTab extends ConsumerWidget {
  const SponsorHomeTab({
    super.key,
    this.onNavigateToTab,
  });

  final ValueChanged<int>? onNavigateToTab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sponsorState = ref.watch(sponsorProvider);
    final notifier = ref.read(sponsorProvider.notifier);
    final org = sponsorState.organization;
    final performances = sponsorState.performances;
    final pendingRequests = sponsorState.underReviewApplications;

    return RefreshIndicator(
      color: CbColors.purpleLight,
      backgroundColor: CbColors.surface1,
      onRefresh: () async {
        await Future<void>.delayed(const Duration(milliseconds: 600));
      },
      child: ListView(
        padding: const EdgeInsets.only(
          top: CbSpacing.s4,
          bottom: 100, // accommodate bottom nav bar
        ),
        children: [
          // Welcome greeting banner
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome back, ${sponsorState.activeContext.name.split(" ").first}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: CbColors.liveGreen,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${org.activeCampaignsCount} Active Campaigns Live',
                          style: const TextStyle(
                            color: CbColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                // Quick ROI summary pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: CbColors.purpleDim,
                    borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    border: Border.all(color: const Color(0x338B5CF6)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.trending_up, color: CbColors.purpleLight, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        '${org.avgEngagementRate}% ROI',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: CbSpacing.s4),

          // 1. Budget Overview Card
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
            child: BudgetOverviewCard(
              organization: org,
              onManageBudget: () => _openBudgetDetails(context, org),
            ),
          ),

          const SizedBox(height: CbSpacing.s6),

          // 2. Active Sponsored Performances Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.mic, color: CbColors.purpleLight, size: 18),
                    SizedBox(width: 6),
                    Text(
                      'Active Sponsored Gigs',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () => onNavigateToTab?.call(2), // switch to Sponsorships tab
                  child: const Text(
                    'View All',
                    style: TextStyle(
                      color: CbColors.purpleLight,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: CbSpacing.s2),
          ActivePerformancesCarousel(
            performances: performances,
          ),

          const SizedBox(height: CbSpacing.s6),

          // Quick Action Shortcuts Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
            child: Container(
              padding: const EdgeInsets.all(CbSpacing.s3),
              decoration: BoxDecoration(
                color: CbColors.surface1,
                borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
                border: Border.all(color: const Color(0x14FFFFFF)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _buildShortcutButton(
                      icon: Icons.person_search,
                      label: 'Discover Talent',
                      onTap: () => onNavigateToTab?.call(1),
                    ),
                  ),
                  Container(width: 1, height: 32, color: const Color(0x1AFFFFFF)),
                  Expanded(
                    child: _buildShortcutButton(
                      icon: Icons.assignment_turned_in_outlined,
                      label: 'Deals Pipeline',
                      onTap: () => onNavigateToTab?.call(2),
                    ),
                  ),
                  Container(width: 1, height: 32, color: const Color(0x1AFFFFFF)),
                  Expanded(
                    child: _buildShortcutButton(
                      icon: Icons.forum_outlined,
                      label: 'Direct Inbox',
                      badgeCount: sponsorState.totalUnreadMessages,
                      onTap: () => onNavigateToTab?.call(3),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: CbSpacing.s6),

          // 3. Recent Applicant Requests Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.inbox_outlined, color: CbColors.heartOrange, size: 18),
                    const SizedBox(width: 6),
                    const Text(
                      'Pending Requests',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
                      decoration: BoxDecoration(
                        color: CbColors.heartOrange.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                        border: Border.all(color: const Color(0x66FB923C)),
                      ),
                      child: Text(
                        '${pendingRequests.length}',
                        style: const TextStyle(
                          color: CbColors.heartOrange,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () => onNavigateToTab?.call(2),
                  child: const Text(
                    'Review All',
                    style: TextStyle(
                      color: CbColors.purpleLight,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: CbSpacing.s2),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
            child: RecentRequestsList(
              requests: pendingRequests,
              onAccept: (app) {
                notifier.acceptApplication(app.id);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    backgroundColor: CbColors.liveGreen,
                    content: Text('Accepted sponsorship for ${app.talent.name}!'),
                  ),
                );
              },
              onCounterOffer: (app, counterCents, note) {
                notifier.counterOfferApplication(app.id, counterCents, note);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    backgroundColor: CbColors.purpleMain,
                    content: Text(
                      'Counter-offer sent for ${formatCurrencyCents(counterCents)} to ${app.talent.name}.',
                    ),
                  ),
                );
              },
              onDecline: (app, reason) {
                notifier.declineApplication(app.id);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    backgroundColor: CbColors.surface2,
                    content: Text('Declined proposal from ${app.talent.name}.'),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShortcutButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    int? badgeCount,
  }) {
    return Semantics(
      button: true,
      label: label,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(icon, color: CbColors.purpleLight, size: 22),
                  if (badgeCount != null && badgeCount > 0)
                    Positioned(
                      right: -6,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: CbColors.errorRed,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          badgeCount.toString(),
                          style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openBudgetDetails(BuildContext context, SponsorOrganization org) {
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
                  const Text(
                    'Budget & Payout Analytics',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const SizedBox(height: CbSpacing.s3),
              Text(
                'Allocated: ${formatCurrencyCents(org.allocatedBudgetCents)} · Spent: ${formatCurrencyCents(org.spentBudgetCents)} · Remaining: ${formatCurrencyCents(org.remainingBudgetCents)}',
                style: const TextStyle(color: CbColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: CbSpacing.s4),
              const Text(
                'Financial Policies',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: CbSpacing.s2),
              const Text(
                '• All payments adhere to integer cent accounting.\n• Platform escrow releases 50% upfront on signed agreement and 50% upon verified gig completion.\n• Corporate invoices available for instant download in Profile.',
                style: TextStyle(color: CbColors.textMuted, fontSize: 12, height: 1.5),
              ),
              const SizedBox(height: CbSpacing.s5),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  style: FilledButton.styleFrom(
                    backgroundColor: CbColors.purpleMain,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    ),
                  ),
                  child: const Text('Done'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
