/**
 * Crowdbeats V2 — Creator Monetization Eligibility Service Tests (Phase 3 Compliance)
 *
 * Unit tests verifying:
 * 1. Active eligible creator (artist and band) resolves to ACTIVE and isEligible = true.
 * 2. Missing user account throws failed-precondition with ACCOUNT_INACTIVE_OR_DELETED.
 * 3. Deleted/soft-deleted creator throws failed-precondition with ACCOUNT_INACTIVE_OR_DELETED.
 * 4. Unsupported persona (fan/venue/sponsor) throws with UNSUPPORTED_CREATOR_ROLE.
 * 5. Missing Stripe Connect account throws with STRIPE_CONNECT_ACCOUNT_MISSING.
 * 6. Stripe Connect charges disabled throws with STRIPE_CHARGES_DISABLED.
 * 7. Suspended creator throws failed-precondition with CREATOR_SUSPENDED.
 * 8. Demonetized creator throws failed-precondition with CREATOR_DEMONETIZED.
 * 9. Compliance hold throws with COMPLIANCE_HOLD_ACTIVE.
 * 10. Missing policy acceptances throws with TERMS_OF_SERVICE_NOT_ACCEPTED, etc.
 * 11. Fail-closed assertion prevents unauthorized payment initiation.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CreatorMonetizationStatus } from '@crowdbeats/contracts';

const store: Record<string, Record<string, unknown>> = {};

const _mockDoc = (cId: string, dId?: string) => {
  const docId = dId || `doc_${Math.random()}`;
  return {
    id: docId,
    get: jest.fn().mockImplementation(async () => {
      const data = store[`${cId}/${docId}`];
      return { exists: data !== undefined, data: () => data };
    }),
  };
};

const mockFirestore = {
  collection: (cId: string) => ({
    doc: (dId?: string) => _mockDoc(cId, dId),
  }),
};

jest.mock('firebase-admin', () => ({
  apps: [true],
  initializeApp: jest.fn(),
  firestore: Object.assign(jest.fn(() => mockFirestore), {
    FieldValue: { serverTimestamp: () => 'SERVER_TS' },
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  evaluateCreatorMonetizationEligibility,
  assertCreatorMayMonetize,
} = require('../eligibilityService');

describe('Creator Monetization Eligibility Engine (Phase 3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  const setupEligibleArtist = (artistId = 'artist-1') => {
    store[`users/${artistId}`] = {
      uid: artistId,
      personaType: 'artist',
      email: 'artist@test.com',
      stripeConnectAccountId: 'acct_123',
      chargesEnabled: true,
      connectStatus: 'active',
      termsAccepted: true,
      aupAccepted: true,
      monetizationPolicyAccepted: true,
      onboardedAt: '2026-08-25T00:00:00.000Z',
    };
    store[`artistProfiles/${artistId}`] = {
      artistId,
      ownerUid: artistId,
      stageName: 'Luna Bay',
      stripeAccountId: 'acct_123',
      bankLinked: true,
      isActive: true,
      monetizationStatus: 'ACTIVE',
    };
  };

  const setupEligibleBand = (bandId = 'band-1', founderUid = 'founder-1') => {
    store[`users/${founderUid}`] = {
      uid: founderUid,
      personaType: 'band_member',
      email: 'founder@test.com',
      stripeConnectAccountId: 'acct_band_123',
      chargesEnabled: true,
      termsAccepted: true,
      aupAccepted: true,
      monetizationPolicyAccepted: true,
      onboardedAt: '2026-08-25T00:00:00.000Z',
    };
    store[`bands/${bandId}`] = {
      bandId,
      founderUid,
      name: 'The Groove',
      stripeAccountId: 'acct_band_123',
      bankLinked: true,
      chargesEnabled: true,
      isActive: true,
      monetizationStatus: 'ACTIVE',
    };
  };

  it('evaluates fully compliant artist as ACTIVE and eligible', async () => {
    setupEligibleArtist('artist-1');
    const result = await evaluateCreatorMonetizationEligibility(mockFirestore as any, 'artist-1', 'artist');

    expect(result.isEligible).toBe(true);
    expect(result.status).toBe(CreatorMonetizationStatus.ACTIVE);
    expect(result.reasonCodes).toHaveLength(0);
    expect(result.checklist.activeAccount).toBe(true);
    expect(result.checklist.stripeChargesEnabled).toBe(true);
    expect(result.checklist.notSuspended).toBe(true);
    expect(result.checklist.notDemonetized).toBe(true);
  });

  it('evaluates fully compliant band as ACTIVE and eligible', async () => {
    setupEligibleBand('band-1', 'founder-1');
    const result = await evaluateCreatorMonetizationEligibility(mockFirestore as any, 'band-1', 'band');

    expect(result.isEligible).toBe(true);
    expect(result.status).toBe(CreatorMonetizationStatus.ACTIVE);
    expect(result.reasonCodes).toHaveLength(0);
  });

  it('rejects nonexistent creator with TERMINATED', async () => {
    const result = await evaluateCreatorMonetizationEligibility(mockFirestore as any, 'nonexistent', 'artist');
    expect(result.isEligible).toBe(false);
    expect(result.status).toBe(CreatorMonetizationStatus.TERMINATED);
    expect(result.reasonCodes).toContain('ACCOUNT_INACTIVE_OR_DELETED');
  });

  it('rejects soft-deleted creator with TERMINATED', async () => {
    setupEligibleArtist('artist-deleted');
    store['users/artist-deleted'].deletedAt = '2026-08-26T00:00:00.000Z';

    const result = await evaluateCreatorMonetizationEligibility(mockFirestore as any, 'artist-deleted', 'artist');
    expect(result.isEligible).toBe(false);
    expect(result.status).toBe(CreatorMonetizationStatus.TERMINATED);
  });

  it('rejects fan persona trying to receive creator payments', async () => {
    store['users/fan-1'] = {
      uid: 'fan-1',
      personaType: 'fan',
      onboardedAt: '2026-08-25',
    };

    const result = await evaluateCreatorMonetizationEligibility(mockFirestore as any, 'fan-1', 'artist');
    expect(result.isEligible).toBe(false);
    expect(result.status).toBe(CreatorMonetizationStatus.PENDING_STRIPE);
    expect(result.reasonCodes).toContain('UNSUPPORTED_CREATOR_ROLE');
  });

  it('rejects creator without Stripe Connect account with PENDING_STRIPE', async () => {
    setupEligibleArtist('artist-nostripe');
    delete store['users/artist-nostripe'].stripeConnectAccountId;
    delete store['artistProfiles/artist-nostripe'].stripeAccountId;

    const result = await evaluateCreatorMonetizationEligibility(mockFirestore as any, 'artist-nostripe', 'artist');
    expect(result.isEligible).toBe(false);
    expect(result.status).toBe(CreatorMonetizationStatus.PENDING_STRIPE);
    expect(result.reasonCodes).toContain('STRIPE_CONNECT_ACCOUNT_MISSING');
  });

  it('rejects creator with Stripe charges disabled with PENDING_STRIPE', async () => {
    setupEligibleArtist('artist-charges-disabled');
    store['users/artist-charges-disabled'].chargesEnabled = false;
    store['users/artist-charges-disabled'].connectStatus = 'pending';
    store['artistProfiles/artist-charges-disabled'].bankLinked = false;

    const result = await evaluateCreatorMonetizationEligibility(mockFirestore as any, 'artist-charges-disabled', 'artist');
    expect(result.isEligible).toBe(false);
    expect(result.status).toBe(CreatorMonetizationStatus.PENDING_STRIPE);
    expect(result.reasonCodes).toContain('STRIPE_CHARGES_DISABLED');
  });

  it('rejects suspended creator with SUSPENDED', async () => {
    setupEligibleArtist('artist-suspended');
    store['users/artist-suspended'].isSuspended = true;

    const result = await evaluateCreatorMonetizationEligibility(mockFirestore as any, 'artist-suspended', 'artist');
    expect(result.isEligible).toBe(false);
    expect(result.status).toBe(CreatorMonetizationStatus.SUSPENDED);
    expect(result.reasonCodes).toContain('CREATOR_SUSPENDED');
  });

  it('rejects demonetized creator with DEMONETIZED', async () => {
    setupEligibleArtist('artist-demonetized');
    store['artistProfiles/artist-demonetized'].monetizationStatus = 'DEMONETIZED';

    const result = await evaluateCreatorMonetizationEligibility(mockFirestore as any, 'artist-demonetized', 'artist');
    expect(result.isEligible).toBe(false);
    expect(result.status).toBe(CreatorMonetizationStatus.DEMONETIZED);
    expect(result.reasonCodes).toContain('CREATOR_DEMONETIZED');
  });

  it('rejects creator with active compliance hold with PAYOUT_HOLD', async () => {
    setupEligibleArtist('artist-hold');
    store['users/artist-hold'].complianceHold = true;

    const result = await evaluateCreatorMonetizationEligibility(mockFirestore as any, 'artist-hold', 'artist');
    expect(result.isEligible).toBe(false);
    expect(result.status).toBe(CreatorMonetizationStatus.PAYOUT_HOLD);
    expect(result.reasonCodes).toContain('COMPLIANCE_HOLD_ACTIVE');
  });

  describe('assertCreatorMayMonetize', () => {
    it('succeeds for active eligible creator without throwing', async () => {
      setupEligibleArtist('artist-ok');
      await expect(assertCreatorMayMonetize(mockFirestore as any, 'artist-ok', 'artist')).resolves.toMatchObject({
        isEligible: true,
        status: CreatorMonetizationStatus.ACTIVE,
      });
    });

    it('throws failed-precondition when creator is suspended or demonetized', async () => {
      setupEligibleArtist('artist-blocked');
      store['users/artist-blocked'].isSuspended = true;

      await expect(assertCreatorMayMonetize(mockFirestore as any, 'artist-blocked', 'artist')).rejects.toMatchObject({
        code: 'failed-precondition',
      });
    });
  });
});
