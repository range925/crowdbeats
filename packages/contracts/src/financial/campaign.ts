/**
 * Crowdbeats V2 — Campaign, Reward, and Contribution Contracts (Phase 7)
 *
 * Collection paths:
 * - /campaigns/{campaignId}
 * - /campaigns/{campaignId}/updates/{updateId}
 * - /campaigns/{campaignId}/contributions/{contributionId}
 * - /payouts/{payoutId}
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { ISO4217CurrencyCode } from '../common/money';

export const CampaignStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',  // Phase 7: awaiting moderation
  APPROVED: 'approved',    // Phase 7: approved, not yet published
  ACTIVE: 'active',
  COMPLETED: 'completed',  // Phase 7: goal met and closed
  REJECTED: 'rejected',    // Phase 11/13: rejected during moderation
  FLAGGED: 'flagged',      // Phase 11/13: flagged for Trust & Safety review
  FUNDED: 'funded',        // Legacy alias
  ENDED: 'ended',
  CANCELLED: 'cancelled',
} as const;

export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

/** Inline reward tier stored as JSON array on the campaign document. */
export interface RewardTier {
  readonly tierId: string;
  readonly title: string;
  readonly description: string;
  readonly amountCents: number;
  readonly quantityAvailable?: number; // null = unlimited
  readonly quantityClaimed: number; // SERVER_ONLY
}

export interface Campaign {
  readonly campaignId: string;
  readonly creatorId: string;
  readonly title: string;
  readonly description: string;
  readonly goalCents: number;            // Phase 7 field name
  readonly pledgedCents: number;         // Phase 7: server-maintained
  readonly backerCount: number;          // Phase 7: server-maintained
  readonly currency: ISO4217CurrencyCode;
  readonly status: CampaignStatus;
  readonly deadline: IsoTimestamp;       // Phase 7 field name
  readonly rewardTiers: RewardTier[];    // Phase 7: inline tiers
  readonly mediaUrls: string[];
  readonly stripeProductId: string | null; // SERVER_ONLY
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  // Legacy Phase 3 fields for backwards compat
  readonly goalAmountCents?: number;
  readonly raisedAmountCents?: number;
  readonly contributionCount?: number;
  readonly creatorType?: 'artist' | 'band';
  readonly v?: number;
}

/** Post-launch update posted by creator. */
export interface CampaignUpdate {
  readonly updateId: string;
  readonly campaignId: string;
  readonly creatorId: string;
  readonly body: string;           // sanitized, no HTML
  readonly createdAt: IsoTimestamp;
}

/** Fan contribution (pledge, held or captured). */
export interface CampaignContribution {
  readonly contributionId: string;
  readonly campaignId: string;
  readonly fanUid: string;
  readonly amountCents: number;
  readonly currency: ISO4217CurrencyCode;
  readonly tierId?: string;
  readonly stripePaymentIntentId: string; // SERVER_ONLY
  readonly status: 'held' | 'captured' | 'released';
  readonly isAnonymous: boolean;
  readonly idempotencyKey: string;
  readonly createdAt: IsoTimestamp;
}

// ── Connect (Phase 7) ──────────────────────────────────────────────────────────

export interface ConnectStatus {
  readonly accountId?: string;
  readonly chargesEnabled: boolean;
  readonly payoutsEnabled: boolean;
  readonly requiresAction: boolean;
  readonly actionType?: 'create_account' | 'complete_kyc';
}

export interface ConnectLinkResponse {
  readonly accountId: string;
  readonly accountLinkUrl: string;
}

// ── Payout (Phase 7) ───────────────────────────────────────────────────────────

export interface CampaignPayout {
  readonly payoutId: string;
  readonly recipientId: string;
  readonly amountCents: number;
  readonly currency: ISO4217CurrencyCode;
  readonly stripeTransferId?: string; // SERVER_ONLY
  readonly stripePayoutId?: string;   // SERVER_ONLY
  readonly createdAt: IsoTimestamp;
  readonly completedAt?: IsoTimestamp;
  readonly errorMessage?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const CAMPAIGN_TITLE_MAX = 120 as const;
export const CAMPAIGN_DESCRIPTION_MAX = 5000 as const;
export const CAMPAIGN_DESCRIPTION_MIN = 50 as const;
export const CAMPAIGN_GOAL_MIN_CENTS = 1000 as const;     // $10
export const CAMPAIGN_GOAL_MAX_CENTS = 1_000_000 as const; // $10,000
export const CAMPAIGN_CONTRIBUTION_MIN_CENTS = 100 as const;
export const CAMPAIGN_REWARD_MIN_CENTS = 100 as const;     // $1
