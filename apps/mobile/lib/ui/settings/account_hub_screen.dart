// Crowdbeats V2 — Account Settings Hub Screen
//
// Authoritative Design: Google Stitch Project 5326179813018056505 ("Vivid Resonance")
// Inspired by clean consumer organization:
// - Prominent Profile Header at top with verified badge & persona switcher
// - Full-width menu rows with recognizable leading theme icons
// - Role-aware sections: Your Crowdbeats, Money & Payouts, Creator Tools, Sponsor Tools, Account, Preferences, Trust & Safety, Legal, Session & Danger Zone

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../state/auth_state.dart';
import '../theme/cb_colors.dart';
import '../components/cb_settings_row.dart';
import '../persona/persona_switcher_sheet.dart';

class AccountHubScreen extends ConsumerWidget {
  const AccountHubScreen({super.key});

  String _formatPersona(String? persona) {
    if (persona == null) return 'Fan';
    switch (persona) {
      case 'artist':        return 'Solo Musician';
      case 'band_member':   return 'Band Member';
      case 'venue_manager': return 'Venue Manager';
      case 'sponsor_rep':   return 'Sponsor Rep';
      case 'admin':         return 'Platform Administrator';
      default:              return 'Fan';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    final persona = auth.personaType ?? 'fan';
    final isMusician = persona == 'artist' || persona == 'band_member';
    final isSponsor = persona == 'sponsor_rep';
    final displayName = auth.displayName ?? 'David Naufahu';
    final email = auth.email ?? 'crowdbeatsllc@gmail.com';

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        title: const Text(
          'Account Settings',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: CbColors.bgApp,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── A. PROFILE HEADER ────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    // Avatar with gradient border
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: CbColors.primaryGradient,
                        boxShadow: const [
                          BoxShadow(
                            color: CbColors.purpleDim,
                            blurRadius: 16,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(2),
                      child: CircleAvatar(
                        radius: 30,
                        backgroundColor: const Color(0xFF151722),
                        child: Text(
                          displayName.isNotEmpty ? displayName[0].toUpperCase() : 'C',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),

                    // Info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  displayName,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 19,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: -0.2,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Icon(
                                Icons.verified,
                                color: CbColors.verifiedBlue,
                                size: 18,
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          Text(
                            email,
                            style: const TextStyle(
                              color: CbColors.textSecondary,
                              fontSize: 12,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: CbColors.purpleDim,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: CbColors.purpleMain.withValues(alpha: 0.5)),
                                ),
                                child: Text(
                                  _formatPersona(persona),
                                  style: const TextStyle(
                                    color: CbColors.purpleLight,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                '• Member since 2024',
                                style: TextStyle(color: Colors.white38, fontSize: 11),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Header Action Chips
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.swap_horiz, size: 18, color: CbColors.purpleLight),
                        label: const Text('Switch Persona', style: TextStyle(fontSize: 13)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: CbColors.borderSubtle),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () => showModalBottomSheet<void>(
                          context: context,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const PersonaSwitcherSheet(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.edit_outlined, size: 18, color: Colors.white70),
                        label: const Text('Edit Profile', style: TextStyle(fontSize: 13)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: CbColors.borderSubtle),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () => context.push('/account/personal-info'),
                      ),
                    ),
                  ],
                ),
              ),

              // ── B. YOUR CROWDBEATS ────────────────────────────────────────────────
              CbSettingsSection(
                title: 'Your Crowdbeats',
                children: [
                  CbSettingsRow(
                    title: 'Personas & Profiles',
                    subtitle: 'Manage multi-persona identities and switch dashboard roles',
                    icon: Icons.people_outline,
                    iconColor: CbColors.purpleLight,
                    onTap: () => showModalBottomSheet<void>(
                      context: context,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const PersonaSwitcherSheet(),
                    ),
                  ),
                  CbSettingsRow(
                    title: 'Saved Artists & Bands',
                    subtitle: 'Bookmarks, favorited live stages, and followed musicians',
                    icon: Icons.favorite_border,
                    iconColor: CbColors.heartPink,
                    onTap: () => context.push('/fan'),
                  ),
                  CbSettingsRow(
                    title: 'Tip & Contribution History',
                    subtitle: 'Receipts, campaign pledges, and transaction history',
                    icon: Icons.receipt_long_outlined,
                    iconColor: CbColors.liveGreen,
                    onTap: () => context.push('/account/payment-methods'),
                  ),
                ],
              ),

              // ── C. MONEY & PAYMENTS ───────────────────────────────────────────────
              CbSettingsSection(
                title: 'Money & Payments',
                children: [
                  CbSettingsRow(
                    title: 'Payment Methods',
                    subtitle: 'Saved cards and billing methods via Stripe',
                    icon: Icons.credit_card_outlined,
                    iconColor: CbColors.purpleLight,
                    valueText: '2 cards',
                    onTap: () => context.push('/account/payment-methods'),
                  ),
                  CbSettingsRow(
                    title: 'Tipping Preferences',
                    subtitle: 'Preset amounts, currency, and 1-tap tipping options',
                    icon: Icons.volunteer_activism_outlined,
                    iconColor: CbColors.rankGold,
                    valueText: 'USD',
                    onTap: () => context.push('/account/tipping-preferences'),
                  ),
                  if (isMusician) ...[
                    CbSettingsRow(
                      title: 'Stripe Connect Payouts',
                      subtitle: 'Bank destination, express account, and payout history',
                      icon: Icons.account_balance_outlined,
                      iconColor: CbColors.liveGreen,
                      statusBadge: 'Active',
                      statusBadgeColor: CbColors.liveGreen,
                      onTap: () => context.push('/artist'),
                    ),
                    CbSettingsRow(
                      title: 'Band Payment Splits',
                      subtitle: 'Automated revenue-split percentages among members',
                      icon: Icons.pie_chart_outline,
                      iconColor: CbColors.gpsBlue,
                      onTap: () => context.push('/band_member'),
                    ),
                  ],
                  if (isSponsor) ...[
                    CbSettingsRow(
                      title: 'Sponsorship Escrow & Billing',
                      subtitle: 'Match pools, campaign budgets, and tax invoices',
                      icon: Icons.account_balance_wallet_outlined,
                      iconColor: CbColors.gpsBlue,
                      onTap: () => context.push('/sponsor_rep'),
                    ),
                  ],
                ],
              ),

              // ── D. CREATOR TOOLS (Role-aware) ─────────────────────────────────────
              if (isMusician) ...[
                CbSettingsSection(
                  title: 'Artist & Band Tools',
                  children: [
                    CbSettingsRow(
                      title: 'Live Performance Settings',
                      subtitle: 'Geofence radius, default stage preset, and broadcast alerts',
                      icon: Icons.sensors,
                      iconColor: CbColors.liveGreen,
                      onTap: () => context.push('/artist'),
                    ),
                    CbSettingsRow(
                      title: 'QR Tip Code Settings',
                      subtitle: 'Custom branded QR code and printable stand PDF exporter',
                      icon: Icons.qr_code_2,
                      iconColor: CbColors.purpleLight,
                      onTap: () => context.push('/artist'),
                    ),
                    CbSettingsRow(
                      title: 'Band Roster & Roles',
                      subtitle: 'Manage members, permissions, and invitations',
                      icon: Icons.group_work_outlined,
                      iconColor: CbColors.gpsBlue,
                      onTap: () => context.push('/band_member'),
                    ),
                  ],
                ),
              ],

              if (isSponsor) ...[
                CbSettingsSection(
                  title: 'Sponsor Organization',
                  children: [
                    CbSettingsRow(
                      title: 'Organization Profile',
                      subtitle: 'Brand logo, website, and company details',
                      icon: Icons.business_outlined,
                      iconColor: CbColors.gpsBlue,
                      onTap: () => context.push('/sponsor_rep'),
                    ),
                  ],
                ),
              ],

              // ── F. ACCOUNT & SECURITY ─────────────────────────────────────────────
              CbSettingsSection(
                title: 'Account & Security',
                children: [
                  CbSettingsRow(
                    title: 'Personal Information',
                    subtitle: 'Display name, phone number, and contact email',
                    icon: Icons.badge_outlined,
                    iconColor: CbColors.purpleLight,
                    onTap: () => context.push('/account/personal-info'),
                  ),
                  CbSettingsRow(
                    title: 'Sign-In & Security',
                    subtitle: 'Password, Google/Apple OAuth, active sessions, and Face ID',
                    icon: Icons.security_outlined,
                    iconColor: CbColors.liveGreen,
                    onTap: () => context.push('/account/security'),
                  ),
                ],
              ),

              // ── G. PREFERENCES ───────────────────────────────────────────────────
              CbSettingsSection(
                title: 'Preferences',
                children: [
                  CbSettingsRow(
                    title: 'Notifications',
                    subtitle: 'Tips received, live concert alerts, digests, and push',
                    icon: Icons.notifications_none,
                    iconColor: CbColors.purpleLight,
                    onTap: () => context.push('/account/notifications'),
                  ),
                  CbSettingsRow(
                    title: 'Privacy & Location',
                    subtitle: 'Live radar discoverability, GPS precision, and analytics',
                    icon: Icons.lock_outline,
                    iconColor: CbColors.heartOrange,
                    onTap: () => context.push('/account/privacy'),
                  ),
                ],
              ),

              // ── H. TRUST, SAFETY & SUPPORT ────────────────────────────────────────
              CbSettingsSection(
                title: 'Trust & Safety',
                children: [
                  CbSettingsRow(
                    title: 'Safety Hub & Support Desk',
                    subtitle: 'Report a safety concern, incident cases, and 24/7 help',
                    icon: Icons.health_and_safety_outlined,
                    iconColor: CbColors.liveGreen,
                    onTap: () => context.push('/account/support'),
                  ),
                  CbSettingsRow(
                    title: 'Blocked Accounts',
                    subtitle: 'Manage blocked users and creators',
                    icon: Icons.block_outlined,
                    iconColor: Colors.white54,
                    onTap: () => context.push('/account/blocked'),
                  ),
                ],
              ),

              // ── I. LEGAL & PRIVACY POLICY ─────────────────────────────────────────
              CbSettingsSection(
                title: 'Legal & Privacy Policy',
                children: [
                  CbSettingsRow(
                    title: 'Privacy Policy',
                    subtitle: 'Data rights, telemetry consent, and privacy safeguards (/legal/privacy)',
                    icon: Icons.privacy_tip_outlined,
                    iconColor: CbColors.purpleLight,
                    valueText: 'v2026-08',
                    onTap: () => context.push('/account/legal'),
                  ),
                  CbSettingsRow(
                    title: 'Terms of Service',
                    subtitle: 'Platform agreements, tipping terms, and acceptable use (/legal/terms)',
                    icon: Icons.description_outlined,
                    iconColor: Colors.white70,
                    valueText: 'v2026-08',
                    onTap: () => context.push('/account/legal'),
                  ),
                  CbSettingsRow(
                    title: 'All Platform Policies & Data Export',
                    subtitle: 'Creator monetization, DMCA copyright, and Download My Data archive',
                    icon: Icons.gavel_outlined,
                    iconColor: CbColors.gpsBlue,
                    onTap: () => context.push('/account/legal'),
                  ),
                ],
              ),

              // ── J. SESSION & DANGER ZONE ──────────────────────────────────────────
              CbSettingsSection(
                title: 'Session',
                children: [
                  CbSettingsRow(
                    title: 'Sign Out',
                    subtitle: 'Sign out from this device. Data is securely preserved.',
                    icon: Icons.logout,
                    iconColor: CbColors.purpleLight,
                    showChevron: false,
                    onTap: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          backgroundColor: const Color(0xFF1E2032),
                          title: const Text('Sign Out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          content: const Text('Are you sure you want to sign out from this device?', style: TextStyle(color: CbColors.textSecondary)),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: Colors.white54))),
                            FilledButton(
                              style: FilledButton.styleFrom(backgroundColor: CbColors.purpleMain),
                              onPressed: () => Navigator.pop(ctx, true),
                              child: const Text('Sign Out'),
                            ),
                          ],
                        ),
                      );
                      if (confirm == true) {
                        await ref.read(authNotifierProvider.notifier).signOut();
                        if (context.mounted) context.go('/auth');
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  CbSettingsRow(
                    title: 'Account Status & Deletion…',
                    subtitle: 'Permanent deletion workflow with compliance safeguards',
                    icon: Icons.delete_outline,
                    iconColor: CbColors.errorRed,
                    isDestructive: true,
                    onTap: () => context.push('/account/delete'),
                  ),
                ],
              ),

              const SizedBox(height: 32),
              const Center(
                child: Text(
                  'Crowdbeats V2 • Version 2.0.0 • Build 2026.08',
                  style: TextStyle(color: Colors.white24, fontSize: 11),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
