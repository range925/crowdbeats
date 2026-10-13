# Crowdbeats Design System - Token Specification & Flutter Implementation Guide

**Design System Name:** Obsidian & Clarity  
**Stitch Asset ID:** `assets/158be66c29654dc3a7b1bb7f1613e6ea`  
**Target Platform:** Flutter Mobile (iOS & Android, responsive 360px–430px, tablet-ready)  
**Font Family:** `GoogleFonts.dmSans()` (with `FontFeature.tabularFigures()` for all monetary & metric values)

---

## 1. Color Palette Tokens (`CbColors`)

### Dark Mode (Default / Immersive Live Music Canvas)
```dart
class CbColorsDark {
  // Surface Architecture (Obsidian Foundation)
  static const Color surface = Color(0xFF0E1116);
  static const Color surfaceDim = Color(0xFF0B0D11);
  static const Color surfaceBright = Color(0xFF21262D);
  static const Color surfaceContainerLowest = Color(0xFF080A0D);
  static const Color surfaceContainerLow = Color(0xFF12161D);
  static const Color surfaceContainer = Color(0xFF161B22); // Standard Card Background
  static const Color surfaceContainerHigh = Color(0xFF1C2128); // Elevated Rows & Controls
  static const Color surfaceContainerHighest = Color(0xFF272C35);

  // Content & Typography Contrast
  static const Color onSurface = Color(0xFFF0F6FC); // High contrast text (White)
  static const Color onSurfaceVariant = Color(0xFF8B949E); // Muted metadata & labels
  static const Color outline = Color(0xFF30363D); // Border strokes
  static const Color outlineVariant = Color(0x14FFFFFF); // 8% White Hairline dividers

  // Restrained Electric Purple Brand Accent (Actions & Selections Only)
  static const Color primary = Color(0xFF8B5CF6); // Main dominant CTA
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFF6D28D9);
  static const Color onPrimaryContainer = Color(0xFFEDE9FE);
  static const Color primaryHover = Color(0xFF7C3AED);
  static const Color primaryActive = Color(0xFF6D28D9);

  // Semantic Status Colors
  static const Color success = Color(0xFF10B981); // Emerald Live indicators & valid splits
  static const Color onSuccess = Color(0xFFFFFFFF);
  static const Color successContainer = Color(0x2610B981); // 15% opacity container
  
  static const Color error = Color(0xFFEF4444); // Red Destructive / Error
  static const Color onError = Color(0xFFFFFFFF);
  static const Color errorContainer = Color(0x26EF4444);

  static const Color warning = Color(0xFFF59E0B); // Amber / Warning
  static const Color onWarning = Color(0xFF000000);

  static const Color secondary = Color(0xFF00D8C4); // Cyan / Stage telemetry
  static const Color onSecondary = Color(0xFF00201C);
}
```

### Light Mode (Crisp Daytime / Accessible High-Contrast Alternative)
```dart
class CbColorsLight {
  // Surface Architecture
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceDim = Color(0xFFF6F8FA);
  static const Color surfaceBright = Color(0xFFFFFFFF);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFF6F8FA);
  static const Color surfaceContainer = Color(0xFFF0F3F6); // Card Background
  static const Color surfaceContainerHigh = Color(0xFFEAEEF2); // Elevated Rows
  static const Color surfaceContainerHighest = Color(0xFFE1E4E8);

  // Content & Typography Contrast
  static const Color onSurface = Color(0xFF1F2328); // High contrast dark text
  static const Color onSurfaceVariant = Color(0xFF57606A); // Subtext
  static const Color outline = Color(0xFFD0D7DE);
  static const Color outlineVariant = Color(0x1A000000); // Hairline dividers

  // Restrained Brand Accent
  static const Color primary = Color(0xFF7C3AED); // Deepened electric purple for contrast
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFFEDE9FE);
  static const Color onPrimaryContainer = Color(0xFF5B21B6);

  // Semantic Status
  static const Color success = Color(0xFF059669);
  static const Color error = Color(0xFFDC2626);
  static const Color warning = Color(0xFFD97706);
  static const Color secondary = Color(0xFF009688);
}
```

---

## 2. Typography Tokens (`CbTypography`)

Font Family: **DM Sans** (via `google_fonts` package).

| Token Name | Font Size | Font Weight | Line Height | Letter Spacing | Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `numericStat` | 32.0 px | Bold (700) | 38.0 px | -0.02 em | Large tip figures, gross amounts, stage counters (Must use `FontFeature.tabularFigures()`). |
| `displayLg` | 28.0 px | Bold (700) | 36.0 px | -0.02 em | Hero titles, confirmation headers. |
| `headlineLg` | 24.0 px | Bold (700) | 32.0 px | -0.015 em | Major screen headings (`Live Music Nearby`). |
| `headlineMd` | 20.0 px | Semi-Bold (600) | 28.0 px | -0.01 em | Section headings, modal card titles. |
| `headlineSm` | 18.0 px | Semi-Bold (600) | 24.0 px | -0.005 em | App bar titles, performer stage names. |
| `bodyLg` | 16.0 px | Regular (400) | 24.0 px | normal | Primary body paragraphs, announcement text. |
| `bodyMd` | 14.0 px | Regular (400) | 20.0 px | normal | List row subtitles, venue labels, form helper text. |
| `bodySm` | 12.0 px | Regular (400) | 16.0 px | normal | Microcopy, timestamps, legal disclaimer notes. |
| `labelLg` | 16.0 px | Semi-Bold (600) | 20.0 px | normal | Primary button labels (52px CTAs). |
| `labelMd` | 14.0 px | Semi-Bold (600) | 18.0 px | normal | Secondary buttons, filter chips, pill actions. |
| `labelSm` | 12.0 px | Semi-Bold (600) | 16.0 px | normal | Status tags, table headers (`PERFORMANCE & AUDIENCE`). |

