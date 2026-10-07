/**
 * Crowdbeats Map Engine — Google Routing Provider (Phase 11 Migration Safeguard)
 *
 * Google Routes API (computeRoutes) backward-compatible wrapper.
 */

import type { ICrowdbeatsRoutingProvider } from '../../interfaces';
import type { CrowdbeatsCoordinate, CrowdbeatsRoute } from '../../types';
import type { RouteMode } from '../types';
import { resolveRoutingConfig } from '../routingConfig';

export class GoogleRoutingProvider implements ICrowdbeatsRoutingProvider {
  readonly providerName = 'google' as const;
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    const cfg = resolveRoutingConfig();
    this.apiKey = apiKey || cfg.apiKey;
  }

  async calculateRoute(
    origin: CrowdbeatsCoordinate,
    destination: CrowdbeatsCoordinate,
    mode: RouteMode = 'walking',
    signal?: AbortSignal
  ): Promise<CrowdbeatsRoute | null> {
    if (!this.apiKey) return null;

    try {
      const travelMode = mode === 'driving' ? 'DRIVE' : mode === 'cycling' ? 'BICYCLE' : 'WALK';
      const payload = {
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode,
        routingPreference: 'ROUTING_PREFERENCE_UNSPECIFIED',
        languageCode: 'en-US',
        units: 'IMPERIAL',
      };

      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify(payload),
        signal: signal || AbortSignal.timeout(5000),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) return null;

      const encodedPolyline = route.polyline?.encodedPolyline || '';
      const points = encodedPolyline ? decodeGooglePolyline(encodedPolyline) : [];
      const coordinates: [number, number][] = points.map((p) => [p.lng, p.lat]);

      const distMeters = route.distanceMeters || 0;
      const durSec = parseInt((route.duration || '0s').replace('s', ''), 10) || 0;

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
        durationSeconds: durSec,
        mode,
      };
    } catch {
      return null;
    }
  }
}

function decodeGooglePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}
