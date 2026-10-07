/**
 * Crowdbeats Map Engine — Maptiler Geocoder Provider (Phase 10)
 *
 * Production-ready OpenStreetMap-derived geocoding via Maptiler Geocoding API.
 * Supports City, Town, State, Region, and Country searches with high-speed CDN caching.
 * Falls back to CURATED_LOCATIONS if offline or during network failures.
 */

import type { ICrowdbeatsGeocoderProvider } from '../interfaces';
import type { CrowdbeatsCoordinate, CrowdbeatsSearchResult, CrowdbeatsBounds } from '../types';
import { CURATED_LOCATIONS } from '@/lib/discovery/discoveryClient';
import { resolveGeocoderConfig } from './geocoderConfig';

export function normalizeMaptilerFeature(feature: any): CrowdbeatsSearchResult {
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

export class MaptilerGeocoderProvider implements ICrowdbeatsGeocoderProvider {
  readonly providerName = 'maplibre' as const;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    const cfg = resolveGeocoderConfig();
    this.apiKey = apiKey || cfg.apiKey;
    this.baseUrl = baseUrl || cfg.baseUrl;
  }

  async searchLocation(query: string, signal?: AbortSignal): Promise<CrowdbeatsSearchResult[]> {
    const q = query.trim();
    if (!q || q.length < 3) return [];

    try {
      const types = 'country,region,subregion,county,joint_municipality,municipality,locality';
      const url = `${this.baseUrl}/${encodeURIComponent(q)}.json?key=${this.apiKey}&types=${types}&limit=8&language=en`;

      const res = await fetch(url, { signal: signal || AbortSignal.timeout(4000) });
      if (!res.ok) {
        return this.curatedFallback(q);
      }

      const data = await res.json();
      const features = data.features || [];
      if (features.length === 0) {
        return this.curatedFallback(q);
      }

      return features.map(normalizeMaptilerFeature);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      return this.curatedFallback(q);
    }
  }

  async resolvePlaceId(placeId: string, signal?: AbortSignal): Promise<CrowdbeatsSearchResult | null> {
    if (!placeId) return null;

    // Check curated locations first
    const curated = CURATED_LOCATIONS.find((c) => c.placeId === placeId);
    if (curated) {
      return {
        placeId: curated.placeId,
        displayName: curated.displayName,
        city: curated.city,
        administrativeArea: curated.administrativeArea,
        country: curated.country,
        coordinate: { lat: curated.latitude, lng: curated.longitude },
        source: 'curated',
      };
    }

    // Try Maptiler single feature lookup
    try {
      const url = `${this.baseUrl}/${encodeURIComponent(placeId)}.json?key=${this.apiKey}`;
      const res = await fetch(url, { signal: signal || AbortSignal.timeout(4000) });
      if (!res.ok) return null;

      const data = await res.json();
      const feature = data.features?.[0];
      return feature ? normalizeMaptilerFeature(feature) : null;
    } catch {
      return null;
    }
  }

  async reverseGeocode(coord: CrowdbeatsCoordinate, signal?: AbortSignal): Promise<CrowdbeatsSearchResult | null> {
    try {
      const url = `${this.baseUrl}/${coord.lng},${coord.lat}.json?key=${this.apiKey}&limit=1`;
      const res = await fetch(url, { signal: signal || AbortSignal.timeout(4000) });
      if (!res.ok) return null;

      const data = await res.json();
      const feature = data.features?.[0];
      return feature ? normalizeMaptilerFeature(feature) : null;
    } catch {
      return null;
    }
  }

  private curatedFallback(query: string): CrowdbeatsSearchResult[] {
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
}
