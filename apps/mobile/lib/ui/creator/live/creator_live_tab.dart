// Crowdbeats V2 — Creator Live Tab Router (Phase 4)
// Routes between Idle Stage Launchpad and Active Live Session Nerve Centre.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crowdbeats_mobile/state/creator_context_state.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';
import 'live_checkin_sheet.dart';
import 'live_session_active_view.dart';

class CreatorLiveTab extends ConsumerWidget {
  const CreatorLiveTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contextState = ref.watch(creatorContextProvider);
    final isLive = contextState.activeContext.hasActiveLiveSession;

    if (isLive) {
      return const LiveSessionActiveView();
    }

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        children: [
          // Idle Stage Launchpad Hero
          CbGlassCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: CbColors.purpleDim,
                    shape: BoxShape.circle,
                    border: Border.all(color: CbColors.purpleLight, width: 2),
                  ),
                  child: const Icon(Icons.mic, size: 36, color: CbColors.purpleLight),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Ready to take the stage?',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                const Text(
                  'Check in to your venue or street spot to broadcast your live presence to nearby fans.',
                  style: TextStyle(color: CbColors.textSecondary, fontSize: 12, height: 1.4),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.location_on, size: 18),
                    label: const Text('Check In & Go Live', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: CbColors.purpleMain,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    ),
                    onPressed: () => LiveCheckinSheet.show(context),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Stage Preparation Checklist
          const Text('STAGE CHECKLIST', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          const CbGlassCard(
            padding: EdgeInsets.all(14),
            child: Column(
              children: [
                _ChecklistRow(icon: Icons.account_balance_wallet, title: 'Stripe Payouts Active', subtitle: 'Direct deposit ready for instant transfers', isComplete: true),
                Divider(color: Colors.white12, height: 16),
                _ChecklistRow(icon: Icons.qr_code_2, title: 'Anti-Tamper QR Configured', subtitle: '30s dynamic rotation protects against spoofing', isComplete: true),
                Divider(color: Colors.white12, height: 16),
                _ChecklistRow(icon: Icons.gps_fixed, title: 'Geolocation Verified', subtitle: 'Enables nearby fan discovery map propagation', isComplete: true),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Persistent Direct Tipping Signage Card
          CbGlassCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: CbColors.purpleDim,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.qr_code, color: CbColors.purpleLight, size: 24),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Direct Tipping QR Code',
                        style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Permanent link for mic stands & printed signage',
                        style: TextStyle(color: CbColors.textSecondary, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () {
                    PersistentQrModal.show(
                      context,
                      performerId: contextState.activeContext.id,
                      performerName: contextState.activeContext.name,
                      isBand: contextState.isBand,
                    );
                  },
                  child: const Text('View & Share', style: TextStyle(color: CbColors.purpleLight, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ChecklistRow extends StatelessWidget {
  const _ChecklistRow({required this.icon, required this.title, required this.subtitle, required this.isComplete});
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isComplete;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: CbColors.purpleLight),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
              Text(subtitle, style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
            ],
          ),
        ),
        Icon(isComplete ? Icons.check_circle : Icons.circle_outlined, color: isComplete ? CbColors.statusLive : Colors.white24, size: 18),
      ],
    );
  }
}
