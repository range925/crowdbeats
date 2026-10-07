/**
 * Crowdbeats V2 — Brand Sponsorships (Phase 7)
 * Brand sponsorship matching and deal flow portal.
 */

import React from 'react';

export default function CreatorSponsorshipsPage() {
  return (
    <div style={{ padding: '24px 32px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
        Brand Sponsorships
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Connect with corporate sponsors, gear brands, and local venue partners.
      </p>

      <div style={{ background: 'var(--surface-card)', padding: 40, borderRadius: 12, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🤝</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>Sponsorship Match Portal</div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13, maxWidth: 460, margin: '0 auto' }}>
          Brand sponsorship matching and sponsored performance campaigns will be unlocked in Phase 8.
        </div>
      </div>
    </div>
  );
}
