/**
 * Crowdbeats V2 — Sponsor CRM Client Library & React Hooks (Phase 13)
 *
 * Provides typed callable function wrappers and reactive hooks for:
 * - Sponsor shortlists
 * - Sponsor opportunities & applications
 * - Dual-signed sponsorship contracts & deliverable tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { callCallableFunction } from '@/lib/firebase/functions';
import type {
  SponsorShortlistItem,
  SponsorOpportunity,
  SponsorApplication,
  SponsorshipDeal,
  SponsorshipDealStatus,
  SponsorshipDeliverable,
  AddToSponsorShortlistRequest,
  AddToSponsorShortlistResponse,
  RemoveFromSponsorShortlistRequest,
  RemoveFromSponsorShortlistResponse,
  GetSponsorShortlistResponse,
  CreateSponsorOpportunityRequest,
  CreateSponsorOpportunityResponse,
  GetSponsorOpportunitiesResponse,
  SubmitSponsorshipApplicationRequest,
  SubmitSponsorshipApplicationResponse,
  ReviewSponsorshipApplicationRequest,
  ReviewSponsorshipApplicationResponse,
  GetSponsorApplicationsResponse,
  ProposeSponsorshipDealRequest,
  ProposeSponsorshipDealResponse,
  SignSponsorshipContractRequest,
  SignSponsorshipContractResponse,
  UpdateSponsorshipDeliverableRequest,
  UpdateSponsorshipDeliverableResponse,
  GetSponsorshipDealsResponse,
  GetSponsorshipDealDetailsResponse,
} from '@crowdbeats/contracts';

// ── 1. Direct Callable Wrappers ──────────────────────────────────────────────

export async function addToShortlistApi(data: AddToSponsorShortlistRequest): Promise<SponsorShortlistItem> {
  const res = await callCallableFunction<AddToSponsorShortlistRequest, AddToSponsorShortlistResponse>(
    'addToSponsorShortlist',
    data
  );
  return res.item;
}

export async function removeFromShortlistApi(orgId: string, recipientId: string): Promise<string> {
  const res = await callCallableFunction<RemoveFromSponsorShortlistRequest, RemoveFromSponsorShortlistResponse>(
    'removeFromSponsorShortlist',
    { orgId, recipientId }
  );
  return res.removedId;
}

export async function getShortlistApi(orgId: string): Promise<SponsorShortlistItem[]> {
  const res = await callCallableFunction<{ orgId: string }, GetSponsorShortlistResponse>(
    'getSponsorShortlist',
    { orgId }
  );
  return res.items || [];
}

export async function createOpportunityApi(data: CreateSponsorOpportunityRequest): Promise<SponsorOpportunity> {
  const res = await callCallableFunction<CreateSponsorOpportunityRequest, CreateSponsorOpportunityResponse>(
    'createSponsorOpportunity',
    data
  );
  return res.opportunity;
}

export async function getOpportunitiesApi(orgId?: string, status?: 'open' | 'closed' | 'filled'): Promise<SponsorOpportunity[]> {
  const res = await callCallableFunction<{ orgId?: string; status?: string }, GetSponsorOpportunitiesResponse>(
    'getSponsorOpportunities',
    { orgId, status }
  );
  return res.opportunities || [];
}

export async function submitApplicationApi(data: SubmitSponsorshipApplicationRequest): Promise<SponsorApplication> {
  const res = await callCallableFunction<SubmitSponsorshipApplicationRequest, SubmitSponsorshipApplicationResponse>(
    'submitSponsorshipApplication',
    data
  );
  return res.application;
}

export async function reviewApplicationApi(data: ReviewSponsorshipApplicationRequest): Promise<{ status: string; sponsorshipId?: string }> {
  const res = await callCallableFunction<ReviewSponsorshipApplicationRequest, ReviewSponsorshipApplicationResponse>(
    'reviewSponsorshipApplication',
    data
  );
  return { status: res.status, sponsorshipId: res.sponsorshipId };
}

export async function getApplicationsApi(params: { orgId?: string; applicantId?: string; status?: string }): Promise<SponsorApplication[]> {
  const res = await callCallableFunction<typeof params, GetSponsorApplicationsResponse>(
    'getSponsorApplications',
    params
  );
  return res.applications || [];
}

export async function proposeDealApi(data: ProposeSponsorshipDealRequest): Promise<SponsorshipDeal> {
  const res = await callCallableFunction<ProposeSponsorshipDealRequest, ProposeSponsorshipDealResponse>(
    'proposeSponsorshipDeal',
    data
  );
  return res.deal;
}

export async function signContractApi(data: SignSponsorshipContractRequest): Promise<SignSponsorshipContractResponse> {
  return callCallableFunction<SignSponsorshipContractRequest, SignSponsorshipContractResponse>(
    'signSponsorshipContract',
    data
  );
}

export async function updateDeliverableApi(data: UpdateSponsorshipDeliverableRequest): Promise<UpdateSponsorshipDeliverableResponse> {
  return callCallableFunction<UpdateSponsorshipDeliverableRequest, UpdateSponsorshipDeliverableResponse>(
    'updateSponsorshipDeliverable',
    data
  );
}

export async function getDealsApi(params: { orgId?: string; recipientId?: string; status?: SponsorshipDealStatus }): Promise<SponsorshipDeal[]> {
  const res = await callCallableFunction<typeof params, GetSponsorshipDealsResponse>(
    'getSponsorshipDeals',
    params
  );
  return res.deals || [];
}

export async function getDealDetailsApi(sponsorshipId: string): Promise<SponsorshipDeal> {
  const res = await callCallableFunction<{ sponsorshipId: string }, GetSponsorshipDealDetailsResponse>(
    'getSponsorshipDealDetails',
    { sponsorshipId }
  );
  return res.deal;
}

// ── 2. React Hooks ───────────────────────────────────────────────────────────

export function useSponsorShortlist(orgId?: string) {
  const [items, setItems] = useState<SponsorShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShortlist = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getShortlistApi(orgId);
      setItems(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load shortlist');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchShortlist();
  }, [fetchShortlist]);

  const add = async (item: Omit<AddToSponsorShortlistRequest, 'orgId'>) => {
    if (!orgId) return;
    const added = await addToShortlistApi({ ...item, orgId });
    setItems((prev) => [added, ...prev.filter((p) => p.recipientId !== added.recipientId)]);
    return added;
  };

  const remove = async (recipientId: string) => {
    if (!orgId) return;
    await removeFromShortlistApi(orgId, recipientId);
    setItems((prev) => prev.filter((p) => p.recipientId !== recipientId));
  };

  return { items, loading, error, refresh: fetchShortlist, add, remove };
}

export function useSponsorOpportunities(orgId?: string) {
  const [opportunities, setOpportunities] = useState<SponsorOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOpportunitiesApi(orgId);
      setOpportunities(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const create = async (params: Omit<CreateSponsorOpportunityRequest, 'orgId'>) => {
    if (!orgId) return;
    const opp = await createOpportunityApi({ ...params, orgId });
    setOpportunities((prev) => [opp, ...prev]);
    return opp;
  };

  return { opportunities, loading, error, refresh: fetchOpportunities, create };
}

export function useSponsorApplications(params: { orgId?: string; applicantId?: string }) {
  const [applications, setApplications] = useState<SponsorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!params.orgId && !params.applicantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getApplicationsApi(params);
      setApplications(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [params.orgId, params.applicantId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const submit = async (app: SubmitSponsorshipApplicationRequest) => {
    const created = await submitApplicationApi(app);
    setApplications((prev) => [created, ...prev]);
    return created;
  };

  const review = async (applicationId: string, action: 'ACCEPT' | 'DECLINE' | 'UNDER_REVIEW', reviewerNotes?: string) => {
    const res = await reviewApplicationApi({ applicationId, action, reviewerNotes });
    setApplications((prev) =>
      prev.map((a) => (a.applicationId === applicationId ? { ...a, status: res.status as any, reviewerNotes } : a))
    );
    return res;
  };

  return { applications, loading, error, refresh: fetchApplications, submit, review };
}

export function useSponsorshipDeals(params: { orgId?: string; recipientId?: string }) {
  const [deals, setDeals] = useState<SponsorshipDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    if (!params.orgId && !params.recipientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getDealsApi(params);
      setDeals(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  }, [params.orgId, params.recipientId]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const propose = async (dealData: ProposeSponsorshipDealRequest) => {
    const deal = await proposeDealApi(dealData);
    setDeals((prev) => [deal, ...prev]);
    return deal;
  };

  const sign = async (sponsorshipId: string, signatureFullName: string, agreeToTerms: boolean) => {
    const res = await signContractApi({ sponsorshipId, signatureFullName, agreeToTerms });
    setDeals((prev) =>
      prev.map((d) => (d.sponsorshipId === sponsorshipId ? { ...d, status: res.status, escrowAllocatedCents: res.escrowAllocatedCents } : d))
    );
    return res;
  };

  const updateDeliverable = async (sponsorshipId: string, deliverableId: string, action: 'SUBMIT_PROOF' | 'APPROVE' | 'REJECT', proofUrl?: string, notes?: string) => {
    const res = await updateDeliverableApi({ sponsorshipId, deliverableId, action, proofUrl, notes });
    setDeals((prev) =>
      prev.map((d) => {
        if (d.sponsorshipId !== sponsorshipId) return d;
        const newDels = d.deliverables.map((del) => (del.deliverableId === deliverableId ? res.deliverable : del));
        return { ...d, deliverables: newDels, status: res.dealStatus };
      })
    );
    return res;
  };

  return { deals, loading, error, refresh: fetchDeals, propose, sign, updateDeliverable };
}
