/**
 * Crowdbeats V2 — Payment Transaction and Ledger Contracts (Phase 3)
 *
 * Collection paths:
 * - /paymentTransactions/{txId}  — SERVER_ONLY
 * - /paymentLedger/{entryId}     — SERVER_ONLY, IMMUTABLE
 *
 * INVARIANTS:
 * - NO client reads or writes these collections ever
 * - Ledger entries are append-only — never updated or deleted
 * - Double-entry: every credit has a corresponding debit
 * - All amounts are integer cents (no floats)
 * - Stripe secret key NEVER appears in any Firestore document
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { ISO4217CurrencyCode } from '../common/money';

// ─── Payment Transaction ──────────────────────────────────────────────────────

export const PaymentTransactionStatus = {
  REQUIRES_PAYMENT_METHOD: 'requires_payment_method',
  REQUIRES_CONFIRMATION: 'requires_confirmation',
  REQUIRES_ACTION: 'requires_action',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed',
} as const;

export type PaymentTransactionStatus =
  (typeof PaymentTransactionStatus)[keyof typeof PaymentTransactionStatus];

export interface PaymentTransaction {
  readonly txId: string;
  readonly fanUid: string;
  readonly tipId: string;
  readonly amountCents: number;
  readonly platformFeeCents: number;
  readonly netAmountCents: number;
  readonly currency: ISO4217CurrencyCode;
  readonly status: PaymentTransactionStatus;
  readonly stripePaymentIntentId: string;
  readonly stripeCustomerId?: string;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  /** Set when webhook confirms capture. */
  readonly capturedAt?: IsoTimestamp;
  readonly failureCode?: string;
  readonly failureMessage?: string;
}

// ─── Ledger Entry (Double-Entry, Immutable) ───────────────────────────────────

export const LedgerAccountType = {
  FAN_PAYMENT: 'fan_payment', // Fan's outbound payment
  PLATFORM_FEE: 'platform_fee', // Crowdbeats revenue
  ARTIST_BALANCE: 'artist_balance', // Creator balance (not client-readable)
  BAND_BALANCE: 'band_balance', // Band collective balance
  STRIPE_TRANSIT: 'stripe_transit', // Funds in Stripe (pre-payout)
  REFUND: 'refund', // Refund to fan
  DISPUTE_HOLD: 'dispute_hold', // Funds held pending dispute resolution
} as const;

export type LedgerAccountType = (typeof LedgerAccountType)[keyof typeof LedgerAccountType];

export const LedgerEntryType = {
  CREDIT: 'credit',
  DEBIT: 'debit',
} as const;

export type LedgerEntryType = (typeof LedgerEntryType)[keyof typeof LedgerEntryType];

export interface PaymentLedgerEntry {
  readonly entryId: string;
  readonly txId: string;
  readonly tipId: string;
  readonly accountType: LedgerAccountType;
  readonly accountId: string; // fanUid, artistId, bandId, or 'platform'
  readonly entryType: LedgerEntryType;
  readonly amountCents: number;
  readonly currency: ISO4217CurrencyCode;
  readonly memo: string;
  readonly createdAt: IsoTimestamp;
  // NO updatedAt — ledger entries are IMMUTABLE
}
