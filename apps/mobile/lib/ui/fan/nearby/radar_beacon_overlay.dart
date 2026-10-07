// Crowdbeats V2 — Radar Beacon Canvas Overlay (Stitch Screen 11)
// Animates pulsing radar wave sweeps and beacon rings over live music stages.

import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../theme/cb_colors.dart';

class RadarBeaconOverlay extends StatefulWidget {
  const RadarBeaconOverlay({
    super.key,
    required this.stagePositions,
    this.isScanning = true,
  });

  final List<Offset> stagePositions;
  final bool isScanning;

  @override
  State<RadarBeaconOverlay> createState() => _RadarBeaconOverlayState();
}

class _RadarBeaconOverlayState extends State<RadarBeaconOverlay> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: Size.infinite,
          painter: _RadarPainter(
            progress: _controller.value,
            stagePositions: widget.stagePositions,
            isScanning: widget.isScanning,
          ),
        );
      },
    );
  }
}

class _RadarPainter extends CustomPainter {
  _RadarPainter({
    required this.progress,
    required this.stagePositions,
    required this.isScanning,
  });

  final double progress;
  final List<Offset> stagePositions;
  final bool isScanning;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);

    if (isScanning) {
      // 1. Scanning Sweep Cone
      final sweepAngle = math.pi / 3;
      final startAngle = progress * 2 * math.pi;

      final scanPaint = Paint()
        ..shader = SweepGradient(
          center: FractionalOffset.center,
          startAngle: 0,
          endAngle: sweepAngle,
          colors: [
            CbColors.purpleMain.withAlpha(0),
            CbColors.purpleMain.withAlpha(50),
          ],
          transform: GradientRotation(startAngle),
        ).createShader(Rect.fromCircle(center: center, radius: size.width * 0.7));

      canvas.drawCircle(center, size.width * 0.65, scanPaint);
    }

    // 2. Pulsing Beacon Rings on Stage Locations
    for (final pos in stagePositions) {
      for (var i = 0; i < 3; i++) {
        final ringProgress = (progress + (i * 0.33)) % 1.0;
        final radius = 15.0 + (ringProgress * 45.0);
        final opacity = (1.0 - ringProgress).clamp(0.0, 1.0) * 0.6;

        final ringPaint = Paint()
          ..color = CbColors.purpleMain.withValues(alpha: opacity)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.8;

        canvas.drawCircle(pos, radius, ringPaint);
      }

      // Center Stage Glowing Core
      final corePaint = Paint()
        ..color = CbColors.liveGreen
        ..style = PaintingStyle.fill;
      canvas.drawCircle(pos, 5, corePaint);
    }
  }

  @override
  bool shouldRepaint(covariant _RadarPainter oldDelegate) => true;
}
