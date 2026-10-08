import { jest, describe, test, expect, afterEach } from '@jest/globals';
import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';

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
      };
    }),
    set: jest.fn<any>().mockImplementation(async (data: any, options?: any) => {
      if (options?.merge && store[path]) {
        store[path] = { ...store[path], ...data };
      } else {
        store[path] = { ...data };
      }
    }),
  };
};

const mockCollection = (colPath: string): any => ({
  doc: (docId?: string) => mockDoc(`${colPath}/${docId}`),
});

const mockFirestore = {
  collection: (col: string) => mockCollection(col),
  doc: (path: string) => mockDoc(path),
  runTransaction: jest.fn<any>().mockImplementation(async (updateFn: any) => {
    const tx = {
      get: async (ref: any) => ref.get(),
      set: async (ref: any, data: any, opts: any) => ref.set(data, opts),
    };
    return updateFn(tx);
  }),
};

jest.mock('firebase-admin', () => ({
  apps: [{}],
  initializeApp: jest.fn(),
  firestore: Object.assign(jest.fn(() => mockFirestore), {
    FieldValue: { serverTimestamp: () => new Date().toISOString() },
  }),
}));

import {
  computeRateLimitKey,
  checkRateLimit,
  enforceRateLimit,
} from '../lib/rateLimiter.js';
import {
  verifyAppCheck,
  getAppCheckMode,
  hashAppCheckContext,
} from '../lib/appCheck.js';
import {
  assertSessionNotExpired,
  assertGrantNotExpired,
  recordCostGuardMetric,
} from '../lib/costGuard.js';

describe('Phase 7 — Rate Limiter (Zero PII & Zero Raw IP)', () => {
  test('computeRateLimitKey generates deterministic zero-PII hex hash', () => {
    const key1 = computeRateLimitKey('user_123', 'check_in_start', 100);
    const key2 = computeRateLimitKey('user_123', 'check_in_start', 100);
    const keyDiff = computeRateLimitKey('user_456', 'check_in_start', 100);

    expect(key1).toBe(key2);
    expect(key1).not.toBe(keyDiff);
    expect(key1.length).toBe(32);
    expect(key1).not.toContain('user_123');
    expect(key1).not.toContain('192.168');
  });

  test('checkRateLimit returns allowed result structure', async () => {
    const result = await checkRateLimit({
      identifier: 'test_user_rate',
      action: 'check_in_start',
      maxAttempts: 5,
      windowSeconds: 60,
    });

    expect(result.allowed).toBe(true);
    expect(result.maxAttempts).toBe(5);
    expect(result.resetAt).toBeInstanceOf(Date);
  }, 15000);

  test('enforceRateLimit succeeds when under limit', async () => {
    await expect(
      enforceRateLimit({
        identifier: 'test_user_enforce',
        action: 'check_in_start',
        maxAttempts: 5,
        windowSeconds: 60,
      }),
    ).resolves.not.toThrow();
  });
});

describe('Phase 7 — App Check Attestation Guard', () => {
  const origEnv = process.env.APP_CHECK_MODE;

  afterEach(() => {
    process.env.APP_CHECK_MODE = origEnv;
  });

  test('observe mode allows unverified requests with logging', () => {
    process.env.APP_CHECK_MODE = 'observe';
    expect(getAppCheckMode()).toBe('observe');

    const fakeReq = { auth: { uid: 'u1' } } as unknown as CallableRequest<unknown>;
    const res = verifyAppCheck(fakeReq, 'testAction');
    expect(res.verified).toBe(false);
    expect(res.mode).toBe('observe');
  });

  test('warn mode allows unverified requests with warning', () => {
    process.env.APP_CHECK_MODE = 'warn';
    expect(getAppCheckMode()).toBe('warn');

    const fakeReq = { auth: { uid: 'u1' } } as unknown as CallableRequest<unknown>;
    const res = verifyAppCheck(fakeReq, 'testAction');
    expect(res.verified).toBe(false);
    expect(res.mode).toBe('warn');
  });

  test('enforce mode throws failed-precondition for missing App Check', () => {
    process.env.APP_CHECK_MODE = 'enforce';
    expect(getAppCheckMode()).toBe('enforce');

    const fakeReq = { auth: { uid: 'u1' } } as unknown as CallableRequest<unknown>;
    expect(() => verifyAppCheck(fakeReq, 'testAction')).toThrow(HttpsError);
    expect(() => verifyAppCheck(fakeReq, 'testAction')).toThrow('App Check attestation verification failed');
  });

  test('enforce mode accepts valid App Check token', () => {
    process.env.APP_CHECK_MODE = 'enforce';

    const fakeReq = {
      auth: { uid: 'u1' },
      app: { appId: 'com.crowdbeats.app', alreadyConsumed: false },
    } as unknown as CallableRequest<unknown>;

    const res = verifyAppCheck(fakeReq, 'testAction');
    expect(res.verified).toBe(true);
    expect(res.appId).toBe('com.crowdbeats.app');
  });

  test('hashAppCheckContext produces irreversible hash', () => {
    const fakeReq = {
      app: { appId: 'com.crowdbeats.app' },
      rawRequest: { headers: { 'x-firebase-appcheck': 'secret_token_abc' } },
    } as unknown as CallableRequest<unknown>;

    const hash = hashAppCheckContext(fakeReq);
    expect(hash).not.toContain('secret_token_abc');
    expect(hash.length).toBe(16);
  });
});

describe('Phase 7 — Cost Guards & Expiry Protection', () => {
  test('assertSessionNotExpired succeeds for future endsAt', () => {
    const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();
    expect(() =>
      assertSessionNotExpired({ sessionId: 'sess_1', endsAt: futureDate }),
    ).not.toThrow();
  });

  test('assertSessionNotExpired throws failed-precondition for past endsAt past grace period', () => {
    const pastDate = new Date(Date.now() - 60 * 1000).toISOString();
    expect(() =>
      assertSessionNotExpired({ sessionId: 'sess_1', endsAt: pastDate }),
    ).toThrow(HttpsError);
    expect(() =>
      assertSessionNotExpired({ sessionId: 'sess_1', endsAt: pastDate }),
    ).toThrow('The live session has expired');
  });

  test('assertGrantNotExpired succeeds for unexpired grant', () => {
    const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();
    expect(() =>
      assertGrantNotExpired({ grantId: 'grant_1', expiresAt: futureDate }),
    ).not.toThrow();
  });

  test('assertGrantNotExpired throws failed-precondition for expired grant', () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    expect(() =>
      assertGrantNotExpired({ grantId: 'grant_1', expiresAt: pastDate }),
    ).toThrow(HttpsError);
    expect(() =>
      assertGrantNotExpired({ grantId: 'grant_1', expiresAt: pastDate }),
    ).toThrow('The audience visibility grant has expired');
  });

  test('recordCostGuardMetric records events without throwing', async () => {
    await expect(
      recordCostGuardMetric({
        metric: 'check_in_rejected',
        entityId: 'performer_1',
        details: { consecutiveRejections: 6 },
      }),
    ).resolves.not.toThrow();

    await expect(
      recordCostGuardMetric({
        metric: 'telemetry_sample_ingested',
        entityId: 'sess_1',
        details: { sequence: 1300 },
      }),
    ).resolves.not.toThrow();
  });
});
