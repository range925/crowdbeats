// Crowdbeats V2 — Production Creator Campaigns Tab (Phase 11)
// Active campaigns, moderation states (draft, submitted, active, rejected, completed),
// Backer contribution simulation, reward tier tracking & fulfillment pipeline.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';
import 'campaign_creation_wizard.dart';

enum CampaignModerationFilter {
  all,
  active,
  submitted,
  draft,
  rejected,
  completed,
}

class CreatorCampaignsTab extends StatefulWidget {
  const CreatorCampaignsTab({super.key});

  @override
  State<CreatorCampaignsTab> createState() => _CreatorCampaignsTabState();
}

class _CreatorCampaignsTabState extends State<CreatorCampaignsTab> {
  int _pledgedDollars = 3450;
  final int _goalDollars = 5000;
  int _backerCount = 28;
  final int _daysRemaining = 14;

  int _vinylTierClaimed = 11;
  final int _vinylTierTotal = 100;

  CampaignModerationFilter _selectedFilter = CampaignModerationFilter.all;

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
                SnackBar(
                  content: Text('Update broadcasted to all $_backerCount backers!'),
                  backgroundColor: CbColors.statusLive,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  void _simulateBackerPledge(int amountDollars) {
    setState(() {
      _pledgedDollars += amountDollars;
      _backerCount += 1;
      if (amountDollars == 45 && _vinylTierClaimed < _vinylTierTotal) {
        _vinylTierClaimed += 1;
      }
    });

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.favorite, color: CbColors.statusLive, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Test pledge received! +\$$amountDollars USD from Sarah Jenkins · Total: \$$_pledgedDollars',
                style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        backgroundColor: CbColors.tealGas,
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
                  onCampaignCreated: () => setState(() {
                    _selectedFilter = CampaignModerationFilter.submitted;
                  }),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Moderation Lifecycle State Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('All Statuses', CampaignModerationFilter.all),
                const SizedBox(width: 8),
                _buildFilterChip('Active (Published)', CampaignModerationFilter.active),
                const SizedBox(width: 8),
                _buildFilterChip('Pending Review', CampaignModerationFilter.submitted),
                const SizedBox(width: 8),
                _buildFilterChip('Drafts', CampaignModerationFilter.draft),
                const SizedBox(width: 8),
                _buildFilterChip('Rejected', CampaignModerationFilter.rejected),
                const SizedBox(width: 8),
                _buildFilterChip('Completed', CampaignModerationFilter.completed),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Active Campaign Card (visible if 'all' or 'active')
          if (_selectedFilter == CampaignModerationFilter.all || _selectedFilter == CampaignModerationFilter.active) ...[
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
                          icon: const Icon(Icons.volunteer_activism, size: 14, color: CbColors.tealGas),
                          label: const Text('Test Pledge (\$45)', style: TextStyle(fontSize: 12, color: Colors.white)),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0x3303DAC6)),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                          ),
                          onPressed: () => _simulateBackerPledge(45),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Pending Moderation Card (visible if 'all' or 'submitted')
          if (_selectedFilter == CampaignModerationFilter.all || _selectedFilter == CampaignModerationFilter.submitted) ...[
            CbGlassCard(
              padding: const EdgeInsets.all(16),
              backgroundColor: const Color(0x18F59E0B),
              borderColor: const Color(0x44F59E0B),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: const Color(0x33F59E0B), borderRadius: BorderRadius.circular(4)),
                        child: const Text('PENDING REVIEW', style: TextStyle(color: Color(0xFFFBBF24), fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                      const Text('Submitted 2h ago', style: TextStyle(color: Colors.white60, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text('Summer Acoustic Tour Bus & Production', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Funding nationwide acoustic showcase across 12 cities.', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                  const SizedBox(height: 8),
                  const Row(
                    children: [
                      Icon(Icons.schedule, size: 14, color: Color(0xFFFBBF24)),
                      SizedBox(width: 6),
                      Text('Trust & Safety review in progress · Estimated completion < 24h', style: TextStyle(color: Color(0xFFFBBF24), fontSize: 11)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Draft Campaign Card (visible if 'all' or 'draft')
          if (_selectedFilter == CampaignModerationFilter.all || _selectedFilter == CampaignModerationFilter.draft) ...[
            CbGlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: Colors.white12, borderRadius: BorderRadius.circular(4)),
                        child: const Text('DRAFT', style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                      const Text('Auto-saved 15m ago', style: TextStyle(color: CbColors.textMuted, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text('Live Album Mastering & Dolby Atmos Mix', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Goal: \$2,500 · 3 Reward Tiers configured · Step 3 of 5 completed', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 36,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.edit, size: 14, color: CbColors.tealGas),
                      label: const Text('Resume Draft', style: TextStyle(color: CbColors.tealGas, fontSize: 12, fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0x4403DAC6))),
                      onPressed: () => CampaignCreationWizard.show(context, onCampaignCreated: () {}),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Rejected Campaign Card (visible if 'all' or 'rejected')
          if (_selectedFilter == CampaignModerationFilter.all || _selectedFilter == CampaignModerationFilter.rejected) ...[
            CbGlassCard(
              padding: const EdgeInsets.all(16),
              backgroundColor: const Color(0x18EF4444),
              borderColor: const Color(0x44EF4444),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: const Color(0x33EF4444), borderRadius: BorderRadius.circular(4)),
                        child: const Text('REJECTED', style: TextStyle(color: Color(0xFFF87171), fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                      const Text('Action required', style: TextStyle(color: Color(0xFFF87171), fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text('Custom Stage Lighting Rig', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text(
                    'Revision note: Please provide realistic estimated delivery timelines for physical hardware rewards.',
                    style: TextStyle(color: CbColors.textSecondary, fontSize: 12),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 34,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
                      onPressed: () => CampaignCreationWizard.show(context, onCampaignCreated: () {}),
                      child: const Text('Revise & Resubmit', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Completed Campaign Card (visible if 'all' or 'completed')
          if (_selectedFilter == CampaignModerationFilter.all || _selectedFilter == CampaignModerationFilter.completed) ...[
            CbGlassCard(
              padding: const EdgeInsets.all(16),
              backgroundColor: const Color(0x183B82F6),
              borderColor: const Color(0x443B82F6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: const Color(0x333B82F6), borderRadius: BorderRadius.circular(4)),
                        child: const Text('COMPLETED', style: TextStyle(color: Color(0xFF60A5FA), fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                      const Text('124% Funded', style: TextStyle(color: Color(0xFF60A5FA), fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text('Winter Acoustic EP Vinyl Pressing', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Funded \$6,200 of \$5,000 goal · 186 backers · Reward fulfillment 100% complete', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Reward Fulfillment Pipeline Tracker
          const Text('REWARD FULFILLMENT PIPELINE', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          const CbGlassCard(
            padding: EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.inventory_2_outlined, color: CbColors.tealGas, size: 18),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text('Fulfillment Status: In Production / Proofing Test Pressings', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ],
                ),
                SizedBox(height: 10),
                Row(
                  children: [
                    _PipelineDot(label: 'Pledge Closed', isDone: true),
                    _PipelineLine(isDone: true),
                    _PipelineDot(label: 'Mastering', isDone: true),
                    _PipelineLine(isDone: true),
                    _PipelineDot(label: 'Pressing', isCurrent: true),
                    _PipelineLine(isDone: false),
                    _PipelineDot(label: 'Shipping', isDone: false),
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
          _TierCard(title: 'Signed Limited Edition Vinyl', amount: r'$45', backerCount: _vinylTierClaimed, totalBackers: _vinylTierTotal),
          const _TierCard(title: 'VIP Guest List + Soundcheck', amount: r'$150', backerCount: 3, totalBackers: 20),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, CampaignModerationFilter filter) {
    final isSelected = _selectedFilter == filter;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: CbColors.purpleMain,
      backgroundColor: CbColors.surfaceBase,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.white70,
        fontSize: 11,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      onSelected: (val) {
        if (val) setState(() => _selectedFilter = filter);
      },
    );
  }
}

class _PipelineDot extends StatelessWidget {
  const _PipelineDot({required this.label, this.isDone = false, this.isCurrent = false});
  final String label;
  final bool isDone;
  final bool isCurrent;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: isDone || isCurrent ? CbColors.tealGas : Colors.white24,
            shape: BoxShape.circle,
            border: isCurrent ? Border.all(color: Colors.white, width: 2) : null,
          ),
          child: isDone ? const Icon(Icons.check, size: 10, color: Colors.black) : null,
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(color: isCurrent ? CbColors.tealGas : Colors.white60, fontSize: 9, fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal)),
      ],
    );
  }
}

class _PipelineLine extends StatelessWidget {
  const _PipelineLine({required this.isDone});
  final bool isDone;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 14),
        color: isDone ? CbColors.tealGas : Colors.white12,
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
