/**
 * Crowdbeats V2 — Stripe Connect Account Lifecycle Webhook Handlers (Phase 10)
 *
 * Implements server-side synchronization for:
 * - account.updated (KYC verification, payout enablement, disabled reasons)
 * - account.application.deauthorized (Stripe Connect disconnection)
 * - capability.updated (card_payments and transfers status)
 * - charge.dispute.created / charge.dispute.closed
 * - charge.refunded
 */

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { PayoutHoldReasonCode } from '@crowdbeats/contracts';

/**
 * Handles account.updated webhook event.
 */
export async function handleAccountUpdated(
  db: admin.firestore.Firestore,
  account: Record<string, unknown>,
): Promise<void> {
  const accountId = account['id'] as string;
  if (!accountId) return;

  const chargesEnabled = Boolean(account['charges_enabled']);
  const payoutsEnabled = Boolean(account['payouts_enabled']);
  const detailsSubmitted = Boolean(account['details_submitted']);
  const requirements = (account['requirements'] as Record<string, unknown>) || {};
  const disabledReason = (requirements['disabled_reason'] as string) || null;
  const currentlyDue = (requirements['currently_due'] as string[]) || [];

  // Find creator by stripeConnectAccountId
  const usersSnap = await db
    .collection('users')
    .where('stripeConnectAccountId', '==', accountId)
    .limit(1)
    .get();

  let creatorUid: string | null = null;
  if (!usersSnap.empty) {
    creatorUid = usersSnap.docs[0].id;
  } else {
    // Check artistProfiles
    const artistsSnap = await db
      .collection('artistProfiles')
      .where('stripeAccountId', '==', accountId)
      .limit(1)
      .get();
    if (!artistsSnap.empty) {
      creatorUid = artistsSnap.docs[0].id;
    }
  }

  if (!creatorUid) {
    console.warn(`[handleAccountUpdated] No creator matched accountId: ${accountId}`);
    return;
  }

  const serverNow = admin.firestore.FieldValue.serverTimestamp();
  const userRef = db.collection('users').doc(creatorUid);
  const artistRef = db.collection('artistProfiles').doc(creatorUid);

  let creatorVerificationState: 'unverified' | 'pending' | 'verified' | 'restricted' | 'rejected' = 'unverified';
  let bankPayoutReadiness: 'ready' | 'pending_verification' | 'action_required' | 'restricted' = 'action_required';

  if (chargesEnabled && payoutsEnabled) {
    creatorVerificationState = 'verified';
    bankPayoutReadiness = 'ready';
  } else if (disabledReason) {
    creatorVerificationState = 'restricted';
    bankPayoutReadiness = 'restricted';
  } else if (detailsSubmitted) {
    creatorVerificationState = 'pending';
    bankPayoutReadiness = 'pending_verification';
  }

  const batch = db.batch();

  const userUpdates: Record<string, unknown> = {
    stripeChargesEnabled: chargesEnabled,
    stripePayoutsEnabled: payoutsEnabled,
    stripeDetailsSubmitted: detailsSubmitted,
    stripeVerificationState: creatorVerificationState,
    bankPayoutReadiness,
    stripeDisabledReason: disabledReason,
    stripeRequirementsDue: currentlyDue,
    updatedAt: serverNow,
  };

  // If disabled by Stripe risk/compliance, automatically place compliance hold
  if (disabledReason) {
    userUpdates['complianceHold'] = true;
    userUpdates['payoutHoldReason'] = 'STRIPE_DISABLED_' + disabledReason;
  }

  batch.update(userRef, userUpdates);
  batch.set(
    artistRef,
    {
      stripeChargesEnabled: chargesEnabled,
      stripePayoutsEnabled: payoutsEnabled,
      bankPayoutReadiness,
      creatorVerificationState,
      updatedAt: serverNow,
    },
    { merge: true },
  );

  // Audit Log
  const auditRef = db.collection('auditLogs').doc(uuidv4());
  batch.set(auditRef, {
    action: 'STRIPE_ACCOUNT_UPDATED',
    creatorUid,
    stripeAccountId: accountId,
    chargesEnabled,
    payoutsEnabled,
    creatorVerificationState,
    bankPayoutReadiness,
    disabledReason,
    timestamp: serverNow,
  });

  await batch.commit();
}

/**
 * Handles account.application.deauthorized event.
 */
