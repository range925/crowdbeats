import 'package:flutter/material.dart';

/// Crowdbeats V2 Motion Tokens
///
/// All animation durations and curves used in the design system.
/// Always call [resolve] before using a duration so that the
/// OS-level "Reduce Motion" / "Disable Animations" preference is honoured
/// (WCAG 2.2 – 2.3.3 Animation from Interactions).
final class CbMotion {
  CbMotion._();

  // ──────────────────────────────────────────────────────────────────────────
  // Duration scale
  // ──────────────────────────────────────────────────────────────────────────

  /// Micro-interactions: icon state changes, ripple feedback.
  static const Duration fast = Duration(milliseconds: 100);

  /// Standard transitions: button press, chip selection.
  static const Duration normal = Duration(milliseconds: 200);

  /// Page/panel transitions, bottom sheets.
  static const Duration slow = Duration(milliseconds: 350);

  /// Hero / full-screen transitions.
  static const Duration xslow = Duration(milliseconds: 500);

  // ──────────────────────────────────────────────────────────────────────────
  // Curve constants
  // ──────────────────────────────────────────────────────────────────────────

  /// Decelerate — use for elements *entering* the screen.
  static const Curve easeOut = Curves.easeOut;

  /// Accelerate — use for elements *leaving* the screen.
  static const Curve easeIn = Curves.easeIn;

  /// Standard — use for in-place state changes.
  static const Curve easeInOut = Curves.easeInOut;

  /// Springy overshoot — use for bottom-sheet reveal.
  static const Curve spring = Curves.elasticOut;

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────────

  /// Returns [duration] normally, or [Duration.zero] when the OS
  /// "Reduce Motion" / "Disable Animations" preference is active.
  ///
  /// Example:
  /// ```dart
  /// AnimatedContainer(
  ///   duration: CbMotion.resolve(context, CbMotion.normal),
  ///   ...
  /// )
  /// ```
  static Duration resolve(BuildContext context, Duration duration) {
    if (MediaQuery.of(context).disableAnimations) return Duration.zero;
    return duration;
  }
}
