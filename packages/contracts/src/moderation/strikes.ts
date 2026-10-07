/**
 * Crowdbeats V2 — Repeat Offender & Disciplinary Strike Contracts (Phase 7)
 *
 * Defines deterministic strike tiers, status models, and progression rules
 * for content creators and platform participants.
 */

import { ModerationRiskCategory } from './moderation.js';

export const StrikeTier = {
  STRIKE_1_WARNING: 'STRIKE_1_WARNING',
  STRIKE_2_RESTRICTION: 'STRIKE_2_RESTRICTION',
  STRIKE_3_SUSPENSION: 'STRIKE_3_SUSPENSION',
  STRIKE_4_TERMINATION: 'STRIKE_4_TERMINATION',
  ZERO_TOLERANCE_BAN: 'ZERO_TOLERANCE_BAN',
} as const;

export type StrikeTier = (typeof StrikeTier)[keyof typeof StrikeTier];

export const StrikeStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  REVERSED_ON_APPEAL: 'REVERSED_ON_APPEAL',
} as const;

export type StrikeStatus = (typeof StrikeStatus)[keyof typeof StrikeStatus];

export interface StrikeRecord {
  readonly strikeId: string;
  readonly targetUid: string;
  readonly strikeNumber: number;
  readonly tier: StrikeTier;
  readonly reason: string;
  readonly violationCategory: ModerationRiskCategory;
  readonly evidenceReportId?: string;
  readonly evidenceUrl?: string;
  readonly issuedByUid: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly status: StrikeStatus;
  readonly appealId?: string;
  readonly appealResolution?: string;
}

export interface RepeatOffenderEvaluation {
  readonly targetUid: string;
  readonly activeStrikeCount: number;
  readonly strikes: readonly StrikeRecord[];
  readonly currentTier: StrikeTier | null;
  readonly isDemonetized: boolean;
  readonly isSuspended: boolean;
  readonly isTerminated: boolean;
  readonly canMonetize: boolean;
  readonly evaluatedAt: string;
}

export interface IssueStrikeRequest {
  readonly targetUid: string;
  readonly reason: string;
  readonly violationCategory: ModerationRiskCategory;
  readonly evidenceReportId?: string;
  readonly evidenceUrl?: string;
  readonly forceZeroTolerance?: boolean;
}

export interface ResolveStrikeRequest {
  readonly strikeId: string;
  readonly resolution: 'REVERSED_ON_APPEAL' | 'EXPIRED';
  readonly notes?: string;
}
