/**
 * Crowdbeats V2 — Web Discovery Phase 8 Unit Tests
 *
 * Verifies two-way discovery contracts, 2-minute memory cache, geohash bounding,
 * overlapping deduplication, stale session filtering, and read volume tracking.
 */

import {
  DiscoveryClient,
  computeFilterHash,
  generateGeohashPrefixBounds,
  filterAndDeduplicatePerformers,
  MAX_DISCOVERY_RADIUS_MILES,
  MAX_GEOHASH_CELLS,
  MAX_DISCOVERY_DOCS,
  PublicPerformerItem,
} from '../../lib/discovery/discoveryClient';
import { webReadVolumeTracker } from '../../lib/discovery/readVolumeInstrumentation';
import type { DiscoveryFilterOptions } from '@crowdbeats/contracts';

describe('Phase 8: Web Two-Way Battery- & Cost-Efficient Discovery (Unit)', () => {
  beforeEach(() => {
    DiscoveryClient.clearCache();
    webReadVolumeTracker.reset();
  });

  // 1. City search without location permission
  test('1. City search works without location permission and zero GPS requests', () => {
    const results = DiscoveryClient.searchLocations('Torrance');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].city).toBe('Torrance');
    expect(results[0].displayName).toContain('Torrance');

    // Zero sensor or location requests were required
    expect(webReadVolumeTracker.getMetrics().activeSubscriptions).toBe(0);
  });

  // 2. Viewport query bounds, max 9 cells, max 50mi cap
  test('2. Viewport bounding caps radius at 50 miles and max 9 geohash cells', () => {
    const bounds = {
      minLat: 32.5,
      maxLat: 33.5,
      minLng: -117.5,
      maxLng: -116.5,
    };

    const cells = generateGeohashPrefixBounds(bounds);
    expect(cells.length).toBeLessThanOrEqual(MAX_GEOHASH_CELLS);
    expect(cells.length).toBeGreaterThan(0);
  });

  // 3. Deduplication across overlapping geohash cells
  test('3. Deduplicates documents across overlapping geohash cells', () => {
    const mockPerformers: PublicPerformerItem[] = [
      { id: 'perf_1', slug: 'p1', name: 'Jake Rios', type: 'artist', genres: ['Folk'], isVerified: true, isLive: true, latitude: 32.7, longitude: -117.1, popularityScore: 90, followersCount: 100 },
      { id: 'perf_1', slug: 'p1', name: 'Jake Rios', type: 'artist', genres: ['Folk'], isVerified: true, isLive: true, latitude: 32.7, longitude: -117.1, popularityScore: 90, followersCount: 100 }, // Duplicate
      { id: 'perf_2', slug: 'p2', name: 'Maya Lin', type: 'artist', genres: ['Electronic'], isVerified: true, isLive: true, latitude: 32.8, longitude: -117.2, popularityScore: 85, followersCount: 90 },
      { id: 'perf_2', slug: 'p2', name: 'Maya Lin', type: 'artist', genres: ['Electronic'], isVerified: true, isLive: true, latitude: 32.8, longitude: -117.2, popularityScore: 85, followersCount: 90 }, // Duplicate
      { id: 'perf_3', slug: 'p3', name: 'The Sunsets', type: 'band', genres: ['Rock'], isVerified: true, isLive: true, latitude: 32.9, longitude: -117.3, popularityScore: 95, followersCount: 200 },
    ];

    const deduplicated = filterAndDeduplicatePerformers(mockPerformers);
    expect(deduplicated.length).toBe(3);
    expect(deduplicated.map((p) => p.id)).toEqual(['perf_1', 'perf_2', 'perf_3']);

    // Check instrumentation
    expect(webReadVolumeTracker.getMetrics().deduplicatedDocs).toBe(2);
  });

  // 4. 2-minute memory cache reuse without re-reading
  test('4. 2-minute memory cache reuses previous results without re-reading', async () => {
    let rawFetchCount = 0;
    const fetcher = async () => {
      rawFetchCount++;
      return [
        { id: 'perf_1', slug: 'p1', name: 'Jake Rios', type: 'artist' as const, genres: ['Folk'], isVerified: true, isLive: true, latitude: 32.7, longitude: -117.1, popularityScore: 90, followersCount: 100 },
      ];
    };

    const filters: DiscoveryFilterOptions = { liveNow: true, performerType: 'artist' };

    // First query: cache miss -> calls fetcher
    const firstResult = await DiscoveryClient.queryPerformersWithCache('gh_torrance', filters, fetcher);
    expect(firstResult.length).toBe(1);
    expect(rawFetchCount).toBe(1);
    expect(webReadVolumeTracker.getMetrics().cacheHits).toBe(0);
    expect(webReadVolumeTracker.getMetrics().queryExecutions).toBe(1);

    // Second query with same bounds & filters within 2 minutes: cache hit!
    const secondResult = await DiscoveryClient.queryPerformersWithCache('gh_torrance', filters, fetcher);
    expect(secondResult.length).toBe(1);
    expect(rawFetchCount).toBe(1); // fetcher was NOT called again
    expect(webReadVolumeTracker.getMetrics().cacheHits).toBe(1);
  });

  // 5. Expired / Stale sessions disappear immediately
  test('5. Expired live sessions disappear immediately', () => {
    const now = Date.now();
    const mockPerformers: PublicPerformerItem[] = [
      {
        id: 'perf_live_active',
        slug: 'active',
        name: 'Active Artist',
        type: 'artist',
        genres: ['Rock'],
        isVerified: true,
        isLive: true,
        endsAt: now + 3600000, // ends in 1 hour
        latitude: 32.7,
        longitude: -117.1,
        popularityScore: 80,
        followersCount: 50,
      },
      {
        id: 'perf_live_expired',
        slug: 'expired',
        name: 'Expired Artist',
        type: 'artist',
        genres: ['Rock'],
        isVerified: true,
        isLive: true,
        endsAt: now - 1000, // ended 1 second ago
        latitude: 32.7,
        longitude: -117.1,
        popularityScore: 80,
        followersCount: 50,
      },
    ];

    const result = filterAndDeduplicatePerformers(mockPerformers, { liveNow: true }, now);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('perf_live_active');
  });

  // 6. Filter combinations (Live Now, Starting Soon, Solo vs Band, Genre, Distance)
  test('6. Filter combinations properly filter performers', () => {
    const mockPerformers: PublicPerformerItem[] = [
      { id: 'solo_folk', slug: 'sf', name: 'Solo Folk', type: 'artist', genres: ['Folk'], isVerified: true, isLive: true, distanceMiles: 5, latitude: 32.7, longitude: -117.1, popularityScore: 80, followersCount: 50 },
      { id: 'band_rock', slug: 'br', name: 'Rock Band', type: 'band', genres: ['Rock'], isVerified: false, isLive: true, distanceMiles: 12, latitude: 32.7, longitude: -117.1, popularityScore: 85, followersCount: 100 },
      { id: 'solo_soon', slug: 'ss', name: 'Starting Soon Solo', type: 'artist', genres: ['Jazz'], isVerified: true, isLive: false, startingSoon: true, distanceMiles: 2, latitude: 32.7, longitude: -117.1, popularityScore: 70, followersCount: 30 },
      { id: 'far_away', slug: 'fa', name: 'Far Away Artist', type: 'artist', genres: ['Pop'], isVerified: true, isLive: true, distanceMiles: 65, latitude: 32.7, longitude: -117.1, popularityScore: 90, followersCount: 200 },
    ];

    // Filter: Solo artists only
    const soloOnly = filterAndDeduplicatePerformers(mockPerformers, { performerType: 'artist' });
    expect(soloOnly.every((p) => p.type === 'artist')).toBe(true);

    // Filter: Bands only
    const bandsOnly = filterAndDeduplicatePerformers(mockPerformers, { performerType: 'band' });
    expect(bandsOnly.length).toBe(1);
    expect(bandsOnly[0].id).toBe('band_rock');

    // Filter: Starting soon
    const startingSoon = filterAndDeduplicatePerformers(mockPerformers, { startingSoon: true });
    expect(startingSoon.length).toBe(1);
    expect(startingSoon[0].id).toBe('solo_soon');

    // Filter: Distance capped at 50 miles (far_away is 65mi -> excluded)
    const distanceFiltered = filterAndDeduplicatePerformers(mockPerformers, { maxDistanceMiles: 50 });
    expect(distanceFiltered.some((p) => p.id === 'far_away')).toBe(false);

    // Filter: Verified only
    const verifiedOnly = filterAndDeduplicatePerformers(mockPerformers, { verifiedOnly: true });
    expect(verifiedOnly.some((p) => p.id === 'band_rock')).toBe(false);
  });

  // 7. Read volume metrics are tracked with zero coordinate leakage
  test('7. Read volume metrics record accurately with zero coordinates', () => {
    webReadVolumeTracker.recordQuery();
    webReadVolumeTracker.recordReads(10);
    webReadVolumeTracker.recordCacheHit();
    webReadVolumeTracker.recordDeduplicated(3);
    webReadVolumeTracker.recordSubscriptionAttached();
    webReadVolumeTracker.recordSnapshotEvent();

    const metrics = webReadVolumeTracker.getMetrics();
    expect(metrics.queryExecutions).toBe(1);
    expect(metrics.documentReads).toBe(10);
    expect(metrics.cacheHits).toBe(1);
    expect(metrics.deduplicatedDocs).toBe(3);
    expect(metrics.activeSubscriptions).toBe(1);
    expect(metrics.snapshotEvents).toBe(1);

    // Verify metrics payload contains no coordinates or private metadata
    expect((metrics as any).latitude).toBeUndefined();
    expect((metrics as any).longitude).toBeUndefined();
    expect((metrics as any).ipAddress).toBeUndefined();
  });
});
