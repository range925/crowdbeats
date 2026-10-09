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
  const accountId = (typeof account['account'] === 'string' && account['account'])
    ? account['account']
    : (account['id'] as string);
  if (!accountId) return;

  // Find creator by stripeConnectAccountId
  const usersSnap = await db
    .collection('users')
    .where('stripeConnectAccountId', '==', accountId)
    .limit(1)
    .get();

  let creatorUid: string | null = null;
  let existingUserData: Record<string, unknown> | null = null;
  if (!usersSnap.empty) {
    creatorUid = usersSnap.docs[0].id;
    existingUserData = usersSnap.docs[0].data();
  } else {
    // Check artistProfiles
    const artistsSnap = await db
      .collection('artistProfiles')
      .where('stripeAccountId', '==', accountId)
      .limit(1)
      .get();
    if (!artistsSnap.empty) {
      creatorUid = artistsSnap.docs[0].id;
      existingUserData = artistsSnap.docs[0].data();
    }
  }

  if (!creatorUid) {
    console.warn(`[handleAccountUpdated] No creator matched accountId: ${accountId}`);
    return;
  }

  const isCapability = account['object'] === 'capability' || account['id'] === 'transfers' || account['id'] === 'card_payments';
  const capId = account['id'] as string;
  const isCapActive = account['status'] === 'active';

  const chargesEnabled = isCapability
    ? (capId === 'card_payments' ? isCapActive : Boolean(existingUserData?.['stripeChargesEnabled']))
    : Boolean(account['charges_enabled']);

  const payoutsEnabled = isCapability
    ? (capId === 'transfers' ? isCapActive : Boolean(existingUserData?.['stripePayoutsEnabled']))
    : Boolean(account['payouts_enabled']);

  const detailsSubmitted = isCapability
    ? Boolean(existingUserData?.['stripeDetailsSubmitted'] ?? true)
    : Boolean(account['details_submitted']);

  const requirements = (account['requirements'] as Record<string, unknown>) || {};
  const disabledReason = (requirements['disabled_reason'] as string) || null;
  const currentlyDue = (requirements['currently_due'] as string[]) || [];

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

/**
 * Helper to resolve the Firestore document in 'payouts' corresponding to a Stripe payout/transfer event.
 */
async function _findPayoutDoc(
  db: admin.firestore.Firestore,
  payoutObj: Record<string, unknown>,
): Promise<admin.firestore.DocumentSnapshot | null> {
  const metadata = (payoutObj['metadata'] as Record<string, string> | undefined) || {};
  const payoutIdFromMeta = metadata['payoutId'];
  if (payoutIdFromMeta) {
    const docRef = db.collection('payouts').doc(payoutIdFromMeta);
    const snap = await docRef.get();
    if (snap.exists) return snap;
  }

  const payoutObjId = payoutObj['id'] as string | undefined;
  if (payoutObjId) {
    const docRef = db.collection('payouts').doc(payoutObjId);
    const snap = await docRef.get();
    if (snap.exists) return snap;
  }

  if (payoutObjId) {
    const qSnap = await db.collection('payouts').where('stripeTransferId', '==', payoutObjId).limit(1).get();
    if (!qSnap.empty) return qSnap.docs[0];
  }

  const transferId = payoutObj['transfer'] as string | undefined;
  if (transferId) {
    const qSnap = await db.collection('payouts').where('stripeTransferId', '==', transferId).limit(1).get();
    if (!qSnap.empty) return qSnap.docs[0];
  }

  const metaTransferId = metadata['stripeTransferId'];
  if (metaTransferId) {
    const qSnap = await db.collection('payouts').where('stripeTransferId', '==', metaTransferId).limit(1).get();
    if (!qSnap.empty) return qSnap.docs[0];
  }

  if (payoutObjId) {
    const qSnap = await db.collection('payouts').where('stripePayoutId', '==', payoutObjId).limit(1).get();
    if (!qSnap.empty) return qSnap.docs[0];
  }

  return null;
}

