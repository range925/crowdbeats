/**
 * Crowdbeats V2 — requestPayout Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const store: Record<string, any> = {};

const mockDoc = (path: string): any => {
  return {
    id: path.split('/').pop(),
    get: jest.fn<any>().mockImplementation(async () => {
      const data = store[path];
      return {
        exists: data !== undefined,
        data: () => data,
        id: path.split('/').pop(),
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
      const current = { ...store[path] };
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === 'object' && (v as any)._isIncrement) {
          current[k] = (current[k] || 0) + (v as any).amount;
        } else {
          current[k] = v;
        }
      }
      store[path] = current;
    }),
  };
};

const mockRunTransaction = async (updateFunction: (tx: any) => Promise<any>) => {
  const tx = {
    get: async (ref: any) => ref.get(),
    set: (ref: any, data: any) => ref.set(data),
    update: (ref: any, data: any) => ref.update(data),
  };
  return updateFunction(tx);
};

jest.mock('firebase-admin', () => {
  return {
    firestore: Object.assign(
      jest.fn(() => ({
        collection: (col: string) => ({
          doc: (id: string) => mockDoc(`${col}/${id}`),
          add: jest.fn<any>().mockImplementation(async (data: any) => {
            const id = 'audit_' + Math.random().toString(36).substring(7);
            store[`${col}/${id}`] = data;
            return { id };
          }),
        }),
        doc: (path: string) => mockDoc(path),
        runTransaction: mockRunTransaction,
      })),
      {
        FieldValue: {
          serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
          increment: jest.fn((n: number) => ({ _isIncrement: true, amount: n })),
        },
      }
    ),
    apps: ['mock-app'],
    initializeApp: jest.fn(),
  };
});

jest.mock('firebase-functions/v2/https', () => ({
  onCall: jest.fn((_opts: any, handler: any) => handler),
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

const mockCreateTransfer = jest.fn<any>();
const mockGetConnectAccountStatus = jest.fn<any>();

jest.mock('../../lib/stripe', () => ({
  stripe: {
    createTransfer: (...args: any[]) => mockCreateTransfer(...args),
    getConnectAccountStatus: (...args: any[]) => mockGetConnectAccountStatus(...args),
  },
}));

import { requestPayout } from '../requestPayout';

describe('requestPayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);

    store['users/artist_1'] = {
      personaType: 'artist',
      stripeConnectAccountId: 'acct_123',
      complianceHold: false,
    };
    store['artistProfiles/artist_1'] = {
      availableBalanceCents: 5000,
      totalPaidOutCents: 0,
    };

    mockGetConnectAccountStatus.mockResolvedValue({
      chargesEnabled: true,
      payoutsEnabled: true,
    });
    mockCreateTransfer.mockResolvedValue({ id: 'tr_test_999' });
  });

  it('rejects unauthenticated request', async () => {
    await expect(
      (requestPayout as any)({
        auth: null,
        data: { amountCents: 2000 },
      })
    ).rejects.toThrow('Authentication required.');
  });

  it('rejects payout below minimum $10', async () => {
    await expect(
      (requestPayout as any)({
        auth: { uid: 'artist_1' },
        data: { amountCents: 500 },
      })
    ).rejects.toThrow('Minimum payout is $10.');
  });

  it('rejects payout for unauthorized persona (e.g. fan)', async () => {
    store['users/artist_1'].personaType = 'fan';
    await expect(
      (requestPayout as any)({
        auth: { uid: 'artist_1' },
        data: { amountCents: 2000 },
      })
    ).rejects.toThrow('Only artists and band members can request payouts.');
  });

  it('rejects payout when account is on compliance hold', async () => {
    store['users/artist_1'].complianceHold = true;
    store['users/artist_1'].payoutHoldReason = 'KYC_PENDING';
    await expect(
      (requestPayout as any)({
        auth: { uid: 'artist_1' },
        data: { amountCents: 2000 },
      })
    ).rejects.toThrow('Payouts are on hold');
  });

  it('rejects payout when requested amount exceeds available balance', async () => {
    store['artistProfiles/artist_1'].availableBalanceCents = 1500;
    await expect(
      (requestPayout as any)({
        auth: { uid: 'artist_1' },
        data: { amountCents: 2000 },
      })
    ).rejects.toThrow('Insufficient balance');
  });

  it('successfully creates transfer with idempotencyKey and records payout', async () => {
    const res = await (requestPayout as any)({
      auth: { uid: 'artist_1' },
      data: { amountCents: 2000 },
    });

    expect(res.amountCents).toBe(2000);
    expect(res.stripeTransferId).toBe('tr_test_999');
    expect(mockCreateTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        amountCents: 2000,
        destinationAccountId: 'acct_123',
        idempotencyKey: expect.stringMatching(/^payout_/),
      })
    );
  });

  it('rolls back balance deduction if Stripe transfer fails', async () => {
    mockCreateTransfer.mockRejectedValueOnce(new Error('Stripe network timeout'));

    await expect(
      (requestPayout as any)({
        auth: { uid: 'artist_1' },
        data: { amountCents: 2000 },
      })
    ).rejects.toThrow('Stripe transfer failed: Stripe network timeout');

    // Balance should be restored
    const profile = store['artistProfiles/artist_1'];
    expect(profile.availableBalanceCents).toBe(5000);
  });
});
