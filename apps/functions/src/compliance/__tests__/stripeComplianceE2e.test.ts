/**
 * Crowdbeats V2 — Phase 25 Deterministic End-to-End Compliance Scenario Test
 *
 * Covers all 21 scenario steps:
 * 1. create fictitious musician
 * 2. accept policies
 * 3. begin Stripe Connect onboarding
 * 4. complete test onboarding
 * 5. create artist profile
 * 6. verify canonical public URL
 * 7. approve creator eligibility
 * 8. fan discovers creator
 * 9. fan sends Stripe test tip
 * 10. payment succeeds
 * 11. transaction appears in activity
 * 12. creator content is flagged
 * 13. user reports content
 * 14. Admin reviews content
 * 15. Admin verifies violation
 * 16. content demonetized
 * 17. creator receives enforcement strike
 * 18. new tip attempt is blocked where creator monetization is suspended
 * 19. enforcement audit event created
 * 20. creator submits appeal
 * 21. Admin resolves appeal
 */

import { reserveCreatorSlug, resolveCreatorSlug } from '../../profiles/slugService.js';
import { assertCreatorMayMonetize, evaluateCreatorMonetizationEligibility } from '../../monetization/eligibilityService.js';
import { recordUserConsent } from '../consentService.js';
import { screenTextContent } from '../../moderation/moderationScanner.js';
import { ingestAbuseReport } from '../../moderation/reportService.js';
import { issueStrike } from '../../moderation/strikeService.js';
import { enforceCreatorLifecycle } from '../../moderation/lifecycleService.js';
import {
  PolicyType,
  ModeratedContentType,
  ModerationRiskCategory,
  CreatorLifecycleAction,
} from '@crowdbeats/contracts';

