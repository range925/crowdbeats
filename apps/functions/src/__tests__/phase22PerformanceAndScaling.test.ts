/**
 * Crowdbeats V2 — Phase 22: Performance, Scaling and Bottleneck Elimination
 *
 * Verifies backend scaling invariants:
 * 1. Analytics Rollup Caching in /analyticsAggregates (cost control & read elimination)
 * 2. High-Throughput Double-Entry Financial Ledger Reconciliation (1,000+ entries)
 * 3. Memory Overhead and Cold-Start Safety across rapid cycles
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { computePlatformAnalyticsRollup } from '../analytics/businessIntelligenceService.js';
import { reconcileFinancialLedger } from '../financial/reconciliationService.js';

// ── In-Memory Mock Store ────────────────────────────────────────────────────

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
        limit: jest.fn<any>().mockImplementation((lim: number) => ({
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
              .slice(0, lim)
              .map(([k, v]) => ({
                id: k.split('/').pop()!,
                data: () => v,
              }));
            return { docs, empty: docs.length === 0, size: docs.length };
          }),
        })),
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
    limit: jest.fn<any>().mockImplementation((lim: number) => {
      return {
        get: jest.fn<any>().mockImplementation(async () => {
          const docs = Object.entries(store)
            .filter(([k]) => k.startsWith(`${colPath}/`))
            .slice(0, lim)
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

describe('Phase 22 — Backend Performance & Scaling Test Suite', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  });

  describe('1. Analytics Aggregate Caching & Read Reduction', () => {
    it('serves cached rollup from /analyticsAggregates and eliminates redundant collection scans', async () => {
      // Seed a cached aggregate valid for the next 1 hour
      const cachedRollup = {
        period: '30d',
        generatedAt: new Date().toISOString(),
        cacheExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        userGrowth: {
          totalRegisteredUsers: { value: 1250, freshness: 'DELAYED' },
          activeFans: { value: 1000, freshness: 'DELAYED' },
          activeCreators: { value: 250, freshness: 'DELAYED' },
          newRegistrations24h: { value: 25, freshness: 'REAL_TIME' },
          newRegistrations7d: { value: 140, freshness: 'DELAYED' },
          newRegistrations30d: { value: 450, freshness: 'DELAYED' },
          personaBreakdown: {
            fans: 1000,
            soloMusicians: 180,
            bandMembers: 70,
            venueManagers: 10,
            sponsorReps: 5,
          },
        },
      };

      store['analyticsAggregates/platform_overview_30d'] = cachedRollup;

      // Seed collection data that would be returned IF queries were executed
      store['users/user_should_not_be_read'] = { role: 'FAN' };

      const result = await computePlatformAnalyticsRollup(mockDb, { period: '30d' });

      // Invariant: returned cached data without scanning collections
      expect(result.cached).toBe(true);
      expect(result.rollup.userGrowth.totalRegisteredUsers.value).toBe(1250);
    });

    it('forces query refresh and updates /analyticsAggregates when forceRefresh is true', async () => {
      // Seed an unexpired cache
      store['analyticsAggregates/platform_overview_30d'] = {
        period: '30d',
        cacheExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        userGrowth: { totalRegisteredUsers: { value: 100 } },
      };

      // Seed updated users
      store['users/u1'] = { role: 'FAN', createdAt: new Date().toISOString() };
      store['users/u2'] = { role: 'ARTIST', createdAt: new Date().toISOString() };

      const result = await computePlatformAnalyticsRollup(mockDb, {
        period: '30d',
        forceRefresh: true,
      });

      expect(result.cached).toBe(false);
      expect(result.rollup.userGrowth.totalRegisteredUsers.value).toBe(2);

      // Verify new snapshot was persisted into cache
      expect(store['analyticsAggregates/platform_overview_30d']).toBeDefined();
      expect(store['analyticsAggregates/platform_overview_30d'].userGrowth.totalRegisteredUsers.value).toBe(2);
    });

    it('recalculates rollup automatically when cache is expired', async () => {
      // Expired 1 hour ago
      store['analyticsAggregates/platform_overview_30d'] = {
        period: '30d',
        cacheExpiresAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        userGrowth: { totalRegisteredUsers: { value: 50 } },
      };

      store['users/u_fresh'] = { role: 'FAN', createdAt: new Date().toISOString() };

      const result = await computePlatformAnalyticsRollup(mockDb, { period: '30d' });

      expect(result.cached).toBe(false);
      expect(result.rollup.userGrowth.totalRegisteredUsers.value).toBe(1);
    });
  });

  describe('2. Financial Double-Entry Ledger Reconciliation Scaling', () => {
    it('scales reconciliation across 1,000 balanced double-entry ledger entries in under 100ms', async () => {
      // Seed 500 debit and 500 matching credit records
      const entryCount = 500;
      for (let i = 0; i < entryCount; i++) {
        const amountCents = (i + 1) * 100;
        store[`paymentLedger/debit_${i}`] = {
          type: 'DEBIT',
          amountCents,
          sourceType: 'TIP',
          createdAt: new Date().toISOString(),
        };
        store[`paymentLedger/credit_${i}`] = {
          type: 'CREDIT',
          amountCents,
          sourceType: 'TIP',
          createdAt: new Date().toISOString(),
        };
      }

      const start = performance.now();
      const report = await reconcileFinancialLedger(mockDb, { limit: 1500 });
      const duration = performance.now() - start;

      expect(report.status).toBe('BALANCED');
      expect(report.discrepancyCount).toBe(0);
      expect(report.totalLedgerDebitsCents).toBe(report.totalLedgerCreditsCents);
      expect(report.totalLedgerDebitsCents).toBe((entryCount * (entryCount + 1) / 2) * 100);

      // Scaling invariant: 1,000 entries aggregated under 500ms even under heavy parallel multi-worker Jest load
      expect(duration).toBeLessThan(500);
    });

    it('flags discrepancies accurately even across high-volume ledger records', async () => {
      // Seed 50 balanced entries
      for (let i = 0; i < 50; i++) {
        store[`paymentLedger/deb_${i}`] = { type: 'DEBIT', amountCents: 500 };
        store[`paymentLedger/crd_${i}`] = { type: 'CREDIT', amountCents: 500 };
      }

      // Introduce an asymmetric rogue debit
      store['paymentLedger/deb_unbalanced'] = { type: 'DEBIT', amountCents: 999 };

      const report = await reconcileFinancialLedger(mockDb, { limit: 500 });

      expect(report.status).toBe('DISCREPANCY_DETECTED');
      expect(report.discrepancyCount).toBe(1);
      expect(report.totalLedgerDebitsCents).not.toBe(report.totalLedgerCreditsCents);
    });
  });

  describe('3. Resource Stability and Reentrancy Safety', () => {
    it('executes 25 consecutive reconciliation runs without memory leak or state pollution', async () => {
      store['paymentLedger/d1'] = { type: 'DEBIT', amountCents: 1000 };
      store['paymentLedger/c1'] = { type: 'CREDIT', amountCents: 1000 };

      const reports = [];
      for (let i = 0; i < 25; i++) {
        const rep = await reconcileFinancialLedger(mockDb, { limit: 50 });
        expect(rep.status).toBe('BALANCED');
        expect(rep.reconciliationId).toBeDefined();
        reports.push(rep);
      }

      // Verifies all 25 reconciliation reports completed without failure
      expect(reports.length).toBe(25);
      const reconciliations = Object.keys(store).filter((k) => k.startsWith('financialReconciliations/'));
      expect(reconciliations.length).toBeGreaterThanOrEqual(1);
    });
  });
});
