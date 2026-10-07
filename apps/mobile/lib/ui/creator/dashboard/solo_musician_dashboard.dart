// Crowdbeats V2 — Production Solo Musician Dashboard (Phase 3)
// Calm financial metrics, live check-in hero, action items, next show & recent activity.

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
import '../finance/stripe_connect_kyc_screen.dart';
import '../finance/creator_balances_screen.dart';
import '../analytics/creator_analytics_screen.dart';

class SoloMusicianDashboard extends ConsumerStatefulWidget {
  const SoloMusicianDashboard({super.key});

  @override
  ConsumerState<SoloMusicianDashboard> createState() => _SoloMusicianDashboardState();
}

class _SoloMusicianDashboardState extends ConsumerState<SoloMusicianDashboard> {
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
        color: CbColors.purpleLight,
        backgroundColor: CbColors.surfaceCard,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // 1. Stripe Connect KYC Warning Banner
            DashboardKycBanner(
              kycStatus: 'pending',
              onSetupPayouts: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const StripeConnectKycScreen()),
              ),
            ),

            // 2. Context-Aware Live Status Hero Card
            CbLiveHeroBanner(
              isLive: isLive,
              venueName: isLive ? 'Sunset Lounge (San Diego, CA)' : null,
              listenerCount: isLive ? 42 : 0,
              onPrimaryAction: () {
                if (isLive) {
                  // Present QR Modal
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

            // 3. Calm Financial Metrics Snapshot Grid (2x2)
            const Row(
              children: [
                Expanded(
                  child: CbMetricCard(
                    title: 'AVAILABLE BALANCE',
                    value: r'$480.00',
                    timeframe: 'Ready for payout',
                    definition: 'Total settled funds available for instant withdrawal to your verified Stripe bank account.',
                    icon: Icons.account_balance_wallet,
                    accentColor: CbColors.purpleLight,
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: CbMetricCard(
                    title: 'TODAY\'S TIPS',
                    value: r'$125.00',
                    timeframe: 'Tonight',
                    definition: 'Gross tips received across active stage performances today.',
                    icon: Icons.volunteer_activism,
                    accentColor: CbColors.tealGas,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Row(
              children: [
                Expanded(
                  child: CbMetricCard(
                    title: 'CAMPAIGN BACKERS',
                    value: '28',
                    timeframe: 'Active Debut Album',
                    definition: 'Total unique backers contributing to your active album crowdfunding campaign.',
                    icon: Icons.rocket_launch,
                    accentColor: CbColors.stitchMagenta,
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: CbMetricCard(
                    title: 'FOLLOWERS',
                    value: '342',
                    timeframe: '+14 this week',
                    definition: 'Fans following your live stage performance schedule.',
                    icon: Icons.favorite,
                    accentColor: CbColors.heartOrange,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // 4. Action Items Requiring Attention
            DashboardActionItemsCard(
              items: [
                DashboardActionItem(
                  id: 'act_payout',
                  title: r'Withdraw Available Funds ($480.00)',
                  subtitle: '1-click withdrawal to verified Chase checking ****4821',
                  icon: Icons.savings_outlined,
                  badgeText: 'READY',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const CreatorBalancesScreen()),
                  ),
                ),
                DashboardActionItem(
                  id: 'act_analytics',
                  title: 'View Performance & Venue Analytics',
                  subtitle: 'Explore tipping velocity, venue index & gig settlements',
                  icon: Icons.bar_chart_outlined,
                  badgeText: 'LIVE',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => CreatorAnalyticsScreen(
                        isBand: false,
                        entityId: contextState.activeContext.id,
                        entityName: contextState.activeContext.name,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // 5. Next Performance Card
            DashboardNextShowCard(
              venueName: 'Sunset Lounge',
              cityState: 'San Diego, CA',
              startTime: '8:00 PM Tonight',
              countdownText: 'Starts in 45 min',
              onCheckInNow: () {
                contextNotifier.setLiveStatus(true);
              },
            ),

            // 6. Quick Action Grid
            DashboardQuickActions(
              actions: [
                QuickActionItem(
                  label: 'Check In',
                  icon: Icons.location_on,
                  onTap: () => contextNotifier.setLiveStatus(true),
                ),
                QuickActionItem(
                  label: 'Analytics',
                  icon: Icons.bar_chart_outlined,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => CreatorAnalyticsScreen(
                        isBand: false,
                        entityId: contextState.activeContext.id,
                        entityName: contextState.activeContext.name,
                      ),
                    ),
                  ),
                ),
                QuickActionItem(
                  label: 'Present QR',
                  icon: Icons.qr_code_2,
                  onTap: () {},
                ),
                QuickActionItem(
                  label: 'Campaign',
                  icon: Icons.rocket_launch,
                  onTap: () {},
                ),
                QuickActionItem(
                  label: 'Edit EPK',
                  icon: Icons.edit_note,
                  onTap: () {},
                ),
              ],
            ),

            // 7. Recent Activity Feed
            const DashboardActivityFeed(
              events: [
                DashboardActivityEvent(
                  id: 'e1',
                  title: 'Tip from Sarah K.',
                  subtitle: '"Amazing guitar solo on the encore!"',
                  timeAgo: '12m ago',
                  amountText: r'+$25.00',
                  icon: Icons.volunteer_activism,
                ),
                DashboardActivityEvent(
                  id: 'e2',
                  title: 'New Backer on Album Campaign',
                  subtitle: 'Marcus T. selected "Signed Vinyl Tier"',
                  timeAgo: '1h ago',
                  amountText: r'+$50.00',
                  icon: Icons.rocket_launch,
                ),
                DashboardActivityEvent(
                  id: 'e3',
                  title: 'Tip from Anonymous Fan',
                  subtitle: 'Live at Sunset Lounge',
                  timeAgo: '2h ago',
                  amountText: r'+$10.00',
                  icon: Icons.volunteer_activism,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
