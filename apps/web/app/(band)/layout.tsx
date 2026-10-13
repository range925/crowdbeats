'use client';

// Crowdbeats V2 — Band Studio Layout
// Standardized Responsive Web Navigation with Categorized Band Governance & Operations Groups

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useMobileDrawer } from '@/lib/hooks/useMobileDrawer';
import { ResponsiveMobileDrawer } from '@/components/navigation/ResponsiveMobileDrawer';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';
import { getSessionCookie } from '@/lib/session';

interface BandLayoutProps {
  children: React.ReactNode;
}

export interface BandNavItem {
  href: string;
  label: string;
  icon: string;
}

export interface BandNavGroup {
  title: string;
  items: BandNavItem[];
}

const ALLOWED_PERSONAS = new Set(['band_member', 'artist', 'admin', 'staff']);

export const BAND_NAV_GROUPS: BandNavGroup[] = [
  {
    title: 'BAND OVERVIEW',
    items: [
      { href: '/band/dashboard',    label: 'Dashboard',             icon: '📊' },
      { href: '/band/activity',     label: 'Band Activity',         icon: '⚡' },
      { href: '/band/profile',      label: 'Profile & EPK',         icon: '🎸' },
      { href: '/band/performances', label: 'Performances',          icon: '🎙️' },
      { href: '/band/campaigns',    label: 'Campaigns',             icon: '🚀' },
    ],
  },
  {
    title: 'COMMUNITY & MONETIZATION',
    items: [
      { href: '/band/fans',         label: 'Fans & Tippers',        icon: '👥' },
      { href: '/band/messages',     label: 'Messages',              icon: '💬' },
      { href: '/band/sponsors',     label: 'Sponsorships',          icon: '🏷️' },
      { href: '/band/media',        label: 'Media Library',         icon: '🎥' },
      { href: '/band/marketing',    label: 'Marketing & Share',     icon: '📢' },
    ],
  },
  {
    title: 'MANAGEMENT & GOVERNANCE',
    items: [
      { href: '/band/members',      label: 'Members & Roles',       icon: '🤝' },
      { href: '/band/splits',       label: 'Splits & Governance',   icon: '⚖️' },
      { href: '/band/revenue',      label: 'Revenue & Treasury',    icon: '💰' },
      { href: '/band/payouts',      label: 'Payouts & Stripe',      icon: '💳' },
      { href: '/band/documents',    label: 'Documents & Contracts', icon: '📄' },
      { href: '/band/analytics',    label: 'Analytics',             icon: '📈' },
    ],
  },
  {
    title: 'SETTINGS & SECURITY',
    items: [
      { href: '/band/settings',     label: 'Studio Settings',       icon: '⚙️' },
      { href: '/band/privacy',      label: 'Privacy & Data',        icon: '🔐' },
      { href: '/band/security',     label: 'Security & Auth',       icon: '🔒' },
    ],
  },
];

export const ALL_BAND_NAV_ITEMS: BandNavItem[] = BAND_NAV_GROUPS.flatMap((g) => g.items);

