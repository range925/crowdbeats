/**
 * Crowdbeats V2 -- Creator Privacy & Data Control
 * Route: /creator/privacy
 *
 * Real privacy preferences (via useUserSettings), data export, and account deletion info.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { DataExportCard } from '@/components/settings/DataExportCard';

const card: React.CSSProperties = {
  background: 'var(--surface-card, #151722)',
  padding: 20,
  borderRadius: 12,
  border: '1px solid var(--border-subtle, #2B2D44)',
  marginBottom: 16,
};

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 0',
  borderBottom: '1px solid rgba(43,45,68,0.5)',
};

export default function CreatorPrivacyPage() {
  const auth = useAuth();
  const { privacy, updatePrivacy } = useUserSettings();

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer',
        background: checked ? '#7C3AED' : 'rgba(255,255,255,0.12)',
        border: 'none',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', backgroundColor: '#FFFFFF',
        position: 'absolute', top: 3,
        left: checked ? 23 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );

  return (
    <div style={{ padding: '24px 32px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary, #FFFFFF)' }}>
        Privacy & Data Control
      </h1>
      <p style={{ color: 'var(--text-secondary, #94A3B8)', fontSize: 14, marginBottom: 28 }}>
        Manage how your creator profile is discovered, shared, and used across Crowdbeats.
      </p>

      {/* Discovery Preferences */}
      <div style={card}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', margin: '0 0 4px' }}>
          Discovery & Radar
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)', marginBottom: 12 }}>
          Control how fans discover your artist profile on the Crowdbeats discovery map and radar.
        </p>

        <div style={row}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary, #FFFFFF)' }}>
              Visible on Live Radar
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>
              Allow fans to discover you on the live performer radar and map
            </div>
          </div>
          <Toggle
            checked={privacy.profileDiscoverableInRadar}
            onChange={() => updatePrivacy({ profileDiscoverableInRadar: !privacy.profileDiscoverableInRadar })}
          />
        </div>

        <div style={{ ...row, borderBottom: 'none' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary, #FFFFFF)' }}>
              Default Anonymous Tipping
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>
              When enabled, fan names are hidden from your tip notifications by default
            </div>
          </div>
          <Toggle
            checked={privacy.defaultAnonymousTipping}
            onChange={() => updatePrivacy({ defaultAnonymousTipping: !privacy.defaultAnonymousTipping })}
          />
        </div>
      </div>

      {/* Location */}
      <div style={card}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', margin: '0 0 4px' }}>
          Location Precision
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)', marginBottom: 12 }}>
          When you check in live, this controls how precisely your location is shared with fans.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['precise', 'approximate', 'disabled'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => updatePrivacy({ locationPrecision: opt })}
              style={{
                padding: '7px 16px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: privacy.locationPrecision === opt ? '#7C3AED' : 'rgba(255,255,255,0.15)',
                background: privacy.locationPrecision === opt ? 'rgba(124,58,237,0.2)' : 'transparent',
                color: privacy.locationPrecision === opt ? '#A78BFA' : 'var(--text-secondary, #94A3B8)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {opt === 'precise' ? '📍 Precise' : opt === 'approximate' ? '🌐 Approximate' : '🚫 Hidden'}
            </button>
          ))}
        </div>
      </div>

      {/* Data Export */}
      <DataExportCard
        userName={auth.displayName ?? 'Creator'}
        userEmail={auth.email ?? ''}
        userUid={auth.user?.uid ?? 'usr_self'}
        defaultRole="artist"
      />

      {/* Account Deletion */}
      <div style={{ ...card, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#EF4444', margin: '0 0 6px' }}>
          Account Deletion
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', marginBottom: 12, lineHeight: 1.55 }}>
          To permanently delete your creator account, go to Account Settings → Danger Zone. Note: you must withdraw any pending payouts before deletion. Financial transaction records are retained for 7 years per IRS/AML regulations.
        </p>
        <Link
          href="/account"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#EF4444', fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}
        >
          Account Settings → Danger Zone ↗
        </Link>
      </div>
    </div>
  );
}
