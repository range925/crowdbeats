// Crowdbeats V2 — Production Band Mobile Dashboard (Phase 3)
// Band-specific metrics (Treasury, Personal Split Allocation), role badges, split approvals.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../state/creator_context_state.dart';
import '../../components/components.dart';
import '../../theme/cb_colors.dart';
import 'widgets/dashboard_kyc_banner.dart';
import 'widgets/dashboard_action_items_card.dart';
import 'widgets/dashboard_next_show_card.dart';
import 'widgets/dashboard_quick_actions.dart';
import 'widgets/dashboard_activity_feed.dart';
import '../band/band_management_screen.dart';
import '../band/band_split_editor_screen.dart';
import '../band/band_split_voting_modal.dart';
import '../band/band_treasury_screen.dart';
import '../analytics/creator_analytics_screen.dart';

class BandMobileDashboard extends ConsumerStatefulWidget {
  const BandMobileDashboard({super.key});

  @override
  ConsumerState<BandMobileDashboard> createState() => _BandMobileDashboardState();
}

class _BandMobileDashboardState extends ConsumerState<BandMobileDashboard> {
  Future<void> _handleRefresh() async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
  }

  @override
  Widget build(BuildContext context) {
    final contextState = ref.watch(creatorContextProvider);
    final contextNotifier = ref.read(creatorContextProvider.notifier);
    final isLive = contextState.activeContext.hasActiveLiveSession;

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: RefreshIndicator(
        onRefresh: _handleRefresh,
        color: CbColors.tealGas,
        backgroundColor: CbColors.surfaceCard,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // 1. Band Context Banner with Member Role
            CbGlassCard(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0x2203DAC6),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(Icons.groups, color: CbColors.tealGas, size: 18),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          contextState.activeContext.name,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        Text(
                          'Your Role: ${contextState.activeContext.role} (40% Split)',
                          style: const TextStyle(color: CbColors.textSecondary, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0x228B5CF6),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('BAND V2', style: TextStyle(color: CbColors.purpleLight, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // 2. Stripe Connect KYC Warning Banner
            DashboardKycBanner(
              kycStatus: 'verified',
              onSetupPayouts: () {},
            ),

            // 3. Live Check-In Hero Card
            CbLiveHeroBanner(
              isLive: isLive,
              venueName: isLive ? 'The Casbah (San Diego, CA)' : null,
              listenerCount: isLive ? 86 : 0,
              onPrimaryAction: () {
                if (isLive) {
                  // Present Band QR
                } else {
                  contextNotifier.setLiveStatus(true);
                }
              },
              onSecondaryAction: isLive
                  ? () {
                      contextNotifier.setLiveStatus(false);
                    }
                  : null,
            ),
            const SizedBox(height: 16),

            // 4. Calm Band Financial Metrics Grid
            const Row(
              children: [
                Expanded(
                  child: CbMetricCard(
                    title: 'BAND TREASURY',
                    value: r'$1,850.00',
                    timeframe: 'Total Band Funds',
                    definition: 'Total settled ledger balance across all band live performances and campaigns.',
                    icon: Icons.account_balance,
                    accentColor: CbColors.tealGas,
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: CbMetricCard(
                    title: 'YOUR SPLIT (40%)',
                    value: r'$740.00',
                    timeframe: 'Available to withdraw',
                    definition: 'Your personal 40% allocation ready for individual withdrawal.',
                    icon: Icons.pie_chart,
                    accentColor: CbColors.purpleLight,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Row(
              children: [
                Expanded(
                  child: CbMetricCard(
                    title: 'BAND TIPS (30D)',
                    value: r'$620.00',
                    timeframe: 'Across 4 shows',
                    definition: 'Gross tips received by the band over the last 30 calendar days.',
                    icon: Icons.volunteer_activism,
                    accentColor: CbColors.statusLive,
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: CbMetricCard(
                    title: 'TOUR BACKERS',
                    value: '112',
                    timeframe: 'West Coast Tour',
                    definition: 'Supporters contributing to the band tour crowdfunding campaign.',
                    icon: Icons.rocket_launch,
                    accentColor: CbColors.stitchMagenta,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // 5. Band Governance Action Items
            DashboardActionItemsCard(
              items: [
                DashboardActionItem(
                  id: 'act_split_approval',
                  title: 'Split Modification Approval Required',
                  subtitle: 'David N. proposed updating split: 40% / 30% / 30%',
                  icon: Icons.how_to_vote_outlined,
                  badgeText: 'VOTE',
                  onTap: () => BandSplitVotingModal.show(context),
                ),
                DashboardActionItem(
                  id: 'act_band_analytics',
                  title: 'Band Performance & Venue Analytics',
                  subtitle: 'Multi-venue tipping velocity, audience reach & 4-way splits',
                  icon: Icons.bar_chart_outlined,
                  badgeText: 'GROWTH',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => CreatorAnalyticsScreen(
                        isBand: true,
                        entityId: contextState.activeContext.id,
                        entityName: contextState.activeContext.name,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // 6. Next Performance Card
            DashboardNextShowCard(
              venueName: 'The Casbah',
              cityState: 'San Diego, CA',
              startTime: '9:30 PM Friday',
              countdownText: 'Friday night',
              onCheckInNow: () {
                contextNotifier.setLiveStatus(true);
              },
            ),

            // 7. Band Quick Action Grid
            DashboardQuickActions(
              actions: [
                QuickActionItem(
                  label: 'Check In Band',
                  icon: Icons.location_on,
                  onTap: () => contextNotifier.setLiveStatus(true),
                ),
                QuickActionItem(
                  label: 'Analytics',
                  icon: Icons.bar_chart_outlined,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => CreatorAnalyticsScreen(
                        isBand: true,
                        entityId: contextState.activeContext.id,
                        entityName: contextState.activeContext.name,
                      ),
                    ),
                  ),
                ),
                QuickActionItem(
                  label: 'Treasury',
                  icon: Icons.account_balance,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const BandTreasuryScreen()),
                  ),
                ),
                QuickActionItem(
                  label: 'Splits',
                  icon: Icons.pie_chart,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const BandSplitEditorScreen()),
                  ),
                ),
                QuickActionItem(
                  label: 'Members',
                  icon: Icons.group,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const BandManagementScreen()),
                  ),
                ),
              ],
            ),

            // 8. Recent Activity Feed
            const DashboardActivityFeed(
              events: [
                DashboardActivityEvent(
                  id: 'be1',
                  title: 'Band Tip at Belly Up Tavern',
                  subtitle: 'Fan contributed to band pot',
                  timeAgo: '4h ago',
                  amountText: r'+$40.00',
                  icon: Icons.volunteer_activism,
                ),
                DashboardActivityEvent(
                  id: 'be2',
                  title: 'Split Payout Distributed',
                  subtitle: 'Automatic distribution for Saturday session',
                  timeAgo: '1d ago',
                  amountText: r'-$300.00',
                  icon: Icons.pie_chart,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