/**
 * Handles payout.paid webhook event.
 * Finds corresponding document in `payouts` collection (by stripeTransferId or id),
 * updates status to `paid` or `completed`, and records arrival date / timestamp.
 */
export async function handlePayoutPaid(
  db: admin.firestore.Firestore,
  payoutObj: Record<string, unknown>,
): Promise<void> {
  const payoutDoc = await _findPayoutDoc(db, payoutObj);
  if (!payoutDoc) {
    console.warn(`[handlePayoutPaid] No payout document matched: ${payoutObj['id']}`);
    return;
  }

  const serverNow = admin.firestore.FieldValue.serverTimestamp();
  const arrivalDateRaw = payoutObj['arrival_date'];
  let arrivalDate: admin.firestore.Timestamp | null = null;
  if (typeof arrivalDateRaw === 'number') {
    arrivalDate = admin.firestore.Timestamp.fromMillis(arrivalDateRaw * 1000);
  } else if (arrivalDateRaw instanceof Date) {
    arrivalDate = admin.firestore.Timestamp.fromDate(arrivalDateRaw);
  }

  const updates: Record<string, unknown> = {
    status: 'paid',
    paidAt: serverNow,
    updatedAt: serverNow,
  };
  if (arrivalDate) {
    updates['arrivalDate'] = arrivalDate;
  }
  if (payoutObj['id']) {
    updates['stripePayoutId'] = payoutObj['id'];
  }

  await payoutDoc.ref.update(updates);

  // Audit Log
  const auditRef = db.collection('auditLogs').doc(uuidv4());
  await auditRef.set({
    action: 'PAYOUT_PAID',
    payoutId: payoutDoc.id,
    stripePayoutId: payoutObj['id'] || null,
    amountCents: payoutDoc.data()?.['amountCents'] ?? payoutObj['amount'] ?? null,
    recipientId: payoutDoc.data()?.['recipientId'] ?? null,
    timestamp: serverNow,
  });
}

/**
 * Handles payout.failed webhook event.
 * Finds corresponding document in `payouts`, marks as `failed`, records failure reason,
 * and runs a Firestore transaction to refund `availableBalanceCents` back to the creator's
 * `artistProfiles/{uid}` document so funds are not lost!
 */
