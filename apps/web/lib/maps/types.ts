/**
 * Crowdbeats Map Engine — Provider-Independent Data Types
 *
 * All feature components import from THIS file only.
 * Never import google.maps.* types directly outside of GoogleMapsProvider.ts.
 */

// ─── Coordinates & Bounds ────────────────────────────────────────────────────

/** WGS84 decimal-degree coordinate pair. Vendor-neutral. */
export interface CrowdbeatsCoordinate {
  lat: number;
  lng: number;
}

/** Axis-aligned bounding box in WGS84. */
export interface CrowdbeatsBounds {
  sw: CrowdbeatsCoordinate; // southwest corner
  ne: CrowdbeatsCoordinate; // northeast corner
}

// ─── Marker Types ─────────────────────────────────────────────────────────────

/**
 * All marker visual categories used by Crowdbeats.
 * Phase 6 extends Phase 2 types — 'artist' and 'live' kept for backward compat.
 */
export type MarkerType =
  // ── Performer (non-live) ──
  | 'artist'       // solo musician (legacy alias for solo)
  | 'solo'         // solo musician
  | 'band'         // band or duo
  // ── Live performer ────────
  | 'live'         // live performer (legacy alias for live-solo)
  | 'live-solo'    // live solo musician — pulsing green ring
  | 'live-band'    // live band — pulsing green ring, pill shape
  // ── Special states ────────
  | 'sponsored'    // performer with active sponsorship — amber crown badge
  | 'saved'        // performer saved/favorited by user — indigo heart badge
  | 'featured'     // featured/promoted performer — pink star badge
  // ── Other ─────────────────
  | 'venue'        // venue pill label
  | 'user'         // current user GPS location
  | 'cluster';     // aggregated cluster of nearby markers

/** Base marker. All map markers share these fields. */
export interface CrowdbeatsMapMarker {
  /** Unique marker ID — assigned by addMarker(), stored by provider. */
  id: string;
  type: MarkerType;
  position: CrowdbeatsCoordinate;
  /** Accessible label for screen readers and marker title attribute. */
  label: string;
  /** Optional Z-index override. Higher = drawn on top. */
  zIndex?: number;
  /** Arbitrary payload passed to click handlers. */
  data?: Record<string, unknown>;
}

/** Marker representing a solo artist who may or may not be live. */
export interface CrowdbeatsArtistMarker extends CrowdbeatsMapMarker {
  type: 'artist';
  artistId: string;
  stageName: string;
  photoUrl?: string;
  genres?: string[];
  isLive: boolean;
  distanceMiles?: number;
}

/** Marker representing a band. */
export interface CrowdbeatsBandMarker extends CrowdbeatsMapMarker {
  type: 'band';
  bandId: string;
  bandName: string;
  photoUrl?: string;
  genres?: string[];
  isLive: boolean;
  memberCount?: number;
  distanceMiles?: number;
}

/** Marker representing a venue. */
export interface CrowdbeatsVenueMarker extends CrowdbeatsMapMarker {
  type: 'venue';
  venueId: string;
  venueName: string;
  address?: string;
  activeMusiciansCount?: number;
}

/** Marker representing the current user's GPS location. */
export interface CrowdbeatsUserMarker extends CrowdbeatsMapMarker {
  type: 'user';
  /** GPS accuracy radius in metres. Used to size the accuracy ring. */
  accuracyMeters?: number;
  /** Compass heading in degrees (0 = North). null = unknown. */
  heading?: number | null;
}

/** Marker for a currently-live performer (fan discovery map). */
export interface CrowdbeatsLiveMarker extends CrowdbeatsMapMarker {
  type: 'live';
  performerId: string;
  performerType: 'artist' | 'band';
  performerName: string;
  photoUrl?: string;
  venueName: string;
  genres?: string[];
  distanceMiles?: number;
  checkedInAt: string;
}

