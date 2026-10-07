/**
 * Crowdbeats Map Engine — Provider Interfaces
 *
 * These interfaces are the contract between Crowdbeats business logic and
 * any underlying mapping library (Google Maps, MapLibre, etc.).
 *
 * Rule: Feature components may ONLY depend on these interfaces and the types
 * in types.ts. Provider-specific code lives exclusively in providers/.
 */

import type {
  CrowdbeatsCoordinate,
  CrowdbeatsBounds,
  CrowdbeatsMapMarker,
  CrowdbeatsRoute,
  CrowdbeatsSearchResult,
  CrowdbeatsLayerSpec,
  MapInitOptions,
  EaseOptions,
  FlyToOptions,
  MapProviderName,
} from './types';

// ─── Map Rendering Provider ───────────────────────────────────────────────────

/**
 * Controls the map canvas: initialization, camera, markers, layers, routes.
 */
export interface ICrowdbeatsMapProvider {
  readonly providerName: MapProviderName;
  readonly isInitialized: boolean;

  /** Initialize the map in the given container element. Must be called before any other method. */
  initializeMap(container: HTMLElement, options?: MapInitOptions): Promise<void>;

  /** Tear down the map and release all resources. Safe to call multiple times. */
  destroyMap(): void;

  // ── Camera ───────────────────────────────────────────────────────────────

  /** Animate map center to coordinate with optional zoom or camera animation options. */
  flyTo(coord: CrowdbeatsCoordinate, zoomOrOptions?: number | FlyToOptions): void;

  /** Smooth pan (no zoom change by default). Supports offset, duration, and easing. */
  easeTo(coord: CrowdbeatsCoordinate, options?: EaseOptions): void;

  /**
   * Centers the camera on a marker with vertical offset compensation
   * (reserving space for a bottom sheet so the marker is never obscured).
   */
  centerOnMarker(coord: CrowdbeatsCoordinate, options?: EaseOptions): void;

  /** Fit the viewport to a bounding box with optional pixel padding. */
  fitBounds(bounds: CrowdbeatsBounds, padding?: number): void;

  setZoom(zoom: number): void;
  getZoom(): number;
  getCenter(): CrowdbeatsCoordinate;
  /** Returns the current geographic bounding box of the map viewport. */
  getBounds(): CrowdbeatsBounds;

  // ── Markers ──────────────────────────────────────────────────────────────

  /** Add a marker to the map. Returns the assigned marker ID. */
  addMarker(marker: CrowdbeatsMapMarker): string;

  /** Remove a marker by its ID. No-op if not found. */
  removeMarker(markerId: string): void;

  /** Update a marker's position or data in-place. */
  updateMarker(markerId: string, updates: Partial<CrowdbeatsMapMarker>): void;

  /** Visually highlight a marker as selected. */
  selectMarker(markerId: string): void;

  /** Remove the selected state from a marker. */
  deselectMarker(markerId: string): void;

  /** Remove all markers from the map. */
  clearAllMarkers(): void;

  // ── Layers & GeoJSON ─────────────────────────────────────────────────────

  addGeoJsonSource(id: string, data: object): void;
  updateGeoJsonSource(id: string, data: object): void;
  removeGeoJsonSource(id: string): void;
  addLayer(layer: CrowdbeatsLayerSpec): void;
  removeLayer(layerId: string): void;

  // ── Routes ───────────────────────────────────────────────────────────────

  /** Render a route on the map. Replaces any previously shown route. */
  showRoute(route: CrowdbeatsRoute): void;

  /** Remove the route line from the map. */
  clearRoute(): void;

  // ── Events ───────────────────────────────────────────────────────────────

  on(event: CrowdbeatsMapEvent, callback: CrowdbeatsMapEventCallback): void;
  off(event: CrowdbeatsMapEvent, callback: CrowdbeatsMapEventCallback): void;
}

export type CrowdbeatsMapEvent =
  | 'click'
  | 'marker:click'
  | 'marker:hover'
  | 'move'
  | 'moveend'
  | 'zoom'
  | 'load'
  | 'error'
  | 'theme:change'; // Phase 5: fired after smooth theme transition completes


