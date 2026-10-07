// Crowdbeats V2 — Next Performance Card (Phase 3)
// Displays upcoming booking details with venue name, countdown & check-in prompt.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class DashboardNextShowCard extends StatelessWidget {
  const DashboardNextShowCard({
    super.key,
    required this.venueName,
    required this.cityState,
    required this.startTime,
    required this.countdownText,
    required this.onCheckInNow,
  });

  final String venueName;
  final String cityState;
  final String startTime;
  final String countdownText;
  final VoidCallback onCheckInNow;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: CbGlassCard(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.calendar_month, size: 14, color: CbColors.purpleLight),
                    SizedBox(width: 6),
                    Text(
                      'NEXT PERFORMANCE',
                      style: TextStyle(
                        color: CbColors.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0x338B5CF6),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    countdownText,
                    style: const TextStyle(color: CbColors.purpleLight, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              venueName,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              '$cityState · $startTime',
              style: const TextStyle(color: CbColors.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.location_on, size: 14, color: CbColors.tealGas),
                label: const Text('Check In to Venue', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0x3303DAC6)),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusMd)),
                ),
                onPressed: onCheckInNow,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
