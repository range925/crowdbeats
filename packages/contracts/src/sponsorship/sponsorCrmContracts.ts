/**
 * Crowdbeats V2 — Sponsor Relationship Management Contracts (Phase 13)
 *
 * Types, enums, interfaces, and callable request/response envelopes
 * for sponsor discovery, shortlists, opportunities, applications,
 * dual-signed sponsorship contracts, deliverables, and escrow commitments.
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { ISO4217CurrencyCode } from '../common/money';

// ── Status Enums ─────────────────────────────────────────────────────────────

export const SponsorshipDealStatus = {
  PROPOSED: 'proposed',
  NEGOTIATING: 'negotiating',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type SponsorshipDealStatus = (typeof SponsorshipDealStatus)[keyof typeof SponsorshipDealStatus];

export const SponsorApplicationStatus = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  WITHDRAWN: 'withdrawn',
} as const;
export type SponsorApplicationStatus = (typeof SponsorApplicationStatus)[keyof typeof SponsorApplicationStatus];

export const DeliverableMilestoneStatus = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
export type DeliverableMilestoneStatus = (typeof DeliverableMilestoneStatus)[keyof typeof DeliverableMilestoneStatus];

// ── Models ───────────────────────────────────────────────────────────────────

export interface SponsorshipDeliverable {
  readonly deliverableId: string;
  readonly title: string;
  readonly type: 'STAGE_SHOUTOUT' | 'BANNER_DISPLAY' | 'EPK_LOGO' | 'SOCIAL_REPOST' | 'CUSTOM';
  readonly status: DeliverableMilestoneStatus;
  readonly dueAt?: IsoTimestamp;
  readonly submittedAt?: IsoTimestamp;
  readonly approvedAt?: IsoTimestamp;
  readonly proofUrl?: string;
  readonly notes?: string;
  readonly payoutAmountCents?: number;
}

export interface SponsorshipDeal {
  readonly sponsorshipId: string;
  readonly orgId: string;
  readonly sponsorName: string;
  readonly sponsorLogoUrl?: string;
  readonly recipientId: string; // artistId or bandId
  readonly recipientType: 'artist' | 'band';
  readonly recipientName: string;
  readonly status: SponsorshipDealStatus;
  readonly title: string;
  readonly description?: string;
  readonly valueAmountCents: number;
  readonly currency: ISO4217CurrencyCode;
  readonly deliverables: SponsorshipDeliverable[];
  readonly startsAt?: IsoTimestamp;
  readonly endsAt?: IsoTimestamp;
  readonly signedByOrgAt?: IsoTimestamp;
  readonly signedByOrgUid?: string;
  readonly signedByOrgName?: string;
  readonly signedByArtistAt?: IsoTimestamp;
  readonly signedByArtistUid?: string;
  readonly signedByArtistName?: string;
  readonly escrowAllocatedCents: number;
  readonly escrowReleasedCents: number;
  readonly conversationId?: string;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly v: number;
}

export interface SponsorApplication {
  readonly applicationId: string;
  readonly opportunityId?: string;
  readonly orgId: string;
  readonly sponsorName: string;
  readonly applicantId: string; // artistId or bandId
  readonly applicantType: 'artist' | 'band';
  readonly applicantName: string;
  readonly pitch: string;
  readonly requestedAmountCents: number;
  readonly mediaLinks?: string[];
  readonly status: SponsorApplicationStatus;
  readonly reviewerNotes?: string; // Private to sponsor team & staff
  readonly sponsorshipId?: string; // Generated if accepted
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface SponsorShortlistItem {
  readonly recipientId: string;
  readonly recipientType: 'artist' | 'band';
  readonly recipientName: string;
  readonly genre?: string;
  readonly city?: string;
  readonly followerCohort?: string;
  readonly engagementRating?: string;
  readonly avgGigTipCents?: number;
  readonly notes?: string;
  readonly tags?: string[];
  readonly addedAt: IsoTimestamp;
}

export interface SponsorOpportunity {
  readonly opportunityId: string;
  readonly orgId: string;
  readonly sponsorName: string;
  readonly title: string;
  readonly description: string;
  readonly budgetPerPerformerCents: number;
  readonly totalBudgetCents: number;
  readonly targetGenre?: string;
  readonly targetRegion?: string;
  readonly targetType: 'all' | 'artist' | 'band';
  readonly status: 'open' | 'closed' | 'filled';
  readonly deadlineAt: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
}

// ── Callables Contracts ───────────────────────────────────────────────────────

// 1. Shortlist
export interface AddToSponsorShortlistRequest {
  readonly orgId: string;
  readonly recipientId: string;
  readonly recipientType: 'artist' | 'band';
  readonly recipientName: string;
  readonly genre?: string;
  readonly city?: string;
  readonly followerCohort?: string;
  readonly engagementRating?: string;
  readonly avgGigTipCents?: number;
  readonly notes?: string;
  readonly tags?: string[];
}

export interface AddToSponsorShortlistResponse {
  readonly success: boolean;
  readonly item: SponsorShortlistItem;
}

export interface RemoveFromSponsorShortlistRequest {
  readonly orgId: string;
  readonly recipientId: string;
}

export interface RemoveFromSponsorShortlistResponse {
  readonly success: boolean;
  readonly removedId: string;
}

export interface GetSponsorShortlistRequest {
  readonly orgId: string;
}

export interface GetSponsorShortlistResponse {
  readonly items: SponsorShortlistItem[];
}

// 2. Opportunities & Applications
export interface CreateSponsorOpportunityRequest {
  readonly orgId: string;
  readonly title: string;
  readonly description: string;
  readonly budgetPerPerformerCents: number;
  readonly totalBudgetCents: number;
  readonly targetGenre?: string;
  readonly targetRegion?: string;
  readonly targetType?: 'all' | 'artist' | 'band';
  readonly durationDays?: number;
}

export interface CreateSponsorOpportunityResponse {
  readonly success: boolean;
  readonly opportunity: SponsorOpportunity;
}

export interface GetSponsorOpportunitiesRequest {
  readonly orgId?: string;
  readonly status?: 'open' | 'closed' | 'filled';
}

export interface GetSponsorOpportunitiesResponse {
  readonly opportunities: SponsorOpportunity[];
}

export interface SubmitSponsorshipApplicationRequest {
  readonly orgId: string;
  readonly opportunityId?: string;
  readonly applicantId: string;
  readonly applicantType: 'artist' | 'band';
  readonly applicantName: string;
  readonly pitch: string;
  readonly requestedAmountCents: number;
  readonly mediaLinks?: string[];
}

export interface SubmitSponsorshipApplicationResponse {
  readonly success: boolean;
  readonly application: SponsorApplication;
}

export interface ReviewSponsorshipApplicationRequest {
  readonly applicationId: string;
  readonly action: 'ACCEPT' | 'DECLINE' | 'UNDER_REVIEW';
  readonly reviewerNotes?: string;
  // If accepting and creating proposal immediately:
  readonly proposalTitle?: string;
  readonly valueAmountCents?: number;
}

export interface ReviewSponsorshipApplicationResponse {
  readonly success: boolean;
  readonly status: SponsorApplicationStatus;
  readonly sponsorshipId?: string;
}

export interface GetSponsorApplicationsRequest {
  readonly orgId?: string;
  readonly applicantId?: string;
  readonly status?: SponsorApplicationStatus;
}

export interface GetSponsorApplicationsResponse {
  readonly applications: SponsorApplication[];
}

// 3. Sponsorship Deals & Contracts
export interface ProposeSponsorshipDealRequest {
  readonly orgId: string;
  readonly recipientId: string;
  readonly recipientType: 'artist' | 'band';
  readonly recipientName?: string;
  readonly title: string;
  readonly description?: string;
  readonly valueAmountCents: number;
  readonly currency?: ISO4217CurrencyCode;
  readonly deliverables?: Omit<SponsorshipDeliverable, 'status'>[];
  readonly startsAt?: IsoTimestamp;
  readonly endsAt?: IsoTimestamp;
}

export interface ProposeSponsorshipDealResponse {
  readonly success: boolean;
  readonly deal: SponsorshipDeal;
}

export interface SignSponsorshipContractRequest {
  readonly sponsorshipId: string;
  readonly signatureFullName: string;
  readonly agreeToTerms: boolean;
}

export interface SignSponsorshipContractResponse {
  readonly success: boolean;
  readonly sponsorshipId: string;
  readonly status: SponsorshipDealStatus;
  readonly signedByOrgAt?: IsoTimestamp;
  readonly signedByArtistAt?: IsoTimestamp;
  readonly escrowAllocatedCents: number;
}

export interface UpdateSponsorshipDeliverableRequest {
  readonly sponsorshipId: string;
  readonly deliverableId: string;
  readonly action: 'SUBMIT_PROOF' | 'APPROVE' | 'REJECT';
  readonly proofUrl?: string;
  readonly notes?: string;
}

export interface UpdateSponsorshipDeliverableResponse {
  readonly success: boolean;
  readonly deliverable: SponsorshipDeliverable;
  readonly dealStatus: SponsorshipDealStatus;
}

export interface GetSponsorshipDealsRequest {
  readonly orgId?: string;
  readonly recipientId?: string;
  readonly status?: SponsorshipDealStatus;
}

export interface GetSponsorshipDealsResponse {
  readonly deals: SponsorshipDeal[];
}

export interface GetSponsorshipDealDetailsRequest {
  readonly sponsorshipId: string;
}

export interface GetSponsorshipDealDetailsResponse {
  readonly deal: SponsorshipDeal;
}
