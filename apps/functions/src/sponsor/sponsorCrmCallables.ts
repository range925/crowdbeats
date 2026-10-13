/**
 * Crowdbeats V2 — Sponsor Relationship Management Callables (Phase 13)
 *
 * Exposes onCall Cloud Functions for:
 * - Sponsor shortlists
 * - Sponsor opportunities & applications
 * - Dual-signed sponsorship contracts & deliverable tracking
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { SponsorCrmService } from './sponsorCrmService';
import type {
  AddToSponsorShortlistRequest,
  AddToSponsorShortlistResponse,
  RemoveFromSponsorShortlistRequest,
  RemoveFromSponsorShortlistResponse,
  GetSponsorShortlistRequest,
  GetSponsorShortlistResponse,
  CreateSponsorOpportunityRequest,
  CreateSponsorOpportunityResponse,
  GetSponsorOpportunitiesRequest,
  GetSponsorOpportunitiesResponse,
  SubmitSponsorshipApplicationRequest,
  SubmitSponsorshipApplicationResponse,
  ReviewSponsorshipApplicationRequest,
  ReviewSponsorshipApplicationResponse,
  GetSponsorApplicationsRequest,
  GetSponsorApplicationsResponse,
  ProposeSponsorshipDealRequest,
  ProposeSponsorshipDealResponse,
  SignSponsorshipContractRequest,
  SignSponsorshipContractResponse,
  UpdateSponsorshipDeliverableRequest,
  UpdateSponsorshipDeliverableResponse,
  GetSponsorshipDealsRequest,
  GetSponsorshipDealsResponse,
  GetSponsorshipDealDetailsRequest,
  GetSponsorshipDealDetailsResponse,
} from '@crowdbeats/contracts';

const service = new SponsorCrmService();

// ── 1. Shortlist ─────────────────────────────────────────────────────────────

export const addToSponsorShortlist = onCall(
  { region: 'us-central1' },
  async (request): Promise<AddToSponsorShortlistResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const data = request.data as AddToSponsorShortlistRequest;
    if (!data.orgId || !data.recipientId || !data.recipientType || !data.recipientName) {
      throw new HttpsError('invalid-argument', 'orgId, recipientId, recipientType, and recipientName are required.');
    }

    const item = await service.addToShortlist(data.orgId, request.auth.uid, {
      recipientId: data.recipientId,
      recipientType: data.recipientType,
      recipientName: data.recipientName,
      genre: data.genre,
      city: data.city,
      followerCohort: data.followerCohort,
      engagementRating: data.engagementRating,
      avgGigTipCents: data.avgGigTipCents,
      notes: data.notes,
      tags: data.tags,
    });

    return { success: true, item };
  }
);

export const removeFromSponsorShortlist = onCall(
  { region: 'us-central1' },
  async (request): Promise<RemoveFromSponsorShortlistResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const data = request.data as RemoveFromSponsorShortlistRequest;
    if (!data.orgId || !data.recipientId) {
      throw new HttpsError('invalid-argument', 'orgId and recipientId are required.');
    }

    const removedId = await service.removeFromShortlist(data.orgId, request.auth.uid, data.recipientId);
    return { success: true, removedId };
  }
);

export const getSponsorShortlist = onCall(
  { region: 'us-central1' },
  async (request): Promise<GetSponsorShortlistResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const data = request.data as GetSponsorShortlistRequest;
    if (!data.orgId) {
      throw new HttpsError('invalid-argument', 'orgId is required.');
    }

    const items = await service.getShortlist(data.orgId, request.auth.uid);
    return { items };
  }
);

// ── 2. Opportunities & Applications ──────────────────────────────────────────

export const createSponsorOpportunity = onCall(
  { region: 'us-central1' },
  async (request): Promise<CreateSponsorOpportunityResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const data = request.data as CreateSponsorOpportunityRequest;
    if (!data.orgId || !data.title || !data.description || typeof data.budgetPerPerformerCents !== 'number') {
      throw new HttpsError('invalid-argument', 'Valid orgId, title, description, and budgetPerPerformerCents are required.');
    }

    const opportunity = await service.createOpportunity(data.orgId, request.auth.uid, data);
    return { success: true, opportunity };
  }
);

export const getSponsorOpportunities = onCall(
  { region: 'us-central1' },
  async (request): Promise<GetSponsorOpportunitiesResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const data = (request.data || {}) as GetSponsorOpportunitiesRequest;
    const opportunities = await service.getOpportunities(data.orgId, data.status);
    return { opportunities };
  }
);

export const submitSponsorshipApplication = onCall(
  { region: 'us-central1' },
  async (request): Promise<SubmitSponsorshipApplicationResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const data = request.data as SubmitSponsorshipApplicationRequest;
    if (!data.orgId || !data.applicantId || !data.applicantType || !data.pitch || typeof data.requestedAmountCents !== 'number') {
      throw new HttpsError('invalid-argument', 'Missing required application fields.');
    }

    const application = await service.submitApplication(request.auth.uid, data);
    return { success: true, application };
  }
);

export const reviewSponsorshipApplication = onCall(
  { region: 'us-central1' },
  async (request): Promise<ReviewSponsorshipApplicationResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const data = request.data as ReviewSponsorshipApplicationRequest;
    if (!data.applicationId || !data.action) {
      throw new HttpsError('invalid-argument', 'applicationId and action are required.');
    }

    const res = await service.reviewApplication(request.auth.uid, data);
    return { success: true, status: res.status, sponsorshipId: res.sponsorshipId };
  }
);

export const getSponsorApplications = onCall(
  { region: 'us-central1' },
  async (request): Promise<GetSponsorApplicationsResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const data = (request.data || {}) as GetSponsorApplicationsRequest;
    const applications = await service.getApplications(request.auth.uid, data);
    return { applications };
  }
);

// ── 3. Deals & Contracts ─────────────────────────────────────────────────────

export const proposeSponsorshipDeal = onCall(
  { region: 'us-central1' },
  async (request): Promise<ProposeSponsorshipDealResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const data = request.data as ProposeSponsorshipDealRequest;
    if (!data.orgId || !data.recipientId || !data.recipientType || !data.title || typeof data.valueAmountCents !== 'number') {
      throw new HttpsError('invalid-argument', 'Missing required deal parameters.');
    }

    const deal = await service.proposeDeal(request.auth.uid, data);
    return { success: true, deal };
  }
);

export const signSponsorshipContract = onCall(
  { region: 'us-central1' },
  async (request): Promise<SignSponsorshipContractResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const data = request.data as SignSponsorshipContractRequest;
    if (!data.sponsorshipId || !data.signatureFullName || !data.agreeToTerms) {
      throw new HttpsError('invalid-argument', 'sponsorshipId, signatureFullName, and agreeToTerms are required.');
    }

    const result = await service.signContract(request.auth.uid, data);
    return { success: true, ...result };
  }
);

export const updateSponsorshipDeliverable = onCall(
  { region: 'us-central1' },
  async (request): Promise<UpdateSponsorshipDeliverableResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const data = request.data as UpdateSponsorshipDeliverableRequest;
    if (!data.sponsorshipId || !data.deliverableId || !data.action) {
      throw new HttpsError('invalid-argument', 'sponsorshipId, deliverableId, and action are required.');
    }

    const result = await service.updateDeliverable(request.auth.uid, data);
    return { success: true, deliverable: result.deliverable, dealStatus: result.dealStatus };
  }
);

export const getSponsorshipDeals = onCall(
  { region: 'us-central1' },
  async (request): Promise<GetSponsorshipDealsResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const data = (request.data || {}) as GetSponsorshipDealsRequest;
    const deals = await service.getDeals(request.auth.uid, data);
    return { deals };
  }
);

export const getSponsorshipDealDetails = onCall(
  { region: 'us-central1' },
  async (request): Promise<GetSponsorshipDealDetailsResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const data = request.data as GetSponsorshipDealDetailsRequest;
    if (!data.sponsorshipId) {
      throw new HttpsError('invalid-argument', 'sponsorshipId is required.');
    }

    const deal = await service.getDealDetails(request.auth.uid, data.sponsorshipId);
    return { deal };
  }
);
