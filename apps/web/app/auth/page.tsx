/**
 * Crowdbeats V2 — Auth Page (Phase 5)
 * Route: /auth?mode=login|register
 *
 * Tabs: Sign In / Create Account
 * Handles: email+password, Google
 * 100% Free Platform Model for Musicians and Fans
 * All errors are enumeration-resistant.
 */

'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { signInWithGoogle, mapAuthError, GoogleAuthProvider } from '@/lib/firebase/auth';
import { CbButton }  from '@/components/ui/Button';
import { CbInput }   from '@/components/ui/Input';
import { CbBanner }  from '@/components/ui/Components';
import { CrowdbeatsLogo }  from '@/components/ui/CbLogo';

// ── Persona → dashboard route helper ─────────────────────────────────────────

function getPersonaDashboard(personaType: string | null): string {
  switch (personaType) {
    case 'staff':         return '/admin/dashboard';
    case 'artist':        return '/creator/dashboard';
    case 'band_member':   return '/creator/dashboard';
    case 'venue_manager': return '/venue/dashboard';
    case 'sponsor_rep':   return '/sponsor/dashboard';
    case 'fan':
    default:              return '/fan';
  }
}

function getSafeReturnUrl(searchParams: ReturnType<typeof useSearchParams>, personaType: string | null): string {
  const candidate = searchParams?.get('returnUrl') || searchParams?.get('returnTo') || searchParams?.get('next');
  if (candidate && candidate.startsWith('/') && !candidate.startsWith('//')) {
    const tipCents = searchParams?.get('tipCents');
    if (tipCents && !candidate.includes('tipCents=') && !candidate.includes('action=tip')) {
      const separator = candidate.includes('?') ? '&' : '?';
      return `${candidate}${separator}action=tip&tipCents=${encodeURIComponent(tipCents)}`;
    }
    return candidate;
  }
  return getPersonaDashboard(personaType);
}

// ── Sub-forms ──────────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login, error, clearError, status, personaType } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      await login(email, password);
      // onAuthStateChanged → middleware / useEffect will redirect
    } catch {
      // error is set by login()
    } finally {
      setLoading(false);
    }
  };

  // Redirect when fully authenticated — pick return destination or correct dashboard by persona
  useEffect(() => {
    if (status === 'authenticated') router.replace(getSafeReturnUrl(searchParams, personaType));
    if (status === 'unonboarded')  router.replace('/onboarding');
    if (status === 'unverified')   router.replace('/auth/verify-email');
  }, [status, personaType, router, searchParams]);

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
          style={{ fontSize: 13, color: '#000000', textDecoration: 'none', fontWeight: 500 }}
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
          backgroundColor: '#000000',
          color: '#FFFFFF',
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
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D1D1F')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#000000')}
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#86868B', lineHeight: 1.5, fontFamily: 'var(--cb-font-body)' }}>
        By signing in, you agree to our{' '}
        <Link href="/legal/terms" style={{ color: '#000000', textDecoration: 'underline' }}>Terms of Service</Link>,{' '}
        <Link href="/legal/privacy" style={{ color: '#000000', textDecoration: 'underline' }}>Privacy Policy</Link>, and{' '}
        <Link href="/legal/dmca" style={{ color: '#000000', textDecoration: 'underline' }}>DMCA Policy</Link>. Need help? Visit our{' '}
        <Link href="/legal/support" style={{ color: '#000000', textDecoration: 'underline', fontWeight: 600 }}>Help & Support Center</Link>.
      </p>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#86868B', fontFamily: 'var(--cb-font-body)' }}>
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          style={{ color: '#000000', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', fontWeight: 600, fontFamily: 'var(--cb-font-display)', textDecoration: 'underline' }}
        >
          Create one (100% Free)
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { registerUser, error, clearError, status, personaType } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [password2, setPassword2] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading]     = useState(false);

  // Redirect on successful registration / status update
  useEffect(() => {
    if (status === 'authenticated') router.replace(getSafeReturnUrl(searchParams, personaType));
    if (status === 'unonboarded')  router.replace('/onboarding');
    if (status === 'unverified')   router.replace('/auth/verify-email');
  }, [status, personaType, router, searchParams]);

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
    try {
      await registerUser(email.trim(), password);
      router.replace('/auth/verify-email');
    } catch {
      // error set by registerUser()
    } finally {
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
          backgroundColor: '#000000',
          color: '#FFFFFF',
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
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D1D1F')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#000000')}
      >
        {loading ? 'Creating account...' : 'Create free account'}
      </button>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#86868B', lineHeight: 1.5, fontFamily: 'var(--cb-font-body)' }}>
        Crowdbeats is 100% free for musicians and fans. By creating an account, you unreservedly agree to our{' '}
        <Link href="/legal/terms" style={{ color: '#000000', textDecoration: 'underline' }}>Terms of Service</Link>,{' '}
        <Link href="/legal/privacy" style={{ color: '#000000', textDecoration: 'underline' }}>Privacy Policy</Link>, and{' '}
        <Link href="/legal/dmca" style={{ color: '#000000', textDecoration: 'underline' }}>DMCA Policy</Link>. Governed by California law. Need assistance? Visit our{' '}
        <Link href="/legal/support" style={{ color: '#000000', textDecoration: 'underline', fontWeight: 600 }}>Help & Support Center</Link>.
      </p>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#86868B', fontFamily: 'var(--cb-font-body)' }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          style={{ color: '#000000', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', fontWeight: 600, fontFamily: 'var(--cb-font-display)', textDecoration: 'underline' }}
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

