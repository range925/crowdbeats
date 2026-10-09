/**
 * Crowdbeats V2 — Stripe Webhook Handler (Phase 6)
 *
 * HTTP function: stripeWebhook
 *
 * Architecture:
 * - Verifies Stripe-Signature header using STRIPE_WEBHOOK_SECRET env var
 * - Always returns HTTP 200 to Stripe (errors logged, not surfaced)
 * - Idempotent: payment_intent.succeeded on already-succeeded tip is a no-op
 * - No client-writable ledger entries: both debit and credit written server-only
 * - Tip status: pending → processing → succeeded | failed
 *
 * Region: us-central1
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { stripe } from '../lib/stripe.js';
import {
  handleAccountUpdated,
  handleAccountApplicationDeauthorized,
  handleDisputeCreated,
  handleChargeRefunded,
  handlePayoutPaid,
  handlePayoutFailed,
} from '../connect/connectWebhookHandlers.js';

const _db = () => admin.firestore();

async function _handleStripeWebhook(req: any, res: any): Promise<void> {
  // ── Signature verification ─────────────────────────────────────────────

  const sig = req.headers['stripe-signature'] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const connectWebhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

  let event: Record<string, unknown> = {};
  try {
    if (!webhookSecret && !connectWebhookSecret) {
      // Emulator mode: accept without signature
      event = req.body as Record<string, unknown>;
    } else if (!sig) {
      // Secret set but no sig header
      res.status(400).send('Missing Stripe-Signature header');
      return;
    } else {
      let verified = false;
      let lastError: unknown = null;

      // Try STRIPE_WEBHOOK_SECRET first if configured
      if (webhookSecret) {
        try {
          event = stripe.constructWebhookEvent(
            req.rawBody as unknown as string,
            sig,
            webhookSecret,
          ) as unknown as Record<string, unknown>;
          verified = true;
        } catch (err) {
          lastError = err;
        }
      }

      // If secret validation fails with STRIPE_WEBHOOK_SECRET and STRIPE_CONNECT_WEBHOOK_SECRET is defined, try it
      if (!verified && connectWebhookSecret) {
        try {
          event = stripe.constructWebhookEvent(
            req.rawBody as unknown as string,
            sig,
            connectWebhookSecret,
          ) as unknown as Record<string, unknown>;
          verified = true;
        } catch (err) {
          lastError = err;
        }
      }

      if (!verified) {
        throw lastError || new Error('Webhook signature verification failed');
      }
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send('Webhook signature verification failed');
    return;
  }

  const eventId = event['id'] as string | undefined;
  const eventType = event['type'] as string;
  const eventObject = (event['data'] as Record<string, unknown>)?.['object'] as Record<string, unknown>;

  // ── Replay Attack Prevention / Idempotency Cache ───────────────────────
  let eventRef: admin.firestore.DocumentReference | null = null;
  let stripeEventRef: admin.firestore.DocumentReference | null = null;

  if (eventId) {
    eventRef = _db().collection('webhookEvents').doc(eventId);
    const eventSnap = await eventRef.get();
    if (eventSnap.exists) {
      const existingData = eventSnap.data();
      if (existingData?.status === 'COMPLETED' || !existingData?.status) {
        res.status(200).send({ received: true, deduplicated: true });
        return;
      }
    }
    const now = admin.firestore.FieldValue.serverTimestamp();
    await eventRef.set({
      eventId,
      type: eventType,
      status: 'PROCESSING',
      receivedAt: now,
    }, { merge: true });

    // Phase 15: Stripe Webhook Events collection
    stripeEventRef = _db().collection('stripeWebhookEvents').doc(eventId);
    await stripeEventRef.set({
      stripeEventId: eventId,
      eventType,
      processingStatus: 'RECEIVED',
      relatedObjectId: eventObject?.['id'] || null,
      receivedAt: now,
      processedAt: null,
    }, { merge: true });
  }

  try {
    switch (eventType) {
      case 'payment_intent.succeeded':
        await _handlePaymentSucceeded(eventObject);
        break;
      case 'payment_intent.payment_failed':
        await _handlePaymentFailed(eventObject);
        break;
      case 'account.updated':
        await handleAccountUpdated(_db(), eventObject);
        break;
      case 'account.application.deauthorized':
        await handleAccountApplicationDeauthorized(_db(), eventObject);
        break;
      case 'charge.dispute.created':
        await handleDisputeCreated(_db(), eventObject);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(_db(), eventObject);
        break;
      case 'payout.paid':
        await handlePayoutPaid(_db(), eventObject);
        break;
      case 'payout.failed':
        await handlePayoutFailed(_db(), eventObject);
        break;
      case 'capability.updated':
        await handleAccountUpdated(_db(), eventObject);
        break;
      case 'application_fee.created':
      case 'application_fee.refunded':
      case 'application_fee.refund.updated':
      case 'transfer.created':
      case 'transfer.reversed':
        await _handleApplicationFeeAndTransferEvents(eventType, eventObject);
        break;
      default:
        // Gracefully ignore unhandled event types
        break;
    }

      if (eventRef) {
        const now = admin.firestore.FieldValue.serverTimestamp();
        await (eventRef as admin.firestore.DocumentReference).set({
          status: 'COMPLETED',
          completedAt: now,
        }, { merge: true }).catch(() => {});
        if (stripeEventRef) {
          await (stripeEventRef as admin.firestore.DocumentReference).set({
            processingStatus: 'PROCESSED',
            processedAt: now,
          }, { merge: true }).catch(() => {});
        }
      }
    } catch (err) {
      console.error(`Webhook handler error for ${eventType}:`, err);
      if (eventRef) {
        await (eventRef as admin.firestore.DocumentReference).set({
          status: 'ERROR',
          lastError: String(err),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true }).catch(() => {});
      }
      res.status(500).send(`Webhook handler error: ${err}`);
      return;
    }

    res.status(200).send('OK');
}

export const stripeWebhook = onRequest(
  {
    region: 'us-central1',
    cors: false, // Stripe webhooks do not use browser CORS
  },
  _handleStripeWebhook,
);

export const stripeConnectWebhook = onRequest(
  {
    region: 'us-central1',
    cors: false, // Stripe webhooks do not use browser CORS
  },
  _handleStripeWebhook,
);

// ── Event Handlers ─────────────────────────────────────────────────────────────

async function _handlePaymentSucceeded(pi: Record<string, unknown>): Promise<void> {
  const metadata = pi['metadata'] as Record<string, string> | undefined;
  const tipId = metadata?.['tipId'];
  if (!tipId) {
    console.warn('payment_intent.succeeded: no tipId in metadata', pi['id']);
    return;
  }

  const tipRef = _db().collection('tips').doc(tipId);

  await _db().runTransaction(async (tx) => {
    const tipSnap = await tx.get(tipRef);
    if (!tipSnap.exists) {
      throw new Error(`Tip not found: ${tipId}`);
    }

    const tipData = tipSnap.data()!;

    // Idempotency: already succeeded → no-op
    if (tipData['status'] === 'succeeded') {
      return;
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    // Update tip status
    tx.update(tipRef, {
      status: 'succeeded',
      processedAt: now,
      updatedAt: now,
    });

    const fanUid = tipData['fanUid'] as string;
    const recipientId = tipData['recipientId'] as string;
    const recipientType = tipData['recipientType'] as string;
    const amountCents = tipData['amountCents'] as number;
    const platformFeeCents = tipData['platformFeeCents'] as number;
    const netAmountCents = tipData['netAmountCents'] as number;
    const currency = (tipData['currency'] as string) ?? 'USD';

    // Write double-entry ledger entries (server-only, no client can write these)
    const debitRef = _db().collection('paymentLedger').doc(uuidv4());
    tx.set(debitRef, {
      type: 'DEBIT',
      entryType: 'TIP_SENT',
      uid: fanUid,
      tipId,
      amountCents,
      platformFeeCents,
      netAmountCents,
      currency,
      createdAt: now,
    });

    if (recipientType === 'band') {
      // ── Band split distribution (Largest Remainder Method, OD-09) ───────
      const splitConfigSnap = await tx.get(_db().collection('bands').doc(recipientId).collection('splitConfig').doc('current'));
      let splits: Array<{ uid: string; splitBps: number }> = [];
      let splitVersion = 1;

      if (splitConfigSnap.exists) {
        splits = (splitConfigSnap.data()?.['splits'] as Array<{ uid: string; splitBps: number }>) || [];
        splitVersion = (splitConfigSnap.data()?.['version'] as number) || 1;
      }

      if (splits.length > 0) {
        const distributed = _distributeLargestRemainder(netAmountCents, splits);
        for (const split of splits) {
          const memberUid = split.uid;
          const memberAllocatedCents = distributed[memberUid] || 0;
          const memberCreditRef = _db().collection('paymentLedger').doc(uuidv4());
          tx.set(memberCreditRef, {
            type: 'CREDIT',
            entryType: 'BAND_TIP_SHARE',
            uid: memberUid,
            bandId: recipientId,
            tipId,
            splitVersion,
            splitBps: split.splitBps,
            amountCents: memberAllocatedCents,
            currency,
            createdAt: now,
          });

          // Roll up member withdrawable balance in artist profile
          if (memberAllocatedCents > 0) {
            const memberProfileRef = _db().collection('artistProfiles').doc(memberUid);
            tx.set(
              memberProfileRef,
              {
                availableBalanceCents: admin.firestore.FieldValue.increment(memberAllocatedCents),
                updatedAt: now,
              },
              { merge: true },
            );
          }
        }
      } else {
        // Fallback credit to band entity directly
        const creditRef = _db().collection('paymentLedger').doc(uuidv4());
        tx.set(creditRef, {
          type: 'CREDIT',
          entryType: 'TIP_RECEIVED',
          uid: recipientId,
          tipId,
          amountCents,
          platformFeeCents,
          netAmountCents,
          currency,
          createdAt: now,
        });
      }
    } else {
      const creditRef = _db().collection('paymentLedger').doc(uuidv4());
      tx.set(creditRef, {
        type: 'CREDIT',
        entryType: 'TIP_RECEIVED',
        uid: recipientId,
        tipId,
        amountCents,
        platformFeeCents,
        netAmountCents,
        currency,
        createdAt: now,
      });

      // Roll up solo artist withdrawable balance in profile
      const artistProfileRef = _db().collection('artistProfiles').doc(recipientId);
      tx.set(
        artistProfileRef,
        {
          availableBalanceCents: admin.firestore.FieldValue.increment(netAmountCents),
          updatedAt: now,
        },
        { merge: true },
      );
    }
  });

  // Increment creator tip stats (outside transaction for scalability)
  const tipSnap = await tipRef.get();
  if (!tipSnap || !tipSnap.exists || typeof tipSnap.data !== 'function') return;
  const tipData = tipSnap.data();
  if (!tipData) return;

  const recipientType = tipData['recipientType'] as string;
  const recipientId = tipData['recipientId'] as string;
  const amountCents = tipData['amountCents'] as number;
  const fanUid = tipData['fanUid'] as string;
  const isAnonymous = tipData['isAnonymous'] as boolean;

  const profileCollection = recipientType === 'band' ? 'bands' : 'artistProfiles';
  await _db()
    .collection(profileCollection)
    .doc(recipientId)
    .update({
      totalTipsReceivedCents: admin.firestore.FieldValue.increment(amountCents),
      tipCount: admin.firestore.FieldValue.increment(1),
    });

  // Create notification for creator / band
  await _db()
    .collection('notifications')
    .doc(recipientId)
    .collection('items')
    .doc(uuidv4())
    .set({
      type: 'TIP_RECEIVED',
      tipId,
      amountCents,
      fanUid: isAnonymous ? null : fanUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      readAt: null,
    });
}

function _distributeLargestRemainder(
  amountCents: number,
  members: readonly { uid: string; splitBps: number }[],
): Record<string, number> {
  const exactShares = members.map((m) => ({
    uid: m.uid,
    floor: Math.floor((amountCents * m.splitBps) / 10000),
    remainder: ((amountCents * m.splitBps) / 10000) % 1,
  }));
  const floorTotal = exactShares.reduce((sum, s) => sum + s.floor, 0);
  const remainderCents = amountCents - floorTotal;
  const sorted = [...exactShares].sort((a, b) => b.remainder - a.remainder);
  const result: Record<string, number> = {};
  for (const s of exactShares) {
    result[s.uid] = s.floor;
  }
  for (let i = 0; i < remainderCents; i++) {
    result[sorted[i]!.uid]! += 1;
  }
  return result;
}

async function _handlePaymentFailed(pi: Record<string, unknown>): Promise<void> {
  const metadata = pi['metadata'] as Record<string, string> | undefined;
  const tipId = metadata?.['tipId'];
  if (!tipId) return;

  const tipRef = _db().collection('tips').doc(tipId);
  const snap = await tipRef.get();
  if (snap.exists) {
    const currentStatus = snap.data()?.['status'];
    if (currentStatus === 'succeeded' || currentStatus === 'refunded') {
      console.warn(`Ignoring payment_failed event for tip ${tipId} in status ${currentStatus}`);
      return;
    }
  }

  await tipRef.update({
    status: 'failed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function _handleApplicationFeeAndTransferEvents(
  eventType: string,
  eventObject: Record<string, unknown>,
): Promise<void> {
  const feeId = (eventObject['id'] as string) || `fee_${Date.now()}`;
  const now = admin.firestore.FieldValue.serverTimestamp();

  // Create append-only reconciliation log
  await _db().collection('stripeApplicationFeeEvents').doc(feeId).set(
    {
      feeId,
      eventType,
      amountCents: (eventObject['amount'] as number) || 0,
      currency: (eventObject['currency'] as string) || 'usd',
      chargeId: (eventObject['charge'] as string) || null,
      account: (eventObject['account'] as string) || null,
      processedAt: now,
    },
    { merge: true },
  );

  // Write immutable financial ledger entry
  await _db().collection('paymentLedger').add({
    id: `ledger_${feeId}`,
    type: eventType.includes('refund') ? 'FEE_REFUND_DEBIT' : 'PLATFORM_FEE_CREDIT',
    amountCents: (eventObject['amount'] as number) || 0,
    currency: ((eventObject['currency'] as string) || 'USD').toUpperCase(),
    stripeEventId: feeId,
    createdAt: now,
  });
}
