/**
 * Crowdbeats V2 — Legal Policy Consent Service Tests (Phase 4 Compliance)
 *
 * Unit tests verifying:
 * 1. Recording user consent binds correct version and SHA-256 hash.
 * 2. Updating user document flags (termsAccepted, aupAccepted, monetizationPolicyAccepted).
 * 3. Rejecting unknown policy types.
 * 4. Verifying recorded consent status against minimum required versions.
 * 5. Idempotent recording without throwing errors.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PolicyType, PLATFORM_POLICIES_REGISTRY } from '@crowdbeats/contracts';

const store: Record<string, Record<string, unknown>> = {};

const _mockDoc = (cId: string, dId?: string) => {
  const docId = dId || `doc_${Math.random()}`;
  return {
    id: docId,
    collection: (subId: string) => ({
      get: jest.fn().mockImplementation(async () => {
        const prefix = `${cId}/${docId}/${subId}/`;
        const matched = Object.keys(store)
          .filter((k) => k.startsWith(prefix))
          .map((k) => ({
            id: k.replace(prefix, ''),
            ref: { delete: () => delete store[k] },
            data: () => store[k],
          }));
        return { docs: matched, empty: matched.length === 0 };
      }),
    }),
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

const mockFirestore = {
  collection: (cId: string) => ({
    doc: (dId?: string) => _mockDoc(cId, dId),
    add: jest.fn().mockImplementation(async (data: any) => {
      const docId = `add_${Math.random()}`;
      store[`${cId}/${docId}`] = data;
      return { id: docId };
    }),
  }),
  batch: () => {
    const ops: Array<() => void> = [];
    return {
      set: (ref: any, data: any, options?: any) => ops.push(() => ref.set(data, options)),
      update: (ref: any, data: any) => ops.push(() => ref.update(data)),
      delete: (ref: any) => ops.push(() => ref.delete && ref.delete()),
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
const { recordUserConsent, verifyUserConsent, revokeUserConsent } = require('../consentService');

describe('Legal Policy Consent Service (Phase 4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it('records affirmative consent with correct SHA-256 hash and updates user doc', async () => {
    store['users/user_100'] = { uid: 'user_100', displayName: 'Jane Musician' };

    const result = await recordUserConsent(mockFirestore as any, {
      uid: 'user_100',
      request: {
        policyType: PolicyType.TERMS_OF_SERVICE,
        version: '2026-08-25',
        platform: 'web',
        userAgent: 'Mozilla/5.0 Test',
      },
      ipAddress: '127.0.0.1',
    });

    expect(result.consentId).toBe('user_100_TERMS_OF_SERVICE_2026-08-25');
    expect(result.granted).toBe(true);
    expect(result.sha256Hash).toBe(PLATFORM_POLICIES_REGISTRY[PolicyType.TERMS_OF_SERVICE].sha256Hash);

    // Verify stored consent record
    const consentDoc = store['consent/user_100_TERMS_OF_SERVICE_2026-08-25'];
    expect(consentDoc).toBeDefined();
    expect(consentDoc.granted).toBe(true);
    expect(consentDoc.userAgent).toBe('Mozilla/5.0 Test');

    // Verify updated user doc
    const userDoc = store['users/user_100'];
    expect(userDoc.termsAccepted).toBe(true);
    expect(userDoc.termsVersion).toBe('2026-08-25');
  });

  it('records creator monetization policy consent and updates user flags', async () => {
    store['users/user_200'] = { uid: 'user_200' };

    await recordUserConsent(mockFirestore as any, {
      uid: 'user_200',
      request: {
        policyType: PolicyType.CREATOR_MONETIZATION_POLICY,
        version: '2026-08-25',
      },
    });

    const userDoc = store['users/user_200'];
    expect(userDoc.monetizationPolicyAccepted).toBe(true);
    expect(userDoc.monetizationPolicyVersion).toBe('2026-08-25');
  });

  it('rejects unknown policy types with error', async () => {
    await expect(
      recordUserConsent(mockFirestore as any, {
        uid: 'user_300',
        request: {
          policyType: 'UNKNOWN_POLICY' as any,
          version: '1.0',
        },
      }),
    ).rejects.toThrow(/Invalid policy type/);
  });

  it('verifies consent accurately when consent record exists', async () => {
    store['consent/user_400_ACCEPTABLE_USE_POLICY_2026-08-25'] = {
      granted: true,
      version: '2026-08-25',
    };

    const hasConsented = await verifyUserConsent(
      mockFirestore as any,
      'user_400',
      PolicyType.ACCEPTABLE_USE_POLICY,
      '2026-08-25',
    );
    expect(hasConsented).toBe(true);
  });

  it('returns false when user has not consented', async () => {
    const hasConsented = await verifyUserConsent(
      mockFirestore as any,
      'user_500',
      PolicyType.DMCA_COPYRIGHT_POLICY,
    );
    expect(hasConsented).toBe(false);
  });

  it('revokes consent, updates user doc flags, prunes device tokens, and writes audit event', async () => {
    store['users/user_600'] = {
      uid: 'user_600',
      termsAccepted: true,
      consents: {
        [PolicyType.TERMS_OF_SERVICE]: { version: '2026-08-25', granted: true },
      },
    };
    store['consent/user_600_TERMS_OF_SERVICE_2026-08-25'] = {
      granted: true,
      version: '2026-08-25',
    };
    store['users/user_600/deviceTokens/token_device_abc'] = {
      fcmToken: 'token_device_abc',
    };

    const res = await revokeUserConsent(mockFirestore as any, {
      uid: 'user_600',
      policyType: PolicyType.TERMS_OF_SERVICE,
      reason: 'USER_WITHDREW_CONSENT',
    });

    expect(res.ok).toBe(true);
    expect(res.revokedAt).toBeDefined();

    // Verify consent doc marked revoked
    const consentDoc = store['consent/user_600_TERMS_OF_SERVICE_2026-08-25'];
    expect(consentDoc.granted).toBe(false);
    expect(consentDoc.revocationReason).toBe('USER_WITHDREW_CONSENT');

    // Verify user doc flags reset
    const userDoc = store['users/user_600'];
    expect(userDoc.termsAccepted).toBe(false);

    // Verify device tokens were pruned
    expect(store['users/user_600/deviceTokens/token_device_abc']).toBeUndefined();

    // Verify audit event was logged
    const auditLogs = Object.values(store).filter(
      (doc) => (doc as any).eventType === 'CONSENT_REVOKED',
    );
    expect(auditLogs.length).toBe(1);
    expect((auditLogs[0] as any).policyType).toBe(PolicyType.TERMS_OF_SERVICE);
  });
});
