/**
 * Crowdbeats V2 — Audit Event, Idempotency, and Enterprise Staff Contracts (Phase 3 & 10)
 *
 * Collection paths:
 * - /auditEvents/{eventId}   — SERVER_ONLY, IMMUTABLE, APPEND-ONLY
 * - /idempotencyKeys/{key}   — SERVER_ONLY, 24h TTL
 * - /staffRecords/{staffUid} — SERVER_ONLY, Step-up required
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { PlatformRole } from '../identity/roles';

// ─── Audit Event ──────────────────────────────────────────────────────────────

export const AuditAction = {
  // User account
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_REACTIVATED: 'USER_REACTIVATED',
  USER_CONSENT_GRANTED: 'USER_CONSENT_GRANTED',
  USER_CONSENT_REVOKED: 'USER_CONSENT_REVOKED',

  // Auth / claims
  CLAIMS_UPDATED: 'CLAIMS_UPDATED',
  STAFF_ROLE_GRANTED: 'STAFF_ROLE_GRANTED',
  STAFF_ROLE_REVOKED: 'STAFF_ROLE_REVOKED',
  STEP_UP_AUTH_COMPLETED: 'STEP_UP_AUTH_COMPLETED',
  MAKER_CHECKER_REQUESTED: 'MAKER_CHECKER_REQUESTED',
  MAKER_CHECKER_APPROVED: 'MAKER_CHECKER_APPROVED',

  // Profiles
  ARTIST_PROFILE_CREATED: 'ARTIST_PROFILE_CREATED',
  ARTIST_VERIFIED: 'ARTIST_VERIFIED',
  PERFORMER_SUSPENDED: 'PERFORMER_SUSPENDED',
  PERFORMER_REINSTATED: 'PERFORMER_REINSTATED',
  BAND_CREATED: 'BAND_CREATED',
  BAND_MEMBER_ADDED: 'BAND_MEMBER_ADDED',
  BAND_MEMBER_REMOVED: 'BAND_MEMBER_REMOVED',
  BAND_SPLIT_CONFIG_UPDATED: 'BAND_SPLIT_CONFIG_UPDATED',
  VENUE_CREATED: 'VENUE_CREATED',
  SPONSOR_ORG_CREATED: 'SPONSOR_ORG_CREATED',
  SPONSOR_ORG_VERIFIED: 'SPONSOR_ORG_VERIFIED',

  // Financial
  TIP_CREATED: 'TIP_CREATED',
  TIP_SUCCEEDED: 'TIP_SUCCEEDED',
  TIP_REFUNDED: 'TIP_REFUNDED',
  REFUND_APPROVED: 'REFUND_APPROVED',
  TIP_DISPUTED: 'TIP_DISPUTED',
  PAYOUT_REQUESTED: 'PAYOUT_REQUESTED',
  PAYOUT_INITIATED: 'PAYOUT_INITIATED',
  PAYOUT_COMPLETED: 'PAYOUT_COMPLETED',
  PAYOUT_FAILED: 'PAYOUT_FAILED',
  BANK_LINKED: 'BANK_LINKED',
  BANK_UNLINKED: 'BANK_UNLINKED',

  // Sessions
  SESSION_CREATED: 'SESSION_CREATED',
  SESSION_STARTED: 'SESSION_STARTED',
  SESSION_ENDED: 'SESSION_ENDED',
  QR_TOKEN_ISSUED: 'QR_TOKEN_ISSUED',
  QR_TOKEN_REDEEMED: 'QR_TOKEN_REDEEMED',

  // Sponsorship
  SPONSORSHIP_PROPOSED: 'SPONSORSHIP_PROPOSED',
  SPONSORSHIP_SIGNED: 'SPONSORSHIP_SIGNED',
  MATCH_POOL_CREATED: 'MATCH_POOL_CREATED',

  // Moderation
  REPORT_CREATED: 'REPORT_CREATED',
  MODERATION_ACTION_TAKEN: 'MODERATION_ACTION_TAKEN',
  CONTENT_REMOVED: 'CONTENT_REMOVED',

  // Data / Privacy
  DATA_EXPORT_REQUESTED: 'DATA_EXPORT_REQUESTED',
  DATA_EXPORT_COMPLETED: 'DATA_EXPORT_COMPLETED',
  DATA_DELETION_REQUESTED: 'DATA_DELETION_REQUESTED',
  DATA_DELETION_COMPLETED: 'DATA_DELETION_COMPLETED',
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export interface AuditEvent {
  readonly eventId: string;
  readonly action: AuditAction;
  readonly actorUid: string; // Who performed the action (uid or 'system')
  readonly actorType: 'user' | 'staff' | 'system' | 'stripe_webhook';
  readonly targetId?: string; // Resource being acted upon
  readonly targetType?: string; // e.g. 'user', 'tip', 'band', 'staff'
  readonly metadata: Record<string, unknown>; // Safe non-sensitive context
  readonly correlationId: string;
  readonly createdAt: IsoTimestamp;
  readonly ipAddressHash?: string; // SHA-256 of IP
  readonly platform?: 'ios' | 'android' | 'web' | 'server';
}

// ─── Enterprise Staff Record ──────────────────────────────────────────────────

export interface EnterpriseStaffRecord {
  readonly uid: string;
  readonly email: string;
  readonly displayName: string;
  readonly platformRole: PlatformRole;
  readonly grantedByUid: string;
  readonly grantedAt: IsoTimestamp;
  readonly isActive: boolean;
  readonly lastActiveAt?: IsoTimestamp;
}

export interface GrantStaffRolePayload {
  readonly targetUid: string;
  readonly targetEmail: string;
  readonly role: PlatformRole;
  readonly confirmationPhrase: string; // "GRANT {ROLE}"
}

export interface RevokeStaffRolePayload {
  readonly targetUid: string;
  readonly confirmationPhrase: string; // "REVOKE {ROLE}"
}

export interface SuspendAccountPayload {
  readonly targetUid: string;
  readonly targetType: 'user' | 'artist' | 'band' | 'venue' | 'sponsor';
  readonly reason: string;
  readonly confirmationPhrase: string; // "SUSPEND ACCOUNT"
}

export interface ReinstateAccountPayload {
  readonly targetUid: string;
  readonly targetType: 'user' | 'artist' | 'band' | 'venue' | 'sponsor';
  readonly reason: string;
}

export interface ApproveStaffRefundPayload {
  readonly tipId: string;
  readonly reason: string;
  readonly confirmationPhrase: string; // "APPROVE REFUND"
}

// ─── Idempotency Record ───────────────────────────────────────────────────────

export interface IdempotencyRecord {
  readonly key: string;
  readonly uid: string;
  readonly operation: string;
  readonly status: 'processing' | 'succeeded' | 'failed';
  readonly responseSnapshot?: unknown;
  readonly createdAt: IsoTimestamp;
  readonly expiresAt: IsoTimestamp;
}

export const IDEMPOTENCY_TTL_HOURS = 24 as const;

export function buildIdempotencyKey(uid: string, operation: string, clientKey: string): string {
  return `${uid}:${operation}:${clientKey}`;
}
