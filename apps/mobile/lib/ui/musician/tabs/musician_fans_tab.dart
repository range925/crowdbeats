// Crowdbeats V2 — Musician Fans Tab (Phase 7)
//
// Shows follower count, recent new followers, and top tippers (last 30 days).
// Tippers with isAnonymous=true shown as "Anonymous".

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../state/auth_state.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';

// ── Providers ─────────────────────────────────────────────────────────────────

/// Stream of followers for this artist.
final followersStreamProvider = StreamProvider.autoDispose.family<List<Map<String, dynamic>>, String>(
  (ref, uid) => FirebaseFirestore.instance
      .collection('follows')
      .where('artistId', isEqualTo: uid)
      .orderBy('followedAt', descending: true)
      .limit(50)
      .snapshots()
      .map((snap) => snap.docs.map((d) => d.data()).toList()),
);

/// Stream of recent tips received (last 30d, top tippers).
final recentTipsReceivedProvider = StreamProvider.autoDispose.family<List<Map<String, dynamic>>, String>(
  (ref, uid) {
    final cutoff = Timestamp.fromDate(DateTime.now().subtract(const Duration(days: 30)));
    return FirebaseFirestore.instance
        .collection('tips')
        .where('recipientId', isEqualTo: uid)
        .where('status', isEqualTo: 'succeeded')
        .where('createdAt', isGreaterThanOrEqualTo: cutoff)
        .orderBy('createdAt', descending: true)
        .limit(100)
        .snapshots()
        .map((snap) => snap.docs.map((d) => d.data()).toList());
  },
);

// ── Main widget ───────────────────────────────────────────────────────────────

class MusicianFansTab extends ConsumerWidget {
  const MusicianFansTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    final uid = auth.uid ?? '';

    if (uid.isEmpty) return const Center(child: CircularProgressIndicator());

    final followersAsync = ref.watch(followersStreamProvider(uid));
    final tipsAsync = ref.watch(recentTipsReceivedProvider(uid));

    return Scaffold(
      backgroundColor: CbColors.surfaceBase,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(CbSpacing.s6, CbSpacing.s6, CbSpacing.s6, 0),
                child: Text('Fans', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
              ),
            ),

            // Follower count card
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(CbSpacing.s5, CbSpacing.s5, CbSpacing.s5, 0),
                child: followersAsync.when(
                  loading: () => const _StatCard(icon: Icons.people, value: '—', label: 'Followers'),
                  error: (_, _) => const _StatCard(icon: Icons.people, value: '—', label: 'Followers'),
                  data: (followers) => _StatCard(icon: Icons.people, value: '${followers.length}', label: 'Followers'),
                ),
              ),
            ),

            // Recent followers
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(CbSpacing.s5, CbSpacing.s6, CbSpacing.s5, 0),
                child: Text('Recent Followers', style: TextStyle(color: CbColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
              ),
            ),
            followersAsync.when(
              loading: () => const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator(strokeWidth: 2))),
              error: (_, _) => const SliverToBoxAdapter(child: Center(child: Text('Failed to load followers', style: TextStyle(color: CbColors.statusError)))),
              data: (followers) => followers.isEmpty
                  ? const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(CbSpacing.s5),
                        child: Text('No followers yet — go live to get discovered!', style: TextStyle(color: CbColors.textTertiary)),
                      ),
                    )
                  : SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => _FollowerRow(data: followers[i]),
                        childCount: followers.take(20).length,
                      ),
                    ),
            ),

            // Top tippers
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(CbSpacing.s5, CbSpacing.s6, CbSpacing.s5, 0),
                child: Text('Top Tippers (Last 30 Days)', style: TextStyle(color: CbColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
              ),
            ),
            tipsAsync.when(
              loading: () => const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator(strokeWidth: 2))),
              error: (_, _) => const SliverToBoxAdapter(child: SizedBox.shrink()),
              data: (tips) {
                if (tips.isEmpty) {
                  return const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(CbSpacing.s5),
                      child: Text('No tips yet this month.', style: TextStyle(color: CbColors.textTertiary)),
                    ),
                  );
                }
                // Aggregate by fanUid (anonymous tips grouped as "Anonymous")
                final aggregates = <String, _FanTotal>{};
                for (final tip in tips) {
                  final isAnon = tip['isAnonymous'] as bool? ?? false;
                  final key = isAnon ? '__anon__' : (tip['fanUid'] as String? ?? '__unknown__');
                  final name = isAnon ? 'Anonymous' : (tip['fanDisplayName'] as String? ?? 'Fan');
                  final cents = (tip['amountCents'] as num? ?? 0).toInt();
                  aggregates[key] = _FanTotal(
                    name: name,
                    totalCents: (aggregates[key]?.totalCents ?? 0) + cents,
                    tipCount: (aggregates[key]?.tipCount ?? 0) + 1,
                    isAnonymous: isAnon,
                  );
                }
                final sorted = aggregates.values.toList()
                  ..sort((a, b) => b.totalCents - a.totalCents);
                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) {
                      final t = sorted[i];
                      return _TipperRow(rank: i + 1, data: t);
                    },
                    childCount: sorted.take(10).length,
                  ),
                );
              },
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }
}

