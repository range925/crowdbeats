/**
 * Crowdbeats V2 — postCampaignUpdate (Phase 7)
 *
 * Callable: postCampaignUpdate
 *
 * Adds a public update post to `campaigns/{id}/updates/{updateId}`.
 * Allowed on campaigns in any state except `cancelled`.
 * Writing helpers are neutral transformations only (no AI completion).
 *
 * Auth: campaign owner only
 * Returns: { updateId }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';

if (admin.apps.length === 0) admin.initializeApp();

const MAX_BODY_LEN = 10_000;
const BLOCKED_STATES = new Set(['cancelled']);

function _db() {
  return admin.firestore();
}

/** Neutral transformation: trim + normalise whitespace. No AI. */
function _sanitizeBody(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')  // strip HTML tags
    .replace(/\s{3,}/g, '\n\n')  // collapse excessive blank lines
    .trim();
}

export const postCampaignUpdate = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;
    const campaignId = data['campaignId'] as string | undefined;
    const bodyRaw = data['body'] as string | undefined;

    if (!campaignId) throw new HttpsError('invalid-argument', 'campaignId is required.');
    if (!bodyRaw || bodyRaw.trim().length === 0) throw new HttpsError('invalid-argument', 'body is required.');

    const body = _sanitizeBody(bodyRaw);
    if (body.length > MAX_BODY_LEN) {
      throw new HttpsError('invalid-argument', `Update body max ${MAX_BODY_LEN} characters.`);
    }

    const campaignRef = _db().collection('campaigns').doc(campaignId);
    const snap = await campaignRef.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Campaign not found.');
    const campaign = snap.data()!;

    if (campaign['creatorId'] !== uid) {
      throw new HttpsError('permission-denied', 'Only the campaign creator can post updates.');
    }
    if (BLOCKED_STATES.has(campaign['status'] as string)) {
      throw new HttpsError('failed-precondition', 'Cannot post updates on a cancelled campaign.');
    }

    const updateId = uuidv4();
    const now = admin.firestore.FieldValue.serverTimestamp();

    await campaignRef.collection('updates').doc(updateId).set({
      updateId,
      campaignId,
      creatorId: uid,
      body,
      notified: false,
      createdAt: now,
    });

    // Touch parent updatedAt so list queries re-sort
    await campaignRef.update({ updatedAt: now });

    return { updateId };
  },
);
