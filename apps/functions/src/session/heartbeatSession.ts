/**
 * Crowdbeats V2 — heartbeatSession (Phase 2 update)
 *
 * Changes from Phase B:
 *  - Validates HeartbeatRequest.seq — server rejects seq ≤ lastHeartbeatSeq.
 *  - Validates HeartbeatRequest.idempotencyKey — deduplicates retry storms.
 *  - Returns HeartbeatResponse (typed contract).
 *  - Writes audit event for rejected sequences.
 *
 * Rules:
 *   - Caller must be the session's performerId.
 *   - Session must be status='live'.
 *   - endsAt may never exceed startedAt + 12h (total lifetime cap).
 *   - No GPS in heartbeat — server-side lease extension only.
 *   - seq must be strictly greater than lastHeartbeatSeq.
 *   - Idempotency key deduplicated; same key + seq returns cached response.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type { HeartbeatRequest, HeartbeatResponse, LocationAuditEvent } from '@crowdbeats/contracts';
import { logger } from '../lib/logger.js';

if (admin.apps.length === 0) admin.initializeApp();

const HEARTBEAT_EXTENSION_MS  = 2 * 3_600_000;   // +2h per heartbeat
const MAX_TOTAL_DURATION_MS   = 12 * 3_600_000;  // 12h hard cap from startedAt

function _db() { return admin.firestore(); }

export const heartbeatSession = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    const correlationId = `hb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const data = request.data as HeartbeatRequest;

    if (!data.sessionId || typeof data.sessionId !== 'string') {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }
    if (typeof data.seq !== 'number' || !Number.isInteger(data.seq) || data.seq < 1) {
      throw new HttpsError('invalid-argument', 'seq must be a positive integer.');
    }
    if (!data.idempotencyKey || typeof data.idempotencyKey !== 'string') {
      throw new HttpsError('invalid-argument', 'idempotencyKey is required.');
    }

    // ── Idempotency: deduplicate retry storms ─────────────────────────────────
    const idemKey = `heartbeat:${uid}:${data.sessionId}:${data.idempotencyKey}`;
    const idemRef  = _db().collection('idempotencyKeys').doc(idemKey);
    const idemSnap = await idemRef.get();
    if (idemSnap.exists && idemSnap.data()!['status'] === 'succeeded') {
      return idemSnap.data()!['responseSnapshot'] as HeartbeatResponse;
    }

    // ── Fetch session ─────────────────────────────────────────────────────────
    const sessionRef = _db().collection('sessions').doc(data.sessionId);
    const snap = await sessionRef.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Session not found.');
    const sessionData = snap.data()!;

    if (sessionData['performerId'] !== uid) {
      throw new HttpsError('permission-denied', 'You can only extend your own sessions.');
    }

    // ── Status check ──────────────────────────────────────────────────────────
    if (sessionData['status'] !== 'live') {
      return {
        sessionId: data.sessionId, status: sessionData['status'] as string,
        endsAt: (sessionData['endsAt'] as admin.firestore.Timestamp).toDate().toISOString(),
        extended: false, seq: data.seq,
      } as HeartbeatResponse;
    }

    // ── Monotonic sequence check ───────────────────────────────────────────────
    const lastSeq: number = sessionData['lastHeartbeatSeq'] ?? 0;
    if (data.seq <= lastSeq) {
      await _writeAuditEvent({
        performerId: uid, sessionId: data.sessionId, action: 'heartbeat_rejected_seq',
        outcome: 'rejected', rejectionReason: `seq ${data.seq} ≤ lastSeq ${lastSeq}`,
        correlationId, platform: 'ios',
      });
      throw new HttpsError('failed-precondition',
        `Heartbeat seq ${data.seq} is not greater than last accepted seq ${lastSeq}.`);
    }

    // ── Compute new endsAt ────────────────────────────────────────────────────
    const startedAt: admin.firestore.Timestamp = sessionData['startedAt'];
    const currentEndsAt: admin.firestore.Timestamp = sessionData['endsAt'];
    const now = Date.now();
    const maxEndsAtMs = startedAt.toMillis() + MAX_TOTAL_DURATION_MS;
    const proposedMs  = Math.max(currentEndsAt.toMillis(), now) + HEARTBEAT_EXTENSION_MS;
    const newEndsAtMs = Math.min(proposedMs, maxEndsAtMs);

    if (newEndsAtMs <= currentEndsAt.toMillis()) {
      const resp: HeartbeatResponse = {
        sessionId: data.sessionId, status: 'live',
        endsAt: currentEndsAt.toDate().toISOString(), extended: false, seq: data.seq,
      };
      await idemRef.set({ status: 'succeeded', responseSnapshot: resp, expiresAt: new Date(now + 300_000).toISOString() });
      return resp;
    }

    const newEndsAt = admin.firestore.Timestamp.fromMillis(newEndsAtMs);
    const heartbeatCount: number = (sessionData['heartbeatCount'] ?? 0) + 1;

    await sessionRef.update({
      endsAt: newEndsAt,
      lastHeartbeatAt: admin.firestore.FieldValue.serverTimestamp(),
      lastHeartbeatSeq: data.seq,
      heartbeatCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const resp: HeartbeatResponse = {
      sessionId: data.sessionId, status: 'live',
      endsAt: newEndsAt.toDate().toISOString(), extended: true, seq: data.seq,
    };

    await idemRef.set({ status: 'succeeded', responseSnapshot: resp, expiresAt: new Date(now + 300_000).toISOString() });
    await _writeAuditEvent({
      performerId: uid, sessionId: data.sessionId, action: 'heartbeat_accepted',
      outcome: 'success', correlationId, platform: 'ios',
    });

    logger.info('[heartbeatSession] extended', { correlationId, sessionId: data.sessionId, seq: data.seq });
    return resp;
  },
);

async function _writeAuditEvent(fields: {
  performerId: string; sessionId: string;
  action: LocationAuditEvent['action']; outcome: LocationAuditEvent['outcome'];
  rejectionReason?: string; correlationId: string; platform: LocationAuditEvent['platform'];
}): Promise<void> {
  try {
    const eventId = `lae_hb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await _db().collection('locationAuditEvents').doc(eventId).set({
      eventId, ...fields, createdAt: new Date().toISOString(), v: 1,
    } satisfies LocationAuditEvent);
  } catch {
    logger.warn('[heartbeatSession] audit write failed', { correlationId: fields.correlationId });
  }
}
