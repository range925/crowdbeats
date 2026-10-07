// Crowdbeats V2 — CompactGoogleMap Widget
//
// Authentic Google Maps Night/Dark theme preview positioned directly below Location Search:
// - Realistic Google Maps Dark basemap (roads, freeways, water bodies, street names)
// - Google Maps UI controls (Google watermark, zoom buttons, compass, copyright notice)
// - Google Maps signature pulsing blue GPS location dot
// - Rich custom musician drop-pin markers with live status badges

import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../data/models/discovery.dart';
import '../../theme/cb_colors.dart';
import '../views/nearby_secondary_view.dart';

class CompactGoogleMap extends StatelessWidget {
  const CompactGoogleMap({
    super.key,
    required this.discoveryLocation,
    required this.performers,
    required this.isSearchAreaMode,
    required this.onUseMyLocation,
    this.isLocating = false,
    this.selectedPerformer,
    this.onSelectPerformer,
  });

  final DiscoveryLocation discoveryLocation;
  final List<PublicPerformer> performers;
  final bool isSearchAreaMode;
  final VoidCallback onUseMyLocation;

  /// True while a one-shot GPS request is in flight — shows a loading
  /// indicator on the "Use My Location" / "Reset" button.
  final bool isLocating;

  final PublicPerformer? selectedPerformer;
  final ValueChanged<PublicPerformer>? onSelectPerformer;

  @override
  Widget build(BuildContext context) {
    final visibleMarkers = performers.take(5).toList();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF151722),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isSearchAreaMode
              ? const Color(0x667C3AED)
              : Colors.white.withValues(alpha: 0.12),
          width: isSearchAreaMode ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.45),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top Location Status Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isSearchAreaMode
                            ? const Color(0xFFA855F7)
                            : const Color(0xFF10B981),
                        boxShadow: [
                          BoxShadow(
                            color: isSearchAreaMode
                                ? const Color(0xFFA855F7)
                                : const Color(0xFF10B981),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      isSearchAreaMode
                          ? 'Exploring ${discoveryLocation.city}'
                          : 'You are here · ${discoveryLocation.city}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                if (isSearchAreaMode || (!isSearchAreaMode && discoveryLocation.placeId != 'device_gps'))
                  GestureDetector(
                    onTap: isLocating ? null : onUseMyLocation,
                    child: isLocating
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                              strokeWidth: 1.5,
                              color: Color(0xFFA855F7),
                            ),
                          )
                        : Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.my_location_rounded, color: Color(0xFFA855F7), size: 14),
                              const SizedBox(width: 4),
                              Text(
                                isSearchAreaMode ? 'Reset' : 'Near Me',
                                style: const TextStyle(
                                  color: Color(0xFFA855F7),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                  ),
              ],
            ),
          ),

          // Interactive Google Maps Area (220px height)
          GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NearbySecondaryView()),
              );
            },
            child: Container(
              height: 220,
              decoration: const BoxDecoration(
                color: Color(0xFF1B1E28),
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(20)),
              ),
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
                child: Stack(
                  children: [
                    // 1. Google Maps Dark/Night Basemap Canvas
                    Positioned.fill(
                      child: CustomPaint(
                        painter: _GoogleMapsNightPainter(
                          cityName: discoveryLocation.city,
                        ),
                      ),
                    ),

                    // 2. Google Maps Controls (Zoom & Compass on Right)
                    Positioned(
                      right: 10,
                      top: 10,
                      child: Column(
                        children: [
                          // Compass Button
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              color: const Color(0xE6202430),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                              boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 4)],
                            ),
                            child: const Center(
                              child: Icon(Icons.explore_rounded, color: Color(0xFFEA4335), size: 16),
                            ),
                          ),
                          const SizedBox(height: 8),
                          // Zoom Controls
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xE6202430),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                              boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 4)],
                            ),
                            child: Column(
                              children: [
                                SizedBox(
                                  width: 28,
                                  height: 26,
                                  child: Center(
                                    child: Text(
                                      '+',
                                      style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 16, fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                ),
                                Container(width: 20, height: 1, color: Colors.white.withValues(alpha: 0.1)),
                                SizedBox(
                                  width: 28,
                                  height: 26,
                                  child: Center(
                                    child: Text(
                                      '−',
                                      style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 16, fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // 3. Center GPS Blue Dot (Signature Google Maps User Pin)
                    const Center(
                      child: _GoogleGpsBlueDot(),
                    ),

                    // 4. Musician Drop-Pin Markers
                    ...visibleMarkers.asMap().entries.map((entry) {
                      final index = entry.key;
                      final p = entry.value;
                      final angle = (index * (2 * math.pi / visibleMarkers.length)) + 0.45;
                      final radius = 58.0 + (index % 2) * 22.0;
                      final isSelected = selectedPerformer?.id == p.id;

                      return Positioned(
                        left: 140.0 + math.cos(angle) * radius,
                        top: 95.0 + math.sin(angle) * radius,
                        child: GestureDetector(
                          onTap: () {
                            if (onSelectPerformer != null) {
                              onSelectPerformer!(p);
                            }
                          },
                          child: _GoogleMapPerformerPin(
                            performer: p,
                            isSelected: isSelected,
                          ),
                        ),
                      );
                    }),

                    // 5. Google Maps Bottom Watermark & Legal Notice
                    Positioned(
                      bottom: 46,
                      left: 10,
                      child: Row(
                        children: [
                          // Google Wordmark (Google Logo colors on dark)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xCC111319),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                Text('G', style: TextStyle(color: Color(0xFF4285F4), fontWeight: FontWeight.w900, fontSize: 11)),
                                Text('o', style: TextStyle(color: Color(0xFFEA4335), fontWeight: FontWeight.w900, fontSize: 11)),
                                Text('o', style: TextStyle(color: Color(0xFFFBBC05), fontWeight: FontWeight.w900, fontSize: 11)),
                                Text('g', style: TextStyle(color: Color(0xFF4285F4), fontWeight: FontWeight.w900, fontSize: 11)),
                                Text('l', style: TextStyle(color: Color(0xFF34A853), fontWeight: FontWeight.w900, fontSize: 11)),
                                Text('e', style: TextStyle(color: Color(0xFFEA4335), fontWeight: FontWeight.w900, fontSize: 11)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    Positioned(
                      bottom: 46,
                      right: 10,
                      child: Text(
                        'Map data ©2026 Google',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.35),
                          fontSize: 9,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ),

                    // 6. Bottom Expand Overlay Bar
                    Positioned(
                      bottom: 8,
                      left: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: const Color(0xF2151722),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                          boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 6)],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Color(0xFF10B981),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  '${visibleMarkers.length} stages around ${discoveryLocation.city}',
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
                                  'Expand Map',
                                  style: TextStyle(
                                    color: Color(0xFFA855F7),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                SizedBox(width: 4),
                                Icon(Icons.arrow_forward_rounded, color: Color(0xFFA855F7), size: 14),
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
        ],
      ),
    );
  }
}

/// Google Maps Signature Blue GPS User Location Dot with Accuracy Pulse Halo
class _GoogleGpsBlueDot extends StatelessWidget {
  const _GoogleGpsBlueDot();

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Pulsing Accuracy Halo
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0x334285F4),
            border: Border.all(color: const Color(0x664285F4), width: 1),
          ),
        ),
        // Solid Blue Core
        Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF4285F4),
            border: Border.all(color: Colors.white, width: 2.5),
            boxShadow: const [
              BoxShadow(color: Color(0x804285F4), blurRadius: 8),
            ],
          ),
        ),
      ],
    );
  }
}

