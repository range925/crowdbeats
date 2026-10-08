/**
 * Crowdbeats V2 — resolvePerformerRecipient Cloud Function
 *
 * Callable endpoint to look up server-authoritative recipient details,
 * account status, monetization eligibility, truthful live status,
 * and canonical tipping URL.
 *
 * Invariants:
 * - Immutable ID or slug resolution across users, artistProfiles, and bands
 * - Account status validation (not deleted, not suspended, not banned)
 * - Monetization eligibility enforced via evaluateCreatorMonetizationEligibility
 * - Truthful Live Now: isLive is only true if an active, unexpired session exists
 * - Never leaks fan/guest locations or private PII
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  type ResolvePerformerRecipientRequest,
  type ResolvePerformerRecipientResponse,
  buildCanonicalTipUrl,
  normalizeSlug,
} from '@crowdbeats/contracts';
import { evaluateCreatorMonetizationEligibility } from '../monetization/eligibilityService.js';
import { logger } from '../lib/logger.js';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const _db = () => admin.firestore();

export const resolvePerformerRecipient = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ResolvePerformerRecipientResponse> => {
    const data = (request.data || {}) as ResolvePerformerRecipientRequest;
    const lookupKey = (data.performerId || data.slug || data.identifier || '').trim();

    if (!lookupKey) {
      throw new HttpsError('invalid-argument', 'performerId, slug, or identifier is required.');
    }

    const db = _db();
    let performerId: string | null = null;
    let performerType: 'artist' | 'band' = data.performerType || 'artist';
    let userData: Record<string, unknown> | undefined;
    let artistProfileData: Record<string, unknown> | undefined;
    let bandData: Record<string, unknown> | undefined;

    // 1. Direct document ID lookup
    if (data.performerType === 'band') {
      const bandDoc = await db.collection('bands').doc(lookupKey).get();
      if (bandDoc.exists) {
        bandData = bandDoc.data();
        performerId = bandDoc.id;
        performerType = 'band';
      }
    } else if (data.performerType === 'artist') {
      const [userDoc, artistDoc] = await Promise.all([
        db.collection('users').doc(lookupKey).get(),
        db.collection('artistProfiles').doc(lookupKey).get(),
      ]);
      if (userDoc.exists || artistDoc.exists) {
        userData = userDoc.exists ? userDoc.data() : undefined;
        artistProfileData = artistDoc.exists ? artistDoc.data() : undefined;
        performerId = lookupKey;
        performerType = 'artist';
      }
    } else {
      const [bandDoc, artistDoc, userDoc] = await Promise.all([
        db.collection('bands').doc(lookupKey).get(),
        db.collection('artistProfiles').doc(lookupKey).get(),
        db.collection('users').doc(lookupKey).get(),
      ]);

      if (bandDoc.exists) {
        bandData = bandDoc.data();
        performerId = bandDoc.id;
        performerType = 'band';
      } else if (artistDoc.exists || userDoc.exists) {
        artistProfileData = artistDoc.exists ? artistDoc.data() : undefined;
        userData = userDoc.exists ? userDoc.data() : undefined;
        performerId = lookupKey;
        performerType = 'artist';
      }
    }

    // 2. Lookup via creatorSlugs registry
    if (!performerId) {
      const normalized = normalizeSlug(lookupKey);
      const slugDoc = await db.collection('creatorSlugs').doc(normalized).get();
      if (slugDoc.exists) {
        const sData = slugDoc.data()!;
        const cId = sData['creatorId'] as string;
        const cType = (sData['creatorType'] === 'band' ? 'band' : 'artist') as 'artist' | 'band';
        if (cType === 'band') {
          const bDoc = await db.collection('bands').doc(cId).get();
          if (bDoc.exists) {
            bandData = bDoc.data();
            performerId = bDoc.id;
            performerType = 'band';
          }
        } else {
          const [uDoc, aDoc] = await Promise.all([
            db.collection('users').doc(cId).get(),
            db.collection('artistProfiles').doc(cId).get(),
          ]);
          if (uDoc.exists || aDoc.exists) {
            userData = uDoc.exists ? uDoc.data() : undefined;
            artistProfileData = aDoc.exists ? aDoc.data() : undefined;
            performerId = cId;
            performerType = 'artist';
          }
        }
      }
    }

    // 3. Fallback: Query bands and artistProfiles by slug fields
    if (!performerId) {
      const [bandBySlug, bandByCreatorSlug] = await Promise.all([
        db.collection('bands').where('bandSlug', '==', lookupKey).limit(1).get(),
        db.collection('bands').where('creatorSlug', '==', lookupKey).limit(1).get(),
      ]);
      const bandMatch = (!bandBySlug.empty ? bandBySlug.docs[0] : (!bandByCreatorSlug.empty ? bandByCreatorSlug.docs[0] : null));
      if (bandMatch) {
        bandData = bandMatch.data();
        performerId = bandMatch.id;
        performerType = 'band';
      }
    }

    if (!performerId) {
      const [artistBySlug, userBySlug] = await Promise.all([
        db.collection('artistProfiles').where('creatorSlug', '==', lookupKey).limit(1).get(),
        db.collection('users').where('creatorSlug', '==', lookupKey).limit(1).get(),
      ]);
      const artistMatch = (!artistBySlug.empty ? artistBySlug.docs[0] : (!userBySlug.empty ? userBySlug.docs[0] : null));
      if (artistMatch) {
        performerId = artistMatch.id;
        performerType = 'artist';
        const [uDoc, aDoc] = await Promise.all([
          db.collection('users').doc(performerId).get(),
          db.collection('artistProfiles').doc(performerId).get(),
        ]);
        userData = uDoc.exists ? uDoc.data() : undefined;
        artistProfileData = aDoc.exists ? aDoc.data() : undefined;
      }
    }

    if (!performerId) {
      throw new HttpsError('not-found', `Performer '${lookupKey}' not found.`);
    }

    // Ensure complementary documents are loaded for artist
    if (performerType === 'artist') {
      if (!userData) {
        const uDoc = await db.collection('users').doc(performerId).get();
        if (uDoc.exists) userData = uDoc.data();
      }
      if (!artistProfileData) {
        const aDoc = await db.collection('artistProfiles').doc(performerId).get();
        if (aDoc.exists) artistProfileData = aDoc.data();
      }
    }

    // 4. Evaluate account status (not deleted, not suspended, not banned)
    let isDeleted = false;
    let isSuspended = false;
    let isBanned = false;

    if (performerType === 'artist') {
      isDeleted = Boolean(userData?.['deletedAt'] || artistProfileData?.['deletedAt']);
      isSuspended = Boolean(
        userData?.['isSuspended'] === true ||
        userData?.['suspendedAt'] ||
        userData?.['status'] === 'suspended' ||
        artistProfileData?.['isSuspended'] === true ||
        artistProfileData?.['suspendedAt'] ||
        artistProfileData?.['status'] === 'suspended'
      );
      isBanned = Boolean(
        userData?.['isBanned'] === true ||
        userData?.['bannedAt'] ||
        userData?.['status'] === 'banned' ||
        artistProfileData?.['isBanned'] === true ||
        artistProfileData?.['bannedAt'] ||
        artistProfileData?.['status'] === 'banned'
      );
    } else {
      isDeleted = Boolean(bandData?.['deletedAt']);
      isSuspended = Boolean(
        bandData?.['isSuspended'] === true ||
        bandData?.['suspendedAt'] ||
        bandData?.['status'] === 'suspended'
      );
      isBanned = Boolean(
        bandData?.['isBanned'] === true ||
        bandData?.['bannedAt'] ||
        bandData?.['status'] === 'banned'
      );
    }

    let canAcceptTips = true;
    let eligibilityReason: string | undefined;

    if (isDeleted) {
      canAcceptTips = false;
      eligibilityReason = 'ACCOUNT_DELETED';
    } else if (isBanned) {
      canAcceptTips = false;
      eligibilityReason = 'ACCOUNT_BANNED';
    } else if (isSuspended) {
      canAcceptTips = false;
      eligibilityReason = 'ACCOUNT_SUSPENDED';
    } else {
      // Check monetization eligibility via evaluateCreatorMonetizationEligibility
      const eligibility = await evaluateCreatorMonetizationEligibility(db, performerId, performerType);
      if (!eligibility.isEligible) {
        canAcceptTips = false;
        eligibilityReason = eligibility.reasonCodes.length > 0
          ? eligibility.reasonCodes.join(', ')
          : eligibility.status;
      }
    }

    // 5. Check truthful live status (query active sessions where endsAt > now)
    let isLive = false;
    let currentVenueName: string | undefined = undefined;

    try {
      const nowMs = Date.now();
      const sessionsSnap = await db
        .collection('sessions')
        .where('performerId', '==', performerId)
        .where('status', '==', 'live')
        .limit(5)
        .get();

      for (const sDoc of sessionsSnap.docs) {
        const sData = sDoc.data();
        const endsAtRaw = sData['endsAt'];
        let endsAtMs = 0;
        if (endsAtRaw && typeof (endsAtRaw as any).toMillis === 'function') {
          endsAtMs = (endsAtRaw as any).toMillis();
        } else if (endsAtRaw && typeof (endsAtRaw as any).toDate === 'function') {
          endsAtMs = (endsAtRaw as any).toDate().getTime();
        } else if (typeof endsAtRaw === 'string') {
          endsAtMs = new Date(endsAtRaw).getTime();
        } else if (typeof endsAtRaw === 'number') {
          endsAtMs = endsAtRaw;
        }

        if (endsAtMs > nowMs) {
          isLive = true;
          currentVenueName = (sData['venueName'] || sData['currentVenueName']) as string | undefined;
          break;
        }
      }
    } catch (sessionErr) {
      logger.warn('[resolvePerformerRecipient] Failed to query active sessions', {
        performerId,
        error: String(sessionErr),
      });
    }

    // 6. Build response
    const displayName = (performerType === 'band'
      ? (bandData?.['name'] || 'Band')
      : (artistProfileData?.['stageName'] || userData?.['displayName'] || 'Artist')) as string;

    const slug = (performerType === 'band'
      ? (bandData?.['bandSlug'] || bandData?.['creatorSlug'] || bandData?.['slug'] || performerId)
      : (artistProfileData?.['creatorSlug'] || artistProfileData?.['slug'] || userData?.['creatorSlug'] || performerId)) as string;

    const avatarUrl = (performerType === 'band'
      ? bandData?.['photoUrl']
      : (artistProfileData?.['photoUrl'] || userData?.['photoUrl'])) as string | undefined;

    const bio = (performerType === 'band'
      ? bandData?.['bio']
      : artistProfileData?.['bio']) as string | undefined;

    const rawGenres = (performerType === 'band'
      ? bandData?.['genres']
      : artistProfileData?.['genres']);
    const genres: readonly string[] = Array.isArray(rawGenres) ? (rawGenres as string[]) : [];

    const isVerified = performerType === 'band'
      ? Boolean(bandData?.['verifiedAt'])
      : Boolean(artistProfileData?.['verifiedAt'] || userData?.['verifiedAt']);

    return {
      performerId,
      performerType,
      displayName,
      slug,
      avatarUrl: avatarUrl || undefined,
      bio: bio || undefined,
      genres,
      isVerified,
      isLive,
      currentVenueName: isLive ? (currentVenueName || undefined) : undefined,
      canAcceptTips,
      eligibilityReason: canAcceptTips ? undefined : (eligibilityReason || 'MONETIZATION_NOT_ELIGIBLE'),
      canonicalTipUrl: buildCanonicalTipUrl(performerId),
    };
  },
);
