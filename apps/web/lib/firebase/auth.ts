/**
 * Crowdbeats V2 — Firebase Auth Service (Phase 5)
 *
 * Singleton getAuth() instance. Connects to Auth Emulator in dev.
 * All auth operations go through this module — never import getAuth() directly.
 *
 * Architecture invariants:
 * - NEVER store or log raw passwords
 * - NEVER expose auth errors that reveal whether an email is registered
 * - All enumeration-sensitive errors return GENERIC_AUTH_ERROR
 * - Token refresh is automatic via Firebase SDK
 */

import {
  getAuth,
  connectAuthEmulator,
  type Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
  type UserCredential,
  type AuthError,
} from 'firebase/auth';
import { firebaseApp } from './app';

// ── Singleton ──────────────────────────────────────────────────────────────────

let _auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(firebaseApp);

  if (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' &&
    !(_auth as Auth & { _emulatorConfig?: unknown })._emulatorConfig
  ) {
    connectAuthEmulator(_auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  }

  return _auth;
}

// ── Error taxonomy ─────────────────────────────────────────────────────────────

/**
 * Enumeration-resistant error messages.
 * NEVER distinguish "user not found" from "wrong password" to clients.
 */
export const AUTH_ERRORS = {
  GENERIC_LOGIN:   'Incorrect email or password.',
  GENERIC_RESET:   'If this email is registered, you\'ll receive a reset link shortly.',
  GENERIC_REGISTER:'Unable to create account. Please try again.',
  EMAIL_IN_USE:    'An account with this email may already exist. Try signing in.',
  NETWORK:         'Connection error. Please check your internet connection.',
  TOO_MANY:        'Too many attempts. Please wait a few minutes before trying again.',
  DISABLED:        'This account has been disabled. Contact support for assistance.',
  COLLISION:       'An account exists with a different sign-in method.',
  CANCELLED:       'Sign-in was cancelled. Please try again.',
  INVALID_EMAIL:   'Please enter a valid email address.',
  WEAK_PASSWORD:   'Password must be at least 8 characters.',
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;

/**
 * Maps Firebase AuthError codes to user-safe messages.
 * Collapses enumeration-sensitive codes to the same message.
 */
export function mapAuthError(err: unknown): string {
  const code = (err as AuthError)?.code ?? '';

  switch (code) {
    // Enumeration-sensitive — all → same message
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return AUTH_ERRORS.GENERIC_LOGIN;

    case 'auth/email-already-in-use':
    case 'auth/email-already-exists':
      return AUTH_ERRORS.EMAIL_IN_USE;

    case 'auth/network-request-failed':
    case 'auth/internal-error':
      return AUTH_ERRORS.NETWORK;

    case 'auth/too-many-requests':
      return AUTH_ERRORS.TOO_MANY;

    case 'auth/user-disabled':
      return AUTH_ERRORS.DISABLED;

    case 'auth/account-exists-with-different-credential':
      return AUTH_ERRORS.COLLISION;

    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return AUTH_ERRORS.CANCELLED;

    case 'auth/invalid-email':
      return AUTH_ERRORS.INVALID_EMAIL;

    case 'auth/weak-password':
      return AUTH_ERRORS.WEAK_PASSWORD;

    default:
      return AUTH_ERRORS.GENERIC_LOGIN;
  }
}

// ── Auth operations ────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function register(email: string, password: string): Promise<UserCredential> {
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  try {
    await sendEmailVerification(cred.user);
  } catch (err) {
    console.warn('sendEmailVerification non-fatal warning:', err);
  }
  return cred;
}

export async function resendVerification(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (user) await sendEmailVerification(user);
}

/** Enumeration-resistant: always resolves (never rejects to caller) */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  } catch {
    // Intentionally swallowed — enumeration resistance
  }
}

export async function signOut(): Promise<void> {
  return firebaseSignOut(getFirebaseAuth());
}

// ── OAuth providers ────────────────────────────────────────────────────────────

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

/**
 * Attempt Google sign-in via popup.
 * On credential-in-use collision, caller receives the error and shows recovery UI.
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(getFirebaseAuth(), googleProvider);
}

/**
 * Account-linking recovery: link pending credential to existing account.
 */
export async function linkAccountCredential(
  existingCred: ReturnType<typeof GoogleAuthProvider.credentialFromError>,
): Promise<UserCredential | null> {
  const user = getFirebaseAuth().currentUser;
  if (!user || !existingCred) return null;
  return linkWithCredential(user, existingCred);
}

// ── Session helpers ────────────────────────────────────────────────────────────

/**
 * Get the current ID token result (includes custom claims).
 * Forces refresh if forceRefresh=true (use after onboarding completes).
 */
export async function getIdTokenResult(forceRefresh = false) {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  return user.getIdTokenResult(forceRefresh);
}

export { GoogleAuthProvider };

// ── Token health probe ─────────────────────────────────────────────────────────

/**
 * Attempts a silent token refresh.
 * Returns 'ok' | 'expired' | 'revoked' | 'no-user'.
 * Called periodically and on every API 401/403 response.
 */
export async function probeTokenHealth(): Promise<'ok' | 'expired' | 'revoked' | 'no-user'> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return 'no-user';
  try {
    await user.getIdToken(true); // force refresh
    return 'ok';
  } catch (err) {
    const code = (err as AuthError)?.code ?? '';
    if (code === 'auth/id-token-revoked' || code === 'auth/user-token-expired') return 'revoked';
    return 'expired';
  }
}

// ── Account deletion ───────────────────────────────────────────────────────────

/**
 * Initiates account deletion.
 * Phase 5: soft-delete marker written to Firestore by calling
 * a Cloud Function (requestAccountDeletion) — not yet implemented.
 * For now: signs the user out and clears local state.
 * Full hard-delete (GDPR cascade) implemented server-side in Phase 7.
 */
export async function requestAccountDeletion(): Promise<void> {
  // TODO Phase 7: call requestAccountDeletion cloud function for GDPR cascade
  // For Phase 5: immediate sign-out; Firestore deletedAt is set server-side
  await firebaseSignOut(getFirebaseAuth());
}
