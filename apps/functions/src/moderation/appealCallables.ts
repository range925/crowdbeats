/**
 * Crowdbeats V2 — Moderation Appeals Callables (Phase 19)
 *
 * Implements creator appeal submission and administrative resolution workflows.
 *
 * Compliance Invariants:
 * - Submitting an appeal does NOT automatically restore monetization or lift suspensions.
 * - Sourced from server-authoritative moderationAppeals collection.
 * - Moderator resolution creates immutable audit log entries.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

/**
 * Callable: submitModerationAppeal
 * Allows an affected creator to submit an appeal against an active strike or moderation action.
 */
export const submitModerationAppeal = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const creatorId = request.auth.uid;
    const data = (request.data || {}) as Record<string, unknown>;

    const { caseId, reason, statement } = data;

    if (!caseId || typeof caseId !== 'string') {
      throw new HttpsError('invalid-argument', 'caseId is required.');
    }
    if (!reason || typeof reason !== 'string') {
      throw new HttpsError('invalid-argument', 'reason is required.');
    }

    const appealId = uuidv4();
    const now = new Date().toISOString();
    const serverNow = admin.firestore.FieldValue.serverTimestamp();

    const appealRecord = {
      appealId,
      creatorId,
      caseId: (caseId as string).trim(),
      reason: (reason as string).trim(),
      statement: (statement as string)?.trim() || null,
      status: 'PENDING',
      createdAt: now,
      reviewedAt: null,
      reviewerId: null,
      resolution: null,
      serverCreatedAt: serverNow,
    };

    const batch = _db().batch();

    // 1. Save to moderationAppeals collection
    const appealRef = _db().collection('moderationAppeals').doc(appealId);
    batch.set(appealRef, appealRecord);

    // 2. Audit Log
    const auditRef = _db().collection('auditLogs').doc(uuidv4());
    batch.set(auditRef, {
      action: 'APPEAL_SUBMITTED',
      appealId,
      creatorId,
      caseId,
      timestamp: serverNow,
    });

    await batch.commit();

    return {
      success: true,
      appealId,
      status: 'PENDING',
      message: 'Your appeal has been submitted and queued for review. Monetization remains subject to current standing pending determination.',
      submittedAt: now,
    };
  }
);

/**
 * Callable: resolveModerationAppeal
 * Staff-only action to uphold, overturn, or dismiss an appeal.
 */
export const resolveModerationAppeal = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const reviewerId = request.auth.uid;
    const data = (request.data || {}) as Record<string, unknown>;

    const { appealId, resolution, notes } = data;

    if (!appealId || typeof appealId !== 'string') {
      throw new HttpsError('invalid-argument', 'appealId is required.');
    }
    if (!resolution || !['UPHELD', 'OVERTURNED', 'DISMISSED'].includes(resolution as string)) {
      throw new HttpsError('invalid-argument', 'resolution must be UPHELD, OVERTURNED, or DISMISSED.');
    }

    const appealRef = _db().collection('moderationAppeals').doc(appealId);
    const appealSnap = await appealRef.get();
    if (!appealSnap.exists) {
      throw new HttpsError('not-found', 'Appeal record not found.');
    }

    const appealData = appealSnap.data()!;
    const now = new Date().toISOString();
    const serverNow = admin.firestore.FieldValue.serverTimestamp();

    const batch = _db().batch();

    batch.update(appealRef, {
      status: resolution,
      resolution,
      reviewerId,
      reviewNotes: notes || null,
      reviewedAt: now,
      serverUpdatedAt: serverNow,
    });

    // Audit Log
    const auditRef = _db().collection('auditLogs').doc(uuidv4());
    batch.set(auditRef, {
      action: `APPEAL_RESOLVED_${resolution}`,
      appealId,
      creatorId: appealData['creatorId'],
      reviewerId,
      resolution,
      notes: notes || null,
      timestamp: serverNow,
    });

    await batch.commit();

    return {
      success: true,
      appealId,
      resolution,
      resolvedAt: now,
    };
  }
);
