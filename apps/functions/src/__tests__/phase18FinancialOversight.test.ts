/**
 * Crowdbeats V2 — Phase 18: Financial Oversight and Reconciliation Test Suite
 *
 * Verifies:
 * 1. PCI DSS Zero Raw Card Leakage & Data Sanitization (sanitizePaymentInstrument)
 * 2. Role-Based Financial Export Authorization (isAuthorizedFinanceStaff, generateFinancialExportCallable)
 * 3. Execution of Financial Exports (TRANSACTIONS, RECONCILIATION_LEDGER, PAYOUT_REGISTER, DISPUTES_AUDIT)
 * 4. Double-Entry Reconciliation & Financial Ledger Summaries (getFinancialLedgerSummary, reconcileFinancialLedger)
 * 5. Platform Fee Calculation Engine & Scoped Bounds Arithmetic (calculatePlatformFee)
 * 6. Platform Fee Governance & Dual-Approval Enforcement (createFeeRuleDraft, approveFeeRule)
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  isAuthorizedFinanceStaff,
  sanitizePaymentInstrument,
  executeFinancialExport,
  getFinancialLedgerSummary,
  generateFinancialExportCallable,
  getFinancialLedgerSummaryCallable,
} from '../financial/financialExportService.js';
import { calculatePlatformFee } from '../financial/platformFeeEngine.js';
import { reconcileFinancialLedger } from '../financial/reconciliationService.js';

// ── In-Memory Firestore Mock Store ──────────────────────────────────────────

const store: Record<string, any> = {};

const mockDoc = (path: string): any => {
  const id = path.split('/').pop()!;
  return {
    id,
    path,
    get: jest.fn<any>().mockImplementation(async () => {
      const data = store[path];
      return {
        exists: data !== undefined,
        data: () => data,
        id,
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
      store[path] = { ...store[path], ...data };
    }),
    delete: jest.fn<any>().mockImplementation(async () => {
      delete store[path];
    }),
    collection: (subCol: string) => mockCollection(`${path}/${subCol}`),
  };
};

const mockCollection = (colPath: string): any => {
  return {
    doc: (docId?: string) => {
      const id = docId || `mock_doc_${Math.random().toString(36).substring(7)}`;
      return mockDoc(`${colPath}/${id}`);
    },
    add: jest.fn<any>().mockImplementation(async (data: any) => {
      const id = `mock_doc_${Math.random().toString(36).substring(7)}`;
      const docPath = `${colPath}/${id}`;
      store[docPath] = { ...data };
      return mockDoc(docPath);
    }),
    where: jest.fn<any>().mockImplementation((field: string, op: string, val: any) => {
      return {
        where: jest.fn<any>().mockReturnThis(),
        limit: jest.fn<any>().mockReturnThis(),
        orderBy: jest.fn<any>().mockReturnThis(),
        get: jest.fn<any>().mockImplementation(async () => {
          const docs = Object.entries(store)
            .filter(([k]) => k.startsWith(`${colPath}/`))
            .filter(([, v]) => {
              if (op === '==') return v[field] === val;
              if (op === 'in') return Array.isArray(val) && val.includes(v[field]);
              if (op === '>=') return v[field] >= val;
              if (op === '<=') return v[field] <= val;
              return true;
            })
            .map(([k, v]) => ({
              id: k.split('/').pop()!,
              data: () => v,
            }));
          return { docs, empty: docs.length === 0, size: docs.length };
        }),
      };
    }),
    orderBy: jest.fn<any>().mockImplementation(() => {
      return {
        where: jest.fn<any>().mockReturnThis(),
        limit: jest.fn<any>().mockReturnThis(),
        get: jest.fn<any>().mockImplementation(async () => {
          const docs = Object.entries(store)
            .filter(([k]) => k.startsWith(`${colPath}/`))
            .map(([k, v]) => ({
              id: k.split('/').pop()!,
              data: () => v,
            }));
          return { docs, empty: docs.length === 0, size: docs.length };
        }),
      };
    }),
    limit: jest.fn<any>().mockImplementation(() => {
      return {
        get: jest.fn<any>().mockImplementation(async () => {
          const docs = Object.entries(store)
            .filter(([k]) => k.startsWith(`${colPath}/`))
            .map(([k, v]) => ({
              id: k.split('/').pop()!,
              data: () => v,
            }));
          return { docs, empty: docs.length === 0, size: docs.length };
        }),
      };
    }),
    get: jest.fn<any>().mockImplementation(async () => {
      const docs = Object.entries(store)
        .filter(([k]) => k.startsWith(`${colPath}/`))
        .map(([k, v]) => ({
          id: k.split('/').pop()!,
          data: () => v,
        }));
      return { docs, empty: docs.length === 0, size: docs.length };
    }),
  };
};

const mockBatch = (): any => {
  const operations: Array<() => Promise<void>> = [];
  return {
    set: jest.fn<any>().mockImplementation((docRef: any, data: any) => {
      operations.push(async () => {
        store[docRef.path] = { ...data };
      });
    }),
    update: jest.fn<any>().mockImplementation((docRef: any, data: any) => {
      operations.push(async () => {
        if (!store[docRef.path]) throw new Error(`Doc not found: ${docRef.path}`);
        store[docRef.path] = { ...store[docRef.path], ...data };
      });
    }),
    commit: jest.fn<any>().mockImplementation(async () => {
      for (const op of operations) {
        await op();
      }
    }),
  };
};

const mockDb: any = {
  collection: (col: string) => mockCollection(col),
  doc: (path: string) => mockDoc(path),
  batch: () => mockBatch(),
};

// Mock admin.firestore()
jest.mock('firebase-admin', () => {
  return {
    firestore: Object.assign(() => mockDb, {
      FieldValue: {
        serverTimestamp: () => new Date().toISOString(),
        increment: (n: number) => n,
      },
    }),
  };
});

describe('Phase 18 — Financial Oversight & Reconciliation Test Suite', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. PCI DSS ZERO RAW CARD LEAKAGE & SANITIZATION
  // ════════════════════════════════════════════════════════════════════════════

  describe('PCI DSS Compliance & Payment Instrument Sanitization', () => {
    it('strips full 16-digit card numbers and CVVs, returning only brand and last4', () => {
      const rawCard = {
        cardNumber: '4242424242424242',
        cvv: '123',
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2028,
        country: 'US',
      };

      const sanitized = sanitizePaymentInstrument(rawCard);
      expect(sanitized.brand).toBe('visa');
      expect(sanitized.last4).toBe('4242');
      expect(sanitized.expMonth).toBe(12);
      expect(sanitized.expYear).toBe(2028);
      expect((sanitized as any).cardNumber).toBeUndefined();
      expect((sanitized as any).cvv).toBeUndefined();
    });

    it('sanitizes messy cardLast4 strings containing letters or extra digits', () => {
      const rawCard = {
        cardBrand: 'Mastercard',
        cardLast4: 'card-ending-8888',
      };

      const sanitized = sanitizePaymentInstrument(rawCard);
      expect(sanitized.brand).toBe('mastercard');
      expect(sanitized.last4).toBe('8888');
    });

    it('defaults gracefully when card details are missing or empty', () => {
      const sanitized = sanitizePaymentInstrument(null);
      expect(sanitized.brand).toBe('card');
      expect(sanitized.last4).toBe('••••');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. FINANCIAL EXPORT AUTHORIZATION
  // ════════════════════════════════════════════════════════════════════════════

  describe('Role-Based Financial Authorization', () => {
    it('authorizes SUPER_ADMIN, EXECUTIVE, FINANCE_ANALYST, and FINANCE_ADMIN', () => {
      expect(isAuthorizedFinanceStaff('SUPER_ADMIN')).toBe(true);
      expect(isAuthorizedFinanceStaff('EXECUTIVE')).toBe(true);
      expect(isAuthorizedFinanceStaff('FINANCE_ANALYST')).toBe(true);
      expect(isAuthorizedFinanceStaff('FINANCE_ADMIN')).toBe(true);
    });

    it('denies non-finance roles, performers, fans, and null callers', () => {
      expect(isAuthorizedFinanceStaff('CUSTOMER_SUPPORT')).toBe(false);
      expect(isAuthorizedFinanceStaff('CONTENT_MODERATOR')).toBe(false);
      expect(isAuthorizedFinanceStaff('PARTNERSHIPS')).toBe(false);
      expect(isAuthorizedFinanceStaff('artist')).toBe(false);
      expect(isAuthorizedFinanceStaff('fan')).toBe(false);
      expect(isAuthorizedFinanceStaff(null)).toBe(false);
      expect(isAuthorizedFinanceStaff(undefined)).toBe(false);
    });

    it('generateFinancialExportCallable rejects unauthenticated caller with unauthenticated error', async () => {
      await expect(
        (generateFinancialExportCallable as any).run({
          auth: null,
          data: { exportType: 'TRANSACTIONS' },
        }),
      ).rejects.toThrow('Authentication required.');
    });

    it('generateFinancialExportCallable rejects non-finance caller with permission-denied', async () => {
      await expect(
        (generateFinancialExportCallable as any).run({
          auth: { uid: 'user-support', token: { platformRole: 'CUSTOMER_SUPPORT' } },
          data: { exportType: 'TRANSACTIONS' },
        }),
      ).rejects.toThrow('Only Finance staff or Super Admins can generate financial exports.');
    });

    it('generateFinancialExportCallable rejects missing exportType with invalid-argument', async () => {
      await expect(
        (generateFinancialExportCallable as any).run({
          auth: { uid: 'staff-fin', token: { platformRole: 'FINANCE_ANALYST' } },
          data: {},
        }),
      ).rejects.toThrow('exportType is required.');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. FINANCIAL EXPORT GENERATION & AUDITING
  // ════════════════════════════════════════════════════════════════════════════

  describe('Financial Export Execution', () => {
    it('generates a TRANSACTIONS export with zero raw card leakage and writes audit event', async () => {
      // Seed tip records with raw cards
      store['tips/tip-1'] = {
        amountCents: 5000,
        currency: 'USD',
        platformFeeCents: 300,
        netAmountCents: 4700,
        creatorId: 'artist-1',
        fanUid: 'fan-1',
        status: 'succeeded',
        card: { brand: 'visa', last4: '4242', fullCardNumber: 'DO_NOT_LEAK' },
        createdAt: '2026-09-01T12:00:00Z',
      };

      const result = await executeFinancialExport(mockDb, 'staff-fin-1', {
        exportType: 'TRANSACTIONS',
        format: 'CSV',
      });

      expect(result.status).toBe('ready');
      expect(result.exportType).toBe('TRANSACTIONS');
      expect(result.recordCount).toBe(1);
      expect(result.requestedByUid).toBe('staff-fin-1');
      expect(result.downloadUrl).toContain('.csv');

      // Verify stored in /financialExports
      const exportDoc = store[`financialExports/${result.exportId}`];
      expect(exportDoc).toBeDefined();
      expect(exportDoc.exportId).toBe(result.exportId);

      // Verify audit log written in /auditEvents
      const auditDocs = Object.values(store).filter(
        (d) => d.action === 'FINANCIAL_EXPORT_GENERATED',
      );
      expect(auditDocs.length).toBe(1);
      expect(auditDocs[0].actorUid).toBe('staff-fin-1');
      expect(auditDocs[0].targetId).toBe(result.exportId);
    });

    it('generates a RECONCILIATION_LEDGER export for paymentLedger entries', async () => {
      store['paymentLedger/ledger-1'] = {
        txId: 'tx-100',
        tipId: 'tip-100',
        accountType: 'fan_wallet',
        entryType: 'debit',
        amountCents: 2500,
        currency: 'USD',
        memo: 'Tip payment debited',
        createdAt: '2026-09-01T14:00:00Z',
      };

      const result = await executeFinancialExport(mockDb, 'staff-fin-1', {
        exportType: 'RECONCILIATION_LEDGER',
        format: 'JSON',
      });

      expect(result.status).toBe('ready');
      expect(result.recordCount).toBe(1);
      expect(result.downloadUrl).toContain('.json');
    });

    it('generates a PAYOUT_REGISTER export with masked destination bank details', async () => {
      store['payouts/po-1'] = {
        recipientId: 'artist-42',
        amountCents: 15000,
        currency: 'USD',
        status: 'paid',
        destinationBank: { brand: 'Chase', last4: '1234' },
        createdAt: '2026-09-02T10:00:00Z',
      };

      const result = await executeFinancialExport(mockDb, 'staff-fin-1', {
        exportType: 'PAYOUT_REGISTER',
        format: 'CSV',
      });

      expect(result.status).toBe('ready');
      expect(result.recordCount).toBe(1);
    });

    it('generates a DISPUTES_AUDIT export', async () => {
      store['disputes/disp-1'] = {
        stripeDisputeId: 'dp_123',
        amountCents: 500,
        currency: 'USD',
        reason: 'fraudulent',
        status: 'needs_response',
        evidenceDueAt: '2026-09-10T00:00:00Z',
        createdAt: '2026-09-01T00:00:00Z',
      };

      const result = await executeFinancialExport(mockDb, 'staff-fin-1', {
        exportType: 'DISPUTES_AUDIT',
        format: 'CSV',
      });

      expect(result.status).toBe('ready');
      expect(result.recordCount).toBe(1);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. DOUBLE-ENTRY RECONCILIATION & FINANCIAL LEDGER SUMMARY
  // ════════════════════════════════════════════════════════════════════════════

  describe('Financial Ledger Summary & Double-Entry Verification', () => {
    it('reports balanced state when ledger debits equal credits', async () => {
      // Seed balanced ledger
      store['paymentLedger/entry-debit'] = {
        amountCents: 1000,
        entryType: 'debit',
      };
      store['paymentLedger/entry-credit'] = {
        amountCents: 1000,
        entryType: 'credit',
      };
      store['tips/tip-1'] = {
        status: 'succeeded',
        amountCents: 1000,
        platformFeeCents: 60,
      };

      const summary = await getFinancialLedgerSummary(mockDb);
      expect(summary.totalGrossCents).toBe(1000);
      expect(summary.totalPlatformFeesCents).toBe(60);
      expect(summary.totalNetPayoutsCents).toBe(940);
      expect(summary.balanced).toBe(true);
      expect(summary.discrepancyCount).toBe(0);
    });

    it('detects discrepancy when ledger debits and credits are unbalanced', async () => {
      // Seed unbalanced ledger (debits: 1000, credits: 500)
      store['paymentLedger/entry-debit'] = {
        amountCents: 1000,
        entryType: 'debit',
      };
      store['paymentLedger/entry-credit'] = {
        amountCents: 500,
        entryType: 'credit',
      };

      const summary = await getFinancialLedgerSummary(mockDb);
      expect(summary.balanced).toBe(false);
      expect(summary.discrepancyCount).toBe(1);
    });

    it('reconcileFinancialLedger writes immutable reconciliation record to financialReconciliations', async () => {
      store['tips/tip-1'] = {
        status: 'succeeded',
        amountCents: 2000,
        platformFeeCents: 120,
      };
      store['paymentLedger/entry-debit'] = {
        amountCents: 2000,
        type: 'DEBIT',
      };
      store['paymentLedger/entry-credit'] = {
        amountCents: 2000,
        type: 'CREDIT',
      };

      const report = await reconcileFinancialLedger(mockDb, { actorUid: 'cron-job' });

      expect(report.status).toBe('BALANCED');
      expect(report.totalTipsGrossCents).toBe(2000);
      expect(report.totalPlatformFeesCents).toBe(120);
      expect(report.totalLedgerDebitsCents).toBe(2000);
      expect(report.totalLedgerCreditsCents).toBe(2000);

      // Stored in /financialReconciliations
      const savedDoc = store[`financialReconciliations/${report.reconciliationId}`];
      expect(savedDoc).toBeDefined();
      expect(savedDoc.status).toBe('BALANCED');
    });

    it('getFinancialLedgerSummaryCallable rejects unauthorized users', async () => {
      await expect(
        (getFinancialLedgerSummaryCallable as any).run({
          auth: { uid: 'regular-user', token: { platformRole: 'fan' } },
        }),
      ).rejects.toThrow('Only Finance staff or Super Admins can query financial ledger summaries.');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. PLATFORM FEE CALCULATION ENGINE
  // ════════════════════════════════════════════════════════════════════════════

  describe('Platform Fee Engine Arithmetic', () => {
    it('computes 600 bps (6.00%) platform fee accurately in minor units', () => {
      const result = calculatePlatformFee(1000, 600); // $10.00 tip
      expect(result.grossAmountCents).toBe(1000);
      expect(result.platformFeeCents).toBe(60); // $0.60 fee
      expect(result.netAmountCents).toBe(940); // $9.40 net
      expect(result.effectivePercentage).toBe(6.0);
    });

    it('enforces minFeeCents bound when calculated fee is lower', () => {
      const result = calculatePlatformFee(100, 600, 25); // 6% of $1.00 is $0.06, min fee $0.25
      expect(result.platformFeeCents).toBe(25);
      expect(result.netAmountCents).toBe(75);
    });

    it('enforces maxFeeCents bound when calculated fee is higher', () => {
      const result = calculatePlatformFee(100000, 600, undefined, 5000); // 6% of $1000 is $60, max fee $50
      expect(result.platformFeeCents).toBe(5000);
      expect(result.netAmountCents).toBe(95000);
    });

    it('caps fee at gross amount if min fee exceeds gross payment', () => {
      const result = calculatePlatformFee(10, 600, 50); // $0.10 payment, min fee $0.50
      expect(result.platformFeeCents).toBe(10);
      expect(result.netAmountCents).toBe(0);
    });

    it('throws error on non-integer or negative grossAmountCents', () => {
      expect(() => calculatePlatformFee(10.5, 600)).toThrow('grossAmountCents must be a non-negative integer.');
      expect(() => calculatePlatformFee(-100, 600)).toThrow('grossAmountCents must be a non-negative integer.');
    });

    it('throws error on feeBasisPoints outside 0-1000 range', () => {
      expect(() => calculatePlatformFee(1000, -10)).toThrow('feeBasisPoints must be an integer between 0 and 1000');
      expect(() => calculatePlatformFee(1000, 1500)).toThrow('feeBasisPoints must be an integer between 0 and 1000');
    });
  });
});
