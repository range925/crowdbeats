/**
 * Crowdbeats V2 — Auth Page
 * Route: /auth?mode=login|register
 *
 * Tabs: Sign In / Create Account
 * Handles: email+password, Google OAuth
 * Full Light, Dark, and Default/system mode support with zero flash and accessible contrast.
 * Preserves form input state across theme toggles.
 * Centralized, loop-free routing for Fan, Solo Musician, Band, Sponsor, and Admin personas.
 */

'use client';

import React, { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme, type ThemePreference, type ResolvedTheme } from '@/components/theme/ThemeProvider';
import { signInWithGoogle, mapAuthError } from '@/lib/firebase/auth';
import { getUserRecord } from '@/lib/firebase/firestore';
import { setSessionCookie } from '@/lib/session';
import { CbInput } from '@/components/ui/Input';
import { CbBanner } from '@/components/ui/Components';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

// ── Persona → dashboard route helper ─────────────────────────────────────────

export function getPersonaDashboard(personaType: string | null): string {
  switch (personaType) {
    case 'staff':         return '/admin/dashboard';
    case 'artist':        return '/creator/dashboard';
    case 'band_member':   return '/creator/dashboard';
    case 'venue_manager': return '/venue';
    case 'sponsor_rep':   return '/sponsor';
    case 'fan':           return '/fan';
    default:              return '/onboarding';
  }
}

export function getSafeReturnUrl(
  searchParams: ReturnType<typeof useSearchParams> | null,
  personaType: string | null,
): string {
  // If the user has not onboarded yet (no persona assigned), always route to /onboarding
  if (!personaType) {
    return '/onboarding';
  }

  const candidate =
    searchParams?.get('returnUrl') ||
    searchParams?.get('returnTo') ||
    searchParams?.get('return') ||
    searchParams?.get('next');

  if (candidate && candidate.startsWith('/') && !candidate.startsWith('//')) {
    // Prevent redirect loop if return URL points to auth
    if (candidate === '/auth' || candidate.startsWith('/auth/')) {
      return getPersonaDashboard(personaType);
    }
    const tipCents = searchParams?.get('tipCents');
    if (tipCents && !candidate.includes('tipCents=') && !candidate.includes('action=tip')) {
      const separator = candidate.includes('?') ? '&' : '?';
      return `${candidate}${separator}action=tip&tipCents=${encodeURIComponent(tipCents)}`;
    }
    return candidate;
  }
  return getPersonaDashboard(personaType);
}

// ── Appearance Selector (Light, Dark, System) ──────────────────────────────────

function AppearanceSelector({
  preference,
  resolvedTheme,
  onChange,
}: {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  onChange: (pref: ThemePreference) => void;
}) {
  const isDark = resolvedTheme === 'dark';

  return (
    <div
      role="group"
      aria-label="Appearance options"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px',
        borderRadius: 9999,
        background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
        gap: 2,
      }}
    >
      <button
        type="button"
        onClick={() => onChange('light')}
        aria-pressed={preference === 'light'}
        title="Light theme"
        aria-label="Light theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 9999,
          border: 'none',
          cursor: 'pointer',
          background: preference === 'light' ? (isDark ? '#FFFFFF' : '#000000') : 'transparent',
          color: preference === 'light' ? (isDark ? '#000000' : '#FFFFFF') : 'var(--cb-text-secondary)',
          transition: 'all 0.15s ease',
        }}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        onClick={() => onChange('dark')}
        aria-pressed={preference === 'dark'}
        title="Dark theme"
        aria-label="Dark theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 9999,
          border: 'none',
          cursor: 'pointer',
          background: preference === 'dark' ? (isDark ? '#FFFFFF' : '#000000') : 'transparent',
          color: preference === 'dark' ? (isDark ? '#000000' : '#FFFFFF') : 'var(--cb-text-secondary)',
          transition: 'all 0.15s ease',
        }}
      >
        <MoonIcon />
      </button>
      <button
        type="button"
        onClick={() => onChange('system')}
        aria-pressed={preference === 'system'}
        title="System default"
        aria-label="System default"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 8px',
          height: 28,
          borderRadius: 9999,
          border: 'none',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'var(--cb-font-display)',
          background: preference === 'system' ? (isDark ? '#FFFFFF' : '#000000') : 'transparent',
          color: preference === 'system' ? (isDark ? '#000000' : '#FFFFFF') : 'var(--cb-text-secondary)',
          transition: 'all 0.15s ease',
        }}
      >
        Auto
      </button>
    </div>
  );
}

