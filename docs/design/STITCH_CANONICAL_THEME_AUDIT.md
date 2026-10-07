# Canonical Stitch Theme Audit & Visual Inventory

**Project Authority:** Google Stitch Project `5326179813018056505` ("Enhanced Nearby Live Music Map")  
**Target Applications:** Crowdbeats V2 Mobile (`apps/mobile`) & Cross-Platform Web (`apps/web`)  
**Status:** Authoritative Theme Specification  

---

## 1. Overview & Purpose

This document provides a comprehensive visual inventory of the canonical Google Stitch project `5326179813018056505`. It serves as the foundational theme guide for colors, typography, elevations, card styles, map overlays, status indicators, and responsive interactions across Crowdbeats V2.

---

## 2. Color System Inventory

| Role | Token Name | Hex Value | RGBA Equivalent | Stitch Visual Context |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas / Root** | `surface-canvas` | `#0B0C10` | `rgba(11, 12, 16, 1.0)` | Deep slate-black base background |
| **Surface Layer 1** | `surface-primary` | `#151722` | `rgba(21, 23, 34, 1.0)` | Standard card containers, bottom nav bar |
| **Surface Layer 2** | `surface-elevated` | `#1E2032` | `rgba(30, 32, 50, 1.0)` | Search inputs, modal sheets, active cards |
| **Surface Layer 3** | `surface-highlight` | `#282A42` | `rgba(40, 42, 66, 1.0)` | Chip selections, hover highlights |
| **Accent Primary** | `accent-violet-main` | `#7C3AED` | `rgba(124, 58, 237, 1.0)` | Primary CTA buttons, active tab indicators |
| **Accent Highlight**| `accent-violet-light`| `#A855F7` | `rgba(168, 85, 247, 1.0)` | Glowing text, distance badges, gradient starts |
| **Accent Deep** | `accent-violet-dark` | `#6D28D9` | `rgba(109, 40, 217, 1.0)` | Gradient finishes, button pressed states |
| **Status Live** | `status-live-green` | `#10B981` | `rgba(16, 185, 129, 1.0)` | `LIVE` badges, active stage rings, live dots |
| **Status Verified** | `status-verified-blue`| `#38BDF8` | `rgba(56, 189, 248, 1.0)` | Verified artist checkmark badges |
| **Ranking Gold** | `rank-gold` | `#F59E0B` | `rgba(245, 158, 11, 1.0)` | #1 Popular ranking badge & warm accents |
| **Text Primary** | `text-primary` | `#FFFFFF` | `rgba(255, 255, 255, 1.0)` | Headlines, creator names, primary labels |
| **Text Secondary**| `text-secondary` | `#94A3B8` | `rgba(148, 163, 184, 1.0)`| Subtitles, genre tags, AI summary text |
| **Text Muted** | `text-muted` | `#64748B` | `rgba(100, 116, 139, 1.0)`| Distance meta, placeholder text, footnotes |
| **Border Subtle** | `border-subtle` | `#2B2D44` | `rgba(255, 255, 255, 0.08)`| Card outlines, divider lines |
| **Border Focus** | `border-focus` | `#7C3AED` | `rgba(124, 58, 237, 0.60)`| Search bar focus, selected card perimeter |

---

## 3. Typography & Text Hierarchy

| Style Name | Size | Line Height | Weight | Letter Spacing | Stitch Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Large** | `32px` | `38px` | `800 Bold` | `-0.03em` | Hero Wordmark / Title |
| **Display Medium**| `24px` | `30px` | `700 Bold` | `-0.02em` | Section Titles ("Discover Live Music") |
| **Headline Large** | `18px` | `24px` | `700 Bold` | `-0.01em` | Creator Names in Cards, Modal Titles |
| **Headline Medium**| `16px` | `22px` | `600 SemiBold` | `0.0em` | Sub-headers, Section Headers ("Nearby") |
| **Body Large** | `14px` | `20px` | `500 Medium` | `0.0em` | Search Input Text, Action Button Text |
| **Body Medium** | `13px` | `18px` | `400 Regular` | `0.0em` | AI Summary Copy, Venue Subtitles |
| **Caption** | `11px` | `14px` | `500 Medium` | `+0.01em` | Distance Tags, Genre Meta, Timestamps |
| **Badge / Tag** | `10px` | `12px` | `800 ExtraBold`| `+0.05em` | `● LIVE`, `#1`, `VERIFIED` chips |

