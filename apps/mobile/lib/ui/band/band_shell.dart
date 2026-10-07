import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/cb_colors.dart';
import 'tabs/band_home_tab.dart';
import 'tabs/band_live_tab.dart';
import 'tabs/band_campaigns_tab.dart';
import 'tabs/band_members_tab.dart';
import 'tabs/band_profile_tab.dart';

/// 5-tab shell for Band persona (Phase 8):
/// - Tab 0: Home
/// - Tab 1: Live
/// - Tab 2: Campaigns
/// - Tab 3: Members
/// - Tab 4: Profile
class BandShell extends ConsumerStatefulWidget {
  const BandShell({super.key});

  @override
  ConsumerState<BandShell> createState() => _BandShellState();
}

class _BandShellState extends ConsumerState<BandShell>
    with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  late final AnimationController _pulseController;

  static const _tabs = <Widget>[
    BandHomeTab(),
    BandLiveTab(),
    BandCampaignsTab(),
    BandMembersTab(),
    BandProfileTab(),
  ];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.surfaceBase,
      body: IndexedStack(
        index: _currentIndex,
        children: _tabs,
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: AnimatedBuilder(
        animation: _pulseController,
        builder: (context, child) {
          final scale = 1.0 + (_pulseController.value * 0.08);
          return Transform.scale(
            scale: scale,
            child: FloatingActionButton(
              heroTag: 'band_go_live_fab',
              backgroundColor: CbColors.accentPrimary,
              foregroundColor: Colors.black,
              shape: const CircleBorder(),
              onPressed: () {
                setState(() => _currentIndex = 1); // switch to Live tab
              },
              child: const Icon(Icons.mic, size: 28),
            ),
          );
        },
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        backgroundColor: CbColors.surfaceCard,
        indicatorColor: CbColors.surfaceRaised,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined, color: CbColors.textSecondary),
            selectedIcon: Icon(Icons.home, color: CbColors.accentPrimary),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.radio_outlined, color: CbColors.textSecondary),
            selectedIcon: Icon(Icons.radio, color: CbColors.accentPrimary),
            label: 'Live',
          ),
          NavigationDestination(
            icon: Icon(Icons.rocket_launch_outlined, color: CbColors.textSecondary),
            selectedIcon: Icon(Icons.rocket_launch, color: CbColors.accentPrimary),
            label: 'Campaigns',
          ),
          NavigationDestination(
            icon: Icon(Icons.group_outlined, color: CbColors.textSecondary),
            selectedIcon: Icon(Icons.group, color: CbColors.accentPrimary),
            label: 'Members',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline, color: CbColors.textSecondary),
            selectedIcon: Icon(Icons.person, color: CbColors.accentPrimary),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
