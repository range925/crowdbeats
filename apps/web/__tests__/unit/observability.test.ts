/**
 * Crowdbeats Map Engine — Observability & Rollout Unit Tests (Phase 12)
 */

import { mapObservability } from '@/lib/maps/observability';
import { resolveMapProvider } from '@/lib/maps/createMapProvider';

describe('Crowdbeats Map Observability & Telemetry', () => {
  beforeEach(() => {
    mapObservability.reset();
  });

  describe('Coordinate Sanitization (PII Protection)', () => {
    it('coarsens latitude and longitude to 2 decimal places (~1.1 km)', () => {
      const sanitized = mapObservability.sanitizeCoordinates(32.715736, -117.161087);
      expect(sanitized).toBeDefined();
      expect(sanitized?.lat).toBe(32.72);
      expect(sanitized?.lng).toBe(-117.16);
    });

    it('returns undefined for invalid or NaN coordinates', () => {
      expect(mapObservability.sanitizeCoordinates(NaN, 10)).toBeUndefined();
      expect(mapObservability.sanitizeCoordinates(undefined, undefined)).toBeUndefined();
      expect(mapObservability.sanitizeCoordinates(32.7, NaN)).toBeUndefined();
    });
  });

  describe('Event Recording & Scrubbing', () => {
    it('records a typed event and increments counts', () => {
      const event = mapObservability.recordEvent('map_init_error', 'WebGL context lost', {
        provider: 'maplibre',
      });

      expect(event.type).toBe('map_init_error');
      expect(event.message).toBe('WebGL context lost');
      expect(event.provider).toBe('maplibre');

      const snapshot = mapObservability.getSnapshot();
      expect(snapshot.totalEvents).toBe(1);
      expect(snapshot.countsByType.map_init_error).toBe(1);
      expect(snapshot.countsByType.tile_load_error).toBe(0);
    });

    it('redacts sensitive keys such as passwords, tokens, and secret keys in details', () => {
      const event = mapObservability.recordEvent('geocoder_error', 'Auth failure', {
        details: {
          apiKey: 'AIzaSySecret123',
          authToken: 'token_secret_xyz',
          safeParam: 'San Diego',
        },
      });

      expect(event.details?.apiKey).toBe('[REDACTED]');
      expect(event.details?.authToken).toBe('[REDACTED]');
      expect(event.details?.safeParam).toBe('San Diego');
    });

    it('notifies registered listeners and allows unsubscription', () => {
      const mockListener = jest.fn();
      const unsubscribe = mapObservability.subscribe(mockListener);

      mapObservability.recordEvent('routing_error', 'Unreachable engine');
      expect(mockListener).toHaveBeenCalledTimes(1);

      unsubscribe();
      mapObservability.recordEvent('tile_load_error', 'Tile 404');
      expect(mockListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sliding-Window Anomaly Spike Detection', () => {
    it('triggers a request_spike event when error threshold is exceeded', () => {
      const spikeListener = jest.fn();
      mapObservability.subscribe((evt) => {
        if (evt.type === 'request_spike') {
          spikeListener(evt);
        }
      });

      for (let i = 0; i < 8; i++) {
        mapObservability.recordEvent('tile_load_error', 'Tile error ' + i);
      }

      const snapshot = mapObservability.getSnapshot();
      expect(snapshot.hasActiveAnomaly).toBe(true);
      expect(snapshot.countsByType.request_spike).toBeGreaterThanOrEqual(1);
      expect(spikeListener).toHaveBeenCalled();
    });
  });
});

describe('Feature Flag & Rollout Resolution', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('respects explicit runtime override', () => {
    expect(resolveMapProvider('google')).toBe('google');
    expect(resolveMapProvider('maplibre')).toBe('maplibre');
  });

  it('respects NEXT_PUBLIC_MAP_PROVIDER env variable', () => {
    process.env.NEXT_PUBLIC_MAP_PROVIDER = 'maplibre';
    expect(resolveMapProvider()).toBe('maplibre');

    process.env.NEXT_PUBLIC_MAP_PROVIDER = 'google';
    expect(resolveMapProvider()).toBe('google');
  });

  it('maps legacy NEXT_PUBLIC_MAP_ENGINE=osm to maplibre', () => {
    delete process.env.NEXT_PUBLIC_MAP_PROVIDER;
    process.env.NEXT_PUBLIC_MAP_ENGINE = 'osm';
    expect(resolveMapProvider()).toBe('maplibre');
  });

  it('defaults to maplibre in development environment', () => {
    delete process.env.NEXT_PUBLIC_MAP_PROVIDER;
    delete process.env.NEXT_PUBLIC_MAP_ENGINE;
    process.env.NEXT_PUBLIC_APP_ENV = 'development';
    expect(resolveMapProvider()).toBe('maplibre');
  });
});
