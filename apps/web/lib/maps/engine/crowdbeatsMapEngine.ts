/**
 * Crowdbeats Map Engine — Core Abstraction Layer (Phase 2 of 12)
 *
 * This is the single source of truth for all map infrastructure in Crowdbeats V2.
 * It abstracts over the underlying renderer, currently migrating from Google Maps
 * to MapLibre GL JS + OpenStreetMap via Maptiler Cloud.
 *
 * Architecture:
 *   Tile serving:   Maptiler Cloud (OSM-based, key injected server-side only)
 *   Map renderer:   MapLibre GL JS 6.x (open source, WebGL-accelerated)
 *   Geocoding:      Google Places (server proxy) + OSM Nominatim fallback
 *   Routing:        OSRM (Open Source Routing Machine) walking directions
 *   Attribution:    OpenStreetMap contributors (ODbL — required on every map surface)
 *
 * Phase 2: Library loader, coordinate utils, geolocation, routing stubs, feature flag.
 * Phase 3: CrowdbeatsMapLibre React component + full marker rendering.
 * Phase 4: Provider-neutral tile config (tileConfig.ts), vector tile proxy, attribution.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TILE SERVER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * URL of our style proxy (Phase 4: provider-neutral via tileConfig).
 * The client calls this to get the MapLibre GL style JSON.
 * The API key is injected by the server — never in the browser bundle.
 *
 * The URL returned always points to /api/maps/style (our proxy),
 * regardless of which tile provider is active.
 */
export const CROWDBEATS_MAP_STYLE_URL = (theme: 'dark' | 'light' = 'dark') =>
  `/api/maps/style?theme=${theme}`;

/**
 * Required OpenStreetMap attribution per ODbL license.
 * Must be visible on EVERY map surface that uses OSM tile data.
 *
 * Phase 4: These re-export from tileConfig.ts for DRY consistency.
 * Import directly from '@/lib/maps/tiles' in new code.
 */
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
export const MAPTILER_ATTRIBUTION =
  '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">MapTiler</a>';
export const CROWDBEATS_ATTRIBUTION = `${OSM_ATTRIBUTION} | ${MAPTILER_ATTRIBUTION}`;

// ─────────────────────────────────────────────────────────────────────────────
// MAPLIBRE LAZY LOADER
// ─────────────────────────────────────────────────────────────────────────────

let _maplibrePromise: Promise<typeof import('maplibre-gl')> | null = null;

/**
 * Lazily imports maplibre-gl. Safe to call multiple times — returns same promise.
 *
 * IMPORTANT: Never import maplibre-gl at the top level of any server-rendered file.
 * maplibre-gl requires a DOM (window, document) and will crash in SSR context.
 * Always use this function inside useEffect, useCallback, or dynamic() boundaries.
 */
