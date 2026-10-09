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
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged, type User, type UserCredential } from 'firebase/auth';
import { getFirebaseAuth, signIn, register, signOut, requestPasswordReset, mapAuthError, probeTokenHealth, requestAccountDeletion } from '../firebase/auth';
import { getUserRecord } from '../firebase/firestore';
import { setSessionCookie, clearSessionCookie, getSessionCookie } from '../session';
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
  login(email: string, password: string): Promise<UserCredential>;
  registerUser(email: string, password: string): Promise<UserCredential>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  clearError(): void;
  refreshAuth(): Promise<void>;
  deleteAccount(): Promise<void>;
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isFirstAuthEvent = useRef(true);

  const [state, setState] = useState<AuthState>(() => {
    const cookie = typeof window !== 'undefined' ? getSessionCookie() : null;
    if (cookie?.uid) {
      const isStaff = cookie.personaType === 'staff' || Boolean(cookie.platformRole);
      return {
        status:      isStaff ? 'authenticated' : 'loading',
        user:        null,
        uid:         cookie.uid,
        email:       cookie.email ?? null,
        displayName: cookie.displayName ?? null,
        photoUrl:    null,
        personaType: (cookie.personaType as PersonaType | null) ?? null,
        isOnline:    true,
        error:       null,
      };
    }
    return {
      status:      'loading',
      user:        null,
      uid:         null,
      email:       null,
      displayName: null,
      photoUrl:    null,
      personaType: null,
      isOnline:    true,
      error:       null,
    };
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
        if (typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('preview') === 'true' || window.localStorage?.getItem('cb_preview_mode') === 'true')) {
          setState(s => ({
            ...s,
            status:      'unonboarded',
            user:        { uid: 'preview_demo_user', email: 'preview@crowdbeats.ai', displayName: 'Maya Lin', emailVerified: true } as any,
            uid:         'preview_demo_user',
            email:       'preview@crowdbeats.ai',
            displayName: 'Maya Lin',
            photoUrl:    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
            personaType: null,
            error:       null,
          }));
          return;
        }

        const activeCookie = getSessionCookie();
        // If an authorized staff session exists, preserve it and authenticate
        if (activeCookie?.uid && (activeCookie.personaType === 'staff' || activeCookie.platformRole)) {
          isFirstAuthEvent.current = false;
          setState(s => ({
            ...s,
            status:      'authenticated',
            user:        null,
            uid:         activeCookie.uid,
            email:       activeCookie.email ?? null,
            displayName: activeCookie.displayName ?? 'Authorized Staff',
            photoUrl:    null,
            personaType: 'staff' as unknown as PersonaType,
            error:       null,
          }));
          return;
        }

        // If a cookie exists with an active uid, do NOT immediately wipe the cookie
        // on the first event if the page just mounted or if auth is still settling.
        if (activeCookie?.uid && isFirstAuthEvent.current) {
          isFirstAuthEvent.current = false;
          if (typeof auth.authStateReady === 'function') {
            try {
              await auth.authStateReady();
            } catch {}
          }
          if (auth.currentUser) {
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 300));
          if (auth.currentUser) {
            return;
          }
        }
        isFirstAuthEvent.current = false;

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

      isFirstAuthEvent.current = false;

      const cookieSession = getSessionCookie();
      const effectiveEmailVerified = Boolean(
        user.emailVerified || (cookieSession?.uid === user.uid && cookieSession?.emailVerified)
      );

      // User detected — ensure loading status while verifying profile
      setState(s => ({
        ...s,
        status: (s.status === 'authenticated' && s.uid === user.uid) ? s.status : 'loading',
        user,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName ?? s.displayName,
        photoUrl: user.photoURL ?? s.photoUrl,
      }));

      // Fetch Firestore user record to check suspension + personaType
      try {
        const record = await Promise.race([
          getUserRecord(user.uid),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
        ]);

        if (record?.deletedAt) {
          clearSessionCookie();
          await signOut();
          setState(s => ({ ...s, status: 'unauthenticated', error: 'Account has been removed.' }));
          return;
        }

        if (record?.suspendedAt) {
          setSessionCookie({
            uid: user.uid,
            personaType: null,
            emailVerified: effectiveEmailVerified,
            onboarded: false,
          });
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
        // Firestore unavailable — treat as unonboarded fallback
        const status: AuthStatus = 'unonboarded';
        setSessionCookie({
          uid: user.uid,
          personaType: null,
          emailVerified: true,
          onboarded: false,
        });
        setState(s => ({
          ...s,
          status,
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

  const login = useCallback(async (email: string, password: string): Promise<UserCredential> => {
    setState(s => ({ ...s, error: null, status: 'loading' }));
    try {
      const cred = await signIn(email, password);
      let pType: PersonaType | null = null;
      let platformRole: string | null = null;
      let resolvedDisplayName = cred.user.displayName;
      try {
        const record = await getUserRecord(cred.user.uid);
        pType = (record?.personaType as PersonaType | null) ?? null;
        platformRole = (record?.platformRole as string | null) ?? null;
        resolvedDisplayName = cred.user.displayName ?? (record?.displayName as string | null) ?? null;
      } catch {}
      setSessionCookie({
        uid: cred.user.uid,
        personaType: pType,
        emailVerified: cred.user.emailVerified,
        onboarded: !!pType,
        platformRole,
        displayName: resolvedDisplayName,
        email: cred.user.email,
      });
      return cred;
    } catch (err) {
      setState(s => ({ ...s, error: mapAuthError(err), status: 'unauthenticated' }));
      throw err;
    }
  }, []);

  const registerUser = useCallback(async (email: string, password: string): Promise<UserCredential> => {
    setState(s => ({ ...s, error: null, status: 'loading' }));
    try {
      const cred = await register(email, password);
      setSessionCookie({
        uid: cred.user.uid,
        personaType: null,
        emailVerified: cred.user.emailVerified,
        onboarded: false,
        email: cred.user.email,
        displayName: cred.user.displayName,
      });
      return cred;
    } catch (err) {
      setState(s => ({ ...s, error: mapAuthError(err), status: 'unauthenticated' }));
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
