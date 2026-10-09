// Crowdbeats V2 — CompactGoogleMap Widget
//
// Authentic Google Maps Light & Dark basemap preview positioned directly below Location Search:
// - Light & Dark theme basemap parity with web DiscoverMap (MAP_STYLE_LIGHT & MAP_STYLE_DARK)
// - Google Maps UI controls (Google watermark, zoom buttons, compass, copyright notice)
// - Google Maps signature pulsing blue GPS location dot
// - Top 5 numbered drop-pin markers (1–5) with Solo Musician vs Band distinction
// - Live glow rings (emerald) and electric violet selected halos
// - Manual pan gesture tracking with floating "Search this area" pill
// - Floating selected performer preview card with direct "Tip" button

import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../data/models/discovery.dart';
import '../../theme/cb_colors.dart';
import '../views/nearby_secondary_view.dart';
import '../tip/tip_flow_screen.dart';

class CompactGoogleMap extends StatefulWidget {
  const CompactGoogleMap({
    super.key,
    required this.discoveryLocation,
    required this.performers,
    required this.isSearchAreaMode,
    required this.onUseMyLocation,
    this.isLocating = false,
    this.selectedPerformer,
    this.onSelectPerformer,
    this.onSearchThisArea,
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
  final VoidCallback? onSearchThisArea;

  @override
  State<CompactGoogleMap> createState() => _CompactGoogleMapState();
}

class _CompactGoogleMapState extends State<CompactGoogleMap> {
  Offset _panOffset = Offset.zero;
  bool _isManuallyPanned = false;

  void _resetPan() {
    setState(() {
      _panOffset = Offset.zero;
      _isManuallyPanned = false;
    });
  }

  @override
  void didUpdateWidget(covariant CompactGoogleMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    // If the location changed programmatically and wasn't a pan gesture, reset pan
    if (oldWidget.discoveryLocation.placeId != widget.discoveryLocation.placeId) {
      _resetPan();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final visibleMarkers = widget.performers.take(5).toList();

    final cardBg = isDark ? const Color(0xFF151722) : Colors.white;
    final mapBg = isDark ? const Color(0xFF1A1D28) : const Color(0xFFF1F5F9);
    final borderColor = widget.isSearchAreaMode
        ? const Color(0x667C3AED)
        : (isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE2E8F0));
    final headerTextColor = isDark ? Colors.white : const Color(0xFF0F172A);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: borderColor,
          width: widget.isSearchAreaMode ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.45 : 0.08),
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
                        color: widget.isSearchAreaMode
                            ? const Color(0xFFA855F7)
                            : const Color(0xFF10B981),
                        boxShadow: [
                          BoxShadow(
                            color: widget.isSearchAreaMode
                                ? const Color(0xFFA855F7)
                                : const Color(0xFF10B981),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      widget.isSearchAreaMode
                          ? 'Exploring ${widget.discoveryLocation.city}'
                          : 'You are here · ${widget.discoveryLocation.city}',
                      style: TextStyle(
                        color: headerTextColor,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                if (widget.isSearchAreaMode ||
                    (!widget.isSearchAreaMode && widget.discoveryLocation.placeId != 'device_gps') ||
                    _isManuallyPanned)
                  GestureDetector(
                    onTap: widget.isLocating
                        ? null
                        : () {
                            _resetPan();
                            widget.onUseMyLocation();
                          },
                    child: widget.isLocating
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
                                widget.isSearchAreaMode ? 'Reset' : 'Near Me',
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
            onPanUpdate: (details) {
              setState(() {
                _panOffset += details.delta;
                _isManuallyPanned = true;
              });
            },
            child: Container(
              height: 220,
              decoration: BoxDecoration(
                color: mapBg,
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
              ),
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
                child: Stack(
                  children: [
                    // 1. Google Maps Basemap Canvas (Light or Dark)
                    Positioned.fill(
                      child: CustomPaint(
                        painter: _GoogleMapsBasemapPainter(
                          cityName: widget.discoveryLocation.city,
                          isDark: isDark,
                          panOffset: _panOffset,
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
                              color: isDark ? const Color(0xE6202430) : Colors.white.withValues(alpha: 0.9),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isDark ? Colors.white.withValues(alpha: 0.15) : const Color(0xFFCBD5E1),
                              ),
                              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                            ),
                            child: const Center(
                              child: Icon(Icons.explore_rounded, color: Color(0xFFEA4335), size: 16),
                            ),
                          ),
                          const SizedBox(height: 8),
                          // Zoom Controls
                          Container(
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xE6202430) : Colors.white.withValues(alpha: 0.9),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isDark ? Colors.white.withValues(alpha: 0.15) : const Color(0xFFCBD5E1),
                              ),
                              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                            ),
                            child: Column(
                              children: [
                                SizedBox(
                                  width: 28,
                                  height: 26,
                                  child: Center(
                                    child: Text(
                                      '+',
                                      style: TextStyle(
                                        color: isDark ? Colors.white.withValues(alpha: 0.8) : const Color(0xFF334155),
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                                Container(
                                  width: 20,
                                  height: 1,
                                  color: isDark ? Colors.white.withValues(alpha: 0.1) : const Color(0xFFE2E8F0),
                                ),
                                SizedBox(
                                  width: 28,
                                  height: 26,
                                  child: Center(
                                    child: Text(
                                      '−',
                                      style: TextStyle(
                                        color: isDark ? Colors.white.withValues(alpha: 0.8) : const Color(0xFF334155),
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
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
                    Positioned(
                      left: 170.0 + _panOffset.dx,
                      top: 100.0 + _panOffset.dy,
                      child: const _GoogleGpsBlueDot(),
                    ),

                    // 4. Musician Drop-Pin Markers (Top 5 Numbered 1 to 5)
                    ...visibleMarkers.asMap().entries.map((entry) {
                      final index = entry.key;
                      final p = entry.value;
                      final rank = index + 1;
                      final angle = (index * (2 * math.pi / visibleMarkers.length)) + 0.45;
                      final radius = 58.0 + (index % 2) * 22.0;
                      final isSelected = widget.selectedPerformer?.id == p.id;

                      final pinLeft = 140.0 + math.cos(angle) * radius + _panOffset.dx;
                      final pinTop = 85.0 + math.sin(angle) * radius + _panOffset.dy;

                      return Positioned(
                        left: pinLeft,
                        top: pinTop,
                        child: GestureDetector(
                          onTap: () {
                            if (widget.onSelectPerformer != null) {
                              widget.onSelectPerformer!(p);
                            }
                          },
                          child: _GoogleMapPerformerPin(
                            performer: p,
                            rank: rank,
                            isSelected: isSelected,
                            isDark: isDark,
                          ),
                        ),
                      );
                    }),

                    // 5. Floating "Search this area" Pill (When manually panned)
                    if (_isManuallyPanned)
                      Positioned(
                        top: 10,
                        left: 0,
                        right: 0,
                        child: Center(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _isManuallyPanned = false;
                                _panOffset = Offset.zero;
                              });
                              widget.onSearchThisArea?.call();
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xF01E2032) : Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: const Color(0xFFA855F7),
                                  width: 1.5,
                                ),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Colors.black26,
                                    blurRadius: 8,
                                    offset: Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.refresh_rounded, color: Color(0xFFA855F7), size: 14),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Search this area',
                                    style: TextStyle(
                                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),

                    // 6. Google Maps Bottom Watermark & Legal Notice
                    Positioned(
                      bottom: 46,
                      left: 10,
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xCC111319) : Colors.white.withValues(alpha: 0.85),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: isDark ? Colors.transparent : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
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
                          color: isDark ? Colors.white.withValues(alpha: 0.35) : const Color(0xFF64748B),
                          fontSize: 9,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ),

                    // 7. Bottom Overlay Bar (Selected Performer Preview OR Expand Bar)
                    Positioned(
                      bottom: 8,
                      left: 10,
                      right: 10,
                      child: widget.selectedPerformer != null
                          ? _SelectedPerformerPreview(
                              performer: widget.selectedPerformer!,
                              rank: visibleMarkers.contains(widget.selectedPerformer!)
                                  ? visibleMarkers.indexOf(widget.selectedPerformer!) + 1
                                  : null,
                              isDark: isDark,
                            )
                          : GestureDetector(
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(builder: (_) => const NearbySecondaryView()),
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xF2151722) : Colors.white.withValues(alpha: 0.95),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE2E8F0),
                                  ),
                                  boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6)],
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
                                          '${visibleMarkers.length} stages around ${widget.discoveryLocation.city}',
                                          style: TextStyle(
                                            color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B),
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

/// Floating Selected Performer Preview Card over Map
class _SelectedPerformerPreview extends StatelessWidget {
  const _SelectedPerformerPreview({
    required this.performer,
    this.rank,
    required this.isDark,
  });

  final PublicPerformer performer;
  final int? rank;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xF51B1E28) : Colors.white.withValues(alpha: 0.98),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFA855F7),
          width: 1.5,
        ),
        boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 8)],
      ),
      child: Row(
        children: [
          if (rank != null) ...[
            Container(
              width: 22,
              height: 22,
              decoration: const BoxDecoration(
                color: Color(0xFF7C3AED),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '$rank',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900),
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        performer.name,
                        style: TextStyle(
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (performer.isLive) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'LIVE',
                          style: TextStyle(color: Colors.white, fontSize: 7, fontWeight: FontWeight.w900),
                        ),
                      ),
                    ],
                  ],
                ),
                Text(
                  '${performer.type == 'band' ? 'Band' : 'Solo'} · ${performer.currentVenueName ?? 'Main Stage'}${performer.distanceMiles != null ? ' · ${performer.distanceMiles!.toStringAsFixed(1)} mi' : ''}',
                  style: TextStyle(
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => TipFlowScreen(
                    recipientId: performer.id,
                    recipientName: performer.name,
                    recipientType: performer.type,
                    avatarUrl: performer.photoUrl,
                    genre: performer.genres.isNotEmpty ? performer.genres.first : 'Live Music',
                    venue: performer.currentVenueName ?? 'Main Stage',
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: CbColors.purpleMain,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              minimumSize: const Size(54, 28),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              elevation: 0,
            ),
            child: const Text('Tip', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
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
/// Numbered 1 to 5 with Solo Musician vs Band Distinction
class _GoogleMapPerformerPin extends StatelessWidget {
  const _GoogleMapPerformerPin({
    required this.performer,
    required this.rank,
    required this.isSelected,
    required this.isDark,
  });

  final PublicPerformer performer;
  final int rank;
  final bool isSelected;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final isSolo = performer.type != 'band';
    final isLive = performer.isLive;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Marker Pin Body
        Stack(
          alignment: Alignment.center,
          children: [
            // Selected electric violet halo
            if (isSelected)
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFA855F7), width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFA855F7).withValues(alpha: 0.6),
                      blurRadius: 12,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),

            // Live green glow ring
            if (isLive && !isSelected)
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF10B981).withValues(alpha: 0.65),
                      blurRadius: 10,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),

            // Performer Bear Avatar / Icon
            if (isSolo)
              Image.network(
                'solo_musician_bear.png',
                width: 40,
                height: 44,
                fit: BoxFit.contain,
                errorBuilder: (ctx, err, stack) => Image.asset(
                  'assets/images/solo_musician_bear.png',
                  width: 40,
                  height: 44,
                  fit: BoxFit.contain,
                  errorBuilder: (ctx2, err2, stack2) => Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: const Color(0xFF7C3AED).withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Center(child: Text('🎤', style: TextStyle(fontSize: 20))),
                  ),
                ),
              )
            else
              Image.network(
                'band_musician_bear.png',
                width: 44,
                height: 48,
                fit: BoxFit.contain,
                errorBuilder: (ctx, err, stack) => Image.asset(
                  'assets/images/band_musician_bear.png',
                  width: 44,
                  height: 48,
                  fit: BoxFit.contain,
                  errorBuilder: (ctx2, err2, stack2) => Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEC4899).withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Center(child: Text('🎸', style: TextStyle(fontSize: 20))),
                  ),
                ),
              ),

            // Top-Left Numbered Rank Badge (1–5)
            Positioned(
              top: 0,
              left: 0,
              child: Container(
                width: 17,
                height: 17,
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF7C3AED) : const Color(0xFF0F172A),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                  boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 3)],
                ),
                child: Center(
                  child: Text(
                    '$rank',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
            ),

            // Top-Right LIVE / BAND Badge
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
              )
            else if (!isSolo)
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

        // Dynamic Musician Name Badge
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

        // Pin Pointer Tip
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

/// Detailed Google Maps Basemap Painter supporting Light and Dark modes
/// Matching MAP_STYLE_LIGHT and MAP_STYLE_DARK from Web DiscoverMap
class _GoogleMapsBasemapPainter extends CustomPainter {
  const _GoogleMapsBasemapPainter({
    required this.cityName,
    required this.isDark,
    this.panOffset = Offset.zero,
  });

  final String cityName;
  final bool isDark;
  final Offset panOffset;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // 1. Base Landmass
    final landColor = isDark ? const Color(0xFF1A1D28) : const Color(0xFFF1F5F9);
    final landPaint = Paint()..color = landColor;
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), landPaint);

