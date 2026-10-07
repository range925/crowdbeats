/**
 * Crowdbeats V2 — Auth Context & Hook (Phase 5)
 *
 * Provides:
 * - AuthProvider: wraps the app, resolves auth state
 * - useAuth(): typed access to auth state + operations
 *
 * Auth state machine:
 * loading → authenticated (onboarded | unverified | unonboarded) | unauthenticated
 *
 * NEVER expose auth tokens or raw Firebase objects to child components.
 * Use the typed state fields only.
 */

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth, signIn, register, signOut, requestPasswordReset, mapAuthError, probeTokenHealth, requestAccountDeletion } from '../firebase/auth';
import { getUserRecord } from '../firebase/firestore';
import { setSessionCookie, clearSessionCookie } from '../session';
import type { PersonaType } from '@crowdbeats/contracts';

// ── State shape ────────────────────────────────────────────────────────────────

export type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'unverified'      // signed in but email not verified
  | 'unonboarded'     // verified but no personaType
  | 'suspended'       // suspendedAt is set in Firestore
  | 'disabled'        // Firebase Auth user.disabled
  | 'expired'         // token expired and could not be refreshed (rare — SDK auto-refreshes)
  | 'revoked'         // admin revoked the session — force sign-out
  | 'authenticated';  // fully onboarded

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  uid: string | null;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  personaType: PersonaType | null;
  isOnline: boolean;
  error: string | null;
}

interface AuthActions {
  login(email: string, password: string): Promise<void>;
  registerUser(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  clearError(): void;
  refreshAuth(): Promise<void>;
  deleteAccount(): Promise<void>;
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status:      'loading',
    user:        null,
    uid:         null,
    email:       null,
    displayName: null,
    photoUrl:    null,
    personaType: null,
    isOnline:    true,
    error:       null,
  });

  // Online/offline detection
  useEffect(() => {
    const handleOnline  = () => setState(s => ({ ...s, isOnline: true }));
    const handleOffline = () => setState(s => ({ ...s, isOnline: false }));
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    setState(s => ({ ...s, isOnline: navigator.onLine }));
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth state observer
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        clearSessionCookie();
        setState(s => ({
          ...s,
          status:      'unauthenticated',
          user:        null,
          uid:         null,
          email:       null,
          displayName: null,
          photoUrl:    null,
          personaType: null,
          error:       null,
        }));
        return;
      }

      // Email not verified → block onboarding
      if (!user.emailVerified) {
        setSessionCookie({ uid: user.uid, personaType: null, emailVerified: false, onboarded: false });
        setState(s => ({
          ...s,
          status:      'unverified',
          user,
          uid:         user.uid,
          email:       user.email,
          displayName: user.displayName,
          photoUrl:    user.photoURL ?? null,
          personaType: null,
          error:       null,
        }));
        return;
      }

      // Fetch Firestore user record to check suspension + personaType
      try {
        const record = await getUserRecord(user.uid);

        if (record?.deletedAt) {
          clearSessionCookie();
          await signOut();
          setState(s => ({ ...s, status: 'unauthenticated', error: 'Account has been removed.' }));
          return;
        }

        if (record?.suspendedAt) {
          setSessionCookie({ uid: user.uid, personaType: null, emailVerified: true, onboarded: false });
          setState(s => ({
            ...s,
            status:      'suspended',
            user,
            uid:         user.uid,
            email:       user.email,
            displayName: user.displayName,
            photoUrl:    (record?.photoUrl as string | null) ?? user.photoURL ?? null,
            personaType: null,
            error:       null,
          }));
          return;
        }

        const personaType = (record?.personaType as PersonaType | null) ?? null;
        const platformRole = (record?.platformRole as string | null) ?? null;
        const resolvedDisplayName = user.displayName ?? (record?.displayName as string | null) ?? null;
        const status: AuthStatus = personaType ? 'authenticated' : 'unonboarded';
        setSessionCookie({
          uid: user.uid,
          personaType,
          emailVerified: true,
          onboarded: !!personaType,
          platformRole,
          displayName: resolvedDisplayName,
          email: user.email,
        });

        setState(s => ({
          ...s,
          status,
          user,
          uid:         user.uid,
          email:       user.email,
          displayName: resolvedDisplayName,
          photoUrl:    (record?.photoUrl as string | null) ?? user.photoURL ?? null,
          personaType,
          error:       null,
        }));
      } catch {
        // Firestore unavailable — treat as authenticated with no persona for now
        setSessionCookie({ uid: user.uid, personaType: null, emailVerified: user.emailVerified, onboarded: false });
        setState(s => ({
          ...s,
          status:      user.emailVerified ? 'unonboarded' : 'unverified',
          user,
          uid:         user.uid,
          email:       user.email,
          displayName: user.displayName,
          photoUrl:    user.photoURL ?? null,
          personaType: null,
        }));
      }
    });

    return unsub;
  }, []);

  // Periodic token health probe (every 10 minutes)
  // Catches admin-revoked sessions between onAuthStateChanged events.
  useEffect(() => {
    const PROBE_INTERVAL_MS = 10 * 60 * 1000; // 10 min
    const id = setInterval(async () => {
      const health = await probeTokenHealth();
      if (health === 'revoked') {
        clearSessionCookie();
        await signOut();
        setState(s => ({ ...s, status: 'revoked', error: 'Your session has been revoked. Please sign in again.' }));
      } else if (health === 'expired') {
        clearSessionCookie();
        await signOut();
        setState(s => ({ ...s, status: 'expired', error: 'Your session has expired. Please sign in again.' }));
      }
    }, PROBE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, error: null }));
    try {
      await signIn(email, password);
    } catch (err) {
      setState(s => ({ ...s, error: mapAuthError(err) }));
      throw err;
    }
  }, []);

  const registerUser = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, error: null }));
    try {
      await register(email, password);
    } catch (err) {
      setState(s => ({ ...s, error: mapAuthError(err) }));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      clearSessionCookie();
      await signOut();
    } finally {
      // Hard redirect clears all in-memory React state and prevents
      // the back button from returning to the protected dashboard.
      window.location.replace('/auth');
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await requestPasswordReset(email); // Never rejects (enumeration-resistant)
  }, []);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  const refreshAuth = useCallback(async () => {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    await user.reload();
    await user.getIdToken(true);
  }, []);

  const deleteAccount = useCallback(async () => {
    clearSessionCookie();
    await requestAccountDeletion();
    // onAuthStateChanged will fire and set status → unauthenticated
  }, []);

  const value = useMemo(
    () => ({ ...state, login, registerUser, logout, resetPassword, clearError, refreshAuth, deleteAccount }),
    [state, login, registerUser, logout, resetPassword, clearError, refreshAuth, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAuth(): AuthState & AuthActions {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
