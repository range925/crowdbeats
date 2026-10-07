/**
 * Crowdbeats V2 — Venue Platform & Stage Session Unit Tests (Phase 9)
 *
 * Tests:
 * - createVenue
 * - inviteVenueStaff & respondToVenueInvitation (7-day TTL, role hierarchy)
 * - createVenueStage (staff boundary: VENUE_STAFF cannot create stages)
 * - startVenueSession (1-active-session invariant per stage)
 * - endVenueSession
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
      }
    ),
    apps: ['mock-app'],
    initializeApp: jest.fn(),
  };
});

jest.mock('firebase-functions/v2/https', () => ({
  onCall: jest.fn((_opts: any, handler: any) => handler),
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'HttpsError';
    }
  },
}));

// Import functions under test
import { createVenue } from '../createVenue';
import { inviteVenueStaff } from '../inviteVenueStaff';
import { respondToVenueInvitation } from '../respondToVenueInvitation';
import { createVenueStage } from '../createVenueStage';
import { startVenueSession } from '../startVenueSession';
import { endVenueSession } from '../endVenueSession';

describe('Phase 9 — Venue Platform & Stage Session Unit Tests', () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
  });

  describe('createVenue', () => {
    it('creates venue profile with caller as VENUE_OWNER', async () => {
      const res = await (createVenue as any)({
        auth: { uid: 'owner_1', token: { name: 'Oscar Owner' } },
        data: { name: 'The Independent', capacity: 500, address: { city: 'San Francisco', country: 'US' } },
      });

      expect(res.success).toBe(true);
      expect(res.venueId).toBeDefined();

      const venue = store[`venueProfiles/${res.venueId}`];
      expect(venue.name).toBe('The Independent');
      expect(venue.ownerUid).toBe('owner_1');

      const member = store[`venueProfiles/${res.venueId}/members/owner_1`];
      expect(member.role).toBe('VENUE_OWNER');
    });
  });

  describe('inviteVenueStaff & respondToVenueInvitation', () => {
    beforeEach(() => {
      store['venueProfiles/v1'] = {
        venueId: 'v1',
        name: 'The Fillmore',
        isActive: true,
        memberCount: 1,
      };
      store['venueProfiles/v1/members/owner_1'] = {
        uid: 'owner_1',
        role: 'VENUE_OWNER',
        isActive: true,
      };
      store['venueProfiles/v1/members/mgr_1'] = {
        uid: 'mgr_1',
        role: 'VENUE_MANAGER',
        isActive: true,
      };
      store['venueProfiles/v1/members/staff_1'] = {
        uid: 'staff_1',
        role: 'VENUE_STAFF',
        isActive: true,
      };
    });

    it('rejects invitation from VENUE_STAFF (boundary check)', async () => {
      await expect(
        (inviteVenueStaff as any)({
          auth: { uid: 'staff_1' },
          data: { venueId: 'v1', email: 'bartender@fillmore.com', role: 'VENUE_STAFF' },
        })
      ).rejects.toThrow('Venue Staff cannot invite new team members.');
    });

    it('rejects VENUE_MANAGER inviting another VENUE_MANAGER (only owner can)', async () => {
      await expect(
        (inviteVenueStaff as any)({
          auth: { uid: 'mgr_1' },
          data: { venueId: 'v1', email: 'other_mgr@fillmore.com', role: 'VENUE_MANAGER' },
        })
      ).rejects.toThrow('Only the Venue Owner can invite other Venue Managers.');
    });

    it('allows VENUE_MANAGER to invite VENUE_STAFF', async () => {
      const res = await (inviteVenueStaff as any)({
        auth: { uid: 'mgr_1', token: { name: 'Mike Manager' } },
        data: { venueId: 'v1', email: 'door_staff@fillmore.com', role: 'VENUE_STAFF' },
      });

      expect(res.success).toBe(true);
      expect(res.invitationId).toBeDefined();

      const invite = store[`venueProfiles/v1/invitations/${res.invitationId}`];
      expect(invite.role).toBe('VENUE_STAFF');
      expect(invite.status).toBe('pending');
    });

    it('accepts venue invitation and creates member doc', async () => {
      store['invitations/inv_v1'] = {
        invitationId: 'inv_v1',
        venueId: 'v1',
        venueName: 'The Fillmore',
        inviteeEmail: 'door_staff@fillmore.com',
        role: 'VENUE_STAFF',
        status: 'pending',
        type: 'venue',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        invitedByUid: 'mgr_1',
      };
      store['venueProfiles/v1/invitations/inv_v1'] = { ...store['invitations/inv_v1'] };

      const res = await (respondToVenueInvitation as any)({
        auth: { uid: 'user_staff_1', token: { email: 'door_staff@fillmore.com', name: 'Sam Staff' } },
        data: { invitationId: 'inv_v1', action: 'accept' },
      });

      expect(res.success).toBe(true);
      expect(res.action).toBe('accepted');

      const member = store['venueProfiles/v1/members/user_staff_1'];
      expect(member.role).toBe('VENUE_STAFF');
    });
  });

  describe('createVenueStage', () => {
    beforeEach(() => {
      store['venueProfiles/v1'] = { venueId: 'v1', name: 'Great American Music Hall', isActive: true };
      store['venueProfiles/v1/members/owner_1'] = { uid: 'owner_1', role: 'VENUE_OWNER', isActive: true };
      store['venueProfiles/v1/members/staff_1'] = { uid: 'staff_1', role: 'VENUE_STAFF', isActive: true };
    });

    it('rejects stage creation from VENUE_STAFF', async () => {
      await expect(
        (createVenueStage as any)({
          auth: { uid: 'staff_1' },
          data: { venueId: 'v1', name: 'Balcony Stage' },
        })
      ).rejects.toThrow('Only Venue Owners and Managers can configure stages.');
    });

    it('creates stage when called by VENUE_OWNER', async () => {
      const res = await (createVenueStage as any)({
        auth: { uid: 'owner_1' },
        data: { venueId: 'v1', name: 'Main Hall', capacity: 470 },
      });

      expect(res.success).toBe(true);
      expect(res.stageId).toBeDefined();

      const stage = store[`stages/${res.stageId}`];
      expect(stage.name).toBe('Main Hall');
      expect(stage.venueId).toBe('v1');
    });
  });

  describe('startVenueSession & endVenueSession', () => {
    beforeEach(() => {
      store['venueProfiles/v1'] = { venueId: 'v1', name: 'Bottom of the Hill', isActive: true };
      store['venueProfiles/v1/members/mgr_1'] = { uid: 'mgr_1', role: 'VENUE_MANAGER', isActive: true };
      store['stages/stage_1'] = { stageId: 'stage_1', venueId: 'v1', name: 'Main Stage', isActive: true };
    });

    it('starts stage session and generates qrPrefix', async () => {
      const res = await (startVenueSession as any)({
        auth: { uid: 'mgr_1' },
        data: {
          venueId: 'v1',
          stageId: 'stage_1',
          performerId: 'artist_123',
          performerType: 'artist',
          performerName: 'The Midnight Strummers',
        },
      });

      expect(res.success).toBe(true);
      expect(res.sessionId).toBeDefined();
      expect(res.qrPrefix).toMatch(/^cb_sess_/);

      const session = store[`stageSessions/${res.sessionId}`];
      expect(session.status).toBe('active');
      expect(session.performerName).toBe('The Midnight Strummers');
    });

    it('enforces 1-active-session invariant (rejects concurrent session on same stage)', async () => {
      store['stageSessions/sess_active'] = {
        sessionId: 'sess_active',
        stageId: 'stage_1',
        venueId: 'v1',
        status: 'active',
      };

      await expect(
        (startVenueSession as any)({
          auth: { uid: 'mgr_1' },
          data: {
            venueId: 'v1',
            stageId: 'stage_1',
            performerId: 'artist_456',
            performerType: 'artist',
            performerName: 'Second Band',
          },
        })
      ).rejects.toThrow('There is already an active session running on this stage.');
    });

    it('ends active session', async () => {
      store['stageSessions/sess_to_end'] = {
        sessionId: 'sess_to_end',
        stageId: 'stage_1',
        venueId: 'v1',
        status: 'active',
        totalTipsReceivedCents: 15000,
        tipCount: 12,
      };

      const res = await (endVenueSession as any)({
        auth: { uid: 'mgr_1' },
        data: { sessionId: 'sess_to_end' },
      });

      expect(res.success).toBe(true);
      expect(res.totalTipsReceivedCents).toBe(15000);

      const session = store['stageSessions/sess_to_end'];
      expect(session.status).toBe('ended');
    });
  });
});
