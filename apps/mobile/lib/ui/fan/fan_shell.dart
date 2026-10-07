// Crowdbeats V2 — Fan & Guest Shell (Phase 1 Compliant)
//
// Unauthenticated Guest Mode: Exactly 3 destinations (Nearby, Discover, Account)
// Authenticated Fan Mode: Full 5 destinations (Home, Nearby, Tip CTA, Activity, Profile)

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../state/auth_state.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import '../guest/guest_account_screen.dart';
import 'public_discovery_home.dart';
import 'tabs/home_tab.dart';
import 'tabs/nearby_tab.dart';
import 'tabs/tip_tab.dart';
import 'tabs/activity_tab.dart';
import 'tabs/profile_tab.dart';

class FanShell extends ConsumerStatefulWidget {
  const FanShell({super.key});

  @override
  ConsumerState<FanShell> createState() => _FanShellState();
}

class _FanShellState extends ConsumerState<FanShell> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final isGuest = authState.status != CbAuthStatus.authenticated;

    // Tabs definition based on auth mode
    final tabs = isGuest
        ? const <Widget>[
            PublicDiscoveryHome(), // 0: Nearby (Default Guest home)
            NearbyTab(),           // 1: Discover
            GuestAccountScreen(),  // 2: Account
          ]
        : const <Widget>[
            HomeTab(),             // 0: Home (Fan Dashboard)
            NearbyTab(),           // 1: Nearby
            TipTab(),              // 2: Tip
            ActivityTab(),         // 3: Activity
            ProfileTab(),          // 4: Profile
          ];

    // Ensure selected index is within bounds
    final safeIndex = _selectedIndex >= tabs.length ? 0 : _selectedIndex;

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: Stack(
        children: [
          IndexedStack(
            index: safeIndex,
            children: tabs,
          ),
          // Glassmorphic Floating Bottom Navigation Bar
          Positioned(
            left: 16,
            right: 16,
            bottom: 20,
            child: _buildFloatingNavBar(isGuest: isGuest, currentIndex: safeIndex),
          ),
        ],
      ),
    );
  }

  Widget _buildFloatingNavBar({required bool isGuest, required int currentIndex}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: 64,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: const Color(0xCC151722),
            borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
            border: Border.all(
              color: const Color(0x2BFFFFFF),
              width: 1,
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x66000000),
                blurRadius: 24,
                spreadRadius: 2,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: isGuest
              ? _buildGuestNavItems(currentIndex)
              : _buildFanNavItems(currentIndex),
        ),
      ),
    );
  }

  /// Exactly 3 bottom-navigation destinations in Guest mode:
  /// 1. Nearby, 2. Discover, 3. Account
  Widget _buildGuestNavItems(int currentIndex) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _buildNavItem(0, currentIndex, Icons.explore_outlined, Icons.explore, 'Nearby'),
        _buildNavItem(1, currentIndex, Icons.search_outlined, Icons.search, 'Discover'),
        _buildNavItem(2, currentIndex, Icons.person_outline, Icons.person, 'Account'),
      ],
    );
  }

  /// Full 5 destinations for authenticated Fan mode
  Widget _buildFanNavItems(int currentIndex) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _buildNavItem(0, currentIndex, Icons.home_outlined, Icons.home, 'Home'),
        _buildNavItem(1, currentIndex, Icons.explore_outlined, Icons.explore, 'Nearby'),
        _buildCenterTipButton(),
        _buildNavItem(3, currentIndex, Icons.notifications_none, Icons.notifications, 'Activity'),
        _buildNavItem(4, currentIndex, Icons.person_outline, Icons.person, 'Profile'),
      ],
    );
  }

  Widget _buildNavItem(int index, int currentIndex, IconData icon, IconData activeIcon, String label) {
    final bool isSelected = currentIndex == index;

    return Semantics(
      button: true,
      selected: isSelected,
      label: label,
      child: GestureDetector(
        onTap: () => setState(() => _selectedIndex = index),
        behavior: HitTestBehavior.opaque,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isSelected ? activeIcon : icon,
                color: isSelected ? CbColors.purpleLight : CbColors.textMuted,
                size: 22,
              ),
              const SizedBox(height: 3),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : CbColors.textMuted,
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCenterTipButton() {
    return Semantics(
      button: true,
      label: 'Tip Performer',
      child: GestureDetector(
        onTap: () => setState(() => _selectedIndex = 2),
        child: Container(
          width: 48,
          height: 48,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: CbColors.primaryGradient,
            boxShadow: [
              BoxShadow(
                color: CbColors.purpleGlow,
                blurRadius: 16,
                spreadRadius: 1,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: const Center(
            child: Icon(
              Icons.favorite,
              color: Colors.white,
              size: 24,
            ),
          ),
        ),
      ),
    );
  }
}
