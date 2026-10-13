'use client';

import React from 'react';

const CARD: React.CSSProperties = {
  backgroundColor: 'var(--cb-surface-card, #FFFFFF)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  border: '1px solid var(--cb-border-subtle, #E5E5EA)',
  borderRadius: 16,
  padding: 24,
  marginBottom: 20,
};

export function AboutSection() {
  return (
    <div>
      <div className="cb-account-card" style={{ ...CARD, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎵</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--cb-text-primary, #1D1D1F)', margin: '0 0 4px' }}>Crowdbeats</h2>
        <div style={{ fontSize: 13, color: 'var(--cb-brand-primary, #7C3AED)', fontWeight: 600, marginBottom: 12 }}>
          Version 2.0.0-beta
        </div>
        <p style={{ fontSize: 13, color: 'var(--cb-text-secondary, #6E6E73)', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
          The direct-to-artist live tipping, verified electronic press kit, and stage coordination engine powering street performers, indie bands, and iconic venues worldwide.
        </p>

        <div style={{ display: 'inline-flex', gap: 12, padding: '8px 16px', borderRadius: 20, background: 'var(--cb-surface-subtle, #F4F4F6)', border: '1px solid var(--cb-border-subtle, #E5E5EA)', fontSize: 12, color: 'var(--cb-text-secondary, #6E6E73)' }}>
          <span>Next.js 15 App Router</span>
          <span>•</span>
          <span>Firebase Hosting</span>
          <span>•</span>
          <span>Stripe Connect</span>
        </div>
      </div>

      <div className="cb-account-card" style={CARD}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cb-text-primary, #1D1D1F)', marginBottom: 10 }}>Platform Architecture</div>
        <ul style={{ fontSize: 13, color: 'var(--cb-text-secondary, #6E6E73)', margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
          <li>Real-time GPS busker proximity radar & stage geofencing</li>
          <li>Sub-second fan tipping ledger verified across Firestore and Stripe</li>
          <li>Multi-persona identity switching for Fans, Solo Musicians, Bands, Venues & Sponsors</li>
          <li>Full GDPR / CCPA self-service data export & immutable audit logs</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--cb-text-secondary, #6E6E73)', padding: 12 }}>
        © 2026 Crowdbeats Inc. All rights reserved.
      </div>
    </div>
  );
}
