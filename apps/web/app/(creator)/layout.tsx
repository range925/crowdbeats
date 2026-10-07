/**
 * Crowdbeats V2 — Creator Studio Layout (Phase 7)
 *
 * Sidebar navigation for the Creator Studio (/creator route group).
 * 14 sections: Dashboard, Profile, Performances, Campaigns, Contributions,
 * Updates, Fans, Messages, Payouts, Analytics, Marketing, Media,
 * Rewards, Sponsorships + Security, Privacy, Settings.
 *
 * Responsive: sidebar collapses to mobile drawer on mobile (<768px),
 * full sticky sidebar on desktop with zero overlapping headers.
 * Auth guard: artist/band_member persona only (bypassed in dev for preview).
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

const NAV_SECTIONS = [
  { label: 'Dashboard',     icon: '🏠', href: '/creator/dashboard' },
  { label: 'Live Activity', icon: '⚡', href: '/creator/activity' },
  { label: 'Profile / EPK', icon: '🎤', href: '/creator/profile' },
  { label: 'Performances',  icon: '📅', href: '/creator/performances' },
  { label: 'Campaigns',     icon: '🚀', href: '/creator/campaigns' },
  { label: 'Contributions', icon: '💳', href: '/creator/contributions' },
  { label: 'Updates',       icon: '📝', href: '/creator/updates' },
  { label: 'Fans',          icon: '❤️', href: '/creator/fans' },
  { label: 'Messages',      icon: '💬', href: '/creator/messages' },
  { label: 'Payouts',       icon: '💰', href: '/creator/payouts' },
  { label: 'Analytics',     icon: '📊', href: '/creator/analytics' },
  { label: 'Marketing',     icon: '📣', href: '/creator/marketing' },
  { label: 'Media',         icon: '🎥', href: '/creator/media' },
  { label: 'Rewards',       icon: '🎁', href: '/creator/rewards' },
  { label: 'Sponsorships',  icon: '🤝', href: '/creator/sponsorships' },
];

const SETTINGS_SECTIONS = [
  { label: 'Security', icon: '🔒', href: '/creator/security' },
  { label: 'Privacy',  icon: '🛡️', href: '/creator/privacy' },
  { label: 'Settings', icon: '⚙️', href: '/creator/settings' },
];

const ALLOWED_PERSONAS = new Set(['artist', 'band_member', 'admin', 'staff']);

/** Read __cb_session cookie — only valid client-side after hydration */
function getSessionPersona(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.split('; ').find(c => c.startsWith('__cb_session='));
    if (!match) return null;
    const raw = decodeURIComponent(match.split('=').slice(1).join('='));
    const parsed = JSON.parse(raw);
    return typeof parsed?.personaType === 'string' ? parsed.personaType : null;
  } catch {
    return null;
  }
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const { status, displayName, personaType, logout } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
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

    if (status === 'unauthenticated') {
      window.location.replace('/auth');
      return;
    }

    // Check React auth state first, then fall back to session cookie
    const cookiePersona = getSessionPersona();
    const effectivePersona = personaType ?? cookiePersona;
    const allowed =
      (status === 'authenticated' && !!effectivePersona && ALLOWED_PERSONAS.has(effectivePersona)) ||
      (status === 'unonboarded' && !!cookiePersona && ALLOWED_PERSONAS.has(cookiePersona));

    setAccessDecision(allowed);
  }, [status, personaType, isDev]);

  // While waiting for auth or access decision, show spinner
  if (!isDev && accessDecision === null) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Access denied
  if (!isDev && accessDecision === false) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h1 style={{ color: 'var(--status-error)', marginBottom: 12 }}>Creator Studio Access Denied</h1>
          <p style={{ color: 'var(--text-secondary)' }}>This area is for artists and band members only.</p>
          <a href="/auth" style={{ color: 'var(--accent-primary)', display: 'block', marginTop: 16 }}>Sign in with an artist account</a>
        </div>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === '/creator/dashboard' ? pathname === href : pathname.startsWith(href);

  const Sidebar = () => (
    <nav style={{
      width: 250,
      height: '100vh',
      background: 'var(--surface-card)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0 16px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {/* Brand Header */}
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <Link href="/creator/dashboard" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 6 }} aria-label="Crowdbeats Creator Studio">
          <CrowdbeatsLogo variant="horizontal" height={22} surface={theme === 'light' ? 'light' : 'dark'} ariaHidden />
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            CREATOR STUDIO
          </div>
        </Link>
      </div>

      {/* Main Nav Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_SECTIONS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', borderRadius: 8, fontSize: 13,
                fontWeight: active ? 700 : 400,
                color: active ? '#7C3AED' : 'var(--text-secondary)',
                background: active ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                border: active ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid transparent',
                transition: 'background 0.15s, color 0.15s', cursor: 'pointer',
              }}>
                <span style={{ fontSize: 15, lineHeight: 1 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED', flexShrink: 0 }} />}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Settings Group */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 4, paddingLeft: 10, paddingRight: 10 }}>
        {SETTINGS_SECTIONS.map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 12,
              color: isActive(item.href) ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              cursor: 'pointer',
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </Link>
        ))}

        {/* User Profile & Sign out */}
        <div style={{ padding: '12px 14px 4px', borderTop: '1px solid var(--border-subtle)', marginTop: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName ?? (isDev ? 'David Naufahu' : 'Artist / Musician')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>Solo Musician</span>
            <button
              onClick={logout}
              style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-base)' }}>
      {/* Desktop Sidebar (visible >= 769px) */}
      <aside className="creator-sidebar-desktop">
        <Sidebar />
      </aside>

      {/* Mobile Top Header (only visible <= 768px) */}
      <header className="creator-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CrowdbeatsLogo variant="emblem" height={24} surface={theme === 'light' ? 'light' : 'dark'} ariaHidden />
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>Creator Studio</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 22, padding: 4 }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Mobile Drawer (only active on mobile when opened) */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div style={{ width: 260, height: '100%' }} onClick={(e) => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

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
          background: var(--surface-card);
          border-bottom: 1px solid var(--border-subtle);
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
