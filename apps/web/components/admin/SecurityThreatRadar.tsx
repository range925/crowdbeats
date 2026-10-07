'use client';

import React from 'react';
import { ThreatIcon, ShieldBadgeIcon } from './AdminIcons';

interface ThreatSignal {
  vector: string;
  threatLevel: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  activeBlocks24h: number;
  lastIncidentAgo: string;
  mitigationRule: string;
}

const DEFAULT_SIGNALS: ThreatSignal[] = [
  { vector: 'WAF Rate Limiting (>100 req/min)', threatLevel: 'NORMAL', activeBlocks24h: 312, lastIncidentAgo: '12m ago', mitigationRule: 'Auto-throttle 429 TokenBucket' },
  { vector: 'Stripe Radar Velocity (Card Rapid-fire)', threatLevel: 'NORMAL', activeBlocks24h: 3, lastIncidentAgo: '3h ago', mitigationRule: 'Block >$500 3D-Secure Required' },
  { vector: 'QR Replay & Spoofing Prevention', threatLevel: 'NORMAL', activeBlocks24h: 0, lastIncidentAgo: 'None', mitigationRule: '30s Time-decay SHA256 HMAC' },
  { vector: 'Brute-force Admin Auth & MFA', threatLevel: 'NORMAL', activeBlocks24h: 8, lastIncidentAgo: '42m ago', mitigationRule: '5-attempt Lockout + Email Alert' },
  { vector: 'Content Abuse & Hate-Speech Filter', threatLevel: 'NORMAL', activeBlocks24h: 1, lastIncidentAgo: '1d ago', mitigationRule: 'Automated AI Moderation Pipeline' },
];

export const SecurityThreatRadar: React.FC<{ signals?: ThreatSignal[] }> = ({ signals = DEFAULT_SIGNALS }) => {
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
            <ThreatIcon size={18} strokeWidth={2.2} style={{ color: 'var(--admin-accent-primary, #7C3AED)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--admin-text-primary, var(--text-primary, #0F172A))', letterSpacing: '-0.02em', margin: 0 }}>
              Security Threat Intelligence & Perimeter Radar
            </h2>
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-secondary, var(--text-secondary, #64748B))', marginTop: 3 }}>
            Real-time attack vector mitigation, fraud velocity rules, and active perimeter defenses.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary, #64748B)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Current Posture:
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--admin-status-success, #10B981)',
              background: 'var(--admin-status-success-bg, rgba(16, 185, 129, 0.10))',
              padding: '3px 10px',
              borderRadius: 20,
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <ShieldBadgeIcon size={12} strokeWidth={2.2} />
            <span>DEFCON 5 / GUARDED</span>
          </span>
        </div>
      </div>

      {/* Threat vectors list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {signals.map((s, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: 8,
              background: 'var(--admin-surface-raised, var(--surface-raised, #F8FAFC))',
              border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ minWidth: 240, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)' }}>{s.vector}</div>
              <div style={{ fontSize: 11, color: 'var(--admin-text-secondary, #64748B)', marginTop: 2 }}>
                Defense Engine: <code style={{ color: 'var(--admin-accent-primary, #7C3AED)', fontSize: 11, background: 'var(--admin-accent-subtle, rgba(124,58,237,0.06))', padding: '1px 4px', borderRadius: 4 }}>{s.mitigationRule}</code>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <div className="admin-tabular-nums" style={{ fontSize: 14, fontWeight: 800, color: 'var(--admin-text-primary, #0F172A)', fontVariantNumeric: 'tabular-nums' }}>
                  {s.activeBlocks24h}
                </div>
                <div style={{ fontSize: 10, color: 'var(--admin-text-tertiary, #64748B)' }}>Blocks (24h)</div>
              </div>

              <div style={{ textAlign: 'right', minWidth: 70 }}>
                <div className="admin-tabular-nums" style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {s.lastIncidentAgo}
                </div>
                <div style={{ fontSize: 10, color: 'var(--admin-text-tertiary, #64748B)' }}>Last Triggered</div>
              </div>

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'var(--admin-status-success, #10B981)',
                  background: 'var(--admin-status-success-bg, rgba(16, 185, 129, 0.10))',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                {s.threatLevel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
