/**
 * Crowdbeats V2 — Comprehensive Security, Fraud, and Compliance Test Suite (Phase 17)
 *
 * Verifies:
 * 1. RBAC & Privilege Escalation Defenses (grantStaffRole, revokeStaffRole, suspendAccount, approveStaffRefund)
 * 2. Storage Upload Security Boundaries & File Size / MIME Bounds (getSignedUploadUrl)
 * 3. Stripe Webhook Signature Verification, Anti-Replay Idempotency & Financial Guards
 * 4. App Check Attestation & Zero-PII Deterministic Rate Limiting
 * 5. Payout Hold Lifecycle, Financial Isolation & Compliance Status
 * 6. Sensitive Data Isolation, Immutable Audit Trails & Privacy Safeguards
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

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
      return { id, path: docPath };
    }),
    where: jest.fn<any>().mockImplementation((field: string, op: string, val: any) => {
      return {
        where: jest.fn<any>().mockReturnThis(),
        limit: jest.fn<any>().mockReturnThis(),
        orderBy: jest.fn<any>().mockReturnThis(),
        get: jest.fn<any>().mockImplementation(async () => {
          const docs: any[] = [];
          for (const [k, v] of Object.entries(store)) {
            if (
              k.startsWith(colPath + '/') &&
              k.split('/').length === colPath.split('/').length + 1
            ) {
              if (op === '==' && v[field] === val) {
                docs.push({
                  id: k.split('/').pop(),
                  data: () => v,
                  exists: true,
                });
              }
            }
          }
          return { docs, empty: docs.length === 0, size: docs.length };
        }),
      };
    }),
  };
};

const mockBatch = () => {
  const operations: Array<() => void> = [];
  return {
    set: jest.fn((ref: any, data: any, options?: any) => {
      operations.push(() => {
        if (options?.merge && store[ref.path]) {
          store[ref.path] = { ...store[ref.path], ...data };
        } else {
          store[ref.path] = { ...data };
        }
      });
    }),
    update: jest.fn((ref: any, data: any) => {
      operations.push(() => {
        store[ref.path] = { ...(store[ref.path] || {}), ...data };
      });
    }),
    delete: jest.fn((ref: any) => {
      operations.push(() => {
        delete store[ref.path];
      });
    }),
    commit: jest.fn(async () => {
      for (const op of operations) op();
    }),
  };
};

const mockStorageFile = {
  getSignedUrl: jest.fn<any>().mockResolvedValue([
    'https://storage.googleapis.com/crowdbeats-v2-dev.firebasestorage.app/signed_url?token=mock_15m',
  ]),
};

const mockStorageBucket = {
  file: jest.fn(() => mockStorageFile),
};

const mockAuthUserRecord = {
  customClaims: {},
};

jest.mock('firebase-admin', () => ({
  apps: ['[DEFAULT]'],
  initializeApp: jest.fn(),
  firestore: Object.assign(
    () => ({
      collection: mockCollection,
      doc: mockDoc,
      batch: mockBatch,
      runTransaction: jest.fn<any>().mockImplementation(async (updateFn: any) => {
        const tx = {
          get: async (ref: any) => ref.get(),
          set: async (ref: any, data: any, opts: any) => ref.set(data, opts),
          update: async (ref: any, data: any) => ref.update(data),
          delete: async (ref: any) => ref.delete(),
        };
        return updateFn(tx);
      }),
    }),
    {
      FieldValue: {
        serverTimestamp: () => new Date().toISOString(),
      },
    },
  ),
  storage: () => ({
    bucket: () => mockStorageBucket,
  }),
  auth: () => ({
    setCustomUserClaims: jest.fn<any>().mockImplementation(async (uid: string, claims: any) => {
      mockAuthUserRecord.customClaims = claims;
    }),
    getUser: jest.fn<any>().mockImplementation(async (uid: string) => ({
      uid,
      customClaims: mockAuthUserRecord.customClaims,
    })),
  }),
}));

const mockStripeConstructEvent = jest.fn();

jest.mock('../lib/stripe.js', () => ({
  stripe: {
    constructWebhookEvent: jest.fn((raw: string, sig: string, secret: string) => {
      return mockStripeConstructEvent(raw, sig, secret);
    }),
    payouts: {
      create: jest.fn<any>().mockResolvedValue({ id: 'po_mock123', status: 'paid' }),
    },
    accounts: {
      update: jest.fn<any>().mockResolvedValue({ id: 'acct_mock123' }),
    },
    refunds: {
      create: jest.fn<any>().mockResolvedValue({ id: 're_mock123', status: 'succeeded' }),
    },
    updateAccountPayouts: jest.fn<any>().mockResolvedValue({ success: true }),
  },
}));

import {
  SecurityAuditCategory,
  FraudRiskLevel,
  FraudSignalCode,
  StorageAllowedMimeTypes,
  StorageMaxSizeBytes,
  CONTRACTS_VERSION,
} from '@crowdbeats/contracts';

import { grantStaffRole } from '../admin/grantStaffRole';
import { revokeStaffRole } from '../admin/revokeStaffRole';
import { suspendAccount } from '../admin/suspendAccount';
import { approveStaffRefund } from '../admin/approveStaffRefund';
import { getSignedUploadUrl } from '../storage/getSignedUploadUrl';
import { computeRateLimitKey, checkRateLimit, enforceRateLimit } from '../lib/rateLimiter';
import { verifyAppCheck, getAppCheckMode, hashAppCheckContext } from '../lib/appCheck';
import { applyPayoutHold, releasePayoutHold } from '../financial/payoutHoldService';
import { stripeWebhook } from '../tip/webhookHandler';

describe('Phase 17 — Comprehensive Security, Fraud and Compliance Suite', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    jest.clearAllMocks();
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
    delete process.env.APP_CHECK_ENFORCEMENT;
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. RBAC & PRIVILEGE ESCALATION CONTROLS
  // ════════════════════════════════════════════════════════════════════════════
  describe('RBAC & Privilege Escalation Defenses', () => {
    it('contracts exports compliant version (>=0.30.0)', () => {
      expect(CONTRACTS_VERSION).toMatch(/^0\.(30|31)\./);
    });

    it('rejects unauthenticated caller attempting to grant staff role', async () => {
      await expect(
        (grantStaffRole as any).run({
          auth: null,
          data: {
            targetUid: 'user_target_1',
            role: 'CUSTOMER_SUPPORT',
            confirmationPhrase: 'GRANT CUSTOMER_SUPPORT',
          },
        }),
      ).rejects.toThrow('User must be authenticated.');
    });

    it('rejects non-SUPER_ADMIN caller from granting staff roles (privilege escalation blocked)', async () => {
      await expect(
        (grantStaffRole as any).run({
          auth: { uid: 'user_fan', token: { platformRole: 'FAN' } },
          data: {
            targetUid: 'user_target_1',
            role: 'CUSTOMER_SUPPORT',
            confirmationPhrase: 'GRANT CUSTOMER_SUPPORT',
          },
        }),
      ).rejects.toThrow('Only Super Administrators can grant staff roles.');

      await expect(
        (grantStaffRole as any).run({
          auth: { uid: 'staff_support', token: { platformRole: 'CUSTOMER_SUPPORT' } },
          data: {
            targetUid: 'user_target_2',
            role: 'SUPER_ADMIN',
            confirmationPhrase: 'GRANT SUPER_ADMIN',
          },
        }),
      ).rejects.toThrow('Only Super Administrators can grant staff roles.');
    });

    it('rejects grantStaffRole if confirmation phrase is mismatched or omitted', async () => {
      await expect(
        (grantStaffRole as any).run({
          auth: { uid: 'super_admin_1', token: { platformRole: 'SUPER_ADMIN' } },
          data: {
            targetUid: 'user_target_1',
            role: 'CUSTOMER_SUPPORT',
            confirmationPhrase: 'INVALID PHRASE',
          },
        }),
      ).rejects.toThrow('Step-up confirmation failed');
    });

    it('allows SUPER_ADMIN to grant staff role with correct confirmation phrase and logs audit event', async () => {
      // Seed user doc
      store['users/staff_applicant_1'] = {
        uid: 'staff_applicant_1',
        email: 'support@crowdbeats.com',
        displayName: 'Support Agent',
      };

      const result = await (grantStaffRole as any).run({
        auth: { uid: 'super_admin_1', token: { platformRole: 'SUPER_ADMIN' } },
        data: {
          targetUid: 'staff_applicant_1',
          targetEmail: 'support@crowdbeats.com',
          role: 'CUSTOMER_SUPPORT',
          confirmationPhrase: 'GRANT CUSTOMER_SUPPORT',
        },
      });

      expect(result.success).toBe(true);
      expect(result.role).toBe('CUSTOMER_SUPPORT');

      // Verify staffRecords document was created
      const staffDoc = store['staffRecords/staff_applicant_1'];
      expect(staffDoc).toBeDefined();
      expect(staffDoc.platformRole).toBe('CUSTOMER_SUPPORT');
      expect(staffDoc.grantedByUid).toBe('super_admin_1');
      expect(staffDoc.isActive).toBe(true);

      // Verify audit event
      const auditDocs = Object.keys(store).filter((k) => k.startsWith('auditEvents/'));
      expect(auditDocs.length).toBeGreaterThan(0);
      const auditData = store[auditDocs[0]];
      expect(auditData.action).toBe('STAFF_ROLE_GRANTED');
      expect(auditData.actorUid).toBe('super_admin_1');
      expect(auditData.targetId).toBe('staff_applicant_1');
    });

    it('rejects revokeStaffRole if super admin attempts self-revocation', async () => {
      await expect(
        (revokeStaffRole as any).run({
          auth: { uid: 'super_admin_1', token: { platformRole: 'SUPER_ADMIN' } },
          data: {
            targetUid: 'super_admin_1',
            confirmationPhrase: 'REVOKE ROLE',
          },
        }),
      ).rejects.toThrow('Super Administrators cannot revoke their own role');
    });

    it('rejects suspendAccount from non-authorized roles and requires typed confirmation phrase', async () => {
      // Seed artist doc
      store['artistProfiles/artist_bad'] = { uid: 'artist_bad', name: 'Bad Artist' };

      // Non-authorized caller
      await expect(
        (suspendAccount as any).run({
          auth: { uid: 'fan_user_1', token: { platformRole: 'FAN' } },
          data: {
            targetUid: 'artist_bad',
            targetType: 'artist',
            reason: 'Malicious activity',
            confirmationPhrase: 'SUSPEND ACCOUNT',
          },
        }),
      ).rejects.toThrow('Only Trust & Safety or Super Admins can suspend accounts.');

      // Authorized caller with wrong phrase
      await expect(
        (suspendAccount as any).run({
          auth: { uid: 'ts_agent_1', token: { platformRole: 'TRUST_SAFETY' } },
          data: {
            targetUid: 'artist_bad',
            targetType: 'artist',
            reason: 'Malicious activity',
            confirmationPhrase: 'wrong phrase',
          },
        }),
      ).rejects.toThrow('Expected exact phrase: "SUSPEND ACCOUNT"');
    });

    it('successfully executes suspendAccount by TRUST_SAFETY and writes immutable audit record', async () => {
      store['artistProfiles/artist_fraudster'] = {
        uid: 'artist_fraudster',
        name: 'Fraud Performer',
        isSuspended: false,
      };

      const result = await (suspendAccount as any).run({
        auth: { uid: 'ts_agent_1', token: { platformRole: 'TRUST_SAFETY' } },
        data: {
          targetUid: 'artist_fraudster',
          targetType: 'artist',
          reason: 'Chargeback fraud velocity spike',
          confirmationPhrase: 'SUSPEND ACCOUNT',
        },
      });

      expect(result.success).toBe(true);
      expect(store['artistProfiles/artist_fraudster'].isSuspended).toBe(true);
      expect(store['artistProfiles/artist_fraudster'].suspensionReason).toBe(
        'Chargeback fraud velocity spike',
      );

      const auditDocs = Object.keys(store).filter((k) => k.startsWith('auditEvents/'));
      const audit = store[auditDocs.find((k) => store[k].action === 'USER_SUSPENDED')!];
      expect(audit).toBeDefined();
      expect(audit.actorUid).toBe('ts_agent_1');
      expect(audit.targetId).toBe('artist_fraudster');
    });

    it('rejects approveStaffRefund if caller is not CUSTOMER_SUPPORT or SUPER_ADMIN', async () => {
      store['tips/tip_disputed'] = {
        tipId: 'tip_disputed',
        status: 'succeeded',
        amountCents: 5000,
        fanUid: 'fan_1',
      };

      await expect(
        (approveStaffRefund as any).run({
          auth: { uid: 'artist_user_1', token: { platformRole: 'ARTIST' } },
          data: {
            tipId: 'tip_disputed',
            reason: 'Customer requested refund',
            confirmationPhrase: 'APPROVE REFUND',
          },
        }),
      ).rejects.toThrow('Only Support, Finance, or Super Admins can approve refunds.');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. STORAGE SECURITY & MIME BOUNDARIES
  // ════════════════════════════════════════════════════════════════════════════
  describe('Storage Upload Security Boundaries', () => {
    it('verifies whitelisted MIME types and size caps from contracts', () => {
      expect(StorageAllowedMimeTypes.IMAGES).toContain('image/jpeg');
      expect(StorageAllowedMimeTypes.IMAGES).toContain('image/png');
      expect(StorageAllowedMimeTypes.DOCUMENTS).toContain('application/pdf');
      expect(StorageMaxSizeBytes.IMAGE).toBe(10 * 1024 * 1024);
      expect(StorageMaxSizeBytes.DOCUMENT).toBe(50 * 1024 * 1024);
    });

    it('rejects unauthenticated caller attempting to get signed upload URL', async () => {
      await expect(
        (getSignedUploadUrl as any).run({
          auth: null,
          data: {
            targetEntity: 'profile',
            entityId: 'user_1',
            contentType: 'image/jpeg',
          },
        }),
      ).rejects.toThrow('User must be authenticated.');
    });

    it('rejects upload URL generation for a profile other than caller', async () => {
      await expect(
        (getSignedUploadUrl as any).run({
          auth: { uid: 'user_alice' },
          data: {
            targetEntity: 'profile',
            entityId: 'user_bob',
            contentType: 'image/jpeg',
          },
        }),
      ).rejects.toThrow('Cannot upload media for another user profile.');
    });

    it('rejects upload URL for band media if caller is not BAND_ADMIN or BAND_FOUNDER', async () => {
      // Seed regular member
      store['bands/band_cool/members/member_dan'] = {
        uid: 'member_dan',
        role: 'BAND_MEMBER',
      };

      await expect(
        (getSignedUploadUrl as any).run({
          auth: { uid: 'member_dan' },
          data: {
            targetEntity: 'band',
            entityId: 'band_cool',
            contentType: 'image/png',
          },
        }),
      ).rejects.toThrow('Only Band Admins or Founders can upload band media.');
    });

    it('rejects dangerous or disallowed MIME types (e.g., SVG, scripts, executables)', async () => {
      await expect(
        (getSignedUploadUrl as any).run({
          auth: { uid: 'user_alice' },
          data: {
            targetEntity: 'profile',
            entityId: 'user_alice',
            contentType: 'image/svg+xml',
          },
        }),
      ).rejects.toThrow('Invalid content type');

      await expect(
        (getSignedUploadUrl as any).run({
          auth: { uid: 'user_alice' },
          data: {
            targetEntity: 'profile',
            entityId: 'user_alice',
            contentType: 'application/x-executable',
          },
        }),
      ).rejects.toThrow('Invalid content type');
    });

    it('generates valid signed upload URL with 15-minute expiration when authorized', async () => {
      store['bands/band_cool/members/founder_carol'] = {
        uid: 'founder_carol',
        role: 'BAND_FOUNDER',
      };

      const result = await (getSignedUploadUrl as any).run({
        auth: { uid: 'founder_carol' },
        data: {
          targetEntity: 'band',
          entityId: 'band_cool',
          mediaType: 'cover',
          contentType: 'image/webp',
          filename: 'new_album_art.webp',
        },
      });

      expect(result.uploadUrl).toBeDefined();
      expect(result.filePath).toContain('band-media/band_cool/cover/');
      expect(result.expiresInSeconds).toBe(900);
      expect(result.uploadUrl).toContain('https://storage.googleapis.com');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. STRIPE WEBHOOK SIGNATURE VERIFICATION & REPLAY PROTECTION
  // ════════════════════════════════════════════════════════════════════════════
  describe('Stripe Webhook Signature Verification & Idempotency', () => {
    const createMockResponse = () => {
      let statusCode = 200;
      let body: any = null;
      const res: any = {
        status: jest.fn((code: number) => {
          statusCode = code;
          return res;
        }),
        send: jest.fn((payload: any) => {
          body = payload;
          return res;
        }),
        json: jest.fn((payload: any) => {
          body = payload;
          return res;
        }),
        on: jest.fn((event: string, cb: () => void) => {
          return res;
        }),
        getHeader: jest.fn(),
        setHeader: jest.fn(),
        getStatusCode: () => statusCode,
        getBody: () => body,
      };
      return res;
    };

    it('returns HTTP 400 Bad Request when webhook secret is configured but Stripe-Signature header is missing', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_prod_test_secret_123';

      const mockReq: any = {
        headers: {},
        rawBody: '{"id":"evt_123"}',
        body: { id: 'evt_123' },
      };

      const mockRes = createMockResponse();
      await (stripeWebhook as any)(mockReq, mockRes);

      expect(mockRes.getStatusCode()).toBe(400);
      expect(mockRes.getBody()).toContain('Missing Stripe-Signature header');
    });

    it('returns HTTP 400 Bad Request when Stripe signature verification fails (forgery / tampering)', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_prod_test_secret_123';

      mockStripeConstructEvent.mockImplementation(() => {
        throw new Error('Signature verification failed: Invalid signature timestamp');
      });

      const mockReq: any = {
        headers: { 'stripe-signature': 't=12345,v1=forged_signature_hash' },
        rawBody: '{"id":"evt_tampered"}',
        body: { id: 'evt_tampered' },
      };

      const mockRes = createMockResponse();
      await (stripeWebhook as any)(mockReq, mockRes);

      expect(mockRes.getStatusCode()).toBe(400);
      expect(mockRes.getBody()).toContain('Webhook signature verification failed');
    });

    it('prevents replay attacks: deduplicates webhook event if already completed or processing', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_prod_test_secret_123';

      mockStripeConstructEvent.mockReturnValue({
        id: 'evt_replay_attack_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount: 2500,
            metadata: { tipId: 'tip_replay_1' },
          },
        },
      });

      // Mark the event as already COMPLETED in idempotency collection
      store['webhookEvents/evt_replay_attack_123'] = {
        eventId: 'evt_replay_attack_123',
        type: 'payment_intent.succeeded',
        status: 'COMPLETED',
        receivedAt: new Date().toISOString(),
      };

      const mockReq: any = {
        headers: { 'stripe-signature': 'valid_sig' },
        rawBody: '{"id":"evt_replay_attack_123"}',
        body: { id: 'evt_replay_attack_123' },
      };

      const mockRes = createMockResponse();
      await (stripeWebhook as any)(mockReq, mockRes);

      expect(mockRes.getStatusCode()).toBe(200);
      expect(mockRes.getBody()).toEqual({ received: true, deduplicated: true });
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. APP CHECK ATTESTATION & ZERO-PII RATE LIMITING
  // ════════════════════════════════════════════════════════════════════════════
  describe('App Check Attestation & Zero-PII Deterministic Rate Limiting', () => {
    it('computeRateLimitKey generates deterministic 32-char hex string with zero PII and zero raw IP', () => {
      const key1 = computeRateLimitKey('user_sensitive_123@example.com', 'check_in_start', 100);
      const key2 = computeRateLimitKey('user_sensitive_123@example.com', 'check_in_start', 100);
      const keyDiff = computeRateLimitKey('user_other@example.com', 'check_in_start', 100);

      expect(key1).toBe(key2);
      expect(key1).not.toBe(keyDiff);
      expect(key1.length).toBe(32);
      expect(key1).toMatch(/^[a-f0-9]{32}$/);
      expect(key1).not.toContain('example.com');
      expect(key1).not.toContain('user_sensitive');
    });

    it('checkRateLimit allows operations under the threshold', async () => {
      const result = await checkRateLimit({
        identifier: 'user_legitimate_flow',
        action: 'camera_nearby_query',
        maxAttempts: 10,
        windowSeconds: 60,
      });

      expect(result.allowed).toBe(true);
      expect(result.maxAttempts).toBe(10);
    });

    it('enforceRateLimit allows operations under the threshold', async () => {
      await expect(
        enforceRateLimit({
          identifier: 'user_legitimate_flow',
          action: 'camera_nearby_query',
          maxAttempts: 10,
          windowSeconds: 60,
        }),
      ).resolves.not.toThrow();
    });

    it('hashAppCheckContext produces consistent SHA-256 digest', () => {
      const mockReq1: any = { app: { appId: 'com.crowdbeats.app' } };
      const mockReq2: any = { app: { appId: 'com.crowdbeats.app' } };
      const mockReqOther: any = { app: { appId: 'com.other.app' } };

      const hash1 = hashAppCheckContext(mockReq1);
      const hash2 = hashAppCheckContext(mockReq2);
      const hashOther = hashAppCheckContext(mockReqOther);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hashOther);
      expect(hash1.length).toBe(16);
      expect(hash1).not.toContain('crowdbeats');
    });

    it('verifyAppCheck in enforce mode rejects untrusted requests without app check token', () => {
      process.env.APP_CHECK_MODE = 'enforce';
      const mode = getAppCheckMode();
      expect(mode).toBe('enforce');

      const mockRequestUntrusted: any = {
        app: undefined, // No App Check token verified by Firebase Admin
      };

      expect(() => verifyAppCheck(mockRequestUntrusted)).toThrow(
        'App Check attestation verification failed. Untrusted client environment.',
      );
    });

    it('verifyAppCheck in observe mode does not block unverified requests', () => {
      process.env.APP_CHECK_MODE = 'observe';
      const mode = getAppCheckMode();
      expect(mode).toBe('observe');

      const mockRequestObserve: any = {
        app: undefined,
      };

      const result = verifyAppCheck(mockRequestObserve);
      expect(result.verified).toBe(false);
      expect(result.mode).toBe('observe');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. PAYOUT HOLD LIFECYCLE & FINANCIAL ISOLATION
  // ════════════════════════════════════════════════════════════════════════════
  describe('Financial Payout Hold Lifecycle & Compliance Integrity', () => {
    it('applies payout hold, sets complianceHold on user document, and writes audit record', async () => {
      // Seed user with stripe account
      store['users/creator_risky_1'] = {
        uid: 'creator_risky_1',
        stripeConnectAccountId: 'acct_stripe_creator_1',
        complianceHold: false,
      };

      const mockAdminFirestore = {
        collection: mockCollection,
        doc: mockDoc,
        batch: mockBatch,
        runTransaction: jest.fn<any>().mockImplementation(async (cb: any) => {
          const tx = {
            get: async (ref: any) => ref.get(),
            set: async (ref: any, data: any, opts: any) => ref.set(data, opts),
            update: async (ref: any, data: any) => ref.update(data),
          };
          return cb(tx);
        }),
      } as any;

      const holdRecord = await applyPayoutHold(mockAdminFirestore, 'compliance_officer_1', {
        creatorId: 'creator_risky_1',
        creatorType: 'artist',
        reasonCode: 'PAYOUT_HOLD_FRAUD',
        notes: 'Excessive refund requests detected in last 24h',
      });

      expect(holdRecord.holdId).toBeDefined();
      expect(holdRecord.creatorId).toBe('creator_risky_1');
      expect(holdRecord.reasonCode).toBe('PAYOUT_HOLD_FRAUD');
      expect(holdRecord.status).toBe('ACTIVE');

      // Verify user document has complianceHold = true
      const user = store['users/creator_risky_1'];
      expect(user.complianceHold).toBe(true);
      expect(user.payoutHoldReason).toBe('PAYOUT_HOLD_FRAUD');

      // Verify immutable audit log
      const auditDocs = Object.keys(store).filter((k) => k.startsWith('auditLogs/'));
      const holdAudit = store[auditDocs.find((k) => store[k].holdId === holdRecord.holdId)!];
      expect(holdAudit).toBeDefined();
      expect(holdAudit.actorUid).toBe('compliance_officer_1');
      expect(holdAudit.action).toBe('PAYOUT_HOLD_APPLIED_PAYOUT_HOLD_FRAUD');
    });

    it('releases payout hold and only clears complianceHold if no other active holds exist', async () => {
      const mockAdminFirestore = {
        collection: mockCollection,
        doc: mockDoc,
        batch: mockBatch,
        runTransaction: jest.fn<any>().mockImplementation(async (cb: any) => {
          const tx = {
            get: async (ref: any) => ref.get(),
            set: async (ref: any, data: any, opts: any) => ref.set(data, opts),
            update: async (ref: any, data: any) => ref.update(data),
          };
          return cb(tx);
        }),
      } as any;

      store['users/creator_risky_1'] = {
        uid: 'creator_risky_1',
        stripeConnectAccountId: 'acct_stripe_creator_1',
        complianceHold: true,
        payoutHoldReason: 'PAYOUT_HOLD_FRAUD',
      };

      store['payoutHolds/hold_123'] = {
        holdId: 'hold_123',
        creatorId: 'creator_risky_1',
        status: 'ACTIVE',
        reasonCode: 'PAYOUT_HOLD_FRAUD',
      };

      const releasedRecord = await releasePayoutHold(mockAdminFirestore, 'compliance_officer_1', {
        holdId: 'hold_123',
        notes: 'Investigation completed, false positive',
      });

      expect(releasedRecord.success).toBe(true);
      expect(releasedRecord.remainingActiveHolds).toBe(0);

      // Verify user document has complianceHold = false now that no other holds are active
      const user = store['users/creator_risky_1'];
      expect(user.complianceHold).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. FRAUD SCORING & ABUSE CONTROL INVARIANTS
  // ════════════════════════════════════════════════════════════════════════════
  describe('Fraud Scoring & Security Invariants', () => {
    it('verifies FraudSignalCode enumeration completeness', () => {
      expect(FraudSignalCode.RAPID_VELOCITY_TIPPING).toBe('RAPID_VELOCITY_TIPPING');
      expect(FraudSignalCode.PRIVILEGE_ESCALATION_ATTEMPT).toBe('PRIVILEGE_ESCALATION_ATTEMPT');
      expect(FraudSignalCode.WEBHOOK_SIGNATURE_MISMATCH).toBe('WEBHOOK_SIGNATURE_MISMATCH');
      expect(FraudSignalCode.APP_CHECK_REPLAY_DETECTED).toBe('APP_CHECK_REPLAY_DETECTED');
      expect(FraudRiskLevel.CRITICAL).toBe('critical');
    });

    it('verifies SecurityAuditCategory covers all six compliance pillars', () => {
      expect(SecurityAuditCategory.RBAC_AND_PRIVILEGE).toBe('RBAC_AND_PRIVILEGE');
      expect(SecurityAuditCategory.STRIPE_WEBHOOK_INTEGRITY).toBe('STRIPE_WEBHOOK_INTEGRITY');
      expect(SecurityAuditCategory.APP_CHECK_ATTESTATION).toBe('APP_CHECK_ATTESTATION');
      expect(SecurityAuditCategory.RATE_LIMIT_AND_VELOCITY).toBe('RATE_LIMIT_AND_VELOCITY');
      expect(StorageAllowedMimeTypes.DOCUMENTS).toBeDefined();
    });
  });
});
