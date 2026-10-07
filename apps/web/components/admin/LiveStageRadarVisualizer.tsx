'use client';

import React from 'react';
import { LiveRadarIcon, LivePulseDot } from './AdminIcons';

interface LiveStageNode {
  id: string;
  performerName: string;
  performerType: 'SOLO' | 'BAND';
  venueName: string;
  cityState: string;
  listenersCount: number;
  tipsEarnedDollars: number;
  qrNonce: number;
  qrExpiresInSec: number;
  isVerifiedVenue: boolean;
}

const MOCK_STAGES: LiveStageNode[] = [
  { id: 's1', performerName: 'Elena Cruz', performerType: 'SOLO', venueName: 'Sunset Lounge', cityState: 'San Diego, CA', listenersCount: 42, tipsEarnedDollars: 140.0, qrNonce: 18, qrExpiresInSec: 14, isVerifiedVenue: true },
  { id: 's2', performerName: 'The Midnight Echoes', performerType: 'BAND', venueName: 'The Casbah', cityState: 'San Diego, CA', listenersCount: 118, tipsEarnedDollars: 620.0, qrNonce: 44, qrExpiresInSec: 22, isVerifiedVenue: true },
  { id: 's3', performerName: 'Marcus Vance Jazz Trio', performerType: 'BAND', venueName: 'Belly Up Tavern', cityState: 'Solana Beach, CA', listenersCount: 86, tipsEarnedDollars: 450.0, qrNonce: 29, qrExpiresInSec: 8, isVerifiedVenue: true },
  { id: 's4', performerName: 'Acoustic Leo (Busking)', performerType: 'SOLO', venueName: 'Gaslamp Quarter Plaza', cityState: 'San Diego, CA', listenersCount: 19, tipsEarnedDollars: 65.0, qrNonce: 9, qrExpiresInSec: 27, isVerifiedVenue: false },
];

export const LiveStageRadarVisualizer: React.FC<{ stages?: LiveStageNode[] }> = ({ stages = MOCK_STAGES }) => {
  return (
    <div
      style={{
        background: 'var(--admin-surface-card, var(--surface-card, #FFFFFF))',
        padding: '22px 24px',
        borderRadius: 12,
        border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
        boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LiveRadarIcon size={18} strokeWidth={2.2} style={{ color: 'var(--admin-accent-primary, #7C3AED)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--admin-text-primary, var(--text-primary, #0F172A))', letterSpacing: '-0.02em', margin: 0 }}>
              Live Stages & Set Concurrency Radar
            </h2>
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-secondary, var(--text-secondary, #64748B))', marginTop: 3 }}>
            Real-time GPS geofence presence, live audio broadcasts, and 30s rotating anti-replay QR telemetry.
          </div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--admin-status-success-bg, rgba(16, 185, 129, 0.10))', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <LivePulseDot size={7} color="var(--admin-status-success, #10B981)" />
          <span className="admin-tabular-nums" style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-status-success, #10B981)', fontVariantNumeric: 'tabular-nums' }}>
            {stages.length} Active Stages Live
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        {stages.map((s) => (
          <div
            key={s.id}
            style={{
              background: 'var(--admin-surface-raised, var(--surface-raised, #F8FAFC))',
              borderRadius: 8,
              padding: '16px 18px',
              border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--admin-text-primary, #0F172A)' }}>{s.performerName}</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: s.performerType === 'BAND' ? 'var(--admin-accent-primary, #7C3AED)' : 'var(--admin-status-info, #3B82F6)',
                      background: s.performerType === 'BAND' ? 'rgba(124, 58, 237, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                      padding: '1px 5px',
                      borderRadius: 4,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {s.performerType}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-secondary, #64748B)', marginTop: 2 }}>
                  {s.venueName} · <span style={{ color: 'var(--admin-text-tertiary, #94A3B8)' }}>{s.cityState}</span>
                </div>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'var(--admin-status-success-bg, rgba(16, 185, 129, 0.10))',
                  padding: '2px 7px',
                  borderRadius: 12,
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'var(--admin-status-success, #10B981)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--admin-status-success, #10B981)' }} />
                <span>LIVE</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
              <div>
                <div className="admin-tabular-nums" style={{ fontSize: 15, fontWeight: 800, color: 'var(--admin-accent-primary, #7C3AED)', fontVariantNumeric: 'tabular-nums' }}>
                  ${s.tipsEarnedDollars.toFixed(2)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--admin-text-tertiary, #64748B)' }}>Live Tips Collected</div>
              </div>

              <div>
                <div className="admin-tabular-nums" style={{ fontSize: 14, fontWeight: 800, color: 'var(--admin-text-primary, #0F172A)', fontVariantNumeric: 'tabular-nums' }}>
                  {s.listenersCount}
                </div>
                <div style={{ fontSize: 10, color: 'var(--admin-text-tertiary, #64748B)' }}>Nearby Fans</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="admin-tabular-nums" style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-secondary, #475569)', fontVariantNumeric: 'tabular-nums' }}>
                  QR #{s.qrNonce} ({s.qrExpiresInSec}s)
                </div>
                <div style={{ fontSize: 10, color: 'var(--admin-text-tertiary, #64748B)' }}>Anti-Tamper Sync</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
