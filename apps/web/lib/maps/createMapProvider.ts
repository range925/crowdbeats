/**
 * Crowdbeats Map Engine — Provider Factory (Phase 3)
 *
 * Creates the correct provider bundle based on configuration.
 *
 * Configuration priority:
 *   1. Runtime override (explicit parameter)
 *   2. NEXT_PUBLIC_MAP_PROVIDER env variable ('google' | 'maplibre')
 *   3. Legacy: NEXT_PUBLIC_MAP_ENGINE=osm → maps to 'maplibre'
 *   4. URL query param: ?engine=osm | ?provider=maplibre (client-side only)
 *   5. Default: 'google'
 */

import type { CrowdbeatsMapProviderBundle } from './interfaces';
import type { MapProviderName } from './types';
import { CrowdbeatsLocationProvider } from './providers/LocationProvider';

/**
 * Resolves a deterministic 0-99 bucket for gradual A/B rollout without leaking PII.
 */
function getClientRolloutBucket(): number {
  if (typeof window === 'undefined') return 0;
  try {
    let deviceId = localStorage.getItem('cb_map_bucket_id');
    if (!deviceId) {
      deviceId = Math.random().toString(36).slice(2, 10);
      localStorage.setItem('cb_map_bucket_id', deviceId);
    }
    let hash = 0;
    for (let i = 0; i < deviceId.length; i++) {
      hash = ((hash << 5) - hash) + deviceId.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
  } catch {
    return 0;
  }
}

/**
 * Resolves which provider to use based on runtime parameters, URL overrides,
 * environment variables, percentage rollout, and environment defaults.
 */
export function resolveMapProvider(override?: MapProviderName): MapProviderName {
  // 1. Explicit runtime override
  if (override) return override;

  // 2. URL query param override (client-side only for A/B QA and testing)
  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('engine') === 'osm' || sp.get('provider') === 'maplibre') return 'maplibre';
    if (sp.get('provider') === 'google') return 'google';
  }

  // 3. Explicit provider environment variable
  const explicit = process.env.NEXT_PUBLIC_MAP_PROVIDER as MapProviderName | undefined;
  if (explicit === 'google' || explicit === 'maplibre') return explicit;

  // 4. Legacy compatibility with Phase 2 feature flag
  if (process.env.NEXT_PUBLIC_MAP_ENGINE === 'osm') return 'maplibre';

  // 5. Gradual percentage rollout in production (e.g. NEXT_PUBLIC_MAP_ROLLOUT_PERCENTAGE=50)
  const rolloutStr = process.env.NEXT_PUBLIC_MAP_ROLLOUT_PERCENTAGE;
  if (rolloutStr !== undefined && rolloutStr !== '') {
    const percentage = parseInt(rolloutStr, 10);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
      const bucket = getClientRolloutBucket();
      return bucket < percentage ? 'maplibre' : 'google';
    }
  }

  // 6. Environment defaults: dev and staging default to maplibre
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
  if (appEnv === 'development' || appEnv === 'staging' || process.env.NODE_ENV === 'development') {
    return 'maplibre';
  }

  // 7. Production fallback: Google Maps remains default if unconfigured
  return 'google';
}

/**
 * Creates the full provider bundle for the resolved map provider.
 *
 * @example
 * const { map, routing, geocoder } = await createMapProviderBundle();
 * await map.initializeMap(containerEl, { theme: 'dark' });
 */
export async function createMapProviderBundle(
  override?: MapProviderName
): Promise<CrowdbeatsMapProviderBundle> {
  const providerName = resolveMapProvider(override);

  if (providerName === 'maplibre') {
    // Import from the Phase 3 providers/maplibre/ directory
    const { MapLibreMapProvider, primeMapLibreGlobal } = await import('./providers/maplibre');
    const { MapLibreGeocoderProvider, MapLibrePlacesProvider, MapLibreRoutingProvider, MapLibreStyleProvider } =
      await import('./providers/maplibre');

    // Pre-cache maplibre-gl module reference for sync addMarker() calls
    await primeMapLibreGlobal();

    return {
      map: new MapLibreMapProvider(),
      geocoder: new MapLibreGeocoderProvider(),
      places: new MapLibrePlacesProvider(),
      routing: new MapLibreRoutingProvider(),
      location: new CrowdbeatsLocationProvider(),
      style: new MapLibreStyleProvider(),
    };
  }

  // Default: Google Maps
  const {
    GoogleMapsMapProvider,
    GoogleMapsGeocoderProvider,
    GoogleMapsPlacesProvider,
    GoogleMapsRoutingProvider,
    GoogleMapsStyleProvider,
  } = await import('./providers/GoogleMapsProvider');

  return {
    map: new GoogleMapsMapProvider(),
    geocoder: new GoogleMapsGeocoderProvider(),
    places: new GoogleMapsPlacesProvider(),
    routing: new GoogleMapsRoutingProvider(),
    location: new CrowdbeatsLocationProvider(),
    style: new GoogleMapsStyleProvider(),
  };
}

/**
 * Creates only the services (no map canvas). Safe for SSR context.
 */
export async function createServiceOnlyBundle(override?: MapProviderName) {
  const bundle = await createMapProviderBundle(override);
  return {
    geocoder: bundle.geocoder,
    places: bundle.places,
    routing: bundle.routing,
    location: bundle.location,
  };
}