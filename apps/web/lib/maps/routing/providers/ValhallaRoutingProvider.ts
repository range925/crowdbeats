/**
 * Crowdbeats Map Engine — Valhalla Routing Provider (Phase 11)
 *
 * OpenStreetMap-based Valhalla routing engine integration.
 */

import type { ICrowdbeatsRoutingProvider } from '../../interfaces';
import type { CrowdbeatsCoordinate, CrowdbeatsRoute } from '../../types';
import type { RouteMode } from '../types';
import { resolveRoutingConfig } from '../routingConfig';

export class ValhallaRoutingProvider implements ICrowdbeatsRoutingProvider {
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
      const costing = mode === 'driving' ? 'auto' : mode === 'cycling' ? 'bicycle' : 'pedestrian';
      const payload = {
        locations: [
          { lat: origin.lat, lon: origin.lng },
          { lat: destination.lat, lon: destination.lng },
        ],
        costing,
        directions_options: { units: 'miles' },
      };

      let url = `${this.baseUrl}/route`;
      if (this.apiKey) url += `?api_key=${this.apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: signal || AbortSignal.timeout(5000),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const trip = data.trip;
      if (!trip || !trip.legs?.[0]) return null;

      const leg = trip.legs[0];
      const shape = leg.shape; // encoded polyline6
      const coordinates = shape ? decodePolyline6(shape) : [[origin.lng, origin.lat], [destination.lng, destination.lat]] as [number, number][];

      const distMiles = trip.summary?.length || 0;
      const durSec = trip.summary?.time || 0;

      const distText = distMiles < 0.1
        ? `${Math.round(distMiles * 5280)} ft`
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

function decodePolyline6(str: string): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];
  const factor = 1e6;

  while (index < str.length) {
    let byte = 0;
    let shift = 0;
    let result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lng / factor, lat / factor]);
  }

  return coordinates;
}
