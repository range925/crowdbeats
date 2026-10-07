/**
 * Crowdbeats Map Engine — Tile Provider Configuration (Phase 4)
 *
 * Provider-neutral tile configuration factory.
 * Supports environment-variable-driven provider switching
 * so no map component code changes when the tile vendor changes.
 *
 * Environment variables (all optional — sane defaults apply):
 *   MAP_TILE_PROVIDER          = 'maptiler' | 'custom' | 'osm-raster'
 *   MAP_TILE_API_KEY           = server-only tile provider API key (overrides MAPTILER_API_KEY)
 *   MAP_TILE_STYLE_URL         = single style URL (applies to both themes)
 *   MAP_TILE_DARK_STYLE_URL    = custom dark theme style URL
 *   MAP_TILE_LIGHT_STYLE_URL   = custom light theme style URL
 *
 * ─── Security Model ───────────────────────────────────────────────────────────
 *
 *   Server-only (NEVER in JS bundle):
 *     - MAP_TILE_API_KEY / MAPTILER_API_KEY
 *     Used by: /api/maps/style route to fetch GL style JSON from Maptiler
 *
 *   Client-accessible (domain-restricted via Maptiler dashboard):
 *     - NEXT_PUBLIC_MAPTILER_CLIENT_KEY
 *     Used by: tile source URLs in the style JSON returned to the browser
 *     Note: Even if extracted, a domain-restricted key cannot be used off-domain.
 *
 *   For maximum security: set MAP_TILE_PROXY_TILES=true (see /api/maps/tiles)
 *   which routes all tile fetches through Next.js server — fully key-less client.
 *   Trade-off: higher latency, higher server cost. Suitable for enterprise plan.
 */

export type TileProvider = 'maptiler' | 'custom' | 'osm-raster';

export type MapTheme = 'dark' | 'light';

/** Resolved, validated tile configuration. Computed at build/request time (server). */
export interface TileConfig {
  /** Which tile vendor is active. */
  provider: TileProvider;
  /** GL style URL for dark theme (fed to MapLibre map.setStyle()). */
  darkStyleUrl: string;
  /** GL style URL for light theme. */
  lightStyleUrl: string;
  /** Full legal attribution HTML string (shown in MapLibre attribution control). */
  attribution: string;
  /** Plain-text attribution for aria labels and non-HTML contexts. */
  attributionPlain: string;
  /** True if tiles are proxied server-side via /api/maps/tiles (fully key-less client). */
  tilesProxied: boolean;
}

// ── Attribution constants ─────────────────────────────────────────────────────

/** ODbL license — REQUIRED on every map surface using OpenStreetMap data. */
export const OSM_ATTRIBUTION_HTML =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

export const OSM_ATTRIBUTION_PLAIN = '© OpenStreetMap contributors';

export const MAPTILER_ATTRIBUTION_HTML =
  '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">MapTiler</a>';

export const MAPTILER_ATTRIBUTION_PLAIN = '© MapTiler';

export const CROWDBEATS_ATTRIBUTION_HTML =
  `${OSM_ATTRIBUTION_HTML} | ${MAPTILER_ATTRIBUTION_HTML}`;

export const CROWDBEATS_ATTRIBUTION_PLAIN =
  `${OSM_ATTRIBUTION_PLAIN} | ${MAPTILER_ATTRIBUTION_PLAIN}`;

// ── Maptiler style catalogue ──────────────────────────────────────────────────
// Phase 5 will add custom Crowdbeats-branded styles. Until then, use Maptiler presets.

export const MAPTILER_BASE = 'https://api.maptiler.com/maps';

/** Maptiler style IDs → GL style JSON paths. */
export const MAPTILER_STYLE_IDS = {
  // Dark theme — primary Crowdbeats look
  dark: 'streets-v2-dark',     // Deep dark, good contrast, hides non-essential POIs
  // Light theme — for light mode / print
  light: 'streets-v2',         // Clean OSM streets
  // Alternatives (can be overridden via MAP_TILE_DARK_STYLE_URL):
  datavizDark: 'dataviz-dark', // Ultra-minimal, data-focused
  dataviz: 'dataviz',
  toner: 'toner-v2',           // High contrast B&W
  satellite: 'satellite',
} as const;

