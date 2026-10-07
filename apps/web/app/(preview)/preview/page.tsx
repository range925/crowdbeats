'use client';

/**
 * Crowdbeats V2 — Multi-Persona Interactive Preview Studio
 * Route: /preview
 *
 * Provides a real-time, side-by-side and responsive device preview environment on localhost for:
 *   1. Guest (Public discovery, live map, venue & artist profiles, tipping modal)
 *   2. Fan (Fan dashboard, live nearby feed, following list, tipping ledger, QR scanner)
 *   3. Solo Musician (Creator studio, live sets & radar, campaigns, tipping analytics, Stripe payouts)
 *   4. Band (Band command center, member roster, real-time revenue splits, gig tracker)
 *   5. Sponsor (Sponsor workspace, talent discovery, multiplier match pools, Campaign Budget & ROI)
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export type PersonaKey = 'guest' | 'fan' | 'musician' | 'band' | 'sponsor';
export type ViewportMode = 'desktop' | 'iphone' | 'pixel' | 'both_mobile';

interface PersonaRouteOption {
  label: string;
  path: string;
  description: string;
  tag?: string;
}

interface PersonaConfig {
  key: PersonaKey;
  name: string;
  roleTitle: string;
  icon: string;
  accentColor: string;
  gradient: string;
  defaultPath: string;
  summary: string;
  capabilities: string[];
  routes: PersonaRouteOption[];
  badgeText: string;
}

const PERSONAS: Record<PersonaKey, PersonaConfig> = {
  guest: {
    key: 'guest',
    name: 'Guest / Listener',
    roleTitle: 'Unauthenticated Public Visitor',
    icon: '🌐',
    accentColor: '#A855F7',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
    defaultPath: '/',
    badgeText: 'Location-First',
    summary:
      'Unauthenticated live music discovery. Fans and passersby browse nearby buskers and stages via geolocation, explore curated popular artists, inspect EPKs, and trigger fast tips with zero mandatory sign-up barriers.',
    capabilities: [
      '📍 Location-first search (city, neighborhood, GPS autocomplete)',
      '🗺️ Interactive 220px compact map preview with live performer pins',
      '🔥 Top 5 Nearby & Top 3 Popular performer discovery cards',
      '💸 Instant tipping modal with Apple Pay / Google Pay / Card gate',
      '🎤 Public Artist EPK & Band profiles with upcoming dates & media',
    ],
    routes: [
      { label: 'Discovery Home', path: '/', description: 'Public location-first discovery page' },
      { label: 'Artist EPK Profile', path: '/artist/the-velvet-echoes', description: 'Solo artist public profile with live tip jar', tag: 'Live EPK' },
      { label: 'Band Public Profile', path: '/band/midnight-pulse', description: 'Collaborative band profile with split transparency' },
      { label: 'Venue Stage Profile', path: '/venue/the-copper-room', description: 'Live music venue with stage schedule' },
      { label: 'Fan Moments Gallery', path: '/gallery', description: 'Media feed of authentic live show moments' },
      { label: 'Auth & Onboarding', path: '/auth', description: 'Sign-in & registration portal' },
    ],
  },
  fan: {
    key: 'fan',
    name: 'Fan / Supporter',
    roleTitle: 'Authenticated Fan Dashboard',
    icon: '🎧',
    accentColor: '#3B82F6',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
    defaultPath: '/fan',
    badgeText: 'Supporter Hub',
    summary:
      'Authenticated supporter hub. Fans manage followed artists and local stages, track ledger-verified tip receipts, scan performer QR codes live on-stage, and discover nearby gigs tailored to their taste.',
    capabilities: [
      '⚡ Live near you carousel with real-time stage proximity badges',
      '🧾 Immutable tip ledger activity & downloadable tax receipts',
      '⭐ Following feed with upcoming show alerts & notifications',
      '📷 Instant camera QR scanner for live performer tipping',
      '💳 Saved payment methods & 1-click repeat tipping',
    ],
    routes: [
      { label: 'Fan Home Dashboard', path: '/fan', description: 'Overview of live nearby performers and quick actions', tag: 'Primary' },
      { label: 'Following Feed', path: '/fan/following', description: 'Roster of followed artists & upcoming shows' },
      { label: 'Tip Activity & Ledger', path: '/fan/activity', description: 'History of all verified tips and transactions' },
      { label: 'Nearby Live Radar', path: '/fan/nearby', description: 'Location radar of active live stages' },
      { label: 'QR Tip Scanner', path: '/fan/scan', description: 'Camera scanner for on-stage performer QR codes' },
      { label: 'Saved Payment Methods', path: '/fan/payment-methods', description: 'Stripe customer payment tokens' },
    ],
  },
  musician: {
    key: 'musician',
    name: 'Solo Musician',
    roleTitle: 'Creator Studio & Live Station',
    icon: '🎸',
    accentColor: '#EC4899',
    gradient: 'linear-gradient(135deg, #DB2777 0%, #F472B6 100%)',
    defaultPath: '/creator/dashboard',
    badgeText: 'Creator Studio',
    summary:
      'Solo performer studio. Musicians start live performance sessions, generate expiring stage QR codes, launch crowdfunding campaigns for albums or gear, cultivate top tippers, and receive instant Stripe Connect payouts.',
    capabilities: [
      '📊 Live earnings dashboard with available balance & tipping stats',
      '📡 Live performance station with stage check-in & companion link',
      '🚀 Crowdfunding campaign builder with customizable reward tiers',
      '👥 Supporter CRM with top tippers & verified fan directory',
      '💳 Stripe Express Connect payout account management & balance transfers',
      '📣 Shareable tip jar links, printable QR codes & EPK embeds',
    ],
    routes: [
      { label: 'Creator Studio Dashboard', path: '/creator/dashboard', description: 'Main metrics, balance, campaigns & quick actions', tag: 'Primary' },
      { label: 'Live Performance Hub', path: '/creator/performances', description: 'Manage active stage sessions and setlists' },
      { label: 'Crowdfunding Campaigns', path: '/creator/campaigns', description: 'Manage album, tour & gear campaigns' },
      { label: 'Launch New Campaign', path: '/creator/campaigns/new', description: 'Interactive multi-step campaign builder' },
      { label: 'Fan & Backer Roster', path: '/creator/fans', description: 'Directory of top supporters and tipper CRM' },
      { label: 'Stripe Payouts & Balance', path: '/creator/payouts', description: 'Express Connect balance and payout schedules' },
      { label: 'Sponsorship Inquiries', path: '/creator/sponsorships', description: 'Brand deal negotiations and match pools' },
      { label: 'QR Marketing & Links', path: '/creator/marketing', description: 'Printable stage QR codes and tip links' },
    ],
  },
  band: {
    key: 'band',
    name: 'Band / Collective',
    roleTitle: 'Band Command Center & Smart Splits',
    icon: '🥁',
    accentColor: '#10B981',
    gradient: 'linear-gradient(135deg, #059669 0%, #34D399 100%)',
    defaultPath: '/band/dashboard',
    badgeText: 'Collaborative Governance',
    summary:
      'Multi-member collaborative studio. Bands manage member rosters, configure mathematical revenue splits (Largest Remainder Method OD-09), monitor collective tips, coordinate gig bookings, and unlock shared brand sponsorships.',
    capabilities: [
      '⚖️ Automated Smart Split configuration with exact remainder rounding',
      '🤝 Collaborative band roster management with granular role governance',
      '💰 Collective revenue ledger with per-member payout breakdowns',
      '🎪 Stage performance management & venue co-billing',
      '🤝 Brand partnership hub for collective stage sponsorship deals',
      '📣 Shared band QR codes with real-time multi-member split attribution',
    ],
    routes: [
      { label: 'Band Dashboard', path: '/band/dashboard', description: 'Collective gross tips, active split formula & live status', tag: 'Primary' },
      { label: 'Member Roster & Roles', path: '/band/members', description: 'Invite and manage band musicians and managers' },
      { label: 'Smart Revenue Splits', path: '/band/splits', description: 'Configure % splits with Largest Remainder Method' },
      { label: 'Revenue & Payout Ledger', path: '/band/revenue', description: 'Financial ledger of distributed tips per member' },
      { label: 'Performances & Gigs', path: '/band/performances', description: 'Band tour dates and live stage schedule' },
      { label: 'Sponsor Partnerships', path: '/band/sponsors', description: 'Brand sponsorship deals & match pool campaigns' },
      { label: 'Band Campaigns', path: '/band/campaigns', description: 'Band album & tour crowdfunding campaigns' },
      { label: 'Band QR & Marketing', path: '/band/marketing', description: 'Shared band tip jar links and stage QR assets' },
    ],
  },
  sponsor: {
    key: 'sponsor',
    name: 'Brand Sponsor',
    roleTitle: 'Sponsor Workspace & Match Pools',
    icon: '🤝',
    accentColor: '#F59E0B',
    gradient: 'linear-gradient(135deg, #D97706 0%, #FBBF24 100%)',
    defaultPath: '/sponsor/dashboard',
    badgeText: 'Multiplier Match Campaign Budget',
    summary:
      'Brand & corporate sponsorship command center. Sponsors discover verified musical talent, fund secure Campaign Budget pools to match live tips (2x / 3x multiplier matching), review inbound artist applications, and track brand impression ROI.',
    capabilities: [
      '🎯 2x / 3x Tip Multiplier Match Pool creation for live stages & festivals',
      '🔍 Talent discovery radar filtering by genre, location & engagement',
      '📥 Inbound performer application review & contract negotiation',
      '💳 Secure Stripe Campaign Budget funding & automatic disbursement rules',
      '📈 Real-time impression analytics, crowd engagement metrics & brand ROI',
      '🏷️ Custom brand badge placement across live performer tip animations',
    ],
    routes: [
      { label: 'Sponsor Dashboard', path: '/sponsor/dashboard', description: 'Campaign balance, active match pools, matched tips & ROI', tag: 'Primary' },
      { label: 'Talent Discovery Radar', path: '/sponsor/discovery', description: 'Filter & discover verified musicians and bands' },
      { label: 'Tip Multiplier Opportunities', path: '/sponsor/opportunities', description: 'Launch 1:1 or 2x tip match pools for live shows' },
      { label: 'Artist Applications', path: '/sponsor/applications', description: 'Review and approve musician sponsorship proposals' },
      { label: 'Active Sponsorships', path: '/sponsor/sponsorships', description: 'Manage ongoing brand deals and commitments' },
      { label: 'Campaign Budget Funding & Billing', path: '/sponsor/payments', description: 'Deposit funds into brand matching Campaign Budget' },
      { label: 'Audience Reach & ROI', path: '/sponsor/analytics', description: 'Performance analytics and impression statistics' },
      { label: 'Brand Organization Profile', path: '/sponsor/organization', description: 'Brand assets, logos & verification badges' },
    ],
  },
};

export default function MultiPersonaPreviewStudio() {
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey>('guest');
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [iframeKey, setIframeKey] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('persona') as PersonaKey | null;
      if (p && PERSONAS[p]) {
        setSelectedPersona(p);
        setCurrentPath(params.get('path') || PERSONAS[p].defaultPath);
      }
      const v = params.get('viewport') as ViewportMode | null;
      if (v) setViewportMode(v);
    }
  }, []);

  const activePersona = PERSONAS[selectedPersona];

  const handleSelectPersona = (key: PersonaKey) => {
    setSelectedPersona(key);
    const newPath = PERSONAS[key].defaultPath;
    setCurrentPath(newPath);
  };

  const handleSelectRoute = (path: string) => {
    setCurrentPath(path);
  };

  const handleReloadIframe = () => {
    setIframeKey(k => k + 1);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#07080B',
        color: '#F4F4F6',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── TOP CONTROL BAR ────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: '#0F1017',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          padding: '12px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1600,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {/* Logo & Hub Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                  fontSize: 20,
                }}
              >
                🎶
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                    Crowdbeats
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 6,
                      backgroundColor: 'rgba(124, 58, 237, 0.25)',
                      color: '#C084FC',
                      border: '1px solid rgba(124, 58, 237, 0.4)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Preview Studio
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>
                  Localhost Multi-Persona Station • 5 Roles
                </div>
              </div>
            </Link>
          </div>

          {/* Viewport Mode Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: '#171822',
              padding: 4,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {([
              { id: 'desktop', label: '💻 Desktop', icon: '💻' },
              { id: 'iphone', label: '🍎 iPhone 15 Pro', icon: '🍎' },
              { id: 'pixel', label: '🤖 Pixel 7', icon: '🤖' },
              { id: 'both_mobile', label: '⊞ Side-by-Side Mobile', icon: '⊞' },
            ] as { id: ViewportMode; label: string; icon: string }[]).map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => setViewportMode(v.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: viewportMode === v.id ? '#7C3AED' : 'transparent',
                  color: viewportMode === v.id ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{v.label}</span>
              </button>
            ))}
          </div>

          {/* Direct External Link & Reload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleReloadIframe}
              title="Reload Preview Frame"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 8,
                backgroundColor: '#1E202C',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#E2E8F0',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 Refresh
            </button>
            <a
              href={currentPath}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 10px rgba(37,99,235,0.3)',
              }}
            >
              <span>↗️ Open Tab</span>
            </a>
          </div>
        </div>

        {/* ── PERSONA TAB SELECTOR ──────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 1600,
            margin: '12px auto 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
            gap: 10,
          }}
        >
          {(Object.keys(PERSONAS) as PersonaKey[]).map(key => {
            const persona = PERSONAS[key];
            const isSelected = selectedPersona === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectPersona(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: isSelected
                    ? `2px solid ${persona.accentColor}`
                    : '1px solid rgba(255,255,255,0.06)',
                  backgroundColor: isSelected ? '#1B1C28' : '#12131C',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isSelected ? `0 4px 20px ${persona.accentColor}26` : 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: isSelected ? `${persona.accentColor}25` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isSelected ? persona.accentColor : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {persona.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: isSelected ? '#FFFFFF' : '#CBD5E1',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {persona.name}
                    </div>
                    {isSelected && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: persona.accentColor,
                          boxShadow: `0 0 8px ${persona.accentColor}`,
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: isSelected ? persona.accentColor : '#64748B',
                      fontWeight: 600,
                    }}
                  >
                    {persona.badgeText}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── MAIN CONTENT AREA: SIDEBAR + LIVE VIEWPORT ─────────────────── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] flex-1 max-w-[1800px] w-full mx-auto p-4 sm:p-6 gap-6"
      >
        {/* ── LEFT SIDEBAR: PERSONA INFO & ROUTE DRILL-DOWNS ───────────── */}
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Persona Card */}
          <div
            style={{
              backgroundColor: '#12131D',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: activePersona.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  boxShadow: `0 4px 16px ${activePersona.accentColor}40`,
                }}
              >
                {activePersona.icon}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                  {activePersona.name}
                </div>
                <div style={{ fontSize: 12, color: activePersona.accentColor, fontWeight: 600 }}>
                  {activePersona.roleTitle}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5, margin: '0 0 16px' }}>
              {activePersona.summary}
            </p>

            <div style={{ fontSize: 11, fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Core Capabilities
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activePersona.capabilities.map((cap, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: 12,
                    color: '#CBD5E1',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                    lineHeight: 1.4,
                  }}
                >
                  <span style={{ color: activePersona.accentColor }}>•</span>
                  <span>{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-Route Navigator */}
          <div
            style={{
              backgroundColor: '#12131D',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>
                Preview Screen Navigator
              </div>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                {activePersona.routes.length} Screens
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activePersona.routes.map(r => {
                const isCurrent = currentPath === r.path;
                return (
                  <button
                    key={r.path}
                    type="button"
                    onClick={() => handleSelectRoute(r.path)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: isCurrent
                        ? `1.5px solid ${activePersona.accentColor}`
                        : '1px solid rgba(255,255,255,0.05)',
                      backgroundColor: isCurrent ? 'rgba(255,255,255,0.06)' : '#181924',
                      color: isCurrent ? '#FFFFFF' : '#CBD5E1',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 600 }}>
                        {r.label}
                      </span>
                      {r.tag && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 4,
                            backgroundColor: `${activePersona.accentColor}25`,
                            color: activePersona.accentColor,
                            border: `1px solid ${activePersona.accentColor}50`,
                          }}
                        >
                          {r.tag}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      <code style={{ color: isCurrent ? activePersona.accentColor : '#94A3B8' }}>
                        {r.path}
                      </code>{' '}
                      • {r.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Deep Link Box */}
          <div
            style={{
              backgroundColor: '#12131D',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: 16,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 8 }}>
              Active Route URL on Localhost:
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#0A0A0F',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span style={{ fontSize: 13, color: '#38BDF8', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                http://localhost:3000{currentPath}
              </span>
              <a
                href={currentPath}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#A855F7',
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: 'none',
                  flexShrink: 0,
                }}
              >
                Open ↗
              </a>
            </div>
          </div>
        </aside>

        {/* ── RIGHT VIEWPORT: LIVE EMBEDDED PREVIEW ────────────────────── */}
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: 800,
          }}
        >
          {/* ── DESKTOP VIEWPORT ───────────────────────────────────────── */}
          {viewportMode === 'desktop' && (
            <div
              style={{
                width: '100%',
                maxWidth: 1240,
                backgroundColor: '#12131E',
                borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Browser Window Header */}
              <div
                style={{
                  backgroundColor: '#1A1B28',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span style={{ fontSize: 12, color: '#94A3B8', marginLeft: 8, fontWeight: 600 }}>
                    Crowdbeats V2 • {activePersona.name} View
                  </span>
                </div>

                {/* URL Bar */}
                <div
                  style={{
                    backgroundColor: '#0E0F17',
                    padding: '4px 16px',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#94A3B8',
                    border: '1px solid rgba(255,255,255,0.06)',
                    width: '50%',
                    maxWidth: 450,
                    textAlign: 'center',
                    fontWeight: 500,
                  }}
                >
                  <span style={{ color: '#10B981', fontWeight: 700 }}>🔒 localhost:3000</span>
                  <span style={{ color: '#F1F5F9' }}>{currentPath}</span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleReloadIframe}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    🔄
                  </button>
                </div>
              </div>

              {/* Iframe Frame */}
              <div style={{ width: '100%', height: 860, backgroundColor: '#0B0C10', position: 'relative' }}>
                <iframe
                  key={iframeKey}
                  src={currentPath}
                  title={`${activePersona.name} Desktop Preview`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* ── IPHONE 15 PRO VIEWPORT ─────────────────────────────────── */}
          {viewportMode === 'iphone' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>
                🍎 Apple iPhone 15 Pro • 393 × 852 Viewport
              </div>
              <div
                style={{
                  position: 'relative',
                  width: 390,
                  borderRadius: 54,
                  backgroundColor: '#2c2c2e',
                  padding: '16px 10px 10px',
                  boxShadow: [
                    '0 0 0 1.5px #3a3a3c',
                    '0 0 0 3.5px #1c1c1e',
                    '0 30px 70px rgba(0,0,0,0.8)',
                    'inset 0 0 0 1px rgba(255,255,255,0.06)',
                  ].join(', '),
                  background: 'linear-gradient(160deg, #3a3a3c 0%, #2c2c2e 40%, #1c1c1e 100%)',
                }}
              >
                {/* Dynamic Island */}
                <div
                  style={{
                    width: '100%',
                    height: 32,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 120,
                      height: 30,
                      backgroundColor: '#000',
                      borderRadius: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#1a1a1e' }} />
                    <div style={{ width: 24, height: 6, borderRadius: 4, backgroundColor: '#111' }} />
                  </div>
                </div>

                {/* Screen frame */}
                <div
                  style={{
                    width: '100%',
                    height: 740,
                    borderRadius: 40,
                    overflow: 'hidden',
                    backgroundColor: '#0B0C10',
                  }}
                >
                  <iframe
                    key={iframeKey}
                    src={currentPath}
                    title="iPhone Preview"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>

                {/* iOS Indicator */}
                <div style={{ height: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 6 }}>
                  <div style={{ width: 134, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                </div>
              </div>
            </div>
          )}

          {/* ── GOOGLE PIXEL 7 VIEWPORT ────────────────────────────────── */}
          {viewportMode === 'pixel' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>
                🤖 Google Pixel 7 • Android 14 • 412 × 892 Viewport
              </div>
              <div
                style={{
                  position: 'relative',
                  width: 390,
                  borderRadius: 44,
                  backgroundColor: '#1a1a1a',
                  padding: '14px 10px',
                  boxShadow: [
                    '0 0 0 1.5px #2a2a2a',
                    '0 0 0 3px #0e0e0e',
                    '0 30px 70px rgba(0,0,0,0.8)',
                    'inset 0 0 0 1px rgba(255,255,255,0.04)',
                  ].join(', '),
                }}
              >
                {/* Punch hole */}
                <div
                  style={{
                    width: '100%',
                    height: 26,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#0a0a0a', border: '2px solid #2a2a2a' }} />
                </div>

                {/* Screen frame */}
                <div
                  style={{
                    width: '100%',
                    height: 740,
                    borderRadius: 10,
                    overflow: 'hidden',
                    backgroundColor: '#0B0C10',
                  }}
                >
                  <iframe
                    key={iframeKey}
                    src={currentPath}
                    title="Pixel Preview"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>

                {/* Android pill */}
                <div style={{ height: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
                  <div style={{ width: 134, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' }} />
                </div>
              </div>
            </div>
          )}

          {/* ── SIDE-BY-SIDE MOBILE COMPARISON ─────────────────────────── */}
          {viewportMode === 'both_mobile' && (
            <div
              style={{
                display: 'flex',
                gap: 36,
                alignItems: 'flex-start',
                justifyContent: 'center',
                flexWrap: 'wrap',
                width: '100%',
              }}
            >
              {/* iPhone Frame */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>🍎 iPhone 15 Pro</div>
                <div
                  style={{
                    position: 'relative',
                    width: 360,
                    borderRadius: 50,
                    backgroundColor: '#2c2c2e',
                    padding: '14px 8px 8px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                    background: 'linear-gradient(160deg, #3a3a3c 0%, #2c2c2e 40%, #1c1c1e 100%)',
                  }}
                >
                  <div style={{ width: '100%', height: 28, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ width: 100, height: 26, backgroundColor: '#000', borderRadius: 16 }} />
                  </div>
                  <div style={{ width: '100%', height: 680, borderRadius: 36, overflow: 'hidden', backgroundColor: '#0B0C10' }}>
                    <iframe key={`ios-${iframeKey}`} src={currentPath} title="iOS Frame" style={{ width: '100%', height: '100%', border: 'none' }} />
                  </div>
                  <div style={{ height: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ width: 120, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                  </div>
                </div>
              </div>

              {/* Pixel Frame */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>🤖 Google Pixel 7</div>
                <div
                  style={{
                    position: 'relative',
                    width: 360,
                    borderRadius: 40,
                    backgroundColor: '#1a1a1a',
                    padding: '12px 8px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                  }}
                >
                  <div style={{ width: '100%', height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0a0a0a' }} />
                  </div>
                  <div style={{ width: '100%', height: 680, borderRadius: 8, overflow: 'hidden', backgroundColor: '#0B0C10' }}>
                    <iframe key={`pixel-${iframeKey}`} src={currentPath} title="Pixel Frame" style={{ width: '100%', height: '100%', border: 'none' }} />
                  </div>
                  <div style={{ height: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ width: 120, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
