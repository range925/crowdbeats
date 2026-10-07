/**
 * Crowdbeats V2 — Firebase Web SDK Initialization (Phase 2)
 *
 * This module initializes the Firebase client SDK for the Next.js web app.
 * All config values come from environment variables — never hardcoded.
 *
 * Emulator routing: When NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true (default in dev),
 * all Firebase services connect to the local Emulator Suite. No cloud data is
 * read or written during development.
 *
 * Architecture invariants:
 * - Never import firebase-admin here — Admin SDK is server-only (apps/functions)
 * - Never call Auth/Firestore directly from Server Components that need auth —
 *   use server-side Admin SDK via a secure callable Function instead
 * - App Check tokens are attached automatically after Phase 5 setup
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
};

/**
 * Singleton Firebase app instance.
 * Uses getApps() to prevent duplicate initialization in Next.js hot-reload.
 */
function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }
  return initializeApp(firebaseConfig);
}

export const firebaseApp = getFirebaseApp();

// ─── Emulator connections ─────────────────────────────────────────────────────
// These are wired in the individual service modules (auth.ts, firestore.ts, etc.)
// to avoid circular imports. Import this module first, then import the service.
// See: apps/web/lib/firebase/auth.ts (Phase 5)
// See: apps/web/lib/firebase/firestore.ts (Phase 5)
// See: apps/web/lib/firebase/storage.ts (Phase 5)
// See: apps/web/lib/firebase/functions.ts (Phase 5)

export { firebaseConfig };