export function loadMapLibre(): Promise<typeof import('maplibre-gl')> {
  if (_maplibrePromise) return _maplibrePromise;
  _maplibrePromise = import('maplibre-gl').catch((err) => {
    _maplibrePromise = null; // allow retry on error
    throw err;
  });
  return _maplibrePromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// COORDINATE TYPES + UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/** Platform-neutral coordinate pair. WGS84 decimal degrees. */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Straight-line distance in miles between two coordinate pairs.
 * Haversine formula — matches geoService.ts (Firebase Functions) and
 * googleMapsLoader.ts (existing client) implementations.
 * This is the canonical client-side implementation going forward.
 */
export function haversineDistanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────────────────────────────────────
// GEOLOCATION
// ─────────────────────────────────────────────────────────────────────────────

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

/**
 * Requests browser GPS location.
 * Drop-in replacement for googleMapsLoader.requestBrowserGeolocation().
 * Zero Google dependency — uses W3C Geolocation API directly.
 */
export function requestGeolocation(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject('Your browser does not support location detection.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracyMeters: pos.coords.accuracy,
      }),
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject('Location permission denied. Enable location in your browser settings.'); break;
          case err.POSITION_UNAVAILABLE:
            reject('Location unavailable. Check your device GPS.'); break;
          case err.TIMEOUT:
            reject('Location request timed out. Try again.'); break;
          default:
            reject('Unable to detect your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// WALKING DIRECTIONS — OSRM
// ─────────────────────────────────────────────────────────────────────────────

export interface RouteResult {
  /**
   * GeoJSON coordinate pairs [longitude, latitude].
   * NOTE: MapLibre uses [lng, lat] order (GeoJSON standard).
   * Google Maps uses {lat, lng} objects — the order is reversed.
   */
  coordinates: [number, number][];
  durationText: string;       // e.g. '4 min walk'
  distanceMilesText: string;  // e.g. '0.3 mi'
  distanceMiles: number;
  durationSeconds: number;
}

/**
 * OSRM public demo server base URL.
 * Phase 7 migrates this to /api/maps/route (proxied, rate-limited, production-safe).
 *
 * OSRM foot profile returns GeoJSON geometry natively when ?geometries=geojson.
 */
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/foot';

/**
 * Fetches walking directions via OSRM.
 * Returns GeoJSON [lng, lat] coordinate array — MapLibre-native format.
 *
 * Drop-in replacement for googleMapsLoader.calculateGoogleWalkingRoute().
 * Returns null on failure (network error, no route) — callers handle gracefully.
 */
export async function getWalkingRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult | null> {
  try {
    const url = [
      OSRM_BASE,
      `/${origin.lng.toFixed(6)},${origin.lat.toFixed(6)}`,
      `;${destination.lng.toFixed(6)},${destination.lat.toFixed(6)}`,
      '?overview=full&geometries=geojson&steps=false',
    ].join('');

    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'Crowdbeats-MapEngine/2.0' },
    });
    if (!res.ok) return null;

    const data = await res.json() as {
      routes?: { geometry: { coordinates: [number,number][] }; distance: number; duration: number }[];
      code?: string;
    };

    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const route = data.routes[0];
    const coords = route.geometry.coordinates;
    const distMeters = route.distance;
    const durationSec = route.duration;

    const distMiles = distMeters * 0.000621371;
    const distText =
      distMiles < 0.1
        ? Math.round(distMeters * 3.28084) + ' ft'
        : distMiles.toFixed(1) + ' mi';

    const dMin = Math.ceil(durationSec / 60);
    const durText =
      dMin < 1  ? 'Less than a min walk'
      : dMin === 1 ? '1 min walk'
      : `${dMin} min walk`;

    return {
      coordinates: coords,
      durationText: durText,
      distanceMilesText: distText,
      distanceMiles: distMiles,
      durationSeconds: durationSec,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE FLAG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true when the Crowdbeats Map Engine (MapLibre/OSM) should render
 * instead of the legacy Google Maps implementation.
 *
 * Controlled by (in priority order):
 *   1. URL query param ?engine=osm  → enables for that session only (A/B testing)
 *   2. NEXT_PUBLIC_MAP_ENGINE=osm   → enables globally across all sessions
 *
 * Defaults to false until Phase 8 flips the global switch.
 * This ensures zero disruption to production users during the migration.
 */
export function isCrowdbeatsMapEngineEnabled(searchParams?: URLSearchParams): boolean {
  if (typeof window === 'undefined') return false;
  const sp = searchParams ?? new URLSearchParams(window.location.search);
  if (sp.get('engine') === 'osm' || sp.get('provider') === 'maplibre') return true;
  if (sp.get('provider') === 'google') return false;
  if (process.env.NEXT_PUBLIC_MAP_PROVIDER === 'maplibre') return true;
  if (process.env.NEXT_PUBLIC_MAP_ENGINE === 'osm') return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// BOUNDS UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes a LngLatBoundsLike from two coordinate pairs.
 * Compatible with maplibre-gl's map.fitBounds() — replaces google.maps.LatLngBounds.
 *
 * Returns [[minLng, minLat], [maxLng, maxLat]] — MapLibre native format.
 */
export function boundsFromPoints(
  points: LatLng[]
): [[number, number], [number, number]] | null {
  if (!points.length) return null;
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return [[minLng, minLat], [maxLng, maxLat]];
}