/**
 * Crowdbeats V2 — Venue Analytics & Foot Traffic (Phase 9)
 * Stage foot traffic, tipping velocity per stage, peak hour heatmaps.
 */

import React from 'react';

export default function VenueAnalyticsPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Venue Traffic & Stage Analytics
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Aggregated audience attendance, stage tip conversion rates, and hourly peak performance data.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Total Gigs Hosted</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>0</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Across all stages</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Peak Tipping Hour</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-primary)' }}>10:00 PM</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>High-yield performance window</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Top Grossing Stage</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>Main Stage</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Highest audience tip volume</div>
        </div>
      </div>

      <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>Venue Heatmaps & Attendance Charts</div>
        <div style={{ fontSize: 13 }}>Live analytics charts will populate as audience members interact with stage QR codes.</div>
      </div>
    </div>
  );
}
