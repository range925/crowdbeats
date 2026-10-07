/**
 * Crowdbeats Map Engine — Vector Tile Style Proxy (Phase 5)
 *
 * Returns a Crowdbeats-branded MapLibre GL style JSON.
 * Process: fetch Maptiler base → apply Crowdbeats theme overrides → return.
 *
 * GET /api/maps/style?theme=dark|light
 *
 * Optional params:
 *   ?raw=1     → skip Crowdbeats override, return raw Maptiler style (dev/debug)
 *   ?fallback=1 → return OSM raster fallback (no API key needed)
 *
 * Security:
 *   - MAP_TILE_API_KEY never reaches the client bundle
 *   - Tile URLs in the returned style use NEXT_PUBLIC_MAPTILER_CLIENT_KEY (domain-restricted)
 *   - Cache-Control: 1h client, 24h CDN — style changes with Maptiler updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyTheme } from '@/lib/maps/theme';
import { OSM_RASTER_FALLBACK_STYLE, CROWDBEATS_ATTRIBUTION_HTML } from '@/lib/maps/tiles/tileConfig';

const SERVER_KEY   = process.env.MAP_TILE_API_KEY ?? process.env.MAPTILER_API_KEY ?? '';
const CLIENT_KEY   = process.env.NEXT_PUBLIC_MAPTILER_CLIENT_KEY ?? process.env.MAP_TILE_API_KEY ?? process.env.MAPTILER_API_KEY ?? '';
const PROXY_TILES  = process.env.MAP_TILE_PROXY_TILES === 'true';

const MAPTILER_STYLES: Record<string, string> = {
  dark:  'https://api.maptiler.com/maps/streets-v2-dark/style.json',
  light: 'https://api.maptiler.com/maps/streets-v2/style.json',
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const theme      = searchParams.get('theme') === 'light' ? 'light' : 'dark';
  const raw        = searchParams.get('raw') === '1';
  const fallback   = searchParams.get('fallback') === '1';

  // ── Fallback: OSM raster (no key / dev without credentials) ────────────────
  if (!SERVER_KEY || fallback) {
    return NextResponse.json(OSM_RASTER_FALLBACK_STYLE, {
      headers: cacheHeaders('fallback-osm-raster', 300),
    });
  }

  // ── Fetch upstream Maptiler style ───────────────────────────────────────────
  const upstreamUrl = `${MAPTILER_STYLES[theme]}?key=${SERVER_KEY}`;

  let styleJson: Record<string, unknown>;
  try {
    const res = await fetch(upstreamUrl, {
      headers: { 'User-Agent': 'Crowdbeats-MapEngine/5.0' },
      signal: AbortSignal.timeout(8000),
      // Next.js data cache: revalidate upstream every 24h
      next: { revalidate: 86400 },
    } as RequestInit);

    if (!res.ok) {
      console.error('[MapStyle] Upstream error', res.status);
      return NextResponse.json(OSM_RASTER_FALLBACK_STYLE, {
        headers: cacheHeaders('fallback-upstream', 60),
      });
    }

    styleJson = await res.json() as Record<string, unknown>;
  } catch (err) {
    console.error('[MapStyle] Fetch failed:', err);
    return NextResponse.json(OSM_RASTER_FALLBACK_STYLE, {
      headers: cacheHeaders('fallback-error', 30),
    });
  }

  // ── Swap API key in tile source URLs ───────────────────────────────────────
  // SERVER_KEY used for upstream fetch; CLIENT_KEY goes into tile URLs sent to browser.
  if (SERVER_KEY !== CLIENT_KEY) {
    const styleStr = JSON.stringify(styleJson);
    styleJson = JSON.parse(styleStr.replaceAll(
      `key=${SERVER_KEY}`, `key=${CLIENT_KEY}`
    )) as Record<string, unknown>;
  }

  // ── Optional: rewrite tiles through our proxy (MAP_TILE_PROXY_TILES=true) ──
  if (PROXY_TILES) {
    styleJson = rewriteToProxy(styleJson, CLIENT_KEY) as Record<string, unknown>;
  }

  // ── Apply Crowdbeats brand theme overrides ──────────────────────────────────
  const branded = raw ? styleJson : applyTheme(styleJson, theme);

  // ── Inject attribution ─────────────────────────────────────────────────────
  branded.attribution = CROWDBEATS_ATTRIBUTION_HTML;

  return NextResponse.json(branded, {
    headers: {
      ...cacheHeaders(`crowdbeats-${theme}${raw ? '-raw' : ''}`, 3600),
      'X-Crowdbeats-Map-Theme': theme,
      'X-Crowdbeats-Branded': raw ? 'false' : 'true',
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cacheHeaders(engine: string, maxAge: number): Record<string, string> {
  return {
    'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge * 24}, stale-while-revalidate=86400`,
    'X-Crowdbeats-Map-Engine': engine,
    'Vary': 'Accept-Encoding',
  };
}

function rewriteToProxy(style: Record<string, unknown>, key: string): Record<string, unknown> {
  const s = JSON.stringify(style)
    .replace(/https:\/\/api\.maptiler\.com\/tiles\/([^?]+)\?key=[^"]+/g,
      (_, p) => `/api/maps/tiles/tiles/${p}`)
    .replace(/https:\/\/api\.maptiler\.com\/fonts\/([^?]+)\?key=[^"]+/g,
      (_, p) => `/api/maps/tiles/fonts/${p}`);
  void key;
  return JSON.parse(s) as Record<string, unknown>;
}
