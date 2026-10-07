/**
 * Crowdbeats V2 — Payout Hold & Financial Isolation Contracts (Phase 9)
 *
 * Defines reason codes, schemas, and response types for platform financial holds
 * and Stripe Connect payout isolation.
 */

export const PayoutHoldReasonCode = {
  PAYOUT_HOLD_FRAUD: 'PAYOUT_HOLD_FRAUD',
  PAYOUT_HOLD_CHARGEBACK: 'PAYOUT_HOLD_CHARGEBACK',
  PAYOUT_HOLD_DMCA: 'PAYOUT_HOLD_DMCA',
  PAYOUT_HOLD_SANCTIONS: 'PAYOUT_HOLD_SANCTIONS',
  PAYOUT_HOLD_MANUAL: 'PAYOUT_HOLD_MANUAL',
  PAYOUT_HOLD_STRIKE: 'PAYOUT_HOLD_STRIKE',
} as const;

export type PayoutHoldReasonCode =
  (typeof PayoutHoldReasonCode)[keyof typeof PayoutHoldReasonCode];

export interface PayoutHoldRecord {
  readonly holdId: string;
  readonly creatorId: string;
  readonly creatorType: 'artist' | 'band';
  readonly reasonCode: PayoutHoldReasonCode;
  readonly notes?: string;
  readonly appliedByUid: string;
  readonly appliedAt: string;
  readonly status: 'ACTIVE' | 'RELEASED';
  readonly releasedByUid?: string;
  readonly releasedAt?: string;
  readonly releaseNotes?: string;
}

export interface ApplyPayoutHoldRequest {
  readonly creatorId: string;
  readonly creatorType?: 'artist' | 'band';
  readonly reasonCode: PayoutHoldReasonCode;
  readonly notes?: string;
}

export interface ReleasePayoutHoldRequest {
  readonly holdId: string;
  readonly notes?: string;
}

export interface PayoutHoldStatusResponse {
  readonly creatorId: string;
  readonly isHeld: boolean;
  readonly activeHolds: readonly PayoutHoldRecord[];
  readonly primaryReasonCode?: PayoutHoldReasonCode;
  readonly totalActiveHolds: number;
}
