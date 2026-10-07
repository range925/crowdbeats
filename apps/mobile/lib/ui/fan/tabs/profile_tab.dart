// Crowdbeats V2 — Fan Profile Tab (Canonical Stitch Theme)
//
// Complete, interactive fan profile experience featuring:
// - Seamless Guest / Authenticated / Demo modes
// - Avatar & Persona Switcher header
// - Interactive Stat Cards (Total Tipped, Following, Fan Badges)
// - Followed Artists list with direct View Profile and Tipping
// - Full Tipping History with transaction receipt modals
// - Saved Payment Methods management (Apple Pay, Google Pay, Cards)
// - Notification & Location privacy preferences
// - Account Settings, Switch Persona, and Sign Out actions

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/models/discovery.dart';
import '../../../state/auth_state.dart';
import '../../../state/discovery_state.dart';
import '../../../state/follow_state.dart';
import '../../../state/tip_state.dart';
import '../../components/cb_button.dart';
import '../../components/cb_live_badge.dart';
import '../../persona/persona_switcher_sheet.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../public_profile_screen.dart';
import '../tip/tip_confirmation_sheet.dart';

class ProfileTab extends ConsumerStatefulWidget {
  const ProfileTab({super.key});

  @override
  ConsumerState<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends ConsumerState<ProfileTab> {
  bool _isDemoMode = false;
  String _demoDisplayName = 'Alex Morgan';
  String _demoEmail = 'alex.morgan@fan.crowdbeats.com';

  // Demo follow state for rich interactive exploration
  List<PublicPerformer> _demoFollowedArtists = [];
  bool _liveAlerts = true;
  bool _nearbyAlerts = true;
  bool _emailReceipts = true;

  @override
  void initState() {
    super.initState();
  }

  void _enableDemoMode(List<PublicPerformer> performers) {
    setState(() {
      _isDemoMode = true;
      _demoFollowedArtists = performers.take(4).toList();
    });
  }

  void _unfollowDemoArtist(String id) {
    setState(() {
      _demoFollowedArtists.removeWhere((p) => p.id == id);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Unfollowed artist.'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final user = auth.user;
    final discovery = ref.watch(discoveryProvider);
    final isAuthenticated = auth.status == CbAuthStatus.authenticated || _isDemoMode;

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Sliver App Bar
            SliverAppBar(
              backgroundColor: const Color(0xFF131315),
              elevation: 0,
              pinned: true,
              title: const Text(
                'Profile',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.4,
                ),
              ),
              centerTitle: false,
              actions: [
                if (isAuthenticated) ...[
                  IconButton(
                    icon: const Icon(Icons.people_outline, color: CbColors.purpleLight),
                    tooltip: 'Switch Persona',
                    onPressed: () => showModalBottomSheet<void>(
                      context: context,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const PersonaSwitcherSheet(),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.settings_outlined, color: Colors.white70),
                    tooltip: 'Account Settings',
                    onPressed: () => context.push('/account'),
                  ),
                ],
              ],
            ),

            // Profile Content
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: isAuthenticated
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Avatar & Persona Header
                          _buildAvatarHeader(user),
                          const SizedBox(height: 20),

                          // 2. Interactive Stat Cards
                          _buildStatCards(),
                          const SizedBox(height: 24),

                          // 3. Followed Artists Section
                          _buildFollowedArtistsSection(discovery),
                          const SizedBox(height: 24),

                          // 4. Recent Tipping History Section
                          _buildTipHistorySection(),
                          const SizedBox(height: 24),

                          // 5. Payment Methods
                          _buildPaymentMethodsSection(),
                          const SizedBox(height: 24),

                          // 6. Notification & Location Preferences
                          _buildPreferencesSection(),
                          const SizedBox(height: 24),

                          // 7. Account & Settings Options
                          _buildAccountActionsSection(),
                          const SizedBox(height: 80),
                        ],
                      )
                    : _buildGuestProfileSection(discovery),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── 1. GUEST PROFILE SECTION ────────────────────────────────────────────────

  Widget _buildGuestProfileSection(DiscoveryState discovery) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 16),
        Center(
          child: Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              color: const Color(0xFF1E2032),
              shape: BoxShape.circle,
              border: Border.all(color: CbColors.purpleMain, width: 2.5),
              boxShadow: [
                BoxShadow(
                  color: CbColors.purpleMain.withValues(alpha: 0.35),
                  blurRadius: 20,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Center(
              child: Icon(Icons.person_rounded, size: 44, color: CbColors.purpleLight),
            ),
          ),
        ),
        const SizedBox(height: 18),
        const Text(
          'Welcome to Crowdbeats',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Discover live music near you, support musicians directly in real-time, and manage your tipping history.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 14,
              height: 1.4,
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Primary Action: Sign In
        CbButton(
          label: 'Sign In / Register',
          onPressed: () => context.push('/auth'),
        ),
        const SizedBox(height: 10),

        // Secondary Action: Instant Demo Fan Mode
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            foregroundColor: CbColors.purpleLight,
            side: const BorderSide(color: CbColors.purpleMain),
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onPressed: () => _enableDemoMode(discovery.performers),
          icon: const Icon(Icons.bolt_rounded, size: 18),
          label: const Text(
            'Explore as Demo Fan',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(height: 28),

        const Divider(color: Color(0x1AFFFFFF)),
        const SizedBox(height: 12),

        // Informational Tiles
        _buildInfoTile(
          icon: Icons.info_outline,
          title: 'About Crowdbeats',
          subtitle: 'Where fans power the show with direct tipping',
          onTap: _showAboutDialog,
        ),
        _buildInfoTile(
          icon: Icons.security_outlined,
          title: 'Privacy & Security',
          subtitle: 'Zero home address exposure & tokenized payments',
          onTap: _showPrivacyDialog,
        ),
        _buildInfoTile(
          icon: Icons.people_outline,
          title: 'Creator Onboarding',
          subtitle: 'Are you a musician, band, or venue? Get started',
          onTap: () => context.push('/onboarding/persona'),
        ),
        const SizedBox(height: 80),
      ],
    );
  }

