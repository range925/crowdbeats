# Crowdbeats Map Engine — Architectural Reference Manual
**Document ID:** `DOCS-MAPS-ENGINE-REFERENCE-001`  
**Version:** 2.0 (Phase 12 Release)  
**Date:** 2026-09-18  
**Author:** Antigravity Engineering (Google DeepMind Pair Programming)  
**Status:** Authoritative Architectural Standard  

---

## 1. Architectural Philosophy & Vision

The Crowdbeats Map Engine is an open-source, WebGL-accelerated geographic visualization platform built to connect music fans with live buskers, performers, and indie venues. Unlike generic embed maps (e.g. Google Maps or Apple Maps embeds) that enforce third-party branding and stepped cartography, Crowdbeats operates a **bespoke, proprietary-feeling map system**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CROWDBEATS MAP SYSTEM                           │
├────────────────────────────────────────────────────────────────────────┤
│  1. Cartography / Context:    OpenStreetMap (via Maptiler Cloud CDN)   │
│  2. Rendering Engine:         MapLibre GL JS 6.x (WebGL Canvas)        │
│  3. Live Data Backbone:       Firebase Firestore (/checkins/{uid})     │
│  4. Visual Identity:          Crowdbeats Cyberpunk Neon Tokens         │
│  5. Spatial Indexing:         Supercluster (Sub-ms k-d tree)           │
│  6. Search & Routing:         Multi-Engine Provider Abstractions       │
└────────────────────────────────────────────────────────────────────────┘
```

The result is a map that looks and feels like a core Crowdbeats product surface—electric green beacons, midnight slate terrain, verified creator badges, and high-frequency live status updates.

---

## 2. Directory Layout & Module Structure

All map infrastructure is consolidated in `apps/web/lib/maps/`:

```
apps/web/lib/maps/
├── index.ts                     # Public barrel export for features and UI components
├── types.ts                     # Vendor-neutral domain types (Coordinates, Markers, Routes)
├── interfaces.ts                # TypeScript contracts for Map, Geocoder, Places, Routing, Style
├── createMapProvider.ts         # Factory resolving provider bundles and rollout percentages
├── googleMapsLoader.ts          # Backward-compatible Google Maps Platform SDK loader
├── engine/
│   └── crowdbeatsMapEngine.ts   # Core constants, Haversine math, W3C Geolocation, OSM attribution
├── providers/
│   ├── LocationProvider.ts      # Hardware GPS tracker with error codes & heading estimation
│   ├── GoogleMapsProvider.ts    # Google Maps Platform implementation bundle
│   └── maplibre/
│       ├── MapLibreMapProvider.ts   # WebGL MapLibre GL implementation with camera & route rendering
│       └── index.ts                 # MapLibre provider bundle exports
├── tiles/
│   ├── tileConfig.ts            # Provider-neutral tile configuration (Maptiler, custom, proxy)
│   └── index.ts
├── markers/
│   ├── MarkerFactory.ts         # Custom DOM element generator for artist, band, venue, and live badges
│   ├── UserLocationMarker.ts    # Animated radar puck with GPS accuracy halo and heading cone
│   ├── markerStyles.ts          # Embedded high-performance CSS animations (pulse, beacon, badges)
│   └── index.ts
├── clustering/
│   ├── CrowdbeatsClusterEngine.ts # Supercluster integration with live performer weighting
│   ├── clusterTypes.ts          # Cluster GeoJSON feature contracts
│   └── index.ts
├── geocoding/
│   ├── geocoderConfig.ts        # Geocoder provider resolution (Maptiler, Nominatim, Google)
│   ├── MaptilerGeocoderProvider.ts # Maptiler Geocoding API with street/locality normalization
│   └── index.ts
├── routing/
│   ├── routingConfig.ts         # Multi-engine routing config (OSRM, Valhalla, GraphHopper, Maptiler)
│   ├── types.ts                 # Travel modes (walking, driving, cycling)
│   ├── externalNavigation.ts    # Deep links for Apple Maps, Google Maps, Waze with device detection
│   ├── providers/               # Concrete engine implementations + straight-line fallback
│   └── index.ts
├── observability/
│   ├── mapObservability.ts      # Structured telemetry, sliding-window spike detection, PII scrubber
│   └── index.ts
├── theme/
│   ├── tokens.ts                # Cartographic design tokens (Midnight Navy, Cyber Cyan, Electric Green)
│   ├── applyTheme.ts            # Dynamic vector layer styling transitions
│   └── index.ts
└── utils/
    └── markerNormalizers.ts     # Firestore LiveCheckin -> CrowdbeatsMapMarker converter
