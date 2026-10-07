// Crowdbeats V2 — Creator Studio 20-Capability Configuration Hub (Phase 2)
// Full capability repository structured across 5 distinct categories.
// Adapts dynamically for Solo Musician and Band contexts.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../state/creator_context_state.dart';
import '../../components/components.dart';
import '../profile/creator_epk_editor_screen.dart';
import '../profile/creator_social_links_screen.dart';
import '../media/creator_media_screen.dart';
import '../finance/stripe_connect_kyc_screen.dart';
import '../finance/creator_balances_screen.dart';
import '../finance/creator_payout_history_screen.dart';
import '../band/band_split_editor_screen.dart';
import '../fans/creator_fans_screen.dart';
import '../analytics/creator_analytics_screen.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';

class CreatorStudioTab extends ConsumerWidget {
  const CreatorStudioTab({super.key});

  void _showCapabilityPlaceholder(BuildContext context, String title, int phase) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: CbColors.surfaceCard,
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
                  Text(
                    title,
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54, size: 20),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0x228B5CF6),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Scheduled for Phase $phase Implementation',
                  style: const TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'This Creator Studio module will connect to its production backend handlers during its dedicated phase.',
                style: TextStyle(color: CbColors.textSecondary, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 16),
              CbButton(
                label: 'Close Preview',
                fullWidth: true,
                onPressed: () => Navigator.of(ctx).pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contextState = ref.watch(creatorContextProvider);
    final isBand = contextState.isBand;

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          CbGlassCard(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Icon(
                  isBand ? Icons.groups : Icons.mic_external_on,
                  color: isBand ? CbColors.tealGas : CbColors.purpleLight,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isBand ? 'Band Studio Configuration' : 'Solo Creator Studio',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Text(
                        'Active: ${contextState.activeContext.name}',
                        style: const TextStyle(color: CbColors.textSecondary, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          _sectionHeader('1. PROFILE & BRANDING'),
          _menuTile(
            context,
            icon: Icons.badge_outlined,
            title: 'Public EPK Profile Editor',
            subtitle: 'Bio, genres, photo, banner & social handles',
            phase: 5,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(builder: (_) => const CreatorEpkEditorScreen()),
            ),
          ),
          _menuTile(
            context,
            icon: Icons.photo_library_outlined,
            title: 'Media Library & Photos',
            subtitle: 'Manage stage photography and promotional tracks',
            phase: 5,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => CreatorMediaScreen(
                  isBand: isBand,
                  entityId: contextState.activeContext.id,
                  entityName: contextState.activeContext.name,
                ),
              ),
            ),
          ),
          _menuTile(
            context,
            icon: Icons.link_outlined,
            title: 'Streaming & Social Links',
            subtitle: 'Spotify, Apple Music, Instagram, YouTube links',
            phase: 5,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => CreatorSocialLinksScreen(
                  isBand: isBand,
                  entityId: contextState.activeContext.id,
                  entityName: contextState.activeContext.name,
                ),
              ),
            ),
          ),
          _menuTile(
            context,
            icon: Icons.verified_user_outlined,
            title: 'Verification & Trust Badges',
            subtitle: 'Identity verification status and official badges',
            phase: 5,
          ),
          const SizedBox(height: 16),

          _sectionHeader('2. MONETIZATION & FINANCE'),
          _menuTile(
            context,
            icon: Icons.account_balance_outlined,
            title: 'Payouts & Stripe Connect KYC',
            subtitle: 'Direct deposit bank accounts & verification status',
            phase: 6,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(builder: (_) => const StripeConnectKycScreen()),
            ),
          ),
          _menuTile(
            context,
            icon: Icons.account_balance_wallet_outlined,
            title: 'Double-Entry Ledger Balances',
            subtitle: 'Available vs pending ledger funds & reconciliation',
            phase: 6,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => CreatorBalancesScreen(
                  isBand: isBand,
                  entityId: contextState.activeContext.id,
                  entityName: contextState.activeContext.name,
                ),
              ),
            ),
          ),
          _menuTile(
            context,
            icon: Icons.receipt_long_outlined,
            title: 'Tip History & Official Receipts',
            subtitle: 'Settled tips, donor statements & 1099 summaries',
            phase: 6,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(builder: (_) => const CreatorPayoutHistoryScreen()),
            ),
          ),
          if (isBand)
            _menuTile(
              context,
              icon: Icons.pie_chart_outline,
              title: 'Band Split Governance',
              subtitle: 'Multi-member percentage splits & payout contracts',
              phase: 7,
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const BandSplitEditorScreen()),
              ),
            ),
          const SizedBox(height: 16),

          _sectionHeader('3. AUDIENCE & MARKETING'),
          _menuTile(
            context,
            icon: Icons.favorite_border,
            title: 'Fan Directory & Top Tippers',
            subtitle: 'Leaderboard of top supporters & follower list',
            phase: 7,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => CreatorFansScreen(
                  isBand: isBand,
                  entityId: contextState.activeContext.id,
                  entityName: contextState.activeContext.name,
                ),
              ),
            ),
          ),
          _menuTile(
            context,
            icon: Icons.bar_chart_outlined,
            title: 'Performance & Venue Analytics',
            subtitle: 'Attendance, tip trends, earnings per show',
            phase: 9,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => CreatorAnalyticsScreen(
                  isBand: isBand,
                  entityId: contextState.activeContext.id,
                  entityName: contextState.activeContext.name,
                ),
              ),
            ),
          ),
          _menuTile(
            context,
            icon: Icons.qr_code_2_outlined,
            title: 'Share Tools & Stage QR Generator',
            subtitle: 'Printable stage tokens, profile links & flyers',
            phase: 5,
          ),
          _menuTile(
            context,
            icon: Icons.calendar_today_outlined,
            title: 'Events & Tour Schedule',
            subtitle: 'Upcoming venue performances & gig calendar',
            phase: 9,
          ),
          const SizedBox(height: 16),

          if (isBand) ...[
            _sectionHeader('4. COLLABORATION & GOVERNANCE'),
            _menuTile(
              context,
              icon: Icons.group_outlined,
              title: 'Band Members & Roles',
              subtitle: 'Founders, Admins, Members & invitation queue',
              phase: 10,
            ),
            _menuTile(
              context,
              icon: Icons.checklist_outlined,
              title: 'Ownership Approvals Queue',
              subtitle: 'Multi-signature payout & contract authorizations',
              phase: 10,
            ),
            _menuTile(
              context,
              icon: Icons.history_edu_outlined,
              title: 'Band Activity & Audit Log',
              subtitle: 'Immutable record of member & split modifications',
              phase: 10,
            ),
            const SizedBox(height: 16),
          ],

          _sectionHeader('5. SETTINGS & SUPPORT'),
          _menuTile(
            context,
            icon: Icons.notifications_none_outlined,
            title: 'Notification Preferences',
            subtitle: 'Instant tip alerts, campaign milestones & messages',
            phase: 7,
          ),
          _menuTile(
            context,
            icon: Icons.lock_outline,
            title: 'Account Security & Sessions',
            subtitle: 'Biometrics, active device sessions & password',
            phase: 2,
          ),
          _menuTile(
            context,
            icon: Icons.privacy_tip_outlined,
            title: 'Data Privacy & Exports',
            subtitle: 'GDPR / CCPA data export & retention settings',
            phase: 2,
          ),
          _menuTile(
            context,
            icon: Icons.help_outline,
            title: 'Help Center & Support Tickets',
            subtitle: 'Live creator support, dispute assistance & FAQ',
            phase: 2,
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 4),
      child: Text(
        title,
        style: const TextStyle(
          color: CbColors.textSecondary,
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _menuTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required int phase,
    VoidCallback? onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: CbGlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        onTap: onTap ?? () => _showCapabilityPlaceholder(context, title, phase),
        semanticLabel: title,
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: const Color(0x228B5CF6),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: CbColors.purpleLight, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(color: CbColors.textMuted, fontSize: 11),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white38, size: 18),
          ],
        ),
      ),
    );
  }
}
