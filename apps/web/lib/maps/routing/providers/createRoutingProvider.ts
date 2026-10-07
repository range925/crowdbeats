/**
 * Crowdbeats Map Engine — Routing Provider Factory & Geodesic Fallback (Phase 11)
 *
 * Instantiates the configured routing engine with automated fallback to
 * straight-line geodesic interpolation if the remote engine is offline or fails.
 */

import type { ICrowdbeatsRoutingProvider } from '../../interfaces';
import type { CrowdbeatsCoordinate, CrowdbeatsRoute } from '../../types';
import type { RouteMode } from '../types';
import { resolveRoutingConfig } from '../routingConfig';
import { OsrmRoutingProvider } from './OsrmRoutingProvider';
import { ValhallaRoutingProvider } from './ValhallaRoutingProvider';
import { GraphHopperRoutingProvider } from './GraphHopperRoutingProvider';
import { MaptilerRoutingProvider } from './MaptilerRoutingProvider';
import { GoogleRoutingProvider } from './GoogleRoutingProvider';

export function calculateStraightLineFallback(
  origin: CrowdbeatsCoordinate,
  destination: CrowdbeatsCoordinate,
  mode: RouteMode = 'walking'
): CrowdbeatsRoute {
  // Haversine distance in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.lat)) *
      Math.cos(toRad(destination.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distMiles = R * c;

  // Speeds: walking ~3.1 mph, cycling ~12 mph, driving ~25 mph
  const speedMph = mode === 'driving' ? 25 : mode === 'cycling' ? 12 : 3.1;
  const durationSec = Math.max(60, Math.round((distMiles / speedMph) * 3600));

  const distText = distMiles < 0.1
    ? `${Math.round(distMiles * 5280)} ft`
    : `${distMiles.toFixed(1)} mi`;

  const dMin = Math.ceil(durationSec / 60);
  const suffix = mode === 'driving' ? 'drive' : mode === 'cycling' ? 'bike' : 'walk';
  const durText = dMin <= 1 ? `< 1 min ${suffix}` : `${dMin} min ${suffix}`;

  // Interpolate 5 points for smooth straight line
  const coordinates: [number, number][] = [];
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    coordinates.push([
      origin.lng + (destination.lng - origin.lng) * frac,
      origin.lat + (destination.lat - origin.lat) * frac,
    ]);
  }

  return {
    coordinates,
    origin,
    destination,
    durationText: durText,
    distanceMilesText: distText,
    distanceMiles: parseFloat(distMiles.toFixed(2)),
    durationSeconds: durationSec,
    mode,
  };
}

export class CompositeRoutingProvider implements ICrowdbeatsRoutingProvider {
  readonly providerName = 'maplibre' as const;
  private primary: ICrowdbeatsRoutingProvider;

  constructor() {
    const cfg = resolveRoutingConfig();
    if (cfg.provider === 'valhalla') {
      this.primary = new ValhallaRoutingProvider(cfg.apiKey, cfg.baseUrl);
    } else if (cfg.provider === 'graphhopper') {
      this.primary = new GraphHopperRoutingProvider(cfg.apiKey, cfg.baseUrl);
    } else if (cfg.provider === 'maptiler') {
      this.primary = new MaptilerRoutingProvider(cfg.apiKey, cfg.baseUrl);
    } else if (cfg.provider === 'google') {
      this.primary = new GoogleRoutingProvider(cfg.apiKey);
    } else {
      this.primary = new OsrmRoutingProvider(cfg.baseUrl);
    }
  }

  async calculateRoute(
    origin: CrowdbeatsCoordinate,
    destination: CrowdbeatsCoordinate,
    mode: RouteMode = 'walking',
    signal?: AbortSignal
  ): Promise<CrowdbeatsRoute | null> {
    try {
      const route = await this.primary.calculateRoute(origin, destination, mode, signal);
      if (route && route.coordinates.length >= 2) {
        return route;
      }
    } catch {
      // Primary failed
    }

    return null;
  }
}

export function createRoutingProvider(): ICrowdbeatsRoutingProvider {
  return new CompositeRoutingProvider();
}
