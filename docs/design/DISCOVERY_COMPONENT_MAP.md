# Crowdbeats V2 — Discovery Component Mapping Specification
**Document Reference**: `CB-DESIGN-COMPONENT-MAP-004`  
**Classification**: Engineering & Component Architecture Specification  
**Status**: `READY FOR IMPLEMENTATION`  

---

## 1. Cross-Platform Component Mapping

| Component Identifier | Flutter Mobile Widget (`apps/mobile`) | Next.js Web Component (`apps/web`) | Primary Role & Responsibilities |
| :--- | :--- | :--- | :--- |
| **`CrowdbeatsLocationSearch`** | `apps/mobile/lib/ui/fan/widgets/crowdbeats_location_search.dart` | `apps/web/components/discovery/CrowdbeatsLocationSearch.tsx` | Prominent search bar with Places autocomplete dropdown/sheet (*"Search city, town, state or country"*). |
| **`DiscoveryActionCard`** | `apps/mobile/lib/ui/fan/widgets/discovery_action_card.dart` | `apps/web/components/discovery/DiscoveryActionCard.tsx` | Reusable card component for the 3 primary options (**`Nearby`**, **`Popular`**, **`Live Now`**) with icon, title, and subtitle. |
| **`DiscoveryMapPreview`** | `apps/mobile/lib/ui/fan/widgets/discovery_map_preview.dart` | `apps/web/components/discovery/DiscoveryMapPreview.tsx` | Compact interactive radar map preview card showing 2–5 pins and tap-to-expand affordance. |
| **`LocationContextHeader`** | `apps/mobile/lib/ui/fan/widgets/location_context_header.dart` | `apps/web/components/discovery/LocationContextHeader.tsx` | Location banner displaying *"You are here"* or *"Exploring Torrance, CA"* with *"Use My Location"* reset button. |
| **`PublicDiscoveryHome`** | `apps/mobile/lib/ui/fan/public_discovery_home.dart` | `apps/web/app/page.tsx` | The authoritative first-screen container integrating the search bar, 3 action cards, and map preview. |
| **`NearbySecondaryView`** | `apps/mobile/lib/ui/fan/views/nearby_secondary_view.dart` | `apps/web/app/nearby/page.tsx` | Dedicated secondary view for Nearby discovery with full map/list/venues switcher, filters, and distance radius. |
| **`PopularSecondaryView`** | `apps/mobile/lib/ui/fan/views/popular_secondary_view.dart` | `apps/web/app/popular/page.tsx` | Dedicated secondary view for Popular discovery (Solo Artists, Bands, Venues, Trending this week). |
| **`LiveNowSecondaryView`**| `apps/mobile/lib/ui/fan/views/live_now_secondary_view.dart` | `apps/web/app/live/page.tsx` | Dedicated secondary view for verified active live performances occurring right now. |
| **`AuthActionGate`** | `apps/mobile/lib/ui/fan/tip/tip_auth_gate_modal.dart` | `apps/web/components/discovery/TipAuthGateModal.tsx` | Progressive auth modal preserving tip context across login without automatic charge. |

---

## 2. Component Interface Definitions

### 1. `DiscoveryActionCard` Interface
```typescript
export interface DiscoveryActionCardProps {
  id: 'nearby' | 'popular' | 'live_now';
  title: string;
  supportingText: string;
  icon: string;
  badgeText?: string;
  isActive?: boolean;
  onTap: () => void;
}
```

### 2. `DiscoveryMapPreview` Interface
```typescript
export interface DiscoveryMapPreviewProps {
  locationName: string;
  latitude: number;
  longitude: number;
  representativePinCount: number;
  isSearchAreaMode: boolean;
  onTapExpand: () => void;
  onUseMyLocation: () => void;
}
```

### 3. `CrowdbeatsLocationSearch` Interface
```typescript
export interface CrowdbeatsLocationSearchProps {
  placeholder?: string;
  currentLocationName: string;
  isSearchAreaMode: boolean;
  onSelectLocation: (location: DiscoveryLocation) => void;
  onUseMyLocation: () => void;
}
```
