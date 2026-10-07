/**
 * Crowdbeats V2 — User Settings & Preferences Callables
 *
 * Provides authenticated Cloud Functions for updating notification preferences,
 * privacy preferences, tipping defaults, and blocking/unblocking accounts.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const _db = () => admin.firestore();

export const updateNotificationPreferences = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const prefs = request.data ?? {};

    await _db()
      .collection('users')
      .doc(uid)
      .collection('settings')
      .doc('notifications')
      .set(
        {
          ...prefs,
          // Guarantee security / transactional alerts cannot be silently disabled
          tipsReceived: true,
          payoutsAndTransfers: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return { ok: true, message: 'Notification preferences updated.' };
  },
);

export const updatePrivacyPreferences = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const prefs = request.data ?? {};

    await _db()
      .collection('users')
      .doc(uid)
      .collection('settings')
      .doc('privacy')
      .set(
        {
          ...prefs,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return { ok: true, message: 'Privacy preferences updated.' };
  },
);

export const blockUser = onCall<{ targetUid: string; reason?: string }>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const targetUid = request.data?.targetUid;

    if (!targetUid || typeof targetUid !== 'string' || targetUid === uid) {
      throw new HttpsError('invalid-argument', 'Invalid target user ID.');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    await _db()
      .collection('users')
      .doc(uid)
      .collection('blockedUsers')
      .doc(targetUid)
      .set({
        blockedUid: targetUid,
        blockedAt: now,
        reason: request.data?.reason ?? 'USER_BLOCKED',
      });

    return { ok: true, message: 'User blocked.' };
  },
);

export const unblockUser = onCall<{ targetUid: string }>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const targetUid = request.data?.targetUid;

    if (!targetUid || typeof targetUid !== 'string') {
      throw new HttpsError('invalid-argument', 'Invalid target user ID.');
    }

    await _db()
      .collection('users')
      .doc(uid)
      .collection('blockedUsers')
      .doc(targetUid)
      .delete();

    return { ok: true, message: 'User unblocked.' };
  },
);
