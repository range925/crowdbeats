/**
 * Crowdbeats V2 — updateBandMemberRole (Phase 8)
 *
 * Callable: updateBandMemberRole
 *
 * Updates a member's role between `BAND_ADMIN` and `BAND_MEMBER`.
 * Only `BAND_FOUNDER` can promote/demote admins or members.
 * Cannot promote to `BAND_FOUNDER` (use `transferBandOwnership` for that).
 *
 * Auth: caller must be `BAND_FOUNDER`
 * Returns: { ok: true, newRole }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

export const updateBandMemberRole = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;

    const bandId = data['bandId'] as string | undefined;
    const targetUid = data['memberUid'] as string | undefined;
    const newRole = data['newRole'] as string | undefined;

    if (!bandId || typeof bandId !== 'string') {
      throw new HttpsError('invalid-argument', 'bandId is required.');
    }
    if (!targetUid || typeof targetUid !== 'string') {
      throw new HttpsError('invalid-argument', 'memberUid is required.');
    }
    if (!newRole || !['BAND_ADMIN', 'BAND_MEMBER'].includes(newRole)) {
      throw new HttpsError('invalid-argument', 'newRole must be BAND_ADMIN or BAND_MEMBER.');
    }

    // 1. Verify caller is BAND_FOUNDER
    const callerMemberDoc = await _db().collection('bands').doc(bandId).collection('members').doc(uid).get();
    if (!callerMemberDoc.exists || callerMemberDoc.data()?.['role'] !== 'BAND_FOUNDER' || callerMemberDoc.data()?.['isActive'] !== true) {
      throw new HttpsError('permission-denied', 'Only the band founder can change member roles.');
    }

    // 2. Verify target is an active member
    const targetMemberRef = _db().collection('bands').doc(bandId).collection('members').doc(targetUid);
    const targetSnap = await targetMemberRef.get();
    if (!targetSnap.exists || targetSnap.data()?.['isActive'] !== true) {
      throw new HttpsError('not-found', 'Active member not found in this band.');
    }

    if (targetUid === uid) {
      throw new HttpsError('failed-precondition', 'Founder cannot demote themselves. Transfer ownership first.');
    }

    const previousRole = targetSnap.data()?.['role'];
    const now = admin.firestore.FieldValue.serverTimestamp();

    await targetMemberRef.update({
      role: newRole,
      updatedAt: now,
    });

    // Audit log
    await _db().collection('bands').doc(bandId).collection('auditLogs').doc(uuidv4()).set({
      action: 'ROLE_UPDATED',
      performedByUid: uid,
      details: { targetUid, previousRole, newRole },
      timestamp: now,
    });

    return { ok: true, newRole };
  },
);
