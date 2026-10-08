/**
 * Crowdbeats V2 — Camera-Triggered Nearby Performer Tipping Test Suite
 *
 * Verifies:
 * 1. 100m geospatial boundary: strictly matches active performers <= 100m.
 * 2. Uncertainty & Chooser threshold: accuracy > 50m or multiple candidates triggers requiresChooser.
 * 3. Social safety & Block enforcement: blocked entities are excluded from results.
 * 4. Band identity & payout integrity: band check-in maps to Band entity, not member UIDs.
 * 5. Default tip amount: set to 500 cents ($5.00 USD).
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
      const id = docId || `doc_${Math.random().toString(36).substring(7)}`;
      return mockDoc(`${colPath}/${id}`);
    },
    where: jest.fn<any>().mockImplementation((field: string, op: string, val: any) => {
      return {
        where: jest.fn<any>().mockReturnThis(),
        limit: jest.fn<any>().mockReturnThis(),
        get: jest.fn<any>().mockImplementation(async () => {
          const docs: any[] = [];
          for (const [k, v] of Object.entries(store)) {
            if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
              if (op === '==' && v[field] === val) {
                docs.push({
                  id: k.split('/').pop(),
                  data: () => v,
                });
              }
            }
          }
          return { docs, empty: docs.length === 0, size: docs.length };
        }),
      };
    }),
  };
};

const mockFirestore = {
  collection: (col: string) => mockCollection(col),
};

jest.mock('../session/sessionHelpers.js', () => {
  const actual = jest.requireActual('../session/sessionHelpers.js') as any;
  return {
    ...actual,
    getFirestoreDb: () => mockFirestore,
    areUsersBlocked: jest.fn<any>().mockImplementation(async (db: any, uid1: string, uid2: string) => {
      return store[`blocks_${uid1}_${uid2}`] === true || store[`blocks_${uid2}_${uid1}`] === true;
    }),
  };
});

jest.mock('../lib/rateLimiter.js', () => ({
  enforceRateLimit: jest.fn<any>().mockResolvedValue(undefined),
}));

describe('Camera-Triggered Nearby Performer Tipping Suite', () => {
  let getNearbyLivePerformers: any;

  beforeEach(async () => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    const module = await import('../session/nearbyPerformerCallables.js');
    getNearbyLivePerformers = module.getNearbyLivePerformers;
  });

  it('correctly matches a solo artist within 100 meters', async () => {
    // Stage coordinate: 34.0522, -118.2437 (Los Angeles)
    // Fan coordinate: ~30 meters away: 34.0524, -118.2437
    store['sessions/session_solo_1'] = {
      status: 'live',
      performerId: 'artist_maya',
      performerType: 'artist',
      performerName: 'Maya Lin',
      publicLat: 34.0522,
      publicLng: -118.2437,
      genres: ['Indie Folk', 'Acoustic'],
      locationType: 'street',
    };

    const res = await (getNearbyLivePerformers as any).run({
      auth: { uid: 'fan_alex' },
      data: {
        query: {
          lat: 34.0524,
          lng: -118.2437,
          accuracyMeters: 15,
          timestamp: new Date().toISOString(),
        },
      },
    });

    expect(res.candidates).toHaveLength(1);
    expect(res.candidates[0].performerId).toBe('artist_maya');
    expect(res.candidates[0].performerType).toBe('artist');
    expect(res.candidates[0].defaultTipAmountCents).toBe(500);
    expect(res.candidates[0].distanceMeters).toBeLessThan(100);
    expect(res.requiresChooser).toBe(false); // 1 candidate and accuracy <= 50m
    expect(res.selectedCandidate?.performerId).toBe('artist_maya');
    expect(res.disambiguationReason).toBe('none');
  });

  it('excludes performers farther than 100 meters away', async () => {
    // 200m away: latitude diff ~ 0.002 deg
    store['sessions/session_far_1'] = {
      status: 'live',
      performerId: 'artist_distant',
      performerType: 'artist',
      performerName: 'Distant Performer',
      publicLat: 34.0550,
      publicLng: -118.2437,
      genres: ['Jazz'],
    };

    const res = await (getNearbyLivePerformers as any).run({
      auth: { uid: 'fan_alex' },
      data: {
        query: {
          lat: 34.0522,
          lng: -118.2437,
          accuracyMeters: 10,
          timestamp: new Date().toISOString(),
        },
      },
    });

    expect(res.candidates).toHaveLength(0);
    expect(res.requiresChooser).toBe(false);
    expect(res.disambiguationReason).toBe('no_performers_in_range');
  });

  it('triggers requiresChooser when device accuracy > 50 meters', async () => {
    store['sessions/session_solo_1'] = {
      status: 'live',
      performerId: 'artist_maya',
      performerType: 'artist',
      performerName: 'Maya Lin',
      publicLat: 34.0522,
      publicLng: -118.2437,
      genres: ['Indie Folk'],
    };

    const res = await (getNearbyLivePerformers as any).run({
      auth: { uid: 'fan_alex' },
      data: {
        query: {
          lat: 34.0524,
          lng: -118.2437,
          accuracyMeters: 65, // Coarse GPS > 50m!
          timestamp: new Date().toISOString(),
        },
      },
    });

    expect(res.candidates).toHaveLength(1);
    expect(res.requiresChooser).toBe(true); // Must prompt chooser due to uncertainty!
    expect(res.disambiguationReason).toBe('poor_gps_accuracy');
  });

  it('triggers requiresChooser when multiple acts are within 100m', async () => {
    store['sessions/session_act_1'] = {
      status: 'live',
      performerId: 'artist_maya',
      performerType: 'artist',
      performerName: 'Maya Lin',
      publicLat: 34.0522,
      publicLng: -118.2437,
    };
    store['sessions/session_band_1'] = {
      status: 'live',
      performerId: 'band_neon_pulse',
      performerType: 'band',
      performerName: 'Neon Pulse',
      publicLat: 34.0523,
      publicLng: -118.2436,
    };

    const res = await (getNearbyLivePerformers as any).run({
      auth: { uid: 'fan_alex' },
      data: {
        query: {
          lat: 34.0522,
          lng: -118.2437,
          accuracyMeters: 15,
          timestamp: new Date().toISOString(),
        },
      },
    });

    expect(res.candidates).toHaveLength(2);
    expect(res.requiresChooser).toBe(true); // > 1 candidate requires chooser
    expect(res.disambiguationReason).toBe('multiple_performers');
    expect(res.candidates[0].distanceMeters).toBeLessThanOrEqual(res.candidates[1].distanceMeters);
  });

  it('excludes blocked performers from discovery results', async () => {
    store['sessions/session_solo_1'] = {
      status: 'live',
      performerId: 'artist_blocked',
      performerType: 'artist',
      performerName: 'Blocked Performer',
      publicLat: 34.0522,
      publicLng: -118.2437,
    };

    // Mark as blocked between fan_alex and artist_blocked
    store['blocks_fan_alex_artist_blocked'] = true;

    const res = await (getNearbyLivePerformers as any).run({
      auth: { uid: 'fan_alex' },
      data: {
        query: {
          lat: 34.0522,
          lng: -118.2437,
          accuracyMeters: 15,
          timestamp: new Date().toISOString(),
        },
      },
    });

    expect(res.candidates).toHaveLength(0);
  });

  it('ensures Band session resolves to Band collective entity', async () => {
    store['sessions/session_band_42'] = {
      status: 'live',
      performerId: 'band_electric_groove',
      performerType: 'band',
      performerName: 'Electric Groove',
      publicLat: 34.0522,
      publicLng: -118.2437,
      genres: ['Funk', 'Electronic'],
      locationType: 'venue',
      venueName: 'The Roxy Theatre',
    };

    const res = await (getNearbyLivePerformers as any).run({
      auth: { uid: 'guest_user' },
      data: {
        query: {
          lat: 34.0523,
          lng: -118.2437,
          accuracyMeters: 20,
          timestamp: new Date().toISOString(),
        },
      },
    });

    expect(res.candidates).toHaveLength(1);
    const candidate = res.candidates[0];
    expect(candidate.performerId).toBe('band_electric_groove');
    expect(candidate.performerType).toBe('band');
    expect(candidate.venueName).toBe('The Roxy Theatre');
    expect(candidate.defaultTipAmountCents).toBe(500);
  });
});
