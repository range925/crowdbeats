/**
 * Crowdbeats Map Engine — OSRM Routing Provider (Phase 11)
 *
 * Open Source Routing Machine HTTP API integration.
 * Supports walking, driving, and cycling profiles with GeoJSON geometry.
 */

import type { ICrowdbeatsRoutingProvider } from '../../interfaces';
import type { CrowdbeatsCoordinate, CrowdbeatsRoute } from '../../types';
import type { RouteMode } from '../types';
import { resolveRoutingConfig } from '../routingConfig';

export class OsrmRoutingProvider implements ICrowdbeatsRoutingProvider {
  readonly providerName = 'maplibre' as const;
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    const cfg = resolveRoutingConfig();
    this.baseUrl = baseUrl || cfg.baseUrl;
  }

  async calculateRoute(
    origin: CrowdbeatsCoordinate,
    destination: CrowdbeatsCoordinate,
    mode: RouteMode = 'walking',
    signal?: AbortSignal
  ): Promise<CrowdbeatsRoute | null> {
    try {
      // OSRM profiles: foot / car / bike (or walking / driving / cycling depending on endpoint)
      const profile = mode === 'driving' ? 'driving' : mode === 'cycling' ? 'cycling' : 'foot';
      const url = `${this.baseUrl}/route/v1/${profile}/${origin.lng.toFixed(6)},${origin.lat.toFixed(6)};${destination.lng.toFixed(6)},${destination.lat.toFixed(6)}?overview=full&geometries=geojson&steps=false`;

      const res = await fetch(url, {
        signal: signal || AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Crowdbeats-MapEngine/2.0' },
      });

      if (!res.ok) return null;
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.[0]) return null;

      const r = data.routes[0];
      const coordinates = r.geometry.coordinates as [number, number][];
      const distMeters = r.distance || 0;
      const durSec = r.duration || 0;

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
