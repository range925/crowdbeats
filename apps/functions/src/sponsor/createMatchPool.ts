/**
 * Crowdbeats V2 — Create Sponsor Match Pool Cloud Function (Phase 9)
 *
 * Callable function to create a live tip match pool for an artist or band:
 * - Verifies caller has `SPONSOR_ADMIN` or `SPONSOR_REP` role
 * - Enforces escrow balance availability (no negative balance)
 * - Atomically draws down availableEscrowCents to fund the match pool
 * - Creates `/matchPools/{poolId}`
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const createMatchPool = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid } = request.auth;
    const { orgId, recipientId, recipientType, totalPoolCents, matchRatioBps, perTipCapCents, durationDays } = request.data || {};

    if (!orgId || typeof orgId !== 'string') {
      throw new HttpsError('invalid-argument', 'Organization ID is required.');
    }
    if (!recipientId || typeof recipientId !== 'string') {
      throw new HttpsError('invalid-argument', 'Recipient ID is required.');
    }
    if (!['artist', 'band'].includes(recipientType)) {
      throw new HttpsError('invalid-argument', 'Recipient type must be "artist" or "band".');
    }
    if (typeof totalPoolCents !== 'number' || totalPoolCents < 1000) {
      throw new HttpsError('invalid-argument', 'Minimum match pool is $10.00 (1000 cents).');
    }
    if (typeof matchRatioBps !== 'number' || matchRatioBps <= 0 || matchRatioBps > 50000) {
      throw new HttpsError('invalid-argument', 'Match ratio must be between 1 and 50000 bps (500%).');
    }

    const db = admin.firestore();

    // 1. Verify caller has membership in org
    const memberDoc = await db.collection('sponsorOrgs').doc(orgId).collection('members').doc(uid).get();
    if (!memberDoc.exists || !memberDoc.data()?.isActive) {
      throw new HttpsError('permission-denied', 'You are not a member of this Sponsor Organization.');
    }

    const orgRef = db.collection('sponsorOrgs').doc(orgId);
    const poolRef = db.collection('matchPools').doc();
    const poolId = poolRef.id;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const expiresAt = new Date(Date.now() + (durationDays || 30) * 24 * 60 * 60 * 1000).toISOString();

    return db.runTransaction(async (transaction) => {
      const orgSnap = await transaction.get(orgRef);
      if (!orgSnap.exists || !orgSnap.data()?.isActive) {
        throw new HttpsError('not-found', 'Sponsor organization not found.');
      }

      const orgData = orgSnap.data()!;
      const availableEscrow = orgData.availableEscrowCents || 0;

      // Invariant: No balance can go below zero
      if (availableEscrow < totalPoolCents) {
        throw new HttpsError(
          'failed-precondition',
          `Insufficient available escrow ($${(availableEscrow / 100).toFixed(2)}). Need $${(totalPoolCents / 100).toFixed(2)}.`
        );
      }

      // Draw down available escrow
      transaction.update(orgRef, {
        availableEscrowCents: availableEscrow - totalPoolCents,
        updatedAt: now,
      });

      // Create match pool document
      transaction.set(poolRef, {
        poolId,
        orgId,
        recipientId,
        recipientType,
        status: 'active',
        totalPoolCents,
        remainingPoolCents: totalPoolCents,
        matchRatioBps,
        perTipCapCents: perTipCapCents || null,
        startsAt: new Date().toISOString(),
        expiresAt,
        createdByUid: uid,
        createdAt: now,
        updatedAt: now,
      });

      return {
        success: true,
        poolId,
        totalPoolCents,
        remainingEscrowCents: availableEscrow - totalPoolCents,
        message: `Match pool successfully activated for $${(totalPoolCents / 100).toFixed(2)}.`,
      };
    });
  }
);
