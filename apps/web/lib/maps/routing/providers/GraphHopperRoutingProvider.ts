/**
 * Crowdbeats Map Engine — GraphHopper Routing Provider (Phase 11)
 *
 * GraphHopper Directions API integration.
 */

import type { ICrowdbeatsRoutingProvider } from '../../interfaces';
import type { CrowdbeatsCoordinate, CrowdbeatsRoute } from '../../types';
import type { RouteMode } from '../types';
import { resolveRoutingConfig } from '../routingConfig';

export class GraphHopperRoutingProvider implements ICrowdbeatsRoutingProvider {
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
      const profile = mode === 'driving' ? 'car' : mode === 'cycling' ? 'bike' : 'foot';
      const points = `point=${origin.lat},${origin.lng}&point=${destination.lat},${destination.lng}`;
      const url = `${this.baseUrl}/route?${points}&profile=${profile}&points_encoded=false&key=${this.apiKey}`;

      const res = await fetch(url, { signal: signal || AbortSignal.timeout(5000) });
      if (!res.ok) return null;

      const data = await res.json();
      const path = data.paths?.[0];
      if (!path) return null;

      const coordinates = path.points?.coordinates as [number, number][];
      const distMeters = path.distance || 0;
      const durMs = path.time || 0;
      const durSec = durMs / 1000;

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