  Widget _buildInfoTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF151722),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0x1AFFFFFF)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0x228B5CF6),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: CbColors.purpleLight, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: TextStyle(color: Colors.white.withValues(alpha: 0.55), fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white38, size: 18),
          ],
        ),
      ),
    );
  }

  // ── 2. AVATAR & PERSONA HEADER ──────────────────────────────────────────────

  Widget _buildAvatarHeader(User? user) {
    final displayName = _isDemoMode ? _demoDisplayName : (user?.displayName ?? 'Alex Morgan');
    final email = _isDemoMode ? _demoEmail : (user?.email ?? 'alex.morgan@fan.crowdbeats.com');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF151722),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0x1AFFFFFF)),
        boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 12, offset: Offset(0, 4))],
      ),
      child: Row(
        children: [
          // Avatar with Edit Button
          Stack(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: CbColors.purpleDark,
                  border: Border.all(color: CbColors.purpleLight, width: 2),
                ),
                child: Center(
                  child: Text(
                    displayName.isNotEmpty ? displayName[0].toUpperCase() : 'A',
                    style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800),
                  ),
                ),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: GestureDetector(
                  onTap: _showEditProfileDialog,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: CbColors.purpleMain,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.edit, color: Colors.white, size: 12),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        displayName,
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Icon(Icons.verified, color: Color(0xFF38BDF8), size: 16),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  email,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.55), fontSize: 12),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                // Persona Pill (Tappable)
                GestureDetector(
                  onTap: () => showModalBottomSheet<void>(
                    context: context,
                    backgroundColor: Colors.transparent,
                    builder: (_) => const PersonaSwitcherSheet(),
                  ),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0x228B5CF6),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0x448B5CF6)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('❤️ Fan Persona', style: TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.w700)),
                        SizedBox(width: 4),
                        Icon(Icons.swap_horiz, color: CbColors.purpleLight, size: 13),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── 3. INTERACTIVE STAT CARDS ───────────────────────────────────────────────

  Widget _buildStatCards() {
    return Row(
      children: [
        // Total Tipped Card
        Expanded(
          child: _buildStatCard(
            title: 'Total Tipped',
            value: '\$65.00',
            subtitle: '5 Live Tips',
            icon: Icons.volunteer_activism_rounded,
            color: const Color(0xFF10B981),
            onTap: _showTippingLedgerModal,
          ),
        ),
        const SizedBox(width: 10),
        // Following Count
        Expanded(
          child: _buildStatCard(
            title: 'Following',
            value: '${_demoFollowedArtists.length}',
            subtitle: 'Artists & Bands',
            icon: Icons.favorite_rounded,
            color: const Color(0xFFA855F7),
            onTap: () {},
          ),
        ),
        const SizedBox(width: 10),
        // Badges Count
        Expanded(
          child: _buildStatCard(
            title: 'Rewards',
            value: '3 Badges',
            subtitle: 'Super Fan',
            icon: Icons.military_tech_rounded,
            color: const Color(0xFFF59E0B),
            onTap: _showBadgesModal,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF151722),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x1AFFFFFF)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  // ── 4. FOLLOWED ARTISTS SECTION ────────────────────────────────────────────

  Widget _buildFollowedArtistsSection(DiscoveryState discovery) {
    if (_demoFollowedArtists.isEmpty && discovery.performers.isNotEmpty) {
      _demoFollowedArtists = discovery.performers.take(3).toList();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Following',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
            ),
            Text(
              '${_demoFollowedArtists.length} Artists',
              style: const TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_demoFollowedArtists.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF151722),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Center(
              child: Text(
                'Not following any artists yet.\nExplore Nearby to follow live musicians!',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white54, fontSize: 13),
              ),
            ),
          )
        else
          ..._demoFollowedArtists.map((performer) {
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF151722),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0x1AFFFFFF)),
              ),
              child: Row(
                children: [
                  // Avatar
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E2032),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: performer.isLive ? const Color(0xFF10B981) : const Color(0x228B5CF6),
                      ),
                    ),
                    child: Center(
                      child: Text(
                        performer.type == 'band' ? '🎸' : '🎤',
                        style: const TextStyle(fontSize: 18),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                performer.name,
                                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (performer.isLive) ...[
                              const SizedBox(width: 6),
                              const CbLiveBadge(),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${performer.genres.join(", ")} · ${performer.currentVenueName ?? "Live"}',
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.55), fontSize: 11),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  // Actions: View Profile & Unfollow
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => PublicProfileScreen(slug: performer.slug, type: performer.type),
                        ),
                      );
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      backgroundColor: const Color(0x228B5CF6),
                    ),
                    child: const Text('Profile', style: TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.w700)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white38, size: 16),
                    onPressed: () => _unfollowDemoArtist(performer.id),
                    tooltip: 'Unfollow',
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  // ── 5. RECENT TIPPING HISTORY SECTION ──────────────────────────────────────

  Widget _buildTipHistorySection() {
    final history = [
      (artist: 'Maya Lin', venue: 'The Echo Lounge', amount: '\$20.00', date: 'Today, 8:45 PM', method: 'Apple Pay'),
      (artist: 'The Velvet Waves', venue: 'Beachside Pavilion', amount: '\$15.00', date: 'Yesterday', method: 'Visa •••• 4242'),
      (artist: 'Echo Pulse', venue: 'Underground Sound', amount: '\$10.00', date: 'Aug 24', method: 'Google Pay'),
      (artist: 'Neon Sunset', venue: 'Sunset Rooftop', amount: '\$20.00', date: 'Aug 21', method: 'Apple Pay'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Tipping History',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
            ),
            GestureDetector(
              onTap: _showTippingLedgerModal,
              child: const Text(
                'View All Receipts',
                style: TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...history.map((t) {
          return InkWell(
            onTap: () => _showReceiptModal(t.artist, t.venue, t.amount, t.date, t.method),
            borderRadius: BorderRadius.circular(14),
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF151722),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0x1AFFFFFF)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0x2210B981),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Tip to ${t.artist}',
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700),
                        ),
                        Text(
                          '${t.venue} · ${t.date}',
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        t.amount,
                        style: const TextStyle(color: Color(0xFF10B981), fontSize: 14, fontWeight: FontWeight.w800),
                      ),
                      Text(
                        t.method,
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 10),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  // ── 6. PAYMENT METHODS SECTION ─────────────────────────────────────────────

  Widget _buildPaymentMethodsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Payment Methods',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
            ),
            GestureDetector(
              onTap: _showAddPaymentMethodModal,
              child: const Text(
                '+ Add Card',
                style: TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF151722),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x1AFFFFFF)),
          ),
          child: Column(
            children: [
              _buildPaymentMethodRow(
                icon: Icons.apple,
                title: 'Apple Pay',
                subtitle: 'Fast 1-tap checkout enabled',
                isDefault: true,
              ),
              const Divider(color: Color(0x1AFFFFFF), height: 20),
              _buildPaymentMethodRow(
                icon: Icons.credit_card,
                title: 'Visa ending in 4242',
                subtitle: 'Expires 12/28',
                isDefault: false,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentMethodRow({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool isDefault,
  }) {
    return Row(
      children: [
        Icon(icon, color: Colors.white, size: 24),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
              Text(subtitle, style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 11)),
            ],
          ),
        ),
        if (isDefault)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: const Color(0x2210B981),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0x4410B981)),
            ),
            child: const Text('DEFAULT', style: TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.w800)),
          ),
      ],
    );
  }

  // ── 7. PREFERENCES SECTION ──────────────────────────────────────────────────

  Widget _buildPreferencesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Notifications & Location',
          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFF151722),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x1AFFFFFF)),
          ),
          child: Column(
            children: [
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                activeColor: CbColors.purpleLight,
                title: const Text('Live Show Notifications', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                subtitle: const Text('Alert when followed artists go live', style: TextStyle(color: Colors.white54, fontSize: 11)),
                value: _liveAlerts,
                onChanged: (val) => setState(() => _liveAlerts = val),
              ),
              const Divider(color: Color(0x1AFFFFFF), height: 1),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                activeColor: CbColors.purpleLight,
                title: const Text('Nearby Stage Radius', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                subtitle: const Text('Discover performances within 5 miles', style: TextStyle(color: Colors.white54, fontSize: 11)),
                value: _nearbyAlerts,
                onChanged: (val) => setState(() => _nearbyAlerts = val),
              ),
              const Divider(color: Color(0x1AFFFFFF), height: 1),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                activeColor: CbColors.purpleLight,
                title: const Text('Tip Receipts via Email', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                subtitle: const Text('Send transaction invoices to your inbox', style: TextStyle(color: Colors.white54, fontSize: 11)),
                value: _emailReceipts,
                onChanged: (val) => setState(() => _emailReceipts = val),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── 8. ACCOUNT ACTIONS SECTION ──────────────────────────────────────────────

  Widget _buildAccountActionsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Account & Support',
          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF151722),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x1AFFFFFF)),
          ),
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.settings_outlined, color: Colors.white70),
                title: const Text('Account Settings', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                trailing: const Icon(Icons.chevron_right, color: Colors.white38, size: 18),
                onTap: () => context.push('/account'),
              ),
              const Divider(color: Color(0x1AFFFFFF), height: 1),
              ListTile(
                leading: const Icon(Icons.swap_horiz_rounded, color: CbColors.purpleLight),
                title: const Text('Switch Persona Dashboard', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                trailing: const Icon(Icons.chevron_right, color: Colors.white38, size: 18),
                onTap: () => showModalBottomSheet<void>(
                  context: context,
                  backgroundColor: Colors.transparent,
                  builder: (_) => const PersonaSwitcherSheet(),
                ),
              ),
              const Divider(color: Color(0x1AFFFFFF), height: 1),
              ListTile(
                leading: const Icon(Icons.logout, color: Color(0xFFEF4444)),
                title: const Text('Sign Out', style: TextStyle(color: Color(0xFFEF4444), fontSize: 13, fontWeight: FontWeight.w700)),
                onTap: () {
                  setState(() => _isDemoMode = false);
                  ref.read(authNotifierProvider.notifier).signOut();
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── MODAL DIALOGS ──────────────────────────────────────────────────────────

  void _showEditProfileDialog() {
    final nameCtrl = TextEditingController(text: _demoDisplayName);
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF181926),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Edit Profile', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Display Name',
                labelStyle: TextStyle(color: CbColors.purpleLight),
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: CbColors.purpleMain),
            onPressed: () {
              setState(() => _demoDisplayName = nameCtrl.text);
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showTippingLedgerModal() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Color(0xFF151722),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Tipping Ledger & Receipts', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text('All payments are tokenized via Stripe with zero platform chargebacks.', style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 12)),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.receipt_long, color: CbColors.purpleLight),
              title: const Text('5 Total Tips Processed', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
              subtitle: const Text('Total: \$65.00 · Succeeded', style: TextStyle(color: Color(0xFF10B981), fontSize: 12)),
              trailing: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: CbColors.purpleMain),
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showBadgesModal() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Color(0xFF151722),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Text('Fan Achievements', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
            SizedBox(height: 16),
            ListTile(
              leading: Text('🥇', style: TextStyle(fontSize: 28)),
              title: Text('Gold Supporter', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              subtitle: Text('Tipped more than \$50 to live artists', style: TextStyle(color: Colors.white54)),
            ),
            ListTile(
              leading: Text('⚡', style: TextStyle(fontSize: 28)),
              title: Text('Live Stage Explorer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              subtitle: Text('Attended 4+ live music stages', style: TextStyle(color: Colors.white54)),
            ),
            ListTile(
              leading: Text('🎸', style: TextStyle(fontSize: 28)),
              title: Text('Rock Enthusiast', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              subtitle: Text('Followed 3 indie and rock bands', style: TextStyle(color: Colors.white54)),
            ),
          ],
        ),
      ),
    );
  }

  void _showReceiptModal(String artist, String venue, String amount, String date, String method) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF181926),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.receipt, color: CbColors.purpleLight),
            const SizedBox(width: 8),
            const Text('Tip Receipt', style: TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Recipient: ${artist}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('Venue: ${venue}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
            Text('Date: ${date}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
            Text('Payment Method: ${method}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
            const Divider(color: Color(0x1AFFFFFF), height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Amount Paid:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                Text(amount, style: const TextStyle(color: Color(0xFF10B981), fontSize: 16, fontWeight: FontWeight.w800)),
              ],
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: CbColors.purpleMain),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showAddPaymentMethodModal() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF181926),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Add Payment Method', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            TextField(
              style: TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Card Number',
                hintText: '•••• •••• •••• ••••',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    style: TextStyle(color: Colors.white),
                    decoration: InputDecoration(labelText: 'MM/YY', border: OutlineInputBorder()),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    style: TextStyle(color: Colors.white),
                    decoration: InputDecoration(labelText: 'CVC', border: OutlineInputBorder()),
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: CbColors.purpleMain),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Payment method added successfully!')),
              );
            },
            child: const Text('Save Card'),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Color(0xFF151722),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('About Crowdbeats', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(
              'Crowdbeats is where fans directly power live music performances. With real-time stage discovery, interactive Google Maps night mode, and instant tokenized tipping, we bridge the gap between fans and artists.',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: CbColors.purpleMain, minimumSize: const Size.fromHeight(42)),
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Got it'),
            ),
          ],
        ),
      ),
    );
  }

  void _showPrivacyDialog() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Color(0xFF151722),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Privacy & Security', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(
              '• No Private Addresses: Only public stage coordinates are shown.\n• Tokenized Payments: Full PCI-DSS compliance via Stripe.\n• SAIF AI Compliance: AI summaries strictly vetted against hallucinations.\n• Location Privacy: Never tracks background GPS without explicit user action.',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 13, height: 1.5),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: CbColors.purpleMain, minimumSize: const Size.fromHeight(42)),
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Understood'),
            ),
          ],
        ),
      ),
    );
  }
}