export async function handlePayoutFailed(
  db: admin.firestore.Firestore,
  payoutObj: Record<string, unknown>,
): Promise<void> {
  const payoutDoc = await _findPayoutDoc(db, payoutObj);
  if (!payoutDoc) {
    console.warn(`[handlePayoutFailed] No payout document matched: ${payoutObj['id']}`);
    return;
  }

  const payoutId = payoutDoc.id;
  const payoutRef = db.collection('payouts').doc(payoutId);
  const failureReason =
    (payoutObj['failure_message'] as string) ||
    (payoutObj['failure_code'] as string) ||
    'Payout delivery failed';
  const failureCode = (payoutObj['failure_code'] as string) || null;
  const serverNow = admin.firestore.FieldValue.serverTimestamp();

  const executeRefund = async (
    pData: Record<string, unknown>,
    updatePayout: (data: Record<string, unknown>) => Promise<unknown> | unknown,
    updateArtist: (ref: admin.firestore.DocumentReference, data: Record<string, unknown>) => Promise<unknown> | unknown,
    setLedger: (ref: admin.firestore.DocumentReference, data: Record<string, unknown>) => Promise<unknown> | unknown,
    setAudit: (ref: admin.firestore.DocumentReference, data: Record<string, unknown>) => Promise<unknown> | unknown,
  ) => {
    // Idempotency: don't refund if already failed/refunded
    if (pData['status'] === 'failed' && pData['refundedAt']) {
      return;
    }

    const metadata = (payoutObj['metadata'] as Record<string, string> | undefined) || {};
    const recipientId = (pData['recipientId'] as string) || (metadata['creatorId'] as string) || (metadata['uid'] as string);
    const amountCents = (pData['amountCents'] as number) || (payoutObj['amount'] as number) || 0;

    await updatePayout({
      status: 'failed',
      failureReason,
      failureCode,
      stripePayoutId: payoutObj['id'] || null,
      refundedAt: serverNow,
      updatedAt: serverNow,
    });

    if (recipientId && amountCents > 0) {
      const artistRef = db.collection('artistProfiles').doc(recipientId);
      await updateArtist(artistRef, {
        availableBalanceCents: admin.firestore.FieldValue.increment(amountCents),
        totalPaidOutCents: admin.firestore.FieldValue.increment(-amountCents),
        updatedAt: serverNow,
      });

      const ledgerRef = db.collection('paymentLedger').doc(uuidv4());
      await setLedger(ledgerRef, {
        type: 'CREDIT',
        entryType: 'PAYOUT_REVERSAL',
        payoutId,
        uid: recipientId,
        amountCents,
        reason: failureReason,
        createdAt: serverNow,
      });
    }

    const auditRef = db.collection('auditLogs').doc(uuidv4());
    await setAudit(auditRef, {
      action: 'PAYOUT_FAILED',
      payoutId,
      creatorUid: recipientId || null,
      amountCents,
      failureReason,
      failureCode,
      timestamp: serverNow,
    });
  };

  if (typeof db.runTransaction === 'function') {
    await db.runTransaction(async (tx) => {
      const pSnap = await tx.get(payoutRef);
      if (!pSnap.exists) return;
      const pData = pSnap.data()!;
      await executeRefund(
        pData,
        (data) => tx.update(payoutRef, data),
        (ref, data) => tx.set(ref, data, { merge: true }),
        (ref, data) => tx.set(ref, data),
        (ref, data) => tx.set(ref, data),
      );
    });
  } else {
    const pSnap = await payoutRef.get();
    if (!pSnap.exists) return;
    const pData = pSnap.data()!;
    await executeRefund(
      pData,
      (data) => payoutRef.update(data),
      (ref, data) => ref.set(data, { merge: true }),
      (ref, data) => ref.set(data),
      (ref, data) => ref.set(data),
    );
  }
}

/**
 * Handles capability.updated event.
 */
export async function handleCapabilityUpdated(
  db: admin.firestore.Firestore,
  capability: Record<string, unknown>,
  connectedAccountId?: string,
): Promise<void> {
  const accountId = connectedAccountId || (capability['account'] as string);
  if (!accountId) return;

  const capId = (capability['id'] as string) || '';
  const capStatus = (capability['status'] as string) || 'inactive';

  const usersSnap = await db
    .collection('users')
    .where('stripeConnectAccountId', '==', accountId)
    .limit(1)
    .get();

  if (usersSnap.empty) return;
  const creatorUid = usersSnap.docs[0].id;
  const serverNow = admin.firestore.FieldValue.serverTimestamp();

  const userUpdates: Record<string, unknown> = {
    [`capabilities.${capId}`]: capStatus,
    updatedAt: serverNow,
  };

  if (capId === 'transfers') {
    userUpdates['stripePayoutsEnabled'] = capStatus === 'active';
  } else if (capId === 'card_payments') {
    userUpdates['stripeChargesEnabled'] = capStatus === 'active';
  }

  const batch = db.batch();
  batch.update(db.collection('users').doc(creatorUid), userUpdates);
  batch.set(
    db.collection('artistProfiles').doc(creatorUid),
    {
      [`capabilities.${capId}`]: capStatus,
      updatedAt: serverNow,
    },
    { merge: true },
  );

  const auditRef = db.collection('auditLogs').doc(uuidv4());
  batch.set(auditRef, {
    action: 'STRIPE_CAPABILITY_UPDATED',
    creatorUid,
    stripeAccountId: accountId,
    capabilityId: capId,
    capabilityStatus: capStatus,
    timestamp: serverNow,
  });

  await batch.commit();
}
