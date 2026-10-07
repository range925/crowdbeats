/**
 * Crowdbeats V2 — Reinstate Account Cloud Function (Phase 10)
 *
 * Callable function for Trust & Safety account reinstatement:
 * - Requires caller to be `TRUST_SAFETY` or `SUPER_ADMIN`
 * - Sets `isSuspended: false`, removes active suspension flags
 * - Writes immutable audit event `USER_REACTIVATED`
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const reinstateAccount = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const callerRole = token.platformRole;

    if (!['SUPER_ADMIN', 'TRUST_SAFETY'].includes(callerRole)) {
      throw new HttpsError('permission-denied', 'Only Trust & Safety or Super Admins can reinstate accounts.');
    }

    const { targetUid, targetType, reason } = request.data || {};

    if (!targetUid || typeof targetUid !== 'string') {
      throw new HttpsError('invalid-argument', 'Target UID is required.');
    }
    if (!targetType || !['user', 'artist', 'band', 'venue', 'sponsor'].includes(targetType)) {
      throw new HttpsError('invalid-argument', 'Target type must be "user", "artist", "band", "venue", or "sponsor".');
    }

    const db = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();

    let docPath = `users/${targetUid}`;
    if (targetType === 'artist') docPath = `artistProfiles/${targetUid}`;
    if (targetType === 'band') docPath = `bands/${targetUid}`;
    if (targetType === 'venue') docPath = `venueProfiles/${targetUid}`;
    if (targetType === 'sponsor') docPath = `sponsorOrgs/${targetUid}`;

    const docRef = db.doc(docPath);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new HttpsError('not-found', `Target ${targetType} not found.`);
    }

    const auditRef = db.collection('auditEvents').doc();
    const batch = db.batch();

    // Reversible reinstatement
    batch.update(docRef, {
      isSuspended: false,
      reinstatedAt: now,
      reinstatedByUid: uid,
      reinstatementReason: reason ? String(reason).trim() : 'Reinstated by Trust & Safety',
      updatedAt: now,
    });

    // Write audit event
    batch.set(auditRef, {
      eventId: auditRef.id,
      action: 'USER_REACTIVATED',
      actorUid: uid,
      actorType: 'staff',
      targetId: targetUid,
      targetType,
      metadata: {
        reason: reason ? String(reason).trim() : 'Reinstated by Trust & Safety',
        reinstatedByRole: callerRole,
      },
      correlationId: `reinst_${targetUid}_${Date.now()}`,
      createdAt: now,
    });

    await batch.commit();

    return {
      success: true,
      targetUid,
      targetType,
      message: `Successfully reinstated ${targetType} ${targetUid}.`,
    };
  }
);
