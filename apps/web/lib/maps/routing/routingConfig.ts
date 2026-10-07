/**
 * Crowdbeats Map Engine — Routing Configuration (Phase 11)
 *
 * Configures the active routing engine via environment variables:
 *   ROUTING_PROVIDER: 'osrm' | 'valhalla' | 'graphhopper' | 'maptiler' | 'google'
 *   ROUTING_API_KEY: optional provider key
 *   ROUTING_BASE_URL: optional custom base URL (e.g. self-hosted OSRM or Valhalla)
 */

export type RoutingEngineType = 'osrm' | 'valhalla' | 'graphhopper' | 'maptiler' | 'google';

export interface RoutingConfig {
  provider: RoutingEngineType;
  apiKey: string;
  baseUrl: string;
}

export function resolveRoutingConfig(): RoutingConfig {
  const envProvider = (
    process.env.ROUTING_PROVIDER ||
    process.env.NEXT_PUBLIC_ROUTING_PROVIDER ||
    'osrm'
  ).toLowerCase() as RoutingEngineType;

  const validProviders: RoutingEngineType[] = ['osrm', 'valhalla', 'graphhopper', 'maptiler', 'google'];
  const provider = validProviders.includes(envProvider) ? envProvider : 'osrm';

  const apiKey =
    process.env.ROUTING_API_KEY ||
    process.env.NEXT_PUBLIC_ROUTING_API_KEY ||
    process.env.MAPTILER_API_KEY ||
    process.env.NEXT_PUBLIC_MAPTILER_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    '';

  let defaultBaseUrl = 'https://router.project-osrm.org';
  if (provider === 'valhalla') {
    defaultBaseUrl = 'https://valhalla1.openstreetmap.de';
  } else if (provider === 'graphhopper') {
    defaultBaseUrl = 'https://graphhopper.com/api/1';
  } else if (provider === 'maptiler') {
    defaultBaseUrl = 'https://api.maptiler.com/routing';
  } else if (provider === 'google') {
    defaultBaseUrl = 'https://routes.googleapis.com';
  }

  const baseUrl = process.env.ROUTING_BASE_URL || process.env.NEXT_PUBLIC_ROUTING_BASE_URL || defaultBaseUrl;

  return { provider, apiKey, baseUrl };
}