/// Google Maps Styled Musician Drop-Pin Marker (Uber / Lyft Map Style)
class _GoogleMapPerformerPin extends StatelessWidget {
  const _GoogleMapPerformerPin({
    required this.performer,
    required this.isSelected,
  });

  final PublicPerformer performer;
  final bool isSelected;

  @override
  Widget build(BuildContext context) {
    final isSolo = performer.type != 'band';
    final isLive = performer.isLive;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // 1. Noticeable Bear Avatar (Uber/Lyft Vehicle Scale)
        if (isSolo)
          Stack(
            alignment: Alignment.center,
            children: [
              // Live Glow Ring
              if (isLive)
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF10B981).withValues(alpha: 0.65),
                        blurRadius: 12,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                ),
              Image.network(
                'solo_musician_bear.png',
                width: 42,
                height: 48,
                fit: BoxFit.contain,
                errorBuilder: (ctx, err, stack) => Image.asset(
                  'assets/images/solo_musician_bear.png',
                  width: 42,
                  height: 48,
                  fit: BoxFit.contain,
                  errorBuilder: (ctx2, err2, stack2) => const Text('🐻', style: TextStyle(fontSize: 28)),
                ),
              ),
              if (isLive)
                Positioned(
                  top: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: Colors.black, width: 1),
                    ),
                    child: const Text(
                      'LIVE',
                      style: TextStyle(color: Colors.white, fontSize: 7, fontWeight: FontWeight.w900),
                    ),
                  ),
                ),
            ],
          )
        else
          Stack(
            alignment: Alignment.center,
            children: [
              if (isLive)
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFEC4899).withValues(alpha: 0.65),
                        blurRadius: 12,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                ),
              Image.network(
                'band_musician_bear.png',
                width: 46,
                height: 52,
                fit: BoxFit.contain,
                errorBuilder: (ctx, err, stack) => Image.asset(
                  'assets/images/band_musician_bear.png',
                  width: 46,
                  height: 52,
                  fit: BoxFit.contain,
                  errorBuilder: (ctx2, err2, stack2) => const Text('🐻🎸', style: TextStyle(fontSize: 24)),
                ),
              ),
              if (isLive)
                Positioned(
                  top: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEC4899),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: Colors.black, width: 1),
                    ),
                    child: const Text(
                      'BAND',
                      style: TextStyle(color: Colors.white, fontSize: 7, fontWeight: FontWeight.w900),
                    ),
                  ),
                ),
            ],
          ),

        const SizedBox(height: 2),

        // 2. Dynamic Musician Name Badge (Replaces "POLARIS SOLO MUSICIAN" with Performer Name)
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF7C3AED)
                : (isLive ? const Color(0xF00F172A) : const Color(0xF0141826)),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isLive ? const Color(0xFF10B981) : (isSelected ? Colors.white : const Color(0x44FFFFFF)),
              width: isLive || isSelected ? 1.5 : 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.6),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                performer.name,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
                  letterSpacing: -0.1,
                ),
              ),
              if (isLive) ...[
                const SizedBox(width: 4),
                Container(
                  width: 5,
                  height: 5,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0xFF10B981),
                  ),
                ),
              ],
            ],
          ),
        ),

        // 3. Pin Pointer Tip
        CustomPaint(
          size: const Size(8, 4),
          painter: _PinTipPainter(
            color: isSelected
                ? const Color(0xFF7C3AED)
                : (isLive ? const Color(0xF00F172A) : const Color(0xF0141826)),
          ),
        ),
      ],
    );
  }
}

