# Crowdbeats V2 — Discovery Card Components Specification
**Document Reference**: `CB-DESIGN-CARD-COMPONENTS-004`  
**Classification**: Component Architecture & Design Tokens  
**Status**: `APPROVED FOR IMPLEMENTATION`  

---

## 1. Component Suite Overview

| Component Name | Mobile Dart (`apps/mobile`) | Web React (`apps/web`) | Visual Hierarchy & Role |
| :--- | :--- | :--- | :--- |
| **`NearbyCreatorCard`** | `NearbyCreatorCard.dart` | `NearbyCreatorCard.tsx` | Compact horizontal card for Top 5 Nearby with avatar, verified badge, distance, genre, contextual `LIVE` indicator, 8–18 word AI summary, and Tip button. |
| **`PopularCreatorCard`** | `PopularCreatorCard.dart` | `PopularCreatorCard.tsx` | Compact horizontal card for Top 3 Popular with rank indicator (#1, #2, #3), avatar, verified badge, AI summary, and Tip button. |
| **`CompactGoogleMap`** | `CompactGoogleMap.dart` | `CompactGoogleMap.tsx` | Calm 200–280px map preview with 3–8 markers, location context header, and tap-to-expand control. |
| **`LocationSearchBar`** | `LocationSearchBar.dart` | `LocationSearchBar.tsx` | Dominant top search bar with Google Places autocomplete (*"Search city, town, state or country"*). |

---

## 2. Card Anatomy & Token Specifications

### 1. `NearbyCreatorCard` Anatomy
```
┌──────────────────────────────────────────────────────────────────┐
│ [ Avatar 56px ]  Jake Rios 🔵          [ 🟢 LIVE ]  [ Tip $20 ] │
│                  0.3 mi · Indie Folk · The Main Stage            │
│                  "Indie-folk storyteller blending warm acoustic  │
│                  guitar with late-night California energy."      │
└──────────────────────────────────────────────────────────────────┘
```

- **Container Background**: `#151722` (Smoky Obsidian)
- **Border**: `1px solid rgba(255, 255, 255, 0.08)` (Active LIVE state: `1.2px solid rgba(16, 185, 129, 0.4)`)
- **Border Radius**: `18px`
- **Primary Typography**: 16px Bold White (`#FFFFFF`)
- **Secondary Typography**: 12px Soft Slate (`#94A3B8`)
- **AI Summary Typography**: 13px Regular (`#E2E8F0`), italicized or styled with high contrast
- **Live Badge**: 10px Bold Emerald (`#10B981`) on `rgba(16, 185, 129, 0.15)` pill

### 2. `PopularCreatorCard` Anatomy
```
┌──────────────────────────────────────────────────────────────────┐
│ [ #1 ] [ Avatar ] The Sunsets 🔵                     [ Tip $20 ] │
│                   Indie Rock · 4 Members                         │
│                   "Four-piece rock band mixing country grit and  │
│                   blues swagger for crowd-driven live sets."     │
└──────────────────────────────────────────────────────────────────┘
```

- **Rank Pill**: 24px circular badge with `#F59E0B` (Gold for #1), `rgba(255, 255, 255, 0.1)` for #2/#3
- **Card Padding**: 14px horizontal, 14px vertical
