/**
 * Crowdbeats V2 — Notification Callables (Phase 16)
 *
 * Exposes server-authoritative callables for:
 * - Marking individual and batch in-app notifications as read
 * - Listing paginated in-app notifications with unread counts
 * - Processing automated/manual retries for failed notification dispatches
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type {
  MarkNotificationReadRequest,
  MarkNotificationReadResponse,
  MarkAllNotificationsReadResponse,
  ListInAppNotificationsRequest,
  ListInAppNotificationsResponse,
  ProcessNotificationRetryRequest,
  ProcessNotificationRetryResponse,
} from '@crowdbeats/contracts';
import {
  markNotificationRead as svcMarkRead,
  markAllNotificationsRead as svcMarkAllRead,
  listInAppNotifications as svcListNotifications,
  processNotificationRetry as svcProcessRetry,
} from './notificationService.js';
import { isStaffCaller } from '../crm/crmService.js';

export const markNotificationRead = onCall<MarkNotificationReadRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<MarkNotificationReadResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { notificationId } = request.data || {};

    if (!notificationId || typeof notificationId !== 'string') {
      throw new HttpsError('invalid-argument', 'Valid notificationId is required.');
    }

    await svcMarkRead(uid, notificationId);
    return { ok: true, notificationId };
  }
);

export const markAllNotificationsRead = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<MarkAllNotificationsReadResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;

    const markedCount = await svcMarkAllRead(uid);
    return { ok: true, markedCount };
  }
);

export const listInAppNotifications = onCall<ListInAppNotificationsRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ListInAppNotificationsResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = request.auth.uid;
    const { limit = 20, unreadOnly = false } = request.data || {};

    const { items, unreadCount } = await svcListNotifications(uid, limit, unreadOnly);
    return { ok: true, items, unreadCount };
  }
);

export const processNotificationRetry = onCall<ProcessNotificationRetryRequest>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ProcessNotificationRetryResponse> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const callerToken = request.auth.token;

    // Staff only callable
    const isStaff = isStaffCaller({
      platformRole: (callerToken as any).role || (callerToken as any).platformRole,
      isAdmin: (callerToken as any).admin === true || (callerToken as any).superAdmin === true,
    });

    if (!isStaff) {
      throw new HttpsError('permission-denied', 'Staff authorization required to process notification retries.');
    }

    const { retryId } = request.data || {};
    if (!retryId || typeof retryId !== 'string') {
      throw new HttpsError('invalid-argument', 'Valid retryId is required.');
    }

    const result = await svcProcessRetry(retryId);
    return { ok: result.success, result };
  }
);
