/**
 * Crowdbeats V2 — Phase 11: Location Observability & Admin Health Tests
 */

import {
  getAdminLiveSessionHealth,
  evaluateLocationAnomalies,
  reportLocationEnergyMetrics,
} from '../session/locationObservabilityCallables.js';
import { adminForceEnd } from '../session/sessionLeaseCallables.js';

// Mock in-memory database
const mockStore: Record<string, any> = {};

jest.mock('../session/sessionHelpers.js', () => {
  const actual = jest.requireActual('../session/sessionHelpers.js');
  return {
    ...actual,
    getFirestoreDb: () => ({
      collection: (colName: string) => ({
        doc: (docId: string) => ({
          get: async () => {
            const data = mockStore[`${colName}/${docId}`];
            return {
              exists: !!data,
              id: docId,
              data: () => data,
            };
          },
          set: async (val: any) => {
            mockStore[`${colName}/${docId}`] = val;
          },
          update: async (val: any) => {
            mockStore[`${colName}/${docId}`] = {
              ...mockStore[`${colName}/${docId}`],
              ...val,
            };
          },
          collection: (subCol: string) => ({
            doc: (subId: string) => ({
              delete: async () => {
                delete mockStore[`${colName}/${docId}/${subCol}/${subId}`];
              },
            }),
          }),
        }),
        where: () => ({
          where: () => ({
            get: async () => ({
              empty: true,
              docs: [],
              size: 0,
            }),
          }),
          limit: () => ({
            get: async () => {
              const docs: any[] = [];
              for (const [key, val] of Object.entries(mockStore)) {
                if (key.startsWith(`${colName}/`)) {
                  docs.push({
                    id: key.split('/')[1],
                    data: () => val,
                  });
                }
              }
              return { empty: docs.length === 0, docs, size: docs.length };
            },
          }),
        }),
      }),
      batch: () => ({
        update: (ref: any, val: any) => {},
        delete: (ref: any) => {},
        commit: async () => {},
      }),
    }),
  };
});

