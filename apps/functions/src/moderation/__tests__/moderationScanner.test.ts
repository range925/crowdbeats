/**
 * Crowdbeats V2 — Content Moderation Scanner Tests (Phase 5 Compliance)
 *
 * Unit tests verifying:
 * 1. Zero-tolerance CSAM / CSAE detection triggers immediate auto-quarantine.
 * 2. Terrorism and violent threats trigger immediate auto-quarantine.
 * 3. Severe hate speech and non-consensual sexual content trigger auto-quarantine.
 * 4. Financial fraud and carding solicitation trigger auto-quarantine.
 * 5. Borderline profanity is flagged, sanitized, and queued for review.
 * 6. Clean text passes with zero risk score.
 * 7. Enqueueing moderation items stores accurate records in Firestore.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  ModerationState,
  ModeratedContentType,
  ModerationRiskCategory,
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
  };
};

const mockFirestore = {
  collection: (cId: string) => ({
    doc: (dId?: string) => _mockDoc(cId, dId),
  }),
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
const { screenTextContent, enqueueModerationItem } = require('../moderationScanner');

describe('Content Moderation Scanner (Phase 5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  describe('screenTextContent', () => {
    it('passes clean musician compliment with PASS state', () => {
      const result = screenTextContent('Amazing guitar solo tonight! Keep rocking!', ModeratedContentType.TIP_MESSAGE);
      expect(result.passed).toBe(true);
      expect(result.state).toBe(ModerationState.PASS);
      expect(result.riskScore).toBe(0.0);
      expect(result.autoQuarantine).toBe(false);
    });

    it('quarantines CSAM/CSAE with zero-tolerance and maximum risk score', () => {
      const result = screenTextContent('check this csam link now', ModeratedContentType.CHAT_MESSAGE);
      expect(result.passed).toBe(false);
      expect(result.state).toBe(ModerationState.QUARANTINED);
      expect(result.riskCategory).toBe(ModerationRiskCategory.CSAM_CSAE);
      expect(result.riskScore).toBe(1.0);
      expect(result.autoQuarantine).toBe(true);
    });

    it('quarantines terrorism and mass violence threats', () => {
      const result = screenTextContent('bomb threat at the concert hall tonight', ModeratedContentType.TIP_MESSAGE);
      expect(result.passed).toBe(false);
      expect(result.state).toBe(ModerationState.QUARANTINED);
      expect(result.riskCategory).toBe(ModerationRiskCategory.VIOLENCE_TERRORISM);
      expect(result.riskScore).toBe(1.0);
      expect(result.autoQuarantine).toBe(true);
    });

    it('quarantines severe hate speech slurs', () => {
      const result = screenTextContent('get off stage you n1gger', ModeratedContentType.TIP_MESSAGE);
      expect(result.passed).toBe(false);
      expect(result.state).toBe(ModerationState.QUARANTINED);
      expect(result.riskCategory).toBe(ModerationRiskCategory.HATE_SPEECH_HARASSMENT);
      expect(result.autoQuarantine).toBe(true);
    });

    it('quarantines carding / financial fraud solicitation', () => {
      const result = screenTextContent('buy cvv dump and stolen cc at darkweb', ModeratedContentType.TIP_MESSAGE);
      expect(result.passed).toBe(false);
      expect(result.state).toBe(ModerationState.QUARANTINED);
      expect(result.riskCategory).toBe(ModerationRiskCategory.FRAUD_SCAM);
      expect(result.autoQuarantine).toBe(true);
    });

    it('flags and sanitizes general profanity while allowing message through', () => {
      const result = screenTextContent('That was a fucking great song!', ModeratedContentType.TIP_MESSAGE);
      expect(result.passed).toBe(true);
      expect(result.state).toBe(ModerationState.FLAGGED);
      expect(result.riskCategory).toBe(ModerationRiskCategory.GENERAL_PROFANITY);
      expect(result.sanitizedText).toContain('***');
      expect(result.autoQuarantine).toBe(false);
    });
  });

  describe('enqueueModerationItem', () => {
    it('writes flagged item to moderationQueue in Firestore', async () => {
      const screenResult = screenTextContent('bad message with shit words', ModeratedContentType.TIP_MESSAGE);

      const item = await enqueueModerationItem(mockFirestore as any, {
        contentId: 'tip_999',
        contentType: ModeratedContentType.TIP_MESSAGE,
        authorUid: 'fan_123',
        textSnippet: 'bad message with shit words',
        targetCreatorId: 'artist_456',
        screenResult,
      });

      expect(item.queueItemId).toBeDefined();
      expect(item.authorUid).toBe('fan_123');
      expect(item.targetCreatorId).toBe('artist_456');
      expect(store[`moderationQueue/${item.queueItemId}`]).toBeDefined();
      expect(store[`moderationQueue/${item.queueItemId}`].state).toBe(ModerationState.FLAGGED);
    });
  });
});
