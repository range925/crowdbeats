/**
 * Crowdbeats V2 — Notifications & Workflow Automation Contracts (Phase 16)
 *
 * Implements server-authoritative multi-channel notification dispatching,
 * idempotent deduplication, preference enforcement, rate limiting, and automated retries.
 *
 * Supported Notification Types:
 * - Tips & Splits: `TIP_RECEIVED`, `TIP_SENT`, `SPLIT_DISTRIBUTED`, `MATCH_POOL_ACTIVATED`, `REFUND_STATUS`
 * - Follows & Social: `NEW_FOLLOWER`, `FOLLOWER_MILESTONE`, `MESSAGE_RECEIVED`, `MESSAGE_REQUEST_RECEIVED`
 * - Campaigns: `CAMPAIGN_PLEDGE_CONFIRMED`, `CAMPAIGN_GOAL_REACHED`, `CAMPAIGN_UPDATE`
 * - Sponsorships: `SPONSORSHIP_OFFER_RECEIVED`, `SPONSORSHIP_CONTRACT_ACTIVATED`, `SPONSOR_APPLICATION_SUBMITTED`
 * - Verification: `VERIFICATION_APPROVED`, `VERIFICATION_REJECTED`
 * - Support: `SUPPORT_TICKET_REPLIED`, `SUPPORT_TICKET_RESOLVED`, `SUPPORT_CASE_ASSIGNED`
 * - Payouts & Financial: `PAYOUT_INITIATED`, `PAYOUT_COMPLETED`, `PAYOUT_FAILED`, `PAYOUT_HOLD_APPLIED`
 * - Security & Safety: `SECURITY_ALERT`, `SYSTEM_MAINTENANCE`
 */

import type { IsoTimestamp } from '../common/timestamp';

// ─── 1. Notification Types & Categorization ─────────────────────────────────

