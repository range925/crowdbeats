// Crowdbeats V2 — Persistent Tipping QR Modal
// Canonical permanent tipping QR code pointing to https://crowdbeats.app/tip/{performerId}.
// Displays immutable performer ID, copy link, and share sheet.
// Clearly distinguishes permanent signage QR from 90-second rotating live stage QR.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import 'cb_glass_card.dart';

class PersistentQrModal extends StatelessWidget {
  const PersistentQrModal({
    super.key,
    required this.performerId,
    required this.performerName,
    this.isBand = false,
  });

  final String performerId;
  final String performerName;
  final bool isBand;

  String get canonicalTipUrl => 'https://crowdbeats.app/tip/$performerId';

  static Future<void> show(
    BuildContext context, {
    required String performerId,
    required String performerName,
    bool isBand = false,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PersistentQrModal(
        performerId: performerId,
        performerName: performerName,
        isBand: isBand,
      ),
    );
  }

  void _copyToClipboard(BuildContext context) {
    Clipboard.setData(ClipboardData(text: canonicalTipUrl));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Direct tip link copied to clipboard!'),
        backgroundColor: CbColors.surfaceCard,
      ),
    );
  }

  void _shareTipLink() {
    SharePlus.instance.share(
      ShareParams(
        text: 'Tip $performerName directly on Crowdbeats: $canonicalTipUrl',
      ),
    );
  }

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
          // Drag handle
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 8),
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isBand ? 'Band Direct Tip QR' : 'Direct Tipping QR Code & Links',
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      performerName,
                      style: const TextStyle(color: CbColors.purpleLight, fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70),
                  tooltip: 'Close',
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          const Divider(color: Colors.white12, height: 1),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              children: [
                // Prominent Copy
                const Text(
                  'Share your QR code so fans can open your tipping page directly.',
                  style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),

                // QR Graphic Display
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
                          width: 200,
                          height: 200,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: QrImageView(
                            data: canonicalTipUrl,
                            version: QrVersions.auto,
                            size: 200,
                            padding: const EdgeInsets.all(8),
                            errorCorrectionLevel: QrErrorCorrectLevel.H,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Scan to Tip $performerName',
                          style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isBand ? 'Collective Band Treasury · Stripe Connect' : 'Apple Pay · Google Pay · Card',
                          style: const TextStyle(color: Colors.black54, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Canonical URL Pill
                CbGlassCard(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  child: Row(
                    children: [
                      const Icon(Icons.link, size: 16, color: CbColors.purpleLight),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          canonicalTipUrl,
                          style: const TextStyle(color: Colors.white70, fontSize: 12, fontFamily: 'monospace'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy, size: 16, color: CbColors.purpleLight),
                        onPressed: () => _copyToClipboard(context),
                        tooltip: 'Copy Link',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: Semantics(
                        button: true,
                        label: 'Copy direct tip link to clipboard',
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.copy, size: 16),
                          label: const Text('Copy Direct Tip Link', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: CbColors.purpleMain,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                          ),
                          onPressed: () => _copyToClipboard(context),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Semantics(
                        button: true,
                        label: 'Share direct tip link',
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.share, size: 16, color: CbColors.tealGas),
                          label: const Text('Share Tip Link', style: TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold)),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0x3303DAC6)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                          ),
                          onPressed: _shareTipLink,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // Immutable ID guarantee card
                CbGlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.shield_outlined, color: CbColors.purpleLight, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Permanent Tipping Guarantee',
                              style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              isBand
                                  ? 'Your band tipping QR code is permanent and tied to your immutable band identifier ($performerId). Even if you change your band name, fans will always reach your band tipping page directly. Tips go to the collective Band entity via Stripe Connect.'
                                  : 'Your tipping QR code is permanent and tied to your immutable performer account ($performerId). Even if you change your stage name, fans will always reach your tipping page directly.',
                              style: const TextStyle(color: CbColors.textSecondary, fontSize: 12, height: 1.4),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Distinction Notice: Permanent vs 90s Rotating Live Stage QR
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(8),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'PERMANENT QR vs 90-SECOND LIVE STAGE QR',
                        style: TextStyle(color: CbColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                      ),
                      SizedBox(height: 8),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.check_circle_outline, color: CbColors.tealGas, size: 16),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Permanent QR (This Code): Never expires. Print on mic stand badges, guitar cases, stickers, and Linktree.',
                              style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.3),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 6),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.update, color: CbColors.rankGold, size: 16),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '90s Dynamic Live Stage QR: Rotates on stage during live gigs with cryptographic anti-tamper tokens to prevent photographic replay spoofing.',
                              style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.3),
                            ),
                          ),
                        ],
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
