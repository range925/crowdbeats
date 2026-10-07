// Crowdbeats V2 — DiscoveryMapPreview Widget
//
// Authentic Google Maps Night/Dark theme preview widget.
// Renders realistic road networks, water bodies, Google Maps UI controls,
// Google watermark, and musician drop-pin markers.

import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../data/models/discovery.dart';

class DiscoveryMapPreview extends StatelessWidget {
  const DiscoveryMapPreview({
    super.key,
    required this.locationName,
    required this.latitude,
    required this.longitude,
    required this.performers,
    required this.onTapExpand,
  });

  final String locationName;
  final double latitude;
  final double longitude;
  final List<PublicPerformer> performers;
  final VoidCallback onTapExpand;

  @override
  Widget build(BuildContext context) {
    final representativePins = performers.take(4).toList();

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTapExpand,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          height: 180,
          decoration: BoxDecoration(
            color: const Color(0xFF1A1D28),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.12),
              width: 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.4),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Stack(
              children: [
                // 1. Google Maps Dark/Night Basemap
                Positioned.fill(
                  child: CustomPaint(
                    painter: _GoogleBasemapPainter(locationName: locationName),
                  ),
                ),

                // 2. Google Maps Controls (Right Top)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xE6202430),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                    ),
                    child: Column(
                      children: [
                        SizedBox(
                          width: 22,
                          height: 20,
                          child: Center(
                            child: Text(
                              '+',
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ),
                        Container(width: 16, height: 1, color: Colors.white.withValues(alpha: 0.1)),
                        SizedBox(
                          width: 22,
                          height: 20,
                          child: Center(
                            child: Text(
                              '−',
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // 3. Center GPS Blue Dot
                const Center(
                  child: _GoogleBlueDot(),
                ),

                // 4. Musician Drop-Pin Markers
                ...List.generate(representativePins.length, (index) {
                  final p = representativePins[index];
                  final angle = (index * (2 * math.pi / representativePins.length)) + 0.45;
                  final radius = 48.0 + (index % 2) * 16.0;
                  final dx = radius * math.cos(angle);
                  final dy = radius * math.sin(angle);

                  return Center(
                    child: Transform.translate(
                      offset: Offset(dx, dy),
                      child: _GoogleMapPerformerBubble(
                        performer: p,
                      ),
                    ),
                  );
                }),

                // 5. Google Watermark (Bottom Left)
                Positioned(
                  bottom: 42,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: const Color(0xCC111319),
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Text('G', style: TextStyle(color: Color(0xFF4285F4), fontWeight: FontWeight.w900, fontSize: 9)),
                        Text('o', style: TextStyle(color: Color(0xFFEA4335), fontWeight: FontWeight.w900, fontSize: 9)),
                        Text('o', style: TextStyle(color: Color(0xFFFBBC05), fontWeight: FontWeight.w900, fontSize: 9)),
                        Text('g', style: TextStyle(color: Color(0xFF4285F4), fontWeight: FontWeight.w900, fontSize: 9)),
                        Text('l', style: TextStyle(color: Color(0xFF34A853), fontWeight: FontWeight.w900, fontSize: 9)),
                        Text('e', style: TextStyle(color: Color(0xFFEA4335), fontWeight: FontWeight.w900, fontSize: 9)),
                      ],
                    ),
                  ),
                ),

                // 6. Bottom Overlay Gradient with Stage Count & Expand CTA
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xF2151722),
                      border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(width: 6, height: 6, decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF10B981))),
                            const SizedBox(width: 6),
                            Text(
                              '${representativePins.length} live stages in $locationName',
                              style: const TextStyle(
                                color: Color(0xFFE2E8F0),
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const Row(
                          children: [
                            Text(
                              'Explore Map',
                              style: TextStyle(
                                color: Color(0xFFA855F7),
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            SizedBox(width: 4),
                            Icon(
                              Icons.arrow_forward_rounded,
                              color: Color(0xFFA855F7),
                              size: 14,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _GoogleBlueDot extends StatelessWidget {
  const _GoogleBlueDot();

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0x334285F4),
            border: Border.all(color: const Color(0x664285F4)),
          ),
        ),
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF4285F4),
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: const [BoxShadow(color: Color(0x804285F4), blurRadius: 6)],
          ),
        ),
      ],
    );
  }
}

class _GoogleMapPerformerBubble extends StatelessWidget {
  const _GoogleMapPerformerBubble({required this.performer});
  final PublicPerformer performer;

  @override
  Widget build(BuildContext context) {
    final isLive = performer.isLive;
    final isSolo = performer.type != 'band';

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // 1. Bear Avatar (Uber / Lyft Scale)
        if (isSolo)
          Stack(
            alignment: Alignment.center,
            children: [
              if (isLive)
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF10B981).withValues(alpha: 0.6),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                ),
              Image.network(
                'solo_musician_bear.png',
                width: 36,
                height: 42,
                fit: BoxFit.contain,
                errorBuilder: (ctx, err, stack) => Image.asset(
                  'assets/images/solo_musician_bear.png',
                  width: 36,
                  height: 42,
                  fit: BoxFit.contain,
                  errorBuilder: (ctx2, err2, stack2) => const Text('🐻', style: TextStyle(fontSize: 22)),
                ),
              ),
            ],
          )
        else
          Image.network(
            'band_musician_bear.png',
            width: 38,
            height: 44,
            fit: BoxFit.contain,
            errorBuilder: (ctx, err, stack) => Image.asset(
              'assets/images/band_musician_bear.png',
              width: 38,
              height: 44,
              fit: BoxFit.contain,
              errorBuilder: (ctx2, err2, stack2) => const Text('🐻🎸', style: TextStyle(fontSize: 20)),
            ),
          ),

        const SizedBox(height: 2),

        // 2. Solo Musician / Band Name Underneath (No Bubble)
        Text(
          performer.name,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 9.5,
            fontWeight: FontWeight.w800,
            shadows: [
              Shadow(color: Colors.black, blurRadius: 4, offset: Offset(0, 1)),
              Shadow(color: Colors.black, blurRadius: 8, offset: Offset(0, 1)),
            ],
          ),
        ),
      ],
    );
  }
}

