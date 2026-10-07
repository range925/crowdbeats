/**
 * Crowdbeats V2 — Server Push Notification Dispatcher (Phase 11)
 *
 * Core push dispatcher with stale token cleanup:
 * - Queries active device tokens from `/users/{recipientUid}/deviceTokens`
 * - Formats FCM multicast payload with deep link data
 * - Prunes invalid / unregistered tokens upon error
 * - Writes notification history to `/notifications/{recipientUid}/items/{id}`
 */

import * as admin from 'firebase-admin';
import { logger } from '../lib/logger.js';

export interface DispatchNotificationParams {
  recipientUid: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  clickAction?: string;
  correlationId?: string;
}

export async function dispatchServerNotification(
  params: DispatchNotificationParams
): Promise<{ success: boolean; deliveredCount: number }> {
  const { recipientUid, type, title, body, data = {}, clickAction, correlationId } = params;
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Record notification in recipient's Firestore inbox
  const notifRef = db.collection('notifications').doc(recipientUid).collection('items').doc();
  await notifRef.set({
    notificationId: notifRef.id,
    type,
    title,
    body,
    data,
    clickAction: clickAction || null,
    isRead: false,
    createdAt: now,
  });

  // 2. Fetch active device tokens
  const tokensSnapshot = await db
    .collection('users')
    .doc(recipientUid)
    .collection('deviceTokens')
    .get();

  if (tokensSnapshot.empty) {
    logger.info('No registered device tokens for recipient', { recipientUid }, correlationId);
    return { success: true, deliveredCount: 0 };
  }

  const tokens = tokensSnapshot.docs.map((d) => d.id);

  // 3. Send FCM multicast
  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title, body },
    data: {
      ...data,
      type,
      ...(clickAction ? { click_action: clickAction } : {}),
    },
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    const staleTokens: string[] = [];

    response.responses.forEach((res, idx) => {
      if (!res.success && res.error) {
        const errCode = res.error.code;
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          staleTokens.push(tokens[idx]);
        }
      }
    });

    // 4. Prune stale / expired tokens
    if (staleTokens.length > 0) {
      const batch = db.batch();
      for (const staleToken of staleTokens) {
        const docRef = db
          .collection('users')
          .doc(recipientUid)
          .collection('deviceTokens')
          .doc(staleToken);
        batch.delete(docRef);
      }
      await batch.commit();
      logger.info('Pruned stale FCM tokens', { recipientUid, count: staleTokens.length }, correlationId);
    }

    return {
      success: true,
      deliveredCount: response.successCount,
    };
  } catch (err) {
    logger.error('Failed to dispatch FCM multicast', err, { recipientUid }, correlationId);
    return { success: false, deliveredCount: 0 };
  }
}
