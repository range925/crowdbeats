/**
 * Crowdbeats V2 — Server Geocoding & Autocomplete API Proxy (Phase 10)
 *
 * Provider-neutral geocoding endpoint supporting Maptiler, Google Places,
 * Photon, and Curated fallbacks.
 *
 * Features:
 *   1. 3-character threshold enforcement.
 *   2. Server-side in-memory cache (1-hour TTL) for high-frequency queries.
 *   3. Safe API key handling (keys injected server-side).
 *   4. Privacy: raw queries are never stored or logged to a database.
 *   5. Normalized CrowdbeatsSearchResult[] payload.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CURATED_LOCATIONS } from '@/lib/discovery/discoveryClient';
import type { CrowdbeatsSearchResult, CrowdbeatsBounds } from '@/lib/maps/types';
import { resolveGeocoderConfig } from '@/lib/maps/geocoding/geocoderConfig';

// In-memory server cache: key -> { timestamp, data }
interface CacheEntry {
  timestamp: number;
  data: CrowdbeatsSearchResult[];
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, CacheEntry>();

function normalizeMaptiler(feature: any): CrowdbeatsSearchResult {
  const [lng, lat] = feature.center || [0, 0];
  const context = feature.context || [];
  const region = context.find((c: any) => c.id?.startsWith('region.'))?.text;
  const country = context.find((c: any) => c.id?.startsWith('country.'))?.text || '';

  let bounds: CrowdbeatsBounds | undefined;
  if (feature.bbox && feature.bbox.length === 4) {
    bounds = {
      sw: { lat: feature.bbox[1], lng: feature.bbox[0] },
      ne: { lat: feature.bbox[3], lng: feature.bbox[2] },
    };
  }

  return {
    placeId: feature.id || `maptiler_${lat}_${lng}`,
    displayName: feature.place_name || feature.text || '',
    city: feature.text || '',
    administrativeArea: region,
    country,
    coordinate: { lat, lng },
    bounds,
    source: 'maptiler',
  };
}

function getCuratedMatches(query: string): CrowdbeatsSearchResult[] {
  const q = query.toLowerCase();
  return CURATED_LOCATIONS.filter(
    (loc) =>
      loc.city.toLowerCase().includes(q) ||
      loc.displayName.toLowerCase().includes(q) ||
      loc.administrativeArea?.toLowerCase().includes(q) ||
      loc.country.toLowerCase().includes(q)
  ).map((loc) => ({
    placeId: loc.placeId,
    displayName: loc.displayName,
    city: loc.city,
    administrativeArea: loc.administrativeArea,
    country: loc.country,
    coordinate: { lat: loc.latitude, lng: loc.longitude },
    source: 'curated',
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get('q') || '';
  const q = rawQ.trim().slice(0, 100); // max 100 chars, no DB storage

  if (!q || q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = q.toLowerCase();
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ results: cached.data, cached: true });
  }

  const config = resolveGeocoderConfig();

  // ── Maptiler Provider (Default) ───────────────────────────────────────────
  if (config.provider === 'maptiler' || config.provider === 'photon') {
    try {
      const types = 'country,region,subregion,county,joint_municipality,municipality,locality';
      const url = `${config.baseUrl}/${encodeURIComponent(q)}.json?key=${config.apiKey}&types=${types}&limit=8&language=en`;

      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) {
        const fallback = getCuratedMatches(q);
        return NextResponse.json({ results: fallback, source: 'curated_fallback' });
      }

      const data = await res.json();
      const features = data.features || [];
      const results = features.length > 0
        ? features.map(normalizeMaptiler)
        : getCuratedMatches(q);

      // Save to in-memory cache
      cache.set(cacheKey, { timestamp: now, data: results });
      // Limit cache size to prevent unbounded memory growth
      if (cache.size > 1000) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }

      return NextResponse.json({ results, cached: false, source: 'maptiler' });
    } catch {
      const fallback = getCuratedMatches(q);
      return NextResponse.json({ results: fallback, source: 'curated_fallback' });
    }
  }

  // ── Curated / Local Fallback ──────────────────────────────────────────────
  const results = getCuratedMatches(q);
  return NextResponse.json({ results, source: 'curated' });
}
