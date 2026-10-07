'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { DataExportCard } from '@/components/settings/DataExportCard';
import { SettingsToggle } from '@/components/settings/SettingsToggle';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
};

export function DataPrivacySection() {
  const auth = useAuth();
  const { privacy, updatePrivacy } = useUserSettings();

  const roleMapping: Record<string, 'fan' | 'artist' | 'band_member' | 'sponsor' | 'venue' | 'admin'> = {
    fan: 'fan',
    artist: 'artist',
    band_member: 'band_member',
    venue: 'venue',
    sponsor: 'sponsor',
    admin: 'admin',
  };

  const defaultRole = auth.personaType ? (roleMapping[auth.personaType] || 'fan') : 'fan';

  return (
    <div>
      {/* GDPR / CCPA Data Export */}
      <div style={{ marginBottom: 16 }}>
        <DataExportCard
          userName={auth.displayName || 'Crowdbeats User'}
          userEmail={auth.email || ''}
          userUid={auth.uid || ''}
          defaultRole={defaultRole}
        />
      </div>

      {/* Telemetry */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>Telemetry & Analytics</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)', marginTop: 2 }}>
              Share anonymized usage logs to help us prevent stream dropouts and resolve tip delivery latencies.
            </div>
          </div>
          <SettingsToggle
            checked={privacy.telemetryAndAnalyticsConsent}
            onChange={(checked) => updatePrivacy({ telemetryAndAnalyticsConsent: checked })}
            label="Telemetry Consent"
          />
        </div>
      </div>

      {/* Retention Schedule */}
      <div style={CARD}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px' }}>Data Retention & Ledger Policy</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', lineHeight: 1.5, marginBottom: 14 }}>
          In accordance with financial banking and IRS 1099 regulations, immutable cryptographic transaction logs (tips, escrow releases, refunds) are maintained for 7 years. All other telemetry, GPS radar beacons, and temporary listening caches can be erased upon request.
        </p>
        <Link
          href="/account?section=danger"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            color: '#EF4444',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            minHeight: 44,
          }}
        >
          Request Permanent Account Deletion →
        </Link>
      </div>
    </div>
  );
}
