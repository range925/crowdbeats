'use client';

/**
 * Crowdbeats V2 — Legal & Support Page Shell
 * 
 * Provides unified Sonic Precision styling for all Legal & Compliance and
 * Help & Support pages:
 * - 52px sticky glass header matching MillionDollarLanding.tsx
 * - Canonical landing page brand logo (violet squircle + neon-aqua broadcast icon)
 * - Light / Dark mode parity with ThemeProvider
 * - Seamless integration with the canonical CbFooter
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CbFooter } from '@/components/ui/CbFooter';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

interface LegalPageShellProps {
  children: React.ReactNode;
}

export const LegalPageShell: React.FC<LegalPageShellProps> = ({ children }) => {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Theme tokens matching Apple design system
  const canvasBg = isLight ? '#F5F5F7' : '#000000';
  const headerBg = isLight ? 'rgba(255, 255, 255, 0.80)' : 'rgba(22, 22, 23, 0.80)';
  const borderColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const textPrimary = isLight ? '#1D1D1F' : '#F5F5F7';
  const textSecondary = isLight ? '#6E6E73' : '#86868B';
  const textMuted = isLight ? '#86868B' : '#6E6E73';

  const navLinks = [
    { label: '🎭 Previews', href: '/preview', highlight: true },
    { label: 'Terms', href: '/legal/terms' },
    { label: 'Privacy', href: '/legal/privacy' },
    { label: 'DMCA', href: '/legal/dmca' },
    { label: 'Support', href: '/legal/support', activeMatch: '/legal/support' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: canvasBg,
        color: textPrimary,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--cb-font-body)',
        transition: 'background-color 0.25s ease, color 0.25s ease',
      }}
    >
      {/* ── STICKY 52PX GLASS HEADER ────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 52,
          backgroundColor: headerBg,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: `1px solid ${borderColor}`,
          transition: 'background-color 0.25s ease, border-color 0.25s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            height: '100%',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Brand Logo & Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
              aria-label="Crowdbeats home"
            >
              <CrowdbeatsLogo variant="horizontal" height={26} surface={isLight ? 'light' : 'dark'} ariaHidden />
            </Link>

            <span style={{ color: borderColor, fontSize: 16 }}>/</span>

            <Link
              href="/legal"
              style={{
                fontFamily: 'var(--cb-font-body)',
                textDecoration: 'none',
                color: textSecondary,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = isLight ? '#000000' : '#F5F5F7')}
              onMouseLeave={(e) => (e.currentTarget.style.color = textSecondary)}
            >
              Legal & Compliance
            </Link>
          </div>

          {/* Right Controls: Desktop Nav, Theme Toggle, Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Desktop Nav */}
            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                fontSize: 12,
                fontFamily: 'var(--cb-font-body)',
              }}
              className="cb-legal-desktop-nav"
            >
              {navLinks.map((item) => {
                const isActive = pathname === item.href || (item.activeMatch && pathname.startsWith(item.activeMatch));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      textDecoration: 'none',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive
                        ? isLight ? '#000000' : '#F5F5F7'
                        : item.highlight
                        ? isLight ? '#000000' : '#F5F5F7'
                        : textSecondary,
                      letterSpacing: '-0.01em',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = isLight ? '#1D1D1F' : '#F5F5F7';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = item.highlight
                          ? isLight ? '#000000' : '#F5F5F7'
                          : textSecondary;
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Apple Pill Sign In CTA */}
            <Link
              href="/auth"
              style={{
                padding: '6px 16px',
                borderRadius: 9999,
                backgroundColor: '#000000',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: 12,
                letterSpacing: '-0.01em',
                boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(255, 255, 255, 0.1)',
                transition: 'opacity 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Sign In
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="cb-legal-mobile-toggle"
              style={{
                background: 'none',
                border: 'none',
                color: textPrimary,
                cursor: 'pointer',
                padding: 6,
                display: 'none',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#141416',
              borderBottom: `1px solid ${borderColor}`,
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            }}
          >
            <Link
              href="/legal"
              style={{
                color: textPrimary,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
                padding: '8px 0',
              }}
            >
              Legal & Compliance Portal
            </Link>
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: textSecondary,
                  textDecoration: 'none',
                  fontSize: 14,
                  padding: '6px 0',
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* ── RESPONSIVE CSS HELPER FOR MOBILE NAV TOGGLE ─────────────────────── */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .cb-legal-desktop-nav {
            display: none !important;
          }
          .cb-legal-mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>

      {/* ── MAIN BODY WRAPPER ───────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          padding: '40px 24px 80px',
          maxWidth: 1040,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>

      {/* ── CANONICAL PLATFORM FOOTER ────────────────────────────────────────── */}
      <CbFooter />
    </div>
  );
};
