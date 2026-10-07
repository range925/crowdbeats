/**
 * Crowdbeats V2 — createBand (Phase 2 & Phase 8)
 *
 * Callable: createBand
 *
 * Creates a new band document in `/bands/{bandId}` with canonical URL slug registration.
 * The caller becomes the BAND_FOUNDER in `/bands/{bandId}/members/{callerUid}`.
 * Initializes `/bands/{bandId}/splitConfig/current` with 100% (10000 bps) to the founder (v1).
 *
 * Auth: Any authenticated user with persona 'band_member' or 'artist'
 * Returns: { bandId, name, creatorSlug, canonicalProfileUrl }
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';
import { reserveCreatorSlug } from '../profiles/slugService.js';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

export const createBand = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as Record<string, unknown>;

    const nameRaw = data['name'] as string | undefined;
    const bioRaw = data['bio'] as string | undefined;
    const genresRaw = (data['genres'] as string[]) ?? [];
    const customSlugRaw = data['slug'] as string | undefined;

    if (!nameRaw || typeof nameRaw !== 'string' || nameRaw.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Band name is required.');
    }
    if (nameRaw.trim().length > 80) {
      throw new HttpsError('invalid-argument', 'Band name cannot exceed 80 characters.');
    }

    const name = nameRaw.trim();
    const bio = bioRaw && typeof bioRaw === 'string' ? bioRaw.trim().substring(0, 1000) : '';
    const genres = Array.isArray(genresRaw) ? genresRaw.slice(0, 5) : [];

    const bandId = uuidv4();
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Fetch founder display name
    const userDoc = await _db().collection('users').doc(uid).get();
    const displayName = (userDoc.data()?.['displayName'] as string) || 'Band Founder';
    const photoUrl = (userDoc.data()?.['photoUrl'] as string) || null;

    const batch = _db().batch();

    // 1. Create band doc
    const bandRef = _db().collection('bands').doc(bandId);
    batch.set(bandRef, {
      bandId,
      founderUid: uid,
      name,
      bio,
      photoUrl: null,
      coverUrl: null,
      genres,
      socialLinks: {},
      isActive: true,
      memberCount: 1,
      bankLinked: false,
      totalTipsReceivedCents: 0,
      createdAt: now,
      updatedAt: now,
      v: 1,
    });

    // 2. Create founder member doc
    const memberRef = bandRef.collection('members').doc(uid);
    batch.set(memberRef, {
      uid,
      bandId,
      role: 'BAND_FOUNDER',
      displayName,
      photoUrl,
      joinedAt: now,
      invitedByUid: uid,
      isActive: true,
    });

    // 3. Create initial split config (v1 = 10000 bps for founder)
    const splitRef = bandRef.collection('splitConfig').doc('current');
    batch.set(splitRef, {
      bandId,
      version: 1,
      splits: [{ uid, splitBps: 10000 }],
      setByUid: uid,
      validatedAt: now,
      createdAt: now,
      updatedAt: now,
      v: 1,
    });

    // 4. Archive split version 1 in history
    const historyRef = bandRef.collection('splitHistory').doc('1');
    batch.set(historyRef, {
      version: 1,
      bandId,
      splits: [{ uid, splitBps: 10000 }],
      setByUid: uid,
      effectiveAt: now,
      createdAt: now,
    });

    // 5. Audit log entry
    const auditRef = bandRef.collection('auditLogs').doc(uuidv4());
    batch.set(auditRef, {
      action: 'BAND_CREATED',
      performedByUid: uid,
      details: { name, founderUid: uid },
      timestamp: now,
    });

    await batch.commit();

    // 6. Reserve unique canonical slug for the band
    const slugInfo = await reserveCreatorSlug(_db(), {
      creatorId: bandId,
      creatorType: 'band',
      preferredName: name,
      customSlug: customSlugRaw,
    });

    return {
      bandId,
      name,
      creatorSlug: slugInfo.slug,
      canonicalProfileUrl: slugInfo.canonicalProfileUrl,
    };
  },
);
