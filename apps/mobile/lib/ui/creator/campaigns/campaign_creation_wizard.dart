// Crowdbeats V2 — Campaign Creation Wizard (Phase 5)
// 3-Step Wizard: 1. Basic Details, 2. Reward Tiers, 3. Review & Launch.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class RewardTierItem {
  RewardTierItem({
    required this.id,
    required this.title,
    required this.amountDollars,
    required this.description,
    this.backerLimit,
  });

  String id;
  String title;
  int amountDollars;
  String description;
  int? backerLimit;
}

class CampaignCreationWizard extends StatefulWidget {
  const CampaignCreationWizard({super.key, required this.onCampaignCreated});

  final VoidCallback onCampaignCreated;

  static Future<void> show(BuildContext context, {required VoidCallback onCampaignCreated}) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CampaignCreationWizard(onCampaignCreated: onCampaignCreated),
    );
  }

  @override
  State<CampaignCreationWizard> createState() => _CampaignCreationWizardState();
}

class _CampaignCreationWizardState extends State<CampaignCreationWizard> {
  int _currentStep = 1;
  final _titleController = TextEditingController(text: 'Debut Studio Album & Vinyl Pressing');
  final _descController = TextEditingController(text: 'Help us record 10 new tracks at Sunset Studios and press 500 limited edition colored vinyls.');
  final _goalController = TextEditingController(text: '5000');
  final _daysController = TextEditingController(text: '30');

  final List<RewardTierItem> _tiers = [
    RewardTierItem(id: 't1', title: 'Digital Download + Bonus Track', amountDollars: 15, description: 'Lossless WAV + MP3 download of the album 2 weeks before public release.'),
    RewardTierItem(id: 't2', title: 'Signed Limited Edition Vinyl', amountDollars: 45, description: 'Heavyweight colored vinyl signed by the artist, plus digital download.', backerLimit: 100),
    RewardTierItem(id: 't3', title: 'VIP Guest List + Soundcheck Access', amountDollars: 150, description: '2 VIP tickets to any headline show plus intimate soundcheck experience.', backerLimit: 20),
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _goalController.dispose();
    _daysController.dispose();
    super.dispose();
  }

  void _addNewTier() {
    setState(() {
      _tiers.add(RewardTierItem(
        id: 't_${DateTime.now().millisecondsSinceEpoch}',
        title: 'New Reward Tier',
        amountDollars: 25,
        description: 'Exclusive supporter perk description.',
      ));
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: CbColors.surfaceCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
      ),
      child: Column(
        children: [
          // Drag Handle & Step Indicator
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 8),
            child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Create Crowdfunding Campaign', style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold)),
                    Text('Step $_currentStep of 3 · ${_getStepTitle()}', style: const TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.w600)),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          const Divider(color: Colors.white12, height: 1),

          Expanded(
            child: _currentStep == 1
                ? _buildStep1Details()
                : _currentStep == 2
                    ? _buildStep2Tiers()
                    : _buildStep3Review(),
          ),

          // Bottom Step Controls
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                if (_currentStep > 1) ...[
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    ),
                    onPressed: () => setState(() => _currentStep--),
                    child: const Text('Back', style: TextStyle(color: Colors.white)),
                  ),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _currentStep == 3 ? CbColors.statusLive : CbColors.purpleMain,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    ),
                    onPressed: () {
                      if (_currentStep < 3) {
                        setState(() => _currentStep++);
                      } else {
                        widget.onCampaignCreated();
                        Navigator.of(context).pop();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Campaign published successfully!'), backgroundColor: CbColors.statusLive),
                        );
                      }
                    },
                    child: Text(
                      _currentStep == 3 ? 'Launch Campaign' : 'Continue',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getStepTitle() {
    switch (_currentStep) {
      case 1:
        return 'Details & Goal';
      case 2:
        return 'Reward Tiers';
      case 3:
        return 'Review & Launch';
      default:
        return '';
    }
  }

  Widget _buildStep1Details() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('CAMPAIGN TITLE', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        TextField(
          controller: _titleController,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: 'e.g. Debut Studio Album & Vinyl Pressing',
            hintStyle: const TextStyle(color: Colors.white38),
            filled: true,
            fillColor: CbColors.surfaceBase,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 16),
        const Text('DESCRIPTION & STORY', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        TextField(
          controller: _descController,
          maxLines: 4,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: 'Explain the creative project and why fan support matters…',
            hintStyle: const TextStyle(color: Colors.white38),
            filled: true,
            fillColor: CbColors.surfaceBase,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(r'GOAL (USD $)', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _goalController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      prefixText: r'$ ',
                      prefixStyle: const TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.bold),
                      filled: true,
                      fillColor: CbColors.surfaceBase,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('DURATION (DAYS)', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _daysController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      suffixText: 'days',
                      filled: true,
                      fillColor: CbColors.surfaceBase,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStep2Tiers() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('REWARD TIERS', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
            TextButton.icon(
              icon: const Icon(Icons.add, size: 14, color: CbColors.purpleLight),
              label: const Text('Add Tier', style: TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.bold)),
              onPressed: _addNewTier,
            ),
          ],
        ),
        const SizedBox(height: 8),
        ..._tiers.map((tier) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              child: CbGlassCard(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(tier.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        ),
                        Text(
                          '\$${tier.amountDollars}',
                          style: const TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.w900, fontSize: 16),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(tier.description, style: const TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                    if (tier.backerLimit != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: const Color(0x228B5CF6), borderRadius: BorderRadius.circular(4)),
                        child: Text('Limit: ${tier.backerLimit} backers', style: const TextStyle(color: CbColors.purpleLight, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ],
                ),
              ),
            )),
      ],
    );
  }

  Widget _buildStep3Review() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const CbGlassCard(
          padding: EdgeInsets.all(16),
          backgroundColor: Color(0x2210B981),
          borderColor: Color(0x6610B981),
          child: Row(
            children: [
              Icon(Icons.verified, color: CbColors.statusLive, size: 24),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Ready for Launch', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    Text('Your campaign complies with Crowdbeats creator standards.', style: TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        CbGlassCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_titleController.text, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Text(_descController.text, style: const TextStyle(color: CbColors.textSecondary, fontSize: 12)),
              const SizedBox(height: 14),
              const Divider(color: Colors.white12, height: 1),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('GOAL', style: TextStyle(color: CbColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                      Text('\$${_goalController.text}', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('DURATION', style: TextStyle(color: CbColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                      Text('${_daysController.text} Days', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('REWARD TIERS', style: TextStyle(color: CbColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                      Text('${_tiers.length} Tiers', style: const TextStyle(color: CbColors.purpleLight, fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
