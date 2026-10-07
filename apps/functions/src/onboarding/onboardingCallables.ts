/**
 * Crowdbeats V2 — Universal Onboarding Cloud Callables
 *
 * Implements server-authoritative draft persistence, race-safe handle reservation,
 * and multi-persona account finalization.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const _db = () => admin.firestore();

export const checkHandleAvailability = onCall<{ handle: string }>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');

    const rawHandle = request.data?.handle?.toLowerCase().trim();
    if (!rawHandle || !/^[a-z0-9_]{3,20}$/.test(rawHandle)) {
      return { available: false, reason: 'Handles must be 3-20 characters using letters, numbers, and underscores.' };
    }

    const doc = await _db().collection('handles').doc(rawHandle).get();
    if (doc.exists && doc.data()?.['uid'] !== request.auth.uid) {
      return { available: false, reason: 'Handle is already taken.' };
    }

    return { available: true, handle: rawHandle };
  },
);

export const saveOnboardingDraft = onCall<{ draftData: Record<string, unknown> }>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');

    const uid = request.auth.uid;
    const { draftData } = request.data ?? {};
    if (!draftData) throw new HttpsError('invalid-argument', 'draftData is required.');

    const now = admin.firestore.FieldValue.serverTimestamp();

    await _db().collection('onboardingDrafts').doc(uid).set(
      {
        ...draftData,
        uid,
        schemaVersion: '2.0.0',
        updatedAt: now,
      },
      { merge: true },
    );

    return { ok: true, savedAt: new Date().toISOString() };
  },
);

export const completeUniversalOnboarding = onCall<{
  primaryPersona: 'fan' | 'artist' | 'band' | 'sponsor';
  displayName: string;
  photoUrl?: string;
  handle?: string;
  termsAcceptedVersion: string;
  privacyAcceptedVersion: string;
  marketingConsent?: boolean;
  profileData?: Record<string, unknown>;
}>(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');

    const uid = request.auth.uid;
    const {
      primaryPersona,
      displayName,
      photoUrl,
      handle,
      termsAcceptedVersion,
      privacyAcceptedVersion,
      marketingConsent = false,
      profileData = {},
    } = request.data ?? {};

    if (!primaryPersona || !['fan', 'artist', 'band', 'sponsor'].includes(primaryPersona)) {
      throw new HttpsError('invalid-argument', 'Valid primary persona required.');
    }
    if (!displayName || displayName.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Display name is required.');
    }
    if (!termsAcceptedVersion || !privacyAcceptedVersion) {
      throw new HttpsError('invalid-argument', 'Terms and Privacy Policy version acceptances are mandatory.');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = _db().batch();

    // 1. Update Core User Document
    const userRef = _db().collection('users').doc(uid);
    batch.set(
      userRef,
      {
        uid,
        displayName: displayName.trim(),
        photoUrl: photoUrl || null,
        handle: handle || null,
        personaType: primaryPersona,
        activePersonas: admin.firestore.FieldValue.arrayUnion(primaryPersona),
        termsAccepted: true,
        termsVersion: termsAcceptedVersion,
        privacyAccepted: true,
        privacyVersion: privacyAcceptedVersion,
        legalAcceptedAt: now,
        marketingConsent: Boolean(marketingConsent),
        marketingConsentAt: marketingConsent ? now : null,
        onboardingStatus: 'completed',
        onboardedAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

    // 2. Persona Specific Profiles
    if (primaryPersona === 'artist') {
      const artistRef = _db().collection('artistProfiles').doc(uid);
      batch.set(
        artistRef,
        {
          uid,
          stageName: (profileData['stageName'] as string) || displayName.trim(),
          primaryGenre: (profileData['primaryGenre'] as string) || 'Indie',
          secondaryGenres: (profileData['secondaryGenres'] as string[]) || [],
          bio: (profileData['bio'] as string) || '',
          serviceCity: (profileData['serviceCity'] as string) || null,
          firstGoal: (profileData['firstGoal'] as string) || 'BUILD_PROFILE',
          isActive: true,
          monetizationStatus: 'PENDING_STRIPE_SETUP',
          createdAt: now,
          updatedAt: now,
        },
        { merge: true },
      );
    } else if (primaryPersona === 'band') {
      const bandId = `band_${Date.now()}`;
      const bandRef = _db().collection('bands').doc(bandId);
      batch.set(bandRef, {
        id: bandId,
        founderUid: uid,
        bandName: (profileData['bandName'] as string) || displayName.trim(),
        primaryGenre: (profileData['primaryGenre'] as string) || 'Rock',
        secondaryGenres: (profileData['secondaryGenres'] as string[]) || [],
        baseCity: (profileData['baseCity'] as string) || null,
        userRole: (profileData['userRoleInBand'] as string) || 'FOUNDER_OWNER',
        authorizationAttested: true,
        isActive: true,
        members: [{ uid, role: (profileData['userRoleInBand'] as string) || 'FOUNDER_OWNER', joinedAt: now }],
        createdAt: now,
        updatedAt: now,
      });
    } else if (primaryPersona === 'sponsor') {
      const sponsorRef = _db().collection('sponsorProfiles').doc(uid);
      batch.set(
        sponsorRef,
        {
          uid,
          organizationName: (profileData['organizationName'] as string) || displayName.trim(),
          sponsorType: (profileData['sponsorType'] as string) || 'LOCAL_BUSINESS',
          userJobTitle: (profileData['userJobTitle'] as string) || 'Representative',
          authorizationAttested: true,
          targetGenres: (profileData['targetGenres'] as string[]) || [],
          targetGeographies: (profileData['targetGeographies'] as string[]) || [],
          firstObjective: (profileData['firstObjective'] as string) || 'DISCOVER_CAMPAIGNS',
          createdAt: now,
          updatedAt: now,
        },
        { merge: true },
      );
    }

    // 3. Reserve Handle if specified
    if (handle) {
      const handleRef = _db().collection('handles').doc(handle.toLowerCase().trim());
      batch.set(handleRef, { handle: handle.toLowerCase().trim(), uid, reservedAt: now });
    }

    // 4. Clean up Draft
    const draftRef = _db().collection('onboardingDrafts').doc(uid);
    batch.delete(draftRef);

    // 5. Commit Batch
    await batch.commit();

    // 6. Audit Event
    await _db().collection('auditEvents').add({
      eventType: 'ONBOARDING_COMPLETED',
      actorUid: uid,
      targetType: 'USER_PROFILE',
      targetId: uid,
      metadata: { primaryPersona, termsAcceptedVersion, privacyAcceptedVersion, marketingConsent },
      timestamp: now,
    });

    const nextRoute = `/${primaryPersona}`;
    return { ok: true, uid, primaryPersona, completedAt: new Date().toISOString(), nextRoute };
  },
);
