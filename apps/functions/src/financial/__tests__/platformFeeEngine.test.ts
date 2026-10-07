import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { calculatePlatformFee } from '../platformFeeEngine';

const mockSet = jest.fn().mockResolvedValue({} as never);
const mockUpdate = jest.fn().mockResolvedValue({} as never);
const mockGet = jest.fn();
const mockAdd = jest.fn().mockResolvedValue({ id: 'audit_fee_1' } as never);

const mockDoc = jest.fn(() => ({
  set: mockSet,
  update: mockUpdate,
  get: mockGet,
}));

const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  add: mockAdd,
  get: mockGet,
}));

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  apps: ['[DEFAULT]'],
  firestore: Object.assign(
    () => ({
      collection: mockCollection,
      doc: mockDoc,
    }),
    {
      FieldValue: {
        serverTimestamp: () => 'MOCK_TIMESTAMP',
      },
    },
  ),
}));

import {
  createFeeRuleDraft,
  approveFeeRule,
  getFeeCalculationQuote,
} from '../platformFeeCallables';

describe('Platform Fee Calculation Engine & Approval Governance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates 0% platform fee correctly (Production Default)', () => {
    const res = calculatePlatformFee(1000, 0); // $10.00 @ 0.00%
    expect(res.platformFeeCents).toBe(0);
    expect(res.netAmountCents).toBe(1000);
    expect(res.effectivePercentage).toBe(0);
  });

  it('calculates standard 6% platform fee correctly (600 bps)', () => {
    const res = calculatePlatformFee(1000, 600); // $10.00 @ 6.00%
    expect(res.platformFeeCents).toBe(60);
    expect(res.netAmountCents).toBe(940);
    expect(res.effectivePercentage).toBe(6);

    const res100 = calculatePlatformFee(10000, 600); // $100.00 @ 6.00%
    expect(res100.platformFeeCents).toBe(600);
    expect(res100.netAmountCents).toBe(9400);
    expect(res100.effectivePercentage).toBe(6);

    // Test floor rounding on fractional cents ($10.01 @ 6% = 60.06 cents -> 60 cents)
    const resOdd = calculatePlatformFee(1001, 600);
    expect(resOdd.platformFeeCents).toBe(60);
    expect(resOdd.netAmountCents).toBe(941);
  });

  it('enforces configured minimum fee bounds', () => {
    const res = calculatePlatformFee(200, 500, 25); // $2.00 @ 5% = 10 cents, but min is 25 cents
    expect(res.platformFeeCents).toBe(25);
    expect(res.netAmountCents).toBe(175);
  });

  it('enforces configured maximum fee bounds', () => {
    const res = calculatePlatformFee(50000, 500, undefined, 1500); // $500.00 @ 5% = $25.00, capped at $15.00
    expect(res.platformFeeCents).toBe(1500);
    expect(res.netAmountCents).toBe(48500);
  });

  it('rejects invalid fee basis points beyond 10.00% (1000 bps)', () => {
    expect(() => calculatePlatformFee(1000, 1500)).toThrow('feeBasisPoints must be an integer between 0 and 1000');
  });

  it('creates fee rule draft with audit event', async () => {
    const res = await (createFeeRuleDraft as any).run({
      auth: { uid: 'finance_admin_1', token: { platformRole: 'FINANCE_ADMIN' } },
      data: {
        name: 'Updated Live Tips Fee',
        environment: 'DEVELOPMENT',
        feeBasisPoints: 450, // 4.50%
        reasonForChange: 'Competitive adjustment for festival season.',
      },
    });

    expect(res.ok).toBe(true);
    expect(res.ruleId).toBeDefined();
    expect(mockSet).toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalled();
  });

  it('enforces separation of duties (author cannot self-approve as secondary approver)', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        authorUid: 'admin_david',
        feeBasisPoints: 500,
      }),
    } as never);

    await expect(
      (approveFeeRule as any).run({
        auth: { uid: 'admin_david', token: { platformRole: 'SUPER_ADMIN' } },
        data: {
          ruleId: 'fee_rule_123',
          approverRole: 'SECONDARY_EXECUTIVE',
        },
      }),
    ).rejects.toThrow('Separation of duties violation');
  });

  it('returns valid fee quote from callable', async () => {
    const res = await (getFeeCalculationQuote as any).run({
      auth: { uid: 'fan_user_1' },
      data: {
        amountCents: 2000,
        transactionType: 'LIVE_TIP',
      },
    });

    expect(res.grossAmountCents).toBe(2000);
    expect(res.platformFeeCents).toBe(120);
    expect(res.netAmountCents).toBe(1880);
    expect(res.currency).toBe('USD');
  });
});
