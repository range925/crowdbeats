import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../state/band_state.dart';
import '../../theme/cb_colors.dart';

class BandProfileTab extends ConsumerWidget {
  const BandProfileTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final band = ref.watch(bandProvider);

    return Scaffold(
      backgroundColor: CbColors.surfaceBase,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        elevation: 0,
        title: const Text(
          'Band EPK & Profile',
          style: TextStyle(
            color: CbColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // EPK Header
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: CbColors.surfaceRaised,
                  child: Text(
                    band.bandName.isNotEmpty ? band.bandName[0].toUpperCase() : 'B',
                    style: const TextStyle(
                      color: CbColors.accentPrimary,
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  band.bandName.isNotEmpty ? band.bandName : 'Band Profile',
                  style: const TextStyle(
                    color: CbColors.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${band.members.length} Members • Split v${band.splitVersion}',
                  style: const TextStyle(
                    color: CbColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Band Studio Web CTA
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1E1B4B), Color(0xFF18181B)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0x33818CF8)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Text('💻', style: TextStyle(fontSize: 20)),
                    SizedBox(width: 8),
                    Text(
                      'Band Studio (Web)',
                      style: TextStyle(
                        color: CbColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Access treasury logs, document signing, multi-member split simulator, and brand sponsor deals.',
                  style: TextStyle(color: CbColors.textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF818CF8),
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Open crowdbeats.app/band/dashboard in your browser'),
                      ),
                    );
                  },
                  child: const Text('Open Band Studio', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
