/**
 * Crowdbeats V2 — Session Reconciliation & Cleanup Callables (Phase 10)
 *
 * Implements:
 * 1. reconcileSessionState:
 *    Authoritative session and audience grant reconciliation on app restart,
 *    wake, network recovery, or permission change. Enforces server lease authority,
 *    truthful offline check-in status, account suspension verification,
 *    fan visibility reconciliation, and clock skew detection.
 *
 * 2. reportTerminalCleanup:
 *    Audits and records client-side invariant verification proving that reaching
 *    a terminal state (ended, force-ended, expired, logged out) successfully tore
 *    down all sensors, background services, listeners, and private coordinates.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type {
  ReconcileSessionRequest,
  ReconcileSessionResponse,
  ReportTerminalCleanupRequest,
  ReportTerminalCleanupResponse,
  FanGrantReconciliationItem,
} from '@crowdbeats/contracts';
import {
  computeClockSkewSeconds,
  RESILIENCE_LIMITS,
} from '@crowdbeats/contracts';
import { logger } from '../lib/logger.js';
import { enforceRateLimit } from '../lib/rateLimiter.js';
import { verifyAppCheck } from '../lib/appCheck.js';
import {
  getFirestoreDb,
  writeLocationAuditEvent,
} from './sessionHelpers.js';

/**
 * 1. reconcileSessionState
 */
