/**
 * Crowdbeats V2 — stripeWebhook Unit Tests (Phase 6)
 */

jest.mock('firebase-admin', () => {
  const serverTimestamp = jest.fn(() => ({ _type: 'serverTimestamp' }));
  const increment = jest.fn((n: number) => ({ _type: 'increment', n }));

  const mockGet = jest.fn().mockResolvedValue({ exists: false });

  const mockDocRef = {
    get: mockGet,
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const mockTransaction = {
    get: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };

  const mockCollectionQuery = {
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
  };

  const mockDb = {
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue(mockDocRef),
    }),
    runTransaction: jest.fn(),
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
    __mockTransaction: mockTransaction,
    __mockCollectionQuery: mockCollectionQuery,
  };
});

jest.mock('firebase-functions/v2/https', () => ({
  onRequest: jest.fn((_opts: unknown, handler: unknown) => handler),
  HttpsError: class HttpsError extends Error {
    constructor(public code: string, message: string) {
      super(message);
    }
  },
}));

jest.mock('../../lib/stripe', () => ({
  stripe: {
    constructWebhookEvent: jest.fn((payload: string) => JSON.parse(payload) as unknown),
  },
}));

jest.mock('../../connect/connectWebhookHandlers', () => ({
  handleAccountUpdated: jest.fn().mockResolvedValue(undefined),
  handleAccountApplicationDeauthorized: jest.fn().mockResolvedValue(undefined),
  handleDisputeCreated: jest.fn().mockResolvedValue(undefined),
  handleChargeRefunded: jest.fn().mockResolvedValue(undefined),
  handlePayoutPaid: jest.fn().mockResolvedValue(undefined),
  handlePayoutFailed: jest.fn().mockResolvedValue(undefined),
}));

import { stripeWebhook, stripeConnectWebhook } from '../webhookHandler';
import {
  handleAccountUpdated,
  handlePayoutPaid,
  handlePayoutFailed,
} from '../../connect/connectWebhookHandlers';
import * as admin from 'firebase-admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAdmin = admin as any;

type WebhookHandler = (req: Record<string, unknown>, res: Record<string, unknown>) => Promise<void>;
const handler = stripeWebhook as unknown as WebhookHandler;

function makeEvent(type: string, obj: Record<string, unknown>, eventId?: string) {
  return JSON.stringify({ id: eventId, type, data: { object: obj } });
}

function makeMockRes(): { statusCode: number; status: jest.Mock; send: jest.Mock } {
  let _code = 200;
  const res: { statusCode: number; status: jest.Mock; send: jest.Mock } = {
    get statusCode() { return _code; },
    status: jest.fn((code: number) => { _code = code; return res; }),
    send: jest.fn(() => res),
  };
  return res;
}

function makeMockReq(body: string, sig?: string) {
  return {
    rawBody: body,
    body: JSON.parse(body) as unknown,
    headers: sig ? { 'stripe-signature': sig } : {},
  };
}

// Helper: set up successful payment succeeded transaction
function setupSucceededTransaction() {
  mockAdmin.__mockDb.runTransaction.mockImplementation(
    async (fn: (tx: typeof mockAdmin.__mockTransaction) => Promise<void>) => {
      mockAdmin.__mockTransaction.get.mockResolvedValue({
        exists: true,
        data: () => ({
          status: 'pending',
          fanUid: 'fan_123',
          recipientId: 'artist_abc',
          recipientType: 'artist',
          amountCents: 1000,
          platformFeeCents: 50,
          netAmountCents: 950,
          currency: 'USD',
          isAnonymous: false,
        }),
        ref: mockAdmin.__mockDocRef,
      });
      await fn(mockAdmin.__mockTransaction);
    },
  );
  // artist update + notification
  mockAdmin.__mockDocRef.update.mockResolvedValue(undefined);
  mockAdmin.__mockDocRef.set.mockResolvedValue(undefined);
  mockAdmin.__mockDb.collection.mockReturnValue({
    doc: jest.fn().mockReturnValue(mockAdmin.__mockDocRef),
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue(mockAdmin.__mockDocRef),
    }),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
  });
}

