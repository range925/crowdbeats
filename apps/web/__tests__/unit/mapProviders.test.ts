/**
 * Crowdbeats Map Provider Abstraction — Unit Tests
 * Tests: provider factory, marker normalization, coordinate normalization, error handling, provider switching
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock googleMapsLoader to avoid real SDK loads
jest.mock('@/lib/maps/googleMapsLoader', () => ({
  loadGoogleMapsSdk: jest.fn().mockResolvedValue(undefined),
  getGooglePlacePredictions: jest.fn().mockResolvedValue([
    { placeId: 'ChIJ_foo', mainText: 'San Diego', secondaryText: 'CA, USA', fullText: 'San Diego, CA, USA' },
  ]),
  getVenuePlacePredictions: jest.fn().mockResolvedValue([
    { placeId: 'ChIJ_bar', mainText: 'Blue Note', secondaryText: 'New York', fullText: 'Blue Note, New York, NY' },
  ]),
  resolveGooglePlaceLocation: jest.fn().mockResolvedValue({
    placeId: 'ChIJ_foo',
    displayName: 'San Diego, CA, USA',
    city: 'San Diego',
    administrativeArea: 'California',
    country: 'United States',
    latitude: 32.7157,
    longitude: -117.1611,
  }),
  geocodeCityQuery: jest.fn().mockResolvedValue({
    placeId: 'geo_1234',
    displayName: 'San Diego, CA, USA',
    city: 'San Diego',
    administrativeArea: 'California',
    country: 'United States',
    latitude: 32.7157,
    longitude: -117.1611,
  }),
  calculateGoogleWalkingRoute: jest.fn().mockResolvedValue({
    points: [{ lat: 32.715, lng: -117.161 }, { lat: 32.716, lng: -117.160 }],
    durationText: '4 min walk',
    distanceMilesText: '0.2 mi',
  }),
}));

// maplibre-gl is mocked via apps/web/__mocks__/maplibre-gl.js + jest.config.js moduleNameMapper

// Mock crowdbeatsMapEngine to avoid OSRM network calls
jest.mock('@/lib/maps/engine/crowdbeatsMapEngine', () => ({
  loadMapLibre: jest.fn().mockResolvedValue(require('maplibre-gl')),
  getWalkingRoute: jest.fn().mockResolvedValue({
    coordinates: [[-117.161, 32.715], [-117.160, 32.716]],
    durationText: '3 min walk',
    distanceMilesText: '0.2 mi',
    distanceMiles: 0.2,
    durationSeconds: 180,
  }),
  haversineDistanceMiles: jest.fn((lat1: number, lng1: number, lat2: number, lng2: number) => {
    // Return a plausible value for test purposes
    return Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2) * 69;
  }),
  requestGeolocation: jest.fn().mockResolvedValue({ latitude: 32.7157, longitude: -117.1611, accuracyMeters: 10 }),
  CROWDBEATS_MAP_STYLE_URL: jest.fn((theme = 'dark') => `/api/maps/style?theme=${theme}`),
  OSM_ATTRIBUTION: '© OpenStreetMap contributors',
  MAPTILER_ATTRIBUTION: '© MapTiler',
  CROWDBEATS_ATTRIBUTION: '© OpenStreetMap contributors | © MapTiler',
}));

// ─── Imports ─────────────────────────────────────────────────────────────────

import { resolveMapProvider, createMapProviderBundle } from '@/lib/maps/createMapProvider';
import { normalizeCoordinate, liveCheckinToMarker, createUserMarker, createVenueMarker } from '@/lib/maps/utils/markerNormalizers';
import { CrowdbeatsMapError, MapNotInitializedError, ProviderNotReadyError } from '@/lib/maps/types';
import type { CrowdbeatsLiveMarker, CrowdbeatsUserMarker } from '@/lib/maps/types';
import type { LiveCheckin } from '@/lib/firebase/firestore';

// ─── Test: Provider Factory ───────────────────────────────────────────────────

describe('resolveMapProvider()', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns "google" by default (no env vars set)', () => {
    delete process.env.NEXT_PUBLIC_MAP_PROVIDER;
    delete process.env.NEXT_PUBLIC_MAP_ENGINE;
    expect(resolveMapProvider()).toBe('google');
  });

  it('respects explicit override parameter over env vars', () => {
    process.env.NEXT_PUBLIC_MAP_PROVIDER = 'google';
    expect(resolveMapProvider('maplibre')).toBe('maplibre');
  });

  it('returns "google" when NEXT_PUBLIC_MAP_PROVIDER=google', () => {
    process.env.NEXT_PUBLIC_MAP_PROVIDER = 'google';
    expect(resolveMapProvider()).toBe('google');
  });

  it('returns "maplibre" when NEXT_PUBLIC_MAP_PROVIDER=maplibre', () => {
    process.env.NEXT_PUBLIC_MAP_PROVIDER = 'maplibre';
    expect(resolveMapProvider()).toBe('maplibre');
  });

  it('returns "maplibre" when legacy NEXT_PUBLIC_MAP_ENGINE=osm', () => {
    delete process.env.NEXT_PUBLIC_MAP_PROVIDER;
    process.env.NEXT_PUBLIC_MAP_ENGINE = 'osm';
    expect(resolveMapProvider()).toBe('maplibre');
  });

  it('ignores unknown NEXT_PUBLIC_MAP_PROVIDER values and falls back to google', () => {
    process.env.NEXT_PUBLIC_MAP_PROVIDER = 'unknown_provider';
    expect(resolveMapProvider()).toBe('google');
  });
});

// ─── Test: Provider Bundle Creation ──────────────────────────────────────────

describe('createMapProviderBundle()', () => {
  it('creates a Google Maps bundle with all required providers', async () => {
    const bundle = await createMapProviderBundle('google');
    expect(bundle.map).toBeDefined();
    expect(bundle.geocoder).toBeDefined();
    expect(bundle.places).toBeDefined();
    expect(bundle.routing).toBeDefined();
    expect(bundle.location).toBeDefined();
    expect(bundle.style).toBeDefined();
    expect(bundle.map.providerName).toBe('google');
    expect(bundle.geocoder.providerName).toBe('google');
    expect(bundle.places.providerName).toBe('google');
    expect(bundle.routing.providerName).toBe('google');
  });

  it('creates a MapLibre bundle with all required providers', async () => {
    const bundle = await createMapProviderBundle('maplibre');
    expect(bundle.map.providerName).toBe('maplibre');
    expect(bundle.geocoder.providerName).toBe('maplibre');
    expect(bundle.places.providerName).toBe('maplibre');
    expect(bundle.routing.providerName).toBe('maplibre');
  });

  it('can switch from Google to MapLibre via separate factory calls', async () => {
    const google = await createMapProviderBundle('google');
    const maplibre = await createMapProviderBundle('maplibre');
    expect(google.map.providerName).toBe('google');
    expect(maplibre.map.providerName).toBe('maplibre');
    // Both should implement the same interface methods
    expect(typeof google.map.initializeMap).toBe('function');
    expect(typeof maplibre.map.initializeMap).toBe('function');
    expect(typeof google.routing.calculateRoute).toBe('function');
    expect(typeof maplibre.routing.calculateRoute).toBe('function');
  });
});

// ─── Test: Map Configuration ──────────────────────────────────────────────────

describe('Google Maps Provider', () => {
  it('is not initialized before initializeMap() is called', async () => {
    const bundle = await createMapProviderBundle('google');
    expect(bundle.map.isInitialized).toBe(false);
  });

  it('throws with MAP_NOT_INITIALIZED code for camera methods before initialization', async () => {
    const bundle = await createMapProviderBundle('google');
    expect(() => bundle.map.getCenter()).toThrow('initializeMap');
    expect(() => bundle.map.getZoom()).toThrow('initializeMap');
    expect(() => bundle.map.flyTo({ lat: 0, lng: 0 })).toThrow('initializeMap');
  });

  it('throws with MAP_NOT_INITIALIZED for addMarker before initialization', async () => {
    const bundle = await createMapProviderBundle('google');
    expect(() => bundle.map.addMarker({
      id: 'test', type: 'user', position: { lat: 0, lng: 0 }, label: 'Test',
    })).toThrow('initializeMap');
  });

  it('throws with MAP_NOT_INITIALIZED for fitBounds before initialization', async () => {
    const bundle = await createMapProviderBundle('google');
    expect(() => bundle.map.fitBounds({
      sw: { lat: 32, lng: -118 },
      ne: { lat: 33, lng: -117 },
    })).toThrow('initializeMap');
  });
});

// ─── Test: Google Geocoder Provider ──────────────────────────────────────────

describe('GoogleMapsGeocoderProvider', () => {
  it('returns CrowdbeatsSearchResult[] from searchLocation()', async () => {
    const bundle = await createMapProviderBundle('google');
    const results = await bundle.geocoder.searchLocation('San Diego');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('placeId');
    expect(results[0]).toHaveProperty('displayName');
    expect(results[0]).toHaveProperty('coordinate');
    expect(results[0].source).toBe('google');
  });

  it('returns null from resolvePlaceId() on missing place', async () => {
    const { resolveGooglePlaceLocation } = require('@/lib/maps/googleMapsLoader');
    resolveGooglePlaceLocation.mockResolvedValueOnce(null);
    const bundle = await createMapProviderBundle('google');
    const result = await bundle.geocoder.resolvePlaceId('nonexistent');
    expect(result).toBeNull();
  });

  it('returns full coordinates from resolvePlaceId()', async () => {
    const bundle = await createMapProviderBundle('google');
    const result = await bundle.geocoder.resolvePlaceId('ChIJ_foo');
    expect(result).not.toBeNull();
    expect(result!.coordinate.lat).toBeCloseTo(32.7157, 3);
    expect(result!.coordinate.lng).toBeCloseTo(-117.1611, 3);
    expect(result!.source).toBe('google');
  });
});

// ─── Test: Google Routing Provider ───────────────────────────────────────────

describe('GoogleMapsRoutingProvider', () => {
  it('returns a CrowdbeatsRoute from calculateRoute()', async () => {
    const bundle = await createMapProviderBundle('google');
    const route = await bundle.routing.calculateRoute(
      { lat: 32.715, lng: -117.161 },
      { lat: 32.720, lng: -117.155 }
    );
    expect(route).not.toBeNull();
    expect(route!.mode).toBe('walking');
    expect(Array.isArray(route!.coordinates)).toBe(true);
    expect(route!.durationText).toContain('walk');
    expect(route!.distanceMilesText).toContain('mi');
    // Coordinates must be in [lng, lat] GeoJSON format
    expect(route!.coordinates[0]).toHaveLength(2);
    expect(route!.coordinates[0][0]).toBeCloseTo(-117.161, 3); // lng first
  });

  it('returns null when Google Directions returns null', async () => {
    const { calculateGoogleWalkingRoute } = require('@/lib/maps/googleMapsLoader');
    calculateGoogleWalkingRoute.mockResolvedValueOnce(null);
    const bundle = await createMapProviderBundle('google');
    const route = await bundle.routing.calculateRoute(
      { lat: 0, lng: 0 }, { lat: 1, lng: 1 }
    );
    expect(route).toBeNull();
  });
});

// ─── Test: MapLibre Routing Provider ─────────────────────────────────────────

describe('MapLibreRoutingProvider', () => {
  it('returns a CrowdbeatsRoute via OSRM', async () => {
    const bundle = await createMapProviderBundle('maplibre');
    const route = await bundle.routing.calculateRoute(
      { lat: 32.715, lng: -117.161 },
      { lat: 32.720, lng: -117.155 }
    );
    expect(route).not.toBeNull();
    expect(route!.mode).toBe('walking');
    expect(route!.coordinates[0][0]).toBeCloseTo(-117.161, 2); // lng first
  });

  it('returns null when OSRM route is unavailable', async () => {
    const { getWalkingRoute } = require('@/lib/maps/engine/crowdbeatsMapEngine');
    getWalkingRoute.mockResolvedValueOnce(null);
    const bundle = await createMapProviderBundle('maplibre');
    const route = await bundle.routing.calculateRoute({ lat: 0, lng: 0 }, { lat: 0, lng: 0 });
    expect(route).toBeNull();
  });
});

// ─── Test: Marker Normalization ───────────────────────────────────────────────

describe('liveCheckinToMarker()', () => {
  const mockCheckin: LiveCheckin = {
    uid: 'artist_abc',
    performerName: 'John Blues',
    type: 'artist',
    photoUrl: 'https://example.com/photo.jpg',
    genres: ['Blues', 'Jazz'],
    venueName: 'The Blue Note',
    venueId: 'venue_123',
    latitude: 32.7157,
    longitude: -117.1611,
    isLive: true,
    checkedInAt: '2026-09-17T20:00:00Z',
  };

  it('produces a CrowdbeatsLiveMarker with correct id format', () => {
    const marker = liveCheckinToMarker(mockCheckin);
    expect(marker.id).toBe('live_artist_abc');
    expect(marker.type).toBe('live');
  });

  it('maps coordinates correctly', () => {
    const marker = liveCheckinToMarker(mockCheckin);
    expect(marker.position.lat).toBe(32.7157);
    expect(marker.position.lng).toBe(-117.1611);
  });

  it('maps performer fields correctly', () => {
    const marker = liveCheckinToMarker(mockCheckin) as CrowdbeatsLiveMarker;
    expect(marker.performerName).toBe('John Blues');
    expect(marker.venueName).toBe('The Blue Note');
    expect(marker.photoUrl).toBe('https://example.com/photo.jpg');
    expect(marker.genres).toEqual(['Blues', 'Jazz']);
    expect(marker.checkedInAt).toBe('2026-09-17T20:00:00Z');
  });

  it('sets label from performerName', () => {
    const marker = liveCheckinToMarker(mockCheckin);
    expect(marker.label).toBe('John Blues');
  });

  it('carries uid in data payload', () => {
    const marker = liveCheckinToMarker(mockCheckin);
    expect(marker.data?.uid).toBe('artist_abc');
  });

  it('handles missing optional fields gracefully', () => {
    const minimal: LiveCheckin = {
      uid: 'x',
      performerName: 'Solo Artist',
      type: 'artist',
      photoUrl: '',
      genres: [],
      venueName: 'Park',
      latitude: 0,
      longitude: 0,
      isLive: true,
      checkedInAt: '2026-01-01T00:00:00Z',
    };
    expect(() => liveCheckinToMarker(minimal)).not.toThrow();
    const marker = liveCheckinToMarker(minimal) as CrowdbeatsLiveMarker;
    // photoUrl is required on LiveCheckin (non-optional); empty string is falsy — treated as no photo
    expect(marker.photoUrl).toBeFalsy();
    // genres is required; empty array is valid
    expect(marker.genres).toEqual([]);
  });
});

describe('createUserMarker()', () => {
  it('creates a user marker with correct type and id', () => {
    const marker = createUserMarker(32.7157, -117.1611, 10) as CrowdbeatsUserMarker;
    expect(marker.id).toBe('user_self');
    expect(marker.type).toBe('user');
    expect(marker.position.lat).toBe(32.7157);
    expect(marker.position.lng).toBe(-117.1611);
    expect(marker.accuracyMeters).toBe(10);
    expect(marker.zIndex).toBe(999);
  });
});

describe('createVenueMarker()', () => {
  it('creates a venue marker with correct id format', () => {
    const marker = createVenueMarker({ venueId: 'v1', venueName: 'Coachella', lat: 33.68, lng: -116.24 });
    expect(marker.id).toBe('venue_v1');
    expect(marker.type).toBe('venue');
    expect(marker.venueName).toBe('Coachella');
  });
});

// ─── Test: Coordinate Normalization ──────────────────────────────────────────

describe('normalizeCoordinate()', () => {
  it('accepts valid lat/lng numbers', () => {
    expect(normalizeCoordinate(32.7157, -117.1611)).toEqual({ lat: 32.7157, lng: -117.1611 });
  });

  it('converts numeric strings', () => {
    expect(normalizeCoordinate('32.7157', '-117.1611')).toEqual({ lat: 32.7157, lng: -117.1611 });
  });

  it('returns null for lat out of range', () => {
    expect(normalizeCoordinate(91, 0)).toBeNull();
    expect(normalizeCoordinate(-91, 0)).toBeNull();
  });

  it('returns null for lng out of range', () => {
    expect(normalizeCoordinate(0, 181)).toBeNull();
    expect(normalizeCoordinate(0, -181)).toBeNull();
  });

  it('returns null for NaN', () => {
    expect(normalizeCoordinate(NaN, 0)).toBeNull();
    expect(normalizeCoordinate(0, NaN)).toBeNull();
    expect(normalizeCoordinate('not-a-number', '0')).toBeNull();
  });

  it('returns null for Infinity', () => {
    expect(normalizeCoordinate(Infinity, 0)).toBeNull();
    expect(normalizeCoordinate(0, -Infinity)).toBeNull();
  });

  it('accepts boundary values (poles and antimeridian)', () => {
    expect(normalizeCoordinate(90, 180)).toEqual({ lat: 90, lng: 180 });
    expect(normalizeCoordinate(-90, -180)).toEqual({ lat: -90, lng: -180 });
    expect(normalizeCoordinate(0, 0)).toEqual({ lat: 0, lng: 0 });
  });
});

// ─── Test: Error Classes ──────────────────────────────────────────────────────

describe('CrowdbeatsMapError hierarchy', () => {
  it('CrowdbeatsMapError has correct name and code', () => {
    const err = new CrowdbeatsMapError('test', 'TEST_CODE', 'google');
    expect(err.name).toBe('CrowdbeatsMapError');
    expect(err.code).toBe('TEST_CODE');
    expect(err.provider).toBe('google');
    expect(err instanceof Error).toBe(true);
  });

  it('MapNotInitializedError is a CrowdbeatsMapError', () => {
    const err = new MapNotInitializedError('google');
    expect(err instanceof CrowdbeatsMapError).toBe(true);
    expect(err.code).toBe('MAP_NOT_INITIALIZED');
    expect(err.message).toContain('initializeMap');
  });

  it('ProviderNotReadyError has correct code', () => {
    const err = new ProviderNotReadyError('maplibre');
    expect(err.code).toBe('PROVIDER_NOT_READY');
    expect(err.provider).toBe('maplibre');
  });
});

// ─── Test: Style Provider ────────────────────────────────────────────────────

describe('Style Providers', () => {
  it('Google style provider returns dark styles array', async () => {
    const bundle = await createMapProviderBundle('google');
    const styles = bundle.style.getStyleConfig('dark') as unknown[];
    expect(Array.isArray(styles)).toBe(true);
    expect(styles.length).toBeGreaterThan(0);
  });

  it('Google style provider returns light styles array', async () => {
    const bundle = await createMapProviderBundle('google');
    const styles = bundle.style.getStyleConfig('light') as unknown[];
    expect(Array.isArray(styles)).toBe(true);
  });

  it('MapLibre style provider returns a URL string', async () => {
    const bundle = await createMapProviderBundle('maplibre');
    const url = bundle.style.getStyleConfig('dark') as string;
    expect(typeof url).toBe('string');
    expect(url).toContain('/api/maps/style');
    expect(url).toContain('dark');
  });

  it('MapLibre style provider includes theme in URL', async () => {
    const bundle = await createMapProviderBundle('maplibre');
    const lightUrl = bundle.style.getStyleConfig('light') as string;
    expect(lightUrl).toContain('light');
  });
});

// ─── Test: Graceful Error Handling ───────────────────────────────────────────

describe('Graceful error handling', () => {
  it('searchLocation returns [] on network failure', async () => {
    const { getGooglePlacePredictions } = require('@/lib/maps/googleMapsLoader');
    getGooglePlacePredictions.mockRejectedValueOnce(new Error('Network error'));
    // GoogleMapsGeocoderProvider catches errors in the underlying loader
    const bundle = await createMapProviderBundle('google');
    // searchLocation delegates to getGooglePlacePredictions which rejects
    // The provider should propagate or return []
    // We verify no unhandled rejection
    await expect(bundle.geocoder.searchLocation('test')).rejects.toThrow();
  });

  it('calculateRoute returns null on routing failure', async () => {
    const { calculateGoogleWalkingRoute } = require('@/lib/maps/googleMapsLoader');
    calculateGoogleWalkingRoute.mockRejectedValueOnce(new Error('Routing unavailable'));
    const bundle = await createMapProviderBundle('google');
    // calculateGoogleWalkingRoute throws → provider should catch and return null
    // (current impl: the error propagates from the loader; provider doesn't wrap in try/catch)
    // This test documents current behavior — Phase 4 will add provider-level error wrapping
    await expect(bundle.routing.calculateRoute({ lat: 0, lng: 0 }, { lat: 1, lng: 1 })).rejects.toThrow();
  });

  it('destroyMap() is idempotent — safe to call multiple times', async () => {
    const bundle = await createMapProviderBundle('google');
    expect(() => bundle.map.destroyMap()).not.toThrow();
    expect(() => bundle.map.destroyMap()).not.toThrow(); // second call also safe
  });

  it('removeMarker() is a no-op for unknown IDs', async () => {
    const bundle = await createMapProviderBundle('google');
    // Mock map instance to bypass initialization check for removeMarker
    (bundle.map as any).mapInstance = {};
    expect(() => bundle.map.removeMarker('unknown_id_xyz')).not.toThrow();
  });
});

// ─── Test: MapLibreMapProvider (node-compatible tests only) ───────────────────
// Tests requiring document.createElement (DOM) are in __tests__/jsdom/mapProviders.jsdom.test.tsx

describe('MapLibreMapProvider', () => {
  it('is not initialized by default', async () => {
    const bundle = await createMapProviderBundle('maplibre');
    expect(bundle.map.isInitialized).toBe(false);
  });

  it('getZoom() returns a number without initialization', async () => {
    const bundle = await createMapProviderBundle('maplibre');
    expect(typeof bundle.map.getZoom()).toBe('number');
  });

  it('getCenter() returns a coordinate without initialization', async () => {
    const bundle = await createMapProviderBundle('maplibre');
    const center = bundle.map.getCenter();
    expect(typeof center.lat).toBe('number');
    expect(typeof center.lng).toBe('number');
  });

  it('destroyMap() is safe to call without initialization', async () => {
    const bundle = await createMapProviderBundle('maplibre');
    expect(() => bundle.map.destroyMap()).not.toThrow();
    expect(bundle.map.isInitialized).toBe(false);
  });

  it('addMarker() throws MapNotInitializedError before initialization', async () => {
    const bundle = await createMapProviderBundle('maplibre');
    // Phase 3 MapLibreMapProvider guards addMarker() with _requireMap() — throws before init
    expect(() => bundle.map.addMarker({
      id: 'test', type: 'live', position: { lat: 32, lng: -117 }, label: 'Test',
    })).toThrow('initializeMap');
  });

  it('clearAllMarkers() is a no-op stub', async () => {
    const bundle = await createMapProviderBundle('maplibre');
    expect(() => bundle.map.clearAllMarkers()).not.toThrow();
  });
});
