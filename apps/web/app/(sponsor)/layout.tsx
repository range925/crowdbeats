'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

interface SponsorLayoutProps {
  children: React.ReactNode;
}

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
  const { displayName: authName, email: authEmail, logout } = useAuth();
  const displayName = authName || 'Sponsor Rep';
  const email = authEmail || '';

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
