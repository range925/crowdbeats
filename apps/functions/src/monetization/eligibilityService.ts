/**
 * Crowdbeats V2 — Creator Monetization Eligibility Service (Phase 3)
 *
 * Centralized, server-authoritative validator for creator monetization.
 * Enforces all compliance, Stripe Connect, policy acceptance, and moderation preconditions.
 *
 * Compliance Invariants:
 * - A creator cannot receive payments merely because the client UI displays a tip button.
 * - Backend evaluation is fail-closed across all payment creation callables.
 * - Sourced from server-authoritative records only.
 */

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import {
  CreatorMonetizationStatus,
  type MonetizationEligibilityResult,
  type MonetizationEligibilityChecklist,
} from '@crowdbeats/contracts';

export async function evaluateCreatorMonetizationEligibility(
  db: admin.firestore.Firestore,
  creatorId: string,
  creatorType: 'artist' | 'band' = 'artist',
): Promise<MonetizationEligibilityResult> {
  const reasonCodes: string[] = [];

  let userData: Record<string, unknown> | undefined;
  let profileData: Record<string, unknown> | undefined;

  if (creatorType === 'artist') {
    const [userSnap, artistSnap] = await Promise.all([
      db.collection('users').doc(creatorId).get(),
      db.collection('artistProfiles').doc(creatorId).get(),
    ]);

    if (userSnap.exists) userData = userSnap.data();
    if (artistSnap.exists) profileData = artistSnap.data();
  } else {
    // Band entity
    const bandSnap = await db.collection('bands').doc(creatorId).get();
    if (bandSnap.exists) {
      profileData = bandSnap.data();
      const founderUid = profileData?.['founderUid'] as string | undefined;
      if (founderUid) {
        const founderSnap = await db.collection('users').doc(founderUid).get();
        if (founderSnap.exists) userData = founderSnap.data();
      }
    }
  }

  // 1. Account existence & active status
  const activeAccount = Boolean(
    userData &&
    !userData['deletedAt'] &&
    (creatorType === 'band' ? Boolean(profileData && !profileData['deletedAt']) : true)
  );
  if (!activeAccount) reasonCodes.push('ACCOUNT_INACTIVE_OR_DELETED');

  // 2. Supported creator role
  const personaType = userData?.['personaType'] as string | undefined;
  const supportedRole = creatorType === 'band'
    ? Boolean(profileData && profileData['isActive'] !== false)
    : (personaType === 'artist' || personaType === 'band_member');
  if (!supportedRole) reasonCodes.push('UNSUPPORTED_CREATOR_ROLE');

  // 3. Policy acceptances
  // Accept if recorded on user or consent collection
  const acceptedTerms = Boolean(
    userData?.['termsAccepted'] === true ||
    userData?.['onboardedAt'] ||
    userData?.['consents']
  );
  if (!acceptedTerms) reasonCodes.push('TERMS_OF_SERVICE_NOT_ACCEPTED');

  const acceptedAup = Boolean(
    userData?.['aupAccepted'] === true ||
    userData?.['onboardedAt']
  );
  if (!acceptedAup) reasonCodes.push('ACCEPTABLE_USE_POLICY_NOT_ACCEPTED');

  const acceptedMonetizationPolicy = Boolean(
    userData?.['monetizationPolicyAccepted'] === true ||
    userData?.['onboardedAt']
  );
  if (!acceptedMonetizationPolicy) reasonCodes.push('CREATOR_MONETIZATION_POLICY_NOT_ACCEPTED');

  // 4. Stripe Connect Account exists and is charges-enabled
  const stripeConnectAccountId = (creatorType === 'band'
    ? (profileData?.['stripeAccountId'] || userData?.['stripeConnectAccountId'])
    : userData?.['stripeConnectAccountId'] || profileData?.['stripeAccountId']) as string | undefined;

  const stripeConnectedAccountExists = Boolean(stripeConnectAccountId && stripeConnectAccountId.length > 0);
  if (!stripeConnectedAccountExists) reasonCodes.push('STRIPE_CONNECT_ACCOUNT_MISSING');

  const chargesEnabled = Boolean(
    userData?.['chargesEnabled'] === true ||
    profileData?.['chargesEnabled'] === true ||
    userData?.['connectStatus'] === 'active' ||
    profileData?.['bankLinked'] === true
  );
  const stripeChargesEnabled = stripeConnectedAccountExists && chargesEnabled;
  if (stripeConnectedAccountExists && !chargesEnabled) reasonCodes.push('STRIPE_CHARGES_DISABLED');

  // 5. Account not suspended
  const notSuspended = Boolean(
    !userData?.['isSuspended'] &&
    !userData?.['suspendedAt'] &&
    !profileData?.['isSuspended'] &&
    !profileData?.['suspendedAt']
  );
  if (!notSuspended) reasonCodes.push('CREATOR_SUSPENDED');

  // 6. Creator not demonetized
  const notDemonetized = Boolean(
    userData?.['monetizationStatus'] !== 'DEMONETIZED' &&
    profileData?.['monetizationStatus'] !== 'DEMONETIZED' &&
    userData?.['isDemonetized'] !== true &&
    profileData?.['isDemonetized'] !== true
  );
  if (!notDemonetized) reasonCodes.push('CREATOR_DEMONETIZED');

  // 7. No compliance hold
  const noComplianceHold = Boolean(
    !userData?.['complianceHold'] &&
    !profileData?.['complianceHold'] &&
    !userData?.['payoutHoldReason'] &&
    !profileData?.['payoutHoldReason']
  );
  if (!noComplianceHold) reasonCodes.push('COMPLIANCE_HOLD_ACTIVE');

  // 8. Profile approved
  const profileApproved = Boolean(
    profileData?.['isActive'] !== false &&
    profileData?.['moderationStatus'] !== 'REMOVED' &&
    profileData?.['moderationStatus'] !== 'REJECTED'
  );
  if (!profileApproved) reasonCodes.push('PROFILE_NOT_APPROVED');

  const checklist: MonetizationEligibilityChecklist = {
    activeAccount,
    supportedRole,
    acceptedTerms,
    acceptedAup,
    acceptedMonetizationPolicy,
    stripeConnectedAccountExists,
    stripeChargesEnabled,
    notSuspended,
    notDemonetized,
    noComplianceHold,
    profileApproved,
  };

  // Determine overall status
  let status: CreatorMonetizationStatus = CreatorMonetizationStatus.ACTIVE;

  if (!activeAccount) {
    status = CreatorMonetizationStatus.TERMINATED;
  } else if (!notSuspended) {
    status = CreatorMonetizationStatus.SUSPENDED;
  } else if (!notDemonetized) {
    status = CreatorMonetizationStatus.DEMONETIZED;
  } else if (!noComplianceHold) {
    status = CreatorMonetizationStatus.PAYOUT_HOLD;
  } else if (!stripeConnectedAccountExists || !stripeChargesEnabled) {
    status = CreatorMonetizationStatus.PENDING_STRIPE;
  } else if (!acceptedTerms || !acceptedAup || !acceptedMonetizationPolicy) {
    status = CreatorMonetizationStatus.PENDING_POLICY_ACCEPTANCE;
  } else if (!profileApproved) {
    status = CreatorMonetizationStatus.PENDING_MODERATION;
  } else if (!supportedRole) {
    status = CreatorMonetizationStatus.NOT_ELIGIBLE;
  }

  const isEligible = status === CreatorMonetizationStatus.ACTIVE;

  return {
    isEligible,
    status,
    creatorId,
    creatorType,
    reasonCodes,
    checklist,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Server-authoritative assertion that throws an HttpsError if the creator is not eligible to receive payments.
 * Fails closed on any compliance violation.
 */
export async function assertCreatorMayMonetize(
  db: admin.firestore.Firestore,
  creatorId: string,
  creatorType: 'artist' | 'band' = 'artist',
): Promise<MonetizationEligibilityResult> {
  const result = await evaluateCreatorMonetizationEligibility(db, creatorId, creatorType);

  if (!result.isEligible) {
    throw new HttpsError(
      'failed-precondition',
      `Creator ${creatorId} is not eligible to monetize. Status: ${result.status}. Reasons: ${result.reasonCodes.join(', ')}`,
      {
        status: result.status,
        reasonCodes: result.reasonCodes,
        checklist: result.checklist,
      },
    );
  }

  return result;
}
