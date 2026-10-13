'use client';

// Crowdbeats V2 — Venue Studio Layout
// Standardized Responsive Web Navigation with Categorized Stages, Calendar & Foot Traffic Groups

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useMobileDrawer } from '@/lib/hooks/useMobileDrawer';
import { ResponsiveMobileDrawer } from '@/components/navigation/ResponsiveMobileDrawer';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';
import { getSessionCookie } from '@/lib/session';

interface VenueLayoutProps {
  children: React.ReactNode;
}

export interface VenueNavItem {
  href: string;
  label: string;
  icon: string;
}

export interface VenueNavGroup {
  title: string;
  items: VenueNavItem[];
}

const ALLOWED_PERSONAS = new Set(['venue_manager', 'admin', 'staff']);

export const VENUE_NAV_GROUPS: VenueNavGroup[] = [
  {
    title: 'STAGES & LIVE',
    items: [
      { href: '/venue/dashboard',    label: 'Dashboard',           icon: '📊' },
      { href: '/venue/live',         label: 'Live Stage Feed',     icon: '📡' },
      { href: '/venue/stages',       label: 'Stage Management',    icon: '🎭' },
      { href: '/venue/events',       label: 'Event Schedule',      icon: '📅' },
      { href: '/venue/performances', label: 'Performance Logs',    icon: '🎙️' },
    ],
  },
  {
    title: 'DIRECTORY & INSIGHTS',
    items: [
      { href: '/venue/activity',     label: 'Venue Activity',      icon: '⚡' },
      { href: '/venue/profile',      label: 'Venue EPK & Info',    icon: '🏟️' },
      { href: '/venue/artists',      label: 'Artist Roster',       icon: '🎸' },
      { href: '/venue/analytics',    label: 'Foot Traffic & Tips', icon: '📈' },
    ],
  },
  {
    title: 'OPERATIONS & SETTINGS',
    items: [
      { href: '/venue/staff',        label: 'Staff & Roles',       icon: '👥' },
      { href: '/venue/settings',     label: 'Venue Settings',      icon: '⚙️' },
      { href: '/venue/privacy',      label: 'Privacy & Data',      icon: '🔐' },
      { href: '/venue/security',     label: 'Security & Access',   icon: '🔒' },
    ],
  },
];

export const ALL_VENUE_NAV_ITEMS: VenueNavItem[] = VENUE_NAV_GROUPS.flatMap((g) => g.items);

export default function VenueStudioLayout({ children }: VenueLayoutProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { status, displayName: authName, email: authEmail, personaType, logout } = useAuth();
  const displayName = authName || 'Venue Manager';
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
      window.location.replace('/auth?return=' + encodeURIComponent(pathname || '/venue/dashboard'));
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
  } = useMobileDrawer({ drawerId: 'cb-venue-mobile-drawer' });

  const isActive = (href: string) =>
    href === '/venue/dashboard' ? pathname === href : pathname.startsWith(href);

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
          <div style={{ fontSize: 44, marginBottom: 16 }}>🏟️</div>
          <h1 style={{ color: 'var(--status-error, #EF4444)', fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>Venue Studio Access Denied</h1>
          <p style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, lineHeight: 1.5, margin: '0 0 24px' }}>This area is reserved for verified venue managers, concert halls, and stage operators.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/fan" style={{ padding: '9px 18px', borderRadius: 9999, border: '1px solid var(--border-subtle, rgba(0,0,0,0.12))', background: 'transparent', textDecoration: 'none', color: 'var(--text-primary, #1D1D1F)', fontSize: 13, fontWeight: 600 }}>Fan Portal</Link>
            <Link href="/onboarding/venue" style={{ padding: '9px 18px', borderRadius: 9999, border: 'none', background: '#059669', color: '#FFFFFF', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Claim Venue</Link>
          </div>
        </div>
      </div>
    );
  }

  const renderNavLinks = (onItemClick?: () => void) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {VENUE_NAV_GROUPS.map((group) => (
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
                    background: active ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
                    color: active ? '#047857' : 'var(--text-secondary, #6E6E73)',
                    border: active ? '1px solid rgba(5, 150, 105, 0.2)' : '1px solid transparent',
                  }}
                >
                  <span style={{ fontSize: 15 }} aria-hidden="true">{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />}
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
      <aside className="venue-sidebar-desktop">
        <nav
          aria-label="Venue Studio Navigation"
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
              href="/venue/dashboard"
              style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}
              aria-label="Crowdbeats Venue Studio"
            >
              <CrowdbeatsLogo variant="horizontal" height={22} surface="light" ariaHidden />
              <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.8px', paddingLeft: 4 }}>
                Venue Studio
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
                {email || 'venue_manager'}
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
      <header className="venue-mobile-header" aria-label="Venue Studio Top Bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/" aria-label="Crowdbeats home" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <CrowdbeatsLogo variant="horizontal" height={22} surface="light" ariaHidden />
          </Link>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#059669',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: 9999,
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
          }}>
            Venue Studio
          </span>
        </div>
        <button
          type="button"
          {...triggerProps}
          style={{
            background: 'rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 8,
            color: 'var(--text-primary, #1D1D1F)',
            cursor: 'pointer',
            fontSize: 18,
            width: 36,
            height: 36,
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
        drawerId="cb-venue-mobile-drawer"
        title="Venue Studio Navigation"
        personaLabel="Venue Studio"
        footer={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #1D1D1F)' }}>{displayName}</span>
              <span style={{ fontSize: 10, color: '#059669', fontWeight: 600 }}>Venue Manager</span>
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
      <main className="venue-main">
        {children}
      </main>

      <style>{`
        .venue-sidebar-desktop {
          display: flex;
          flex-shrink: 0;
        }
        .venue-mobile-header {
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
        .venue-main {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          padding: 0;
        }
        @media (max-width: 768px) {
          .venue-sidebar-desktop {
            display: none !important;
          }
          .venue-mobile-header {
            display: flex !important;
          }
          .venue-main {
            padding-top: 56px !important;
          }
        }
      `}</style>
    </div>
  );
}
