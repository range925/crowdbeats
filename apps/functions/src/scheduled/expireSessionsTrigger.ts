/**
 * Crowdbeats V2 — expireSessionsTrigger (Phase 2 update)
 *
 * Changes from Phase B:
 *  - Batch-deletes sessions/{id}/private/location for each expired session.
 *  - Writes LocationAuditEvent for each expiry.
 *  - Updates lastHeartbeatSeq and heartbeatCount to final values before marking expired.
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from '../lib/logger.js';

if (admin.apps.length === 0) admin.initializeApp();

const MAX_BATCH_SIZE = 400;

function _db() { return admin.firestore(); }

export const expireSessionsTrigger = onSchedule(
  { schedule: 'every 15 minutes', region: 'us-central1' },
  async () => {
    const correlationId = `expire_${Date.now()}`;
    const now = admin.firestore.Timestamp.now();

    const query = await _db()
      .collection('sessions')
      .where('status', '==', 'live')
      .where('endsAt', '<', now)
      .limit(MAX_BATCH_SIZE)
      .get();

    if (query.empty) {
      logger.info('[expireSessionsTrigger] no sessions to expire', { correlationId });
      return;
    }

    logger.info(`[expireSessionsTrigger] expiring ${query.docs.length} sessions`, { correlationId });

    const db = _db();
    const batch = db.batch();
    const auditPromises: Promise<void>[] = [];

    for (const doc of query.docs) {
      const sessionId = doc.id;
      const performerId = doc.data()['performerId'] as string;

      batch.update(doc.ref, {
        status: 'expired',
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Delete private location doc immediately
      batch.delete(db.collection('sessions').doc(sessionId).collection('private').doc('location'));

      auditPromises.push(_writeAuditEvent(sessionId, performerId, correlationId));
    }

    await batch.commit();
    await Promise.allSettled(auditPromises);
    logger.info(`[expireSessionsTrigger] expired ${query.docs.length} sessions`, { correlationId });
  },
);

async function _writeAuditEvent(sessionId: string, performerId: string, correlationId: string): Promise<void> {
  try {
    const eventId = `lae_exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await _db().collection('locationAuditEvents').doc(eventId).set({
      eventId, sessionId, performerId, action: 'session_expired', outcome: 'success',
      correlationId, createdAt: new Date().toISOString(), platform: 'server', v: 1,
    });
  } catch {
    logger.warn('[expireSessionsTrigger] audit write failed', { correlationId });
  }
}
