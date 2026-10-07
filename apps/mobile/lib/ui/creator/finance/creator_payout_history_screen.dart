// Crowdbeats V2 — Payout History & Statements Screen (Phase 6)
// List of payouts with status badges (PAID, IN TRANSIT, FAILED), dates & receipts.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';

class PayoutRecord {
  const PayoutRecord({
    required this.id,
    required this.dateText,
    required this.bankText,
    required this.amountDollars,
    required this.status, // 'paid' | 'in_transit' | 'failed'
  });

  final String id;
  final String dateText;
  final String bankText;
  final double amountDollars;
  final String status;
}

class CreatorPayoutHistoryScreen extends StatelessWidget {
  const CreatorPayoutHistoryScreen({super.key});

  final List<PayoutRecord> _records = const [
    PayoutRecord(id: 'po_19284', dateText: 'Aug 28, 2026', bankText: 'Chase •••• 4821', amountDollars: 350, status: 'paid'),
    PayoutRecord(id: 'po_19241', dateText: 'Aug 21, 2026', bankText: 'Chase •••• 4821', amountDollars: 420, status: 'paid'),
    PayoutRecord(id: 'po_19198', dateText: 'Aug 14, 2026', bankText: 'Chase •••• 4821', amountDollars: 180, status: 'paid'),
    PayoutRecord(id: 'po_19150', dateText: 'Aug 07, 2026', bankText: 'Chase •••• 4821', amountDollars: 290, status: 'paid'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        title: const Text('Payout History & Statements', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('PAST DIRECT DEPOSITS', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          ..._records.map((rec) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                child: CbGlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: rec.status == 'paid'
                              ? const Color(0x2210B981)
                              : rec.status == 'in_transit'
                                  ? const Color(0x228B5CF6)
                                  : const Color(0x22EF4444),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          rec.status == 'paid'
                              ? Icons.check
                              : rec.status == 'in_transit'
                                  ? Icons.hourglass_top
                                  : Icons.error_outline,
                          color: rec.status == 'paid'
                              ? CbColors.statusLive
                              : rec.status == 'in_transit'
                                  ? CbColors.purpleLight
                                  : CbColors.statusError,
                          size: 16,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(rec.bankText, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                            Text('${rec.dateText} · ${rec.id}', style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '\$${rec.amountDollars.toStringAsFixed(2)}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15),
                          ),
                          const SizedBox(height: 2),
                          CbStatusBadge(
                            label: rec.status.toUpperCase(),
                            status: rec.status == 'paid' ? CbStatus.success : CbStatus.info,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              )),
        ],
      ),
    );
  }
}
