// Crowdbeats V2 — Spacing and Motion tokens (Phase 4)

// ignore_for_file: avoid_classes_with_only_static_members
import 'package:flutter/widgets.dart';

class CbSpacing {
  CbSpacing._();

  // 4-point grid
  static const double s0   = 0;
  static const double s0_5 = 2;
  static const double s1   = 4;
  static const double s1_5 = 6;
  static const double s2   = 8;
  static const double s2_5 = 10;
  static const double s3   = 12;
  static const double s3_5 = 14;
  static const double s4   = 16;
  static const double s5   = 20;
  static const double s6   = 24;
  static const double s7   = 28;
  static const double s8   = 32;
  static const double s10  = 40;
  static const double s12  = 48;
  static const double s14  = 56;
  static const double s16  = 64;
  static const double s20  = 80;
  static const double s24  = 96;
  static const double s32  = 128;

  // Border Radius
  static const double radiusXs   = 4;
  static const double radiusSm   = 8;
  static const double radiusMd   = 12;
  static const double radiusLg   = 16;
  static const double radiusXl   = 24;
  static const double radius2xl  = 32;
  static const double radiusFull = 999;

  // Touch targets (WCAG + Material)
  static const double touchMin         = 48; // kMinInteractiveDimension
  static const double touchComfortable = 56;

  // Convenience EdgeInsets
  static EdgeInsets get cardPadding =>
      const EdgeInsets.all(s5);

  static EdgeInsets get screenPadding =>
      const EdgeInsets.symmetric(horizontal: s4);
}

class CbMotion {
  CbMotion._();

  // Durations
  static const Duration fast   = Duration(milliseconds: 100);
  static const Duration normal = Duration(milliseconds: 200);
  static const Duration slow   = Duration(milliseconds: 350);
  static const Duration xslow  = Duration(milliseconds: 500);

  // Curves
  static const Curve easeOut  = Curves.easeOut;
  static const Curve easeIn   = Curves.easeIn;
  static const Curve easeInOut= Curves.easeInOut;
  static const Curve spring   = Curves.easeOutBack;

  // Live pulse
  static const Duration livePulseDuration = Duration(milliseconds: 2000);

  // Respects system reduced-motion setting
  static Duration resolve(BuildContext context, Duration duration) {
    if (MediaQuery.of(context).disableAnimations) return Duration.zero;
    return duration;
  }

  static Curve resolveCurve(BuildContext context, Curve curve) {
    if (MediaQuery.of(context).disableAnimations) return Curves.linear;
    return curve;
  }
}
