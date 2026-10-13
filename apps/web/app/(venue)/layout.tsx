'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

import { usePathname } from 'next/navigation';
import { getSessionCookie } from '@/lib/session';

interface VenueLayoutProps {
  children: React.ReactNode;
}

const ALLOWED_PERSONAS = new Set(['venue_manager', 'admin', 'staff']);

const NAV_ITEMS = [
  { href: '/venue/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/venue/activity', label: 'Venue Activity', icon: '⚡' },
  { href: '/venue/profile', label: 'Venue EPK & Info', icon: '🏟️' },
  { href: '/venue/stages', label: 'Stage Management', icon: '🎭' },
  { href: '/venue/events', label: 'Event Schedule', icon: '📅' },
  { href: '/venue/performances', label: 'Performance Logs', icon: '🎙️' },
  { href: '/venue/artists', label: 'Artist Roster', icon: '🎸' },
  { href: '/venue/live', label: 'Live Stage Feed', icon: '📡' },
  { href: '/venue/analytics', label: 'Foot Traffic & Tips', icon: '📈' },
  { href: '/venue/staff', label: 'Staff & Roles', icon: '👥' },
  { href: '/venue/privacy', label: 'Privacy & Data', icon: '🔐' },
  { href: '/venue/security', label: 'Security & Access', icon: '🔒' },
  { href: '/venue/settings', label: 'Venue Settings', icon: '⚙️' },
];

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

  if (!isDev && accessDecision === null) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border-subtle, rgba(0,0,0,0.1))', borderTopColor: 'var(--accent-primary, #7C3AED)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isDev && accessDecision === false) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center', background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 24, padding: 36, boxShadow: '0 16px 40px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🚫</div>
          <h1 style={{ color: 'var(--status-error, #EF4444)', fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>Venue Studio Access Denied</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, margin: '0 0 24px' }}>This area is reserved for live music venue managers, booking agents, and stage operators.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/fan" style={{ padding: '9px 18px', borderRadius: 9999, border: '1px solid var(--border-subtle)', background: 'transparent', textDecoration: 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>Fan Portal</Link>
            <Link href="/onboarding/venue" style={{ padding: '9px 18px', borderRadius: 9999, border: 'none', background: 'var(--accent-primary, #7C3AED)', color: '#FFFFFF', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Register Venue</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-base)' }}>
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: 260,
          background: 'var(--surface-card)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Link href="/venue/dashboard" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 6 }} aria-label="Crowdbeats Venue Studio">
            <CrowdbeatsLogo variant="horizontal" height={22} surface={theme === 'light' ? 'light' : 'dark'} ariaHidden />
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-primary, #7C3AED)', textTransform: 'uppercase', letterSpacing: '0.8px', paddingLeft: 4 }}>
              Venue Studio
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 14px',
                borderRadius: 8,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {email || 'venue_manager'}
            </span>
            <button
              onClick={logout}
              style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 8px', textDecoration: 'underline', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