---

## 3. Spacing & Rhythm Tokens (`CbSpacing`)

Crowdbeats adheres to an **8px base rhythm** with 4px micro-increments.

```dart
class CbSpacing {
  static const double space2xs = 2.0;
  static const double spaceXs = 4.0;
  static const double spaceSm = 8.0;
  static const double spaceMd = 16.0;  // Standard screen margin & card padding
  static const double spaceLg = 24.0;
  static const double spaceXl = 32.0;
  static const double space2xl = 48.0;

  // Viewport Grid Constants
  static const double margin = 16.0;   // Outer screen horizontal padding
  static const double gutter = 16.0;   // Grid gutter between cards
}
```

---

## 4. Corner Radius Tokens (`CbRadii`)

```dart
class CbRadii {
  static const double xs = 4.0;        // Checkbox, micro tag
  static const double sm = 8.0;        // Small icon box, chip
  static const double md = 12.0;       // Grouped card containers, text fields, CTAs
  static const double lg = 16.0;       // Large modals, bottom sheets
  static const double xl = 24.0;       // Floating hero banners
  static const double full = 999.0;    // Avatars, pills, switches, round buttons
}
```

---

## 5. Master Component Architecture (Uber/Lyft Reference Model)

### A. The Grouped Card Container (`CbGroupedCard`)
- **Visual Spec:** Solid `#161B22` background, 12px border radius (`CbRadii.md`), 1px subtle hairline stroke (`CbColors.outlineVariant` = `rgba(255, 255, 255, 0.08)`).
- **Internal Spacing:** Zero outer margin inside lists; rows separated by 1px hairline dividers with 16px left inset.
- **Elevation:** Flat with tonal layering (no muddy drop shadows).

### B. Grouped Settings & Action Row (`CbGroupedRow`)
- **Min Height:** 52.0 px (exceeds WCAG 48px touch target).
- **Structure:**
  - **Leading Icon Box:** 36x36px or 40x40px container in `#1C2128` with 8px radius, holding a 20px labeled icon.
  - **Text Column:** Title in `bodyLg` / `labelMd` (White `#F0F6FC`), Subtitle in `bodyMd` / `bodySm` (`#8B949E`).
  - **Trailing Action:** Chevron right (`#8B949E`), toggle switch, editable pill (`40.0%`), or status badge (`Connected`).

### C. Dominant Call-to-Action Button (`CbPrimaryButton`)
- **Height:** 52.0 px (Mobile thumb-reachable).
- **Fill:** Solid Electric Purple (`#8B5CF6`).
- **Radius:** 12.0 px (`CbRadii.md`).
- **Typography:** `labelLg` (16px Semi-Bold, White).
- **Rule:** Exactly **one** dominant CTA per viewport screen. Secondary actions are outlined or subtle text links.

### D. Performer Live Status Badge (`CbLiveBadge`)
- **Fill:** 15% opacity emerald container (`#10B981` at 0.15).
- **Border:** 1px stroke `#10B981` at 0.30.
- **Pulsing Dot:** 8px emerald circle with subtle animation.
- **Label:** `LIVE` or `LIVE SET 2` in 11px uppercase bold.

### E. Fee Transparency & Split Breakdown Card (`CbFeeSummaryCard`)
- **Design Rule:** Clearly displays Tip Amount + 6% Platform Fee + Payment Processing allocation.
- **Total Calculation:** Bold tabular stat, no surprise fees, clear payer vs. absorbed breakdown before confirmation.

---

## 6. Multi-Platform & Responsive Adaptation Rules

1. **Compact Mobile (360px width, e.g., Android Compact / iPhone SE):**
   - Horizontal margins reduce from 16px to 12px.
   - Quick tip amount pill grid wraps to 2x2.
   - Metric cards scale text from 32px to 26px to prevent RenderFlex overflow.
2. **Standard Mobile (390px - 430px width, e.g., iPhone 15/16, Pixel 8/9):**
   - Standard 16px margins, 12px card radii.
   - Full 4-tab FanShell and 5-tab CreatorShell bottom bar layout.
3. **Large / Tablet Form Factors (> 600px width):**
   - Content container constrained to max 540px centered column on phones/tablets for settings and tipping flows.
   - Discovery map and live stage grid switches to dual-pane (interactive map on left, live stage list on right).
4. **Accessibility & Dynamic Text Scaling (A11y):**
   - All rows allow vertical expansion without fixed height constraints (`minHeight: 52px`, no hard-coded `height: 52px` when text scales up to 2.0x).
   - High contrast ratios: Contrast ratio exceeds **7.2:1** for body text on dark surfaces, exceeding WCAG AAA.
