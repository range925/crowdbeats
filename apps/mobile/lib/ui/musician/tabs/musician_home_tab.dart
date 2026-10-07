// Crowdbeats V2 — Musician Home Tab (Phase 7)
//
// Overview tab: KYC banner, earnings today, tip stream, quick actions.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../state/auth_state.dart';
import '../../../state/musician_state.dart';
import '../../../firebase/musician_service.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';

class MusicianHomeTab extends ConsumerStatefulWidget {
  const MusicianHomeTab({super.key});

  @override
  ConsumerState<MusicianHomeTab> createState() => _MusicianHomeTabState();
}

class _MusicianHomeTabState extends ConsumerState<MusicianHomeTab> {
  ConnectStatus? _connectStatus;

  @override
  void initState() {
    super.initState();
    _fetchConnectStatus();
  }

  Future<void> _fetchConnectStatus() async {
    try {
      final s = await MusicianService.instance.getConnectStatus();
      if (mounted) setState(() => _connectStatus = s);
    } on Exception {
      // Non-critical — banner not shown
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final session = ref.watch(musicianSessionProvider);
    final uid = auth.uid ?? '';

    return Scaffold(
      backgroundColor: CbColors.surfaceBase,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await _fetchConnectStatus();
          },
          child: CustomScrollView(
            slivers: [
              // Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(CbSpacing.s6, CbSpacing.s6, CbSpacing.s6, 0),
                  child: Row(children: [
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Hey, ${auth.displayName?.split(' ').first ?? 'Musician'} 👋',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                        Text(
                          session.isActive ? '🔴 Live session active' : 'Ready to perform?',
                          style: TextStyle(color: session.isActive ? CbColors.statusLive : CbColors.textSecondary),
                        ),
                      ]),
                    ),
                  ]),
                ),
              ),

              // KYC banner
              if (_connectStatus != null && _connectStatus!.requiresAction)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(CbSpacing.s6, CbSpacing.s4, CbSpacing.s6, 0),
                    child: _KycBanner(),
                  ),
                ),

              // Today's earnings (from live session state if active, else placeholder)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(CbSpacing.s6, CbSpacing.s5, CbSpacing.s6, 0),
                  child: _EarningsCard(session: session),
                ),
              ),

              // Campaigns quick view
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(CbSpacing.s6, CbSpacing.s5, CbSpacing.s6, 0),
                  child: uid.isNotEmpty
                      ? _CampaignsPreview(uid: uid)
                      : const SizedBox.shrink(),
                ),
              ),

              // Recent tips (last session or active session)
              if (session.liveTips.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(CbSpacing.s6, CbSpacing.s5, CbSpacing.s6, 0),
                    child: _RecentTipsCard(tips: session.liveTips.take(5).toList()),
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _KycBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(CbSpacing.s4),
        decoration: BoxDecoration(
          color: CbColors.statusWarning.withAlpha(20),
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          border: Border.all(color: CbColors.statusWarning.withAlpha(80)),
        ),
        child: Row(children: [
          const Icon(Icons.warning_amber_rounded, color: CbColors.statusWarning),
          const SizedBox(width: CbSpacing.s3),
          const Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Set up payouts', style: TextStyle(fontWeight: FontWeight.w700)),
              Text('Connect your bank account to receive tips.', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
            ]),
          ),
          TextButton(
            onPressed: () {
              // Navigate to profile tab which shows KYC CTA
            },
            child: const Text('Set up'),
          ),
        ]),
      );
}

class _EarningsCard extends StatelessWidget {
  const _EarningsCard({required this.session});

  final MusicianSessionState session;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(CbSpacing.s5),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [CbColors.accentPrimary.withAlpha(30), CbColors.accentSecondary.withAlpha(15)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
          border: Border.all(color: CbColors.accentPrimary.withAlpha(50)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(
            session.isActive ? 'Session earnings' : 'Last session',
            style: const TextStyle(color: CbColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5),
          ),
          const SizedBox(height: CbSpacing.s2),
          Text(
            '\$${(session.totalTipsCents / 100).toStringAsFixed(2)}',
            style: const TextStyle(color: CbColors.textPrimary, fontSize: 32, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: CbSpacing.s1),
          Text(
            '${session.uniqueTippers} tippers',
            style: const TextStyle(color: CbColors.textSecondary, fontSize: 13),
          ),
        ]),
      );
}

class _CampaignsPreview extends ConsumerWidget {
  const _CampaignsPreview({required this.uid});

  final String uid;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final campaignsAsync = ref.watch(myCampaignsProvider(uid));
    return campaignsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (campaigns) {
        final active = campaigns.where((c) => c.status == 'active').toList();
        if (active.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Active Campaigns', style: TextStyle(color: CbColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
            const SizedBox(height: CbSpacing.s3),
            ...active.take(2).map((c) => _CampaignMini(campaign: c)),
          ],
        );
      },
    );
  }
}

class _CampaignMini extends StatelessWidget {
  const _CampaignMini({required this.campaign});

  final Campaign campaign;

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(CbSpacing.s4),
        decoration: BoxDecoration(
          color: CbColors.surfaceCard,
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          border: Border.all(color: CbColors.borderSubtle),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(campaign.title, style: const TextStyle(fontWeight: FontWeight.w600))),
            Text('${campaign.daysRemaining}d left', style: const TextStyle(color: CbColors.textTertiary, fontSize: 12)),
          ]),
          const SizedBox(height: CbSpacing.s2),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: campaign.progressFraction,
              backgroundColor: CbColors.borderSubtle,
              valueColor: const AlwaysStoppedAnimation<Color>(CbColors.accentPrimary),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: CbSpacing.s2),
          Text(
            '\$${(campaign.pledgedCents / 100).toStringAsFixed(0)} of \$${(campaign.goalCents / 100).toStringAsFixed(0)} · ${campaign.backerCount} backers',
            style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
          ),
        ]),
      );
}

class _RecentTipsCard extends StatelessWidget {
  const _RecentTipsCard({required this.tips});

  final List<LiveTip> tips;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Recent tips', style: TextStyle(color: CbColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
          const SizedBox(height: CbSpacing.s3),
          Container(
            decoration: BoxDecoration(
              color: CbColors.surfaceCard,
              borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
              border: Border.all(color: CbColors.borderSubtle),
            ),
            child: Column(
              children: tips.asMap().entries.map((e) => Column(children: [
                ListTile(
                  leading: Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(color: CbColors.accentPrimary.withAlpha(25), shape: BoxShape.circle),
                    child: const Icon(Icons.favorite, size: 16, color: CbColors.accentPrimary),
                  ),
                  title: Text(e.value.isAnonymous ? 'Anonymous' : (e.value.displayName ?? 'Fan')),
                  subtitle: e.value.message != null ? Text(e.value.message!, maxLines: 1, overflow: TextOverflow.ellipsis) : null,
                  trailing: Text('\$${(e.value.amountCents / 100).toStringAsFixed(2)}', style: const TextStyle(color: CbColors.accentPrimary, fontWeight: FontWeight.bold)),
                ),
                if (e.key < tips.length - 1) const Divider(height: 1, color: CbColors.borderSubtle),
              ])).toList(),
            ),
          ),
        ],
      );
}
