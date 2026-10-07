/**
 * Crowdbeats Map Engine — Server-Side Tile Proxy (Phase 4)
 *
 * Routes ALL MapLibre tile requests through Next.js server.
 * The Maptiler API key is NEVER in the client bundle.
 *
 * Enabled when: MAP_TILE_PROXY_TILES=true in environment
 * Default: DISABLED (tiles go directly to Maptiler CDN with domain-restricted client key)
 *
 * URL patterns proxied:
 *   /api/maps/tiles/map/{mapId}/          → Maptiler map style resources
 *   /api/maps/tiles/tiles/{z}/{x}/{y}.*   → Vector tile pbf files
 *   /api/maps/tiles/fonts/{fontstack}/{range}.pbf → Glyphs
 *   /api/maps/tiles/sprites/{sprite}.*    → Sprites
 *
 * Performance characteristics:
 *   - Adds ~20-80ms RTT per tile vs direct CDN
 *   - Enables aggressive server-side caching (CDN layer)
 *   - Not recommended for high-traffic production without Vercel Edge/CDN
 *   - Suitable for: internal tools, enterprise clients, strict security environments
 */

import { NextRequest, NextResponse } from 'next/server';

const SERVER_KEY =
  process.env.MAP_TILE_API_KEY ??
  process.env.MAPTILER_API_KEY ??
  '';

const PROXY_ENABLED = process.env.MAP_TILE_PROXY_TILES === 'true';

const MAPTILER_API = 'https://api.maptiler.com';

// Content-type map for tile resources
const CONTENT_TYPES: Record<string, string> = {
  'pbf': 'application/x-protobuf',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'webp': 'image/webp',
  'json': 'application/json',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  // This proxy is opt-in — if disabled, return helpful error
  if (!PROXY_ENABLED) {
    return NextResponse.json(
      { error: 'Tile proxy disabled. Set MAP_TILE_PROXY_TILES=true to enable.' },
      { status: 404 }
    );
  }

  if (!SERVER_KEY) {
    return NextResponse.json(
      { error: 'Tile provider not configured' },
      { status: 503 }
    );
  }

  const { path: pathSegments } = await params;
  const tilePath = pathSegments.join('/');

  // Reconstruct the Maptiler upstream URL
  // e.g. /api/maps/tiles/tiles/15/5423/12987.pbf → https://api.maptiler.com/tiles/15/5423/12987.pbf?key=KEY
  const upstreamUrl = `${MAPTILER_API}/${tilePath}?key=${SERVER_KEY}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Crowdbeats-TileProxy/4.0',
        // Forward conditional request headers for cache efficiency
        ...(request.headers.get('If-None-Match') ? { 'If-None-Match': request.headers.get('If-None-Match')! } : {}),
        ...(request.headers.get('If-Modified-Since') ? { 'If-Modified-Since': request.headers.get('If-Modified-Since')! } : {}),
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    // Detect content type from path extension or upstream header
    const ext = tilePath.split('.').pop()?.toLowerCase() ?? '';
    const contentType = CONTENT_TYPES[ext] ?? upstream.headers.get('content-type') ?? 'application/octet-stream';
    const upstreamCache = upstream.headers.get('cache-control') ?? 'public, max-age=86400';

    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': upstreamCache,
        'X-Crowdbeats-Tile-Proxy': '1',
        // Forward ETag for conditional request caching
        ...(upstream.headers.get('ETag') ? { 'ETag': upstream.headers.get('ETag')! } : {}),
      },
    });
  } catch (err) {
    console.error('[TileProxy] Fetch failed:', tilePath, err);
    return new NextResponse(null, { status: 502 });
  }
}
