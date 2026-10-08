/**
 * Crowdbeats V2 — Session Recovery & Cleanup Proof Contracts (Phase 10)
 *
 * Enforces resilient offline behavior, lifecycle recovery, truthful status guarantees,
 * monotonic sequences, bounded backpressure queueing, and terminal cleanup invariant checks.
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { DeviceAttestationContext } from './liveLocation';

/**
 * Terminal cleanup reasons that trigger a complete teardown of all location resources.
 */
export type TerminalCleanupReason =
  | 'performer_ended'
  | 'admin_ended'
  | 'expired'
  | 'logged_out'
  | 'permission_revoked'
  | 'account_suspended'
  | 'policy_incompatible';

/**
 * Invariant verification report produced after terminal teardown.
 * Confirms that zero resources or coordinates are retained in memory or active execution.
 */
export interface TerminalStateInvariantReport {
  readonly zeroSensors: boolean;
  readonly zeroBackgroundServices: boolean;
  readonly zeroListeners: boolean;
  readonly zeroPrivateCoordinates: boolean;
  readonly allPassed: boolean;
  readonly timestamp: IsoTimestamp;
  readonly reason: TerminalCleanupReason;
}

/**
 * High-level actionable creator recovery UX states.
 */
export type CreatorRecoveryState =
  | 'connected'
  | 'reconnecting'
  | 'needs_permission'
  | 'needs_reverification'
  | 'expired'
  | 'ended_by_admin';

/**
 * Reconcile session state request payload.
 */
export interface ReconcileSessionRequest {
  readonly sessionId?: string;
  readonly profileId?: string;
  readonly role?: 'artist' | 'band' | 'fan';
  readonly clientTimestamp: IsoTimestamp;
  readonly cachedLeaseEndsAt?: IsoTimestamp;
  readonly attestationContext?: DeviceAttestationContext;
}

/**
 * Reconciled status of an individual fan audience grant.
 */
export interface FanGrantReconciliationItem {
  readonly grantId: string;
  readonly sessionId: string;
  readonly performerId: string;
  readonly status: 'active' | 'expired' | 'revoked' | 'session_ended';
  readonly isShared: boolean;
  readonly remainingMs?: number;
}

/**
 * Authoritative session reconciliation response from server.
 */
export interface ReconcileSessionResponse {
  readonly sessionId?: string;
  readonly isLive: boolean;
  readonly status: 'live' | 'ended' | 'admin_ended' | 'expired' | 'not_found' | 'none';
  readonly serverTimestamp: IsoTimestamp;
  readonly endsAt?: IsoTimestamp;
  readonly leaseRemainingSeconds?: number;
  /** Difference in seconds: Math.round((clientTimestamp - serverTimestamp) / 1000) */
  readonly clockSkewSeconds: number;
  readonly terminalReason?: TerminalCleanupReason;
  readonly fanGrants?: readonly FanGrantReconciliationItem[];
  readonly requiresReVerification?: boolean;
  readonly requiresPermissionUpgrade?: boolean;
  readonly isAccountSuspended?: boolean;
}

/**
 * Report terminal cleanup request payload (audit).
 */
export interface ReportTerminalCleanupRequest {
  readonly sessionId?: string;
  readonly performerId: string;
  readonly report: TerminalStateInvariantReport;
}

export interface ReportTerminalCleanupResponse {
  readonly acknowledged: boolean;
  readonly recordedAt: IsoTimestamp;
}

/**
 * Constants for resilience & queue bounding.
 */
export const RESILIENCE_LIMITS = {
  /** Maximum number of samples buffered before oldest-dropped policy kicks in. */
  MAX_BOUNDED_QUEUE_CAPACITY: 30,
  /** Maximum plausible velocity (45 m/s ≈ 162 km/h / 100 mph) to filter teleportation glitches. */
  MAX_VELOCITY_MPS: 45,
  /** Base backoff duration in ms. */
  BACKOFF_BASE_MS: 1500,
  /** Max backoff duration in ms. */
  BACKOFF_MAX_MS: 30000,
  /** Warning threshold for clock skew in seconds. */
  CLOCK_SKEW_WARNING_SECONDS: 120,
} as const;

/**
 * Computes clock skew between client and server in seconds.
 * Positive value indicates client clock is ahead of server; negative indicates behind.
 */
export function computeClockSkewSeconds(
  clientTimestampIso: string,
  serverTimestampIso: string,
): number {
  const clientMs = new Date(clientTimestampIso).getTime();
  const serverMs = new Date(serverTimestampIso).getTime();
  if (isNaN(clientMs) || isNaN(serverMs)) return 0;
  return Math.round((clientMs - serverMs) / 1000);
}

/**
 * Calculates exponential backoff with full jitter.
 */
export function calculateBackoffWithJitter(
  attempt: number,
  baseMs = RESILIENCE_LIMITS.BACKOFF_BASE_MS,
  maxMs = RESILIENCE_LIMITS.BACKOFF_MAX_MS,
): number {
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, Math.max(0, attempt)));
  // Full jitter: random between 0.5 * exponential and 1.5 * exponential
  const jitterFactor = 0.5 + Math.random();
  return Math.floor(exponential * jitterFactor);
}
