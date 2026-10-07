/**
 * Crowdbeats V2 — Stripe Connect & Dispute Webhook Handler Tests (Phase 10 Compliance)
 *
 * Unit tests verifying:
 * 1. account.updated syncs charges/payouts capability and sets KYC states.
 * 2. account.updated with disabled_reason triggers compliance hold.
 * 3. account.application.deauthorized demonetizes creator and removes Stripe account.
 * 4. charge.dispute.created records dispute and marks tip disputed.
 * 5. charge.refunded records ledger reversal and marks tip refunded.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const store: Record<string, Record<string, unknown>> = {};

const _mockDoc = (cId: string, dId?: string) => {
  const docId = dId || `doc_${Math.random()}`;
  return {
    id: docId,
    ref: { id: docId },
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
          docs.push({
            id: docId,
            ref: _mockDoc(colPath, docId),
            data: () => val,
          });
        }
      }
    }
    return { empty: docs.length === 0, docs };
  });

  return {
    where: (field: string, op: string, value: any) => mockQuery(colPath, [...filters, [field, value]]),
    limit: (n: number) => ({ get: getFn }),
    get: getFn,
  };
};

const mockFirestore = {
  collection: (cId: string) => ({
    doc: (dId?: string) => _mockDoc(cId, dId),
    where: (field: string, op: string, value: any) => mockQuery(cId, [[field, value]]),
  }),
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  handleAccountUpdated,
  handleAccountApplicationDeauthorized,
  handleDisputeCreated,
  handleChargeRefunded,
} = require('../connectWebhookHandlers');

describe('Stripe Connect & Dispute Webhooks (Phase 10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);

    store['users/creator_1'] = {
      uid: 'creator_1',
      displayName: 'DJ Pulse',
      stripeConnectAccountId: 'acct_pulse_123',
      stripeChargesEnabled: false,
      stripePayoutsEnabled: false,
      complianceHold: false,
      monetizationStatus: 'ACTIVE',
    };
    store['artistProfiles/creator_1'] = {
      artistId: 'creator_1',
      stripeAccountId: 'acct_pulse_123',
    };
    store['tips/tip_disputed_1'] = {
      tipId: 'tip_disputed_1',
      stripePaymentIntentId: 'pi_disp_123',
      recipientId: 'creator_1',
      amountCents: 5000,
      fanUid: 'fan_1',
      status: 'succeeded',
    };
  });

  describe('handleAccountUpdated', () => {
    it('syncs active verification when charges and payouts are enabled', async () => {
      await handleAccountUpdated(mockFirestore as any, {
        id: 'acct_pulse_123',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      });

      const user = store['users/creator_1'];
      expect(user.stripeChargesEnabled).toBe(true);
      expect(user.stripePayoutsEnabled).toBe(true);
      expect(user.stripeVerificationState).toBe('verified');
      expect(user.bankPayoutReadiness).toBe('ready');
      expect(user.complianceHold).toBe(false);
    });

    it('places compliance hold when Stripe disables account due to requirements', async () => {
      await handleAccountUpdated(mockFirestore as any, {
        id: 'acct_pulse_123',
        charges_enabled: false,
        payouts_enabled: false,
        requirements: {
          disabled_reason: 'requirements.past_due',
          currently_due: ['individual.verification.document'],
        },
      });

      const user = store['users/creator_1'];
      expect(user.stripeVerificationState).toBe('restricted');
      expect(user.bankPayoutReadiness).toBe('restricted');
      expect(user.complianceHold).toBe(true);
      expect(user.payoutHoldReason).toContain('STRIPE_DISABLED');
    });
  });

  describe('handleAccountApplicationDeauthorized', () => {
    it('demonetizes creator and removes Stripe account reference', async () => {
      await handleAccountApplicationDeauthorized(mockFirestore as any, {
        account: 'acct_pulse_123',
      });

      const user = store['users/creator_1'];
      expect(user.stripeConnectAccountId).toBeNull();
      expect(user.monetizationStatus).toBe('DEMONETIZED');
      expect(user.complianceHold).toBe(true);
    });
  });

  describe('handleDisputeCreated', () => {
    it('creates dispute record and updates tip status to disputed', async () => {
      await handleDisputeCreated(mockFirestore as any, {
        id: 'dp_999',
        charge: 'ch_999',
        payment_intent: 'pi_disp_123',
        amount: 5000,
        reason: 'fraudulent',
        status: 'needs_response',
      });

      expect(store['disputes/dp_999']).toBeDefined();
      expect(store['disputes/dp_999'].tipId).toBe('tip_disputed_1');
      expect(store['tips/tip_disputed_1'].status).toBe('disputed');
    });
  });

  describe('handleChargeRefunded', () => {
    it('updates tip status to refunded and writes ledger reversal', async () => {
      await handleChargeRefunded(mockFirestore as any, {
        payment_intent: 'pi_disp_123',
      });

      expect(store['tips/tip_disputed_1'].status).toBe('refunded');

      const ledgerKeys = Object.keys(store).filter((k) => k.startsWith('paymentLedger/'));
      expect(ledgerKeys.length).toBe(1);
      expect(store[ledgerKeys[0]].entryType).toBe('TIP_REFUNDED');
      expect(store[ledgerKeys[0]].type).toBe('CREDIT_REVERSAL');
    });
  });
});
