/**
 * Crowdbeats V2 — createCampaign (Phase 7)
 *
 * Callable: createCampaign
 *
 * Creates a campaign document in `draft` state.
 * All financial transitions are server-authoritative; clients cannot
 * set status, pledgedCents, backerCount, or stripeProductId.
 *
 * Auth: artist or band_member only
 * Returns: { campaignId }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';

if (admin.apps.length === 0) admin.initializeApp();

const ALLOWED_TYPES = new Set(['artist', 'band_member']);
const MIN_GOAL_CENTS = 1_000;      // $10
const MAX_GOAL_CENTS = 1_000_000;  // $10,000
const MAX_TITLE_LEN = 120;
const MAX_DESC_LEN = 5_000;

function _db() {
  return admin.firestore();
}

function _isFuture(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string') return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime()) && d.getTime() > Date.now();
}

export const createCampaign = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;

    // ── Check persona ─────────────────────────────────────────────────────────
    const userSnap = await _db().collection('users').doc(uid).get();
    const personaType = userSnap.data()?.['personaType'] as string | undefined;
    if (!personaType || !ALLOWED_TYPES.has(personaType)) {
      throw new HttpsError('permission-denied', 'Only artists and band members can create campaigns.');
    }

    // ── Validate inputs ───────────────────────────────────────────────────────
    const title = (data['title'] as string | undefined ?? '').trim();
    if (!title || title.length > MAX_TITLE_LEN) {
      throw new HttpsError('invalid-argument', `title required (max ${MAX_TITLE_LEN} chars).`);
    }

    const description = (data['description'] as string | undefined ?? '').trim();
    if (description.length > MAX_DESC_LEN) {
      throw new HttpsError('invalid-argument', `description max ${MAX_DESC_LEN} chars.`);
    }

    const goalCents = data['goalCents'] as unknown;
    if (typeof goalCents !== 'number' || !Number.isInteger(goalCents)) {
      throw new HttpsError('invalid-argument', 'goalCents must be an integer.');
    }
    if (goalCents < MIN_GOAL_CENTS || goalCents > MAX_GOAL_CENTS) {
      throw new HttpsError('invalid-argument', `goalCents must be between ${MIN_GOAL_CENTS} and ${MAX_GOAL_CENTS}.`);
    }

    const currency = (data['currency'] as string | undefined ?? 'USD').toUpperCase();
    if (!['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(currency)) {
      throw new HttpsError('invalid-argument', 'Invalid currency.');
    }

    const deadline = data['deadline'] as string | undefined;
    if (!deadline || !_isFuture(deadline)) {
      throw new HttpsError('invalid-argument', 'deadline must be a future ISO 8601 date string.');
    }

    // ── Create campaign doc ───────────────────────────────────────────────────
    const campaignId = uuidv4();
    const now = admin.firestore.FieldValue.serverTimestamp();

    await _db().collection('campaigns').doc(campaignId).set({
      campaignId,
      creatorId: uid,
      title,
      description,
      goalCents,
      pledgedCents: 0,
      backerCount: 0,
      currency,
      status: 'draft',
      deadline: new Date(deadline).toISOString(),
      rewardTiers: [],
      mediaUrls: [],
      stripeProductId: null,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    });

    return { campaignId };
  },
);
