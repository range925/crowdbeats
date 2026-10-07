/**
 * Crowdbeats V2 — submitCampaign (Phase 7)
 *
 * Callable: submitCampaign
 *
 * Transitions a campaign from `draft` → `submitted` for moderator review.
 * Validates that the campaign is complete: title, description, goal, deadline,
 * at least one reward tier with a valid amount.
 *
 * Auth: campaign owner only
 * Returns: { campaignId, status: 'submitted' }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

export const submitCampaign = onCall(
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

    // ── Ownership ──────────────────────────────────────────────────────────────
    if (campaign['creatorId'] !== uid) {
      throw new HttpsError('permission-denied', 'Only the campaign creator can submit it.');
    }

    // ── State check ────────────────────────────────────────────────────────────
    if (campaign['status'] !== 'draft') {
      throw new HttpsError('failed-precondition', `Campaign is already ${campaign['status']}.`);
    }

    // ── Completeness validation ────────────────────────────────────────────────
    const errors: string[] = [];
    if (!campaign['title'] || (campaign['title'] as string).trim().length === 0) {
      errors.push('Title is required.');
    }
    if (!campaign['description'] || (campaign['description'] as string).trim().length < 50) {
      errors.push('Description must be at least 50 characters.');
    }
    if (!campaign['goalCents'] || (campaign['goalCents'] as number) < 1000) {
      errors.push('Goal must be at least $10.');
    }
    const deadline = campaign['deadline'] as string | undefined;
    if (!deadline || new Date(deadline).getTime() <= Date.now()) {
      errors.push('Deadline must be in the future.');
    }
    const tiers = campaign['rewardTiers'] as unknown[];
    if (!Array.isArray(tiers) || tiers.length === 0) {
      errors.push('At least one reward tier is required.');
    } else {
      const invalidTier = (tiers as Record<string, unknown>[]).some(
        (t) => typeof t['amountCents'] !== 'number' || (t['amountCents'] as number) < 100,
      );
      if (invalidTier) errors.push('All reward tiers must have an amount of at least $1.');
    }

    if (errors.length > 0) {
      throw new HttpsError('invalid-argument', errors.join(' '));
    }

    // ── Transition ─────────────────────────────────────────────────────────────
    await campaignRef.update({
      status: 'submitted',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ── Audit event ───────────────────────────────────────────────────────────
    await _db().collection('auditEvents').add({
      type: 'campaign_submitted',
      actorUid: uid,
      resourceId: campaignId,
      resourceType: 'campaign',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { campaignId, status: 'submitted' };
  },
);
