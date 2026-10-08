// Crowdbeats V2 — Application Review Modal
// Comprehensive bottom sheet / modal for evaluating sponsorship applications.
// Includes artist proposal, compensation, milestone schedule, interactive deliverables,
// and Accept / Counter Offer / Decline actions with min 48x48dp touch targets.

import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../models/sponsor_models.dart';

class ApplicationReviewModal extends StatefulWidget {
  const ApplicationReviewModal({
    super.key,
    required this.application,
    required this.onAccept,
    required this.onCounterOffer,
    required this.onDecline,
  });

  final SponsorshipApplication application;
  final VoidCallback onAccept;
  final void Function(int counterAmountCents, String note) onCounterOffer;
  final void Function(String? reason) onDecline;

  static Future<void> show(
    BuildContext context, {
    required SponsorshipApplication application,
    required VoidCallback onAccept,
    required void Function(int counterAmountCents, String note) onCounterOffer,
    required void Function(String? reason) onDecline,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ApplicationReviewModal(
        application: application,
        onAccept: () {
          Navigator.of(ctx).pop();
          onAccept();
        },
        onCounterOffer: (cents, note) {
          Navigator.of(ctx).pop();
          onCounterOffer(cents, note);
        },
        onDecline: (reason) {
          Navigator.of(ctx).pop();
          onDecline(reason);
        },
      ),
    );
  }

  @override
  State<ApplicationReviewModal> createState() => _ApplicationReviewModalState();
}

class _ApplicationReviewModalState extends State<ApplicationReviewModal> {
  bool _isCountering = false;
  late final TextEditingController _counterAmountController;
  final TextEditingController _counterNoteController = TextEditingController();
  final Set<int> _checkedDeliverables = {};

  @override
  void initState() {
    super.initState();
    // Default counter amount to proposed amount
    final defaultDollars = widget.application.proposedCompensationCents ~/ 100;
    _counterAmountController = TextEditingController(text: defaultDollars.toString());
    // All deliverables pre-checked as acknowledged
    for (var i = 0; i < widget.application.deliverables.length; i++) {
      _checkedDeliverables.add(i);
    }
  }

