/**
 * Crowdbeats V2 — Server Push Notification Dispatcher (Phase 11 & Phase 16)
 *
 * Backwards-compatible facade over notificationService.ts:
 * - Queries active device tokens from `/users/{recipientUid}/deviceTokens`
 * - Evaluates recipient opt-in/opt-out preferences with transactional overrides
 * - Deduplicates notifications via idempotency keys
 * - Enforces sliding-window rate limits
 * - Formats FCM multicast payload with deep link data
 * - Prunes invalid / unregistered tokens upon error
 * - Writes notification history to `/notifications/{recipientUid}/items/{id}`
 */

import type {
  DispatchServerNotificationParams,
} from './notificationService.js';
import {
  dispatchServerNotification as serviceDispatch,
} from './notificationService.js';

export interface DispatchNotificationParams extends DispatchServerNotificationParams {}

export async function dispatchServerNotification(
  params: DispatchNotificationParams
): Promise<{ success: boolean; deliveredCount: number; status?: string; notificationId?: string; reason?: string }> {
  return serviceDispatch(params);
}
