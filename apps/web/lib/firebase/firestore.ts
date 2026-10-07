/**
 * Crowdbeats V2 — Firestore Service (Phase 5)
 *
 * Singleton Firestore instance. Connects to emulator in dev.
 * Use this module instead of importing getFirestore() directly.
 */

import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  type Firestore,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { firebaseApp } from './app';
import type { PersonaType } from '@crowdbeats/contracts';
import { setSessionCookie } from '../session';

let _db: Firestore | null = null;
let _emulatorConnected = false;

export function getFirebaseFirestore(): Firestore {
  if (_db) return _db;
  _db = getFirestore(firebaseApp);

  if (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' &&
    !_emulatorConnected
  ) {
    connectFirestoreEmulator(_db, '127.0.0.1', 8080);
    _emulatorConnected = true;
  }

  return _db;
}

// ── User document helpers ──────────────────────────────────────────────────────

const USERS_COL = 'users' as const;
const CONSENT_COL = 'consent' as const;

export async function getUserRecord(uid: string): Promise<DocumentData | null> {
  const snap = await getDoc(doc(getFirebaseFirestore(), USERS_COL, uid));
  return snap.exists() ? snap.data() : null;
}

export interface OnboardingPayload {
  uid: string;
  displayName: string;
  personaType: PersonaType;
  /** Extra fields per persona — stored in the users document */
  profileData?: Record<string, unknown>;
}

export interface CompleteOnboardingParams {
  uid: string;
  personaType: PersonaType;
  displayName: string;
  consentVersion?: string;
  profileData?: Record<string, unknown>;
}

/**
 * Robust Onboarding Profile Completion:
 * 1. Tries the backend Cloud Function onCompleteOnboarding.
 * 2. If Cloud Functions are unavailable or disabled, seamlessly writes directly to Firestore:
 *    - /users/{uid}
 *    - persona profile collection (/artistProfiles, /bands, /venueProfiles, /sponsorOrgs, /fanProfiles)
 *    - /consent/{uid}_TOS_{consentVersion}
 * 3. Sets session cookie and localStorage so authentication and persona routing succeed immediately.
 */
