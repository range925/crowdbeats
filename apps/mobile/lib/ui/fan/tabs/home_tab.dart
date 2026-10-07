// Crowdbeats V2 — Fan Home Dashboard (Stitch Screen 10)
// High-fidelity live music hub matching authoritative project 5326179813018056505.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../components/cb_live_badge.dart';
import '../../../state/tip_state.dart';
import '../../../state/auth_state.dart';
import '../tip/tip_flow_screen.dart';
import '../social_messaging_screen.dart';

class HomeTab extends ConsumerWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    final user = auth.user;
    final displayName = user?.displayName?.split(' ').first ?? 'Jordan';
    final uid = user?.uid ?? '';

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          color: CbColors.purpleMain,
          backgroundColor: CbColors.surface2,
          onRefresh: () async {
            await Future<void>.delayed(const Duration(milliseconds: 500));
          },
          child: CustomScrollView(
            slivers: [
              // Top Header (Avatar, Greeting, Notification Bell)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                sliver: SliverToBoxAdapter(
                  child: _buildHeader(context, displayName),
                ),
              ),

              // 3 Quick Action Cards
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: _buildQuickActionCards(context),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 24)),

              // Live Near You Carousel (Section 1)
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: _LiveNearYouSection(ref: ref),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 24)),

              // Upcoming Shows You Might Like (Section 2)
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: _buildUpcomingShowsSection(context),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 24)),

              // Recent Activity & Tips (Section 3)
              if (uid.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverToBoxAdapter(
                    child: _RecentTipsSection(fanUid: uid, ref: ref),
                  ),
                ),

              // Bottom padding so floating nav bar does not overlap content
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, String displayName) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            // User Avatar with Online Dot
            Stack(
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: CbColors.purpleLight, width: 1.5),
                    image: const DecorationImage(
                      image: NetworkImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Positioned(
                  bottom: 1,
                  right: 1,
                  child: Container(
                    width: 11,
                    height: 11,
                    decoration: BoxDecoration(
                      color: CbColors.liveGreen,
                      shape: BoxShape.circle,
                      border: Border.all(color: CbColors.bgApp, width: 2),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: CbColors.textPrimary,
                    ),
                    children: [
                      const TextSpan(text: 'Good evening, '),
                      TextSpan(
                        text: displayName,
                        style: const TextStyle(color: CbColors.purpleLight),
                      ),
                      const TextSpan(text: ' 👋'),
                    ],
                  ),
                ),
                const SizedBox(height: 2),
                const Row(
                  children: [
                    Icon(Icons.location_on, size: 12, color: CbColors.textMuted),
                    SizedBox(width: 3),
                    Text(
                      'San Diego, CA • 6 shows live near you',
                      style: TextStyle(fontSize: 12, color: CbColors.textSecondary),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        Row(
          children: [
            // Direct Messages Icon Button
            GestureDetector(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const SocialMessagingScreen(),
                  ),
                );
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: CbColors.surface2,
                  shape: BoxShape.circle,
                  border: Border.all(color: CbColors.borderSubtle),
                ),
                child: const Icon(Icons.chat_bubble_outline, color: Colors.white, size: 20),
              ),
            ),
            const SizedBox(width: 8),
            // Notification Bell
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: CbColors.surface2,
                shape: BoxShape.circle,
                border: Border.all(color: CbColors.borderSubtle),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  const Icon(Icons.notifications_none, color: Colors.white, size: 20),
                  Positioned(
                    top: 9,
                    right: 9,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: CbColors.purpleMain,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActionCards(BuildContext context) {
    return Row(
      children: [
        // Card 1: Nearby Live
        Expanded(
          child: _buildActionTile(
            icon: Icons.explore,
            iconColor: CbColors.purpleLight,
            title: 'Nearby Live',
            subtitle: '6 active shows',
            gradient: const LinearGradient(
              colors: [Color(0x337C3AED), Color(0x117C3AED)],
            ),
            onTap: () {
              // Nav handled by parent
            },
          ),
        ),
        const SizedBox(width: 8),
        // Card 2: Tip a Musician
        Expanded(
          child: _buildActionTile(
            icon: Icons.favorite,
            iconColor: Colors.white,
            title: 'Tip Musician',
            subtitle: 'Scan or instant',
            gradient: const LinearGradient(
              colors: [CbColors.purpleMain, Color(0xFF9333EA)],
            ),
            isPrimary: true,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const TipFlowScreen(
                    recipientId: 'artist_demo',
                    recipientName: 'Luna & The Waves',
                    recipientType: 'artist',
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(width: 8),
        // Card 3: Following
        Expanded(
          child: _buildActionTile(
            icon: Icons.people,
            iconColor: CbColors.heartOrange,
            title: 'Following',
            subtitle: '12 artists',
            gradient: const LinearGradient(
              colors: [Color(0x33FB923C), Color(0x11FB923C)],
            ),
            onTap: () {},
          ),
        ),
      ],
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required Gradient gradient,
    bool isPrimary = false,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: isPrimary ? null : CbColors.surface2,
          gradient: isPrimary ? gradient : null,
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          border: Border.all(
            color: isPrimary ? CbColors.purpleLight : CbColors.borderSubtle,
          ),
          boxShadow: isPrimary
              ? const [
                  BoxShadow(
                    color: CbColors.purpleGlow,
                    blurRadius: 12,
                    spreadRadius: -2,
                    offset: Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: iconColor, size: 20),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: TextStyle(
                color: isPrimary ? const Color(0xCCFFFFFF) : CbColors.textMuted,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUpcomingShowsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Upcoming Shows You Might Like',
              style: TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
            Icon(Icons.arrow_forward_ios, color: CbColors.textMuted, size: 12),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: CbColors.surface2,
            borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
            border: Border.all(color: CbColors.borderSubtle),
          ),
          child: Row(
            children: [
              // Date Box
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: CbColors.surface3,
                  borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  border: Border.all(color: CbColors.purpleMain.withAlpha(80)),
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('AUG', style: TextStyle(color: CbColors.purpleLight, fontSize: 10, fontWeight: FontWeight.bold)),
                    Text('28', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'The Midnight Echoes',
                      style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Belly Up Tavern • Solana Beach',
                      style: TextStyle(color: CbColors.textSecondary, fontSize: 11),
                    ),
                  ],
                ),
              ),
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: CbColors.purpleMain),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusFull)),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  minimumSize: const Size(0, 30),
                ),
                child: const Text('Remind', style: TextStyle(color: Colors.white, fontSize: 11)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Live Near You Carousel ───────────────────────────────────────────────────

class _LiveNearYouSection extends StatelessWidget {
  const _LiveNearYouSection({required this.ref});
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final sessionsAsync = ref.watch(activeSessionsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Row(
              children: [
                Text(
                  'Live Near You',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(width: 8),
                CbLiveBadge(label: '6 LIVE'),
              ],
            ),
            GestureDetector(
              onTap: () {},
              child: const Text(
                'See All (6) >',
                style: TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        sessionsAsync.when(
          loading: () => const _SkeletonCarousel(),
          error: (_, _) => _buildFallbackList(context),
          data: (sessions) {
            if (sessions.isEmpty) {
              return _buildFallbackList(context);
            }
            return SizedBox(
              height: 210,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: sessions.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (ctx, i) {
                  final s = sessions[i];
                  return _LivePerformerCard(
                    name: s['performerName'] as String? ?? 'Luna & The Waves',
                    genre: s['genre'] as String? ?? 'Indie Pop',
                    venue: s['venueName'] as String? ?? 'The Casbah • Main Stage',
                    distance: '0.4 mi away',
                    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
                    recipientId: s['performerId'] as String? ?? 'artist_demo',
                    sessionId: s['sessionId'] as String? ?? '',
                    recipientType: s['performerType'] as String? ?? 'artist',
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildFallbackList(BuildContext context) {
    return SizedBox(
      height: 210,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: const [
          _LivePerformerCard(
            name: 'Luna & The Waves',
            genre: 'Indie Pop',
            venue: 'The Casbah • Main Stage',
            distance: '0.4 mi away',
            imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
            recipientId: 'artist_demo_1',
            sessionId: 'session_1',
            recipientType: 'artist',
          ),
          SizedBox(width: 12),
          _LivePerformerCard(
            name: 'Velvet Horizon',
            genre: 'Alternative Rock',
            venue: 'Soda Bar • Stage A',
            distance: '0.9 mi away',
            imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
            recipientId: 'artist_demo_2',
            sessionId: 'session_2',
            recipientType: 'band',
          ),
        ],
      ),
    );
  }
}

class _LivePerformerCard extends StatelessWidget {
  const _LivePerformerCard({
    required this.name,
    required this.genre,
    required this.venue,
    required this.distance,
    required this.imageUrl,
    required this.recipientId,
    required this.sessionId,
    required this.recipientType,
  });

  final String name;
  final String genre;
  final String venue;
  final String distance;
  final String imageUrl;
  final String recipientId;
  final String sessionId;
  final String recipientType;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => TipFlowScreen(
              recipientId: recipientId,
              recipientName: name,
              recipientType: recipientType,
              sessionId: sessionId,
            ),
          ),
        );
      },
      child: Container(
        width: 180,
        decoration: BoxDecoration(
          color: CbColors.surface2,
          borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
          border: Border.all(color: CbColors.borderSubtle),
          image: DecorationImage(
            image: NetworkImage(imageUrl),
            fit: BoxFit.cover,
            colorFilter: ColorFilter.mode(
              Colors.black.withAlpha(150),
              BlendMode.darken,
            ),
          ),
        ),
        child: Stack(
          children: [
            // Top LIVE badge & distance
            const Positioned(
              top: 10,
              left: 10,
              child: CbLiveBadge(),
            ),
            Positioned(
              top: 10,
              right: 10,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xCC0B0C10),
                  borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                ),
                child: Text(
                  distance,
                  style: const TextStyle(color: Colors.white, fontSize: 10),
                ),
              ),
            ),
            // Bottom Performer details & Tip Button
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0xF00B0C10)],
                  ),
                  borderRadius: BorderRadius.vertical(bottom: Radius.circular(CbSpacing.radiusLg)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      genre,
                      style: const TextStyle(color: CbColors.purpleLight, fontSize: 10),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      venue,
                      style: const TextStyle(color: CbColors.textSecondary, fontSize: 9),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 28,
                      decoration: BoxDecoration(
                        gradient: CbColors.primaryGradient,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                      ),
                      child: const Center(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.favorite, size: 12, color: Colors.white),
                            SizedBox(width: 4),
                            Text('Tip', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Recent Tips Section ─────────────────────────────────────────────────────

class _RecentTipsSection extends StatelessWidget {
  const _RecentTipsSection({required this.fanUid, required this.ref});
  final String fanUid;
  final WidgetRef ref;

  String _formatCents(int cents) {
    final d = cents ~/ 100;
    final c = cents % 100;
    return '\$$d.${c.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final tipsAsync = ref.watch(fanTipHistoryProvider(fanUid));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recent Tips & Activity',
          style: TextStyle(
            color: Colors.white,
            fontSize: 15,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        tipsAsync.when(
          loading: () => const _SkeletonCarousel(),
          error: (_, _) => const SizedBox.shrink(),
          data: (tips) {
            if (tips.isEmpty) {
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: CbColors.surface2,
                  borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  border: Border.all(color: CbColors.borderSubtle),
                ),
                child: const Center(
                  child: Text(
                    'No tips yet. Tap "Tip Musician" to send your first tip!',
                    style: TextStyle(color: CbColors.textMuted, fontSize: 12),
                  ),
                ),
              );
            }
            final recent = tips.take(3).toList();
            return Column(
              children: recent.map((t) {
                final amount = (t['amountCents'] as num?)?.toInt() ?? 0;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: CbColors.surface2,
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    border: Border.all(color: CbColors.borderSubtle),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: CbColors.purpleDim,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                        ),
                        child: const Icon(Icons.favorite, color: CbColors.purpleLight, size: 16),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              t['recipientName'] as String? ?? 'Performer',
                              style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                            ),
                            const Text('Tip sent • Verified on ledger', style: TextStyle(color: CbColors.textMuted, fontSize: 10)),
                          ],
                        ),
                      ),
                      Text(
                        '+${_formatCents(amount)}',
                        style: const TextStyle(
                          color: CbColors.liveGreen,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }
}

class _SkeletonCarousel extends StatelessWidget {
  const _SkeletonCarousel();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 120,
      decoration: BoxDecoration(
        color: CbColors.surface2,
        borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
      ),
    );
  }
}
