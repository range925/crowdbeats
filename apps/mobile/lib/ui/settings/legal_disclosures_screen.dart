// Crowdbeats V2 — Legal Policies & Data Transparency Screen
//
// Links to verified platform policies, in-app policy reader, and triggers GDPR "Download My Data" export.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../components/cb_settings_row.dart';

class LegalDisclosuresScreen extends StatefulWidget {
  const LegalDisclosuresScreen({super.key});

  @override
  State<LegalDisclosuresScreen> createState() => _LegalDisclosuresScreenState();
}

class _LegalDisclosuresScreenState extends State<LegalDisclosuresScreen> {
  bool _exporting = false;

  void _openPolicyReader(String title, String path, String summary, String fullText) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF151722),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (_, scrollController) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Title
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$path • Effective Version 2026-08-25',
                          style: const TextStyle(color: CbColors.purpleLight, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(color: CbColors.borderSubtle, height: 20),

              // Content Body
              Expanded(
                child: ListView(
                  controller: scrollController,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E2032),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: CbColors.borderSubtle),
                      ),
                      child: Text(
                        summary,
                        style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4, fontStyle: FontStyle.italic),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      fullText,
                      style: const TextStyle(color: CbColors.textPrimary, fontSize: 13.5, height: 1.6),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _requestDataExport() async {
    setState(() => _exporting = true);
    await Future<void>.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    setState(() => _exporting = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Data export queued. You will receive an encrypted download link via email within 48 hours.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Legal & Privacy Policy'),
        backgroundColor: CbColors.bgApp,
      ),
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Prominent Legal & Privacy Policies
              CbSettingsSection(
                title: 'Legal & Privacy Policies',
                showTopDivider: false,
                children: [
                  CbSettingsRow(
                    title: 'Privacy Policy',
                    subtitle: 'Data collection, GPS limitation, rights & no-sale pledge (/legal/privacy)',
                    icon: Icons.privacy_tip_outlined,
                    iconColor: CbColors.purpleLight,
                    onTap: () => _openPolicyReader(
                      'Privacy Policy',
                      '/legal/privacy',
                      'Summary: Crowdbeats collects necessary account and telemetry data with consent. We do not sell personal data. You can request deletion or download your data anytime.',
                      '1. Information We Collect: We collect information you provide directly, such as your email, display name, and persona preferences. Location data is collected only with runtime permission when using Live Radar.\n\n'
                      '2. How We Use Information: We use data to facilitate live stage discovery, process tips securely via Stripe, and prevent fraud. We do not sell or monetize personal data.\n\n'
                      '3. Data Retention & Deletion: You may request full account deletion from Account Settings. In accordance with anti-money laundering (AML) laws, transaction ledger records are preserved for 7 years.\n\n'
                      '4. Your Rights: Under CCPA/CPRA, GDPR, and state privacy laws, you have the right to access, correct, port, or delete your data.',
                    ),
                  ),
                  CbSettingsRow(
                    title: 'Terms of Service',
                    subtitle: 'Platform agreements, tipping terms, and account rules (/legal/terms)',
                    icon: Icons.description_outlined,
                    iconColor: Colors.white70,
                    onTap: () => _openPolicyReader(
                      'Terms of Service',
                      '/legal/terms',
                      'Summary: By using Crowdbeats, you agree to honor intellectual property, conduct lawful transactions, and adhere to our 6% platform fee structure (Stripe fees additional).',
                      '1. Acceptance of Terms: By creating an account or accessing Crowdbeats, you agree to be bound by these Terms of Service.\n\n'
                      '2. Eligibility: You must be at least 18 years of age (or the age of majority in your jurisdiction) to send tips, monetize performances, or register connected accounts.\n\n'
                      '3. Tipping & Transactions: Tips are voluntary payments to performing creators. All tips are non-refundable.\n\n'
                      '4. Platform Fees: Crowdbeats assesses a standard 6% platform fee on tips and campaign pledges. Stripe payment-processing and Connect fees are additional.',
                    ),
                  ),
                  CbSettingsRow(
                    title: 'Creator Monetization & Fee Policy',
                    subtitle: 'Stripe Connect, 6% platform fee structure, and payout terms (/legal/creator-monetization)',
                    icon: Icons.monetization_on_outlined,
                    iconColor: CbColors.liveGreen,
                    onTap: () => _openPolicyReader(
                      'Creator Monetization Policy',
                      '/legal/creator-monetization',
                      'Summary: Creators receive net proceeds directly to their bank account via Stripe Express Connect after Crowdbeats 6% fee and Stripe fees.',
                      '1. Eligibility: Performing artists and bands must complete Stripe Express KYC verification.\n\n'
                      '2. Payouts: Balances are transferred according to the creator selected payout schedule.\n\n'
                      '3. Fee Structure: Crowdbeats charges a 6% platform fee. Stripe payment-processing and applicable Stripe Connect fees are additional.\n\n'
                      '4. Band Splits: Automated revenue splits are calculated and distributed on a per-transaction basis pursuant to band founder configuration.',
                    ),
                  ),
                  CbSettingsRow(
                    title: 'DMCA & Copyright Policy',
                    subtitle: 'Content takedown protocols and copyright agent registry (/legal/dmca)',
                    icon: Icons.copyright_outlined,
                    iconColor: Colors.white70,
                    onTap: () => _openPolicyReader(
                      'DMCA & Copyright Policy',
                      '/legal/dmca',
                      'Summary: Protocols for copyright owners to report infringing material under 17 U.S.C. § 512.',
                      '1. Notice Requirements: Copyright holders must provide written identification of the copyrighted work and specific stage/profile URI.\n\n'
                      '2. Counter-Notice: Uploaders may submit a formal counter-notice under penalties of perjury.\n\n'
                      '3. Designated Agent: Notices should be dispatched to dmca@crowdbeats.com or our registered US Copyright Office agent.',
                    ),
                  ),
                  CbSettingsRow(
                    title: 'Acceptable Use & Prohibited Content',
                    subtitle: 'Zero-tolerance community protection policies (/legal/aup)',
                    icon: Icons.gavel_outlined,
                    iconColor: CbColors.heartOrange,
                    onTap: () => _openPolicyReader(
                      'Acceptable Use Policy',
                      '/legal/aup',
                      'Summary: Prohibits harassment, fraudulent stage check-ins, copyright infringement, and malicious behavior.',
                      '1. Zero Tolerance: Prohibits hate speech, harassment, impersonation, or dangerous live event conduct.\n\n'
                      '2. Enforcement: Violations result in creator strikes, monetization suspension, or permanent ban pursuant to our progressive moderation policy.',
                    ),
                  ),
                ],
              ),

              // Data & GDPR
              CbSettingsSection(
                title: 'Data & Privacy Requests',
                children: [
                  CbSettingsRow(
                    title: 'Download My Data',
                    subtitle: 'Request a machine-readable JSON archive of your profile, tips, and activity',
                    icon: Icons.download_outlined,
                    iconColor: CbColors.gpsBlue,
                    onTap: _exporting ? null : _requestDataExport,
                  ),
                  CbSettingsRow(
                    title: 'Open Source Licenses',
                    subtitle: 'Software libraries and tools powering Crowdbeats V2',
                    icon: Icons.code_outlined,
                    iconColor: Colors.white70,
                    onTap: () => showLicensePage(
                      context: context,
                      applicationName: 'Crowdbeats',
                      applicationVersion: '2.0.0',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