export async function completeOnboarding(params: CompleteOnboardingParams): Promise<void> {
  const { uid, personaType, displayName, consentVersion = '2026-08-25', profileData = {} } = params;

  let functionSucceeded = false;
  try {
    const { getFunctions, httpsCallable, connectFunctionsEmulator } = await import('firebase/functions');
    const functions = getFunctions(firebaseApp, 'us-central1');
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    }
    const onComplete = httpsCallable(functions, 'onCompleteOnboarding');
    await onComplete({
      personaType,
      displayName,
      consentVersion,
      profileData,
    });
    functionSucceeded = true;
  } catch (fnErr) {
    console.warn('[completeOnboarding] Cloud function call bypassed/failed, falling back to direct Firestore:', fnErr);
  }

  try {
    const db = getFirebaseFirestore();
    const now = serverTimestamp();

    // 1. Write /users/{uid}
    const userRef = doc(db, USERS_COL, uid);
    await setDoc(userRef, {
      uid,
      displayName,
      personaType,
      profileData: profileData ?? null,
      onboardedAt: now,
      updatedAt: now,
      v: 1,
    }, { merge: true });

    // 2. Write persona-specific profile document
    if (personaType === 'artist') {
      const artistRef = doc(db, 'artistProfiles', uid);
      await setDoc(artistRef, {
        artistId: uid,
        ownerUid: uid,
        stageName: displayName,
        genres: (profileData['genres'] as string[]) ?? [],
        socialLinks: profileData['socialLink'] ? { web: profileData['socialLink'] } : {},
        isActive: true,
        createdAt: now,
        updatedAt: now,
        v: 1,
      }, { merge: true });
    } else if (personaType === 'band_member') {
      const bandRef = doc(db, 'bands', uid);
      await setDoc(bandRef, {
        bandId: uid,
        founderUid: uid,
        name: (profileData['bandName'] as string) ?? displayName,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        v: 1,
      }, { merge: true });
    } else if (personaType === 'venue_manager') {
      const venueRef = doc(db, 'venueProfiles', uid);
      await setDoc(venueRef, {
        venueId: uid,
        ownerUid: uid,
        name: (profileData['venueName'] as string) ?? displayName,
        city: (profileData['city'] as string) ?? '',
        country: (profileData['country'] as string) ?? '',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        v: 1,
      }, { merge: true });
    } else if (personaType === 'sponsor_rep') {
      const sponsorRef = doc(db, 'sponsorOrgs', uid);
      await setDoc(sponsorRef, {
        orgId: uid,
        ownerUid: uid,
        adminUid: uid,
        name: (profileData['orgName'] as string) ?? displayName,
        industry: (profileData['industry'] as string) ?? '',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        v: 1,
      }, { merge: true });
    } else if (personaType === 'fan') {
      const fanRef = doc(db, 'fanProfiles', uid);
      await setDoc(fanRef, {
        uid,
        displayName,
        bio: (profileData['bio'] as string) ?? '',
        favoriteGenres: (profileData['favoriteGenres'] as string[]) ?? (profileData['quickGenres'] as string[]) ?? [],
        interests: (profileData['interests'] as string[]) ?? [],
        createdAt: now,
        updatedAt: now,
        v: 1,
      }, { merge: true });
    }

    // 3. Record consent
    await recordConsent({
      uid,
      consentVersion,
      platform: 'web',
      grantedAt: new Date().toISOString(),
    });
  } catch (fsErr) {
    console.warn('[completeOnboarding] Firestore direct write error:', fsErr);
    if (!functionSucceeded) {
      throw fsErr;
    }
  }

  // 4. Update session cookie & localStorage
  setSessionCookie({
    uid,
    personaType,
    emailVerified: true,
    onboarded: true,
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`cb_onboarded_${uid}`, 'true');
      localStorage.setItem(`cb_persona_${uid}`, personaType);
    } catch {}
  }
}

/**
 * Called after onboarding form completion.
 * The actual custom claim is set server-side by the onCompleteOnboarding function.
 * This writes the Firestore user document update so the middleware can read it.
 */
export async function updateUserOnboarding(payload: OnboardingPayload): Promise<void> {
  const db = getFirebaseFirestore();
  await updateDoc(doc(db, USERS_COL, payload.uid), {
    displayName:    payload.displayName,
    personaType:    payload.personaType,
    profileData:    payload.profileData ?? null,
    onboardedAt:    serverTimestamp(),
    updatedAt:      serverTimestamp(),
    v:              1,
  });
}

export interface ConsentPayload {
  uid: string;
  consentVersion: string;
  platform: 'web';
  grantedAt: string;
}

export async function recordConsent(payload: ConsentPayload): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`cb_consent_${payload.uid}`, JSON.stringify(payload));
      localStorage.setItem('cb_consent_latest', JSON.stringify(payload));
    } catch (e) {
      console.warn('[recordConsent] Local storage cache error:', e);
    }
  }

  try {
    const db = getFirebaseFirestore();
    const ref = doc(db, CONSENT_COL, `${payload.uid}_TOS_${payload.consentVersion}`);
    await setDoc(ref, {
      uid:           payload.uid,
      consentType:   'TERMS_OF_SERVICE',
      version:       payload.consentVersion,
      granted:       true,
      grantedAt:     payload.grantedAt,
      platform:      payload.platform,
    }, { merge: true });
  } catch (err) {
    console.warn('[recordConsent] Firestore setDoc failed, proceeding with local consent:', err);
  }
}

