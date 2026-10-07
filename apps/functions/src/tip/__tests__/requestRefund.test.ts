/**
 * Crowdbeats V2 — requestRefund Unit Tests (Phase 6)
 *
 * Uses mockImplementation with call-count tracking to avoid mockResolvedValueOnce
 * queue contamination between tests (which clearMocks does NOT reset).
 */

jest.mock('firebase-admin', () => {
  const serverTimestamp = jest.fn(() => ({ _type: 'serverTimestamp' }));
  const increment = jest.fn((n: number) => ({ _type: 'increment', value: n }));

  const mockBatch = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    commit: jest.fn().mockResolvedValue(undefined),
  };

  const mockGet = jest.fn();

  const mockDocRef = {
    get: mockGet,
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const mockDb = {
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue(mockDocRef),
    }),
    batch: jest.fn().mockReturnValue(mockBatch),
  };

  return {
    apps: [true],
    initializeApp: jest.fn(),
    firestore: Object.assign(jest.fn(() => mockDb), {
      FieldValue: { serverTimestamp, increment },
    }),
    app: jest.fn(),
    __mockGet: mockGet,
    __mockDocRef: mockDocRef,
    __mockDb: mockDb,
    __mockBatch: mockBatch,
  };
});

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
    createRefund: jest.fn().mockResolvedValue({ id: 're_mock_123' }),
  },
}));

import { requestRefund } from '../requestRefund';
import * as admin from 'firebase-admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAdmin = admin as any;

type Handler = (req: Record<string, unknown>) => Promise<Record<string, unknown>>;
const handler = requestRefund as unknown as Handler;

function makeReq(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    auth: { uid: 'fan_123' },
    data: {
      tipId: 'tip_abc',
      idempotencyKey: 'refund_key_001',
      ...overrides,
    },
  };
}

function recentTs() {
  return { toDate: () => new Date(Date.now() - 3_600_000) };  // 1h ago
}

function expiredTs() {
  return { toDate: () => new Date(Date.now() - 25 * 3_600_000) }; // 25h ago
}

function baseTip(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    fanUid: 'fan_123',
    recipientId: 'artist_abc',
    status: 'succeeded',
    amountCents: 1000,
    netAmountCents: 950,
    platformFeeCents: 50,
    currency: 'USD',
    stripePaymentIntentId: 'pi_mock_123',
    createdAt: recentTs(),
    refundedAt: null,
    ...overrides,
  };
}

/**
 * Set up get() to return different results for each call via callCount.
 * This avoids mockResolvedValueOnce queue contamination between tests.
 */
function setupMocks(
  idemResult: { exists: boolean; data?: () => Record<string, unknown> },
  tipResult: { exists: boolean; data?: () => Record<string, unknown> },
) {
  let callCount = 0;
  mockAdmin.__mockGet.mockImplementation(() => {
    const n = callCount++;
    if (n === 0) return Promise.resolve(idemResult);
    if (n === 1) return Promise.resolve(tipResult);
    return Promise.resolve({ exists: false }); // fallback
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('requestRefund', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore batch mock chain after clearAllMocks clears call history (not implementations)
    mockAdmin.__mockBatch.update.mockReturnThis();
    mockAdmin.__mockBatch.set.mockReturnThis();
    mockAdmin.__mockBatch.delete.mockReturnThis();
    mockAdmin.__mockBatch.commit.mockResolvedValue(undefined);
    mockAdmin.__mockDb.batch.mockReturnValue(mockAdmin.__mockBatch);
    // Default Stripe mock
    const { stripe: s } = jest.requireMock('../../lib/stripe') as {
      stripe: { createRefund: jest.Mock };
    };
    s.createRefund.mockResolvedValue({ id: 're_mock_123' });
  });

  it('rejects unauthenticated calls', async () => {
    setupMocks({ exists: false }, { exists: false });
    await expect(handler({ auth: null, data: { tipId: 'x', idempotencyKey: 'y' } }))
      .rejects.toThrow('Authentication required');
  });

  it('returns early idempotent response when idem key already exists', async () => {
    setupMocks(
      { exists: true, data: () => ({ fanUid: 'fan_123', refundedAmountCents: 1000 }) },
      { exists: false },
    );
    const result = await handler(makeReq());
    expect(result['refundedAmountCents']).toBe(1000);
    expect(result['tipId']).toBe('tip_abc');
  });

  it('rejects if tip not owned by caller', async () => {
    setupMocks(
      { exists: false },
      { exists: true, data: () => baseTip({ fanUid: 'other_user' }) },
    );
    await expect(handler(makeReq())).rejects.toThrow(/only refund your own/);
  });

  it('rejects if tip not in succeeded status', async () => {
    setupMocks(
      { exists: false },
      { exists: true, data: () => baseTip({ status: 'pending' }) },
    );
    await expect(handler(makeReq())).rejects.toThrow(/succeeded/);
  });

  it('rejects if outside 24h window', async () => {
    setupMocks(
      { exists: false },
      { exists: true, data: () => baseTip({ createdAt: expiredTs() }) },
    );
    await expect(handler(makeReq())).rejects.toThrow(/expired/);
  });

  it('returns refundedAmountCents early if already refunded (refundedAt set)', async () => {
    setupMocks(
      { exists: false },
      { exists: true, data: () => baseTip({ refundedAt: new Date() }) },
    );
    const result = await handler(makeReq());
    expect(result['refundedAmountCents']).toBe(1000);
  });

  it('sets status to refunded via batch.update', async () => {
    setupMocks({ exists: false }, { exists: true, data: () => baseTip() });
    await handler(makeReq());
    const calls = mockAdmin.__mockBatch.update.mock.calls as Array<[unknown, Record<string, unknown>]>;
    expect(calls[0][1]['status']).toBe('refunded');
    expect(calls[0][1]['refundedAt']).toBeDefined();
  });

  it('writes REVERSAL_DEBIT and REVERSAL_CREDIT ledger entries', async () => {
    setupMocks({ exists: false }, { exists: true, data: () => baseTip() });
    await handler(makeReq());
    const sets = mockAdmin.__mockBatch.set.mock.calls as Array<[unknown, Record<string, unknown>]>;
    const types = sets.map((c) => c[1]['type'] as string);
    expect(types).toContain('REVERSAL_DEBIT');
    expect(types).toContain('REVERSAL_CREDIT');
  });

  it('does NOT delete original ledger entries', async () => {
    setupMocks({ exists: false }, { exists: true, data: () => baseTip() });
    await handler(makeReq());
    expect(mockAdmin.__mockBatch.delete).not.toHaveBeenCalled();
  });

  it('decrements artist availableBalanceCents by net amount', async () => {
    setupMocks({ exists: false }, { exists: true, data: () => baseTip({ netAmountCents: 950 }) });
    await handler(makeReq());
    const sets = mockAdmin.__mockBatch.set.mock.calls as Array<[unknown, Record<string, unknown>, Record<string, unknown>?]>;
    const artistSet = sets.find((c) => c[1]['availableBalanceCents'] !== undefined);
    expect(artistSet).toBeDefined();
  });
});
