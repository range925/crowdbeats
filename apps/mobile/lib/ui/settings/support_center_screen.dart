// Crowdbeats V2 — Trust, Safety & Support Center Screen
//
// Safety Hub, Incident Reporting, Payment Support, Help Center, and Contact.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../components/cb_settings_row.dart';

class SupportCenterScreen extends StatelessWidget {
  const SupportCenterScreen({super.key});

  void _showReportConcernModal(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF151722),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          top: 24,
          left: 20,
          right: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Report a Safety Concern', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text(
              'Your report is confidential. The reported user will not know who filed this inquiry.',
              style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 16),
            ...[
              'Harassment or Abuse',
              'Fraud or Payment Issue',
              'Copyright or DMCA Infringement',
              'Prohibited Stage Content',
              'Other Concern'
            ].map((cat) => ListTile(
              title: Text(cat, style: const TextStyle(color: Colors.white, fontSize: 14)),
              trailing: const Icon(Icons.chevron_right, color: Colors.white30, size: 18),
              onTap: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Report category "$cat" submitted to Trust & Safety.')),
                );
              },
            )),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Help & Support'),
        backgroundColor: CbColors.bgApp,
      ),
      backgroundColor: CbColors.bgApp,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Safety Hub
              CbSettingsSection(
                title: 'Trust & Safety',
                showTopDivider: false,
                children: [
                  CbSettingsRow(
                    title: 'Report a Concern',
                    subtitle: 'Confidential reporting for harassment, fraud, or violations',
                    icon: Icons.report_problem_outlined,
                    iconColor: CbColors.heartOrange,
                    onTap: () => _showReportConcernModal(context),
                  ),
                  CbSettingsRow(
                    title: 'Live Event Safety Guidelines',
                    subtitle: 'Crowd safety, venue check-in standards, and artist protection',
                    icon: Icons.health_and_safety_outlined,
                    iconColor: CbColors.liveGreen,
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Viewing Crowdbeats Safety Principles.')),
                      );
                    },
                  ),
                ],
              ),

              // Customer Support
              CbSettingsSection(
                title: 'Support & Assistance',
                children: [
                  CbSettingsRow(
                    title: 'Payment & Refund Help',
                    subtitle: 'Assistance with live tips, campaign pledges, and card receipts',
                    icon: Icons.payment_outlined,
                    iconColor: CbColors.purpleLight,
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Tipping support: Tips can be refunded within 24 hours of live session.')),
                      );
                    },
                  ),
                  CbSettingsRow(
                    title: 'Contact Support Team',
                    subtitle: 'Email our 24/7 dedicated creator & fan support desk',
                    icon: Icons.support_agent_outlined,
                    iconColor: CbColors.gpsBlue,
                    valueText: 'support@crowdbeats.com',
                    showChevron: false,
                  ),
                  CbSettingsRow(
                    title: 'Frequently Asked Questions',
                    subtitle: 'Guides on tipping, Bluetooth radar, and Stripe payouts',
                    icon: Icons.help_outline,
                    iconColor: Colors.white70,
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Help Center: Visit crowdbeats.ai/help for full guides.')),
                      );
                    },
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
