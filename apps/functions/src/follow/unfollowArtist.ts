/**
 * Crowdbeats V2 — unfollowArtist Cloud Function (Phase 6)
 * Callable: unfollowArtist
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const _db = () => admin.firestore();

export const unfollowArtist = onCall(
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

    const followId = `${uid}_${artistId}`;
    const followRef = _db().collection('follows').doc(followId);
    const followSnap = await followRef.get();

    // Already not following — idempotent
    if (!followSnap.exists) {
      return { ok: true };
    }

    const artistRef = _db().collection('artistProfiles').doc(artistId as string);
    const batch = _db().batch();
    batch.delete(followRef);
    // Decrement but floor at 0
    batch.update(artistRef, {
      followerCount: admin.firestore.FieldValue.increment(-1),
    });
    await batch.commit();

    return { ok: true };
  },
);
