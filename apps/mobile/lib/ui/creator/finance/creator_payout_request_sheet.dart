// Crowdbeats V2 — Direct Payout Request Bottom Sheet (Phase 11)
// Standard ACH vs Instant Payout, live fee breakdown, failure simulation & recovery.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

enum PayoutSpeed {
  standardAch,
  instant,
}

class CreatorPayoutRequestSheet extends StatefulWidget {
  const CreatorPayoutRequestSheet({
    super.key,
    required this.availableBalanceDollars,
    required this.onPayoutSubmitted,
    this.initialFail = false,
  });

  final double availableBalanceDollars;
  final ValueChanged<double> onPayoutSubmitted;
  final bool initialFail;

  static Future<void> show(
    BuildContext context, {
    required double availableBalanceDollars,
    required ValueChanged<double> onPayoutSubmitted,
    bool initialFail = false,
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
          initialFail: initialFail,
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
  String? _payoutFailureMessage;
  PayoutSpeed _selectedSpeed = PayoutSpeed.standardAch;

  @override
  void initState() {
    super.initState();
    _amountController = TextEditingController(text: widget.availableBalanceDollars.toStringAsFixed(2));
    if (widget.initialFail) {
      _payoutFailureMessage = 'Previous settlement failed: Expired debit card credentials. Please update or retry.';
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  double get _currentAmount => double.tryParse(_amountController.text.trim()) ?? 0.0;
  double get _transferFee => _selectedSpeed == PayoutSpeed.instant ? (_currentAmount * 0.01) : 0.0;
  double get _netPayout => (_currentAmount - _transferFee).clamp(0.0, double.infinity);

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
      _payoutFailureMessage = null;
      _isSubmitting = true;
    });

    // If amount is exactly 999.0, simulate recoverable failure
    if (amount == 999.0) {
      Future.delayed(const Duration(milliseconds: 600), () {
        if (mounted) {
          setState(() {
            _isSubmitting = false;
            _payoutFailureMessage = 'Settlement Declined: Bank network rejected instant transfer. Please retry via Standard ACH.';
          });
        }
      });
      return;
    }

    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        widget.onPayoutSubmitted(amount);
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Payout of \$${amount.toStringAsFixed(2)} initiated to Chase Checking (•••• 4821) via ${_selectedSpeed == PayoutSpeed.instant ? "Instant Payout" : "Standard ACH"}',
            ),
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

          // Destination Bank Card
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
                      Row(
                        children: [
                          Text('Chase Checking (•••• 4821)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          SizedBox(width: 6),
                          Icon(Icons.verified, size: 12, color: CbColors.statusLive),
                        ],
                      ),
                      Text('Stripe Express Connected · Direct Payouts Active', style: TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Payout Speed Selectors
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedSpeed = PayoutSpeed.standardAch),
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _selectedSpeed == PayoutSpeed.standardAch ? const Color(0x2210B981) : CbColors.surfaceBase,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: _selectedSpeed == PayoutSpeed.standardAch ? CbColors.statusLive : Colors.white12,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Standard ACH', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                            if (_selectedSpeed == PayoutSpeed.standardAch)
                              const Icon(Icons.check_circle, size: 14, color: CbColors.statusLive),
                          ],
                        ),
                        const SizedBox(height: 2),
                        const Text(r'1-2 days · Free ($0 fee)', style: TextStyle(color: CbColors.tealGas, fontSize: 10)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedSpeed = PayoutSpeed.instant),
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _selectedSpeed == PayoutSpeed.instant ? const Color(0x228B5CF6) : CbColors.surfaceBase,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: _selectedSpeed == PayoutSpeed.instant ? CbColors.purpleLight : Colors.white12,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Instant Payout', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                            if (_selectedSpeed == PayoutSpeed.instant)
                              const Icon(Icons.check_circle, size: 14, color: CbColors.purpleLight),
                          ],
                        ),
                        const SizedBox(height: 2),
                        const Text('Within 30 mins · 1.0% fee', style: TextStyle(color: CbColors.purpleLight, fontSize: 10)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Amount Input
          const Text('PAYOUT AMOUNT (USD)', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          TextField(
            controller: _amountController,
            onChanged: (_) => setState(() {}),
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
          const SizedBox(height: 14),

          // Live Settlement Breakdown
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: const Color(0x0AFFFFFF), borderRadius: BorderRadius.circular(8)),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Gross Cash-Out:', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                    Text('\$${_currentAmount.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Platform Fee:', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                    const Text(r'$0.00', style: TextStyle(color: CbColors.statusLive, fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(_selectedSpeed == PayoutSpeed.instant ? 'Instant Payout Fee (1.0%):' : 'ACH Transfer Fee:', style: const TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                    Text(
                      _selectedSpeed == PayoutSpeed.instant ? '-\$${_transferFee.toStringAsFixed(2)}' : r'$0.00',
                      style: TextStyle(color: _selectedSpeed == PayoutSpeed.instant ? Colors.white70 : CbColors.statusLive, fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                  ],
                ),
                const Divider(color: Colors.white12, height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Net Amount to Bank:', style: TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.bold, fontSize: 12)),
                    Text('\$${_netPayout.toStringAsFixed(2)}', style: const TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.w900, fontSize: 14)),
                  ],
                ),
              ],
            ),
          ),

          // Failure Recovery Notice if any
          if (_payoutFailureMessage != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0x22EF4444),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0x66EF4444)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Color(0xFFF87171), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(_payoutFailureMessage!, style: const TextStyle(color: Color(0xFFF87171), fontSize: 11)),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 16),

          // Submit / Retry Action Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _payoutFailureMessage != null ? const Color(0xFFF59E0B) : CbColors.tealGas,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
              ),
              onPressed: _isSubmitting ? null : _validateAndSubmit,
              child: _isSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : Text(
                      _payoutFailureMessage != null ? 'Retry Settlement' : 'Confirm & Transfer Funds',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
