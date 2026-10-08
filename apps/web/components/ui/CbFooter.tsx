'use client';

/**
 * Crowdbeats V2 — Global Platform Footer (Stitch Sonic Precision Design System)
 * 
 * Comprehensive navigation, legal compliance disclosures, support portal links,
 * and California jurisdiction notices.
 * 
 * Styled to seamlessly match the landing page theme (light/dark) and layout design:
 * - Sonic Precision tokens (#7C3AED violet, #2DD4BF aqua, #07080D obsidian, #FCF8FB porcelain)
 * - 4-Column responsive grid on desktop, 2-column on tablet, accessible accordions on mobile
 * - 100% Information Architecture and statutory legal preservation
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CrowdbeatsLogo } from './CbLogo';

export const CbFooter: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Theme-aware palette matching Apple.com design system
  const canvasBg = isLight ? '#F5F5F7' : '#000000';
  const cardBg = isLight ? '#FFFFFF' : '#161617';
  const innerBoxBg = isLight ? '#F5F5F7' : '#1D1D1F';
  const borderColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const textPrimary = isLight ? '#1D1D1F' : '#F5F5F7';
  const textSecondary = isLight ? '#6E6E73' : '#86868B';
  const textMuted = isLight ? '#86868B' : '#6E6E73';

  interface FooterLink {
    label: string;
    href: string;
    highlight?: boolean;
    highlightColor?: string;
    isEmail?: boolean;
  }

  interface FooterSection {
    title: string;
    links: FooterLink[];
  }

  const sections: FooterSection[] = [
    {
      title: 'LIVE PLATFORM',
      links: [
        { label: 'Live Concert Discovery', href: '/' },
        { label: '🎭 Persona Previews (5 Roles)', href: '/preview', highlight: true },
        { label: 'Nearby Music Stages', href: '/#discover' },
        { label: 'Featured Solo Artists', href: '/#carousel' },
        { label: 'Live Stages & Venues', href: '/#discover' },
      ],
    },
    {
      title: 'HELP & SUPPORT',
      links: [
        { label: 'Help & Support Center ↗', href: '/legal/support', highlight: true },
        { label: 'Frequently Asked Questions', href: '/legal/support#faq' },
        { label: 'Open Support Ticket', href: '/legal/support#ticket' },
        { label: 'Refund & Tip Dispute Policy', href: '/legal/refunds' },
        { label: 'Contact: support@crowdbeats.ai', href: 'mailto:support@crowdbeats.ai', isEmail: true },
      ],
    },
    {
      title: 'LEGAL & GOVERNANCE',
      links: [
        { label: 'Terms of Service (CA Law)', href: '/legal/terms' },
        { label: 'Privacy Policy (CCPA / GDPR)', href: '/legal/privacy' },
        { label: 'DMCA & Copyright Policy', href: '/legal/dmca' },
        { label: 'Acceptable Use Policy', href: '/legal/aup' },
        { label: 'Creator Monetization & Splits', href: '/legal/creator-monetization' },
      ],
    },
    {
      title: 'TRUST & REPORTING',
      links: [
        { label: 'Submit DMCA Notice Form →', href: '/legal/copyright-report', highlightColor: '#EC4899' },
        { label: 'Report Abuse & Safety →', href: '/legal/report-abuse', highlightColor: '#EF4444' },
        { label: 'dmca@crowdbeats.ai', href: 'mailto:dmca@crowdbeats.ai', isEmail: true },
        { label: 'legal@crowdbeats.ai', href: 'mailto:legal@crowdbeats.ai', isEmail: true },
        { label: 'Law Enforcement Guidelines', href: '/legal/law-enforcement' },
      ],
    },
  ];

  return (
    <footer
      style={{
        backgroundColor: canvasBg,
        borderTop: `1px solid ${borderColor}`,
        color: textSecondary,
        padding: 'clamp(64px, 8vw, 96px) clamp(20px, 4vw, 48px) 80px',
        marginTop: 'auto',
        fontSize: '0.875rem',
        fontFamily: 'var(--cb-font-body)',
        transition: 'background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div style={{ maxWidth: 1440, width: '100%', margin: '0 auto' }}>
        {/* ── BRAND & PLATFORM STATUS HEADER ───────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
            paddingBottom: 32,
            marginBottom: 40,
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          {/* Brand Signature */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              textDecoration: 'none',
              color: textPrimary,
            }}
            aria-label="Crowdbeats home"
          >
            <CrowdbeatsLogo variant="horizontal" height={32} surface={isLight ? 'light' : 'dark'} ariaHidden />
            <div
              style={{
                fontFamily: 'var(--cb-font-body)',
                fontSize: 12,
                color: textMuted,
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
                borderLeft: `1px solid ${borderColor}`,
                paddingLeft: 12,
              }}
            >
              Where fans fuel the music.
            </div>
          </Link>

          {/* Operational Status & Jurisdiction Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 14px',
                borderRadius: 9999,
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(45, 212, 191, 0.1)',
                color: isLight ? '#000000' : '#2DD4BF',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.04em',
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(45, 212, 191, 0.2)'}`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: isLight ? '#000000' : '#2DD4BF',
                  boxShadow: isLight ? '0 0 8px rgba(0, 0, 0, 0.2)' : '0 0 8px #2DD4BF',
                }}
              />
              SYSTEM OPERATIONAL
            </div>

            <span
              style={{
                fontSize: 12,
                color: textMuted,
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              San Francisco & San Diego, CA
            </span>
          </div>
        </div>

        {/* ── 4 NAVIGATION COLUMNS (Desktop / Tablet) OR ACCORDIONS (Mobile) ── */}
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
            {sections.map((section, idx) => (
              <details
                key={idx}
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 16,
                  padding: '12px 18px',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <summary
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 600,
                    fontSize: 12,
                    color: textPrimary,
                    cursor: 'pointer',
                    letterSpacing: '0.08em',
                    userSelect: 'none',
                    fontFamily: 'var(--cb-font-display)',
                  }}
                >
                  <span>{section.title}</span>
                  <span style={{ fontSize: 13, color: textMuted }}>▾</span>
                </summary>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: '12px 0 4px',
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {section.links.map((link, lIdx) => (
                    <li key={lIdx} style={{ fontSize: 12 }}>
                      {link.isEmail ? (
                        <a
                          href={link.href}
                          style={{
                            color: textSecondary,
                            textDecoration: 'none',
                            userSelect: 'all',
                          }}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          style={{
                            color: link.highlightColor || (link.highlight ? (isLight ? '#000000' : '#F5F5F7') : textSecondary),
                            fontWeight: link.highlight ? 500 : 400,
                            textDecoration: 'none',
                          }}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 36,
              marginBottom: 48,
            }}
          >
            {sections.map((section, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h4
                  style={{
                    color: isLight ? '#1D1D1F' : '#F5F5F7',
                    fontSize: 12,
                    fontWeight: 600,
                    margin: 0,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--cb-font-display)',
                  }}
                >
                  {section.title}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {section.links.map((link, lIdx) => (
                    <li key={lIdx} style={{ fontSize: 12 }}>
                      {link.isEmail ? (
                        <a
                          href={link.href}
                          style={{
                            color: textSecondary,
                            textDecoration: 'none',
                            userSelect: 'all',
                            transition: 'color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#000000' : '#F5F5F7')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          style={{
                            color: link.highlightColor || (link.highlight ? (isLight ? '#000000' : '#F5F5F7') : textSecondary),
                            fontWeight: link.highlight ? 500 : 400,
                            textDecoration: 'none',
                            transition: 'color 0.15s ease',
                            display: 'inline-block',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = link.highlightColor || (isLight ? '#000000' : '#F5F5F7');
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = link.highlightColor || (link.highlight ? (isLight ? '#000000' : '#F5F5F7') : textSecondary);
                          }}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* ── LEGAL COMPLIANCE & STATUTORY DISCLOSURE CONTAINER ────────────── */}
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 20,
            padding: '24px 28px',
            boxShadow: isLight
              ? '0 2px 10px rgba(0, 0, 0, 0.02)'
              : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
            transition: 'background-color 0.25s ease, border-color 0.25s ease',
          }}
        >
          {/* Header row with statutory badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: `1px solid ${borderColor}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, color: isLight ? '#000000' : '#F5F5F7' }}>⚖</span>
              <span
                style={{
                  fontWeight: 600,
                  color: textPrimary,
                  fontSize: 13,
                  fontFamily: 'var(--cb-font-display)',
                  letterSpacing: '-0.01em',
                }}
              >
                Crowdbeats LLC · Statutory Legal & Consumer Protection Disclosures
              </span>
            </div>

            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                padding: '4px 10px',
                borderRadius: 9999,
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                color: isLight ? '#000000' : '#F5F5F7',
                border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)'}`,
                textTransform: 'uppercase',
              }}
            >
              CCPA § 1798.100 & GDPR Compliant
            </div>
          </div>

          {/* Statutory Disclaimers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, lineHeight: 1.6, color: textMuted }}>
            <p style={{ margin: 0 }}>
              <strong style={{ color: textPrimary }}>Platform & Fee Structure:</strong> © 2026 Crowdbeats LLC. All rights reserved. 100% Free platform for solo musicians, bands, and fans with zero subscription dues. On voluntary live tips and campaign contributions, Crowdbeats charges a transparent 6% platform technology fee; Stripe payment-processing and Stripe Connect fees are separate and additional. Voluntary tips are disbursed in real time and non-refundable except where mandated by law. Exclusive venue and jurisdiction: San Francisco County, California.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: textPrimary }}>Notice to California Residents:</strong> In compliance with California Civil Code § 1798.100 et seq. (CCPA / CPRA) and California Business & Professions Code § 17538, Crowdbeats certifies zero sale or cross-context behavioral sharing of personal consumer data. Data collection prior to affirmative user consent is strictly blocked. Inquiries and formal notices: <a href="mailto:support@crowdbeats.ai" style={{ color: isLight ? '#000000' : '#F5F5F7', textDecoration: 'none' }}>support@crowdbeats.ai</a> · <a href="mailto:legal@crowdbeats.ai" style={{ color: isLight ? '#000000' : '#F5F5F7', textDecoration: 'none' }}>legal@crowdbeats.ai</a> · <a href="mailto:dmca@crowdbeats.ai" style={{ color: isLight ? '#000000' : '#F5F5F7', textDecoration: 'none' }}>dmca@crowdbeats.ai</a>.
            </p>
          </div>

          {/* Quick Legal Navigation Strip */}
          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href="/legal/terms" style={{ color: textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#000000' : '#F5F5F7')} onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}>Terms of Service</Link>
              <span style={{ opacity: 0.3 }}>·</span>
              <Link href="/legal/privacy" style={{ color: textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#000000' : '#F5F5F7')} onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}>Privacy Policy</Link>
              <span style={{ opacity: 0.3 }}>·</span>
              <Link href="/legal/dmca" style={{ color: textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#000000' : '#F5F5F7')} onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}>DMCA Policy</Link>
              <span style={{ opacity: 0.3 }}>·</span>
              <Link href="/legal/aup" style={{ color: textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#000000' : '#F5F5F7')} onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}>Acceptable Use</Link>
              <span style={{ opacity: 0.3 }}>·</span>
              <Link href="/legal/refunds" style={{ color: textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#000000' : '#F5F5F7')} onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}>Refund Disputes</Link>
              <span style={{ opacity: 0.3 }}>·</span>
              <Link href="/legal/law-enforcement" style={{ color: textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#000000' : '#F5F5F7')} onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}>Law Enforcement</Link>
              <span style={{ opacity: 0.3 }}>·</span>
              <Link href="/legal/support" style={{ color: textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#000000' : '#F5F5F7')} onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}>Support Center</Link>
            </div>

            <div style={{ color: textMuted, fontSize: 11 }}>
              Governing Law: State of California
            </div>
          </div>
        </div>

        {/* ── VERY BOTTOM SIGNATURE & BRAND ORIGIN STRIP ─────────────────────── */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            fontSize: 13,
            color: textMuted,
            fontFamily: 'var(--cb-font-body)',
            paddingBottom: 24,
          }}
        >
          <div style={{ fontSize: 12 }}>
            © {new Date().getFullYear()} Crowdbeats LLC. All rights reserved.
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 500,
              color: textPrimary,
              letterSpacing: '-0.015em',
            }}
          >
            <span>Made with</span>
            <span style={{ fontSize: 16, display: 'inline-block' }} role="img" aria-label="love">
              ❤️
            </span>
            <span>from California</span>
          </div>

          <div style={{ color: textMuted, fontSize: 12 }}>
            Designed for live musicians & fans worldwide
          </div>
        </div>
      </div>
    </footer>
  );
};
