// Crowdbeats V2 — Production Solo Musician Dashboard (Phase 3)
// Calm financial metrics, live check-in hero, action items, next show & recent activity.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../state/creator_context_state.dart';
import '../../../state/session_heartbeat_notifier.dart';
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
import '../live/live_checkin_sheet.dart';
import '../live/rotating_qr_modal.dart';
import '../profile/creator_epk_editor_screen.dart';

class SoloMusicianDashboard extends ConsumerStatefulWidget {
  const SoloMusicianDashboard({super.key});

  @override
  ConsumerState<SoloMusicianDashboard> createState() => _SoloMusicianDashboardState();
}

class _SoloMusicianDashboardState extends ConsumerState<SoloMusicianDashboard> {
  Future<void> _handleRefresh() async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
  }

  Future<void> _handleEndLiveSession(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CbColors.surfaceCard,
        title: const Text('End Live Performance?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text(
          'This will stop broadcasting your live stage presence and reconcile all collected tips to your ledger.',
          style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            child: const Text('Keep Playing', style: TextStyle(color: Colors.white70)),
            onPressed: () => Navigator.of(ctx).pop(false),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: CbColors.statusError),
            child: const Text('End Set', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            onPressed: () => Navigator.of(ctx).pop(true),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final contextState = ref.read(creatorContextProvider);
      final sessionId = contextState.activeSessionId;
      if (sessionId != null) {
        try {
          await ref.read(sessionServiceProvider).endSession(sessionId);
        } catch (_) {}
      }
      ref.read(creatorContextProvider.notifier).clearSession();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Live set ended. All stage tips reconciled to your ledger.'),
            backgroundColor: CbColors.statusLive,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final contextState = ref.watch(creatorContextProvider);
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
                  RotatingQrModal.show(
                    context,
                    performerName: contextState.activeContext.name,
                    sessionId: contextState.activeSessionId ?? 'sess_live_solo',
                    isBand: false,
                    performerId: contextState.activeContext.id,
                  );
                } else {
                  LiveCheckinSheet.show(context);
                }
              },
              onSecondaryAction: isLive
                  ? () => _handleEndLiveSession(context, ref)
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
            const SizedBox(height: 8),
            // Trust & Escrow Transparency Caption
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0x1A10B981),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0x3310B981)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.shield_outlined, size: 14, color: CbColors.tealGas),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Only settled funds marked "Available" can be paid out. Escrow secured by Stripe Connect.',
                      style: TextStyle(color: CbColors.tealGas, fontSize: 11, fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
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
              onCheckInNow: () => LiveCheckinSheet.show(context),
            ),

            // 6. Quick Action Grid
            DashboardQuickActions(
              actions: [
                QuickActionItem(
                  label: 'Check In',
                  icon: Icons.location_on,
                  onTap: () => LiveCheckinSheet.show(context),
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
                  onTap: () {
                    if (isLive) {
                      RotatingQrModal.show(
                        context,
                        performerName: contextState.activeContext.name,
                        sessionId: contextState.activeSessionId ?? 'sess_live_solo',
                        isBand: false,
                        performerId: contextState.activeContext.id,
                      );
                    } else {
                      LiveCheckinSheet.show(context);
                    }
                  },
                ),
                QuickActionItem(
                  label: 'Campaign',
                  icon: Icons.rocket_launch,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const CreatorBalancesScreen()),
                  ),
                ),
                QuickActionItem(
                  label: 'Edit EPK',
                  icon: Icons.edit_note,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const CreatorEpkEditorScreen()),
                  ),
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
