/**
 * Crowdbeats Map Engine — Public API
 *
 * Feature components should import ONLY from this file (or ./types / ./interfaces).
 * Never import directly from ./providers/* or ./engine/*.
 */

// Types
export type {
  CrowdbeatsCoordinate,
  CrowdbeatsBounds,
  CrowdbeatsMapMarker,
  CrowdbeatsArtistMarker,
  CrowdbeatsBandMarker,
  CrowdbeatsVenueMarker,
  CrowdbeatsUserMarker,
  CrowdbeatsLiveMarker,
  CrowdbeatsCluster,
  CrowdbeatsRoute,
  CrowdbeatsSearchResult,
  MapInitOptions,
  EaseOptions,
  MapTheme,
  MapProviderName,
  MapProviderConfig,
  CrowdbeatsLayerSpec,
  CrowdbeatsLayerType,
} from './types';
export { CrowdbeatsMapError, MapNotInitializedError, ProviderNotReadyError } from './types';

// Interfaces
export type {
  ICrowdbeatsMapProvider,
  ICrowdbeatsGeocoderProvider,
  ICrowdbeatsPlacesProvider,
  ICrowdbeatsRoutingProvider,
  ICrowdbeatsLocationProvider,
  ICrowdbeatsStyleProvider,
  CrowdbeatsMapProviderBundle,
  CrowdbeatsMapEvent,
  CrowdbeatsMapEventCallback,
  CrowdbeatsMapEventPayload,
} from './interfaces';

// Factory
export { createMapProviderBundle, createServiceOnlyBundle, resolveMapProvider } from './createMapProvider';

// Utilities (coordinate math — no vendor dependency)
export { haversineDistanceMiles, requestGeolocation, getWalkingRoute } from './engine/crowdbeatsMapEngine';

// Location provider (shared, no vendor dependency)
export { CrowdbeatsLocationProvider, locationProvider } from './providers/LocationProvider';

// Attribution constants (required for OSM compliance)
export { OSM_ATTRIBUTION, MAPTILER_ATTRIBUTION, CROWDBEATS_ATTRIBUTION } from './engine/crowdbeatsMapEngine';

// Observability & Telemetry (Phase 12)
export * from './observability';