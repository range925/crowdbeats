// Crowdbeats V2 — Official Master Logo Component
// Authoritative brand identity component supporting full horizontal master logo
// and compact emblem variants rendered from official master PNG assets.

import 'package:flutter/material.dart';

/// The variant of the Crowdbeats logo to render.
enum CbLogoVariant {
  /// Full horizontal master logo (CB Musical-Note Emblem + Crowdbeats Wordmark).
  horizontal,

  /// CB Musical-Note Emblem only (for square/compact placements, app icons, badges).
  emblem,
}

/// The target surface/background mode for optimal contrast.
enum CbLogoSurface {
  /// Automatically resolves based on Theme.of(context).brightness.
  auto,

  /// Light background (white/light surfaces).
  light,

  /// Dark background (black/dark surfaces).
  dark,
}

/// Compatibility aliases for CrowdbeatsLogo types.
typedef CrowdbeatsLogoVariant = CbLogoVariant;
typedef CrowdbeatsLogoSurface = CbLogoSurface;

/// Master Crowdbeats logo component.
class CrowdbeatsLogo extends StatelessWidget {
  const CrowdbeatsLogo({
    super.key,
    this.variant = CbLogoVariant.horizontal,
    this.surface = CbLogoSurface.auto,
    this.height = 32.0,
    this.width,
    this.excludeFromSemantics = false,
    this.withBacking = false,
    this.padding,
  });

  /// The logo variant to render.
  final CbLogoVariant variant;

  /// The surface/background the logo is rendered upon.
  final CbLogoSurface surface;

  /// Target display height. Default is 32.0.
  final double height;

  /// Optional explicit width. When null, width is computed from natural aspect ratio
  /// (6.5:1 for horizontal cropped, 1.0:1 for emblem).
  final double? width;

  /// Whether to exclude from semantics (e.g. if adjacent text already announces Crowdbeats).
  final bool excludeFromSemantics;

  /// Whether to wrap the logo in a restrained obsidian dark backing plate.
  /// Maintained for backward compatibility.
  final bool withBacking;

  /// Custom padding when backing plate is enabled.
  final EdgeInsetsGeometry? padding;

  /// Natural aspect ratios of master artwork:
  /// Horizontal cropped: 832w x 128h = 6.5
  /// Emblem: 128w x 128h = 1.0
  static const double _horizontalAspectRatio = 6.5;
  static const double _emblemAspectRatio = 1;

  @override
  Widget build(BuildContext context) {
    final effectiveAspectRatio = variant == CbLogoVariant.horizontal
        ? _horizontalAspectRatio
        : _emblemAspectRatio;

    final effectiveWidth = width ?? (height * effectiveAspectRatio);

    final bool isLightSurface;
    switch (surface) {
      case CbLogoSurface.auto:
        isLightSurface = Theme.of(context).brightness == Brightness.light;
        break;
      case CbLogoSurface.light:
        isLightSurface = true;
        break;
      case CbLogoSurface.dark:
        isLightSurface = false;
        break;
    }

    final String assetPath;
    if (variant == CbLogoVariant.horizontal) {
      assetPath = isLightSurface
          ? 'assets/images/crowdbeats-logo-on-light-cropped.png'
          : 'assets/images/crowdbeats-logo-on-dark-cropped.png';
    } else {
      assetPath = isLightSurface
          ? 'assets/images/crowdbeats-emblem-on-light.png'
          : 'assets/images/crowdbeats-emblem-on-dark.png';
    }

    Widget logoContent = Image.asset(
      assetPath,
      width: effectiveWidth,
      height: height,
      fit: BoxFit.contain,
    );

    if (!excludeFromSemantics) {
      logoContent = Semantics(
        label: 'Crowdbeats',
        image: true,
        child: logoContent,
      );
    }

    if (withBacking) {
      return Container(
        padding: padding ?? const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFF0B0C10),
          borderRadius: BorderRadius.circular(height * 0.35),
          border: Border.all(
            color: const Color(0x33FFFFFF),
            width: 1,
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x33000000),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: logoContent,
      );
    }

    return SizedBox(
      width: effectiveWidth,
      height: height,
      child: logoContent,
    );
  }
}

/// Backwards compatibility alias for [CrowdbeatsLogo].
typedef CbLogo = CrowdbeatsLogo;
