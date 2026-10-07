/**
 * Crowdbeats V2 — createTipIntent Unit Tests (Phase 3 & Phase 6 Compliance)
 *
 * Tests: input validation, creator monetization eligibility checks, idempotency, fee calculations.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const store: Record<string, Record<string, unknown>> = {};
const _mockSet = jest.fn<any>();
const _mockUpdate = jest.fn<any>();

const _mockDoc = (cId: string, dId?: string) => {
  const docId = dId || `doc_${Math.random()}`;
  return {
    id: docId,
    get: jest.fn().mockImplementation(async () => {
      const data = store[`${cId}/${docId}`];
      return { exists: data !== undefined, data: () => data };
    }),
    set: jest.fn().mockImplementation(async (data: any) => {
      store[`${cId}/${docId}`] = data;
      _mockSet(data);
    }),
    update: jest.fn().mockImplementation(async (updates: any) => {
      store[`${cId}/${docId}`] = { ...(store[`${cId}/${docId}`] || {}), ...updates };
      _mockUpdate(updates);
    }),
  };
};

const mockDb = {
  collection: (cId: string) => ({
    doc: (dId?: string) => _mockDoc(cId, dId),
  }),
};

jest.mock('firebase-admin', () => ({
  apps: [true],
  initializeApp: jest.fn(),
  firestore: Object.assign(jest.fn(() => mockDb), {
    FieldValue: { serverTimestamp: () => 'SERVER_TS' },
  }),
}));

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

jest.mock('../../lib/stripe', () => ({
  stripe: {
    createOrGetCustomer: jest.fn<any>().mockResolvedValue({ id: 'cus_mock_123' }),
    createPaymentIntent: jest.fn<any>().mockResolvedValue({
      id: 'pi_mock_123',
      client_secret: 'pi_mock_123_secret',
    }),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createTipIntent } = require('../createTipIntent');

type Handler = (req: Record<string, unknown>) => Promise<Record<string, unknown>>;
const handler = createTipIntent as unknown as Handler;

function makeReq(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    auth: { uid: 'user_123' },
    data: {
      recipientId: 'artist_abc',
      recipientType: 'artist',
      amountCents: 1000,
      currency: 'USD',
      idempotencyKey: 'idem_key_001',
      ...overrides,
    },
  };
}

describe('createTipIntent with Monetization Eligibility (Phase 3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);

    // Setup active fan
    store['users/user_123'] = {
      uid: 'user_123',
      email: 'test@crowdbeats.app',
      stripeCustomerId: 'cus_mock_123',
    };

    // Setup active eligible artist
    store['users/artist_abc'] = {
      uid: 'artist_abc',
      personaType: 'artist',
      email: 'artist@test.com',
      stripeConnectAccountId: 'acct_artist_123',
      chargesEnabled: true,
      connectStatus: 'active',
      termsAccepted: true,
      aupAccepted: true,
      monetizationPolicyAccepted: true,
      onboardedAt: '2026-08-25',
    };
    store['artistProfiles/artist_abc'] = {
      artistId: 'artist_abc',
      ownerUid: 'artist_abc',
      stageName: 'Luna Bay',
      stripeAccountId: 'acct_artist_123',
      bankLinked: true,
      isActive: true,
      monetizationStatus: 'ACTIVE',
    };
  });

  it('rejects unauthenticated calls with unauthenticated', async () => {
    await expect(handler({ auth: null, data: {} })).rejects.toMatchObject({
      code: 'unauthenticated',
    });
  });

  it('rejects amountCents below 100 with invalid-argument', async () => {
    await expect(handler(makeReq({ amountCents: 50 }))).rejects.toMatchObject({
      code: 'invalid-argument',
    });
  });

  it('rejects amountCents above 50000 with invalid-argument', async () => {
    await expect(handler(makeReq({ amountCents: 50001 }))).rejects.toMatchObject({
      code: 'invalid-argument',
    });
  });

  it('rejects invalid currency with invalid-argument', async () => {
    await expect(handler(makeReq({ currency: 'XYZ' }))).rejects.toMatchObject({
      code: 'invalid-argument',
    });
  });

  it('rejects invalid recipientType with invalid-argument', async () => {
    await expect(handler(makeReq({ recipientType: 'staff' }))).rejects.toMatchObject({
      code: 'invalid-argument',
    });
  });

  it('rejects message over 200 characters', async () => {
    await expect(handler(makeReq({ message: 'a'.repeat(201) }))).rejects.toMatchObject({
      code: 'invalid-argument',
    });
  });

  it('blocks tipping when creator is suspended (failed-precondition)', async () => {
    store['users/artist_abc'].isSuspended = true;
    await expect(handler(makeReq())).rejects.toMatchObject({
      code: 'failed-precondition',
    });
  });

  it('blocks tipping when creator is demonetized (failed-precondition)', async () => {
    store['artistProfiles/artist_abc'].monetizationStatus = 'DEMONETIZED';
    await expect(handler(makeReq())).rejects.toMatchObject({
      code: 'failed-precondition',
    });
  });

  it('blocks tipping when creator has no Stripe Connect account (failed-precondition)', async () => {
    delete store['users/artist_abc'].stripeConnectAccountId;
    delete store['artistProfiles/artist_abc'].stripeAccountId;
    await expect(handler(makeReq())).rejects.toMatchObject({
      code: 'failed-precondition',
    });
  });

  it('returns idempotent response for duplicate key + same fanUid', async () => {
    store['idempotencyKeys/idem_key_001'] = {
      fanUid: 'user_123',
      tipId: 'existing_tip_id',
    };
    store['tips/existing_tip_id'] = {
      tipId: 'existing_tip_id',
      clientSecret: 'existing_secret',
      amountCents: 1000,
      platformFeeCents: 50,
      netAmountCents: 950,
    };

    const result = await handler(makeReq());
    expect(result['tipId']).toBe('existing_tip_id');
    expect(result['clientSecret']).toBe('existing_secret');
  });

  it('throws permission-denied for duplicate key + different fanUid', async () => {
    store['idempotencyKeys/idem_key_001'] = {
      fanUid: 'different_user',
      tipId: 'existing_tip_id',
    };
    await expect(handler(makeReq())).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it('calculates platformFeeCents: 1000 → 60 (6% platform fee)', async () => {
    const result = await handler(makeReq({ amountCents: 1000 }));
    expect(result['platformFeeCents']).toBe(60);
    expect(result['netAmountCents']).toBe(940);
  });

  it('calculates platformFeeCents with floor: 1001 → 60', async () => {
    const result = await handler(makeReq({ amountCents: 1001 }));
    expect(result['platformFeeCents']).toBe(60);
  });

  it('rejects tip with violent or prohibited message and writes to moderation queue', async () => {
    await expect(
      handler(makeReq({ message: 'bomb threat at the concert hall tonight' })),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
    });

    const queueItems = Object.keys(store).filter((k) => k.startsWith('moderationQueue/'));
    expect(queueItems.length).toBeGreaterThan(0);
    expect(store[queueItems[0]].autoQuarantined).toBe(true);
  });

  it('allows message with mild profanity but marks moderationStatus FLAGGED', async () => {
    const result = await handler(makeReq({ message: 'That was a fucking great show!' }));
    expect(result['tipId']).toBeDefined();
    expect(store[`tips/${result['tipId']}`].moderationStatus).toBe('FLAGGED');
    expect(store[`tips/${result['tipId']}`].message).toContain('***');
  });

  it('creates tip document with status pending and returns SendTipResponse', async () => {
    const result = await handler(makeReq({ amountCents: 2000 }));
    expect(result).toMatchObject({
      tipId: expect.any(String),
      clientSecret: 'pi_mock_123_secret',
      amountCents: 2000,
      platformFeeCents: 120,
      netAmountCents: 1880,
    });
    expect(store[`tips/${result['tipId']}`]).toBeDefined();
    expect(store[`tips/${result['tipId']}`]['status']).toBe('pending');
  });

  it('rejects self-tipping with failed-precondition (FINDING-P3-031)', async () => {
    await expect(
      handler(makeReq({ recipientId: 'user_123' })),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'Self-tipping is not permitted.',
    });
  });
});