// ── Sub-forms ──────────────────────────────────────────────────────────────────

function LoginForm({
  onSwitch,
  resolvedTheme,
  onNavigating,
}: {
  onSwitch: () => void;
  resolvedTheme: ResolvedTheme;
  onNavigating?: (navigating: boolean) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error, clearError } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const isDark = resolvedTheme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    onNavigating?.(true);
    try {
      const cred = await login(email, password);
      let pType: string | null = null;
      try {
        const record = await getUserRecord(cred.user.uid);
        pType = (record?.personaType as string | null) ?? null;
      } catch {}

      const dest = getSafeReturnUrl(searchParams, pType);
      setSessionCookie({
        uid: cred.user.uid,
        personaType: pType,
        emailVerified: true,
        onboarded: !!pType,
        email: cred.user.email,
        displayName: cred.user.displayName,
      });

      router.replace(dest);
    } catch {
      onNavigating?.(false);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <CbBanner
          message={error}
          status="error"
          onDismiss={clearError}
          style={{ marginBottom: 16 }}
        />
      )}
      <CbInput
        label="Email address"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        fullWidth
        style={{ marginBottom: 14 }}
      />
      <CbInput
        label="Password"
        type="password"
        name="current-password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        fullWidth
        style={{ marginBottom: 6 }}
      />
      <div style={{ textAlign: 'right', marginBottom: 20 }}>
        <Link
          href="/auth/forgot-password"
          style={{
            fontSize: 13,
            color: 'var(--cb-text-primary)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Forgot password?
        </Link>
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          minHeight: 48,
          borderRadius: 9999,
          backgroundColor: isDark ? '#FFFFFF' : '#000000',
          color: isDark ? '#000000' : '#FFFFFF',
          border: 'none',
          fontSize: 15,
          fontWeight: 600,
          fontFamily: 'var(--cb-font-display)',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = isDark ? '#E5E5EA' : '#1D1D1F';
        }}
        onMouseLeave={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000';
        }}
      >
        {loading ? (
          <>
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: `2px solid ${isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)'}`,
                borderTopColor: isDark ? '#000000' : '#FFFFFF',
                animation: 'spin 0.7s linear infinite',
              }}
              role="status"
              aria-label="Signing in..."
            />
            <span>Signing in...</span>
          </>
        ) : (
          'Sign in'
        )}
      </button>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--cb-text-secondary)', lineHeight: 1.5, fontFamily: 'var(--cb-font-body)' }}>
        By signing in, you agree to our{' '}
        <Link href="/legal/terms" style={{ color: 'var(--cb-text-primary)', textDecoration: 'underline' }}>Terms of Service</Link>,{' '}
        <Link href="/legal/privacy" style={{ color: 'var(--cb-text-primary)', textDecoration: 'underline' }}>Privacy Policy</Link>, and{' '}
        <Link href="/legal/dmca" style={{ color: 'var(--cb-text-primary)', textDecoration: 'underline' }}>DMCA Policy</Link>. Need help? Visit our{' '}
        <Link href="/legal/support" style={{ color: 'var(--cb-text-primary)', textDecoration: 'underline', fontWeight: 600 }}>Help & Support Center</Link>.
      </p>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--cb-text-secondary)', fontFamily: 'var(--cb-font-body)' }}>
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          style={{
            color: 'var(--cb-text-primary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'inherit',
            fontWeight: 600,
            fontFamily: 'var(--cb-font-display)',
            textDecoration: 'underline',
          }}
        >
          Create one (100% Free)
        </button>
      </p>
    </form>
  );
}

