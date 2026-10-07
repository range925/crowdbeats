'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { CheckIcon, SparklesIcon, MicIcon, BuildingIcon, MusicIcon, ShieldIcon, RadarIcon } from './AccountCenterIcons';

interface AccountCenterHeaderProps {
  onEditProfile?: () => void;
}

interface PersonaMeta {
  label: string;
  roleTitle: string;
  accent: string;
  badgeBg: string;
  glow: string;
  profileRoute: string;
  tagline: string;
  icon: React.ReactNode;
  highlights: { label: string; value: string }[];
}

const PERSONA_CONFIG: Record<string, PersonaMeta> = {
  fan: {
    label: 'VIP Fan',
    roleTitle: 'Music Supporter & Scout',
    accent: '#06B6D4',
    badgeBg: 'rgba(6,182,212,0.12)',
    glow: 'rgba(6,182,212,0.25)',
    profileRoute: '/fan/settings',
    tagline: 'Discovering live buskers & stage sets',
    icon: <MusicIcon size={14} color="#06B6D4" />,
    highlights: [
      { label: 'Live Radar', value: '5km Radius' },
      { label: 'Tipping', value: '1-Tap Active' },
    ],
  },
  artist: {
    label: 'Solo Musician',
    roleTitle: 'Verified Creator & Performer',
    accent: '#A855F7',
    badgeBg: 'rgba(168,85,247,0.12)',
    glow: 'rgba(168,85,247,0.25)',
    profileRoute: '/creator/profile',
    tagline: 'Live Stage EPK & Instant Tip Jar Active',
    icon: <MicIcon size={14} color="#A855F7" />,
    highlights: [
      { label: 'Stage EPK', value: 'Live' },
      { label: 'Direct Payouts', value: 'Stripe Linked' },
    ],
  },
  band_member: {
    label: 'Band Member',
    roleTitle: 'Group Ensemble Co-Creator',
    accent: '#F59E0B',
    badgeBg: 'rgba(245,158,11,0.12)',
    glow: 'rgba(245,158,11,0.25)',
    profileRoute: '/band/profile',
    tagline: 'Automated Split Ledger & Gig Manager',
    icon: <MusicIcon size={14} color="#F59E0B" />,
    highlights: [
      { label: 'Split Ledger', value: 'Active' },
      { label: 'Roster Sync', value: 'Auto' },
    ],
  },
  venue: {
    label: 'Venue Partner',
    roleTitle: 'Live Stage & Event Host',
    accent: '#10B981',
    badgeBg: 'rgba(168,85,247,0.12)',
    glow: 'rgba(16,185,129,0.25)',
    profileRoute: '/venue/profile',
    tagline: 'Active Live Stages & QR Terminals',
    icon: <BuildingIcon size={14} color="#10B981" />,
    highlights: [
      { label: 'Stage Check-In', value: '90s Auto' },
      { label: 'Staff Hub', value: 'Live' },
    ],
  },
  venue_manager: {
    label: 'Venue Partner',
    roleTitle: 'Live Stage & Event Host',
    accent: '#10B981',
    badgeBg: 'rgba(168,85,247,0.12)',
    glow: 'rgba(16,185,129,0.25)',
    profileRoute: '/venue/profile',
    tagline: 'Active Live Stages & QR Terminals',
    icon: <BuildingIcon size={14} color="#10B981" />,
    highlights: [
      { label: 'Stage Check-In', value: '90s Auto' },
      { label: 'Staff Hub', value: 'Live' },
    ],
  },
  sponsor: {
    label: 'Brand Sponsor',
    roleTitle: 'Campaign & Escrow Partner',
    accent: '#F97316',
    badgeBg: 'rgba(249,115,22,0.12)',
    glow: 'rgba(249,115,22,0.25)',
    profileRoute: '/sponsor/settings',
    tagline: 'Tip Matching & Live ROI Analytics',
    icon: <SparklesIcon size={14} color="#F97316" />,
    highlights: [
      { label: 'Tip Matching', value: 'Escrow Ready' },
      { label: 'Multi-Tenant', value: 'Protected' },
    ],
  },
  sponsor_rep: {
    label: 'Brand Sponsor',
    roleTitle: 'Campaign & Escrow Partner',
    accent: '#F97316',
    badgeBg: 'rgba(249,115,22,0.12)',
    glow: 'rgba(249,115,22,0.25)',
    profileRoute: '/sponsor/settings',
    tagline: 'Tip Matching & Live ROI Analytics',
    icon: <SparklesIcon size={14} color="#F97316" />,
    highlights: [
      { label: 'Tip Matching', value: 'Escrow Ready' },
      { label: 'Multi-Tenant', value: 'Protected' },
    ],
  },
  admin: {
    label: 'Platform Admin',
    roleTitle: 'Trust & Operations Overseer',
    accent: '#EF4444',
    badgeBg: 'rgba(239,68,68,0.12)',
    glow: 'rgba(239,68,68,0.25)',
    profileRoute: '/account',
    tagline: 'Global security & regulatory oversight',
    icon: <ShieldIcon size={14} color="#EF4444" />,
    highlights: [
      { label: 'Platform Scope', value: 'Global' },
      { label: 'Compliance', value: 'Strict' },
    ],
  },
  staff: {
    label: 'Crowdbeats Staff',
    roleTitle: 'Community & Event Lead',
    accent: '#EF4444',
    badgeBg: 'rgba(239,68,68,0.12)',
    glow: 'rgba(239,68,68,0.25)',
    profileRoute: '/account',
    tagline: 'Live event verification & concierge',
    icon: <ShieldIcon size={14} color="#EF4444" />,
    highlights: [
      { label: 'Staff Verification', value: 'Verified' },
      { label: 'Ops Access', value: 'Stage Ops' },
    ],
  },
};

