// Crowdbeats V2 — "What Fans Will See" Preview Card (Phase 3)
//
// Truthful preview showing exactly what location data fans receive:
// - Venue sessions: canonical venue name and venue map pin.
// - Mobile/Street sessions: approximate neighborhood area and freshness indicator.
// - Never shows the raw device point.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class WhatFansWillSeeCard extends StatelessWidget {
  const WhatFansWillSeeCard({
    super.key,
    required this.isVenue,
    this.venueName,
    this.venueCityState,
    this.neighborhoodArea = 'Neighborhood Area (~100m grid cell)',
    this.freshnessText = 'Updated just now',
  });

  final bool isVenue;
  final String? venueName;
  final String? venueCityState;
  final String neighborhoodArea;
  final String freshnessText;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Semantics(
      container: true,
      label: 'What fans will see on the map preview',
      child: Container(
        padding: const EdgeInsets.all(CbSpacing.s4),
        decoration: BoxDecoration(
          color: isDark ? CbColors.surfaceCard : const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
          border: Border.all(
            color: isDark ? CbColors.borderSubtle : const Color(0xFFE5E7EB),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Icon(
                  Icons.visibility_outlined,
                  size: 16,
                  color: isDark ? CbColors.tealGas : CbColors.stitchPurple,
                ),
                Expanded(
                  child: Text(
                    'WHAT FANS WILL SEE',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: isDark ? CbColors.tealGas : CbColors.stitchPurple,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: CbColors.liveGreen.withAlpha(isDark ? 35 : 25),
                    borderRadius: BorderRadius.circular(CbSpacing.radiusXs),
                    border: Border.all(color: CbColors.liveGreen.withAlpha(80)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.shield_outlined,
                          size: 11, color: CbColors.liveGreen),
                      const SizedBox(width: 4),
                      Text(
                        isVenue ? 'Canonical Pin' : 'Coarse Grid',
                        style: const TextStyle(
                          color: CbColors.liveGreen,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: CbSpacing.s3),
            if (isVenue) ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: CbColors.purpleDim,
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                    ),
                    child: const Icon(Icons.place,
                        color: CbColors.purpleLight, size: 20),
                  ),
                  const SizedBox(width: CbSpacing.s3),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          venueName ?? 'Selected Venue',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                        if (venueCityState != null)
                          Text(
                            venueCityState!,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: isDark
                                  ? CbColors.textSecondary
                                  : Colors.black54,
                            ),
                          ),
                        const SizedBox(height: 4),
                        Text(
                          'Public map displays the venue’s verified pin. Your phone’s exact coordinates are never shown.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontSize: 11,
                            color: isDark
                                ? CbColors.textMuted
                                : Colors.black45,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ] else ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0x223B82F6),
                      borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
                    ),
                    child: const Icon(Icons.radar,
                        color: CbColors.gpsBlue, size: 20),
                  ),
                  const SizedBox(width: CbSpacing.s3),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          neighborhoodArea,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.access_time,
                                size: 12, color: CbColors.textMuted),
                            const SizedBox(width: 4),
                            Text(
                              freshnessText,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: isDark
                                    ? CbColors.textMuted
                                    : Colors.black45,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Public map shows a rounded neighborhood zone centroid. Device GPS, speed, and heading are never shared.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontSize: 11,
                            color: isDark
                                ? CbColors.textMuted
                                : Colors.black45,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