/** Aggregated marker representing multiple nearby performers. */
export interface CrowdbeatsCluster extends CrowdbeatsMapMarker {
  type: 'cluster';
  count: number;
  markerIds: string[];
  /** Whether the cluster contains any active live performers. */
  hasLive?: boolean;
  /** Number of live performers within this cluster. */
  liveCount?: number;
  /** Zoom level where this cluster splits apart into smaller clusters. */
  expansionZoom?: number;
  /** Bounding box encompassing all points in the cluster. */
  bounds?: CrowdbeatsBounds;
  /** The underlying point items grouped into this cluster. */
  items?: any[];
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/** A walking (or other mode) route between two points. */
export interface CrowdbeatsRoute {
  /**
   * GeoJSON [lng, lat] coordinate pairs — MapLibre native order.
   * Note: Google Maps uses {lat, lng} — the GoogleMapsProvider normalizes this.
   */
  coordinates: [number, number][];
  origin: CrowdbeatsCoordinate;
  destination: CrowdbeatsCoordinate;
  durationText: string;       // e.g. '4 min walk'
  distanceMilesText: string;  // e.g. '0.3 mi'
  distanceMiles: number;
  durationSeconds: number;
  mode: 'walking' | 'driving' | 'cycling';
}

// ─── Search / Geocoding ──────────────────────────────────────────────────────

/** A single location search result. Vendor-neutral. */
export interface CrowdbeatsSearchResult {
  /**
   * Provider-specific place identifier.
   * Google: ChIJ... Place ID format
   * OSM Nominatim: osm_id numeric string
   * Curated: loc_* format
   */
  placeId: string;
  displayName: string;
  city: string;
  administrativeArea?: string;
  country: string;
  coordinate: CrowdbeatsCoordinate;
  /** Bounding box for flyTo / fitBounds. Optional. */
  bounds?: CrowdbeatsBounds;
  source: 'google' | 'osm' | 'curated' | 'maptiler';
}

// ─── Map Init ────────────────────────────────────────────────────────────────

export type MapTheme = 'dark' | 'light';

export interface MapInitOptions {
  center?: CrowdbeatsCoordinate;
  zoom?: number;
  theme?: MapTheme;
  /** Suppress all map attribution (use only when providing custom attribution). */
  suppressAttribution?: boolean;
}

export interface CameraPadding {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface CameraAnimationOptions {
  /** Transition duration in milliseconds. If reduced motion is active, duration is treated as 0. */
  duration?: number;
  /** Target camera zoom level. */
  zoom?: number;
  /** Camera pitch in degrees (0–60). */
  pitch?: number;
  /** Camera bearing/heading in degrees (0–360). */
  bearing?: number;
  /** Pixel offset from screen center [x, y]. E.g. [0, -110] shifts target 110px upward. */
  offset?: [number, number];
  /** Viewport padding in screen pixels. */
  padding?: CameraPadding;
  /** Flight curve curvature (MapLibre native). Default: 1.42. */
  curve?: number;
  /** Flight speed multiplier (MapLibre native). Default: 1.2. */
  speed?: number;
  /** Explicitly toggle reduced motion (instant jump) for this animation. */
  reducedMotion?: boolean;
}

export type FlyToOptions = CameraAnimationOptions;
export type EaseOptions = CameraAnimationOptions;

// ─── Layer / GeoJSON ─────────────────────────────────────────────────────────

export type CrowdbeatsLayerType = 'line' | 'fill' | 'circle' | 'symbol' | 'heatmap';

export interface CrowdbeatsLayerSpec {
  id: string;
  type: CrowdbeatsLayerType;
  sourceId: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown[];
  beforeId?: string;
}

// ─── Provider Identity ───────────────────────────────────────────────────────

export type MapProviderName = 'google' | 'maplibre';

export interface MapProviderConfig {
  provider: MapProviderName;
  theme: MapTheme;
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export class CrowdbeatsMapError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly provider?: MapProviderName
  ) {
    super(message);
    this.name = 'CrowdbeatsMapError';
  }
}

export class MapNotInitializedError extends CrowdbeatsMapError {
  constructor(provider: MapProviderName) {
    super(
      `Map is not initialized. Call initializeMap() first.`,
      'MAP_NOT_INITIALIZED',
      provider
    );
  }
}

export class ProviderNotReadyError extends CrowdbeatsMapError {
  constructor(provider: MapProviderName) {
    super(
      `Provider '${provider}' is not ready. Check configuration.`,
      'PROVIDER_NOT_READY',
      provider
    );
  }
}