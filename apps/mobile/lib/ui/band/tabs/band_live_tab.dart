import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../state/band_state.dart';
import '../../theme/cb_colors.dart';
import '../../musician/live/qr_display_widget.dart';

class BandLiveTab extends ConsumerStatefulWidget {
  const BandLiveTab({super.key});

  @override
  ConsumerState<BandLiveTab> createState() => _BandLiveTabState();
}

class _BandLiveTabState extends ConsumerState<BandLiveTab> {
  bool _isLive = false;
  String _sessionMode = 'street'; // 'street' or 'venue'
  final TextEditingController _venueCtrl = TextEditingController();

  @override
  void dispose() {
    _venueCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final band = ref.watch(bandProvider);

    if (band.activeBandId == null) {
      return const Scaffold(
        backgroundColor: CbColors.surfaceBase,
        body: Center(
          child: Text(
            'Create or join a band to start a live session.',
            style: TextStyle(color: CbColors.textSecondary),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: CbColors.surfaceBase,
      appBar: AppBar(
        backgroundColor: CbColors.surfaceBase,
        elevation: 0,
        title: const Text(
          'Live Band Session',
          style: TextStyle(
            color: CbColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Live Status Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: CbColors.surfaceCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _isLive ? const Color(0xFF4ADE80) : CbColors.borderSubtle,
                  width: _isLive ? 2 : 1,
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _isLive ? const Color(0xFF4ADE80) : Colors.grey,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _isLive ? 'BAND IS LIVE' : 'SESSION IDLE',
                            style: TextStyle(
                              color: _isLive ? const Color(0xFF4ADE80) : CbColors.textSecondary,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: CbColors.surfaceRaised,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${band.members.length} Members Sharing',
                          style: const TextStyle(
                            color: CbColors.textTertiary,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  if (_isLive) ...[
                    // Expiring QR Token Display
                    const QrDisplayWidget(),
                    const SizedBox(height: 16),
                    const Text(
                      'Band tips will be automatically distributed according to current split rules (OD-09).',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: CbColors.textTertiary, fontSize: 12),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: () {
                        setState(() => _isLive = false);
                      },
                      child: const Text('End Band Session', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ] else ...[
                    // Session Mode Picker
                    Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _sessionMode = 'street'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: _sessionMode == 'street' ? CbColors.accentPrimary : CbColors.surfaceRaised,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                '📍 Street Performance',
                                style: TextStyle(
                                  color: _sessionMode == 'street' ? Colors.black : CbColors.textSecondary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _sessionMode = 'venue'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: _sessionMode == 'venue' ? CbColors.accentPrimary : CbColors.surfaceRaised,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                '🏟️ Venue Stage',
                                style: TextStyle(
                                  color: _sessionMode == 'venue' ? Colors.black : CbColors.textSecondary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: CbColors.accentPrimary,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: () {
                        setState(() => _isLive = true);
                      },
                      child: const Text('Start Band Session', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