export const NotificationType = {
  // Tips & Splits
  TIP_RECEIVED: 'TIP_RECEIVED',
  TIP_SENT: 'TIP_SENT',
  SPLIT_DISTRIBUTED: 'SPLIT_DISTRIBUTED',
  MATCH_POOL_ACTIVATED: 'MATCH_POOL_ACTIVATED',
  REFUND_STATUS: 'REFUND_STATUS',

  // Follows & Social
  NEW_FOLLOWER: 'NEW_FOLLOWER',
  FOLLOWER_MILESTONE: 'FOLLOWER_MILESTONE',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  MESSAGE_REQUEST_RECEIVED: 'MESSAGE_REQUEST_RECEIVED',

  // Campaigns
  CAMPAIGN_PLEDGE_CONFIRMED: 'CAMPAIGN_PLEDGE_CONFIRMED',
  CAMPAIGN_GOAL_REACHED: 'CAMPAIGN_GOAL_REACHED',
  CAMPAIGN_UPDATE: 'CAMPAIGN_UPDATE',

  // Sponsorships
  SPONSORSHIP_OFFER_RECEIVED: 'SPONSORSHIP_OFFER_RECEIVED',
  SPONSORSHIP_CONTRACT_ACTIVATED: 'SPONSORSHIP_CONTRACT_ACTIVATED',
  SPONSOR_APPLICATION_SUBMITTED: 'SPONSOR_APPLICATION_SUBMITTED',

  // Verification & Trust
  VERIFICATION_APPROVED: 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED: 'VERIFICATION_REJECTED',

  // Support & Cases
  SUPPORT_TICKET_REPLIED: 'SUPPORT_TICKET_REPLIED',
  SUPPORT_TICKET_RESOLVED: 'SUPPORT_TICKET_RESOLVED',
  SUPPORT_CASE_ASSIGNED: 'SUPPORT_CASE_ASSIGNED',

  // Payouts & Financial
  PAYOUT_INITIATED: 'PAYOUT_INITIATED',
  PAYOUT_COMPLETED: 'PAYOUT_COMPLETED',
  PAYOUT_FAILED: 'PAYOUT_FAILED',
  PAYOUT_HOLD_APPLIED: 'PAYOUT_HOLD_APPLIED',

  // Security & System
  SECURITY_ALERT: 'SECURITY_ALERT',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/** Transactional notification types that bypass user opt-out preferences (critical/compliance) */
export const MANDATORY_NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set([
  NotificationType.SECURITY_ALERT,
  NotificationType.PAYOUT_COMPLETED,
  NotificationType.PAYOUT_FAILED,
  NotificationType.PAYOUT_HOLD_APPLIED,
  NotificationType.REFUND_STATUS,
  NotificationType.VERIFICATION_APPROVED,
  NotificationType.VERIFICATION_REJECTED,
]);

// ─── 2. Delivery Channels & Statuses ────────────────────────────────────────

export type NotificationChannel = 'in_app' | 'push' | 'email';

export type NotificationDeliveryStatus =
  | 'delivered'
  | 'skipped_preference'
  | 'throttled_rate_limit'
  | 'duplicate_deduped'
  | 'failed'
  | 'retrying';

// ─── 3. Payloads & Dispatch Models ──────────────────────────────────────────

export interface NotificationPayload {
  readonly recipientUid: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, string>;
  readonly clickAction?: string; // Deep link URL
  readonly idempotencyKey?: string;
  readonly channels?: NotificationChannel[];
  readonly correlationId?: string;
}

export interface NotificationDispatchResult {
  readonly success: boolean;
  readonly notificationId: string;
  readonly recipientUid: string;
  readonly type: NotificationType;
  readonly status: NotificationDeliveryStatus;
  readonly channels: {
    readonly inApp: boolean;
    readonly push: boolean;
    readonly email: boolean;
  };
  readonly deliveredCount: number;
  readonly reason?: string;
  readonly retryCount?: number;
  readonly idempotencyKey?: string;
}

// ─── 4. In-App Notification Item Model ──────────────────────────────────────

export interface InAppNotificationItem {
  readonly notificationId: string;
  readonly recipientUid: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, string>;
  readonly clickAction?: string | null;
  readonly isRead: boolean;
  readonly readAt?: IsoTimestamp | null;
  readonly createdAt: IsoTimestamp;
  readonly idempotencyKey?: string | null;
}

// ─── 5. Rate Limits & Deduplication Constants ───────────────────────────────

export const NOTIFICATION_RATE_LIMITS = {
  MAX_PER_MINUTE: 10,
  MAX_PER_HOUR: 60,
  DEDUPLICATION_WINDOW_MS: 86400000, // 24 hours
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY_MS: 2000,
  MAX_RETRY_DELAY_MS: 30000,
} as const;

// ─── 6. Device Tokens & Subscriptions ───────────────────────────────────────

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

// ─── 7. Retries & Dead-Letter Queue (DLQ) ───────────────────────────────────

export interface NotificationRetryRecord {
  readonly retryId: string;
  readonly recipientUid: string;
  readonly payload: NotificationPayload;
  readonly attemptCount: number;
  readonly maxRetries: number;
  readonly lastAttemptAt: IsoTimestamp;
  readonly nextAttemptAt: IsoTimestamp;
  readonly error?: string;
  readonly status: 'pending' | 'exhausted' | 'resolved';
}

export interface NotificationDlqItem {
  readonly dlqId: string;
  readonly recipientUid: string;
  readonly payload: NotificationPayload;
  readonly totalAttempts: number;
  readonly firstAttemptAt: IsoTimestamp;
  readonly failedAt: IsoTimestamp;
  readonly finalError: string;
  readonly resolvedByStaffUid?: string | null;
  readonly status: 'unresolved' | 'investigating' | 'resolved' | 'dismissed';
}

// ─── 8. Callable Requests / Responses ───────────────────────────────────────

export interface MarkNotificationReadRequest {
  readonly notificationId: string;
}

export interface MarkNotificationReadResponse {
  readonly ok: boolean;
  readonly notificationId: string;
}

export interface MarkAllNotificationsReadResponse {
  readonly ok: boolean;
  readonly markedCount: number;
}

export interface ListInAppNotificationsRequest {
  readonly limit?: number;
  readonly unreadOnly?: boolean;
}

export interface ListInAppNotificationsResponse {
  readonly ok: boolean;
  readonly items: InAppNotificationItem[];
  readonly unreadCount: number;
}

export interface ProcessNotificationRetryRequest {
  readonly retryId: string;
}

export interface ProcessNotificationRetryResponse {
  readonly ok: boolean;
  readonly result: NotificationDispatchResult;
}