class _GoogleBasemapPainter extends CustomPainter {
  const _GoogleBasemapPainter({required this.locationName});
  final String locationName;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Land
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF1A1D28));

    // Ocean Coastline (Left)
    final waterPath = Path()
      ..moveTo(0, 0)
      ..lineTo(w * 0.20, 0)
      ..cubicTo(w * 0.18, h * 0.4, w * 0.10, h * 0.7, w * 0.15, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(waterPath, Paint()..color = const Color(0xFF0F172A));

    // Minor streets
    final streetPaint = Paint()
      ..color = const Color(0xFF242938)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    for (double y = 15; y < h; y += 22) {
      canvas.drawLine(Offset(w * 0.18, y), Offset(w, y), streetPaint);
    }
    for (double x = w * 0.22; x < w; x += 32) {
      canvas.drawLine(Offset(x, 0), Offset(x, h), streetPaint);
    }

    // Arterial Boulevards
    final arterialPaint = Paint()
      ..color = const Color(0xFF2D3548)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    canvas.drawLine(Offset(w * 0.18, h * 0.50), Offset(w, h * 0.50), arterialPaint);
    canvas.drawLine(Offset(w * 0.48, 0), Offset(w * 0.52, h), arterialPaint);

    // Freeways
    final freewayPaint = Paint()
      ..color = const Color(0xFF3E475C)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0;
    final freewayCore = Paint()
      ..color = const Color(0xFF4F5B75)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    final fPath = Path()
      ..moveTo(w * 0.65, 0)
      ..cubicTo(w * 0.70, h * 0.4, w * 0.80, h * 0.7, w * 0.85, h);
    canvas.drawPath(fPath, freewayPaint);
    canvas.drawPath(fPath, freewayCore);
  }

  @override
  bool shouldRepaint(covariant _GoogleBasemapPainter oldDelegate) => oldDelegate.locationName != locationName;
}
