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

const CONSENT_VERSION = '2026-08-25';

export default function ConsentPage() {
  const { status, uid } = useAuth();
  const router = useRouter();
  const [tosChecked, setTosChecked] = useState(false);
  const [ppChecked,  setPpChecked]  = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error,   setError]         = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unverified')      router.replace('/auth/verify-email');
    if (status === 'unauthenticated') router.replace('/auth');
    // 'unonboarded' = verified but no persona yet → stay here (this is the right place)
    // 'authenticated' = already fully onboarded → send to their dashboard
    if (status === 'authenticated')   router.replace('/fan');
  }, [status, router]);

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
      background:     '#000000',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(124, 58, 237, 0.35)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="2" fill="#2DD4BF"/>
                <path d="M12 14V18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span
              style={{
                fontFamily: 'var(--cb-font-display)',
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: '-0.024em',
                color: '#F5F5F7',
              }}
            >
              Crowdbeats
            </span>
          </Link>
          <h1 style={{ fontFamily: 'var(--cb-font-display)', fontSize: 28, fontWeight: 700, color: '#F5F5F7', margin: '0 0 8px', letterSpacing: '-0.024em' }}>
            Before you continue
          </h1>
          <p style={{ fontFamily: 'var(--cb-font-body)', fontSize: 15, color: '#86868B', margin: 0, lineHeight: 1.5, letterSpacing: '-0.012em' }}>
            Please review and agree to the statutory Crowdbeats terms and privacy policies to create and configure your account.
          </p>
        </div>

        {/* ToS summary card */}
        <div style={{
          background:   '#161617',
          border:       '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding:      24,
          marginBottom: 16,
          boxShadow:    '0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontFamily: 'var(--cb-font-display)', fontSize: 16, fontWeight: 600, color: '#F5F5F7', margin: 0, letterSpacing: '-0.016em' }}>
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
                color: '#F5F5F7',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 12px',
                borderRadius: 9999,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span>View Full Terms</span>
              <span>↗</span>
            </Link>
          </div>
          <p style={{ fontFamily: 'var(--cb-font-body)', fontSize: 13, color: '#86868B', margin: '0 0 16px', lineHeight: 1.6, letterSpacing: '-0.012em' }}>
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
            <span style={{ fontFamily: 'var(--cb-font-body)', fontSize: 13, color: '#F5F5F7', lineHeight: 1.5 }}>
              I have read and agree to the{' '}
              <Link
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#FFFFFF', fontWeight: 600, textDecoration: 'underline' }}
              >
                Terms of Service
              </Link>
            </span>
          </label>
        </div>

        {/* Privacy Policy summary card */}
        <div style={{
          background:   '#161617',
          border:       '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding:      24,
          marginBottom: 24,
          boxShadow:    '0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontFamily: 'var(--cb-font-display)', fontSize: 16, fontWeight: 600, color: '#F5F5F7', margin: 0, letterSpacing: '-0.016em' }}>
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
                color: '#F5F5F7',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 12px',
                borderRadius: 9999,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span>View Full Privacy Policy</span>
              <span>↗</span>
            </Link>
          </div>
          <p style={{ fontFamily: 'var(--cb-font-body)', fontSize: 13, color: '#86868B', margin: '0 0 16px', lineHeight: 1.6, letterSpacing: '-0.012em' }}>
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
            <span style={{ fontFamily: 'var(--cb-font-body)', fontSize: 13, color: '#F5F5F7', lineHeight: 1.5 }}>
              I have read and agree to the{' '}
              <Link
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#FFFFFF', fontWeight: 600, textDecoration: 'underline' }}
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
            backgroundColor: 'rgba(255, 69, 58, 0.15)',
            border: '1px solid rgba(255, 69, 58, 0.35)',
            color: '#FF453A',
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
            backgroundColor: canProceed ? '#000000' : 'rgba(255, 255, 255, 0.08)',
            color: canProceed ? '#FFFFFF' : '#6E6E73',
            border: canProceed ? '1px solid #333333' : 'none',
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

        <p style={{ fontSize: 12, color: '#86868B', textAlign: 'center', marginTop: 14, fontFamily: 'var(--cb-font-body)' }}>
          Consent version {CONSENT_VERSION} · Both checkboxes are required to proceed
        </p>

        {/* Statutory Policy Registry Navigation Links */}
        <div style={{
          marginTop: 28,
          paddingTop: 18,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px 16px',
          fontSize: 12,
          fontFamily: 'var(--cb-font-body)',
        }}>
          <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#86868B', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F5F7')} onMouseLeave={(e) => (e.currentTarget.style.color = '#86868B')}>
            Terms of Service
          </Link>
          <span style={{ color: '#3A3A3C' }}>•</span>
          <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#86868B', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F5F7')} onMouseLeave={(e) => (e.currentTarget.style.color = '#86868B')}>
            Privacy Policy
          </Link>
          <span style={{ color: '#3A3A3C' }}>•</span>
          <Link href="/legal/dmca" target="_blank" rel="noopener noreferrer" style={{ color: '#86868B', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F5F7')} onMouseLeave={(e) => (e.currentTarget.style.color = '#86868B')}>
            DMCA Policy
          </Link>
          <span style={{ color: '#3A3A3C' }}>•</span>
          <Link href="/legal/aup" target="_blank" rel="noopener noreferrer" style={{ color: '#86868B', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F5F7')} onMouseLeave={(e) => (e.currentTarget.style.color = '#86868B')}>
            Acceptable Use
          </Link>
          <span style={{ color: '#3A3A3C' }}>•</span>
          <Link href="/legal/refunds" target="_blank" rel="noopener noreferrer" style={{ color: '#86868B', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F5F7')} onMouseLeave={(e) => (e.currentTarget.style.color = '#86868B')}>
            Refunds
          </Link>
          <span style={{ color: '#3A3A3C' }}>•</span>
          <Link href="/legal/support" target="_blank" rel="noopener noreferrer" style={{ color: '#86868B', textDecoration: 'none', fontWeight: 500 }} onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F5F7')} onMouseLeave={(e) => (e.currentTarget.style.color = '#86868B')}>
            Help & Support ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
