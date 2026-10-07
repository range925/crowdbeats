/**
 * Crowdbeats V2 — setBandSplitConfig (Phase 8)
 *
 * Callable: setBandSplitConfig
 *
 * Configures versioned split percentages across band members.
 *
 * Invariants:
 * - Server-written only (Firestore rules forbid client direct writes to splitConfig).
 * - All splits must be integer basis points (e.g. 5000 = 50.00%).
 * - Sum of splitBps MUST equal exactly SPLIT_TOTAL_BPS (10000 = 100.00%).
 * - Every member in splits must be an active member in `/bands/{bandId}/members`.
 * - Every active member in the band must be represented.
 * - Increments version number `v` (v1 -> v2 -> v3...).
 * - Archives previous version to `/bands/{bandId}/splitHistory/{v}` before setting `current`.
 * - Writes audit log.
 *
 * Auth: caller must be `BAND_FOUNDER` or `BAND_ADMIN`
 * Returns: { version, splits }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

const SPLIT_TOTAL_BPS = 10000;

interface MemberSplitInput {
  uid: string;
  splitBps: number;
}

export const setBandSplitConfig = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;

    const bandId = data['bandId'] as string | undefined;
    const splitsRaw = data['splits'] as MemberSplitInput[] | undefined;

    if (!bandId || typeof bandId !== 'string') {
      throw new HttpsError('invalid-argument', 'bandId is required.');
    }
    if (!splitsRaw || !Array.isArray(splitsRaw) || splitsRaw.length === 0) {
      throw new HttpsError('invalid-argument', 'splits array with at least one member is required.');
    }

    const bandRef = _db().collection('bands').doc(bandId);
    const bandSnap = await bandRef.get();
    if (!bandSnap.exists) {
      throw new HttpsError('not-found', 'Band not found.');
    }

    // 1. Authorization: check caller role in band
    const callerMemberRef = bandRef.collection('members').doc(uid);
    const callerSnap = await callerMemberRef.get();
    if (!callerSnap.exists || callerSnap.data()?.['isActive'] !== true) {
      throw new HttpsError('permission-denied', 'You are not an active member of this band.');
    }
    const callerRole = callerSnap.data()?.['role'] as string;
    if (!['BAND_FOUNDER', 'BAND_ADMIN'].includes(callerRole)) {
      throw new HttpsError('permission-denied', 'Only band founders or admins can configure split percentages.');
    }

    // 2. Validate all active members in band
    const activeMembersSnap = await bandRef.collection('members').where('isActive', '==', true).get();
    const activeMemberUids = new Set(activeMembersSnap.docs.map((d) => d.id));

    // 3. Exact split arithmetic validation: sum === 10000
    let totalBps = 0;
    const inputUids = new Set<string>();

    for (const split of splitsRaw) {
      if (!split.uid || typeof split.uid !== 'string') {
        throw new HttpsError('invalid-argument', 'Every split must specify a valid member uid.');
      }
      if (!Number.isInteger(split.splitBps) || split.splitBps <= 0) {
        throw new HttpsError('invalid-argument', `Invalid splitBps for uid ${split.uid}: must be positive integer.`);
      }
      if (!activeMemberUids.has(split.uid)) {
        throw new HttpsError('failed-precondition', `Member ${split.uid} is not an active member of this band.`);
      }
      if (inputUids.has(split.uid)) {
        throw new HttpsError('invalid-argument', `Duplicate split entry for member ${split.uid}.`);
      }
      inputUids.add(split.uid);
      totalBps += split.splitBps;
    }

    if (totalBps !== SPLIT_TOTAL_BPS) {
      throw new HttpsError(
        'invalid-argument',
        `Split percentages must total exactly 100.00% (10,000 basis points). Current total: ${totalBps} bps (${(totalBps / 100).toFixed(2)}%).`,
      );
    }

    // Ensure all active members have a configured split
    for (const activeUid of activeMemberUids) {
      if (!inputUids.has(activeUid)) {
        throw new HttpsError(
          'invalid-argument',
          `Active band member ${activeUid} is missing from the split configuration. All active members must be included.`,
        );
      }
    }

    // 4. Fetch current version to compute next version number
    const currentSplitSnap = await bandRef.collection('splitConfig').doc('current').get();
    const previousVersion = currentSplitSnap.exists ? (currentSplitSnap.data()?.['version'] as number) || 1 : 0;
    const newVersion = previousVersion + 1;

    const now = admin.firestore.FieldValue.serverTimestamp();
    const cleanSplits = splitsRaw.map((s) => ({ uid: s.uid, splitBps: s.splitBps }));

    const batch = _db().batch();

    // 5. Update /bands/{bandId}/splitConfig/current
    const currentRef = bandRef.collection('splitConfig').doc('current');
    batch.set(currentRef, {
      bandId,
      version: newVersion,
      splits: cleanSplits,
      setByUid: uid,
      validatedAt: now,
      createdAt: currentSplitSnap.exists ? currentSplitSnap.data()?.['createdAt'] || now : now,
      updatedAt: now,
      v: newVersion,
    });

    // 6. Archive version to /bands/{bandId}/splitHistory/{newVersion}
    const historyRef = bandRef.collection('splitHistory').doc(String(newVersion));
    batch.set(historyRef, {
      version: newVersion,
      bandId,
      splits: cleanSplits,
      setByUid: uid,
      effectiveAt: now,
      createdAt: now,
    });

    // 7. Audit log
    batch.set(bandRef.collection('auditLogs').doc(uuidv4()), {
      action: 'SPLIT_CONFIG_UPDATED',
      performedByUid: uid,
      details: { previousVersion, newVersion, splits: cleanSplits },
      timestamp: now,
    });

    await batch.commit();

    return {
      version: newVersion,
      splits: cleanSplits,
    };
  },
);