---

## 4. Spacing, Radii & Depth System

### 4.1 Spacing Scale (4px Base Grid)
- `space-2` (4px): Inner badge padding, micro gaps between icon and text.
- `space-4` (8px): Spacing between title and subtitle, tag gap.
- `space-8` (12px): Internal card padding between header and AI summary block.
- `space-12` (16px): Outer screen gutter padding, vertical card spacing.
- `space-16` (20px): Section vertical spacing.
- `space-24` (24px): Major block separation (Header to Search, Search to Map).

### 4.2 Border Radius Scale
- `radius-sm` (6px): LIVE chips, status indicators.
- `radius-md` (10px): Action buttons, AI summary quote block, small avatars.
- `radius-lg` (16px): Performer cards, Search input field.
- `radius-xl` (20px): Map container, modal bottom sheets.
- `radius-pill` (9999px): Tip CTA pill buttons, category pills, avatar circles.

### 4.3 Shadows & Elevation
- **Card Base Elevation**: `box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.45);`
- **Primary CTA Glow**: `box-shadow: 0 4px 16px 0 rgba(124, 58, 237, 0.40);`
- **Live Badge Glow**: `box-shadow: 0 0 12px 1px rgba(16, 185, 129, 0.50);`
- **Glassmorphism Backdrop**: `backdrop-filter: blur(16px); background: rgba(21, 23, 34, 0.85);`

---

## 5. Component Visual Treatments

### 5.1 Location Search Input
- Large pill/rounded container (`radius-lg` 16px).
- Dark surface background (`#1E2032`) with 1px subtle border (`#2B2D44`).
- Focused state transitions border to `rgba(124, 58, 237, 0.60)` with soft violet glow.
- Left location pin icon in muted violet (`#A855F7`), right clear/action icon.

### 5.2 Compact Google Map
- 200–280px container height with 20px rounded corners.
- Dark customized map theme with subtle road and body contrast.
- Custom circular profile markers:
  - 32px circular creator avatar with 1.5px border.
  - Active `LIVE` performers feature a pulsing green ring (`#10B981`) and green status dot.
  - Selected marker grows to 38px with a white glow ring.
- Bottom expand bar: Frosted glass pill displaying stage count with right arrow affordance.

### 5.3 Nearby Creator Card
- Horizontal card layout prioritizing musician imagery.
- Circular 54px avatar on the left with live status badge overlay at bottom-right.
- Creator name with verified badge and distance + genre metadata in clear visual hierarchy.
- AI-generated summary rendered inside an integrated quote container (`#1A1C28`) with italicized styling.
- Compact `Tip` CTA pill button with lightning/heart icon in brand violet gradient.

### 5.4 Popular Creator Card
- Aspirational hierarchy for Top 3 performers.
- Metallic rank badges (`#1 Gold`, `#2 Silver`, `#3 Bronze`) embedded on top-left of avatar.
- Bold typography with follower velocity / trending stats.
- Integrated AI summary and direct tipping CTA.

### 5.5 Status & Verification Accents
- **Green Semantic Rule**: Green (`#10B981`) is reserved *strictly* for active live performance states. It is never used for generic UI buttons or borders.
- **Verified Blue**: Verified badges use soft electric sky blue (`#38BDF8`).
- **Rank Gold**: Warm amber (`#F59E0B`) indicates top popularity and community honors.

---

## 6. Responsive & Platform Alignment

- **Mobile Viewport (360px–480px)**: Vertical stack with tight rhythm, full-width compact map, and 56px bottom navigation.
- **Tablet / Large Viewport (768px–1024px)**: Constrained content column (680px max) with generous margins, larger map preview, and dual-column card arrangements where appropriate.
- **Desktop (1024px+)**: Centered layout maintaining mobile elegance, comfortable line heights, and refined hover animations on cards.
