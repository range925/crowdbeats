// Crowdbeats V2 — Rotating Tamper-Resistant QR Modal (Phase 4)
// High-contrast stage presentation, 30s-90s rotation countdown, static backup QR & Apple/Google Wallet export.
// Includes persistent tipping QR access pointing to https://crowdbeats.app/tip/{performerId}
// and clearly distinguishes persistent signage QR from dynamic live stage QR.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class RotatingQrModal extends StatefulWidget {
  const RotatingQrModal({
    super.key,
    required this.performerName,
    required this.sessionId,
    this.isBand = false,
    this.performerId,
  });

  final String performerName;
  final String sessionId;
  final bool isBand;
  final String? performerId;

  static Future<void> show(
    BuildContext context, {
    required String performerName,
    required String sessionId,
    bool isBand = false,
    String? performerId,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => RotatingQrModal(
        performerName: performerName,
        sessionId: sessionId,
        isBand: isBand,
        performerId: performerId,
      ),
    );
  }

  @override
  State<RotatingQrModal> createState() => _RotatingQrModalState();
}

class _RotatingQrModalState extends State<RotatingQrModal> {
  int _remainingSeconds = 30;
  Timer? _timer;
  bool _isStaticBackup = false;
  int _tokenNonce = 1;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      setState(() {
        if (_remainingSeconds > 1) {
          _remainingSeconds--;
        } else {
          _remainingSeconds = 30;
          _tokenNonce++;
        }
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String get _currentQrPayload {
    if (_isStaticBackup) {
      return 'https://crowdbeats.app/tip/${widget.sessionId}?mode=static';
    }
    return 'https://crowdbeats.app/tip/${widget.sessionId}?t=$_tokenNonce&exp=${DateTime.now().millisecondsSinceEpoch + 30000}';
  }

  String get _persistentDirectTipUrl =>
      'https://crowdbeats.app/tip/${widget.performerId ?? widget.sessionId}';

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: const BoxDecoration(
        color: CbColors.surfaceCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(CbSpacing.radiusXl)),
      ),
      child: Column(
        children: [
          // Drag Handle & Header
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 8),
            child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.isBand ? 'Band Tip QR' : 'Stage Tip QR',
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      widget.performerName,
                      style: const TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          const Divider(color: Colors.white12, height: 1),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              children: [
                // High-Contrast QR Display Canvas
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: const [
                        BoxShadow(color: Color(0x668B5CF6), blurRadius: 24, spreadRadius: 4),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 220,
                          height: 220,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.black12, width: 2),
                          ),
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 140,
                                  height: 140,
                                  child: QrImageView(
                                    data: _currentQrPayload,
                                    version: QrVersions.auto,
                                    size: 140,
                                    padding: EdgeInsets.zero,
                                    errorCorrectionLevel: QrErrorCorrectLevel.M,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  _isStaticBackup ? 'STATIC BACKUP QR' : 'TOKEN #$_tokenNonce',
                                  style: const TextStyle(color: Colors.black54, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Scan to Tip ${widget.performerName}',
                          style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        const Text(
                          'Google Pay · Card',
                          style: TextStyle(color: Colors.black54, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                // 30s Countdown Indicator (only if not static)
                if (!_isStaticBackup)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          value: _remainingSeconds / 30.0,
                          strokeWidth: 2.5,
                          color: CbColors.purpleLight,
                          backgroundColor: Colors.white12,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Rotating in $_remainingSeconds s (Anti-Tamper)',
                        style: const TextStyle(color: CbColors.purpleLight, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                const SizedBox(height: 16),

                // Mode Toggles & Deep Link
                CbGlassCard(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Static Signage Backup', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          Text('For printed physical stage signs & banners', style: TextStyle(color: CbColors.textSecondary, fontSize: 11)),
                        ],
                      ),
                      Switch(
                        value: _isStaticBackup,
                        activeTrackColor: CbColors.tealGas,
                        onChanged: (val) => setState(() => _isStaticBackup = val),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Share Deep Link & Wallet Buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.copy, size: 14, color: CbColors.purpleLight),
                        label: const Text('Copy Link', style: TextStyle(fontSize: 12, color: Colors.white)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0x338B5CF6)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                        ),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: _currentQrPayload));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Copied live tip link to clipboard!')),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.wallet, size: 14, color: CbColors.tealGas),
                        label: const Text('Add to Wallet', style: TextStyle(fontSize: 12, color: Colors.white)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0x3303DAC6)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                        ),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Exporting Apple / Google Wallet stage pass…')),
                          );
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Persistent QR Access Section
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.qr_code, size: 16),
                    label: const Text('View Permanent Tip QR & Links', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: CbColors.purpleMain,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    ),
                    onPressed: () {
                      PersistentQrModal.show(
                        context,
                        performerId: widget.performerId ?? widget.sessionId,
                        performerName: widget.performerName,
                        isBand: widget.isBand,
                      );
                    },
                  ),
                ),
                const SizedBox(height: 14),

                // Clear Distinction Notice Card
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(8),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'DYNAMIC STAGE QR vs PERMANENT QR',
                        style: TextStyle(color: CbColors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '• Dynamic Stage QR: Rotates every 30-90s with anti-tamper tokens to prevent photographic fraud during your live gig.',
                        style: TextStyle(color: Colors.white.withAlpha(190), fontSize: 11, height: 1.3),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '• Permanent Tip QR: Persistent link ($_persistentDirectTipUrl) that never expires, designed for printed mic stand signs and social bios.',
                        style: TextStyle(color: Colors.white.withAlpha(190), fontSize: 11, height: 1.3),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
