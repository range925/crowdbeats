/**
 * Crowdbeats Map Engine — Maptiler Routing Provider (Phase 11)
 *
 * Maptiler Directions API (OSM-based) integration.
 */

import type { ICrowdbeatsRoutingProvider } from '../../interfaces';
import type { CrowdbeatsCoordinate, CrowdbeatsRoute } from '../../types';
import type { RouteMode } from '../types';
import { resolveRoutingConfig } from '../routingConfig';

export class MaptilerRoutingProvider implements ICrowdbeatsRoutingProvider {
  readonly providerName = 'maplibre' as const;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey?: string, baseUrl?: string) {
    const cfg = resolveRoutingConfig();
    this.apiKey = apiKey || cfg.apiKey;
    this.baseUrl = baseUrl || cfg.baseUrl;
  }

  async calculateRoute(
    origin: CrowdbeatsCoordinate,
    destination: CrowdbeatsCoordinate,
    mode: RouteMode = 'walking',
    signal?: AbortSignal
  ): Promise<CrowdbeatsRoute | null> {
    try {
      const profile = mode === 'driving' ? 'driving' : mode === 'cycling' ? 'cycling' : 'walking';
      const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
      const url = `${this.baseUrl}/${profile}/${coords}.json?key=${this.apiKey}&geometries=geojson&overview=full`;

      const res = await fetch(url, { signal: signal || AbortSignal.timeout(5000) });
      if (!res.ok) return null;

      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) return null;

      const coordinates = route.geometry?.coordinates as [number, number][];
      const distMeters = route.distance || 0;
      const durSec = route.duration || 0;

      const distMiles = distMeters * 0.000621371;
      const distText = distMiles < 0.1
        ? `${Math.round(distMeters * 3.28084)} ft`
        : `${distMiles.toFixed(1)} mi`;

      const dMin = Math.ceil(durSec / 60);
      const suffix = mode === 'driving' ? 'drive' : mode === 'cycling' ? 'bike' : 'walk';
      const durText = dMin <= 1 ? `< 1 min ${suffix}` : `${dMin} min ${suffix}`;

      return {
        coordinates,
        origin,
        destination,
        durationText: durText,
        distanceMilesText: distText,
        distanceMiles: parseFloat(distMiles.toFixed(2)),
        durationSeconds: Math.round(durSec),
        mode,
      };
    } catch {
      return null;
    }
  }
}
