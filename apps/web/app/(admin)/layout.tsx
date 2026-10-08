'use client';

/**
 * Crowdbeats V2 — Enterprise Control Plane Shell & Navigation
 *
 * Operational Console Features:
 * - Desktop (>1024px): Persistent 256px sticky sidebar with brand mark, instant search, and grouped navigation
 * - Tablet & Mobile (<=1024px): Responsive top header with hamburger toggle, slide-in drawer, and accessible focus trap
 * - Zero Emoji: 100% outline SVG icons via @/components/admin/AdminIcons
 * - Strict Color & Theme Support: Light (clean off-white canvas) & Dark (deep obsidian canvas)
 * - Session cookie verification (__cb_session) + Firebase Auth state listener
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/app';
import { getUserRecord } from '@/lib/firebase/firestore';
import { useTheme } from '@/components/theme/ThemeProvider';
import { AdminBreadcrumb, GlobalEntitySearch } from '@/components/admin';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';
import {
  CommandCenterIcon,
  CrmIcon,
  ArtistsIcon,
  StaffRolesIcon,
  LiveRadarIcon,
  VenuesIcon,
  CampaignsIcon,
  ContentModerationIcon,
  FinancialLedgerIcon,
  PlatformFeesIcon,
  SponsorsIcon,
  TrustSafetyIcon,
  SupportQueueIcon,
  SecurityThreatsIcon,
  ComplianceRegisterIcon,
  InfraHealthIcon,
  IntegrationsIcon,
  FeatureFlagsIcon,
  AnalyticsIcon,
  SearchIcon,
  LogOutIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  MenuIcon,
  XIcon,
  ShieldBadgeIcon,
  LivePulseDot,
  AdminIconProps,
} from '@/components/admin/AdminIcons';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<AdminIconProps>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/admin/command-center', label: 'Command Center', icon: CommandCenterIcon },
    ],
  },
  {
    title: 'COMMUNITY',
    items: [
      { href: '/admin/users', label: 'Users & Accounts', icon: CrmIcon },
      { href: '/admin/discovery', label: 'Discovery & Live Map', icon: LiveRadarIcon },
      { href: '/admin/creators', label: 'Musicians & Bands', icon: ArtistsIcon },
      { href: '/admin/campaigns', label: 'Campaigns', icon: CampaignsIcon },
      { href: '/admin/sponsors', label: 'Sponsors', icon: SponsorsIcon },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { href: '/admin/finance', label: 'Payments & Finance', icon: FinancialLedgerIcon },
      { href: '/admin/trust-safety', label: 'Trust & Safety', icon: TrustSafetyIcon },
      { href: '/admin/support', label: 'Support', icon: SupportQueueIcon },
    ],
  },
  {
    title: 'GROWTH',
    items: [
      { href: '/admin/content', label: 'Content & Communications', icon: ContentModerationIcon },
      { href: '/admin/analytics', label: 'Analytics & Reports', icon: AnalyticsIcon },
    ],
  },
  {
    title: 'PLATFORM',
    items: [
      { href: '/admin/system-health', label: 'System Health & Integrations', icon: InfraHealthIcon },
      { href: '/admin/security', label: 'Security & Audit', icon: SecurityThreatsIcon },
      { href: '/admin/settings', label: 'Settings & Admin Access', icon: StaffRolesIcon },
    ],
  },
];

const VALID_STAFF_ROLES = new Set([
  'SUPER_ADMIN', 'EXECUTIVE', 'FINANCE_ANALYST', 'DATA_ANALYST',
  'CONTENT_MODERATOR', 'TRUST_SAFETY', 'COMPLIANCE_OFFICER', 'CUSTOMER_SUPPORT',
  'GROWTH_MANAGER', 'PARTNERSHIPS', 'ARTIST_RELATIONS', 'VENUE_RELATIONS',
  'DEVELOPER', 'QA_TESTER', 'LEGAL', 'MARKETING',
]);

function getSessionCookie(): { displayName: string; email: string; platformRole: string } | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split(';').find(c => c.trim().startsWith('__cb_session='));
  if (!match) return null;
  try {
    const raw = match.trim().replace('__cb_session=', '');
    const data = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    return {
      displayName: typeof data.displayName === 'string' ? data.displayName : 'Authorized Staff',
      email: typeof data.email === 'string' ? data.email : '',
      platformRole: typeof data.platformRole === 'string' ? data.platformRole : '',
    };
  } catch {
    return null;
  }
}

function clearSessionCookie() {
  document.cookie = '__cb_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function useFocusTrap(isActive: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    const focusableElements = ref.current.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isActive]);

  return ref;
}

export default function EnterpriseAdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<{ displayName: string; email: string; platformRole: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const { themePreference, setThemePreference } = useTheme();
  const theme = themePreference;
  const [shortcutHint, setShortcutHint] = useState('⌘K');

  const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setThemePreference(newTheme);
    try {
      localStorage.setItem('crowdbeats_admin_theme', newTheme);
      localStorage.setItem('crowdbeats-theme-preference', newTheme);
    } catch {}
  }, [setThemePreference]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useFocusTrap(sidebarOpen);

  // Detect platform for keyboard hint
  useEffect(() => {
    if (typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent)) {
      setShortcutHint('Ctrl+K');
    }
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (sidebarOpen) {
          setSidebarOpen(false);
        } else if (navSearch) {
          setNavSearch('');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sidebarOpen, navSearch]);

  // Keyboard shortcut for quick navigation filter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifierK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      const isSlash = e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA';

      if (isModifierK || isSlash) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Firebase auth & session verification
  useEffect(() => {
    let isMounted = true;
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      if (!currentUser) {
        const s = getSessionCookie();
        if (s && s.platformRole && VALID_STAFF_ROLES.has(s.platformRole)) {
          setSession(s);
          setChecking(false);
          return;
        }
        clearSessionCookie();
        const returnPath = pathname || '/admin/command-center';
        router.replace(`/auth?return=${encodeURIComponent(returnPath)}`);
        return;
      }

      try {
        const tokenResult = await currentUser.getIdTokenResult(true);
        let role = (tokenResult.claims.platformRole as string) || (tokenResult.claims.role as string);

        if (!role || !VALID_STAFF_ROLES.has(role)) {
          try {
            const userDoc = await getUserRecord(currentUser.uid);
            if (userDoc?.platformRole && VALID_STAFF_ROLES.has(userDoc.platformRole as string)) {
              role = userDoc.platformRole as string;
            } else if (userDoc?.personaType === 'admin') {
              role = 'SUPER_ADMIN';
            }
          } catch {}
        }

        if (role && VALID_STAFF_ROLES.has(role)) {
          setSession({
            displayName: currentUser.displayName || 'Authorized Staff',
            email: currentUser.email || '',
            platformRole: role,
          });
          setChecking(false);
        } else {
          clearSessionCookie();
          const returnPath = pathname || '/admin/command-center';
          router.replace(`/auth?return=${encodeURIComponent(returnPath)}`);
        }
      } catch (err) {
        console.error('Failed to verify staff claims on token:', err);
        clearSessionCookie();
        const returnPath = pathname || '/admin/command-center';
        router.replace(`/auth?return=${encodeURIComponent(returnPath)}`);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router, pathname]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      const auth = getAuth(firebaseApp);
      await signOut(auth);
      clearSessionCookie();
      router.replace('/auth');
    } catch {
      clearSessionCookie();
      router.replace('/auth');
    }
  }, [router]);

  const isItemActive = useCallback((href: string) => {
    if (pathname === href) return true;
    if (pathname?.startsWith(href + '/')) return true;

    // Supported backward-compatible aliases:
    if (href === '/admin/users' && (pathname === '/admin/crm' || pathname?.startsWith('/admin/crm/'))) return true;
    if (href === '/admin/discovery' && (pathname === '/admin/live' || pathname?.startsWith('/admin/live/') || pathname === '/admin/venues' || pathname?.startsWith('/admin/venues/'))) return true;
    if (href === '/admin/creators' && (pathname === '/admin/artists' || pathname?.startsWith('/admin/artists/'))) return true;
    if (href === '/admin/sponsors' && (pathname === '/admin/sponsorships' || pathname?.startsWith('/admin/sponsorships/'))) return true;
    if (href === '/admin/system-health' && (pathname === '/admin/platform' || pathname?.startsWith('/admin/platform/') || pathname === '/admin/integrations' || pathname?.startsWith('/admin/integrations/'))) return true;
    if (href === '/admin/security' && (pathname === '/admin/compliance' || pathname?.startsWith('/admin/compliance/'))) return true;
    if (href === '/admin/settings' && (pathname === '/admin/administration' || pathname?.startsWith('/admin/administration/'))) return true;

    return false;
  }, [pathname]);

  const filteredNavSections = useMemo(() => {
    const q = navSearch.trim().toLowerCase();
    if (!q) return ADMIN_NAV_SECTIONS;

    return ADMIN_NAV_SECTIONS.map((section) => {
      const items = section.items.filter((item) =>
        item.label.toLowerCase().includes(q)
      );
      return { ...section, items };
    }).filter((section) => section.items.length > 0);
  }, [navSearch]);

  const getBreadcrumbs = useCallback(() => {
    if (!pathname) return [{ label: 'Control Plane', href: '/admin/command-center' }];
    const segments = pathname.split('/').filter(Boolean);
    const crumbs = [];
    let currentPath = '';

    for (let i = 0; i < segments.length; i++) {
      currentPath += `/${segments[i]}`;
      const isLast = i === segments.length - 1;
      let label = segments[i].charAt(0).toUpperCase() + segments[i].slice(1).replace(/-/g, ' ');

      // Match with authoritative navigation structure
      for (const sec of ADMIN_NAV_SECTIONS) {
        for (const item of sec.items) {
          if (item.href === currentPath) {
            label = item.label;
            break;
          }
        }
      }

      if (segments[i] === 'admin') label = 'Control Plane';
      if (segments[i] === 'crm' && !isLast) label = 'CRM Directory';
      if (segments[i] === 'payments') label = 'Payments';

      crumbs.push({
        label,
        href: isLast ? undefined : (currentPath === '/admin' ? '/admin/command-center' : currentPath),
      });
    }
    return crumbs;
  }, [pathname]);

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--surface-base)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
          <LivePulseDot size={8} color="var(--accent-primary, #7C3AED)" />
          <span>Verifying credentials & authorization…</span>
        </div>
      </div>
    );
  }

  const displayName = session?.displayName ?? 'Authorized Staff';
  const email = session?.email ?? '';
  const platformRole = session?.platformRole ?? 'STAFF';

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="admin-brand-header">
        <Link
          href="/admin/command-center"
          className="admin-brand-link"
          onClick={() => setSidebarOpen(false)}
          aria-label="Crowdbeats Control Plane"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <CrowdbeatsLogo variant="horizontal" height={22} surface={theme === 'light' ? 'light' : 'dark'} />
            <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>CROWDBEATS</span>
            <div className="admin-brand-badge" style={{ paddingLeft: '2px' }}>CONTROL PLANE</div>
          </div>
        </Link>
      </div>

      {/* Quick Navigation Filter */}
      <div className="admin-search-container">
        <div className="admin-search-wrapper">
          <SearchIcon size={14} color="var(--text-tertiary)" className="admin-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search navigation..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            className="admin-search-input"
            aria-label="Filter navigation items"
          />
          {navSearch ? (
            <button
              type="button"
              onClick={() => {
                setNavSearch('');
                searchInputRef.current?.focus();
              }}
              className="admin-search-clear"
              aria-label="Clear navigation search"
            >
              <XIcon size={12} />
            </button>
          ) : (
            <span className="admin-search-kbd">{shortcutHint}</span>
          )}
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="admin-nav-body" aria-label="Admin Navigation">
        {filteredNavSections.map((section) => (
          <div key={section.title} className="admin-nav-group">
            <div className="admin-nav-group-title">
              {section.title}
            </div>
            <div className="admin-nav-group-items">
              {section.items.map((item) => {
                const isActive = isItemActive(item.href);
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`admin-nav-item ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="admin-nav-icon">
                      <IconComponent size={16} color="currentColor" />
                    </span>
                    <span className="admin-nav-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {filteredNavSections.length === 0 && (
          <div className="admin-nav-empty">
            No matching navigation items found.
          </div>
        )}
      </nav>

      {/* Footer / User Tray */}
      <div className="admin-user-tray">
        <div className="admin-sidebar-env">
          <span className="admin-sidebar-env-dot" />
          <span>Production Environment</span>
        </div>

        <div className="admin-user-profile">
          <div className="admin-user-avatar">
            {getInitials(displayName)}
          </div>
          <div className="admin-user-meta">
            <div className="admin-user-name" title={displayName}>
              {displayName}
            </div>
            <div className="admin-user-email" title={email}>
              {email || 'authorized.staff@crowdbeats.com'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="admin-signout-btn"
          aria-label="Sign out of admin console"
        >
          <LogOutIcon size={14} />
          <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @keyframes adminPulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        .admin-shell {
          display: flex;
          min-height: 100vh;
          background: var(--surface-base);
          color: var(--text-primary);
        }

        /* Desktop Sidebar (Persistent 256px wide) */
        .admin-sidebar {
          width: 256px;
          background: var(--surface-card);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 20;
          flex-shrink: 0;
        }

        /* Brand Header */
        .admin-brand-header {
          padding: 16px 18px;
          border-bottom: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }
        .admin-brand-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }
        .admin-brand-icon-wrapper {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.35);
          flex-shrink: 0;
        }
        .admin-brand-title {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .admin-brand-badge {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--accent-primary, #7C3AED);
          text-transform: uppercase;
        }

        /* Quick Navigation Search */
        .admin-search-container {
          padding: 12px 14px 4px;
          flex-shrink: 0;
        }
        .admin-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .admin-search-icon {
          position: absolute;
          left: 10px;
          pointer-events: none;
        }
        .admin-search-input {
          width: 100%;
          padding: 7px 32px 7px 30px;
          border-radius: 6px;
          border: 1px solid var(--border-subtle);
          background: var(--surface-base);
          color: var(--text-primary);
          font-size: 12px;
          font-family: inherit;
          outline: none;
          transition: all 0.15s ease;
        }
        .admin-search-input:focus {
          border-color: var(--accent-primary, #7C3AED);
          box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.15);
        }
        .admin-search-kbd {
          position: absolute;
          right: 8px;
          font-size: 10px;
          font-family: var(--cb-font-mono, monospace);
          color: var(--text-tertiary);
          padding: 1px 4px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid var(--border-subtle);
          pointer-events: none;
        }
        [data-theme="dark"] .admin-search-kbd {
          background: rgba(255, 255, 255, 0.08);
        }
        .admin-search-clear {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          padding: 2px;
          cursor: pointer;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        .admin-search-clear:hover {
          color: var(--text-primary);
        }

        /* Navigation List */
        .admin-nav-body {
          flex: 1;
          overflow-y: auto;
          padding: 12px 12px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .admin-nav-group {
          display: flex;
          flex-direction: column;
        }
        .admin-nav-group-title {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0 10px 6px;
          user-select: none;
        }
        .admin-nav-group-items {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .admin-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 6px;
          color: var(--text-secondary);
          background: transparent;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s ease;
          user-select: none;
        }
        .admin-nav-item:hover {
          background: rgba(124, 58, 237, 0.04);
          color: var(--text-primary);
        }
        [data-theme="dark"] .admin-nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #FFFFFF;
        }
        .admin-nav-item.active {
          background: rgba(124, 58, 237, 0.08);
          color: var(--accent-primary, #7C3AED);
          font-weight: 600;
        }
        [data-theme="dark"] .admin-nav-item.active {
          background: rgba(124, 58, 237, 0.18);
          color: #C084FC;
        }
        .admin-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 4px;
          bottom: 4px;
          width: 3px;
          background: #7C3AED;
          border-radius: 0 2px 2px 0;
        }
        .admin-nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
        .admin-nav-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .admin-nav-empty {
          padding: 24px 12px;
          text-align: center;
          font-size: 12px;
          color: var(--text-tertiary);
        }

        /* User Tray Footer */
        .admin-user-tray {
          padding: 14px 16px;
          border-top: 1px solid var(--border-subtle);
          background: var(--surface-raised);
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .admin-sidebar-env {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 600;
          color: var(--text-tertiary);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .admin-sidebar-env-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #10B981;
        }
        .admin-user-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .admin-user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 9999px;
          background: rgba(124, 58, 237, 0.12);
          border: 1px solid rgba(124, 58, 237, 0.25);
          color: var(--accent-primary, #7C3AED);
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        [data-theme="dark"] .admin-user-avatar {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.4);
          color: #C084FC;
        }
        .admin-user-meta {
          flex: 1;
          min-width: 0;
        }
        .admin-user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .admin-user-email {
          font-size: 11px;
          color: var(--text-tertiary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .admin-signout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 6px;
          border: 1px solid var(--border-subtle);
          background: var(--surface-base);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .admin-signout-btn:hover:not(:disabled) {
          border-color: rgba(220, 38, 38, 0.35);
          color: #DC2626;
          background: rgba(220, 38, 38, 0.05);
        }
        .admin-signout-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Top Header Bar */
        .admin-topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          height: 56px;
          background: var(--cb-surface-glass, rgba(255, 255, 255, 0.85));
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        [data-theme="dark"] .admin-topbar {
          background: rgba(22, 22, 23, 0.85);
        }
        .admin-topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          overflow: hidden;
        }
        .admin-hamburger-btn {
          display: none;
          background: none;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          padding: 6px;
          cursor: pointer;
          color: var(--text-primary);
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .admin-breadcrumbs-wrap {
          display: flex;
          align-items: center;
          min-width: 0;
          overflow: hidden;
        }
        .admin-topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .admin-env-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.22);
          color: #059669;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        [data-theme="dark"] .admin-env-pill {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.3);
          color: #34D399;
        }
        .admin-role-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(124, 58, 237, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: var(--accent-primary, #7C3AED);
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }
        [data-theme="dark"] .admin-role-pill {
          background: rgba(124, 58, 237, 0.15);
          border-color: rgba(124, 58, 237, 0.35);
          color: #C084FC;
        }
        .admin-theme-switch {
          display: inline-flex;
          align-items: center;
          background: var(--surface-base);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          padding: 2px;
          gap: 2px;
        }
        .admin-theme-btn {
          background: none;
          border: none;
          border-radius: 4px;
          padding: 4px 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          transition: all 0.15s ease;
        }
        .admin-theme-btn:hover {
          color: var(--text-primary);
        }
        .admin-theme-btn.active {
          background: var(--surface-card);
          color: var(--accent-primary, #7C3AED);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }
        [data-theme="dark"] .admin-theme-btn.active {
          background: var(--surface-raised);
          color: #C084FC;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        }

        /* Mobile Drawer */
        .admin-drawer-overlay {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 40;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
        }
        .admin-drawer {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 256px;
          max-width: 85vw;
          background: var(--surface-card);
          border-right: 1px solid var(--border-subtle);
          z-index: 50;
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
          overflow: hidden;
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2);
        }
        .admin-drawer.open {
          transform: translateX(0);
        }
        .admin-drawer-close {
          position: absolute;
          top: 14px;
          right: 14px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .admin-drawer-close:hover {
          color: var(--text-primary);
          background: var(--surface-base);
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .admin-sidebar {
            display: none;
          }
          .admin-hamburger-btn {
            display: flex;
          }
          .admin-topbar {
            padding: 0 16px;
          }
          .admin-drawer-overlay {
            display: block;
          }
        }
        @media (max-width: 640px) {
          .admin-breadcrumbs-wrap {
            display: none;
          }
          .admin-role-pill {
            display: none;
          }
          .admin-env-pill-text {
            display: none;
          }
          .admin-env-pill {
            padding: 5px;
          }
          .admin-topbar {
            height: 52px;
            padding: 0 12px;
          }
          .admin-main {
            padding: 16px !important;
          }
        }
      `}</style>

      <div className="admin-shell">
        {/* ── Persistent Desktop Sidebar ── */}
        <aside className="admin-sidebar" aria-label="Sidebar Navigation">
          {sidebarContent}
        </aside>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* ── Top Header Bar ── */}
          <header className="admin-topbar">
            <div className="admin-topbar-left">
              <button
                type="button"
                className="admin-hamburger-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
              >
                <MenuIcon size={18} />
              </button>

              <div className="admin-breadcrumbs-wrap">
                <AdminBreadcrumb items={getBreadcrumbs()} />
              </div>
            </div>

            <div className="admin-topbar-right">
              {/* Global Entity Search */}
              <div style={{ marginRight: 8 }}>
                <GlobalEntitySearch />
              </div>

              {/* Live Operations Status */}
              <div className="admin-env-pill" title="Live Operations Control Plane">
                <LivePulseDot size={7} color="#10B981" />
                <span className="admin-env-pill-text">Live Operations</span>
              </div>

              {/* Platform Staff Role Badge */}
              <div className="admin-role-pill" title="Current staff authorization role">
                <ShieldBadgeIcon size={13} color="var(--accent-primary, #7C3AED)" />
                <span>{platformRole.replace(/_/g, ' ') || 'STAFF'}</span>
              </div>

              {/* Theme Selector Segmented Control */}
              <div className="admin-theme-switch" role="radiogroup" aria-label="Color theme selector">
                <button
                  type="button"
                  className={`admin-theme-btn ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('system')}
                  title="System Theme"
                  aria-label="System Theme"
                  role="radio"
                  aria-checked={theme === 'system'}
                >
                  <MonitorIcon size={13} />
                </button>
                <button
                  type="button"
                  className={`admin-theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                  title="Light Theme"
                  aria-label="Light Theme"
                  role="radio"
                  aria-checked={theme === 'light'}
                >
                  <SunIcon size={13} />
                </button>
                <button
                  type="button"
                  className={`admin-theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                  title="Dark Theme"
                  aria-label="Dark Theme"
                  role="radio"
                  aria-checked={theme === 'dark'}
                >
                  <MoonIcon size={13} />
                </button>
              </div>
            </div>
          </header>

          {/* ── Mobile Drawer Overlay ── */}
          <div
            className="admin-drawer-overlay"
            style={{
              opacity: sidebarOpen ? 1 : 0,
              pointerEvents: sidebarOpen ? 'auto' : 'none',
              transition: 'opacity 0.25s ease',
            }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* ── Mobile Drawer ── */}
          <div
            className={`admin-drawer ${sidebarOpen ? 'open' : ''}`}
            role="dialog"
            aria-label="Navigation menu"
            aria-modal="true"
            ref={drawerRef}
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="admin-drawer-close"
              aria-label="Close navigation menu"
            >
              <XIcon size={18} />
            </button>
            {sidebarContent}
          </div>

          {/* ── Main Operations Workspace ── */}
          <main className="admin-main" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