  @override
  void dispose() {
    _counterAmountController.dispose();
    _counterNoteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = widget.application;
    final talent = app.talent;
    final formattedEventDate =
        '${app.eventDate.month}/${app.eventDate.day}/${app.eventDate.year}';

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.90,
      ),
      decoration: const BoxDecoration(
        color: CbColors.surface1,
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
        border: Border(top: BorderSide(color: Color(0x338B5CF6), width: 1.5)),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Modal Handle Bar
            Padding(
              padding: const EdgeInsets.symmetric(vertical: CbSpacing.s3),
              child: Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),

            // Modal Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s5),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Application Review',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white60),
                    tooltip: 'Close Modal',
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            const Divider(color: Color(0x1AFFFFFF), height: 1),

            // Scrollable Content
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(CbSpacing.s5),
                children: [
                  // Talent Profile Card
                  Container(
                    padding: const EdgeInsets.all(CbSpacing.s4),
                    decoration: BoxDecoration(
                      color: CbColors.surface2,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
                      border: Border.all(color: const Color(0x14FFFFFF)),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: CbColors.purpleDim,
                          child: Text(
                            talent.name.substring(0, talent.name.length >= 2 ? 2 : 1).toUpperCase(),
                            style: const TextStyle(
                              color: CbColors.purpleLight,
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
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
                                      talent.name,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (talent.isVerified) ...[
                                    const SizedBox(width: 4),
                                    const Icon(Icons.verified, color: CbColors.verifiedBlue, size: 16),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${talent.type} · ${talent.primaryGenre} · ${talent.location}',
                                style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  _buildMiniBadge('${formatCompactNumber(talent.followerCount)} Fans'),
                                  const SizedBox(width: 6),
                                  _buildMiniBadge('${talent.averageDraw} Draw'),
                                  const SizedBox(width: 6),
                                  _buildMiniBadge('${talent.engagementRate}% Eng.', isAccent: true),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: CbSpacing.s4),

                  // Event Details Summary
                  Container(
                    padding: const EdgeInsets.all(CbSpacing.s4),
                    decoration: BoxDecoration(
                      color: CbColors.surface2,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'EVENT DETAILS',
                          style: TextStyle(
                            color: CbColors.purpleLight,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: CbSpacing.s2),
                        Text(
                          app.eventName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.place_outlined, color: CbColors.textMuted, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              '${app.venueName}, ${app.city}',
                              style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
                            ),
                            const SizedBox(width: 12),
                            const Icon(Icons.calendar_today_outlined, color: CbColors.textMuted, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              formattedEventDate,
                              style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: CbSpacing.s4),

                  // Artist Proposal Pitch
                  const Text(
                    'Artist Proposal & Brand Alignment',
                    style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: CbSpacing.s2),
                  Container(
                    padding: const EdgeInsets.all(CbSpacing.s4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F1118),
                      borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                      border: Border.all(color: const Color(0x14FFFFFF)),
                    ),
                    child: Text(
                      app.proposalText,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        height: 1.45,
                      ),
                    ),
                  ),

                  const SizedBox(height: CbSpacing.s4),

                  // Proposed Compensation Card
                  Container(
                    padding: const EdgeInsets.all(CbSpacing.s4),
                    decoration: BoxDecoration(
                      color: CbColors.surface2,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                      border: Border.all(color: const Color(0x247C3AED)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Proposed Compensation',
                              style: TextStyle(color: CbColors.textSecondary, fontSize: 12),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Standard Milestone Plan (50/50)',
                              style: TextStyle(color: CbColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                        Text(
                          formatCurrencyCents(app.proposedCompensationCents),
                          style: const TextStyle(
                            color: CbColors.liveGreen,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: CbSpacing.s4),

                  // Deliverables Checklist
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Deliverables Checklist',
                        style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '${_checkedDeliverables.length} of ${app.deliverables.length} agreed',
                        style: const TextStyle(color: CbColors.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                  const SizedBox(height: CbSpacing.s2),
                  ...app.deliverables.asMap().entries.map((entry) {
                    final index = entry.key;
                    final deliverable = entry.value;
                    final isChecked = _checkedDeliverables.contains(index);

                    return Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      decoration: BoxDecoration(
                        color: CbColors.surface2,
                        borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                      ),
                      child: CheckboxListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                        dense: true,
                        activeColor: CbColors.purpleMain,
                        title: Text(
                          deliverable,
                          style: TextStyle(
                            color: isChecked ? Colors.white : CbColors.textMuted,
                            fontSize: 13,
                          ),
                        ),
                        value: isChecked,
                        onChanged: (val) {
                          setState(() {
                            if (val == true) {
                              _checkedDeliverables.add(index);
                            } else {
                              _checkedDeliverables.remove(index);
                            }
                          });
                        },
                      ),
                    );
                  }),

                  // Counter-offer form section if active
                  if (_isCountering) ...[
                    const SizedBox(height: CbSpacing.s4),
                    Container(
                      padding: const EdgeInsets.all(CbSpacing.s4),
                      decoration: BoxDecoration(
                        color: const Color(0x337C3AED),
                        borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                        border: Border.all(color: CbColors.purpleLight),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Negotiate Counter Offer',
                            style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: CbSpacing.s3),
                          TextField(
                            controller: _counterAmountController,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            decoration: const InputDecoration(
                              labelText: 'Proposed Amount (USD \$)',
                              prefixText: '\$ ',
                              prefixStyle: TextStyle(color: CbColors.liveGreen, fontWeight: FontWeight.bold),
                              filled: true,
                              fillColor: CbColors.surface1,
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: CbSpacing.s3),
                          TextField(
                            controller: _counterNoteController,
                            maxLines: 2,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: const InputDecoration(
                              labelText: 'Note to Talent / Manager (optional)',
                              hintText: 'e.g. We love the proposal, but our tier budget caps at \$2,500.',
                              filled: true,
                              fillColor: CbColors.surface1,
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: CbSpacing.s3),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () => setState(() => _isCountering = false),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Colors.white70,
                                    side: const BorderSide(color: Colors.white24),
                                    minimumSize: const Size.fromHeight(48),
                                  ),
                                  child: const Text('Cancel'),
                                ),
                              ),
                              const SizedBox(width: CbSpacing.s3),
                              Expanded(
                                child: FilledButton(
                                  onPressed: () {
                                    final dollars = int.tryParse(_counterAmountController.text.trim()) ?? 0;
                                    widget.onCounterOffer(dollars * 100, _counterNoteController.text.trim());
                                  },
                                  style: FilledButton.styleFrom(
                                    backgroundColor: CbColors.purpleMain,
                                    minimumSize: const Size.fromHeight(48),
                                  ),
                                  child: const Text('Send Counter'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Action Buttons Bar (Minimum 48x48dp touch targets)
            if (!_isCountering)
              Container(
                padding: const EdgeInsets.all(CbSpacing.s4),
                decoration: const BoxDecoration(
                  color: CbColors.surface2,
                  border: Border(top: BorderSide(color: Color(0x1FFFFFFF), width: 1)),
                ),
                child: Row(
                  children: [
                    // Decline Button
                    Expanded(
                      flex: 2,
                      child: SizedBox(
                        height: 48,
                        child: OutlinedButton(
                          onPressed: () => widget.onDecline('Budget allocation exceeded'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: CbColors.errorRed,
                            side: const BorderSide(color: Color(0x33EF4444)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                            ),
                          ),
                          child: const Text('Decline', style: TextStyle(fontWeight: FontWeight.w600)),
                        ),
                      ),
                    ),
                    const SizedBox(width: CbSpacing.s2),
                    // Counter Offer Button
                    Expanded(
                      flex: 3,
                      child: SizedBox(
                        height: 48,
                        child: OutlinedButton(
                          onPressed: () => setState(() => _isCountering = true),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: CbColors.purpleLight,
                            side: const BorderSide(color: CbColors.purpleLight),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                            ),
                          ),
                          child: const Text('Counter Offer', style: TextStyle(fontWeight: FontWeight.w600)),
                        ),
                      ),
                    ),
                    const SizedBox(width: CbSpacing.s2),
                    // Accept Button
                    Expanded(
                      flex: 3,
                      child: SizedBox(
                        height: 48,
                        child: FilledButton(
                          onPressed: widget.onAccept,
                          style: FilledButton.styleFrom(
                            backgroundColor: CbColors.purpleMain,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                            ),
                          ),
                          child: const Text('Accept', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniBadge(String text, {bool isAccent = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: isAccent ? CbColors.purpleDim : const Color(0x1FFFFFFF),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: isAccent ? CbColors.purpleLight : CbColors.textSecondary,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
