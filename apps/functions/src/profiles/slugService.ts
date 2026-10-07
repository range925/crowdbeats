/**
 * Crowdbeats V2 — Creator Slug & Canonical URL Service (Phase 2)
 *
 * Implements canonical public URL registration, collision avoidance, reserved word
 * protection, and public resolution for solo artists and bands.
 *
 * Compliance Invariants:
 * - Each canonical URL corresponds to exactly 1 creator identity.
 * - Format: https://crowdbeats.ai/artist/{slug} or https://crowdbeats.ai/band/{slug}
 * - Reserved words protected.
 * - Suspended/deleted accounts handled safely without 404 leakage or false monetization.
 */

import * as admin from 'firebase-admin';
import {
  normalizeSlug,
  isReservedSlug,
  buildCanonicalProfileUrl,
  type CreatorSlugRecord,
  type CreatorSlugStatus,
  type ResolveSlugResponse,
} from '@crowdbeats/contracts';

/**
 * Reserves a canonical slug for an artist or band with collision resolution and reserved-word guards.
 */
export async function reserveCreatorSlug(
  db: admin.firestore.Firestore,
  params: {
    creatorId: string;
    creatorType: 'artist' | 'band';
    preferredName: string;
    customSlug?: string;
  },
): Promise<{ slug: string; canonicalProfileUrl: string }> {
  const { creatorId, creatorType, preferredName, customSlug } = params;

  let baseSlug = normalizeSlug(customSlug || preferredName);

  // Reserved slug protection: append '-music' or '-band' to disambiguate
  if (isReservedSlug(baseSlug)) {
    baseSlug = `${baseSlug}-${creatorType === 'band' ? 'band' : 'music'}`;
  }

  let finalSlug = baseSlug;
  let attempt = 1;
  const maxAttempts = 10;

  while (attempt <= maxAttempts) {
    const slugRef = db.collection('creatorSlugs').doc(finalSlug);
    const success = await db.runTransaction(async (tx) => {
      const slugDoc = await tx.get(slugRef);

      if (slugDoc.exists) {
        const data = slugDoc.data() as CreatorSlugRecord;
        // If already owned by this creator, reuse it
        if (data.creatorId === creatorId) {
          return true;
        }
        // Collision detected
        return false;
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const canonicalProfileUrl = buildCanonicalProfileUrl(creatorType, finalSlug);

      const record = {
        slug: finalSlug,
        creatorId,
        creatorType,
        canonicalProfileUrl,
        status: 'active' as CreatorSlugStatus,
        createdAt: now,
        updatedAt: now,
      };

      tx.set(slugRef, record);

      // Update creator documents with canonical references
      if (creatorType === 'artist') {
        const userRef = db.collection('users').doc(creatorId);
        tx.set(userRef, { creatorSlug: finalSlug, canonicalProfileUrl, updatedAt: now }, { merge: true });
        const artistRef = db.collection('artistProfiles').doc(creatorId);
        tx.set(artistRef, { creatorSlug: finalSlug, canonicalProfileUrl, updatedAt: now }, { merge: true });
      } else if (creatorType === 'band') {
        const bandRef = db.collection('bands').doc(creatorId);
        tx.set(bandRef, { creatorSlug: finalSlug, canonicalProfileUrl, updatedAt: now }, { merge: true });
      }

      return true;
    });

    if (success) {
      return {
        slug: finalSlug,
        canonicalProfileUrl: buildCanonicalProfileUrl(creatorType, finalSlug),
      };
    }

    attempt++;
    finalSlug = `${baseSlug}-${attempt}`;
  }

  // Fallback to deterministic unique suffix if max numerical attempts exceeded
  finalSlug = `${baseSlug}-${creatorId.substring(0, 6).toLowerCase()}`;
  const slugRef = db.collection('creatorSlugs').doc(finalSlug);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const canonicalProfileUrl = buildCanonicalProfileUrl(creatorType, finalSlug);

  await slugRef.set({
    slug: finalSlug,
    creatorId,
    creatorType,
    canonicalProfileUrl,
    status: 'active' as CreatorSlugStatus,
    createdAt: now,
    updatedAt: now,
  });

  return { slug: finalSlug, canonicalProfileUrl };
}

/**
 * Resolves a creator by public slug, checking active/suspended/deleted status.
 */
export async function resolveCreatorSlug(
  db: admin.firestore.Firestore,
  slug: string,
): Promise<ResolveSlugResponse> {
  const normalized = normalizeSlug(slug);
  const slugDoc = await db.collection('creatorSlugs').doc(normalized).get();

  if (!slugDoc.exists) {
    return {
      found: false,
      slug: normalized,
      creatorId: null,
      creatorType: null,
      canonicalProfileUrl: null,
      status: null,
      isMonetizable: false,
    };
  }

  const data = slugDoc.data() as CreatorSlugRecord;
  const creatorId = data.creatorId;
  const creatorType = data.creatorType;

  // Verify parent account state
  let status: CreatorSlugStatus = data.status || 'active';

  if (creatorType === 'artist') {
    const userDoc = await db.collection('users').doc(creatorId).get();
    if (!userDoc.exists || userDoc.data()?.['deletedAt']) {
      status = 'deleted';
    } else if (userDoc.data()?.['isSuspended'] || userDoc.data()?.['suspendedAt']) {
      status = 'suspended';
    }
  } else if (creatorType === 'band') {
    const bandDoc = await db.collection('bands').doc(creatorId).get();
    if (!bandDoc.exists || bandDoc.data()?.['deletedAt']) {
      status = 'deleted';
    } else if (bandDoc.data()?.['isSuspended'] || bandDoc.data()?.['suspendedAt']) {
      status = 'suspended';
    }
  }

  const isMonetizable = status === 'active';

  return {
    found: true,
    slug: normalized,
    creatorId,
    creatorType,
    canonicalProfileUrl: data.canonicalProfileUrl || buildCanonicalProfileUrl(creatorType, normalized),
    status,
    isMonetizable,
  };
}

/**
 * Updates a creator slug status when account lifecycle changes (e.g. suspended/deleted/reinstated).
 */
export async function updateCreatorSlugStatus(
  db: admin.firestore.Firestore,
  creatorId: string,
  status: CreatorSlugStatus,
): Promise<void> {
  const querySnap = await db
    .collection('creatorSlugs')
    .where('creatorId', '==', creatorId)
    .limit(1)
    .get();

  if (!querySnap.empty) {
    const docRef = querySnap.docs[0].ref;
    await docRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
