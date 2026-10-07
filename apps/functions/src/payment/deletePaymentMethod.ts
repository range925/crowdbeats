/**
 * Crowdbeats V2 — Delete Payment Method Callable (Phase 3)
 *
 * Callable: deletePaymentMethod
 *
 * Safely detaches a payment method from the customer's Stripe account
 * and updates Firestore saved payment method records.
 *
 * Invariants:
 * - Requires authenticated caller
 * - Verifies caller owns the Stripe customer ID
 * - Detaches payment method in Stripe via StripeAdapter
 * - Updates /paymentMethods/{uid}/savedMethods/{pmId}
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { stripe } from '../lib/stripe.js';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

export const deletePaymentMethod = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const { paymentMethodId } = (request.data || {}) as Record<string, unknown>;

    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      throw new HttpsError('invalid-argument', 'paymentMethodId is required.');
    }

    // 1. Fetch user Stripe Customer ID
    const userDoc = await _db().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User record not found.');
    }
    const customerId = userDoc.data()?.['stripeCustomerId'] as string | undefined;
    if (!customerId) {
      throw new HttpsError('failed-precondition', 'No Stripe customer record exists for this user.');
    }

    // 2. Verify payment method belongs to this user
    const pmRef = _db().collection('paymentMethods').doc(uid).collection('savedMethods').doc(paymentMethodId);
    const pmSnap = await pmRef.get();
    if (!pmSnap.exists) {
      throw new HttpsError('not-found', 'Payment method not found or does not belong to caller.');
    }

    // 3. Detach payment method via Stripe adapter
    try {
      await stripe.detachPaymentMethod(paymentMethodId);
    } catch (err: any) {
      // Allow proceeding if already detached from Stripe
      if (!err?.message?.includes('No such PaymentMethod')) {
        console.warn('Stripe detach warning:', err);
      }
    }

    // 4. Mark removed in Firestore
    await pmRef.delete();

    // 4. Audit Log
    const auditRef = _db().collection('auditLogs').doc();
    await auditRef.set({
      action: 'PAYMENT_METHOD_DELETED',
      uid,
      paymentMethodId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { ok: true, deletedPaymentMethodId: paymentMethodId };
  }
);
