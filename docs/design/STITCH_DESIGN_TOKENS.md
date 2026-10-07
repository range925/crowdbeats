# Authoritative Design Tokens — Crowdbeats V2

**Source Project:** Google Stitch `5326179813018056505`  
**Target Environments:** Flutter (`apps/mobile`), React / Tailwind CSS (`apps/web`), Shared Tokens (`packages/contracts`)

---

## 1. Color Palette Tokens

### 1.1 Dark Theme Background & Surface Layers
| Token Name | Hex Code | Flutter Constant | CSS Variable | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `bg-app` | `#0B0C10` | `Color(0xFF0B0C10)` | `--cb-bg-app` | App background, root scaffold |
| `surface-1` | `#151722` | `Color(0xFF151722)` | `--cb-surface-1` | Standard card containers, list tiles |
| `surface-2` | `#1E2032` | `Color(0xFF1E2032)` | `--cb-surface-2` | Elevated cards, input fields, unselected chips |
| `surface-3` | `#282A42` | `Color(0xFF282A42)` | `--cb-surface-3` | Hovered cards, active sheet headers |
| `border-subtle` | `#2B2D44` | `Color(0xFF2B2D44)` | `--cb-border-subtle` | Standard card and container borders |
| `border-focus` | `#7C3AED` | `Color(0xFF7C3AED)` | `--cb-border-focus` | Active card borders, input focus states |
| `glass-bg` | `rgba(22, 24, 36, 0.75)` | `Color(0xBF161824)` | `--cb-glass-bg` | Glassmorphic overlays, sticky headers |
| `glass-border` | `rgba(255, 255, 255, 0.08)` | `Color(0x14FFFFFF)` | `--cb-glass-border`| Top highlight on frosted cards |

### 1.2 Brand Accents (Vibrant Electric Violet)
| Token Name | Hex Code | Flutter Constant | CSS Variable | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `brand-purple-light` | `#A855F7` | `Color(0xFFA855F7)` | `--cb-purple-light` | Gradient highlights, glowing text |
| `brand-purple-main` | `#7C3AED` | `Color(0xFF7C3AED)` | `--cb-purple-main` | Primary CTA buttons, active step badges |
| `brand-purple-dark` | `#6D28D9` | `Color(0xFF6D28D9)` | `--cb-purple-dark` | Button press states, gradient ends |
| `brand-purple-dim` | `rgba(124, 58, 237, 0.15)` | `Color(0x267C3AED)` | `--cb-purple-dim` | Chip backgrounds, subtle active states |
| `brand-glow` | `rgba(124, 58, 237, 0.45)` | `Color(0x737C3AED)` | `--cb-purple-glow`| Glowing box shadows on CTAs & pins |

### 1.3 Semantic & Functional Status Colors
| Token Name | Hex Code | Flutter Constant | CSS Variable | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `live-green` | `#10B981` | `Color(0xFF10B981)` | `--cb-live-green` | `LIVE` badges, tip amounts ($10), available checks |
| `reticle-green` | `#00FF66` | `Color(0xFF00FF66)` | `--cb-reticle-green`| AR camera performer detection box |
| `heart-orange` | `#FB923C` | `Color(0xFFFB923C)` | `--cb-heart-orange` | Following tab icon, warmth accents |
| `heart-pink` | `#EC4899` | `Color(0xFFEC4899)` | `--cb-heart-pink` | Tip celebration hearts, social highlights |
| `verified-blue` | `#6366F1` | `Color(0xFF6366F1)` | `--cb-verified-blue`| Verified creator checkmark badge |
| `gps-blue` | `#3B82F6` | `Color(0xFF3B82F6)` | `--cb-gps-blue` | Map user location beacon & sonar circle |
| `error-red` | `#EF4444` | `Color(0xFFEF4444)` | `--cb-error-red` | Validation errors, strike alerts |

### 1.4 Typography Hierarchy Colors
| Token Name | Hex Code | Flutter Constant | CSS Variable | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-primary` | `#FFFFFF` | `Color(0xFFFFFFFF)` | `--cb-text-primary` | Main titles, performer names, button labels |
| `text-secondary` | `#94A3B8` | `Color(0xFF94A3B8)` | `--cb-text-secondary`| Subtitles, genre lists, distance text |
| `text-muted` | `#64748B` | `Color(0xFF64748B)` | `--cb-text-muted` | Placeholder hints, character counters, footnotes |

