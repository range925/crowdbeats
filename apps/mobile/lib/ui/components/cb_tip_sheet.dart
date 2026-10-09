// Crowdbeats V2 — Sliding Tip Sheet (Stitch Screen 6249cbed29cc48daa8bcb5ba0b28b9da)
// Implements 32dp top-radius DraggableScrollableSheet for live tipping.
// Preserves integer cents (amountCents) and transparent 6% platform fee + Stripe processing fee itemization.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import '../theme/cb_theme.dart';
import '../theme/cb_typography.dart';
import '../../data/services/stripe_fee_service.dart';
import '../../data/models/money.dart';
import 'cb_button.dart';
import 'cb_tip_preset_card.dart';

class CbTipSheet extends StatefulWidget {
  const CbTipSheet({
    super.key,
    required this.performerName,
    required this.performerId,
    this.isLive = true,
    this.initialAmountCents = 1000,
    this.onConfirmTip,
  });

  final String performerName;
  final String performerId;
  final bool isLive;
  final int initialAmountCents;
  final void Function(int amountCents, String? cheerMessage, bool isAnonymous)? onConfirmTip;

  static Future<void> show({
    required BuildContext context,
    required String performerName,
    required String performerId,
    bool isLive = true,
    int initialAmountCents = 1000,
    void Function(int amountCents, String? cheerMessage, bool isAnonymous)? onConfirmTip,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CbTipSheet(
        performerName: performerName,
        performerId: performerId,
        isLive: isLive,
        initialAmountCents: initialAmountCents,
        onConfirmTip: onConfirmTip,
      ),
    );
  }

  @override
  State<CbTipSheet> createState() => _CbTipSheetState();
}

class _CbTipSheetState extends State<CbTipSheet> {
  late int _selectedAmountCents;
  bool _isCustom = false;
  bool _isAnonymous = false;
  late final TextEditingController _customAmountController;
  late final TextEditingController _cheerMessageController;
  late final FocusNode _customAmountFocus;

  static const List<int> _presetCents = [200, 500, 1000, 2000];

  @override
  void initState() {
    super.initState();
    _selectedAmountCents = widget.initialAmountCents;
    _isCustom = !_presetCents.contains(_selectedAmountCents);
    _customAmountController = TextEditingController(
      text: _isCustom ? (_selectedAmountCents / 100).toStringAsFixed(0) : '',
    );
    _cheerMessageController = TextEditingController();
    _customAmountFocus = FocusNode();
  }

  @override
  void dispose() {
    _customAmountController.dispose();
    _cheerMessageController.dispose();
    _customAmountFocus.dispose();
    super.dispose();
  }

  void _selectPreset(int cents) {
    setState(() {
      _isCustom = false;
      _selectedAmountCents = cents;
      _customAmountController.clear();
      _customAmountFocus.unfocus();
    });
  }

  void _onCustomChanged(String text) {
    final parsed = int.tryParse(text);
    if (parsed != null && parsed > 0) {
      setState(() {
        _selectedAmountCents = parsed * 100;
      });
    }
  }

