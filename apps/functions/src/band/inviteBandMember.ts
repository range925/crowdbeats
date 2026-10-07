/**
 * Crowdbeats V2 — inviteBandMember (Phase 8)
 *
 * Callable: inviteBandMember
 *
 * Invites a user via email to join a band with role `BAND_ADMIN` or `BAND_MEMBER`.
 * Generates a 7-day expiring invitation doc in `/bands/{bandId}/invitations/{invitationId}`.
 *
 * Auth: caller must be `BAND_FOUNDER` or `BAND_ADMIN` of the band
 * Returns: { invitationId, expiresAt }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

const BAND_MEMBERS_MAX = 20;

export const inviteBandMember = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;

    const bandId = data['bandId'] as string | undefined;
    const emailRaw = data['email'] as string | undefined;
    const roleRaw = (data['role'] as string) || 'BAND_MEMBER';

    if (!bandId || typeof bandId !== 'string') {
      throw new HttpsError('invalid-argument', 'bandId is required.');
    }
    if (!emailRaw || typeof emailRaw !== 'string' || !emailRaw.includes('@')) {
      throw new HttpsError('invalid-argument', 'A valid email address is required.');
    }
    const email = emailRaw.trim().toLowerCase();

    if (!['BAND_ADMIN', 'BAND_MEMBER'].includes(roleRaw)) {
      throw new HttpsError('invalid-argument', 'Role must be BAND_ADMIN or BAND_MEMBER.');
    }

    // 1. Verify caller has BAND_ADMIN or BAND_FOUNDER role
    const callerMemberDoc = await _db()
      .collection('bands')
      .doc(bandId)
      .collection('members')
      .doc(uid)
      .get();

    if (!callerMemberDoc.exists || callerMemberDoc.data()?.['isActive'] !== true) {
      throw new HttpsError('permission-denied', 'You are not an active member of this band.');
    }

    const callerRole = callerMemberDoc.data()?.['role'] as string;
    if (!['BAND_FOUNDER', 'BAND_ADMIN'].includes(callerRole)) {
      throw new HttpsError('permission-denied', 'Only band founders and admins can invite new members.');
    }

    // 2. Check band exists and member count limit
    const bandDoc = await _db().collection('bands').doc(bandId).get();
    if (!bandDoc.exists) {
      throw new HttpsError('not-found', 'Band not found.');
    }
    const bandName = (bandDoc.data()?.['name'] as string) || 'Band';
    const memberCount = (bandDoc.data()?.['memberCount'] as number) || 1;
    if (memberCount >= BAND_MEMBERS_MAX) {
      throw new HttpsError('failed-precondition', `Band has reached the maximum of ${BAND_MEMBERS_MAX} members.`);
    }

    // 3. Check for existing pending invitation for this email
    const existingInvites = await _db()
      .collection('bands')
      .doc(bandId)
      .collection('invitations')
      .where('inviteeEmail', '==', email)
      .where('status', '==', 'pending')
      .get();

    if (!existingInvites.empty) {
      throw new HttpsError('already-exists', 'A pending invitation for this email already exists.');
    }

    // 4. Create 7-day expiring invitation
    const invitationId = uuidv4();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();

    const invRef = _db().collection('bands').doc(bandId).collection('invitations').doc(invitationId);
    await invRef.set({
      invitationId,
      bandId,
      bandName,
      inviteeEmail: email,
      role: roleRaw,
      invitedByUid: uid,
      status: 'pending',
      expiresAt,
      createdAt: now,
    });

    // Also write to top-level invitations index for easy querying by invitee email
    await _db().collection('invitations').doc(invitationId).set({
      invitationId,
      bandId,
      bandName,
      inviteeEmail: email,
      role: roleRaw,
      invitedByUid: uid,
      status: 'pending',
      expiresAt,
      createdAt: now,
    });

    // Audit log
    await _db().collection('bands').doc(bandId).collection('auditLogs').doc(uuidv4()).set({
      action: 'MEMBER_INVITED',
      performedByUid: uid,
      details: { email, role: roleRaw, invitationId },
      timestamp: now,
    });

    return { invitationId, expiresAt };
  },
);