---

## 2. Typography Scale

Font Family: `Inter`, `SF Pro Display`, `-apple-system`, `system-ui`, `sans-serif`.

| Style Name | Font Size | Line Height | Weight | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | 28px (1.75rem) | 36px (1.3) | Bold (700) | -0.02em | Onboarding hero headlines ("Create your Fan profile") |
| `display-md` | 24px (1.5rem) | 32px (1.33) | Bold (700) | -0.015em | Screen titles ("Good evening, Jordan 👋") |
| `heading-lg` | 20px (1.25rem) | 28px (1.4) | SemiBold (600) | -0.01em | Section titles ("Live Near You", "About You") |
| `heading-md` | 18px (1.125rem) | 24px (1.33) | SemiBold (600) | 0.0em | Card headers, modal titles ("How much would you like to tip?") |
| `body-lg` | 16px (1.0rem) | 24px (1.5) | Regular (400) / Med (500) | 0.0em | Input field text, primary descriptions |
| `body-md` | 14px (0.875rem) | 20px (1.43) | Regular (400) | 0.0em | List item subtitles, metadata descriptions |
| `caption-sm` | 12px (0.75rem) | 16px (1.33) | Medium (500) | +0.01em | Bottom navigation labels, distance tags |
| `badge-xs` | 11px (0.6875rem) | 14px (1.27) | Bold (700) | +0.06em | `LIVE`, `PERFORMER DETECTED`, Step counters |

---

## 3. Spacing & Grid System (4px Base Unit)

| Spacing Token | Pixels | CSS Variable | Flutter Equivalent | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `space-1` | 4px | `--cb-space-1` | `4.0` | Internal badge padding, tight icon gaps |
| `space-2` | 8px | `--cb-space-2` | `8.0` | Gap between text and subtext, chip gap |
| `space-3` | 12px | `--cb-space-3` | `12.0` | Card internal element padding |
| `space-4` | 16px | `--cb-space-4` | `16.0` | Standard screen margin, card padding |
| `space-5` | 20px | `--cb-space-5` | `20.0` | Section spacing, modal margins |
| `space-6` | 24px | `--cb-space-6` | `24.0` | Large section separators |
| `space-8` | 32px | `--cb-space-8` | `32.0` | Screen top hero spacing |
| `space-12` | 48px | `--cb-space-12` | `48.0` | Top/bottom clearance for floating navigation |

---

## 4. Radii & Surface Shapes

| Radius Token | Value | Flutter | CSS | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `radius-sm` | 8px | `BorderRadius.circular(8)` | `rounded-lg` | Small tag badges (`LIVE`) |
| `radius-md` | 12px | `BorderRadius.circular(12)` | `rounded-xl` | Selection chips, input text fields |
| `radius-lg` | 16px | `BorderRadius.circular(16)` | `rounded-2xl` | Standard cards, quick action tiles |
| `radius-xl` | 20px | `BorderRadius.circular(20)` | `rounded-3xl` | Bottom sheet drawers, spotlight cards |
| `radius-full`| 9999px | `BorderRadius.circular(999)`| `rounded-full`| Primary CTA pill buttons, avatars, radio dots |

---

## 5. Elevation, Shadows & Glow Effects

```css
/* Card Container Shadow */
--cb-shadow-card: 0 4px 20px -2px rgba(0, 0, 0, 0.5);

/* Primary CTA Violet Glow */
--cb-glow-cta: 0 8px 24px -4px rgba(124, 58, 237, 0.45);

/* Active Live Radar Pin Glow */
--cb-glow-live: 0 0 16px 2px rgba(16, 185, 129, 0.6);

/* Glassmorphism Backdrop Filter */
--cb-backdrop-blur: blur(16px);
```

```dart
// Flutter BoxShadow Definitions
static const BoxShadow cardShadow = BoxShadow(
  color: Color(0x80000000),
  blurRadius: 20,
  offset: Offset(0, 4),
);

static const BoxShadow ctaGlow = BoxShadow(
  color: Color(0x737C3AED),
  blurRadius: 24,
  spreadRadius: -2,
  offset: Offset(0, 8),
);

static const BoxShadow livePinGlow = BoxShadow(
  color: Color(0x9910B981),
  blurRadius: 16,
  spreadRadius: 2,
);
```