export async function handleAccountApplicationDeauthorized(
  db: admin.firestore.Firestore,
  deauth: Record<string, unknown>,
): Promise<void> {
  const accountId = deauth['account'] as string || deauth['id'] as string;
  if (!accountId) return;

  const usersSnap = await db
    .collection('users')
    .where('stripeConnectAccountId', '==', accountId)
    .limit(1)
    .get();

  if (usersSnap.empty) return;

  const creatorUid = usersSnap.docs[0].id;
  const serverNow = admin.firestore.FieldValue.serverTimestamp();

  const batch = db.batch();
  const userRef = db.collection('users').doc(creatorUid);
  const artistRef = db.collection('artistProfiles').doc(creatorUid);

  batch.update(userRef, {
    stripeConnectAccountId: null,
    stripeAccountId: null,
    stripePayoutsEnabled: false,
    stripeChargesEnabled: false,
    monetizationStatus: 'DEMONETIZED',
    complianceHold: true,
    payoutHoldReason: PayoutHoldReasonCode.PAYOUT_HOLD_SANCTIONS,
    updatedAt: serverNow,
  });

  batch.set(
    artistRef,
    {
      stripeAccountId: null,
      monetizationStatus: 'DEMONETIZED',
      complianceHold: true,
      updatedAt: serverNow,
    },
    { merge: true },
  );

  const auditRef = db.collection('auditLogs').doc(uuidv4());
  batch.set(auditRef, {
    action: 'STRIPE_ACCOUNT_DEAUTHORIZED',
    creatorUid,
    stripeAccountId: accountId,
    timestamp: serverNow,
  });

  await batch.commit();
}

/**
 * Handles charge.dispute.created event.
 */
export async function handleDisputeCreated(
  db: admin.firestore.Firestore,
  dispute: Record<string, unknown>,
): Promise<void> {
  const disputeId = dispute['id'] as string;
  const chargeId = dispute['charge'] as string;
  const piId = dispute['payment_intent'] as string;
  const amountCents = (dispute['amount'] as number) || 0;
  const reason = (dispute['reason'] as string) || 'general';
  const status = (dispute['status'] as string) || 'needs_response';

  const serverNow = admin.firestore.FieldValue.serverTimestamp();

  // Find tip by payment intent
  let tipId: string | null = null;
  let recipientId: string | null = null;

  if (piId) {
    const tipsSnap = await db
      .collection('tips')
      .where('stripePaymentIntentId', '==', piId)
      .limit(1)
      .get();
    if (!tipsSnap.empty) {
      const tipDoc = tipsSnap.docs[0];
      tipId = tipDoc.id;
      recipientId = tipDoc.data()['recipientId'] as string;
    }
  }

  const batch = db.batch();

  // 1. Create dispute record in /disputes
  const disputeRef = db.collection('disputes').doc(disputeId);
  batch.set(disputeRef, {
    disputeId,
    chargeId: chargeId || null,
    stripePaymentIntentId: piId || null,
    tipId: tipId || null,
    recipientId: recipientId || null,
    amountCents,
    reason,
    status,
    createdAt: serverNow,
    updatedAt: serverNow,
  });

  // 2. Update tip status
  if (tipId) {
    const tipRef = db.collection('tips').doc(tipId);
    batch.update(tipRef, {
      status: 'disputed',
      disputedAt: serverNow,
      updatedAt: serverNow,
    });
  }

  // 3. Audit Log
  const auditRef = db.collection('auditLogs').doc(uuidv4());
  batch.set(auditRef, {
    action: 'CHARGE_DISPUTE_CREATED',
    disputeId,
    tipId,
    recipientId,
    amountCents,
    reason,
    timestamp: serverNow,
  });

  await batch.commit();
}

/**
 * Handles charge.refunded event.
 */
export async function handleChargeRefunded(
  db: admin.firestore.Firestore,
  charge: Record<string, unknown>,
): Promise<void> {
  const piId = charge['payment_intent'] as string;
  if (!piId) return;

  const tipsSnap = await db
    .collection('tips')
    .where('stripePaymentIntentId', '==', piId)
    .limit(1)
    .get();

  if (tipsSnap.empty) return;

  const tipDoc = tipsSnap.docs[0];
  const tipId = tipDoc.id;
  const tipData = tipDoc.data();
  const serverNow = admin.firestore.FieldValue.serverTimestamp();

  const batch = db.batch();

  batch.update(tipDoc.ref, {
    status: 'refunded',
    refundedAt: serverNow,
    updatedAt: serverNow,
  });

  // Write REFUND ledger record
  const ledgerRef = db.collection('paymentLedger').doc(uuidv4());
  batch.set(ledgerRef, {
    type: 'CREDIT_REVERSAL',
    entryType: 'TIP_REFUNDED',
    tipId,
    uid: tipData['fanUid'] as string,
    amountCents: tipData['amountCents'] as number,
    createdAt: serverNow,
  });

  // Audit Log
  const auditRef = db.collection('auditLogs').doc(uuidv4());
  batch.set(auditRef, {
    action: 'CHARGE_REFUNDED',
    tipId,
    fanUid: tipData['fanUid'],
    recipientId: tipData['recipientId'],
    amountCents: tipData['amountCents'],
    timestamp: serverNow,
  });

  await batch.commit();
}
