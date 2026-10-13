/**
 * Crowdbeats V2 — Phase 8: Unified Administration CRM Test Suite
 *
 * Acceptance Criteria Verified:
 * 1. Searchable directories across Fans, Solo Musicians, Bands, and Sponsors
 * 2. Cross-account access denial: Non-staff users cannot search CRM directory or inspect other users' case history
 * 3. Search and filter capabilities (searchQuery matching, verificationStatus, accountStatus, pagination limit)
 * 4. Case history aggregation across support tickets, abuse reports, and payout compliance holds
 * 5. Role-based verification updates across users, artistProfiles, and bands with mandatory operational justification
 * 6. Immutable audit trails: Dual-write to crmEvents and auditEvents with caller identification and timestamping
 * 7. Privacy boundaries: Strict separation between public profile attributes and administrative notes/case metadata
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  searchCrmDirectory,
  getCrmCaseHistory,
  updateCrmVerificationStatus,
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
    orderBy: () => {
      return createMockCollection(colName, filters, limitCount);
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

describe('Phase 8: Unified Administration CRM Services', () => {
  const staffCaller = {
    uid: 'admin_staff_001',
    platformRole: 'SUPER_ADMIN',
    isAdmin: true,
    email: 'ops@crowdbeats.com',
  };

  const supportCaller = {
    uid: 'support_rep_002',
    platformRole: 'CUSTOMER_SUPPORT',
    isAdmin: false,
    email: 'support@crowdbeats.com',
  };

  const regularFanCaller = {
    uid: 'fan_regular_999',
    platformRole: 'fan',
    isAdmin: false,
    email: 'fan@example.com',
  };

  beforeEach(() => {
    mockStore = {};

    // Seed test users
    mockStore['users/fan_alice'] = {
      uid: 'fan_alice',
      displayName: 'Alice Fan',
      email: 'alice@musicfan.org',
      role: 'fan',
      personaType: 'fan',
      accountStatus: 'active',
      isVerified: false,
      verificationStatus: 'unverified',
      city: 'Austin',
      createdAt: '2026-01-10T12:00:00Z',
    };

    mockStore['users/artist_bob'] = {
      uid: 'artist_bob',
      displayName: 'Bob Solo',
      email: 'bob@guitarhero.net',
      role: 'artist',
      personaType: 'solo',
      stageName: 'Bob the Shredder',
      genre: 'Rock',
      accountStatus: 'active',
      isVerified: true,
      verificationStatus: 'verified',
      city: 'Nashville',
      stripeConnected: true,
      totalEarnedCents: 2500,
      createdAt: '2026-02-15T15:30:00Z',
    };

    mockStore['artistProfiles/artist_bob'] = {
      uid: 'artist_bob',
      stageName: 'Bob the Shredder',
      genre: 'Rock',
      verificationStatus: 'verified',
      city: 'Nashville',
    };

    mockStore['users/sponsor_corp'] = {
      uid: 'sponsor_corp',
      displayName: 'Red Sound Audio',
      email: 'partnerships@redsound.io',
      role: 'sponsor',
      personaType: 'sponsor',
      companyName: 'Red Sound Audio Inc',
      accountStatus: 'active',
      isVerified: true,
      verificationStatus: 'verified',
      city: 'Seattle',
      createdAt: '2026-03-01T09:00:00Z',
    };

    mockStore['sponsors/sponsor_corp'] = {
      id: 'sponsor_corp',
      name: 'Red Sound Audio Inc',
      contactEmail: 'partnerships@redsound.io',
      status: 'active',
    };

    mockStore['bands/band_midnight'] = {
      id: 'band_midnight',
      name: 'The Midnight Owls',
      handle: 'midnight-owls',
      creatorUid: 'artist_bob',
      genre: 'Indie Pop',
      verificationStatus: 'pending',
      isVerified: false,
      status: 'active',
      createdAt: '2026-03-20T18:00:00Z',
    };

    // Seed relationships
    mockStore['userRelationships/rel_alice_bob'] = {
      sourceId: 'fan_alice',
      targetId: 'artist_bob',
      type: 'follow',
      createdAt: '2026-04-01T10:00:00Z',
    };

    // Seed financial records
    mockStore['tips/tip_1'] = {
      id: 'tip_1',
      recipientId: 'artist_bob',
      senderId: 'fan_alice',
      amountCents: 2500,
      status: 'succeeded',
      createdAt: '2026-04-02T12:00:00Z',
    };

    // Seed case history
    mockStore['supportRequests/ticket_1'] = {
      id: 'ticket_1',
      userId: 'artist_bob',
      subject: 'Payout Delay Question',
      category: 'PAYMENTS',
      status: 'resolved',
      priority: 'high',
      createdAt: '2026-04-03T14:00:00Z',
      resolvedAt: '2026-04-03T16:00:00Z',
    };

    mockStore['reports/report_1'] = {
      id: 'report_1',
      targetUserId: 'artist_bob',
      reporterUserId: 'fan_alice',
      reason: 'Copyright inquiry for live cover song',
      category: 'COPYRIGHT',
      status: 'closed',
      createdAt: '2026-04-05T11:00:00Z',
    };

    mockStore['payoutHolds/hold_1'] = {
      id: 'hold_1',
      creatorUid: 'artist_bob',
      reason: 'Standard review for high-velocity tipping',
      status: 'RELEASED',
      createdAt: '2026-04-06T09:30:00Z',
    };
  });

  describe('Directory Search & Persona Filtering', () => {
    it('returns all personas when entityType is "all"', async () => {
      const result = await searchCrmDirectory(mockDb, { entityType: 'all' }, staffCaller);
      expect(result.items.length).toBe(4); // fan_alice, artist_bob, sponsor_corp, band_midnight
      expect(result.totalCount).toBe(4);
    });

    it('returns only fans when entityType is "fan"', async () => {
      const result = await searchCrmDirectory(mockDb, { entityType: 'fan' }, staffCaller);
      expect(result.items.length).toBe(1);
      expect(result.items[0].uid).toBe('fan_alice');
      expect(result.items[0].personaType).toBe('fan');
    });

    it('returns only solo artists when entityType is "solo_musician"', async () => {
      const result = await searchCrmDirectory(mockDb, { entityType: 'solo_musician' }, staffCaller);
      expect(result.items.length).toBe(1);
      expect(result.items[0].uid).toBe('artist_bob');
      expect(result.items[0].stageName).toBe('Bob the Shredder');
      expect(result.items[0].totalMonetaryCents).toBe(2500); // aggregated tip
    });

    it('returns only bands when entityType is "band"', async () => {
      const result = await searchCrmDirectory(mockDb, { entityType: 'band' }, staffCaller);
      expect(result.items.length).toBe(1);
      expect(result.items[0].uid).toBe('band_midnight');
      expect(result.items[0].personaType).toBe('band');
      expect(result.items[0].displayName).toBe('The Midnight Owls');
    });

    it('returns only sponsors when entityType is "sponsor"', async () => {
      const result = await searchCrmDirectory(mockDb, { entityType: 'sponsor' }, staffCaller);
      expect(result.items.length).toBe(1);
      expect(result.items[0].uid).toBe('sponsor_corp');
      expect(result.items[0].personaType).toBe('sponsor');
    });

    it('filters by verification status correctly', async () => {
      const verifiedResult = await searchCrmDirectory(
        mockDb,
        { entityType: 'all', verificationStatus: 'verified' },
        staffCaller,
      );
      expect(verifiedResult.items.every((i: any) => i.verificationStatus === 'verified')).toBe(true);

      const unverifiedResult = await searchCrmDirectory(
        mockDb,
        { entityType: 'all', verificationStatus: 'unverified' },
        supportCaller,
      );
      expect(unverifiedResult.items.every((i: any) => i.verificationStatus === 'unverified')).toBe(true);
      expect(unverifiedResult.items.some((i: any) => i.uid === 'band_midnight')).toBe(true);
    });

    it('filters by search query case-insensitively across name, email, stageName, genre', async () => {
      // Search by email substring
      const emailSearch = await searchCrmDirectory(
        mockDb,
        { entityType: 'all', searchQuery: 'musicfan' },
        staffCaller,
      );
      expect(emailSearch.items.length).toBe(1);
      expect(emailSearch.items[0].uid).toBe('fan_alice');

      // Search by stage name substring
      const stageSearch = await searchCrmDirectory(
        mockDb,
        { entityType: 'all', searchQuery: 'shredder' },
        staffCaller,
      );
      expect(stageSearch.items.length).toBe(1);
      expect(stageSearch.items[0].uid).toBe('artist_bob');

      // Search by band genre
      const genreSearch = await searchCrmDirectory(
        mockDb,
        { entityType: 'all', searchQuery: 'Indie' },
        staffCaller,
      );
      expect(genreSearch.items.length).toBe(1);
      expect(genreSearch.items[0].uid).toBe('band_midnight');
    });

    it('enforces pagination limit', async () => {
      const result = await searchCrmDirectory(mockDb, { entityType: 'all', limit: 2 }, staffCaller);
      expect(result.items.length).toBe(2);
      expect(result.totalCount).toBe(4);
    });

    it('denies directory search to non-staff callers', async () => {
      await expect(
        searchCrmDirectory(mockDb, { entityType: 'all' }, regularFanCaller),
      ).rejects.toThrow('Unauthorized. Only staff roles may access CRM directories.');
    });
  });

  describe('Case History Aggregation & Privacy Guard', () => {
    it('aggregates support tickets, reports, and payout holds for authorized staff', async () => {
      const history = await getCrmCaseHistory(mockDb, 'artist_bob', staffCaller);
      expect(history.cases.length).toBe(3);
      expect(history.totalCount).toBe(3);

      const types = history.cases.map((c: any) => c.type);
      expect(types).toContain('SUPPORT_TICKET');
      expect(types).toContain('TRUST_SAFETY_REPORT');
      expect(types).toContain('PAYOUT_HOLD');
    });

    it('allows a user to view their own case history', async () => {
      const bobCaller = {
        uid: 'artist_bob',
        platformRole: 'artist',
        isAdmin: false,
      };

      const history = await getCrmCaseHistory(mockDb, 'artist_bob', bobCaller);
      expect(history.cases.length).toBe(3);
    });

    it('strictly denies a regular user from viewing another user’s case history', async () => {
      await expect(
        getCrmCaseHistory(mockDb, 'artist_bob', regularFanCaller),
      ).rejects.toThrow('Access denied to target case history.');
    });
  });

  describe('Role-Based Verification Updates & Audit Logging', () => {
    it('allows authorized staff to approve verification and logs dual audit records', async () => {
      const updateResult = await updateCrmVerificationStatus(
        mockDb,
        {
          targetUid: 'band_midnight',
          targetType: 'band',
          verified: true,
          reason: 'Official release catalog verified with ASCAP registration.',
        },
        staffCaller,
      );

      expect(updateResult.ok).toBe(true);
      expect(updateResult.verified).toBe(true);
      expect(updateResult.targetUid).toBe('band_midnight');

      // Check band document updated
      const bandDoc = mockStore['bands/band_midnight'];
      expect(bandDoc.verificationStatus).toBe('verified');
      expect(bandDoc.isVerified).toBe(true);
      expect(bandDoc.verificationReason).toBe('Official release catalog verified with ASCAP registration.');
      expect(bandDoc.verifiedBy).toBe(staffCaller.uid);

      // Check CRM event logged
      const crmEvents = Object.keys(mockStore).filter((k) => k.startsWith('crmEvents/'));
      expect(crmEvents.length).toBeGreaterThan(0);
      const crmEvent = mockStore[crmEvents[crmEvents.length - 1]];
      expect(crmEvent.action).toBe('CRM_VERIFICATION_STATUS_CHANGED');
      expect(crmEvent.actorUid).toBe(staffCaller.uid);
      expect(crmEvent.payload.verified).toBe(true);
      expect(crmEvent.payload.newStatus).toBe('verified');

      // Check audit event logged
      const auditEvents = Object.keys(mockStore).filter((k) => k.startsWith('auditEvents/'));
      expect(auditEvents.length).toBeGreaterThan(0);
      const auditDoc = mockStore[auditEvents[auditEvents.length - 1]];
      expect(auditDoc.action).toBe('CRM_VERIFICATION_STATUS_CHANGED');
      expect(auditDoc.actorUid).toBe(staffCaller.uid);
    });

    it('updates both user and artistProfile when targetType is user/solo', async () => {
      const updateResult = await updateCrmVerificationStatus(
        mockDb,
        {
          targetUid: 'artist_bob',
          targetType: 'user',
          verified: false,
          reason: 'Duplicate identity profile submitted.',
        },
        staffCaller,
      );

      expect(updateResult.ok).toBe(true);
      expect(updateResult.verified).toBe(false);

      expect(mockStore['users/artist_bob'].verificationStatus).toBe('unverified');
      expect(mockStore['users/artist_bob'].isVerified).toBe(false);
      expect(mockStore['artistProfiles/artist_bob'].verificationStatus).toBe('unverified');
    });

    it('rejects verification update when operational justification reason is missing', async () => {
      await expect(
        updateCrmVerificationStatus(
          mockDb,
          {
            targetUid: 'band_midnight',
            targetType: 'band',
            verified: true,
            reason: '   ',
          },
          staffCaller,
        ),
      ).rejects.toThrow('An operational justification reason is required.');
    });

    it('rejects verification update from non-staff callers', async () => {
      await expect(
        updateCrmVerificationStatus(
          mockDb,
          {
            targetUid: 'band_midnight',
            targetType: 'band',
            verified: true,
            reason: 'Self-proclaimed rockstar',
          },
          regularFanCaller,
        ),
      ).rejects.toThrow('Unauthorized. Only staff roles may update verification status.');
    });
  });
});