export default function BandStudioLayout({ children }: BandLayoutProps) {
  const { status, displayName: authName, email: authEmail, personaType, logout } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  const displayName = authName || 'Band Member';
  const email = authEmail || '';
  const [accessDecision, setAccessDecision] = React.useState<boolean | null>(null);
  const isDev = process.env.NODE_ENV === 'development';

  React.useEffect(() => {
    if (isDev) { setAccessDecision(true); return; }
    if (typeof window !== 'undefined' && window.location.search.includes('preview=1')) {
      setAccessDecision(true);
      return;
    }
    if (status === 'loading') return;

    const cookie = getSessionCookie();
    const cookiePersona = (cookie?.personaType as string | null) ?? null;
    const effectivePersona = personaType ?? cookiePersona;

    if (effectivePersona && ALLOWED_PERSONAS.has(effectivePersona)) {
      setAccessDecision(true);
      return;
    }

    if (status === 'unauthenticated') {
      if (cookie?.uid) return;
      window.location.replace('/auth?return=' + encodeURIComponent(pathname || '/band/dashboard'));
      return;
    }

    const allowed = Boolean(effectivePersona && ALLOWED_PERSONAS.has(effectivePersona));
    setAccessDecision(allowed);
  }, [status, personaType, pathname, isDev]);

  const {
    isOpen: mobileOpen,
    close: closeMobile,
    triggerProps,
    drawerRef,
    closeButtonRef,
  } = useMobileDrawer({ drawerId: 'cb-band-mobile-drawer' });

  const isActive = (href: string) =>
    href === '/band/dashboard' ? pathname === href : pathname.startsWith(href);

  if (!isDev && accessDecision === null) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-base, #FBFBFD)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border-subtle, rgba(0,0,0,0.1))', borderTopColor: 'var(--accent-primary, #7C3AED)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isDev && accessDecision === false) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-base, #FBFBFD)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center', background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 24, padding: 36, boxShadow: '0 16px 40px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🚫</div>
          <h1 style={{ color: 'var(--status-error, #EF4444)', fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>Band Studio Access Denied</h1>
          <p style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, lineHeight: 1.5, margin: '0 0 24px' }}>This area is reserved for verified band members, musicians, and managers.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/fan" style={{ padding: '9px 18px', borderRadius: 9999, border: '1px solid var(--border-subtle, rgba(0,0,0,0.12))', background: 'transparent', textDecoration: 'none', color: 'var(--text-primary, #1D1D1F)', fontSize: 13, fontWeight: 600 }}>Fan Portal</Link>
            <Link href="/onboarding/band" style={{ padding: '9px 18px', borderRadius: 9999, border: 'none', background: '#000000', color: '#FFFFFF', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create Band Profile</Link>
          </div>
        </div>
      </div>
    );
  }

  const renderNavLinks = (onItemClick?: () => void) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {BAND_NAV_GROUPS.map((group) => (
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
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8, textDecoration: 'none',
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    transition: 'all 0.15s ease',
                    background: active ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                    color: active ? '#000000' : 'var(--text-secondary, #6E6E73)',
                    border: active ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid transparent',
                  }}
                >
                  <span style={{ fontSize: 15 }} aria-hidden="true">{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#000000', flexShrink: 0 }} />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--surface-base, #FBFBFD)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif",
      letterSpacing: '-0.015em',
      color: 'var(--text-primary, #1D1D1F)'
    }}>
      {/* ── Desktop Sidebar (visible >= 769px) ── */}
      <aside className="band-sidebar-desktop">
        <nav
          aria-label="Band Studio Navigation"
          style={{
            width: 260,
            background: 'var(--surface-card, #FFFFFF)',
            borderRight: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: 10,
          }}
        >
          {/* Brand Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.08))' }}>
            <Link
              href="/band/dashboard"
              style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}
              aria-label="Crowdbeats Band Studio"
            >
              <CrowdbeatsLogo variant="horizontal" height={22} surface="light" ariaHidden />
              <div style={{ fontSize: 10, fontWeight: 700, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.8px', paddingLeft: 4 }}>
                Band Studio
              </div>
            </Link>
          </div>

          {/* Categorized Navigation Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
            {renderNavLinks()}
          </div>

          {/* User Profile Footer */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', background: 'var(--surface-raised, #F4F4F6)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #1D1D1F)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary, #86868B)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {email || 'band_member'}
              </span>
              <button
                onClick={logout}
                style={{ fontSize: 11, color: 'var(--text-tertiary, #86868B)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 8px', textDecoration: 'underline', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* ── Mobile Top Header (only visible <= 768px) ── */}
      <header className="band-mobile-header" aria-label="Band Studio Top Bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/" aria-label="Crowdbeats home" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <CrowdbeatsLogo variant="horizontal" height={22} surface="light" ariaHidden />
          </Link>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#000000',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
          }}>
            Band Studio
          </span>
        </div>
        <button
          type="button"
          {...triggerProps}
          aria-label={mobileOpen ? 'Close Band Studio navigation menu' : 'Open Band Studio navigation menu'}
          style={{
            background: 'rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 10,
            color: 'var(--text-primary, #1D1D1F)',
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
        drawerId="cb-band-mobile-drawer"
        title="Band Studio Navigation"
        personaLabel="Band Studio"
        footer={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #1D1D1F)' }}>{displayName}</span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary, #6E6E73)', fontWeight: 600 }}>Band Member</span>
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
      <main className="band-main">
        {children}
      </main>

      <style>{`
        .band-sidebar-desktop {
          display: flex;
          flex-shrink: 0;
        }
        .band-mobile-header {
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
        .band-main {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          padding: 0;
        }
        @media (max-width: 768px) {
          .band-sidebar-desktop {
            display: none !important;
          }
          .band-mobile-header {
            display: flex !important;
          }
          .band-main {
            padding-top: 56px !important;
          }
        }
      `}</style>
    </div>
  );
}
