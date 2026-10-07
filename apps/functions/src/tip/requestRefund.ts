/**
 * Crowdbeats V2 — requestRefund Cloud Function (Phase 6)
 *
 * Callable: requestRefund
 *
 * Architecture:
 * - 24-hour refund window enforced server-side (OD-10)
 * - Idempotent: same idempotencyKey returns existing result
 * - Never deletes original ledger entries — writes REVERSE entries
 * - Validates fan ownership of tip
 *
 * Region: us-central1
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { stripe } from '../lib/stripe.js';

const FAN_REFUND_WINDOW_HOURS = 24; // OD-10

const _db = () => admin.firestore();

export const requestRefund = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;
    const { tipId, reason, idempotencyKey } = data;

    if (typeof tipId !== 'string' || tipId.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'tipId is required.');
    }
    if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'idempotencyKey is required.');
    }

    // ── Idempotency check ─────────────────────────────────────────────────

    const idemRef = _db().collection('idempotencyKeys').doc(idempotencyKey as string);
    const idemSnap = await idemRef.get();
    if (idemSnap.exists) {
      const idemData = idemSnap.data()!;
      if (idemData['fanUid'] !== uid) {
        throw new HttpsError('permission-denied', 'Idempotency key mismatch.');
      }
      return { tipId, refundedAmountCents: idemData['refundedAmountCents'] };
    }

    // ── Read and validate tip ─────────────────────────────────────────────

    const tipRef = _db().collection('tips').doc(tipId as string);
    const tipSnap = await tipRef.get();

    if (!tipSnap.exists) {
      throw new HttpsError('not-found', 'Tip not found.');
    }

    const tip = tipSnap.data()!;

    if (tip['fanUid'] !== uid) {
      throw new HttpsError('permission-denied', 'You can only refund your own tips.');
    }

    if (tip['status'] !== 'succeeded') {
      throw new HttpsError(
        'failed-precondition',
        `Tip is not in succeeded status (current: ${tip['status']}).`,
      );
    }

    // ── Check 24-hour refund window ───────────────────────────────────────

    const createdAt = tip['createdAt'] as admin.firestore.Timestamp;
    const windowEnd = new Date(createdAt.toDate().getTime() + FAN_REFUND_WINDOW_HOURS * 3_600_000);
    if (new Date() > windowEnd) {
      throw new HttpsError(
        'failed-precondition',
        'Refund window has expired (24 hours from tip).',
      );
    }

    // ── Idempotency: already refunded? ────────────────────────────────────

    if (tip['refundedAt']) {
      return { tipId, refundedAmountCents: tip['amountCents'] };
    }

    // ── Process Stripe refund ─────────────────────────────────────────────

    const piId = tip['stripePaymentIntentId'] as string;
    const amountCents = tip['amountCents'] as number;

    const refund = await stripe.createRefund(piId, amountCents, `fan_refund_${tipId}`);

    // ── Update tip + write reverse ledger entries ─────────────────────────

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = _db().batch();

    batch.update(tipRef, {
      status: 'refunded',
      refundedAt: now,
      refundReason: (reason as string | undefined) ?? 'Fan-initiated',
      stripeRefundId: refund.id,
      updatedAt: now,
    });

    // Deduct creator available balance (PAY-02)
    const recipientId = tip['recipientId'] as string;
    const recipientType = tip['recipientType'] as string;
    const netAmountCents = (tip['netAmountCents'] as number) ?? (amountCents - ((tip['platformFeeCents'] as number) ?? 0));

    if (recipientId && recipientType !== 'band') {
      const artistRef = _db().collection('artistProfiles').doc(recipientId);
      batch.set(
        artistRef,
        {
          availableBalanceCents: admin.firestore.FieldValue.increment(-netAmountCents),
          updatedAt: now,
        },
        { merge: true },
      );
    }

    // Reverse ledger entries (new rows — original rows NOT deleted)
    const reversalDebitRef = _db().collection('paymentLedger').doc(uuidv4());
    batch.set(reversalDebitRef, {
      type: 'REVERSAL_DEBIT',
      entryType: 'TIP_REFUNDED',
      uid: tip['recipientId'] as string,
      tipId,
      amountCents,
      currency: (tip['currency'] as string) ?? 'USD',
      stripeRefundId: refund.id,
      createdAt: now,
    });

    const reversalCreditRef = _db().collection('paymentLedger').doc(uuidv4());
    batch.set(reversalCreditRef, {
      type: 'REVERSAL_CREDIT',
      entryType: 'TIP_REFUNDED',
      uid: tip['fanUid'] as string,
      tipId,
      amountCents,
      currency: (tip['currency'] as string) ?? 'USD',
      stripeRefundId: refund.id,
      createdAt: now,
    });

    // Idempotency key
    batch.set(idemRef, {
      fanUid: uid,
      tipId,
      refundedAmountCents: amountCents,
      createdAt: now,
    });

    await batch.commit();

    return { tipId, refundedAmountCents: amountCents };
  },
);
