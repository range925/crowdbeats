'use client';

/**
 * Crowdbeats V2 — Account Center
 * Route: /account
 *
 * Tier-1 Billion-Dollar Experience:
 * - Inspires from Instagram Accounts Center, Uber, Lyft, Apple & Spotify
 * - Two-column desktop layout (320px sticky navigation + flex-1 expansive detail canvas)
 * - Native mobile fluid slide-in navigation with sticky blurred glass headers
 * - Deep-linked state: ?section=<SectionId>
 */

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { AccountCenterHeader } from '@/components/account-center/AccountCenterHeader';
import { AccountCenterSearch } from '@/components/account-center/AccountCenterSearch';
import { AccountCenterNav } from '@/components/account-center/AccountCenterNav';
import { ChevronLeftIcon } from '@/components/account-center/AccountCenterIcons';
import type { SectionId } from '@/components/account-center/types';

function SectionPlaceholder({ id }: { id: string }) {
  return (
    <div
      style={{
        padding: '60px 24px',
        textAlign: 'center',
        color: 'var(--cb-text-muted, #64748B)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--cb-purple-light, #A855F7)',
        }}
      >
        <div className="cb-spin" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#A855F7', borderRadius: '50%' }} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>Loading {id} settings…</div>
    </div>
  );
}

function LazySection({ id }: { id: SectionId }) {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);

  React.useEffect(() => {
    const SECTION_MAP: Record<SectionId, () => Promise<{ [key: string]: React.ComponentType }>> = {
      profile:       () => import('@/components/account-center/sections/AccountProfileSection'),
      security:      () => import('@/components/account-center/sections/SecuritySection'),
      privacy:       () => import('@/components/account-center/sections/PrivacySection'),
      safety:        () => import('@/components/account-center/sections/SafetySection'),
      payments:      () => import('@/components/account-center/sections/PaymentsSection'),
      payouts:       () => import('@/components/account-center/sections/PayoutsSection'),
      notifications: () => import('@/components/account-center/sections/NotificationsSection'),
      location:      () => import('@/components/account-center/sections/LocationSection'),
      appearance:    () => import('@/components/account-center/sections/AppearanceSection'),
      accessibility: () => import('@/components/account-center/sections/AccessibilitySection'),
      language:      () => import('@/components/account-center/sections/LanguageRegionSection'),
      content:       () => import('@/components/account-center/sections/ContentPrefsSection'),
      blocked:       () => import('@/components/account-center/sections/BlockedAccountsSection'),
      connected:     () => import('@/components/account-center/sections/ConnectedAccountsSection'),
      devices:       () => import('@/components/account-center/sections/DevicesSessionsSection'),
      data:          () => import('@/components/account-center/sections/DataPrivacySection'),
      support:       () => import('@/components/account-center/sections/SupportSection'),
      legal:         () => import('@/components/account-center/sections/LegalSection'),
      about:         () => import('@/components/account-center/sections/AboutSection'),
      danger:        () => import('@/components/account-center/sections/DangerSection'),
    };

    const EXPORT_NAMES: Record<SectionId, string> = {
      profile: 'AccountProfileSection', security: 'SecuritySection', privacy: 'PrivacySection',
      safety: 'SafetySection', payments: 'PaymentsSection', payouts: 'PayoutsSection',
      notifications: 'NotificationsSection', location: 'LocationSection', appearance: 'AppearanceSection',
      accessibility: 'AccessibilitySection', language: 'LanguageRegionSection', content: 'ContentPrefsSection',
      blocked: 'BlockedAccountsSection', connected: 'ConnectedAccountsSection', devices: 'DevicesSessionsSection',
      data: 'DataPrivacySection', support: 'SupportSection', legal: 'LegalSection',
      about: 'AboutSection', danger: 'DangerSection',
    };

    SECTION_MAP[id]()
      .then(mod => {
        const exportName = EXPORT_NAMES[id];
        setComponent(() => mod[exportName] as React.ComponentType);
      })
      .catch(() => setComponent(null));
  }, [id]);

  if (!Component) return <SectionPlaceholder id={id} />;
  return <Component />;
}

