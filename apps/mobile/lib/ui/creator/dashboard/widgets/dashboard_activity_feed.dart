// Crowdbeats V2 — Dashboard Recent Activity Feed (Phase 3)
// Live tip ticker and recent creator event receipts.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';

class DashboardActivityEvent {
  const DashboardActivityEvent({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.timeAgo,
    this.amountText,
    required this.icon,
  });

  final String id;
  final String title;
  final String subtitle;
  final String timeAgo;
  final String? amountText;
  final IconData icon;
}

class DashboardActivityFeed extends StatelessWidget {
  const DashboardActivityFeed({
    super.key,
    required this.events,
  });

  final List<DashboardActivityEvent> events;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: Text(
            'RECENT ACTIVITY',
            style: TextStyle(
              color: CbColors.textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
        ),
        if (events.isEmpty)
          const CbGlassCard(
            padding: EdgeInsets.all(16),
            child: Center(
              child: Text(
                'No activity yet. Go live to start receiving tips!',
                style: TextStyle(color: CbColors.textMuted, fontSize: 12),
              ),
            ),
          )
        else
          ...events.map((e) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                child: CbGlassCard(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: Color(0x2210B981),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(e.icon, size: 14, color: CbColors.statusLive),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(e.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12)),
                            Text(e.subtitle, style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          if (e.amountText != null)
                            Text(e.amountText!, style: const TextStyle(color: CbColors.statusLive, fontWeight: FontWeight.bold, fontSize: 13)),
                          Text(e.timeAgo, style: const TextStyle(color: CbColors.textMuted, fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                ),
              )),
        const SizedBox(height: 24),
      ],
    );
  }
}
