'use client';

import React from 'react';
import type { NavGroup, SectionId } from './types';
import {
  UserIcon,
  LockIcon,
  AlertTriangleIcon,
  ShieldIcon,
  UserXIcon,
  CreditCardIcon,
  BanknoteIcon,
  BellIcon,
  MapPinIcon,
  PaletteIcon,
  AccessibilityIcon,
  GlobeIcon,
  MusicIcon,
  LinkIcon,
  SmartphoneIcon,
  DatabaseIcon,
  HelpCircleIcon,
  FileTextIcon,
  InfoIcon,
  ChevronRightIcon,
} from './AccountCenterIcons';

interface NavItemConfig {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
  badgeBg: string;
  subtext?: string;
  warning?: boolean;
  payoutGated?: boolean;
}

interface NavGroupConfig {
  label: string;
  items: NavItemConfig[];
}

export const NAV_GROUPS_CONFIG: NavGroupConfig[] = [
  {
    label: 'Account & Identity',
    items: [
      { id: 'profile', label: 'Account & Profile', icon: UserIcon, color: '#38BDF8', badgeBg: 'rgba(56,189,248,0.12)', subtext: 'Personal info & roles' },
      { id: 'security', label: 'Security & Sign-In', icon: LockIcon, color: '#A855F7', badgeBg: 'rgba(168,85,247,0.12)', subtext: 'Password, 2FA, sessions' },
      { id: 'danger', label: 'Deactivate / Delete', icon: AlertTriangleIcon, color: '#EF4444', badgeBg: 'rgba(239,68,68,0.12)', subtext: 'Pause or erase account', warning: true },
    ],
  },
  {
    label: 'Privacy & Safety',
    items: [
      { id: 'privacy', label: 'Privacy & Beacon', icon: ShieldIcon, color: '#10B981', badgeBg: 'rgba(16,185,129,0.12)', subtext: 'GPS precision, anonymous tips' },
      { id: 'safety', label: 'Safety & Direct Messages', icon: ShieldIcon, color: '#F59E0B', badgeBg: 'rgba(245,158,11,0.12)', subtext: 'DMs, word filter, wellbeing' },
      { id: 'blocked', label: 'Blocked Accounts', icon: UserXIcon, color: '#EF4444', badgeBg: 'rgba(239,68,68,0.12)', subtext: 'Manage blocked profiles' },
    ],
  },
  {
    label: 'Financials & Monetization',
    items: [
      { id: 'payments', label: 'Payments & Wallet', icon: CreditCardIcon, color: '#10B981', badgeBg: 'rgba(16,185,129,0.12)', subtext: 'Stored wallet, 1-tap tipping' },
      { id: 'payouts', label: 'Payouts & Banking', icon: BanknoteIcon, color: '#06B6D4', badgeBg: 'rgba(6,182,212,0.12)', subtext: 'Stripe Connect express', payoutGated: true },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { id: 'notifications', label: 'Notifications', icon: BellIcon, color: '#EC4899', badgeBg: 'rgba(236,72,153,0.12)', subtext: 'Live alerts, tip chimes' },
      { id: 'location', label: 'Location & Radar', icon: MapPinIcon, color: '#38BDF8', badgeBg: 'rgba(56,189,248,0.12)', subtext: 'Background busker detection' },
      { id: 'appearance', label: 'Appearance & Themes', icon: PaletteIcon, color: '#A855F7', badgeBg: 'rgba(168,85,247,0.12)', subtext: 'Dark, Light, High Contrast' },
      { id: 'accessibility', label: 'Accessibility', icon: AccessibilityIcon, color: '#6366F1', badgeBg: 'rgba(99,102,241,0.12)', subtext: 'Reduce motion, font scale' },
      { id: 'language', label: 'Language & Region', icon: GlobeIcon, color: '#94A3B8', badgeBg: 'rgba(148,163,184,0.12)', subtext: 'Timezone, display currency' },
      { id: 'content', label: 'Content Preferences', icon: MusicIcon, color: '#14B8A6', badgeBg: 'rgba(20,184,166,0.12)', subtext: 'Favorite genres & maturity' },
    ],
  },
  {
    label: 'Connected Ecosystem',
    items: [
      { id: 'connected', label: 'Connected Accounts', icon: LinkIcon, color: '#F97316', badgeBg: 'rgba(249,115,22,0.12)', subtext: 'Spotify, Apple Music, Google' },
      { id: 'devices', label: 'Devices & Sessions', icon: SmartphoneIcon, color: '#8B5CF6', badgeBg: 'rgba(139,92,246,0.12)', subtext: 'Active logins & remote signout' },
      { id: 'data', label: 'Data & Privacy (GDPR)', icon: DatabaseIcon, color: '#3B82F6', badgeBg: 'rgba(59,130,246,0.12)', subtext: 'Self-service data archive' },
    ],
  },
  {
    label: 'Support & Legal',
    items: [
      { id: 'support', label: 'Support & Concierge', icon: HelpCircleIcon, color: '#38BDF8', badgeBg: 'rgba(56,189,248,0.12)', subtext: '24/7 help desk, bug reports' },
      { id: 'legal', label: 'Legal & Compliance', icon: FileTextIcon, color: '#94A3B8', badgeBg: 'rgba(148,163,184,0.12)', subtext: 'Terms, Privacy, DMCA' },
      { id: 'about', label: 'About Crowdbeats', icon: InfoIcon, color: '#A855F7', badgeBg: 'rgba(168,85,247,0.12)', subtext: 'v2.0.0-beta platform build' },
    ],
  },
];

