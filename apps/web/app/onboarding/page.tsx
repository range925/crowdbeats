/**
 * Crowdbeats V2 — Onboarding Step 1: Consent (Phase 5)
 * Route: /onboarding
 *
 * User must agree to ToS + Privacy Policy before choosing a persona.
 * Consent is recorded server-side via onCompleteOnboarding function and cached locally.
 * Consent version: 2026-08-25
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { recordConsent } from '@/lib/firebase/firestore';
import { CbButton } from '@/components/ui/Button';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';
import { getPersonaDashboard } from '@/app/auth/page';
import { getSessionCookie } from '@/lib/session';

const CONSENT_VERSION = '2026-08-25';

export default function ConsentPage() {
  const { status, uid, personaType } = useAuth();
  const router = useRouter();
  const [tosChecked, setTosChecked] = useState(false);
  const [ppChecked,  setPpChecked]  = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error,   setError]         = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      const cookie = getSessionCookie();
      if (cookie?.uid) return; // session cookie exists, wait for Firebase Auth hydration
      router.replace('/auth');
      return;
    }
    // 'unonboarded' = no persona chosen yet → stay here (this is the right place)
    // 'authenticated' = already fully onboarded → send to their dashboard
    if (status === 'authenticated') {
      router.replace(getPersonaDashboard(personaType));
    }
  }, [status, personaType, router]);

  const canProceed = tosChecked && ppChecked;

  const handleContinue = async () => {
    if (!canProceed) return;
    setLoading(true);
    setError('');

    const grantedAt = new Date().toISOString();
    const activeUid = uid || 'guest_onboarding_' + Date.now();

    // Cache consent locally in all circumstances
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cb_consent_${activeUid}`, JSON.stringify({
          uid: activeUid,
          consentVersion: CONSENT_VERSION,
          platform: 'web',
          grantedAt,
        }));
        localStorage.setItem('cb_consent_latest', JSON.stringify({
          uid: activeUid,
          consentVersion: CONSENT_VERSION,
          platform: 'web',
          grantedAt,
        }));
      } catch (e) {
        console.warn('Local consent storage warning:', e);
      }
    }

    try {
      if (uid) {
        await recordConsent({
          uid,
          consentVersion: CONSENT_VERSION,
          platform: 'web',
          grantedAt,
        });
      }
      router.push('/onboarding/persona');
    } catch (err) {
      console.warn('Non-blocking consent record notice:', err);
      // If client stored consent locally, allow proceeding to persona selection
      router.push('/onboarding/persona');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'flex-start',
      justifyContent: 'center',
      padding:        '56px 16px 80px',
      background:     'var(--cb-bg-app, #FBFBFD)',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', marginBottom: 16 }} aria-label="Crowdbeats home">
            <CrowdbeatsLogo variant="horizontal" height={32} surface="light" ariaHidden />
          </Link>
          <h1 style={{ fontFamily: 'var(--cb-font-display)', fontSize: 28, fontWeight: 700, color: 'var(--cb-text-primary, #0A0A0B)', margin: '0 0 8px', letterSpacing: '-0.024em' }}>
            Before you continue
          </h1>
          <p style={{ fontFamily: 'var(--cb-font-body)', fontSize: 15, color: 'var(--cb-text-secondary, #64748B)', margin: 0, lineHeight: 1.5, letterSpacing: '-0.012em' }}>
            Please review and agree to the statutory Crowdbeats terms and privacy policies to create and configure your account.
          </p>
        </div>

        {/* ToS summary card */}
        <div style={{
          background:   'var(--cb-surface-card, #FFFFFF)',
          border:       '1px solid var(--cb-border, #E2E8F0)',
          borderRadius: 20,
          padding:      24,
          marginBottom: 16,
          boxShadow:    '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontFamily: 'var(--cb-font-display)', fontSize: 16, fontWeight: 600, color: 'var(--cb-text-primary, #0A0A0B)', margin: 0, letterSpacing: '-0.016em' }}>
              Terms of Service — v{CONSENT_VERSION}
            </h2>
            <Link
              href="/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                fontWeight: 500,
                fontFamily: 'var(--cb-font-display)',
                color: 'var(--cb-text-primary, #0A0A0B)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 12px',
                borderRadius: 9999,
                backgroundColor: 'var(--cb-surface-2, #F8FAFC)',
                border: '1px solid var(--cb-border, #CBD5E1)',
              }}
            >
              <span>View Full Terms</span>
              <span>↗</span>
            </Link>
          </div>
          <p style={{ fontFamily: 'var(--cb-font-body)', fontSize: 13, color: 'var(--cb-text-secondary, #64748B)', margin: '0 0 16px', lineHeight: 1.6, letterSpacing: '-0.012em' }}>
            By using Crowdbeats you agree to: tip transactions are final after 24 hours; you must be 13+ years of age; content you post must not infringe third-party copyrights or rights of publicity; Crowdbeats charges a transparent 6% platform fee on tips; standard Stripe.com processing (2.9% + 30¢) applies; accounts may be suspended for violations of our Acceptable Use Policy.
          </p>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={tosChecked}
              onChange={e => setTosChecked(e.target.checked)}
              style={{ marginTop: 2, width: 18, height: 18, accentColor: '#000000', flexShrink: 0, cursor: 'pointer' }}
              aria-label="I have read and agree to the Terms of Service"
            />
            <span style={{ fontFamily: 'var(--cb-font-body)', fontSize: 13, color: 'var(--cb-text-primary, #0A0A0B)', lineHeight: 1.5 }}>
              I have read and agree to the{' '}
              <Link
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#000000', fontWeight: 600, textDecoration: 'underline' }}
              >
                Terms of Service
              </Link>
            </span>
          </label>
        </div>

        {/* Privacy Policy summary card */}
        <div style={{
          background:   'var(--cb-surface-card, #FFFFFF)',
          border:       '1px solid var(--cb-border, #E2E8F0)',
          borderRadius: 20,
          padding:      24,
          marginBottom: 24,
          boxShadow:    '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontFamily: 'var(--cb-font-display)', fontSize: 16, fontWeight: 600, color: 'var(--cb-text-primary, #0A0A0B)', margin: 0, letterSpacing: '-0.016em' }}>
              Privacy Policy & Data Rights
            </h2>
            <Link
              href="/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                fontWeight: 500,
                fontFamily: 'var(--cb-font-display)',
                color: 'var(--cb-text-primary, #0A0A0B)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 12px',
                borderRadius: 9999,
                backgroundColor: 'var(--cb-surface-2, #F8FAFC)',
                border: '1px solid var(--cb-border, #CBD5E1)',
              }}
            >
              <span>View Full Privacy Policy</span>
              <span>↗</span>
            </Link>
          </div>
          <p style={{ fontFamily: 'var(--cb-font-body)', fontSize: 13, color: 'var(--cb-text-secondary, #64748B)', margin: '0 0 16px', lineHeight: 1.6, letterSpacing: '-0.012em' }}>
            Crowdbeats collects your email, display name, and transactional data exclusively to operate the platform and facilitate direct creator payouts. We do not sell or share your personal information. Under CCPA §1798.100 and GDPR Art. 15, you may request full data export or account deletion at any time in Account Settings.
          </p>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={ppChecked}
              onChange={e => setPpChecked(e.target.checked)}
              style={{ marginTop: 2, width: 18, height: 18, accentColor: '#000000', flexShrink: 0, cursor: 'pointer' }}
              aria-label="I have read and agree to the Privacy Policy"
            />
            <span style={{ fontFamily: 'var(--cb-font-body)', fontSize: 13, color: 'var(--cb-text-primary, #0A0A0B)', lineHeight: 1.5 }}>
              I have read and agree to the{' '}
              <Link
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#000000', fontWeight: 600, textDecoration: 'underline' }}
              >
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#DC2626',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
            fontFamily: 'var(--cb-font-body)',
          }} role="alert">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={!canProceed || loading}
          onClick={handleContinue}
          style={{
            width: '100%',
            minHeight: 48,
            borderRadius: 9999,
            backgroundColor: canProceed ? '#000000' : 'var(--cb-surface-3, #E2E8F0)',
            color: canProceed ? '#FFFFFF' : 'var(--cb-text-muted, #94A3B8)',
            border: canProceed ? '1px solid #000000' : 'none',
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'var(--cb-font-display)',
            cursor: canProceed && !loading ? 'pointer' : 'not-allowed',
            opacity: loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            if (canProceed && !loading) e.currentTarget.style.backgroundColor = '#1D1D1F';
          }}
          onMouseLeave={(e) => {
            if (canProceed && !loading) e.currentTarget.style.backgroundColor = '#000000';
          }}
        >
          {loading ? 'Please wait...' : 'I agree — continue'}
        </button>

        <p style={{ fontSize: 12, color: 'var(--cb-text-secondary, #64748B)', textAlign: 'center', marginTop: 14, fontFamily: 'var(--cb-font-body)' }}>
          Consent version {CONSENT_VERSION} · Both checkboxes are required to proceed
        </p>

        {/* Statutory Policy Registry Navigation Links */}
        <div style={{
          marginTop: 28,
          paddingTop: 18,
          borderTop: '1px solid var(--cb-border, #E2E8F0)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px 16px',
          fontSize: 12,
          fontFamily: 'var(--cb-font-body)',
        }}>
          <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cb-text-secondary, #64748B)', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#0A0A0B')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cb-text-secondary, #64748B)')}>
            Terms of Service
          </Link>
          <span style={{ color: 'var(--cb-border-medium, #CBD5E1)' }}>•</span>
          <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cb-text-secondary, #64748B)', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#0A0A0B')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cb-text-secondary, #64748B)')}>
            Privacy Policy
          </Link>
          <span style={{ color: 'var(--cb-border-medium, #CBD5E1)' }}>•</span>
          <Link href="/legal/dmca" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cb-text-secondary, #64748B)', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#0A0A0B')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cb-text-secondary, #64748B)')}>
            DMCA Policy
          </Link>
          <span style={{ color: 'var(--cb-border-medium, #CBD5E1)' }}>•</span>
          <Link href="/legal/aup" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cb-text-secondary, #64748B)', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#0A0A0B')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cb-text-secondary, #64748B)')}>
            Acceptable Use
          </Link>
          <span style={{ color: 'var(--cb-border-medium, #CBD5E1)' }}>•</span>
          <Link href="/legal/refunds" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cb-text-secondary, #64748B)', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#0A0A0B')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cb-text-secondary, #64748B)')}>
            Refunds
          </Link>
          <span style={{ color: 'var(--cb-border-medium, #CBD5E1)' }}>•</span>
          <Link href="/legal/support" target="_blank" rel="noopener noreferrer" style={{ color: '#7C3AED', textDecoration: 'none', fontWeight: 600 }} onMouseEnter={(e) => (e.currentTarget.style.color = '#6D28D9')} onMouseLeave={(e) => (e.currentTarget.style.color = '#7C3AED')}>
            Help & Support ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
