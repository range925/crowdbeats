// Crowdbeats V2 — Stripe Connect KYC Onboarding Screen (Phase 6)
// Account status, verification requirements checklist, hosted link opener & refresh.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class StripeConnectKycScreen extends StatefulWidget {
  const StripeConnectKycScreen({super.key});

  @override
  State<StripeConnectKycScreen> createState() => _StripeConnectKycScreenState();
}

class _StripeConnectKycScreenState extends State<StripeConnectKycScreen> {
  bool _isRefreshing = false;

  void _handleRefresh() {
    setState(() => _isRefreshing = true);
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() => _isRefreshing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Stripe Connect status refreshed: Verified'), backgroundColor: CbColors.statusLive),
        );
      }
    });
  }

  void _handleOpenHostedOnboarding() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Opening Stripe Express hosted verification portal…'), backgroundColor: CbColors.purpleLight),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        title: const Text('Stripe Connect KYC', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: _isRefreshing
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: CbColors.tealGas))
                : const Icon(Icons.refresh, color: CbColors.tealGas),
            onPressed: _isRefreshing ? null : _handleRefresh,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Status Hero Card
          const CbGlassCard(
            padding: EdgeInsets.all(18),
            backgroundColor: Color(0x2210B981),
            borderColor: Color(0x6610B981),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('ACCOUNT STATUS', style: TextStyle(color: CbColors.tealGas, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
                    CbStatusBadge(label: 'VERIFIED & ACTIVE', status: CbStatus.live),
                  ],
                ),
                SizedBox(height: 12),
                Text('Direct Payouts Enabled', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                SizedBox(height: 4),
                Text(
                  'Your identity, bank account, and tax details are verified. You can receive instant tips and execute direct payouts.',
                  style: TextStyle(color: CbColors.textSecondary, fontSize: 12, height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // KYC Requirements Checklist
          const Text('VERIFICATION CHECKLIST', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          const _ChecklistTile(
            title: 'Government Identity Verification',
            subtitle: 'Photo ID verified with Stripe Identity',
            isComplete: true,
          ),
          const _ChecklistTile(
            title: 'Direct Deposit Bank Account',
            subtitle: 'Chase Checking (•••• 4821) connected via Plaid',
            isComplete: true,
          ),
          const _ChecklistTile(
            title: 'W-9 / Taxpayer Identification',
            subtitle: 'SSN/EIN recorded for 1099-K reporting',
            isComplete: true,
          ),
          const _ChecklistTile(
            title: 'Creator Terms & Payout Agreement',
            subtitle: 'Crowdbeats payout terms accepted',
            isComplete: true,
          ),
          const SizedBox(height: 20),

          // Hosted Portal Action Card
          CbGlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Manage Bank & Tax Info', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text(
                  'Update your payout bank account, change tax withholding, or view 1099 statements securely in the Stripe portal.',
                  style: TextStyle(color: CbColors.textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.open_in_new, size: 16, color: CbColors.purpleLight),
                    label: const Text('Open Stripe Express Portal', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0x448B5CF6)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    ),
                    onPressed: _handleOpenHostedOnboarding,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ChecklistTile extends StatelessWidget {
  const _ChecklistTile({required this.title, required this.subtitle, required this.isComplete});
  final String title;
  final String subtitle;
  final bool isComplete;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: CbGlassCard(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Icon(
              isComplete ? Icons.check_circle : Icons.radio_button_unchecked,
              color: isComplete ? CbColors.statusLive : CbColors.textMuted,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                  Text(subtitle, style: const TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
