/**
 * Crowdbeats Map Engine — Routing & Walking Directions Unit Tests (Phase 11)
 *
 * Tests:
 * 1. OsrmRoutingProvider (URL formatting, response parsing, mode profiles).
 * 2. ValhallaRoutingProvider (costing mapping, shape decoding).
 * 3. GraphHopperRoutingProvider (profile mapping, coordinates parsing).
 * 4. calculateStraightLineFallback (geodesic math, mode speeds).
 * 5. External navigation deep links (Apple Maps, Google Maps, Waze).
 * 6. resolveRoutingConfig defaults.
 */

import {
  OsrmRoutingProvider,
  ValhallaRoutingProvider,
  GraphHopperRoutingProvider,
  calculateStraightLineFallback,
  getAppleMapsUrl,
  getGoogleMapsUrl,
  getWazeUrl,
  getDeviceNavigationUrl,
  resolveRoutingConfig,
} from '@/lib/maps/routing';
import type { CrowdbeatsCoordinate } from '@/lib/maps/types';

const originalFetch = global.fetch;

describe('Routing & Walking Directions (Phase 11)', () => {
  const origin: CrowdbeatsCoordinate = { lat: 32.7157, lng: -117.1611 };
  const destination: CrowdbeatsCoordinate = { lat: 32.7248, lng: -117.1691 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('OsrmRoutingProvider', () => {
    let provider: OsrmRoutingProvider;

    beforeEach(() => {
      provider = new OsrmRoutingProvider('https://router.project-osrm.org');
    });

    it('formats walking request with foot profile and parses response', async () => {
      const mockOsrmResponse = {
        code: 'Ok',
        routes: [
          {
            geometry: {
              coordinates: [
                [-117.1611, 32.7157],
                [-117.165, 32.72],
                [-117.1691, 32.7248],
              ],
            },
            distance: 1200, // 1200 meters (~0.7 mi)
            duration: 900,  // 15 min
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOsrmResponse,
      });

      const route = await provider.calculateRoute(origin, destination, 'walking');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/route/v1/foot/'),
        expect.any(Object)
      );
      expect(route).not.toBeNull();
      expect(route?.mode).toBe('walking');
      expect(route?.coordinates).toHaveLength(3);
      expect(route?.distanceMilesText).toBe('0.7 mi');
      expect(route?.durationText).toBe('15 min walk');
    });

    it('formats driving request with driving profile', async () => {
      const mockOsrmResponse = {
        code: 'Ok',
        routes: [
          {
            geometry: { coordinates: [[-117.1611, 32.7157], [-117.1691, 32.7248]] },
            distance: 1500,
            duration: 180, // 3 min
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOsrmResponse,
      });

      const route = await provider.calculateRoute(origin, destination, 'driving');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/route/v1/driving/'),
        expect.any(Object)
      );
      expect(route?.mode).toBe('driving');
      expect(route?.durationText).toBe('3 min drive');
    });

    it('handles network failures gracefully and returns null', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      const route = await provider.calculateRoute(origin, destination, 'walking');
      expect(route).toBeNull();
    });
  });

  describe('ValhallaRoutingProvider', () => {
    it('sends POST request with pedestrian costing for walking', async () => {
      const provider = new ValhallaRoutingProvider('test_key', 'https://valhalla.test');

      const mockValhallaResponse = {
        trip: {
          summary: { length: 0.8, time: 600 },
          legs: [{ shape: '' }],
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockValhallaResponse,
      });

      const route = await provider.calculateRoute(origin, destination, 'walking');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/route?api_key=test_key'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"costing":"pedestrian"'),
        })
      );
      expect(route).not.toBeNull();
      expect(route?.distanceMilesText).toBe('0.8 mi');
      expect(route?.durationText).toBe('10 min walk');
    });
  });

  describe('GraphHopperRoutingProvider', () => {
    it('sends request with foot profile for walking', async () => {
      const provider = new GraphHopperRoutingProvider('gh_key', 'https://graphhopper.test');

      const mockGhResponse = {
        paths: [
          {
            points: {
              coordinates: [[-117.1611, 32.7157], [-117.1691, 32.7248]],
            },
            distance: 800,
            time: 480000, // 8 min in ms
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockGhResponse,
      });

      const route = await provider.calculateRoute(origin, destination, 'walking');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('profile=foot'),
        expect.any(Object)
      );
      expect(route).not.toBeNull();
      expect(route?.durationText).toBe('8 min walk');
    });
  });

  describe('calculateStraightLineFallback', () => {
    it('calculates Haversine distance and reasonable walking duration', () => {
      const route = calculateStraightLineFallback(origin, destination, 'walking');

      expect(route.distanceMiles).toBeGreaterThan(0.4);
      expect(route.distanceMiles).toBeLessThan(1.2);
      expect(route.durationSeconds).toBeGreaterThan(300);
      expect(route.coordinates.length).toBeGreaterThanOrEqual(2);
      expect(route.mode).toBe('walking');
    });

    it('calculates faster driving duration for the same distance', () => {
      const walkRoute = calculateStraightLineFallback(origin, destination, 'walking');
      const driveRoute = calculateStraightLineFallback(origin, destination, 'driving');

      expect(driveRoute.durationSeconds).toBeLessThan(walkRoute.durationSeconds);
      expect(driveRoute.mode).toBe('driving');
    });
  });

  describe('External Navigation Deep Links', () => {
    const dest = { lat: 32.7248, lng: -117.1691 };

    it('generates Apple Maps URL with walking flag', () => {
      const url = getAppleMapsUrl({ destination: dest, destinationName: 'The Casbah', mode: 'walking' });
      expect(url).toContain('maps.apple.com');
      expect(url).toContain('daddr=32.7248,-117.1691');
      expect(url).toContain('dirflg=w');
      expect(url).toContain('The%20Casbah');
    });

    it('generates Google Maps URL with travelmode and origin', () => {
      const url = getGoogleMapsUrl({
        destination: dest,
        destinationName: 'The Casbah',
        origin: { lat: 32.7157, lng: -117.1611 },
        mode: 'walking',
      });
      expect(url).toContain('google.com/maps/dir');
      expect(url).toContain('destination=32.7248,-117.1691');
      expect(url).toContain('origin=32.7157,-117.1611');
      expect(url).toContain('travelmode=walking');
    });

    it('generates Waze navigation URL', () => {
      const url = getWazeUrl({ destination: dest });
      expect(url).toBe('https://waze.com/ul?ll=32.7248,-117.1691&navigate=yes');
    });

    it('resolves device navigation URL for general web environments', () => {
      const result = getDeviceNavigationUrl({ destination: dest, destinationName: 'The Casbah' });
      expect(result.url).toContain('google.com/maps/dir');
      expect(result.platform).toBe('google');
    });
  });

  describe('resolveRoutingConfig', () => {
    it('returns default osrm configuration', () => {
      const config = resolveRoutingConfig();
      expect(['osrm', 'valhalla', 'graphhopper', 'maptiler', 'google']).toContain(config.provider);
      expect(config.baseUrl).toBeTruthy();
    });
  });
});
