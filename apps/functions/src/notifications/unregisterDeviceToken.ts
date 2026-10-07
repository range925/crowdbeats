/**
 * Crowdbeats V2 — Unregister Device Token Cloud Function (Phase 11)
 *
 * Callable function removing device token upon user logout.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const unregisterDeviceToken = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid } = request.auth;
    const { fcmToken } = request.data || {};

    if (!fcmToken || typeof fcmToken !== 'string') {
      throw new HttpsError('invalid-argument', 'Valid FCM token is required.');
    }

    const db = admin.firestore();
    const tokenDocRef = db.collection('users').doc(uid).collection('deviceTokens').doc(fcmToken);

    await tokenDocRef.delete();

    return { success: true };
  }
);
