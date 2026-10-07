/**
 * Crowdbeats V2 — Sponsor Inbound Applications (Phase 9)
 * Incoming pitches from musicians and bands for brand sponsorship.
 */

import React from 'react';

export default function SponsorApplicationsPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Inbound Sponsorship Applications
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Review pitches and EPK submissions from artists requesting tour support or brand deals.
      </p>

      <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📥</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
          No Pending Applications
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
          Open an opportunity or post a match pool callout to receive inbound pitches.
        </div>
      </div>
    </div>
  );
}
