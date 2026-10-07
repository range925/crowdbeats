/**
 * Crowdbeats V2 — Dispute Evidence Aggregation Service Tests (Phase 11 Compliance)
 *
 * Unit tests verifying:
 * 1. Dispute evidence compilation from session telemetry, performer slug, tip moderation, and legal refund disclosure.
 * 2. Submission of standardized evidence to Stripe via StripeAdapter.
 * 3. Immutable audit logging for all evidence submissions.
 * 4. Error handling for nonexistent dispute records.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const store: Record<string, Record<string, unknown>> = {};

const _mockDoc = (cId: string, dId?: string) => {
  const docId = dId || `doc_${Math.random()}`;
  return {
    id: docId,
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

const mockSubmitDisputeEvidence = jest
  .fn<() => Promise<{ id: string; status: string }>>()
  .mockResolvedValue({ id: 'dp_123', status: 'under_review' });

jest.mock('../../lib/stripe', () => ({
  stripe: {
    submitDisputeEvidence: (...args: any[]) => mockSubmitDisputeEvidence(...(args as [])),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  compileDisputeEvidence,
  submitDisputeEvidence,
  getDisputeRecord,
} = require('../disputeEvidenceService');

describe('Dispute Evidence Aggregation Service (Phase 11)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);

    store['disputes/dp_123'] = {
      disputeId: 'dp_123',
      chargeId: 'ch_123',
      tipId: 'tip_456',
      recipientId: 'artist_789',
      amountCents: 2500,
      reason: 'fraudulent',
      status: 'needs_response',
    };
    store['tips/tip_456'] = {
      tipId: 'tip_456',
      recipientId: 'artist_789',
      amountCents: 2500,
      message: 'Keep playing that jazz track!',
      moderationStatus: 'PASS',
      sessionId: 'session_live_88',
      createdAt: { toDate: () => new Date('2026-08-27T12:00:00Z') },
    };
    store['users/artist_789'] = {
      uid: 'artist_789',
      displayName: 'Miles Jazz',
      slug: 'miles-jazz',
    };
    store['sessions/session_live_88'] = {
      sessionId: 'session_live_88',
      performerUid: 'artist_789',
      title: 'Afternoon Live Jazz Set',
    };
  });

  describe('compileDisputeEvidence', () => {
    it('compiles comprehensive evidence including session logs and refund policy URL', async () => {
      const evidence = await compileDisputeEvidence(mockFirestore as any, 'dp_123');

      expect(evidence.productDescription).toContain('$25.00');
      expect(evidence.productDescription).toContain('@miles-jazz');
      expect(evidence.accessActivityLog).toContain('session_live_88');
      expect(evidence.accessActivityLog).toContain('Keep playing that jazz track!');
      expect(evidence.cancellationPolicyDisclosure).toContain('https://crowdbeats.ai/legal/refund-dispute-policy');
      expect(evidence.refundPolicyUrl).toBe('https://crowdbeats.ai/legal/refund-dispute-policy');

      // Verify evidence stored in Firestore
      expect(store['disputes/dp_123'].compiledEvidence).toBeDefined();
    });

    it('throws when dispute does not exist', async () => {
      await expect(
        compileDisputeEvidence(mockFirestore as any, 'nonexistent_dispute'),
      ).rejects.toThrow(/not found/);
    });
  });

  describe('submitDisputeEvidence', () => {
    it('submits evidence to Stripe and updates dispute status', async () => {
      const result = await submitDisputeEvidence(mockFirestore as any, 'risk_officer_1', {
        disputeId: 'dp_123',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('evidence_submitted');

      expect(mockSubmitDisputeEvidence).toHaveBeenCalled();

      const updatedDispute = store['disputes/dp_123'];
      expect(updatedDispute.status).toBe('evidence_submitted');
      expect(updatedDispute.evidenceSubmittedByUid).toBe('risk_officer_1');

      // Verify audit log
      const auditKeys = Object.keys(store).filter((k) => k.startsWith('auditLogs/'));
      expect(auditKeys.length).toBe(1);
      expect(store[auditKeys[0]].action).toBe('DISPUTE_EVIDENCE_SUBMITTED');
    });
  });

  describe('getDisputeRecord', () => {
    it('retrieves dispute record', async () => {
      const record = await getDisputeRecord(mockFirestore as any, 'dp_123');
      expect(record.disputeId).toBe('dp_123');
      expect(record.amountCents).toBe(2500);
    });
  });
});
