/**
 * Crowdbeats V2 — Phase 6 Trusted Verification, Session Lease, & Audience Radar Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── In-Memory Firestore Mock Store ──────────────────────────────────────────

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
    set: jest.fn<any>().mockImplementation(async (data: any, options?: any) => {
      if (options?.merge && store[path]) {
        store[path] = { ...store[path], ...data };
      } else {
        store[path] = { ...data };
      }
    }),
    update: jest.fn<any>().mockImplementation(async (data: any) => {
      if (!store[path]) throw new Error(`Doc not found: ${path}`);
      store[path] = { ...store[path], ...data };
    }),
    delete: jest.fn<any>().mockImplementation(async () => {
      delete store[path];
    }),
    collection: (subCol: string) => mockCollection(`${path}/${subCol}`),
  };
};

const mockCollection = (colPath: string): any => {
  return {
    doc: (docId?: string) => {
      const id = docId || `mock_doc_${Math.random().toString(36).substring(7)}`;
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

const mockBatch = () => {
  const operations: Array<() => void> = [];
  return {
    set: jest.fn((docRef: any, data: any, options?: any) => {
      operations.push(() => docRef.set(data, options));
    }),
    update: jest.fn((docRef: any, data: any) => {
      operations.push(() => docRef.update(data));
    }),
    delete: jest.fn((docRef: any) => {
      operations.push(() => docRef.delete());
    }),
    commit: jest.fn(async () => {
      for (const op of operations) op();
    }),
  };
};

jest.mock('firebase-admin', () => {
  return {
    firestore: Object.assign(
      jest.fn(() => ({
        collection: (path: string) => mockCollection(path),
        batch: () => mockBatch(),
      })),
      {
        FieldValue: {
          serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
          increment: jest.fn((n: number) => n),
        },
        Timestamp: {
          fromDate: jest.fn((d: Date) => ({
            toDate: () => d,
            toMillis: () => d.getTime(),
          })),
          fromMillis: jest.fn((ms: number) => ({
            toDate: () => new Date(ms),
            toMillis: () => ms,
          })),
        },
        GeoPoint: class GeoPoint {
          latitude: number;
          longitude: number;
          constructor(lat: number, lng: number) {
            this.latitude = lat;
            this.longitude = lng;
          }
        },
      },
    ),
    apps: ['mock-app'],
    initializeApp: jest.fn(),
  };
});

jest.mock('firebase-functions/v2/https', () => ({
  onCall: jest.fn((_opts: any, handler: any) => {
    return {
      run: (req: any) => handler(req),
    };
  }),
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'HttpsError';
    }
  },
}));

import {
  startCheckIn,
  submitCheckInSample,
  startStationaryLiveSession,
} from '../session/checkInCallables';
import {
  startMobileLiveSession,
  submitMobileLocationSample,
  pauseMobileLocation,
} from '../session/mobileLiveCallables';
import {
  renewSessionLease,
  endLiveSession,
  adminForceEnd,
} from '../session/sessionLeaseCallables';
import {
  optIntoAggregateAudienceSignal,
  grantAudienceVisibility,
  revokeAudienceVisibility,
  getCreatorAudienceRadar,
} from '../session/audienceRadarCallables';

describe('Phase 6 — Trusted Verification, Session Lease, and Audience Radar', () => {
  // Common test coordinates (Culver City, CA)
  const CANONICAL_VENUE_LAT = 34.0211;
  const CANONICAL_VENUE_LNG = -118.3965;

  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(store)) {
      delete store[key];
    }

    // Seed test venue
    store['venues/venue_culver'] = {
      venueId: 'venue_culver',
      name: 'Culver Blues Club',
      lat: CANONICAL_VENUE_LAT,
      lng: CANONICAL_VENUE_LNG,
      geofenceRadiusMeters: 200,
      isActive: true,
    };

    // Seed test users
    store['users/artist_1'] = {
      uid: 'artist_1',
      displayName: 'Solo Singer',
      personaType: 'artist',
      isActive: true,
    };

    store['users/artist_suspended'] = {
      uid: 'artist_suspended',
      displayName: 'Suspended Singer',
      personaType: 'artist',
      isSuspended: true,
    };

    store['users/fan_1'] = {
      uid: 'fan_1',
      displayName: 'Alice Fan',
      personaType: 'fan',
      photoUrl: 'https://example.com/alice.jpg',
    };

    store['users/fan_2'] = {
      uid: 'fan_2',
      displayName: 'Bob Fan',
      personaType: 'fan',
    };

    // Seed band
    store['bands/band_rock'] = {
      bandId: 'band_rock',
      name: 'The Rockers',
      isActive: true,
    };
    store['bands/band_rock/members/artist_1'] = {
      uid: 'artist_1',
      bandId: 'band_rock',
      role: 'BAND_FOUNDER',
      isActive: true,
    };
  });

  // ── 1. startCheckIn ──────────────────────────────────────────────────────────
  describe('startCheckIn', () => {
    it('rejects unauthenticated caller', async () => {
      await expect(
        (startCheckIn as any).run({
          auth: null,
          data: { profileId: 'artist_1', role: 'artist', selectedVenueId: 'venue_culver', idempotencyKey: 'idem_key_12345' },
        }),
      ).rejects.toThrow('Authentication required.');
    });

    it('rejects caller attempting to check in for a different solo artist', async () => {
      await expect(
        (startCheckIn as any).run({
          auth: { uid: 'fan_1' },
          data: { profileId: 'artist_1', role: 'artist', selectedVenueId: 'venue_culver', idempotencyKey: 'idem_key_12345' },
        }),
      ).rejects.toThrow('You can only start sessions or check-ins for your own artist profile.');
    });

    it('rejects suspended solo artist', async () => {
      await expect(
        (startCheckIn as any).run({
          auth: { uid: 'artist_suspended' },
          data: { profileId: 'artist_suspended', role: 'artist', selectedVenueId: 'venue_culver', idempotencyKey: 'idem_key_12345' },
        }),
      ).rejects.toThrow('Account is suspended or banned.');
    });

    it('rejects caller that is not an active member of the band', async () => {
      await expect(
        (startCheckIn as any).run({
          auth: { uid: 'fan_1' },
          data: { profileId: 'band_rock', role: 'band', selectedVenueId: 'venue_culver', idempotencyKey: 'idem_key_12345' },
        }),
      ).rejects.toThrow('You are not a member of this band.');
    });

    it('successfully initiates check-in attempt for authorized performer', async () => {
      const res = await (startCheckIn as any).run({
        auth: { uid: 'artist_1' },
        data: { profileId: 'artist_1', role: 'artist', selectedVenueId: 'venue_culver', idempotencyKey: 'idem_key_12345' },
      });

      expect(res.checkInAttemptId).toBeDefined();
      expect(res.venueId).toBe('venue_culver');
      expect(res.venueName).toBe('Culver Blues Club');
      expect(res.allowedRadiusMeters).toBe(200);

      // Verify attempt doc created
      const attempt = store[`checkInAttempts/${res.checkInAttemptId}`];
      expect(attempt).toBeDefined();
      expect(attempt.status).toBe('acquiring');
      expect(attempt.performerId).toBe('artist_1');
    });

    it('replays idempotent request cleanly', async () => {
      const req = {
        auth: { uid: 'artist_1' },
        data: { profileId: 'artist_1', role: 'artist', selectedVenueId: 'venue_culver', idempotencyKey: 'idem_key_replay_1' },
      };
      const res1 = await (startCheckIn as any).run(req);
      const res2 = await (startCheckIn as any).run(req);
      expect(res1.checkInAttemptId).toBe(res2.checkInAttemptId);
    });
  });

  // ── 2. submitCheckInSample ───────────────────────────────────────────────────
  describe('submitCheckInSample', () => {
    let attemptId: string;

    beforeEach(async () => {
      const res = await (startCheckIn as any).run({
        auth: { uid: 'artist_1' },
        data: { profileId: 'artist_1', role: 'artist', selectedVenueId: 'venue_culver', idempotencyKey: 'idem_key_sample_setup' },
      });
      attemptId = res.checkInAttemptId;
    });

    it('rejects mock GPS coordinates', async () => {
      await expect(
        (submitCheckInSample as any).run({
          auth: { uid: 'artist_1' },
          data: {
            checkInAttemptId: attemptId,
            sample: {
              lat: CANONICAL_VENUE_LAT,
              lng: CANONICAL_VENUE_LNG,
              accuracyMeters: 10,
              timestamp: new Date().toISOString(),
              isMock: true,
            },
          },
        }),
      ).rejects.toThrow('Mock GPS coordinates are rejected.');

      expect(store[`checkInAttempts/${attemptId}`].status).toBe('rejected');
    });

    it('rejects stale sample older than 30 seconds', async () => {
      const staleTimestamp = new Date(Date.now() - 45_000).toISOString();
      await expect(
        (submitCheckInSample as any).run({
          auth: { uid: 'artist_1' },
          data: {
            checkInAttemptId: attemptId,
            sample: {
              lat: CANONICAL_VENUE_LAT,
              lng: CANONICAL_VENUE_LNG,
              accuracyMeters: 10,
              timestamp: staleTimestamp,
            },
          },
        }),
      ).rejects.toThrow('Sample timestamp is stale (> 30 seconds old).');
    });

    it('rejects sample with poor accuracy (> 50m)', async () => {
      await expect(
        (submitCheckInSample as any).run({
          auth: { uid: 'artist_1' },
          data: {
            checkInAttemptId: attemptId,
            sample: {
              lat: CANONICAL_VENUE_LAT,
              lng: CANONICAL_VENUE_LNG,
              accuracyMeters: 75, // > 50m
              timestamp: new Date().toISOString(),
            },
          },
        }),
      ).rejects.toThrow('GPS accuracy (75m) exceeds maximum allowable threshold (50m).');
    });

    it('rejects sample outside venue radius (> 200m)', async () => {
      // Coordinates ~1.5km away
      const farLat = CANONICAL_VENUE_LAT + 0.015;
      const farLng = CANONICAL_VENUE_LNG + 0.015;

      await expect(
        (submitCheckInSample as any).run({
          auth: { uid: 'artist_1' },
          data: {
            checkInAttemptId: attemptId,
            sample: {
              lat: farLat,
              lng: farLng,
              accuracyMeters: 15,
              timestamp: new Date().toISOString(),
            },
          },
        }),
      ).rejects.toThrow(/Location is outside venue radius/);

      expect(store[`checkInAttempts/${attemptId}`].status).toBe('rejected');
    });

    it('verifies valid, proximate, fresh, high-accuracy sample', async () => {
      // 20 meters from canonical venue
      const nearLat = CANONICAL_VENUE_LAT + 0.0001;
      const nearLng = CANONICAL_VENUE_LNG + 0.0001;

      const res = await (submitCheckInSample as any).run({
        auth: { uid: 'artist_1' },
        data: {
          checkInAttemptId: attemptId,
          sample: {
            lat: nearLat,
            lng: nearLng,
            accuracyMeters: 12,
            timestamp: new Date().toISOString(),
          },
        },
      });

      expect(res.verified).toBe(true);
      expect(res.venueName).toBe('Culver Blues Club');
      expect(store[`checkInAttempts/${attemptId}`].status).toBe('verified');
      expect(store[`checkInAttempts/${attemptId}`].verifiedSample).toBeDefined();
    });
  });

  // ── 3. startStationaryLiveSession ────────────────────────────────────────────
  describe('startStationaryLiveSession', () => {
    let verifiedAttemptId: string;

    beforeEach(async () => {
      const cin = await (startCheckIn as any).run({
        auth: { uid: 'artist_1' },
        data: { profileId: 'artist_1', role: 'artist', selectedVenueId: 'venue_culver', idempotencyKey: 'idem_stat_setup' },
      });
      await (submitCheckInSample as any).run({
        auth: { uid: 'artist_1' },
        data: {
          checkInAttemptId: cin.checkInAttemptId,
          sample: {
            lat: CANONICAL_VENUE_LAT + 0.0001,
            lng: CANONICAL_VENUE_LNG + 0.0001,
            accuracyMeters: 10,
            timestamp: new Date().toISOString(),
          },
        },
      });
      verifiedAttemptId = cin.checkInAttemptId;
    });

    it('rejects if attempt is not verified', async () => {
      store[`checkInAttempts/${verifiedAttemptId}`].status = 'acquiring';
      await expect(
        (startStationaryLiveSession as any).run({
          auth: { uid: 'artist_1' },
          data: { verifiedAttemptId, idempotencyKey: 'idem_start_stat_1' },
        }),
      ).rejects.toThrow('Check-in attempt is acquiring, not verified.');
    });

    it('creates stationary session with CANONICAL VENUE PIN (never raw GPS)', async () => {
      const res = await (startStationaryLiveSession as any).run({
        auth: { uid: 'artist_1' },
        data: { verifiedAttemptId, requestedDurationMinutes: 120, idempotencyKey: 'idem_start_stat_1' },
      });

      expect(res.sessionId).toBeDefined();
      expect(res.locationType).toBe('venue');
      // Public coordinates must match venue coordinates exactly!
      expect(res.publicLat).toBe(CANONICAL_VENUE_LAT);
      expect(res.publicLng).toBe(CANONICAL_VENUE_LNG);

      const session = store[`sessions/${res.sessionId}`];
      expect(session.status).toBe('live');
      expect(session.lat).toBe(CANONICAL_VENUE_LAT);
      expect(session.lng).toBe(CANONICAL_VENUE_LNG);

      // Private location subcollection must contain raw sample
      const priv = store[`sessions/${res.sessionId}/private/location`];
      expect(priv).toBeDefined();
      expect(priv.lat).toBeCloseTo(CANONICAL_VENUE_LAT + 0.0001);

      // Attempt must be marked consumed
      expect(store[`checkInAttempts/${verifiedAttemptId}`].status).toBe('consumed');
    });

    it('prevents multiple active sessions for the same performer', async () => {
      await (startStationaryLiveSession as any).run({
        auth: { uid: 'artist_1' },
        data: { verifiedAttemptId, idempotencyKey: 'idem_start_stat_first' },
      });

      // Try creating another verified attempt and session
      store[`checkInAttempts/second_attempt`] = {
        checkInAttemptId: 'second_attempt',
        performerId: 'artist_1',
        callerUid: 'artist_1',
        role: 'artist',
        selectedVenueId: 'venue_culver',
        status: 'verified',
        idempotencyKey: 'idem_second',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      };

      await expect(
        (startStationaryLiveSession as any).run({
          auth: { uid: 'artist_1' },
          data: { verifiedAttemptId: 'second_attempt', idempotencyKey: 'idem_start_stat_second' },
        }),
      ).rejects.toThrow(/already has an active live session/);
    });
  });

  // ── 4. startMobileLiveSession ────────────────────────────────────────────────
  describe('startMobileLiveSession', () => {
    it('creates mobile live session with coarsened public coordinates', async () => {
      const rawLat = 34.025555;
      const rawLng = -118.399999;

      const res = await (startMobileLiveSession as any).run({
        auth: { uid: 'artist_1' },
        data: {
          profileId: 'artist_1',
          role: 'artist',
          consentVersion: '2026-09-01',
          initialSample: {
            lat: rawLat,
            lng: rawLng,
            accuracyMeters: 15,
            timestamp: new Date().toISOString(),
          },
          idempotencyKey: 'idem_mob_live_start',
        },
      });

      expect(res.sessionId).toBeDefined();
      expect(res.locationType).toBe('mobile');
      expect(res.status).toBe('live');

      // Public coordinates must NOT equal the exact device raw lat/lng
      expect(res.publicLat).not.toBe(rawLat);
      expect(res.publicLng).not.toBe(rawLng);

      const session = store[`sessions/${res.sessionId}`];
      expect(session.lat).toBe(res.publicLat);
      expect(session.lng).toBe(res.publicLng);

      // Private location stores raw GPS
      const priv = store[`sessions/${res.sessionId}/private/location`];
      expect(priv.lat).toBe(rawLat);
      expect(priv.lng).toBe(rawLng);
    });

    it('rejects mock GPS for mobile live session', async () => {
      await expect(
        (startMobileLiveSession as any).run({
          auth: { uid: 'artist_1' },
          data: {
            profileId: 'artist_1',
            role: 'artist',
            consentVersion: '2026-09-01',
            initialSample: {
              lat: 34.02,
              lng: -118.39,
              accuracyMeters: 15,
              timestamp: new Date().toISOString(),
              isMock: true,
            },
            idempotencyKey: 'idem_mob_mock_1',
          },
        }),
      ).rejects.toThrow('Mock GPS coordinates are rejected for mobile live sessions.');
    });
  });

  // ── 5. renewSessionLease (Zero GPS for Stationary Sessions) ──────────────────
  describe('renewSessionLease', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create stationary session
      const cin = await (startCheckIn as any).run({
        auth: { uid: 'artist_1' },
        data: { profileId: 'artist_1', role: 'artist', selectedVenueId: 'venue_culver', idempotencyKey: 'idem_lease_cin' },
      });
      await (submitCheckInSample as any).run({
        auth: { uid: 'artist_1' },
        data: {
          checkInAttemptId: cin.checkInAttemptId,
          sample: { lat: CANONICAL_VENUE_LAT, lng: CANONICAL_VENUE_LNG, accuracyMeters: 10, timestamp: new Date().toISOString() },
        },
      });
      const sess = await (startStationaryLiveSession as any).run({
        auth: { uid: 'artist_1' },
        data: { verifiedAttemptId: cin.checkInAttemptId, requestedDurationMinutes: 60, idempotencyKey: 'idem_lease_sess' },
      });
      sessionId = sess.sessionId;
    });

    it('extends stationary session lease WITHOUT ANY GPS coordinates required', async () => {
      const res = await (renewSessionLease as any).run({
        auth: { uid: 'artist_1' },
        data: {
          sessionId,
          seq: 1,
          idempotencyKey: 'idem_renew_lease_seq1',
        },
      });

      expect(res.sessionId).toBe(sessionId);
      expect(res.seq).toBe(1);
      expect(res.extended).toBe(true);
      expect(store[`sessions/${sessionId}`].lastHeartbeatSeq).toBe(1);
    });

    it('rejects non-monotonic sequence numbers', async () => {
      await (renewSessionLease as any).run({
        auth: { uid: 'artist_1' },
        data: { sessionId, seq: 1, idempotencyKey: 'idem_renew_seq1' },
      });

      await expect(
        (renewSessionLease as any).run({
          auth: { uid: 'artist_1' },
          data: { sessionId, seq: 1, idempotencyKey: 'idem_renew_seq1_dup' },
        }),
      ).rejects.toThrow('Heartbeat sequence 1 is not greater than last accepted sequence 1.');
    });
  });

  // ── 6. submitMobileLocationSample & Velocity Limit ────────────────────────────
  describe('submitMobileLocationSample', () => {
    let mobileSessionId: string;

    beforeEach(async () => {
      const res = await (startMobileLiveSession as any).run({
        auth: { uid: 'artist_1' },
        data: {
          profileId: 'artist_1',
          role: 'artist',
          consentVersion: '2026-09-01',
          initialSample: {
            lat: 34.020,
            lng: -118.390,
            accuracyMeters: 15,
            timestamp: new Date().toISOString(),
          },
          idempotencyKey: 'idem_mob_sample_init',
        },
      });
      mobileSessionId = res.sessionId;
    });

    it('accepts plausible moving location update', async () => {
      // 50 meters away after 10 seconds (5 m/s, well within 45 m/s)
      const res = await (submitMobileLocationSample as any).run({
        auth: { uid: 'artist_1' },
        data: {
          sessionId: mobileSessionId,
          seq: 2,
          sample: {
            lat: 34.0203,
            lng: -118.3903,
            accuracyMeters: 12,
            timestamp: new Date().toISOString(),
          },
          idempotencyKey: 'idem_mob_sample_update_2',
        },
      });

      expect(res.accepted).toBe(true);
      expect(res.seq).toBe(2);
      expect(store[`sessions/${mobileSessionId}`].lastHeartbeatSeq).toBe(2);
    });

    it('rejects teleportation / excessive travel velocity (> 45 m/s)', async () => {
      // Coordinates ~10km away immediately (implies >1000 m/s velocity)
      await expect(
        (submitMobileLocationSample as any).run({
          auth: { uid: 'artist_1' },
          data: {
            sessionId: mobileSessionId,
            seq: 2,
            sample: {
              lat: 34.120, // ~11 km away
              lng: -118.390,
              accuracyMeters: 10,
              timestamp: new Date().toISOString(),
            },
            idempotencyKey: 'idem_mob_speed_teleport',
          },
        }),
      ).rejects.toThrow(/exceeds maximum permitted travel policy \(45 m\/s\)/);
    });
  });

  // ── 7. pauseMobileLocation ───────────────────────────────────────────────────
  describe('pauseMobileLocation', () => {
    it('pauses location broadcast without deleting session', async () => {
      const res = await (startMobileLiveSession as any).run({
        auth: { uid: 'artist_1' },
        data: {
          profileId: 'artist_1',
          role: 'artist',
          consentVersion: '2026-09-01',
          initialSample: { lat: 34.02, lng: -118.39, accuracyMeters: 10, timestamp: new Date().toISOString() },
          idempotencyKey: 'idem_mob_for_pause',
        },
      });

      const pauseRes = await (pauseMobileLocation as any).run({
        auth: { uid: 'artist_1' },
        data: { sessionId: res.sessionId, reason: 'taking_a_break' },
      });

      expect(pauseRes.status).toBe('paused');
      expect(store[`sessions/${res.sessionId}`].status).toBe('paused');
    });
  });

  // ── 8. endLiveSession & 9. adminForceEnd ──────────────────────────────────────
  describe('endLiveSession & adminForceEnd', () => {
    let activeSessionId: string;

    beforeEach(async () => {
      const cin = await (startCheckIn as any).run({
        auth: { uid: 'artist_1' },
        data: { profileId: 'artist_1', role: 'artist', selectedVenueId: 'venue_culver', idempotencyKey: 'idem_end_cin' },
      });
      await (submitCheckInSample as any).run({
        auth: { uid: 'artist_1' },
        data: {
          checkInAttemptId: cin.checkInAttemptId,
          sample: { lat: CANONICAL_VENUE_LAT, lng: CANONICAL_VENUE_LNG, accuracyMeters: 10, timestamp: new Date().toISOString() },
        },
      });
      const sess = await (startStationaryLiveSession as any).run({
        auth: { uid: 'artist_1' },
        data: { verifiedAttemptId: cin.checkInAttemptId, idempotencyKey: 'idem_end_sess' },
      });
      activeSessionId = sess.sessionId;
    });

    it('endLiveSession ends session and DELETES private operational location', async () => {
      expect(store[`sessions/${activeSessionId}/private/location`]).toBeDefined();

      const res = await (endLiveSession as any).run({
        auth: { uid: 'artist_1' },
        data: { sessionId: activeSessionId, reason: 'gig_finished' },
      });

      expect(res.status).toBe('ended');
      expect(store[`sessions/${activeSessionId}`].status).toBe('ended');
      // Private operational location document must be deleted!
      expect(store[`sessions/${activeSessionId}/private/location`]).toBeUndefined();
    });

    it('adminForceEnd rejects non-staff caller', async () => {
      await expect(
        (adminForceEnd as any).run({
          auth: { uid: 'fan_1', token: {} },
          data: { sessionId: activeSessionId, reason: 'policy_violation' },
        }),
      ).rejects.toThrow('Only platform staff or administrators can force-end sessions.');
    });

    it('adminForceEnd terminates session and deletes private location for staff', async () => {
      const res = await (adminForceEnd as any).run({
        auth: { uid: 'admin_staff_1', token: { platformRole: 'SUPER_ADMIN' } },
        data: { sessionId: activeSessionId, reason: 'Unpermitted venue live stream' },
      });

      expect(res.status).toBe('admin_ended');
      expect(store[`sessions/${activeSessionId}`].status).toBe('admin_ended');
      expect(store[`sessions/${activeSessionId}`].adminEndReason).toBe('Unpermitted venue live stream');
      expect(store[`sessions/${activeSessionId}/private/location`]).toBeUndefined();
    });
  });

  // ── 10. Audience Signals & 11. Visibility Grants & 12. Revocation ─────────────
  describe('Audience Signals, Grants, and Revocation', () => {
    let liveSessionId: string;

    beforeEach(async () => {
      const cin = await (startCheckIn as any).run({
        auth: { uid: 'artist_1' },
        data: { profileId: 'artist_1', role: 'artist', selectedVenueId: 'venue_culver', idempotencyKey: 'idem_aud_cin' },
      });
      await (submitCheckInSample as any).run({
        auth: { uid: 'artist_1' },
        data: {
          checkInAttemptId: cin.checkInAttemptId,
          sample: { lat: CANONICAL_VENUE_LAT, lng: CANONICAL_VENUE_LNG, accuracyMeters: 10, timestamp: new Date().toISOString() },
        },
      });
      const sess = await (startStationaryLiveSession as any).run({
        auth: { uid: 'artist_1' },
        data: { verifiedAttemptId: cin.checkInAttemptId, idempotencyKey: 'idem_aud_sess' },
      });
      liveSessionId = sess.sessionId;
    });

    it('optIntoAggregateAudienceSignal writes one-way hashed signal and consent receipt', async () => {
      const res = await (optIntoAggregateAudienceSignal as any).run({
        auth: { uid: 'fan_1' },
        data: {
          sessionId: liveSessionId,
          consentVersion: '2026-09-01',
          approximateSample: { lat: 34.021, lng: -118.396 },
          idempotencyKey: 'idem_fan1_signal',
        },
      });

      expect(res.status).toBe('accepted');
      expect(res.signalId).toBeDefined();

      // Consent receipt created in fan private ledger
      const receipt = store[`users/fan_1/consentReceipts/cr_sig_${liveSessionId}`];
      expect(receipt).toBeDefined();
      expect(receipt.tier).toBe('aggregate');
    });

    it('suppresses audience signal if fan has blocked artist', async () => {
      store['users/fan_1/blockedUsers/artist_1'] = { blockedUid: 'artist_1' };

      const res = await (optIntoAggregateAudienceSignal as any).run({
        auth: { uid: 'fan_1' },
        data: {
          sessionId: liveSessionId,
          consentVersion: '2026-09-01',
          approximateSample: { lat: 34.021, lng: -118.396 },
          idempotencyKey: 'idem_fan1_blocked',
        },
      });

      expect(res.signalId).toBe('suppressed');
    });

    it('grantAudienceVisibility coarsens fan coordinates to 100m grid', async () => {
      const rawFanLat = 34.021888;
      const rawFanLng = -118.396777;

      const res = await (grantAudienceVisibility as any).run({
        auth: { uid: 'fan_1' },
        data: {
          sessionId: liveSessionId,
          creatorProfileId: 'artist_1',
          consentVersion: '2026-09-01',
          allowedProfileFields: ['displayName', 'avatarUrl'],
          lat: rawFanLat,
          lng: rawFanLng,
          idempotencyKey: 'idem_grant_1',
        },
      });

      expect(res.grantId).toBeDefined();
      expect(res.tier).toBe('individual_session');

      // Check stored grant doc
      const grant = store[`sessions/${liveSessionId}/audienceGrants/${res.grantId}`];
      expect(grant).toBeDefined();
      // Raw coordinates are NEVER stored!
      expect(grant.approxLat).not.toBe(rawFanLat);
      expect(grant.approxLng).not.toBe(rawFanLng);
      expect(grant.displayName).toBe('Alice Fan');
      expect(grant.avatarUrl).toBe('https://example.com/alice.jpg');
    });

    it('revokeAudienceVisibility allows fan to revoke visibility grant', async () => {
      const grantRes = await (grantAudienceVisibility as any).run({
        auth: { uid: 'fan_1' },
        data: {
          sessionId: liveSessionId,
          lat: 34.021,
          lng: -118.396,
          idempotencyKey: 'idem_grant_to_revoke',
        },
      });

      const revokeRes = await (revokeAudienceVisibility as any).run({
        auth: { uid: 'fan_1' },
        data: { grantId: grantRes.grantId, sessionId: liveSessionId },
      });

      expect(revokeRes.status).toBe('revoked');
      expect(store[`sessions/${liveSessionId}/audienceGrants/${grantRes.grantId}`]).toBeUndefined();
    });
  });

  // ── 13. getCreatorAudienceRadar & k-Anonymity Threshold ───────────────────────
  describe('getCreatorAudienceRadar (k-Anonymity & Zero UID Disclosure)', () => {
    let liveSessionId: string;

    beforeEach(async () => {
      const cin = await (startCheckIn as any).run({
        auth: { uid: 'artist_1' },
        data: { profileId: 'artist_1', role: 'artist', selectedVenueId: 'venue_culver', idempotencyKey: 'idem_radar_cin' },
      });
      await (submitCheckInSample as any).run({
        auth: { uid: 'artist_1' },
        data: {
          checkInAttemptId: cin.checkInAttemptId,
          sample: { lat: CANONICAL_VENUE_LAT, lng: CANONICAL_VENUE_LNG, accuracyMeters: 10, timestamp: new Date().toISOString() },
        },
      });
      const sess = await (startStationaryLiveSession as any).run({
        auth: { uid: 'artist_1' },
        data: { verifiedAttemptId: cin.checkInAttemptId, idempotencyKey: 'idem_radar_sess' },
      });
      liveSessionId = sess.sessionId;
    });

    it('suppresses zones with fewer than 5 fans (< k-anonymity threshold)', async () => {
      // Add 4 signals in cell '9q5cs' (below threshold of 5)
      for (let i = 1; i <= 4; i++) {
        store[`sessions/${liveSessionId}/privateAudienceSignals/sig_cell1_${i}`] = {
          signalId: `sig_cell1_${i}`,
          sessionId: liveSessionId,
          coarseGeohash5: '9q5cs',
          expiresAt: new Date(Date.now() + 600_000).toISOString(),
        };
      }

      const radar = await (getCreatorAudienceRadar as any).run({
        auth: { uid: 'artist_1' },
        data: { sessionId: liveSessionId },
      });

      // Cell '9q5cs' has only 4 fans, so it MUST BE SUPPRESSED!
      expect(radar.zones.length).toBe(0);
      expect(radar.totalActiveSignalsBucket).toBe('below_threshold');
    });

    it('publishes zones with 5 or more fans using count bands (never exact counts or fan IDs)', async () => {
      // Add 6 signals in cell '9q5cs' (meets threshold)
      for (let i = 1; i <= 6; i++) {
        store[`sessions/${liveSessionId}/privateAudienceSignals/sig_cell1_${i}`] = {
          signalId: `sig_cell1_${i}`,
          sessionId: liveSessionId,
          coarseGeohash5: '9q5cs',
          expiresAt: new Date(Date.now() + 600_000).toISOString(),
        };
      }

      const radar = await (getCreatorAudienceRadar as any).run({
        auth: { uid: 'artist_1' },
        data: { sessionId: liveSessionId },
      });

      expect(radar.zones.length).toBe(1);
      expect(radar.zones[0].geohash5).toBe('9q5cs');
      expect(radar.zones[0].countBand).toBe('[5-14]');
      expect(radar.totalActiveSignalsBucket).toBe('[5-14]');

      // Zone MUST NOT leak any fan UIDs or exact counts
      expect((radar.zones[0] as any).rawCount).toBeUndefined();
      expect((radar.zones[0] as any).fanUids).toBeUndefined();
    });

    it('returns consented visible fans without disclosing fan UIDs', async () => {
      // Add a consented grant
      await (grantAudienceVisibility as any).run({
        auth: { uid: 'fan_1' },
        data: {
          sessionId: liveSessionId,
          allowedProfileFields: ['displayName'],
          lat: 34.021,
          lng: -118.396,
          idempotencyKey: 'idem_radar_grant',
        },
      });

      const radar = await (getCreatorAudienceRadar as any).run({
        auth: { uid: 'artist_1' },
        data: { sessionId: liveSessionId },
      });

      expect(radar.visibleFans.length).toBe(1);
      const fan = radar.visibleFans[0];
      expect(fan.displayName).toBe('Alice Fan');
      expect(fan.approxLat).toBeDefined();
      expect(fan.grantRef).toBeDefined();
      // ZERO FAN UIDS EXPOSED!
      expect((fan as any).fanUid).toBeUndefined();
      expect((fan as any).uid).toBeUndefined();
    });

    it('hides blocked users from creator visible fans', async () => {
      // Artist blocks fan_1
      store['users/artist_1/blockedUsers/fan_1'] = { blockedUid: 'fan_1' };

      await (grantAudienceVisibility as any).run({
        auth: { uid: 'fan_2' },
        data: {
          sessionId: liveSessionId,
          allowedProfileFields: ['displayName'],
          lat: 34.021,
          lng: -118.396,
          idempotencyKey: 'idem_grant_f2',
        },
      });

      // Manually inject a grant for fan_1 in store
      store[`sessions/${liveSessionId}/audienceGrants/grant_f1`] = {
        grantId: 'grant_f1',
        sessionId: liveSessionId,
        performerId: 'artist_1',
        fanUid: 'fan_1',
        approxLat: 34.021,
        approxLng: -118.396,
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      };

      const radar = await (getCreatorAudienceRadar as any).run({
        auth: { uid: 'artist_1' },
        data: { sessionId: liveSessionId },
      });

      // fan_1 must be hidden! Only fan_2 is visible.
      expect(radar.visibleFans.length).toBe(1);
      expect(radar.visibleFans[0].displayName).toBe('Bob Fan');
    });
  });
});
