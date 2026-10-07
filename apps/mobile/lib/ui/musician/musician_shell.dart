// Crowdbeats V2 — Musician Shell (Phase 7)
//
// Five-tab NavigationBar for Musician persona:
// Home · Live · Campaigns · Fans · Profile
//
// Context-aware Go Live FAB:
//   - No session → pink pulsing FAB "Go Live"
//   - Active session → green FAB "Live ·" → opens SessionActiveSheet
//
// Each tab preserved via IndexedStack (same pattern as FanShell).

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../theme/cb_colors.dart';
import '../../state/musician_state.dart';
import 'tabs/musician_home_tab.dart';
import 'tabs/musician_live_tab.dart';
import 'tabs/musician_campaigns_tab.dart';
import 'tabs/musician_fans_tab.dart';
import 'tabs/musician_profile_tab.dart';
import 'live/session_active_sheet.dart';

class MusicianShell extends ConsumerStatefulWidget {
  const MusicianShell({super.key});

  @override
  ConsumerState<MusicianShell> createState() => _MusicianShellState();
}

class _MusicianShellState extends ConsumerState<MusicianShell>
    with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;
  late final AnimationController _fabPulse;

  static const _tabs = <Widget>[
    MusicianHomeTab(),
    MusicianLiveTab(),
    MusicianCampaignsTab(),
    MusicianFansTab(),
    MusicianProfileTab(),
  ];

  static const _navItems = <NavigationDestination>[
    NavigationDestination(
      icon: Icon(Icons.home_outlined),
      selectedIcon: Icon(Icons.home),
      label: 'Home',
    ),
    NavigationDestination(
      icon: Icon(Icons.radio_button_unchecked),
      selectedIcon: Icon(Icons.radio_button_checked),
      label: 'Live',
    ),
    NavigationDestination(
      icon: Icon(Icons.campaign_outlined),
      selectedIcon: Icon(Icons.campaign),
      label: 'Campaigns',
    ),
    NavigationDestination(
      icon: Icon(Icons.people_outline),
      selectedIcon: Icon(Icons.people),
      label: 'Fans',
    ),
    NavigationDestination(
      icon: Icon(Icons.person_outline),
      selectedIcon: Icon(Icons.person),
      label: 'Profile',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _fabPulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _fabPulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(musicianSessionProvider);
    final isActive = session.isActive;

    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _tabs,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) => setState(() => _selectedIndex = index),
        destinations: _navItems,
        backgroundColor: CbColors.surfaceCard,
        indicatorColor: CbColors.accentPrimary.withAlpha(30),
        labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
      ),
      floatingActionButton: _GoLiveFab(
        isActive: isActive,
        pulseController: _fabPulse,
        onTap: isActive
            ? () => showSessionActiveSheet(context)
            : () {
                // Navigate to Live tab (index 1)
                setState(() => _selectedIndex = 1);
              },
      ),
    );
  }
}

// ── Go Live FAB ───────────────────────────────────────────────────────────────

class _GoLiveFab extends AnimatedWidget {
  const _GoLiveFab({
    required AnimationController pulseController,
    required this.isActive,
    required this.onTap,
  }) : super(listenable: pulseController);

  final bool isActive;
  final VoidCallback onTap;

  AnimationController get _controller => listenable as AnimationController;

  @override
  Widget build(BuildContext context) {
    final fabColor = isActive ? CbColors.statusSuccess : CbColors.accentPrimary;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (_, child) {
          final v = CurvedAnimation(parent: _controller, curve: Curves.easeInOut).value;
          return Stack(
          alignment: Alignment.center,
          children: [
            // Pulse ring (only when idle / no session)
            if (!isActive)
              Container(
                width: 68 + (v * 16),
                height: 68 + (v * 16),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: CbColors.accentPrimary.withAlpha((40 * (1 - v)).toInt()),
                ),
              ),
            // FAB
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: fabColor,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: fabColor.withAlpha(80),
                    blurRadius: 12,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Center(
                child: isActive
                    ? const Column(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.graphic_eq, color: Colors.white, size: 20),
                        Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                      ])
                    : const Icon(Icons.play_arrow, color: Colors.white, size: 28),
              ),
            ),
          ],
          );
        },
      ),
    );
  }
}
