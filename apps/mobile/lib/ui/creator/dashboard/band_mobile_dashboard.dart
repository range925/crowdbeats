// Crowdbeats V2 — Production Band Mobile Dashboard (Phase 3)
// Band-specific metrics (Treasury, Personal Split Allocation), role badges, split approvals.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../state/creator_context_state.dart';
import '../../components/components.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
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
import '../live/live_checkin_sheet.dart';
import '../live/rotating_qr_modal.dart';

class BandMobileDashboard extends ConsumerStatefulWidget {
  const BandMobileDashboard({super.key});

  @override
  ConsumerState<BandMobileDashboard> createState() => _BandMobileDashboardState();
}

class _BandMobileDashboardState extends ConsumerState<BandMobileDashboard> {
  Future<void> _handleRefresh() async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
  }

  Future<void> _handleEndLiveSession() async {
    final contextState = ref.read(creatorContextProvider);
    final isAuthorized = contextState.activeContext.role == 'BAND_FOUNDER' ||
        contextState.activeContext.role == 'BAND_ADMIN';
    if (!isAuthorized) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Only the Band Founder or Admin can end a live band session.'),
          backgroundColor: CbColors.statusError,
        ),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CbColors.surfaceCard,
        title: const Text('End Live Band Performance?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text(
          'This will stop broadcasting The Midnight Echoes on the live map and reconcile all collected tips to the band treasury.',
          style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Keep Playing', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: CbColors.statusError),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('End Set', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      ref.read(creatorContextProvider.notifier).clearSession();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Band live session ended. Tips reconciled to Band Treasury.'),
          backgroundColor: CbColors.statusLive,
        ),
      );
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
        color: CbColors.tealGas,
        backgroundColor: CbColors.surfaceCard,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // 1. Explicit Personal Identity vs Band Identity Banner
            CbGlassCard(
              padding: const EdgeInsets.all(14),
              borderColor: const Color(0x3303DAC6),
              backgroundColor: const Color(0x1103DAC6),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: CbColors.purpleDim,
                    child: const Text('EC', style: TextStyle(color: CbColors.purpleLight, fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Text(
                              'PERSONAL: Elena Cruz',
                              style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                            ),
                            SizedBox(width: 6),
                            Icon(Icons.lock_person, size: 12, color: CbColors.textMuted),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          contextState.activeContext.name,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Your Role: ${contextState.activeContext.role} (40% Split)',
                          style: const TextStyle(color: CbColors.textSecondary, fontSize: 11),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: contextState.activeContext.role == 'BAND_FOUNDER'
                                    ? const Color(0x3310B981)
                                    : const Color(0x338B5CF6),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                contextState.activeContext.role,
                                style: TextStyle(
                                  color: contextState.activeContext.role == 'BAND_FOUNDER' ? CbColors.statusLive : CbColors.purpleLight,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              '40% Active Split Allocation',
                              style: TextStyle(color: CbColors.tealGas, fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0x228B5CF6),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0x448B5CF6)),
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
                  RotatingQrModal.show(
                    context,
                    performerName: contextState.activeContext.name,
                    sessionId: contextState.activeSessionId ?? 'sess_midnight_live',
                    isBand: true,
                    performerId: contextState.activeContext.id,
                  );
                } else {
                  LiveCheckinSheet.show(context);
                }
              },
              onSecondaryAction: isLive ? _handleEndLiveSession : null,
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
            // Trust & Escrow Transparency Caption
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              child: Text(
                'Only settled funds marked "Available" can be paid out. Band treasury distributed according to unanimous split contract.',
                style: TextStyle(color: CbColors.textMuted, fontSize: 11, fontStyle: FontStyle.italic),
                textAlign: TextAlign.center,
              ),
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
              onCheckInNow: () => LiveCheckinSheet.show(context),
            ),

            // 7. Band Quick Action Grid
            DashboardQuickActions(
              actions: [
                QuickActionItem(
                  label: 'Check In Band',
                  icon: Icons.location_on,
                  onTap: () => LiveCheckinSheet.show(context),
                ),
                QuickActionItem(
                  label: 'Present QR',
                  icon: Icons.qr_code_2,
                  onTap: () => RotatingQrModal.show(
                    context,
                    performerName: contextState.activeContext.name,
                    sessionId: contextState.activeSessionId ?? 'sess_midnight_live',
                    isBand: true,
                    performerId: contextState.activeContext.id,
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