export const reconcileSessionState = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ReconcileSessionResponse> => {
    const correlationId = `sess_rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as ReconcileSessionRequest;

    verifyAppCheck(request, 'reconcileSessionState');
    await enforceRateLimit({ identifier: uid, action: 'session_reconcile' });

    const nowMs = Date.now();
    const serverTimestamp = new Date(nowMs).toISOString();
    const clientTimestamp = data.clientTimestamp || serverTimestamp;
    const clockSkewSeconds = computeClockSkewSeconds(clientTimestamp, serverTimestamp);

    if (Math.abs(clockSkewSeconds) > RESILIENCE_LIMITS.CLOCK_SKEW_WARNING_SECONDS) {
      logger.warn('[reconcileSessionState] Significant clock skew detected', {
        correlationId,
        uid,
        clockSkewSeconds,
        clientTimestamp,
        serverTimestamp,
      });
    }

    const db = getFirestoreDb();

    // ── FAN RECONCILIATION ───────────────────────────────────────────────────
    if (data.role === 'fan') {
      const reconciledGrants: FanGrantReconciliationItem[] = [];

      if (data.sessionId) {
        const sessionRef = db.collection('sessions').doc(data.sessionId);
        const sessionSnap = await sessionRef.get();

        if (!sessionSnap.exists) {
          reconciledGrants.push({
            grantId: 'session_not_found',
            sessionId: data.sessionId,
            performerId: 'unknown',
            status: 'session_ended',
            isShared: false,
          });
        } else {
          const sessionData = sessionSnap.data()!;
          const isSessionLive =
            sessionData['status'] === 'live' &&
            new Date(sessionData['endsAt'] as string).getTime() > nowMs;

          if (!isSessionLive) {
            reconciledGrants.push({
              grantId: 'ended',
              sessionId: data.sessionId,
              performerId: sessionData['performerId'] as string,
              status: 'session_ended',
              isShared: false,
            });
          } else {
            // Check fan grant under session
            const grantsSnap = await sessionRef
              .collection('audienceGrants')
              .where('fanUid', '==', uid)
              .get();

            if (grantsSnap.empty) {
              reconciledGrants.push({
                grantId: 'none',
                sessionId: data.sessionId,
                performerId: sessionData['performerId'] as string,
                status: 'revoked',
                isShared: false,
              });
            } else {
              for (const doc of grantsSnap.docs) {
                const g = doc.data();
                const expiresAtMs = new Date(g['expiresAt'] as string).getTime();
                const isRevoked = !!g['revokedAt'];
                const isExpired = expiresAtMs <= nowMs;

                let status: FanGrantReconciliationItem['status'] = 'active';
                if (isRevoked) status = 'revoked';
                else if (isExpired) status = 'expired';

                reconciledGrants.push({
                  grantId: doc.id,
                  sessionId: data.sessionId,
                  performerId: sessionData['performerId'] as string,
                  status,
                  isShared: status === 'active',
                  remainingMs: Math.max(0, expiresAtMs - nowMs),
                });
              }
            }
          }
        }
      }

      return {
        sessionId: data.sessionId,
        isLive: false,
        status: 'none',
        serverTimestamp,
        clockSkewSeconds,
        fanGrants: reconciledGrants,
      };
    }

    // ── CREATOR (ARTIST / BAND) RECONCILIATION ────────────────────────────────
    // 1. Account status verification (suspension / ban check)
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const ud = userDoc.data()!;
      if (ud['isBanned'] === true || ud['isSuspended'] === true || ud['status'] === 'suspended') {
        logger.warn('[reconcileSessionState] User account suspended/banned', { uid });
        return {
          sessionId: data.sessionId,
          isLive: false,
          status: 'ended',
          serverTimestamp,
          clockSkewSeconds,
          terminalReason: 'account_suspended',
          isAccountSuspended: true,
        };
      }
    }

    // 2. Evaluate target session if sessionId provided
    let targetSessionId = data.sessionId;
    let sessionData: admin.firestore.DocumentData | undefined;

    if (targetSessionId) {
      const snap = await db.collection('sessions').doc(targetSessionId).get();
      if (snap.exists) {
        sessionData = snap.data();
      }
    } else if (data.profileId) {
      // Find active session by performer
      const q = await db
        .collection('sessions')
        .where('performerId', '==', data.profileId)
        .where('status', '==', 'live')
        .limit(1)
        .get();
      if (!q.empty) {
        targetSessionId = q.docs[0].id;
        sessionData = q.docs[0].data();
      }
    }

    if (!targetSessionId || !sessionData) {
      return {
        isLive: false,
        status: 'not_found',
        serverTimestamp,
        clockSkewSeconds,
      };
    }

    // Performer authorization check
    if (sessionData['performerId'] !== uid) {
      if (sessionData['performerType'] === 'band') {
        const memberSnap = await db
          .collection('bands')
          .doc(sessionData['performerId'])
          .collection('members')
          .doc(uid)
          .get();
        if (!memberSnap.exists || memberSnap.data()?.['isActive'] === false) {
          return {
            sessionId: targetSessionId,
            isLive: false,
            status: 'not_found',
            serverTimestamp,
            clockSkewSeconds,
          };
        }
      } else {
        return {
          sessionId: targetSessionId,
          isLive: false,
          status: 'not_found',
          serverTimestamp,
          clockSkewSeconds,
        };
      }
    }

    // Authoritative status evaluation
    const storedStatus = sessionData['status'];
    const endsAtTimestamp = sessionData['endsAt'] as admin.firestore.Timestamp | string | undefined;
    const endsAtIso =
      typeof endsAtTimestamp === 'string'
        ? endsAtTimestamp
        : endsAtTimestamp && typeof (endsAtTimestamp as any).toDate === 'function'
        ? (endsAtTimestamp as admin.firestore.Timestamp).toDate().toISOString()
        : serverTimestamp;

    const endsAtMs = new Date(endsAtIso).getTime();

    // Check for admin force-ended
    if (storedStatus === 'admin_ended') {
      return {
        sessionId: targetSessionId,
        isLive: false,
        status: 'admin_ended',
        serverTimestamp,
        endsAt: endsAtIso,
        clockSkewSeconds,
        terminalReason: 'admin_ended',
      };
    }

    // Check for explicitly ended
    if (storedStatus === 'ended') {
      return {
        sessionId: targetSessionId,
        isLive: false,
        status: 'ended',
        serverTimestamp,
        endsAt: endsAtIso,
        clockSkewSeconds,
        terminalReason: 'performer_ended',
      };
    }

    // Check for server-side expiry
    if (endsAtMs <= nowMs) {
      return {
        sessionId: targetSessionId,
        isLive: false,
        status: 'expired',
        serverTimestamp,
        endsAt: endsAtIso,
        leaseRemainingSeconds: 0,
        clockSkewSeconds,
        terminalReason: 'expired',
      };
    }

    // Active unexpired session
    const leaseRemainingSeconds = Math.max(0, Math.round((endsAtMs - nowMs) / 1000));
    return {
      sessionId: targetSessionId,
      isLive: true,
      status: 'live',
      serverTimestamp,
      endsAt: endsAtIso,
      leaseRemainingSeconds,
      clockSkewSeconds,
    };
  },
);

/**
 * 2. reportTerminalCleanup
 */
export const reportTerminalCleanup = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ReportTerminalCleanupResponse> => {
    const correlationId = `clean_rep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as ReportTerminalCleanupRequest;

    if (!data.report) {
      throw new HttpsError('invalid-argument', 'report is required.');
    }

    const recordedAt = new Date().toISOString();

    await writeLocationAuditEvent({
      performerId: data.performerId || uid,
      sessionId: data.sessionId,
      action: 'terminal_cleanup_verified',
      outcome: data.report.allPassed ? 'success' : 'rejected',
      correlationId,
      platform: 'server',
    });

    logger.info('[reportTerminalCleanup] Cleanup verified by client', {
      correlationId,
      uid,
      sessionId: data.sessionId,
      reason: data.report.reason,
      allPassed: data.report.allPassed,
    });

    return {
      acknowledged: true,
      recordedAt,
    };
  },
);
