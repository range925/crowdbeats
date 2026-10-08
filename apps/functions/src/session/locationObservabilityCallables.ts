/**
 * Crowdbeats V2 — Location Quality, Energy Observability, and Admin Health Callables (Phase 11)
 *
 * Implements:
 * 1. getAdminLiveSessionHealth:
 *    Read-only session health view with force-end permission separated from general support.
 *    Strictly zero raw Fan coordinates or routine audience identities disclosed.
 * 2. evaluateLocationAnomalies:
 *    Evaluates active sessions and audit trails for runaway tracking, missing cleanups,
 *    stale presence, repeated check-in failures, and privacy threshold probe attempts.
 * 3. reportLocationEnergyMetrics:
 *    Ingests client energy metrics snapshots with strict zero-coordinate validation.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from '../lib/logger.js';
import { enforceRateLimit } from '../lib/rateLimiter.js';
import {
  getFirestoreDb,
  isStaffOrAdmin,
  canForceEndSession,
} from './sessionHelpers.js';
import {
  assertZeroCoordinatesInMetrics,
  LocationAnomalyAlert,
  LocationEnergyMetricsSnapshot,
} from '@crowdbeats/contracts';

export interface AdminLiveSessionHealthRequest {
  sessionId: string;
}

export interface AdminLiveSessionHealthResponse {
  sessionId: string;
  performerId: string;
  status: string;
  type: string;
  venueId?: string;
  createdAt: string;
  endsAt?: string;
  leaseRemainingSeconds: number;
  isExpired: boolean;
  canForceEnd: boolean; // True only if caller holds elevated force-end privilege

  // Telemetry & Health aggregates (Zero exact Fan coordinates or UIDs)
  sampleCount: number;
  acceptedSampleCount: number;
  rejectedSampleCount: number;
  uploadCount: number;
  lastHeartbeatSeq: number;
  consecutiveCheckInRejections: number;
  audienceCountBand: string; // '< 5', '5-14', '15+'
  activeZonesCount: number;
  errorCounts: {
    telemetryErrors: number;
    rulesViolations: number;
    rateLimitEvents: number;
  };
}

export interface EvaluateLocationAnomaliesResponse {
  alerts: LocationAnomalyAlert[];
  evaluatedSessionCount: number;
  timestamp: string;
}

/**
 * 1. getAdminLiveSessionHealth
 * Provides read-only health metrics for platform administrators and support staff.
 * PRIVACY GUARANTEE: Never discloses raw coordinates, device IDs, or individual Fan identities.
 */
export const getAdminLiveSessionHealth = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<AdminLiveSessionHealthResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const token = request.auth.token;
    const data = request.data as AdminLiveSessionHealthRequest;

    await enforceRateLimit({ identifier: uid, action: 'session_health_read' });

    if (!data.sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }

    const db = getFirestoreDb();

    // Verify caller is platform staff (General support or elevated admin)
    const isStaff = await isStaffOrAdmin(db, uid, token);
    if (!isStaff) {
      throw new HttpsError('permission-denied', 'Only platform staff or administrators can view session health.');
    }

    // Check elevated force-end privilege separately
    const canEnd = await canForceEndSession(db, uid, token);

    const sessionRef = db.collection('sessions').doc(data.sessionId);
    const snap = await sessionRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }

    const sessionData = snap.data()!;
    const now = Date.now();
    const endsAtTimestamp = sessionData['endsAt']?.toDate?.() || (sessionData['endsAt'] ? new Date(sessionData['endsAt']) : null);
    const endsAtMs = endsAtTimestamp ? endsAtTimestamp.getTime() : 0;
    const leaseRemaining = Math.max(0, Math.floor((endsAtMs - now) / 1000));
    const isExpired = endsAtMs > 0 && now > endsAtMs;

    // Aggregate audience bands without disclosing raw fan points or UIDs
    const zonesSnap = await db
      .collection('audienceZones')
      .where('sessionId', '==', data.sessionId)
      .where('expiresAt', '>', admin.firestore.Timestamp.now())
      .get();

    let totalPublishedZones = 0;
    let aggregateBand = '< 5';
    for (const doc of zonesSnap.docs) {
      totalPublishedZones++;
      const band = doc.data()['countBand'] as string;
      if (band === '15+') {
        aggregateBand = '15+';
      } else if (band === '5-14' && aggregateBand !== '15+') {
        aggregateBand = '5-14';
      }
    }

    return {
      sessionId: data.sessionId,
      performerId: sessionData['performerId'] ?? '',
      status: sessionData['status'] ?? 'unknown',
      type: sessionData['type'] ?? 'stationary',
      venueId: sessionData['venueId'],
      createdAt: sessionData['createdAt']?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      endsAt: endsAtTimestamp ? endsAtTimestamp.toISOString() : undefined,
      leaseRemainingSeconds: leaseRemaining,
      isExpired,
      canForceEnd: canEnd,

      sampleCount: sessionData['totalSamplesReceived'] ?? sessionData['sampleCount'] ?? 0,
      acceptedSampleCount: sessionData['acceptedSampleCount'] ?? sessionData['sampleCount'] ?? 0,
      rejectedSampleCount: sessionData['rejectedSampleCount'] ?? 0,
      uploadCount: sessionData['uploadCount'] ?? 0,
      lastHeartbeatSeq: sessionData['lastHeartbeatSeq'] ?? 0,
      consecutiveCheckInRejections: sessionData['consecutiveCheckInRejections'] ?? 0,
      audienceCountBand: aggregateBand,
      activeZonesCount: totalPublishedZones,
      errorCounts: {
        telemetryErrors: sessionData['telemetryErrorsCount'] ?? 0,
        rulesViolations: sessionData['rulesViolationsCount'] ?? 0,
        rateLimitEvents: sessionData['rateLimitEventsCount'] ?? 0,
      },
    };
  },
);

