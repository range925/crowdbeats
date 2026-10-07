'use client';

import React, { useState } from 'react';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { SettingsToggle } from '@/components/settings/SettingsToggle';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  marginBottom: 20,
  overflow: 'hidden',
};

const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  minHeight: 52,
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  gap: 16,
};

const LABEL: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-primary, #FFFFFF)',
};

const DESC: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary, #94A3B8)',
  marginTop: 2,
};

const PILL: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 20,
  minHeight: 44,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
  transition: 'all 0.15s ease',
};

export function PrivacySection() {
  const { privacy, updatePrivacy } = useUserSettings();
  const [savedMsg, setSavedMsg] = useState(false);

  const showSaved = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleToggle = (key: keyof typeof privacy, val: any) => {
    updatePrivacy({ [key]: val });
    showSaved();
  };

  const precisions = ['precise', 'approximate', 'disabled'] as const;
  const currentPrecision = privacy.locationPrecision || 'precise';

  return (
    <div>
      {savedMsg && (
        <div style={{ position: 'sticky', top: 12, zIndex: 50, background: '#10B981', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 14, textAlign: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
          Saved ✓
        </div>
      )}

      <div style={CARD}>
        {/* Location Precision */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={LABEL}>Location Precision</div>
          <div style={DESC}>Controls how closely your location is resolved on live artist radar maps.</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {precisions.map((p) => {
              const active = currentPrecision === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleToggle('locationPrecision', p)}
                  style={{
                    ...PILL,
                    background: active ? 'var(--accent-primary, #7C3AED)' : 'rgba(255,255,255,0.06)',
                    color: active ? '#FFFFFF' : 'var(--text-secondary, #94A3B8)',
                    border: active ? '1px solid #7C3AED' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Radar Discoverability */}
        <div style={ROW}>
          <div style={{ flex: 1 }}>
            <div style={LABEL}>Profile Discoverable in Radar</div>
            <div style={DESC}>Allow nearby concertgoers and buskers to see your public fan or artist beacon.</div>
          </div>
          <SettingsToggle
            checked={privacy.profileDiscoverableInRadar}
            onChange={(checked) => handleToggle('profileDiscoverableInRadar', checked)}
            label="Discoverable in Radar"
          />
        </div>

        {/* Anonymous Tipping */}
        <div style={ROW}>
          <div style={{ flex: 1 }}>
            <div style={LABEL}>Default Anonymous Tipping</div>
            <div style={DESC}>Hide your name and avatar from public live stage feeds and performer tickers.</div>
          </div>
          <SettingsToggle
            checked={privacy.defaultAnonymousTipping}
            onChange={(checked) => handleToggle('defaultAnonymousTipping', checked)}
            label="Anonymous Tipping"
          />
        </div>

        {/* Listening Activity */}
        <div style={ROW}>
          <div style={{ flex: 1 }}>
            <div style={LABEL}>Share Listening Activity</div>
            <div style={DESC}>Broadcast recent song previews and favorite busker sets to your followers.</div>
          </div>
          <SettingsToggle
            checked={privacy.shareListeningActivity}
            onChange={(checked) => handleToggle('shareListeningActivity', checked)}
            label="Share Listening Activity"
          />
        </div>

        {/* Telemetry & Analytics */}
        <div style={{ ...ROW, borderBottom: 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={LABEL}>Telemetry & Analytics Consent</div>
            <div style={DESC}>Help Crowdbeats improve performance through anonymized diagnostic metrics.</div>
          </div>
          <SettingsToggle
            checked={privacy.telemetryAndAnalyticsConsent}
            onChange={(checked) => handleToggle('telemetryAndAnalyticsConsent', checked)}
            label="Telemetry Consent"
          />
        </div>
      </div>
    </div>
  );
}
