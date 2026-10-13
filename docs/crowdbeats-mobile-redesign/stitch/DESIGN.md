---
name: Crowdbeats Obsidian & Clarity Design System
colors:
  # Dark Surface Architecture (Obsidian Foundation)
  surface: '#0E1116'
  surface-dim: '#0B0D11'
  surface-bright: '#21262D'
  surface-container-lowest: '#080A0D'
  surface-container-low: '#12161D'
  surface-container: '#161B22'
  surface-container-high: '#1C2128'
  surface-container-highest: '#272C35'
  
  # Content & Text (High Contrast Dark)
  on-surface: '#F0F6FC'
  on-surface-variant: '#8B949E'
  outline: '#30363D'
  outline-variant: 'rgba(255, 255, 255, 0.08)'
  
  # Restrained Purple Brand Accent (Actions & Selections Only)
  primary: '#8B5CF6'
  on-primary: '#FFFFFF'
  primary-container: '#6D28D9'
  on-primary-container: '#EDE9FE'
  primary-hover: '#7C3AED'
  primary-active: '#6D28D9'
  
  # Semantic Accents (Restrained)
  secondary: '#00D8C4'
  on-secondary: '#00201C'
  secondary-container: '#005950'
  on-secondary-container: '#4FFBE6'
  
  # Status Colors
  success: '#10B981'
  on-success: '#FFFFFF'
  error: '#EF4444'
  on-error: '#FFFFFF'
  warning: '#F59E0B'
  on-warning: '#000000'
  
  # Light Mode Equivalents (Semantic Mapping)
  light-surface: '#FFFFFF'
  light-surface-container: '#F6F8FA'
  light-surface-container-high: '#EAEEF2'
  light-on-surface: '#1F2328'
  light-on-surface-variant: '#656D76'
  light-outline: '#D0D7DE'
  light-primary: '#7C3AED'
typography:
  display-lg:
    fontFamily: DM Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: DM Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: DM Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  numeric-stat:
    fontFamily: DM Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  gutter: 16px
  margin: 16px
  space-2xs: 2px
  space-xs: 4px
  space-sm: 8px
  space-md: 16px
  space-lg: 24px
  space-xl: 32px
  space-2xl: 48px
---

# Crowdbeats Design System Specification (Mobile Redesign V2)

## 1. Visual Philosophy & Atmosphere
* **Mood:** Deep live music backstage ambiance meets the structural clarity and legibility of high-utility consumer apps (Uber/Lyft).
* **Core Rule:** Single purpose per screen; exactly one dominant next action; calm surfaces behind text and data; vibrant expressive photography strictly for performer identity.
* **Banned AI Patterns:**
  - No purple neon glows or ambient drop shadows around buttons.
  - No decorative gradients across settings, authentication, or financial screens.
  - No tiny labels (< 12px font size).
  - No floating card clutter on top of busy photography.
  - No raw credit card number text fields.
  - No fake claims of "Instant Payouts".

---

## 2. Color Calibration & Contrast Ratios

### 2.1 Dark Mode Surfaces (Primary Atmosphere)
* **Root Canvas (`#0E1116`):** Low-noise obsidian canvas preventing OLED battery drain and visual fatigue.
* **Surface Containers (`#161B22`):** Primary grouped card containers, lists, and bottom sheets.
* **Elevated Controls (`#1C2128`):** Unfocused input fields, chip buttons, and table rows.
* **Separators & Dividers:** `1px solid rgba(255, 255, 255, 0.08)` hairline dividers separating grouped list items.

### 2.2 Light Mode Surfaces (Clean Contrast)
* **Root Canvas (`#FFFFFF`):** Crisp neutral white surface.
* **Grouped Cards (`#F6F8FA`):** Neutral gray-50 containers for settings and list items.
* **Dividers:** `1px solid #D0D7DE` (subtle border conforming to WCAG AA).

