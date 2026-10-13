'use client';

// Crowdbeats V2 — Creator Studio Layout
// Standardized Responsive Web Navigation with Categorized Studio Groups

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useMobileDrawer } from '@/lib/hooks/useMobileDrawer';
import { ResponsiveMobileDrawer } from '@/components/navigation/ResponsiveMobileDrawer';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';
import { getSessionCookie } from '@/lib/session';

export interface CreatorNavItem {
  label: string;
  icon: string;
  href: string;
}

export interface CreatorNavGroup {
  title: string;
  items: CreatorNavItem[];
}

export const CREATOR_NAV_GROUPS: CreatorNavGroup[] = [
  {
    title: 'STUDIO',
    items: [
      { label: 'Dashboard',     icon: '🏠', href: '/creator/dashboard' },
      { label: 'Live Activity', icon: '⚡', href: '/creator/activity' },
      { label: 'Profile / EPK', icon: '🎤', href: '/creator/profile' },
      { label: 'Performances',  icon: '📅', href: '/creator/performances' },
      { label: 'Campaigns',     icon: '🚀', href: '/creator/campaigns' },
      { label: 'Contributions', icon: '💳', href: '/creator/contributions' },
      { label: 'Updates',       icon: '📝', href: '/creator/updates' },
    ],
  },
  {
    title: 'COMMUNITY & EARNINGS',
    items: [
      { label: 'Fans',          icon: '❤️', href: '/creator/fans' },
      { label: 'Messages',      icon: '💬', href: '/creator/messages' },
      { label: 'Rewards',       icon: '🎁', href: '/creator/rewards' },
      { label: 'Sponsorships',  icon: '🤝', href: '/creator/sponsorships' },
      { label: 'Media',         icon: '🎥', href: '/creator/media' },
      { label: 'Payouts',       icon: '💰', href: '/creator/payouts' },
      { label: 'Analytics',     icon: '📊', href: '/creator/analytics' },
      { label: 'Marketing',     icon: '📣', href: '/creator/marketing' },
    ],
  },
  {
    title: 'SETTINGS & SECURITY',
    items: [
      { label: 'Settings', icon: '⚙️', href: '/creator/settings' },
      { label: 'Privacy',  icon: '🛡️', href: '/creator/privacy' },
      { label: 'Security', icon: '🔒', href: '/creator/security' },
    ],
  },
];

export const ALL_CREATOR_NAV_ITEMS: CreatorNavItem[] = CREATOR_NAV_GROUPS.flatMap((g) => g.items);

