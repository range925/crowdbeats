// Crowdbeats V2 — Shared Creator Mobile Shell (Phase 2)
// Unified 5-Tab Navigation Skeleton for Solo Musicians and Bands.
// Stitch Vivid Resonance Design Anchor (5326179813018056505).

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../state/creator_context_state.dart';
import '../components/components.dart';
import 'dashboard/creator_home_tab.dart';
import 'live/creator_live_tab.dart';
import 'campaigns/creator_campaigns_tab.dart';
import 'fans/creator_fans_tab.dart';
import 'studio/creator_studio_tab.dart';
import '../theme/cb_colors.dart';

class CreatorShell extends ConsumerStatefulWidget {
  const CreatorShell({
    super.key,
    this.initialTab = 0,
  });

  final int initialTab;

  @override
  ConsumerState<CreatorShell> createState() => _CreatorShellState();
}

class _CreatorShellState extends ConsumerState<CreatorShell> {
  late int _currentTab;

  @override
  void initState() {
    super.initState();
    _currentTab = widget.initialTab.clamp(0, 4);
  }

  void _onTabSelected(int index) {
    if (index == _currentTab) return;
    setState(() => _currentTab = index);
  }

  @override
  Widget build(BuildContext context) {
    final contextState = ref.watch(creatorContextProvider);
    final contextNotifier = ref.read(creatorContextProvider.notifier);
    final isLive = contextState.activeContext.hasActiveLiveSession;

    ref.listen<CreatorContextState>(creatorContextProvider, (prev, next) {
      if (next.conflictError != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: CbColors.statusError,
            content: Text(next.conflictError!),
            action: SnackBarAction(
              label: 'Dismiss',
              textColor: Colors.white,
              onPressed: () => contextNotifier.clearConflictError(),
            ),
          ),
        );
      }
    });

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        elevation: 0,
        automaticallyImplyLeading: false,
        titleSpacing: 16,
        title: CbContextSwitcherPill(
          activeContext: contextState.activeContext,
          availableContexts: contextState.availableContexts,
          onSelectContext: (newContext) {
            contextNotifier.switchContext(newContext);
          },
        ),
        actions: [
          if (isLive)
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: CbColors.statusLive,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.circle, color: Colors.black, size: 8),
                  SizedBox(width: 4),
                  Text('LIVE', style: TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.w800)),
                ],
              ),
            ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: Colors.white),
            tooltip: 'Activity & Alerts',
            onPressed: () {
              setState(() => _currentTab = 3);
            },
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16, left: 4),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: CbColors.purpleDim,
              child: Text(
                contextState.isSolo ? 'EC' : 'ME',
                style: const TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentTab,
        children: [
          const CreatorHomeTab(),
          const CreatorLiveTab(),
          const CreatorCampaignsTab(),
          CreatorFansTab(
            isBand: !contextState.isSolo,
            entityId: contextState.activeContext.id,
            entityName: contextState.activeContext.name,
          ),
          const CreatorStudioTab(),
        ],
      ),
      floatingActionButton: _currentTab == 0
          ? FloatingActionButton.extended(
              backgroundColor: isLive ? CbColors.tealGas : CbColors.purpleMain,
              foregroundColor: isLive ? Colors.black : Colors.white,
              icon: Icon(isLive ? Icons.qr_code_2 : Icons.location_on),
              label: Text(
                isLive ? 'Present QR' : 'Go Live',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              onPressed: () {
                setState(() => _currentTab = 1);
              },
            )
          : null,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: CbColors.surfaceBase,
          border: Border(top: BorderSide(color: Color(0x1AFFFFFF), width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentTab,
          onTap: _onTabSelected,
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.transparent,
          selectedItemColor: CbColors.purpleLight,
          unselectedItemColor: CbColors.textMuted,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.radio_button_checked_outlined),
              activeIcon: Icon(Icons.radio_button_checked),
              label: 'Live',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.rocket_launch_outlined),
              activeIcon: Icon(Icons.rocket_launch),
              label: 'Campaigns',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.inbox_outlined),
              activeIcon: Icon(Icons.inbox),
              label: 'Inbox',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.tune_outlined),
              activeIcon: Icon(Icons.tune),
              label: 'Studio',
            ),
          ],
        ),
      ),
    );
  }
}