### 2.3 Restrained Brand Accent
* **Electric Purple (`#8B5CF6` / `#7C3AED`):** Reserved exclusively for:
  1. Primary CTA buttons (e.g. "Send Tip", "Start Live Session", "Confirm & Pay").
  2. Active tab icons and selected pill chips.
  3. Form focus rings and verified performer badges.
* **No decorative purple fills:** Settings rows, utility cards, and background walls remain neutral.

---

## 3. Typographical Hierarchy & Ergonomics

* **Primary Font Family:** **DM Sans** (bundled and supported via `google_fonts: 6.3.3`).
* **Numeric Tabular Figures:** All financial figures, timers, and follower counts enforce `font-feature-settings: "tnum" on` for vertical number alignment.
* **Text Scaling Support:**
  - Base body text: 16 logical px.
  - Minimum readable text: 12 logical px (secondary metadata).
  - Compatible with OS text scaling (1.0x to 2.0x) without clipping or horizontal overflow.

---

## 4. Reusable Component Specifications

### 4.1 Navigation & App Bars
* **Height:** 56 logical px.
* **Leading:** Back chevron (min 48px touch target) or Profile Avatar.
* **Title:** 20px bold centered or left-aligned with contextual subtitle.
* **Trailing:** Context-specific action (e.g. QR Scanner icon on Discover, unread Messages icon on Following).
* **Bottom Tab Bar:** 4 or 5 labeled tabs (min 48px touch box per destination), with clear text label below icon; active tab highlighted in Electric Purple; inactive tabs in `#8B949E`.

### 4.2 Grouped Settings Rows (Lyft/Uber Model)
* **Container:** Inset grouped card (`#161B22` dark / `#F6F8FA` light) with 12px corner radius.
* **Row Structure:**
  - Min 48px height.
  - Leading: Labeled 20px icon in neutral container.
  - Center: Primary label (16px semi-bold) + optional subtitle (14px secondary).
  - Trailing: Subtle chevron, status badge ("Verified"), or iOS-style toggle switch.
  - Dividers: Inset 1px divider starting after leading icon, disappearing on the last row.

### 4.3 Performer Cards & Map Markers
* **Performer Card:** 12px radius card featuring an aspect-ratio-locked (16:9 or 1:1) photo of the artist, calm dark gradient scrim at the bottom, stage name (18px bold), active stage badge ("Live @ Saxon Pub"), and distance indicator ("0.4 mi").
* **Live Map Marker:** Crisp circular pin with performer avatar thumbnail, pulsing green live ring, and venue name pill label.

### 4.4 Form Inputs & Selection Controls
* **Height:** Exactly 48 logical px.
* **Background:** Inset `#12161D` dark with 1px border `rgba(255, 255, 255, 0.12)`.
* **Focus State:** 2px border in `#8B5CF6`, zero glow.
* **Amount Presets:** High-contrast pill chips (`$2`, `$5`, `$10`, `$20`) with 48px min touch target.

### 4.5 Modals & Bottom Sheets
* **Header:** Centered 36x4px pill drag handle with 8px top margin.
* **Corner Radius:** 24px top radius (`rounded-xl`).
* **Overlay Backdrop:** `rgba(0, 0, 0, 0.70)` dimming background.

---

## 5. Responsive & Device Adaptations

* **360px Compact Phones (e.g. Android Go / small iPhone):**
  - Horizontal margin reduced to 12px.
  - Multi-column grids collapse to single-column vertical stacks.
  - Touch targets strictly maintained at minimum 48x48 logical px.
* **390px / 430px Standard Phones (iPhone 14/15/16, Pixel 8/9):**
  - Standard 16px gutter.
  - Comfortable thumb zone reachability for primary CTAs pinned to bottom sheet.
* **Tablet / Foldable Adaptation:**
  - Maximum content constraint width of 640px for single-column flows (Auth, Tipping, Settings).
  - 2-column layout for Discover (Map on left, scrollable list on right).
