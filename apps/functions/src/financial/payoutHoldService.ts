/**
 * Crowdbeats V2 — Payout Hold & Financial Isolation Service (Phase 9)
 *
 * Implements server-authoritative financial holds, reason code management,
 * Stripe Connect payout pausing, and hold release lifecycles.
 *
 * Compliance Invariants:
 * - When an active payout hold exists, complianceHold is true and payouts are frozen.
 * - Explicit reason codes are tracked and logged immutably.
 * - Releasing a hold verifies whether any other active holds remain before clearing complianceHold.
 * - Stripe Connect accounts have payouts paused/unpaused in sync with hold state.
 */

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import {
  type PayoutHoldRecord,
  type ApplyPayoutHoldRequest,
  type ReleasePayoutHoldRequest,
  type PayoutHoldStatusResponse,
} from '@crowdbeats/contracts';
import { stripe } from '../lib/stripe.js';

/**
 * Applies a financial payout hold to a creator.
 */
export async function applyPayoutHold(
  db: admin.firestore.Firestore,
  actorUid: string,
  request: ApplyPayoutHoldRequest,
): Promise<PayoutHoldRecord> {
  const { creatorId, creatorType = 'artist', reasonCode, notes } = request;

  if (!creatorId || !reasonCode) {
    throw new Error('creatorId and reasonCode are required.');
  }

  const serverNow = admin.firestore.FieldValue.serverTimestamp();
  const nowStr = new Date().toISOString();
  const holdId = uuidv4();

  const userRef = db.collection('users').doc(creatorId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error(`Creator ${creatorId} not found.`);
  }

  const userData = userSnap.data() || {};
  const stripeConnectAccountId = (userData['stripeConnectAccountId'] as string) || (userData['stripeAccountId'] as string);

  const holdRecord: PayoutHoldRecord = {
    holdId,
    creatorId,
    creatorType,
    reasonCode,
    notes: notes?.trim() || undefined,
    appliedByUid: actorUid,
    appliedAt: nowStr,
    status: 'ACTIVE',
  };

  const batch = db.batch();

  // 1. Save global hold record
  const holdRef = db.collection('payoutHolds').doc(holdId);
  batch.set(holdRef, {
    ...holdRecord,
    serverCreatedAt: serverNow,
  });

  // 2. Save user-scoped hold record
  const userHoldRef = db.collection('users').doc(creatorId).collection('payoutHolds').doc(holdId);
  batch.set(userHoldRef, {
    ...holdRecord,
    serverCreatedAt: serverNow,
  });

  // 3. Update User & Artist Profile complianceHold flags
  batch.update(userRef, {
    complianceHold: true,
    payoutHoldReason: reasonCode,
    payoutHoldNotes: notes?.trim() || null,
    updatedAt: serverNow,
  });

  if (creatorType === 'artist') {
    const artistRef = db.collection('artistProfiles').doc(creatorId);
    batch.set(artistRef, { complianceHold: true, payoutHoldReason: reasonCode, updatedAt: serverNow }, { merge: true });
  }

  // 4. Record Audit Log
  const auditRef = db.collection('auditLogs').doc(uuidv4());
  batch.set(auditRef, {
    action: `PAYOUT_HOLD_APPLIED_${reasonCode}`,
    actorUid,
    creatorId,
    creatorType,
    holdId,
    reasonCode,
    notes: notes?.trim() || null,
    timestamp: serverNow,
  });

  await batch.commit();

  // 5. Pause Stripe Connect Payouts if account exists
  if (stripeConnectAccountId) {
    try {
      await stripe.updateAccountPayouts(stripeConnectAccountId, true);
    } catch (err) {
      console.warn(`[applyPayoutHold] Failed to pause Stripe payouts for ${stripeConnectAccountId}:`, err);
    }
  }

  return holdRecord;
}

/**
 * Releases a financial payout hold.
 */