describe('Phase 11 — Location Quality, Energy Observability & Admin Controls', () => {
  beforeEach(() => {
    for (const key of Object.keys(mockStore)) {
      delete mockStore[key];
    }
  });

  describe('getAdminLiveSessionHealth & Role Separation', () => {
    it('rejects unauthenticated caller', async () => {
      await expect(
        (getAdminLiveSessionHealth as any).run({
          auth: null,
          data: { sessionId: 'sess_1' },
        }),
      ).rejects.toThrow('Authentication required.');
    });

    it('rejects non-staff caller', async () => {
      await expect(
        (getAdminLiveSessionHealth as any).run({
          auth: { uid: 'fan_1', token: {} },
          data: { sessionId: 'sess_1' },
        }),
      ).rejects.toThrow('Only platform staff or administrators can view session health.');
    });

    it('allows CUSTOMER_SUPPORT to read session health with canForceEnd: false', async () => {
      mockStore['sessions/sess_live_1'] = {
        performerId: 'artist_123',
        status: 'live',
        type: 'stationary',
        venueId: 'venue_culver',
        createdAt: new Date(),
        endsAt: new Date(Date.now() + 3600000),
        totalSamplesReceived: 120,
        acceptedSampleCount: 118,
        rejectedSampleCount: 2,
        uploadCount: 15,
        lastHeartbeatSeq: 15,
        consecutiveCheckInRejections: 0,
      };

      const result = await (getAdminLiveSessionHealth as any).run({
        auth: { uid: 'support_agent_1', token: { platformRole: 'CUSTOMER_SUPPORT' } },
        data: { sessionId: 'sess_live_1' },
      });

      expect(result.sessionId).toBe('sess_live_1');
      expect(result.status).toBe('live');
      expect(result.canForceEnd).toBe(false); // General support cannot force end!
      expect(result.performerId).toBe('artist_123');
      expect(result.sampleCount).toBe(120);

      // Verify ZERO raw coordinates or fan identifiers in response
      const json = JSON.stringify(result);
      expect(json).not.toContain('"lat":');
      expect(json).not.toContain('"lng":');
      expect(json).not.toContain('latitude');
      expect(json).not.toContain('longitude');
      expect(json).not.toContain('street');
      expect(json).not.toContain('rawPoint');
    });

    it('allows SUPER_ADMIN to read session health with canForceEnd: true', async () => {
      mockStore['sessions/sess_live_1'] = {
        performerId: 'artist_123',
        status: 'live',
        type: 'mobile',
        createdAt: new Date(),
        endsAt: new Date(Date.now() + 3600000),
      };

      const result = await (getAdminLiveSessionHealth as any).run({
        auth: { uid: 'superadmin_1', token: { platformRole: 'SUPER_ADMIN' } },
        data: { sessionId: 'sess_live_1' },
      });

      expect(result.sessionId).toBe('sess_live_1');
      expect(result.canForceEnd).toBe(true); // Super Admin can force end!
    });
  });

  describe('adminForceEnd Privilege Separation', () => {
    it('rejects CUSTOMER_SUPPORT caller from force-ending session', async () => {
      mockStore['sessions/sess_live_1'] = {
        performerId: 'artist_123',
        status: 'live',
      };

      await expect(
        (adminForceEnd as any).run({
          auth: { uid: 'support_1', token: { platformRole: 'CUSTOMER_SUPPORT' } },
          data: { sessionId: 'sess_live_1', reason: 'User requested termination' },
        }),
      ).rejects.toThrow('Only platform staff or administrators can force-end sessions. Elevated privileges required; general customer support is read-only.');
    });

    it('allows TRUST_SAFETY elevated role to force-end session', async () => {
      mockStore['sessions/sess_live_1'] = {
        performerId: 'artist_123',
        status: 'live',
      };

      const res = await (adminForceEnd as any).run({
        auth: { uid: 'trust_1', token: { platformRole: 'TRUST_SAFETY' } },
        data: { sessionId: 'sess_live_1', reason: 'Abuse policy breach' },
      });

      expect(res.status).toBe('admin_ended');
    });
  });

  describe('evaluateLocationAnomalies', () => {
    it('detects runaway tracking duration for mobile sessions (> 4h)', async () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 3600 * 1000);
      mockStore['sessions/sess_runaway'] = {
        performerId: 'artist_runaway',
        status: 'live',
        type: 'mobile',
        createdAt: { toDate: () => fiveHoursAgo },
        endsAt: { toDate: () => new Date(Date.now() + 3600000) },
      };

      const res = await (evaluateLocationAnomalies as any).run({
        auth: { uid: 'admin_1', token: { platformRole: 'SUPER_ADMIN' } },
        data: {},
      });

      expect(res.alerts.some((a: any) => a.anomalyType === 'runaway_tracking_duration')).toBe(true);
    });

    it('detects stale public sessions past expiration (+15m)', async () => {
      const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
      mockStore['sessions/sess_stale'] = {
        performerId: 'artist_stale',
        status: 'live',
        type: 'stationary',
        createdAt: { toDate: () => new Date(Date.now() - 3600000) },
        endsAt: { toDate: () => twentyMinsAgo },
      };

      const res = await (evaluateLocationAnomalies as any).run({
        auth: { uid: 'admin_1', token: { platformRole: 'SUPER_ADMIN' } },
        data: {},
      });

      expect(res.alerts.some((a: any) => a.anomalyType === 'stale_public_session_detected')).toBe(true);
    });
  });

  describe('reportLocationEnergyMetrics', () => {
    it('rejects metrics payload containing forbidden coordinate keys', async () => {
      await expect(
        (reportLocationEnergyMetrics as any).run({
          auth: { uid: 'user_1', token: {} },
          data: {
            platform: 'android',
            appVersion: '2.0.0',
            latitude: 34.0195, // Forbidden coordinate!
          },
        }),
      ).rejects.toThrow('Privacy violation');
    });

    it('accepts and stores privacy-safe energy metrics snapshot', async () => {
      const res = await (reportLocationEnergyMetrics as any).run({
        auth: { uid: 'user_1', token: {} },
        data: {
          platform: 'ios',
          appVersion: '2.0.0',
          timeInStateMs: { off: 1000, discovery: 500, check_in: 200, live_stationary: 30000, live_mobile: 0 },
          activeSensorDurationMs: 1500,
          sampleCounts: { received: 20, accepted: 20, rejected: 0, rejectedReasons: {} },
          networkTelemetry: { uploadCount: 2, bytesUploaded: 512, retryCount: 0, queueHighWaterMark: 1 },
        },
      });

      expect(res.success).toBe(true);
      expect(res.snapshotId).toBeDefined();
    });
  });
});
