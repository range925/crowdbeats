// Crowdbeats V2 — Campaign Creation Wizard (Phase 11)
// 5-Step Flow: 1. Story → 2. Goal & Rewards → 3. Details → 4. Review → 5. Launch
// Draft auto-save & resume, validation constraints, fee transparency & moderation submission.

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

  RewardTierItem clone() => RewardTierItem(
        id: id,
        title: title,
        amountDollars: amountDollars,
        description: description,
        backerLimit: backerLimit,
      );
}

class CampaignDraft {
  CampaignDraft({
    required this.title,
    required this.story,
    required this.goalDollars,
    required this.days,
    required this.category,
    required this.location,
    required this.estimatedDelivery,
    required this.tiers,
    required this.savedAt,
    this.step = 1,
  });

  String title;
  String story;
  int goalDollars;
  int days;
  String category;
  String location;
  String estimatedDelivery;
  List<RewardTierItem> tiers;
  DateTime savedAt;
  int step;
}

class CampaignCreationWizard extends StatefulWidget {
  const CampaignCreationWizard({super.key, required this.onCampaignCreated});

  final VoidCallback onCampaignCreated;

  // Static in-memory draft cache for persistent recovery across sessions
  static CampaignDraft? persistedDraft;

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

  late final TextEditingController _titleController;
  late final TextEditingController _storyController;
  late final TextEditingController _goalController;
  late final TextEditingController _daysController;
  late final TextEditingController _locationController;
  late final TextEditingController _deliveryController;

  String _selectedCategory = 'Album Release';
  bool _termsAccepted = true;
  bool _showResumeBanner = false;
  DateTime _lastAutoSaved = DateTime.now();

  late List<RewardTierItem> _tiers;

  // Validation constants aligned with packages/contracts/src/financial/campaign.ts
  static const int kTitleMaxChars = 120;
  static const int kStoryMinChars = 50;
  static const int kStoryMaxChars = 5000;
  static const int kGoalMinDollars = 10;
  static const int kGoalMaxDollars = 10000;

  @override
  void initState() {
    super.initState();

    final draft = CampaignCreationWizard.persistedDraft;
    if (draft != null) {
      _showResumeBanner = true;
      _titleController = TextEditingController(text: draft.title);
      _storyController = TextEditingController(text: draft.story);
      _goalController = TextEditingController(text: draft.goalDollars.toString());
      _daysController = TextEditingController(text: draft.days.toString());
      _locationController = TextEditingController(text: draft.location);
      _deliveryController = TextEditingController(text: draft.estimatedDelivery);
      _selectedCategory = draft.category;
      _tiers = draft.tiers.map((t) => t.clone()).toList();
      _currentStep = draft.step;
      _lastAutoSaved = draft.savedAt;
    } else {
      _titleController = TextEditingController(text: 'Debut Studio Album & Vinyl Pressing');
      _storyController = TextEditingController(
        text: 'Help us record 10 original studio tracks at Sunset Studios and press 500 limited edition colored vinyl records for the worldwide community.',
      );
      _goalController = TextEditingController(text: '5000');
      _daysController = TextEditingController(text: '30');
      _locationController = TextEditingController(text: 'Brooklyn, NY');
      _deliveryController = TextEditingController(text: 'November 2026');

      _tiers = [
        RewardTierItem(
          id: 't1',
          title: 'Digital Download + Bonus Track',
          amountDollars: 15,
          description: 'Lossless WAV + MP3 download of the album 2 weeks before public release.',
        ),
        RewardTierItem(
          id: 't2',
          title: 'Signed Limited Edition Vinyl',
          amountDollars: 45,
          description: 'Heavyweight colored vinyl signed by the artist, plus digital download.',
          backerLimit: 100,
        ),
        RewardTierItem(
          id: 't3',
          title: 'VIP Guest List + Soundcheck Access',
          amountDollars: 150,
          description: '2 VIP tickets to any headline show plus intimate soundcheck experience.',
          backerLimit: 20,
        ),
      ];
    }

    _titleController.addListener(_onFieldChanged);
    _storyController.addListener(_onFieldChanged);
    _goalController.addListener(_onFieldChanged);
    _daysController.addListener(_onFieldChanged);
    _locationController.addListener(_onFieldChanged);
    _deliveryController.addListener(_onFieldChanged);
  }

  void _onFieldChanged() {
    _autoSaveDraft();
  }

  void _autoSaveDraft() {
    final goal = int.tryParse(_goalController.text.trim()) ?? 5000;
    final days = int.tryParse(_daysController.text.trim()) ?? 30;

    CampaignCreationWizard.persistedDraft = CampaignDraft(
      title: _titleController.text,
      story: _storyController.text,
      goalDollars: goal,
      days: days,
      category: _selectedCategory,
      location: _locationController.text,
      estimatedDelivery: _deliveryController.text,
      tiers: _tiers.map((t) => t.clone()).toList(),
      savedAt: DateTime.now(),
      step: _currentStep,
    );

    if (mounted) {
      setState(() => _lastAutoSaved = DateTime.now());
    }
  }

