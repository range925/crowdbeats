'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

interface VenueLayoutProps {
  children: React.ReactNode;
}

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
  const { theme } = useTheme();
  const { displayName: authName, email: authEmail, logout } = useAuth();
  const displayName = authName || 'Venue Manager';
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
