/**
 * Crowdbeats V2 — Content Moderation & Risk Classification Contracts (Phase 5)
 *
 * Defines the state machine, risk categories, and queue payloads for all
 * platform user-generated content and live performance messaging.
 */

export const ModerationState = {
  PENDING_AUTO_SCAN: 'PENDING_AUTO_SCAN',
  PASS: 'PASS',
  FLAGGED: 'FLAGGED',
  IN_REVIEW: 'IN_REVIEW',
  ESCALATED: 'ESCALATED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  QUARANTINED: 'QUARANTINED',
  REMOVED: 'REMOVED',
} as const;

export type ModerationState = (typeof ModerationState)[keyof typeof ModerationState];

export const ModeratedContentType = {
  CREATOR_NAME: 'CREATOR_NAME',
  BIO: 'BIO',
  PROFILE_PHOTO: 'PROFILE_PHOTO',
  COVER_ART: 'COVER_ART',
  SONG_REQUEST_NOTE: 'SONG_REQUEST_NOTE',
  TIP_MESSAGE: 'TIP_MESSAGE',
  CAMPAIGN_TEXT: 'CAMPAIGN_TEXT',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
} as const;

export type ModeratedContentType =
  (typeof ModeratedContentType)[keyof typeof ModeratedContentType];

export const ModerationRiskCategory = {
  CSAM_CSAE: 'CSAM_CSAE',
  VIOLENCE_TERRORISM: 'VIOLENCE_TERRORISM',
  NON_CONSENSUAL_SEXUAL: 'NON_CONSENSUAL_SEXUAL',
  HATE_SPEECH_HARASSMENT: 'HATE_SPEECH_HARASSMENT',
  FRAUD_SCAM: 'FRAUD_SCAM',
  COPYRIGHT_INFRINGEMENT: 'COPYRIGHT_INFRINGEMENT',
  SPAM: 'SPAM',
  GENERAL_PROFANITY: 'GENERAL_PROFANITY',
} as const;

export type ModerationRiskCategory =
  (typeof ModerationRiskCategory)[keyof typeof ModerationRiskCategory];

export const ModerationDecisionAction = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  QUARANTINE: 'QUARANTINE',
  ESCALATE: 'ESCALATE',
  REMOVE: 'REMOVE',
} as const;

export type ModerationDecisionAction =
  (typeof ModerationDecisionAction)[keyof typeof ModerationDecisionAction];

export interface ScreenContentResult {
  readonly passed: boolean;
  readonly state: ModerationState;
  readonly riskCategory?: ModerationRiskCategory;
  readonly riskScore: number; // 0.0 to 1.0
  readonly reasons: readonly string[];
  readonly autoQuarantine: boolean;
  readonly sanitizedText?: string;
}

export interface ModerationQueueItem {
  readonly queueItemId: string;
  readonly contentId: string;
  readonly contentType: ModeratedContentType;
  readonly textSnippet?: string;
  readonly mediaUrl?: string;
  readonly authorUid: string;
  readonly targetCreatorId?: string;
  readonly state: ModerationState;
  readonly riskCategory?: ModerationRiskCategory;
  readonly riskScore: number;
  readonly flaggedReasons: readonly string[];
  readonly autoQuarantined: boolean;
  readonly reviewedByUid?: string;
  readonly reviewNotes?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resolvedAt?: string;
}

export interface ReviewModerationItemRequest {
  readonly queueItemId: string;
  readonly action: ModerationDecisionAction;
  readonly notes?: string;
}