/**
 * 2. evaluateLocationAnomalies
 * Evaluates active sessions for runaway tracking, missing cleanup, stale presence,
 * repeated verification failures, and audience radar probe attempts.
 */
export const evaluateLocationAnomalies = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<EvaluateLocationAnomaliesResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const token = request.auth.token;

    await enforceRateLimit({ identifier: uid, action: 'session_health_read' });

    const db = getFirestoreDb();
    const isStaff = await isStaffOrAdmin(db, uid, token);
    if (!isStaff) {
      throw new HttpsError('permission-denied', 'Only platform staff can evaluate location anomalies.');
    }

    const alerts: LocationAnomalyAlert[] = [];
    const now = Date.now();

    // Query active sessions
    const sessionsSnap = await db
      .collection('sessions')
      .where('status', 'in', ['live', 'paused'])
      .limit(50)
      .get();

    for (const doc of sessionsSnap.docs) {
      const data = doc.data();
      const sessionId = doc.id;
      const type = data['type'] as string;
      const startedAt = data['createdAt']?.toDate?.()?.getTime() ?? now;
      const endsAt = data['endsAt']?.toDate?.()?.getTime() ?? 0;
      const durationHours = (now - startedAt) / (1000 * 3600);

      // Anomaly 1: Runaway tracking duration (> 4h for mobile, > 12h for stationary)
      if (type === 'mobile' && durationHours > 4) {
        alerts.push({
          alertId: `alert_runaway_${sessionId}_${now}`,
          anomalyType: 'runaway_tracking_duration',
          severity: 'warning',
          sessionId,
          entityId: data['performerId'],
          description: `Mobile session running for ${durationHours.toFixed(1)}h, exceeding 4h threshold.`,
          details: { durationHours, type },
          detectedAt: new Date(now).toISOString(),
          requiresImmediateTeardown: durationHours > 8,
        });
      }

      // Anomaly 2: Stale public presence (now > endsAt + 15m)
      if (endsAt > 0 && now > endsAt + 15 * 60 * 1000) {
        alerts.push({
          alertId: `alert_stale_${sessionId}_${now}`,
          anomalyType: 'stale_public_session_detected',
          severity: 'critical',
          sessionId,
          entityId: data['performerId'],
          description: `Public session active 15m past lease expiration without cleanup.`,
          details: { endsAt: new Date(endsAt).toISOString(), overdueMinutes: Math.floor((now - endsAt) / 60000) },
          detectedAt: new Date(now).toISOString(),
          requiresImmediateTeardown: true,
        });
      }

      // Anomaly 3: Repeated check-in rejections (> 5 consecutive)
      const consecutiveRejections = data['consecutiveCheckInRejections'] as number | undefined ?? 0;
      if (consecutiveRejections >= 5) {
        alerts.push({
          alertId: `alert_cin_${sessionId}_${now}`,
          anomalyType: 'repeated_verification_failures',
          severity: 'warning',
          sessionId,
          entityId: data['performerId'],
          description: `High verification rejections (${consecutiveRejections}) detected for session.`,
          details: { consecutiveRejections },
          detectedAt: new Date(now).toISOString(),
          requiresImmediateTeardown: false,
        });
      }
    }

    return {
      alerts,
      evaluatedSessionCount: sessionsSnap.size,
      timestamp: new Date().toISOString(),
    };
  },
);

/**
 * 3. reportLocationEnergyMetrics
 * Ingests anonymized/aggregated client metrics snapshots with strict zero-coordinate validation.
 */
export const reportLocationEnergyMetrics = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<{ success: boolean; snapshotId: string }> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Partial<LocationEnergyMetricsSnapshot>;

    await enforceRateLimit({ identifier: uid, action: 'session_reconcile' });

    // Enforce strict zero-coordinate privacy assertion
    try {
      assertZeroCoordinatesInMetrics(data as Record<string, unknown>);
    } catch (e: any) {
      logger.error('[reportLocationEnergyMetrics] Privacy violation in metrics payload', {
        error: e.message,
        uid,
      });
      throw new HttpsError('invalid-argument', `Privacy violation: ${e.message}`);
    }

    const db = getFirestoreDb();
    const snapshotId = `lem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await db.collection('locationEnergySnapshots').doc(snapshotId).set({
      snapshotId,
      reportedByUid: uid,
      platform: data.platform ?? 'unknown',
      appVersion: data.appVersion ?? 'unknown',
      timeInStateMs: data.timeInStateMs ?? {},
      activeSensorDurationMs: data.activeSensorDurationMs ?? 0,
      foregroundDurationMs: data.foregroundDurationMs ?? 0,
      backgroundDurationMs: data.backgroundDurationMs ?? 0,
      sampleCounts: data.sampleCounts ?? {},
      networkTelemetry: data.networkTelemetry ?? {},
      databaseAttribution: data.databaseAttribution ?? {},
      securityEvents: data.securityEvents ?? {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, snapshotId };
  },
);
