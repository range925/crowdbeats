/**
 * Crowdbeats V2 — respondToBandInvitation (Phase 8)
 *
 * Callable: respondToBandInvitation
 *
 * Accepts or declines an invitation.
 * On accept:
 * - Validates invitation is pending and not expired (< 7 days)
 * - Checks that caller's email matches inviteeEmail
 * - Adds caller to `/bands/{bandId}/members/{callerUid}`
 * - Increments `memberCount`
 * - Updates invitation status to `accepted`
 * - Writes audit log
 *
 * On decline:
 * - Updates invitation status to `declined`
 *
 * Auth: authenticated user matching invitation email
 * Returns: { ok: true, status }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

export const respondToBandInvitation = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const email = (request.auth.token['email'] as string | undefined)?.toLowerCase();
    const data = request.data as Record<string, unknown>;

    const invitationId = data['invitationId'] as string | undefined;
    const response = data['response'] as string | undefined;

    if (!invitationId || typeof invitationId !== 'string') {
      throw new HttpsError('invalid-argument', 'invitationId is required.');
    }
    if (!response || !['accept', 'decline'].includes(response)) {
      throw new HttpsError('invalid-argument', 'response must be "accept" or "decline".');
    }

    // 1. Fetch invitation
    const invSnap = await _db().collection('invitations').doc(invitationId).get();
    if (!invSnap.exists) {
      throw new HttpsError('not-found', 'Invitation not found.');
    }
    const inv = invSnap.data()!;
    const bandId = inv['bandId'] as string;
    const role = (inv['role'] as string) || 'BAND_MEMBER';
    const status = inv['status'] as string;
    const expiresAt = new Date(inv['expiresAt'] as string);

    // 2. State & Expiry validation
    if (status !== 'pending') {
      throw new HttpsError('failed-precondition', `Invitation has already been ${status}.`);
    }
    if (expiresAt.getTime() <= Date.now()) {
      await invSnap.ref.update({ status: 'expired' });
      throw new HttpsError('failed-precondition', 'Invitation has expired.');
    }

    // 3. Email match validation
    if (email && inv['inviteeEmail'] && email !== (inv['inviteeEmail'] as string).toLowerCase()) {
      throw new HttpsError('permission-denied', 'Invitation was addressed to a different email.');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = _db().batch();

    if (response === 'decline') {
      batch.update(invSnap.ref, { status: 'declined', respondedAt: now });
      batch.update(_db().collection('bands').doc(bandId).collection('invitations').doc(invitationId), {
        status: 'declined',
        respondedAt: now,
      });
      await batch.commit();
      return { ok: true, status: 'declined' };
    }

    // Response === 'accept'
    // Fetch user details
    const userDoc = await _db().collection('users').doc(uid).get();
    const displayName = (userDoc.data()?.['displayName'] as string) || 'Band Member';
    const photoUrl = (userDoc.data()?.['photoUrl'] as string) || null;

    // Check if user is already in the band
    const memberDoc = await _db().collection('bands').doc(bandId).collection('members').doc(uid).get();
    if (memberDoc.exists && memberDoc.data()?.['isActive'] === true) {
      throw new HttpsError('already-exists', 'You are already an active member of this band.');
    }

    const bandRef = _db().collection('bands').doc(bandId);

    // Update invitation status
    batch.update(invSnap.ref, { status: 'accepted', respondedAt: now, inviteeUid: uid });
    batch.update(bandRef.collection('invitations').doc(invitationId), {
      status: 'accepted',
      respondedAt: now,
      inviteeUid: uid,
    });

    // Add or reactivate band member
    batch.set(bandRef.collection('members').doc(uid), {
      uid,
      bandId,
      role,
      displayName,
      photoUrl,
      joinedAt: now,
      invitedByUid: inv['invitedByUid'],
      isActive: true,
    });

    // Increment member count
    batch.update(bandRef, {
      memberCount: admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });

    // Audit log
    batch.set(bandRef.collection('auditLogs').doc(uuidv4()), {
      action: 'MEMBER_JOINED',
      performedByUid: uid,
      details: { role, invitationId, displayName },
      timestamp: now,
    });

    await batch.commit();

    return { ok: true, status: 'accepted', bandId };
  },
);
