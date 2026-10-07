// Crowdbeats V2 — Musician Campaigns Tab (Phase 7)
//
// Lists the musician's own campaigns with status chips and progress.
// "New Campaign" quick-start → opens new campaign form sheet.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../state/auth_state.dart';
import '../../../firebase/musician_service.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';

class MusicianCampaignsTab extends ConsumerStatefulWidget {
  const MusicianCampaignsTab({super.key});

  @override
  ConsumerState<MusicianCampaignsTab> createState() => _MusicianCampaignsTabState();
}

class _MusicianCampaignsTabState extends ConsumerState<MusicianCampaignsTab> {
  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final uid = auth.uid ?? '';

    return Scaffold(
      backgroundColor: CbColors.surfaceBase,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(CbSpacing.s6, CbSpacing.s6, CbSpacing.s6, 0),
              child: Row(children: [
                Expanded(
                  child: Text('Campaigns', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                ),
                FilledButton.icon(
                  onPressed: () => _showNewCampaignSheet(context),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('New'),
                ),
              ]),
            ),
            const SizedBox(height: CbSpacing.s5),

            // Campaign list
            Expanded(
              child: uid.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : _CampaignList(uid: uid),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showNewCampaignSheet(BuildContext context) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _NewCampaignSheet(),
    );
  }
}

// ── Campaign list ─────────────────────────────────────────────────────────────

class _CampaignList extends ConsumerWidget {
  const _CampaignList({required this.uid});

  final String uid;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final campaignsAsync = ref.watch(myCampaignsProvider(uid));
    return campaignsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: CbColors.statusError))),
      data: (campaigns) {
        if (campaigns.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(CbSpacing.s8),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Text('🎸', style: TextStyle(fontSize: 48)),
                const SizedBox(height: CbSpacing.s4),
                Text('No campaigns yet', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: CbSpacing.s2),
                const Text('Create a campaign to fund your next project.', textAlign: TextAlign.center, style: TextStyle(color: CbColors.textSecondary)),
              ]),
            ),
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s5, vertical: CbSpacing.s2),
          itemCount: campaigns.length,
          separatorBuilder: (_, _) => const SizedBox(height: CbSpacing.s3),
          itemBuilder: (_, i) => _CampaignCard(campaign: campaigns[i]),
        );
      },
    );
  }
}

// ── Campaign card ─────────────────────────────────────────────────────────────

class _CampaignCard extends StatelessWidget {
  const _CampaignCard({required this.campaign});

  final Campaign campaign;

  Color _statusColor(String status) {
    return switch (status) {
      'active' => CbColors.statusSuccess,
      'submitted' || 'approved' => CbColors.statusWarning,
      'draft' => CbColors.textTertiary,
      'cancelled' || 'completed' => CbColors.textDisabled,
      _ => CbColors.textTertiary,
    };
  }

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(CbSpacing.s4),
        decoration: BoxDecoration(
          color: CbColors.surfaceCard,
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          border: Border.all(color: CbColors.borderSubtle),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(campaign.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))),
            _StatusChip(label: campaign.status.toUpperCase(), color: _statusColor(campaign.status)),
          ]),
          const SizedBox(height: CbSpacing.s3),

          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: campaign.progressFraction,
              backgroundColor: CbColors.borderSubtle,
              valueColor: const AlwaysStoppedAnimation<Color>(CbColors.accentPrimary),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: CbSpacing.s2),
          Row(children: [
            Text(
              '\$${(campaign.pledgedCents / 100).toStringAsFixed(0)} of \$${(campaign.goalCents / 100).toStringAsFixed(0)}',
              style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
            ),
            const Spacer(),
            Text('${(campaign.progressFraction * 100).toStringAsFixed(0)}%', style: const TextStyle(color: CbColors.accentPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
          ]),
          if (campaign.status == 'active')
            Padding(
              padding: const EdgeInsets.only(top: CbSpacing.s2),
              child: Text('${campaign.backerCount} backers · ${campaign.daysRemaining} days left',
                  style: const TextStyle(color: CbColors.textTertiary, fontSize: 12)),
            ),
        ]),
      );
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color.withAlpha(25),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withAlpha(80)),
        ),
        child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
      );
}

// ── New campaign quick-start sheet ────────────────────────────────────────────

class _NewCampaignSheet extends ConsumerStatefulWidget {
  const _NewCampaignSheet();

  @override
  ConsumerState<_NewCampaignSheet> createState() => _NewCampaignSheetState();
}

class _NewCampaignSheetState extends ConsumerState<_NewCampaignSheet> {
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _goalCtrl = TextEditingController();
  final DateTime _deadline = DateTime.now().add(const Duration(days: 30));
  bool _isCreating = false;
  String? _error;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _goalCtrl.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    final title = _titleCtrl.text.trim();
    final desc = _descCtrl.text.trim();
    final goalDollars = double.tryParse(_goalCtrl.text);
    if (title.isEmpty || goalDollars == null || goalDollars < 10) {
      setState(() => _error = 'Title and goal ≥ \$10 required.');
      return;
    }
    setState(() { _isCreating = true; _error = null; });
    try {
      await MusicianService.instance.createCampaign(
        title: title,
        description: desc.isEmpty ? '(No description yet)' : desc,
        goalCents: (goalDollars * 100).round(),
        currency: 'USD',
        deadline: _deadline.toIso8601String(),
      );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Campaign draft created! Complete it on Creator Studio.'), backgroundColor: CbColors.statusSuccess),
        );
      }
    } on Exception catch (e) {
      setState(() { _isCreating = false; _error = e.toString().replaceAll('Exception:', '').trim(); });
    }
  }

  @override
  Widget build(BuildContext context) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF1C1C1F),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.fromLTRB(24, 12, 24, MediaQuery.of(context).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: CbColors.borderSubtle, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: CbSpacing.s5),
            Text('New Campaign', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const Text('Quick-start — complete full setup on Creator Studio.', style: TextStyle(color: CbColors.textSecondary, fontSize: 13)),
            const SizedBox(height: CbSpacing.s5),

            TextField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Campaign title', hintText: 'e.g. Fund my debut album'), maxLength: 120),
            const SizedBox(height: CbSpacing.s3),
            TextField(controller: _descCtrl, decoration: const InputDecoration(labelText: 'Short description (optional)'), maxLines: 2, maxLength: 500),
            const SizedBox(height: CbSpacing.s3),
            TextField(controller: _goalCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Funding goal (USD)', prefixText: '\$ ')),
            const SizedBox(height: CbSpacing.s4),

            if (_error != null)
              Padding(padding: const EdgeInsets.only(bottom: CbSpacing.s3), child: Text(_error!, style: const TextStyle(color: CbColors.statusError, fontSize: 13))),

            FilledButton(
              onPressed: _isCreating ? null : _create,
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
              child: _isCreating
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Create draft', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ],
        ),
      );
}
