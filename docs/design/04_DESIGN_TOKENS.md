# 04 — Design Tokens
**Phase:** 4 — Design Foundation
**Source of truth:** [`packages/design-tokens/src/tokens.ts`](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/packages/design-tokens/src/tokens.ts)
**CSS custom properties:** [`packages/design-tokens/src/tokens.css`](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/packages/design-tokens/src/tokens.css)

---

## 1. Brand Anchors

| Brand Name | Hex | Usage | AA on dark bg? |
|---|---|---|---|
| Crowdbeats Coral Pink | `#FF97BA` | Primary accent, buttons, focus ring | ✅ 5.2:1 |
| Electric Violet | `#8B5CF6` | Secondary accent — **large UI only** | ❌ 2.5:1 (use `#A78BFA` for text) |
| Crowdbeats Black | `#131315` | Primary background | — |

> **Key constraint:** `#8B5CF6` (violet-500) fails WCAG AA for normal text on the dark background. All text uses `#A78BFA` (violet-400, 4.8:1 ✅) or white. Raw violet-500 is reserved for large icons, badges, and UI elements ≥ 24px.

---

## 2. Color Tokens

### Primitive Scales

```
pink:   50→900   (brand anchor at pink-400 #FF97BA)
violet: 50→900   (brand anchor at violet-500 #8B5CF6)
gray:   0→950    (brand anchor at gray-950 #131315)
status: green400, amber400, red400, blue400
```

### Semantic Tokens (what components use)

| CSS Variable | Value | Contrast on gray-950 | AA? |
|---|---|---|---|
| `--surface-base` | `#131315` | — | — |
| `--surface-raised` | `#1C1C1F` | — | — |
| `--surface-card` | `#27272A` | — | — |
| `--text-primary` | `#F4F4F5` | 17.8:1 | ✅ AAA |
| `--text-secondary` | `#A1A1AA` | 5.4:1 | ✅ AA |
| `--text-tertiary` | `#71717A` | 3.2:1 | ⚠️ Large text only |
| `--accent-primary` | `#FF97BA` | 5.2:1 | ✅ AA |
| `--accent-secondary` | `#A78BFA` | 4.8:1 | ✅ AA |
| `--accent-secondary-large` | `#8B5CF6` | 2.5:1 | ❌ Large UI only |
| `--status-success` | `#4ADE80` | 8.4:1 | ✅ AAA |
| `--status-warning` | `#FBBF24` | 10.4:1 | ✅ AAA |
| `--status-error` | `#F87171` | 5.1:1 | ✅ AA |
| `--status-info` | `#60A5FA` | 6.5:1 | ✅ AA |
| `--border-focus` | `#FF97BA` | — | Focus ring |
| `--live-text` | `#FFB0CE` | ~8:1 on live-surface | ✅ AA |

### Live Stage Mode

| Token | Value | Purpose |
|---|---|---|
| `--live-surface` | `#1E1318` | Card bg during live stage |
| `--live-text` | `#FFB0CE` | Readable text on live surface |
| `--live-glow` | `rgba(255,151,186,0.20)` | Decorative glow — not for contrast |
| `--live-pulse` | `#FF97BA` | Dot indicator color |

### Data Visualization

| Token | Value | Series |
|---|---|---|
| `--dataviz-1` | `#FF97BA` | Primary |
| `--dataviz-2` | `#A78BFA` | Secondary |
| `--dataviz-3` | `#60A5FA` | Tertiary |
| `--dataviz-4` | `#4ADE80` | Quaternary |
| `--dataviz-5` | `#FBBF24` | Quinary |

---

## 3. Typography

**Font family:** DM Sans (Google Fonts) — loaded via `next/font/google` on web, `google_fonts` package on Flutter.

| Token | Size | Line Height | Letter Spacing | Weight |
|---|---|---|---|---|
| `text-5xl` | 48px | 1.1 | -0.03em | 700 |
| `text-4xl` | 36px | 1.1 | -0.02em | 700 |
| `text-3xl` | 30px | 1.2 | -0.02em | 700 |
| `text-2xl` | 24px | 1.25 | -0.01em | 600 |
| `text-xl` | 20px | 1.3 | -0.01em | 600 |
| `text-lg` | 18px | 1.5 | 0 | 400 |
| `text-md` | 16px | 1.5 | 0 | 400 |
| `text-sm` | 14px | 1.5 | +0.01em | 400 |
| `text-xs` | 12px | 1.5 | +0.02em | 400 |
| `text-2xs` | 11px | 1.4 | +0.03em | 400 |

