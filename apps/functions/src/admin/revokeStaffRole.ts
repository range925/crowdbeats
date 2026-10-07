/**
 * Crowdbeats V2 — Revoke Staff Role Cloud Function (Phase 10)
 *
 * Callable function for revoking staff permissions:
 * - Requires caller to be `SUPER_ADMIN`
 * - Blocks self-demotion (prevents accidental loss of all super admins)
 * - Requires typed confirmation phrase: "REVOKE {ROLE}"
 * - Clears platformRole from custom claims
 * - Marks `/staffRecords/{targetUid}` as inactive
 * - Writes immutable audit event `STAFF_ROLE_REVOKED`
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const revokeStaffRole = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const callerRole = token.platformRole;

    if (callerRole !== 'SUPER_ADMIN') {
      throw new HttpsError('permission-denied', 'Only Super Administrators can revoke staff roles.');
    }

    const { targetUid, confirmationPhrase } = request.data || {};

    if (!targetUid || typeof targetUid !== 'string') {
      throw new HttpsError('invalid-argument', 'Target user ID is required.');
    }

    // Prevent self-revocation
    if (targetUid === uid) {
      throw new HttpsError(
        'failed-precondition',
        'Super Administrators cannot revoke their own role. Another Super Admin must perform this action.'
      );
    }

    const db = admin.firestore();
    const staffRef = db.collection('staffRecords').doc(targetUid);
    const staffDoc = await staffRef.get();

    if (!staffDoc.exists || !staffDoc.data()?.isActive) {
      throw new HttpsError('not-found', 'Staff record not found or already inactive.');
    }

    const existingRole = staffDoc.data()?.platformRole;
    const expectedPhrase = `REVOKE ${existingRole}`;

    if (confirmationPhrase !== expectedPhrase) {
      throw new HttpsError(
        'invalid-argument',
        `Step-up confirmation failed. Expected exact confirmation phrase: "${expectedPhrase}".`
      );
    }

    // 1. Reset custom claims to default fan persona
    try {
      await admin.auth().setCustomUserClaims(targetUid, {
        personaType: 'fan',
        claimsVersion: 1,
      });
    } catch (err) {
      throw new HttpsError('internal', `Failed to update custom claims: ${err}`);
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const auditRef = db.collection('auditEvents').doc();

    const batch = db.batch();

    // 2. Soft-deactivate staff record
    batch.update(staffRef, {
      isActive: false,
      revokedByUid: uid,
      revokedAt: now,
      updatedAt: now,
    });

    // 3. Write immutable audit log
    batch.set(auditRef, {
      eventId: auditRef.id,
      action: 'STAFF_ROLE_REVOKED',
      actorUid: uid,
      actorType: 'staff',
      targetId: targetUid,
      targetType: 'staff',
      metadata: {
        previousRole: existingRole,
        revokedByUid: uid,
        confirmationPhraseUsed: expectedPhrase,
      },
      correlationId: `revoke_${targetUid}_${Date.now()}`,
      createdAt: now,
    });

    await batch.commit();

    return {
      success: true,
      targetUid,
      message: `Successfully revoked staff role (${existingRole}) from user ${targetUid}.`,
    };
  }
);
