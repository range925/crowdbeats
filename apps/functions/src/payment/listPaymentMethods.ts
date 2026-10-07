/**
 * Crowdbeats V2 — listPaymentMethods Cloud Function (Phase 6)
 * Callable: listPaymentMethods
 * Returns safe payment method metadata only (no PAN, no CVV).
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { stripe } from '../lib/stripe.js';

const _db = () => admin.firestore();

export const listPaymentMethods = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const userDoc = await _db().collection('users').doc(uid).get();
    const stripeCustomerId = userDoc.data()?.['stripeCustomerId'] as string | undefined;

    if (!stripeCustomerId) {
      return { methods: [] };
    }

    const methods = await stripe.listPaymentMethods(stripeCustomerId);
    return { methods };
  },
);