describe('stripeWebhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-wire implementations after clearAllMocks
    const { stripe: s } = jest.requireMock('../../lib/stripe') as {
      stripe: { constructWebhookEvent: jest.Mock };
    };
    // Default: parse payload directly (no signature verification)
    s.constructWebhookEvent.mockImplementation((payload: string) => JSON.parse(payload) as unknown);
    // Default: no active transaction
    mockAdmin.__mockDb.runTransaction.mockResolvedValue(undefined);
    mockAdmin.__mockDocRef.get.mockResolvedValue({ exists: false });
    mockAdmin.__mockDocRef.update.mockResolvedValue(undefined);
    mockAdmin.__mockDocRef.set.mockResolvedValue(undefined);
    mockAdmin.__mockTransaction.update.mockReturnThis();
    mockAdmin.__mockTransaction.set.mockReturnThis();
    // Ensure webhook secrets are not set for most tests
    delete process.env['STRIPE_WEBHOOK_SECRET'];
    delete process.env['STRIPE_CONNECT_WEBHOOK_SECRET'];
  });

  it('returns 400 when STRIPE_WEBHOOK_SECRET is set and constructWebhookEvent throws', async () => {
    process.env['STRIPE_WEBHOOK_SECRET'] = 'whsec_test';
    const { stripe: s } = jest.requireMock('../../lib/stripe') as {
      stripe: { constructWebhookEvent: jest.Mock };
    };
    s.constructWebhookEvent.mockImplementationOnce(() => { throw new Error('bad sig'); });

    const body = makeEvent('payment_intent.succeeded', { metadata: { tipId: 't' } });
    const res = makeMockRes();
    await handler(
      makeMockReq(body, 'bad_sig') as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
    );
    expect(res.statusCode).toBe(400);
  });

  it('payment_intent.succeeded: updates tip status to succeeded', async () => {
    setupSucceededTransaction();
    const body = makeEvent('payment_intent.succeeded', { id: 'pi_123', metadata: { tipId: 'tip_abc' } });
    const res = makeMockRes();
    await handler(
      makeMockReq(body) as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
    );
    expect(res.statusCode).toBe(200);
    expect(mockAdmin.__mockTransaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'succeeded' }),
    );
  });

  it('payment_intent.succeeded: creates DEBIT and CREDIT ledger entries', async () => {
    setupSucceededTransaction();
    const body = makeEvent('payment_intent.succeeded', { id: 'pi_123', metadata: { tipId: 'tip_abc' } });
    const res = makeMockRes();
    await handler(
      makeMockReq(body) as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
    );
    const sets = mockAdmin.__mockTransaction.set.mock.calls as Array<[unknown, Record<string, unknown>]>;
    const types = sets.map((c) => c[1]['type'] as string);
    expect(types).toContain('DEBIT');
    expect(types).toContain('CREDIT');
  });

  it('payment_intent.succeeded: already-succeeded tip is a no-op', async () => {
    mockAdmin.__mockDb.runTransaction.mockImplementation(
      async (fn: (tx: typeof mockAdmin.__mockTransaction) => Promise<void>) => {
        mockAdmin.__mockTransaction.get.mockResolvedValue({
          exists: true,
          data: () => ({ status: 'succeeded' }),
          ref: mockAdmin.__mockDocRef,
        });
        await fn(mockAdmin.__mockTransaction);
      },
    );
    const body = makeEvent('payment_intent.succeeded', { id: 'pi_123', metadata: { tipId: 'tip_abc' } });
    const res = makeMockRes();
    await handler(
      makeMockReq(body) as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
    );
    expect(res.statusCode).toBe(200);
    expect(mockAdmin.__mockTransaction.update).not.toHaveBeenCalled();
  });

  it('payment_intent.payment_failed: sets status to failed', async () => {
    const body = makeEvent('payment_intent.payment_failed', { id: 'pi_123', metadata: { tipId: 'tip_abc' } });
    const res = makeMockRes();
    await handler(
      makeMockReq(body) as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
    );
    expect(res.statusCode).toBe(200);
    expect(mockAdmin.__mockDocRef.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' }),
    );
  });

  it('payment_intent.payment_failed: ignores late failure if tip is already succeeded', async () => {
    mockAdmin.__mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ status: 'succeeded' }),
    });
    const body = makeEvent('payment_intent.payment_failed', { id: 'pi_123', metadata: { tipId: 'tip_abc' } });
    const res = makeMockRes();
    await handler(
      makeMockReq(body) as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
    );
    expect(res.statusCode).toBe(200);
    expect(mockAdmin.__mockDocRef.update).not.toHaveBeenCalled();
  });

  it('deduplicates completed event and skips reprocessing', async () => {
    mockAdmin.__mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ status: 'COMPLETED' }),
    });
    const body = makeEvent('payment_intent.succeeded', { id: 'pi_123', metadata: { tipId: 'tip_abc' } }, 'evt_done');
    const res = makeMockRes();
    await handler(
      makeMockReq(body) as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
    );
    expect(res.statusCode).toBe(200);
    expect(mockAdmin.__mockDb.runTransaction).not.toHaveBeenCalled();
  });

  it('unknown event type: returns 200 gracefully', async () => {
    const body = makeEvent('customer.created', { id: 'cus_123' });
    const res = makeMockRes();
    await handler(
      makeMockReq(body) as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
    );
    expect(res.statusCode).toBe(200);
  });

  it('falls back to STRIPE_CONNECT_WEBHOOK_SECRET when STRIPE_WEBHOOK_SECRET verification fails', async () => {
    process.env['STRIPE_WEBHOOK_SECRET'] = 'whsec_primary';
    process.env['STRIPE_CONNECT_WEBHOOK_SECRET'] = 'whsec_connect';
    const { stripe: s } = jest.requireMock('../../lib/stripe') as {
      stripe: { constructWebhookEvent: jest.Mock };
    };
    s.constructWebhookEvent.mockImplementation((payload: string, _sig: string, secret: string) => {
      if (secret === 'whsec_primary') {
        throw new Error('primary secret signature mismatch');
      }
      return JSON.parse(payload) as unknown;
    });

    const body = makeEvent('payout.paid', { id: 'po_123', amount: 5000 });
    const res = makeMockRes();
    await handler(
      makeMockReq(body, 'valid_connect_sig') as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
    );
    expect(res.statusCode).toBe(200);
    expect(s.constructWebhookEvent).toHaveBeenCalledTimes(2);
    expect(handlePayoutPaid).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'po_123', amount: 5000 }),
    );
  });

  it('verifies signature when only STRIPE_CONNECT_WEBHOOK_SECRET is configured', async () => {
    delete process.env['STRIPE_WEBHOOK_SECRET'];
    process.env['STRIPE_CONNECT_WEBHOOK_SECRET'] = 'whsec_connect';
    const { stripe: s } = jest.requireMock('../../lib/stripe') as {
      stripe: { constructWebhookEvent: jest.Mock };
    };

    const body = makeEvent('payout.failed', { id: 'po_fail', amount: 5000, failure_message: 'declined' });
    const res = makeMockRes();
    await handler(
      makeMockReq(body, 'sig_connect_only') as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
    );
    expect(res.statusCode).toBe(200);
    expect(s.constructWebhookEvent).toHaveBeenCalledWith(
      expect.any(String),
      'sig_connect_only',
      'whsec_connect',
    );
    expect(handlePayoutFailed).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'po_fail', failure_message: 'declined' }),
    );
  });

  it('capability.updated: invokes handleAccountUpdated', async () => {
    const body = makeEvent('capability.updated', { id: 'transfers', status: 'active', account: 'acct_123' });
    const res = makeMockRes();
    await handler(
      makeMockReq(body) as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
    );
    expect(res.statusCode).toBe(200);
    expect(handleAccountUpdated).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'transfers', status: 'active', account: 'acct_123' }),
    );
  });

  it('stripeConnectWebhook is exported and handles requests identically', async () => {
    expect(stripeConnectWebhook).toBeDefined();
    const connectHandler = stripeConnectWebhook as unknown as WebhookHandler;
    const body = makeEvent('payout.paid', { id: 'po_connect_777', amount: 3000 });
    const res = makeMockRes();
    await connectHandler(
      makeMockReq(body) as unknown as Record<string, unknown>,
      res as unknown as Record<string, unknown>,
    );
    expect(res.statusCode).toBe(200);
    expect(handlePayoutPaid).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'po_connect_777' }),
    );
  });
});
