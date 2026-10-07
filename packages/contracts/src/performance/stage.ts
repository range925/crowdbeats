/**
 * Crowdbeats V2 — Stage and Stage Session Contracts (Phase 3)
 *
 * Collection paths:
 * - /stages/{stageId}
 * - /stageSessions/{sessionId}
 *
 * INVARIANTS:
 * - Sessions are SERVER-CREATED by venue manager callable
 * - Only one active session per stage at a time (enforced by server)
 * - endedAt is set by server only — clients cannot end a session directly
 */

import type { IsoTimestamp } from '../common/timestamp';

// ─── Stage ────────────────────────────────────────────────────────────────────

export interface Stage {
  readonly stageId: string;
  readonly venueId: string;
  readonly name: string;
  readonly description?: string;
  readonly capacity?: number;
  readonly isActive: boolean;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export const STAGE_NAME_MAX = 80 as const;

// ─── Stage Session ────────────────────────────────────────────────────────────

export const SessionStatus = {
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  ENDED: 'ended',
  CANCELLED: 'cancelled',
} as const;

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export interface StageSession {
  readonly sessionId: string;
  readonly stageId: string;
  readonly venueId: string;
  /** Performing artist ID (solo) or band ID. */
  readonly performerId: string;
  readonly performerType: 'artist' | 'band';
  readonly performerName: string; // Snapshot
  readonly status: SessionStatus;
  readonly scheduledStartAt?: IsoTimestamp;
  readonly startedAt?: IsoTimestamp; // SERVER-SET on activation
  readonly endedAt?: IsoTimestamp; // SERVER-SET on end
  /** QR code payload prefix for this session. */
  readonly qrPrefix: string;
  /** Total tips received during session. SERVER_ONLY. */
  readonly totalTipsReceivedCents: number;
  /** Total tip count. SERVER_ONLY. */
  readonly tipCount: number;
  readonly createdByUid: string;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateSessionPayload {
  readonly stageId: string;
  readonly venueId: string;
  readonly performerId: string;
  readonly performerType: 'artist' | 'band';
  readonly scheduledStartAt?: IsoTimestamp;
  readonly idempotencyKey: string;
}

export interface SessionPublicProjection {
  readonly sessionId: string;
  readonly stageId: string;
  readonly venueId: string;
  readonly performerName: string;
  readonly status: SessionStatus;
  readonly startedAt?: string;
}