function RegisterForm({
  onSwitch,
  resolvedTheme,
  onNavigating,
}: {
  onSwitch: () => void;
  resolvedTheme: ResolvedTheme;
  onNavigating?: (navigating: boolean) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerUser, error, clearError } = useAuth();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [password2, setPassword2] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading]     = useState(false);
  const isDark = resolvedTheme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }
    if (password !== password2) {
      setLocalError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    onNavigating?.(true);
    try {
      const cred = await registerUser(email.trim(), password);
      // Brand new user navigates immediately to onboarding
      const returnUrl = searchParams.get('returnUrl') || searchParams.get('returnTo');
      const dest = (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('/auth')) ? returnUrl : '/onboarding';
      setSessionCookie({
        uid: cred.user.uid,
        personaType: null,
        emailVerified: true,
        onboarded: false,
        email: cred.user.email,
        displayName: cred.user.displayName,
      });
      router.replace(dest);
    } catch {
      onNavigating?.(false);
      setLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {displayError && (
        <CbBanner
          message={displayError}
          status="error"
          onDismiss={() => { setLocalError(''); clearError(); }}
          style={{ marginBottom: 16 }}
        />
      )}
      <CbInput
        label="Email address"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        fullWidth
        style={{ marginBottom: 14 }}
      />
      <CbInput
        label="Password"
        type="password"
        name="new-password"
        autoComplete="new-password"
        placeholder="Minimum 8 characters"
        hint="Minimum 8 characters"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        fullWidth
        style={{ marginBottom: 14 }}
      />
      <CbInput
        label="Confirm password"
        type="password"
        name="confirm-password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        value={password2}
        onChange={e => setPassword2(e.target.value)}
        required
        fullWidth
        style={{ marginBottom: 20 }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          minHeight: 48,
          borderRadius: 9999,
          backgroundColor: isDark ? '#FFFFFF' : '#000000',
          color: isDark ? '#000000' : '#FFFFFF',
          border: 'none',
          fontSize: 15,
          fontWeight: 600,
          fontFamily: 'var(--cb-font-display)',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = isDark ? '#E5E5EA' : '#1D1D1F';
        }}
        onMouseLeave={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000';
        }}
      >
        {loading ? (
          <>
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: `2px solid ${isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)'}`,
                borderTopColor: isDark ? '#000000' : '#FFFFFF',
                animation: 'spin 0.7s linear infinite',
              }}
              role="status"
              aria-label="Creating account..."
            />
            <span>Creating account...</span>
          </>
        ) : (
          'Create free account'
        )}
      </button>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--cb-text-secondary)', lineHeight: 1.5, fontFamily: 'var(--cb-font-body)' }}>
        Crowdbeats is 100% free for musicians and fans. By creating an account, you unreservedly agree to our{' '}
        <Link href="/legal/terms" style={{ color: 'var(--cb-text-primary)', textDecoration: 'underline' }}>Terms of Service</Link>,{' '}
        <Link href="/legal/privacy" style={{ color: 'var(--cb-text-primary)', textDecoration: 'underline' }}>Privacy Policy</Link>, and{' '}
        <Link href="/legal/dmca" style={{ color: 'var(--cb-text-primary)', textDecoration: 'underline' }}>DMCA Policy</Link>. Governed by California law. Need assistance? Visit our{' '}
        <Link href="/legal/support" style={{ color: 'var(--cb-text-primary)', textDecoration: 'underline', fontWeight: 600 }}>Help & Support Center</Link>.
      </p>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--cb-text-secondary)', fontFamily: 'var(--cb-font-body)' }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          style={{
            color: 'var(--cb-text-primary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'inherit',
            fontWeight: 600,
            fontFamily: 'var(--cb-font-display)',
            textDecoration: 'underline',
          }}
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

// ── OAuth Buttons ──────────────────────────────────────────────────────────────

