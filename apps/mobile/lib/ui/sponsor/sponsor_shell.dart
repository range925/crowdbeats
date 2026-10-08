// Crowdbeats V2 — Sponsor Mobile Shell
// Persistent glassmorphic bottom navigation with 5 tabs (Home, Discover, Sponsorships, Messages, Profile),
// contextual header with organization logo, tier pill, notifications, and context switcher.
// Adheres strictly to SPONSOR_MOBILE_SPEC.md and DESIGN_SYSTEM_SPEC.md.

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../persona/persona_switcher_sheet.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import 'state/sponsor_state.dart';
import 'tabs/sponsor_discover_tab.dart';
import 'tabs/sponsor_home_tab.dart';
import 'tabs/sponsor_messages_tab.dart';
import 'tabs/sponsor_profile_tab.dart';
import 'tabs/sponsor_sponsorships_tab.dart';

class SponsorShell extends ConsumerStatefulWidget {
  const SponsorShell({
    super.key,
    this.initialTab = 0,
  });

  final int initialTab;

  @override
  ConsumerState<SponsorShell> createState() => _SponsorShellState();
}

class _SponsorShellState extends ConsumerState<SponsorShell> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTab.clamp(0, 4);
  }

  void _onTabSelected(int index) {
    if (_currentIndex == index) return;
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(sponsorProvider);
    final activeContext = state.activeContext;
    final totalUnread = state.totalUnreadMessages;

    final tabs = <Widget>[
      SponsorHomeTab(onNavigateToTab: _onTabSelected),
      const SponsorDiscoverTab(),
      const SponsorSponsorshipsTab(),
      const SponsorMessagesTab(),
      SponsorProfileTab(
        onOpenPersonaSwitcher: () => _openPersonaSwitcher(context),
      ),
    ];

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(64),
        child: _buildContextualHeader(context, activeContext, state.availableContexts),
      ),
      body: Stack(
        children: [
          IndexedStack(
            index: _currentIndex,
            children: tabs,
          ),
          // Floating Glassmorphic Bottom Navigation
          Positioned(
            left: 16,
            right: 16,
            bottom: 20,
            child: _buildFloatingBottomNav(currentIndex: _currentIndex, unreadCount: totalUnread),
          ),
        ],
      ),
    );
  }

  Widget _buildContextualHeader(
    BuildContext context,
    SponsorContextItem activeContext,
    List<SponsorContextItem> availableContexts,
  ) {
    return Container(
      decoration: const BoxDecoration(
        color: CbColors.surface1,
        border: Border(
          bottom: BorderSide(color: Color(0x1AFFFFFF), width: 1),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4, vertical: 8),
          child: Row(
            children: [
              // Organization Brand Logo / Initials
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  gradient: CbColors.primaryGradient,
                  borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                  boxShadow: const [
                    BoxShadow(
                      color: CbColors.purpleGlow,
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    activeContext.logoInitials,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

              const SizedBox(width: CbSpacing.s3),

              // Organization Name & Context Switcher Pill
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Interactive Context Switcher
                    GestureDetector(
                      onTap: () => _openContextSwitcherModal(context, activeContext, availableContexts),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              activeContext.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.keyboard_arrow_down, color: Colors.white70, size: 16),
                        ],
                      ),
                    ),
                    const SizedBox(height: 2),
                    // Sponsor Tier Pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: CbColors.purpleDim,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                        border: Border.all(color: const Color(0x338B5CF6)),
                      ),
                      child: Text(
                        activeContext.tier.toUpperCase(),
                        style: const TextStyle(
                          color: CbColors.purpleLight,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Notifications Icon Button (Min 48x48dp touch target)
              Semantics(
                button: true,
                label: 'Sponsor Notifications',
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: IconButton(
                    icon: const Icon(Icons.notifications_outlined, color: Colors.white, size: 22),
                    tooltip: 'Sponsor Notifications',
                    onPressed: () {
                      _showNotificationsSheet(context);
                    },
                  ),
                ),
              ),

              // Persona Switcher Trigger Button (Min 48x48dp touch target)
              Semantics(
                button: true,
                label: 'Switch Persona',
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: IconButton(
                    icon: const Icon(Icons.swap_horiz, color: CbColors.purpleLight, size: 22),
                    tooltip: 'Switch Persona',
                    onPressed: () => _openPersonaSwitcher(context),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFloatingBottomNav({
    required int currentIndex,
    required int unreadCount,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: 64,
          padding: const EdgeInsets.symmetric(horizontal: 8),
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
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(0, currentIndex, Icons.home_outlined, Icons.home, 'Home'),
              _buildNavItem(1, currentIndex, Icons.search_outlined, Icons.search, 'Discover'),
              _buildNavItem(2, currentIndex, Icons.handshake_outlined, Icons.handshake, 'Deals'),
              _buildNavItem(
                3,
                currentIndex,
                Icons.chat_bubble_outline,
                Icons.chat_bubble,
                'Messages',
                badgeCount: unreadCount,
              ),
              _buildNavItem(4, currentIndex, Icons.business_outlined, Icons.business, 'Profile'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    int index,
    int currentIndex,
    IconData icon,
    IconData activeIcon,
    String label, {
    int? badgeCount,
  }) {
    final isSelected = currentIndex == index;

    return Semantics(
      button: true,
      selected: isSelected,
      label: label,
      child: GestureDetector(
        onTap: () => _onTabSelected(index),
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(
                    isSelected ? activeIcon : icon,
                    color: isSelected ? CbColors.purpleLight : CbColors.textMuted,
                    size: 22,
                  ),
                  if (badgeCount != null && badgeCount > 0)
                    Positioned(
                      right: -8,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: CbColors.purpleMain,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                        ),
                        child: Text(
                          badgeCount.toString(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 3),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : CbColors.textMuted,
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openContextSwitcherModal(
    BuildContext context,
    SponsorContextItem activeContext,
    List<SponsorContextItem> availableContexts,
  ) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(CbSpacing.s5),
        decoration: const BoxDecoration(
          color: CbColors.surface1,
          borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
          border: Border(top: BorderSide(color: Color(0x338B5CF6), width: 1.5)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Switch Brand Entity',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Select between your active brand sponsorship portfolios under your organization account.',
                style: TextStyle(color: CbColors.textSecondary, fontSize: 12),
              ),
              const SizedBox(height: CbSpacing.s4),
              ...availableContexts.map((contextItem) {
                final isSelected = contextItem.id == activeContext.id;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0x228B5CF6) : CbColors.surface2,
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    border: Border.all(
                      color: isSelected ? CbColors.purpleLight : const Color(0x14FFFFFF),
                      width: isSelected ? 1.5 : 1.0,
                    ),
                  ),
                  child: ListTile(
                    leading: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: CbColors.purpleDim,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                      ),
                      child: Center(
                        child: Text(
                          contextItem.logoInitials,
                          style: const TextStyle(
                            color: CbColors.purpleLight,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                    title: Text(
                      contextItem.name,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    subtitle: Text(
                      '${contextItem.tier} · ${contextItem.industry}',
                      style: const TextStyle(color: CbColors.textMuted, fontSize: 11),
                    ),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle, color: CbColors.purpleLight, size: 20)
                        : null,
                    onTap: () {
                      Navigator.of(ctx).pop();
                      if (!isSelected) {
                        ref.read(sponsorProvider.notifier).switchContext(contextItem);
                      }
                    },
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  void _showNotificationsSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(CbSpacing.s5),
        decoration: const BoxDecoration(
          color: CbColors.surface1,
          borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
          border: Border(top: BorderSide(color: Color(0x338B5CF6), width: 1)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Sponsor Notifications', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close, color: Colors.white54), onPressed: () => Navigator.of(ctx).pop()),
                ],
              ),
              const SizedBox(height: CbSpacing.s3),
              _buildNotificationTile(
                icon: Icons.event,
                title: 'Showtime in 3 hours',
                desc: 'Luna & The Echoes start at Empire Control Room. Stage banners confirmed.',
                time: 'Just now',
              ),
              _buildNotificationTile(
                icon: Icons.task_alt,
                title: 'Milestone Payout Released',
                desc: '50% upfront deposit sent for Velvet Horizon East Coast Residency.',
                time: '2h ago',
              ),
              _buildNotificationTile(
                icon: Icons.description,
                title: 'Contract Executed',
                desc: 'Kai Rivera counter-offer agreement signed by both parties.',
                time: 'Yesterday',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationTile({
    required IconData icon,
    required String title,
    required String desc,
    required String time,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: CbColors.surface2,
              borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
            ),
            child: Icon(icon, color: CbColors.purpleLight, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                    Text(time, style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
                  ],
                ),
                const SizedBox(height: 2),
                Text(desc, style: const TextStyle(color: CbColors.textSecondary, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _openPersonaSwitcher(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const PersonaSwitcherSheet(),
    );
  }
}
