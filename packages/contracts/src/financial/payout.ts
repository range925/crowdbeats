/**
 * Crowdbeats V2 — Payout Contract (Phase 3)
 *
 * Collection path: /payouts/{payoutId}  — SERVER_ONLY for writes
 *
 * INVARIANTS:
 * - Payouts are SERVER-INITIATED via callable (creator requests payout)
 * - Minimum payout: PAYOUT_MINIMUM_CENTS ($10.00 — OD-10 default)
 * - Creator can READ their own payout records
 * - No client can create or update payout documents
 * - Stripe Transfer/Payout IDs are SERVER_ONLY
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { ISO4217CurrencyCode } from '../common/money';
import { PAYOUT_MINIMUM_CENTS } from '../common/money';

export { PAYOUT_MINIMUM_CENTS };

export const PayoutStatus = {
  PENDING: 'pending',
  IN_TRANSIT: 'in_transit',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

export interface PayoutRecord {
  readonly payoutId: string;
  readonly recipientId: string; // artistId or bandId
  readonly recipientType: 'artist' | 'band';
  readonly amountCents: number;
  readonly currency: ISO4217CurrencyCode;
  readonly status: PayoutStatus;
  readonly stripeTransferId?: string; // SERVER_ONLY
  readonly stripePayoutId?: string; // SERVER_ONLY
  readonly requestedByUid: string;
  readonly requestedAt: IsoTimestamp;
  readonly initiatedAt?: IsoTimestamp;
  readonly completedAt?: IsoTimestamp;
  readonly failureReason?: string;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface RequestPayoutRequest {
  readonly recipientId: string;
  readonly recipientType: 'artist' | 'band';
  readonly amountCents: number;
  readonly currency: ISO4217CurrencyCode;
  readonly idempotencyKey: string;
}
