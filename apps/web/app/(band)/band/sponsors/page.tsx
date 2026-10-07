/**
 * Crowdbeats V2 — Band Sponsorships (Phase 8)
 * Brand deals, gear endorsements, and corporate performance match pools.
 */

import React from 'react';

export default function BandSponsorsPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Brand Sponsorships & Gear Endorsements
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Connect with musical instrument brands, audio gear manufacturers, and corporate tour sponsors.
      </p>

      <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
          Sponsorship Matching Portal
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13, maxWidth: 440, margin: '0 auto' }}>
          Brand sponsorship matching, Campaign Budget match pools, and sponsored tour stages will be unlocked in Phase 9.
        </div>
      </div>
    </div>
  );
}
