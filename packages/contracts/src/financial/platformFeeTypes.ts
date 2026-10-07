/**
 * Crowdbeats V2 — Platform Fee Configuration & Financial Reconciliation Schemas
 *
 * Defines percentage fee rules, basis point conversion, server-side quotes,
 * and Stripe application fee reconciliation states.
 */

export type FeeRuleState =
  | 'draft'
  | 'pending_finance_review'
  | 'pending_legal_review'
  | 'approved'
  | 'scheduled'
  | 'active'
  | 'superseded'
  | 'rejected'
  | 'disabled';

export type PaymentTransactionType =
  | 'LIVE_TIP'
  | 'QR_TIP'
  | 'PROFILE_TIP'
  | 'CAMPAIGN_CONTRIBUTION'
  | 'SPONSOR_PAYMENT';

export type StripeChargeType =
  | 'DESTINATION_CHARGE'
  | 'DIRECT_CHARGE'
  | 'SEPARATE_CHARGE_TRANSFER';

export interface PlatformFeeRule {
  readonly id: string;
  readonly name: string;
  readonly environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  readonly feeBasisPoints: number; // 0 to 1000 (0.00% to 10.00%)
  readonly minFeeCents?: number;
  readonly maxFeeCents?: number;
  readonly currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  readonly transactionType: PaymentTransactionType;
  readonly chargeType: StripeChargeType;
  readonly state: FeeRuleState;
  readonly effectiveStart: string;
  readonly effectiveEnd?: string;
  readonly legalDisclosureVersion: string;
  readonly termsVersion: string;
  readonly refundPolicy: 'PROPORTIONAL' | 'FULL' | 'RETAINED';
  readonly authorUid: string;
  readonly primaryReviewerUid?: string;
  readonly secondaryApproverUid?: string; // Dual approval
  readonly reasonForChange: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface FeeCalculationQuote {
  readonly quoteId: string;
  readonly grossAmountCents: number;
  readonly platformFeeCents: number;
  readonly estimatedRecipientCents: number;
  readonly currency: string;
  readonly feeBasisPoints: number;
  readonly feeRuleId: string;
  readonly feeRuleVersion: string;
  readonly disclosureVersion: string;
  readonly expiresAt: string;
  readonly transactionType: PaymentTransactionType;
}

export type ReconciliationState =
  | 'pending'
  | 'matched'
  | 'amount_mismatch'
  | 'missing_application_fee'
  | 'orphaned_application_fee'
  | 'partially_refunded'
  | 'fully_refunded'
  | 'dispute_open'
  | 'transfer_mismatch'
  | 'manually_reviewed'
  | 'resolved';

export interface ReconciliationRecord {
  readonly id: string;
  readonly stripeApplicationFeeId?: string;
  readonly stripeChargeId: string;
  readonly paymentIntentId: string;
  readonly crowdbeatsPaymentId: string;
  readonly feeRuleVersion: string;
  readonly grossAmountCents: number;
  readonly expectedFeeCents: number;
  readonly actualStripeFeeCents: number;
  readonly refundedFeeCents: number;
  readonly stripeProcessingFeeCents: number;
  readonly netPlatformRevenueCents: number;
  readonly connectedAccountId: string;
  readonly transactionType: PaymentTransactionType;
  readonly reconciliationState: ReconciliationState;
  readonly createdAt: string;
  readonly lastCheckedAt: string;
  readonly exceptionReason?: string;
}

// Master platform fee invariants
export const DEFAULT_PRODUCTION_FEE_BPS = 0 as const; // 0.00% until David approves
export const TEST_DEFAULT_FEE_BPS = 600 as const; // 6.00% for sandbox testing
export const MAX_ALLOWED_FEE_BPS = 1000 as const; // 10.00% hard maximum platform limit

export const INITIAL_PLATFORM_FEE_RULES: readonly PlatformFeeRule[] = [
  {
    id: 'rule-live-tips-dev',
    name: 'Standard Live Stage & QR Tips (Development)',
    environment: 'DEVELOPMENT',
    feeBasisPoints: 600, // 6.00%
    currency: 'USD',
    transactionType: 'LIVE_TIP',
    chargeType: 'DESTINATION_CHARGE',
    state: 'active',
    effectiveStart: '2026-08-21T00:00:00Z',
    legalDisclosureVersion: 'DISC-2026-08-21',
    termsVersion: '2026-08-21',
    refundPolicy: 'PROPORTIONAL',
    authorUid: 'admin_lead_1',
    primaryReviewerUid: 'finance_admin_1',
    secondaryApproverUid: 'super_admin_david',
    reasonForChange: 'Standard sandbox 6% technology fee for live performances.',
    createdAt: '2026-08-21T00:00:00Z',
    updatedAt: '2026-08-21T00:00:00Z',
  },
  {
    id: 'rule-live-tips-prod',
    name: 'Standard Live Stage Tips (Production)',
    environment: 'PRODUCTION',
    feeBasisPoints: 0, // 0.00% Default Production Gate
    currency: 'USD',
    transactionType: 'LIVE_TIP',
    chargeType: 'DESTINATION_CHARGE',
    state: 'active',
    effectiveStart: '2026-08-25T00:00:00Z',
    legalDisclosureVersion: 'DISC-2026-08-25',
    termsVersion: '2026-08-25',
    refundPolicy: 'PROPORTIONAL',
    authorUid: 'super_admin_david',
    primaryReviewerUid: 'finance_admin_1',
    secondaryApproverUid: 'super_admin_david',
    reasonForChange: 'Default production 0.00% fee pending commercial release authorization.',
    createdAt: '2026-08-25T00:00:00Z',
    updatedAt: '2026-08-25T00:00:00Z',
  },
];
