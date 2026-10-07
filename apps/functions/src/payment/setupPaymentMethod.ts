/**
 * Crowdbeats V2 — createSetupIntent Cloud Function (Phase 6)
 * Callable: createSetupIntent
 * Creates a Stripe SetupIntent for saving a card via PaymentSheet.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { stripe } from '../lib/stripe.js';

const _db = () => admin.firestore();

export const createSetupIntent = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;

    // Create or get Stripe Customer
    const userDoc = await _db().collection('users').doc(uid).get();
    const userEmail = userDoc.data()?.['email'] as string ?? `${uid}@crowdbeats.app`;
    let stripeCustomerId: string = userDoc.data()?.['stripeCustomerId'] as string ?? '';

    if (!stripeCustomerId) {
      const customer = await stripe.createOrGetCustomer(uid, userEmail);
      stripeCustomerId = customer.id;
      await _db().collection('users').doc(uid).update({ stripeCustomerId });
    }

    const si = await stripe.createSetupIntent(stripeCustomerId);
    return { setupIntentClientSecret: si.client_secret };
  },
);
