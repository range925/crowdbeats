/**
 * Crowdbeats V2 — Email Verification Gate (Phase 5)
 * Route: /auth/verify-email
 *
 * Shown to authenticated users whose email is not yet verified.
 * Polls every 3s for verification. Allows resend with 60s cooldown.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { resendVerification } from '@/lib/firebase/auth';
import { CbButton }  from '@/components/ui/Button';
import { CbBanner }  from '@/components/ui/Components';
import { CrowdbeatsLogo }    from '@/components/ui/CbLogo';
import Link          from 'next/link';

import { getPersonaDashboard } from '@/app/auth/page';
import { setSessionCookie, getSessionCookie } from '@/lib/session';

const RESEND_COOLDOWN_S = 60;
const POLL_INTERVAL_MS  = 3000;

export default function VerifyEmailPage() {
  const { user, status, email, personaType, refreshAuth, logout } = useAuth();
  const router = useRouter();
  const [cooldown, setCooldown]   = useState(0);
  const [resending, setResending] = useState(false);
  const [notice, setNotice]       = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect away ONLY if the user is verified, or signed out
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      const cookie = getSessionCookie();
      if (cookie?.uid) return; // wait for hydration
      router.replace('/auth');
      return;
    }
    // Only redirect forward once email is confirmed verified
    if (user?.emailVerified) {
      if (status === 'unonboarded' || !personaType) {
        router.replace('/onboarding');
      } else {
        router.replace(getPersonaDashboard(personaType));
      }
    }
  }, [status, personaType, user?.emailVerified, router]);

  // Poll auth state every 3s to detect when user clicks the email link
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      await refreshAuth();
    }, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [refreshAuth]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setNotice('Verification email sent! Check your inbox and spam folder.');
      setCooldown(RESEND_COOLDOWN_S);
    } catch {
      setNotice('Failed to resend. Please try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '24px 16px',
      background:     'var(--surface-base)',
    }}>
      <div style={{
        width:        '100%',
        maxWidth:     460,
        background:   'var(--surface-raised)',
        border:       '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding:      '40px 32px',
        textAlign:    'center',
      }}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/" aria-label="Crowdbeats home">
            <CrowdbeatsLogo variant="horizontal" height={32} surface="auto" ariaHidden />
          </Link>
        </div>
        <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">✉️</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>
          Check your email
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.6 }}>
          We sent a verification link to
        </p>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 28px' }}>
          {email ?? 'your email address'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 24px', lineHeight: 1.5 }}>
          Click the link in the email to verify your account. This page will automatically continue.
        </p>

        {notice && (
          <CbBanner
            message={notice}
            status="info"
            onDismiss={() => setNotice('')}
            style={{ marginBottom: 20, textAlign: 'left' }}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            style={{
              width: '100%',
              minHeight: 48,
              borderRadius: 9999,
              backgroundColor: cooldown > 0 || resending ? 'rgba(0, 0, 0, 0.4)' : '#000000',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'var(--cb-font-display)',
              cursor: cooldown > 0 || resending ? 'not-allowed' : 'pointer',
              opacity: cooldown > 0 || resending ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              if (cooldown <= 0 && !resending) e.currentTarget.style.backgroundColor = '#1D1D1F';
            }}
            onMouseLeave={(e) => {
              if (cooldown <= 0 && !resending) e.currentTarget.style.backgroundColor = '#000000';
            }}
          >
            {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
          </button>
          <button
            type="button"
            onClick={() => {
              const dest = personaType ? getPersonaDashboard(personaType) : '/onboarding';
              if (user?.uid) {
                setSessionCookie({
                  uid: user.uid,
                  personaType,
                  emailVerified: true,
                  onboarded: !!personaType,
                  displayName: user.displayName,
                  email: user.email,
                });
              }
              router.replace(dest);
            }}
            style={{
              width: '100%',
              minHeight: 44,
              borderRadius: 9999,
              backgroundColor: 'var(--cb-purple-main, #7C3AED)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--cb-font-display)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            Continue to dashboard
          </button>
          <button
            type="button"
            onClick={logout}
            style={{
              width: '100%',
              minHeight: 44,
              borderRadius: 9999,
              backgroundColor: 'transparent',
              color: 'var(--text-secondary, #86868B)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--cb-font-display)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary, #FFFFFF)';
              e.currentTarget.style.borderColor = 'var(--text-primary, #FFFFFF)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary, #86868B)';
              e.currentTarget.style.borderColor = 'var(--border-subtle, rgba(255, 255, 255, 0.12))';
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