const SECTION_DESCRIPTIONS: Record<SectionId, { title: string; subtitle: string; category: string }> = {
  profile: { title: 'Account & Profile', subtitle: 'Manage your verified persona identity, legal details, and public links', category: 'Account & Identity' },
  security: { title: 'Security & Sign-In', subtitle: 'Password credentials, active devices, and two-factor protections', category: 'Account & Identity' },
  danger: { title: 'Deactivate / Delete', subtitle: 'Temporary account deactivation and irreversible data erasure', category: 'Account & Identity' },
  privacy: { title: 'Privacy & Radar Beacon', subtitle: 'GPS precision controls, anonymous tipping, and discovery radar', category: 'Privacy & Safety' },
  safety: { title: 'Safety & Direct Messages', subtitle: 'Messaging permissions, stage chat word filter, and performer wellbeing', category: 'Privacy & Safety' },
  blocked: { title: 'Blocked Accounts', subtitle: 'Manage profiles restricted from viewing your bio or tipping your stages', category: 'Privacy & Safety' },
  payments: { title: 'Payments & Wallet', subtitle: 'Stored tipping balance, default currency, and 1-tap quick presets', category: 'Financials & Monetization' },
  payouts: { title: 'Payouts & Banking', subtitle: 'Stripe Connect direct deposit routing for verified creators and venues', category: 'Financials & Monetization' },
  notifications: { title: 'Notifications', subtitle: 'Live stage callouts, tip receipt delivery, and digest schedules', category: 'Preferences' },
  location: { title: 'Location & Radar', subtitle: 'Background stage proximity detection and privacy radius', category: 'Preferences' },
  appearance: { title: 'Appearance & Themes', subtitle: 'Customize visual theme and interface preview tokens', category: 'Preferences' },
  accessibility: { title: 'Accessibility', subtitle: 'Reduce motion, high-contrast modes, and screen reader announcements', category: 'Preferences' },
  language: { title: 'Language & Region', subtitle: 'Timezone localization, date formatting, and regional currencies', category: 'Preferences' },
  content: { title: 'Content Preferences', subtitle: 'Favorite music genres, maturity filters, and track auto-play', category: 'Preferences' },
  connected: { title: 'Connected Accounts', subtitle: 'Spotify music integration, Apple Music, and OAuth sign-in', category: 'Connected Ecosystem' },
  devices: { title: 'Devices & Sessions', subtitle: 'Active browser sessions and remote device revocation', category: 'Connected Ecosystem' },
  data: { title: 'Data & Privacy (GDPR)', subtitle: 'Self-service data export, ledger retention, and tax records', category: 'Connected Ecosystem' },
  support: { title: 'Support & Concierge', subtitle: 'Knowledge base, stage emergency help, and community guidelines', category: 'Support & Legal' },
  legal: { title: 'Legal & Compliance', subtitle: 'Terms of Service, Privacy Policy, Cookie Policy, and DMCA notices', category: 'Support & Legal' },
  about: { title: 'About Crowdbeats', subtitle: 'Software architecture, platform build, and open source licenses', category: 'Support & Legal' },
};

