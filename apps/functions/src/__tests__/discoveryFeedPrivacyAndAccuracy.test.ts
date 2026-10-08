/**
 * Crowdbeats V2 — Discovery Feed Privacy, Truthful Live Now, and Real Coordinates Test Suite
 *
 * Verifies:
 * 1. Coordinates are NEVER fabricated with Math.random().
 * 2. Query country, administrativeArea, city, and viewport are respected (e.g. London, UK).
 * 3. Server-authoritative Truthful Live Now: performers are only marked live if an active unexpired session exists.
 * 4. Stale/expired sessions do not appear in Live Now.
 * 5. Audience privacy: Fan and guest precise coordinates are never returned in public discovery feed.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const store: Record<string, any> = {};

const mockDoc = (path: string): any => {
  const id = path.split('/').pop();
  return {
    id,
    get: jest.fn<any>().mockImplementation(async () => {
      const data = store[path];
      return {
        exists: data !== undefined,
        data: () => data,
        id,
        ref: mockDoc(path),
      };
    }),
    set: jest.fn<any>().mockImplementation(async (data: any) => {
      store[path] = { ...data };
    }),
  };
};

const mockCollection = (colPath: string): any => {
  return {
    doc: (docId?: string) => {
      const id = docId || `mock_${Math.random().toString(36).substring(7)}`;
      return mockDoc(`${colPath}/${id}`);
    },
    where: jest.fn<any>().mockImplementation((field: string, op: string, val: any) => {
      const conditions: Array<{ field: string; op: string; val: any }> = [{ field, op, val }];
      const queryObj: any = {
        where: jest.fn<any>().mockImplementation((f: string, o: string, v: any) => {
          conditions.push({ field: f, op: o, val: v });
          return queryObj;
        }),
        limit: jest.fn<any>().mockReturnThis(),
        get: jest.fn<any>().mockImplementation(async () => {
          const docs: any[] = [];
          for (const [k, v] of Object.entries(store)) {
            if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
              let match = true;
              for (const cond of conditions) {
                if (cond.op === '==' && v[cond.field] !== cond.val) {
                  match = false;
                  break;
                }
              }
              if (match) {
                docs.push({
                  id: k.split('/').pop(),
                  data: () => v,
                  exists: true,
                });
              }
            }
          }
          return { docs, empty: docs.length === 0, size: docs.length };
        }),
      };
      return queryObj;
    }),
    get: jest.fn<any>().mockImplementation(async () => {
      const docs: any[] = [];
      for (const [k, v] of Object.entries(store)) {
        if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
          docs.push({
            id: k.split('/').pop(),
            data: () => v,
            exists: true,
          });
        }
      }
      return { docs, empty: docs.length === 0, size: docs.length };
    }),
  };
};

const mockFirestore = {
  collection: (col: string) => mockCollection(col),
};

jest.mock('firebase-admin', () => {
  return {
    apps: [{}],
    initializeApp: jest.fn(),
    firestore: Object.assign(
      jest.fn(() => mockFirestore),
      {
        Timestamp: {
          now: () => ({
            toMillis: () => Date.now(),
            toDate: () => new Date(),
          }),
          fromDate: (d: Date) => ({
            toMillis: () => d.getTime(),
            toDate: () => d,
          }),
        },
        FieldValue: {
          serverTimestamp: () => new Date().toISOString(),
        },
      },
    ),
  };
});

describe('Public Discovery Feed Accuracy & Privacy Test Suite', () => {
  let getPublicDiscoveryFeed: any;

  beforeEach(async () => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    const module = await import('../discovery/getPublicDiscoveryFeed.js');
    getPublicDiscoveryFeed = module.getPublicDiscoveryFeed;
  });

  it('respects query country, administrativeArea, city, and viewport without hardcoding California/US', async () => {
    // Exploring London, UK
    const res = await (getPublicDiscoveryFeed as any).run({
      data: {
        latitude: 51.5074,
        longitude: -0.1278,
        city: 'London',
        administrativeArea: 'Greater London',
        country: 'United Kingdom',
        displayName: 'London, Greater London, United Kingdom',
        placeId: 'loc_london_uk',
        viewport: {
          northeast: { lat: 51.6, lng: 0.1 },
          southwest: { lat: 51.4, lng: -0.3 },
        },
      },
    });

    expect(res.location.city).toBe('London');
    expect(res.location.administrativeArea).toBe('Greater London');
    expect(res.location.country).toBe('United Kingdom');
    expect(res.location.displayName).toBe('London, Greater London, United Kingdom');
    expect(res.location.latitude).toBeCloseTo(51.5074);
    expect(res.location.longitude).toBeCloseTo(-0.1278);
    expect(res.location.viewport).toBeDefined();
    expect(res.location.viewport.northeast.lat).toBe(51.6);
  });

  it('eliminates fabricated coordinates and only returns real coordinates', async () => {
    // Artist with NO explicit discovery location and NO active session
    store['artistProfiles/artist_no_loc'] = {
      artistId: 'artist_no_loc',
      stageName: 'Studio Musician',
      genres: ['Jazz'],
      isActive: true,
      city: 'London',
      country: 'United Kingdom',
    };

    // Artist with explicit discovery location in London
    store['artistProfiles/artist_london'] = {
      artistId: 'artist_london',
      stageName: 'London Busker',
      genres: ['Acoustic'],
      isActive: true,
      discoveryLatitude: 51.5080,
      discoveryLongitude: -0.1280,
      city: 'London',
      country: 'United Kingdom',
    };

    const res = await (getPublicDiscoveryFeed as any).run({
      data: {
        latitude: 51.5074,
        longitude: -0.1278,
        city: 'London',
        country: 'United Kingdom',
      },
    });

    const artistWithLoc = res.featuredArtists.find((a: any) => a.artistId === 'artist_london');
    expect(artistWithLoc).toBeDefined();
    expect(artistWithLoc.discoveryLocation.latitude).toBe(51.5080);
    expect(artistWithLoc.discoveryLocation.longitude).toBe(-0.1280);
    expect(artistWithLoc.distanceMiles).toBeDefined();

    const artistNoLoc = res.featuredArtists.find((a: any) => a.artistId === 'artist_no_loc');
    expect(artistNoLoc).toBeDefined();
    // Must NOT have fabricated lat/lng!
    expect(artistNoLoc.discoveryLocation?.latitude).toBeUndefined();
    expect(artistNoLoc.discoveryLocation?.longitude).toBeUndefined();
    expect(artistNoLoc.distanceMiles).toBeUndefined();
  });

  it('enforces Truthful Live Now: artist is live only when active unexpired session exists', async () => {
    const nowMs = Date.now();
    const futureTime = new Date(nowMs + 3600_000).toISOString();
    const pastTime = new Date(nowMs - 1800_000).toISOString();

    // Artist 1 has an active unexpired session
    store['artistProfiles/artist_live'] = {
      artistId: 'artist_live',
      stageName: 'Live Band Leader',
      genres: ['Rock'],
      isActive: true,
      isLive: false, // doc says false, but unexpired session exists!
    };
    store['sessions/sess_active_1'] = {
      sessionId: 'sess_active_1',
      performerId: 'artist_live',
      performerName: 'Live Band Leader',
      performerType: 'artist',
      status: 'live',
      lat: 51.5074,
      lng: -0.1278,
      venueName: 'The Camden Underworld',
      startedAt: new Date(nowMs - 1800_000).toISOString(),
      endsAt: futureTime,
    };

    // Artist 2 has an EXPIRED session (and doc says isLive: true from yesterday)
    store['artistProfiles/artist_stale'] = {
      artistId: 'artist_stale',
      stageName: 'Stale Artist',
      genres: ['Pop'],
      isActive: true,
      isLive: true, // stale flag in database!
    };
    store['sessions/sess_expired_1'] = {
      sessionId: 'sess_expired_1',
      performerId: 'artist_stale',
      performerName: 'Stale Artist',
      performerType: 'artist',
      status: 'live',
      lat: 51.5074,
      lng: -0.1278,
      venueName: 'Yesterday Stage',
      startedAt: new Date(nowMs - 7200_000).toISOString(),
      endsAt: pastTime,
    };

    const res = await (getPublicDiscoveryFeed as any).run({
      data: {
        latitude: 51.5074,
        longitude: -0.1278,
        city: 'London',
        country: 'United Kingdom',
      },
    });

    // Artist 1 must be truthfully live
    const artistLive = res.featuredArtists.find((a: any) => a.artistId === 'artist_live');
    expect(artistLive.isLive).toBe(true);
    expect(artistLive.currentVenueName).toBe('The Camden Underworld');

    // Artist 2 must NOT be live despite stale doc flag
    const artistStale = res.featuredArtists.find((a: any) => a.artistId === 'artist_stale');
    expect(artistStale.isLive).toBe(false);
    expect(artistStale.currentVenueName).toBeUndefined();

    // Live performances list must only include unexpired session
    expect(res.livePerformances).toHaveLength(1);
    expect(res.livePerformances[0].performerId).toBe('artist_live');
    expect(res.totalLiveCount).toBe(1);
  });

  it('enforces audience privacy: never returns fan or guest locations in response', async () => {
    store['artistProfiles/artist_1'] = {
      artistId: 'artist_1',
      stageName: 'Guitar Hero',
      isActive: true,
      discoveryLatitude: 51.51,
      discoveryLongitude: -0.12,
    };

    // Ensure audience/fan mock collections exist in store to test non-leakage
    store['sessions/sess_1'] = {
      sessionId: 'sess_1',
      performerId: 'artist_1',
      status: 'live',
      lat: 51.51,
      lng: -0.12,
      endsAt: new Date(Date.now() + 3600_000).toISOString(),
    };
    store['sessions/sess_1/audienceGrants/grant_fan_123'] = {
      fanUid: 'fan_super_private',
      rawGpsLat: 51.51005,
      rawGpsLng: -0.12005,
    };

    const res = await (getPublicDiscoveryFeed as any).run({
      data: {
        latitude: 51.5074,
        longitude: -0.1278,
      },
    });

    const serialized = JSON.stringify(res);
    expect(serialized).not.toContain('fan_super_private');
    expect(serialized).not.toContain('rawGpsLat');
    expect(serialized).not.toContain('rawGpsLng');
    expect(serialized).not.toContain('audienceGrants');
  });
});
