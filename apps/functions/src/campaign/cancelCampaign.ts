/**
 * Crowdbeats V2 — cancelCampaign (Phase 7)
 *
 * Callable: cancelCampaign
 *
 * Cancels a campaign in `draft`, `submitted`, `approved`, or `active` state.
 * For active campaigns: cancels all held (not yet captured) Stripe PaymentIntents,
 * transitions all contributions from `held` → `released`,
 * transitions campaign to `cancelled`.
 *
 * Auth: campaign owner only
 * Returns: { campaignId, status: 'cancelled', releasedCount }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { stripe } from '../lib/stripe.js';

if (admin.apps.length === 0) admin.initializeApp();

const CANCELLABLE_STATES = new Set(['draft', 'submitted', 'approved', 'active']);

function _db() {
  return admin.firestore();
}

export const cancelCampaign = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;
    const campaignId = data['campaignId'] as string | undefined;
    const reason = (data['reason'] as string | undefined ?? '').trim();

    if (!campaignId) {
      throw new HttpsError('invalid-argument', 'campaignId is required.');
    }

    const campaignRef = _db().collection('campaigns').doc(campaignId);
    const snap = await campaignRef.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Campaign not found.');
    const campaign = snap.data()!;

    if (campaign['creatorId'] !== uid) {
      throw new HttpsError('permission-denied', 'Only the campaign creator can cancel it.');
    }
    if (!CANCELLABLE_STATES.has(campaign['status'] as string)) {
      throw new HttpsError('failed-precondition', `Campaign in status ${campaign['status']} cannot be cancelled.`);
    }

    // ── Release all held contributions ────────────────────────────────────────
    let releasedCount = 0;
    const contribSnaps = await _db()
      .collection('campaigns')
      .doc(campaignId)
      .collection('contributions')
      .where('status', '==', 'held')
      .get();

    const batch = _db().batch();
    for (const doc of contribSnaps.docs) {
      const contrib = doc.data();
      try {
        await stripe.cancelPaymentIntent(contrib['stripePaymentIntentId'] as string);
      } catch (e) {
        // Log but don't fail the whole operation
        console.error(`Failed to cancel PI ${contrib['stripePaymentIntentId']}: ${e}`);
      }
      batch.update(doc.ref, { status: 'released', releasedAt: admin.firestore.FieldValue.serverTimestamp() });
      releasedCount++;
    }
    batch.update(campaignRef, {
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelReason: reason || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await batch.commit();

    // Audit
    await _db().collection('auditEvents').add({
      type: 'campaign_cancelled',
      actorUid: uid,
      resourceId: campaignId,
      resourceType: 'campaign',
      reason: reason || null,
      releasedCount,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { campaignId, status: 'cancelled', releasedCount };
  },
);