```

---

## 3. Provider Abstraction Architecture

Crowdbeats avoids vendor lock-in by programming strictly to TypeScript interfaces defined in `interfaces.ts`:

```typescript
export interface ICrowdbeatsMapProvider {
  readonly providerName: 'maplibre' | 'google';
  initializeMap(container: HTMLElement, options: MapInitOptions): Promise<void>;
  destroyMap(): void;
  setCenter(coord: CrowdbeatsCoordinate, zoom?: number): void;
  flyTo(coord: CrowdbeatsCoordinate, options?: FlyToOptions): void;
  easeTo(coord: CrowdbeatsCoordinate, options?: EaseOptions): void;
  centerOnMarker(coord: CrowdbeatsCoordinate, options?: EaseOptions): void;
  fitBounds(bounds: CrowdbeatsBounds, padding?: number | PaddingOptions): void;
  addMarker(marker: CrowdbeatsMapMarker): string;
  updateMarker(markerId: string, marker: Partial<CrowdbeatsMapMarker>): void;
  removeMarker(markerId: string): void;
  clearAllMarkers(): void;
  showRoute(route: CrowdbeatsRoute): void;
  clearRoute(): void;
  setTheme(theme: 'dark' | 'light'): Promise<void>;
  on(event: CrowdbeatsMapEvent, callback: CrowdbeatsMapEventCallback): void;
  off(event: CrowdbeatsMapEvent, callback: CrowdbeatsMapEventCallback): void;
}
```

The factory function `createMapProviderBundle()` returns a unified bundle:
- `map`: Rendering canvas provider
- `geocoder`: Address/locality resolver
- `places`: Autocomplete and place prediction provider
- `routing`: Multi-mode pathfinding service
- `location`: Device GPS tracker
- `style`: Cartographic theme controller

---

## 4. Vector Tile System & Proxy Architecture

### Maptiler Cloud Integration
Crowdbeats utilizes OpenStreetMap vector tiles served via Maptiler Cloud. To maintain maximum security and prevent API key theft, requests flow through Next.js server proxies:

```
Browser (MapLibre GL) ──► GET /api/maps/style?theme=dark
                               │
                               ▼
                   Next.js Server Proxy
                   (Injects MAPTILER_API_KEY)
                               │
                               ▼
                   Maptiler Cloud Style API
                               │
                               ▼
Browser receives Style JSON pointing to /api/maps/tiles/{z}/{x}/{y}.pbf
```

### Tile Caching & Attribution
- **Cache-Control**: `public, max-age=86400, s-maxage=604800` (7-day CDN edge caching).
- **Mandatory Attribution (ODbL)**: Rendered via `CrowdbeatsMapAttribution.tsx`:
  `© OpenStreetMap contributors | © MapTiler`

---

## 5. Visual Identity & Styling Engine

Crowdbeats map cartography is designed to harmonize with the dark-mode primary UI:

### Dark Mode ("Cyberpunk Midnight")
- **Canvas / Background**: Deep space slate (`#0b0c10`)
- **Water Bodies**: Midnight navy (`#07090e`) with subtle neon shoreline glow
- **Road Network**: Deep charcoal (`#1e2032`) for local streets; vibrant slate (`#2a2d46`) for freeways
- **Building Footprints**: 3D extruded silhouettes with low opacity (`0.35`)
- **Accent Lighting**: Electric Green (`#00F076`) and Cyber Cyan (`#00E5FF`)

### Light Mode ("High-Contrast Clean Slate")
- **Canvas / Background**: Crisp cloud white (`#f8f9fa`)
- **Water Bodies**: Soft oceanic blue (`#dbeafe`)
- **Road Network**: Pure white arterial roads (`#ffffff`) with subtle drop shadow borders
- **Text Labels**: High-contrast slate (`#1e293b`) with 2px white halo

---

## 6. Marker System & Live Now Beacon

Markers are generated dynamically by `MarkerFactory.ts` as hardware-accelerated HTML/SVG elements:

### 1. Solo Artist Marker
- 44×44px circular avatar with rounded photo.
- 2.5px border (Cyber Cyan `#00E5FF` if verified; Electric Green `#00F076` if live).
- Verified badge icon overlay.

### 2. Band Marker
- Distinct geometric silhouette with stacked member count pill.
- Gold / violet border accent.

### 3. Live Now Pulsing Beacon
- When `isLive: true`, the marker mounts three concentric CSS animation rings:
  ```css
  @keyframes cb-live-pulse {
    0%   { transform: scale(1);   opacity: 0.9; }
    50%  { transform: scale(1.6); opacity: 0.3; }
    100% { transform: scale(2.2); opacity: 0.0; }
  }
  ```
