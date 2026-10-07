/**
 * Crowdbeats V2 — Super Admin Initializer / Bootstrap Function
 *
 * Securely initializes the root SUPER_ADMIN platform role for project leadership (David Naufahu):
 * - Enforces authentication
 * - Requires matching BOOTSTRAP_SECRET_KEY or ensures 0 Super Admins currently exist
 * - Sets custom claims: platformRole: 'SUPER_ADMIN', personaType: 'staff'
 * - Records immutable audit event in `/auditEvents/{id}`
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { logger } from '../lib/logger.js';

export const bootstrapSuperAdmin = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to request bootstrap.');
    }

    const { uid } = request.auth;
    const { secretKey, targetUid } = request.data || {};
    const effectiveTargetUid = targetUid || uid;

    const db = admin.firestore();
    const envSecret = process.env.BOOTSTRAP_SECRET_KEY;

    // Security check: BOOTSTRAP_SECRET_KEY must be configured on the server and match caller secret
    if (!envSecret || envSecret.trim().length === 0) {
      logger.error('Bootstrap attempt rejected: BOOTSTRAP_SECRET_KEY is not configured on server', {
        callerUid: uid,
      });
      throw new HttpsError('failed-precondition', 'Bootstrap secret key is not configured on the server.');
    }

    if (secretKey !== envSecret) {
      logger.warn('Bootstrap attempt rejected: invalid secret key', {
        callerUid: uid,
      });
      throw new HttpsError('permission-denied', 'Invalid bootstrap secret key.');
    }

    // 1. Set Custom Claims
    await admin.auth().setCustomUserClaims(effectiveTargetUid, {
      platformRole: 'SUPER_ADMIN',
      personaType: 'staff',
    });

    // 2. Update user profile document
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.collection('users').doc(effectiveTargetUid).set(
      {
        platformRole: 'SUPER_ADMIN',
        personaType: 'staff',
        updatedAt: now,
      },
      { merge: true }
    );

    // 3. Write Immutable Audit Event
    const auditRef = db.collection('auditEvents').doc();
    await auditRef.set({
      eventId: auditRef.id,
      actionType: 'STAFF_ROLE_GRANTED',
      actorUid: uid,
      targetEntityType: 'user',
      targetEntityId: effectiveTargetUid,
      details: {
        role: 'SUPER_ADMIN',
        reason: 'Bootstrap initialization',
      },
      timestamp: now,
    });

    logger.info('Super Admin role bootstrapped successfully', {
      actorUid: uid,
      targetUid: effectiveTargetUid,
    });

    return {
      success: true,
      message: `User ${effectiveTargetUid} has been granted SUPER_ADMIN role.`,
    };
  }
);
