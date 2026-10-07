'use client';

import React from 'react';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 24,
  marginBottom: 20,
};

export function AboutSection() {
  return (
    <div>
      <div style={{ ...CARD, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎵</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px' }}>Crowdbeats</h2>
        <div style={{ fontSize: 13, color: 'var(--accent-primary, #A78BFA)', fontWeight: 600, marginBottom: 12 }}>
          Version 2.0.0-beta
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
          The direct-to-artist live tipping, verified electronic press kit, and stage coordination engine powering street performers, indie bands, and iconic venues worldwide.
        </p>

        <div style={{ display: 'inline-flex', gap: 12, padding: '8px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>
          <span>Next.js 15 App Router</span>
          <span>•</span>
          <span>Firebase Hosting</span>
          <span>•</span>
          <span>Stripe Connect</span>
        </div>
      </div>

      <div style={CARD}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', marginBottom: 10 }}>Platform Architecture</div>
        <ul style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
          <li>Real-time GPS busker proximity radar & stage geofencing</li>
          <li>Sub-second fan tipping ledger verified across Firestore and Stripe</li>
          <li>Multi-persona identity switching for Fans, Solo Musicians, Bands, Venues & Sponsors</li>
          <li>Full GDPR / CCPA self-service data export & immutable audit logs</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary, #94A3B8)', padding: 12 }}>
        © 2026 Crowdbeats Inc. All rights reserved.
      </div>
    </div>
  );
}
