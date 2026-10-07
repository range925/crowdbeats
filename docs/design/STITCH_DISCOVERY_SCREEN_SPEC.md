# Canonical Stitch Discovery Screen Specification

**Project Authority:** Google Stitch `5326179813018056505`  
**Screen Target:** Public Discovery Gateway (`apps/mobile/lib/ui/fan/public_discovery_home.dart`, `apps/web/app/page.tsx`)  
**Design Status:** Canonical Specification  

---

## 1. First-Screen Layout Architecture

The discovery landing screen must strictly implement the location-first layout hierarchy derived from the Stitch theme:

```
┌────────────────────────────────────────────────────────┐
│  1. CROWDBEATS Header                                  │
│     - Minimal brand wordmark                           │
│     - Subtitle: "Discover music around you"           │
├────────────────────────────────────────────────────────┤
│  2. Location Search Bar                                │
│     - "Search city, town, state or country"            │
│     - Google Places-compatible autocomplete            │
├────────────────────────────────────────────────────────┤
│  3. Compact Google Map Preview (200–280px)            │
│     - 3–8 circular profile markers with LIVE rings     │
│     - Active exploration status ("Exploring Torrance") │
│     - Glassmorphic expand bar                          │
├────────────────────────────────────────────────────────┤
│  4. Top 5 Nearby Section                               │
│     - Section header with "See All" affordance         │
│     - 5 Image-forward NearbyCreatorCards               │
│     - Contextual green LIVE badges                     │
│     - 8–18 word AI summaries in quote styling          │
│     - Direct Tip CTA pill buttons                      │
├────────────────────────────────────────────────────────┤
│  5. Top 3 Popular Section                              │
│     - Section header with "See All" affordance         │
│     - 3 Aspirational PopularCreatorCards               │
│     - Gold/Silver/Bronze rank badges (#1, #2, #3)      │
│     - 8–18 word AI summaries & Tip CTA                 │
├────────────────────────────────────────────────────────┤
│  6. Bottom Navigation Bar                              │
│     - Home | Nearby | Tip | Activity | Profile         │
└────────────────────────────────────────────────────────┘
```

---

## 2. Component Specifications

### 2.1 CROWDBEATS Header
- **Wordmark**: `CROWDBEATS` in bold tracking (`letter-spacing: -0.03em`), gradient fill from `#FFFFFF` (80%) to `#A855F7` (100%).
- **Subtitle**: `"Discover music around you"`, 14px Regular (`#94A3B8`).

### 2.2 Location Search Input
- **Container**: 50px height, `radiusLarge` (16px), background `#1E2032`, border 1px `rgba(255, 255, 255, 0.08)`.
- **Focus State**: Border transitions to `rgba(124, 58, 237, 0.60)` with `box-shadow: 0 0 12px rgba(124, 58, 237, 0.25)`.
- **Leading Icon**: Location pin icon in `#A855F7`.
- **Placeholder**: `"Search city, town, state or country"` in `#64748B`.
- **Autocomplete Overlay**: Floating surface container (`#1E2032`) with smooth fade-in listing curated cities (Torrance, Palm Springs, LA, San Diego, Austin, Nashville, London, Auckland).

### 2.3 Compact Google Map Preview
- **Height**: 220px fixed on mobile, up to 260px on desktop.
- **Corner Radius**: 20px (`radiusXL`), clipping the dark map canvas.
- **Location Status Header**:
  - Left: Pulsing status indicator dot (Green for device GPS, Violet for Searched area) + label (`"Exploring Torrance"`).
  - Right: Quick `"Reset to My Location"` button when in search area mode.
- **Custom Profile Map Markers**:
  - 32px circular creator avatar with 1.5px border.
  - Active `LIVE` performers: 2px pulsing green ring (`#10B981`) and green status pip.
  - Non-live performers: 1.5px violet border (`#A855F7`).
  - Selected marker: Grows to 38px with white border and glow ring.
- **Bottom Expand Bar**: Frosted glass container (`rgba(19, 19, 21, 0.90)`) with stage count and chevron expand link.

### 2.4 Top 5 Nearby Creator Cards
- **Card Container**: Surface `#151722`, border 1px `#2B2D44` (or `rgba(16, 185, 129, 0.40)` if performing Live), radius 18px.
- **Avatar**: 54px circular profile image with 2px Live ring and overlay `LIVE` pill tag.
- **Identity Block**:
  - Name: 16px Bold White with verified checkmark in `#38BDF8`.
  - Subtitle: Distance (12px `#A855F7`) · Genre (12px `#94A3B8`) · Venue (12px `#E2E8F0`).
- **AI Profile Summary**:
  - Rendered inside an inset quote container (`#181A26`) with 10px rounded corners.
  - Typography: 12.5px Italicized text (`#CBD5E1`), 8–18 words strictly validated against hallucinations.
- **Tip CTA Pill**:
  - Electric violet gradient button (`#7C3AED` to `#6D28D9`) with lightning bolt/heart icon and `"Tip"` text.
  - Opens Tip Auth Gate preserving creator context across login.

### 2.5 Top 3 Popular Creator Cards
- **Aspirational Hierarchy**: Slightly elevated visual prominence.
- **Rank Indicator**:
  - `#1`: Gold metallic pill (`#F59E0B`) with subtle glow.
  - `#2`: Silver pill (`#94A3B8`).
  - `#3`: Bronze pill (`#B97333`).
- **Follower & Tip Velocity**: Contextual badge highlighting community support.
- **Integrated AI Summary & Tip CTA**: Same reliable 8–18 word summary format and tipping flow.

---

## 3. Strict Semantic Guidelines

- **Green Semantic Isolation**: Green (`#10B981`) is strictly reserved for active live performance states (`LIVE` badges, map marker rings, active stage indicators). It is never used for generic UI buttons.
- **No Categories on Landing Screen**: The rejected 3-large-button layout (`Nearby`, `Popular`, `Live Now`) must not appear. Live Now is integrated directly as contextual badges.
- **Privacy Assurance**: Public discovery cards and map markers expose zero private creator data (no emails, phone numbers, Stripe account IDs, or private residential addresses).
