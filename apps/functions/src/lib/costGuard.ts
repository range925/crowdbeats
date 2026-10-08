/**
 * Crowdbeats V2 — Cost Guard & Abuse Anomaly Detector (Phase 7)
 *
 * Requirements:
 * - Guards against abnormal reads, writes, function invocations, rejected checks, and telemetry volume.
 * - Protects against malicious clients attempting to keep sessions or grants live after expiry.
 * - Records cost guard anomalies to structured logger and audit trail without leaking raw PII.
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { RedactedLogger } from './logger.js';

const logger = new RedactedLogger('CostGuard');

export type MetricType =
  | 'telemetry_sample_ingested'
  | 'check_in_rejected'
  | 'check_in_accepted'
  | 'radar_query_served'
  | 'expired_session_blocked'
  | 'rate_limit_triggered'
  | 'app_check_rejected';

export interface CostGuardEvent {
  metric: MetricType;
  entityId?: string; // sessionId or performerId
  details?: Record<string, unknown>;
}

// Configurable abuse thresholds per session/attempt
const MAX_CONSECUTIVE_REJECTED_CHECKINS = 5;
const MAX_TELEMETRY_POINTS_PER_SESSION = 1200; // e.g. at 5s intervals = 100 minutes max

/**
 * Validates that a live session has not exceeded its authoritative expiry time.
 * Malicious clients cannot keep a session active by delaying or submitting stale updates.
 */
export function assertSessionNotExpired(
  sessionData: Record<string, unknown>,
  nowMs = Date.now(),
): void {
  const endsAtStr = sessionData['endsAt'] as string | undefined;
  if (!endsAtStr) return;

  const endsAtMs = new Date(endsAtStr).getTime();
  // 30-second grace window for in-flight clock skew
  if (nowMs > endsAtMs + 30_000) {
    logger.warn('Attempted operation on expired session', {
      sessionId: sessionData['sessionId'] || sessionData['id'],
      endsAt: endsAtStr,
      now: new Date(nowMs).toISOString(),
    });
    throw new HttpsError(
      'failed-precondition',
      'The live session has expired and cannot accept further updates or leases.',
    );
  }
}

/**
 * Validates that an audience grant has not expired.
 */
export function assertGrantNotExpired(
  grantData: Record<string, unknown>,
  nowMs = Date.now(),
): void {
  const expiresAtStr = grantData['expiresAt'] as string | undefined;
  if (!expiresAtStr) return;

  const expiresAtMs = new Date(expiresAtStr).getTime();
  if (nowMs > expiresAtMs) {
    throw new HttpsError(
      'failed-precondition',
      'The audience visibility grant has expired.',
    );
  }
}

/**
 * Records a cost guard telemetry event. Emits alerts on threshold breach.
 */
export async function recordCostGuardMetric(event: CostGuardEvent): Promise<void> {
  logger.info(`Cost guard event: ${event.metric}`, {
    metric: event.metric,
    entityId: event.entityId,
    details: event.details,
  });

  if (event.metric === 'check_in_rejected') {
    const rejectedCount = (event.details?.['consecutiveRejections'] as number) || 1;
    if (rejectedCount >= MAX_CONSECUTIVE_REJECTED_CHECKINS) {
      logger.error(`ALERT: Excessive check-in rejections detected (${rejectedCount})`, undefined, {
        entityId: event.entityId,
        rejectedCount,
      });
    }
  }

  if (event.metric === 'telemetry_sample_ingested') {
    const sampleIndex = (event.details?.['sequence'] as number) || 0;
    if (sampleIndex >= MAX_TELEMETRY_POINTS_PER_SESSION) {
      logger.warn(`ALERT: High telemetry volume for session (${sampleIndex} points)`, {
        entityId: event.entityId,
        sampleIndex,
      });
    }
  }
}
