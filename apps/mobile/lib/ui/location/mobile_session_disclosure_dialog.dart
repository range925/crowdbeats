// Crowdbeats V2 — Mobile Live Session Secondary Disclosure (Phase 3)
//
// Shown ONLY when a creator explicitly selects "Mobile Live Session" mode.
// Explains background tracking capability and requests background permission
// at the precise moment it becomes necessary.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';
import 'what_fans_will_see_card.dart';

class MobileSessionDisclosureDialog extends StatelessWidget {
  const MobileSessionDisclosureDialog({
    super.key,
    this.onAcceptBackground,
    this.onStayStationary,
    this.onCancel,
  });

  final VoidCallback? onAcceptBackground;
  final VoidCallback? onStayStationary;
  final VoidCallback? onCancel;

  static Future<bool?> show(BuildContext context) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => MobileSessionDisclosureDialog(
        onAcceptBackground: () => Navigator.of(ctx).pop(true),
        onStayStationary: () => Navigator.of(ctx).pop(false),
        onCancel: () => Navigator.of(ctx).pop(null),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Semantics(
      container: true,
      label: 'Mobile Live Session Background Location Disclosure',
      child: Container(
        padding: EdgeInsets.fromLTRB(
          CbSpacing.s5,
          CbSpacing.s4,
          CbSpacing.s5,
          MediaQuery.of(context).viewInsets.bottom + CbSpacing.s6,
        ),
        decoration: BoxDecoration(
          color: isDark ? CbColors.surface1 : Colors.white,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(CbSpacing.radiusXl),
          ),
          border: Border.all(
            color: isDark ? CbColors.borderSubtle : const Color(0xFFE5E7EB),
          ),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? CbColors.borderSubtle : Colors.black26,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: CbSpacing.s4),

              // Title Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0x22F59E0B),
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                      border: Border.all(color: const Color(0x66F59E0B)),
                    ),
                    child: const Icon(
                      Icons.directions_walk,
                      color: CbColors.rankGold,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: CbSpacing.s3),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Mobile Live Session',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                        Text(
                          'Roaming / Mobile Performance Mode',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isDark ? CbColors.textSecondary : Colors.black54,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: CbSpacing.s4),

              // Disclosures
              _buildBullet(
                context,
                icon: Icons.battery_charging_full,
                title: 'Background Tracking Needed',
                text: 'To update your fans while your device is locked or in your pocket, Crowdbeats requests background location capability.',
              ),
              const SizedBox(height: CbSpacing.s3),
              _buildBullet(
                context,
                icon: Icons.grid_4x4,
                title: 'Privacy-Preserving Neighborhood Grid',
                text: 'Your position is snapped to a coarse ~100m grid cell centroid. Exact coordinates, speed, and heading are NEVER disclosed.',
              ),
              const SizedBox(height: CbSpacing.s3),
              _buildBullet(
                context,
                icon: Icons.pause_circle_outline,
                title: 'You Are Always in Control',
                text: 'A persistent status bar will indicate Live Mobile is active. You can pause or stop location sharing at any second.',
              ),
              const SizedBox(height: CbSpacing.s4),

              // Preview Card for Mobile
              const WhatFansWillSeeCard(
                isVenue: false,
                neighborhoodArea: 'Gaslamp Quarter (~100m grid)',
                freshnessText: 'Live Roaming Session',
              ),
              const SizedBox(height: CbSpacing.s5),

              // Allow Background CTA
              ElevatedButton.icon(
                key: const Key('btn_mobile_disclosure_accept'),
                icon: const Icon(Icons.check, size: 18),
                label: const Text(
                  'Allow Background & Go Live Mobile',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: CbColors.purpleMain,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  ),
                ),
                onPressed: onAcceptBackground,
              ),
              const SizedBox(height: CbSpacing.s2),

              // Fallback to stationary
              OutlinedButton.icon(
                key: const Key('btn_mobile_disclosure_stationary'),
                icon: const Icon(Icons.place, size: 16),
                label: const Text('Use Fixed Venue Mode Instead (No Background GPS)'),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(
                    color: isDark ? CbColors.borderSubtle : const Color(0xFFD1D5DB),
                  ),
                  foregroundColor: isDark ? Colors.white70 : Colors.black87,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
                  ),
                ),
                onPressed: onStayStationary,
              ),
              const SizedBox(height: CbSpacing.s2),

              // Cancel
              TextButton(
                key: const Key('btn_mobile_disclosure_cancel'),
                onPressed: onCancel,
                child: Text(
                  'Cancel',
                  style: TextStyle(
                    color: isDark ? CbColors.textSecondary : Colors.black54,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBullet(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String text,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: CbColors.rankGold),
        const SizedBox(width: CbSpacing.s3),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                text,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: isDark ? CbColors.textSecondary : Colors.black54,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
