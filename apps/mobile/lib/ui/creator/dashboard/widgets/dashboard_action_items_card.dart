// Crowdbeats V2 — Creator Dashboard Action Items Card (Phase 3)
// Displays urgent creator tasks requiring attention.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/ui/components/components.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';

class DashboardActionItem {
  const DashboardActionItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.badgeText,
    required this.onTap,
  });

  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final String? badgeText;
  final VoidCallback onTap;
}

class DashboardActionItemsCard extends StatelessWidget {
  const DashboardActionItemsCard({
    super.key,
    required this.items,
  });

  final List<DashboardActionItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: Text(
            'ACTION REQUIRED',
            style: TextStyle(
              color: CbColors.textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
        ),
        ...items.map((item) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              child: CbGlassCard(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                onTap: item.onTap,
                child: Row(
                  children: [
                    Icon(item.icon, size: 18, color: CbColors.purpleLight),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                          Text(item.subtitle, style: const TextStyle(color: CbColors.textMuted, fontSize: 11)),
                        ],
                      ),
                    ),
                    if (item.badgeText != null) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0x33F59E0B),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(item.badgeText!, style: const TextStyle(color: CbColors.rankGold, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 6),
                    ],
                    const Icon(Icons.chevron_right, size: 18, color: Colors.white38),
                  ],
                ),
              ),
            )),
        const SizedBox(height: 12),
      ],
    );
  }
}
