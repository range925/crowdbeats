/**
 * Crowdbeats V2 — Stripe Connect Contracts (Phase 1)
 *
 * Provides typed definitions for Stripe Connect onboarding, account capabilities,
 * requirements tracking, and safe identifier management.
 *
 * INVARIANTS:
 * - Store only safe identifiers: stripeCustomerId, stripeConnectAccountId,
 *   paymentIntentId, chargeId, transferId, payoutId, refundId.
 * - NEVER store raw PAN, CVV, raw bank account numbers, or Stripe secret keys in Firestore.
 * - Stripe remains the financial system of record.
 */

import type { IsoTimestamp } from '../common/timestamp';

export type BankPayoutReadiness =
  | 'ready'
  | 'pending_verification'
  | 'action_required'
  | 'restricted'
  | 'not_created';

export type CreatorVerificationState =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'restricted'
  | 'rejected';

export type AccountCapabilityStatus = 'active' | 'inactive' | 'pending';

export interface StripeAccountCapabilities {
  readonly cardPayments: AccountCapabilityStatus;
  readonly transfers: AccountCapabilityStatus;
}

export interface StripeConnectAccountStatus {
  readonly accountId: string | null;
  readonly chargesEnabled: boolean;
  readonly payoutsEnabled: boolean;
  readonly detailsSubmitted: boolean;
  readonly disabledReason: string | null;
  readonly requirementsDue: readonly string[];
  readonly eventuallyDue: readonly string[];
  readonly pastDue: readonly string[];
  readonly capabilities: StripeAccountCapabilities;
  readonly bankPayoutReadiness: BankPayoutReadiness;
  readonly creatorVerificationState: CreatorVerificationState;
  readonly requiresAction: boolean;
  readonly actionType: 'create_account' | 'complete_kyc' | 'update_information' | null;
}

export interface CreateConnectLinkRequest {
  readonly creatorSlug?: string;
  readonly creatorType?: 'artist' | 'band';
  readonly refreshUrl?: string;
  readonly returnUrl?: string;
}

export interface CreateConnectLinkResponse {
  readonly accountId: string;
  readonly accountLinkUrl: string;
  readonly bankPayoutReadiness: BankPayoutReadiness;
  readonly creatorVerificationState: CreatorVerificationState;
}

export interface SafeStripeIdentifiers {
  readonly stripeCustomerId?: string;
  readonly stripeConnectAccountId?: string;
  readonly lastPaymentIntentId?: string;
  readonly lastTransferId?: string;
  readonly lastPayoutId?: string;
  readonly lastRefundId?: string;
  readonly lastChargeId?: string;
}

export interface ConnectAccountAuditRecord {
  readonly uid: string;
  readonly stripeConnectAccountId: string;
  readonly eventType: 'account_created' | 'link_generated' | 'status_synced' | 'capabilities_updated';
  readonly chargesEnabled: boolean;
  readonly payoutsEnabled: boolean;
  readonly requirementsDue: readonly string[];
  readonly timestamp: IsoTimestamp;
}
