/**
 * Crowdbeats V2 — Sponsor Platform Governance & Escrow Unit Tests (Phase 9)
 *
 * Tests:
 * - createSponsorOrg
 * - inviteSponsorMember & respondToSponsorInvitation (7-day TTL, email match)
 * - depositEscrow (non-negative, idempotency, ledger entries)
 * - createMatchPool (escrow reservation, no negative balance)
 * - cross-tenant access rejection
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
                  exists: true,
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

const mockRunTransaction = async (updateFunction: (tx: any) => Promise<any>) => {
  const tx = {
    get: async (ref: any) => ref.get(),
    set: (ref: any, data: any) => ref.set(data),
    update: (ref: any, data: any) => ref.update(data),
    delete: (ref: any) => ref.delete(),
  };
  return updateFunction(tx);
};

jest.mock('firebase-admin', () => {
  return {
    firestore: Object.assign(
      jest.fn(() => ({
        collection: (path: string) => mockCollection(path),
        batch: () => mockBatch(),
        runTransaction: mockRunTransaction,
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
import { createSponsorOrg } from '../createSponsorOrg';
import { inviteSponsorMember } from '../inviteSponsorMember';
import { respondToSponsorInvitation } from '../respondToSponsorInvitation';
import { depositEscrow } from '../depositEscrow';
import { createMatchPool } from '../createMatchPool';

describe('Phase 9 — Sponsor Platform & Escrow Unit Tests', () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
  });

  describe('createSponsorOrg', () => {
    it('rejects unauthenticated caller', async () => {
      await expect(
        (createSponsorOrg as any)({ auth: null, data: { name: 'Acme Corp' } })
      ).rejects.toThrow('User must be authenticated.');
    });

    it('rejects missing or empty organization name', async () => {
      await expect(
        (createSponsorOrg as any)({
          auth: { uid: 'u1', token: { name: 'Alice' } },
          data: { name: '' },
        })
      ).rejects.toThrow('Organization name is required.');
    });

    it('creates sponsor organization with caller as SPONSOR_ADMIN and 0 balances', async () => {
      const res = await (createSponsorOrg as any)({
        auth: { uid: 'u1', token: { name: 'Alice Admin' } },
        data: { name: 'Red Bull Music', industry: 'Beverage', website: 'https://redbull.com' },
      });

      expect(res.success).toBe(true);
      expect(res.orgId).toBeDefined();

      const org = store[`sponsorOrgs/${res.orgId}`];
      expect(org.name).toBe('Red Bull Music');
      expect(org.adminUid).toBe('u1');
      expect(org.availableEscrowCents).toBe(0);
      expect(org.totalEscrowDepositedCents).toBe(0);

      const member = store[`sponsorOrgs/${res.orgId}/members/u1`];
      expect(member.role).toBe('SPONSOR_ADMIN');
      expect(member.isActive).toBe(true);
    });
  });

  describe('inviteSponsorMember & respondToSponsorInvitation', () => {
    beforeEach(() => {
      store['sponsorOrgs/org_1'] = {
        orgId: 'org_1',
        name: 'Gibson Guitars',
        adminUid: 'admin_1',
        isActive: true,
        memberCount: 1,
      };
      store['sponsorOrgs/org_1/members/admin_1'] = {
        uid: 'admin_1',
        role: 'SPONSOR_ADMIN',
        isActive: true,
      };
      store['sponsorOrgs/org_1/members/rep_1'] = {
        uid: 'rep_1',
        role: 'SPONSOR_REP',
        isActive: true,
      };
    });

    it('rejects invitation from non-admin (SPONSOR_REP)', async () => {
      await expect(
        (inviteSponsorMember as any)({
          auth: { uid: 'rep_1', token: { name: 'Bob Rep' } },
          data: { orgId: 'org_1', email: 'charlie@gibson.com', role: 'SPONSOR_REP' },
        })
      ).rejects.toThrow('Only active Sponsor Admins can invite team members.');
    });

    it('rejects invitation when caller belongs to another org (cross-tenant)', async () => {
      await expect(
        (inviteSponsorMember as any)({
          auth: { uid: 'other_user', token: { name: 'Mallory' } },
          data: { orgId: 'org_1', email: 'charlie@gibson.com', role: 'SPONSOR_REP' },
        })
      ).rejects.toThrow('Only active Sponsor Admins can invite team members.');
    });

    it('generates 7-day expiring invitation doc when called by SPONSOR_ADMIN', async () => {
      const res = await (inviteSponsorMember as any)({
        auth: { uid: 'admin_1', token: { name: 'Alice Admin' } },
        data: { orgId: 'org_1', email: 'dave@gibson.com', role: 'SPONSOR_REP' },
      });

      expect(res.success).toBe(true);
      expect(res.invitationId).toBeDefined();

      const invite = store[`sponsorOrgs/org_1/invitations/${res.invitationId}`];
      expect(invite.inviteeEmail).toBe('dave@gibson.com');
      expect(invite.role).toBe('SPONSOR_REP');
      expect(invite.status).toBe('pending');
    });

    it('rejects acceptance if email does not match invitation', async () => {
      store['invitations/inv_123'] = {
        invitationId: 'inv_123',
        orgId: 'org_1',
        orgName: 'Gibson Guitars',
        inviteeEmail: 'dave@gibson.com',
        role: 'SPONSOR_REP',
        status: 'pending',
        type: 'sponsor',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        invitedByUid: 'admin_1',
      };
      store['sponsorOrgs/org_1/invitations/inv_123'] = { ...store['invitations/inv_123'] };

      await expect(
        (respondToSponsorInvitation as any)({
          auth: { uid: 'impostor', token: { email: 'eve@evil.com' } },
          data: { invitationId: 'inv_123', action: 'accept' },
        })
      ).rejects.toThrow('Invitation was sent to dave@gibson.com, but you are signed in as eve@evil.com.');
    });

    it('rejects expired invitation (> 7 days)', async () => {
      store['invitations/inv_expired'] = {
        invitationId: 'inv_expired',
        orgId: 'org_1',
        orgName: 'Gibson Guitars',
        inviteeEmail: 'dave@gibson.com',
        role: 'SPONSOR_REP',
        status: 'pending',
        type: 'sponsor',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        invitedByUid: 'admin_1',
      };

      await expect(
        (respondToSponsorInvitation as any)({
          auth: { uid: 'dave_uid', token: { email: 'dave@gibson.com' } },
          data: { invitationId: 'inv_expired', action: 'accept' },
        })
      ).rejects.toThrow('This invitation has expired.');
    });

    it('successfully accepts invitation and adds member', async () => {
      store['invitations/inv_valid'] = {
        invitationId: 'inv_valid',
        orgId: 'org_1',
        orgName: 'Gibson Guitars',
        inviteeEmail: 'dave@gibson.com',
        role: 'SPONSOR_REP',
        status: 'pending',
        type: 'sponsor',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        invitedByUid: 'admin_1',
      };
      store['sponsorOrgs/org_1/invitations/inv_valid'] = { ...store['invitations/inv_valid'] };

      const res = await (respondToSponsorInvitation as any)({
        auth: { uid: 'dave_uid', token: { email: 'dave@gibson.com', name: 'Dave Rep' } },
        data: { invitationId: 'inv_valid', action: 'accept' },
      });

      expect(res.success).toBe(true);
      expect(res.action).toBe('accepted');

      const member = store['sponsorOrgs/org_1/members/dave_uid'];
      expect(member.role).toBe('SPONSOR_REP');
      expect(member.isActive).toBe(true);
    });
  });

  describe('depositEscrow', () => {
    beforeEach(() => {
      store['sponsorOrgs/org_1'] = {
        orgId: 'org_1',
        name: 'Fender',
        adminUid: 'admin_1',
        isActive: true,
        availableEscrowCents: 5000,
        totalEscrowDepositedCents: 5000,
      };
      store['sponsorOrgs/org_1/members/admin_1'] = {
        uid: 'admin_1',
        role: 'SPONSOR_ADMIN',
        isActive: true,
      };
    });

    it('rejects deposit below $10 minimum (1000 cents)', async () => {
      await expect(
        (depositEscrow as any)({
          auth: { uid: 'admin_1' },
          data: { orgId: 'org_1', amountCents: 500, idempotencyKey: 'k1' },
        })
      ).rejects.toThrow('Minimum escrow deposit is $10.00 (1000 cents).');
    });

    it('credits escrow balance and writes ledger record', async () => {
      const res = await (depositEscrow as any)({
        auth: { uid: 'admin_1' },
        data: { orgId: 'org_1', amountCents: 10000, idempotencyKey: 'deposit_k1' },
      });

      expect(res.success).toBe(true);
      expect(res.newAvailableEscrowCents).toBe(15000);
      expect(res.totalEscrowDepositedCents).toBe(15000);

      const org = store['sponsorOrgs/org_1'];
      expect(org.availableEscrowCents).toBe(15000);

      const idemp = store['idempotencyKeys/deposit_k1'];
      expect(idemp.response.newAvailableEscrowCents).toBe(15000);
    });
  });

  describe('createMatchPool', () => {
    beforeEach(() => {
      store['sponsorOrgs/org_1'] = {
        orgId: 'org_1',
        name: 'Roland',
        isActive: true,
        availableEscrowCents: 20000, // $200.00
      };
      store['sponsorOrgs/org_1/members/rep_1'] = {
        uid: 'rep_1',
        role: 'SPONSOR_REP',
        isActive: true,
      };
    });

    it('rejects match pool exceeding available escrow (no negative balance)', async () => {
      await expect(
        (createMatchPool as any)({
          auth: { uid: 'rep_1' },
          data: {
            orgId: 'org_1',
            recipientId: 'artist_1',
            recipientType: 'artist',
            totalPoolCents: 50000, // $500.00 (exceeds $200.00)
            matchRatioBps: 10000,
          },
        })
      ).rejects.toThrow(/Insufficient available escrow/);
    });

    it('reserves escrow and activates match pool', async () => {
      const res = await (createMatchPool as any)({
        auth: { uid: 'rep_1' },
        data: {
          orgId: 'org_1',
          recipientId: 'artist_1',
          recipientType: 'artist',
          totalPoolCents: 10000, // $100.00
          matchRatioBps: 10000, // 1:1 match
          perTipCapCents: 2000,
        },
      });

      expect(res.success).toBe(true);
      expect(res.remainingEscrowCents).toBe(10000);

      const org = store['sponsorOrgs/org_1'];
      expect(org.availableEscrowCents).toBe(10000);

      const pool = store[`matchPools/${res.poolId}`];
      expect(pool.totalPoolCents).toBe(10000);
      expect(pool.remainingPoolCents).toBe(10000);
      expect(pool.status).toBe('active');
    });
  });
});