Minimum text size in product: **11px** (badge labels). WCAG criterion 1.4.4 (resize text) enforced via relative units (`em`, `rem`).

---

## 4. Spacing (4-point grid)

```
s0=0  s0.5=2  s1=4  s1.5=6  s2=8  s2.5=10  s3=12  s3.5=14
s4=16  s5=20  s6=24  s7=28  s8=32  s10=40  s12=48  s14=56
s16=64  s20=80  s24=96  s32=128
```

---

## 5. Border Radius

| Token | Value | Typical Use |
|---|---|---|
| `radius-xs` | 4px | Inputs, small badges |
| `radius-sm` | 8px | Buttons, cards |
| `radius-md` | 12px | Sheets, modals, main cards |
| `radius-lg` | 16px | Large feature cards |
| `radius-xl` | 24px | Bottom sheets |
| `radius-2xl` | 32px | Hero cards |
| `radius-full` | 9999px | Avatars, pills, chips |

---

## 6. Elevation / Shadow

| Token | Value | Use |
|---|---|---|
| `shadow-xs` | 1px blur, 40% black | Subtle lift |
| `shadow-sm` | 4px blur, 50% black | Cards |
| `shadow-md` | 12px blur, 50% black | Modals |
| `shadow-lg` | 24px blur, 60% black | Toasts |
| `shadow-xl` | 40px blur, 70% black | Overlays |
| `shadow-pink-glow` | 24px pink 30% | Live stage — decorative only |
| `shadow-focus` | 3px pink 60% | Focus ring fallback |

---

## 7. Motion

| Token | Duration | Use |
|---|---|---|
| `duration-instant` | 0ms | Immediate state changes |
| `duration-fast` | 100ms | Button hover, badge transitions |
| `duration-normal` | 200ms | Standard UI transitions |
| `duration-slow` | 350ms | Modal/sheet entry |
| `duration-xslow` | 500ms | Cross-screen transitions |

| Token | Easing | Use |
|---|---|---|
| `ease-out` | `cubic-bezier(0,0,0.2,1)` | Screen entry / decelerate |
| `ease-in` | `cubic-bezier(0.4,0,1,1)` | Screen exit / accelerate |
| `ease-in-out` | `cubic-bezier(0.4,0,0.2,1)` | Component transitions |
| `ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | Bottom sheets (slight overshoot) |

All durations collapse to `0ms` when `prefers-reduced-motion: reduce` is set.

---

## 8. Breakpoints & Grid

| Breakpoint | Min Width | Columns | Gutter | Margin |
|---|---|---|---|---|
| Phone | — (default) | 4 | 16px | 16px |
| Tablet | 768px | 8 | 24px | 24px |
| Laptop | 1024px | 12 | 24px | 32px |
| Desktop | 1280px | 12 | 32px | 48px |
| Wide | 1536px | 12 | 32px | auto |

Max content width: **1440px**.

---

## 9. Touch & Click Targets

| Context | Minimum | Preferred |
|---|---|---|
| Native (Flutter) | 48×48 dp | 56×56 dp |
| Web (CSS) | 44×44 px (WCAG 2.5.8) | 56×56 px |

---

## 10. Focus

```
ring-width:  3px
ring-offset: 2px
ring-color:  #FF97BA
ring-style:  solid
```

Applied via `:focus-visible` globally in CSS (not `:focus`). All interactive elements show the pink focus ring when keyboard-navigated.

---

## 11. Z-Index Scale

```
base=0  raised=10  dropdown=100  sticky=200
overlay=300  modal=400  toast=500  tooltip=600
```

---

## 12. Flutter Implementation

- `CbColors` → [`apps/mobile/lib/ui/theme/cb_colors.dart`](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/ui/theme/cb_colors.dart)
- `CbSpacing`, `CbMotion` → [`apps/mobile/lib/ui/theme/cb_spacing.dart`](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/ui/theme/cb_spacing.dart)
- `CbTheme.dark()`, `CbThemeExtension` → [`apps/mobile/lib/ui/theme/cb_theme.dart`](file:///c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/mobile/lib/ui/theme/cb_theme.dart)
