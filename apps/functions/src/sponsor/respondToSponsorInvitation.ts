/**
 * Crowdbeats V2 — Respond to Sponsor Invitation Cloud Function (Phase 9)
 *
 * Callable function for responding (accept / decline) to a sponsor invite:
 * - Validates 7-day expiration
 * - Ensures respondent email matches inviteeEmail
 * - Atomically adds user to `/sponsorOrgs/{orgId}/members/{uid}` on accept
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const respondToSponsorInvitation = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const userEmail = (token.email || '').toLowerCase();
    const { invitationId, action } = request.data || {};

    if (!invitationId || typeof invitationId !== 'string') {
      throw new HttpsError('invalid-argument', 'Invitation ID is required.');
    }
    if (!action || !['accept', 'decline'].includes(action)) {
      throw new HttpsError('invalid-argument', 'Action must be "accept" or "decline".');
    }

    const db = admin.firestore();
    const globalInviteDoc = await db.collection('invitations').doc(invitationId).get();

    if (!globalInviteDoc.exists) {
      throw new HttpsError('not-found', 'Invitation not found.');
    }

    const inviteData = globalInviteDoc.data()!;
    if (inviteData.type !== 'sponsor') {
      throw new HttpsError('invalid-argument', 'Invitation is not a sponsor invitation.');
    }
    if (inviteData.status !== 'pending') {
      throw new HttpsError('failed-precondition', `Invitation is already ${inviteData.status}.`);
    }

    // 1. Check TTL expiry
    const expiresAtMs = new Date(inviteData.expiresAt).getTime();
    if (Date.now() > expiresAtMs) {
      await db.collection('invitations').doc(invitationId).update({ status: 'expired' });
      throw new HttpsError('deadline-exceeded', 'This invitation has expired.');
    }

    // 2. Verify email matches authenticated user
    if (userEmail !== inviteData.inviteeEmail) {
      throw new HttpsError('permission-denied', `Invitation was sent to ${inviteData.inviteeEmail}, but you are signed in as ${userEmail}.`);
    }

    const orgId = inviteData.orgId;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();

    const subInviteRef = db.collection('sponsorOrgs').doc(orgId).collection('invitations').doc(invitationId);
    const globalInviteRef = db.collection('invitations').doc(invitationId);

    if (action === 'decline') {
      batch.update(subInviteRef, { status: 'declined', respondedAt: now });
      batch.update(globalInviteRef, { status: 'declined', respondedAt: now });
      await batch.commit();
      return { success: true, action: 'declined', message: 'Invitation declined.' };
    }

    // Accept flow:
    const memberRef = db.collection('sponsorOrgs').doc(orgId).collection('members').doc(uid);
    const orgRef = db.collection('sponsorOrgs').doc(orgId);

    batch.set(memberRef, {
      uid,
      orgId,
      role: inviteData.role,
      displayName: token.name || 'Sponsor Team Member',
      joinedAt: now,
      invitedByUid: inviteData.invitedByUid,
      isActive: true,
    });

    batch.update(orgRef, {
      memberCount: admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });

    batch.update(subInviteRef, { status: 'accepted', respondedAt: now });
    batch.update(globalInviteRef, { status: 'accepted', respondedAt: now });

    await batch.commit();

    return {
      success: true,
      action: 'accepted',
      orgId,
      message: `You have successfully joined ${inviteData.orgName}.`,
    };
  }
);
