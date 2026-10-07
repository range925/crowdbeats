/**
 * Crowdbeats V2 — Tip Contract (Phase 3)
 *
 * Collection path: /tips/{tipId}
 *
 * INVARIANTS:
 * - Tips are SERVER-CREATED ONLY — no client writes to this collection
 * - amountCents is always a non-negative integer
 * - platformFeeCents is always floor(amountCents * PLATFORM_FEE_BPS / 10000)
 * - netAmountCents = amountCents - platformFeeCents
 * - refundedAt can only be set within FAN_REFUND_WINDOW_HOURS (OD-10: 24h)
 * - Fan can read own tip (fanUid == auth.uid)
 * - Recipient can read tips received (recipientId == auth.uid)
 * - No client can update or delete a tip document
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { ISO4217CurrencyCode } from '../common/money';

// ─── Tip Record ───────────────────────────────────────────────────────────────

export const TipStatus = {
  PENDING: 'pending', // PaymentIntent created, not captured
  SUCCEEDED: 'succeeded', // Payment captured, distribution pending
  DISTRIBUTED: 'distributed', // Ledger entries written
  REFUNDED: 'refunded', // Fan refund processed
  FAILED: 'failed', // Payment failed
  DISPUTED: 'disputed', // Chargeback initiated — hold active
} as const;

export type TipStatus = (typeof TipStatus)[keyof typeof TipStatus];

export interface TipRecord {
  readonly tipId: string;
  readonly fanUid: string;
  readonly recipientId: string; // artistId or bandId
  readonly recipientType: 'artist' | 'band';
  readonly recipientName: string; // Snapshot
  readonly sessionId?: string; // Live session context if applicable
  /** Gross transaction amount in minor units (e.g. cents). */
  readonly amountCents: number;
  readonly grossAmountCents?: number;
  /** Platform fee percentage (6%) and basis points (600 bps). */
  readonly platformFeePercent?: number;
  readonly platformFeeBps?: number;
  readonly platformFeeCents: number;
  /** Stripe processing & Connect fees reported from Stripe BalanceTransaction. */
  readonly stripeProcessingFeeCents?: number | null;
  readonly stripeConnectFeeCents?: number | null;
  readonly taxesOrAdjustmentsCents?: number;
  readonly refundOrDisputeAmountCents?: number;
  /** Net proceeds belonging to the musician or band. */
  readonly netAmountCents: number;
  readonly netProceedsCents?: number;
  readonly currency: ISO4217CurrencyCode;
  readonly status: TipStatus;
  readonly feeDisclosureNotice?: string;
  /** Stripe references. SERVER_ONLY. */
  readonly stripePaymentIntentId: string; // SERVER_ONLY
  readonly stripeChargeId?: string;
  readonly stripeTransferId?: string;
  readonly stripeConnectedAccountId?: string;
  readonly stripeCustomerId?: string;
  readonly message?: string; // Optional fan message (max 200 chars)
  readonly isAnonymous: boolean;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  /** Set when fan requests refund within window. */
  readonly refundedAt?: IsoTimestamp;
  readonly refundReason?: string;
  /** Set when dispute received. Triggers automatic hold. */
  readonly disputedAt?: IsoTimestamp;
}

export const TIP_MESSAGE_MAX = 200 as const;
export const TIP_MINIMUM_CENTS = 100 as const; // $1.00 minimum
export const TIP_MAXIMUM_CENTS = 50000 as const; // $500.00 maximum

// ─── Tip Callable Payloads ────────────────────────────────────────────────────

export interface SendTipRequest {
  readonly recipientId: string;
  readonly recipientType: 'artist' | 'band';
  readonly amountCents: number;
  readonly currency: ISO4217CurrencyCode;
  readonly sessionId?: string;
  readonly message?: string;
  readonly isAnonymous?: boolean;
  readonly idempotencyKey: string;
}

export interface SendTipResponse {
  readonly tipId: string;
  readonly clientSecret: string; // Stripe PaymentIntent client_secret for confirmation
  readonly amountCents: number;
  readonly platformFeeCents: number;
  readonly netAmountCents: number;
}

export interface RequestRefundRequest {
  readonly tipId: string;
  readonly reason?: string;
  readonly idempotencyKey: string;
}

// ─── Fan-Visible Tip Receipt ──────────────────────────────────────────────────

export interface TipReceipt {
  readonly tipId: string;
  readonly recipientName: string;
  readonly amountCents: number;
  readonly currency: ISO4217CurrencyCode;
  readonly status: TipStatus;
  readonly createdAt: IsoTimestamp;
  readonly refundedAt?: IsoTimestamp;
}

// ─── Performer Recipient Resolution ──────────────────────────────────────────

export interface ResolvePerformerRecipientRequest {
  /** Performer immutable ID (artistId, bandId, or uid) or public slug. */
  readonly identifier?: string;
  readonly performerId?: string;
  readonly slug?: string;
  readonly performerType?: 'artist' | 'band';
}

export interface ResolvePerformerRecipientResponse {
  /** Performer immutable ID. */
  readonly performerId: string;
  /** Performer type: solo artist or band entity. */
  readonly performerType: 'artist' | 'band';
  /** Presentation display or stage name. */
  readonly displayName: string;
  /** Public URL-safe slug. */
  readonly slug: string;
  /** Verified public avatar or photo URL. */
  readonly avatarUrl?: string;
  /** Public bio excerpt. */
  readonly bio?: string;
  /** Musical genres. */
  readonly genres: readonly string[];
  /** Whether platform identity is verified. */
  readonly isVerified: boolean;
  /** Server-authoritative live status (true only when active unexpired session exists). */
  readonly isLive: boolean;
  /** Venue name associated with current active session, if applicable. */
  readonly currentVenueName?: string;
  /** Server-authoritative tipping readiness. */
  readonly canAcceptTips: boolean;
  /** Explanation if cannot accept tips. */
  readonly eligibilityReason?: string;
  /** Canonical public tipping URL. */
  readonly canonicalTipUrl: string;
}

/**
 * Builds the canonical public tip URL for a performer.
 */
export function buildCanonicalTipUrl(performerId: string): string {
  return `https://crowdbeats.app/tip/${encodeURIComponent(performerId)}`;
}