export async function releasePayoutHold(
  db: admin.firestore.Firestore,
  actorUid: string,
  request: ReleasePayoutHoldRequest,
): Promise<{ success: boolean; remainingActiveHolds: number }> {
  const { holdId, notes } = request;

  if (!holdId) {
    throw new Error('holdId is required.');
  }

  const holdRef = db.collection('payoutHolds').doc(holdId);
  const holdSnap = await holdRef.get();

  if (!holdSnap.exists) {
    throw new Error(`Payout hold ${holdId} not found.`);
  }

  const hold = holdSnap.data() as PayoutHoldRecord;
  const creatorId = hold.creatorId;
  const serverNow = admin.firestore.FieldValue.serverTimestamp();
  const nowStr = new Date().toISOString();

  // Fetch all active holds for this creator to check if others remain
  const otherHoldsSnap = await db
    .collection('payoutHolds')
    .where('creatorId', '==', creatorId)
    .where('status', '==', 'ACTIVE')
    .get();

  const remainingActive = otherHoldsSnap.docs.filter((d) => d.id !== holdId);
  const remainingCount = remainingActive.length;

  const batch = db.batch();

  // 1. Update hold record to RELEASED
  batch.update(holdRef, {
    status: 'RELEASED',
    releasedByUid: actorUid,
    releasedAt: nowStr,
    releaseNotes: notes?.trim() || null,
    serverUpdatedAt: serverNow,
  });

  const userHoldRef = db.collection('users').doc(creatorId).collection('payoutHolds').doc(holdId);
  batch.update(userHoldRef, {
    status: 'RELEASED',
    releasedByUid: actorUid,
    releasedAt: nowStr,
    releaseNotes: notes?.trim() || null,
    serverUpdatedAt: serverNow,
  });

  const userRef = db.collection('users').doc(creatorId);
  const artistRef = db.collection('artistProfiles').doc(creatorId);

  // 2. If no remaining active holds, clear complianceHold on creator
  if (remainingCount === 0) {
    batch.update(userRef, {
      complianceHold: false,
      payoutHoldReason: null,
      payoutHoldNotes: null,
      updatedAt: serverNow,
    });
    batch.set(artistRef, { complianceHold: false, payoutHoldReason: null, updatedAt: serverNow }, { merge: true });
  } else {
    // Set reason to the next active hold reason
    const nextHold = remainingActive[0].data() as PayoutHoldRecord;
    batch.update(userRef, {
      payoutHoldReason: nextHold.reasonCode,
      updatedAt: serverNow,
    });
  }

  // 3. Audit Log
  const auditRef = db.collection('auditLogs').doc(uuidv4());
  batch.set(auditRef, {
    action: `PAYOUT_HOLD_RELEASED_${hold.reasonCode}`,
    actorUid,
    creatorId,
    holdId,
    remainingActiveHolds: remainingCount,
    notes: notes?.trim() || null,
    timestamp: serverNow,
  });

  await batch.commit();

  // 4. If no remaining holds, unpause Stripe payouts
  if (remainingCount === 0) {
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};
    const stripeConnectAccountId = (userData['stripeConnectAccountId'] as string) || (userData['stripeAccountId'] as string);

    if (stripeConnectAccountId) {
      try {
        await stripe.updateAccountPayouts(stripeConnectAccountId, false);
      } catch (err) {
        console.warn(`[releasePayoutHold] Failed to unpause Stripe payouts for ${stripeConnectAccountId}:`, err);
      }
    }
  }

  return { success: true, remainingActiveHolds: remainingCount };
}

/**
 * Retrieves the comprehensive payout hold status for a creator.
 */
export async function getPayoutHoldStatus(
  db: admin.firestore.Firestore,
  creatorId: string,
): Promise<PayoutHoldStatusResponse> {
  const holdsSnap = await db
    .collection('payoutHolds')
    .where('creatorId', '==', creatorId)
    .where('status', '==', 'ACTIVE')
    .get();

  const activeHolds: PayoutHoldRecord[] = [];
  for (const doc of holdsSnap.docs) {
    activeHolds.push(doc.data() as PayoutHoldRecord);
  }

  const isHeld = activeHolds.length > 0;
  const primaryReasonCode = isHeld ? activeHolds[0].reasonCode : undefined;

  return {
    creatorId,
    isHeld,
    activeHolds,
    primaryReasonCode,
    totalActiveHolds: activeHolds.length,
  };
}
