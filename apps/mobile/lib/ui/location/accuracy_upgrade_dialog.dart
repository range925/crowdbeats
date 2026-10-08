// Crowdbeats V2 — Temporary Accuracy Upgrade Dialog (Phase 3)
//
// Displayed when a performer has Approximate / Reduced location permission,
// but venue check-in requires verifying proximity within 200m.
// Explains WHY precision is needed and provides fallback to Street Mode.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class AccuracyUpgradeDialog extends StatelessWidget {
  const AccuracyUpgradeDialog({
    super.key,
    required this.venueName,
    this.onUpgrade,
    this.onFallbackStreetMode,
    this.onCancel,
  });

  final String venueName;
  final VoidCallback? onUpgrade;
  final VoidCallback? onFallbackStreetMode;
  final VoidCallback? onCancel;

  static Future<bool?> show(
    BuildContext context, {
    required String venueName,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AccuracyUpgradeDialog(
        venueName: venueName,
        onUpgrade: () => Navigator.of(ctx).pop(true),
        onFallbackStreetMode: () => Navigator.of(ctx).pop(false),
        onCancel: () => Navigator.of(ctx).pop(null),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return AlertDialog(
      backgroundColor: isDark ? CbColors.surface1 : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        side: BorderSide(
          color: isDark ? CbColors.borderSubtle : const Color(0xFFE5E7EB),
        ),
      ),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0x223B82F6),
              borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
            ),
            child: const Icon(Icons.my_location, color: CbColors.gpsBlue, size: 20),
          ),
          const SizedBox(width: CbSpacing.s3),
          Expanded(
            child: Text(
              'Precision Needed for Venue',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'To check in at $venueName, Crowdbeats must confirm you are within 200 meters of the venue stage.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isDark ? Colors.white70 : Colors.black87,
                height: 1.4,
              ),
            ),
            const SizedBox(height: CbSpacing.s3),
            Container(
              padding: const EdgeInsets.all(CbSpacing.s3),
              decoration: BoxDecoration(
                color: isDark ? CbColors.surfaceCard : const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                border: Border.all(
                  color: isDark ? CbColors.borderSubtle : const Color(0xFFE5E7EB),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, size: 16, color: CbColors.gpsBlue),
                  const SizedBox(width: CbSpacing.s2),
                  Expanded(
                    child: Text(
                      'Your device currently provides approximate neighborhood accuracy (~1–3 km). Once verified, GPS stops immediately.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isDark ? CbColors.textSecondary : Colors.black54,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          key: const Key('btn_accuracy_cancel'),
          onPressed: onCancel,
          child: Text(
            'Cancel',
            style: TextStyle(
              color: isDark ? CbColors.textSecondary : Colors.black54,
            ),
          ),
        ),
        TextButton(
          key: const Key('btn_accuracy_fallback_street'),
          onPressed: onFallbackStreetMode,
          child: const Text(
            'Use Street Mode (Approximate OK)',
            style: TextStyle(color: CbColors.tealGas),
          ),
        ),
        ElevatedButton(
          key: const Key('btn_accuracy_upgrade'),
          style: ElevatedButton.styleFrom(
            backgroundColor: CbColors.accentPrimary,
            foregroundColor: Colors.white,
          ),
          onPressed: onUpgrade,
          child: const Text('Allow Precise Once'),
        ),
      ],
    );
  }
}
