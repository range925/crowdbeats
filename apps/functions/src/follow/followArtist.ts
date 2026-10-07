/**
 * Crowdbeats V2 — followArtist Cloud Function (Phase 6)
 * Callable: followArtist
 * Creates follow record and increments followerCount atomically.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const _db = () => admin.firestore();

export const followArtist = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;
    const artistId = data['artistId'];

    if (typeof artistId !== 'string' || artistId.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'artistId is required.');
    }

    // Validate artist exists
    const artistSnap = await _db().collection('artistProfiles').doc(artistId as string).get();
    if (!artistSnap.exists) {
      throw new HttpsError('not-found', 'Artist not found.');
    }

    const followId = `${uid}_${artistId}`;
    const followRef = _db().collection('follows').doc(followId);
    const followSnap = await followRef.get();

    // Idempotent: already following
    if (followSnap.exists) {
      return { ok: true };
    }

    const batch = _db().batch();
    batch.set(followRef, {
      fanUid: uid,
      artistId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    batch.update(artistSnap.ref, {
      followerCount: admin.firestore.FieldValue.increment(1),
    });
    await batch.commit();

    return { ok: true };
  },
);
