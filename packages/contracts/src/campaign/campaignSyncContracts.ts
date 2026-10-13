/**
 * Crowdbeats V2 — Campaign and Supporter Synchronization Contracts (Phase 14)
 *
 * Defines contracts for:
 * - Story-to-Launch campaign lifecycle (draft -> submitted -> approved/rejected -> active -> funded/completed -> cancelled)
 * - Payment-confirmed contribution processing with Stripe payment intents and webhooks
 * - Reward tier tracking and fulfillment lifecycle
 * - Post-launch campaign updates and backer communications
 * - Contribution refunds and ledger reconciliation
 * - Creator Studio, Band CRM, and Admin CRM synchronization
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { ISO4217CurrencyCode } from '../common/money';
import type { CampaignStatus } from '../financial/campaign';

// ── Reward Tier Fulfillment ──────────────────────────────────────────────────

export const RewardFulfillmentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  DIGITAL_DELIVERED: 'digital_delivered',
  CANCELLED: 'cancelled',
} as const;

export type RewardFulfillmentStatus =
  (typeof RewardFulfillmentStatus)[keyof typeof RewardFulfillmentStatus];

// ── Extended Contribution Detail ─────────────────────────────────────────────

export interface CampaignContributionDetail {
  readonly contributionId: string;
  readonly campaignId: string;
  readonly fanUid: string;
  readonly amountCents: number;
  readonly currency: ISO4217CurrencyCode;
  readonly tierId?: string;
  readonly stripePaymentIntentId: string;
  readonly status: 'pending' | 'held' | 'captured' | 'released' | 'refunded' | 'failed';
  readonly isAnonymous: boolean;
  readonly message?: string;
  readonly idempotencyKey: string;
  readonly createdAt: IsoTimestamp;
  readonly processedAt?: IsoTimestamp;
  readonly refundedAt?: IsoTimestamp;
  readonly refundAmountCents?: number;
  // Denormalized/populated fields for UI consumption
  readonly backerName?: string;
  readonly backerAvatarUrl?: string;
  readonly campaignTitle?: string;
  readonly rewardTierTitle?: string;
  readonly fulfillmentStatus?: RewardFulfillmentStatus;
  readonly trackingNumber?: string;
  readonly carrier?: string;
  readonly notes?: string;
}

// ── Campaign Progress & Admin Reporting ──────────────────────────────────────

export interface CampaignGoalProgress {
  readonly campaignId: string;
  readonly title: string;
  readonly goalCents: number;
  readonly pledgedCents: number;
  readonly backerCount: number;
  readonly percentFunded: number;
  readonly daysRemaining: number;
  readonly isGoalMet: boolean;
  readonly status: CampaignStatus;
}

export interface AdminCampaignOverview {
  readonly campaignId: string;
  readonly title: string;
  readonly creatorId: string;
  readonly creatorName: string;
  readonly creatorType: 'artist' | 'band';
  readonly creatorVerified: boolean;
  readonly goalCents: number;
  readonly pledgedCents: number;
  readonly backerCount: number;
  readonly status: CampaignStatus;
  readonly submittedAt?: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
  readonly deadline: IsoTimestamp;
  readonly flagsCount: number;
  readonly rewardTiersCount: number;
  readonly fulfillmentSummary: {
    readonly totalClaimed: number;
    readonly pendingCount: number;
    readonly deliveredCount: number;
  };
}

// ── Callable Envelopes ───────────────────────────────────────────────────────

/**
 * createContributionIntent — Initiates a payment-confirmed pledge to an active campaign.
 */
export interface CreateContributionIntentRequest {
  readonly campaignId: string;
  readonly amountCents: number;
  readonly tierId?: string;
  readonly isAnonymous?: boolean;
  readonly message?: string;
  readonly idempotencyKey?: string;
}

export interface CreateContributionIntentResponse {
  readonly clientSecret: string;
  readonly contributionId: string;
  readonly stripePaymentIntentId: string;
  readonly amountCents: number;
  readonly currency: string;
}

/**
 * reviewCampaign — Admin / staff review action for submitted or flagged campaigns.
 */
export interface ReviewCampaignRequest {
  readonly campaignId: string;
  readonly decision: 'approve' | 'reject' | 'flag';
  readonly notes?: string;
  readonly rejectionReason?: string;
}

export interface ReviewCampaignResponse {
  readonly campaignId: string;
  readonly status: CampaignStatus;
  readonly reviewedAt: IsoTimestamp;
}

/**
 * updateRewardFulfillment — Creator or Band Admin updates reward fulfillment status.
 */
export interface UpdateRewardFulfillmentRequest {
  readonly campaignId: string;
  readonly contributionId: string;
  readonly fulfillmentStatus: RewardFulfillmentStatus;
  readonly trackingNumber?: string;
  readonly carrier?: string;
  readonly notes?: string;
}

export interface UpdateRewardFulfillmentResponse {
  readonly success: boolean;
  readonly contributionId: string;
  readonly fulfillmentStatus: RewardFulfillmentStatus;
  readonly updatedAt: IsoTimestamp;
}

/**
 * refundContribution — Admin or Creator initiates a contribution refund.
 */
export interface RefundContributionRequest {
  readonly campaignId: string;
  readonly contributionId: string;
  readonly reason?: string;
}

export interface RefundContributionResponse {
  readonly success: boolean;
  readonly contributionId: string;
  readonly refundedAmountCents: number;
  readonly status: 'refunded';
  readonly refundedAt: IsoTimestamp;
}

/**
 * getAdminCampaigns — Returns aggregated campaigns and metrics for administrative CRM.
 */
export interface GetAdminCampaignsRequest {
  readonly status?: string;
  readonly limit?: number;
  readonly cursor?: string;
  readonly searchQuery?: string;
}

export interface GetAdminCampaignsResponse {
  readonly campaigns: AdminCampaignOverview[];
  readonly stats: {
    readonly totalCampaigns: number;
    readonly activeCampaigns: number;
    readonly totalPledgedCents: number;
    readonly pendingReviewCount: number;
  };
  readonly nextCursor?: string;
}

/**
 * getCampaignContributors — Returns verified contributors and pledge details for a campaign.
 */
export interface GetCampaignContributorsRequest {
  readonly campaignId: string;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface GetCampaignContributorsResponse {
  readonly contributions: CampaignContributionDetail[];
  readonly totalPledgedCents: number;
  readonly backerCount: number;
  readonly nextCursor?: string;
}
