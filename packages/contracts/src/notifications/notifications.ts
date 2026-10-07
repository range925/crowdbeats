/**
 * Crowdbeats V2 — Notifications & FCM Token Contracts (Phase 11)
 *
 * Notification Types:
 * - `TIP_RECEIVED`: Sent to artist/band members when fan tips.
 * - `SPLIT_DISTRIBUTED`: Sent to band member when their split share is credited.
 * - `MATCH_POOL_ACTIVATED`: Sent to performers when sponsor matching starts on their stage.
 * - `REFUND_STATUS`: Sent to fan when refund is processed.
 * - `CAMPAIGN_UPDATE`: Sent to backers on creator progress posts.
 * - `SECURITY_ALERT`: Sent on login/step-up events.
 */

import type { IsoTimestamp } from '../common/timestamp';

export const NotificationType = {
  TIP_RECEIVED: 'TIP_RECEIVED',
  SPLIT_DISTRIBUTED: 'SPLIT_DISTRIBUTED',
  MATCH_POOL_ACTIVATED: 'MATCH_POOL_ACTIVATED',
  REFUND_STATUS: 'REFUND_STATUS',
  CAMPAIGN_UPDATE: 'CAMPAIGN_UPDATE',
  SECURITY_ALERT: 'SECURITY_ALERT',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export interface NotificationPayload {
  readonly recipientUid: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, string>;
  readonly clickAction?: string; // Deep link URL
}

export interface RegisterDeviceTokenPayload {
  readonly fcmToken: string;
  readonly platform: 'ios' | 'android' | 'web';
  readonly appVersion?: string;
}

export interface UnregisterDeviceTokenPayload {
  readonly fcmToken: string;
}

export interface DeviceTokenRecord {
  readonly fcmToken: string;
  readonly platform: 'ios' | 'android' | 'web';
  readonly appVersion?: string;
  readonly registeredAt: IsoTimestamp;
  readonly lastSeenAt: IsoTimestamp;
}