// ── Helper class ──────────────────────────────────────────────────────────────

class _FanTotal {
  const _FanTotal({
    required this.name,
    required this.totalCents,
    required this.tipCount,
    required this.isAnonymous,
  });

  final String name;
  final int totalCents;
  final int tipCount;
  final bool isAnonymous;
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  const _StatCard({required this.icon, required this.value, required this.label});

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(CbSpacing.s5),
        decoration: BoxDecoration(
          color: CbColors.surfaceCard,
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          border: Border.all(color: CbColors.borderSubtle),
        ),
        child: Row(children: [
          Icon(icon, color: CbColors.accentPrimary, size: 28),
          const SizedBox(width: CbSpacing.s4),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            Text(label, style: const TextStyle(color: CbColors.textSecondary, fontSize: 13)),
          ]),
        ]),
      );
}

class _FollowerRow extends StatelessWidget {
  const _FollowerRow({required this.data});

  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final name = data['fanDisplayName'] as String? ?? 'Fan';
    final ts = data['followedAt'] as Timestamp?;
    final when = ts != null ? _relativeTime(ts.toDate()) : '';
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: CbColors.accentPrimary.withAlpha(30),
        child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'F', style: const TextStyle(color: CbColors.accentPrimary, fontWeight: FontWeight.bold)),
      ),
      title: Text(name),
      trailing: Text(when, style: const TextStyle(color: CbColors.textTertiary, fontSize: 12)),
    );
  }

  String _relativeTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inDays >= 1) return '${diff.inDays}d ago';
    if (diff.inHours >= 1) return '${diff.inHours}h ago';
    return '${diff.inMinutes}m ago';
  }
}

class _TipperRow extends StatelessWidget {
  const _TipperRow({required this.rank, required this.data});

  final int rank;
  final _FanTotal data;

  @override
  Widget build(BuildContext context) => ListTile(
        leading: Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color: rank <= 3 ? CbColors.accentPrimary.withAlpha(30) : CbColors.surfaceCard,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              '#$rank',
              style: TextStyle(
                color: rank <= 3 ? CbColors.accentPrimary : CbColors.textSecondary,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ),
        title: Text(data.name, style: TextStyle(fontWeight: data.isAnonymous ? FontWeight.normal : FontWeight.w600)),
        subtitle: Text('${data.tipCount} tip${data.tipCount == 1 ? '' : 's'}'),
        trailing: Text(
          '\$${(data.totalCents / 100).toStringAsFixed(2)}',
          style: const TextStyle(color: CbColors.accentPrimary, fontWeight: FontWeight.bold),
        ),
      );
}
