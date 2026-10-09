// Crowdbeats V2 — Typographic Hierarchy & Font Stack (Direction B)
// Authoritative type engine: Plus Jakarta Sans for UI copy + JetBrains Mono with tabular figures for financial data.

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CbTypography {
  CbTypography._();

  static const String fontSans = 'Plus Jakarta Sans';
  static const String fontMono = 'JetBrains Mono';

  /// Primary TextTheme builder using Plus Jakarta Sans
  static TextTheme textTheme([Color? textColor]) {
    final base = GoogleFonts.plusJakartaSansTextTheme();
    if (textColor == null) return base;
    return base.apply(
      bodyColor: textColor,
      displayColor: textColor,
    );
  }

  // ── Display & Headings ──────────────────────────────────────────────────────
  static TextStyle displayLg({Color? color}) => GoogleFonts.plusJakartaSans(
    fontSize: 48,
    fontWeight: FontWeight.w800,
    height: 56 / 48,
    letterSpacing: -0.02 * 48,
    color: color,
  );

  static TextStyle displayLgMobile({Color? color}) => GoogleFonts.plusJakartaSans(
    fontSize: 36,
    fontWeight: FontWeight.w800,
    height: 44 / 36,
    letterSpacing: -0.02 * 36,
    color: color,
  );

  static TextStyle pageTitle({Color? color}) => GoogleFonts.plusJakartaSans(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    height: 40 / 32,
    letterSpacing: -0.015 * 32,
    color: color,
  );

  static TextStyle sectionTitle({Color? color}) => GoogleFonts.plusJakartaSans(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    height: 32 / 24,
    letterSpacing: -0.01 * 24,
    color: color,
  );

  static TextStyle cardTitle({Color? color}) => GoogleFonts.plusJakartaSans(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    height: 24 / 18,
    letterSpacing: -0.005 * 18,
    color: color,
  );

  // ── Body Styles ─────────────────────────────────────────────────────────────
  static TextStyle bodyLg({Color? color}) => GoogleFonts.plusJakartaSans(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 24 / 16,
    color: color,
  );

  static TextStyle bodyMd({Color? color}) => GoogleFonts.plusJakartaSans(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 20 / 14,
    color: color,
  );

  static TextStyle bodySm({Color? color}) => GoogleFonts.plusJakartaSans(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 16 / 12,
    color: color,
  );

  // ── Labels & Controls ───────────────────────────────────────────────────────
  static TextStyle labelLg({Color? color}) => GoogleFonts.plusJakartaSans(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 20 / 16,
    color: color,
  );

  static TextStyle labelMd({Color? color}) => GoogleFonts.plusJakartaSans(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 18 / 14,
    color: color,
  );

  static TextStyle labelSm({Color? color}) => GoogleFonts.plusJakartaSans(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    height: 16 / 12,
    color: color,
  );

  // ── Tabular Numerical & Monospace (JetBrains Mono) ─────────────────────────
  static TextStyle monoNumberLg({Color? color}) => GoogleFonts.jetBrainsMono(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    height: 34 / 28,
    fontFeatures: const [FontFeature.tabularFigures()],
    color: color,
  );

  static TextStyle monoNumberMd({Color? color}) => GoogleFonts.jetBrainsMono(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    height: 24 / 18,
    fontFeatures: const [FontFeature.tabularFigures()],
    color: color,
  );

  static TextStyle monoNumberSm({Color? color}) => GoogleFonts.jetBrainsMono(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    height: 18 / 14,
    fontFeatures: const [FontFeature.tabularFigures()],
    color: color,
  );
}
