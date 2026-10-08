import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const ALLOWED_UPDATE_FIELDS = ['displayName', 'bio', 'photoUrl', 'genre', 'city', 'publicLocation', 'internalNotes'];

export const adminUpdateUserProfile = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const callerRole = token.platformRole;

    if (!['SUPER_ADMIN', 'CUSTOMER_SUPPORT', 'TRUST_SAFETY', 'ARTIST_RELATIONS'].includes(callerRole)) {
      throw new HttpsError('permission-denied', 'Caller does not have required staff role.');
    }

    const { targetUid, updates, reason } = request.data || {};

    if (!targetUid || typeof targetUid !== 'string') {
      throw new HttpsError('invalid-argument', 'Target UID is required.');
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Reason for update is required.');
    }
    if (!updates || typeof updates !== 'object') {
      throw new HttpsError('invalid-argument', 'Updates object is required.');
    }

    // Validate keys
    const updateKeys = Object.keys(updates);
    const hasUnauthorizedFields = updateKeys.some(key => !ALLOWED_UPDATE_FIELDS.includes(key));
    if (hasUnauthorizedFields) {
      throw new HttpsError('invalid-argument', 'Updates contain unauthorized fields.');
    }

    const db = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const userRef = db.doc(`users/${targetUid}`);
    const artistRef = db.doc(`artistProfiles/${targetUid}`);

    const [userSnap, artistSnap] = await Promise.all([
      userRef.get(),
      artistRef.get()
    ]);

    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Target user not found.');
    }

    const batch = db.batch();

    const userUpdates: Record<string, any> = {
      updatedAt: now
    };
    const artistUpdates: Record<string, any> = {};

    for (const key of updateKeys) {
      if (key === 'internalNotes') {
        userUpdates['internalNotes'] = admin.firestore.FieldValue.arrayUnion({
          authorUid: uid,
          timestamp: Date.now(), // Use standard timestamp for arrayUnion to avoid nested serverTimestamp issues, or just Timestamp.now()
          note: updates.internalNotes
        });
      } else {
        userUpdates[key] = updates[key];
        if (artistSnap.exists) {
          artistUpdates[key] = updates[key];
        }
      }
    }

    batch.update(userRef, userUpdates);

    if (artistSnap.exists && Object.keys(artistUpdates).length > 0) {
      artistUpdates['updatedAt'] = now;
      batch.update(artistRef, artistUpdates);
    }

    const auditRef = db.collection('auditEvents').doc();
    batch.set(auditRef, {
      eventId: auditRef.id,
      actorUid: uid,
      actorEmail: token.email || '',
      actorRole: callerRole,
      targetUid: targetUid,
      targetType: 'user',
      action: 'ADMIN_UPDATE_USER_PROFILE',
      fieldDiff: updateKeys,
      reason: reason.trim(),
      timestamp: now,
      requestId: `upd_${targetUid}_${Date.now()}`
    });

    await batch.commit();

    return {
      success: true,
      message: 'Profile updated successfully.'
    };
  }
);
