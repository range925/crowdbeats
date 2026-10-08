// Crowdbeats V2 — Sponsor Profile Tab
// Organization profile, team members, billing & Stripe payment methods,
// contract repository, and account settings.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../state/auth_state.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../models/sponsor_models.dart';
import '../state/sponsor_state.dart';

class SponsorProfileTab extends ConsumerWidget {
  const SponsorProfileTab({
    super.key,
    this.onOpenPersonaSwitcher,
  });

  final VoidCallback? onOpenPersonaSwitcher;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(sponsorProvider);
    final org = state.organization;
    final team = state.teamMembers;
    final contracts = state.contracts;
    final invoices = state.invoices;

    return ListView(
      padding: const EdgeInsets.only(
        top: CbSpacing.s4,
        bottom: 110, // accommodate bottom nav bar
      ),
      children: [
        // Organization Profile Header Card
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Container(
            padding: const EdgeInsets.all(CbSpacing.s5),
            decoration: BoxDecoration(
              color: CbColors.surface1,
              borderRadius: BorderRadius.circular(CbSpacing.radiusXl),
              border: Border.all(color: const Color(0x2BFFFFFF)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x40000000),
                  blurRadius: 16,
                  offset: Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    // Brand Logo Avatar
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        gradient: CbColors.primaryGradient,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
                        boxShadow: const [
                          BoxShadow(
                            color: CbColors.purpleGlow,
                            blurRadius: 12,
                            offset: Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Text(
                          'AA',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: CbSpacing.s4),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  org.name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (org.isVerified) ...[
                                const SizedBox(width: 4),
                                const Icon(Icons.verified, color: CbColors.verifiedBlue, size: 18),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            org.industry,
                            style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: CbColors.purpleDim,
                              borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                              border: Border.all(color: const Color(0x338B5CF6)),
                            ),
                            child: Text(
                              org.tier.toUpperCase(),
                              style: const TextStyle(
                                color: CbColors.purpleLight,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: CbSpacing.s4),
                const Divider(color: Color(0x14FFFFFF), height: 1),
                const SizedBox(height: CbSpacing.s3),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildOrgStat('Active Deals', '${org.activeCampaignsCount} Live'),
                    Container(width: 1, height: 28, color: const Color(0x1AFFFFFF)),
                    _buildOrgStat('Est. Reach', '${formatCompactNumber(org.totalImpressions)} fans'),
                    Container(width: 1, height: 28, color: const Color(0x1AFFFFFF)),
                    _buildOrgStat('Avg ROI', '${org.avgEngagementRate}% Eng.'),
                  ],
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: CbSpacing.s6),

        // Section 1: Team Members
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Authorized Team Members',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              TextButton.icon(
                onPressed: () => _openInviteMemberSheet(context),
                icon: const Icon(Icons.person_add, color: CbColors.purpleLight, size: 16),
                label: const Text('Invite', style: TextStyle(color: CbColors.purpleLight, fontSize: 12)),
              ),
            ],
          ),
        ),
        const SizedBox(height: CbSpacing.s2),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Material(
            color: CbColors.surface1,
            borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
                border: Border.all(color: const Color(0x14FFFFFF)),
              ),
              child: Column(
                children: team.map((member) {
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: member.avatarColor.withValues(alpha: 0.2),
                      child: Text(
                        member.avatarInitials,
                        style: TextStyle(color: member.avatarColor, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                    title: Text(member.name, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: Text('${member.role} · ${member.email}', style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
                    trailing: const Icon(Icons.shield_outlined, color: Colors.white38, size: 18),
                  );
                }).toList(),
              ),
            ),
          ),
        ),

        const SizedBox(height: CbSpacing.s6),

        // Section 2: Billing & Corporate Payment Methods
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Text(
            'Billing & Corporate Payments',
            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: CbSpacing.s2),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Material(
            color: CbColors.surface1,
            borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
            child: Container(
              padding: const EdgeInsets.all(CbSpacing.s4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
                border: Border.all(color: const Color(0x14FFFFFF)),
              ),
              child: Column(
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: CbColors.surface2,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    ),
                    child: const Icon(Icons.account_balance, color: CbColors.liveGreen, size: 22),
                  ),
                  title: const Text('Stripe Corporate ACH', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: const Text('Chase Commercial •••• 8921 · Default', style: TextStyle(color: CbColors.textMuted, fontSize: 12)),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: CbColors.liveGreen.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    ),
                    child: const Text('VERIFIED', style: TextStyle(color: CbColors.liveGreen, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ),
                const Divider(color: Color(0x14FFFFFF)),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: CbColors.surface2,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    ),
                    child: const Icon(Icons.credit_card, color: CbColors.purpleLight, size: 22),
                  ),
                  title: const Text('Corporate Visa', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: const Text('Ending in 4242 · Exp 08/29', style: TextStyle(color: CbColors.textMuted, fontSize: 12)),
                  trailing: const Icon(Icons.chevron_right, color: Colors.white38),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        backgroundColor: CbColors.surface2,
                        content: Text('Opening Stripe payment methods portal...'),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),

        const SizedBox(height: CbSpacing.s6),

        // Section 3: Contract Repository & Receipts
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Contracts & Agreements',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              Text(
                '${contracts.length} on file',
                style: const TextStyle(color: CbColors.textMuted, fontSize: 12),
              ),
            ],
          ),
        ),
        const SizedBox(height: CbSpacing.s2),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Material(
            color: CbColors.surface1,
            borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
                border: Border.all(color: const Color(0x14FFFFFF)),
              ),
              child: Column(
                children: contracts.map((doc) {
                  return ListTile(
                    leading: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: CbColors.surface2,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                      ),
                      child: const Icon(Icons.description_outlined, color: CbColors.purpleLight, size: 20),
                    ),
                    title: Text(doc.title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Text('${doc.talentOrVenue} · ${doc.fileSize}', style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
                    trailing: const Icon(Icons.download, color: Colors.white60, size: 18),
                    onTap: () => _openDocumentPreview(context, doc),
                  );
                }).toList(),
              ),
            ),
          ),
        ),

        const SizedBox(height: CbSpacing.s6),

        // Section 4: Invoices List
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Text(
            'Recent Invoices & Receipts',
            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: CbSpacing.s2),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Material(
            color: CbColors.surface1,
            borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
                border: Border.all(color: const Color(0x14FFFFFF)),
              ),
              child: Column(
                children: invoices.map((inv) {
                  return ListTile(
                    title: Text(inv.invoiceNumber, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                    subtitle: Text(inv.description, style: const TextStyle(color: CbColors.textMuted, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(formatCurrencyCents(inv.amountCents), style: const TextStyle(color: CbColors.liveGreen, fontWeight: FontWeight.bold, fontSize: 13)),
                        Text(inv.status, style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
                      ],
                    ),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: CbColors.surface2,
                          content: Text('Downloading receipt ${inv.invoiceNumber}...'),
                        ),
                      );
                    },
                  );
                }).toList(),
              ),
            ),
          ),
        ),

        const SizedBox(height: CbSpacing.s6),

        // Section 5: Account Settings & Persona Switcher
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Text(
            'Preferences & Session',
            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: CbSpacing.s2),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4),
          child: Material(
            color: CbColors.surface1,
            borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
                border: Border.all(color: const Color(0x14FFFFFF)),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.sync_alt, color: CbColors.purpleLight),
                    title: const Text('Switch Persona', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: const Text('Switch to Fan, Musician, Band, or Venue view', style: TextStyle(color: CbColors.textMuted, fontSize: 12)),
                    trailing: const Icon(Icons.chevron_right, color: Colors.white38),
                    onTap: onOpenPersonaSwitcher,
                  ),
                  const Divider(color: Color(0x14FFFFFF)),
                  ListTile(
                    leading: const Icon(Icons.notifications_outlined, color: Colors.white70),
                    title: const Text('Notification Preferences', style: TextStyle(color: Colors.white, fontSize: 14)),
                    subtitle: const Text('Deal alerts, contract signatures, milestones', style: TextStyle(color: CbColors.textMuted, fontSize: 12)),
                    trailing: const Icon(Icons.chevron_right, color: Colors.white38),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          backgroundColor: CbColors.surface2,
                          content: Text('Notifications set to Instant Email & Push.'),
                        ),
                      );
                    },
                  ),
                  const Divider(color: Color(0x14FFFFFF)),
                  ListTile(
                    leading: const Icon(Icons.logout, color: CbColors.errorRed),
                    title: const Text('Sign Out', style: TextStyle(color: CbColors.errorRed, fontSize: 14, fontWeight: FontWeight.w600)),
                    onTap: () {
                      ref.read(authNotifierProvider.notifier).signOut();
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildOrgStat(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }

  void _openDocumentPreview(BuildContext context, SponsorContractDocument doc) {
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
                  Expanded(
                    child: Text(
                      doc.documentType,
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '${doc.title} · ${doc.talentOrVenue}',
                style: const TextStyle(color: CbColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: CbSpacing.s4),
              Container(
                padding: const EdgeInsets.all(CbSpacing.s4),
                decoration: BoxDecoration(
                  color: CbColors.surface2,
                  borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.verified_user, color: CbColors.liveGreen, size: 36),
                    SizedBox(height: CbSpacing.s2),
                    Text('Digitally Executed via Crowdbeats Escrow', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    SizedBox(height: 4),
                    Text('Both parties signed with tamper-proof cryptographic audit trail.', style: TextStyle(color: CbColors.textMuted, fontSize: 12), textAlign: TextAlign.center),
                  ],
                ),
              ),
              const SizedBox(height: CbSpacing.s5),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton.icon(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        backgroundColor: CbColors.surface2,
                        content: Text('Downloading certified copy of ${doc.title}...'),
                      ),
                    );
                  },
                  icon: const Icon(Icons.download),
                  label: const Text('Download Executed PDF'),
                  style: FilledButton.styleFrom(
                    backgroundColor: CbColors.purpleMain,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openInviteMemberSheet(BuildContext context) {
    final emailCtrl = TextEditingController();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
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
                  const Text('Invite Team Member', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text('Add marketing leads, campaign managers, or financial approvers to your brand portal.', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
              const SizedBox(height: CbSpacing.s4),
              TextField(
                controller: emailCtrl,
                keyboardType: TextInputType.emailAddress,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Corporate Email Address',
                  hintText: 'colleague@brand.com',
                  filled: true,
                  fillColor: CbColors.surface2,
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: CbSpacing.s4),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        backgroundColor: CbColors.liveGreen,
                        content: Text('Invitation sent to ${emailCtrl.text.trim()}!'),
                      ),
                    );
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: CbColors.purpleMain,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    ),
                  ),
                  child: const Text('Send Team Invitation'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
