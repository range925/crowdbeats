/**
 * Crowdbeats V2 — Phase 19: Analytics & Business Intelligence Test Suite
 *
 * Verifies:
 * 1. Role-Based BI Staff Authorization (SUPER_ADMIN, EXECUTIVE, FINANCE, MARKETING)
 * 2. Metric Freshness Labeling & Sampling Metadata (REAL_TIME, DELAYED, ESTIMATED)
 * 3. Domain Aggregation Calculations (User Growth, Creator Activation, Live, Tipping, Campaigns, Sponsors, Revenue)
 * 4. Cost Controls: Rollup Caching & Idempotent Fetching
 * 5. Privacy Controls: k-Anonymity Safeguards & Small Cohort Protection
 * 6. Report Generation & Immutable Audit Trails (ANALYTICS_REPORT_GENERATED)
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  isAuthorizedBiStaff,
  computePlatformAnalyticsRollup,
  getPlatformAnalyticsCallable,
  generateAnalyticsReportCallable,
} from '../analytics/businessIntelligenceService.js';

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
    add: jest.fn<any>().mockImplementation(async (data: any) => {
      const id = `mock_doc_${Math.random().toString(36).substring(7)}`;
      const docPath = `${colPath}/${id}`;
      store[docPath] = { ...data };
      return mockDoc(docPath);
    }),
    limit: jest.fn<any>().mockImplementation(() => {
      return {
        get: jest.fn<any>().mockImplementation(async () => {
          const docs = Object.entries(store)
            .filter(([k]) => k.startsWith(`${colPath}/`))
            .map(([k, v]) => ({
              id: k.split('/').pop()!,
              data: () => v,
            }));
          return { docs, empty: docs.length === 0, size: docs.length };
        }),
      };
    }),
    get: jest.fn<any>().mockImplementation(async () => {
      const docs = Object.entries(store)
        .filter(([k]) => k.startsWith(`${colPath}/`))
        .map(([k, v]) => ({
          id: k.split('/').pop()!,
          data: () => v,
        }));
      return { docs, empty: docs.length === 0, size: docs.length };
    }),
  };
};

const mockBatch = (): any => {
  const operations: Array<() => Promise<void>> = [];
  return {
    set: jest.fn<any>().mockImplementation((docRef: any, data: any) => {
      operations.push(async () => {
        store[docRef.path] = { ...data };
      });
    }),
    commit: jest.fn<any>().mockImplementation(async () => {
      for (const op of operations) {
        await op();
      }
    }),
  };
};

const mockDb: any = {
  collection: (col: string) => mockCollection(col),
  doc: (path: string) => mockDoc(path),
  batch: () => mockBatch(),
};

// Mock admin.firestore()
jest.mock('firebase-admin', () => {
  return {
    firestore: Object.assign(() => mockDb, {
      FieldValue: {
        serverTimestamp: () => new Date().toISOString(),
      },
    }),
  };
});

describe('Phase 19 — Analytics & Business Intelligence Test Suite', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. ROLE-BASED BI AUTHORIZATION
  // ════════════════════════════════════════════════════════════════════════════

  describe('Role-Based BI Staff Authorization', () => {
    it('authorizes SUPER_ADMIN, EXECUTIVE, FINANCE_ADMIN, FINANCE_ANALYST, and MARKETING', () => {
      expect(isAuthorizedBiStaff('SUPER_ADMIN')).toBe(true);
      expect(isAuthorizedBiStaff('EXECUTIVE')).toBe(true);
      expect(isAuthorizedBiStaff('FINANCE_ADMIN')).toBe(true);
      expect(isAuthorizedBiStaff('FINANCE_ANALYST')).toBe(true);
      expect(isAuthorizedBiStaff('MARKETING')).toBe(true);
    });

    it('denies support, moderation, performers, fans, and null callers', () => {
      expect(isAuthorizedBiStaff('CUSTOMER_SUPPORT')).toBe(false);
      expect(isAuthorizedBiStaff('CONTENT_MODERATOR')).toBe(false);
      expect(isAuthorizedBiStaff('PARTNERSHIPS')).toBe(false);
      expect(isAuthorizedBiStaff('artist')).toBe(false);
      expect(isAuthorizedBiStaff('fan')).toBe(false);
      expect(isAuthorizedBiStaff(null)).toBe(false);
      expect(isAuthorizedBiStaff(undefined)).toBe(false);
    });

    it('getPlatformAnalyticsCallable rejects unauthenticated caller with unauthenticated error', async () => {
      await expect(
        (getPlatformAnalyticsCallable as any).run({
          auth: null,
          data: {},
        }),
      ).rejects.toThrow('Authentication required.');
    });

    it('getPlatformAnalyticsCallable rejects unauthorized caller with permission-denied', async () => {
      await expect(
        (getPlatformAnalyticsCallable as any).run({
          auth: { uid: 'user-support', token: { platformRole: 'CUSTOMER_SUPPORT' } },
          data: {},
        }),
      ).rejects.toThrow('Executive, Finance, or Marketing platform role required.');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. METRIC FRESHNESS & SAMPLING METADATA
  // ════════════════════════════════════════════════════════════════════════════

  describe('Metric Freshness & Sampling Labeling', () => {
    it('labels real-time metrics with REAL_TIME freshness and recent timestamp', async () => {
      const { rollup } = await computePlatformAnalyticsRollup(mockDb, { period: '30d' });

      expect(rollup.userGrowth.totalRegisteredUsers.freshness).toBe('REAL_TIME');
      expect(rollup.tippingConversion.totalTipsCount.freshness).toBe('REAL_TIME');
      expect(rollup.platformRevenue.grossPlatformFeesCents.freshness).toBe('REAL_TIME');
      expect(new Date(rollup.userGrowth.totalRegisteredUsers.calculatedAt).getTime()).toBeGreaterThan(0);
    });

    it('labels estimated metrics with ESTIMATED freshness and explicit sampling metadata', async () => {
      const { rollup } = await computePlatformAnalyticsRollup(mockDb, { period: '30d' });

      const dau = rollup.userGrowth.dailyActiveUsersEstimate;
      expect(dau.freshness).toBe('ESTIMATED');
      expect(dau.sampling).toBeDefined();
      expect(dau.sampling?.isSampled).toBe(true);
      expect(dau.sampling?.confidenceLevel).toBe(0.95);
      expect(dau.sampling?.sampleRate).toBe(0.25);
      expect(dau.notes).toContain('session activity sampling');

      const reach = rollup.livePerformances.averageAudienceReachPerSession;
      expect(reach.freshness).toBe('ESTIMATED');
      expect(reach.sampling?.marginOfErrorPct).toBe(4.0);
    });

    it('labels delayed metrics with DELAYED freshness and delay latency seconds', async () => {
      const { rollup } = await computePlatformAnalyticsRollup(mockDb, { period: '30d' });

      const ttft = rollup.creatorActivation.averageTimeToFirstTipHours;
      expect(ttft.freshness).toBe('DELAYED');
      expect(ttft.delaySeconds).toBe(7200);

      const refundRate = rollup.platformRevenue.refundRatePct;
      expect(refundRate.freshness).toBe('DELAYED');
      expect(refundRate.delaySeconds).toBe(3600);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. CORE DOMAIN AGGREGATIONS
  // ════════════════════════════════════════════════════════════════════════════

  describe('Analytical Calculations & Mathematical Aggregations', () => {
    beforeEach(() => {
      // Seed users across personas
      store['users/u1'] = { personaType: 'fan', createdAt: new Date().toISOString() };
      store['users/u2'] = { personaType: 'fan', createdAt: new Date().toISOString() };
      store['users/u3'] = { personaType: 'artist', createdAt: new Date().toISOString() };
      store['users/u4'] = { personaType: 'band_member', createdAt: new Date().toISOString() };
      store['users/u5'] = { personaType: 'sponsor_rep', createdAt: new Date().toISOString() };

      // Seed artist profiles with activation signals
      store['artistProfiles/u3'] = {
        stripeAccountId: 'acct_123',
        totalEarnedCents: 5000,
        updatedAt: new Date().toISOString(),
      };
      store['artistProfiles/u4'] = {
        bankLinked: false,
        totalEarnedCents: 0,
      };

      // Seed tips
      store['tips/t1'] = {
        status: 'succeeded',
        amountCents: 1000,
        platformFeeCents: 60,
        fanUid: 'u1',
      };
      store['tips/t2'] = {
        status: 'succeeded',
        amountCents: 2000,
        platformFeeCents: 120,
        fanUid: 'u1', // Repeat supporter
      };
      store['tips/t3'] = {
        status: 'succeeded',
        amountCents: 5000,
        platformFeeCents: 300,
        fanUid: 'u2',
      };
      store['tips/t4'] = {
        status: 'refunded',
        amountCents: 1000,
        fanUid: 'u1',
      };

      // Seed sessions
      store['sessions/s1'] = { status: 'live', durationMinutes: 60 };
      store['sessions/s2'] = { status: 'ended', durationMinutes: 30 };

      // Seed campaigns
      store['campaigns/c1'] = { status: 'active', raisedAmountCents: 10000 };
    });

    it('calculates user growth and persona breakdown accurately', async () => {
      const { rollup } = await computePlatformAnalyticsRollup(mockDb, { period: '30d' });

      expect(rollup.userGrowth.totalRegisteredUsers.value).toBe(5);
      expect(rollup.userGrowth.personaBreakdown.value.fans).toBe(2);
      expect(rollup.userGrowth.personaBreakdown.value.soloArtists).toBe(1);
      expect(rollup.userGrowth.personaBreakdown.value.bandMembers).toBe(1);
      expect(rollup.userGrowth.personaBreakdown.value.sponsorReps).toBe(1);
      expect(rollup.userGrowth.newUsersLast24h.value).toBe(5);
    });

    it('calculates creator activation rate accurately', async () => {
      const { rollup } = await computePlatformAnalyticsRollup(mockDb, { period: '30d' });

      expect(rollup.creatorActivation.totalRegisteredCreators.value).toBe(2);
      expect(rollup.creatorActivation.activatedCreatorsCount.value).toBe(1);
      expect(rollup.creatorActivation.activationRatePct.value).toBe(50.0);
      expect(rollup.creatorActivation.activePerformers30d.value).toBe(1);
    });

    it('calculates live performance metrics accurately', async () => {
      const { rollup } = await computePlatformAnalyticsRollup(mockDb, { period: '30d' });

      expect(rollup.livePerformances.totalStageSessionsCount.value).toBe(2);
      expect(rollup.livePerformances.activeLiveSessionsCount.value).toBe(1);
      expect(rollup.livePerformances.totalStageHours.value).toBe(1.5); // 60m + 30m = 90m = 1.5h
      expect(rollup.livePerformances.averageSessionDurationMinutes.value).toBe(45);
    });

    it('calculates tipping conversion, repeat supporter rate, and tiers accurately', async () => {
      const { rollup } = await computePlatformAnalyticsRollup(mockDb, { period: '30d' });

      expect(rollup.tippingConversion.totalTipsCount.value).toBe(3);
      expect(rollup.tippingConversion.grossTippingVolumeCents.value).toBe(8000); // 1000 + 2000 + 5000
      expect(rollup.tippingConversion.uniqueTippingFansCount.value).toBe(2); // u1 and u2
      expect(rollup.tippingConversion.repeatSupportersCount.value).toBe(1); // u1 tipped twice
      expect(rollup.tippingConversion.repeatSupporterRatePct.value).toBe(50.0); // 1 / 2 = 50%
      expect(rollup.tippingConversion.fanPayerConversionRatePct.value).toBe(100.0); // 2 tippers / 2 fans = 100%
      expect(rollup.tippingConversion.averageTipAmountCents.value).toBe(Math.round(8000 / 3));
    });

    it('calculates platform revenue, canonical 6.00% take rate, and refunds accurately', async () => {
      const { rollup } = await computePlatformAnalyticsRollup(mockDb, { period: '30d' });

      // Tips gross: 8000, tip fees: 480 (6%), campaign gross: 10000, campaign fees: 600 (6%)
      expect(rollup.platformRevenue.grossTippingVolumeCents.value).toBe(8000);
      expect(rollup.platformRevenue.grossPlatformFeesCents.value).toBe(480);
      expect(rollup.platformRevenue.campaignPlatformFeesCents.value).toBe(600);
      expect(rollup.platformRevenue.totalPlatformRevenueCents.value).toBe(1080); // 480 + 600
      expect(rollup.platformRevenue.effectiveTakeRatePct.value).toBe(6.0); // 1080 / 18000 = 6.00%
      expect(rollup.platformRevenue.refundRatePct.value).toBe(12.5); // 1000 / 8000 = 12.5%
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. COST CONTROLS & ROLLUP CACHING
  // ════════════════════════════════════════════════════════════════════════════

  describe('Cost Controls & Cache Utilization', () => {
    it('caches calculated rollup in Firestore and returns cached document on subsequent queries within TTL', async () => {
      const firstResult = await computePlatformAnalyticsRollup(mockDb, { period: '30d' });
      expect(firstResult.cached).toBe(false);

      // Verify cached in /analyticsAggregates/platform_overview_30d
      const cachedDoc = store['analyticsAggregates/platform_overview_30d'];
      expect(cachedDoc).toBeDefined();
      expect(cachedDoc.rollupId).toBe(firstResult.rollup.rollupId);

      // Subsequent call without forceRefresh uses cache
      const secondResult = await computePlatformAnalyticsRollup(mockDb, { period: '30d' });
      expect(secondResult.cached).toBe(true);
      expect(secondResult.rollup.rollupId).toBe(firstResult.rollup.rollupId);
    });

    it('forceRefresh bypasses cache and regenerates fresh rollup', async () => {
      await computePlatformAnalyticsRollup(mockDb, { period: '30d' });
      const secondResult = await computePlatformAnalyticsRollup(mockDb, { period: '30d', forceRefresh: true });

      expect(secondResult.cached).toBe(false);
      expect(secondResult.rollup.generatedAt).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. PRIVACY CONTROLS (k-ANONYMITY)
  // ════════════════════════════════════════════════════════════════════════════

  describe('Privacy Safeguards & k-Anonymity Controls', () => {
    it('guarantees privacyPreserved flag is true and never exposes raw user identifiers in rollup', async () => {
      store['tips/t1'] = { status: 'succeeded', amountCents: 500, fanUid: 'fan-secret-id' };
      const { rollup } = await computePlatformAnalyticsRollup(mockDb);

      expect(rollup.privacyPreserved).toBe(true);
      const json = JSON.stringify(rollup);
      expect(json).not.toContain('fan-secret-id');
    });

    it('enforces k-anonymity (k >= 5) on supporter frequency tiers', async () => {
      // 1 supporter in tier 1
      store['tips/t1'] = { status: 'succeeded', amountCents: 500, fanUid: 'fan-1' };
      const { rollup } = await computePlatformAnalyticsRollup(mockDb);

      const tiers = rollup.tippingConversion.supporterTiers.value;
      const tier1 = tiers.find((t) => t.tierName.includes('1 Tip'));
      expect(tier1).toBeDefined();
      // K-anonymity thresholding: cohort count < 5 is normalized to minimum safe k=5
      expect(tier1!.supporterCount).toBeGreaterThanOrEqual(5);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. REPORT GENERATION & AUDIT TRAILS
  // ════════════════════════════════════════════════════════════════════════════

  describe('Report Generation & Audit Trail', () => {
    it('generateAnalyticsReportCallable creates report snapshot in /analyticsReports and writes audit event', async () => {
      const res = await (generateAnalyticsReportCallable as any).run({
        auth: { uid: 'staff-exec-1', token: { platformRole: 'EXECUTIVE' } },
        data: { reportTitle: 'Q3 Executive Growth & Revenue Report', period: '30d', format: 'CSV' },
      });

      expect(res.reportId).toBeDefined();
      expect(res.downloadUrl).toContain('.csv');
      expect(res.generatedByUid).toBe('staff-exec-1');
      expect(res.recordCount).toBe(7);

      // Verify stored in /analyticsReports
      const reportDoc = store[`analyticsReports/${res.reportId}`];
      expect(reportDoc).toBeDefined();
      expect(reportDoc.reportTitle).toBe('Q3 Executive Growth & Revenue Report');

      // Verify audit log written in /auditEvents
      const auditDocs = Object.values(store).filter((d) => d.eventType === 'ANALYTICS_REPORT_GENERATED');
      expect(auditDocs.length).toBe(1);
      expect(auditDocs[0].actorUid).toBe('staff-exec-1');
      expect(auditDocs[0].targetId).toBe(res.reportId);
    });
  });
});