  String _formatCents(int cents) {
    final dollars = cents / 100.0;
    return '\$${dollars.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<CbThemeExtension>() ?? CbThemeExtension.defaults;
    final breakdown = StripeFeeService.instance.calculateNetTipPayout(
      grossAmountCents: _selectedAmountCents,
      currency: Iso4217CurrencyCode.usd,
    );

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (ctx, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: ext.surfaceOverlay,
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(CbSpacing.radiusXl), // 32dp
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(80),
                blurRadius: 20,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Column(
            children: [
              const SizedBox(height: CbSpacing.s3),
              // Drag handle 36x4dp
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: ext.borderStrong,
                    borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                  ),
                ),
              ),
              const SizedBox(height: CbSpacing.s3),

              // Scrollable content area
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  physics: const ClampingScrollPhysics(),
                  padding: EdgeInsets.only(
                    left: CbSpacing.s5,
                    right: CbSpacing.s5,
                    bottom: MediaQuery.of(context).viewInsets.bottom + CbSpacing.s4,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Header Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    if (widget.isLive) ...[
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: ext.statusLiveBg,
                                          borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Container(
                                              width: 6,
                                              height: 6,
                                              decoration: BoxDecoration(
                                                color: ext.statusLive,
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              'LIVE NOW',
                                              style: GoogleFonts.plusJakartaSans(
                                                color: ext.statusLive,
                                                fontSize: 10,
                                                fontWeight: FontWeight.w800,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                    ],
                                    Flexible(
                                      child: Text(
                                        'Tip Performer',
                                        style: CbTypography.sectionTitle(color: ext.textPrimary),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  widget.performerName,
                                  style: CbTypography.bodyMd(color: ext.textSecondary),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: Icon(Icons.close, color: ext.textSecondary),
                            onPressed: () => Navigator.of(context).pop(),
                            tooltip: 'Close',
                          ),
                        ],
                      ),
                      const SizedBox(height: CbSpacing.s5),

                      // Preset Chips
                      Text(
                        'SELECT AMOUNT',
                        style: GoogleFonts.plusJakartaSans(
                          color: ext.textTertiary,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: CbSpacing.s2_5),
                      Row(
                        children: [
                          for (final cents in _presetCents)
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 3),
                                child: CbTipPresetCard(
                                  amountLabel: '\$${cents ~/ 100}',
                                  isSelected: !_isCustom && _selectedAmountCents == cents,
                                  onTap: () => _selectPreset(cents),
                                ),
                              ),
                            ),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 3),
                              child: CbTipPresetCard(
                                amountLabel: 'Custom',
                                isSelected: _isCustom,
                                onTap: () {
                                  setState(() {
                                    _isCustom = true;
                                  });
                                  _customAmountFocus.requestFocus();
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: CbSpacing.s4),

                      // Custom Amount Input (visible when Custom is selected)
                      if (_isCustom) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s4, vertical: CbSpacing.s2),
                          decoration: BoxDecoration(
                            color: ext.surfaceCard,
                            borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                            border: Border.all(color: ext.borderFocus, width: 1.5),
                          ),
                          child: Row(
                            children: [
                              Text(
                                '\$',
                                style: CbTypography.monoNumberLg(color: ext.textPrimary),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextField(
                                  controller: _customAmountController,
                                  focusNode: _customAmountFocus,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                                  style: CbTypography.monoNumberLg(color: ext.textPrimary),
                                  decoration: InputDecoration(
                                    border: InputBorder.none,
                                    hintText: 'Enter amount',
                                    hintStyle: CbTypography.bodyLg(color: ext.textTertiary),
                                  ),
                                  onChanged: _onCustomChanged,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: CbSpacing.s4),
                      ],

                      // Transparent Fee Breakdown Card
                      Container(
                        padding: const EdgeInsets.all(CbSpacing.s4),
                        decoration: BoxDecoration(
                          color: ext.surfaceCard,
                          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                          border: Border.all(color: ext.borderSubtle, width: 1),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Performer Net Payout',
                                  style: CbTypography.bodyMd(color: ext.textSecondary),
                                ),
                                Text(
                                  _formatCents(breakdown.netAmountCents),
                                  style: CbTypography.monoNumberMd(color: ext.statusSuccess),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Platform Fee (6%)',
                                  style: CbTypography.bodySm(color: ext.textTertiary),
                                ),
                                Text(
                                  _formatCents(breakdown.platformFeeCents),
                                  style: CbTypography.monoNumberSm(color: ext.textTertiary),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Stripe Processing Fee',
                                  style: CbTypography.bodySm(color: ext.textTertiary),
                                ),
                                Text(
                                  _formatCents(breakdown.stripeFeeCents),
                                  style: CbTypography.monoNumberSm(color: ext.textTertiary),
                                ),
                              ],
                            ),
                            const Divider(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Total Charge',
                                  style: CbTypography.labelMd(color: ext.textPrimary),
                                ),
                                Text(
                                  _formatCents(breakdown.grossAmountCents),
                                  style: CbTypography.monoNumberMd(color: ext.textPrimary),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: CbSpacing.s4),

                      // Cheer Message Field
                      TextField(
                        controller: _cheerMessageController,
                        maxLength: 140,
                        maxLines: 2,
                        style: CbTypography.bodyMd(color: ext.textPrimary),
                        decoration: InputDecoration(
                          hintText: 'Add an encouraging shoutout… (optional)',
                          hintStyle: CbTypography.bodyMd(color: ext.textTertiary),
                          filled: true,
                          fillColor: ext.surfaceCard,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                            borderSide: BorderSide(color: ext.borderSubtle),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                            borderSide: BorderSide(color: ext.borderSubtle),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                            borderSide: BorderSide(color: ext.borderFocus, width: 1.5),
                          ),
                        ),
                      ),
                      const SizedBox(height: CbSpacing.s2),

                      // Anonymous Toggle
                      InkWell(
                        onTap: () => setState(() => _isAnonymous = !_isAnonymous),
                        borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              Checkbox(
                                value: _isAnonymous,
                                activeColor: ext.borderFocus,
                                onChanged: (v) => setState(() => _isAnonymous = v ?? false),
                              ),
                              Expanded(
                                child: Text(
                                  'Tip anonymously (hide my name from audience ticker)',
                                  style: CbTypography.bodySm(color: ext.textSecondary),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: CbSpacing.s4),
                    ],
                  ),
                ),
              ),

              // Docked Bottom Action Tray
              Container(
                padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s5, vertical: CbSpacing.s3),
                decoration: BoxDecoration(
                  color: ext.surfaceRaised,
                  border: Border(top: BorderSide(color: ext.borderSubtle, width: 1)),
                ),
                child: SafeArea(
                  top: false,
                  child: CbButton(
                    label: 'Send ${_formatCents(_selectedAmountCents)} Tip',
                    fullWidth: true,
                    size: CbButtonSize.md,
                    onPressed: (_selectedAmountCents >= 100 && _selectedAmountCents <= 50000)
                        ? () {
                            widget.onConfirmTip?.call(
                              _selectedAmountCents,
                              _cheerMessageController.text.trim().isEmpty ? null : _cheerMessageController.text.trim(),
                              _isAnonymous,
                            );
                            Navigator.of(context).pop();
                          }
                        : null,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
