/**
 * Crowdbeats V2 — getBandTreasury (Phase 8)
 *
 * Callable: getBandTreasury
 *
 * Returns the read model for the band's treasury:
 * - Gross tips received by band
 * - Net distributed tips to each member
 * - Member balances (available vs pending KYC onboarding)
 * - Member Stripe Connect status
 * - Current active split configuration version
 *
 * Auth: caller must be an active member of the band
 * Returns: BandTreasurySummary
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

export const getBandTreasury = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;
    const bandId = data['bandId'] as string | undefined;

    if (!bandId || typeof bandId !== 'string') {
      throw new HttpsError('invalid-argument', 'bandId is required.');
    }

    const bandRef = _db().collection('bands').doc(bandId);
    const bandSnap = await bandRef.get();
    if (!bandSnap.exists) {
      throw new HttpsError('not-found', 'Band not found.');
    }

    // 1. Verify caller is an active member or authorized staff
    const callerPlatformRole = (request.auth.token?.['role'] as string) || '';
    const isStaff = ['SUPER_ADMIN', 'CUSTOMER_SUPPORT', 'FINANCE_ANALYST'].includes(callerPlatformRole);

    const callerMemberDoc = await bandRef.collection('members').doc(uid).get();
    const isMember = callerMemberDoc.exists && callerMemberDoc.data()?.['isActive'] === true;

    if (!isMember && !isStaff) {
      throw new HttpsError('permission-denied', 'You are not an active member of this band.');
    }

    const callerRole = callerMemberDoc.exists ? (callerMemberDoc.data()?.['role'] as string) : 'STAFF';
    const isOwnerOrAdmin = ['BAND_FOUNDER', 'BAND_ADMIN'].includes(callerRole) || isStaff;

    const band = bandSnap.data()!;
    const totalTipsReceivedCents = (band['totalTipsReceivedCents'] as number) || 0;
    const platformFeesPaidCents = Math.floor((totalTipsReceivedCents * 500) / 10000);
    const netDistributedCents = totalTipsReceivedCents - platformFeesPaidCents;

    // 2. Fetch current split config
    const currentSplitSnap = await bandRef.collection('splitConfig').doc('current').get();
    const currentSplitVersion = currentSplitSnap.exists ? (currentSplitSnap.data()?.['version'] as number) || 1 : 1;
    const splitMap = new Map<string, number>();
    if (currentSplitSnap.exists) {
      const splits = (currentSplitSnap.data()?.['splits'] as Array<{ uid: string; splitBps: number }>) || [];
      for (const s of splits) {
        splitMap.set(s.uid, s.splitBps);
      }
    }

    // 3. Fetch active members with strict Payout-Data Isolation
    const membersSnap = await bandRef.collection('members').where('isActive', '==', true).get();
    const memberSummaries = await Promise.all(
      membersSnap.docs.map(async (doc) => {
        const mData = doc.data();
        const mUid = doc.id;
        const isSelf = mUid === uid;

        // Fetch user document for KYC and balances
        const userDoc = await _db().collection('users').doc(mUid).get();
        const uData = userDoc.exists ? userDoc.data()! : {};

        const chargesEnabled = (uData['stripeChargesEnabled'] as boolean) || false;
        const payoutsEnabled = (uData['stripePayoutsEnabled'] as boolean) || false;
        const availableBalanceCents = (uData['availableBalanceCents'] as number) || 0;
        const pendingKycBalanceCents = (uData['pendingKycBalanceCents'] as number) || 0;
        const totalEarnedCents = (uData['totalEarnedCents'] as number) || 0;

        // PAYOUT-DATA ISOLATION:
        // - Self: Full view of personal balance, KYC, and earnings.
        // - Owner / Admin: View member KYC readiness (charges/payoutsEnabled) and earnings, but isolate private wallet balances.
        // - Regular Member: Zero visibility into other members' balances, earnings, or KYC statuses.
        const canViewFinancials = isSelf;
        const canViewKycStatus = isSelf || isOwnerOrAdmin;

        return {
          uid: mUid,
          displayName: (mData['displayName'] as string) || 'Member',
          role: (mData['role'] as string) || 'BAND_MEMBER',
          splitBps: splitMap.get(mUid) || 0,
          totalEarnedCents: canViewFinancials ? totalEarnedCents : 0,
          availableBalanceCents: canViewFinancials ? availableBalanceCents : 0,
          pendingKycBalanceCents: canViewFinancials ? pendingKycBalanceCents : 0,
          stripeChargesEnabled: canViewKycStatus ? chargesEnabled : false,
          stripePayoutsEnabled: canViewKycStatus ? payoutsEnabled : false,
        };
      }),
    );

    return {
      bandId,
      totalTipsReceivedCents,
      platformFeesPaidCents,
      netDistributedCents,
      currentSplitVersion,
      members: memberSummaries,
    };
  },
);
