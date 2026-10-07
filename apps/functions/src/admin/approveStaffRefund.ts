/**
 * Crowdbeats V2 — Approve Staff Refund Cloud Function (Phase 10)
 *
 * Callable function for Customer Support and Finance Staff refund resolution:
 * - Requires caller to have `CUSTOMER_SUPPORT`, `FINANCE_ANALYST`, or `SUPER_ADMIN`
 * - Requires typed confirmation phrase: "APPROVE REFUND"
 * - Reverses ledger balances and updates tip status to 'refunded'
 * - Writes immutable audit event `REFUND_APPROVED`
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { stripe } from '../lib/stripe.js';

export const approveStaffRefund = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const callerRole = token.platformRole;

    if (!['SUPER_ADMIN', 'FINANCE_ANALYST', 'CUSTOMER_SUPPORT'].includes(callerRole)) {
      throw new HttpsError('permission-denied', 'Only Support, Finance, or Super Admins can approve refunds.');
    }

    const { tipId, reason, confirmationPhrase } = request.data || {};

    if (!tipId || typeof tipId !== 'string') {
      throw new HttpsError('invalid-argument', 'Tip ID is required.');
    }
    if (!reason || typeof reason !== 'string') {
      throw new HttpsError('invalid-argument', 'Refund reason is required.');
    }
    if (confirmationPhrase !== 'APPROVE REFUND') {
      throw new HttpsError('invalid-argument', 'Step-up confirmation failed. Expected: "APPROVE REFUND".');
    }

    const db = admin.firestore();
    const tipRef = db.collection('tips').doc(tipId);
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Pre-flight check
    const tipSnap = await tipRef.get();
    if (!tipSnap.exists) {
      throw new HttpsError('not-found', 'Tip document not found.');
    }
    const tipData = tipSnap.data()!;
    if (tipData.status !== 'succeeded') {
      throw new HttpsError('failed-precondition', `Cannot refund tip in ${tipData.status} status.`);
    }

    // Call Stripe to execute actual monetary refund
    let stripeRefundId: string | null = null;
    if (tipData.stripePaymentIntentId) {
      const refund = await stripe.createRefund(
        tipData.stripePaymentIntentId,
        tipData.amountCents,
        `staff_refund_${tipId}`,
      );
      stripeRefundId = refund.id;
    }

    return db.runTransaction(async (transaction) => {
      const freshSnap = await transaction.get(tipRef);
      if (!freshSnap.exists) {
        throw new HttpsError('not-found', 'Tip document not found.');
      }

      const freshData = freshSnap.data()!;
      if (freshData.status !== 'succeeded') {
        throw new HttpsError('failed-precondition', `Cannot refund tip in ${freshData.status} status.`);
      }

      // Update tip document
      transaction.update(tipRef, {
        status: 'refunded',
        refundedAt: now,
        refundReason: reason.trim(),
        approvedByStaffUid: uid,
        approvedByStaffRole: callerRole,
        stripeRefundId: stripeRefundId,
        updatedAt: now,
      });

      // Deduct creator available balance (PAY-02)
      const netAmountCents = freshData.netAmountCents ?? (freshData.amountCents - (freshData.platformFeeCents || 0));
      if (freshData.recipientId && freshData.recipientType !== 'band') {
        const artistRef = db.collection('artistProfiles').doc(freshData.recipientId);
        transaction.set(
          artistRef,
          {
            availableBalanceCents: admin.firestore.FieldValue.increment(-netAmountCents),
            updatedAt: now,
          },
          { merge: true },
        );
      }

      // Write reverse ledger entries
      const debitRef = db.collection('paymentLedger').doc();
      const creditRef = db.collection('paymentLedger').doc();

      transaction.set(debitRef, {
        ledgerId: debitRef.id,
        tipId,
        source: 'staff_refund',
        amountCents: freshData.amountCents || 0,
        direction: 'DEBIT',
        account: 'creator_balance',
        stripeRefundId: stripeRefundId,
        performedByUid: uid,
        createdAt: now,
      });

      transaction.set(creditRef, {
        ledgerId: creditRef.id,
        tipId,
        source: 'staff_refund',
        amountCents: freshData.amountCents || 0,
        direction: 'CREDIT',
        account: 'fan_refund',
        stripeRefundId: stripeRefundId,
        performedByUid: uid,
        createdAt: now,
      });

      // Write audit event
      const auditRef = db.collection('auditEvents').doc();
      transaction.set(auditRef, {
        eventId: auditRef.id,
        action: 'REFUND_APPROVED',
        actorUid: uid,
        actorType: 'staff',
        targetId: tipId,
        targetType: 'tip',
        metadata: {
          amountCents: freshData.amountCents,
          netAmountCents,
          stripeRefundId,
          reason: reason.trim(),
          approvedByRole: callerRole,
        },
        correlationId: `refund_${tipId}_${Date.now()}`,
        createdAt: now,
      });

      return {
        success: true,
        tipId,
        amountCents: freshData.amountCents,
        stripeRefundId,
        message: `Tip ${tipId} successfully refunded.`,
      };
    });
  }
);
