/**
 * Crowdbeats V2 — Payout Hold & Financial Isolation Service Tests (Phase 9 Compliance)
 *
 * Unit tests verifying:
 * 1. Application of payout hold with reason codes (FRAUD, CHARGEBACK, DMCA, SANCTIONS, MANUAL).
 * 2. Database complianceHold flag setting and Stripe Connect payout pausing.
 * 3. Releasing payout holds with multi-hold verification (complianceHold only cleared when 0 remain).
 * 4. Immutable audit logging for all hold applications and releases.
 * 5. Retrieval of comprehensive payout hold status.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PayoutHoldReasonCode } from '@crowdbeats/contracts';

const store: Record<string, Record<string, unknown>> = {};

const _mockDoc = (cId: string, dId?: string) => {
  const docId = dId || `doc_${Math.random()}`;
  return {
    id: docId,
    get: jest.fn().mockImplementation(async () => {
      const data = store[`${cId}/${docId}`];
      return { exists: data !== undefined, data: () => data };
    }),
    set: jest.fn().mockImplementation(async (data: any, options?: any) => {
      if (options?.merge && store[`${cId}/${docId}`]) {
        store[`${cId}/${docId}`] = { ...store[`${cId}/${docId}`], ...data };
      } else {
        store[`${cId}/${docId}`] = data;
      }
    }),
    update: jest.fn().mockImplementation(async (updates: any) => {
      store[`${cId}/${docId}`] = { ...(store[`${cId}/${docId}`] || {}), ...updates };
    }),
    collection: (subCol: string) => mockCollection(`${cId}/${docId}/${subCol}`),
  };
};

const mockQuery = (colPath: string, filters: Array<[string, any]>) => {
  const getFn = jest.fn().mockImplementation(async () => {
    const docs: any[] = [];
    for (const [key, val] of Object.entries(store)) {
      if (key.startsWith(`${colPath}/`)) {
        const matches = filters.every(([field, value]) => val[field] === value);
        if (matches) {
          const docId = key.split('/').pop();
          docs.push({ id: docId, ref: _mockDoc(colPath, docId), data: () => val });
        }
      }
    }
    return { empty: docs.length === 0, docs };
  });

  return {
    where: (field: string, op: string, value: any) => mockQuery(colPath, [...filters, [field, value]]),
    get: getFn,
  };
};

const mockCollection = (colPath: string) => ({
  doc: (dId?: string) => _mockDoc(colPath, dId),
  where: (field: string, op: string, value: any) => mockQuery(colPath, [[field, value]]),
});

const mockFirestore = {
  collection: (cId: string) => mockCollection(cId),
  batch: () => {
    const ops: Array<() => void> = [];
    return {
      set: (ref: any, data: any, options?: any) => ops.push(() => ref.set(data, options)),
      update: (ref: any, data: any) => ops.push(() => ref.update(data)),
      commit: async () => {
        for (const op of ops) await op();
      },
    };
  },
  FieldValue: { serverTimestamp: () => 'SERVER_TS' },
};

jest.mock('firebase-admin', () => ({
  apps: [true],
  initializeApp: jest.fn(),
  firestore: Object.assign(jest.fn(() => mockFirestore), {
    FieldValue: { serverTimestamp: () => 'SERVER_TS' },
  }),
}));

const mockUpdateAccountPayouts = jest.fn<() => Promise<{ success: boolean }>>().mockResolvedValue({ success: true });
jest.mock('../../lib/stripe', () => ({
  stripe: {
    updateAccountPayouts: (...args: any[]) => mockUpdateAccountPayouts(...(args as [])),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  applyPayoutHold,
  releasePayoutHold,
  getPayoutHoldStatus,
} = require('../payoutHoldService');

describe('Payout Hold & Financial Isolation Service (Phase 9)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);

    store['users/artist_1'] = {
      uid: 'artist_1',
      displayName: 'Electro Pulse',
      stripeConnectAccountId: 'acct_stripe_123',
      complianceHold: false,
      monetizationStatus: 'ACTIVE',
    };
    store['artistProfiles/artist_1'] = {
      artistId: 'artist_1',
      complianceHold: false,
      monetizationStatus: 'ACTIVE',
    };
  });

  it('applies payout hold, sets complianceHold flag, and pauses Stripe payouts', async () => {
    const hold = await applyPayoutHold(mockFirestore as any, 'risk_officer_1', {
      creatorId: 'artist_1',
      reasonCode: PayoutHoldReasonCode.PAYOUT_HOLD_FRAUD,
      notes: 'Suspicious sudden spike in high-value tips from single IP.',
    });

    expect(hold.holdId).toBeDefined();
    expect(hold.reasonCode).toBe(PayoutHoldReasonCode.PAYOUT_HOLD_FRAUD);
    expect(hold.status).toBe('ACTIVE');

    const user = store['users/artist_1'];
    expect(user.complianceHold).toBe(true);
    expect(user.payoutHoldReason).toBe(PayoutHoldReasonCode.PAYOUT_HOLD_FRAUD);

    expect(mockUpdateAccountPayouts).toHaveBeenCalledWith('acct_stripe_123', true);

    // Verify audit log
    const auditKeys = Object.keys(store).filter((k) => k.startsWith('auditLogs/'));
    expect(auditKeys.length).toBe(1);
    expect(store[auditKeys[0]].action).toBe('PAYOUT_HOLD_APPLIED_PAYOUT_HOLD_FRAUD');
  });

  it('preserves complianceHold when one hold is released but another remains active', async () => {
    store['payoutHolds/hold_1'] = {
      holdId: 'hold_1',
      creatorId: 'artist_1',
      reasonCode: PayoutHoldReasonCode.PAYOUT_HOLD_FRAUD,
      status: 'ACTIVE',
    };
    store['payoutHolds/hold_2'] = {
      holdId: 'hold_2',
      creatorId: 'artist_1',
      reasonCode: PayoutHoldReasonCode.PAYOUT_HOLD_CHARGEBACK,
      status: 'ACTIVE',
    };
    store['users/artist_1'].complianceHold = true;

    const result = await releasePayoutHold(mockFirestore as any, 'risk_officer_1', {
      holdId: 'hold_1',
      notes: 'Fraud review cleared, but chargeback hold remains.',
    });

    expect(result.success).toBe(true);
    expect(result.remainingActiveHolds).toBe(1);
    expect(store['payoutHolds/hold_1'].status).toBe('RELEASED');

    // complianceHold should remain TRUE because hold_2 is still active
    const user = store['users/artist_1'];
    expect(user.complianceHold).toBe(true);
    expect(user.payoutHoldReason).toBe(PayoutHoldReasonCode.PAYOUT_HOLD_CHARGEBACK);
  });

  it('fully clears complianceHold and unpauses Stripe payouts when last hold is released', async () => {
    store['payoutHolds/hold_only'] = {
      holdId: 'hold_only',
      creatorId: 'artist_1',
      reasonCode: PayoutHoldReasonCode.PAYOUT_HOLD_MANUAL,
      status: 'ACTIVE',
    };
    store['users/artist_1'].complianceHold = true;

    const result = await releasePayoutHold(mockFirestore as any, 'risk_officer_1', {
      holdId: 'hold_only',
      notes: 'Manual KYC compliance verification passed.',
    });

    expect(result.success).toBe(true);
    expect(result.remainingActiveHolds).toBe(0);

    const user = store['users/artist_1'];
    expect(user.complianceHold).toBe(false);
    expect(user.payoutHoldReason).toBeNull();

    expect(mockUpdateAccountPayouts).toHaveBeenCalledWith('acct_stripe_123', false);
  });

  it('retrieves accurate payout hold status', async () => {
    store['payoutHolds/h1'] = {
      holdId: 'h1',
      creatorId: 'artist_1',
      reasonCode: PayoutHoldReasonCode.PAYOUT_HOLD_SANCTIONS,
      status: 'ACTIVE',
    };

    const status = await getPayoutHoldStatus(mockFirestore as any, 'artist_1');
    expect(status.isHeld).toBe(true);
    expect(status.totalActiveHolds).toBe(1);
    expect(status.primaryReasonCode).toBe(PayoutHoldReasonCode.PAYOUT_HOLD_SANCTIONS);
  });
});