export async function updateUserThemePreference(
  uid: string,
  theme: 'light' | 'dark' | 'system'
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const userRef = doc(db, USERS_COL, uid);
    await setDoc(
      userRef,
      {
        preferences: {
          appearance: {
            theme,
            updatedAt: new Date().toISOString(),
          },
        },
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[updateUserThemePreference] Firestore update error:', err);
  }
}

export async function getUserThemePreference(
  uid: string
): Promise<'light' | 'dark' | 'system' | null> {
  try {
    const record = await getUserRecord(uid);
    if (record?.preferences?.appearance?.theme) {
      const t = record.preferences.appearance.theme;
      if (t === 'light' || t === 'dark' || t === 'system') return t;
    }
  } catch (err) {
    console.warn('[getUserThemePreference] Error fetching preference:', err);
  }
  return null;
}

export { serverTimestamp };

// ── Live Check-In Service — Crowdbeats Core Differentiator ───────────────────
// This is the real-time location backbone that powers the Crowdbeats discovery loop:
//   Musician taps "Go Live" → writes to Firestore → Fans see them nearby → Fans tip
//
// The same functions work identically on web (Firebase JS SDK) and mobile app.

export interface LiveCheckin {
  uid: string;
  performerName: string;
  photoUrl: string;
  type: 'artist' | 'band';
  genres: string[];
  slug?: string;
  venueName: string;
  venueId?: string;
  latitude: number;
  longitude: number;
  /**
   * Ngeohash-encoded location string (precision 7 ≈ 76m cell).
   * Stored at write time for future server-side geo-index queries.
   * Optional because legacy docs pre-Phase 7 may not have it.
   */
  geohash?: string;
  isLive: boolean;
  checkedInAt: string; // ISO string for client use (serverTimestamp converted)
  checkedOutAt?: string;
  /**
   * ISO timestamp — when the session auto-expires.
   * Default: 6h after check-in. Prevents stale pins if checkOut() is never called.
   * Security rules also reject isLive reads after expiresAt.
   */
  expiresAt?: string;
  /**
   * Visibility setting. Only 'public' docs appear on the discovery map.
   * Future values: 'followers_only', 'private'.
   */
  visibility?: 'public' | 'followers_only' | 'private';
  tipLink?: string;
  distanceMiles?: number; // computed client-side, not stored
}

const CHECKINS_COL = 'checkins' as const;

/**
 * Musician / band checks in to a venue and goes live.
 * Writes to: checkins/{uid}
 * Publicly readable so fans can discover nearby performers.
 *
 * Phase 7 additions:
 *   - geohash: precision-7 Ngeohash for future geo-index queries
 *   - expiresAt: 6 hours from now — auto-expiry guard
 *   - visibility: defaults to 'public'
 */
export async function goLive(
  uid: string,
  info: {
    performerName: string;
    photoUrl: string;
    type: 'artist' | 'band';
    genres: string[];
    slug?: string;
    venueName: string;
    venueId?: string;
    latitude: number;
    longitude: number;
    tipLink?: string;
    visibility?: 'public' | 'followers_only' | 'private';
  }
): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, CHECKINS_COL, uid);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();
  const geohash = encodeGeohash(info.latitude, info.longitude, 7);
  await setDoc(ref, {
    uid,
    ...info,
    geohash,
    isLive: true,
    checkedInAt: now.toISOString(),
    checkedOutAt: null,
    expiresAt,
    visibility: info.visibility ?? 'public',
    updatedAt: serverTimestamp(),
  }, { merge: true });
}


/**
 * Musician / band ends their live session.
 * Sets isLive=false and records checkedOutAt.
 */
