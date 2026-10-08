/**
 * Crowdbeats V2 — Session Lease & Teardown Callables (Phase 6)
 *
 * Implements:
 * 5. renewSessionLease (zero GPS for stationary venue sessions)
 * 8. endLiveSession
 * 9. adminForceEnd
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type {
  RenewSessionLeaseRequest,
  RenewSessionLeaseResponse,
  EndLiveSessionRequest,
  EndLiveSessionResponse,
  AdminForceEndRequest,
  AdminForceEndResponse,
} from '@crowdbeats/contracts';
import { logger } from '../lib/logger.js';
import { enforceRateLimit } from '../lib/rateLimiter.js';
import { verifyAppCheck } from '../lib/appCheck.js';
import { assertSessionNotExpired } from '../lib/costGuard.js';
import {
  getFirestoreDb,
  canForceEndSession,
  writeLocationAuditEvent,
} from './sessionHelpers.js';

const HEARTBEAT_EXTENSION_MS = 2 * 3_600_000; // +2 hours per heartbeat
const MAX_TOTAL_DURATION_MS = 12 * 3_600_000; // 12 hours hard cap from session start

/**
 * 5. renewSessionLease
 * Extends the authoritative session lease without requiring new GPS points for stationary sessions.
 * Sequence numbers must be strictly monotonic.
 */
export const renewSessionLease = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<RenewSessionLeaseResponse> => {
    const correlationId = `lease_ren_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as RenewSessionLeaseRequest;

    if (!data.sessionId || typeof data.seq !== 'number' || data.seq < 1) {
      throw new HttpsError('invalid-argument', 'sessionId and a positive integer seq are required.');
    }
    if (!data.idempotencyKey || typeof data.idempotencyKey !== 'string') {
      throw new HttpsError('invalid-argument', 'idempotencyKey is required.');
    }

    const db = getFirestoreDb();

    // Idempotency deduplication
    const idemKey = `renewSessionLease:${uid}:${data.sessionId}:${data.idempotencyKey}`;
    const idemRef = db.collection('idempotencyKeys').doc(idemKey);
    const idemSnap = await idemRef.get();
    if (idemSnap.exists && idemSnap.data()?.['status'] === 'succeeded') {
      return idemSnap.data()?.['responseSnapshot'] as RenewSessionLeaseResponse;
    }

    const sessionRef = db.collection('sessions').doc(data.sessionId);
    const snap = await sessionRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }
    const sessionData = snap.data()!;

    verifyAppCheck(request, 'renewSessionLease');
    assertSessionNotExpired(sessionData);
    await enforceRateLimit({ identifier: data.sessionId, action: 'session_lease_renew' });

    // Performer authorization
    if (sessionData['performerId'] !== uid) {
      if (sessionData['performerType'] === 'band') {
        const memberSnap = await db
          .collection('bands')
          .doc(sessionData['performerId'])
          .collection('members')
          .doc(uid)
          .get();
        if (!memberSnap.exists || memberSnap.data()?.['isActive'] === false) {
          throw new HttpsError('permission-denied', 'You cannot renew leases for this session.');
        }
      } else {
        throw new HttpsError('permission-denied', 'You can only renew leases for your own sessions.');
      }
    }

    // Status check
    const currentStatus = sessionData['status'];
    const currentEndsAtTimestamp = sessionData['endsAt'] as admin.firestore.Timestamp;
    const currentEndsAtIso = currentEndsAtTimestamp
      ? currentEndsAtTimestamp.toDate().toISOString()
      : new Date().toISOString();

    if (currentStatus !== 'live') {
      return {
        sessionId: data.sessionId,
        status: currentStatus,
        seq: data.seq,
        extended: false,
        endsAt: currentEndsAtIso,
      };
    }

    // Monotonic sequence check
    const lastSeq = (sessionData['lastHeartbeatSeq'] as number) || 0;
    if (data.seq <= lastSeq) {
      await writeLocationAuditEvent({
        performerId: sessionData['performerId'],
        sessionId: data.sessionId,
        action: 'heartbeat_rejected_seq',
        outcome: 'rejected',
        rejectionReason: `seq ${data.seq} <= lastSeq ${lastSeq}`,
        correlationId,
        platform: 'server',
      });
      throw new HttpsError(
        'failed-precondition',
        `Heartbeat sequence ${data.seq} is not greater than last accepted sequence ${lastSeq}.`,
      );
    }

    function toEpochMs(val: any): number {
      if (!val) return Date.now();
      if (typeof val.toMillis === 'function') return val.toMillis();
      if (typeof val.toDate === 'function') return val.toDate().getTime();
      if (val instanceof Date) return val.getTime();
      if (typeof val === 'string' || typeof val === 'number') {
        const ms = new Date(val).getTime();
        if (!isNaN(ms)) return ms;
      }
      return Date.now();
    }

    // Compute new endsAt bounded by 12h cap
    const startedAtMs = toEpochMs(sessionData['startedAt']);
    const currentEndsAtMs = toEpochMs(sessionData['endsAt']);
    const maxEndsAtMs = startedAtMs + MAX_TOTAL_DURATION_MS;
    const proposedEndsAtMs = Math.max(currentEndsAtMs, Date.now()) + HEARTBEAT_EXTENSION_MS;
    const newEndsAtMs = Math.min(proposedEndsAtMs, maxEndsAtMs);
    const extended = newEndsAtMs > currentEndsAtMs;

    const now = admin.firestore.FieldValue.serverTimestamp();
    const newEndsAtTimestamp = admin.firestore.Timestamp.fromMillis(newEndsAtMs);
    const newEndsAtIso = new Date(newEndsAtMs).toISOString();

    const batch = db.batch();
    batch.update(sessionRef, {
      endsAt: newEndsAtTimestamp,
      lastConfirmedAt: now,
      lastHeartbeatAt: now,
      lastHeartbeatSeq: data.seq,
      heartbeatCount: admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });

    const response: RenewSessionLeaseResponse = {
      sessionId: data.sessionId,
      status: 'live',
      seq: data.seq,
      extended,
      endsAt: newEndsAtIso,
    };

    batch.set(idemRef, {
      key: idemKey,
      uid,
      operation: 'renewSessionLease',
      status: 'succeeded',
      responseSnapshot: response,
      createdAt: new Date().toISOString(),
      expiresAt: newEndsAtIso,
    });

    await batch.commit();

    await writeLocationAuditEvent({
      performerId: sessionData['performerId'],
      sessionId: data.sessionId,
      action: 'heartbeat_accepted',
      outcome: 'success',
      idempotencyKey: data.idempotencyKey,
      correlationId,
      platform: 'server',
    });

    return response;
  },
);

/**
 * 8. endLiveSession
 * Gracefully terminates an active session, setting status to 'ended' and deleting private location docs.
 */
export const endLiveSession = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<EndLiveSessionResponse> => {
    const correlationId = `sess_end_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as EndLiveSessionRequest;

    if (!data.sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }

    const db = getFirestoreDb();
    const sessionRef = db.collection('sessions').doc(data.sessionId);
    const snap = await sessionRef.get();

    if (!snap.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }
    const sessionData = snap.data()!;

    // Performer authorization
    if (sessionData['performerId'] !== uid) {
      if (sessionData['performerType'] === 'band') {
        const memberSnap = await db
          .collection('bands')
          .doc(sessionData['performerId'])
          .collection('members')
          .doc(uid)
          .get();
        if (!memberSnap.exists || memberSnap.data()?.['isActive'] === false) {
          throw new HttpsError('permission-denied', 'You cannot end this session.');
        }
      } else {
        throw new HttpsError('permission-denied', 'You can only end your own sessions.');
      }
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const endedAtIso = new Date().toISOString();

    if (sessionData['status'] !== 'live' && sessionData['status'] !== 'paused') {
      return {
        sessionId: data.sessionId,
        status: 'ended',
        endedAt: sessionData['endedAt'] ? (sessionData['endedAt'] as admin.firestore.Timestamp).toDate().toISOString() : endedAtIso,
      };
    }

    const batch = db.batch();
    batch.update(sessionRef, {
      status: 'ended',
      endedAt: now,
      endReason: data.reason || 'performer_ended',
      updatedAt: now,
    });

    // Delete private operational location document immediately
    batch.delete(sessionRef.collection('private').doc('location'));

    await batch.commit();

    await writeLocationAuditEvent({
      performerId: sessionData['performerId'],
      sessionId: data.sessionId,
      action: 'session_ended',
      outcome: 'success',
      correlationId,
      platform: 'server',
    });

    logger.info('[endLiveSession] Session ended successfully', {
      correlationId,
      sessionId: data.sessionId,
      performerId: sessionData['performerId'],
    });

    return {
      sessionId: data.sessionId,
      status: 'ended',
      endedAt: endedAtIso,
    };
  },
);