// ── OSM raster fallback style ─────────────────────────────────────────────────
// Used when no tile provider key is available (development without credentials).

export const OSM_RASTER_FALLBACK_STYLE = {
  version: 8 as const,
  name: 'Crowdbeats OSM Fallback',
  attribution: OSM_ATTRIBUTION_HTML,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'osm-raster': {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: OSM_ATTRIBUTION_HTML,
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'background', type: 'background' as const, paint: { 'background-color': '#0b0c10' } },
    { id: 'osm-raster', type: 'raster' as const, source: 'osm-raster', paint: { 'raster-opacity': 0.85 } },
  ],
};

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Resolves the tile configuration from environment variables.
 *
 * Call only from server-side code (API routes, Server Components).
 * API key values must NEVER reach client components.
 */
export function resolveTileConfig(): TileConfig {
  const provider = (process.env.MAP_TILE_PROVIDER ?? 'maptiler') as TileProvider;
  const apiKey = process.env.MAP_TILE_API_KEY ?? process.env.MAPTILER_API_KEY ?? '';
  const tilesProxied = process.env.MAP_TILE_PROXY_TILES === 'true';

  // ── Custom override (highest priority) ──────────────────────────────────────
  if (process.env.MAP_TILE_DARK_STYLE_URL && process.env.MAP_TILE_LIGHT_STYLE_URL) {
    return {
      provider: 'custom',
      darkStyleUrl: process.env.MAP_TILE_DARK_STYLE_URL,
      lightStyleUrl: process.env.MAP_TILE_LIGHT_STYLE_URL,
      attribution: process.env.MAP_TILE_ATTRIBUTION ?? CROWDBEATS_ATTRIBUTION_HTML,
      attributionPlain: CROWDBEATS_ATTRIBUTION_PLAIN,
      tilesProxied,
    };
  }

  if (process.env.MAP_TILE_STYLE_URL) {
    return {
      provider: 'custom',
      darkStyleUrl: process.env.MAP_TILE_STYLE_URL,
      lightStyleUrl: process.env.MAP_TILE_STYLE_URL,
      attribution: process.env.MAP_TILE_ATTRIBUTION ?? CROWDBEATS_ATTRIBUTION_HTML,
      attributionPlain: CROWDBEATS_ATTRIBUTION_PLAIN,
      tilesProxied,
    };
  }

  // ── Maptiler ────────────────────────────────────────────────────────────────
  if (provider === 'maptiler' && apiKey) {
    return {
      provider: 'maptiler',
      darkStyleUrl: `${MAPTILER_BASE}/${MAPTILER_STYLE_IDS.dark}/style.json`,
      lightStyleUrl: `${MAPTILER_BASE}/${MAPTILER_STYLE_IDS.light}/style.json`,
      attribution: CROWDBEATS_ATTRIBUTION_HTML,
      attributionPlain: CROWDBEATS_ATTRIBUTION_PLAIN,
      tilesProxied,
    };
  }

  // ── OSM raster fallback ──────────────────────────────────────────────────────
  return {
    provider: 'osm-raster',
    darkStyleUrl: '/api/maps/style?theme=dark&fallback=1',
    lightStyleUrl: '/api/maps/style?theme=light&fallback=1',
    attribution: OSM_ATTRIBUTION_HTML,
    attributionPlain: OSM_ATTRIBUTION_PLAIN,
    tilesProxied: false,
  };
}

/**
 * Returns the canonical style URL for a given theme.
 * This URL always points to our server-side proxy — never directly to Maptiler.
 * The proxy injects the API key, applies caching, and handles fallbacks.
 */
export function getClientStyleUrl(theme: MapTheme, version = 'v1'): string {
  return `/api/maps/style?theme=${theme}&v=${version}`;
}
