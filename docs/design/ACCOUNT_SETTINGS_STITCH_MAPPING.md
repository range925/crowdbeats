# Crowdbeats V2 — Account Settings Stitch Design Mapping

**Authoritative Source:** Google Stitch Project `5326179813018056505` ("Vivid Resonance")  
**Design Tokens Extracted:** August 29, 2026  

---

## 1. Design Token Mapping

| Stitch Token | Visual Role | Flutter Token (`CbColors` / `CbTheme`) | Web CSS Variable | Hex / RGBA Value |
| :--- | :--- | :--- | :--- | :--- |
| `background` / `surface` | Root canvas | `CbColors.bgApp` | `var(--surface-base)` | `#0B0C10` / `#131313` |
| `surface-container-low` | Section & Card Fill | `CbColors.surface1` | `var(--surface-card)` | `#151722` / `#171C21` |
| `surface-container-high`| Elevated rows, inputs, chips | `CbColors.surface2` | `var(--surface-raised)` | `#1E2032` / `#252A30` |
| `outline` / `outline-variant` | Dividers & Borders | `CbColors.borderSubtle` | `var(--border-default)` | `#2B2D44` / `#3E484F` |
| `primary` / `primary-container`| Vibrant Violet Accent | `CbColors.purpleMain` | `var(--accent-primary)` | `#7C3AED` / `#6200EE` |
| `secondary` | Electric Magenta Highlight | `CbColors.purpleLight` | `var(--accent-secondary)` | `#A855F7` / `#BB86FC` |
| `tertiary` | Teal Gas / Verified Status | `CbColors.liveGreen` | `var(--status-success)` | `#10B981` / `#03DAC6` |
| `on-surface` | Primary Typography | `CbColors.textPrimary` | `var(--text-primary)` | `#FFFFFF` / `#E5E2E1` |
| `on-surface-variant` | Subtitles & Metadata | `CbColors.textSecondary`| `var(--text-secondary)`| `#94A3B8` / `#CBC3D9` |
| `error` | Warning & Danger Zone | `CbColors.errorRed` | `var(--status-error)` | `#EF4444` / `#FFB4AB` |

---

## 2. Component Layout & Visual Specifications

### 2.1 Profile Header
```
+-------------------------------------------------------------------+
|  ( Avatar )   David Naufahu  [ Verified Check ]                  |
|    [ 64px ]   Solo Musician  •  Member since Feb 2024             |
|               [ Switch Persona v ]   [ View Profile > ]          |
+-------------------------------------------------------------------+
```
- **Avatar:** 64×64 circular container with subtle 1.5px violet gradient border (`#7C3AED` to `#A855F7`).
- **Typography:**
  - Name: Montserrat Bold 22px (`#FFFFFF`).
  - Tenure: Inter Regular 13px (`#94A3B8`).
  - Persona Badge: Full-round pill with `purpleDim` fill (`rgba(124, 58, 237, 0.15)`), 11px Inter SemiBold.
- **Actions:** Integrated secondary outline chips (`CbPillButton`) for "Switch Persona" and "View Profile".

### 2.2 Section Headings
- **Typography:** Montserrat Bold 14px, letterSpacing +0.06em, uppercase or bold title case (`#FFFFFF`).
- **Spacing:** Top margin 28px, bottom margin 12px.
- **Divider:** Subtle 1px line (`#2B2D44`) preceding sections to establish distinct visual breathing room without boxed cards.

### 2.3 Menu Rows (`CbSettingsRow`)
```
+-------------------------------------------------------------------+
| [ Icon ]  Payment Methods                              [ USD > ]  |
|           Default: Visa ending in 4242                            |
+-------------------------------------------------------------------+
```
- **Height:** 56px minimum height (accessible touch target).
- **Leading Icon:** 22px line icon housed inside a 36×36 rounded-lg container (`#1E2032`) with violet/teal/gold glyph.
- **Title:** Inter SemiBold 15px (`#FFFFFF`).
- **Subtitle:** Inter Regular 12px (`#94A3B8`).
- **Trailing:**
  - Standard navigation: `Icon(Icons.chevron_right, color: Colors.white38, size: 20)`
  - Switch: `Switch.adaptive(activeColor: CbColors.purpleMain)`
  - Value chip: `Container(padding: 4px 8px, borderRadius: 6px, color: #1E2032, text: 12px)`
  - Badge: Status indicator (`Connected`, `Action Required`, `Verified`).
- **Interaction Feedback:** `InkWell` with `CbColors.accentPrimarySubtle` ripple.

### 2.4 Danger Zone
- **Layout:** Positioned at the very end of the scrollable viewport or accessed via dedicated `/account/delete` sub-screen.
- **Styling:** Isolated block with red outline (`#7F1D1D`), distinct warning icon, and explicit descriptive confirmation modal.
