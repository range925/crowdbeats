/**
 * Crowdbeats V2 — Web Discovery Unit Tests (Phase 3)
 */

import {
  DiscoveryClient,
  TORRANCE_LOCATION,
  DEFAULT_DISCOVERY_LOCATION,
  MOCK_PERFORMERS,
  MOCK_VENUES,
} from '../../lib/discovery/discoveryClient';
import type { PendingTipAction } from '@crowdbeats/contracts';

describe('Web Public Discovery & Search (Unit)', () => {
  test('DiscoveryClient.searchLocations correctly filters curated places', () => {
    const torranceResults = DiscoveryClient.searchLocations('Tor');
    expect(torranceResults.length).toBeGreaterThan(0);
    expect(torranceResults.some((l) => l.city === 'Torrance')).toBe(true);

    const nashvilleResults = DiscoveryClient.searchLocations('Nash');
    expect(nashvilleResults.length).toBeGreaterThan(0);
    expect(nashvilleResults.some((l) => l.city === 'Nashville')).toBe(true);

    const emptyResults = DiscoveryClient.searchLocations('X');
    expect(emptyResults).toEqual([]);
  });

  test('Mock performers and venues provide verified public data without privacy leaks', () => {
    expect(MOCK_PERFORMERS.length).toBeGreaterThanOrEqual(3);
    for (const p of MOCK_PERFORMERS) {
      expect(p.id).toBeDefined();
      expect(p.slug).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.genres.length).toBeGreaterThan(0);
      expect(p.popularityScore).toBeGreaterThanOrEqual(0);
      // Privacy verification: no email, phone, or stripe accounts
      expect((p as any).email).toBeUndefined();
      expect((p as any).phone).toBeUndefined();
      expect((p as any).stripeAccountId).toBeUndefined();
      expect((p as any).residentialAddress).toBeUndefined();
    }

    expect(MOCK_VENUES.length).toBeGreaterThanOrEqual(2);
    for (const v of MOCK_VENUES) {
      expect(v.id).toBeDefined();
      expect(v.name).toBeDefined();
      expect(v.city).toBeDefined();
      expect(v.activeMusicianCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('Torrance location metadata conforms to contracts', () => {
    expect(TORRANCE_LOCATION.city).toBe('Torrance');
    expect(TORRANCE_LOCATION.administrativeArea).toBe('California');
    expect(TORRANCE_LOCATION.latitude).toBeCloseTo(33.8358, 2);
    expect(TORRANCE_LOCATION.longitude).toBeCloseTo(-118.3406, 2);
  });
});
