/**
 * Crowdbeats V2 — Solo Musician Creator CRM Contracts (Phase 11)
 *
 * Defines the schemas, supporter segmentation tiers, tip analytics models,
 * engagement history events, and callables contracts for Creator Studio CRM.
 */

import { IsoTimestamp } from '../common/timestamp.js';

export type SupporterSegment =
  | 'TOP_SUPPORTER'      // $50+ lifetime value
  | 'REPEAT_SUPPORTER'   // 2+ tips or campaign contributions
  | 'RECENT_SUPPORTER'   // Supported within the last 30 days
  | 'CAMPAIGN_BACKER'    // Backed a crowdfunding campaign
  | 'FOLLOWER_ONLY';     // Following artist with 0 financial contributions

export interface CreatorSupporterSummary {
  readonly supporterId: string;
  readonly displayName: string;
  readonly photoUrl: string | null;
  readonly segment: SupporterSegment;
  readonly isFollower: boolean;
  readonly followedAt: IsoTimestamp | null;
  readonly totalTipsCents: number;
  readonly tipsCount: number;
  readonly totalCampaignContributionCents: number;
  readonly campaignsCount: number;
  readonly lifetimeValueCents: number;
  readonly firstSupportedAt: IsoTimestamp | null;
  readonly lastSupportedAt: IsoTimestamp | null;
  readonly isAnonymous: boolean;
  readonly allowsDirectMessaging: boolean;
}

export interface CreatorTipAnalytics {
  readonly totalTipsReceivedCents: number;
  readonly totalTipsCount: number;
  readonly averageTipCents: number;
  readonly repeatSupporterRatePct: number;
  readonly repeatSupportersCount: number;
  readonly topSupportersCount: number;
  readonly recentTipsVolume30dCents: number;
  readonly topTippingSession: {
    readonly sessionId: string;
    readonly sessionTitle: string;
    readonly totalCents: number;
    readonly tipsCount: number;
  } | null;
}

export type EngagementEventType =
  | 'STARTED_FOLLOWING'
  | 'TIP_RECEIVED'
  | 'CAMPAIGN_BACKED'
  | 'LIVE_CHECKIN'
  | 'DIRECT_MESSAGE';

export interface CreatorSupporterEngagementEvent {
  readonly eventId: string;
  readonly type: EngagementEventType;
  readonly timestamp: IsoTimestamp;
  readonly amountCents?: number;
  readonly summary: string;
  readonly metadata?: Record<string, unknown>;
}

export interface CreatorSupporterDetails {
  readonly supporter: CreatorSupporterSummary;
  readonly engagementHistory: CreatorSupporterEngagementEvent[];
  readonly tipBreakdown: Array<{
    readonly tipId: string;
    readonly amountCents: number;
    readonly createdAt: IsoTimestamp;
    readonly message?: string;
    readonly sessionId?: string;
  }>;
  readonly campaignContributions: Array<{
    readonly contributionId: string;
    readonly campaignId: string;
    readonly campaignTitle: string;
    readonly amountCents: number;
    readonly createdAt: IsoTimestamp;
  }>;
}

// ─── Callables Contracts ──────────────────────────────────────────────────────

export interface GetCreatorSupportersRequest {
  readonly creatorId?: string; // If omitted, defaults to caller.uid
  readonly segmentFilter?: 'all' | 'repeat' | 'top' | 'followers' | 'campaign';
  readonly searchQuery?: string;
  readonly limit?: number;
}

export interface GetCreatorSupportersResponse {
  readonly ok: boolean;
  readonly creatorId: string;
  readonly supporters: CreatorSupporterSummary[];
  readonly totalCount: number;
  readonly analytics: CreatorTipAnalytics;
}

export interface GetCreatorTipAnalyticsRequest {
  readonly creatorId?: string;
}

export interface GetCreatorTipAnalyticsResponse {
  readonly ok: boolean;
  readonly creatorId: string;
  readonly analytics: CreatorTipAnalytics;
}

export interface GetCreatorSupporterDetailsRequest {
  readonly creatorId?: string;
  readonly supporterId: string;
}

export interface GetCreatorSupporterDetailsResponse {
  readonly ok: boolean;
  readonly details: CreatorSupporterDetails;
}

export interface SendCreatorThankYouNoteRequest {
  readonly creatorId?: string;
  readonly supporterId: string;
  readonly message: string;
}

export interface SendCreatorThankYouNoteResponse {
  readonly ok: boolean;
  readonly messageId: string;
  readonly conversationId: string;
  readonly deliveredAt: IsoTimestamp;
}
