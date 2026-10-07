/**
 * Crowdbeats V2 — Deposit Sponsor Escrow Cloud Function (Phase 9)
 *
 * Callable function to fund a Sponsor Organization's escrow balance:
 * - Verifies caller has `SPONSOR_ADMIN` role
 * - Enforces minimum deposit ($10.00 / 1000 cents)
 * - Server-authoritative idempotency check
 * - Credits availableEscrowCents and totalEscrowDepositedCents
 * - Writes dual ledger records (paymentLedger)
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const depositEscrow = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid } = request.auth;
    const { orgId, amountCents, idempotencyKey } = request.data || {};

    if (!orgId || typeof orgId !== 'string') {
      throw new HttpsError('invalid-argument', 'Organization ID is required.');
    }
    if (typeof amountCents !== 'number' || amountCents < 1000) {
      throw new HttpsError('invalid-argument', 'Minimum escrow deposit is $10.00 (1000 cents).');
    }
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      throw new HttpsError('invalid-argument', 'Idempotency key is required.');
    }

    const db = admin.firestore();

    // 1. Verify caller has SPONSOR_ADMIN role
    const memberDoc = await db.collection('sponsorOrgs').doc(orgId).collection('members').doc(uid).get();
    if (!memberDoc.exists || !memberDoc.data()?.isActive || memberDoc.data()?.role !== 'SPONSOR_ADMIN') {
      throw new HttpsError('permission-denied', 'Only active Sponsor Admins can deposit escrow funds.');
    }

    // 2. Check Idempotency Key
    const idempDoc = await db.collection('idempotencyKeys').doc(idempotencyKey).get();
    if (idempDoc.exists) {
      const data = idempDoc.data()!;
      if (data.orgId === orgId && data.uid === uid) {
        return data.response;
      }
    }

    const orgRef = db.collection('sponsorOrgs').doc(orgId);
    const now = admin.firestore.FieldValue.serverTimestamp();
    const ledgerRef = db.collection('paymentLedger').doc();
    const idempRef = db.collection('idempotencyKeys').doc(idempotencyKey);

    return db.runTransaction(async (transaction) => {
      const orgSnap = await transaction.get(orgRef);
      if (!orgSnap.exists || !orgSnap.data()?.isActive) {
        throw new HttpsError('not-found', 'Sponsor organization not found.');
      }

      const orgData = orgSnap.data()!;
      const currentAvailable = orgData.availableEscrowCents || 0;
      const currentDeposited = orgData.totalEscrowDepositedCents || 0;

      const newAvailable = currentAvailable + amountCents;
      const newDeposited = currentDeposited + amountCents;

      // Update org escrow balances
      transaction.update(orgRef, {
        availableEscrowCents: newAvailable,
        totalEscrowDepositedCents: newDeposited,
        updatedAt: now,
      });

      // Write ledger entry
      transaction.set(ledgerRef, {
        ledgerId: ledgerRef.id,
        orgId,
        source: 'sponsor_escrow_deposit',
        amountCents,
        direction: 'CREDIT',
        account: 'sponsor_escrow',
        performedByUid: uid,
        createdAt: now,
      });

      const responsePayload = {
        success: true,
        orgId,
        amountCents,
        newAvailableEscrowCents: newAvailable,
        totalEscrowDepositedCents: newDeposited,
        message: `Successfully deposited $${(amountCents / 100).toFixed(2)} into escrow.`,
      };

      // Record idempotency
      transaction.set(idempRef, {
        orgId,
        uid,
        response: responsePayload,
        createdAt: now,
      });

      return responsePayload;
    });
  }
);
