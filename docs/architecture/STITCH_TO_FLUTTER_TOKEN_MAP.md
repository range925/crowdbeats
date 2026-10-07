# Crowdbeats V2 — Stitch-to-Flutter Design Token Map
## Complete Design Token Extraction & Mapping: Stitch Project `5326179813018056505`

**Theme Name:** *Vivid Resonance*  
**Device Context:** Flutter Mobile (iOS & Android)  
**Date:** 2026-08-30

---

## 1. Color System Tokens

| Stitch Token Name | Stitch Hex / Value | Flutter Theme Constant (`CbColors`) | WCAG Contrast Ratio | Purpose / Usage |
| :--- | :--- | :--- | :--- | :--- |
| **`surface`** | `#131313` | `CbColors.bgApp` (`0xFF131313`) | 21:1 vs White | Root application background |
| **`surface-container-lowest`** | `#0e0e0e` | `CbColors.surfaceBase` (`0xFF0E0E0E`) | 21:1 vs White | Recessed areas & navigation rails |
| **`surface-container-low`** | `#1c1b1b` | `CbColors.surfaceCard` (`0xFF1C1B1B`) | 19.5:1 vs White | Standard dashboard & feed cards |
| **`surface-container`** | `#201f1f` | `CbColors.surfaceRaised` (`0xFF201F1F`) | 18:1 vs White | Elevated dialogs, modals & inputs |
| **`surface-container-highest`** | `#353534` | `CbColors.surfaceOverlay` (`0xFF353534`) | 12:1 vs White | Hovered / active surface states |
| **`primary` / `primary-container`** | `#6200ee` / `#cfbdff` | `CbColors.purpleMain` (`0xFF6200EE`) | 7.5:1 vs White | Core brand CTA buttons & active indicators |
| **`secondary` / `secondary-container`** | `#bb86fc` / `#dab9ff` | `CbColors.purpleLight` (`0xFFBB86FC`) | 12.2:1 vs Background | Highlights, active icons, neon glows |
| **`tertiary` / `tertiary-fixed`** | `#03dac6` / `#17deca` | `CbColors.tealGas` (`0xFF03DAC6`) | 11.4:1 vs Background | Live status badges, progress bars |
| **`error`** | `#ffb4ab` / `#ba1a1a` | `CbColors.statusError` (`0xFFEF4444`) | 5.2:1 vs Background | Validation errors, suspension alerts |
| **`on-surface`** | `#e5e2e1` | `CbColors.textPrimary` (`0xFFFFFFFF`) | 21:1 (AAA) | High-emphasis display headlines |
| **`on-surface-variant`** | `#cbc3d9` | `CbColors.textSecondary` (`0xFF94A3B8`) | 6.5:1 (AA) | Subtitles, metadata, card descriptions |
| **`outline`** | `#948da2` | `CbColors.borderSubtle` (`0x26FFFFFF`) | N/A | 1px card borders & input outlines |

---

## 2. Typography Hierarchy

| Stitch Role | Font Family | Size | Weight | Line Height | Flutter Implementation (`CbTheme`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Large** | Montserrat | 48px | 800 (Bold) | 56px | `GoogleFonts.montserrat(fontSize: 48, fontWeight: FontWeight.w800)` |
| **Headline Large** | Montserrat | 24px | 700 (Bold) | 32px | `GoogleFonts.montserrat(fontSize: 24, fontWeight: FontWeight.w700)` |
| **Headline Medium** | Montserrat | 20px | 600 (SemiBold)| 28px | `GoogleFonts.montserrat(fontSize: 20, fontWeight: FontWeight.w600)` |
| **Body Large** | Inter | 16px | 400 (Regular) | 24px | `GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w400)` |
| **Body Medium** | Inter | 14px | 400 (Regular) | 20px | `GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w400)` |
| **Label Large** | Inter | 14px | 600 (SemiBold)| 20px | `GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)` |
| **Label Small** | Inter | 12px | 500 (Medium) | 16px | `GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500)` |
| **Data Mono** | JetBrains Mono| 13px | 500 (Medium) | 18px | `GoogleFonts.jetBrainsMono(fontSize: 13, fontWeight: FontWeight.w500)` |

---

## 3. Spatial & Surface Tokens

| Stitch Token | Value | Flutter Spatial Constant (`CbSpacing`) |
| :--- | :--- | :--- |
| **Base Grid Unit** | 8px | `CbSpacing.s2` (8.0) |
| **Container Radius** | 16px (1rem) | `CbSpacing.radiusLg` (16.0) |
| **Interactive Radius** | 8px (0.5rem) | `CbSpacing.radiusMd` (8.0) |
| **Pill Radius** | 9999px | `CbSpacing.radiusFull` (9999.0) |
| **Backdrop Filter** | 20px blur | `ImageFilter.blur(sigmaX: 20, sigmaY: 20)` |
| **Glow Outer Shadow** | 16px blur, 30% alpha | `BoxShadow(color: Color(0x4D6200EE), blurRadius: 16, offset: Offset(0, 4))` |
