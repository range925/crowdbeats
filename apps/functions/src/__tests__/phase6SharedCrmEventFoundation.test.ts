/**
 * Crowdbeats V2 — Phase 6: Shared CRM Event & Data Foundation Test Suite
 *
 * Acceptance Criteria Verified:
 * 1. Consistent CRM event IDs (deterministic format: crm_{source}_{targetType}_{targetId}_{timestamp})
 * 2. Idempotent event processing (replaying same idempotencyKey returns existing record, isReplay: true, no duplicate records)
 * 3. Standard and financial compliance retention periods (365 days default, 2555 days for financial records)
 * 4. Dual-write to auditEvents collection for centralized immutable auditing
 * 5. Permission-aware customer profile hydration (staff access vs owner access vs unauthorized denial)
 * 6. Internal notes privacy barrier (internal notes stripped for regular users, accessible to staff)
 * 7. Directed relationship querying with deterministic compound IDs ({sourceId}_{targetId})
 * 8. Financial reference querying & aggregation (tips sent, tips received, payouts)
 * 9. Staff-only internal note append with CRM and audit event logging
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  buildCrmEventId,
  CRM_RETENTION_DAYS,
} from '@crowdbeats/contracts';
import {
  recordCrmEvent,
  getCrmCustomerProfile,
  getCrmRelationships,
  getCrmFinancialReferences,
  addCrmInternalNote,
  isStaffCaller,
} from '../crm/crmService';

// In-memory Firestore store for mocking
let mockStore: Record<string, any> = {};

const createMockDocRef = (path: string): any => {
  const parts = path.split('/');
  const docId = parts[parts.length - 1];
  return {
    id: docId,
    path,
    get: jest.fn<any>().mockImplementation(async () => {
      const data = mockStore[path];
      return {
        exists: data !== undefined,
        data: () => data,
        id: docId,
        ref: createMockDocRef(path),
      };
    }),
    set: jest.fn<any>().mockImplementation(async (data: any, options?: any) => {
      if (options?.merge && mockStore[path]) {
        mockStore[path] = { ...mockStore[path], ...data };
      } else {
        mockStore[path] = { ...data };
      }
    }),
    update: jest.fn<any>().mockImplementation(async (data: any) => {
      if (!mockStore[path]) {
        mockStore[path] = {};
      }
      const current = { ...mockStore[path] };
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === 'object' && (v as any)._isFieldValueUnion) {
          const arr = Array.isArray(current[k]) ? [...current[k]] : [];
          arr.push((v as any).value);
          current[k] = arr;
        } else {
          current[k] = v;
        }
      }
      mockStore[path] = current;
    }),
  };
};

const createMockCollection = (
  colName: string,
  filters: Array<{ field: string; op: string; val: any }> = [],
  limitCount: number = 100,
): any => {
  return {
    doc: (docId?: string) => {
      const id = docId || `gen_${Math.random().toString(36).substring(7)}`;
      return createMockDocRef(`${colName}/${id}`);
    },
    where: (field: string, op: string, val: any) => {
      return createMockCollection(colName, [...filters, { field, op, val }], limitCount);
    },
    limit: (n: number) => {
      return createMockCollection(colName, filters, n);
    },
    count: () => ({
      get: async () => {
        const matchingDocs: any[] = [];
        const prefix = `${colName}/`;
        for (const [key, value] of Object.entries(mockStore)) {
          if (key.startsWith(prefix) && key.split('/').length === 2) {
            let matches = true;
            for (const f of filters) {
              if (f.op === '==' && value[f.field] !== f.val) matches = false;
            }
            if (matches) matchingDocs.push(value);
          }
        }
        return { data: () => ({ count: matchingDocs.length }) };
      },
    }),
    get: jest.fn<any>().mockImplementation(async () => {
      const matchingDocs: any[] = [];
      const prefix = `${colName}/`;
      for (const [key, value] of Object.entries(mockStore)) {
        if (key.startsWith(prefix) && key.split('/').length === 2) {
          let matches = true;
          for (const f of filters) {
            if (f.op === '==' && value[f.field] !== f.val) matches = false;
            if (f.op === 'in' && Array.isArray(f.val) && !f.val.includes(value[f.field])) matches = false;
          }
          if (matches) {
            matchingDocs.push({
              id: key.replace(prefix, ''),
              data: () => value,
              ref: createMockDocRef(key),
            });
          }
        }
      }
      const sliced = matchingDocs.slice(0, limitCount);
      return {
        empty: sliced.length === 0,
        size: sliced.length,
        docs: sliced,
        forEach: (cb: (doc: any) => void) => sliced.forEach(cb),
      };
    }),
  };
};

const mockDb: any = {
  collection: (name: string) => createMockCollection(name),
  doc: (path: string) => createMockDocRef(path),
  batch: () => {
    const ops: Array<() => Promise<void>> = [];
    return {
      set: (ref: any, data: any, opts?: any) => {
        ops.push(async () => { await ref.set(data, opts); });
      },
      update: (ref: any, data: any) => {
        ops.push(async () => { await ref.update(data); });
      },
      commit: async () => {
        for (const op of ops) await op();
      },
    };
  },
};

// Mock admin FieldValue
jest.mock('firebase-admin', () => ({
  firestore: {
    FieldValue: {
      serverTimestamp: () => ({ _isServerTimestamp: true }),
      arrayUnion: (item: any) => ({ _isFieldValueUnion: true, value: item }),
    },
  },
}));

describe('Phase 6: Shared CRM Event & Data Foundation', () => {
  beforeEach(() => {
    mockStore = {};
  });

  describe('CRM Event Ingestion & Idempotency', () => {
    it('generates consistent deterministic event IDs matching specification', () => {
      const eventId = buildCrmEventId('STRIPE', 'USER', 'usr_fan_123', 1700000000000);
      expect(eventId).toBe('crm_stripe_user_usr_fan_123_1700000000000');
    });

    it('records a new CRM event with processingStatus COMPLETED and dual-writes to auditEvents', async () => {
      const result = await recordCrmEvent(mockDb, {
        source: 'auth',
        action: 'USER_REGISTERED',
        actorUid: 'usr_new_fan',
        targetId: 'usr_new_fan',
        targetType: 'user',
        payload: { registrationMethod: 'google.com' },
        timestampMs: 1700000000000,
      });

      expect(result.ok).toBe(true);
      expect(result.isReplay).toBe(false);
      expect(result.event.eventId).toBe('crm_auth_user_usr_new_fan_1700000000000');
      expect(result.event.processingStatus).toBe('COMPLETED');
      expect(result.event.retentionDays).toBe(CRM_RETENTION_DAYS.DEFAULT);

      // Verify stored in crmEvents
      const storedEvent = mockStore['crmEvents/crm_auth_user_usr_new_fan_1700000000000'];
      expect(storedEvent).toBeDefined();
      expect(storedEvent.source).toBe('auth');
      expect(storedEvent.processingStatus).toBe('COMPLETED');

      // Verify auditEvents dual-write
      const storedAudit = mockStore['auditEvents/crm_auth_user_usr_new_fan_1700000000000'];
      expect(storedAudit).toBeDefined();
      expect(storedAudit.action).toBe('CRM_USER_REGISTERED');
      expect(storedAudit.targetId).toBe('usr_new_fan');
    });

    it('enforces idempotency on replaying with same idempotencyKey (zero duplicate records)', async () => {
      const key = 'tip_123:TIP_CONFIRMED:usr_fan_1';

      // First call
      const res1 = await recordCrmEvent(mockDb, {
        source: 'tipping',
        action: 'TIP_CONFIRMED',
        actorUid: 'usr_fan_1',
        targetId: 'tip_123',
        targetType: 'user',
        idempotencyKey: key,
        payload: { amountCents: 2500 },
        timestampMs: 1700000000000,
      });

      expect(res1.ok).toBe(true);
      expect(res1.isReplay).toBe(false);

      // Replay call with exact same idempotencyKey
      const res2 = await recordCrmEvent(mockDb, {
        source: 'tipping',
        action: 'TIP_CONFIRMED',
        actorUid: 'usr_fan_1',
        targetId: 'tip_123',
        targetType: 'user',
        idempotencyKey: key,
        payload: { amountCents: 2500 },
        timestampMs: 1700000000500, // Different timestamp, same key
      });

      expect(res2.ok).toBe(true);
      expect(res2.isReplay).toBe(true);
      expect(res2.event.eventId).toBe(res1.event.eventId);

      // Verify only 1 document exists in crmEvents
      const crmDocs = Object.keys(mockStore).filter((k) => k.startsWith('crmEvents/'));
      expect(crmDocs.length).toBe(1);
    });

    it('applies 2555 days (7-year financial compliance) retention to financial events', async () => {
      const result = await recordCrmEvent(mockDb, {
        source: 'stripe',
        action: 'PAYOUT_INITIATED',
        actorUid: 'staff_finance_1',
        targetId: 'usr_artist_456',
        targetType: 'artist',
        payload: { amountCents: 150000 },
        timestampMs: 1700000000000,
      });

      expect(result.event.retentionDays).toBe(CRM_RETENTION_DAYS.FINANCIAL_COMPLIANCE);
      expect(result.event.retentionDays).toBe(2555);
    });
  });

  describe('Customer Profile Hydration & Permission Boundaries', () => {
    beforeEach(() => {
      // Seed target user
      mockStore['users/usr_artist_100'] = {
        uid: 'usr_artist_100',
        email: 'artist100@crowdbeats.com',
        displayName: 'Acoustic Waves',
        personaType: 'artist',
        platformRole: null,
        emailVerified: true,
        stripeAccountId: 'acct_artist100',
        stripeCustomerId: 'cus_artist100',
        internalNotes: [
          {
            id: 'note_1',
            note: 'VIP Artist onboarded via SXSW stage showcase',
            authorUid: 'staff_1',
            authorRole: 'ARTIST_RELATIONS',
            timestamp: 1690000000000,
          },
        ],
      };

      // Seed artist profile
      mockStore['artistProfiles/usr_artist_100'] = {
        stageName: 'Acoustic Waves',
        genre: 'Indie Folk',
        bio: 'Fingerstyle guitarist and singer-songwriter.',
        verified: true,
        totalTipsReceivedCents: 75000,
      };

      // Seed tips
      mockStore['tips/tip_1'] = {
        fanUid: 'usr_fan_99',
        creatorId: 'usr_artist_100',
        amountCents: 5000,
        netAmountCents: 4700,
        platformFeeCents: 300,
      };
      mockStore['tips/tip_2'] = {
        fanUid: 'usr_fan_98',
        creatorId: 'usr_artist_100',
        amountCents: 3000,
        netAmountCents: 2820,
        platformFeeCents: 180,
      };
      mockStore['tips/tip_3'] = {
        fanUid: 'usr_artist_100',
        creatorId: 'usr_band_5',
        amountCents: 1000,
      };

      // Seed follows
      mockStore['follows/usr_fan_99_usr_artist_100'] = {
        sourceId: 'usr_fan_99',
        targetId: 'usr_artist_100',
      };
      mockStore['follows/usr_fan_98_usr_artist_100'] = {
        sourceId: 'usr_fan_98',
        targetId: 'usr_artist_100',
      };

      // Seed support tickets
      mockStore['supportRequests/ticket_1'] = {
        userId: 'usr_artist_100',
        status: 'open',
        subject: 'Payout bank account question',
      };
      mockStore['supportRequests/ticket_2'] = {
        userId: 'usr_artist_100',
        status: 'resolved',
        subject: 'Stage QR code download',
      };
    });

    it('allows Staff to retrieve full customer profile including internal notes', async () => {
      const staffCaller = {
        uid: 'staff_agent_007',
        platformRole: 'CUSTOMER_SUPPORT',
        isAdmin: false,
      };

      const profile = await getCrmCustomerProfile(mockDb, 'usr_artist_100', staffCaller);

      expect(profile.uid).toBe('usr_artist_100');
      expect(profile.displayName).toBe('Acoustic Waves');
      expect(profile.artistProfile?.genre).toBe('Indie Folk');
      expect(profile.financialSummary.tipsReceivedCount).toBe(2);
      expect(profile.financialSummary.totalTipsReceivedCents).toBe(8000);
      expect(profile.financialSummary.tipsSentCount).toBe(1);
      expect(profile.financialSummary.totalTipsSentCents).toBe(1000);
      expect(profile.supportSummary.totalTicketsCount).toBe(2);
      expect(profile.supportSummary.openTicketsCount).toBe(1);

      // Staff receives internal notes
      expect(profile.internalNotes).toBeDefined();
      expect(profile.internalNotes?.length).toBe(1);
      expect(profile.internalNotes?.[0].note).toBe('VIP Artist onboarded via SXSW stage showcase');
    });

    it('allows end-users to retrieve own profile but strictly SANITIZES internal notes', async () => {
      const selfCaller = {
        uid: 'usr_artist_100',
        platformRole: null,
        isAdmin: false,
      };

      const profile = await getCrmCustomerProfile(mockDb, 'usr_artist_100', selfCaller);

      expect(profile.uid).toBe('usr_artist_100');
      expect(profile.displayName).toBe('Acoustic Waves');

      // CRITICAL SECURITY BARRIER: Internal notes must be undefined for end-user
      expect(profile.internalNotes).toBeUndefined();
    });

    it('denies unauthorized third-party user from reading another user profile', async () => {
      const unauthorizedCaller = {
        uid: 'usr_stranger_danger',
        platformRole: null,
        isAdmin: false,
      };

      await expect(
        getCrmCustomerProfile(mockDb, 'usr_artist_100', unauthorizedCaller)
      ).rejects.toThrow('You do not have permission to view this customer profile.');
    });

    it('throws not-found when user record does not exist', async () => {
      const staffCaller = {
        uid: 'staff_1',
        platformRole: 'SUPER_ADMIN',
        isAdmin: true,
      };

      await expect(
        getCrmCustomerProfile(mockDb, 'non_existent_uid', staffCaller)
      ).rejects.toThrow('User non_existent_uid not found.');
    });
  });

  describe('Directed Relationships Querying', () => {
    beforeEach(() => {
      // Deterministic compound IDs: {sourceId}_{targetId}
      mockStore['follows/fan_a_artist_x'] = {
        followId: 'fan_a_artist_x',
        sourceId: 'fan_a',
        sourceType: 'fan',
        targetId: 'artist_x',
        targetType: 'artist',
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      mockStore['follows/fan_b_artist_x'] = {
        followId: 'fan_b_artist_x',
        sourceId: 'fan_b',
        sourceType: 'fan',
        targetId: 'artist_x',
        targetType: 'artist',
        createdAt: '2026-01-02T00:00:00.000Z',
      };
      mockStore['follows/artist_x_band_z'] = {
        followId: 'artist_x_band_z',
        sourceId: 'artist_x',
        sourceType: 'artist',
        targetId: 'band_z',
        targetType: 'band',
        createdAt: '2026-01-03T00:00:00.000Z',
      };
    });

    it('queries followers for an entity using deterministic compound IDs', async () => {
      const res = await getCrmRelationships(mockDb, 'artist_x', { direction: 'followers' });

      expect(res.ok).toBe(true);
      expect(res.totalCount).toBe(2);
      expect(res.relationships.map((r) => r.followId).sort()).toEqual([
        'fan_a_artist_x',
        'fan_b_artist_x',
      ]);
      expect(res.relationships.every((r) => r.followId === `${r.sourceId}_${r.targetId}`)).toBe(true);
    });

    it('queries following for an entity', async () => {
      const res = await getCrmRelationships(mockDb, 'artist_x', { direction: 'following' });

      expect(res.ok).toBe(true);
      expect(res.totalCount).toBe(1);
      expect(res.relationships[0].followId).toBe('artist_x_band_z');
      expect(res.relationships[0].targetId).toBe('band_z');
    });
  });

  describe('Financial References Querying', () => {
    beforeEach(() => {
      mockStore['tips/tip_10'] = {
        fanUid: 'usr_test_finance',
        creatorId: 'usr_recipient_1',
        amountCents: 5000,
        currency: 'usd',
        status: 'succeeded',
        createdAt: '2026-01-10T12:00:00.000Z',
      };
      mockStore['tips/tip_20'] = {
        fanUid: 'usr_sender_2',
        creatorId: 'usr_test_finance',
        amountCents: 12000,
        currency: 'usd',
        status: 'succeeded',
        createdAt: '2026-01-11T14:00:00.000Z',
      };
    });

    it('queries financial references and accurately computes sent/received totals', async () => {
      const res = await getCrmFinancialReferences(mockDb, 'usr_test_finance');

      expect(res.ok).toBe(true);
      expect(res.references.length).toBe(2);
      expect(res.totalSentCents).toBe(5000);
      expect(res.totalReceivedCents).toBe(12000);

      const sentRef = res.references.find((r) => r.type === 'tip_sent');
      expect(sentRef).toBeDefined();
      expect(sentRef?.counterpartyId).toBe('usr_recipient_1');
      expect(sentRef?.amountCents).toBe(5000);

      const receivedRef = res.references.find((r) => r.type === 'tip_received');
      expect(receivedRef).toBeDefined();
      expect(receivedRef?.counterpartyId).toBe('usr_sender_2');
      expect(receivedRef?.amountCents).toBe(12000);
    });
  });

  describe('Internal Staff Notes Addition & Security', () => {
    beforeEach(() => {
      mockStore['users/usr_target_fan'] = {
        uid: 'usr_target_fan',
        email: 'fan@example.com',
        displayName: 'Concert Goer',
        internalNotes: [],
      };
    });

    it('allows staff to append an internal note, updates user record and emits CRM event', async () => {
      const staffCaller = {
        uid: 'staff_agent_1',
        platformRole: 'TRUST_SAFETY',
        email: 'safety@crowdbeats.com',
      };

      const res = await addCrmInternalNote(
        mockDb,
        'usr_target_fan',
        'Customer confirmed chargeback was an accident and contacted bank.',
        staffCaller
      );

      expect(res.ok).toBe(true);
      expect(res.note.authorUid).toBe('staff_agent_1');
      expect(res.note.authorRole).toBe('TRUST_SAFETY');
      expect(res.note.note).toBe('Customer confirmed chargeback was an accident and contacted bank.');

      // Check updated user doc
      const user = mockStore['users/usr_target_fan'];
      expect(user.internalNotes).toBeDefined();
      expect(user.internalNotes.length).toBe(1);
      expect(user.internalNotes[0].note).toBe('Customer confirmed chargeback was an accident and contacted bank.');

      // Verify CRM Event was emitted
      const crmDocs = Object.keys(mockStore).filter((k) => k.startsWith('crmEvents/'));
      expect(crmDocs.length).toBe(1);
      const crmEvent = mockStore[crmDocs[0]];
      expect(crmEvent.action).toBe('CRM_INTERNAL_NOTE_ADDED');
      expect(crmEvent.targetId).toBe('usr_target_fan');

      // Verify Audit Event was recorded
      const auditDocs = Object.keys(mockStore).filter((k) => k.startsWith('auditEvents/'));
      expect(auditDocs.length).toBe(1);
    });

    it('denies non-staff callers from adding internal notes', async () => {
      const nonStaffCaller = {
        uid: 'regular_user_1',
        platformRole: null,
      };

      await expect(
        addCrmInternalNote(mockDb, 'usr_target_fan', 'Sneaky note', nonStaffCaller)
      ).rejects.toThrow('Only authorized staff may add internal CRM notes.');
    });

    it('rejects empty or whitespace notes', async () => {
      const staffCaller = {
        uid: 'staff_1',
        platformRole: 'SUPER_ADMIN',
      };

      await expect(
        addCrmInternalNote(mockDb, 'usr_target_fan', '   ', staffCaller)
      ).rejects.toThrow('Note must be between 1 and 2000 characters.');
    });
  });

  describe('isStaffCaller Helper', () => {
    it('correctly classifies staff roles', () => {
      expect(isStaffCaller({ platformRole: 'SUPER_ADMIN' })).toBe(true);
      expect(isStaffCaller({ platformRole: 'CUSTOMER_SUPPORT' })).toBe(true);
      expect(isStaffCaller({ platformRole: 'TRUST_SAFETY' })).toBe(true);
      expect(isStaffCaller({ platformRole: 'ARTIST_RELATIONS' })).toBe(true);
      expect(isStaffCaller({ platformRole: 'FINANCE_ADMIN' })).toBe(true);
      expect(isStaffCaller({ isAdmin: true })).toBe(true);

      // Non-staff
      expect(isStaffCaller({ platformRole: 'FAN' })).toBe(false);
      expect(isStaffCaller({ platformRole: 'ARTIST' })).toBe(false);
      expect(isStaffCaller({ platformRole: null })).toBe(false);
      expect(isStaffCaller({})).toBe(false);
    });
  });
});
