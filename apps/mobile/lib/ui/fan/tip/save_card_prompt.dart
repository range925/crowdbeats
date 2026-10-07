// Crowdbeats V2 — Save Card Prompt (Phase 6b)
//
// Shown once after a fan's first successful tip when no default
// payment method is saved yet. User can save (YES) or skip (NOT NOW).
//
// "Save" calls setDefaultPaymentMethod + stores a SharedPreferences flag
// so subsequent tips use the ••••1234 fast path.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../firebase/payment_service.dart';
import '../../theme/cb_colors.dart';

/// SharedPreferences key that marks a default PM has been chosen.
const String kHasSavedPmKey = 'cb_has_saved_pm';

/// Shows the save-card bottom sheet and returns true if user saved.
Future<bool> showSaveCardPrompt(
  BuildContext context,
  WidgetRef ref, {
  required String paymentMethodId,
  required String brand,
  required String last4,
}) async {
  final saved = await showModalBottomSheet<bool>(
    context: context,
    backgroundColor: Colors.transparent,
    isDismissible: true,
    builder: (_) => _SaveCardSheet(
      paymentMethodId: paymentMethodId,
      brand: brand,
      last4: last4,
    ),
  );
  return saved == true;
}

class _SaveCardSheet extends ConsumerStatefulWidget {
  const _SaveCardSheet({
    required this.paymentMethodId,
    required this.brand,
    required this.last4,
  });

  final String paymentMethodId;
  final String brand;
  final String last4;

  @override
  ConsumerState<_SaveCardSheet> createState() => _SaveCardSheetState();
}

class _SaveCardSheetState extends ConsumerState<_SaveCardSheet> {
  bool _saving = false;

  Future<void> _onSave() async {
    setState(() => _saving = true);
    try {
      await PaymentService.instance.setDefaultPaymentMethod(widget.paymentMethodId);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(kHasSavedPmKey, true);
      if (mounted) Navigator.of(context).pop(true);
    } catch (_) {
      // Non-fatal: user can save from Profile later
      if (mounted) Navigator.of(context).pop(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final brand = widget.brand[0].toUpperCase() + widget.brand.substring(1);

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      decoration: BoxDecoration(
        color: CbColors.surfaceCard,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Card icon
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: CbColors.accentPrimary.withAlpha(26),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.credit_card_rounded,
                  color: CbColors.accentPrimary, size: 28),
            ),

            const SizedBox(height: 16),

            Text(
              'Save card for faster tips?',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              '$brand ••••${widget.last4} will be your default payment method.\n'
              'Next time you tip, skip straight to confirm.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: CbColors.textSecondary,
                    height: 1.5,
                  ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 28),

            // YES button
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _saving ? null : _onSave,
                style: FilledButton.styleFrom(
                  backgroundColor: CbColors.accentPrimary,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: _saving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.black,
                        ),
                      )
                    : const Text('Yes, save card',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 15)),
              ),
            ),

            const SizedBox(height: 12),

            // NOT NOW
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: _saving
                    ? null
                    : () => Navigator.of(context).pop(false),
                child: const Text(
                  'Not now',
                  style: TextStyle(color: CbColors.textSecondary),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