const ALLOWED_PERSONAS = new Set(['artist', 'band_member', 'admin', 'staff']);

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const { status, displayName, personaType, logout } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  const {
    isOpen: mobileOpen,
    close: closeMobile,
    triggerProps,
    drawerRef,
    closeButtonRef,
  } = useMobileDrawer({ drawerId: 'cb-creator-mobile-drawer' });
  // null = still deciding, true = allowed, false = denied
  const [accessDecision, setAccessDecision] = useState<boolean | null>(null);

  const isDev = process.env.NODE_ENV === 'development';

  // Evaluate access client-side only (after hydration) to avoid SSR mismatch
  React.useEffect(() => {
    if (isDev) { setAccessDecision(true); return; }
    if (typeof window !== 'undefined' && window.location.search.includes('preview=1')) {
      setAccessDecision(true);
      return;
    }
    if (status === 'loading') return; // keep waiting

    const cookie = getSessionCookie();
    const cookiePersona = (cookie?.personaType as string | null) ?? null;
    const effectivePersona = personaType ?? cookiePersona;

    if (effectivePersona && ALLOWED_PERSONAS.has(effectivePersona)) {
      setAccessDecision(true);
      return;
    }

    if (status === 'unauthenticated') {
      if (cookie?.uid) {
        // Session cookie exists with uid — give Firebase auth a moment to hydrate
        return;
      }
      window.location.replace('/auth');
      return;
    }

    const allowed = Boolean(effectivePersona && ALLOWED_PERSONAS.has(effectivePersona));
    setAccessDecision(allowed);
  }, [status, personaType, isDev]);

  const isActive = (href: string) => {
    if (href === '/creator/dashboard') return pathname === '/creator/dashboard';
    return pathname.startsWith(href);
  };

  // While deciding, render a lightweight skeleton (never dark, avoids flash)
  if (!isDev && accessDecision === null) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--surface-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Denied screen: explain clearly, link to fan view or switch
  if (!isDev && accessDecision === false) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--surface-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 24,
          padding: 36,
          boxShadow: '0 16px 40px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🎵</div>
          <h1 style={{
            color: 'var(--text-primary)',
            fontSize: 20,
            fontWeight: 700,
            margin: '0 0 10px',
          }}>
            Creator Studio Access Required
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 13,
            lineHeight: 1.5,
            margin: '0 0 24px',
          }}>
            This area is for Solo Musicians, Bands, and Creators. You are currently signed in as a Fan.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link
              href="/fan"
              style={{
                padding: '9px 18px',
                borderRadius: 9999,
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Go to Fan Hub
            </Link>
            <Link
              href="/onboarding/persona"
              style={{
                padding: '9px 18px',
                borderRadius: 9999,
                border: 'none',
                background: '#000000',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Become a Creator
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderNavLinks = (onItemClick?: () => void) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {CREATOR_NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <div style={{
            padding: '4px 10px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary, #86868B)',
          }}>
            {group.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  aria-current={active ? 'page' : undefined}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: active ? 700 : 400,
                    color: active ? '#7C3AED' : 'var(--text-secondary, #6E6E73)',
                    background: active ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                    border: active ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid transparent',
                    transition: 'background 0.15s, color 0.15s',
                    cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: 15, lineHeight: 1 }} aria-hidden="true">{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {active && (
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#7C3AED',
                        flexShrink: 0,
                      }} />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-base)' }}>
      {/* ── Desktop Sidebar (visible >= 769px) ── */}
      <aside className="creator-sidebar-desktop">
        <nav
          aria-label="Creator Studio Navigation"
          style={{
            width: 250,
            background: 'var(--surface-card, #FFFFFF)',
            borderRight: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            padding: '20px 0 16px',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Brand Header */}
          <div style={{
            padding: '0 20px 20px',
            borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Link
              href="/creator/dashboard"
              style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}
              aria-label="Crowdbeats Creator Studio"
            >
              <CrowdbeatsLogo variant="horizontal" height={22} surface="light" ariaHidden />
              <div style={{
                fontSize: 10,
                color: 'var(--text-tertiary, #86868B)',
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}>
                CREATOR STUDIO
              </div>
            </Link>
          </div>

          {/* Categorized Nav Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
            {renderNavLinks()}
          </div>

          {/* User Profile Footer */}
          <div style={{
            padding: '12px 14px 0',
            borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(124, 58, 237, 0.1)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7C3AED',
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {(displayName ?? 'C').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13,
                color: 'var(--text-primary)',
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {displayName ?? (isDev ? 'David Naufahu' : 'Artist / Musician')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <span style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600 }}>Solo Musician</span>
                <button
                  onClick={logout}
                  style={{
                    fontSize: 11,
                    color: 'var(--text-tertiary, #86868B)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* ── Mobile Top Header (only visible <= 768px) ── */}
      <header className="creator-mobile-header" aria-label="Creator Studio Top Bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/" aria-label="Crowdbeats home" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <CrowdbeatsLogo variant="horizontal" height={22} surface="light" ariaHidden />
          </Link>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#7C3AED',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: 9999,
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
          }}>
            Creator Studio
          </span>
        </div>
        <button
          type="button"
          {...triggerProps}
          aria-label={mobileOpen ? 'Close Creator Studio navigation menu' : 'Open Creator Studio navigation menu'}
          style={{
            background: 'rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 10,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 20,
            width: 44,
            height: 44,
            minWidth: 44,
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* ── Accessible Mobile Drawer (only active on mobile when opened) ── */}
      <ResponsiveMobileDrawer
        isOpen={mobileOpen}
        onClose={closeMobile}
        drawerRef={drawerRef}
        closeButtonRef={closeButtonRef}
        drawerId="cb-creator-mobile-drawer"
        title="Creator Studio Navigation"
        personaLabel="Creator Studio"
        footer={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 4px',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                {displayName ?? (isDev ? 'David Naufahu' : 'Artist / Musician')}
              </span>
              <span style={{ fontSize: 10, color: '#7C3AED', fontWeight: 700 }}>
                Solo Musician
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                closeMobile(false);
                logout();
              }}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: 10,
                border: 'none',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        }
      >
        <div style={{ padding: '4px 0' }}>
          {renderNavLinks(() => closeMobile(false))}
        </div>
      </ResponsiveMobileDrawer>

      {/* Main Content Area */}
      <main className="creator-main">
        {children}
      </main>

      <style>{`
        .creator-sidebar-desktop {
          display: flex;
          flex-shrink: 0;
        }
        .creator-mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          z-index: 100;
          background: var(--surface-card, #FFFFFF);
          border-bottom: 1px solid var(--border-subtle, rgba(0,0,0,0.08));
          padding: 0 16px;
          align-items: center;
          justify-content: space-between;
        }
        .creator-main {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          padding: 0;
        }
        @media (max-width: 768px) {
          .creator-sidebar-desktop {
            display: none !important;
          }
          .creator-mobile-header {
            display: flex !important;
          }
          .creator-main {
            padding-top: 56px !important;
          }
        }
      `}</style>
    </div>
  );
}
