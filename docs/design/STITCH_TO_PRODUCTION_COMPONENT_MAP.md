# Stitch to Production Component Mapping

**Source Design Authority:** Google Stitch `5326179813018056505`  
**Target Codebases:** Flutter Mobile (`apps/mobile`), Next.js Web (`apps/web`)  

---

## 1. Core Component Mapping Matrix

| Stitch Design Element | Flutter Mobile Component (`apps/mobile`) | Next.js Web Component (`apps/web`) | Design Tokens & Styling Applied |
| :--- | :--- | :--- | :--- |
| **Location Search Bar** | `CrowdbeatsLocationSearch` (`lib/ui/fan/widgets/crowdbeats_location_search.dart`) | `CrowdbeatsLocationSearch` (`components/discovery/CrowdbeatsLocationSearch.tsx`) | `surfaceSecondary` (#1E2032), `radiusLarge` (16px), `accentSecondary` pin icon, Google Places autocomplete |
| **Compact Map Container**| `CompactGoogleMap` (`lib/ui/fan/widgets/compact_google_map.dart`) | `DiscoveryMapPreview` (`components/discovery/DiscoveryMapPreview.tsx`) | 220px fixed height, `radiusXL` (20px), custom dark map styling, radar grid |
| **Map Profile Marker** | `_PerformerMapMarker` (`lib/ui/fan/widgets/compact_google_map.dart`) | `MapMarker` (`components/discovery/DiscoveryMap.tsx`) | 32px circular creator avatar, `live` green ring (#10B981) when active, selected glow |
| **Nearby Creator Card** | `NearbyCreatorCard` (`lib/ui/fan/widgets/nearby_creator_card.dart`) | `NearbyCreatorCard` (`components/discovery/NearbyCreatorCard.tsx`) | `surfacePrimary` (#151722), 54px avatar with live pill, 8–18 word AI summary quote, Tip pill CTA |
| **Popular Creator Card** | `PopularCreatorCard` (`lib/ui/fan/widgets/popular_creator_card.dart`) | `PopularCreatorCard` (`components/discovery/PopularCreatorCard.tsx`) | Metallic rank badges (#1 Gold, #2 Silver, #3 Bronze), trending stats, Tip pill CTA |
| **AI Profile Summary** | Integrated inside `NearbyCreatorCard` & `PopularCreatorCard` | Integrated inside `NearbyCreatorCard` & `PopularCreatorCard` | Inset quote container (#181A26), `bodyMedium` italicized (#CBD5E1), 8–18 word length |
| **Tip CTA Button** | Inset pill on performer cards & `TipAuthGateModal` | Inset pill on performer cards & `TipAuthGateModal.tsx` | `accentPrimary` gradient (#7C3AED to #6D28D9), `radiusPill` (9999px), `elevationLow` |
| **Bottom Navigation** | `FanShell` bottom navigation bar (`lib/ui/fan/fan_shell.dart`) | `DiscoveryNav` (`components/discovery/DiscoveryNav.tsx`) | `surfacePrimary` (#151722), 56px height, `caption` typography (#94A3B8 / #A855F7) |
| **Tip Auth Gate Modal** | `TipAuthGateModal` (`lib/ui/fan/tip/tip_auth_gate_modal.dart`) | `TipAuthGateModal` (`components/discovery/TipAuthGateModal.tsx`) | Session preservation, zero auto-charge, `surfaceElevated` (#282A42), 20px radius |

---

## 2. Design Token Translation

### Colors
- `CbColors.surfacePrimary` / `--cb-surface-primary`: `#151722`
- `CbColors.surfaceSecondary` / `--cb-surface-secondary`: `#1E2032`
- `CbColors.surfaceElevated` / `--cb-surface-elevated`: `#282A42`
- `CbColors.purpleMain` / `--cb-accent-primary`: `#7C3AED`
- `CbColors.purpleLight` / `--cb-accent-secondary`: `#A855F7`
- `CbColors.liveGreen` / `--cb-live`: `#10B981`
- `CbColors.verifiedBlue` / `--cb-verified`: `#38BDF8`
- `CbColors.rankGold` / `--cb-warning`: `#F59E0B`

### Typography Scale
- `displayLarge`: 32px Bold (-0.03em letter spacing)
- `displayMedium`: 24px Bold (-0.02em letter spacing)
- `headlineLarge`: 20px Bold (-0.01em letter spacing)
- `headlineMedium`: 18px SemiBold (0.0em letter spacing)
- `titleLarge`: 16px Bold
- `bodyLarge`: 14px Medium
- `bodyMedium`: 13px Regular (AI summaries)
- `caption`: 11px Medium (Metadata)
- `badge`: 10px ExtraBold (`LIVE` / `#1`)

---

## 3. Implementation Invariants

1. **Strict First-Screen Order**: Header → Search → Compact Map → Top 5 Nearby → Top 3 Popular → Bottom Navigation.
2. **Contextual Live Now**: Live status is rendered strictly as a property of cards and map markers.
3. **No Direct State Manipulation**: Server-authoritative `nearbyScore` and `popularityScore` dictate ranking.
