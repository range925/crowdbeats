/**
 * @jest-environment jsdom
 */

/**
 * Crowdbeats V2 — Google Maps Platform Loader & Services Unit Tests
 *
 * Tests:
 * 1. Default discovery center (San Diego canonical coordinates).
 * 2. Places Autocomplete Session Tokens.
 * 3. Character threshold (<3 trimmed chars returns empty array).
 * 4. Places Autocomplete prediction resolution with session token.
 * 5. Seamless fallback to Geocoder when Places returns REQUEST_DENIED.
 * 6. Resolve Google Place location with exact coordinates and address fallback.
 * 7. Reverse geocoding for "Use my location" with friendly name and graceful fallback.
 */

import {
  DEFAULT_DISCOVERY_CENTER,
  createPlacesSessionToken,
  getGooglePlacePredictions,
  resolveGooglePlaceLocation,
  reverseGeocodeCoordinates,
  geocodePredictionsFallback,
} from '@/lib/maps/googleMapsLoader';

describe('googleMapsLoader — Specialist Verification', () => {
  const originalGoogle = (global as any).window?.google;

  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as any).google;
  });

  afterAll(() => {
    (window as any).google = originalGoogle;
  });

  describe('1. Canonical Crowdbeats Default Center', () => {
    it('has canonical San Diego, CA coordinates and zoom 12', () => {
      expect(DEFAULT_DISCOVERY_CENTER.lat).toBeCloseTo(32.7157, 4);
      expect(DEFAULT_DISCOVERY_CENTER.lng).toBeCloseTo(-117.1611, 4);
      expect(DEFAULT_DISCOVERY_CENTER.label).toBe('San Diego, CA');
      expect(DEFAULT_DISCOVERY_CENTER.zoom).toBe(12);
    });
  });

  describe('2. Autocomplete Session Token Generation', () => {
    it('returns null when Google Maps Places SDK is not loaded', () => {
      const token = createPlacesSessionToken();
      expect(token).toBeNull();
    });

    it('instantiates AutocompleteSessionToken when Places library is available', () => {
      class MockSessionToken {
        id = 'token_abc123';
      }
      (window as any).google = {
        maps: {
          places: {
            AutocompleteSessionToken: MockSessionToken,
          },
        },
      };

      const token = createPlacesSessionToken();
      expect(token).toBeInstanceOf(MockSessionToken);
    });
  });

  describe('3. Character Threshold & Input Validation', () => {
    it('returns empty array when query is less than 3 trimmed characters', async () => {
      expect(await getGooglePlacePredictions('')).toEqual([]);
      expect(await getGooglePlacePredictions(' ')).toEqual([]);
      expect(await getGooglePlacePredictions('ab')).toEqual([]);
      expect(await getGooglePlacePredictions('  ab  ')).toEqual([]);
    });
  });

  describe('4. Places Autocomplete with Session Tokens', () => {
    it('passes input, sessionToken, and regions type to AutocompleteService', async () => {
      const mockPredictions = [
        {
          place_id: 'place_torrance',
          description: 'Torrance, CA, USA',
          structured_formatting: {
            main_text: 'Torrance',
            secondary_text: 'CA, USA',
          },
        },
      ];

      const getPlacePredictionsMock = jest.fn((req, callback) => {
        callback(mockPredictions, 'OK');
      });

      (window as any).google = {
        maps: {
          Map: jest.fn(),
          Geocoder: jest.fn(),
          places: {
            PlacesServiceStatus: {
              OK: 'OK',
              ZERO_RESULTS: 'ZERO_RESULTS',
              REQUEST_DENIED: 'REQUEST_DENIED',
            },
            AutocompleteService: jest.fn().mockImplementation(() => ({
              getPlacePredictions: getPlacePredictionsMock,
            })),
          },
        },
      };

      const mockSessionToken = { id: 'session_123' } as any;
      const predictions = await getGooglePlacePredictions('Torrance', mockSessionToken);

      expect(getPlacePredictionsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          input: 'Torrance',
          types: ['(regions)'],
          sessionToken: mockSessionToken,
        }),
        expect.any(Function)
      );

      expect(predictions).toHaveLength(1);
      expect(predictions[0]).toEqual({
        placeId: 'place_torrance',
        mainText: 'Torrance',
        secondaryText: 'CA, USA',
        fullText: 'Torrance, CA, USA',
      });
    });
  });

  describe('5. Graceful Geocoder Fallback when Places API returns REQUEST_DENIED', () => {
    it('seamlessly falls back to Geocoder when Places returns REQUEST_DENIED', async () => {
      const mockGeocodeResults = [
        {
          place_id: 'geo_torrance_1',
          formatted_address: 'Torrance, CA, USA',
          geometry: {
            location: {
              lat: () => 33.8358,
              lng: () => -118.3406,
            },
          },
          address_components: [
            { long_name: 'Torrance', short_name: 'Torrance', types: ['locality'] },
            { long_name: 'California', short_name: 'CA', types: ['administrative_area_level_1'] },
            { long_name: 'United States', short_name: 'US', types: ['country'] },
          ],
        },
      ];

      const geocodeMock = jest.fn((req, callback) => {
        callback(mockGeocodeResults, 'OK');
      });

      (window as any).google = {
        maps: {
          Map: jest.fn(),
          GeocoderStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
          Geocoder: jest.fn().mockImplementation(() => ({
            geocode: geocodeMock,
          })),
          places: {
            PlacesServiceStatus: {
              OK: 'OK',
              REQUEST_DENIED: 'REQUEST_DENIED',
            },
            AutocompleteService: jest.fn().mockImplementation(() => ({
              getPlacePredictions: jest.fn((req, callback) => {
                // Places API is denied on this API key
                callback([], 'REQUEST_DENIED');
              }),
            })),
          },
        },
      };

      const results = await getGooglePlacePredictions('Torrance, CA');

      expect(geocodeMock).toHaveBeenCalledWith(
        { address: 'Torrance, CA' },
        expect.any(Function)
      );
      expect(results).toHaveLength(1);
      expect(results[0].placeId).toBe('geo_torrance_1');
      expect(results[0].mainText).toBe('Torrance');
      expect(results[0].secondaryText).toBe('CA, US');
      expect(results[0].latitude).toBe(33.8358);
      expect(results[0].longitude).toBe(-118.3406);
    });
  });

  describe('6. resolveGooglePlaceLocation Resolution', () => {
    it('resolves placeId to exact coordinates via Geocoder', async () => {
      const mockGeocodeResult = {
        place_id: 'place_sd',
        formatted_address: 'San Diego, CA, USA',
        geometry: {
          location: {
            lat: () => 32.7157,
            lng: () => -117.1611,
          },
        },
        address_components: [
          { long_name: 'San Diego', short_name: 'San Diego', types: ['locality'] },
          { long_name: 'California', short_name: 'CA', types: ['administrative_area_level_1'] },
          { long_name: 'United States', short_name: 'US', types: ['country'] },
        ],
      };

      const geocodeMock = jest.fn((req, callback) => {
        if (req.placeId === 'place_sd') {
          callback([mockGeocodeResult], 'OK');
        } else {
          callback([], 'ZERO_RESULTS');
        }
      });

      (window as any).google = {
        maps: {
          Map: jest.fn(),
          GeocoderStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
          Geocoder: jest.fn().mockImplementation(() => ({
            geocode: geocodeMock,
          })),
        },
      };

      const location = await resolveGooglePlaceLocation('place_sd', 'San Diego');
      expect(location).not.toBeNull();
      expect(location?.latitude).toBe(32.7157);
      expect(location?.longitude).toBe(-117.1611);
      expect(location?.city).toBe('San Diego');
      expect(location?.administrativeArea).toBe('California');
      expect(location?.country).toBe('United States');
    });

    it('falls back to address when placeId resolution fails', async () => {
      const mockAddressResult = {
        place_id: 'place_austin_addr',
        formatted_address: 'Austin, TX, USA',
        geometry: {
          location: {
            lat: () => 30.2672,
            lng: () => -97.7431,
          },
        },
        address_components: [
          { long_name: 'Austin', short_name: 'Austin', types: ['locality'] },
          { long_name: 'Texas', short_name: 'TX', types: ['administrative_area_level_1'] },
          { long_name: 'United States', short_name: 'US', types: ['country'] },
        ],
      };

      const geocodeMock = jest.fn((req, callback) => {
        if (req.placeId) {
          callback([], 'NOT_FOUND');
        } else if (req.address === 'Austin, TX') {
          callback([mockAddressResult], 'OK');
        }
      });

      (window as any).google = {
        maps: {
          Map: jest.fn(),
          GeocoderStatus: { OK: 'OK', NOT_FOUND: 'NOT_FOUND' },
          Geocoder: jest.fn().mockImplementation(() => ({
            geocode: geocodeMock,
          })),
        },
      };

      const location = await resolveGooglePlaceLocation('invalid_id', 'Austin, TX');
      expect(location).not.toBeNull();
      expect(location?.latitude).toBe(30.2672);
      expect(location?.longitude).toBe(-97.7431);
      expect(location?.city).toBe('Austin');
    });
  });

  describe('7. Reverse Geocoding for "Use my location"', () => {
    it('extracts user-friendly city and state from coordinates', async () => {
      const mockReverseResult = {
        place_id: 'place_gaslamp',
        formatted_address: '5th Ave, San Diego, CA 92101, USA',
        geometry: {
          location: {
            lat: () => 32.7157,
            lng: () => -117.1611,
          },
        },
        address_components: [
          { long_name: 'Gaslamp Quarter', short_name: 'Gaslamp', types: ['neighborhood'] },
          { long_name: 'San Diego', short_name: 'San Diego', types: ['locality'] },
          { long_name: 'California', short_name: 'CA', types: ['administrative_area_level_1'] },
          { long_name: 'United States', short_name: 'US', types: ['country'] },
        ],
      };

      const geocodeMock = jest.fn((req, callback) => {
        callback([mockReverseResult], 'OK');
      });

      (window as any).google = {
        maps: {
          Map: jest.fn(),
          GeocoderStatus: { OK: 'OK' },
          Geocoder: jest.fn().mockImplementation(() => ({
            geocode: geocodeMock,
          })),
        },
      };

      const res = await reverseGeocodeCoordinates(32.7157, -117.1611);
      expect(res.displayName).toBe('Gaslamp Quarter, San Diego');
      expect(res.city).toBe('San Diego');
      expect(res.administrativeArea).toBe('CA');
    });

    it('falls back gracefully to "Current location" on geocoder failure without throwing', async () => {
      const geocodeMock = jest.fn((req, callback) => {
        callback([], 'ZERO_RESULTS');
      });

      (window as any).google = {
        maps: {
          Map: jest.fn(),
          GeocoderStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
          Geocoder: jest.fn().mockImplementation(() => ({
            geocode: geocodeMock,
          })),
        },
      };

      const res = await reverseGeocodeCoordinates(0, 0);
      expect(res.displayName).toBe('Current location');
      expect(res.city).toBe('');
    });
  });
});
