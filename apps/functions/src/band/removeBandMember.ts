/**
 * Crowdbeats V2 — removeBandMember (Phase 8)
 *
 * Callable: removeBandMember
 *
 * Removes a member from a band or allows a member to leave.
 * Rules:
 * - `BAND_FOUNDER` cannot be removed (must transfer ownership first).
 * - `BAND_ADMIN` can remove `BAND_MEMBER`.
 * - `BAND_FOUNDER` can remove any member (except self).
 * - Any member can voluntarily leave (except founder).
 * - Member document is retained with `isActive: false` and `leftAt` for audit trail.
 * - Decrements `memberCount`.
 *
 * Auth: caller must be authorized admin/founder or the member themselves
 * Returns: { ok: true }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

export const removeBandMember = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;

    const bandId = data['bandId'] as string | undefined;
    const targetUid = data['memberUid'] as string | undefined;
    const reason = (data['reason'] as string | undefined) || 'No reason provided';

    if (!bandId || typeof bandId !== 'string') {
      throw new HttpsError('invalid-argument', 'bandId is required.');
    }
    if (!targetUid || typeof targetUid !== 'string') {
      throw new HttpsError('invalid-argument', 'memberUid is required.');
    }

    const bandRef = _db().collection('bands').doc(bandId);
    const bandSnap = await bandRef.get();
    if (!bandSnap.exists) {
      throw new HttpsError('not-found', 'Band not found.');
    }

    // 1. Fetch target member
    const targetMemberRef = bandRef.collection('members').doc(targetUid);
    const targetSnap = await targetMemberRef.get();
    if (!targetSnap.exists || targetSnap.data()?.['isActive'] !== true) {
      throw new HttpsError('not-found', 'Active member not found in this band.');
    }
    const targetRole = targetSnap.data()?.['role'] as string;

    // 2. Prevent removing founder
    if (targetRole === 'BAND_FOUNDER') {
      throw new HttpsError('failed-precondition', 'The band founder cannot be removed. Transfer ownership first.');
    }

    // 3. Authorization check
    const isSelfRemoval = uid === targetUid;
    if (!isSelfRemoval) {
      const callerSnap = await bandRef.collection('members').doc(uid).get();
      if (!callerSnap.exists || callerSnap.data()?.['isActive'] !== true) {
        throw new HttpsError('permission-denied', 'You are not a member of this band.');
      }
      const callerRole = callerSnap.data()?.['role'] as string;
      if (callerRole === 'BAND_MEMBER') {
        throw new HttpsError('permission-denied', 'Standard members cannot remove other members.');
      }
      if (callerRole === 'BAND_ADMIN' && targetRole === 'BAND_ADMIN') {
        throw new HttpsError('permission-denied', 'Band admins cannot remove other band admins. Founder required.');
      }
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = _db().batch();

    // Mark member inactive (preserve record for ledger audit)
    batch.update(targetMemberRef, {
      isActive: false,
      leftAt: now,
      leaveReason: reason,
      removedByUid: uid,
    });

    // Decrement memberCount
    batch.update(bandRef, {
      memberCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: now,
    });

    // Audit log
    batch.set(bandRef.collection('auditLogs').doc(uuidv4()), {
      action: isSelfRemoval ? 'MEMBER_LEFT' : 'MEMBER_REMOVED',
      performedByUid: uid,
      details: { targetUid, targetRole, reason },
      timestamp: now,
    });

    await batch.commit();

    return { ok: true };
  },
);
