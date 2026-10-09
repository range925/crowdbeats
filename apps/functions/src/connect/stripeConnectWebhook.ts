/**
 * Crowdbeats V2 — Stripe Connect Dedicated Webhook Handler (Phase 10 & Production)
 *
 * HTTP function: stripeConnectWebhook
 *
 * Architecture:
 * - Dedicated endpoint for Stripe Connect account events
 * - Verifies Stripe-Signature header using STRIPE_CONNECT_WEBHOOK_SECRET
 *   (falls back to STRIPE_WEBHOOK_SECRET if not uniquely configured)
 * - Always returns HTTP 200 to Stripe (errors logged, not surfaced)
 * - Replay attack prevention & idempotency caching via webhookEvents & stripeWebhookEvents
 * - Event handlers:
 *   * account.updated
 *   * account.application.deauthorized
 *   * capability.updated
 *   * payout.paid
 *   * payout.failed
 *   * charge.dispute.created
 *   * charge.refunded
 *
 * Region: us-central1
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { stripe } from '../lib/stripe.js';
import {
  handleAccountUpdated,
  handleAccountApplicationDeauthorized,
  handleCapabilityUpdated,
  handlePayoutPaid,
  handlePayoutFailed,
  handleDisputeCreated,
  handleChargeRefunded,
} from './connectWebhookHandlers.js';

const _db = () => admin.firestore();

export const stripeConnectWebhook = onRequest(
  {
    region: 'us-central1',
    cors: false,
  },
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string | undefined;
    const connectSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
    const accountSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Record<string, unknown> = {};
    try {
      if (!connectSecret && !accountSecret) {
        // Emulator mode: accept without signature
        event = req.body as Record<string, unknown>;
      } else if (!sig) {
        res.status(400).send('Missing Stripe-Signature header');
        return;
      } else {
        let verified = false;
        let lastError: unknown = null;

        // Try STRIPE_CONNECT_WEBHOOK_SECRET first
        if (connectSecret) {
          try {
            event = stripe.constructWebhookEvent(
              req.rawBody as unknown as string,
              sig,
              connectSecret,
            ) as unknown as Record<string, unknown>;
            verified = true;
          } catch (err) {
            lastError = err;
          }
        }

        // Fallback to STRIPE_WEBHOOK_SECRET
        if (!verified && accountSecret) {
          try {
            event = stripe.constructWebhookEvent(
              req.rawBody as unknown as string,
              sig,
              accountSecret,
            ) as unknown as Record<string, unknown>;
            verified = true;
          } catch (err) {
            lastError = err;
          }
        }

        if (!verified) {
          throw lastError || new Error('Connect webhook signature verification failed');
        }
      }
    } catch (err) {
      console.error('Connect webhook signature verification failed:', err);
      res.status(400).send('Webhook signature verification failed');
      return;
    }

    const eventId = event['id'] as string | undefined;
    const eventType = event['type'] as string;
    const connectedAccountId = (event['account'] as string) || undefined;
    const eventObject = (event['data'] as Record<string, unknown>)?.['object'] as Record<string, unknown>;

    // Idempotency / Deduplication
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
      await eventRef.set(
        {
          eventId,
          type: eventType,
          account: connectedAccountId || null,
          status: 'PROCESSING',
          receivedAt: now,
        },
        { merge: true },
      );

      stripeEventRef = _db().collection('stripeWebhookEvents').doc(eventId);
      await stripeEventRef.set(
        {
          stripeEventId: eventId,
          eventType,
          account: connectedAccountId || null,
          processingStatus: 'RECEIVED',
          relatedObjectId: eventObject?.['id'] || null,
          receivedAt: now,
          processedAt: null,
        },
        { merge: true },
      );
    }

    try {
      switch (eventType) {
        case 'account.updated':
          await handleAccountUpdated(_db(), eventObject);
          break;
        case 'account.application.deauthorized':
          await handleAccountApplicationDeauthorized(_db(), eventObject);
          break;
        case 'capability.updated':
          await handleCapabilityUpdated(_db(), eventObject, connectedAccountId);
          break;
        case 'payout.paid':
          await handlePayoutPaid(_db(), eventObject);
          break;
        case 'payout.failed':
          await handlePayoutFailed(_db(), eventObject);
          break;
        case 'charge.dispute.created':
          await handleDisputeCreated(_db(), eventObject);
          break;
        case 'charge.refunded':
          await handleChargeRefunded(_db(), eventObject);
          break;
        default:
          break;
      }

      if (eventRef) {
        const now = admin.firestore.FieldValue.serverTimestamp();
        await eventRef
          .set(
            {
              status: 'COMPLETED',
              completedAt: now,
            },
            { merge: true },
          )
          .catch(() => {});
        if (stripeEventRef) {
          await stripeEventRef
            .set(
              {
                processingStatus: 'PROCESSED',
                processedAt: now,
              },
              { merge: true },
            )
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error(`Connect webhook handler error for ${eventType}:`, err);
      if (eventRef) {
        await eventRef
          .set(
            {
              status: 'ERROR',
              lastError: String(err),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          )
          .catch(() => {});
      }
      res.status(500).send(`Webhook handler error: ${err}`);
      return;
    }

    res.status(200).send('OK');
  },
);