// ── OAuth Buttons ──────────────────────────────────────────────────────────────

function OAuthButtons() {
  const [collisionError, setCollisionError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    setCollisionError('');
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = mapAuthError(err);
      if (msg === 'An account exists with a different sign-in method.') {
        setCollisionError(msg);
      }
    } finally {
      setLoading(false);
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
            border:         '1px solid #000000',
            background:     '#000000',
            color:          '#FFFFFF',
            fontFamily:     'var(--cb-font-display)',
            fontSize:       14,
            fontWeight:     500,
            cursor:         'pointer',
            opacity:        loading ? 0.7 : 1,
            width:          '100%',
            transition:     'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1A1A1A')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#000000')}
          aria-label="Continue with Google"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </div>
      <p style={{ fontSize: 11, color: '#86868B', textAlign: 'center', marginTop: 10, lineHeight: 1.4, fontFamily: 'var(--cb-font-body)' }}>
        Secured with Firebase Authentication & Google Identity Services.
      </p>
    </div>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>or</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
    </div>
  );
}

// ── Main component (wrapped in Suspense for useSearchParams) ──────────────────

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(modeParam);
  const { status } = useAuth();

  // Sync mode with query params dynamically
  useEffect(() => {
    const currentMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
    setMode(currentMode);
  }, [searchParams]);

  const handleTabChange = (newMode: 'login' | 'register') => {
    setMode(newMode);
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', newMode);
    router.push(`/auth?${params.toString()}`);
  };

  // Loading overlay
  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite' }} role="status" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '40px 16px',
      background:     '#000000',
    }}>
      <div style={{
        width:        '100%',
        maxWidth:     440,
        background:   'var(--surface-1, #FFFFFF)',
        border:       '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding:      '36px 30px',
        boxShadow:    '0 24px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
      }}>
        {/* Brand Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', marginBottom: 16 }} aria-label="Crowdbeats home">
            <CrowdbeatsLogo variant="horizontal" height={36} surface="auto" ariaHidden />
          </Link>
          <h1 style={{ fontFamily: 'var(--cb-font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', margin: 0, letterSpacing: '-0.024em' }}>
            {mode === 'login' ? 'Sign in to Crowdbeats' : 'Create your account'}
          </h1>
          <p style={{ fontFamily: 'var(--cb-font-body)', fontSize: 14, color: '#86868B', margin: '8px 0 0', lineHeight: 1.45, letterSpacing: '-0.012em' }}>
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
            background: 'rgba(0, 0, 0, 0.05)',
            padding: '3px',
            borderRadius: 9999,
            marginBottom: 24,
            border: '1px solid rgba(0, 0, 0, 0.08)',
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
              background: mode === 'login' ? '#000000' : 'transparent',
              color: mode === 'login' ? '#FFFFFF' : '#86868B',
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
              background: mode === 'register' ? '#000000' : 'transparent',
              color: mode === 'register' ? '#FFFFFF' : '#86868B',
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
        <OAuthButtons />
        <Divider />

        {/* Form Body */}
        {mode === 'login'
          ? <LoginForm onSwitch={() => handleTabChange('register')} />
          : <RegisterForm onSwitch={() => handleTabChange('login')} />
        }
      </div>

      {/* Footer Legal & Support Navigation */}
      <div style={{ display: 'flex', gap: 14, marginTop: 28, fontSize: 12, color: '#86868B', flexWrap: 'wrap', justifyContent: 'center', fontFamily: 'var(--cb-font-body)' }}>
        <Link href="/legal/terms" style={{ color: '#86868B', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')} onMouseLeave={(e) => (e.currentTarget.style.color = '#86868B')}>Terms of Service</Link>
        <span>·</span>
        <Link href="/legal/privacy" style={{ color: '#86868B', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')} onMouseLeave={(e) => (e.currentTarget.style.color = '#86868B')}>Privacy Policy</Link>
        <span>·</span>
        <Link href="/legal/dmca" style={{ color: '#86868B', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')} onMouseLeave={(e) => (e.currentTarget.style.color = '#86868B')}>DMCA</Link>
        <span>·</span>
        <Link href="/legal/support" style={{ color: '#86868B', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')} onMouseLeave={(e) => (e.currentTarget.style.color = '#86868B')}>Help & Support Center ↗</Link>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--surface-base)' }} />}>
      <AuthPageContent />
    </Suspense>
  );
}

// ── SVG icons ──────────────────────────────────────────────────────────────────

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


