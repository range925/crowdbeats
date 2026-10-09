// Crowdbeats V2 — Fan Mobile Preview Hub
// High-fidelity mobile preview environment for localhost showcasing:
// 1. Fan Dashboard
// 2. Discover Screen
// 3. Tip Screen
// 4. Confirm Screen

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import '../components/cb_live_badge.dart';
import '../components/cb_logo.dart';
import '../../state/tip_state.dart';
import '../../data/services/stripe_fee_service.dart';

// Sample performers available in the preview
class PreviewPerformer {
  final String id;
  final String name;
  final String genre;
  final String venue;
  final String distance;
  final String avatarUrl;
  final String coverUrl;
  final int listeners;
  final String recipientType;

  const PreviewPerformer({
    required this.id,
    required this.name,
    required this.genre,
    required this.venue,
    required this.distance,
    required this.avatarUrl,
    required this.coverUrl,
    required this.listeners,
    this.recipientType = 'artist',
  });
}

const List<PreviewPerformer> kPreviewPerformers = [
  PreviewPerformer(
    id: 'artist_luna',
    name: 'Luna & The Waves',
    genre: 'Indie Pop / Dream Pop',
    venue: 'The Casbah • Main Stage',
    distance: '0.4 mi away',
    avatarUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    listeners: 342,
  ),
  PreviewPerformer(
    id: 'artist_marcus',
    name: 'Marcus Vance',
    genre: 'Soul & Neo-R&B',
    venue: 'Soda Bar • Stage A',
    distance: '0.9 mi away',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    listeners: 188,
  ),
  PreviewPerformer(
    id: 'band_neon',
    name: 'Neon Echo',
    genre: 'Synthwave / Electronic',
    venue: 'Belly Up Tavern • Ocean Deck',
    distance: '2.1 mi away',
    avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&auto=format&fit=crop&q=80',
    listeners: 512,
    recipientType: 'band',
  ),
];

class FanMobilePreviewHub extends ConsumerStatefulWidget {
  const FanMobilePreviewHub({
    super.key,
    this.initialScreenIndex = 0,
  });

  final int initialScreenIndex;

  @override
  ConsumerState<FanMobilePreviewHub> createState() => _FanMobilePreviewHubState();
}

class _FanMobilePreviewHubState extends ConsumerState<FanMobilePreviewHub> {
  late int _activeScreen; // 0: Dashboard, 1: Discover, 2: Tip, 3: Confirm
  bool _useDeviceFrame = true;
  int _selectedPerformerIndex = 0;
  int _tipAmountCents = 1000;
  String _tipNote = 'Loved the encore! Keep rocking 🔥';
  String _paymentMethod = 'card_4242'; // 'google_pay' | 'card_4242'
  bool _isProcessingPay = false;

  PreviewPerformer get _currentPerformer => kPreviewPerformers[_selectedPerformerIndex];

  @override
  void initState() {
    super.initState();
    _activeScreen = widget.initialScreenIndex.clamp(0, 3);
    _syncTipState();
  }

