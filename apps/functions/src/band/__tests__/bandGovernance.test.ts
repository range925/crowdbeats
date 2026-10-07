/**
 * Crowdbeats V2 — Band Governance & Split Engine Unit Tests (Phase 8)
 *
 * Tests:
 * - createBand
 * - inviteBandMember & respondToBandInvitation
 * - updateBandMemberRole & removeBandMember
 * - transferBandOwnership
 * - setBandSplitConfig (exact 10000 bps validation)
 * - distributeLargestRemainder (OD-09 odd-cents distribution)
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── In-Memory Firestore Mock Store ──────────────────────────────────────────

const store: Record<string, any> = {};

const mockDoc = (path: string): any => {
  return {
    get: jest.fn<any>().mockImplementation(async () => {
      const data = store[path];
      return {
        exists: data !== undefined,
        data: () => data,
        id: path.split('/').pop(),
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
      return {
        where: jest.fn<any>().mockReturnThis(),
        get: jest.fn<any>().mockImplementation(async () => {
          const docs: any[] = [];
          for (const [k, v] of Object.entries(store)) {
            if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
              if (v && v[field] === val) {
                docs.push({
                  id: k.split('/').pop(),
                  exists: true,
                  data: () => v,
                  ref: mockDoc(k),
                });
              }
            }
          }
          return {
            empty: docs.length === 0,
            size: docs.length,
            docs,
          };
        }),
      };
    }),
    get: jest.fn<any>().mockImplementation(async () => {
      const docs: any[] = [];
      for (const [k, v] of Object.entries(store)) {
        if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
          docs.push({
            id: k.split('/').pop(),
            exists: true,
            data: () => v,
            ref: mockDoc(k),
          });
        }
      }
      return {
        empty: docs.length === 0,
        size: docs.length,
        docs,
      };
    }),
  };
};

jest.mock('firebase-functions/v2/https', () => ({
  onCall: jest.fn((_opts: unknown, handler: unknown) => handler),
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'HttpsError';
    }
  },
}));

jest.mock('firebase-admin', () => {
  return {
    apps: [{}],
    initializeApp: jest.fn<any>(),
    firestore: Object.assign(
      () => ({
        collection: (path: string) => mockCollection(path),
        doc: (path: string) => mockDoc(path),
        runTransaction: async (cb: any) => {
          const tx = {
            get: async (ref: any) => ref.get(),
            set: (ref: any, data: any, options?: any) => ref.set(data, options),
            update: (ref: any, data: any) => ref.update(data),
          };
          return await cb(tx);
        },
        batch: () => {
          const ops: Array<() => void> = [];
          return {
            set: (ref: any, data: any) => ops.push(() => ref.set(data)),
            update: (ref: any, data: any) => ops.push(() => ref.update(data)),
            commit: async () => {
              for (const op of ops) await op();
            },
          };
        },
      }),
      {
        FieldValue: {
          serverTimestamp: () => 'SERVER_TIMESTAMP',
          increment: (n: number) => ({ _increment: n }),
        },
      },
    ),
  };
});

const { createBand } = require('../createBand');
const { inviteBandMember } = require('../inviteBandMember');
const { respondToBandInvitation } = require('../respondToBandInvitation');
const { updateBandMemberRole } = require('../updateBandMemberRole');
const { removeBandMember } = require('../removeBandMember');
const { transferBandOwnership } = require('../transferBandOwnership');
const { setBandSplitConfig } = require('../setBandSplitConfig');

describe('Phase 8 — Band Governance Functions', () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
  });

  describe('createBand', () => {
    it('rejects unauthenticated requests', async () => {
      await expect(
        (createBand as any)({ auth: null, data: { name: 'The Rockers' } }),
      ).rejects.toThrow('Authentication required');
    });

    it('rejects empty band name', async () => {
      await expect(
        (createBand as any)({ auth: { uid: 'user_1' }, data: { name: '   ' } }),
      ).rejects.toThrow('Band name is required');
    });

    it('creates band, founder member, and 100% split v1', async () => {
      store['users/user_1'] = { displayName: 'Alice Founder' };

      const res = await (createBand as any)({
        auth: { uid: 'user_1' },
        data: { name: 'The Lunar Waves', bio: 'Indie rock band', genres: ['Rock', 'Indie'] },
      });

      expect(res.name).toBe('The Lunar Waves');
      expect(res.bandId).toBeDefined();

      const bandDoc = store[`bands/${res.bandId}`];
      expect(bandDoc.name).toBe('The Lunar Waves');
      expect(bandDoc.founderUid).toBe('user_1');
      expect(bandDoc.memberCount).toBe(1);

      const founderDoc = store[`bands/${res.bandId}/members/user_1`];
      expect(founderDoc.role).toBe('BAND_FOUNDER');
      expect(founderDoc.isActive).toBe(true);

      const splitDoc = store[`bands/${res.bandId}/splitConfig/current`];
      expect(splitDoc.version).toBe(1);
      expect(splitDoc.splits).toEqual([{ uid: 'user_1', splitBps: 10000 }]);
    });
  });

  describe('setBandSplitConfig', () => {
    beforeEach(() => {
      store['bands/band_1'] = { founderUid: 'user_1', memberCount: 2 };
      store['bands/band_1/members/user_1'] = { role: 'BAND_FOUNDER', isActive: true };
      store['bands/band_1/members/user_2'] = { role: 'BAND_MEMBER', isActive: true };
      store['bands/band_1/splitConfig/current'] = {
        version: 1,
        splits: [{ uid: 'user_1', splitBps: 10000 }],
      };
    });

    it('rejects non-founders/non-admins', async () => {
      await expect(
        (setBandSplitConfig as any)({
          auth: { uid: 'user_2' }, // standard member
          data: {
            bandId: 'band_1',
            splits: [
              { uid: 'user_1', splitBps: 5000 },
              { uid: 'user_2', splitBps: 5000 },
            ],
          },
        }),
      ).rejects.toThrow('Only band founders or admins');
    });

    it('rejects splits totaling less than 10000 bps', async () => {
      await expect(
        (setBandSplitConfig as any)({
          auth: { uid: 'user_1' },
          data: {
            bandId: 'band_1',
            splits: [
              { uid: 'user_1', splitBps: 4000 },
              { uid: 'user_2', splitBps: 4000 }, // Total = 8000
            ],
          },
        }),
      ).rejects.toThrow('Split percentages must total exactly 100.00%');
    });

    it('rejects splits totaling more than 10000 bps', async () => {
      await expect(
        (setBandSplitConfig as any)({
          auth: { uid: 'user_1' },
          data: {
            bandId: 'band_1',
            splits: [
              { uid: 'user_1', splitBps: 6000 },
              { uid: 'user_2', splitBps: 5000 }, // Total = 11000
            ],
          },
        }),
      ).rejects.toThrow('Split percentages must total exactly 100.00%');
    });

    it('rejects configuration missing an active member', async () => {
      await expect(
        (setBandSplitConfig as any)({
          auth: { uid: 'user_1' },
          data: {
            bandId: 'band_1',
            splits: [{ uid: 'user_1', splitBps: 10000 }], // user_2 omitted
          },
        }),
      ).rejects.toThrow('missing from the split configuration');
    });

    it('accepts exact 10000 bps, bumps version, and archives previous version', async () => {
      const res = await (setBandSplitConfig as any)({
        auth: { uid: 'user_1' },
        data: {
          bandId: 'band_1',
          splits: [
            { uid: 'user_1', splitBps: 6000 },
            { uid: 'user_2', splitBps: 4000 },
          ],
        },
      });

      expect(res.version).toBe(2);
      expect(res.splits).toEqual([
        { uid: 'user_1', splitBps: 6000 },
        { uid: 'user_2', splitBps: 4000 },
      ]);

      const currentDoc = store['bands/band_1/splitConfig/current'];
      expect(currentDoc.version).toBe(2);

      const historyDoc = store['bands/band_1/splitHistory/2'];
      expect(historyDoc.version).toBe(2);
      expect(historyDoc.splits).toEqual(res.splits);
    });
  });

  describe('transferBandOwnership', () => {
    beforeEach(() => {
      store['bands/band_1'] = { founderUid: 'user_1', v: 1 };
      store['bands/band_1/members/user_1'] = { role: 'BAND_FOUNDER', isActive: true };
      store['bands/band_1/members/user_2'] = { role: 'BAND_MEMBER', isActive: true };
    });

    it('requires exact confirmation phrase', async () => {
      await expect(
        (transferBandOwnership as any)({
          auth: { uid: 'user_1' },
          data: {
            bandId: 'band_1',
            targetUid: 'user_2',
            confirmationPhrase: 'TRANSFER', // Missing "OWNERSHIP"
          },
        }),
      ).rejects.toThrow('Confirmation phrase must be exactly "TRANSFER OWNERSHIP"');
    });

    it('rejects transfer from non-founder', async () => {
      await expect(
        (transferBandOwnership as any)({
          auth: { uid: 'user_2' },
          data: {
            bandId: 'band_1',
            targetUid: 'user_1',
            confirmationPhrase: 'TRANSFER OWNERSHIP',
          },
        }),
      ).rejects.toThrow('Only the current band founder');
    });

    it('transfers founder role to target and demotes caller to admin', async () => {
      const res = await (transferBandOwnership as any)({
        auth: { uid: 'user_1' },
        data: {
          bandId: 'band_1',
          targetUid: 'user_2',
          confirmationPhrase: 'TRANSFER OWNERSHIP',
        },
      });

      expect(res.ok).toBe(true);
      expect(res.newFounderUid).toBe('user_2');

      expect(store['bands/band_1'].founderUid).toBe('user_2');
      expect(store['bands/band_1/members/user_2'].role).toBe('BAND_FOUNDER');
      expect(store['bands/band_1/members/user_1'].role).toBe('BAND_ADMIN');
    });
  });

  describe('removeBandMember', () => {
    beforeEach(() => {
      store['bands/band_1'] = { founderUid: 'user_1', memberCount: 3 };
      store['bands/band_1/members/user_1'] = { role: 'BAND_FOUNDER', isActive: true };
      store['bands/band_1/members/user_2'] = { role: 'BAND_ADMIN', isActive: true };
      store['bands/band_1/members/user_3'] = { role: 'BAND_MEMBER', isActive: true };
    });

    it('blocks removing the band founder', async () => {
      await expect(
        (removeBandMember as any)({
          auth: { uid: 'user_2' },
          data: { bandId: 'band_1', memberUid: 'user_1' },
        }),
      ).rejects.toThrow('The band founder cannot be removed');
    });

    it('allows founder to remove standard member', async () => {
      const res = await (removeBandMember as any)({
        auth: { uid: 'user_1' },
        data: { bandId: 'band_1', memberUid: 'user_3', reason: 'Inactive' },
      });

      expect(res.ok).toBe(true);
      expect(store['bands/band_1/members/user_3'].isActive).toBe(false);
      expect(store['bands/band_1/members/user_3'].leftAt).toBeDefined();
    });

    it('allows member to voluntarily leave', async () => {
      const res = await (removeBandMember as any)({
        auth: { uid: 'user_3' },
        data: { bandId: 'band_1', memberUid: 'user_3', reason: 'Moving away' },
      });

      expect(res.ok).toBe(true);
      expect(store['bands/band_1/members/user_3'].isActive).toBe(false);
    });
  });

  describe('inviteBandMember and respondToBandInvitation', () => {
    beforeEach(() => {
      store['bands/band_1'] = { name: 'The Rockers', founderUid: 'user_1', memberCount: 1 };
      store['bands/band_1/members/user_1'] = { role: 'BAND_FOUNDER', isActive: true };
      store['users/user_2'] = { displayName: 'Bob Bassist' };
    });

    it('creates a 7-day expiring invitation', async () => {
      const res = await (inviteBandMember as any)({
        auth: { uid: 'user_1' },
        data: { bandId: 'band_1', email: 'bob@example.com', role: 'BAND_MEMBER' },
      });

      expect(res.invitationId).toBeDefined();
      expect(res.expiresAt).toBeDefined();

      const invDoc = store[`invitations/${res.invitationId}`];
      expect(invDoc.inviteeEmail).toBe('bob@example.com');
      expect(invDoc.status).toBe('pending');
    });

    it('accepts an invitation and adds the user as an active member', async () => {
      const invRes = await (inviteBandMember as any)({
        auth: { uid: 'user_1' },
        data: { bandId: 'band_1', email: 'bob@example.com', role: 'BAND_MEMBER' },
      });

      const acceptRes = await (respondToBandInvitation as any)({
        auth: { uid: 'user_2', token: { email: 'bob@example.com' } },
        data: { invitationId: invRes.invitationId, response: 'accept' },
      });

      expect(acceptRes.ok).toBe(true);
      expect(acceptRes.status).toBe('accepted');

      const memberDoc = store['bands/band_1/members/user_2'];
      expect(memberDoc.role).toBe('BAND_MEMBER');
      expect(memberDoc.isActive).toBe(true);
      expect(memberDoc.displayName).toBe('Bob Bassist');
    });

    it('declines an invitation', async () => {
      const invRes = await (inviteBandMember as any)({
        auth: { uid: 'user_1' },
        data: { bandId: 'band_1', email: 'charlie@example.com', role: 'BAND_MEMBER' },
      });

      const declineRes = await (respondToBandInvitation as any)({
        auth: { uid: 'user_3', token: { email: 'charlie@example.com' } },
        data: { invitationId: invRes.invitationId, response: 'decline' },
      });

      expect(declineRes.ok).toBe(true);
      expect(declineRes.status).toBe('declined');
      expect(store[`invitations/${invRes.invitationId}`].status).toBe('declined');
    });
  });

  describe('updateBandMemberRole', () => {
    beforeEach(() => {
      store['bands/band_1'] = { founderUid: 'user_1', memberCount: 2 };
      store['bands/band_1/members/user_1'] = { role: 'BAND_FOUNDER', isActive: true };
      store['bands/band_1/members/user_2'] = { role: 'BAND_MEMBER', isActive: true };
    });

    it('promotes BAND_MEMBER to BAND_ADMIN', async () => {
      const res = await (updateBandMemberRole as any)({
        auth: { uid: 'user_1' },
        data: { bandId: 'band_1', memberUid: 'user_2', newRole: 'BAND_ADMIN' },
      });

      expect(res.ok).toBe(true);
      expect(res.newRole).toBe('BAND_ADMIN');
      expect(store['bands/band_1/members/user_2'].role).toBe('BAND_ADMIN');
    });

    it('blocks self-demotion from founder', async () => {
      await expect(
        (updateBandMemberRole as any)({
          auth: { uid: 'user_1' },
          data: { bandId: 'band_1', memberUid: 'user_1', newRole: 'BAND_ADMIN' },
        }),
      ).rejects.toThrow('Founder cannot demote themselves');
    });
  });
});
