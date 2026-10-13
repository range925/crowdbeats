'use client';

// Crowdbeats V2 — Fan Portal Layout
// Active nav highlight via usePathname (Instagram-style)
// Mobile bottom tab bar (Uber/Instagram paradigm) + Accessible top drawer for full 12-section access

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMobileDrawer } from '@/lib/hooks/useMobileDrawer';
import { ResponsiveMobileDrawer } from '@/components/navigation/ResponsiveMobileDrawer';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

export interface FanNavItem {
  href: string;
  label: string;
  icon: string;
}

export interface FanNavGroup {
  title: string;
  items: FanNavItem[];
}

export const FAN_NAV_GROUPS: FanNavGroup[] = [
  {
    title: 'DISCOVER & LIVE',
    items: [
      { href: '/fan',                  label: 'Home Hub',        icon: '🎵' },
      { href: '/discover',             label: 'Live Map Radar',  icon: '🧭' },
      { href: '/fan/nearby',           label: 'Nearby Live Map', icon: '🗺️' },
      { href: '/fan/tip',              label: 'Direct Tip',      icon: '💜' },
      { href: '/fan/scan',             label: 'AR Vision Tip',   icon: '⚡' },
      { href: '/fan/following',        label: 'Following',       icon: '❤️' },
      { href: '/fan/messages',         label: 'Messages',        icon: '💬' },
      { href: '/fan/activity',         label: 'Activity & Alerts', icon: '🔔' },
    ],
  },
  {
    title: 'WALLET & SETTINGS',
    items: [
      { href: '/fan/receipts',         label: 'Tip History',     icon: '🧾' },
      { href: '/fan/payment-methods',  label: 'Payment & Wallet', icon: '💳' },
      { href: '/account',              label: 'Profile & Account', icon: '👤' },
      { href: '/fan/privacy',          label: 'Privacy & Data',  icon: '🔒' },
      { href: '/fan/security',         label: 'Security & 2FA',  icon: '🛡️' },
      { href: '/fan/settings',         label: 'Fan Settings',    icon: '⚙️' },
    ],
  },
];

// Flattened for easy lookup
export const FAN_NAV_ITEMS: FanNavItem[] = FAN_NAV_GROUPS.flatMap((g) => g.items);

// Mobile bottom bar — 5 most important tabs (Uber/Instagram pattern)
export const BOTTOM_TABS = [
  { href: '/fan',              label: 'Home',     icon: '🎵' },
  { href: '/discover',         label: 'Map',      icon: '🗺️' },
  { href: '/fan/scan',         label: 'Scan',     icon: '⚡' },
  { href: '/fan/following',    label: 'Following', icon: '❤️' },
  { href: '/fan/payment-methods', label: 'Wallet', icon: '💳' },
] as const;

export default function FanLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status, logout } = useAuth();
  const {
    isOpen: isMobileMenuOpen,
    close: closeMobileMenu,
    triggerProps,
    drawerRef,
    closeButtonRef,
  } = useMobileDrawer({ drawerId: 'cb-fan-mobile-drawer' });

  const isActive = (href: string) => {
    if (href === '/fan') return pathname === '/fan';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif] tracking-[-0.015em] antialiased selection:bg-[#000000] selection:text-white">
      {/* ── Mobile Top Navigation Header (<=768px) ── */}
      <header
        className="md:hidden sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-xl border-b border-black/[0.08] px-4 py-3 flex items-center justify-between"
        aria-label="Fan portal top bar"
      >
        <div className="flex items-center gap-2">
          <Link href="/" aria-label="Crowdbeats home" className="inline-flex items-center">
            <CrowdbeatsLogo variant="horizontal" height={22} surface="light" ariaHidden />
          </Link>
          <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7C3AED]/10">
            Fan Portal
          </span>
        </div>
        <button
          type="button"
          {...triggerProps}
          aria-label={isMobileMenuOpen ? 'Close fan navigation menu' : 'Open fan navigation menu'}
          className="p-2.5 rounded-xl border border-black/10 bg-black/[0.03] text-[#1D1D1F] flex items-center justify-center text-xl w-11 h-11 min-w-[44px] min-h-[44px] cursor-pointer"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* ── Accessible Mobile Drawer (<=768px) ── */}
      <ResponsiveMobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        drawerRef={drawerRef}
        closeButtonRef={closeButtonRef}
        drawerId="cb-fan-mobile-drawer"
        title="Fan Portal Navigation"
        personaLabel="Fan Portal"
        footer={
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                closeMobileMenu(false);
                logout();
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/15 transition-all cursor-pointer border-none"
            >
              <span>↩︎</span>
              <span>Sign out</span>
            </button>
          </div>
        }
      >
        <nav aria-label="Fan mobile navigation" className="space-y-4">
          {FAN_NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                {group.title}
              </div>
              <ul className="space-y-1 mt-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => closeMobileMenu(false)}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs transition-all ${
                          active
                            ? 'bg-black/[0.05] text-[#1D1D1F] font-semibold'
                            : 'text-[#6E6E73] hover:bg-black/[0.04] hover:text-[#1D1D1F]'
                        }`}
                      >
                        <span aria-hidden="true" className="text-sm flex-shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7C3AED] flex-shrink-0" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ResponsiveMobileDrawer>

      <div className="mx-auto max-w-6xl px-4 py-8 md:flex md:gap-8 pb-24 md:pb-8">
        
        {/* ── Desktop / Tablet Sidebar ─────────────────────────────────── */}
        <aside className="hidden md:block md:w-60 shrink-0">
          <div className="sticky top-8 p-4 rounded-2xl bg-[#FFFFFF] border border-black/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="mb-4 px-1">
              <Link href="/" aria-label="Crowdbeats home" className="inline-block">
                <CrowdbeatsLogo variant="horizontal" height={22} surface="light" ariaHidden />
              </Link>
              <span className="block text-[10px] font-semibold text-[#7C3AED] uppercase tracking-wider mt-1 px-1">
                Fan Portal
              </span>
            </div>

            <nav aria-label="Fan account navigation" className="space-y-4">
              {FAN_NAV_GROUPS.map((group) => (
                <div key={group.title}>
                  <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#86868B]">
                    {group.title}
                  </div>
                  <ul className="space-y-0.5 mt-0.5">
                    {group.items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-all ${
                              active
                                ? 'bg-black/[0.05] text-[#1D1D1F] font-semibold'
                                : 'text-[#6E6E73] hover:bg-black/[0.04] hover:text-[#1D1D1F]'
                            }`}
                          >
                            <span aria-hidden="true" className="text-sm flex-shrink-0">{item.icon}</span>
                            <span className="truncate">{item.label}</span>
                            {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7C3AED] flex-shrink-0" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Sign out */}
            <div className="mt-4 pt-3 border-t border-black/[0.08]">
              <button
                onClick={logout}
                className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs text-[#6E6E73] hover:bg-black/[0.04] hover:text-[#1D1D1F] transition-all cursor-pointer border-none bg-transparent"
              >
                <span aria-hidden="true" className="text-sm flex-shrink-0">↩︎</span>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* ── Mobile Bottom Tab Bar (Apple Frosted Glass) ───────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FFFFFF]/90 backdrop-blur-xl border-t border-black/[0.08] safe-area-inset-bottom"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {BOTTOM_TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all min-w-[56px] min-h-[48px]"
              >
                <span
                  className={`text-xl transition-transform ${active ? 'scale-110' : 'opacity-60'}`}
                >
                  {tab.icon}
                </span>
                <span
                  className={`text-[10px] tracking-tight ${
                    active ? 'font-semibold text-[#1D1D1F]' : 'text-[#86868B]'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