  void _syncTipState() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(tipFlowProvider.notifier).prepare(
        recipientId: _currentPerformer.id,
        recipientName: _currentPerformer.name,
        recipientType: _currentPerformer.recipientType,
        amountCents: _tipAmountCents,
      );
    });
  }

  void _navigateToScreen(int index) {
    setState(() {
      _activeScreen = index;
      if (index == 2 || index == 3) {
        _syncTipState();
      }
    });
  }

  void _selectPerformer(int index) {
    setState(() {
      _selectedPerformerIndex = index;
      _syncTipState();
    });
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    final isDesktop = screenSize.width > 768;

    return Scaffold(
      backgroundColor: const Color(0xFF090A0F),
      body: Stack(
        children: [
          // Background ambient gradient glow
          Positioned(
            top: -150,
            left: -150,
            child: Container(
              width: 500,
              height: 500,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [Color(0x337C3AED), Colors.transparent],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -150,
            right: -150,
            child: Container(
              width: 550,
              height: 550,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [Color(0x2210B981), Colors.transparent],
                ),
              ),
            ),
          ),

          // Main layout: Top Switcher Bar + Centered Mobile Frame
          SafeArea(
            child: Column(
              children: [
                // Top Preview Control Bar
                _buildTopToolbar(context, isDesktop),

                // Device Viewport Area
                Expanded(
                  child: Center(
                    child: _useDeviceFrame && isDesktop
                        ? _buildIPhoneDeviceFrame()
                        : _buildDirectViewport(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Top Preview Toolbar ───────────────────────────────────────────────────────

  Widget _buildTopToolbar(BuildContext context, bool isDesktop) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xDD12141D),
        border: Border(
          bottom: BorderSide(
            color: Colors.white.withValues(alpha: 0.08),
            width: 1,
          ),
        ),
      ),
      child: Wrap(
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 12,
        runSpacing: 10,
        children: [
          // Brand & Mode Badge
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CbLogo(
                variant: CbLogoVariant.horizontal,
                surface: CbLogoSurface.dark,
                height: 22,
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0x1F10B981),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0x5510B981)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('●', style: TextStyle(color: Color(0xFF10B981), fontSize: 8)),
                    SizedBox(width: 6),
                    Text(
                      'MOBILE PREVIEW',
                      style: TextStyle(
                        color: Color(0xFF10B981),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Central Screen Switcher Tabs
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFF1B1D28),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildScreenTab(0, Icons.dashboard_rounded, 'Dashboard'),
                _buildScreenTab(1, Icons.explore_rounded, 'Discover'),
                _buildScreenTab(2, Icons.favorite_rounded, 'Tip Screen'),
                _buildScreenTab(3, Icons.verified_rounded, 'Confirm'),
              ],
            ),
          ),

          // Viewport & Performer Quick Controls
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Performer Selector Pill
              PopupMenuButton<int>(
                initialValue: _selectedPerformerIndex,
                onSelected: _selectPerformer,
                tooltip: 'Select Demo Performer',
                color: const Color(0xFF1F2230),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                itemBuilder: (ctx) => [
                  for (int i = 0; i < kPreviewPerformers.length; i++)
                    PopupMenuItem<int>(
                      value: i,
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 12,
                            backgroundImage: NetworkImage(kPreviewPerformers[i].avatarUrl),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              kPreviewPerformers[i].name,
                              style: TextStyle(
                                color: _selectedPerformerIndex == i
                                    ? CbColors.purpleLight
                                    : Colors.white,
                                fontWeight: _selectedPerformerIndex == i
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          if (_selectedPerformerIndex == i)
                            const Icon(Icons.check, color: CbColors.purpleLight, size: 16),
                        ],
                      ),
                    ),
                ],
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1F2230),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircleAvatar(
                        radius: 9,
                        backgroundImage: NetworkImage(_currentPerformer.avatarUrl),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _currentPerformer.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Icon(Icons.arrow_drop_down, color: Colors.white70, size: 18),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Device Frame Toggle (if desktop)
              if (isDesktop)
                IconButton(
                  tooltip: _useDeviceFrame ? 'Disable Phone Frame' : 'Enable iPhone Frame',
                  icon: Icon(
                    _useDeviceFrame ? Icons.smartphone : Icons.fullscreen,
                    color: _useDeviceFrame ? CbColors.purpleLight : Colors.white70,
                    size: 20,
                  ),
                  onPressed: () => setState(() => _useDeviceFrame = !_useDeviceFrame),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildScreenTab(int index, IconData icon, String title) {
    final isSelected = _activeScreen == index;
    return GestureDetector(
      onTap: () => _navigateToScreen(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? CbColors.purpleMain : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: CbColors.purpleMain.withValues(alpha: 0.4),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 15,
              color: isSelected ? Colors.white : Colors.white60,
            ),
            const SizedBox(width: 6),
            Text(
              title,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.white70,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Realistic iPhone 16 Pro Frame ─────────────────────────────────────────────

  Widget _buildIPhoneDeviceFrame() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16),
      width: 400,
      height: 840,
      decoration: BoxDecoration(
        color: const Color(0xFF161822),
        borderRadius: BorderRadius.circular(52),
        border: Border.all(
          color: const Color(0xFF2C2F40),
          width: 8,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.7),
            blurRadius: 36,
            spreadRadius: 4,
            offset: const Offset(0, 16),
          ),
          BoxShadow(
            color: CbColors.purpleMain.withValues(alpha: 0.15),
            blurRadius: 48,
            spreadRadius: -8,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(44),
        child: Stack(
          children: [
            // Active Phone Screen
            Positioned.fill(
              child: _buildCurrentScreenContent(),
            ),

            // Top Status Bar & Dynamic Island
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: _buildIPhoneStatusBar(),
            ),

            // Bottom iOS Home Indicator
            Positioned(
              bottom: 6,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  width: 134,
                  height: 4.5,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.45),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
            ),

            // In-frame Mobile Bottom Nav Bar (for seamless mobile tapping)
            Positioned(
              left: 14,
              right: 14,
              bottom: 22,
              child: _buildInFrameMobileNavBar(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDirectViewport() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Stack(
        children: [
          Positioned.fill(
            child: _buildCurrentScreenContent(),
          ),
          // In-frame Mobile Bottom Nav Bar
          Positioned(
            left: 16,
            right: 16,
            bottom: 20,
            child: _buildInFrameMobileNavBar(),
          ),
        ],
      ),
    );
  }

  // ── iOS Status Bar & Dynamic Island ──────────────────────────────────────────

  Widget _buildIPhoneStatusBar() {
    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      color: Colors.transparent,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Time
          const Text(
            '9:41',
            style: TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.2,
            ),
          ),

          // Dynamic Island Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.music_note, color: CbColors.purpleLight, size: 11),
                const SizedBox(width: 4),
                Text(
                  _currentPerformer.name.split(' ').first,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 6),
                const Text('●', style: TextStyle(color: Color(0xFF10B981), fontSize: 7)),
              ],
            ),
          ),

          // Battery & Network Icons
          const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.signal_cellular_alt, color: Colors.white, size: 14),
              SizedBox(width: 4),
              Icon(Icons.wifi, color: Colors.white, size: 14),
              SizedBox(width: 5),
              Icon(Icons.battery_full, color: Color(0xFF10B981), size: 16),
            ],
          ),
        ],
      ),
    );
  }

  // ── Floating Mobile Nav Bar Inside Mockup ────────────────────────────────────

  Widget _buildInFrameMobileNavBar() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: 60,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xDD151722),
            borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.18),
              width: 1,
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x66000000),
                blurRadius: 20,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildMobileNavItem(0, Icons.home_outlined, Icons.home, 'Home'),
              _buildMobileNavItem(1, Icons.explore_outlined, Icons.explore, 'Discover'),
              _buildCenterTipButton(),
              _buildMobileNavItem(3, Icons.verified_outlined, Icons.verified, 'Confirm'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMobileNavItem(int index, IconData icon, IconData activeIcon, String label) {
    final isSelected = _activeScreen == index;
    return GestureDetector(
      onTap: () => _navigateToScreen(index),
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? activeIcon : icon,
              color: isSelected ? CbColors.purpleLight : CbColors.textMuted,
              size: 20,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : CbColors.textMuted,
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCenterTipButton() {
    final isSelected = _activeScreen == 2;
    return GestureDetector(
      onTap: () => _navigateToScreen(2),
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: CbColors.primaryGradient,
          boxShadow: [
            BoxShadow(
              color: CbColors.purpleMain.withValues(alpha: isSelected ? 0.6 : 0.3),
              blurRadius: isSelected ? 12 : 8,
              spreadRadius: 1,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: const Center(
          child: Icon(Icons.favorite, color: Colors.white, size: 20),
        ),
      ),
    );
  }

  // ── Active Screen Content Router ─────────────────────────────────────────────

  Widget _buildCurrentScreenContent() {
    switch (_activeScreen) {
      case 0:
        return _buildFanDashboardScreen();
      case 1:
        return _buildDiscoverScreen();
      case 2:
        return _buildTipScreen();
      case 3:
        return _buildConfirmScreen();
      default:
        return _buildFanDashboardScreen();
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // SCREEN 1: FAN DASHBOARD
  // ═════════════════════════════════════════════════════════════════════════════

  Widget _buildFanDashboardScreen() {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        top: false,
        bottom: false,
        child: CustomScrollView(
          slivers: [
            const SliverToBoxAdapter(child: SizedBox(height: 48)),

            // Top Header (Avatar, Greeting, Bell)
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              sliver: SliverToBoxAdapter(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        // User Avatar
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
                              text: const TextSpan(
                                style: TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                  color: CbColors.textPrimary,
                                ),
                                children: [
                                  TextSpan(text: 'Good evening, '),
                                  TextSpan(
                                    text: 'Jordan',
                                    style: TextStyle(color: CbColors.purpleLight),
                                  ),
                                  TextSpan(text: ' 👋'),
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
                                  style: TextStyle(fontSize: 11, color: CbColors.textSecondary),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                    // Notification Icon
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: CbColors.surface2,
                        shape: BoxShape.circle,
                        border: Border.all(color: CbColors.borderSubtle),
                      ),
                      child: const Center(
                        child: Icon(Icons.notifications_none, color: Colors.white, size: 18),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 3 Quick Action Cards
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverToBoxAdapter(
                child: Row(
                  children: [
                    // Card 1: Nearby Live
                    Expanded(
                      child: _buildActionTile(
                        icon: Icons.explore,
                        iconColor: CbColors.purpleLight,
                        title: 'Nearby Live',
                        subtitle: '6 active shows',
                        onTap: () => _navigateToScreen(1),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Card 2: Tip Musician (Primary CTA)
                    Expanded(
                      child: _buildActionTile(
                        icon: Icons.favorite,
                        iconColor: Colors.white,
                        title: 'Tip Musician',
                        subtitle: 'Instant tip',
                        isPrimary: true,
                        onTap: () => _navigateToScreen(2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Card 3: Confirm Review
                    Expanded(
                      child: _buildActionTile(
                        icon: Icons.receipt_long,
                        iconColor: CbColors.heartOrange,
                        title: 'Review Tip',
                        subtitle: 'Breakdown',
                        onTap: () => _navigateToScreen(3),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 20)),

            // Live Near You Section
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverToBoxAdapter(
                child: Column(
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
                          onTap: () => _navigateToScreen(1),
                          child: const Text(
                            'See All (6) >',
                            style: TextStyle(
                              color: CbColors.purpleLight,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 200,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: kPreviewPerformers.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 12),
                        itemBuilder: (ctx, i) {
                          final p = kPreviewPerformers[i];
                          return _buildLiveCard(p, i);
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 20)),

            // Upcoming Shows You Might Like
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Upcoming Shows You Might Like',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: CbColors.surface2,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: CbColors.borderSubtle),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: CbColors.surface3,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: CbColors.purpleMain.withValues(alpha: 0.4)),
                            ),
                            child: const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text('FRI', style: TextStyle(color: CbColors.purpleLight, fontSize: 10, fontWeight: FontWeight.bold)),
                                Text('26', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w900)),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('The Midnight Velvet Tour', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                                SizedBox(height: 2),
                                Text('The Casbah • Doors at 8:00 PM', style: TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: CbColors.purpleDim,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text('RSVP', style: TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 20)),

            // Recent Tips & Activity
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverToBoxAdapter(
                child: Column(
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
                    const SizedBox(height: 10),
                    _buildRecentTipTile('Luna & The Waves', '\$10.00', '15 mins ago • The Casbah'),
                    const SizedBox(height: 8),
                    _buildRecentTipTile('Marcus Vance', '\$20.00', 'Yesterday • Soda Bar'),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 90)),
          ],
        ),
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    bool isPrimary = false,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: isPrimary ? null : CbColors.surface2,
          gradient: isPrimary ? CbColors.primaryGradient : null,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isPrimary ? CbColors.purpleLight : CbColors.borderSubtle,
          ),
          boxShadow: isPrimary
              ? const [
                  BoxShadow(
                    color: CbColors.purpleGlow,
                    blurRadius: 10,
                    offset: Offset(0, 3),
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
                color: isPrimary ? Colors.white70 : CbColors.textMuted,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveCard(PreviewPerformer p, int index) {
    return GestureDetector(
      onTap: () {
        _selectPerformer(index);
        _navigateToScreen(2);
      },
      child: Container(
        width: 155,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: CbColors.borderSubtle),
          image: DecorationImage(
            image: NetworkImage(p.avatarUrl),
            fit: BoxFit.cover,
            colorFilter: ColorFilter.mode(
              Colors.black.withValues(alpha: 0.35),
              BlendMode.darken,
            ),
          ),
        ),
        child: Stack(
          children: [
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
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  p.distance,
                  style: const TextStyle(color: Colors.white, fontSize: 9),
                ),
              ),
            ),
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
                  borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      p.genre,
                      style: const TextStyle(color: CbColors.purpleLight, fontSize: 9),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 26,
                      decoration: BoxDecoration(
                        gradient: CbColors.primaryGradient,
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: const Center(
                        child: Text(
                          'Tip Musician',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
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

  Widget _buildRecentTipTile(String name, String amount, String meta) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: CbColors.surface2,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: CbColors.borderSubtle),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: CbColors.purpleDim,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.favorite, color: CbColors.purpleLight, size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                ),
                Text(meta, style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
              ],
            ),
          ),
          Text(
            amount,
            style: const TextStyle(
              color: CbColors.liveGreen,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // SCREEN 2: DISCOVER SCREEN
  // ═════════════════════════════════════════════════════════════════════════════

  Widget _buildDiscoverScreen() {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        top: false,
        bottom: false,
        child: CustomScrollView(
          slivers: [
            const SliverToBoxAdapter(child: SizedBox(height: 48)),

            // Search Header
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Discover Music',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0x2210B981),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0x6610B981)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('●', style: TextStyle(color: Color(0xFF10B981), fontSize: 8)),
                              SizedBox(width: 4),
                              Text('LIVE RADAR', style: TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Search input bar
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: CbColors.surface2,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: CbColors.borderSubtle),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.search, color: CbColors.textMuted, size: 20),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Search artist, genre, or venue in San Diego...',
                              style: TextStyle(color: CbColors.textMuted, fontSize: 12),
                            ),
                          ),
                          Icon(Icons.tune, color: CbColors.purpleLight, size: 18),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Live Radar Basemap Simulation
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverToBoxAdapter(
                child: Container(
                  height: 160,
                  decoration: BoxDecoration(
                    color: const Color(0xFF13151F),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  child: Stack(
                    children: [
                      // Grid & concentric radar circles
                      const Positioned.fill(
                        child: CustomPaint(
                          painter: _RadarBackgroundPainter(),
                        ),
                      ),

                      // Animated live pins
                      Positioned(
                        top: 45,
                        left: 80,
                        child: _buildMapPin('Luna & The Waves', true),
                      ),
                      Positioned(
                        top: 75,
                        right: 70,
                        child: _buildMapPin('Marcus Vance', false),
                      ),
                      Positioned(
                        bottom: 30,
                        left: 140,
                        child: _buildMapPin('Neon Echo', false),
                      ),

                      // Radar Badge
                      Positioned(
                        bottom: 10,
                        left: 10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xCC090A0F),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.white12),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.near_me, color: CbColors.purpleLight, size: 12),
                              SizedBox(width: 4),
                              Text('Showing 3 stages within 5 miles', style: TextStyle(color: Colors.white70, fontSize: 10)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 16)),

            // Genre filter pills
            SliverToBoxAdapter(
              child: SizedBox(
                height: 32,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    _buildGenreChip('All', true),
                    _buildGenreChip('Indie Pop', false),
                    _buildGenreChip('Soul & R&B', false),
                    _buildGenreChip('Electronic', false),
                    _buildGenreChip('Rock', false),
                    _buildGenreChip('Acoustic', false),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 16)),

            // Featured Live Performers List
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) {
                    final p = kPreviewPerformers[i];
                    return _buildDiscoverPerformerCard(p, i);
                  },
                  childCount: kPreviewPerformers.length,
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 90)),
          ],
        ),
      ),
    );
  }

  Widget _buildMapPin(String name, bool isSelected) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: isSelected ? CbColors.purpleMain : const Color(0xDD1F2230),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: isSelected ? Colors.white : Colors.white24),
          ),
          child: Text(
            name,
            style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 2),
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: isSelected ? CbColors.liveGreen : CbColors.purpleLight,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: (isSelected ? CbColors.liveGreen : CbColors.purpleLight).withValues(alpha: 0.6),
                blurRadius: 6,
                spreadRadius: 2,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGenreChip(String label, bool isSelected) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isSelected ? CbColors.purpleMain : CbColors.surface2,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isSelected ? CbColors.purpleLight : CbColors.borderSubtle),
      ),
      child: Center(
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.white70,
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildDiscoverPerformerCard(PreviewPerformer p, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: CbColors.surface2,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: CbColors.borderSubtle),
      ),
      child: Row(
        children: [
          // Avatar with Live Dot
          Stack(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundImage: NetworkImage(p.avatarUrl),
              ),
              const Positioned(
                bottom: 0,
                right: 0,
                child: CbLiveBadge(),
              ),
            ],
          ),
          const SizedBox(width: 12),

          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        p.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.verified, color: CbColors.purpleLight, size: 14),
                  ],
                ),
                const SizedBox(height: 2),
                Text(p.genre, style: const TextStyle(color: CbColors.purpleLight, fontSize: 11)),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 11, color: CbColors.textMuted),
                    const SizedBox(width: 2),
                    Expanded(
                      child: Text(
                        '${p.venue} • ${p.distance}',
                        style: const TextStyle(color: CbColors.textMuted, fontSize: 10),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Tip Button
          GestureDetector(
            onTap: () {
              _selectPerformer(index);
              _navigateToScreen(2);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                gradient: CbColors.primaryGradient,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: CbColors.purpleMain.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.favorite, color: Colors.white, size: 13),
                  SizedBox(width: 4),
                  Text(
                    'Tip',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // SCREEN 3: TIP SCREEN
  // ═════════════════════════════════════════════════════════════════════════════

  Widget _buildTipScreen() {
    final breakdown = StripeFeeService.instance.calculateNetTipPayout(
      grossAmountCents: _tipAmountCents,
    );
    final netProceedsFormatted = '\$${(breakdown.netAmountCents / 100).toStringAsFixed(2)}';

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        top: false,
        bottom: false,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),

              // Top Spotlight Performer Hero Banner
              Container(
                height: 180,
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: NetworkImage(_currentPerformer.coverUrl),
                    fit: BoxFit.cover,
                    colorFilter: ColorFilter.mode(
                      Colors.black.withValues(alpha: 0.65),
                      BlendMode.darken,
                    ),
                  ),
                ),
                child: Stack(
                  children: [
                    // Performer details in center
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              image: DecorationImage(
                                image: NetworkImage(_currentPerformer.avatarUrl),
                                fit: BoxFit.cover,
                              ),
                              boxShadow: const [
                                BoxShadow(
                                  color: Colors.black45,
                                  blurRadius: 10,
                                  offset: Offset(0, 4),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _currentPerformer.name,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.verified, color: CbColors.purpleLight, size: 16),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _currentPerformer.venue,
                            style: const TextStyle(color: Colors.white70, fontSize: 11),
                          ),
                          const SizedBox(height: 4),
                          const CbLiveBadge(label: 'LIVE NOW'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Tipping Body Form
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Choose Tip Amount',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Preset Cards ($5, $10, $20, $50)
                    Row(
                      children: [
                        _buildTipPresetTile(500, '\$5', null),
                        const SizedBox(width: 8),
                        _buildTipPresetTile(1000, '\$10', 'POPULAR'),
                        const SizedBox(width: 8),
                        _buildTipPresetTile(2000, '\$20', 'SUPERFAN'),
                        const SizedBox(width: 8),
                        _buildTipPresetTile(5000, '\$50', null),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Live Net Proceeds Impact Banner
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0x1F10B981),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0x5510B981)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.bolt, color: Color(0xFF10B981), size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: RichText(
                              text: TextSpan(
                                style: const TextStyle(fontSize: 11, color: Colors.white),
                                children: [
                                  TextSpan(
                                    text: _currentPerformer.name,
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  const TextSpan(text: ' receives '),
                                  TextSpan(
                                    text: netProceedsFormatted,
                                    style: const TextStyle(
                                      color: Color(0xFF10B981),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const TextSpan(
                                    text: ' (after 6% platform fee & Stripe processing)',
                                    style: TextStyle(color: Colors.white70),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Fan Note Field
                    const Text(
                      'Add a Shoutout or Song Request (Optional)',
                      style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: CbColors.surface2,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: CbColors.borderSubtle),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.chat_bubble_outline, color: CbColors.textMuted, size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextFormField(
                              initialValue: _tipNote,
                              onChanged: (val) => _tipNote = val,
                              style: const TextStyle(color: Colors.white, fontSize: 12),
                              decoration: const InputDecoration(
                                isDense: true,
                                border: InputBorder.none,
                                hintText: 'Leave a note for the performer...',
                                hintStyle: TextStyle(color: CbColors.textMuted, fontSize: 12),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Payment Method Selection
                    const Text(
                      'Payment Method',
                      style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: _buildPaymentMethodCard(
                            id: 'google_pay',
                            label: 'Google Pay',
                            icon: Icons.account_balance_wallet,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildPaymentMethodCard(
                            id: 'card_4242',
                            label: 'Visa •••• 4242',
                            icon: Icons.credit_card,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Proceed CTA
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () {
                          _syncTipState();
                          _navigateToScreen(3); // Jump to Confirm
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: CbColors.purpleMain,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 6,
                          shadowColor: CbColors.purpleMain.withValues(alpha: 0.5),
                        ),
                        child: Text(
                          'Review Tip • \$${(_tipAmountCents / 100).toStringAsFixed(2)}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTipPresetTile(int cents, String label, String? badge) {
    final isSelected = _tipAmountCents == cents;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _tipAmountCents = cents;
            _syncTipState();
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0x337C3AED) : CbColors.surface2,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? CbColors.purpleLight : CbColors.borderSubtle,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              if (badge != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  decoration: BoxDecoration(
                    color: CbColors.purpleMain,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    badge,
                    style: const TextStyle(color: Colors.white, fontSize: 7, fontWeight: FontWeight.bold),
                  ),
                )
              else
                const SizedBox(height: 11),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white70,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentMethodCard({
    required String id,
    required String label,
    required IconData icon,
  }) {
    final isSelected = _paymentMethod == id;
    return GestureDetector(
      onTap: () => setState(() => _paymentMethod = id),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0x227C3AED) : CbColors.surface2,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? CbColors.purpleLight : CbColors.borderSubtle,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: isSelected ? CbColors.purpleLight : Colors.white70, size: 18),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white70,
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: CbColors.purpleLight, size: 14),
          ],
        ),
      ),
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // SCREEN 4: CONFIRM SCREEN
  // ═════════════════════════════════════════════════════════════════════════════

  Widget _buildConfirmScreen() {
    final breakdown = StripeFeeService.instance.calculateNetTipPayout(
      grossAmountCents: _tipAmountCents,
    );
    final grossStr = '\$${(_tipAmountCents / 100).toStringAsFixed(2)}';
    final platformFeeStr = '− \$${(breakdown.platformFeeCents / 100).toStringAsFixed(2)}';
    final stripeFeeStr = '− \$${(breakdown.stripeFeeCents / 100).toStringAsFixed(2)}';
    final totalDeductionsStr = '− \$${(breakdown.totalDeductionsCents / 100).toStringAsFixed(2)}';
    final netProceedsStr = '\$${(breakdown.netAmountCents / 100).toStringAsFixed(2)}';

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        top: false,
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),

              // Back / Step header
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white70, size: 20),
                    onPressed: () => _navigateToScreen(2),
                  ),
                  const Expanded(
                    child: Text(
                      'Confirm Tip',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: CbColors.purpleDim,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text('STEP 2 OF 2', style: TextStyle(color: CbColors.purpleLight, fontSize: 9, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Performer Card Summary
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: CbColors.surface2,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: CbColors.borderSubtle),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundImage: NetworkImage(_currentPerformer.avatarUrl),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _currentPerformer.name,
                            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            _currentPerformer.venue,
                            style: const TextStyle(color: CbColors.textMuted, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    const CbLiveBadge(),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Transparent Itemized Financial Ledger Breakdown
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: CbColors.surface2,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: CbColors.borderSubtle),
                ),
                child: Column(
                  children: [
                    _buildLedgerRow('Gross tip amount', grossStr, isLarge: true),
                    const Padding(padding: EdgeInsets.symmetric(vertical: 6), child: Divider(color: Colors.white12)),
                    _buildLedgerRow('Crowdbeats technology fee (6%)', platformFeeStr),
                    const SizedBox(height: 6),
                    _buildLedgerRow('Stripe processing fee (2.9% + 30¢)', stripeFeeStr),
                    const SizedBox(height: 6),
                    _buildLedgerRow('Total deductions', totalDeductionsStr),
                    const Padding(padding: EdgeInsets.symmetric(vertical: 6), child: Divider(color: Colors.white12)),
                    _buildLedgerRow('Performer receives (net payout)', netProceedsStr, isEmerald: true),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Daily Stripe Rate verified compliance badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0x2210B981),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0x5510B981)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.verified, size: 14, color: Color(0xFF10B981)),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Verified Daily Stripe Schedule • Direct Payout to Connect Balance',
                        style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Attached Note Preview
              if (_tipNote.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: CbColors.surface2,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: CbColors.borderSubtle),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.format_quote, color: CbColors.purpleLight, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '“$_tipNote”',
                          style: const TextStyle(color: Colors.white70, fontSize: 11, fontStyle: FontStyle.italic),
                        ),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 16),

              // Payment Method summary
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: CbColors.surface2,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: CbColors.borderSubtle),
                ),
                child: Row(
                  children: [
                    Icon(
                      _paymentMethod == 'google_pay' ? Icons.account_balance_wallet : Icons.credit_card,
                      color: Colors.white,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _paymentMethod == 'google_pay' ? 'Google Pay' : 'Visa ending in 4242',
                            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                          const Text('Instant charge on confirmation', style: TextStyle(color: CbColors.textMuted, fontSize: 10)),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () => _navigateToScreen(2),
                      child: const Text('Change', style: TextStyle(color: CbColors.purpleLight, fontSize: 11)),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Confirm & Pay Primary Button
              SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: _isProcessingPay ? null : _handlePaymentConfirmation,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 6,
                    shadowColor: const Color(0xFF10B981).withValues(alpha: 0.5),
                  ),
                  child: _isProcessingPay
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                        )
                      : Text(
                          'Confirm & Pay $grossStr',
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                ),
              ),

              const SizedBox(height: 10),
              const Center(
                child: Text(
                  'By confirming you agree to Crowdbeats terms of service.',
                  style: TextStyle(color: CbColors.textMuted, fontSize: 10),
                ),
              ),

              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLedgerRow(String label, String value, {bool isLarge = false, bool isEmerald = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isLarge ? Colors.white : Colors.white70,
            fontSize: isLarge ? 13 : 11,
            fontWeight: isLarge ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: isEmerald ? const Color(0xFF10B981) : (isLarge ? Colors.white : Colors.white70),
            fontSize: isEmerald || isLarge ? 14 : 11,
            fontWeight: isEmerald || isLarge ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ],
    );
  }

  // Handle interactive payment celebration
  Future<void> _handlePaymentConfirmation() async {
    setState(() => _isProcessingPay = true);
    await Future<void>.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    setState(() {
      _isProcessingPay = false;
    });

    // Show celebration receipt modal
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF161824),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: Color(0x2210B981),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 36),
            ),
            const SizedBox(height: 16),
            const Text(
              'Tip Confirmed! 🎵',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'You successfully sent \$${(_tipAmountCents / 100).toStringAsFixed(2)} to ${_currentPerformer.name}.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF1F2230),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Transaction ID', style: TextStyle(color: Colors.white38, fontSize: 10)),
                      Text('CB-TX-98412', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Status', style: TextStyle(color: Colors.white38, fontSize: 10)),
                      Text('Settled to Ledger', style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      _navigateToScreen(0); // Return to Dashboard
                    },
                    child: const Text('Back to Dashboard', style: TextStyle(color: Colors.white70, fontSize: 11)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      _navigateToScreen(2); // Tip again
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: CbColors.purpleMain,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Tip Again', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Custom Radar Canvas Painter ───────────────────────────────────────────────

class _RadarBackgroundPainter extends CustomPainter {
  const _RadarBackgroundPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final paintLine = Paint()
      ..color = Colors.white.withValues(alpha: 0.04)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    final paintCircle = Paint()
      ..color = const Color(0xFF7C3AED).withValues(alpha: 0.08)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    // Concentric circles
    canvas.drawCircle(center, 30, paintCircle);
    canvas.drawCircle(center, 65, paintCircle);
    canvas.drawCircle(center, 100, paintCircle);

    // Grid crosshairs
    canvas.drawLine(Offset(0, center.dy), Offset(size.width, center.dy), paintLine);
    canvas.drawLine(Offset(center.dx, 0), Offset(center.dx, size.height), paintLine);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
