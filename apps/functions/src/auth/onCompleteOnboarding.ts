/**
 * Crowdbeats V2 — Complete Onboarding Callable (Phase 2 & Phase 5)
 *
 * Called by the client after the onboarding form is submitted.
 * Sets the personaType custom claim on the Firebase Auth user,
 * updates the Firestore user record, records consent, and provisions
 * canonical creator slugs for artists.
 *
 * INVARIANTS:
 * - Only user calling this function can set their OWN claim
 * - personaType is validated against the allowed set (no STAFF)
 * - displayName is validated (length, no HTML)
 * - Staff personaType is never settable through this function
 * - Canonical slug registered for artist personas
 * - Idempotent: re-calling with the same persona is safe
 */

import * as admin from 'firebase-admin';
import { https } from 'firebase-functions/v2';
import { onCall } from 'firebase-functions/v2/https';
import { reserveCreatorSlug } from '../profiles/slugService.js';

type AllowedPersona = 'fan' | 'artist' | 'band_member' | 'venue_manager' | 'sponsor_rep';

const ALLOWED_PERSONAS: readonly AllowedPersona[] = [
  'fan', 'artist', 'band_member', 'venue_manager', 'sponsor_rep',
] as const;

const DISPLAY_NAME_MIN = 2;
const DISPLAY_NAME_MAX = 50;
const HTML_RE = /<[^>]*>/;

interface OnboardingRequest {
  personaType: AllowedPersona;
  displayName: string;
  consentVersion: string;
  profileData?: Record<string, unknown>;
}

export const onCompleteOnboarding = onCall<OnboardingRequest>(
  { cors: true },
  async (request) => {
    // Require authentication
    if (!request.auth) {
      throw new https.HttpsError('unauthenticated', 'Must be signed in.');
    }

    const { uid } = request.auth;
    const { personaType, displayName, consentVersion, profileData = {} } = request.data;

    // Validate persona (no staff allowed via this path)
    if (!ALLOWED_PERSONAS.includes(personaType)) {
      throw new https.HttpsError('invalid-argument', 'Invalid persona type.');
    }

    // Validate display name
    if (
      typeof displayName !== 'string' ||
      displayName.length < DISPLAY_NAME_MIN ||
      displayName.length > DISPLAY_NAME_MAX
    ) {
      throw new https.HttpsError('invalid-argument', `displayName must be ${DISPLAY_NAME_MIN}–${DISPLAY_NAME_MAX} characters.`);
    }
    if (HTML_RE.test(displayName)) {
      throw new https.HttpsError('invalid-argument', 'displayName must not contain HTML.');
    }

    // Validate consent version (must be ISO date string)
    if (typeof consentVersion !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(consentVersion)) {
      throw new https.HttpsError('invalid-argument', 'Invalid consent version.');
    }

    const db = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Prevent existing fan accounts from switching to creator roles
    const userDocRef = db.collection('users').doc(uid);
    const existingSnap = await userDocRef.get?.();
    if (existingSnap?.exists) {
      const existingPersona = existingSnap.data?.()?.['personaType'];
      if (existingPersona === 'fan' && personaType !== 'fan') {
        throw new https.HttpsError(
          'failed-precondition',
          'Fan accounts cannot switch to creator or performer roles. Please register a dedicated performer account.',
        );
      }
    }

    // Set custom claim (server-authoritative)
    await admin.auth().setCustomUserClaims(uid, {
      personaType,
      claimsVersion: 1,
    });

    // Update Firestore user record
    await db.collection('users').doc(uid).update({
      displayName,
      personaType,
      onboardedAt: now,
      updatedAt:   now,
      v:           admin.firestore.FieldValue.increment(1),
    });

    // Reserve canonical slug for solo artists
    let slug: string | undefined;
    let canonicalProfileUrl: string | undefined;

    if (personaType === 'artist') {
      const customSlug = typeof profileData['slug'] === 'string' ? profileData['slug'] : undefined;
      const slugInfo = await reserveCreatorSlug(db, {
        creatorId: uid,
        creatorType: 'artist',
        preferredName: displayName,
        customSlug,
      });
      slug = slugInfo.slug;
      canonicalProfileUrl = slugInfo.canonicalProfileUrl;
    }

    // Record consent if provided
    if (consentVersion) {
      const consentId = `${uid}_TOS_${consentVersion}`;
      await db.collection('consent').doc(consentId).set({
        uid,
        consentType: 'TERMS_OF_SERVICE',
        version:     consentVersion,
        granted:     true,
        grantedAt:   now,
        platform:    'web',
        profileData,
      }, { merge: true });
    }

    console.log(`[onCompleteOnboarding] uid=${uid} persona=${personaType} slug=${slug ?? 'none'}`);
    return { success: true, personaType, slug, canonicalProfileUrl };
  },
);
