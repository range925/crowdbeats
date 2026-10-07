'use client';

import React, { useState } from 'react';
import { useUserSettings } from '@/lib/hooks/useUserSettings';

const CARD: React.CSSProperties = { backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, marginBottom: 20, overflow: 'hidden' };
const ROW: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', minHeight: 44, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', gap: 12 };
const LABEL: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' };
const DESC: React.CSSProperties = { fontSize: 12, color: 'var(--text-secondary, #94A3B8)', marginTop: 2 };
const PILL: React.CSSProperties = { padding: '8px 16px', borderRadius: 20, minHeight: 44, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 };

export function LocationSection() {
  const { privacy, updatePrivacy } = useUserSettings();
  const [radius, setRadius] = useState('1km');
  const [backgroundRadar, setBackgroundRadar] = useState(false);

  const precisions = ['Precise', 'Approximate', 'Disabled'] as const;
  const locationPrecision = privacy.locationPrecision || 'Approximate';

  return (
    <div>
      <div style={CARD}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={LABEL}>Location Precision</div>
          <div style={DESC}>Choose how accurately Crowdbeats can detect your location.</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {precisions.map((p) => {
              const isSelected = p.toLowerCase() === locationPrecision.toLowerCase();
              return (
                <button
                  key={p}
                  style={{
                    ...PILL,
                    background: isSelected ? 'var(--brand-purple, #8B5CF6)' : 'var(--surface-2, #1F2233)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary, #94A3B8)',
                  }}
                  onClick={() => updatePrivacy({ locationPrecision: p.toLowerCase() as any })}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div style={ROW}>
          <div>
            <div style={LABEL}>Background Radar Discovery</div>
            <div style={DESC}>Detect nearby stages even when app is minimized.</div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
            <input
              type="checkbox"
              checked={backgroundRadar}
              onChange={(e) => setBackgroundRadar(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: backgroundRadar ? 'var(--brand-purple, #8B5CF6)' : 'var(--surface-3, #2B2D44)',
              transition: '.4s', borderRadius: 24, minHeight: 44, minWidth: 44
            }}>
              <span style={{
                position: 'absolute', content: '""', height: 18, width: 18, left: 3, bottom: 3,
                backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                transform: backgroundRadar ? 'translateX(20px)' : 'translateX(0)'
              }} />
            </span>
          </label>
        </div>

        <div style={ROW}>
          <div>
            <div style={LABEL}>Geofence Notification Radius</div>
            <div style={DESC}>Receive alerts for stages within this distance.</div>
          </div>
          <select
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            style={{ minHeight: 44, background: 'var(--surface-2, #1F2233)', color: 'var(--text-primary, #FFFFFF)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, padding: '0 12px' }}
          >
            <option value="500m">500m</option>
            <option value="1km">1km</option>
            <option value="2km">2km</option>
            <option value="5km">5km</option>
            <option value="10km">10km</option>
          </select>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary, #64748B)', textAlign: 'center', marginTop: 16 }}>
        Your precise location is NEVER stored on our servers. Only anonymized check-in events are logged.
      </div>
    </div>
  );
}