class _PinTipPainter extends CustomPainter {
  const _PinTipPainter({required this.color});
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width / 2, size.height)
      ..lineTo(size.width, 0)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Detailed Google Maps Dark / Night Mode Basemap Painter
/// Renders authentic road geometry, arterial freeways, water bodies, parks, and street labels
class _GoogleMapsNightPainter extends CustomPainter {
  const _GoogleMapsNightPainter({required this.cityName});
  final String cityName;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // 1. Base Landmass (Google Maps Dark Theme Land: #1B1E28)
    final landPaint = Paint()..color = const Color(0xFF1A1D28);
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), landPaint);

    // 2. Water Body (Pacific Coastline / Bay on the Left: #0F172A)
    final waterPaint = Paint()..color = const Color(0xFF0F172A);
    final waterPath = Path()
      ..moveTo(0, 0)
      ..lineTo(w * 0.22, 0)
      ..cubicTo(w * 0.20, h * 0.35, w * 0.12, h * 0.65, w * 0.18, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(waterPath, waterPaint);

    // Shoreline highlight
    final shorePaint = Paint()
      ..color = const Color(0x3338BDF8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawPath(waterPath, shorePaint);

    // Water label
    final waterTextPainter = TextPainter(
      text: const TextSpan(
        text: 'PACIFIC OCEAN',
        style: TextStyle(
          color: Color(0x3394A3B8),
          fontSize: 8.5,
          fontWeight: FontWeight.w700,
          letterSpacing: 2.0,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    waterTextPainter.paint(canvas, Offset(8, h * 0.45));

    // 3. Green Park Areas (Google Maps Dark Parks: #14241D)
    final parkPaint = Paint()..color = const Color(0xFF14241D);
    final park1 = Path()
      ..addRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.55, h * 0.18, 45, 30), const Radius.circular(8)));
    final park2 = Path()
      ..addRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.30, h * 0.68, 55, 25), const Radius.circular(8)));
    canvas.drawPath(park1, parkPaint);
    canvas.drawPath(park2, parkPaint);

    // 4. Minor City Streets Grid (Subtle Steel Lines: #242938)
    final streetPaint = Paint()
      ..color = const Color(0xFF242938)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    for (double y = 20; y < h; y += 22) {
      canvas.drawLine(Offset(w * 0.20, y), Offset(w, y + (y % 44 == 0 ? 6 : -4)), streetPaint);
    }
    for (double x = w * 0.22; x < w; x += 32) {
      canvas.drawLine(Offset(x, 0), Offset(x + 10, h), streetPaint);
    }

    // 5. Major Arterial Boulevards (Google Maps Secondary Roads: #2D3548)
    final arterialPaint = Paint()
      ..color = const Color(0xFF2D3548)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;

    // Torrance Blvd (horizontal arterial)
    final torranceBlvd = Path()
      ..moveTo(w * 0.18, h * 0.52)
      ..cubicTo(w * 0.45, h * 0.50, w * 0.75, h * 0.54, w, h * 0.52);
    canvas.drawPath(torranceBlvd, arterialPaint);

    // Hawthorne Blvd (vertical arterial)
    final hawthorneBlvd = Path()
      ..moveTo(w * 0.48, 0)
      ..cubicTo(w * 0.49, h * 0.40, w * 0.52, h * 0.70, w * 0.54, h);
    canvas.drawPath(hawthorneBlvd, arterialPaint);

    // Sepulveda Blvd (diagonal arterial)
    final sepulvedaBlvd = Path()
      ..moveTo(w * 0.20, h * 0.82)
      ..cubicTo(w * 0.50, h * 0.80, w * 0.80, h * 0.85, w, h * 0.78);
    canvas.drawPath(sepulvedaBlvd, arterialPaint);

    // 6. Interstate Freeway (I-405 / CA-1 / Major Highway: #3E475C with amber bridge core)
    final freewayUnderlay = Paint()
      ..color = const Color(0xFF3E475C)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0;
    final freewayCore = Paint()
      ..color = const Color(0xFF4F5B75)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final freeway405 = Path()
      ..moveTo(w * 0.65, 0)
      ..cubicTo(w * 0.70, h * 0.35, w * 0.82, h * 0.70, w * 0.90, h);
    canvas.drawPath(freeway405, freewayUnderlay);
    canvas.drawPath(freeway405, freewayCore);

    // Pacific Coast Hwy (along coastline)
    final pch = Path()
      ..moveTo(w * 0.23, 0)
      ..cubicTo(w * 0.22, h * 0.35, w * 0.16, h * 0.65, w * 0.21, h);
    canvas.drawPath(pch, freewayUnderlay);
    canvas.drawPath(pch, freewayCore);

    // 7. Highway Shields (Interstate 405 badge & CA-1)
    _drawHighwayShield(canvas, Offset(w * 0.74, h * 0.32), '405');
    _drawHighwayShield(canvas, Offset(w * 0.20, h * 0.25), '1');

    // 8. District & Street Labels
    _drawMapLabel(canvas, Offset(w * 0.58, h * 0.38), cityName.toUpperCase(), isPrimary: true);
    _drawMapLabel(canvas, Offset(w * 0.24, h * 0.12), 'Redondo Beach');
    _drawMapLabel(canvas, Offset(w * 0.65, h * 0.72), 'Del Amo');
    _drawMapLabel(canvas, Offset(w * 0.34, h * 0.54), 'Torrance Blvd', isStreet: true);
    _drawMapLabel(canvas, Offset(w * 0.51, h * 0.22), 'Hawthorne Blvd', isStreet: true, isVertical: true);
  }

  void _drawHighwayShield(Canvas canvas, Offset pos, String number) {
    final shieldPaint = Paint()..color = const Color(0xFF1D4ED8);
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final rect = Rect.fromCenter(center: pos, width: 18, height: 14);
    final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(3));
    canvas.drawRRect(rrect, shieldPaint);
    canvas.drawRRect(rrect, borderPaint);

    final textPainter = TextPainter(
      text: TextSpan(
        text: number,
        style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w900),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    textPainter.paint(canvas, Offset(pos.dx - textPainter.width / 2, pos.dy - textPainter.height / 2));
  }

  void _drawMapLabel(Canvas canvas, Offset pos, String text, {bool isPrimary = false, bool isStreet = false, bool isVertical = false}) {
    final textPainter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: isPrimary
              ? Colors.white.withValues(alpha: 0.85)
              : (isStreet ? const Color(0xFF6B7280) : const Color(0xFF9CA3AF)),
          fontSize: isPrimary ? 11 : (isStreet ? 8 : 9),
          fontWeight: isPrimary ? FontWeight.w800 : (isStreet ? FontWeight.w500 : FontWeight.w600),
          letterSpacing: isPrimary ? 1.0 : 0.2,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();

    if (isVertical) {
      canvas.save();
      canvas.translate(pos.dx, pos.dy);
      canvas.rotate(math.pi / 2.2);
      textPainter.paint(canvas, Offset.zero);
      canvas.restore();
    } else {
      textPainter.paint(canvas, pos);
    }
  }

  @override
  bool shouldRepaint(covariant _GoogleMapsNightPainter oldDelegate) => oldDelegate.cityName != cityName;
}
