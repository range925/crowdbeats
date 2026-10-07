// Crowdbeats V2 — Band Treasury & Member Payout Ledger Screen (Phase 7)
// Collective band treasury balance, member distribution claims & split payout history.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class MemberClaimRecord {
  const MemberClaimRecord({
    required this.name,
    required this.splitPercent,
    required this.claimableDollars,
  });

  final String name;
  final int splitPercent;
  final double claimableDollars;
}

class BandTreasuryScreen extends StatefulWidget {
  const BandTreasuryScreen({super.key});

  @override
  State<BandTreasuryScreen> createState() => _BandTreasuryScreenState();
}

class _BandTreasuryScreenState extends State<BandTreasuryScreen> {
  final double _totalTreasury = 1850;
  double _myClaimable = 740; // 40% of $1850

  final List<MemberClaimRecord> _allocations = const [
    MemberClaimRecord(name: 'David Naufahu (You)', splitPercent: 40, claimableDollars: 740),
    MemberClaimRecord(name: 'Marcus Turner', splitPercent: 30, claimableDollars: 555),
    MemberClaimRecord(name: 'Alicia Vance', splitPercent: 30, claimableDollars: 555),
  ];

  void _handleClaimSplit() {
    setState(() => _myClaimable = 0);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(r'Payout of $740.00 initiated to your personal bank account!'),
        backgroundColor: CbColors.statusLive,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CbColors.bgApp,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        title: const Text('Band Treasury Ledger', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Band Collective Treasury Card
          CbGlassCard(
            padding: const EdgeInsets.all(18),
            backgroundColor: const Color(0x228B5CF6),
            borderColor: const Color(0x668B5CF6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('BAND COLLECTIVE TREASURY', style: TextStyle(color: CbColors.purpleLight, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
                const SizedBox(height: 6),
                Text(
                  '\$${_totalTreasury.toStringAsFixed(2)}',
                  style: const TextStyle(color: Colors.white, fontSize: 34, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 4),
                const Text('The Midnight Echoes · Total gross earnings pooled across shows & crowdfunding.', style: TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                const SizedBox(height: 16),
                const Divider(color: Colors.white12, height: 1),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Your Personal Split Allocation (40%):', style: TextStyle(color: CbColors.textSecondary, fontSize: 12)),
                    Text('\$${_myClaimable.toStringAsFixed(2)}', style: const TextStyle(color: CbColors.tealGas, fontWeight: FontWeight.bold, fontSize: 15)),
                  ],
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: CbColors.tealGas,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    ),
                    onPressed: _myClaimable > 0 ? _handleClaimSplit : null,
                    child: const Text('Withdraw My 40% Split', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Member Distribution Breakdown
          const Text('MEMBER SPLIT RECONCILIATION', style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          ..._allocations.map((a) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                child: CbGlassCard(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(a.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                            Text('${a.splitPercent}% Contract Allocation', style: const TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                          ],
                        ),
                      ),
                      Text(
                        '\$${a.claimableDollars.toStringAsFixed(2)}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
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
