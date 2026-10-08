/**
 * Crowdbeats V2 — Discovery Data Service Unit Tests
 */

import {
  calculateHaversineDistanceMiles,
  isCheckinValidAndActive,
  calculateDaysRemaining,
  sortAndRankNearbyPerformers,
  getFallbackNearbyMusicians,
  getTop5NearestMusicians,
  getPopularMusicians,
  getTopCampaigns,
  subscribeToTop5NearestMusicians,
  CURATED_PERFORMERS_POOL,
  CURATED_CAMPAIGNS,
  type NearbyPerformer,
} from '../../lib/discovery/discoveryDataService';

// Mock Firestore
jest.mock('../../lib/firebase/firestore', () => {
  const actual = jest.requireActual('../../lib/firebase/firestore');
  return {
    ...actual,
    getFirebaseFirestore: jest.fn(() => ({})),
  };
});

// Mock firebase/firestore functions
const mockGetDocs = jest.fn();
const mockOnSnapshot = jest.fn();

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    collection: jest.fn(() => 'mock-collection'),
    query: jest.fn((...args) => ({ _queryArgs: args })),
    where: jest.fn((field, op, val) => ({ field, op, val })),
    orderBy: jest.fn((field, dir) => ({ field, dir })),
    limit: jest.fn((n) => ({ limit: n })),
    getDocs: (...args: any[]) => mockGetDocs(...args),
    onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  };
});

