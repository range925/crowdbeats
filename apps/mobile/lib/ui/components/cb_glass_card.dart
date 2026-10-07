// Crowdbeats V2 — Glassmorphism Card Component (Phase 1)
// Stitch Project 5326179813018056505 (Vivid Resonance)
// Features: 20px Backdrop blur, 16px soft-rounded corners, 1px inner glow border.

import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/cb_spacing.dart';

class CbGlassCard extends StatelessWidget {
  const CbGlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(CbSpacing.s4),
    this.margin,
    this.onTap,
    this.borderRadius,
    this.borderColor,
    this.backgroundColor,
    this.hasGlow = false,
    this.semanticLabel,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final BorderRadius? borderRadius;
  final Color? borderColor;
  final Color? backgroundColor;
  final bool hasGlow;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.circular(CbSpacing.radiusLg);
    final border = borderColor ?? const Color(0x1AFFFFFF);
    final bg = backgroundColor ?? const Color(0xCC1C1B1B);

    Widget card = Container(
      margin: margin,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: radius,
        border: Border.all(color: border, width: 1),
        boxShadow: hasGlow
            ? const [
                BoxShadow(
                  color: Color(0x336200EE),
                  blurRadius: 16,
                  offset: Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Padding(
            padding: padding,
            child: child,
          ),
        ),
      ),
    );

    if (onTap != null) {
      card = Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: radius,
          onTap: onTap,
          child: card,
        ),
      );
    }

    if (semanticLabel != null) {
      card = Semantics(
        label: semanticLabel,
        container: true,
        explicitChildNodes: true,
        child: card,
      );
    }

    return card;
  }
}
