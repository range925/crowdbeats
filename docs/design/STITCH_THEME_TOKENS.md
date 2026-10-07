# Canonical Design Token System — Crowdbeats V2

**Source:** Google Stitch Canonical Project `5326179813018056505`  
**Target Runtimes:** Flutter (`CbColors`, `CbSpacing`, `CbTypography`), Next.js Web (`tokens.css`, `components.css`), Shared Contracts (`@crowdbeats/contracts`)  

---

## 1. Color Tokens

### 1.1 Surfaces & Canvas
| Token Name | Hex Value | CSS Variable | Flutter Constant | Description |
| :--- | :--- | :--- | :--- | :--- |
| `surfacePrimary` | `#151722` | `--cb-surface-primary` | `Color(0xFF151722)` | Standard card and navigation surface |
| `surfaceSecondary`| `#1E2032` | `--cb-surface-secondary`| `Color(0xFF1E2032)` | Elevated input fields, chips, modal backdrops |
| `surfaceElevated` | `#282A42` | `--cb-surface-elevated` | `Color(0xFF282A42)` | Focused surfaces, active sheets, dialog containers |
| `surfaceCanvas` | `#0B0C10` | `--cb-surface-canvas` | `Color(0xFF0B0C10)` | Root viewport / background canvas |

### 1.2 Accents & Brand
| Token Name | Hex Value | CSS Variable | Flutter Constant | Description |
| :--- | :--- | :--- | :--- | :--- |
| `accentPrimary` | `#7C3AED` | `--cb-accent-primary` | `Color(0xFF7C3AED)` | Electric Violet primary brand CTA |
| `accentSecondary`| `#A855F7` | `--cb-accent-secondary`| `Color(0xFFA855F7)` | Lavender Violet highlight and secondary badges |
| `accentDark` | `#6D28D9` | `--cb-accent-dark` | `Color(0xFF6D28D9)` | Pressed state CTA finish |
| `accentGlow` | `rgba(124,58,237,0.45)` | `--cb-accent-glow` | `Color(0x737C3AED)` | Glow shadow on buttons and active pins |

### 1.3 Typography Colors
| Token Name | Hex Value | CSS Variable | Flutter Constant | Description |
| :--- | :--- | :--- | :--- | :--- |
| `textPrimary` | `#FFFFFF` | `--cb-text-primary` | `Color(0xFFFFFFFF)` | Main titles, creator names, primary text |
| `textSecondary` | `#94A3B8` | `--cb-text-secondary` | `Color(0xFF94A3B8)` | Subtitles, summaries, genre tags |
| `textMuted` | `#64748B` | `--cb-text-muted` | `Color(0xFF64748B)` | Meta labels, timestamps, placeholders |

### 1.4 Semantic & Status Colors
| Token Name | Hex Value | CSS Variable | Flutter Constant | Description |
| :--- | :--- | :--- | :--- | :--- |
| `live` | `#10B981` | `--cb-live` | `Color(0xFF10B981)` | Live performance badges and map rings |
| `success` | `#10B981` | `--cb-success` | `Color(0xFF10B981)` | Successful tip confirmation, verified icon |
| `warning` | `#F59E0B` | `--cb-warning` | `Color(0xFFF59E0B)` | Popular rank gold badge, pending alerts |
| `error` | `#EF4444` | `--cb-error` | `Color(0xFFEF4444)` | Form validation errors, geo-lookup failures |
| `verified` | `#38BDF8` | `--cb-verified` | `Color(0xFF38BDF8)` | Verified creator checkmark badge |

---

## 2. Typography Tokens