describe('Discovery Data Service — Core Mathematical & Ranking Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateHaversineDistanceMiles', () => {
    test('calculates 0 miles for identical coordinates', () => {
      const dist = calculateHaversineDistanceMiles(32.7157, -117.1611, 32.7157, -117.1611);
      expect(dist).toBe(0);
    });

    test('calculates accurate distance between Gaslamp and Pacific Beach (approx 7.5 - 8.0 miles)', () => {
      const gaslamp = { lat: 32.7115, lng: -117.1599 };
      const pacificBeach = { lat: 32.8025, lng: -117.2356 };
      const dist = calculateHaversineDistanceMiles(gaslamp.lat, gaslamp.lng, pacificBeach.lat, pacificBeach.lng);
      expect(dist).toBeGreaterThanOrEqual(7.0);
      expect(dist).toBeLessThanOrEqual(8.5);
    });

    test('handles invalid coordinates gracefully with fallback distance', () => {
      expect(calculateHaversineDistanceMiles(NaN, -117.1611, 32.7157, -117.1611)).toBe(999.9);
      expect(calculateHaversineDistanceMiles(32.7157, 'bad' as any, 32.7157, -117.1611)).toBe(999.9);
    });
  });

  describe('isCheckinValidAndActive', () => {
    test('accepts active public check-in created 1 hour ago with future expiresAt', () => {
      const now = Date.now();
      const validCheckin = {
        isLive: true,
        visibility: 'public',
        checkedInAt: new Date(now - 3600 * 1000).toISOString(),
        expiresAt: new Date(now + 5 * 3600 * 1000).toISOString(),
      };
      expect(isCheckinValidAndActive(validCheckin as any)).toBe(true);
    });

    test('rejects check-in if isLive is false', () => {
      const checkin = {
        isLive: false,
        visibility: 'public',
        checkedInAt: new Date().toISOString(),
      };
      expect(isCheckinValidAndActive(checkin as any)).toBe(false);
    });

    test('rejects non-public check-ins (e.g. followers_only or private)', () => {
      const checkin = {
        isLive: true,
        visibility: 'followers_only',
        checkedInAt: new Date().toISOString(),
      };
      expect(isCheckinValidAndActive(checkin as any)).toBe(false);
    });

    test('rejects expired check-in when expiresAt is in the past', () => {
      const now = Date.now();
      const expiredCheckin = {
        isLive: true,
        visibility: 'public',
        checkedInAt: new Date(now - 3 * 3600 * 1000).toISOString(),
        expiresAt: new Date(now - 60 * 1000).toISOString(), // expired 1 min ago
      };
      expect(isCheckinValidAndActive(expiredCheckin as any)).toBe(false);
    });

    test('rejects check-in older than 6 hours even without expiresAt', () => {
      const now = Date.now();
      const staleCheckin = {
        isLive: true,
        visibility: 'public',
        checkedInAt: new Date(now - 6.5 * 3600 * 1000).toISOString(), // 6.5h old
      };
      expect(isCheckinValidAndActive(staleCheckin as any)).toBe(false);
    });
  });

  describe('calculateDaysRemaining', () => {
    test('returns correct remaining days for a future deadline', () => {
      const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString();
      expect(calculateDaysRemaining(tenDaysFromNow)).toBe(10);
    });

    test('returns 0 for a past deadline', () => {
      const past = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      expect(calculateDaysRemaining(past)).toBe(0);
    });

    test('returns default 14 for missing or null deadline', () => {
      expect(calculateDaysRemaining(null)).toBe(14);
      expect(calculateDaysRemaining(undefined)).toBe(14);
    });
  });

  describe('sortAndRankNearbyPerformers', () => {
    test('sorts ascending by distance and assigns 1-based ranks (1 to 5)', () => {
      const performers: NearbyPerformer[] = [
        { rank: 0, id: 'p3', name: 'Charlie', type: 'artist', genres: ['Folk'], isLive: true, distanceMiles: 4.5, slug: 'charlie' },
        { rank: 0, id: 'p1', name: 'Alice', type: 'artist', genres: ['Rock'], isLive: true, distanceMiles: 1.2, slug: 'alice' },
        { rank: 0, id: 'p2', name: 'Bob', type: 'band', genres: ['Jazz'], isLive: true, distanceMiles: 2.8, slug: 'bob' },
      ];

      const ranked = sortAndRankNearbyPerformers(performers);
      expect(ranked.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
      expect(ranked.map((p) => p.rank)).toEqual([1, 2, 3]);
    });

    test('tie-breaks equal distance by more recent check-in timestamp', () => {
      const performers: NearbyPerformer[] = [
        { rank: 0, id: 'earlier', name: 'Artist A', type: 'artist', genres: ['Folk'], isLive: true, distanceMiles: 2.0, slug: 'a', checkedInAt: '2026-10-07T12:00:00Z' },
        { rank: 0, id: 'later', name: 'Artist B', type: 'artist', genres: ['Pop'], isLive: true, distanceMiles: 2.0, slug: 'b', checkedInAt: '2026-10-07T13:00:00Z' },
      ];

      const ranked = sortAndRankNearbyPerformers(performers);
      expect(ranked[0].id).toBe('later');
      expect(ranked[1].id).toBe('earlier');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(2);
    });
  });

  describe('getFallbackNearbyMusicians', () => {
    test('strictly enforces isLive === false for all fallback performers (never fake live status)', () => {
      const fallbacks = getFallbackNearbyMusicians(32.7157, -117.1611, 5);
      expect(fallbacks.length).toBe(5);
      for (const p of fallbacks) {
        expect(p.isLive).toBe(false);
        expect(p.rank).toBeGreaterThanOrEqual(1);
        expect(p.rank).toBeLessThanOrEqual(5);
        expect(typeof p.distanceMiles).toBe('number');
        expect(p.id).toBeDefined();
        expect(p.slug).toBeDefined();
      }
    });

    test('orders fallback performers ascending by distance from San Diego', () => {
      const fallbacks = getFallbackNearbyMusicians(32.7157, -117.1611, 5);
      for (let i = 0; i < fallbacks.length - 1; i++) {
        expect(fallbacks[i].distanceMiles).toBeLessThanOrEqual(fallbacks[i + 1].distanceMiles);
      }
    });

    test('provides dynamic local fallback for remote coordinate without faking live status', () => {
      // Remote coordinate (e.g., middle of Kansas)
      const fallbacks = getFallbackNearbyMusicians(39.0119, -98.4842, 5);
      expect(fallbacks.length).toBe(5);
      for (const p of fallbacks) {
        expect(p.isLive).toBe(false); // STRICT INVARIANT
        expect(p.distanceMiles).toBeLessThan(10);
      }
    });
  });
});

