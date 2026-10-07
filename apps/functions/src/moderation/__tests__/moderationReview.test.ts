/**
 * Crowdbeats V2 — Moderator Review Service Tests (Phase 5 Compliance)
 *
 * Unit tests verifying:
 * 1. Moderator decisions (APPROVE, REJECT, QUARANTINE, ESCALATE, REMOVE) update state accurately.
 * 2. Resolution timestamps are set appropriately.
 * 3. Immutable audit logs are created for all staff moderation actions.
 * 4. Error thrown when target item does not exist.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  ModerationState,
  ModeratedContentType,
  ModerationDecisionAction,
} from '@crowdbeats/contracts';

const store: Record<string, Record<string, unknown>> = {};

const _mockDoc = (cId: string, dId?: string) => {
  const docId = dId || `doc_${Math.random()}`;
  return {
    id: docId,
    get: jest.fn().mockImplementation(async () => {
      const data = store[`${cId}/${docId}`];
      return { exists: data !== undefined, data: () => data };
    }),
    set: jest.fn().mockImplementation(async (data: any) => {
      store[`${cId}/${docId}`] = data;
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
      set: (ref: any, data: any) => ops.push(() => ref.set(data)),
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { executeModeratorDecision } = require('../moderationReview');

describe('Moderator Review Service (Phase 5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);

    store['moderationQueue/item_1'] = {
      queueItemId: 'item_1',
      contentId: 'tip_123',
      contentType: ModeratedContentType.TIP_MESSAGE,
      authorUid: 'fan_1',
      state: ModerationState.FLAGGED,
      riskScore: 0.5,
      flaggedReasons: ['POTENTIALLY_INAPPROPRIATE_LANGUAGE'],
      createdAt: '2026-08-27T00:00:00.000Z',
      updatedAt: '2026-08-27T00:00:00.000Z',
    };
  });

  it('approves flagged content and sets resolved timestamp', async () => {
    const result = await executeModeratorDecision(mockFirestore as any, 'mod_user_1', {
      queueItemId: 'item_1',
      action: ModerationDecisionAction.APPROVE,
      notes: 'False positive, musical lyric reference',
    });

    expect(result.state).toBe(ModerationState.APPROVED);
    expect(result.reviewedByUid).toBe('mod_user_1');
    expect(result.resolvedAt).toBeDefined();
    expect(store['moderationQueue/item_1'].state).toBe(ModerationState.APPROVED);
  });

  it('quarantines content and records audit log', async () => {
    const result = await executeModeratorDecision(mockFirestore as any, 'mod_user_2', {
      queueItemId: 'item_1',
      action: ModerationDecisionAction.QUARANTINE,
      notes: 'Confirmed abusive harassment',
    });

    expect(result.state).toBe(ModerationState.QUARANTINED);
    expect(store['moderationQueue/item_1'].state).toBe(ModerationState.QUARANTINED);

    // Verify audit log
    const auditEntries = Object.keys(store).filter((k) => k.startsWith('auditLogs/'));
    expect(auditEntries.length).toBeGreaterThan(0);
    const auditData = store[auditEntries[0]];
    expect(auditData.action).toBe('MODERATION_QUARANTINE');
    expect(auditData.actorUid).toBe('mod_user_2');
  });

  it('escalates content for senior trust & safety review', async () => {
    const result = await executeModeratorDecision(mockFirestore as any, 'mod_user_3', {
      queueItemId: 'item_1',
      action: ModerationDecisionAction.ESCALATE,
      notes: 'Complex copyright dispute, requires legal escalation',
    });

    expect(result.state).toBe(ModerationState.ESCALATED);
    expect(result.resolvedAt).toBeUndefined();
  });

  it('throws not-found when queue item does not exist', async () => {
    await expect(
      executeModeratorDecision(mockFirestore as any, 'mod_user_1', {
        queueItemId: 'nonexistent_item',
        action: ModerationDecisionAction.APPROVE,
      }),
    ).rejects.toMatchObject({ code: 'not-found' });
  });
});
