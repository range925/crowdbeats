// Crowdbeats V2 — Direct Payout Request Bottom Sheet (Phase 6)
// Amount input, min $10 validation, over-balance guard, fee disclosure ($0) & submit.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class CreatorPayoutRequestSheet extends StatefulWidget {
  const CreatorPayoutRequestSheet({
    super.key,
    required this.availableBalanceDollars,
    required this.onPayoutSubmitted,
  });

  final double availableBalanceDollars;
  final ValueChanged<double> onPayoutSubmitted;

  static Future<void> show(
    BuildContext context, {
    required double availableBalanceDollars,
    required ValueChanged<double> onPayoutSubmitted,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: CreatorPayoutRequestSheet(
          availableBalanceDollars: availableBalanceDollars,
          onPayoutSubmitted: onPayoutSubmitted,
        ),
      ),
    );
  }

  @override
  State<CreatorPayoutRequestSheet> createState() => _CreatorPayoutRequestSheetState();
}

class _CreatorPayoutRequestSheetState extends State<CreatorPayoutRequestSheet> {
  late final TextEditingController _amountController;
  String? _errorText;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _amountController = TextEditingController(text: widget.availableBalanceDollars.toStringAsFixed(2));
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  void _validateAndSubmit() {
    final amount = double.tryParse(_amountController.text.trim());
    if (amount == null || amount < 10.0) {
      setState(() => _errorText = 'Minimum payout amount is \$10.00');
      return;
    }
    if (amount > widget.availableBalanceDollars) {
      setState(() => _errorText = 'Amount exceeds available balance (\$${widget.availableBalanceDollars.toStringAsFixed(2)})');
      return;
    }

    setState(() {
      _errorText = null;
      _isSubmitting = true;
    });

    Future.delayed(const Duration(milliseconds: 700), () {
      if (mounted) {
        widget.onPayoutSubmitted(amount);
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payout of \$${amount.toStringAsFixed(2)} initiated to Chase Checking (•••• 4821)'),
            backgroundColor: CbColors.statusLive,
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: CbColors.surfaceCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag Handle
          Center(
            child: Container(width: 36, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
          ),
          const SizedBox(height: 16),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Request Direct Payout', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.white54, size: 20),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Destination Card
          const CbGlassCard(
            padding: EdgeInsets.all(12),
            child: Row(
              children: [
                Icon(Icons.account_balance, color: CbColors.tealGas, size: 20),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Chase Checking (•••• 4821)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      Text('Standard ACH Transfer · Estimated 1-2 business days', style: TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Amount Input
          const Text('PAYOUT AMOUNT (USD)', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          TextField(
            controller: _amountController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            decoration: InputDecoration(
              prefixText: r'$ ',
              prefixStyle: const TextStyle(color: CbColors.tealGas, fontSize: 18, fontWeight: FontWeight.bold),
              filled: true,
              fillColor: CbColors.surfaceBase,
              errorText: _errorText,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Available to withdraw: \$${widget.availableBalanceDollars.toStringAsFixed(2)}',
            style: const TextStyle(color: CbColors.textMuted, fontSize: 11),
          ),
          const SizedBox(height: 16),

          // Fee Disclosure Table
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: const Color(0x0AFFFFFF), borderRadius: BorderRadius.circular(8)),
            child: const Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Transfer Fee:', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                    Text(r'$0.00 (Standard ACH)', style: TextStyle(color: CbColors.statusLive, fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
                SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Crowdbeats Platform Payout Fee:', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                    Text(r'$0.00', style: TextStyle(color: CbColors.statusLive, fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Submit Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: CbColors.tealGas,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
              ),
              onPressed: _isSubmitting ? null : _validateAndSubmit,
              child: _isSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Text('Confirm & Transfer Funds', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ),
        ],
      ),
    );
  }
}
