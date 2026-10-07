// Crowdbeats V2 — Stitch Authoritative Color System (Project 5326179813018056505)
// All colors reference semantic tokens — never use primitives directly in components.
// Contrast ratios vs #0B0C10 documented for WCAG 2.2 AA compliance.

import 'package:flutter/material.dart';

class CbColors {
  CbColors._();

  // ── Stitch Authoritative Palette: Deep Backgrounds & Surfaces ─────────────
  static const Color bgApp         = Color(0xFF0B0C10); // Root app scaffold background
  static const Color surface1      = Color(0xFF151722); // Primary card & list container
  static const Color surface2      = Color(0xFF1E2032); // Elevated card, inputs, chips
  static const Color surface3      = Color(0xFF282A42); // Hovered / active surface
  static const Color surfaceGlass  = Color(0xBF151722); // 75% opacity frosted glass fill

  // ── Stitch Authoritative Palette: Borders & Glass Highlights ──────────────
  static const Color borderSubtle  = Color(0xFF2B2D44); // Standard card & input border
  static const Color borderFocus   = Color(0xFF7C3AED); // Active / focused purple border
  static const Color borderGlass   = Color(0x14FFFFFF); // 8% white glass highlight
  static const Color borderError   = Color(0xFFEF4444); // Error / warning border

  // ── Stitch Authoritative Palette: Vibrant Violet / Purple Accent ───────────
  static const Color stitchPurple  = Color(0xFF6200EE); // Stitch primary (#6200EE)
  static const Color stitchMagenta = Color(0xFFBB86FC); // Stitch secondary (#BB86FC)
  static const Color tealGas       = Color(0xFF03DAC6); // Stitch tertiary Teal Gas (#03DAC6)
  static const Color purpleLight   = Color(0xFFA855F7); // Gradient start / highlight
  static const Color purpleMain    = Color(0xFF7C3AED); // Primary CTA buttons / active badges
  static const Color purpleDark    = Color(0xFF6D28D9); // Gradient end / pressed state
  static const Color purpleDim     = Color(0x267C3AED); // 15% opacity chip / container fill
  static const Color purpleGlow    = Color(0x737C3AED); // 45% opacity button shadow glow

  // ── Stitch Authoritative Palette: Status & Semantic Accents ────────────────
  static const Color liveGreen     = Color(0xFF10B981); // LIVE badge, verified checks, $ amounts
  static const Color reticleGreen  = Color(0xFF00FF66); // AR camera targeting reticle
  static const Color heartOrange   = Color(0xFFFB923C); // Following / warmth accents
  static const Color heartPink     = Color(0xFFEC4899); // Heart icons / social highlights
  static const Color verifiedBlue  = Color(0xFF38BDF8); // Verified creator checkmark badge
  static const Color gpsBlue       = Color(0xFF3B82F6); // Map user location & radar beacon
  static const Color rankGold      = Color(0xFFF59E0B); // #1 Popular ranking gold badge
  static const Color rankSilver    = Color(0xFF94A3B8); // #2 Popular ranking silver badge
  static const Color rankBronze    = Color(0xFFB97333); // #3 Popular ranking bronze badge
  static const Color errorRed      = Color(0xFFEF4444); // Validation & strike errors

  // ── Stitch Authoritative Palette: Typography ───────────────────────────────
  static const Color textPrimary   = Color(0xFFFFFFFF); // High-contrast headers & primary text (21:1 ✅ AAA)
  static const Color textSecondary = Color(0xFF94A3B8); // Subtitles, metadata, distance labels (6.5:1 ✅ AA)
  static const Color textMuted     = Color(0xFF8A9BAE); // Placeholders, captions, footnotes (4.8:1 ✅ AA)
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textOnAccent  = Color(0xFFFFFFFF);
  static const Color textDisabled  = Color(0xFF8A9BAE);

  // ── Status Tokens ──────────────────────────────────────────────────────────
  static const Color statusSuccess = liveGreen;
  static const Color statusWarning = heartOrange;
  static const Color statusError   = errorRed;
  static const Color statusInfo    = gpsBlue;
  static const Color statusLive    = liveGreen;
  static const Color livePulse     = liveGreen;

  // ── Dataviz Tokens ─────────────────────────────────────────────────────────
  static const Color dataviz1      = purpleLight;
  static const Color dataviz2      = purpleMain;
  static const Color dataviz3      = liveGreen;
  static const Color dataviz4      = heartOrange;
  static const Color dataviz5      = gpsBlue;

  // ── Backward-Compatible Semantic Aliases ────────────────────────────────────
  static const Color surfaceBase        = bgApp;
  static const Color surfaceRaised      = surface1;
  static const Color surfaceOverlay     = surface2;
  static const Color surfaceCard        = surface2;
  static const Color surfacePressed     = surface3;
  static const Color liveSurface        = surface2;
  static const Color liveText           = liveGreen;
  static const Color liveGlow           = purpleGlow;
  static const Color accentPrimary      = purpleMain;
  static const Color accentSecondary    = purpleLight;
  static const Color accentPrimarySubtle = purpleDim;
  static const Color accentSecondarySubtle = purpleDim;
  static const Color textTertiary       = textMuted;
  static const Color borderDefault      = borderSubtle;
  static const Color pink400            = purpleLight;
  static const Color pink500            = purpleMain;
  static const Color violet500          = purpleMain;
  static const Color green400           = liveGreen;
  static const Color red400             = errorRed;
  static const Color amber400           = heartOrange;
  static const Color blue400            = gpsBlue;
  static const Color gray950            = bgApp;
  static const Color gray900            = surface1;
  static const Color gray800            = surface2;
  static const Color gray700            = borderSubtle;
  static const Color gray400            = textSecondary;
  static const Color gray100            = textPrimary;

  // ── Gradients ──────────────────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [purpleMain, Color(0xFF9333EA)],
  );

  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Colors.transparent, Color(0xCC0B0C10), bgApp],
  );
}
