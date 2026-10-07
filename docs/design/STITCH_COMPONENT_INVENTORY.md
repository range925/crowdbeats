# Authoritative Stitch Component Inventory — Crowdbeats V2

**Design Authority:** Google Stitch Project `5326179813018056505`  
**Target Architectures:** Flutter Widget Library (`apps/mobile/lib/ui/components/`) & React Components (`apps/web/components/ui/`)

---

## 1. Core Component Roster

| Component Name | Description | Stitch Screen Source(s) | Key States | Flutter Target | React Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`CbPillButton`** | Primary full-width vibrant purple CTA with optional leading/trailing icon & shadow glow | Screens 1, 2, 3, 4, 5, 6, 7, 8, 11, 12 | Default, Pressed, Loading, Disabled | `CbPillButton` | `CbPillButton.tsx` |
| **`CbSecondaryOutlineButton`** | Ghost/outline button with purple border and transparent background | Screens 6, 9, 10 | Default, Hover, Active | `CbOutlineButton` | `CbOutlineButton.tsx` |
| **`CbTipPresetCard`** | Tipping amount preset tile with amount text, heart/star icon, and selection ring | Screens 1, 3, 12 | Default, Selected ($5, $10, $20, Custom) | `CbTipPresetCard` | `CbTipPresetCard.tsx` |
| **`CbPerformerSpotlightCard`** | Live artist stage card with photo, verified badge, venue, genre chips, and follow/tip actions | Screens 1, 3, 8, 10, 11, 12 | Live Now, Upcoming, Off-Stage | `CbPerformerSpotlightCard` | `CbPerformerSpotlightCard.tsx` |
| **`CbLiveStatusBadge`** | Glowing emerald green pill badge with live pulse indicator | Screens 3, 8, 10, 11, 12 | `LIVE` Active, Replay | `CbLiveStatusBadge` | `CbLiveStatusBadge.tsx` |
| **`CbLinearStepIndicator`** | 4-step progress header displaying completed checkmarks, current active step, and pending steps | Screens 2, 4, 5, 6, 7 | Step 1, 2, 3, 4 | `CbLinearStepIndicator` | `CbLinearStepIndicator.tsx` |
| **`CbFloatingBottomNav`** | Glassmorphic bottom navigation bar with 5 destinations and center elevated floating "Tip" button | Screens 3, 5, 8, 9, 10, 11, 12 | Active Tab (Home, Nearby, Tip, Activity, Profile) | `CbFloatingBottomNav` | `CbFloatingBottomNav.tsx` |
| **`CbInteractiveMapMarker`** | Circular artist avatar map pin with colored status ring (green/purple/orange) and distance label | Screens 8, 11 | Normal, Pulsing Live, Selected | `CbMapMarker` | `CbMapMarker.tsx` |
| **`CbGlassmorphicDrawer`** | Expandable bottom sheet with frosted glass background, drag handle, and performer list | Screens 3, 8, 11, 12 | Collapsed, Half-Expanded, Fullscreen | `CbGlassmorphicDrawer`| `CbGlassmorphicDrawer.tsx` |
| **`CbFilterChipGroup`** | Horizontal scrolling pill filter chips | Screens 7, 9 | Unselected, Active Purple | `CbFilterChipGroup` | `CbFilterChipGroup.tsx` |
| **`CbActivityEventTile`** | Notification and activity stream tile with avatar, action text, time, and green dollar amount | Screen 9 | Unread, Read, Actionable | `CbActivityEventTile` | `CbActivityEventTile.tsx` |
| **`CbQuickActionTile`** | Dashboard 3-column action card with icon, title, description, and directional arrow | Screen 10 | Normal, Hover/Pressed | `CbQuickActionTile` | `CbQuickActionTile.tsx` |
| **`CbFormField`** | Dark rounded input field with leading icon, floating label, and real-time validation indicator | Screens 1, 2, 4, 7 | Empty, Filled, Focused, Validated | `CbFormField` | `CbFormField.tsx` |
| **`CbReticleViewfinder`** | AR camera targeting overlay with animated neon green bounding box & detection badge | Screens 3, 12 | Searching, Detected, Locked | `CbReticleViewfinder` | `CbReticleViewfinder.tsx` |

---

## 2. Component Specifications

### 2.1 `CbPillButton`
- **Dimensions:** Height 54px, full-width (or wrapped in modal actions), Border Radius 27px (full pill).
- **Background:** `linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)`.
- **Typography:** 16px SemiBold (600), Color `#FFFFFF`.
- **Glow Shadow:** `0 8px 24px -4px rgba(124, 58, 237, 0.45)`.
- **Icon Placement:** Optional leading icon (e.g. `Icons.favorite` in Flutter / Lucide `Heart` in React) and optional trailing arrow (`->`).

### 2.2 `CbTipPresetCard`
- **Dimensions:** Height 72px, Flex 1, Border Radius 16px.
- **Normal State:** Background `#1E2032`, Border `1px solid #2B2D44`, Text `#FFFFFF`, Icon hollow heart `#94A3B8`.
- **Selected State:** Background `#1E2032`, Border `2px solid #7C3AED`, Text `#FFFFFF`, Icon filled purple heart `#7C3AED` or star icon ⭐ with purple badge.

### 2.3 `CbFloatingBottomNav`
- **Background:** `rgba(15, 16, 23, 0.85)` with `backdrop-filter: blur(20px)` and top border `1px solid rgba(255, 255, 255, 0.08)`.
- **Tab Items (4 Standard):** Home, Nearby, Activity, Profile. Active tab colored `#A855F7` with icon highlight.
- **Center "Tip" Action Button:** Elevated circular or squircle button (diameter 56px), background `#7C3AED`, icon centered (scan/camera or heart-dollar), halo glow shadow.

### 2.4 `CbPerformerSpotlightCard`
- **Dimensions:** Width 100% or horizontal card width 220px, Border Radius 20px.
- **Image:** 16:9 or 4:3 high-resolution concert photography with dark gradient scrim overlay at the bottom.
- **Badges:** `LIVE` badge top-left (emerald background, white bold text, pulsing green dot).
- **Distance Tag:** Bottom-right of image: Location pin + `0.3 mi`.
- **Details:** Artist name with verified checkmark, venue name, genre tags. Direct `Tip` action button.