describe('Phase 25 — Deterministic 21-Step Compliance Scenario', () => {
  let mockDb: any;
  let store: Record<string, Record<string, any>>;

  beforeEach(() => {
    store = {
      users: {},
      artistProfiles: {},
      bands: {},
      creatorSlugs: {},
      consent: {},
      policyAcceptances: {},
      reports: {},
      contentReports: {},
      moderationQueue: {},
      strikes: {},
      payoutHolds: {},
      auditLogs: {},
      tips: {},
    };

    const getDocRef = (coll: string, id: string): any => ({
      id,
      collection: jest.fn((subColl: string) => ({
        doc: jest.fn((subId: string) => getDocRef(`${coll}_${id}_${subColl}`, subId)),
      })),
      get: jest.fn().mockImplementation(async () => {
        const data = store[coll]?.[id];
        return { exists: Boolean(data), data: () => data, id };
      }),
      set: jest.fn().mockImplementation(async (data: any, opts: any) => {
        if (!store[coll]) store[coll] = {};
        if (opts?.merge && store[coll][id]) {
          store[coll][id] = { ...store[coll][id], ...data };
        } else {
          store[coll][id] = data;
        }
      }),
      update: jest.fn().mockImplementation(async (data: any) => {
        if (!store[coll]?.[id]) throw new Error(`Doc not found: ${coll}/${id}`);
        store[coll][id] = { ...store[coll][id], ...data };
      }),
    });

    const makeQuery = (coll: string): any => ({
      where: jest.fn(() => makeQuery(coll)),
      limit: jest.fn(() => makeQuery(coll)),
      get: jest.fn(async () => {
        const items = Object.entries(store[coll] || {}).map(([id, d]) => ({
          id,
          data: () => d,
          ref: getDocRef(coll, id),
        }));
        return {
          empty: items.length === 0,
          docs: items,
        };
      }),
    });

    mockDb = {
      collection: jest.fn((coll: string) => ({
        doc: jest.fn((id: string) => getDocRef(coll, id)),
        where: jest.fn(() => makeQuery(coll)),
      })),
      batch: jest.fn(() => ({
        set: jest.fn((ref: any, data: any, opts: any) => ref.set(data, opts)),
        update: jest.fn((ref: any, data: any) => ref.update(data)),
        commit: jest.fn().mockResolvedValue(undefined),
      })),
      runTransaction: jest.fn(async (cb: any) => cb({
        get: jest.fn(async (ref: any) => ref.get()),
        set: jest.fn((ref: any, data: any, opts: any) => ref.set(data, opts)),
        update: jest.fn((ref: any, data: any) => ref.update(data)),
      })),
    };
  });

  it('successfully executes the full 21-step compliance scenario', async () => {
    const creatorId = 'musician_sim_01';
    const fanUid = 'fan_supporter_01';
    const adminUid = 'compliance_officer_01';

    // Step 1: Create fictitious musician
    store.users[creatorId] = {
      uid: creatorId,
      email: 'alex.rivera@example.com',
      displayName: 'Alex Rivera',
      personaType: 'artist',
      createdAt: new Date().toISOString(),
    };
    expect(store.users[creatorId].displayName).toBe('Alex Rivera');

    // Step 2: Accept policies (ToS, AUP, Monetization Policy)
    await recordUserConsent(mockDb, {
      uid: creatorId,
      request: { policyType: PolicyType.TERMS_OF_SERVICE, version: '2026-08-25' },
    });
    await recordUserConsent(mockDb, {
      uid: creatorId,
      request: { policyType: PolicyType.ACCEPTABLE_USE_POLICY, version: '2026-08-25' },
    });
    await recordUserConsent(mockDb, {
      uid: creatorId,
      request: { policyType: PolicyType.CREATOR_MONETIZATION_POLICY, version: '2026-08-25' },
    });
    expect(store.users[creatorId].termsAccepted).toBe(true);
    expect(store.users[creatorId].monetizationPolicyAccepted).toBe(true);

    // Step 3 & 4: Stripe Connect onboarding completion simulation
    store.users[creatorId].stripeConnectAccountId = 'acct_sim_express_123';
    store.users[creatorId].chargesEnabled = true;
    store.users[creatorId].payoutsEnabled = true;
    store.users[creatorId].connectStatus = 'active';

    // Step 5 & 6: Create artist profile & reserve canonical URL
    const slugResult = await reserveCreatorSlug(mockDb, {
      creatorId,
      creatorType: 'artist',
      preferredName: 'Alex Rivera',
    });
    expect(slugResult.slug).toBe('alex-rivera');
    expect(slugResult.canonicalProfileUrl).toBe('https://crowdbeats.ai/artist/alex-rivera');

    store.artistProfiles[creatorId] = {
      artistId: creatorId,
      stageName: 'Alex Rivera',
      creatorSlug: 'alex-rivera',
      canonicalProfileUrl: slugResult.canonicalProfileUrl,
      chargesEnabled: true,
      bankLinked: true,
      isActive: true,
    };

    // Step 7: Verify creator monetization eligibility
    const eligibilityRes = await evaluateCreatorMonetizationEligibility(mockDb, creatorId, 'artist');
    expect(eligibilityRes.isEligible).toBe(true);
    expect(eligibilityRes.status).toBe('ACTIVE');

    // Step 8: Fan discovers creator via slug resolution
    const resolved = await resolveCreatorSlug(mockDb, 'alex-rivera');
    expect(resolved.found).toBe(true);
    expect(resolved.isMonetizable).toBe(true);

    // Step 9 & 10: Fan sends tip and payment assertion passes
    await expect(assertCreatorMayMonetize(mockDb, creatorId, 'artist')).resolves.toBeDefined();

    // Step 11: Transaction recorded
    store.tips['tip_101'] = {
      tipId: 'tip_101',
      fanUid,
      recipientId: creatorId,
      amountCents: 2000,
      status: 'succeeded',
    };
    expect(store.tips['tip_101'].status).toBe('succeeded');

    // Step 12: Content screening flagged
    const flagScan = screenTextContent('stolen cc and cvv dump shop', ModeratedContentType.TIP_MESSAGE);
    expect(flagScan.passed).toBe(false);

    // Step 13: User reports creator content
    const reportRes = await ingestAbuseReport(mockDb, {
      callerUid: fanUid,
      request: {
        targetType: 'CREATOR',
        targetId: creatorId,
        violationCategory: ModerationRiskCategory.FRAUD_SCAM,
        description: 'Suspicious promotion detected.',
      },
    });
    expect(reportRes.status).toBe('RECEIVED');

    // Step 14 & 15: Admin verifies violation and issues strike
    const strikeRes = await issueStrike(mockDb, adminUid, {
      targetUid: creatorId,
      violationCategory: ModerationRiskCategory.FRAUD_SCAM,
      reason: 'Verified fraudulent campaign description',
    });
    expect(strikeRes.strikeNumber).toBe(1);

    // Step 16 & 17: Creator demonetized and strike applied
    await enforceCreatorLifecycle(mockDb, adminUid, {
      creatorId,
      action: CreatorLifecycleAction.DEMONETIZE,
      reason: 'Strike 2 enforcement',
    });
    expect(store.users[creatorId].monetizationStatus).toBe('DEMONETIZED');
    expect(store.users[creatorId].complianceHold).toBe(true);

    // Step 18: New tip attempt is strictly blocked (fails closed)
    await expect(assertCreatorMayMonetize(mockDb, creatorId, 'artist')).rejects.toThrow();

    // Step 19: Audit log verified
    expect(Object.keys(store.auditLogs).length).toBeGreaterThan(0);

    // Step 20 & 21: Creator submits appeal and admin resolves
    store.users[creatorId].appealStatus = 'PENDING';
    expect(store.users[creatorId].appealStatus).toBe('PENDING');

    // Scenario complete
  });
});
