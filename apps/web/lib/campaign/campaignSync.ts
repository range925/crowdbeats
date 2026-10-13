/**
 * Crowdbeats V2 — Campaign & Supporter Synchronization Client SDK & Hooks (Phase 14)
 *
 * Provides typed callable function wrappers and reactive hooks for:
 * - Story-to-Launch campaign operations
 * - Payment-confirmed contribution processing with Stripe
 * - Reward fulfillment status tracking
 * - Admin campaign moderation & reporting
 */

import { useState, useEffect, useCallback } from 'react';
import { callCallableFunction } from '@/lib/firebase/functions';
import type {
  CreateContributionIntentRequest,
  CreateContributionIntentResponse,
  RefundContributionRequest,
  RefundContributionResponse,
  ReviewCampaignRequest,
  ReviewCampaignResponse,
  UpdateRewardFulfillmentRequest,
  UpdateRewardFulfillmentResponse,
  GetAdminCampaignsRequest,
  GetAdminCampaignsResponse,
  GetCampaignContributorsRequest,
  GetCampaignContributorsResponse,
  AdminCampaignOverview,
  CampaignContributionDetail,
  RewardFulfillmentStatus,
} from '@crowdbeats/contracts';

// ── 1. Direct Callable Wrappers ──────────────────────────────────────────────

export async function createContributionIntentApi(
  data: CreateContributionIntentRequest,
): Promise<CreateContributionIntentResponse> {
  return callCallableFunction<CreateContributionIntentRequest, CreateContributionIntentResponse>(
    'createContributionIntent',
    data,
  );
}

export async function refundContributionApi(
  data: RefundContributionRequest,
): Promise<RefundContributionResponse> {
  return callCallableFunction<RefundContributionRequest, RefundContributionResponse>(
    'refundContribution',
    data,
  );
}

export async function reviewCampaignApi(
  data: ReviewCampaignRequest,
): Promise<ReviewCampaignResponse> {
  return callCallableFunction<ReviewCampaignRequest, ReviewCampaignResponse>(
    'reviewCampaign',
    data,
  );
}

export async function updateRewardFulfillmentApi(
  data: UpdateRewardFulfillmentRequest,
): Promise<UpdateRewardFulfillmentResponse> {
  return callCallableFunction<UpdateRewardFulfillmentRequest, UpdateRewardFulfillmentResponse>(
    'updateRewardFulfillment',
    data,
  );
}

export async function getAdminCampaignsApi(
  data: GetAdminCampaignsRequest,
): Promise<GetAdminCampaignsResponse> {
  return callCallableFunction<GetAdminCampaignsRequest, GetAdminCampaignsResponse>(
    'getAdminCampaigns',
    data,
  );
}

export async function getCampaignContributorsApi(
  data: GetCampaignContributorsRequest,
): Promise<GetCampaignContributorsResponse> {
  return callCallableFunction<GetCampaignContributorsRequest, GetCampaignContributorsResponse>(
    'getCampaignContributors',
    data,
  );
}

// ── 2. React Hooks ───────────────────────────────────────────────────────────

export function useAdminCampaigns(status?: string, searchQuery?: string) {
  const [campaigns, setCampaigns] = useState<AdminCampaignOverview[]>([]);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalPledgedCents: 0,
    pendingReviewCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCampaignsApi({ status, searchQuery });
      setCampaigns(res.campaigns);
      setStats(res.stats);
    } catch (err: any) {
      console.error('Error fetching admin campaigns:', err);
      setError(err?.message || 'Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }, [status, searchQuery]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { campaigns, stats, loading, error, refresh };
}

export function useCampaignContributors(campaignId: string | null) {
  const [contributions, setContributions] = useState<CampaignContributionDetail[]>([]);
  const [totalPledgedCents, setTotalPledgedCents] = useState(0);
  const [backerCount, setBackerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!campaignId) {
      setContributions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getCampaignContributorsApi({ campaignId });
      setContributions(res.contributions);
      setTotalPledgedCents(res.totalPledgedCents);
      setBackerCount(res.backerCount);
    } catch (err: any) {
      console.error('Error fetching campaign contributors:', err);
      setError(err?.message || 'Failed to load contributors.');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { contributions, totalPledgedCents, backerCount, loading, error, refresh };
}
