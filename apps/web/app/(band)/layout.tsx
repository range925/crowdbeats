'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

interface BandLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/band/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/band/activity', label: 'Band Activity', icon: '⚡' },
  { href: '/band/profile', label: 'Profile & EPK', icon: '🎸' },
  { href: '/band/performances', label: 'Performances', icon: '🎙️' },
  { href: '/band/campaigns', label: 'Campaigns', icon: '🚀' },
  { href: '/band/fans', label: 'Fans & Tippers', icon: '👥' },
  { href: '/band/messages', label: 'Messages', icon: '💬' },
  { href: '/band/members', label: 'Members & Roles', icon: '🤝' },
  { href: '/band/splits', label: 'Splits & Governance', icon: '⚖️' },
  { href: '/band/payouts', label: 'Payouts & Stripe', icon: '💳' },
  { href: '/band/revenue', label: 'Revenue & Treasury', icon: '💰' },
  { href: '/band/analytics', label: 'Analytics', icon: '📈' },
  { href: '/band/marketing', label: 'Marketing & Share', icon: '📢' },
  { href: '/band/media', label: 'Media Library', icon: '🎥' },
  { href: '/band/sponsors', label: 'Sponsorships', icon: '🏷️' },
  { href: '/band/documents', label: 'Documents & Contracts', icon: '📄' },
  { href: '/band/privacy', label: 'Privacy & Data', icon: '🔐' },
  { href: '/band/security', label: 'Security & Auth', icon: '🔒' },
  { href: '/band/settings', label: 'Studio Settings', icon: '⚙️' },
];

export default function BandStudioLayout({ children }: BandLayoutProps) {
  const { displayName: authName, email: authEmail, logout } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  const displayName = authName || 'Band Member';
  const email = authEmail || '';

  const isActive = (href: string) =>
    href === '/band/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--surface-base, #FBFBFD)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif",
      letterSpacing: '-0.015em',
      color: 'var(--text-primary, #1D1D1F)'
    }}>
      <aside style={{
        width: 260,
        background: 'var(--surface-card, #FFFFFF)',
        borderRight: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 10
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.08))' }}>
          <Link href="/band/dashboard" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 6 }} aria-label="Crowdbeats Band Studio">
            <CrowdbeatsLogo variant="horizontal" height={22} surface={theme === 'light' ? 'light' : 'dark'} ariaHidden />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.8px', paddingLeft: 4 }}>Band Studio</div>
          </Link>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 14px', borderRadius: 10, textDecoration: 'none',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s ease',
                  background: active ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                  color: active ? '#000000' : 'var(--text-secondary, #6E6E73)',
                  border: active ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid transparent',
                  boxShadow: active ? 'inset 0 1px 0 0 rgba(0, 0, 0, 0.04)' : 'none',
                }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#000000', flexShrink: 0 }} />}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
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

      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
