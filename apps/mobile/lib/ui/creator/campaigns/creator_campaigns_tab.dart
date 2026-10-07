// Crowdbeats V2 — Production Creator Campaigns Tab (Phase 5)
// Active campaigns, progress bars, backer counts, reward tiers & update publisher.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';
import 'campaign_creation_wizard.dart';

class CreatorCampaignsTab extends StatefulWidget {
  const CreatorCampaignsTab({super.key});

  @override
  State<CreatorCampaignsTab> createState() => _CreatorCampaignsTabState();
}

class _CreatorCampaignsTabState extends State<CreatorCampaignsTab> {
  int _pledgedDollars = 3450;
  final int _goalDollars = 5000;
  final int _backerCount = 28;
  final int _daysRemaining = 14;

  void _handlePostUpdate() {
    final updateController = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CbColors.surfaceCard,
        title: const Text('Post Backer Update', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Share behind-the-scenes progress with all campaign backers.', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
            const SizedBox(height: 12),
            TextField(
              controller: updateController,
              maxLines: 4,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'e.g. Studio Day 3: Final vocals recorded!',
                hintStyle: const TextStyle(color: Colors.white38),
                filled: true,
                fillColor: CbColors.surfaceBase,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
            onPressed: () => Navigator.of(ctx).pop(),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: CbColors.purpleMain),
            child: const Text('Publish Update', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            onPressed: () {
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Update broadcasted to all 28 backers!'), backgroundColor: CbColors.statusLive),
              );
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_pledgedDollars / _goalDollars).clamp(0.0, 1.0);
    final percent = (progress * 100).toInt();

    return Scaffold(
      backgroundColor: CbColors.bgApp,
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header with New Campaign CTA
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('CROWDFUNDING', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  Text('Direct project funding from your fanbase', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                ],
              ),
              ElevatedButton.icon(
                icon: const Icon(Icons.add, size: 14),
                label: const Text('New Campaign', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: CbColors.purpleMain,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                ),
                onPressed: () => CampaignCreationWizard.show(
                  context,
                  onCampaignCreated: () => setState(() => _pledgedDollars = 0),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Active Campaign Hero Card
          CbGlassCard(
            padding: const EdgeInsets.all(18),
            backgroundColor: const Color(0x228B5CF6),
            borderColor: const Color(0x668B5CF6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: const Color(0x3310B981), borderRadius: BorderRadius.circular(4)),
                      child: const Text('ACTIVE CAMPAIGN', style: TextStyle(color: CbColors.statusLive, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                    Text('$_daysRemaining days left', style: const TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 12),
                const Text('Debut Studio Album & Vinyl Pressing', style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text('Recording 10 original tracks at Sunset Studios and pressing 500 colored vinyl copies.', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 16),

                // Progress Bar & Percentage
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 10,
                    backgroundColor: Colors.white12,
                    valueColor: const AlwaysStoppedAnimation<Color>(CbColors.tealGas),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('\$$_pledgedDollars', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                        Text('pledged of \$$_goalDollars goal ($percent%)', style: const TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('$_backerCount', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                        const Text('Backers', style: TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(color: Colors.white12, height: 1),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.campaign, size: 14, color: CbColors.purpleLight),
                        label: const Text('Post Update', style: TextStyle(fontSize: 12, color: Colors.white)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0x338B5CF6)),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                        ),
                        onPressed: _handlePostUpdate,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.share, size: 14, color: CbColors.tealGas),
                        label: const Text('Share Campaign', style: TextStyle(fontSize: 12, color: Colors.white)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0x3303DAC6)),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                        ),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Campaign link copied to clipboard!')),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Active Reward Tiers Breakdown
          const Text('REWARD TIERS (ACTIVE)', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          const _TierCard(title: 'Digital Download + Bonus Track', amount: r'$15', backerCount: 14, totalBackers: null),
          const _TierCard(title: 'Signed Limited Edition Vinyl', amount: r'$45', backerCount: 11, totalBackers: 100),
          const _TierCard(title: 'VIP Guest List + Soundcheck', amount: r'$150', backerCount: 3, totalBackers: 20),
        ],
      ),
    );
  }
}

class _TierCard extends StatelessWidget {
  const _TierCard({required this.title, required this.amount, required this.backerCount, this.totalBackers});
  final String title;
  final String amount;
  final int backerCount;
  final int? totalBackers;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: CbGlassCard(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(color: Color(0x228B5CF6), shape: BoxShape.circle),
              child: const Icon(Icons.card_giftcard, size: 16, color: CbColors.purpleLight),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  Text(
                    totalBackers != null ? '$backerCount / $totalBackers claimed' : '$backerCount claimed',
                    style: const TextStyle(color: CbColors.textSecondary, fontSize: 11),
                  ),
                ],
              ),
            ),
            Text(amount, style: const TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.w900, fontSize: 15)),
          ],
        ),
      ),
    );
  }
}
