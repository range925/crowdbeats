'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

import { getSessionCookie } from '@/lib/session';

interface SponsorLayoutProps {
  children: React.ReactNode;
}

const ALLOWED_PERSONAS = new Set(['sponsor_rep', 'admin', 'staff']);

const NAV_ITEMS = [
  { href: '/sponsor/dashboard',     label: 'Dashboard',           icon: '📊' },
  { href: '/sponsor/activity',      label: 'Match Activity',      icon: '⚡' },
  { href: '/sponsor/discovery',     label: 'Talent Discovery',    icon: '🔍' },
  { href: '/sponsor/sponsorships',  label: 'Sponsorship Deals',   icon: '🤝' },
  { href: '/sponsor/applications',  label: 'Applications',        icon: '📥' },
  { href: '/sponsor/shortlist',     label: 'Talent Shortlist',    icon: '⭐' },
  { href: '/sponsor/opportunities', label: 'Opportunities & RFPs',icon: '📢' },
  { href: '/sponsor/messages',      label: 'Messages',            icon: '💬' },
  { href: '/sponsor/documents',     label: 'Contracts & Legal',   icon: '📄' },
  { href: '/sponsor/payments',      label: 'Payments & Invoices', icon: '💳' },
  { href: '/sponsor/analytics',     label: 'Campaign ROI',        icon: '📈' },
  { href: '/sponsor/organization',  label: 'Brand Profile',       icon: '🏢' },
  { href: '/sponsor/team',          label: 'Team & Roles',        icon: '👥' },
  { href: '/sponsor/privacy',       label: 'Privacy & Data',      icon: '🔐' },
  { href: '/sponsor/security',      label: 'Security & Auth',     icon: '🔒' },
  { href: '/sponsor/settings',      label: 'Sponsor Settings',    icon: '⚙️' },
];

export default function SponsorStudioLayout({ children }: SponsorLayoutProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { status, displayName: authName, email: authEmail, personaType, logout } = useAuth();
  const displayName = authName || 'Sponsor Rep';
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
      window.location.replace('/auth?return=' + encodeURIComponent(pathname || '/sponsor/dashboard'));
      return;
    }

    const allowed = Boolean(effectivePersona && ALLOWED_PERSONAS.has(effectivePersona));
    setAccessDecision(allowed);
  }, [status, personaType, pathname, isDev]);

  if (!isDev && accessDecision === null) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border-subtle, rgba(0,0,0,0.1))', borderTopColor: 'var(--accent-secondary, #F97316)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isDev && accessDecision === false) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center', background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 24, padding: 36, boxShadow: '0 16px 40px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🚫</div>
          <h1 style={{ color: 'var(--status-error, #EF4444)', fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>Sponsor Studio Access Denied</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, margin: '0 0 24px' }}>This area is reserved for corporate sponsors, brand partners, and authorized representatives.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/fan" style={{ padding: '9px 18px', borderRadius: 9999, border: '1px solid var(--border-subtle)', background: 'transparent', textDecoration: 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>Fan Portal</Link>
            <Link href="/onboarding/sponsor" style={{ padding: '9px 18px', borderRadius: 9999, border: 'none', background: '#F97316', color: '#FFFFFF', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create Sponsor Account</Link>
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
          <Link href="/sponsor/dashboard" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 6 }} aria-label="Crowdbeats Sponsor Studio">
            <CrowdbeatsLogo variant="horizontal" height={22} surface={theme === 'light' ? 'light' : 'dark'} ariaHidden />
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-secondary, #F97316)', textTransform: 'uppercase', letterSpacing: '0.8px', paddingLeft: 4 }}>
              Sponsor Studio
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/sponsor/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 14px', borderRadius: 8, textDecoration: 'none',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  transition: 'all 0.15s ease',
                  background: active ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                  color: active ? '#000000' : 'var(--text-secondary)',
                  border: active ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid transparent',
                }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#000000', flexShrink: 0 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {email || 'sponsor_rep'}
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
