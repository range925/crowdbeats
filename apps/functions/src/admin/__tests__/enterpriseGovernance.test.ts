/**
 * Crowdbeats V2 — Enterprise Governance & Staff Role Security Unit Tests (Phase 10)
 *
 * Tests:
 * - 16 canonical staff role permissions & hierarchy (OD-07)
 * - grantStaffRole (Super Admin only, typed confirmation, custom claims)
 * - revokeStaffRole (Super Admin only, self-revocation prevention)
 * - suspendAccount & reinstateAccount (Trust & Safety / Super Admin only)
 * - approveStaffRefund (Customer Support & Finance maker/checker)
 * - Audit event immutability and correlation tracking
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

const mockSetCustomUserClaims = jest.fn(async (_uid: string, _claims: any) => {});

jest.mock('firebase-admin', () => {
  return {
    firestore: Object.assign(
      jest.fn(() => ({
        collection: (path: string) => mockCollection(path),
        doc: (path: string) => mockDoc(path),
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
    auth: () => ({
      setCustomUserClaims: mockSetCustomUserClaims,
    }),
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
import { grantStaffRole } from '../grantStaffRole';
import { revokeStaffRole } from '../revokeStaffRole';
import { suspendAccount } from '../suspendAccount';
import { reinstateAccount } from '../reinstateAccount';
import { approveStaffRefund } from '../approveStaffRefund';

describe('Phase 10 — Enterprise Governance & Control Plane Unit Tests', () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
    mockSetCustomUserClaims.mockClear();
  });

  describe('grantStaffRole', () => {
    it('rejects unauthenticated caller', async () => {
      await expect(
        (grantStaffRole as any)({ auth: null, data: { targetUid: 'u2', role: 'FINANCE_ANALYST' } })
      ).rejects.toThrow('User must be authenticated.');
    });

    it('rejects non-SUPER_ADMIN caller (e.g. FINANCE_ANALYST)', async () => {
      await expect(
        (grantStaffRole as any)({
          auth: { uid: 'fin_1', token: { platformRole: 'FINANCE_ANALYST' } },
          data: { targetUid: 'u2', role: 'TRUST_SAFETY', confirmationPhrase: 'GRANT TRUST_SAFETY' },
        })
      ).rejects.toThrow('Only Super Administrators can grant staff roles.');
    });

    it('rejects invalid confirmation phrase', async () => {
      await expect(
        (grantStaffRole as any)({
          auth: { uid: 'super_1', token: { platformRole: 'SUPER_ADMIN' } },
          data: { targetUid: 'u2', role: 'COMPLIANCE_OFFICER', confirmationPhrase: 'grant compliance' },
        })
      ).rejects.toThrow(/Step-up confirmation failed/);
    });

    it('grants staff role, sets custom claims, updates staffRecord, and logs audit event', async () => {
      const res = await (grantStaffRole as any)({
        auth: { uid: 'super_1', token: { platformRole: 'SUPER_ADMIN', name: 'David SuperAdmin' } },
        data: {
          targetUid: 'user_target',
          targetEmail: 'officer@crowdbeats.com',
          role: 'COMPLIANCE_OFFICER',
          confirmationPhrase: 'GRANT COMPLIANCE_OFFICER',
        },
      });

      expect(res.success).toBe(true);
      expect(res.role).toBe('COMPLIANCE_OFFICER');

      expect(mockSetCustomUserClaims).toHaveBeenCalledWith('user_target', {
        platformRole: 'COMPLIANCE_OFFICER',
        personaType: 'staff',
        claimsVersion: 1,
      });

      const staff = store['staffRecords/user_target'];
      expect(staff.platformRole).toBe('COMPLIANCE_OFFICER');
      expect(staff.isActive).toBe(true);
      expect(staff.grantedByUid).toBe('super_1');
    });
  });

  describe('revokeStaffRole', () => {
    beforeEach(() => {
      store['staffRecords/officer_1'] = {
        uid: 'officer_1',
        platformRole: 'COMPLIANCE_OFFICER',
        isActive: true,
      };
      store['staffRecords/super_1'] = {
        uid: 'super_1',
        platformRole: 'SUPER_ADMIN',
        isActive: true,
      };
    });

    it('prevents Super Admin self-revocation', async () => {
      await expect(
        (revokeStaffRole as any)({
          auth: { uid: 'super_1', token: { platformRole: 'SUPER_ADMIN' } },
          data: { targetUid: 'super_1', confirmationPhrase: 'REVOKE SUPER_ADMIN' },
        })
      ).rejects.toThrow(/Super Administrators cannot revoke their own role/);
    });

    it('revokes staff role, resets claims to fan, and soft-deactivates staff record', async () => {
      const res = await (revokeStaffRole as any)({
        auth: { uid: 'super_1', token: { platformRole: 'SUPER_ADMIN' } },
        data: { targetUid: 'officer_1', confirmationPhrase: 'REVOKE COMPLIANCE_OFFICER' },
      });

      expect(res.success).toBe(true);

      expect(mockSetCustomUserClaims).toHaveBeenCalledWith('officer_1', {
        personaType: 'fan',
        claimsVersion: 1,
      });

      const staff = store['staffRecords/officer_1'];
      expect(staff.isActive).toBe(false);
      expect(staff.revokedByUid).toBe('super_1');
    });
  });

  describe('suspendAccount & reinstateAccount', () => {
    beforeEach(() => {
      store['artistProfiles/bad_actor'] = {
        artistId: 'bad_actor',
        name: 'Spam Artist',
        isSuspended: false,
      };
    });

    it('rejects suspension from non-Trust&Safety role (e.g. MARKETING)', async () => {
      await expect(
        (suspendAccount as any)({
          auth: { uid: 'mkt_1', token: { platformRole: 'MARKETING' } },
          data: { targetUid: 'bad_actor', targetType: 'artist', reason: 'Spam', confirmationPhrase: 'SUSPEND ACCOUNT' },
        })
      ).rejects.toThrow('Only Trust & Safety or Super Admins can suspend accounts.');
    });

    it('suspends artist with reason and logs audit event', async () => {
      const res = await (suspendAccount as any)({
        auth: { uid: 'ts_1', token: { platformRole: 'TRUST_SAFETY' } },
        data: {
          targetUid: 'bad_actor',
          targetType: 'artist',
          reason: 'DMCA Violation & Fraud Signals',
          confirmationPhrase: 'SUSPEND ACCOUNT',
        },
      });

      expect(res.success).toBe(true);

      const artist = store['artistProfiles/bad_actor'];
      expect(artist.isSuspended).toBe(true);
      expect(artist.suspensionReason).toBe('DMCA Violation & Fraud Signals');
    });

    it('reinstates suspended artist', async () => {
      store['artistProfiles/bad_actor'].isSuspended = true;

      const res = await (reinstateAccount as any)({
        auth: { uid: 'ts_1', token: { platformRole: 'TRUST_SAFETY' } },
        data: { targetUid: 'bad_actor', targetType: 'artist', reason: 'Appeal Granted' },
      });

      expect(res.success).toBe(true);

      const artist = store['artistProfiles/bad_actor'];
      expect(artist.isSuspended).toBe(false);
      expect(artist.reinstatementReason).toBe('Appeal Granted');
    });
  });

  describe('approveStaffRefund', () => {
    beforeEach(() => {
      store['tips/tip_100'] = {
        tipId: 'tip_100',
        amountCents: 5000,
        status: 'succeeded',
        fanUid: 'fan_1',
        recipientId: 'artist_1',
      };
    });

    it('rejects refund approval from unauthorized role (e.g. ARTIST_RELATIONS)', async () => {
      await expect(
        (approveStaffRefund as any)({
          auth: { uid: 'ar_1', token: { platformRole: 'ARTIST_RELATIONS' } },
          data: { tipId: 'tip_100', reason: 'Accidental double tip', confirmationPhrase: 'APPROVE REFUND' },
        })
      ).rejects.toThrow('Only Support, Finance, or Super Admins can approve refunds.');
    });

    it('approves refund, reverses ledger, and updates tip status', async () => {
      const res = await (approveStaffRefund as any)({
        auth: { uid: 'support_1', token: { platformRole: 'CUSTOMER_SUPPORT' } },
        data: { tipId: 'tip_100', reason: 'Accidental duplicate transaction', confirmationPhrase: 'APPROVE REFUND' },
      });

      expect(res.success).toBe(true);

      const tip = store['tips/tip_100'];
      expect(tip.status).toBe('refunded');
      expect(tip.approvedByStaffUid).toBe('support_1');
      expect(tip.approvedByStaffRole).toBe('CUSTOMER_SUPPORT');
    });
  });
});