export type CrowdbeatsMapEventCallback = (payload: CrowdbeatsMapEventPayload) => void;

export interface CrowdbeatsMapEventPayload {
  type: CrowdbeatsMapEvent;
  coordinate?: CrowdbeatsCoordinate;
  bounds?: CrowdbeatsBounds;
  markerId?: string;
  zoom?: number;
  originalEvent?: Event;
}

// ─── Geocoder Provider ───────────────────────────────────────────────────────

/**
 * Converts place names / addresses to coordinates, and vice versa.
 */
export interface ICrowdbeatsGeocoderProvider {
  readonly providerName: MapProviderName;

  /**
   * City/area/address autocomplete.
   * Returns up to 8 suggestions ordered by relevance.
   */
  searchLocation(query: string): Promise<CrowdbeatsSearchResult[]>;

  /**
   * Convert a placeId (from a previous searchLocation result) to a full result
   * including precise coordinates.
   */
  resolvePlaceId(placeId: string): Promise<CrowdbeatsSearchResult | null>;

  /**
   * Reverse geocode: coordinates → nearest address / city.
   */
  reverseGeocode(coord: CrowdbeatsCoordinate): Promise<CrowdbeatsSearchResult | null>;
}

// ─── Places Provider ─────────────────────────────────────────────────────────

/**
 * Venue-biased establishment search.
 * Used by creator/band check-in flows.
 */
export interface ICrowdbeatsPlacesProvider {
  readonly providerName: MapProviderName;

  /**
   * Search for establishments (bars, cafes, clubs, parks) near the user.
   * Returns up to 8 venue suggestions.
   */
  searchVenues(query: string): Promise<CrowdbeatsSearchResult[]>;

  /** Resolve a venue placeId to full coordinates. */
  resolveVenueId(placeId: string): Promise<CrowdbeatsSearchResult | null>;
}

// ─── Routing Provider ────────────────────────────────────────────────────────

/**
 * Calculates walking routes between two points.
 */
export interface ICrowdbeatsRoutingProvider {
  readonly providerName: MapProviderName;

  /**
   * Calculate walking directions from origin to destination.
   * Returns null if no route is found or the provider is unavailable.
   */
  calculateRoute(
    origin: CrowdbeatsCoordinate,
    destination: CrowdbeatsCoordinate,
    mode?: 'walking' | 'driving' | 'cycling',
    signal?: AbortSignal
  ): Promise<CrowdbeatsRoute | null>;
}

// ─── Location Provider ───────────────────────────────────────────────────────

/**
 * Browser GPS location — same across all map providers (W3C Geolocation API).
 */
export interface ICrowdbeatsLocationProvider {
  /**
   * One-shot GPS fix. Rejects with a user-readable error string on failure.
   */
  getCurrentLocation(): Promise<{ coordinate: CrowdbeatsCoordinate; accuracyMeters: number }>;

  /**
   * Continuous location watch. Returns an unsubscribe function.
   */
  watchLocation(
    callback: (coord: CrowdbeatsCoordinate, accuracyMeters: number) => void,
    onError?: (error: string) => void
  ): () => void;
}

// ─── Style Provider ──────────────────────────────────────────────────────────

/**
 * Resolves map style configuration for a given theme.
 */
export interface ICrowdbeatsStyleProvider {
  readonly providerName: MapProviderName;

  /** Returns a style URL (MapLibre) or a MapTypeStyle[] (Google). Typed as unknown for neutrality. */
  getStyleConfig(theme: 'dark' | 'light'): unknown;
}

// ─── Aggregate Provider Bundle ───────────────────────────────────────────────

/**
 * Complete set of providers for a single map implementation.
 * Created by the factory in createMapProvider.ts.
 */
export interface CrowdbeatsMapProviderBundle {
  map: ICrowdbeatsMapProvider;
  geocoder: ICrowdbeatsGeocoderProvider;
  places: ICrowdbeatsPlacesProvider;
  routing: ICrowdbeatsRoutingProvider;
  location: ICrowdbeatsLocationProvider;
  style: ICrowdbeatsStyleProvider;
}