    // 2. Water Body (Pacific Coastline / Bay on the Left)
    final waterColor = isDark ? const Color(0xFF0F172A) : const Color(0xFFE0F2FE);
    final waterPaint = Paint()..color = waterColor;
    final waterPath = Path()
      ..moveTo(0, 0)
      ..lineTo(w * 0.22 + panOffset.dx * 0.2, 0)
      ..cubicTo(
        w * 0.20 + panOffset.dx * 0.2,
        h * 0.35 + panOffset.dy * 0.2,
        w * 0.12 + panOffset.dx * 0.2,
        h * 0.65 + panOffset.dy * 0.2,
        w * 0.18 + panOffset.dx * 0.2,
        h,
      )
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(waterPath, waterPaint);

    // Shoreline highlight
    final shoreColor = isDark ? const Color(0x3338BDF8) : const Color(0x660284C7);
    final shorePaint = Paint()
      ..color = shoreColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawPath(waterPath, shorePaint);

    // Water label
    final waterTextColor = isDark ? const Color(0x3394A3B8) : const Color(0x660284C7);
    final waterTextPainter = TextPainter(
      text: TextSpan(
        text: 'PACIFIC OCEAN',
        style: TextStyle(
          color: waterTextColor,
          fontSize: 8.5,
          fontWeight: FontWeight.w700,
          letterSpacing: 2.0,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    waterTextPainter.paint(canvas, Offset(8, h * 0.45));

    // 3. Green Park Areas
    final parkColor = isDark ? const Color(0xFF14241D) : const Color(0xFFDCFCE7);
    final parkPaint = Paint()..color = parkColor;
    final park1 = Path()
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.55 + panOffset.dx * 0.3, h * 0.18 + panOffset.dy * 0.3, 45, 30),
        const Radius.circular(8),
      ));
    final park2 = Path()
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.30 + panOffset.dx * 0.3, h * 0.68 + panOffset.dy * 0.3, 55, 25),
        const Radius.circular(8),
      ));
    canvas.drawPath(park1, parkPaint);
    canvas.drawPath(park2, parkPaint);

    // 4. Minor City Streets Grid
    final streetColor = isDark ? const Color(0xFF242938) : const Color(0xFFE2E8F0);
    final streetPaint = Paint()
      ..color = streetColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    for (double y = 20; y < h; y += 22) {
      canvas.drawLine(
        Offset(w * 0.20, y + (panOffset.dy * 0.4 % 22)),
        Offset(w, y + (panOffset.dy * 0.4 % 22) + (y % 44 == 0 ? 6 : -4)),
        streetPaint,
      );
    }
    for (double x = w * 0.22; x < w; x += 32) {
      canvas.drawLine(
        Offset(x + (panOffset.dx * 0.4 % 32), 0),
        Offset(x + 10 + (panOffset.dx * 0.4 % 32), h),
        streetPaint,
      );
    }

    // 5. Major Arterial Boulevards
    final arterialColor = isDark ? const Color(0xFF2D3548) : const Color(0xFFCBD5E1);
    final arterialPaint = Paint()
      ..color = arterialColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;

    // Torrance Blvd (horizontal arterial)
    final torranceBlvd = Path()
      ..moveTo(w * 0.18, h * 0.52 + panOffset.dy * 0.5)
      ..cubicTo(w * 0.45, h * 0.50 + panOffset.dy * 0.5, w * 0.75, h * 0.54 + panOffset.dy * 0.5, w, h * 0.52 + panOffset.dy * 0.5);
    canvas.drawPath(torranceBlvd, arterialPaint);

    // Hawthorne Blvd (vertical arterial)
    final hawthorneBlvd = Path()
      ..moveTo(w * 0.48 + panOffset.dx * 0.5, 0)
      ..cubicTo(w * 0.49 + panOffset.dx * 0.5, h * 0.40, w * 0.52 + panOffset.dx * 0.5, h * 0.70, w * 0.54 + panOffset.dx * 0.5, h);
    canvas.drawPath(hawthorneBlvd, arterialPaint);

    // Sepulveda Blvd (diagonal arterial)
    final sepulvedaBlvd = Path()
      ..moveTo(w * 0.20, h * 0.82 + panOffset.dy * 0.5)
      ..cubicTo(w * 0.50, h * 0.80 + panOffset.dy * 0.5, w * 0.80, h * 0.85 + panOffset.dy * 0.5, w, h * 0.78 + panOffset.dy * 0.5);
    canvas.drawPath(sepulvedaBlvd, arterialPaint);

    // 6. Interstate Freeway (I-405 / CA-1)
    final freewayUnderlayColor = isDark ? const Color(0xFF3E475C) : const Color(0xFF94A3B8);
    final freewayCoreColor = isDark ? const Color(0xFF4F5B75) : const Color(0xFFCBD5E1);

    final freewayUnderlay = Paint()
      ..color = freewayUnderlayColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0;
    final freewayCore = Paint()
      ..color = freewayCoreColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final freeway405 = Path()
      ..moveTo(w * 0.65 + panOffset.dx * 0.5, 0)
      ..cubicTo(
        w * 0.70 + panOffset.dx * 0.5,
        h * 0.35 + panOffset.dy * 0.5,
        w * 0.82 + panOffset.dx * 0.5,
        h * 0.70 + panOffset.dy * 0.5,
        w * 0.90 + panOffset.dx * 0.5,
        h,
      );
    canvas.drawPath(freeway405, freewayUnderlay);
    canvas.drawPath(freeway405, freewayCore);

    // Pacific Coast Hwy
    final pch = Path()
      ..moveTo(w * 0.23 + panOffset.dx * 0.5, 0)
      ..cubicTo(
        w * 0.22 + panOffset.dx * 0.5,
        h * 0.35 + panOffset.dy * 0.5,
        w * 0.16 + panOffset.dx * 0.5,
        h * 0.65 + panOffset.dy * 0.5,
        w * 0.21 + panOffset.dx * 0.5,
        h,
      );
    canvas.drawPath(pch, freewayUnderlay);
    canvas.drawPath(pch, freewayCore);

    // 7. Highway Shields (Interstate 405 badge & CA-1)
    _drawHighwayShield(canvas, Offset(w * 0.74 + panOffset.dx * 0.5, h * 0.32 + panOffset.dy * 0.5), '405');
    _drawHighwayShield(canvas, Offset(w * 0.20 + panOffset.dx * 0.5, h * 0.25 + panOffset.dy * 0.5), '1');

    // 8. District & Street Labels
    _drawMapLabel(canvas, Offset(w * 0.58 + panOffset.dx * 0.5, h * 0.38 + panOffset.dy * 0.5), cityName.toUpperCase(), isPrimary: true);
    _drawMapLabel(canvas, Offset(w * 0.24 + panOffset.dx * 0.5, h * 0.12 + panOffset.dy * 0.5), 'Redondo Beach');
    _drawMapLabel(canvas, Offset(w * 0.65 + panOffset.dx * 0.5, h * 0.72 + panOffset.dy * 0.5), 'Del Amo');
    _drawMapLabel(canvas, Offset(w * 0.34 + panOffset.dx * 0.5, h * 0.54 + panOffset.dy * 0.5), 'Torrance Blvd', isStreet: true);
    _drawMapLabel(canvas, Offset(w * 0.51 + panOffset.dx * 0.5, h * 0.22 + panOffset.dy * 0.5), 'Hawthorne Blvd', isStreet: true, isVertical: true);
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
    final textColor = isDark
        ? (isPrimary ? Colors.white.withValues(alpha: 0.85) : (isStreet ? const Color(0xFF6B7280) : const Color(0xFF9CA3AF)))
        : (isPrimary ? const Color(0xFF0F172A) : (isStreet ? const Color(0xFF64748B) : const Color(0xFF475569)));

    final textPainter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: textColor,
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
  bool shouldRepaint(covariant _GoogleMapsBasemapPainter oldDelegate) =>
      oldDelegate.cityName != cityName || oldDelegate.isDark != isDark || oldDelegate.panOffset != panOffset;
}
