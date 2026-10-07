import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockSet = jest.fn().mockResolvedValue({} as never);
const mockGet = jest.fn();
const mockAdd = jest.fn().mockResolvedValue({ id: 'audit_789' } as never);

const mockDoc = jest.fn(() => ({
  set: mockSet,
  get: mockGet,
}));

const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  add: mockAdd,
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
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

import { updateComplianceObligation } from '../complianceCallables';
import { runDailyReconciliation } from '../../financial/reconciliationService';

describe('Admin RBAC & Compliance Callables', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthenticated requests to compliance obligations', async () => {
    await expect(
      (updateComplianceObligation as any).run({
        auth: null,
        data: { id: 'COMP-01-FTC-ACT', status: 'evidence_collected' },
      }),
    ).rejects.toThrow('Authentication required.');
  });

  it('rejects ordinary fan persona from updating compliance obligations', async () => {
    await expect(
      (updateComplianceObligation as any).run({
        auth: { uid: 'fan_123', token: { platformRole: 'FAN' } },
        data: { id: 'COMP-01-FTC-ACT', status: 'evidence_collected' },
      }),
    ).rejects.toThrow('Compliance officer role required.');
  });

  it('allows COMPLIANCE_ADMIN to update obligation status', async () => {
    const result = await (updateComplianceObligation as any).run({
      auth: { uid: 'officer_1', token: { platformRole: 'COMPLIANCE_ADMIN' } },
      data: { id: 'COMP-01-FTC-ACT', status: 'evidence_collected', evidenceLocation: 'docs/matrix.md' },
    });

    expect(result.ok).toBe(true);
    expect(mockSet).toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalled(); // Audit record logged
  });

  it('runs daily reconciliation and calculates balances', async () => {
    mockGet.mockResolvedValueOnce({
      docs: [
        { data: () => ({ amountCents: 5000, platformFeeCents: 250 }) },
        { data: () => ({ amountCents: 2000, platformFeeCents: 100 }) },
      ],
    } as never); // Tips
    mockGet.mockResolvedValueOnce({
      docs: [{ data: () => ({ amountCents: 1000 }) }],
    } as never); // Refunds

    const report = await (runDailyReconciliation as any).run({
      auth: { uid: 'finance_1', token: { platformRole: 'FINANCE_ADMIN' } },
      data: {},
    });

    expect(report.totalTipsGrossCents).toBe(7000);
    expect(report.totalPlatformFeesCents).toBe(350);
    expect(report.totalRefundsCents).toBe(1000);
    expect(report.totalNetPayoutsCents).toBe(5650);
    expect(report.status).toBe('BALANCED');
    expect(mockSet).toHaveBeenCalled();
  });
});