function AccountCenterInner() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SectionId>('profile');
  const [mobileShowContent, setMobileShowContent] = useState(false);

  useEffect(() => {
    const section = searchParams.get('section') as SectionId | null;
    const validIds = new Set<SectionId>([
      'profile','security','privacy','safety','payments','payouts',
      'notifications','location','appearance','accessibility','language','content',
      'blocked','connected','devices','data','support','legal','about','danger',
    ]);
    if (section && validIds.has(section)) {
      setActiveSection(section);
      setMobileShowContent(true);
    }
  }, [searchParams]);

  const handleSelectSection = useCallback((section: SectionId) => {
    setActiveSection(section);
    setMobileShowContent(true);
    const url = new URL(window.location.href);
    url.searchParams.set('section', section);
    window.history.replaceState(null, '', url.toString());
  }, []);

  const handleBack = useCallback(() => {
    setMobileShowContent(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('section');
    window.history.replaceState(null, '', url.toString());
  }, []);

  const currentMeta = SECTION_DESCRIPTIONS[activeSection] || SECTION_DESCRIPTIONS.profile;

  return (
    <>
      <style>{`
        @keyframes cb-spin {
          to { transform: rotate(360deg); }
        }
        .cb-spin {
          animation: cb-spin 0.8s linear infinite;
        }

        .cb-account-shell {
          display: flex;
          min-height: 100vh;
          background-color: var(--cb-bg-app, #050507);
          color: var(--cb-text-primary, #FFFFFF);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
          position: relative;
        }

        /* Desktop Sidebar Navigation */
        .cb-account-nav-pane {
          width: 330px;
          flex-shrink: 0;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          background: #090A0E;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        /* Desktop Detail Panel */
        .cb-account-content-pane {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .cb-account-content-inner {
          width: 100%;
          max-width: 760px;
          padding: 40px 32px 80px;
        }

        /* Mobile Viewport Adaptations */
        @media (max-width: 839px) {
          .cb-account-shell { display: block; }
          .cb-account-nav-pane {
            width: 100%;
            height: auto;
            position: relative;
            border-right: none;
          }
          .cb-account-nav-pane.cb-mobile-hidden { display: none !important; }
          .cb-account-content-pane.cb-mobile-hidden { display: none !important; }
          .cb-account-content-inner { padding: 20px 16px 60px; }
        }

        @media (min-width: 840px) {
          .cb-mobile-header { display: none !important; }
          .cb-account-nav-pane,
          .cb-account-content-pane { display: flex !important; }
        }
      `}</style>

      <div className="cb-account-shell">
        {/* ── Left Sidebar Navigation ───────────────────────────────────────── */}
        <aside
          className={`cb-account-nav-pane ${mobileShowContent ? 'cb-mobile-hidden' : ''}`}
          aria-label="Account Settings Menu"
        >
          <AccountCenterHeader />
          <AccountCenterSearch onResultClick={handleSelectSection} />
          <AccountCenterNav
            activeSection={activeSection}
            onSelect={handleSelectSection}
            personaType={auth.personaType}
          />
        </aside>

        {/* ── Right Content Detail Pane ─────────────────────────────────────── */}
        <main
          className={`cb-account-content-pane ${!mobileShowContent ? 'cb-mobile-hidden' : ''}`}
          aria-label={`${currentMeta.title} Configuration`}
        >
          {/* Mobile Glass Header */}
          <div
            className="cb-mobile-header"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 40,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: 'rgba(9, 10, 14, 0.85)',
              backdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={handleBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                color: 'var(--cb-purple-light, #A855F7)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 0',
                minHeight: 44,
              }}
            >
              <ChevronLeftIcon size={18} />
              Settings
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
              {currentMeta.title}
            </span>
            <div style={{ width: 44 }} />
          </div>

          <div className="cb-account-content-inner">
            {/* Desktop Category Breadcrumb */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--cb-text-muted, #64748B)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              <span>Account Center</span>
              <span>/</span>
              <span style={{ color: 'var(--cb-purple-light, #A855F7)' }}>{currentMeta.category}</span>
            </div>

            {/* Section Header Title & Subtitle */}
            <div style={{ marginBottom: 28 }}>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  color: '#FFFFFF',
                  margin: '0 0 6px',
                }}
              >
                {currentMeta.title}
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--cb-text-secondary, #94A3B8)',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {currentMeta.subtitle}
              </p>
            </div>

            {/* Section Body */}
            <Suspense fallback={<SectionPlaceholder id={activeSection} />}>
              <LazySection id={activeSection} />
            </Suspense>
          </div>
        </main>
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050507', color: '#94A3B8', fontSize: 14 }}>
          Loading Crowdbeats Account Center…
        </div>
      }
    >
      <AccountCenterInner />
    </Suspense>
  );
}
