/**
 * Crowdbeats V2 — Suspend Account Cloud Function (Phase 10)
 *
 * Callable function for Trust & Safety account freezes:
 * - Requires caller to be `TRUST_SAFETY` or `SUPER_ADMIN`
 * - Requires typed confirmation: "SUSPEND ACCOUNT"
 * - Soft-sets `isSuspended: true`, `suspensionReason`, `suspendedAt`
 * - Writes immutable audit event `USER_SUSPENDED`
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const suspendAccount = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const callerRole = token.platformRole;

    if (!['SUPER_ADMIN', 'TRUST_SAFETY'].includes(callerRole)) {
      throw new HttpsError('permission-denied', 'Only Trust & Safety or Super Admins can suspend accounts.');
    }

    const { targetUid, targetType, reason, confirmationPhrase } = request.data || {};

    if (!targetUid || typeof targetUid !== 'string') {
      throw new HttpsError('invalid-argument', 'Target UID is required.');
    }
    if (!targetType || !['user', 'artist', 'band', 'venue', 'sponsor'].includes(targetType)) {
      throw new HttpsError('invalid-argument', 'Target type must be "user", "artist", "band", "venue", or "sponsor".');
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Suspension reason is required.');
    }
    if (confirmationPhrase !== 'SUSPEND ACCOUNT') {
      throw new HttpsError('invalid-argument', 'Step-up confirmation failed. Expected exact phrase: "SUSPEND ACCOUNT".');
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

    // Reversible soft-suspension
    batch.update(docRef, {
      isSuspended: true,
      suspendedAt: now,
      suspendedByUid: uid,
      suspensionReason: reason.trim(),
      updatedAt: now,
    });

    // Write audit event
    batch.set(auditRef, {
      eventId: auditRef.id,
      action: 'USER_SUSPENDED',
      actorUid: uid,
      actorType: 'staff',
      targetId: targetUid,
      targetType,
      metadata: {
        reason: reason.trim(),
        suspendedByRole: callerRole,
      },
      correlationId: `susp_${targetUid}_${Date.now()}`,
      createdAt: now,
    });

    await batch.commit();

    return {
      success: true,
      targetUid,
      targetType,
      message: `Successfully suspended ${targetType} ${targetUid}.`,
    };
  }
);
