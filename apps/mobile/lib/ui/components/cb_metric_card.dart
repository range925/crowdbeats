// Crowdbeats V2 — High-Information Metric Card (Phase 1)
// Stitch Project 5326179813018056505
// Clean financial display: Large value, currency tag, timeframe badge, definition tooltip.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import 'cb_glass_card.dart';

class CbMetricCard extends StatelessWidget {
  const CbMetricCard({
    super.key,
    required this.title,
    required this.value,
    this.subtitle,
    this.timeframe,
    this.definition,
    this.icon,
    this.accentColor = CbColors.purpleLight,
    this.onTap,
  });

  final String title;
  final String value;
  final String? subtitle;
  final String? timeframe;
  final String? definition;
  final IconData? icon;
  final Color accentColor;
  final VoidCallback? onTap;

  void _showDefinitionDialog(BuildContext context) {
    if (definition == null) return;
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: CbColors.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CbSpacing.radiusLg)),
        title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text(definition!, style: const TextStyle(color: CbColors.textSecondary, fontSize: 13, height: 1.4)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Got it', style: TextStyle(color: CbColors.purpleLight)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CbGlassCard(
      onTap: onTap,
      semanticLabel: '$title: $value',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    if (icon != null) ...[
                      Icon(icon, size: 14, color: accentColor),
                      const SizedBox(width: 6),
                    ],
                    Expanded(
                      child: Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: CbColors.textSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (definition != null) ...[
                const SizedBox(width: 4),
                GestureDetector(
                  onTap: () => _showDefinitionDialog(context),
                  child: const Icon(Icons.info_outline, size: 14, color: CbColors.textMuted),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
              shadows: [
                Shadow(color: accentColor.withValues(alpha: 0.3), blurRadius: 10),
              ],
            ),
          ),
          if (subtitle != null || timeframe != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                if (timeframe != null) ...[
                  Flexible(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0x228B5CF6),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        timeframe!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: CbColors.purpleLight, fontSize: 10, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                ],
                if (subtitle != null)
                  Expanded(
                    child: Text(
                      subtitle!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: CbColors.textMuted, fontSize: 10),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
