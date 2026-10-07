/**
 * Crowdbeats V2 — Automated Compliance Synthetic Probe Runner Tests (Phase 13)
 *
 * Exercises all 12 platform compliance controls in end-to-end synthetic flows
 * and verifies that 100% of probes pass and produce audit evidence records.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const store: Record<string, Record<string, unknown>> = {};

const _mockDoc = (cId: string, dId?: string) => {
  const docId = dId || `doc_${Math.random()}`;
  const fullPath = `${cId}/${docId}`;
  return {
    id: docId,
    ref: { id: docId },
    get: jest.fn().mockImplementation(async () => {
      const data = store[fullPath];
      return { exists: data !== undefined, data: () => data };
    }),
    set: jest.fn().mockImplementation(async (data: any, options?: any) => {
      if (options?.merge && store[fullPath]) {
        store[fullPath] = { ...store[fullPath], ...data };
      } else {
        store[fullPath] = data;
      }
    }),
    update: jest.fn().mockImplementation(async (updates: any) => {
      store[fullPath] = { ...(store[fullPath] || {}), ...updates };
    }),
    delete: jest.fn().mockImplementation(async () => {
      delete store[fullPath];
    }),
    collection: (subCId: string) => ({
      doc: (subDocId?: string) => _mockDoc(`${fullPath}/${subCId}`, subDocId),
      where: (f: string, op: string, v: any) => mockQuery(`${fullPath}/${subCId}`, [[f, v]]),
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
  runTransaction: async (updateFunction: (tx: any) => Promise<any>) => {
    const tx = {
      get: async (ref: any) => ref.get(),
      set: (ref: any, data: any, options?: any) => ref.set(data, options),
      update: (ref: any, data: any) => ref.update(data),
      delete: (ref: any) => ref.delete(),
    };
    return updateFunction(tx);
  },
  FieldValue: {
    serverTimestamp: () => 'SERVER_TS',
    increment: (n: number) => n,
  },
};

jest.mock('firebase-admin', () => ({
  apps: [true],
  initializeApp: jest.fn(),
  firestore: Object.assign(jest.fn(() => mockFirestore), {
    FieldValue: {
      serverTimestamp: () => 'SERVER_TS',
      increment: (n: number) => n,
    },
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { runComplianceProbes } = require('../complianceProbeRunner');

describe('Compliance Synthetic Probe Runner (Phase 13)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it('runs all compliance probes with 100% success and records audit report', async () => {
    const report = await runComplianceProbes(mockFirestore as any);

    if (report.failedTests > 0) {
      console.error('FAILED PROBES:', report.results.filter((r: any) => !r.passed));
    }

    expect(report).toBeDefined();
    expect(report.totalTests).toBeGreaterThanOrEqual(12);
    expect(report.failedTests).toBe(0);
    expect(report.status).toBe('PASSED');

    // Verify report written in Firestore
    const reportDoc = store[`complianceAuditReports/${report.reportId}`];
    expect(reportDoc).toBeDefined();
    expect(reportDoc.status).toBe('PASSED');
  });
});
