/**
 * Crowdbeats V2 — Grant Staff Role Cloud Function (Phase 10)
 *
 * Callable function for assigning platform staff roles:
 * - Requires caller to have `SUPER_ADMIN` platform role in custom claims
 * - Validates role against canonical 16-role list (OD-07)
 * - Requires step-up typed confirmation phrase: "GRANT {ROLE}"
 * - Updates Firebase Auth Custom Claims via Admin SDK
 * - Sets `/staffRecords/{targetUid}` document
 * - Writes immutable audit event `STAFF_ROLE_GRANTED`
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const VALID_PLATFORM_ROLES = [
  'SUPER_ADMIN',
  'EXECUTIVE',
  'FINANCE_ANALYST',
  'DATA_ANALYST',
  'CONTENT_MODERATOR',
  'TRUST_SAFETY',
  'COMPLIANCE_OFFICER',
  'CUSTOMER_SUPPORT',
  'GROWTH_MANAGER',
  'PARTNERSHIPS',
  'ARTIST_RELATIONS',
  'VENUE_RELATIONS',
  'DEVELOPER',
  'QA_TESTER',
  'LEGAL',
  'MARKETING',
];

export const grantStaffRole = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const callerRole = token.platformRole;

    if (callerRole !== 'SUPER_ADMIN') {
      throw new HttpsError('permission-denied', 'Only Super Administrators can grant staff roles.');
    }

    const { targetUid, targetEmail, role, confirmationPhrase } = request.data || {};

    if (!targetUid || typeof targetUid !== 'string') {
      throw new HttpsError('invalid-argument', 'Target user ID is required.');
    }
    if (!role || !VALID_PLATFORM_ROLES.includes(role)) {
      throw new HttpsError('invalid-argument', `Invalid platform role. Must be one of: ${VALID_PLATFORM_ROLES.join(', ')}`);
    }

    const expectedPhrase = `GRANT ${role}`;
    if (confirmationPhrase !== expectedPhrase) {
      throw new HttpsError(
        'invalid-argument',
        `Step-up confirmation failed. Expected exact confirmation phrase: "${expectedPhrase}".`
      );
    }

    const db = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();

    // 1. Update Firebase Auth Custom Claims
    try {
      await admin.auth().setCustomUserClaims(targetUid, {
        platformRole: role,
        personaType: 'staff',
        claimsVersion: 1,
      });
    } catch (err) {
      throw new HttpsError('internal', `Failed to set custom claims: ${err}`);
    }

    // 2. Update staffRecords document in Firestore
    const staffRef = db.collection('staffRecords').doc(targetUid);
    const auditRef = db.collection('auditEvents').doc();

    const batch = db.batch();

    batch.set(
      staffRef,
      {
        uid: targetUid,
        email: targetEmail ? String(targetEmail).toLowerCase() : null,
        displayName: token.name || 'Staff Member',
        platformRole: role,
        grantedByUid: uid,
        grantedAt: now,
        isActive: true,
        updatedAt: now,
      },
      { merge: true }
    );

    // 3. Write immutable audit log
    batch.set(auditRef, {
      eventId: auditRef.id,
      action: 'STAFF_ROLE_GRANTED',
      actorUid: uid,
      actorType: 'staff',
      targetId: targetUid,
      targetType: 'staff',
      metadata: {
        roleGranted: role,
        grantedByUid: uid,
        confirmationPhraseUsed: expectedPhrase,
      },
      correlationId: `grant_${targetUid}_${Date.now()}`,
      createdAt: now,
    });

    await batch.commit();

    return {
      success: true,
      targetUid,
      role,
      message: `Successfully granted ${role} to user ${targetUid}.`,
    };
  }
);
