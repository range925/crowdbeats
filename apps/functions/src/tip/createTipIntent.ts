/**
 * Crowdbeats V2 — createTipIntent Cloud Function (Phase 6)
 *
 * Callable: createTipIntent
 *
 * Architecture:
 * - Server-authoritative: all financial fields written server-side only
 * - Idempotent: same idempotencyKey + same fanUid → returns existing response
 * - No client can set status, platformFeeCents, netAmountCents, or ledger fields
 * - Money in integer minor units (amountCents) throughout
 * - PLATFORM_FEE_BPS = 500 (5%) — floor on odd cents
 *
 * Region: us-central1
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { stripe } from '../lib/stripe.js';
import { assertCreatorMayMonetize } from '../monetization/eligibilityService.js';
import {
  screenTextContent,
  enqueueModerationItem,
} from '../moderation/moderationScanner.js';
import { ModeratedContentType } from '@crowdbeats/contracts';

const PLATFORM_FEE_BPS = 600; // 6.00% Crowdbeats Platform Fee
const PLATFORM_FEE_DISCLOSURE =
  'Crowdbeats charges a 6% platform fee. Stripe payment-processing and applicable Stripe Connect fees are additional.';
const TIP_MINIMUM_CENTS = 100; // $1.00
const TIP_MAXIMUM_CENTS = 50_000; // $500.00
const TIP_MESSAGE_MAX = 200;
const VALID_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'CAD', 'AUD']);
const VALID_RECIPIENT_TYPES = new Set(['artist', 'band']);

const _db = () => admin.firestore();

// ── Callable ──────────────────────────────────────────────────────────────────

export const createTipIntent = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;

    // ── Validate inputs ──────────────────────────────────────────────────────

    const {
      recipientId,
      recipientType,
      amountCents: amountCentsRaw,
      currency: currencyRaw,
      sessionId,
      message: messageRaw,
      isAnonymous = false,
      idempotencyKey,
      savedPaymentMethodId,  // optional: Stripe PM id for fast-path confirm
    } = data;

    if (typeof recipientId !== 'string' || recipientId.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'recipientId is required.');
    }
    if (recipientId === uid) {
      throw new HttpsError('failed-precondition', 'Self-tipping is not permitted.');
    }
    if (typeof recipientType !== 'string' || !VALID_RECIPIENT_TYPES.has(recipientType)) {
      throw new HttpsError('invalid-argument', 'recipientType must be "artist" or "band".');
    }
    if (typeof amountCentsRaw !== 'number' || !Number.isInteger(amountCentsRaw)) {
      throw new HttpsError('invalid-argument', 'amountCents must be an integer.');
    }
    const amountCents = amountCentsRaw;
    if (amountCents < TIP_MINIMUM_CENTS || amountCents > TIP_MAXIMUM_CENTS) {
      throw new HttpsError(
        'invalid-argument',
        `amountCents must be between ${TIP_MINIMUM_CENTS} and ${TIP_MAXIMUM_CENTS}.`,
      );
    }
    if (typeof currencyRaw !== 'string' || !VALID_CURRENCIES.has(currencyRaw.toUpperCase())) {
      throw new HttpsError('invalid-argument', 'currency must be USD, EUR, GBP, CAD, or AUD.');
    }
    const currency = currencyRaw.toUpperCase();
    if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'idempotencyKey is required.');
    }
    // Sanitize and screen message (Phase 5 Pre-Payment Moderation Screening)
    let message: string | undefined;
    let moderationStatus = 'PASS';
    if (typeof messageRaw === 'string' && messageRaw.trim().length > 0) {
      const sanitizedHtml = messageRaw.replace(/<[^>]*>/g, '').trim();
      if (sanitizedHtml.length > TIP_MESSAGE_MAX) {
        throw new HttpsError(
          'invalid-argument',
          `message must not exceed ${TIP_MESSAGE_MAX} characters.`,
        );
      }

      const screenResult = screenTextContent(sanitizedHtml, ModeratedContentType.TIP_MESSAGE);
      if (screenResult.autoQuarantine || !screenResult.passed) {
        await enqueueModerationItem(_db(), {
          contentId: idempotencyKey,
          contentType: ModeratedContentType.TIP_MESSAGE,
          authorUid: uid,
          textSnippet: sanitizedHtml,
          targetCreatorId: recipientId,
          screenResult,
        });
        throw new HttpsError(
          'invalid-argument',
          'Tip message violates platform safety guidelines and cannot be sent.',
        );
      }

      message = screenResult.sanitizedText || sanitizedHtml;
      moderationStatus = screenResult.state;
      if (screenResult.state === 'FLAGGED') {
        await enqueueModerationItem(_db(), {
          contentId: idempotencyKey,
          contentType: ModeratedContentType.TIP_MESSAGE,
          authorUid: uid,
          textSnippet: sanitizedHtml,
          targetCreatorId: recipientId,
          screenResult,
        });
      }
    }

    // ── Enforce Creator Monetization Eligibility (Phase 3 Server Enforcement) ──
    await assertCreatorMayMonetize(_db(), recipientId, recipientType as 'artist' | 'band');

    // ── Idempotency check ────────────────────────────────────────────────────

    const idemRef = _db().collection('idempotencyKeys').doc(idempotencyKey);
    const idemSnap = await idemRef.get();
    if (idemSnap.exists) {
      const idemData = idemSnap.data()!;
      if (idemData['fanUid'] !== uid) {
        throw new HttpsError('permission-denied', 'Idempotency key mismatch.');
      }
      // Return existing response
      const existingTip = await _db().collection('tips').doc(idemData['tipId'] as string).get();
      if (existingTip.exists) {
        const d = existingTip.data()!;
        return {
          tipId: idemData['tipId'],
          clientSecret: d['clientSecret'],
          amountCents: d['amountCents'],
          platformFeeCents: d['platformFeeCents'],
          netAmountCents: d['netAmountCents'],
        };
      }
    }

    // ── Calculate fees ───────────────────────────────────────────────────────

    const platformFeeCents = Math.floor((amountCents * PLATFORM_FEE_BPS) / 10_000);
    const netAmountCents = amountCents - platformFeeCents;

    // ── Create/get Stripe Customer ───────────────────────────────────────────

    const userDoc = await _db().collection('users').doc(uid).get();
    const userEmail = userDoc.data()?.['email'] as string | undefined ?? `${uid}@crowdbeats.app`;
    let stripeCustomerId: string = userDoc.data()?.['stripeCustomerId'] as string ?? '';

    if (!stripeCustomerId) {
      const customer = await stripe.createOrGetCustomer(uid, userEmail);
      stripeCustomerId = customer.id;
      await _db().collection('users').doc(uid).update({ stripeCustomerId });
    }

    // ── Create Stripe PaymentIntent ──────────────────────────────────────────

    const tipId = uuidv4();
    const pi = await stripe.createPaymentIntent({
      amountCents,
      currency,
      customerId: stripeCustomerId,
      metadata: {
        tipId,
        fanUid: uid,
        recipientId: recipientId as string,
        recipientType: recipientType as string,
      },
      savedPaymentMethodId: typeof savedPaymentMethodId === 'string' ? savedPaymentMethodId : undefined,
    });

    // ── Write Firestore tip document ─────────────────────────────────────────

    const now = admin.firestore.FieldValue.serverTimestamp();
    const tipData = {
      tipId,
      fanUid: uid,
      recipientId,
      recipientType,
      recipientName: null, // populated by webhook from performer profile
      amountCents,
      grossAmountCents: amountCents,
      platformFeePercent: 6,
      platformFeeBps: PLATFORM_FEE_BPS,
      platformFeeCents,
      stripeProcessingFeeCents: null, // reported by Stripe BalanceTransaction
      stripeConnectFeeCents: null,
      taxesOrAdjustmentsCents: 0,
      refundOrDisputeAmountCents: 0,
      netAmountCents,
      netProceedsCents: netAmountCents,
      currency,
      status: 'pending',
      feeDisclosureNotice: PLATFORM_FEE_DISCLOSURE,
      isAnonymous: Boolean(isAnonymous),
      message: message ?? null,
      moderationStatus,
      sessionId: (sessionId as string | undefined) ?? null,
      stripePaymentIntentId: pi.id,
      stripeCustomerId,
      clientSecret: pi.client_secret,
      createdAt: now,
      updatedAt: now,
      settledAt: null,
      processedAt: null,
      refundedAt: null,
      refundReason: null,
      disputedAt: null,
    };

    await _db().collection('tips').doc(tipId).set(tipData);

    // ── Write idempotency key ────────────────────────────────────────────────

    await idemRef.set({
      fanUid: uid,
      tipId,
      createdAt: now,
      ttl: admin.firestore.Timestamp?.fromDate
        ? admin.firestore.Timestamp.fromDate(new Date(Date.now() + 86400 * 1000))
        : new Date(Date.now() + 86400 * 1000),
    });

    // ── Return SendTipResponse ───────────────────────────────────────────────

    return {
      tipId,
      clientSecret: pi.client_secret,
      amountCents,
      platformFeeCents,
      netAmountCents,
    };
  },
);
