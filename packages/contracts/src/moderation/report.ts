/**
 * Crowdbeats V2 — Moderation Contracts (Phase 3)
 *
 * Collection paths:
 * - /reports/{reportId}
 * - /moderationActions/{actionId}
 * - /fraudSignals/{signalId}
 */

import type { IsoTimestamp } from '../common/timestamp';

// ─── Report ───────────────────────────────────────────────────────────────────

export const ReportReason = {
  SPAM: 'spam',
  HARASSMENT: 'harassment',
  HATE_SPEECH: 'hate_speech',
  NUDITY: 'nudity',
  VIOLENCE: 'violence',
  FRAUD: 'fraud',
  IMPERSONATION: 'impersonation',
  INTELLECTUAL_PROPERTY: 'intellectual_property',
  OTHER: 'other',
} as const;

export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

export const ReportStatus = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export interface Report {
  readonly reportId: string;
  readonly reporterUid: string;
  readonly targetId: string;
  readonly targetType: 'user' | 'artist' | 'band' | 'venue' | 'tip' | 'message' | 'campaign';
  readonly reason: ReportReason;
  readonly description?: string;
  readonly status: ReportStatus;
  readonly assignedToUid?: string; // CONTENT_MODERATOR
  readonly resolvedAt?: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export const REPORT_DESCRIPTION_MAX = 500 as const;

// ─── Moderation Action ────────────────────────────────────────────────────────

export const ModerationActionType = {
  WARNING_ISSUED: 'WARNING_ISSUED',
  CONTENT_REMOVED: 'CONTENT_REMOVED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_BANNED: 'ACCOUNT_BANNED',
  REPORT_DISMISSED: 'REPORT_DISMISSED',
  APPEALED: 'APPEALED',
  APPEAL_GRANTED: 'APPEAL_GRANTED',
  APPEAL_DENIED: 'APPEAL_DENIED',
} as const;

export type ModerationActionType = (typeof ModerationActionType)[keyof typeof ModerationActionType];

export interface ModerationAction {
  readonly actionId: string;
  readonly reportId?: string;
  readonly targetUid: string;
  readonly actionType: ModerationActionType;
  readonly takenByUid: string; // CONTENT_MODERATOR or TRUST_SAFETY
  readonly reason: string;
  readonly suspensionEndsAt?: IsoTimestamp; // For temporary suspensions
  readonly createdAt: IsoTimestamp;
}

// ─── Fraud Signal ─────────────────────────────────────────────────────────────

export const FraudSignalType = {
  UNUSUAL_TIP_VELOCITY: 'UNUSUAL_TIP_VELOCITY',
  MULTIPLE_CARD_FAILURES: 'MULTIPLE_CARD_FAILURES',
  CHARGEBACK_PATTERN: 'CHARGEBACK_PATTERN',
  SUSPICIOUS_PAYOUT: 'SUSPICIOUS_PAYOUT',
  VELOCITY_LIMIT_BREACH: 'VELOCITY_LIMIT_BREACH',
  DEVICE_FINGERPRINT_MISMATCH: 'DEVICE_FINGERPRINT_MISMATCH',
  STRIPE_RADAR_FLAG: 'STRIPE_RADAR_FLAG',
} as const;

export type FraudSignalType = (typeof FraudSignalType)[keyof typeof FraudSignalType];

export interface FraudSignal {
  readonly signalId: string;
  readonly uid: string;
  readonly signalType: FraudSignalType;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly metadata: Record<string, unknown>;
  readonly autoHoldApplied: boolean;
  readonly reviewedByUid?: string; // TRUST_SAFETY
  readonly resolvedAt?: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}
