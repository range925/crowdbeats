// Crowdbeats V2 — Stitch Authoritative Live Status Badge (Project 5326179813018056505)
// Vibrant emerald green LIVE indicator pill with animated pulsing dot.

import 'package:flutter/material.dart';
import '../theme/cb_colors.dart';
import '../theme/cb_spacing.dart';

class CbLiveBadge extends StatefulWidget {
  const CbLiveBadge({
    super.key,
    this.label = 'LIVE',
    this.showPulse = true,
  });

  final String label;
  final bool showPulse;

  @override
  State<CbLiveBadge> createState() => _CbLiveBadgeState();
}

class _CbLiveBadgeState extends State<CbLiveBadge> with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: CbSpacing.s2, vertical: 3),
      decoration: BoxDecoration(
        color: CbColors.liveGreen,
        borderRadius: BorderRadius.circular(CbSpacing.radiusSm),
        boxShadow: const [
          BoxShadow(
            color: Color(0x6610B981),
            blurRadius: 8,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.showPulse) ...[
            FadeTransition(
              opacity: Tween<double>(begin: 0.4, end: 1).animate(_pulseController),
              child: Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
              ),
            ),
            const SizedBox(width: 4),
          ],
          Text(
            widget.label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
            ),
          ),
        ],
      ),
    );
  }
}
