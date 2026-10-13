/**
 * Crowdbeats V2 — Campaign and Supporter Synchronization Callables (Phase 14)
 *
 * Exposes server-authoritative callables:
 * - createContributionIntent
 * - refundContribution
 * - reviewCampaign
 * - updateRewardFulfillment
 * - getAdminCampaigns
 * - getCampaignContributors
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { campaignSyncService } from './campaignSyncService';
import type {
  CreateContributionIntentRequest,
  RefundContributionRequest,
  ReviewCampaignRequest,
  UpdateRewardFulfillmentRequest,
  GetAdminCampaignsRequest,
  GetCampaignContributorsRequest,
} from '@crowdbeats/contracts';

function requireAuth(request: any): string {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  return request.auth.uid;
}

function getCallerRoles(request: any): string[] {
  const token = request.auth?.token;
  if (!token) return [];
  if (Array.isArray(token.roles)) return token.roles;
  if (token.role) return [token.role];
  if (token.platformRole) return [token.platformRole];
  return [];
}

export const createContributionIntent = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    const uid = requireAuth(request);
    return campaignSyncService.createContributionIntent(
      uid,
      request.data as CreateContributionIntentRequest,
    );
  },
);

export const refundContribution = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    const uid = requireAuth(request);
    const roles = getCallerRoles(request);
    return campaignSyncService.refundContribution(
      uid,
      roles,
      request.data as RefundContributionRequest,
    );
  },
);

export const reviewCampaign = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    const uid = requireAuth(request);
    const roles = getCallerRoles(request);
    return campaignSyncService.reviewCampaign(
      uid,
      roles,
      request.data as ReviewCampaignRequest,
    );
  },
);

export const updateRewardFulfillment = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    const uid = requireAuth(request);
    const roles = getCallerRoles(request);
    return campaignSyncService.updateRewardFulfillment(
      uid,
      roles,
      request.data as UpdateRewardFulfillmentRequest,
    );
  },
);

export const getAdminCampaigns = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    const uid = requireAuth(request);
    const roles = getCallerRoles(request);
    return campaignSyncService.getAdminCampaigns(
      uid,
      roles,
      request.data as GetAdminCampaignsRequest,
    );
  },
);

export const getCampaignContributors = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    const uid = requireAuth(request);
    const roles = getCallerRoles(request);
    return campaignSyncService.getCampaignContributors(
      uid,
      roles,
      request.data as GetCampaignContributorsRequest,
    );
  },
);
