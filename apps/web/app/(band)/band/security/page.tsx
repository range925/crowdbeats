'use client';

import React from 'react';
import Link from 'next/link';
import { SecurityCenter } from '@/components/security/SecurityCenter';
import { DangerZone } from '@/components/settings/DangerZone';

const card: React.CSSProperties = {
  background: 'var(--surface-card)',
  padding: 24,
  borderRadius: 16,
  border: '1px solid var(--border-subtle)',
  marginBottom: 20,
  backdropFilter: 'blur(16px)',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--text-primary)',
  margin: '0 0 10px',
};

const bodyText: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  margin: 0,
};

export default function BandSecurityPage() {
  return (
    <div style={{ padding: '24px 32px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Band Security & Governance Audits
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Manage your personal credentials, active sessions, and band multi-member governance invariants
        </p>
      </div>

      {/* Unified Security Center */}
      <SecurityCenter />

      {/* ── Band Governance Invariants ── */}
      <div style={card}>
        <h3 style={sectionTitle}>🛡️ Multi-Member Governance Invariants</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '👤', text: 'Every member authenticates using their personal cryptographic UID.' },
            { icon: '🔒', text: 'Band splits are version-controlled and server-authoritative.' },
            { icon: '👑', text: 'Band founder cannot be removed without explicit ownership transfer.' },
            { icon: '✍️', text: 'Transferring ownership requires step-up typed confirmation phrase.' },
          ].map(({ icon, text }) => (
            <div
              key={text}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Band Audit Log ── */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Band Governance Audit Trail</span>
          <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)' }}>Immutable records of membership & split revisions</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{ padding: '10px 20px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
              <th style={{ padding: '10px 20px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performed By</th>
              <th style={{ padding: '10px 20px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <td style={{ padding: '14px 20px' }}>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                  BAND_INITIALIZED
                </span>
              </td>
              <td style={{ padding: '14px 20px', color: 'var(--text-primary)', fontWeight: 500 }}>Band Founder</td>
              <td style={{ padding: '14px 20px', color: 'rgba(255, 255, 255, 0.5)' }}>Genesis</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Danger Zone ── */}
      <DangerZone description="Permanently deleting your band account removes all members, splits, earnings history, and associated data.">
        <p style={{ fontSize: 13, color: 'rgba(239, 68, 68, 0.8)', lineHeight: 1.55 }}>
          To permanently delete this band account and all associated data, go to your Account settings Danger Zone.
        </p>
        <Link
          href="/account"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#EF4444',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Account Settings → Danger Zone ↗
        </Link>
      </DangerZone>
    </div>
  );
}
