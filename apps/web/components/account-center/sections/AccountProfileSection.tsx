'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { UserIcon, ShieldIcon, CheckIcon, ChevronRightIcon } from '../AccountCenterIcons';
import { ProfileSettingsManager } from '@/components/profile/ProfileSettingsManager';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  marginBottom: 20,
  overflow: 'hidden',
  backdropFilter: 'blur(16px)',
};

const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  minHeight: 56,
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  gap: 16,
};

const PERSONA_NAMES: Record<string, { title: string; route: string; color: string; desc: string }> = {
  fan: { title: 'VIP Fan & Live Music Supporter', route: '/fan/settings', color: '#06B6D4', desc: 'Active tipping wallet, GPS discovery radar, and favorite artist updates.' },
  artist: { title: 'Solo Musician (Artist)', route: '/creator/profile', color: '#A855F7', desc: 'Electronic Press Kit (EPK), instant tip jar, audio previews, and stage check-ins.' },
  band_member: { title: 'Band Member', route: '/band/profile', color: '#F59E0B', desc: 'Collaborative EPK, automatic payout splits, and gig schedule management.' },
  venue: { title: 'Venue Partner', route: '/venue/profile', color: '#10B981', desc: 'Multi-stage roster, 90-second dynamic QR check-ins, and staff delegation.' },
  venue_manager: { title: 'Venue Partner', route: '/venue/profile', color: '#10B981', desc: 'Multi-stage roster, 90-second dynamic QR check-ins, and staff delegation.' },
  sponsor: { title: 'Brand Sponsor', route: '/sponsor/settings', color: '#F97316', desc: 'Campaign tip-matching escrow pools, performer sponsorships, and ROI analytics.' },
  sponsor_rep: { title: 'Brand Sponsor', route: '/sponsor/settings', color: '#F97316', desc: 'Campaign tip-matching escrow pools, performer sponsorships, and ROI analytics.' },
  admin: { title: 'Platform Admin', route: '/account', color: '#EF4444', desc: 'Trust & safety moderation, platform telemetry, and compliance controls.' },
  staff: { title: 'Crowdbeats Staff', route: '/account', color: '#EF4444', desc: 'Live event verification, stage staff support, and platform concierge.' },
};

export function AccountProfileSection() {
  const auth = useAuth();
  const personaKey = auth.personaType || 'fan';
  const roleInfo = PERSONA_NAMES[personaKey] || PERSONA_NAMES.fan;

  return (
    <div>
      {/* Persona Role Showcase Banner */}
      <div
        style={{
          ...CARD,
          padding: 24,
          background: `linear-gradient(135deg, ${roleInfo.color}15 0%, rgba(18, 20, 28, 0.9) 100%)`,
          borderColor: `${roleInfo.color}35`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: roleInfo.color }}>
              Active Crowdbeats Persona
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 6px', letterSpacing: '-0.02em' }}>
              {roleInfo.title}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--cb-text-secondary, #94A3B8)', margin: 0, lineHeight: 1.5, maxWidth: 520 }}>
              {roleInfo.desc}
            </p>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
            }}
          >
            <CheckIcon size={12} strokeWidth={2.5} />
            Verified
          </span>
        </div>

        <div style={{ marginTop: 16 }}>
          <Link
            href={roleInfo.route}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: roleInfo.color,
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              minHeight: 44,
              boxShadow: `0 4px 16px -2px ${roleInfo.color}40`,
            }}
          >
            Manage Persona Studio →
          </Link>
        </div>
      </div>

      {/* Interactive Profile & Avatar Manager */}
      <ProfileSettingsManager />

      {/* Inset Group: Personal Credentials */}
      <div style={CARD}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: 12, fontWeight: 700, color: 'var(--cb-text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Personal Details
        </div>

        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>Display Name</div>
            <div style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)', marginTop: 2 }}>
              Visible on leaderboards, tip receipts, and stage check-ins
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cb-text-primary, #F8FAFC)' }}>
            {auth.displayName || 'Crowdbeats Member'}
          </span>
        </div>

        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>Email Address</div>
            <div style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)', marginTop: 2 }}>
              Used for account recovery and receipt confirmations
            </div>
          </div>
          <span style={{ fontSize: 13, color: 'var(--cb-text-secondary, #94A3B8)', fontFamily: 'monospace' }}>
            {auth.email || 'None'}
          </span>
        </div>

        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>Phone Verification</div>
            <div style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)', marginTop: 2 }}>
              High-value payout SMS authentication
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--cb-text-muted, #64748B)' }}>
            Not linked (Optional)
          </span>
        </div>

        <div style={{ ...ROW, borderBottom: 'none' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>Unique Account ID</div>
            <div style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)', marginTop: 2 }}>
              Cryptographic Firestore user reference
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--cb-text-muted, #64748B)', fontFamily: 'monospace' }}>
            {auth.uid ? `${auth.uid.slice(0, 12)}...` : 'usr_anon'}
          </span>
        </div>
      </div>
    </div>
  );
}