- Respects `prefers-reduced-motion`: pulse animation disables, replaced by static neon border glow.

### 4. User Location Puck
- Cyan radar center dot with heading arrow cone indicating device orientation.
- Semi-transparent outer circle representing real-time GPS accuracy in meters.

---

## 7. Smart Clustering (Supercluster)

To prevent visual clutter in dense urban entertainment districts (e.g. Broadway in Nashville or Sunset Strip in LA), the engine uses **Supercluster**:
- Points are indexed into a spatial k-d tree in `< 2ms`.
- Clusters show aggregate performer count (e.g. `[18]`).
- **Live Now Highlighting**: If a cluster contains at least one active live broadcast, the cluster badge glows in Electric Green with an animated live indicator.
- **Smooth Expansion**: Selecting a cluster triggers `map.flyTo` zooming smoothly directly into the cluster bounds until individual venues split apart.

---

## 8. Routing & Walking Directions

Implemented in `apps/web/lib/maps/routing/`:
- **Default Engine**: OSRM (`foot` profile) via `/api/routes`.
- **Alternative Engines**: Valhalla (`pedestrian`), GraphHopper (`foot`), Maptiler Directions.
- **Geodesic Straight-Line Resilience**: If upstream routing networks are offline, an interpolated straight-line fallback is automatically computed using Haversine distance and 3.1 mph walking velocity.
- **Bottom-Sheet Offset**: Route bounding box calculation adds `{ top: 70, bottom: 200, left: 60, right: 60 }` viewport padding so the destination marker never sits under the mobile bottom sheet.
- **External App Handoff**: 1-tap deep links to Apple Maps, Google Maps, and Waze with automatic user-agent OS detection.

---

## 9. Security, Privacy & Compliance

- **No GPS Persistence**: User coordinates are never written to Firestore or logs.
- **Owner-Only Firestore Writes**: Musician check-ins enforce `isOwner(performerId) && emailVerified()`.
- **Coordinate Boundaries**: Firestore security rules reject any coordinates outside `lat: [-90, 90]` and `lng: [-180, 180]`.
- **Server Proxies**: All third-party tile, geocoding, and routing API keys exist strictly on the server.
- **Client Key Restrictions**: `NEXT_PUBLIC_MAPTILER_CLIENT_KEY` is restricted by domain in Maptiler Cloud Console.

---

## 10. Observability & Anomaly Telemetry

Structured telemetry is managed by `mapObservability.ts`:
- Events: `map_init_error`, `tile_load_error`, `geocoder_error`, `routing_error`, `malformed_coords`, `firebase_live_error`, `request_spike`.
- **Sliding-Window Spike Detector**: Automatically flags an anomaly if >8 errors occur in 60 seconds.
- **PII Sanitizer**: All positions logged in telemetry are rounded to 2 decimal places (~1.1 km neighborhood) or redacted.

---

## 11. Environment Configuration Reference

| Variable | Scope | Default | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_MAP_PROVIDER` | Public | `maplibre` | Active map provider: `maplibre` or `google` |
| `NEXT_PUBLIC_MAP_ENGINE` | Public | `osm` | Legacy flag: `osm` enables MapLibre/OSM |
| `NEXT_PUBLIC_MAP_ROLLOUT_PERCENTAGE`| Public | `100` | Canary percentage (0 to 100) |
| `MAPTILER_API_KEY` | Server | `***` | Server-only Maptiler Cloud API key |
| `NEXT_PUBLIC_MAPTILER_CLIENT_KEY` | Public | `***` | Domain-restricted client tile key |
| `MAP_TILE_PROVIDER` | Server | `maptiler` | Tile provider: `maptiler`, `custom`, `osm-raster` |
| `ROUTING_PROVIDER` | Server | `osrm` | Routing engine: `osrm`, `valhalla`, `graphhopper` |
| `GEOCODER_PROVIDER` | Server | `maptiler` | Geocoding service: `maptiler`, `nominatim` |
| `GOOGLE_MAPS_API_KEY` | Server | `***` | Google Maps Platform key (for Places API & fallback) |

---

## 12. Deployment & Rollback Procedure

### Zero-Downtime Rollback
If an upstream vector tile provider experiences an outage, operators can instantly switch the web client back to Google Maps without a code deployment:
1. In hosting environment / Cloud Console, set:
   `NEXT_PUBLIC_MAP_PROVIDER=google`
2. Trigger an environment redeploy or restart the Edge container.
3. The client factory immediately switches to `GoogleMapsMapProvider`.
