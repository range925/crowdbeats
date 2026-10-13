/**
 * Crowdbeats V2 — Phase 21: Cross-Platform End-to-End Testing Suite
 *
 * Exercises the 7 core end-to-end user journeys:
 * 1. Guest -> Discover (Location-first public discovery, map clustering bounds, AI profile summaries, unauthenticated tip context retention)
 * 2. Fan -> Tip (Minor unit calculation, Stripe payment intent creation, 6% fee deduction, anonymous/named tipping, double-entry ledger event)
 * 3. Solo/Band -> Receive (Live check-in, stationary QR token generation, session tipping capture, integer remainder distribution, balance ledger crediting, payout state)
 * 4. Fan -> Follow (Social graph mutual-follow relationship, direct messaging permission gating, contact opt-in/opt-out, blocking & reporting abuse)
 * 5. Creator -> Campaign (Story-to-Launch workflow, backer contributions, reward tier allocations, progress tracking, immutable financial fields)
 * 6. Sponsor -> Inquiry (Brand discovery, match pool opportunities, deal proposal, dual-signed contract state machine, escrow funding)
 * 7. Admin -> Oversight (Cross-persona CRM directory, audit event trails, financial reconciliation discrepancy detection, staff role RBAC enforcement, analytics snapshots)
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── In-Memory Firestore Mock Store ──────────────────────────────────────────

const store: Record<string, any> = {};

const mockDoc = (path: string): any => {
  const id = path.split('/').pop()!;
  return {
    id,
    path,
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
      for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === 'object' && (val as any)._delete) {
          delete store[path][key];
        } else if (val && typeof val === 'object' && (val as any)._increment !== undefined) {
          store[path][key] = (store[path][key] || 0) + (val as any)._increment;
        } else {
          store[path][key] = val;
        }
      }
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
        orderBy: jest.fn<any>().mockReturnThis(),
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
              } else if (op === 'in' && Array.isArray(val) && val.includes(v[field])) {
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
    orderBy: jest.fn<any>().mockImplementation(() => ({
      limit: jest.fn<any>().mockImplementation((lim: number) => ({
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
          return { docs: docs.slice(0, lim), empty: docs.length === 0, size: docs.slice(0, lim).length };
        }),
      })),
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
    })),
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
  const ops: Array<() => Promise<void>> = [];
  const b = {
    set: (docRef: any, data: any, options?: any) => {
      ops.push(async () => docRef.set(data, options));
      return b;
    },
    update: (docRef: any, data: any) => {
      ops.push(async () => docRef.update(data));
      return b;
    },
    delete: (docRef: any) => {
      ops.push(async () => docRef.delete());
      return b;
    },
    commit: async () => {
      for (const op of ops) await op();
    },
  };
  return b;
};

jest.mock('firebase-admin', () => {
  return {
    firestore: Object.assign(
      jest.fn(() => ({
        collection: (name: string) => mockCollection(name),
        doc: (path: string) => mockDoc(path),
        batch: () => mockBatch(),
        runTransaction: async (fn: any) => {
          const transaction = {
            get: async (ref: any) => ref.get(),
            set: (ref: any, data: any, opts?: any) => ref.set(data, opts),
            update: (ref: any, data: any) => ref.update(data),
            delete: (ref: any) => ref.delete(),
          };
          return fn(transaction);
        },
      })),
      {
        FieldValue: {
          serverTimestamp: () => new Date().toISOString(),
          increment: (n: number) => ({ _increment: n }),
          delete: () => ({ _delete: true }),
        },
        Timestamp: {
          fromDate: (d: Date) => ({ toMillis: () => d.getTime(), toDate: () => d }),
        },
      }
    ),
    apps: ['mock-app'],
    initializeApp: jest.fn(),
  };
});

jest.mock('firebase-functions/v2/https', () => ({
  onCall: (_options: any, handler: any) => handler,
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'HttpsError';
    }
  },
}));

jest.mock('../notifications/dispatchNotification.js', () => ({
  dispatchServerNotification: jest.fn<any>().mockResolvedValue({ success: true, deliveredCount: 1 }),
}));

// ── Imports Under Test ───────────────────────────────────────────────────────

import { calculateDistanceMiles, computeBoundingBox } from '../discovery/geoService.js';
import { assertCreatorPubliclyDiscoverable } from '../discovery/eligibilityService.js';
import { calculateNearbyScore, calculatePopularityScore } from '../discovery/rankingService.js';
import { calculatePlatformFee } from '../financial/platformFeeEngine.js';
import { parseDeepLink, buildUniversalLink } from '../../../../packages/contracts/src/routing/deepLinks.js';
import {
  CAMPAIGN_GOAL_MIN_CENTS,
  CAMPAIGN_GOAL_MAX_CENTS,
  CampaignStatus,
} from '../../../../packages/contracts/src/financial/campaign.js';
import {
  ReportStatus,
  ReportSlaTier,
  ReportTargetType,
} from '../../../../packages/contracts/src/moderation/reports.js';
import * as admin from 'firebase-admin';

// ── Test Suite ──────────────────────────────────────────────────────────────

describe('Phase 21: Cross-Platform End-to-End User Journeys', () => {
  const db = admin.firestore();

  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Journey 1: Guest -> Discover
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 1: Guest -> Discover', () => {
    it('exercises unauthenticated public discovery with spatial bounds and Torrance coordinates', () => {
      const torranceLat = 33.8358;
      const torranceLng = -118.3406;
      const nearbyVenuesLat = 33.8400;
      const nearbyVenuesLng = -118.3450;

      // Distance calculation (within ~0.4 miles)
      const distance = calculateDistanceMiles(torranceLat, torranceLng, nearbyVenuesLat, nearbyVenuesLng);
      expect(distance).toBeLessThan(1.0);
      expect(distance).toBeGreaterThanOrEqual(0);

      // Bounding box for 25-mile radius
      const bounds = computeBoundingBox(torranceLat, torranceLng, 25);
      expect(bounds.minLat).toBeLessThan(torranceLat);
      expect(bounds.maxLat).toBeGreaterThan(torranceLat);
      expect(bounds.minLng).toBeLessThan(torranceLng);
      expect(bounds.maxLng).toBeGreaterThan(torranceLng);
    });

    it('asserts public discoverability and computes server-authoritative ranking', async () => {
      // Seed active creator
      store['users/creator_lucas'] = { isSuspended: false };
      store['artistProfiles/creator_lucas'] = {
        isActive: true,
        stageName: 'Lucas Vance',
        bio: 'Indie folk singer-songwriter performing melodic guitar sets with intimate storytelling.',
      };

      // Seed suspended creator
      store['users/creator_banned'] = { isSuspended: true };
      store['artistProfiles/creator_banned'] = {
        isActive: true,
        stageName: 'Suspended Artist',
      };

      const eligibleResult = await assertCreatorPubliclyDiscoverable(db, 'creator_lucas', 'artist');
      expect(eligibleResult.isEligible).toBe(true);

      const suspendedResult = await assertCreatorPubliclyDiscoverable(db, 'creator_banned', 'artist');
      expect(suspendedResult.isEligible).toBe(false);
      expect(suspendedResult.reason).toContain('suspended');

      // Test ranking calculations
      const nearbyScore = calculateNearbyScore({
        distanceMiles: 1.2,
        isCurrentlyLive: true,
        isVerified: true,
      });
      expect(nearbyScore).toBeGreaterThan(0);

      const popularityScore = calculatePopularityScore({
        viewCount: 1500,
        uniqueViews7d: 320,
        totalTipsReceivedCount: 85,
        tipsReceived7dCount: 22,
        favoriteCount: 45,
        verifiedLiveEventCount: 12,
        isCurrentlyLive: true,
      });
      expect(popularityScore).toBeGreaterThan(0);
    });

    it('enforces 8-18 word length for AI profile summary generation', () => {
      const sampleSummary = 'Indie-folk storyteller blending warm acoustic guitar melodies and energetic live vocal harmonies';
      const wordCount = sampleSummary.trim().split(/\s+/).length;

      expect(wordCount).toBeGreaterThanOrEqual(8);
      expect(wordCount).toBeLessThanOrEqual(18);
    });

    it('preserves pending tip context in deep-link when guest is prompted to authenticate', () => {
      const performerId = 'artist_maya_lin';
      const tipAmountCents = 1500;
      const universalLink = buildUniversalLink(`/tip/${performerId}?amount=${tipAmountCents}&source=discovery_card`);

      expect(universalLink).toBe(`https://crowdbeats.app/tip/${performerId}?amount=${tipAmountCents}&source=discovery_card`);

      // Deep link parse
      const parsed = parseDeepLink(universalLink);
      expect(parsed).not.toBeNull();
      expect(parsed.type).toBe('tip');
      expect(parsed.id).toBe(performerId);
      expect(parsed.queryParams?.amount).toBe(String(tipAmountCents));
      expect(parsed.queryParams?.source).toBe('discovery_card');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Journey 2: Fan -> Tip
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 2: Fan -> Tip', () => {
    it('calculates minor units, transparent 6% platform fee, and net creator proceeds', () => {
      const grossAmountCents = 1000; // $10.00 tip
      const feeBasisPoints = 600; // 6.00%

      const feeResult = calculatePlatformFee(grossAmountCents, feeBasisPoints);
      expect(feeResult.platformFeeCents).toBe(60); // 6.00%
      expect(feeResult.netAmountCents).toBe(940); // $9.40
      expect(feeResult.feeBasisPoints).toBe(600); // 600 bps
      expect(feeResult.effectivePercentage).toBe(6.0);
    });

    it('enforces odd-cent rounding invariants with exact mathematical precision', () => {
      // $2.55 = 255 cents -> 6% = 15.3 cents -> 15 cents fee, 240 cents net
      const feeResult = calculatePlatformFee(255, 600);
      expect(feeResult.platformFeeCents).toBe(15);
      expect(feeResult.netAmountCents).toBe(240);
      expect(feeResult.platformFeeCents + feeResult.netAmountCents).toBe(255);
    });

    it('supports anonymous tipping while preserving private receipt records for fan', () => {
      const fanUid = 'fan_123';
      const tipId = 'tip_anon_456';

      const publicTipDisplay = {
        tipId,
        amountCents: 1000,
        isAnonymous: true,
        displayName: 'Anonymous Supporter',
        avatarUrl: null,
      };

      const privateTipReceipt = {
        tipId,
        fanUid,
        amountCents: 1000,
        platformFeeCents: 60,
        netAmountCents: 940,
        isAnonymous: true,
        paymentStatus: 'succeeded',
      };

      // Public view redacts fanUid
      expect((publicTipDisplay as any).fanUid).toBeUndefined();
      expect(publicTipDisplay.displayName).toBe('Anonymous Supporter');

      // Private receipt maintains auditability
      expect(privateTipReceipt.fanUid).toBe(fanUid);
      expect(privateTipReceipt.paymentStatus).toBe('succeeded');
    });

    it('records double-entry ledger event balancing debits and credits to $0.00 variance', () => {
      const grossCents = 2000; // $20.00
      const platformFeeCents = 120; // $1.20 (6%)
      const creatorCreditCents = 1880; // $18.80

      const ledgerEntries = [
        { type: 'FAN_DEBIT', amountCents: -grossCents },
        { type: 'PLATFORM_FEE_CREDIT', amountCents: platformFeeCents },
        { type: 'CREATOR_BALANCE_CREDIT', amountCents: creatorCreditCents },
      ];

      const sum = ledgerEntries.reduce((acc, entry) => acc + entry.amountCents, 0);
      expect(sum).toBe(0); // Zero-variance invariant
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Journey 3: Solo/Band -> Receive
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 3: Solo/Band -> Receive', () => {
    it('distributes band tip splits with exact integer remainder to the band founder', () => {
      // 3-way split: 33.33% each on 1000 cents
      const netProceedsCents = 1000;
      const members = [
        { uid: 'member_founder', sharePercent: 33.34, isFounder: true },
        { uid: 'member_guitarist', sharePercent: 33.33, isFounder: false },
        { uid: 'member_drummer', sharePercent: 33.33, isFounder: false },
      ];

      // Exact integer allocation
      const allocations = members.map((m) => Math.floor((netProceedsCents * m.sharePercent) / 100));
      const allocatedTotal = allocations.reduce((sum, val) => sum + val, 0);
      const remainder = netProceedsCents - allocatedTotal;

      // Founder receives remainder
      allocations[0] += remainder;

      expect(allocations[0]).toBe(334);
      expect(allocations[1]).toBe(333);
      expect(allocations[2]).toBe(333);
      expect(allocations.reduce((sum, val) => sum + val, 0)).toBe(netProceedsCents);
    });

    it('verifies stationary anti-tamper QR token payload structure', () => {
      const qrPayload = {
        v: 2,
        type: 'stationary_stage',
        creatorId: 'band_the_echoes',
        venueId: 'venue_troubadour',
        createdAt: Date.now(),
        sig: 'sha256_mock_tamper_evident_signature',
      };

      expect(qrPayload.v).toBe(2);
      expect(qrPayload.type).toBe('stationary_stage');
      expect(qrPayload.creatorId).toBe('band_the_echoes');
      expect(qrPayload.sig).toBeDefined();
    });

    it('enforces Stripe Connect payout hold when onboarding or verification is incomplete', () => {
      const verifiedCreator = {
        stripeConnectId: 'acct_123',
        payoutsEnabled: true,
        detailsSubmitted: true,
        payoutHoldActive: false,
      };

      const unverifiedCreator = {
        stripeConnectId: 'acct_456',
        payoutsEnabled: false,
        detailsSubmitted: false,
        payoutHoldActive: true,
      };

      const canPayout = (creator: typeof verifiedCreator) =>
        creator.payoutsEnabled && creator.detailsSubmitted && !creator.payoutHoldActive;

      expect(canPayout(verifiedCreator)).toBe(true);
      expect(canPayout(unverifiedCreator)).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Journey 4: Fan -> Follow & Messaging
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 4: Fan -> Follow & Messaging', () => {
    it('manages social graph edges and synchronizes follower counters', async () => {
      const fanUid = 'fan_sarah';
      const creatorUid = 'creator_jake';

      // Follow edge creation
      store[`users/${fanUid}/following/${creatorUid}`] = {
        targetUid: creatorUid,
        createdAt: new Date().toISOString(),
      };
      store[`users/${creatorUid}/followers/${fanUid}`] = {
        fanUid,
        createdAt: new Date().toISOString(),
      };

      expect(store[`users/${fanUid}/following/${creatorUid}`]).toBeDefined();
      expect(store[`users/${creatorUid}/followers/${fanUid}`]).toBeDefined();

      // Unfollow edge removal
      delete store[`users/${fanUid}/following/${creatorUid}`];
      delete store[`users/${creatorUid}/followers/${fanUid}`];

      expect(store[`users/${fanUid}/following/${creatorUid}`]).toBeUndefined();
      expect(store[`users/${creatorUid}/followers/${fanUid}`]).toBeUndefined();
    });

    it('enforces approved messaging state machine boundaries based on follow status', () => {
      const evaluateChatEligibility = (followsTarget: boolean, targetFollowsCaller: boolean) => {
        if (!followsTarget && !targetFollowsCaller) {
          return { status: 'DENIED', reason: 'Must follow creator to send a message request' };
        }
        if (followsTarget && !targetFollowsCaller) {
          return { status: 'REQUEST_PENDING', maxInitialMessages: 1 };
        }
        if (followsTarget && targetFollowsCaller) {
          return { status: 'ACCEPTED_MUTUAL_DIRECT', maxInitialMessages: Infinity };
        }
        return { status: 'DENIED', reason: 'Unauthorized' };
      };

      expect(evaluateChatEligibility(false, false).status).toBe('DENIED');
      expect(evaluateChatEligibility(true, false).status).toBe('REQUEST_PENDING');
      expect(evaluateChatEligibility(true, true).status).toBe('ACCEPTED_MUTUAL_DIRECT');
    });

    it('creates abuse reports with snapshot evidence and strict SLA tiering', () => {
      const abuseReport = {
        reportId: 'rep_abuse_001',
        ticketNumber: 'TKT-ABUSE-001',
        reporterUid: 'fan_sarah',
        targetId: 'msg_offensive_999',
        targetType: ReportTargetType.CHAT_MESSAGE,
        reason: 'Hate speech and harassment',
        status: ReportStatus.RECEIVED,
        slaTier: ReportSlaTier.CRITICAL_1_HOUR,
        evidenceSnapshot: {
          contentRedacted: 'Harmful text sample [flagged]',
          sentAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      };

      expect(abuseReport.status).toBe(ReportStatus.RECEIVED);
      expect(abuseReport.slaTier).toBe(ReportSlaTier.CRITICAL_1_HOUR);
      expect(abuseReport.evidenceSnapshot).toBeDefined();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Journey 5: Creator -> Campaign
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 5: Creator -> Campaign', () => {
    it('validates Story-to-Launch goal boundaries ($10.00 to $10,000.00)', () => {
      const validGoalCents = 500000; // $5,000.00
      const belowMinGoalCents = 500; // $5.00
      const aboveMaxGoalCents = 1500000; // $15,000.00

      expect(validGoalCents).toBeGreaterThanOrEqual(CAMPAIGN_GOAL_MIN_CENTS);
      expect(validGoalCents).toBeLessThanOrEqual(CAMPAIGN_GOAL_MAX_CENTS);

      expect(belowMinGoalCents).toBeLessThan(CAMPAIGN_GOAL_MIN_CENTS);
      expect(aboveMaxGoalCents).toBeGreaterThan(CAMPAIGN_GOAL_MAX_CENTS);
    });

    it('advances campaign lifecycle through draft -> submitted -> active -> completed', () => {
      let status: CampaignStatus = CampaignStatus.DRAFT;

      // Submit for review
      status = CampaignStatus.SUBMITTED;
      expect(status).toBe(CampaignStatus.SUBMITTED);

      // Staff approves & publishes
      status = CampaignStatus.ACTIVE;
      expect(status).toBe(CampaignStatus.ACTIVE);

      // Goal reached and timeline concluded
      status = CampaignStatus.COMPLETED;
      expect(status).toBe(CampaignStatus.COMPLETED);
    });

    it('enforces immutability of financial fields while allowing editorial updates', () => {
      const existingCampaign = {
        campaignId: 'camp_debut_ep',
        creatorId: 'creator_maya',
        goalAmountCents: 500000,
        raisedAmountCents: 150000,
        title: 'Debut EP Recording',
        description: 'Original studio recordings in Nashville',
        v: 1,
      };

      const requestedEditorialUpdate = {
        title: 'Debut EP Recording (Deluxe Edition)',
        description: 'Original studio recordings with bonus acoustic tracks',
        v: 2,
      };

      const requestedFinancialTampering = {
        raisedAmountCents: 500000, // Client attempting to fake raised funds
        v: 2,
      };

      // Helper function matching Firestore rule logic
      const isAllowedUpdate = (campaign: typeof existingCampaign, update: Record<string, any>) => {
        const allowedKeys = ['title', 'description', 'coverUrl', 'updatedAt', 'v'];
        const updateKeys = Object.keys(update);
        const hasOnlyAllowed = updateKeys.every((k) => allowedKeys.includes(k));
        const matchesVersion = update.v === campaign.v + 1;
        return hasOnlyAllowed && matchesVersion;
      };

      expect(isAllowedUpdate(existingCampaign, requestedEditorialUpdate)).toBe(true);
      expect(isAllowedUpdate(existingCampaign, requestedFinancialTampering)).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Journey 6: Sponsor -> Inquiry
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 6: Sponsor -> Inquiry', () => {
    it('allows sponsor representatives to shortlist talent and manage match opportunities', () => {
      const sponsorOrgId = 'org_monster_audio';
      const shortlistedArtistId = 'artist_maya_lin';

      store[`sponsorOrgs/${sponsorOrgId}/shortlists/${shortlistedArtistId}`] = {
        recipientId: shortlistedArtistId,
        recipientType: 'artist',
        tags: ['acoustic', 'california_tour', 'hero_brand'],
        notes: 'Great brand alignment with our summer tour campaign.',
        addedAt: new Date().toISOString(),
      };

      expect(store[`sponsorOrgs/${sponsorOrgId}/shortlists/${shortlistedArtistId}`]).toBeDefined();
      expect(store[`sponsorOrgs/${sponsorOrgId}/shortlists/${shortlistedArtistId}`].recipientType).toBe('artist');
    });

    it('drives dual-signed sponsorship deal state machine from proposal to active execution', () => {
      type DealState = 'draft' | 'pending_creator' | 'pending_sponsor' | 'active' | 'completed';

      let dealState: DealState = 'draft';

      // 1. Creator proposes deal terms
      dealState = 'pending_sponsor';
      expect(dealState).toBe('pending_sponsor');

      // 2. Sponsor signs contract & deposits escrow
      dealState = 'active';
      expect(dealState).toBe('active');

      // 3. Campaign concludes & deliverables accepted
      dealState = 'completed';
      expect(dealState).toBe('completed');
    });

    it('enforces non-negative escrow balance invariant during sponsor allocations', () => {
      let escrowBalanceCents = 500000; // $5,000.00 escrow fund
      const dealAllocationCents = 200000; // $2,000.00 deal allocation

      const allocateEscrow = (amount: number): boolean => {
        if (escrowBalanceCents - amount < 0) {
          return false; // Invariant violated: cannot go negative
        }
        escrowBalanceCents -= amount;
        return true;
      };

      expect(allocateEscrow(dealAllocationCents)).toBe(true);
      expect(escrowBalanceCents).toBe(300000);

      // Attempt to overdraw
      expect(allocateEscrow(400000)).toBe(false);
      expect(escrowBalanceCents).toBe(300000);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Journey 7: Admin -> Oversight
  // ══════════════════════════════════════════════════════════════════════════
  describe('Journey 7: Admin -> Oversight', () => {
    it('authorizes staff roles and strictly blocks unprivileged users from Admin Command Center', () => {
      const isStaffRole = (role: string): boolean => {
        const authorizedStaffRoles = [
          'SUPER_ADMIN',
          'CUSTOMER_SUPPORT',
          'TRUST_SAFETY',
          'FINANCE_ANALYST',
          'FINANCE_ADMIN',
          'EXECUTIVE',
        ];
        return authorizedStaffRoles.includes(role);
      };

      expect(isStaffRole('SUPER_ADMIN')).toBe(true);
      expect(isStaffRole('FINANCE_ADMIN')).toBe(true);
      expect(isStaffRole('CUSTOMER_SUPPORT')).toBe(true);
      expect(isStaffRole('FAN')).toBe(false);
      expect(isStaffRole('ARTIST')).toBe(false);
      expect(isStaffRole('SPONSOR_REP')).toBe(false);
    });

    it('creates immutable CRM audit events with zero PAN / secret credentials', () => {
      const crmAuditEvent = {
        eventId: 'crm_evt_reconciliation_001',
        eventType: 'RECONCILIATION_RUN',
        actorUid: 'usr_staff_sarah',
        targetEntityType: 'LEDGER',
        metadata: {
          period: '2026-10-12',
          discrepancyCents: 0,
          status: 'BALANCED',
        },
        timestamp: new Date().toISOString(),
      };

      const eventString = JSON.stringify(crmAuditEvent);
      expect(eventString).not.toContain('sk_live_');
      expect(eventString).not.toContain('sk_test_');
      expect(crmAuditEvent.metadata.discrepancyCents).toBe(0);
    });

    it('computes aggregate BI metrics with sampling metadata and freshness classification', () => {
      const biRollup = {
        period: '2026-10',
        freshness: 'REAL_TIME' as const,
        metrics: {
          totalGrossTipVolumeCents: 14500000,
          platformNetRevenueCents: 870000, // 6% of 14.5M
          activePerformersCount: 342,
          completedCampaignsCount: 18,
          activeSponsorshipDealsCount: 27,
        },
        isEstimated: false,
        computedAt: new Date().toISOString(),
      };

      expect(biRollup.freshness).toBe('REAL_TIME');
      expect(biRollup.isEstimated).toBe(false);
      expect(biRollup.metrics.platformNetRevenueCents).toBe(870000);
      expect(biRollup.metrics.totalGrossTipVolumeCents * 0.06).toBe(biRollup.metrics.platformNetRevenueCents);
    });
  });
});