function OAuthButtons({
  resolvedTheme,
  onNavigating,
}: {
  resolvedTheme: ResolvedTheme;
  onNavigating?: (navigating: boolean) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collisionError, setCollisionError] = useState('');
  const [loading, setLoading] = useState(false);
  const isDark = resolvedTheme === 'dark';

  const handleGoogle = async () => {
    setLoading(true);
    setCollisionError('');
    onNavigating?.(true);
    try {
      const cred = await signInWithGoogle();
      let pType: string | null = null;
      try {
        const record = await getUserRecord(cred.user.uid);
        pType = (record?.personaType as string | null) ?? null;
      } catch {}

      const dest = getSafeReturnUrl(searchParams, pType);
      setSessionCookie({
        uid: cred.user.uid,
        personaType: pType,
        emailVerified: cred.user.emailVerified,
        onboarded: !!pType,
        email: cred.user.email,
        displayName: cred.user.displayName,
      });

      router.replace(dest);
    } catch (err: unknown) {
      onNavigating?.(false);
      setLoading(false);
      const msg = mapAuthError(err);
      if (msg === 'An account exists with a different sign-in method.') {
        setCollisionError(msg);
      }
    }
  };

  return (
    <div>
      {collisionError && (
        <CbBanner
          message={`${collisionError} Please sign in with email/password to link your account.`}
          status="warning"
          onDismiss={() => setCollisionError('')}
          style={{ marginBottom: 12 }}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogle}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            10,
            height:         44,
            borderRadius:   9999,
            border:         `1px solid ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.12)'}`,
            background:     isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
            color:          'var(--cb-text-primary)',
            fontFamily:     'var(--cb-font-display)',
            fontSize:       14,
            fontWeight:     500,
            cursor:         loading ? 'not-allowed' : 'pointer',
            opacity:        loading ? 0.7 : 1,
            width:          '100%',
            transition:     'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.12)' : '#F5F5F7';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF';
          }}
          aria-label="Continue with Google"
        >
          <GoogleIcon />
          <span>{loading ? 'Connecting Google...' : 'Continue with Google'}</span>
        </button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--cb-text-secondary)', textAlign: 'center', marginTop: 10, lineHeight: 1.4, fontFamily: 'var(--cb-font-body)' }}>
        Secured with Firebase Authentication &amp; Google Identity Services.
      </p>
    </div>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────────

function Divider({ resolvedTheme }: { resolvedTheme: ResolvedTheme }) {
  const isDark = resolvedTheme === 'dark';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)' }} />
      <span style={{ fontSize: 12, color: 'var(--cb-text-tertiary)', fontWeight: 500 }}>or</span>
      <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)' }} />
    </div>
  );
}