describe('Discovery Data Service — High-Level Async Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTop5NearestMusicians', () => {
    test('returns active live performers within radius sorted by distance with ranks 1..5', async () => {
      const now = Date.now();
      const mockDocs = [
        {
          data: () => ({
            uid: 'live_1',
            performerName: 'Live Artist 1',
            type: 'artist',
            photoUrl: 'http://photo1.jpg',
            genres: ['Acoustic'],
            venueName: 'Gaslamp Stage',
            latitude: 32.7130, // ~0.2 miles from (32.7157, -117.1611)
            longitude: -117.1620,
            isLive: true,
            checkedInAt: new Date(now - 1800 * 1000).toISOString(),
            expiresAt: new Date(now + 4 * 3600 * 1000).toISOString(),
            visibility: 'public',
            slug: 'live-artist-1',
          }),
        },
        {
          data: () => ({
            uid: 'live_2',
            performerName: 'Live Band 2',
            type: 'band',
            photoUrl: 'http://photo2.jpg',
            genres: ['Rock'],
            venueName: 'North Park Stage',
            latitude: 32.7456, // ~2.5 miles away
            longitude: -117.1293,
            isLive: true,
            checkedInAt: new Date(now - 3600 * 1000).toISOString(),
            expiresAt: new Date(now + 3 * 3600 * 1000).toISOString(),
            visibility: 'public',
            slug: 'live-band-2',
          }),
        },
        {
          // EXPIRED check-in — should be filtered out
          data: () => ({
            uid: 'live_expired',
            performerName: 'Expired Artist',
            type: 'artist',
            genres: ['Pop'],
            latitude: 32.7150,
            longitude: -117.1610,
            isLive: true,
            checkedInAt: new Date(now - 7 * 3600 * 1000).toISOString(), // > 6h
            expiresAt: new Date(now - 3600 * 1000).toISOString(), // expired
            visibility: 'public',
            slug: 'expired-artist',
          }),
        },
        {
          // NON-PUBLIC check-in — should be filtered out
          data: () => ({
            uid: 'live_private',
            performerName: 'Private Artist',
            type: 'artist',
            genres: ['Jazz'],
            latitude: 32.7150,
            longitude: -117.1610,
            isLive: true,
            checkedInAt: new Date(now - 1000).toISOString(),
            visibility: 'private',
            slug: 'private-artist',
          }),
        },
        {
          // TOO FAR check-in — > 25 miles
          data: () => ({
            uid: 'live_distant',
            performerName: 'Distant Band',
            type: 'band',
            genres: ['Metal'],
            latitude: 34.0522, // Los Angeles: ~110 miles away
            longitude: -118.2437,
            isLive: true,
            checkedInAt: new Date(now - 1000).toISOString(),
            expiresAt: new Date(now + 3600 * 1000).toISOString(),
            visibility: 'public',
            slug: 'distant-band',
          }),
        },
      ];

      mockGetDocs.mockResolvedValueOnce({
        forEach: (cb: any) => mockDocs.forEach(cb),
      });

      const results = await getTop5NearestMusicians(32.7157, -117.1611, 25);

      expect(results.length).toBe(2);
      expect(results[0].id).toBe('live_1');
      expect(results[0].rank).toBe(1);
      expect(results[0].isLive).toBe(true);

      expect(results[1].id).toBe('live_2');
      expect(results[1].rank).toBe(2);
      expect(results[1].isLive).toBe(true);
    });

    test('falls back to "Other musicians nearby" with isLive: false when no live check-ins exist', async () => {
      // Empty check-ins snapshot
      mockGetDocs.mockResolvedValueOnce({
        forEach: () => {},
      });

      const results = await getTop5NearestMusicians(32.7157, -117.1611, 25);

      expect(results.length).toBe(5);
      for (const p of results) {
        expect(p.isLive).toBe(false); // NEVER fake live status
        expect(p.rank).toBeGreaterThanOrEqual(1);
        expect(p.rank).toBeLessThanOrEqual(5);
      }
    });

    test('falls back gracefully when Firestore throws an error', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Network offline'));

      const results = await getTop5NearestMusicians(32.7157, -117.1611, 25);

      expect(results.length).toBe(5);
      expect(results.every((p) => p.isLive === false)).toBe(true);
    });
  });

  describe('getPopularMusicians', () => {
    test('returns top verified artists and bands ranked by popularityScore and followersCount', async () => {
      // Simulate Firestore returning artist and band docs
      mockGetDocs
        .mockResolvedValueOnce({
          empty: false,
          forEach: (cb: any) => {
            cb({
              id: 'art_1',
              data: () => ({
                stageName: 'Pop Star A',
                popularityScore: 95,
                followersCount: 3000,
                isVerified: true,
                genres: ['Pop'],
              }),
            });
          },
        })
        .mockResolvedValueOnce({
          empty: false,
          forEach: (cb: any) => {
            cb({
              id: 'bnd_1',
              data: () => ({
                name: 'Rock Band B',
                popularityScore: 98,
                followersCount: 5000,
                isVerified: true,
                genres: ['Rock'],
              }),
            });
          },
        });

      const popular = await getPopularMusicians(3);

      expect(popular.length).toBe(2);
      expect(popular[0].id).toBe('bnd_1');
      expect(popular[0].rank).toBe(1);
      expect(popular[0].popularityScore).toBe(98);

      expect(popular[1].id).toBe('art_1');
      expect(popular[1].rank).toBe(2);
      expect(popular[1].popularityScore).toBe(95);
    });

    test('falls back to curated verified musicians pool when Firestore is empty', async () => {
      mockGetDocs
        .mockResolvedValueOnce({ empty: true, forEach: () => {} })
        .mockResolvedValueOnce({ empty: true, forEach: () => {} });

      const popular = await getPopularMusicians(3);

      expect(popular.length).toBe(3);
      expect(popular.every((p) => p.isVerified === true)).toBe(true);
      expect(popular[0].rank).toBe(1);
      expect(popular[1].rank).toBe(2);
      expect(popular[2].rank).toBe(3);
      expect(popular[0].popularityScore).toBeGreaterThanOrEqual(popular[1].popularityScore);
    });
  });

  describe('getTopCampaigns', () => {
    test('calculates percentFunded and daysRemaining accurately from Firestore documents', async () => {
      const deadline = new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString();
      mockGetDocs.mockResolvedValueOnce({
        forEach: (cb: any) => {
          cb({
            id: 'cmp_mock',
            data: () => ({
              creatorId: 'c_1',
              creatorName: 'The Creators',
              creatorType: 'band',
              title: 'Studio Gear Campaign',
              description: 'Upgrading our mic collection',
              goalCents: 1000000, // $10,000
              pledgedCents: 750000, // $7,500
              backerCount: 120,
              status: 'active',
              deadline,
              category: 'Studio Gear',
            }),
          });
        },
      });

      const campaigns = await getTopCampaigns(3);

      expect(campaigns.length).toBe(1);
      expect(campaigns[0].campaignId).toBe('cmp_mock');
      expect(campaigns[0].percentFunded).toBe(75); // Math.round((750000 / 1000000) * 100)
      expect(campaigns[0].daysRemaining).toBe(10);
      expect(campaigns[0].backerCount).toBe(120);
    });

    test('falls back to curated active campaigns when Firestore fails', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Campaigns collection inaccessible'));

      const campaigns = await getTopCampaigns(3);

      expect(campaigns.length).toBe(3);
      expect(campaigns[0].percentFunded).toBe(75); // First curated campaign
      expect(campaigns[0].title).toBe('Neon Horizon Debut Vinyl & UK Tour');
    });
  });

  describe('subscribeToTop5NearestMusicians', () => {
    test('invokes callback with isFallback: false when active live performers exist', () => {
      let snapshotHandler: any;
      mockOnSnapshot.mockImplementationOnce((query, onNext) => {
        snapshotHandler = onNext;
        return () => {};
      });

      const callback = jest.fn();
      subscribeToTop5NearestMusicians(32.7157, -117.1611, 25, callback);

      expect(mockOnSnapshot).toHaveBeenCalled();

      // Trigger snapshot with a live performer
      snapshotHandler({
        forEach: (cb: any) => {
          cb({
            data: () => ({
              uid: 'live_live_1',
              performerName: 'Now Playing Artist',
              type: 'artist',
              genres: ['Indie'],
              latitude: 32.7160,
              longitude: -117.1610,
              isLive: true,
              checkedInAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
              visibility: 'public',
              slug: 'now-playing',
            }),
          });
        },
      });

      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'live_live_1',
            isLive: true,
            rank: 1,
          }),
        ]),
        false // wasFallback === false
      );
    });

    test('invokes callback with isFallback: true and all isLive: false when no live check-ins exist', () => {
      let snapshotHandler: any;
      mockOnSnapshot.mockImplementationOnce((query, onNext) => {
        snapshotHandler = onNext;
        return () => {};
      });

      const callback = jest.fn();
      subscribeToTop5NearestMusicians(32.7157, -117.1611, 25, callback);

      // Trigger empty snapshot
      snapshotHandler({
        forEach: () => {},
      });

      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            isLive: false, // Invariant maintained
            rank: 1,
          }),
        ]),
        true // wasFallback === true
      );
    });
  });
});
