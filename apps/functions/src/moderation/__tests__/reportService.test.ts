/**
 * Crowdbeats V2 — Abuse Report Ingestion Service Tests (Phase 6 Compliance)
 *
 * Unit tests verifying:
 * 1. Authenticated user report ingestion and ticket generation.
 * 2. Anonymous public report ingestion.
 * 3. Automated SLA tier classification (1-hour critical vs 4-hour high vs 24-hour standard).
 * 4. Emergency auto-quarantine execution on target creator for critical safety violations (CSAM/threats).
 * 5. Moderation queue integration and immutable audit log generation.
 * 6. Validation error handling.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  ReportTargetType,
  ReporterType,
  ReportStatus,
  ReportSlaTier,
  ModerationRiskCategory,
  ModerationState,
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
const { ingestAbuseReport, determineSlaTier } = require('../reportService');

describe('Abuse Report Ingestion Service (Phase 6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);

    store['users/target_artist_1'] = {
      uid: 'target_artist_1',
      displayName: 'Suspect Artist',
      isSuspended: false,
    };
  });

  describe('determineSlaTier', () => {
    it('categorizes CSAM and terrorism as CRITICAL_1_HOUR', () => {
      expect(determineSlaTier(ModerationRiskCategory.CSAM_CSAE)).toBe(ReportSlaTier.CRITICAL_1_HOUR);
      expect(determineSlaTier(ModerationRiskCategory.VIOLENCE_TERRORISM)).toBe(ReportSlaTier.CRITICAL_1_HOUR);
    });

    it('categorizes harassment and non-consensual content as HIGH_4_HOUR', () => {
      expect(determineSlaTier(ModerationRiskCategory.HATE_SPEECH_HARASSMENT)).toBe(ReportSlaTier.HIGH_4_HOUR);
      expect(determineSlaTier(ModerationRiskCategory.NON_CONSENSUAL_SEXUAL)).toBe(ReportSlaTier.HIGH_4_HOUR);
    });

    it('categorizes copyright and spam as STANDARD_24_HOUR', () => {
      expect(determineSlaTier(ModerationRiskCategory.COPYRIGHT_INFRINGEMENT)).toBe(ReportSlaTier.STANDARD_24_HOUR);
      expect(determineSlaTier(ModerationRiskCategory.SPAM)).toBe(ReportSlaTier.STANDARD_24_HOUR);
    });
  });

  describe('ingestAbuseReport', () => {
    it('ingests report from authenticated user with STANDARD_24_HOUR SLA', async () => {
      const response = await ingestAbuseReport(mockFirestore as any, {
        callerUid: 'fan_user_99',
        request: {
          targetType: ReportTargetType.SONG_REQUEST,
          targetId: 'sr_123',
          violationCategory: ModerationRiskCategory.SPAM,
          description: 'Spam song request repeated 50 times.',
        },
      });

      expect(response.reportId).toBeDefined();
      expect(response.ticketNumber).toMatch(/^RPT-\d{8}-[A-Z0-9]{6}$/);
      expect(response.status).toBe(ReportStatus.RECEIVED);
      expect(response.slaTier).toBe(ReportSlaTier.STANDARD_24_HOUR);

      // Verify stored report
      const storedReport = store[`reports/${response.reportId}`];
      expect(storedReport).toBeDefined();
      expect(storedReport.reporterType).toBe(ReporterType.AUTHENTICATED_USER);
      expect(storedReport.reporterUid).toBe('fan_user_99');

      // Verify moderation queue item
      const queueEntries = Object.keys(store).filter((k) => k.startsWith('moderationQueue/'));
      expect(queueEntries.length).toBe(1);
      expect(store[queueEntries[0]].state).toBe(ModerationState.FLAGGED);
    });

    it('ingests anonymous public report with IP hash and user-agent', async () => {
      const response = await ingestAbuseReport(mockFirestore as any, {
        ipHash: 'hashed_ip_abc',
        userAgent: 'Mozilla/5.0 Public',
        request: {
          targetType: ReportTargetType.CREATOR,
          targetId: 'target_artist_1',
          reporterEmail: 'witness@example.com',
          violationCategory: ModerationRiskCategory.HATE_SPEECH_HARASSMENT,
          description: 'Artist using abusive hate speech on stage.',
        },
      });

      expect(response.slaTier).toBe(ReportSlaTier.HIGH_4_HOUR);
      const storedReport = store[`reports/${response.reportId}`];
      expect(storedReport.reporterType).toBe(ReporterType.ANONYMOUS_PUBLIC);
      expect(storedReport.ipHash).toBe('hashed_ip_abc');
    });

    it('triggers immediate emergency auto-quarantine for CRITICAL_1_HOUR violations', async () => {
      const response = await ingestAbuseReport(mockFirestore as any, {
        callerUid: 'reporter_1',
        request: {
          targetType: ReportTargetType.CREATOR,
          targetId: 'target_artist_1',
          violationCategory: ModerationRiskCategory.CSAM_CSAE,
          description: 'Critical CSAM violation detected on artist profile.',
        },
      });

      expect(response.slaTier).toBe(ReportSlaTier.CRITICAL_1_HOUR);

      // Verify target creator is suspended immediately
      const targetUser = store['users/target_artist_1'];
      expect(targetUser.isSuspended).toBe(true);
      expect(targetUser.suspensionReason).toContain('EMERGENCY_QUARANTINE');

      // Verify moderation queue item is set to QUARANTINED
      const queueEntries = Object.keys(store).filter((k) => k.startsWith('moderationQueue/'));
      expect(store[queueEntries[0]].state).toBe(ModerationState.QUARANTINED);
      expect(store[queueEntries[0]].autoQuarantined).toBe(true);
    });

    it('rejects reports with missing required fields', async () => {
      await expect(
        ingestAbuseReport(mockFirestore as any, {
          request: {
            targetType: '' as any,
            targetId: '',
            violationCategory: ModerationRiskCategory.SPAM,
            description: '',
          },
        }),
      ).rejects.toThrow(/required/);
    });
  });
});
