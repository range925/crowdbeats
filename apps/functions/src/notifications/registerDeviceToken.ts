/**
 * Crowdbeats V2 — Register FCM Device Token Cloud Function (Phase 11)
 *
 * Callable function storing mobile and web FCM registration tokens in `/users/{uid}/deviceTokens/{tokenId}`.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const registerDeviceToken = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid } = request.auth;
    const { fcmToken, platform, appVersion } = request.data || {};

    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length < 10) {
      throw new HttpsError('invalid-argument', 'Valid FCM token is required.');
    }

    const validPlatforms = ['ios', 'android', 'web'];
    const safePlatform = validPlatforms.includes(platform) ? platform : 'web';

    const db = admin.firestore();
    const tokenDocRef = db.collection('users').doc(uid).collection('deviceTokens').doc(fcmToken);
    const now = admin.firestore.FieldValue.serverTimestamp();

    await tokenDocRef.set(
      {
        fcmToken,
        platform: safePlatform,
        appVersion: appVersion ? String(appVersion) : '2.0.0',
        registeredAt: now,
        lastSeenAt: now,
      },
      { merge: true }
    );

    return { success: true };
  }
);
