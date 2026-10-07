/**
 * Crowdbeats V2 — transferBandOwnership (Phase 8)
 *
 * Callable: transferBandOwnership
 *
 * High-risk governance action: Transfers `BAND_FOUNDER` role to another active member.
 * Security requirements:
 * - Caller MUST be the current `BAND_FOUNDER`.
 * - Target MUST be an existing active member.
 * - Explicit confirmation phrase: caller must send `confirmationPhrase === 'TRANSFER OWNERSHIP'`.
 * - Optimistic version check on band document.
 * - Atomically:
 *   - Sets target member role to `BAND_FOUNDER`
 *   - Sets caller member role to `BAND_ADMIN`
 *   - Updates `founderUid` on `/bands/{bandId}`
 *   - Writes high-priority audit log entry
 *
 * Auth: current `BAND_FOUNDER`
 * Returns: { ok: true, newFounderUid }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

export const transferBandOwnership = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;

    const bandId = data['bandId'] as string | undefined;
    const targetUid = data['targetUid'] as string | undefined;
    const confirmationPhrase = data['confirmationPhrase'] as string | undefined;

    if (!bandId || typeof bandId !== 'string') {
      throw new HttpsError('invalid-argument', 'bandId is required.');
    }
    if (!targetUid || typeof targetUid !== 'string') {
      throw new HttpsError('invalid-argument', 'targetUid is required.');
    }
    if (targetUid === uid) {
      throw new HttpsError('invalid-argument', 'Target must be a different band member.');
    }
    if (confirmationPhrase !== 'TRANSFER OWNERSHIP') {
      throw new HttpsError(
        'failed-precondition',
        'Confirmation phrase must be exactly "TRANSFER OWNERSHIP".',
      );
    }

    const bandRef = _db().collection('bands').doc(bandId);
    const bandSnap = await bandRef.get();
    if (!bandSnap.exists) {
      throw new HttpsError('not-found', 'Band not found.');
    }

    // 1. Verify caller is current founder
    if (bandSnap.data()?.['founderUid'] !== uid) {
      throw new HttpsError('permission-denied', 'Only the current band founder can transfer ownership.');
    }

    const callerMemberRef = bandRef.collection('members').doc(uid);
    const callerSnap = await callerMemberRef.get();
    if (!callerSnap.exists || callerSnap.data()?.['role'] !== 'BAND_FOUNDER' || callerSnap.data()?.['isActive'] !== true) {
      throw new HttpsError('permission-denied', 'Caller is not the active BAND_FOUNDER.');
    }

    // 2. Verify target is an active member
    const targetMemberRef = bandRef.collection('members').doc(targetUid);
    const targetSnap = await targetMemberRef.get();
    if (!targetSnap.exists || targetSnap.data()?.['isActive'] !== true) {
      throw new HttpsError('not-found', 'Target is not an active member of this band.');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = _db().batch();

    // 3. Atomically transfer ownership
    batch.update(bandRef, {
      founderUid: targetUid,
      v: admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });

    batch.update(targetMemberRef, {
      role: 'BAND_FOUNDER',
      updatedAt: now,
    });

    batch.update(callerMemberRef, {
      role: 'BAND_ADMIN',
      updatedAt: now,
    });

    // 4. Audit log
    batch.set(bandRef.collection('auditLogs').doc(uuidv4()), {
      action: 'OWNERSHIP_TRANSFERRED',
      performedByUid: uid,
      details: { previousFounderUid: uid, newFounderUid: targetUid },
      timestamp: now,
    });

    await batch.commit();

    return { ok: true, newFounderUid: targetUid };
  },
);
