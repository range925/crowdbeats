'use client';

/**
 * Crowdbeats V2 — Legal & Compliance Index Client
 *
 * Implements the Sonic Precision design system for the Legal & Compliance Portal:
 * - Theme-aware bento containers with refined borders and shadows
 * - California statutory compliance and fee disclosures
 * - Dedicated compliance and help desks
 * - Comprehensive platform policies registry
 */

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/theme/ThemeProvider';
import type { PolicyMetadata } from '@crowdbeats/contracts';

interface LegalIndexClientProps {
  policies: PolicyMetadata[];
}

export const LegalIndexClient: React.FC<LegalIndexClientProps> = ({ policies }) => {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  // Theme-aware tokens matching Apple design system
  const cardBg = isLight ? '#FFFFFF' : '#161617';
  const innerBoxBg = isLight ? '#F5F5F7' : '#1D1D1F';
  const borderColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const textPrimary = isLight ? '#1D1D1F' : '#F5F5F7';
  const textSecondary = isLight ? '#6E6E73' : '#86868B';
  const textMuted = isLight ? '#86868B' : '#6E6E73';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36, fontFamily: 'var(--cb-font-body)' }}>
      {/* ── HERO BANNER: START WITH WHY (BENTO CONTAINER) ──────────────── */}
      <div
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: 24,
          padding: 'clamp(28px, 4vw, 40px) clamp(24px, 4vw, 36px)',
          boxShadow: isLight
            ? '0 2px 14px rgba(0, 0, 0, 0.04)'
            : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
          transition: 'all 0.25s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isLight ? '#0F766E' : '#2DD4BF',
              backgroundColor: isLight ? 'rgba(45, 212, 191, 0.12)' : 'rgba(45, 212, 191, 0.1)',
              border: `1px solid ${isLight ? 'rgba(45, 212, 191, 0.25)' : 'rgba(45, 212, 191, 0.2)'}`,
              padding: '3px 10px',
              borderRadius: 9999,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            California Law Enforced
          </span>
          <span style={{ fontSize: '0.85rem', color: textSecondary }}>Effective: August 21, 2026</span>
          <span style={{ color: borderColor }}>•</span>
          <span style={{ fontSize: '0.85rem', color: textSecondary }}>Crowdbeats LLC (San Francisco, CA)</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--cb-font-display)',
            fontSize: 'clamp(1.85rem, 4vw, 2.5rem)',
            fontWeight: 600,
            color: textPrimary,
            margin: '0 0 14px',
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
          }}
        >
          Our Covenant: Why We Stand For Artists & Fans
        </h1>

        <p style={{ color: textSecondary, fontSize: '1.05rem', lineHeight: 1.6, margin: '0 0 24px', maxWidth: 880, letterSpacing: '-0.012em' }}>
          <em>&ldquo;People don&apos;t buy what you do; they buy why you do it.&rdquo;</em> At Crowdbeats, we believe live music is the purest catalyst for human connection. For decades, traditional platforms have placed subscription tollgates and hidden fees between artists and the fans who love them. We exist to tear those walls down.
        </p>

        {/* ── MANIFESTO BENTO CARDS ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <div
            style={{
              backgroundColor: innerBoxBg,
              border: `1px solid ${borderColor}`,
              borderRadius: 16,
              padding: '18px 20px',
            }}
          >
            <div style={{ fontWeight: 600, color: isLight ? '#0F766E' : '#2DD4BF', fontSize: '0.95rem', marginBottom: 6, fontFamily: 'var(--cb-font-display)' }}>
              1. 100% Free to Join & Explore
            </div>
            <div style={{ color: textSecondary, fontSize: '0.85rem', lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Zero subscription fees, zero monthly dues, zero listing paywalls for musicians, bands, and fans.
            </div>
          </div>

          <div
            style={{
              backgroundColor: innerBoxBg,
              border: `1px solid ${borderColor}`,
              borderRadius: 16,
              padding: '18px 20px',
            }}
          >
            <div style={{ fontWeight: 600, color: isLight ? '#000000' : '#F5F5F7', fontSize: '0.95rem', marginBottom: 6, fontFamily: 'var(--cb-font-display)' }}>
              2. Aligned 6% Platform Fee
            </div>
            <div style={{ color: textSecondary, fontSize: '0.85rem', lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              We only earn when artists earn. A transparent 6% technology fee sustains our servers and live radar.
            </div>
          </div>

          <div
            style={{
              backgroundColor: innerBoxBg,
              border: `1px solid ${borderColor}`,
              borderRadius: 16,
              padding: '18px 20px',
            }}
          >
            <div style={{ fontWeight: 600, color: isLight ? '#000000' : '#2DD4BF', fontSize: '0.95rem', marginBottom: 6, fontFamily: 'var(--cb-font-display)' }}>
              3. Direct Stripe Processing Costs
            </div>
            <div style={{ color: textSecondary, fontSize: '0.85rem', lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Stripe processing & Connect fees are assessed separately and passed through at direct cost with PCI Level 1 security.
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTION TILES (COMPLIANCE & SUPPORT DESKS) ───────────── */}
      <div>
        <h2
          style={{
            fontFamily: 'var(--cb-font-display)',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: textPrimary,
            margin: '0 0 16px',
            letterSpacing: '-0.02em',
          }}
        >
          Dedicated Compliance & Support Desks
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* Help & Support */}
          <Link
            href="/legal/support"
            style={{
              padding: '24px 22px',
              borderRadius: 20,
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>🎧</span>
                <h3
                  style={{
                    fontFamily: 'var(--cb-font-display)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: textPrimary,
                    margin: 0,
                    letterSpacing: '-0.015em',
                  }}
                >
                  Help & Support Center
                </h3>
              </div>
              <p style={{ color: textSecondary, fontSize: '0.875rem', lineHeight: 1.5, margin: 0, letterSpacing: '-0.01em' }}>
                Knowledge base, 100% free musician and band onboarding assistance, live tipping support, and 24/7 ticket submissions.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isLight ? '#000000' : '#F5F5F7', fontSize: '0.85rem', fontWeight: 500, marginTop: 18 }}>
              <span>Open Support Center</span>
              <span>→</span>
            </div>
          </Link>

          {/* DMCA Copyright Takedown */}
          <Link
            href="/legal/copyright-report"
            style={{
              padding: '24px 22px',
              borderRadius: 20,
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>⚖️</span>
                <h3
                  style={{
                    fontFamily: 'var(--cb-font-display)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: textPrimary,
                    margin: 0,
                    letterSpacing: '-0.015em',
                  }}
                >
                  DMCA Copyright Notice
                </h3>
              </div>
              <p style={{ color: textSecondary, fontSize: '0.875rem', lineHeight: 1.5, margin: 0, letterSpacing: '-0.01em' }}>
                Submit a formal 17 U.S.C. § 512(c) copyright infringement notice directly to our Designated DMCA Agent.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EC4899', fontSize: '0.85rem', fontWeight: 500, marginTop: 18 }}>
              <span>Submit DMCA Notice</span>
              <span>→</span>
            </div>
          </Link>

          {/* Report Abuse & Safety */}
          <Link
            href="/legal/report-abuse"
            style={{
              padding: '24px 22px',
              borderRadius: 20,
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.03)' : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>🚨</span>
                <h3
                  style={{
                    fontFamily: 'var(--cb-font-display)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: textPrimary,
                    margin: 0,
                    letterSpacing: '-0.015em',
                  }}
                >
                  Report Abuse & Safety
                </h3>
              </div>
              <p style={{ color: textSecondary, fontSize: '0.875rem', lineHeight: 1.5, margin: 0, letterSpacing: '-0.01em' }}>
                Report prohibited content, harassment, fraud, or safety violations directly to Trust & Safety for urgent triage.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontSize: '0.85rem', fontWeight: 500, marginTop: 18 }}>
              <span>Report Abuse</span>
              <span>→</span>
            </div>
          </Link>
        </div>
      </div>

      {/* ── BINDING POLICIES REGISTRY ────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2
              style={{
                fontFamily: 'var(--cb-font-display)',
                fontSize: '1.35rem',
                fontWeight: 600,
                color: textPrimary,
                margin: '0 0 4px',
                letterSpacing: '-0.02em',
              }}
            >
              Enforceable Legal Policies & Guidelines
            </h2>
            <p style={{ color: textSecondary, fontSize: '0.875rem', margin: 0, letterSpacing: '-0.01em' }}>
              Full text agreements and policy terms governing platform use, data privacy, payments, and monetization.
            </p>
          </div>
          <span
            style={{
              fontSize: '0.8rem',
              color: isLight ? '#000000' : '#F5F5F7',
              fontWeight: 600,
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
              padding: '4px 12px',
              borderRadius: 9999,
              border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)'}`,
            }}
          >
            {policies.length} Active Policies
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {policies.map((policy) => (
            <Link
              key={policy.policyType}
              href={policy.canonicalPath}
              style={{
                display: 'block',
                padding: '22px 26px',
                borderRadius: 20,
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.02)' : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = isLight ? '#000000' : 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = borderColor;
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <h3
                  style={{
                    fontFamily: 'var(--cb-font-display)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: textPrimary,
                    margin: 0,
                    letterSpacing: '-0.015em',
                  }}
                >
                  {policy.title}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: isLight ? '#0F766E' : '#2DD4BF',
                    backgroundColor: isLight ? 'rgba(45, 212, 191, 0.12)' : 'rgba(45, 212, 191, 0.1)',
                    border: `1px solid ${isLight ? 'rgba(45, 212, 191, 0.25)' : 'rgba(45, 212, 191, 0.2)'}`,
                    padding: '3px 8px',
                    borderRadius: 9999,
                  }}
                >
                  Version {policy.version}
                </span>
              </div>
              <p style={{ color: textSecondary, fontSize: '0.9rem', margin: '0 0 14px 0', lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                {policy.summary}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: textMuted }}>
                <span>Jurisdiction: San Francisco, CA (California Law)</span>
                <span style={{ color: isLight ? '#000000' : '#F5F5F7', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Read Full Policy →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
