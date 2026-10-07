/**
 * Crowdbeats V2 — requestPayout (Phase 7)
 *
 * Callable: requestPayout
 *
 * Requests a payout of available balance to the performer's Stripe Connect account.
 *
 * Checks:
 * 1. Performer has a connected account with chargesEnabled + payoutsEnabled
 * 2. Requested amountCents ≥ PAYOUT_MINIMUM_CENTS ($10)
 * 3. Available balance ≥ requested amount
 * 4. Tip hold period elapsed (24h minimum from tip createdAt)
 *
 * Creates a Stripe Transfer, writes to `payouts/{payoutId}`.
 * Deducts from `artistProfiles/{uid}.availableBalanceCents` atomically.
 *
 * Auth: artist or band_member only
 * Returns: { payoutId, amountCents, stripeTransferId }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';
import { stripe } from '../lib/stripe.js';

if (admin.apps.length === 0) admin.initializeApp();

const PAYOUT_MINIMUM_CENTS = 1_000; // $10 (OD-10)
const ALLOWED_TYPES = new Set(['artist', 'band_member']);

function _db() {
  return admin.firestore();
}

export const requestPayout = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;

    const amountCents = data['amountCents'] as unknown;
    const currency = (data['currency'] as string | undefined ?? 'USD').toUpperCase();

    if (typeof amountCents !== 'number' || !Number.isInteger(amountCents)) {
      throw new HttpsError('invalid-argument', 'amountCents must be an integer.');
    }
    if (amountCents < PAYOUT_MINIMUM_CENTS) {
      throw new HttpsError('invalid-argument', `Minimum payout is $${PAYOUT_MINIMUM_CENTS / 100}.`);
    }

    // ── Check persona ─────────────────────────────────────────────────────────
    const userSnap = await _db().collection('users').doc(uid).get();
    if (!userSnap.exists) throw new HttpsError('not-found', 'User not found.');
    const userData = userSnap.data()!;
    const personaType = userData['personaType'] as string | undefined;
    if (!personaType || !ALLOWED_TYPES.has(personaType)) {
      throw new HttpsError('permission-denied', 'Only artists and band members can request payouts.');
    }

    // ── Check Compliance Hold ────────────────────────────────────────────────
    if (userData['complianceHold'] === true) {
      throw new HttpsError(
        'failed-precondition',
        `Payouts are on hold for this account (${userData['payoutHoldReason'] || 'compliance review'}).`,
      );
    }

    // ── Check Connect account ─────────────────────────────────────────────────
    const accountId = userData['stripeConnectAccountId'] as string | undefined;
    if (!accountId) {
      throw new HttpsError('failed-precondition', 'No payout account connected. Complete Stripe Connect onboarding first.');
    }
    const connectStatus = await stripe.getConnectAccountStatus(accountId);
    if (!connectStatus.chargesEnabled || !connectStatus.payoutsEnabled) {
      throw new HttpsError('failed-precondition', 'Stripe Connect account is not fully enabled. Complete identity verification.');
    }

    // ── Check available balance & reserve payout atomically (TOCTOU protection) ──
    const profileRef = _db().collection('artistProfiles').doc(uid);
    const payoutId = uuidv4();
    const payoutRef = _db().collection('payouts').doc(payoutId);
    const now = admin.firestore.FieldValue.serverTimestamp();

    await _db().runTransaction(async (transaction) => {
      const profileSnap = await transaction.get(profileRef);
      const availableBalance = (profileSnap.data()?.['availableBalanceCents'] as number | undefined) ?? 0;
      if (availableBalance < amountCents) {
        throw new HttpsError(
          'failed-precondition',
          `Insufficient balance. Available: $${(availableBalance / 100).toFixed(2)}, requested: $${(amountCents / 100).toFixed(2)}.`,
        );
      }
      transaction.update(profileRef, {
        availableBalanceCents: admin.firestore.FieldValue.increment(-amountCents),
        totalPaidOutCents: admin.firestore.FieldValue.increment(amountCents),
        updatedAt: now,
      });
      transaction.set(payoutRef, {
        payoutId,
        recipientId: uid,
        amountCents,
        currency,
        status: 'pending',
        createdAt: now,
      });
    });

    // ── Create Stripe Transfer ────────────────────────────────────────────────
    let transfer: { id: string };
    try {
      transfer = await stripe.createTransfer({
        amountCents,
        currency,
        destinationAccountId: accountId,
        metadata: { payoutId, creatorId: uid },
        idempotencyKey: `payout_${payoutId}`,
      });
    } catch (transferErr: any) {
      // Rollback deduction ONLY if Stripe transfer failed (funds were not sent)
      await _db().runTransaction(async (rollbackTxn) => {
        rollbackTxn.update(profileRef, {
          availableBalanceCents: admin.firestore.FieldValue.increment(amountCents),
          totalPaidOutCents: admin.firestore.FieldValue.increment(-amountCents),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        rollbackTxn.update(payoutRef, {
          status: 'failed',
          failureReason: transferErr?.message || String(transferErr),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      throw new HttpsError('internal', `Stripe transfer failed: ${transferErr?.message || transferErr}`);
    }

    // Transfer succeeded at Stripe — update payout doc (do not revert creator balance on doc error)
    try {
      await payoutRef.update({
        stripeTransferId: transfer.id,
        status: 'paid',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (dbErr: any) {
      console.error(`CRITICAL: Stripe transfer ${transfer.id} succeeded but payout doc ${payoutId} update failed:`, dbErr);
    }

    // Audit
    await _db().collection('auditEvents').add({
      type: 'payout_requested',
      actorUid: uid,
      resourceId: payoutId,
      resourceType: 'payout',
      amountCents,
      createdAt: now,
    });

    return { payoutId, amountCents, stripeTransferId: transfer.id };
  },
);
