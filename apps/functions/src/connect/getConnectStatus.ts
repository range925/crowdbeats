/**
 * Crowdbeats V2 — getConnectStatus (Phase 1 Compliance)
 *
 * Callable: getConnectStatus
 *
 * Returns the current Stripe Connect account status and verification state for the creator.
 *
 * Compliance Invariants:
 * - Returns only safe Stripe identifiers and capability states.
 * - Sourced directly from Stripe (financial system of record).
 * - Identifies requirements_due, disabled_reason, and payout readiness.
 *
 * Auth: any signed-in user (returns their own account status)
 * Returns: StripeConnectAccountStatus
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { stripe } from '../lib/stripe.js';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

export const getConnectStatus = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;

    const userSnap = await _db().collection('users').doc(uid).get();
    if (!userSnap.exists) {
      return {
        accountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        disabledReason: null,
        requirementsDue: [],
        eventuallyDue: [],
        pastDue: [],
        capabilities: { cardPayments: 'inactive', transfers: 'inactive' },
        bankPayoutReadiness: 'not_created',
        creatorVerificationState: 'unverified',
        requiresAction: true,
        actionType: 'create_account',
      };
    }

    const userData = userSnap.data()!;
    const accountId = userData['stripeConnectAccountId'] as string | undefined;

    if (!accountId) {
      return {
        accountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        disabledReason: null,
        requirementsDue: [],
        eventuallyDue: [],
        pastDue: [],
        capabilities: { cardPayments: 'inactive', transfers: 'inactive' },
        bankPayoutReadiness: 'not_created',
        creatorVerificationState: 'unverified',
        requiresAction: true,
        actionType: 'create_account',
      };
    }

    // Retrieve live status from Stripe (financial system of record)
    const status = await stripe.getConnectAccountStatus(accountId);

    // Update cached status in Firestore
    const now = admin.firestore.FieldValue.serverTimestamp();
    const connectStatus = status.chargesEnabled && status.payoutsEnabled ? 'active' : 'pending';

    await _db().collection('users').doc(uid).update({
      connectStatus,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      bankPayoutReadiness: status.bankPayoutReadiness,
      creatorVerificationState: status.creatorVerificationState,
      requirementsDue: status.requirementsDue,
      updatedAt: now,
    });

    return status;
  },
);
