// Crowdbeats V2 — Creator Map Preview Card (Phase 9)
//
// "What Fans See" preview component matching the public map representation exactly.
// Confirms whether the creator is presented as a stationary venue pin with halo
// or a coarse 100m approximate grid centroid.

import 'package:flutter/material.dart';
import 'package:crowdbeats_mobile/data/models/discovery.dart';
import 'package:crowdbeats_mobile/ui/fan/widgets/animated_performer_marker.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_colors.dart';
import 'package:crowdbeats_mobile/ui/theme/cb_spacing.dart';

class CreatorMapPreviewCard extends StatelessWidget {
  const CreatorMapPreviewCard({
    super.key,
    required this.performer,
    this.onDismiss,
  });

  final PublicPerformer performer;
  final VoidCallback? onDismiss;

  @override
  Widget build(BuildContext context) {
    final isStationary = performer.isStationary;
    final isLive = performer.isLive;

    final freshness = computeMarkerFreshness(
      lastUpdated: performer.lastUpdated,
      isLive: isLive,
      isStationary: isStationary,
      endsAt: performer.endsAt,
    );

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: CbColors.surfaceCard,
        borderRadius: BorderRadius.circular(CbSpacing.radiusLg),
        border: Border.all(color: const Color(0x338B5CF6)),
        boxShadow: const [
          BoxShadow(
            color: Colors.black54,
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header: "What Fans See" Title
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.visibility, color: CbColors.purpleLight, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'What Fans See',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                decoration: BoxDecoration(
                  color: Color(freshness.colorHex).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Color(freshness.colorHex).withValues(alpha: 0.4)),
                ),
                child: Text(
                  freshness.label,
                  style: TextStyle(
                    color: Color(freshness.colorHex),
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Interactive / Visual Map Pin Preview Stage
          Container(
            height: 120,
            decoration: BoxDecoration(
              color: const Color(0xFF0F111A), // Google Maps Night dark canvas
              borderRadius: BorderRadius.circular(CbSpacing.radiusMd),
              border: Border.all(color: Colors.white10),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Simulated grid/map lines
                Positioned.fill(
                  child: CustomPaint(
                    painter: _SimulatedMapGridPainter(),
                  ),
                ),

                // Live animated marker preview
                AnimatedPerformerMarker(
                  performer: performer,
                  targetOffset: Offset.zero,
                  enablePulseAnimation: false,
                ),

                // Bottom badge indicating pin type
                Positioned(
                  bottom: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.75),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      isStationary
                          ? '🏛️ Verified Venue Pin (Anchored)'
                          : '📍 100m Coarse Area Centroid',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Privacy Invariant Note
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.shield_outlined, color: CbColors.tealGas, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  isStationary
                      ? 'Stationary session: Locked to ${performer.currentVenueName ?? "verified venue"}. Zero movement or drift is broadcast to fans.'
                      : 'Mobile session: Broadcast as an approximate 100m grid centroid. Raw GPS telemetry is never revealed or interpolated.',
                  style: const TextStyle(
                    color: CbColors.textSecondary,
                    fontSize: 11,
                    height: 1.3,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SimulatedMapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.04)
      ..strokeWidth = 1.0;

    for (double x = 0; x < size.width; x += 24) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += 24) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
