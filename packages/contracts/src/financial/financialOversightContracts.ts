/**
 * Crowdbeats V2 — Financial Oversight, Ledger & Reconciliation Contracts (Phase 18)
 *
 * Defines models, enums, and request/response payloads for:
 * - Transaction ledger views & double-entry balances
 * - Platform-fee reporting & scoped overrides
 * - Payout states & exception queues
 * - Stripe reconciliation & dispute management
 * - Authorized compliant financial data exports (Zero raw card data)
 */

import type { IsoTimestamp } from '../common/timestamp';

// ─── Financial Ledger ─────────────────────────────────────────────────────────

export const FinancialLedgerEventType = {
  TIP_CREDIT: 'TIP_CREDIT',
  PLATFORM_FEE_CREDIT: 'PLATFORM_FEE_CREDIT',
  PAYOUT_DEBIT: 'PAYOUT_DEBIT',
  REFUND_DEBIT: 'REFUND_DEBIT',
  FEE_REFUND_DEBIT: 'FEE_REFUND_DEBIT',
  DISPUTE_HOLD_DEBIT: 'DISPUTE_HOLD_DEBIT',
  DISPUTE_REVERSAL_CREDIT: 'DISPUTE_REVERSAL_CREDIT',
} as const;

export type FinancialLedgerEventType =
  (typeof FinancialLedgerEventType)[keyof typeof FinancialLedgerEventType];

export interface FinancialLedgerEntry {
  readonly id: string;
  readonly transactionId: string;
  readonly type: FinancialLedgerEventType;
  readonly amountCents: number;
  readonly currency: string;
  readonly creatorId?: string;
  readonly fanUid?: string;
  readonly stripePaymentIntentId?: string;
  readonly stripeEventId?: string;
  readonly description: string;
  readonly createdAt: IsoTimestamp;
}

export interface FinancialLedgerSummary {
  readonly totalGrossCents: number;
  readonly totalPlatformFeesCents: number;
  readonly totalNetPayoutsCents: number;
  readonly totalRefundsCents: number;
  readonly totalDisputesCents: number;
  readonly balanced: boolean;
  readonly discrepancyCount: number;
  readonly lastReconciledAt?: IsoTimestamp;
}

// ─── Payout States ────────────────────────────────────────────────────────────

export const AdminPayoutStatus = {
  PENDING: 'pending',
  IN_TRANSIT: 'in_transit',
  PAID: 'paid',
  FAILED: 'failed',
  HELD: 'held',
  CANCELED: 'canceled',
} as const;

export type AdminPayoutStatus =
  (typeof AdminPayoutStatus)[keyof typeof AdminPayoutStatus];

export interface DestinationBankSummary {
  readonly bankName: string;
  readonly last4: string;
  readonly accountHolderName?: string;
  readonly routingSummary?: string;
}

export interface AdminPayoutRecord {
  readonly payoutId: string;
  readonly creatorId: string;
  readonly creatorName: string;
  readonly creatorType: 'artist' | 'band';
  readonly amountCents: number;
  readonly currency: string;
  readonly status: AdminPayoutStatus;
  readonly destination: DestinationBankSummary;
  readonly failureReason?: string;
  readonly complianceHoldReason?: string;
  readonly stripePayoutId?: string;
  readonly createdAt: IsoTimestamp;
  readonly estimatedArrival?: IsoTimestamp;
}

// ─── Scoped Fee Overrides ─────────────────────────────────────────────────────

export const FeeOverrideScope = {
  GENRE: 'GENRE',
  VENUE: 'VENUE',
  STREET: 'STREET',
  CREATOR: 'CREATOR',
} as const;

export type FeeOverrideScope =
  (typeof FeeOverrideScope)[keyof typeof FeeOverrideScope];

export interface ScopedFeeOverride {
  readonly id: string;
  readonly scope: FeeOverrideScope;
  readonly targetId: string;
  readonly targetLabel: string;
  readonly rateBasisPoints: number; // e.g. 500 = 5.0%
  readonly effectiveFrom: IsoTimestamp;
  readonly effectiveTo?: IsoTimestamp;
  readonly version: number;
  readonly status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED';
  readonly reason: string;
}

// ─── Financial Data Exports (Zero Raw Card Data Invariant) ───────────────────

export const FinancialExportType = {
  TRANSACTIONS: 'TRANSACTIONS',
  RECONCILIATION_LEDGER: 'RECONCILIATION_LEDGER',
  PAYOUT_REGISTER: 'PAYOUT_REGISTER',
  DISPUTES_AUDIT: 'DISPUTES_AUDIT',
} as const;

export type FinancialExportType =
  (typeof FinancialExportType)[keyof typeof FinancialExportType];

export const FinancialExportFormat = {
  CSV: 'CSV',
  JSON: 'JSON',
} as const;

export type FinancialExportFormat =
  (typeof FinancialExportFormat)[keyof typeof FinancialExportFormat];

export interface FinancialExportRecord {
  readonly exportId: string;
  readonly exportType: FinancialExportType;
  readonly format: FinancialExportFormat;
  readonly status: 'generating' | 'ready' | 'failed';
  readonly recordCount: number;
  readonly downloadUrl?: string;
  readonly requestedByUid: string;
  readonly createdAt: IsoTimestamp;
  readonly expiresAt: IsoTimestamp;
}

export interface GenerateFinancialExportRequest {
  readonly exportType: FinancialExportType;
  readonly format: FinancialExportFormat;
  readonly startDate?: IsoTimestamp;
  readonly endDate?: IsoTimestamp;
}

// ─── Safe Masked Card Metadata (PCI DSS Compliance) ──────────────────────────

export interface SafePaymentInstrumentSummary {
  readonly brand: string; // e.g. 'visa', 'mastercard', 'amex'
  readonly last4: string; // e.g. '4242'
  readonly expMonth?: number;
  readonly expYear?: number;
  readonly country?: string;
}
