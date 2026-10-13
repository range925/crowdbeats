/**
 * Crowdbeats V2 — Phase 12: Band CRM & Member Management Unit Tests
 *
 * Verifies:
 * 1. Owner/Manager/Member Access Hierarchy & Permission Scoping
 * 2. Payout-Data Isolation in getBandTreasury (Member balances hidden from other members)
 * 3. Band Supporter Aggregation, Segmentation, and Tip Analytics
 * 4. Band Supporter Details & Chronological Dossier
 * 5. Fan Privacy Masking & Consent-Enforced Direct Messaging
 * 6. Shared Band Activity Feed & Governance Events
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { CallerContext } from '../band/bandCrmService.js';
import {
  canAccessBandCrm,
  getBandSupporters,
  getBandSupporterDetails,
  sendBandThankYouNote,
  getBandActivity,
  recordBandActivity,
} from '../band/bandCrmService.js';
import { getBandTreasury } from '../band/getBandTreasury.js';

// ── In-Memory Firestore Mock Store ──────────────────────────────────────────

const store: Record<string, any> = {};

const createDocRef = (path: string): any => {
  return {
    id: path.split('/').pop(),
    get: jest.fn<any>().mockImplementation(async () => {
      const data = store[path];
      return {
        exists: data !== undefined,
        data: () => data,
        id: path.split('/').pop(),
        ref: createDocRef(path),
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
    collection: (subCol: string) => createQuery(`${path}/${subCol}`),
  };
};

const createQuery = (
  colPath: string,
  filters: Array<{ field: string; op: string; value: any }> = [],
  order?: { field: string; dir: string },
  limitCount?: number
): any => {
  return {
    doc: (docId?: string) => {
      const id = docId || `mock_doc_${Math.random().toString(36).substring(7)}`;
      return createDocRef(`${colPath}/${id}`);
    },
    where: (field: string, op: string, value: any) => {
      return createQuery(colPath, [...filters, { field, op, value }], order, limitCount);
    },
    orderBy: (field: string, dir: string = 'asc') => {
      return createQuery(colPath, filters, { field, dir }, limitCount);
    },
    limit: (n: number) => {
      return createQuery(colPath, filters, order, n);
    },
    get: async () => {
      const prefix = `${colPath}/`;
      let docs = Object.keys(store)
        .filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
        .map((k) => ({
          id: k.split('/').pop()!,
          ref: createDocRef(k),
          data: () => store[k],
        }))
        .filter((d) => {
          const docData = d.data();
          if (!docData) return false;
          for (const f of filters) {
            const val = docData[f.field];
            if (f.op === '==') {
              if (val !== f.value) return false;
            } else if (f.op === 'in') {
              if (!Array.isArray(f.value) || !f.value.includes(val)) return false;
            } else if (f.op === '>=') {
              if (val === undefined || val < f.value) return false;
            } else if (f.op === '<=') {
              if (val === undefined || val > f.value) return false;
            }
          }
          return true;
        });

      if (order) {
        docs.sort((a, b) => {
          const valA = a.data()[order.field];
          const valB = b.data()[order.field];
          if (valA === valB) return 0;
          const cmp = valA > valB ? 1 : -1;
          return order.dir === 'desc' ? -cmp : cmp;
        });
      }

      if (limitCount && limitCount > 0) {
        docs = docs.slice(0, limitCount);
      }

      return {
        docs,
        empty: docs.length === 0,
        size: docs.length,
        forEach: (fn: (doc: any) => void) => docs.forEach(fn),
      };
    },
  };
};

const mockDb: any = {
  collection: (colPath: string) => createQuery(colPath),
};

jest.mock('firebase-admin', () => {
  const actual = jest.requireActual('firebase-admin') as any;
  return {
    ...actual,
    firestore: Object.assign(() => mockDb, {
      FieldValue: {
        serverTimestamp: () => new Date().toISOString(),
        increment: (n: number) => n,
      },
    }),
    apps: [{}],
    initializeApp: jest.fn(),
  };
});

describe('Phase 12: Band CRM & Member Management Service', () => {
  const targetBandId = 'band_neon_pulse';
  const founderUid = 'usr_founder_1';
  const adminUid = 'usr_admin_2';
  const memberUid = 'usr_member_3';
  const outsiderUid = 'usr_outsider_4';

  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];

    // Band doc
    store[`bands/${targetBandId}`] = {
      bandId: targetBandId,
      name: 'Neon Pulse',
      founderUid,
      isActive: true,
      memberCount: 3,
      totalTipsReceivedCents: 60000,
    };

    // Members subcollection
    store[`bands/${targetBandId}/members/${founderUid}`] = {
      uid: founderUid,
      displayName: 'Alex Lead',
      role: 'BAND_FOUNDER',
      isActive: true,
      joinedAt: '2026-01-01T00:00:00Z',
    };
    store[`bands/${targetBandId}/members/${adminUid}`] = {
      uid: adminUid,
      displayName: 'Sam Keys',
      role: 'BAND_ADMIN',
      isActive: true,
      joinedAt: '2026-01-05T00:00:00Z',
    };
    store[`bands/${targetBandId}/members/${memberUid}`] = {
      uid: memberUid,
      displayName: 'Jordan Drums',
      role: 'BAND_MEMBER',
      isActive: true,
      joinedAt: '2026-01-10T00:00:00Z',
    };

    // Split configuration
    store[`bands/${targetBandId}/splitConfig/current`] = {
      version: 1,
      splits: [
        { uid: founderUid, splitBps: 5000 },
        { uid: adminUid, splitBps: 3000 },
        { uid: memberUid, splitBps: 2000 },
      ],
    };

    // User docs (with private wallet balances & KYC statuses)
    store[`users/${founderUid}`] = {
      uid: founderUid,
      displayName: 'Alex Lead',
      totalEarnedCents: 30000,
      availableBalanceCents: 15000,
      pendingKycBalanceCents: 0,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true,
    };
    store[`users/${adminUid}`] = {
      uid: adminUid,
      displayName: 'Sam Keys',
      totalEarnedCents: 18000,
      availableBalanceCents: 8000,
      pendingKycBalanceCents: 0,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true,
    };
    store[`users/${memberUid}`] = {
      uid: memberUid,
      displayName: 'Jordan Drums',
      totalEarnedCents: 12000,
      availableBalanceCents: 4500,
      pendingKycBalanceCents: 1500,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: false, // Incomplete KYC
    };

    // Band Supporters:
    // Fan 1: Repeat supporter (2 tips, $100 total)
    store['users/fan_repeat_1'] = {
      displayName: 'Chloe Bennett',
      photoUrl: 'https://images.test/chloe.jpg',
      privacyPreferences: { anonymousTipping: false, allowDirectMessages: true },
      isAnonymous: false,
    };
    store['tips/tip_1'] = {
      bandId: targetBandId,
      fanUid: 'fan_repeat_1',
      amountCents: 5000,
      status: 'succeeded',
      createdAt: '2026-10-01T12:00:00Z',
      sessionId: 'session_live_1',
      sessionTitle: 'Headline Friday Set',
      fanMessage: 'Awesome bassline!',
    };
    store['tips/tip_2'] = {
      bandId: targetBandId,
      fanUid: 'fan_repeat_1',
      amountCents: 5000,
      status: 'succeeded',
      createdAt: '2026-10-05T15:00:00Z',
      sessionId: 'session_live_1',
      sessionTitle: 'Headline Friday Set',
      fanMessage: 'Keep rocking!',
    };

    // Fan 2: Anonymous tipper
    store['users/fan_anon_2'] = {
      displayName: 'Secret Fan',
      photoUrl: 'https://images.test/secret.jpg',
      privacyPreferences: { anonymousTipping: true, allowDirectMessages: true },
      isAnonymous: false,
    };
    store['tips/tip_3'] = {
      bandId: targetBandId,
      fanUid: 'fan_anon_2',
      amountCents: 2500,
      status: 'succeeded',
      isAnonymous: true,
      createdAt: '2026-10-08T18:00:00Z',
    };

    // Fan 3: Campaign Backer
    store['users/fan_backer_3'] = {
      displayName: 'Miles Vance',
      photoUrl: null,
      privacyPreferences: { anonymousTipping: false, allowDirectMessages: true },
      isAnonymous: false,
    };
    store['campaigns/camp_album_1'] = {
      bandId: targetBandId,
      title: 'Vinyl Pressing 2026',
    };
    store['campaigns/camp_album_1/contributions/contrib_1'] = {
      fanUid: 'fan_backer_3',
      amountCents: 6000,
      createdAt: '2026-10-10T11:00:00Z',
    };

    // Fan 4: Follower only
    store['users/fan_follower_4'] = {
      displayName: 'Nora Davis',
      photoUrl: null,
      privacyPreferences: { anonymousTipping: false, allowDirectMessages: false }, // Direct messages opted-out
      isAnonymous: false,
    };
    store['follows/follow_1'] = {
      targetEntityId: targetBandId,
      followerUid: 'fan_follower_4',
      status: 'active',
      createdAt: '2026-09-20T10:00:00Z',
    };
  });

  describe('1. Owner/Manager/Member Access Hierarchy & Scoping', () => {
    it('permits band founder to access band CRM', async () => {
      const access = await canAccessBandCrm(mockDb, { uid: founderUid }, targetBandId);
      expect(access.authorized).toBe(true);
      expect(access.memberRole).toBe('BAND_FOUNDER');
    });

    it('permits band admin to access band CRM', async () => {
      const access = await canAccessBandCrm(mockDb, { uid: adminUid }, targetBandId);
      expect(access.authorized).toBe(true);
      expect(access.memberRole).toBe('BAND_ADMIN');
    });

    it('permits band member to access band CRM', async () => {
      const access = await canAccessBandCrm(mockDb, { uid: memberUid }, targetBandId);
      expect(access.authorized).toBe(true);
      expect(access.memberRole).toBe('BAND_MEMBER');
    });

    it('permits authorized staff roles (SUPER_ADMIN, CUSTOMER_SUPPORT, ARTIST_RELATIONS)', async () => {
      const staffAccess = await canAccessBandCrm(mockDb, { uid: 'staff_1', role: 'SUPER_ADMIN' }, targetBandId);
      expect(staffAccess.authorized).toBe(true);
      expect(staffAccess.memberRole).toBe('STAFF');
    });

    it('denies access to non-members and random users', async () => {
      const outsiderAccess = await canAccessBandCrm(mockDb, { uid: outsiderUid }, targetBandId);
      expect(outsiderAccess.authorized).toBe(false);
    });

    it('throws permission-denied when non-member calls getBandSupporters', async () => {
      await expect(
        getBandSupporters(mockDb, { bandId: targetBandId }, { uid: outsiderUid })
      ).rejects.toThrow('Caller is not authorized to access this band CRM.');
    });
  });

  describe('2. Payout-Data Isolation in getBandTreasury', () => {
    it('isolates personal wallet balances when called by a standard BAND_MEMBER', async () => {
      const req: any = {
        auth: { uid: memberUid, token: {} },
        data: { bandId: targetBandId },
      };

      const res: any = await (getBandTreasury as any).run(req);
      expect(res.bandId).toBe(targetBandId);
      expect(res.members).toHaveLength(3);

      const selfRecord = res.members.find((m: any) => m.uid === memberUid);
      expect(selfRecord.totalEarnedCents).toBe(12000);
      expect(selfRecord.availableBalanceCents).toBe(4500);
      expect(selfRecord.pendingKycBalanceCents).toBe(1500);
      expect(selfRecord.stripePayoutsEnabled).toBe(false);

      // Other members MUST have their balances and KYC hidden from regular members
      const founderRecord = res.members.find((m: any) => m.uid === founderUid);
      expect(founderRecord.totalEarnedCents).toBe(0);
      expect(founderRecord.availableBalanceCents).toBe(0);
      expect(founderRecord.pendingKycBalanceCents).toBe(0);
      expect(founderRecord.stripeChargesEnabled).toBe(false);
      expect(founderRecord.stripePayoutsEnabled).toBe(false);

      const adminRecord = res.members.find((m: any) => m.uid === adminUid);
      expect(adminRecord.totalEarnedCents).toBe(0);
      expect(adminRecord.availableBalanceCents).toBe(0);
      expect(adminRecord.pendingKycBalanceCents).toBe(0);
      expect(adminRecord.stripeChargesEnabled).toBe(false);
      expect(adminRecord.stripePayoutsEnabled).toBe(false);
    });

    it('allows BAND_FOUNDER to view member KYC readiness while isolating private balances', async () => {
      const req: any = {
        auth: { uid: founderUid, token: {} },
        data: { bandId: targetBandId },
      };

      const res: any = await (getBandTreasury as any).run(req);

      // Founder sees their own full financials
      const selfRecord = res.members.find((m: any) => m.uid === founderUid);
      expect(selfRecord.totalEarnedCents).toBe(30000);
      expect(selfRecord.availableBalanceCents).toBe(15000);

      // Founder sees member KYC readiness (charges/payoutsEnabled) so onboarding can be managed
      const memberRecord = res.members.find((m: any) => m.uid === memberUid);
      expect(memberRecord.stripeChargesEnabled).toBe(true);
      expect(memberRecord.stripePayoutsEnabled).toBe(false); // Incomplete KYC visible to founder
      expect(memberRecord.availableBalanceCents).toBe(0); // Personal wallet balance remains isolated
    });
  });

  describe('3. Band Supporter Aggregation, Segmentation, and Tip Analytics', () => {
    it('aggregates band followers, tips, and campaign backers into correct segments', async () => {
      const caller: CallerContext = { uid: founderUid };
      const res = await getBandSupporters(mockDb, { bandId: targetBandId }, caller);

      expect(res.ok).toBe(true);
      expect(res.bandId).toBe(targetBandId);
      expect(res.totalCount).toBe(4);

      // Chloe Bennett: 2 tips of $50 = $100 LTV => TOP_SUPPORTER
      const chloe = res.supporters.find((s) => s.supporterId === 'fan_repeat_1');
      expect(chloe).toBeDefined();
      expect(chloe!.displayName).toBe('Chloe Bennett');
      expect(chloe!.lifetimeValueCents).toBe(10000);
      expect(chloe!.tipsCount).toBe(2);
      expect(chloe!.segment).toBe('TOP_SUPPORTER');
      expect(chloe!.isAnonymous).toBe(false);
      expect(chloe!.allowsDirectMessaging).toBe(true);

      // Miles Vance: 1 campaign contribution of $60 = $60 LTV => TOP_SUPPORTER & CAMPAIGN_BACKER
      const miles = res.supporters.find((s) => s.supporterId === 'fan_backer_3');
      expect(miles).toBeDefined();
      expect(miles!.campaignsCount).toBe(1);
      expect(miles!.totalCampaignContributionCents).toBe(6000);
      expect(miles!.segment).toBe('TOP_SUPPORTER');

      // Nora Davis: 0 financial, 1 follow => FOLLOWER_ONLY
      const nora = res.supporters.find((s) => s.supporterId === 'fan_follower_4');
      expect(nora).toBeDefined();
      expect(nora!.isFollower).toBe(true);
      expect(nora!.lifetimeValueCents).toBe(0);
      expect(nora!.segment).toBe('FOLLOWER_ONLY');
      expect(nora!.allowsDirectMessaging).toBe(false); // Opted out of direct messages
    });

    it('enforces privacy masking on anonymous supporters', async () => {
      const caller: CallerContext = { uid: founderUid };
      const res = await getBandSupporters(mockDb, { bandId: targetBandId }, caller);

      const anonFan = res.supporters.find((s) => s.supporterId === 'fan_anon_2');
      expect(anonFan).toBeDefined();
      expect(anonFan!.displayName).toBe('Anonymous Supporter');
      expect(anonFan!.photoUrl).toBeNull();
      expect(anonFan!.isAnonymous).toBe(true);
      expect(anonFan!.allowsDirectMessaging).toBe(false);
    });

    it('computes accurate band tip analytics and top stage session', async () => {
      const caller: CallerContext = { uid: founderUid };
      const res = await getBandSupporters(mockDb, { bandId: targetBandId }, caller);

      expect(res.analytics.totalTipsReceivedCents).toBe(12500); // 5000 + 5000 + 2500
      expect(res.analytics.totalTipsCount).toBe(3);
      expect(res.analytics.averageTipCents).toBe(Math.round(12500 / 3));
      expect(res.analytics.topTippingSession?.sessionId).toBe('session_live_1');
      expect(res.analytics.topTippingSession?.sessionTitle).toBe('Headline Friday Set');
      expect(res.analytics.topTippingSession?.totalCents).toBe(10000);
    });

    it('filters supporters by segmentFilter and searchQuery', async () => {
      const caller: CallerContext = { uid: founderUid };

      const followersOnly = await getBandSupporters(
        mockDb,
        { bandId: targetBandId, segmentFilter: 'followers' },
        caller
      );
      expect(followersOnly.supporters.every((s) => s.segment === 'FOLLOWER_ONLY')).toBe(true);

      const searchRes = await getBandSupporters(
        mockDb,
        { bandId: targetBandId, searchQuery: 'chloe' },
        caller
      );
      expect(searchRes.supporters).toHaveLength(1);
      expect(searchRes.supporters[0].displayName).toBe('Chloe Bennett');
    });
  });

  describe('4. Band Supporter Details & Chronological Dossier', () => {
    it('compiles chronological engagement history and itemized tip breakdowns for the band', async () => {
      const caller: CallerContext = { uid: founderUid };
      const res = await getBandSupporterDetails(
        mockDb,
        { bandId: targetBandId, supporterId: 'fan_repeat_1' },
        caller
      );

      expect(res.ok).toBe(true);
      expect(res.bandId).toBe(targetBandId);
      expect(res.details.supporter.displayName).toBe('Chloe Bennett');
      expect(res.details.tipBreakdown).toHaveLength(2);
      expect(res.details.engagementHistory.length).toBeGreaterThanOrEqual(2);

      const tipEvt = res.details.engagementHistory.find((e) => e.type === 'TIP_RECEIVED');
      expect(tipEvt).toBeDefined();
      expect(tipEvt?.summary).toContain('Headline Friday Set');
    });
  });

  describe('5. Fan Privacy Masking & Consent-Enforced Direct Messaging', () => {
    it('rejects sending thank you note if fan opted out of direct messages', async () => {
      const caller: CallerContext = { uid: founderUid };
      await expect(
        sendBandThankYouNote(
          mockDb,
          {
            bandId: targetBandId,
            supporterId: 'fan_follower_4',
            message: 'Thank you for following Neon Pulse!',
          },
          caller
        )
      ).rejects.toThrow('Fan has opted out of direct messages.');
    });

    it('rejects sending thank you note if fan tipped anonymously', async () => {
      const caller: CallerContext = { uid: founderUid };
      await expect(
        sendBandThankYouNote(
          mockDb,
          {
            bandId: targetBandId,
            supporterId: 'fan_anon_2',
            message: 'Thank you for your generous tip!',
          },
          caller
        )
      ).rejects.toThrow('Cannot contact fans who supported anonymously.');
    });

    it('successfully delivers message on behalf of band when fan consent is granted', async () => {
      const caller: CallerContext = { uid: founderUid };
      const res = await sendBandThankYouNote(
        mockDb,
        {
          bandId: targetBandId,
          supporterId: 'fan_repeat_1',
          message: 'Thank you for rocking out with us at Headline Friday Set!',
        },
        caller
      );

      expect(res.ok).toBe(true);
      expect(res.conversationId).toBeDefined();
      expect(res.messageId).toBeDefined();

      // Check conversation was stored with actingAsBandId
      const conv = store[`conversations/${res.conversationId}`];
      expect(conv).toBeDefined();
      expect(conv.participants).toContain(targetBandId);
      expect(conv.participants).toContain('fan_repeat_1');

      // Check CRM event was emitted
      const crmEvents = Object.values(store).filter(
        (v: any) => v && v.eventType === 'BAND_MESSAGE_SENT'
      );
      expect(crmEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('6. Shared Band Activity Feed', () => {
    it('records and returns shared band activities and governance history', async () => {
      await recordBandActivity(mockDb, targetBandId, {
        type: 'MEMBER_JOINED',
        title: 'New Member Joined',
        description: 'Jordan Drums joined the band as Drummer.',
        actorUid: founderUid,
      });

      await recordBandActivity(mockDb, targetBandId, {
        type: 'SPLIT_UPDATED',
        title: 'Split Configuration Updated',
        description: 'New 3-way split published.',
        actorUid: founderUid,
      });

      const caller: CallerContext = { uid: memberUid };
      const res = await getBandActivity(mockDb, { bandId: targetBandId }, caller);

      expect(res.ok).toBe(true);
      expect(res.bandId).toBe(targetBandId);
      expect(res.activities.length).toBeGreaterThanOrEqual(2);

      const splitAct = res.activities.find((a) => a.type === 'SPLIT_UPDATED');
      expect(splitAct).toBeDefined();
      expect(splitAct?.title).toBe('Split Configuration Updated');
    });
  });
});