  void _discardDraft() {
    CampaignCreationWizard.persistedDraft = null;
    setState(() {
      _showResumeBanner = false;
      _currentStep = 1;
      _titleController.text = 'Debut Studio Album & Vinyl Pressing';
      _storyController.text = 'Help us record 10 original studio tracks at Sunset Studios and press 500 limited edition colored vinyl records for the worldwide community.';
      _goalController.text = '5000';
      _daysController.text = '30';
      _locationController.text = 'Brooklyn, NY';
      _deliveryController.text = 'November 2026';
      _selectedCategory = 'Album Release';
      _tiers = [
        RewardTierItem(
          id: 't1',
          title: 'Digital Download + Bonus Track',
          amountDollars: 15,
          description: 'Lossless WAV + MP3 download of the album 2 weeks before public release.',
        ),
        RewardTierItem(
          id: 't2',
          title: 'Signed Limited Edition Vinyl',
          amountDollars: 45,
          description: 'Heavyweight colored vinyl signed by the artist, plus digital download.',
          backerLimit: 100,
        ),
        RewardTierItem(
          id: 't3',
          title: 'VIP Guest List + Soundcheck Access',
          amountDollars: 150,
          description: '2 VIP tickets to any headline show plus intimate soundcheck experience.',
          backerLimit: 20,
        ),
      ];
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _storyController.dispose();
    _goalController.dispose();
    _daysController.dispose();
    _locationController.dispose();
    _deliveryController.dispose();
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
    _autoSaveDraft();
  }

  bool _validateStep(int step) {
    if (step == 1) {
      if (_titleController.text.trim().isEmpty) {
        _showError('Campaign title is required');
        return false;
      }
      if (_titleController.text.trim().length > kTitleMaxChars) {
        _showError('Campaign title exceeds $kTitleMaxChars characters');
        return false;
      }
      if (_storyController.text.trim().length < kStoryMinChars) {
        _showError('Story must be at least $kStoryMinChars characters (currently ${_storyController.text.trim().length})');
        return false;
      }
    } else if (step == 2) {
      final goal = int.tryParse(_goalController.text.trim());
      if (goal == null || goal < kGoalMinDollars || goal > kGoalMaxDollars) {
        _showError('Goal must be between \$$kGoalMinDollars and \$$kGoalMaxDollars USD');
        return false;
      }
      final days = int.tryParse(_daysController.text.trim());
      if (days == null || days < 7 || days > 90) {
        _showError('Campaign duration must be between 7 and 90 days');
        return false;
      }
      if (_tiers.isEmpty) {
        _showError('Please add at least one reward tier');
        return false;
      }
    } else if (step == 4) {
      if (!_termsAccepted) {
        _showError('Please accept the creator campaign terms to continue');
        return false;
      }
    }
    return true;
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: CbColors.statusError),
    );
  }

