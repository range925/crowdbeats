'use client';

// Crowdbeats V2 — Fan Portal Layout
// Active nav highlight via usePathname (Instagram-style)
// Mobile bottom tab bar (Uber/Instagram paradigm)

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

const NAV_ITEMS = [
  { href: '/fan',                  label: 'Home Hub',        icon: '🎵' },
  { href: '/fan/nearby',           label: 'Nearby Live Map', icon: '🗺️' },
  { href: '/fan/tip',              label: 'Direct Tip',      icon: '💜' },
  { href: '/fan/scan',             label: 'AR Vision Tip',   icon: '⚡' },
  { href: '/fan/activity',         label: 'Activity & Alerts', icon: '🔔' },
  { href: '/fan/messages',         label: 'Messages',        icon: '💬' },
  { href: '/fan/following',        label: 'Following',       icon: '❤️' },
  { href: '/fan/receipts',         label: 'Tip History',     icon: '🧾' },
  { href: '/fan/payment-methods',  label: 'Payment & Wallet', icon: '💳' },
  { href: '/fan/privacy',          label: 'Privacy & Data',  icon: '🔒' },
  { href: '/fan/security',         label: 'Security & 2FA',  icon: '🛡️' },
  { href: '/fan/settings',         label: 'Fan Settings',    icon: '⚙️' },
] as const;

// Mobile bottom bar — 5 most important tabs (Uber/Instagram pattern)
const BOTTOM_TABS = [
  { href: '/fan',              label: 'Home',     icon: '🎵' },
  { href: '/fan/nearby',       label: 'Map',      icon: '🗺️' },
  { href: '/fan/scan',         label: 'Scan',     icon: '⚡' },
  { href: '/fan/following',    label: 'Following', icon: '❤️' },
  { href: '/fan/payment-methods', label: 'Pay',   icon: '💳' },
] as const;

export default function FanLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/fan') return pathname === '/fan';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif] tracking-[-0.015em] antialiased selection:bg-[#000000] selection:text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:flex md:gap-8">
        
        {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
        <aside className="hidden md:block md:w-60 shrink-0">
          <div className="sticky top-8 p-4 rounded-2xl bg-[#FFFFFF] border border-black/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="mb-5 px-1">
              <Link href="/" aria-label="Crowdbeats home" className="inline-block">
                <CrowdbeatsLogo variant="horizontal" height={22} surface="light" ariaHidden />
              </Link>
              <span className="block text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider mt-1 px-1">Fan Portal</span>
            </div>
            <nav aria-label="Fan account navigation">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs transition-all ${
                          active
                            ? 'bg-black/[0.05] text-[#1D1D1F] font-semibold'
                            : 'text-[#6E6E73] hover:bg-black/[0.04] hover:text-[#1D1D1F]'
                        }`}
                      >
                        <span aria-hidden="true" className="text-sm flex-shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#000000] flex-shrink-0" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            {/* Sign out */}
            <div className="mt-3 pt-3 border-t border-black/[0.08]">
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full rounded-xl px-3.5 py-2.5 text-xs text-[#6E6E73] hover:bg-black/[0.04] hover:text-[#1D1D1F] transition-all"
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
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all min-w-[52px]"
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
