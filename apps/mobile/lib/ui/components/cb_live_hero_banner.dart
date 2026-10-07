// Crowdbeats V2 — Live Check-In Hero Banner (Phase 1)
// Stitch Project 5326179813018056505
// Primary call-to-action hero for the Creator Dashboard.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import 'cb_glass_card.dart';

class CbLiveHeroBanner extends StatelessWidget {
  const CbLiveHeroBanner({
    super.key,
    required this.isLive,
    this.venueName,
    this.listenerCount = 0,
    required this.onPrimaryAction,
    this.onSecondaryAction,
  });

  final bool isLive;
  final String? venueName;
  final int listenerCount;
  final VoidCallback onPrimaryAction;
  final VoidCallback? onSecondaryAction;

  @override
  Widget build(BuildContext context) {
    return CbGlassCard(
      hasGlow: isLive,
      borderColor: isLive ? const Color(0x6603DAC6) : const Color(0x338B5CF6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isLive ? CbColors.statusLive : Colors.white38,
                  boxShadow: isLive
                      ? const [
                          BoxShadow(color: CbColors.statusLive, blurRadius: 8, spreadRadius: 2),
                        ]
                      : null,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                isLive ? 'LIVE SESSION ACTIVE' : 'READY TO PERFORM',
                style: TextStyle(
                  color: isLive ? CbColors.tealGas : CbColors.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
              const Spacer(),
              if (isLive)
                Text(
                  '$listenerCount tuned in',
                  style: const TextStyle(color: CbColors.textMuted, fontSize: 11),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            isLive
                ? (venueName != null ? 'Performing at $venueName' : 'Performing Live Now')
                : 'Check in to start tipping & appear on the live map',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  icon: Icon(
                    isLive ? Icons.qr_code_2 : Icons.location_on,
                    size: 16,
                    color: isLive ? Colors.black : Colors.white,
                  ),
                  label: Text(
                    isLive ? 'Present QR Tipping Token' : 'Check In & Go Live',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: isLive ? Colors.black : Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isLive ? CbColors.tealGas : CbColors.purpleMain,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                  ),
                  onPressed: onPrimaryAction,
                ),
              ),
              if (isLive && onSecondaryAction != null) ...[
                const SizedBox(width: 8),
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: CbColors.statusError,
                    side: const BorderSide(color: Color(0x44EF4444)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                  onPressed: onSecondaryAction,
                  child: const Text('End Live', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
