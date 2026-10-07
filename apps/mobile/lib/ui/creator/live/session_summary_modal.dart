// Crowdbeats V2 — Session Summary Modal (Phase 4)
// End-of-performance financial reconciliation, tip count, split allocations, and ledger credits.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class SessionSummaryModal extends StatelessWidget {
  const SessionSummaryModal({
    super.key,
    required this.performerName,
    required this.venueName,
    required this.durationText,
    required this.grossTipsCents,
    required this.tipCount,
    required this.newFollowers,
    this.isBand = false,
    this.userSplitPercent = 100,
    required this.onDone,
  });

  final String performerName;
  final String venueName;
  final String durationText;
  final int grossTipsCents;
  final int tipCount;
  final int newFollowers;
  final bool isBand;
  final int userSplitPercent;
  final VoidCallback onDone;

  static Future<void> show(
    BuildContext context, {
    required String performerName,
    required String venueName,
    required String durationText,
    required int grossTipsCents,
    required int tipCount,
    required int newFollowers,
    bool isBand = false,
    int userSplitPercent = 100,
    required VoidCallback onDone,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isDismissible: false,
      enableDrag: false,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => SessionSummaryModal(
        performerName: performerName,
        venueName: venueName,
        durationText: durationText,
        grossTipsCents: grossTipsCents,
        tipCount: tipCount,
        newFollowers: newFollowers,
        isBand: isBand,
        userSplitPercent: userSplitPercent,
        onDone: onDone,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final grossDollars = (grossTipsCents / 100.0).toStringAsFixed(2);
    final userSplitDollars = ((grossTipsCents * userSplitPercent / 100) / 100.0).toStringAsFixed(2);

    return Container(
      height: MediaQuery.of(context).size.height * 0.78,
      decoration: const BoxDecoration(
        color: CbColors.surfaceCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Color(0x2210B981),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle, color: CbColors.statusLive, size: 36),
          ),
          const SizedBox(height: 12),
          const Text('Performance Completed!', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
          Text('$venueName · $durationText', style: const TextStyle(color: CbColors.textSecondary, fontSize: 13)),
          const SizedBox(height: 20),

          // Total Earnings Glass Card
          CbGlassCard(
            padding: const EdgeInsets.all(16),
            backgroundColor: const Color(0x228B5CF6),
            borderColor: const Color(0x668B5CF6),
            child: Column(
              children: [
                const Text('GROSS TIPS COLLECTED', style: TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
                const SizedBox(height: 4),
                Text(
                  '\$$grossDollars',
                  style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
                ),
                if (isBand) ...[
                  const SizedBox(height: 8),
                  const Divider(color: Colors.white12, height: 1),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Your Split ($userSplitPercent%):', style: const TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                      Text('\$$userSplitDollars', style: const TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Stat Grid
          Row(
            children: [
              Expanded(
                child: CbGlassCard(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      const Icon(Icons.volunteer_activism, color: CbColors.purpleLight, size: 18),
                      const SizedBox(height: 4),
                      Text('$tipCount', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      const Text('Tippers', style: TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: CbGlassCard(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      const Icon(Icons.favorite, color: CbColors.heartOrange, size: 18),
                      const SizedBox(height: 4),
                      Text('+$newFollowers', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      const Text('New Fans', style: TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const Spacer(),

          // Done Button
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: CbColors.purpleMain,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
              ),
              onPressed: onDone,
              child: const Text('Back to Creator Dashboard', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
            ),
          ),
        ],
      ),
    );
  }
}