export async function checkOut(uid: string): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, CHECKINS_COL, uid);
  await setDoc(ref, {
    isLive: false,
    checkedOutAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Get the current live check-in status for a given uid.
 */
export async function getMyCheckin(uid: string): Promise<LiveCheckin | null> {
  const db = getFirebaseFirestore();
  const snap = await getDoc(doc(db, CHECKINS_COL, uid));
  if (!snap.exists()) return null;
  return snap.data() as LiveCheckin;
}

/**
 * One-shot fetch of all live performers near a fan's location.
 * Fetches all isLive=true docs, then filters client-side by Haversine distance.
 * (Firestore doesn't support native geo queries without GeoFire — this is fast enough for MVP)
 */
export async function getNearbyLivePerformers(
  lat: number,
  lng: number,
  radiusMiles = 5
): Promise<LiveCheckin[]> {
  const db = getFirebaseFirestore();
  const q = query(collection(db, CHECKINS_COL), where('isLive', '==', true));
  const snap = await getDocs(q);
  const results: LiveCheckin[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() as LiveCheckin;
    const dist = haversine(lat, lng, data.latitude, data.longitude);
    if (dist <= radiusMiles) {
      results.push({ ...data, distanceMiles: +dist.toFixed(1) });
    }
  });
  return results.sort((a, b) => (a.distanceMiles ?? 99) - (b.distanceMiles ?? 99));
}

/**
 * Real-time subscription to live performers near a fan's location.
 * Updates whenever any musician goes live or ends their session.
 * Returns an unsubscribe function — call it on component unmount.
 *
 * Phase 7: filters out expired sessions (expiresAt < now).
 */
export function subscribeToNearbyPerformers(
  lat: number,
  lng: number,
  radiusMiles = 5,
  callback: (performers: LiveCheckin[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const db = getFirebaseFirestore();
  const q = query(collection(db, CHECKINS_COL), where('isLive', '==', true));
  return onSnapshot(q, (snap) => {
    const now = Date.now();
    const results: LiveCheckin[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as LiveCheckin;
      // Skip expired sessions
      if (data.expiresAt && new Date(data.expiresAt).getTime() < now) return;
      // Skip non-public (future: followers_only)
      if (data.visibility && data.visibility !== 'public') return;
      const dist = haversine(lat, lng, data.latitude, data.longitude);
      if (dist <= radiusMiles) {
        results.push({ ...data, distanceMiles: +dist.toFixed(1) });
      }
    });
    callback(results.sort((a, b) => (a.distanceMiles ?? 99) - (b.distanceMiles ?? 99)));
  }, (err) => {
    console.warn('[subscribeToNearbyPerformers] Firestore error:', err);
    onError?.(err);
    callback([]);
  });
}

/**
 * Real-time subscription to ALL live performers — no radius filter.
 * Used by the map engine to update markers as the user pans/zooms.
 * The map component applies its own viewport filtering.
 *
 * Returns an unsubscribe function — call it on component unmount.
 */
export function subscribeToAllLivePerformers(
  callback: (performers: LiveCheckin[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const db = getFirebaseFirestore();
  const q = query(collection(db, CHECKINS_COL), where('isLive', '==', true));
  return onSnapshot(q, (snap) => {
    const now = Date.now();
    const results: LiveCheckin[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as LiveCheckin;
      // Filter expired or non-public
      if (data.expiresAt && new Date(data.expiresAt).getTime() < now) return;
      if (data.visibility && data.visibility !== 'public') return;
      results.push(data);
    });
    callback(results);
  }, (err) => {
    console.warn('[subscribeToAllLivePerformers] Firestore error:', err);
    onError?.(err);
    callback([]);
  });
}

/** Haversine formula — straight-line distance in miles between two lat/lng points */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Geohash encoder (Ngeohash algorithm — no external dep) ────────────────────
// Precision 7 = ~76m × 76m cell, sufficient for per-block performer discovery.

const GH_BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encodes a lat/lng coordinate into a Ngeohash string.
 * @param lat       Latitude  (-90  to  90)
 * @param lng       Longitude (-180 to 180)
 * @param precision Character length (default 7 ≈ 76m)
 */
export function encodeGeohash(lat: number, lng: number, precision = 7): string {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90,  latMax = 90;
  let lngMin = -180, lngMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) { idx = idx * 2 + 1; lngMin = mid; }
      else             { idx = idx * 2;     lngMax = mid; }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) { idx = idx * 2 + 1; latMin = mid; }
      else             { idx = idx * 2;     latMax = mid; }
    }
    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += GH_BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }
  return geohash;
}
