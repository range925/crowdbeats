/**
 * Crowdbeats V2 — Phase 12 Operational Recommendations Test Suite
 *
 * Tests:
 * 1. Synthetic Health Probe execution & latency measurement
 * 2. Super Admin bootstrap authorization, custom claims, and audit event writing
 * 3. BigQuery table schema validation & Firestore-to-BigQuery mapping
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const store: Record<string, any> = {};

const mockDoc = (path: string): any => {
  const id = path.split('/').pop();
  return {
    id,
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
    delete: jest.fn<any>().mockImplementation(async () => {
      delete store[path];
    }),
  };
};

const mockCollection = (colPath: string): any => {
  return {
    doc: (docId?: string) => {
      const id = docId || `doc_${Math.random().toString(36).substring(7)}`;
      return mockDoc(`${colPath}/${id}`);
    },
    where: jest.fn<any>().mockImplementation((field: string, op: string, val: any) => {
      return {
        limit: jest.fn<any>().mockReturnThis(),
        get: jest.fn<any>().mockImplementation(async () => {
          const docs: any[] = [];
          for (const [k, v] of Object.entries(store)) {
            if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
              if (op === '==' && v[field] === val) {
                docs.push({ id: k.split('/').pop(), data: () => v, exists: true });
              }
            }
          }
          return { docs, empty: docs.length === 0, size: docs.length };
        }),
      };
    }),
    limit: jest.fn<any>().mockReturnThis(),
    get: jest.fn<any>().mockImplementation(async () => {
      const docs: any[] = [];
      for (const [k, v] of Object.entries(store)) {
        if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
          docs.push({ id: k.split('/').pop(), data: () => v, exists: true });
        }
      }
      return { docs, empty: docs.length === 0, size: docs.length };
    }),
  };
};

const mockSetCustomUserClaims = jest.fn<any>();

jest.mock('firebase-admin', () => {
  return {
    firestore: Object.assign(
      jest.fn(() => ({
        collection: (path: string) => mockCollection(path),
        doc: (path: string) => mockDoc(path),
      })),
      {
        FieldValue: {
          serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
          increment: jest.fn((n: number) => n),
        },
      }
    ),
    auth: () => ({
      setCustomUserClaims: mockSetCustomUserClaims,
    }),
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
      this.name = 'HttpsError';
    }
  },
}));

import { executeSyntheticProbe } from '../monitoring/syntheticProbe';
import { bootstrapSuperAdmin } from '../admin/bootstrapSuperAdmin';
import {
  BigQueryPaymentLedgerSchema,
  BigQueryTipsFactSchema,
  BigQueryAuditEventsSchema,
  mapLedgerDocToBigQueryRow,
} from '../../../../packages/contracts/src/analytics/bigquerySchema';

describe('Phase 12 Operational Recommendations Test Suite', () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
    mockSetCustomUserClaims.mockReset();
  });

  describe('1. Synthetic Health Probe', () => {
    it('executes probe and returns healthy status with latency metrics', async () => {
      const result = await executeSyntheticProbe('test_corr_probe');

      expect(result.status).toBe('HEALTHY');
      expect(result.checks.firestoreReadWrite).toBe(true);
      expect(result.checks.stripeConnectivity).toBe(true);
      expect(result.checks.ledgerAccessible).toBe(true);
      expect(result.latencyMs.total).toBeGreaterThanOrEqual(0);
      expect(result.version).toBe('0.9.0-phase12');
    });
  });

  describe('2. Super Admin Bootstrap', () => {
    it('rejects unauthenticated requests', async () => {
      await expect(
        (bootstrapSuperAdmin as any)({
          auth: null,
          data: {},
        })
      ).rejects.toThrow('User must be authenticated');
    });

    it('bootstraps root Super Admin when 0 super admins exist', async () => {
      process.env.BOOTSTRAP_SECRET_KEY = 'test_secret_123';
      const res = await (bootstrapSuperAdmin as any)({
        auth: { uid: 'david_naufahu_uid' },
        data: { secretKey: 'test_secret_123' },
      });

      expect(res.success).toBe(true);
      expect(mockSetCustomUserClaims).toHaveBeenCalledWith('david_naufahu_uid', {
        platformRole: 'SUPER_ADMIN',
        personaType: 'staff',
      });

      const userDoc = store['users/david_naufahu_uid'];
      expect(userDoc.platformRole).toBe('SUPER_ADMIN');
      expect(userDoc.personaType).toBe('staff');
    });
  });

  describe('3. BigQuery Export Schemas & Mappers', () => {
    it('defines valid BigQuery table schemas with partition and clustering', () => {
      expect(BigQueryPaymentLedgerSchema.tableName).toBe('payment_ledger');
      expect(BigQueryPaymentLedgerSchema.partitionField).toBe('created_at');
      expect(BigQueryPaymentLedgerSchema.clusteringFields).toContain('account_uid');

      expect(BigQueryTipsFactSchema.tableName).toBe('tips_fact');
      expect(BigQueryAuditEventsSchema.tableName).toBe('audit_events');
    });

    it('maps Firestore payment ledger documents to BigQuery typed row', () => {
      const doc = {
        accountUid: 'artist_99',
        type: 'credit',
        amountCents: 5000,
        currency: 'USD',
        referenceType: 'tip',
        referenceId: 'tip_123',
        correlationId: 'corr_xyz',
      };

      const row = mapLedgerDocToBigQueryRow(doc, 'ledger_abc');

      expect(row.ledger_id).toBe('ledger_abc');
      expect(row.account_uid).toBe('artist_99');
      expect(row.entry_type).toBe('CREDIT');
      expect(row.amount_cents).toBe(5000);
      expect(row.currency).toBe('USD');
      expect(row.reference_id).toBe('tip_123');
      expect(row.correlation_id).toBe('corr_xyz');
      expect(row.created_at).toBeDefined();
    });
  });
});