/**
 * 9. adminForceEnd
 * Emergency administrative teardown for active live sessions.
 * Requires staff or super-admin credentials.
 */
export const adminForceEnd = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<AdminForceEndResponse> => {
    const correlationId = `sess_adm_end_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const token = request.auth.token;
    const data = request.data as AdminForceEndRequest;

    await enforceRateLimit({ identifier: uid, action: 'admin_force_end' });

    if (!data.sessionId || !data.reason || data.reason.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'sessionId and a non-empty reason are required.');
    }

    const db = getFirestoreDb();

    // Verify elevated staff or admin credentials (separate from general support access)
    const canEnd = await canForceEndSession(db, uid, token);
    if (!canEnd) {
      throw new HttpsError(
        'permission-denied',
        'Only platform staff or administrators can force-end sessions. Elevated privileges required; general customer support is read-only.',
      );
    }

    const sessionRef = db.collection('sessions').doc(data.sessionId);
    const snap = await sessionRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }
    const sessionData = snap.data()!;

    const now = admin.firestore.FieldValue.serverTimestamp();
    const endedAtIso = new Date().toISOString();

    const batch = db.batch();
    batch.update(sessionRef, {
      status: 'admin_ended',
      endedAt: now,
      adminEndReason: data.reason.trim(),
      endedByUid: uid,
      updatedAt: now,
    });

    // Delete private operational location document immediately
    batch.delete(sessionRef.collection('private').doc('location'));

    await batch.commit();

    await writeLocationAuditEvent({
      performerId: sessionData['performerId'],
      sessionId: data.sessionId,
      action: 'session_admin_ended',
      outcome: 'success',
      rejectionReason: `admin_forced: ${data.reason.trim()}`,
      correlationId,
      platform: 'server',
    });

    logger.warn('[adminForceEnd] Session forcefully ended by admin', {
      correlationId,
      sessionId: data.sessionId,
      adminUid: uid,
      reason: data.reason.trim(),
    });

    return {
      sessionId: data.sessionId,
      status: 'admin_ended',
      endedAt: endedAtIso,
    };
  },
);
