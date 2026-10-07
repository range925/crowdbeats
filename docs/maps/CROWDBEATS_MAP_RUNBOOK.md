# Crowdbeats Map Engine — Operations & Incident Runbook
**Document ID:** `DOCS-MAPS-RUNBOOK-001`  
**Version:** 2.0 (Phase 12 Release)  
**Date:** 2026-09-18  
**Target Audience:** DevOps, On-Call Site Reliability Engineers (SRE), Platform Engineers  
**Severity Classification:** Tier 1 (Discovery & Navigation Services)  

---

## Quick Reference Commands

```bash
# 1. Switch to MapLibre GL (Primary Web Default)
NEXT_PUBLIC_MAP_PROVIDER=maplibre
NEXT_PUBLIC_MAP_ENGINE=osm

# 2. Emergency Instant Fallback to Google Maps
NEXT_PUBLIC_MAP_PROVIDER=google
NEXT_PUBLIC_MAP_ENGINE=

# 3. Canary 25% Traffic Rollout
NEXT_PUBLIC_MAP_ROLLOUT_PERCENTAGE=25

# 4. In-Browser Provider Force (Bypass env for QA / Triage)
https://crowdbeats-01.web.app/fan/nearby?provider=maplibre
https://crowdbeats-01.web.app/fan/nearby?provider=google
```

---

## 1. Procedure: Switching Between Map Providers (Google Maps vs. MapLibre)

The Crowdbeats Map Engine is built with dual-provider capability. In the event of a critical rendering regression or major CDN disruption, follow this procedure.

### Step-by-Step Instructions

1. **Access Hosting Environment Settings:**
   - For Firebase App Hosting / Vercel / Cloud Run:
     Navigate to **Project Settings** > **Environment Variables**.
2. **Update Provider Variable:**
   - To force MapLibre:
     ```env
     NEXT_PUBLIC_MAP_PROVIDER=maplibre
     NEXT_PUBLIC_MAP_ENGINE=osm
     ```
   - To force Google Maps fallback:
     ```env
     NEXT_PUBLIC_MAP_PROVIDER=google
     NEXT_PUBLIC_MAP_ENGINE=
     ```
3. **Trigger Deployment / Configuration Refresh:**
   - In Next.js App Router, redeploy the frontend container so public client variables are baked into static chunks.
4. **Verification:**
   - Open an incognito browser window to `/fan/nearby`.
   - Inspect console logs: Look for `[MapLibreMapProvider]` or `[GoogleMapsProvider]`.
   - Verify marker interactivity and bottom-sheet rendering.

---

## 2. Procedure: Changing Tile Providers

The tile subsystem (`apps/web/lib/maps/tiles/`) is completely decoupled from Maptiler Cloud. You can switch to alternative vector tile providers (e.g. Protomaps, Stadia Maps, Mapbox, or self-hosted PMTiles) without changing application code.

### Option A: Switching to a Custom Vector Tile URL (e.g. Protomaps / Self-Hosted)

1. Set the following environment variables:
   ```env
   MAP_TILE_PROVIDER=custom
   MAP_TILE_DARK_STYLE_URL=https://tiles.yourdomain.com/styles/dark.json
   MAP_TILE_LIGHT_STYLE_URL=https://tiles.yourdomain.com/styles/light.json
   ```
2. Verify that your custom style JSON includes CORS headers allowing `*.crowdbeats.com` and `localhost`.
3. Verify that glyphs and sprites URLs in the style JSON are fully qualified HTTPS URLs.

### Option B: Switching to OpenStreetMap Standard Raster Tiles (Emergency Zero-Cost Fallback)

1. Set:
   ```env
   MAP_TILE_PROVIDER=osm-raster
   ```