const PAYOUT_PERSONAS = new Set(['artist', 'band_member', 'venue', 'venue_manager']);

interface AccountCenterNavProps {
  activeSection: SectionId;
  onSelect: (section: SectionId) => void;
  personaType: string | null;
  isMobileNavVisible?: boolean;
}

export function AccountCenterNav({
  activeSection,
  onSelect,
  personaType,
}: AccountCenterNavProps) {
  return (
    <nav
      aria-label="Account settings navigation"
      style={{
        overflowY: 'auto',
        flex: 1,
        padding: '12px 12px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {NAV_GROUPS_CONFIG.map((group) => {
        const visibleItems = group.items.filter(
          (item) => !item.payoutGated || (personaType && PAYOUT_PERSONAS.has(personaType))
        );
        if (visibleItems.length === 0) return null;

        return (
          <div key={group.label}>
            {/* Group Header */}
            <div
              style={{
                padding: '0 8px 6px',
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--cb-text-muted, #64748B)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {group.label}
            </div>

            {/* Inset Group Container */}
            <div
              style={{
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}
            >
              {visibleItems.map((item, idx) => {
                const isActive = activeSection === item.id;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '10px 12px',
                      minHeight: 52,
                      backgroundColor: isActive ? 'rgba(124,58,237,0.14)' : 'transparent',
                      border: 'none',
                      borderBottom: idx < visibleItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Active left indicator pill */}
                    {isActive && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 8,
                          bottom: 8,
                          width: 3,
                          borderRadius: '0 2px 2px 0',
                          backgroundColor: 'var(--cb-purple-light, #A855F7)',
                        }}
                      />
                    )}

                    {/* Icon Badge */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        backgroundColor: item.badgeBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: `1px solid ${item.color}30`,
                      }}
                    >
                      <IconComponent size={16} color={item.color} strokeWidth={2} />
                    </div>

                    {/* Label & Subtext */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? 700 : 600,
                          color: item.warning ? '#EF4444' : isActive ? '#FFFFFF' : 'var(--cb-text-primary, #F8FAFC)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.label}
                      </div>
                      {item.subtext && (
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--cb-text-muted, #64748B)',
                            marginTop: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.subtext}
                        </div>
                      )}
                    </div>

                    {/* Right Chevron */}
                    <div
                      style={{
                        color: isActive ? 'var(--cb-purple-light, #A855F7)' : 'rgba(255,255,255,0.2)',
                        transition: 'transform 0.15s ease',
                        flexShrink: 0,
                      }}
                    >
                      <ChevronRightIcon size={14} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
