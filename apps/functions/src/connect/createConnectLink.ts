/**
 * Crowdbeats V2 — createConnectLink (Phase 1 Compliance)
 *
 * Callable: createConnectLink
 *
 * Creates or retrieves a Stripe Connect Express account for the creator (solo artist or band)
 * and returns a one-time onboarding account link URL.
 *
 * Compliance Invariants:
 * - Supplies canonical creator profile URL (https://crowdbeats.ai/artist/{slug} or /band/{slug})
 *   to Stripe's business profile during account creation.
 * - Stores ONLY safe Stripe identifiers (stripeConnectAccountId, chargesEnabled, payoutsEnabled,
 *   requirementsDue, bankPayoutReadiness, creatorVerificationState).
 * - NEVER stores raw bank numbers, PAN, or Stripe secret keys in Firestore.
 * - Writes immutable audit records.
 *
 * Auth: artist or band_member persona
 * Returns: { accountLinkUrl, accountId, bankPayoutReadiness, creatorVerificationState }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';
import { stripe } from '../lib/stripe.js';

if (admin.apps.length === 0) admin.initializeApp();

const DEFAULT_RETURN_URL = 'https://crowdbeats.ai/creator/payouts?connect=return';
const DEFAULT_REFRESH_URL = 'https://crowdbeats.ai/creator/payouts?connect=refresh';

const ALLOWED_TYPES = new Set(['artist', 'band_member', 'band']);

function _db() {
  return admin.firestore();
}

export const createConnectLink = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = (request.data || {}) as Record<string, unknown>;

    // ── Check persona ─────────────────────────────────────────────────────────
    const userSnap = await _db().collection('users').doc(uid).get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User profile not found.');
    }
    const userData = userSnap.data()!;
    const personaType = userData['personaType'] as string | undefined;
    if (!personaType || !ALLOWED_TYPES.has(personaType)) {
      throw new HttpsError('permission-denied', 'Only artists and band members can connect a payout account.');
    }

    const email = (userData['email'] as string | undefined) ?? `${uid}@crowdbeats.app`;
    const creatorType = (data['creatorType'] as string | undefined) || (personaType === 'band_member' ? 'band' : 'artist');
    const creatorSlug = (data['creatorSlug'] as string | undefined) || userData['creatorSlug'] || uid;
    const canonicalProfileUrl = creatorType === 'band'
      ? `https://crowdbeats.ai/band/${creatorSlug}`
      : `https://crowdbeats.ai/artist/${creatorSlug}`;

    const refreshUrl = (data['refreshUrl'] as string | undefined) || DEFAULT_REFRESH_URL;
    const returnUrl = (data['returnUrl'] as string | undefined) || DEFAULT_RETURN_URL;

    // ── Get or create Connect account ─────────────────────────────────────────
    let accountId = userData['stripeConnectAccountId'] as string | undefined;
    let isNewAccount = false;

    if (!accountId) {
      const account = await stripe.createConnectAccount(uid, email, {
        businessProfileUrl: canonicalProfileUrl,
        creatorType,
      });
      accountId = account.id;
      isNewAccount = true;
    }

    // ── Retrieve live account status ──────────────────────────────────────────
    const status = await stripe.getConnectAccountStatus(accountId);

    // ── Update cached safe status in Firestore ────────────────────────────────
    const now = admin.firestore.FieldValue.serverTimestamp();
    const updatePayload: Record<string, unknown> = {
      stripeConnectAccountId: accountId,
      connectStatus: status.chargesEnabled && status.payoutsEnabled ? 'active' : 'pending',
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      bankPayoutReadiness: status.bankPayoutReadiness,
      creatorVerificationState: status.creatorVerificationState,
      requirementsDue: status.requirementsDue,
      canonicalProfileUrl,
      updatedAt: now,
    };

    await _db().collection('users').doc(uid).update(updatePayload);

    // Mirror safe fields on artist profile if applicable
    if (personaType === 'artist') {
      const artistRef = _db().collection('artistProfiles').doc(uid);
      const artistSnap = await artistRef.get();
      if (artistSnap.exists) {
        await artistRef.update({
          stripeAccountId: accountId,
          bankLinked: status.payoutsEnabled,
          bankPayoutReadiness: status.bankPayoutReadiness,
          creatorVerificationState: status.creatorVerificationState,
          updatedAt: now,
        });
      }
    }

    // ── Generate account link (always fresh — short TTL) ─────────────────────
    const accountLinkUrl = await stripe.createConnectAccountLink(
      accountId,
      refreshUrl,
      returnUrl,
    );

    // ── Audit Log ─────────────────────────────────────────────────────────────
    await _db().collection('auditEvents').doc(uuidv4()).set({
      eventId: uuidv4(),
      action: isNewAccount ? 'CONNECT_ACCOUNT_CREATED' : 'CONNECT_ACCOUNT_LINK_GENERATED',
      actorUid: uid,
      actorType: 'user',
      targetId: accountId,
      targetType: 'stripe_connect_account',
      metadata: {
        chargesEnabled: status.chargesEnabled,
        payoutsEnabled: status.payoutsEnabled,
        bankPayoutReadiness: status.bankPayoutReadiness,
        creatorVerificationState: status.creatorVerificationState,
        canonicalProfileUrl,
      },
      correlationId: `connect_${uid}_${Date.now()}`,
      createdAt: now,
    });

    return {
      accountId,
      accountLinkUrl,
      bankPayoutReadiness: status.bankPayoutReadiness,
      creatorVerificationState: status.creatorVerificationState,
    };
  },
);