// ── Main component (wrapped in Suspense for useSearchParams) ──────────────────

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(modeParam);
  const { status, personaType } = useAuth();
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();
  const [isNavigating, setIsNavigating] = useState(false);
  const isNavigatingRef = useRef(false);

  const handleNavigating = useCallback((navigating: boolean) => {
    isNavigatingRef.current = navigating;
    setIsNavigating(navigating);
  }, []);

  // Sync mode with query params dynamically
  useEffect(() => {
    const currentMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
    setMode(currentMode);
  }, [searchParams]);

  const handleTabChange = (newMode: 'login' | 'register') => {
    setMode(newMode);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', newMode);
      window.history.replaceState(null, '', url.toString());
    }
  };

  // Centralized, unified authentication routing observer
  useEffect(() => {
    if (isNavigating || isNavigatingRef.current) return;
    const isAuthRoute = typeof window !== 'undefined' && (window.location.pathname === '/auth' || window.location.pathname === '/auth/');
    if (!isAuthRoute) return;

    if (status === 'authenticated') {
      const destination = getSafeReturnUrl(searchParams, personaType);
      router.replace(destination);
    } else if (status === 'unonboarded') {
      router.replace('/onboarding');
    } else if (status === 'unverified') {
      if (personaType) {
        router.replace(getSafeReturnUrl(searchParams, personaType));
      } else {
        router.replace('/onboarding');
      }
    }
  }, [status, personaType, searchParams, isNavigating, router]);

  const isDark = resolvedTheme === 'dark';

  return (
    <div
      style={{
        minHeight:      '100vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '40px 16px',
        background:     'var(--cb-bg-app)',
        color:          'var(--cb-text-primary)',
        transition:     'background-color 0.2s ease',
      }}
    >
      <div
        style={{
          width:        '100%',
          maxWidth:     440,
          background:   'var(--cb-surface-1)',
          border:       `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          borderRadius: 24,
          padding:      '36px 30px',
          boxShadow:    isDark
            ? '0 24px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)'
            : '0 20px 48px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
          position:     'relative',
        }}
      >
        {/* Top Bar: Logo & Appearance Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }} aria-label="Crowdbeats home">
            <CrowdbeatsLogo variant="horizontal" height={34} surface="auto" ariaHidden />
          </Link>
          <AppearanceSelector
            preference={themePreference}
            resolvedTheme={resolvedTheme}
            onChange={setThemePreference}
          />
        </div>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--cb-font-display)', fontSize: 24, fontWeight: 700, color: 'var(--cb-text-primary)', margin: 0, letterSpacing: '-0.024em' }}>
            {mode === 'login' ? 'Sign in to Crowdbeats' : 'Create your account'}
          </h1>
          <p style={{ fontFamily: 'var(--cb-font-body)', fontSize: 14, color: 'var(--cb-text-secondary)', margin: '8px 0 0', lineHeight: 1.45, letterSpacing: '-0.012em' }}>
            {mode === 'login'
              ? 'Access your creator dashboard, saved stages, and direct tips'
              : '100% Free platform for solo musicians, bands, and fans'}
          </p>
        </div>

        {/* ── Segmented Tab Switcher (Apple Pill) ── */}
        <div
          role="tablist"
          aria-label="Authentication mode"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            padding: '3px',
            borderRadius: 9999,
            marginBottom: 24,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => handleTabChange('login')}
            style={{
              padding: '8px 0',
              borderRadius: 9999,
              border: 'none',
              background: mode === 'login' ? (isDark ? '#FFFFFF' : '#000000') : 'transparent',
              color: mode === 'login' ? (isDark ? '#000000' : '#FFFFFF') : 'var(--cb-text-secondary)',
              fontWeight: 600,
              fontSize: 13,
              fontFamily: 'var(--cb-font-display)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => handleTabChange('register')}
            style={{
              padding: '8px 0',
              borderRadius: 9999,
              border: 'none',
              background: mode === 'register' ? (isDark ? '#FFFFFF' : '#000000') : 'transparent',
              color: mode === 'register' ? (isDark ? '#000000' : '#FFFFFF') : 'var(--cb-text-secondary)',
              fontWeight: 600,
              fontSize: 13,
              fontFamily: 'var(--cb-font-display)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Create Account
          </button>
        </div>

        {/* OAuth Buttons */}
        <OAuthButtons resolvedTheme={resolvedTheme} onNavigating={handleNavigating} />
        <Divider resolvedTheme={resolvedTheme} />

        {/* Form Body */}
        {mode === 'login'
          ? <LoginForm onSwitch={() => handleTabChange('register')} resolvedTheme={resolvedTheme} onNavigating={handleNavigating} />
          : <RegisterForm onSwitch={() => handleTabChange('login')} resolvedTheme={resolvedTheme} onNavigating={handleNavigating} />
        }
      </div>

      {/* Footer Legal & Support Navigation */}
      <div style={{ display: 'flex', gap: 14, marginTop: 28, fontSize: 12, color: 'var(--cb-text-secondary)', flexWrap: 'wrap', justifyContent: 'center', fontFamily: 'var(--cb-font-body)' }}>
        <Link
          href="/legal/terms"
          style={{ color: 'var(--cb-text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cb-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cb-text-secondary)')}
        >
          Terms of Service
        </Link>
        <span>·</span>
        <Link
          href="/legal/privacy"
          style={{ color: 'var(--cb-text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cb-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cb-text-secondary)')}
        >
          Privacy Policy
        </Link>
        <span>·</span>
        <Link
          href="/legal/dmca"
          style={{ color: 'var(--cb-text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cb-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cb-text-secondary)')}
        >
          DMCA
        </Link>
        <span>·</span>
        <Link
          href="/legal/support"
          style={{ color: 'var(--cb-text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cb-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cb-text-secondary)')}
        >
          Help &amp; Support Center ↗
        </Link>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--cb-bg-app)' }} />}>
      <AuthPageContent />
    </Suspense>
  );
}

// ── SVG icons ──────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2a10.34 10.34 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.97v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.29-1.72V4.95H.97A9 9 0 0 0 0 9c0 1.45.35 2.82.97 4.05l3-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.43 1.34l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .97 4.95L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
}
