/**
 * Crowdbeats V2 -- Band Privacy & Data Control
 * Route: /band/privacy
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { DataExportCard } from '@/components/settings/DataExportCard';

const card: React.CSSProperties = {
  background: 'var(--surface-card, #151722)',
  padding: 20,
  borderRadius: 12,
  border: '1px solid var(--border-subtle, #2B2D44)',
  marginBottom: 16,
};

export default function BandPrivacyPage() {
  const auth = useAuth();
  const [radarDiscoverable, setRadarDiscoverable] = useState(true);
  const [audioPreview, setAudioPreview] = useState(true);

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer', background: checked ? '#7C3AED' : 'rgba(255,255,255,0.12)', border: 'none', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#FFFFFF', position: 'absolute', top: 3, left: checked ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  );

  return (
    <div style={{ padding: '24px 32px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary, #FFFFFF)' }}>
        Privacy & Data Control
      </h1>
      <p style={{ color: 'var(--text-secondary, #94A3B8)', fontSize: 14, marginBottom: 28 }}>
        Manage your band's discoverability, data rights, and privacy preferences.
      </p>

      {/* Band Discoverability */}
      <div style={card}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', margin: '0 0 12px' }}>
          Band Discoverability
        </h3>
        {[
          { label: 'Discoverable on Live Radar', desc: 'Allow fans to find your band on the live performer map', checked: radarDiscoverable, toggle: () => setRadarDiscoverable(!radarDiscoverable) },
          { label: 'Audio Preview on Cards', desc: 'Play your audio sample when fans hover over your card in discovery', checked: audioPreview, toggle: () => setAudioPreview(!audioPreview) },
        ].map((item, i, arr) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(43,45,68,0.5)' : 'none' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary, #FFFFFF)' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>{item.desc}</div>
            </div>
            <Toggle checked={item.checked} onChange={item.toggle} />
          </div>
        ))}
      </div>

      {/* Data Export */}
      <DataExportCard
        userName={auth.displayName ?? 'Band Admin'}
        userEmail={auth.email ?? ''}
        userUid={auth.user?.uid ?? 'usr_self'}
        defaultRole="band_member"
      />

      {/* Account Deletion */}
      <div style={{ ...card, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#EF4444', margin: '0 0 6px' }}>Account Deletion</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', marginBottom: 12, lineHeight: 1.55 }}>
          Band accounts require the founder to transfer ownership or dissolve the band before deletion. All member split balances must be settled. Visit Account Settings to begin the process.
        </p>
        <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          Account Settings ↗
        </Link>
      </div>
    </div>
  );
}