2. The proxy in `apps/web/app/api/maps/style/route.ts` will automatically synthesize a minimal MapLibre raster style JSON using standard OpenStreetMap tile servers (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`).
3. Note: Ensure usage complies with OpenStreetMap Tile Usage Policy (User-Agent header is automatically attached by our proxy).

---

## 3. Procedure: Changing Geocoder Providers

Location search and autocomplete are abstracted via `apps/web/lib/maps/geocoding/`:

### Supported Geocoding Providers:
- `maptiler`: Maptiler Cloud Geocoding API (Default)
- `nominatim`: OpenStreetMap Nominatim Service
- `google`: Google Geocoding API (Fallback)

### Switching Geocoder:
1. Update environment configuration:
   ```env
   GEOCODER_PROVIDER=maptiler   # or 'nominatim' or 'google'
   GEOCODER_API_KEY=your_key_here
   GEOCODER_BASE_URL=https://api.maptiler.com/geocoding
   ```
2. When using Nominatim:
   - Nominatim enforces a strict rate limit of 1 request/second and requires a custom User-Agent.
   - The Crowdbeats geocoding proxy (`/api/maps/geocode`) applies 300ms client debouncing, 30-minute in-memory caching, and attaches `User-Agent: Crowdbeats-Geocoder/2.0`.
   - Do NOT point production traffic directly to public `nominatim.openstreetmap.org` at scale; deploy a private Nominatim container or use Maptiler.

---

## 4. Procedure: Changing Routing Engines

Crowdbeats routing is abstracted in `apps/web/lib/maps/routing/`:

### Supported Routing Providers:
- `osrm`: Open Source Routing Machine (Default)
- `valhalla`: Valhalla Routing Engine (Polyline6 costing)
- `graphhopper`: GraphHopper Directions API
- `maptiler`: Maptiler Directions API
- `google`: Google Routes API (Backward compatibility)

### Switching Routing Engine:
1. Update environment configuration:
   ```env
   ROUTING_PROVIDER=osrm       # 'osrm' | 'valhalla' | 'graphhopper' | 'maptiler' | 'google'
   ROUTING_BASE_URL=https://router.project-osrm.org/route/v1
   ROUTING_API_KEY=your_key_if_applicable
   ```
2. The server proxy (`/api/routes`) normalizes coordinates, applies 30-minute route caching, and formats responses into the universal `CrowdbeatsRoute` type.
3. If the selected routing engine experiences downtime, `createRoutingProvider.ts` automatically falls back to straight-line geodesic routing with transit-speed estimation.

---

## 5. Troubleshooting Outages & Incident Triage

### Scenario 1: Map Canvas is Blank / Black Screen
- **Root Cause A: WebGL context lost or disabled in user browser.**
  - **Resolution**: Verify hardware acceleration is enabled. MapLibre automatically displays `MapLibreFallback` with list-mode discovery.
- **Root Cause B: Invalid or expired Maptiler API Key.**
  - **Diagnostic**: Check browser Network tab for `/api/maps/style` returning HTTP 401/403.
  - **Resolution**: Verify `MAPTILER_API_KEY` in environment settings; re-issue key if expired.

### Scenario 2: Markers Not Updating Live
- **Root Cause: Firestore security rule rejection or missing index.**
  - **Diagnostic**: Check browser console for `[subscribeToNearbyPerformers] Firestore error`.
  - **Resolution**:
    1. Confirm user is authenticated and email is verified.
    2. Check `firebase/firestore.rules` for `/checkins/{performerId}`.
    3. Ensure `updatedAt == request.time` is present in write payloads.

### Scenario 3: Telemetry Anomaly Spikes (`request_spike`)
- **Diagnostic**: `mapObservability` triggers `request_spike` when >8 errors occur in 60s.
- **Resolution**:
  1. Inspect `mapObservability.getSnapshot()` in developer tools.
  2. Check `countsByType` to identify whether the culprit is `tile_load_error`, `geocoder_error`, or `routing_error`.
  3. If tile errors dominate, switch to backup tile provider or Google Maps.

---

## 6. Rotating API Credentials

### Rotating Maptiler Keys:
1. Log in to [Maptiler Cloud Console](https://cloud.maptiler.com/account/keys/).
2. Generate a new key named `crowdbeats-prod-tiles-v2`.
3. In Key Settings, configure Allowed HTTP referrers:
   - `https://crowdbeats.com/*`
   - `https://*.crowdbeats.com/*`
   - `https://crowdbeats-01.web.app/*`
4. Update `MAPTILER_API_KEY` and `NEXT_PUBLIC_MAPTILER_CLIENT_KEY` in production environment.
5. Once traffic transitions (monitor Maptiler dashboard for ~1 hour), revoke the old key.

### Rotating Google Maps API Keys:
1. Log in to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials).
2. Create a replacement API key.
3. Under **API restrictions**, restrict to:
   - Maps JavaScript API
   - Places API (New)
   - Geocoding API
4. Under **Application restrictions**, set Website restrictions to authorized domains.
5. Update `GOOGLE_MAPS_API_KEY` in hosting environment.
6. Verify `/api/places/autocomplete?intent=venue` succeeds.
7. Delete old key after 24 hours.

---

## 7. Escalation Contacts & Health Endpoints

- **Map Health Check Route**: `/api/maps/style?theme=dark` (should return JSON with `version: 8`).
- **Geocoding Health Check**: `/api/maps/geocode?q=San+Diego` (should return status 200 with coordinates).
- **Routing Health Check**: `/api/routes` (POST with mock coordinates, should return `CrowdbeatsRoute`).
