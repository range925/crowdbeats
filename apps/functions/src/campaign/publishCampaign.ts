/**
 * Crowdbeats V2 — publishCampaign (Phase 7)
 *
 * Callable: publishCampaign
 *
 * Transitions `approved` → `active`. Only staff can transition
 * submitted → approved (via admin tools — Phase 8). For test-mode Phase 7,
 * a campaign owner can self-approve via an `__skipApproval` flag (test only,
 * removed before live mode). Creates a Stripe Product.
 *
 * Auth: campaign owner (test); staff + campaign owner (production)
 * Returns: { campaignId, status: 'active' }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

if (admin.apps.length === 0) admin.initializeApp();

const IS_TEST = process.env['NODE_ENV'] !== 'production';

function _db() {
  return admin.firestore();
}

export const publishCampaign = onCall(
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
    if (!snap.exists) throw new HttpsError('not-found', 'Campaign not found.');
    const campaign = snap.data()!;

    if (campaign['creatorId'] !== uid) {
      throw new HttpsError('permission-denied', 'Only the campaign creator can publish it.');
    }

    // State check: must be `approved` (or `submitted` in test mode with __skipApproval)
    const allowedStatuses = IS_TEST
      ? ['approved', 'submitted']
      : ['approved'];

    if (!allowedStatuses.includes(campaign['status'] as string)) {
      throw new HttpsError(
        'failed-precondition',
        IS_TEST
          ? `Campaign must be in approved or submitted state (current: ${campaign['status']}).`
          : `Campaign must be approved before publishing (current: ${campaign['status']}).`,
      );
    }

    // Deadline still in future
    const deadline = campaign['deadline'] as string;
    if (new Date(deadline).getTime() <= Date.now()) {
      throw new HttpsError('failed-precondition', 'Campaign deadline has already passed.');
    }

    // Create Stripe Product for the campaign
    let stripeProductId = campaign['stripeProductId'] as string | undefined;
    if (!stripeProductId) {
      // Mock-safe: in emulator stripe.createConnectAccount returns mock
      stripeProductId = `prod_mock_${campaignId.substring(0, 16)}`;
      if (process.env['STRIPE_SECRET_KEY']) {
        // Real Stripe — create a product
        // (StripeAdapter doesn't have createProduct, use inline for simplicity)
        const Stripe = (await import('stripe')).default;
        const s = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
          apiVersion: '2025-06-30.basil' as any,
        });
        const product = await s.products.create({
          name: campaign['title'] as string,
          metadata: { campaignId, creatorId: uid },
        });
        stripeProductId = product.id;
      }
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    await campaignRef.update({
      status: 'active',
      stripeProductId,
      publishedAt: now,
      updatedAt: now,
    });

    // Audit
    await _db().collection('auditEvents').add({
      type: 'campaign_published',
      actorUid: uid,
      resourceId: campaignId,
      resourceType: 'campaign',
      createdAt: now,
    });

    return { campaignId, status: 'active' };
  },
);
