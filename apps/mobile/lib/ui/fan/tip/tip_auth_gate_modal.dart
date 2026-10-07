// Crowdbeats V2 — Tip Auth Gate Modal
//
// Displayed when an unauthenticated visitor attempts to tip an artist/band.
// Preserves the selected amount & recipient and returns to confirmation upon auth.

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/models/discovery.dart';
import '../../../state/tip_state.dart';
import '../../theme/cb_colors.dart';
import '../../theme/cb_spacing.dart';
import '../../components/cb_button.dart';
import '../../components/cb_outline_button.dart';

class TipAuthGateModal extends ConsumerWidget {
  const TipAuthGateModal({
    super.key,
    required this.pendingContext,
    this.from,
  });

  final PendingTipContext pendingContext;
  final String? from;

  static Future<bool?> show(
    BuildContext context, {
    PendingTipContext? pendingContext,
    String? creatorId,
    String? creatorSlug,
    String? creatorName,
    String? creatorType,
    int? initialAmountCents,
    String? from,
  }) {
    final contextToUse = pendingContext ??
        PendingTipContext(
          creatorId: creatorId ?? '',
          creatorSlug: creatorSlug,
          creatorName: creatorName ?? 'Artist',
          creatorType: creatorType ?? 'artist',
          selectedTipAmountCents: initialAmountCents ?? 2000,
          currency: 'USD',
          sourceScreen: 'discovery',
        );

    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => TipAuthGateModal(
        pendingContext: contextToUse,
        from: from,
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final amountDollars = (pendingContext.selectedTipAmountCents / 100).toStringAsFixed(0);

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
          decoration: const BoxDecoration(
            color: Color(0xF0131315),
            borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
            border: Border(
              top: BorderSide(color: Color(0x33FFFFFF), width: 1),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Creator & Amount Chip
              Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: CbColors.purpleMain.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusFull),
                    border: Border.all(color: CbColors.purpleMain.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.music_note, color: CbColors.purpleLight, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        '${pendingContext.creatorName}  •  \$$amountDollars',
                        style: const TextStyle(
                          color: CbColors.purpleLight,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Title
              Text(
                'Sign in to tip ${pendingContext.creatorName}',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.5,
                ),
              ),

              const SizedBox(height: 8),

              // Explanatory Subtitle
              Text(
                'You will return directly to confirm your \$$amountDollars tip after signing in. You will not be charged automatically.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 13,
                  height: 1.4,
                ),
              ),

              const SizedBox(height: 28),

              // Continue with Google
              // Continue with Google (where supported)
              CbButton(
                label: 'Continue with Google',
                onPressed: () {
                  ref.read(tipFlowProvider.notifier).savePendingTipContext(pendingContext);
                  Navigator.of(context).pop(true);
                  final target = pendingContext.creatorSlug ?? pendingContext.creatorId;
                  final returnRoute = from ?? '/artist/$target';
                  context.push('/auth?from=${Uri.encodeComponent(returnRoute)}');
                },
              ),

              const SizedBox(height: 12),

              // Continue with Apple (where supported)
              CbOutlineButton(
                label: 'Continue with Apple',
                onPressed: () {
                  ref.read(tipFlowProvider.notifier).savePendingTipContext(pendingContext);
                  Navigator.of(context).pop(true);
                  final target = pendingContext.creatorSlug ?? pendingContext.creatorId;
                  final returnRoute = from ?? '/artist/$target';
                  context.push('/auth?from=${Uri.encodeComponent(returnRoute)}');
                },
              ),

              const SizedBox(height: 12),

              // Sign in with Email / Password
              TextButton(
                onPressed: () {
                  ref.read(tipFlowProvider.notifier).savePendingTipContext(pendingContext);
                  Navigator.of(context).pop(true);
                  final target = pendingContext.creatorSlug ?? pendingContext.creatorId;
                  final returnRoute = from ?? '/artist/$target';
                  context.push('/auth?from=${Uri.encodeComponent(returnRoute)}');
                },
                child: const Text(
                  'Sign in with email',
                  style: TextStyle(
                    color: CbColors.textSecondary,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),

              const SizedBox(height: 4),

              // Cancel
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: Text(
                  'Cancel',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.4),
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