| Token Name | Font Size | Line Height | Weight | Flutter Equivalent | CSS / Tailwind Class |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `displayLarge` | 32px | 38px | 800 (Bold) | `TextStyle(fontSize: 32, fontWeight: FontWeight.w800)` | `text-3xl font-extrabold` |
| `displayMedium`| 24px | 30px | 700 (Bold) | `TextStyle(fontSize: 24, fontWeight: FontWeight.w700)` | `text-2xl font-bold` |
| `headlineLarge`| 20px | 26px | 700 (Bold) | `TextStyle(fontSize: 20, fontWeight: FontWeight.w700)` | `text-xl font-bold` |
| `headlineMedium`| 18px | 24px | 600 (SemiBold)| `TextStyle(fontSize: 18, fontWeight: FontWeight.w600)` | `text-lg font-semibold` |
| `titleLarge` | 16px | 22px | 700 (Bold) | `TextStyle(fontSize: 16, fontWeight: FontWeight.w700)` | `text-base font-bold` |
| `titleMedium` | 15px | 20px | 600 (SemiBold)| `TextStyle(fontSize: 15, fontWeight: FontWeight.w600)` | `text-sm font-semibold` |
| `bodyLarge` | 14px | 20px | 500 (Medium) | `TextStyle(fontSize: 14, fontWeight: FontWeight.w500)` | `text-sm font-medium` |
| `bodyMedium` | 13px | 18px | 400 (Regular)| `TextStyle(fontSize: 13, fontWeight: FontWeight.w400)` | `text-xs font-normal` |
| `caption` | 11px | 14px | 500 (Medium) | `TextStyle(fontSize: 11, fontWeight: FontWeight.w500)` | `text-[11px] font-medium` |

---

## 3. Spacing Tokens (4px Base Grid)

| Token Name | Pixels | CSS Variable | Flutter Constant | Common Application |
| :--- | :--- | :--- | :--- | :--- |
| `space2` | 2px | `--cb-space-2` | `2.0` | Micro gap, indicator border offset |
| `space4` | 4px | `--cb-space-4` | `4.0` | Tag inner padding, tight horizontal gaps |
| `space8` | 8px | `--cb-space-8` | `8.0` | Gap between text elements, chip margins |
| `space12` | 12px | `--cb-space-12` | `12.0` | Card internal horizontal padding |
| `space16` | 16px | `--cb-space-16` | `16.0` | Screen horizontal gutters, card vertical padding |
| `space20` | 20px | `--cb-space-20` | `20.0` | Section spacing, card margins |
| `space24` | 24px | `--cb-space-24` | `24.0` | Section header separation |
| `space32` | 32px | `--cb-space-32` | `32.0` | Hero container top clearance |
| `space40` | 40px | `--cb-space-40` | `40.0` | Major view boundaries |
| `space48` | 48px | `--cb-space-48` | `48.0` | Bottom navigation clearance |

---

## 4. Radius Tokens

| Token Name | Value | Flutter Constant | CSS Variable | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `radiusSmall` | 6px | `BorderRadius.circular(6)` | `--cb-radius-sm` (6px) | `LIVE` badges, status chips |
| `radiusMedium`| 10px | `BorderRadius.circular(10)` | `--cb-radius-md` (10px) | Small action buttons, quote boxes |
| `radiusLarge` | 16px | `BorderRadius.circular(16)` | `--cb-radius-lg` (16px) | Cards, Location Search input |
| `radiusXL` | 20px | `BorderRadius.circular(20)` | `--cb-radius-xl` (20px) | Map container, Bottom sheet drawers |
| `radiusPill` | 9999px | `BorderRadius.circular(9999)`| `--cb-radius-pill` (9999px) | CTA Tip button, avatar circles |

---

## 5. Elevation & Shadow Tokens

| Token Name | CSS Value | Flutter BoxShadow | Usage |
| :--- | :--- | :--- | :--- |
| `elevationLow` | `0 2px 8px rgba(0,0,0,0.25)` | `BoxShadow(color: Color(0x40000000), blurRadius: 8, offset: Offset(0, 2))` | Compact cards, chips |
| `elevationMedium` | `0 4px 20px -2px rgba(0,0,0,0.45)` | `BoxShadow(color: Color(0x73000000), blurRadius: 20, offset: Offset(0, 4))` | Performer cards, Search bar |
| `elevationHigh` | `0 8px 32px rgba(0,0,0,0.60)` | `BoxShadow(color: Color(0x99000000), blurRadius: 32, offset: Offset(0, 8))` | Modal sheets, Map expand bar |