  String _getStepTitle() {
    switch (_currentStep) {
      case 1:
        return 'Story';
      case 2:
        return 'Goal & Rewards';
      case 3:
        return 'Details';
      case 4:
        return 'Review';
      case 5:
        return 'Launch';
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.92,
      decoration: const BoxDecoration(
        color: CbColors.surfaceCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
      ),
      child: Column(
        children: [
          // Drag Handle
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 6),
            child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Campaign Creation Wizard', style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold)),
                    Row(
                      children: [
                        Text('Step $_currentStep of 5 · ${_getStepTitle()}', style: const TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.w600)),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: const Color(0x2210B981), borderRadius: BorderRadius.circular(4)),
                          child: const Text('Draft auto-saved', style: TextStyle(color: CbColors.statusLive, fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          // Progress Step Indicator
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            child: Row(
              children: List.generate(5, (index) {
                final stepNum = index + 1;
                final isActive = stepNum <= _currentStep;
                return Expanded(
                  child: Container(
                    height: 4,
                    margin: EdgeInsets.only(right: index < 4 ? 6 : 0),
                    decoration: BoxDecoration(
                      color: isActive ? CbColors.tealGas : Colors.white12,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                );
              }),
            ),
          ),

          // Resume Draft Banner if available
          if (_showResumeBanner)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0x228B5CF6),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0x668B5CF6)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.restore, color: CbColors.purpleLight, size: 18),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text('Unsaved draft found · Resume or Discard', style: TextStyle(color: Colors.white, fontSize: 12)),
                  ),
                  TextButton(
                    onPressed: () => setState(() => _showResumeBanner = false),
                    style: TextButton.styleFrom(visualDensity: VisualDensity.compact),
                    child: const Text('Resume', style: TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                  TextButton(
                    onPressed: _discardDraft,
                    style: TextButton.styleFrom(visualDensity: VisualDensity.compact),
                    child: const Text('Discard', style: TextStyle(color: Colors.white54, fontSize: 12)),
                  ),
                ],
              ),
            ),

          const Divider(color: Colors.white12, height: 1),

          // Dynamic Step View
          Expanded(
            child: _currentStep == 1
                ? _buildStep1Story()
                : _currentStep == 2
                    ? _buildStep2GoalAndRewards()
                    : _currentStep == 3
                        ? _buildStep3Details()
                        : _currentStep == 4
                            ? _buildStep4Review()
                            : _buildStep5Launch(),
          ),

          // Bottom Controls
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
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                  ),
                  onPressed: () {
                    _autoSaveDraft();
                    Navigator.of(context).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Draft saved. You can resume anytime.'), backgroundColor: CbColors.purpleLight),
                    );
                  },
                  child: const Text('Save Draft', style: TextStyle(color: CbColors.purpleLight)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _currentStep == 5 ? CbColors.statusLive : CbColors.purpleMain,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    ),
                    onPressed: () {
                      if (!_validateStep(_currentStep)) return;

                      if (_currentStep < 5) {
                        setState(() => _currentStep++);
                      } else {
                        // Clear draft on successful launch
                        CampaignCreationWizard.persistedDraft = null;
                        widget.onCampaignCreated();
                        Navigator.of(context).pop();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Campaign submitted for review! You will receive confirmation shortly.'),
                            backgroundColor: CbColors.statusLive,
                          ),
                        );
                      }
                    },
                    child: Text(
                      _currentStep == 5 ? 'Submit for Review' : 'Continue',
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

  // Step 1: Story
  Widget _buildStep1Story() {
    final titleLength = _titleController.text.length;
    final storyLength = _storyController.text.length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('CAMPAIGN TITLE', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
            Text('$titleLength / $kTitleMaxChars', style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _titleController,
          maxLength: kTitleMaxChars,
          buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null,
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
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('PROJECT STORY & CREATIVE PITCH', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
            Text(
              '$storyLength / min $kStoryMinChars chars',
              style: TextStyle(
                color: storyLength >= kStoryMinChars ? CbColors.statusLive : CbColors.statusWarning,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _storyController,
          maxLines: 5,
          maxLength: kStoryMaxChars,
          buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: 'Explain the creative project and why fan support matters (min 50 characters)…',
            hintStyle: const TextStyle(color: Colors.white38),
            filled: true,
            fillColor: CbColors.surfaceBase,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 12),
        const CbGlassCard(
          padding: EdgeInsets.all(12),
          child: Row(
            children: [
              Icon(Icons.lightbulb_outline, color: CbColors.tealGas, size: 20),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Authentic, personal narratives reach their funding goal 2.4x faster. Share what recording these songs means to your journey.',
                  style: TextStyle(color: CbColors.textSecondary, fontSize: 11),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Step 2: Goal & Rewards
  Widget _buildStep2GoalAndRewards() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
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
                      hintText: '10 - 10000',
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
                      hintText: '7 - 90',
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
        const SizedBox(height: 20),
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

  // Step 3: Details
  Widget _buildStep3Details() {
    final categories = ['Album Release', 'Tour & Travel', 'Vinyl Pressing', 'Music Video', 'Studio Gear'];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('PROJECT CATEGORY', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: categories.map((cat) {
            final isSelected = _selectedCategory == cat;
            return ChoiceChip(
              label: Text(cat),
              selected: isSelected,
              selectedColor: CbColors.purpleMain,
              backgroundColor: CbColors.surfaceBase,
              labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.white70, fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal),
              onSelected: (val) {
                if (val) {
                  setState(() => _selectedCategory = cat);
                  _autoSaveDraft();
                }
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 20),
        const Text('CREATOR LOCATION', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        TextField(
          controller: _locationController,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: 'City, State or Country (e.g. Brooklyn, NY)',
            hintStyle: const TextStyle(color: Colors.white38),
            filled: true,
            fillColor: CbColors.surfaceBase,
            prefixIcon: const Icon(Icons.location_on_outlined, color: CbColors.tealGas, size: 18),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 20),
        const Text('ESTIMATED REWARD FULFILLMENT', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        TextField(
          controller: _deliveryController,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: 'Estimated completion target (e.g. November 2026)',
            hintStyle: const TextStyle(color: Colors.white38),
            filled: true,
            fillColor: CbColors.surfaceBase,
            prefixIcon: const Icon(Icons.calendar_today_outlined, color: CbColors.purpleLight, size: 18),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 20),
        const CbGlassCard(
          padding: EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.shield_outlined, color: CbColors.tealGas, size: 18),
                  SizedBox(width: 8),
                  Text('Reward Fulfillment Integrity', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                ],
              ),
              SizedBox(height: 6),
              Text(
                'Crowdbeats campaigns operate on an All-or-Nothing pledge guarantee. Funds are captured only if the campaign reaches 100% of its goal by the deadline.',
                style: TextStyle(color: CbColors.textSecondary, fontSize: 11, height: 1.4),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Step 4: Review
  Widget _buildStep4Review() {
    final goal = int.tryParse(_goalController.text.trim()) ?? 5000;
    final platformFee = goal * 0.06;
    final stripeFee = (goal * 0.029) + 30.0;
    final estimatedNet = goal - platformFee - stripeFee;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
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
                    decoration: BoxDecoration(color: const Color(0x3310B981), borderRadius: BorderRadius.circular(4)),
                    child: Text(_selectedCategory.toUpperCase(), style: const TextStyle(color: CbColors.statusLive, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                  Text('${_daysController.text} Days Duration', style: const TextStyle(color: CbColors.purpleLight, fontSize: 11)),
                ],
              ),
              const SizedBox(height: 10),
              Text(_titleController.text, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Text(_storyController.text, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: CbColors.textSecondary, fontSize: 12)),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.location_on, size: 14, color: CbColors.textMuted),
                  const SizedBox(width: 4),
                  Text(_locationController.text, style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
                  const SizedBox(width: 14),
                  const Icon(Icons.local_shipping, size: 14, color: CbColors.textMuted),
                  const SizedBox(width: 4),
                  Text('Est. ${_deliveryController.text}', style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
                ],
              ),
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
                      const Text('TIERS', style: TextStyle(color: CbColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                      Text('${_tiers.length} Tiers', style: const TextStyle(color: CbColors.purpleLight, fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('MODEL', style: TextStyle(color: CbColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
                      const Text('All-or-Nothing', style: TextStyle(color: CbColors.tealGas, fontSize: 13, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Fee Transparency Card
        CbGlassCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('FEE TRANSPARENCY & NET DISCLOSURE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Campaign Goal (Gross):', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                  Text('\$$goal.00', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Crowdbeats Platform Fee (6.0%):', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                  Text('-\$${platformFee.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Stripe Processing Fee (est. 2.9% + 30¢):', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                  Text('-\$${stripeFee.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
              const Divider(color: Colors.white12, height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Estimated Net Payout upon Success:', style: TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.bold, fontSize: 13)),
                  Text('\$${estimatedNet.toStringAsFixed(2)}', style: const TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.w900, fontSize: 14)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Terms Acknowledgment
        Row(
          children: [
            Checkbox(
              value: _termsAccepted,
              activeColor: CbColors.tealGas,
              checkColor: Colors.black,
              onChanged: (val) => setState(() => _termsAccepted = val ?? false),
            ),
            const Expanded(
              child: Text(
                'I confirm that all rewards offered comply with the Crowdbeats Creator Terms and that I will fulfill all backer perks upon campaign funding.',
                style: TextStyle(color: CbColors.textSecondary, fontSize: 11),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // Step 5: Launch
  Widget _buildStep5Launch() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const CbGlassCard(
          padding: EdgeInsets.all(18),
          backgroundColor: Color(0x2210B981),
          borderColor: Color(0x6610B981),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.verified, color: CbColors.statusLive, size: 28),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Ready for Submission', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                        Text('Campaign passes all automated compliance checks.', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const CbGlassCard(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.shield_outlined, color: CbColors.purpleLight, size: 20),
                  SizedBox(width: 8),
                  Text('Moderation & Review Notice', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                ],
              ),
              SizedBox(height: 8),
              Text(
                'To safeguard backers and ensure platform integrity, all crowdfunding campaigns undergo standard review by our Trust & Safety team before public indexing. Review is typically completed within 24 hours.',
                style: TextStyle(color: CbColors.textSecondary, fontSize: 12, height: 1.4),
              ),
              SizedBox(height: 12),
              Row(
                children: [
                  CbStatusBadge(label: 'SUBMITTED FOR REVIEW', status: CbStatus.info),
                  SizedBox(width: 8),
                  Text('Will be queued upon submission', style: TextStyle(color: CbColors.textMuted, fontSize: 11)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        CbGlassCard(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_titleController.text, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 4),
              Text('Goal: \$${_goalController.text} USD · Duration: ${_daysController.text} Days · ${_tiers.length} Reward Tiers', style: const TextStyle(color: CbColors.tealGas, fontSize: 12)),
            ],
          ),
        ),
      ],
    );
  }
}
