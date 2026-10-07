import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../state/band_state.dart';
import '../../theme/cb_colors.dart';

class BandHomeTab extends ConsumerWidget {
  const BandHomeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final band = ref.watch(bandProvider);

    if (band.isLoading) {
      return const Center(child: CircularProgressIndicator(color: CbColors.accentPrimary));
    }

    if (band.activeBandId == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                '🎸',
                style: TextStyle(fontSize: 48),
              ),
              const SizedBox(height: 16),
              const Text(
                'No Active Band',
                style: TextStyle(
                  color: CbColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Create a new band or accept an invitation to get started.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: CbColors.textSecondary,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: CbColors.accentPrimary,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () => _showCreateBandModal(context, ref),
                child: const Text('Create a Band', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      );
    }

    final totalDollars = (band.totalTipsReceivedCents / 100).toStringAsFixed(2);

    return Scaffold(
      backgroundColor: CbColors.surfaceBase,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        elevation: 0,
        title: Row(
          children: [
            Text(
              band.bandName,
              style: const TextStyle(
                color: CbColors.textPrimary,
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: CbColors.surfaceRaised,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: CbColors.borderSubtle),
              ),
              child: Text(
                band.role.replaceAll('BAND_', ''),
                style: const TextStyle(
                  color: CbColors.textTertiary,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          // Stream automatically updates
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Band Earnings Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2A1535), Color(0xFF1B1B26)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0x33FF97BA)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Band Total Earnings',
                    style: TextStyle(
                      color: CbColors.textSecondary,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '\$$totalDollars',
                    style: const TextStyle(
                      color: CbColors.textPrimary,
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0x224ADE80),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${band.members.length} Active Members',
                          style: const TextStyle(
                            color: Color(0xFF4ADE80),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Split v${band.splitVersion}',
                        style: const TextStyle(
                          color: CbColors.textTertiary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Member Split Allocation Overview
            const Text(
              'Active Split Breakdown',
              style: TextStyle(
                color: CbColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...band.members.map((m) {
              final pct = (m.splitBps / 100).toStringAsFixed(1);
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: CbColors.surfaceCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: CbColors.borderSubtle),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: CbColors.surfaceRaised,
                      child: Text(
                        m.displayName.isNotEmpty ? m.displayName[0].toUpperCase() : 'M',
                        style: const TextStyle(color: CbColors.accentPrimary, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            m.displayName,
                            style: const TextStyle(
                              color: CbColors.textPrimary,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            m.role.replaceAll('BAND_', ''),
                            style: const TextStyle(
                              color: CbColors.textTertiary,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: CbColors.surfaceRaised,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$pct%',
                        style: const TextStyle(
                          color: CbColors.accentPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  void _showCreateBandModal(BuildContext context, WidgetRef ref) {
    final nameCtrl = TextEditingController();
    final bioCtrl = TextEditingController();

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: CbColors.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          top: 24,
          left: 20,
          right: 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Create a New Band',
              style: TextStyle(
                color: CbColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              style: const TextStyle(color: CbColors.textPrimary),
              decoration: InputDecoration(
                labelText: 'Band Name',
                labelStyle: const TextStyle(color: CbColors.textSecondary),
                filled: true,
                fillColor: CbColors.surfaceRaised,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: bioCtrl,
              maxLines: 2,
              style: const TextStyle(color: CbColors.textPrimary),
              decoration: InputDecoration(
                labelText: 'Bio (optional)',
                labelStyle: const TextStyle(color: CbColors.textSecondary),
                filled: true,
                fillColor: CbColors.surfaceRaised,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: CbColors.accentPrimary,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () async {
                  final name = nameCtrl.text.trim();
                  if (name.isNotEmpty) {
                    Navigator.pop(ctx);
                    await ref.read(bandProvider.notifier).createBand(
                          name,
                          bio: bioCtrl.text.trim(),
                        );
                  }
                },
                child: const Text('Create Band', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
