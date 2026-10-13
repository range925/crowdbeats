/**
 * Crowdbeats V2 — Band CRM & Member Management Contracts (Phase 12)
 *
 * Defines the schemas, band supporter segmentation, band tip analytics,
 * shared band activity feed, and callable contracts for Band Studio CRM.
 */

import { IsoTimestamp } from '../common/timestamp.js';
import { SupporterSegment, CreatorSupporterEngagementEvent } from '../creator/creatorCrmContracts.js';

// ─── Band Supporter Summary ──────────────────────────────────────────────────

export interface BandSupporterSummary {
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

// ─── Band Tip Analytics ───────────────────────────────────────────────────────

export interface BandTipAnalytics {
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

// ─── Band Supporter Details & Dossier ─────────────────────────────────────────

export interface BandSupporterDetails {
  readonly supporter: BandSupporterSummary;
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

// ─── Band Shared Activity Event ───────────────────────────────────────────────

export type BandActivityEventType =
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'
  | 'ROLE_UPDATED'
  | 'OWNERSHIP_TRANSFERRED'
  | 'SPLIT_UPDATED'
  | 'INVITATION_SENT'
  | 'TIP_RECEIVED'
  | 'CAMPAIGN_LAUNCHED'
  | 'GIG_CHECKIN';

export interface BandActivityEvent {
  readonly eventId: string;
  readonly bandId: string;
  readonly type: BandActivityEventType;
  readonly title: string;
  readonly description: string;
  readonly actorUid?: string;
  readonly actorName?: string;
  readonly amountCents?: number;
  readonly timestamp: IsoTimestamp;
  readonly metadata?: Record<string, unknown>;
}

// ─── Callables Contracts ──────────────────────────────────────────────────────

export interface GetBandSupportersRequest {
  readonly bandId: string;
  readonly segmentFilter?: 'all' | 'repeat' | 'top' | 'followers' | 'campaign';
  readonly searchQuery?: string;
  readonly limit?: number;
}

export interface GetBandSupportersResponse {
  readonly ok: boolean;
  readonly bandId: string;
  readonly bandName: string;
  readonly supporters: BandSupporterSummary[];
  readonly totalCount: number;
  readonly analytics: BandTipAnalytics;
}

export interface GetBandSupporterDetailsRequest {
  readonly bandId: string;
  readonly supporterId: string;
}

export interface GetBandSupporterDetailsResponse {
  readonly ok: boolean;
  readonly bandId: string;
  readonly details: BandSupporterDetails;
}

export interface SendBandThankYouNoteRequest {
  readonly bandId: string;
  readonly supporterId: string;
  readonly message: string;
}

export interface SendBandThankYouNoteResponse {
  readonly ok: boolean;
  readonly conversationId: string;
  readonly messageId: string;
  readonly sentAt: IsoTimestamp;
}

export interface GetBandActivityRequest {
  readonly bandId: string;
  readonly filter?: 'All' | 'Band Tips' | 'Splits' | 'Gigs' | 'Roster';
  readonly limit?: number;
}

export interface GetBandActivityResponse {
  readonly ok: boolean;
  readonly bandId: string;
  readonly activities: BandActivityEvent[];
}
