/**
 * Crowdbeats Map Engine — Geocoding & Autocomplete Unit Tests (Phase 10)
 *
 * Tests:
 * 1. normalizeMaptilerFeature (coordinate extraction, bbox bounds, context parsing).
 * 2. MaptilerGeocoderProvider (min 3 chars threshold, API parsing, curated fallback).
 * 3. resolvePlaceId and reverseGeocode.
 * 4. resolveGeocoderConfig environment defaults.
 */

import {
  MaptilerGeocoderProvider,
  normalizeMaptilerFeature,
} from '@/lib/maps/geocoding/MaptilerGeocoderProvider';
import { resolveGeocoderConfig } from '@/lib/maps/geocoding/geocoderConfig';

// Mock global fetch
const originalFetch = global.fetch;

describe('Geocoding & Autocomplete (Phase 10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('normalizeMaptilerFeature', () => {
    it('correctly maps feature center, bbox bounds, and context', () => {
      const mockFeature = {
        id: 'place.12345',
        place_name: 'Toronto, Ontario, Canada',
        text: 'Toronto',
        center: [-79.3832, 43.6532],
        bbox: [-79.6393, 43.581, -79.1159, 43.8555],
        context: [
          { id: 'region.ontario', text: 'Ontario' },
          { id: 'country.canada', text: 'Canada' },
        ],
      };

      const result = normalizeMaptilerFeature(mockFeature);

      expect(result.placeId).toBe('place.12345');
      expect(result.displayName).toBe('Toronto, Ontario, Canada');
      expect(result.city).toBe('Toronto');
      expect(result.administrativeArea).toBe('Ontario');
      expect(result.country).toBe('Canada');
      expect(result.coordinate).toEqual({ lat: 43.6532, lng: -79.3832 });
      expect(result.source).toBe('maptiler');
      expect(result.bounds).toEqual({
        sw: { lat: 43.581, lng: -79.6393 },
        ne: { lat: 43.8555, lng: -79.1159 },
      });
    });

    it('handles features without bbox or context gracefully', () => {
      const mockFeature = {
        id: 'place.simple',
        place_name: 'Simple Town',
        text: 'Simple Town',
        center: [10.0, 20.0],
      };

      const result = normalizeMaptilerFeature(mockFeature);

      expect(result.placeId).toBe('place.simple');
      expect(result.coordinate).toEqual({ lat: 20.0, lng: 10.0 });
      expect(result.bounds).toBeUndefined();
      expect(result.administrativeArea).toBeUndefined();
      expect(result.country).toBe('');
    });
  });

  describe('MaptilerGeocoderProvider', () => {
    let provider: MaptilerGeocoderProvider;

    beforeEach(() => {
      provider = new MaptilerGeocoderProvider('test_key', 'https://api.maptiler.com/geocoding');
    });

    it('returns empty array when query is less than 3 characters', async () => {
      const fetchMock = jest.fn();
      global.fetch = fetchMock;

      const res1 = await provider.searchLocation('to');
      const res2 = await provider.searchLocation('   ');

      expect(res1).toEqual([]);
      expect(res2).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetches Maptiler API with proper parameters for queries >= 3 characters', async () => {
      const mockResponse = {
        features: [
          {
            id: 'place.austin',
            place_name: 'Austin, Texas, United States',
            text: 'Austin',
            center: [-97.7431, 30.2672],
            context: [
              { id: 'region.texas', text: 'Texas' },
              { id: 'country.us', text: 'United States' },
            ],
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await provider.searchLocation('Austin');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Austin.json?key=test_key'),
        expect.any(Object)
      );
      expect(results).toHaveLength(1);
      expect(results[0].city).toBe('Austin');
      expect(results[0].coordinate).toEqual({ lat: 30.2672, lng: -97.7431 });
    });

    it('falls back to curated locations if Maptiler network fetch fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout'));

      const results = await provider.searchLocation('San Diego');

      // San Diego is in CURATED_LOCATIONS
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].city).toBe('San Diego');
      expect(results[0].source).toBe('curated');
    });

    it('falls back to curated locations if Maptiler returns non-ok status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
      });

      const results = await provider.searchLocation('Nashville');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].city).toBe('Nashville');
      expect(results[0].source).toBe('curated');
    });

    it('resolves curated placeId directly without network call', async () => {
      const fetchMock = jest.fn();
      global.fetch = fetchMock;

      const result = await provider.resolvePlaceId('loc_san_diego');

      expect(result).not.toBeNull();
      expect(result?.city).toBe('San Diego');
      expect(result?.source).toBe('curated');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('resolves non-curated placeId via Maptiler endpoint', async () => {
      const mockFeature = {
        id: 'maptiler_place_custom',
        place_name: 'Custom Place, NY, USA',
        text: 'Custom Place',
        center: [-74.0, 40.7],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ features: [mockFeature] }),
      });

      const result = await provider.resolvePlaceId('maptiler_place_custom');

      expect(result).not.toBeNull();
      expect(result?.placeId).toBe('maptiler_place_custom');
      expect(result?.coordinate).toEqual({ lat: 40.7, lng: -74.0 });
    });

    it('reverse geocodes coordinates into a location result', async () => {
      const mockFeature = {
        id: 'rev_1',
        place_name: 'Downtown San Diego, CA',
        text: 'San Diego',
        center: [-117.1611, 32.7157],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ features: [mockFeature] }),
      });

      const result = await provider.reverseGeocode({ lat: 32.7157, lng: -117.1611 });

      expect(result).not.toBeNull();
      expect(result?.placeId).toBe('rev_1');
      expect(result?.city).toBe('San Diego');
    });
  });

  describe('resolveGeocoderConfig', () => {
    it('returns valid defaults for provider, apiKey, and baseUrl', () => {
      const config = resolveGeocoderConfig();
      expect(['maptiler', 'google', 'photon', 'curated']).toContain(config.provider);
      expect(config.baseUrl).toBeTruthy();
      expect(typeof config.apiKey).toBe('string');
    });
  });
});
