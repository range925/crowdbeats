import { NextRequest, NextResponse } from 'next/server';

const CARTO_API_KEY =
  process.env.CARTO_BASEMAPS_API_KEY ||
  process.env.NEXT_PUBLIC_CARTO_API_KEY ||
  'cb1_3sx1_1_d15f7a426e1a611446357f2b';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path: pathSegments } = await params;
  const joinedPath = pathSegments.join('/');

  // Reconstruct the CARTO basemap upstream URL
  // e.g. /api/maps/carto/rastertiles/dark_all/14/2859/6614.png
  // → https://basemaps.cartocdn.com/rastertiles/dark_all/14/2859/6614.png?key=...
  const upstreamUrl = `https://basemaps.cartocdn.com/${joinedPath}?key=${CARTO_API_KEY}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'Referer': 'https://crowdbeats.ai/',
        'User-Agent': 'Crowdbeats-Web/2.0 (info@crowdbeats.ai)',
        ...(request.headers.get('If-None-Match') ? { 'If-None-Match': request.headers.get('If-None-Match')! } : {}),
        ...(request.headers.get('If-Modified-Since') ? { 'If-Modified-Since': request.headers.get('If-Modified-Since')! } : {}),
      },
      signal: AbortSignal.timeout(8000),
    });

    if (upstream.ok) {
      const body = await upstream.arrayBuffer();
      const contentType = upstream.headers.get('content-type') || 'image/png';
      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          'X-Crowdbeats-Tile-Proxy': 'carto-verified',
          ...(upstream.headers.get('ETag') ? { ETag: upstream.headers.get('ETag')! } : {}),
        },
      });
    }

    console.warn(`[CARTO Tile Proxy] Upstream returned status ${upstream.status} for ${joinedPath}, falling back to OSM`);
  } catch (err) {
    console.error(`[CARTO Tile Proxy] Upstream fetch error for ${joinedPath}:`, err);
  }

  // Graceful Fallback to Standard OpenStreetMap if CARTO is unreachable or restricted
  const tileCoordMatch = joinedPath.match(/(\d+)\/(\d+)\/(\d+)\.(png|jpg|webp)/);
  if (tileCoordMatch) {
    const [, z, x, y] = tileCoordMatch;
    try {
      const osmFallback = await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, {
        headers: {
          'User-Agent': 'Crowdbeats-Web/2.0 (info@crowdbeats.ai)',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (osmFallback.ok) {
        const body = await osmFallback.arrayBuffer();
        return new NextResponse(body, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400',
            'X-Crowdbeats-Tile-Proxy': 'osm-fallback',
          },
        });
      }
    } catch (fallbackErr) {
      console.error('[CARTO Tile Proxy] Fallback OSM fetch failed:', fallbackErr);
    }
  }

  return new NextResponse('Tile not found', { status: 404 });
}