function getInitials(name: string | null): string {
  if (!name) return 'CB';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function computeCompleteness(displayName: string | null, email: string | null, personaType: string | null): number {
  let score = 25;
  if (displayName) score += 30;
  if (email) score += 25;
  if (personaType) score += 20;
  return Math.min(score, 100);
}

export function AccountCenterHeader({ onEditProfile }: AccountCenterHeaderProps) {
  const auth = useAuth();
  const personaKey = auth.personaType || 'fan';
  const config = PERSONA_CONFIG[personaKey] || PERSONA_CONFIG.fan;
  const completeness = useMemo(
    () => computeCompleteness(auth.displayName, auth.email, auth.personaType),
    [auth.displayName, auth.email, auth.personaType]
  );
  const initials = getInitials(auth.displayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(auth.photoUrl || null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (auth.photoUrl) {
      setAvatarUrl(auth.photoUrl);
      setImgError(false);
    }
    const handler = (e: any) => {
      if (e.detail?.photoUrl !== undefined) {
        setAvatarUrl(e.detail.photoUrl || null);
        setImgError(false);
      }
    };
    window.addEventListener('cb_profile_updated', handler);
    return () => window.removeEventListener('cb_profile_updated', handler);
  }, [auth.photoUrl]);

  return (
    <div
      style={{
        padding: '20px 18px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)',
      }}
    >
      {/* Ambient background glow tailored to persona */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          left: -20,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: config.accent,
          opacity: 0.12,
          filter: 'blur(36px)',
          pointerEvents: 'none',
        }}
      />

      {/* Profile Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, position: 'relative' }}>
        {/* Layered Avatar with Persona Ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${config.accent} 0%, #12141C 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800,
              color: '#FFFFFF',
              border: `2px solid ${config.accent}`,
              boxShadow: `0 4px 16px -2px ${config.glow}`,
              letterSpacing: '-0.02em',
              overflow: 'hidden',
            }}
          >
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={auth.displayName || 'Avatar'}
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
          </div>

          {/* Verified Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 18,
              height: 18,
              borderRadius: '50%',
              backgroundColor: '#10B981',
              border: '2px solid #0B0C10',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
            title="Verified Account"
          >
            <CheckIcon size={11} color="#FFFFFF" strokeWidth={2.5} />
          </div>
        </div>

        {/* Identity & Persona Pill */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {auth.displayName || 'Crowdbeats Member'}
            </span>
          </div>

          <div
            style={{
              fontSize: 12,
              color: 'var(--cb-text-secondary, #94A3B8)',
              marginTop: 1,
              marginBottom: 5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {auth.email || 'account@crowdbeats.com'}
          </div>

          {/* Persona Capsule */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '2px 8px',
              borderRadius: 20,
              backgroundColor: config.badgeBg,
              border: `1px solid ${config.accent}40`,
            }}
          >
            {config.icon}
            <span style={{ fontSize: 11, fontWeight: 700, color: config.accent, letterSpacing: '0.02em' }}>
              {config.label}
            </span>
          </div>
        </div>
      </div>

      {/* Persona Live Status Snapshot Card */}
      <div
        style={{
          borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '8px 12px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {config.highlights.map((h, i) => (
          <div key={h.label} style={{ flex: 1, textAlign: i === 0 ? 'left' : 'right' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cb-text-muted, #64748B)', fontWeight: 700 }}>
              {h.label}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', marginTop: 1 }}>
              {h.value}
            </div>
          </div>
        ))}
      </div>

      {/* Account Completeness Progress */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
          <span style={{ color: 'var(--cb-text-secondary, #94A3B8)' }}>Profile Completeness</span>
          <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{completeness}%</span>
        </div>
        <div
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${completeness}%`,
              background: `linear-gradient(90deg, ${config.accent} 0%, #7C3AED 100%)`,
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Edit Profile & Role Hub Link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          href={config.profileRoute}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: config.accent,
            textDecoration: 'none',
            padding: '4px 0',
            transition: 'opacity 0.15s ease',
          }}
        >
          Edit Studio EPK →
        </Link>
        <span style={{ fontSize: 11, color: 'var(--cb-text-muted, #64748B)' }}>
          ID: {auth.uid ? `${auth.uid.slice(0, 6)}...` : 'demo'}
        </span>
      </div>
    </div>
  );
}
