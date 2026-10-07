import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/cb_colors.dart';

class BandCampaignsTab extends ConsumerWidget {
  const BandCampaignsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: CbColors.surfaceBase,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        elevation: 0,
        title: const Text(
          'Band Campaigns',
          style: TextStyle(
            color: CbColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: CbColors.surfaceCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: CbColors.borderSubtle),
            ),
            child: Column(
              children: [
                const Text('🚀', style: TextStyle(fontSize: 36)),
                const SizedBox(height: 12),
                const Text(
                  'Crowdfund Band Projects',
                  style: TextStyle(
                    color: CbColors.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Launch studio album pressings, tour bus funds, or merch drops shared across the band.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: CbColors.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CbColors.accentPrimary,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Manage full campaigns in the Web Band Studio.'),
                      ),
                    );
                  },
                  child: const Text('New Campaign', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
