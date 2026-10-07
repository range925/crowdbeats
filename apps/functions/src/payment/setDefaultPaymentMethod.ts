/**
 * Crowdbeats V2 — setDefaultPaymentMethod Cloud Function (Phase 6)
 * Callable: setDefaultPaymentMethod
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { stripe } from '../lib/stripe.js';

const _db = () => admin.firestore();

export const setDefaultPaymentMethod = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;
    const pmId = data['pmId'];

    if (typeof pmId !== 'string' || pmId.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'pmId is required.');
    }

    const userDoc = await _db().collection('users').doc(uid).get();
    const stripeCustomerId = userDoc.data()?.['stripeCustomerId'] as string | undefined;
    if (!stripeCustomerId) {
      throw new HttpsError('not-found', 'No Stripe customer for this user.');
    }

    await stripe.setDefaultPaymentMethod(stripeCustomerId, pmId as string);

    // Update Firestore savedMethods subcollection
    const savedRef = _db()
      .collection('paymentMethods')
      .doc(uid)
      .collection('savedMethods');

    const batch = _db().batch();
    const existing = await savedRef.get();
    existing.docs.forEach((doc) => {
      batch.update(doc.ref, { isDefault: doc.id === pmId, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    });

    // Upsert the target PM as default if not already in Firestore
    const pmRef = savedRef.doc(pmId as string);
    batch.set(pmRef, { id: pmId, isDefault: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    await batch.commit();
    return { ok: true };
  },
);
