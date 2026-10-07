/**
 * Crowdbeats V2 — Creator Monetization Eligibility Contracts (Phase 3)
 *
 * Defines the server-enforced monetization state machine and validation results.
 *
 * Invariants:
 * - A creator cannot receive monetized payments merely because the UI renders a tip button.
 * - Backend evaluation is fail-closed across all financial flows.
 */

export const CreatorMonetizationStatus = {
  NOT_ELIGIBLE: 'NOT_ELIGIBLE',
  PENDING_PROFILE: 'PENDING_PROFILE',
  PENDING_IDENTITY: 'PENDING_IDENTITY',
  PENDING_POLICY_ACCEPTANCE: 'PENDING_POLICY_ACCEPTANCE',
  PENDING_STRIPE: 'PENDING_STRIPE',
  PENDING_MODERATION: 'PENDING_MODERATION',
  ACTIVE: 'ACTIVE',
  LIMITED: 'LIMITED',
  DEMONETIZED: 'DEMONETIZED',
  PAYOUT_HOLD: 'PAYOUT_HOLD',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
} as const;

export type CreatorMonetizationStatus =
  (typeof CreatorMonetizationStatus)[keyof typeof CreatorMonetizationStatus];

export interface MonetizationEligibilityChecklist {
  readonly activeAccount: boolean;
  readonly supportedRole: boolean;
  readonly acceptedTerms: boolean;
  readonly acceptedAup: boolean;
  readonly acceptedMonetizationPolicy: boolean;
  readonly stripeConnectedAccountExists: boolean;
  readonly stripeChargesEnabled: boolean;
  readonly notSuspended: boolean;
  readonly notDemonetized: boolean;
  readonly noComplianceHold: boolean;
  readonly profileApproved: boolean;
}

export interface MonetizationEligibilityResult {
  readonly isEligible: boolean;
  readonly status: CreatorMonetizationStatus;
  readonly creatorId: string;
  readonly creatorType: 'artist' | 'band';
  readonly reasonCodes: readonly string[];
  readonly checklist: MonetizationEligibilityChecklist;
  readonly evaluatedAt: string;
}

export interface CheckMonetizationEligibilityRequest {
  readonly creatorId?: string;
  readonly creatorType?: 'artist' | 'band';
}
