/**
 * Crowdbeats V2 — updateCampaign (Phase 7)
 *
 * Callable: updateCampaign
 *
 * Updates mutable draft-only fields. Once a campaign is submitted/active,
 * only `postCampaignUpdate` is allowed for content.
 *
 * Auth: campaign owner only, campaign in draft state only
 * Returns: { campaignId }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

const MAX_TIER_COUNT = 10;

interface RewardTier {
  tierId: string;
  title: string;
  description: string;
  amountCents: number;
  quantity?: number;
}

export const updateCampaign = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;
    const campaignId = data['campaignId'] as string | undefined;

    if (!campaignId) {
      throw new HttpsError('invalid-argument', 'campaignId is required.');
    }

    const campaignRef = _db().collection('campaigns').doc(campaignId);
    const snap = await campaignRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Campaign not found.');
    }
    const campaign = snap.data()!;

    if (campaign['creatorId'] !== uid) {
      throw new HttpsError('permission-denied', 'Only the campaign creator can update it.');
    }
    if (campaign['status'] !== 'draft') {
      throw new HttpsError('failed-precondition', 'Only draft campaigns can be edited. Use postCampaignUpdate to post an update on an active campaign.');
    }

    // ── Build update patch (only whitelisted fields) ──────────────────────────
    const patch: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (typeof data['title'] === 'string') {
      const t = (data['title'] as string).trim();
      if (t.length === 0 || t.length > 120) throw new HttpsError('invalid-argument', 'title must be 1-120 chars.');
      patch['title'] = t;
    }
    if (typeof data['description'] === 'string') {
      const d = (data['description'] as string).trim();
      if (d.length > 5000) throw new HttpsError('invalid-argument', 'description max 5000 chars.');
      patch['description'] = d;
    }
    if (typeof data['goalCents'] === 'number') {
      if (data['goalCents'] < 1000 || data['goalCents'] > 1_000_000) {
        throw new HttpsError('invalid-argument', 'goalCents must be $10–$10,000.');
      }
      patch['goalCents'] = data['goalCents'];
    }
    if (typeof data['deadline'] === 'string') {
      const d = new Date(data['deadline'] as string);
      if (isNaN(d.getTime()) || d.getTime() <= Date.now()) {
        throw new HttpsError('invalid-argument', 'deadline must be a future date.');
      }
      patch['deadline'] = d.toISOString();
    }
    if (Array.isArray(data['rewardTiers'])) {
      const tiers = data['rewardTiers'] as RewardTier[];
      if (tiers.length > MAX_TIER_COUNT) {
        throw new HttpsError('invalid-argument', `Maximum ${MAX_TIER_COUNT} reward tiers.`);
      }
      for (const tier of tiers) {
        if (!tier.tierId || !tier.title || typeof tier.amountCents !== 'number' || tier.amountCents < 100) {
          throw new HttpsError('invalid-argument', 'Each tier needs tierId, title, and amountCents ≥ 100.');
        }
      }
      patch['rewardTiers'] = tiers;
    }
    if (Array.isArray(data['mediaUrls'])) {
      patch['mediaUrls'] = (data['mediaUrls'] as string[]).slice(0, 10);
    }

    await campaignRef.update(patch);
    return { campaignId };
  },
);
