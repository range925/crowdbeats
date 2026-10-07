/**
 * Crowdbeats V2 — endSession (Phase 2 update)
 *
 * Changes from Phase B:
 *  - Deletes sessions/{id}/private/location on session end.
 *  - Writes LocationAuditEvent.
 *  - Typed against EndSessionRequest / EndSessionResponse.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type { EndSessionRequest, EndSessionResponse, LocationAuditEvent } from '@crowdbeats/contracts';
import { logger } from '../lib/logger.js';

if (admin.apps.length === 0) admin.initializeApp();

function _db() { return admin.firestore(); }

export const endSession = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    const correlationId = `sess_end_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as EndSessionRequest;

    if (!data.sessionId || typeof data.sessionId !== 'string') {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }

    const sessionRef = _db().collection('sessions').doc(data.sessionId);
    const snap = await sessionRef.get();

    if (!snap.exists) throw new HttpsError('not-found', 'Session not found.');
    const sessionData = snap.data()!;

    if (sessionData['performerId'] !== uid) {
      throw new HttpsError('permission-denied', 'You can only end your own sessions.');
    }

    if (sessionData['status'] !== 'live') {
      // Idempotent — return current status
      return { sessionId: data.sessionId, status: sessionData['status'] } as EndSessionResponse;
    }

    const batch = _db().batch();

    // Update public presence status
    batch.update(sessionRef, {
      status: 'ended',
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Delete private location document immediately (don't wait for TTL)
    batch.delete(
      _db().collection('sessions').doc(data.sessionId).collection('private').doc('location'),
    );

    await batch.commit();

    // Write audit event (fire-and-forget)
    void _writeAuditEvent({
      performerId: uid, sessionId: data.sessionId, action: 'session_ended',
      outcome: 'success', correlationId, platform: 'ios',
    });

    logger.info('[endSession] session ended', { correlationId, sessionId: data.sessionId });
    return { sessionId: data.sessionId, status: 'ended' } as EndSessionResponse;
  },
);

async function _writeAuditEvent(fields: {
  performerId: string; sessionId: string;
  action: LocationAuditEvent['action']; outcome: LocationAuditEvent['outcome'];
  correlationId: string; platform: LocationAuditEvent['platform'];
}): Promise<void> {
  try {
    const eventId = `lae_end_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await _db().collection('locationAuditEvents').doc(eventId).set({
      eventId, sessionId: fields.sessionId, performerId: fields.performerId,
      action: fields.action, outcome: fields.outcome, correlationId: fields.correlationId,
      createdAt: new Date().toISOString(), platform: fields.platform, v: 1,
    } satisfies LocationAuditEvent);
  } catch {
    logger.warn('[endSession] audit write failed', { correlationId: fields.correlationId });
  }
}
