'use client';

/**
 * Crowdbeats V2 — CCPA § 1798.100 & GDPR Art. 15 Privacy & Statutory Consent Widget
 * 
 * Complies with:
 * - California Civil Code § 1798.100 (Notice at Collection & Right to Know)
 * - California Civil Code § 1798.120 (Do Not Sell or Share Personal Info)
 * - EU GDPR Article 15 (Right of Access by the Data Subject)
 * 
 * Enforces Zero-Tracking default until explicit affirmative user choice.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getStoredConsent,
  saveConsentRecord,
  CURRENT_PRIVACY_VERSION,
  type PrivacyConsentRecord,
} from '@/lib/compliance/privacyConsent';

export function PrivacyConsentWidget() {
  const [mounted, setMounted] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  // Granular preference state for customization
  const [optAnalytics, setOptAnalytics] = useState(false);
  const [optGeolocation, setOptGeolocation] = useState(false);

  useEffect(() => {
    setMounted(true);
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    const previewMode = (typeof window !== 'undefined' && window.location.search.includes('preview=1')) || inIframe;
    setIsPreview(previewMode);
    if (storedConsentFound() || previewMode) {
      setHasConsent(true);
      setIsBannerVisible(false);
      const stored = getStoredConsent();
      setOptAnalytics(stored?.analytics ?? false);
      setOptGeolocation(stored?.ephemeralGeolocation ?? false);
    } else {
      // First-time user: display consent banner immediately with ZERO tracking active
      setHasConsent(false);
      setIsBannerVisible(true);
    }

    const handleConsentUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<PrivacyConsentRecord | null>;
      if (customEvent.detail) {
        setHasConsent(true);
        setIsBannerVisible(false);
        setIsModalOpen(false);
        setOptAnalytics(customEvent.detail.analytics);
        setOptGeolocation(customEvent.detail.ephemeralGeolocation);
      } else {
        setHasConsent(false);
        setIsBannerVisible(true);
      }
    };

    const handleOpenModal = () => {
      setIsModalOpen(true);
    };

    window.addEventListener('cb_privacy_consent_updated', handleConsentUpdate);
    window.addEventListener('cb_open_privacy_modal', handleOpenModal);
    return () => {
      window.removeEventListener('cb_privacy_consent_updated', handleConsentUpdate);
      window.removeEventListener('cb_open_privacy_modal', handleOpenModal);
    };
  }, []);

  function storedConsentFound(): boolean {
    return getStoredConsent() !== null;
  }

  if (!mounted || isPreview) return null;
  if (!isBannerVisible && !isModalOpen) return null;

  const handleAcceptAll = () => {
    const record: PrivacyConsentRecord = {
      version: CURRENT_PRIVACY_VERSION,
      status: 'accepted_all',
      timestamp: new Date().toISOString(),
      strictlyNecessary: true,
      analytics: true,
      ephemeralGeolocation: true,
      doNotSellOrShare: true,
      ccpaSection1798Acknowledged: true,
      gdprArticle15Acknowledged: true,
    };
    saveConsentRecord(record);
    setIsBannerVisible(false);
    setIsModalOpen(false);
  };

  const handleLimitToEssential = () => {
    const record: PrivacyConsentRecord = {
      version: CURRENT_PRIVACY_VERSION,
      status: 'essential_only',
      timestamp: new Date().toISOString(),
      strictlyNecessary: true,
      analytics: false,
      ephemeralGeolocation: false,
      doNotSellOrShare: true,
      ccpaSection1798Acknowledged: true,
      gdprArticle15Acknowledged: true,
    };
    saveConsentRecord(record);
    setIsBannerVisible(false);
    setIsModalOpen(false);
  };

  const handleSaveCustom = () => {
    const record: PrivacyConsentRecord = {
      version: CURRENT_PRIVACY_VERSION,
      status: 'custom',
      timestamp: new Date().toISOString(),
      strictlyNecessary: true,
      analytics: optAnalytics,
      ephemeralGeolocation: optGeolocation,
      doNotSellOrShare: true,
      ccpaSection1798Acknowledged: true,
      gdprArticle15Acknowledged: true,
    };
    saveConsentRecord(record);
    setIsBannerVisible(false);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* ── 1. BOTTOM FLOATING STATUTORY CONSENT BANNER ──────────────── */}
      {isBannerVisible && (
        <aside
          aria-label="Privacy & Statutory Consent Banner"
          role="region"
          style={{
            position: 'fixed',
            bottom: 24,
            left: 20,
            right: 20,
            maxWidth: 1080,
            margin: '0 auto',
            zIndex: 9999,
            backgroundColor: 'rgba(13, 15, 23, 0.97)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 20,
            border: '1px solid rgba(168, 85, 247, 0.4)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 32px rgba(124, 58, 237, 0.25)',
            padding: 'clamp(18px, 3vw, 24px) clamp(20px, 3.5vw, 32px)',
            color: '#FFFFFF',
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            {/* Notice Description */}
            <div style={{ flex: '1 1 540px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    backgroundColor: 'rgba(124, 58, 237, 0.2)',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#D8B4FE',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  ⚖️ CCPA § 1798.100 &amp; GDPR Art. 15 Notice
                </span>
                <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>
                  ● Zero Tracking Active Prior To Consent
                </span>
              </div>

              <h2
                style={{
                  fontSize: 'clamp(15px, 2vw, 17px)',
                  fontWeight: 800,
                  margin: '0 0 6px',
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em',
                }}
              >
                Your Privacy Rights &amp; Statutory Consent Choice
              </h2>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#CBD5E1', lineHeight: 1.55 }}>
                Under California Civil Code § 1798.100 and GDPR Article 15, you have the right to know what personal data is collected before collection begins. Crowdbeats is 100% free to explore. We certify <strong>zero sale or cross-context behavioral sharing</strong> of your data. You may accept optional performance telemetry, or limit strictly to essential security tokens.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
                <span style={{ color: '#94A3B8' }}>• Necessary: Session &amp; Stripe tokenization</span>
                <span style={{ color: '#94A3B8' }}>• Analytics: Blocked until consent</span>
                <Link
                  href="/legal/privacy"
                  style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Full Privacy Policy ↗
                </Link>
                <Link
                  href="/legal/terms"
                  style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Terms of Service ↗
                </Link>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                alignSelf: 'center',
              }}
            >
              <button
                type="button"
                onClick={handleLimitToEssential}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#CBD5E1',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                Limit to Essential Only
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#D8B4FE',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Customize Rights ⚙️
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                style={{
                  padding: '11px 22px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 18px rgba(124, 58, 237, 0.5)',
                }}
              >
                Accept All &amp; Agree
              </button>
            </div>
          </div>
        </aside>
      )}


      {/* ── 3. DETAILED STATUTORY PRIVACY MODAL (RIGHTS & TOGGLES) ───── */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(16px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0D0F17',
              borderRadius: 24,
              border: '1px solid rgba(168, 85, 247, 0.35)',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.9)',
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 'clamp(24px, 4vw, 36px)',
              color: '#FFFFFF',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#A855F7', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Statutory Privacy Compliance
                </div>
                <h3 id="privacy-modal-title" style={{ fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 800, margin: 0 }}>
                  CCPA § 1798.100 &amp; GDPR Art. 15 Governance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: 22,
                  cursor: 'pointer',
                  padding: 4,
                  lineHeight: 1,
                }}
                aria-label="Close privacy details"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, margin: '0 0 24px' }}>
              We enforce California Consumer Privacy Act (CCPA / CPRA § 1798.100) right to know and European Union GDPR Article 15 access guarantees. You have absolute control over your personal information.
            </p>

            {/* Category 1: Strictly Necessary (Locked) */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>1. Strictly Necessary &amp; Security Tokens</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981', padding: '2px 8px', borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>ALWAYS ACTIVE</span>
              </div>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Encrypted session authentication, CSRF defense, and PCI-DSS Level 1 tokenized Stripe processing. Required for the platform to function. Cannot be disabled.
              </p>
            </div>

            {/* Category 2: Performance & Analytics (Toggle) */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>2. Anonymous Performance &amp; Analytics</span>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={optAnalytics}
                    onChange={(e) => setOptAnalytics(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#7C3AED', cursor: 'pointer' }}
                  />
                </label>
              </div>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Aggregated stage view counts and Web Vitals metrics. Completely blocked until you check this box. Never tied to your financial identity.
              </p>
            </div>

            {/* Category 3: Ephemeral Geolocation (Toggle) */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>3. Ephemeral Live Stage Geolocation</span>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={optGeolocation}
                    onChange={(e) => setOptGeolocation(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#7C3AED', cursor: 'pointer' }}
                  />
                </label>
              </div>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Calculates walking distance to active stages in your city. Evaluated strictly on your local device — never stored on Crowdbeats servers.
              </p>
            </div>

            {/* Statutory CCPA Certification Badge */}
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#10B981' }}>
                  CCPA § 1798.120 Certification: Zero Sale or Sharing
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>
                Crowdbeats LLC certifies that we do NOT sell personal data, nor do we share it with third parties for cross-context behavioral advertising. Financial records are held for 7 years solely pursuant to IRS IRC § 6001.
              </p>
            </div>

            {/* Statutory Exercise Rights Links */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <Link
                href="/legal/support#ticket"
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#38BDF8',
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                📥 Request Complete Data Export (Art. 15) →
              </Link>
              <Link
                href="/legal/privacy"
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#D8B4FE',
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                📖 Read Complete Privacy Policy →
              </Link>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={handleLimitToEssential}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#CBD5E1',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Enforce Essential Only
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                style={{
                  padding: '10px 22px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
                }}
              >
                Save My Privacy Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
