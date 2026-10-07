/**
 * Crowdbeats V2 — Sponsor Campaign ROI Analytics (Phase 9)
 * Tip match velocity, impression multipliers, and demographic cohorts.
 */

import React from 'react';

export default function SponsorAnalyticsPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Sponsor Campaign Analytics
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Real-time brand exposure, tip multiplier yield, and audience engagement metrics.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Total Brand Impressions</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>0</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Across live gig screens & web</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Tip Multiplier Lift</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-secondary)' }}>0.0x</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Increase in audience fan tips</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Average Performer ROI</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>0.0%</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Direct engagement conversion</div>
        </div>
      </div>

      <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>Campaign Growth Metrics</div>
        <div style={{ fontSize: 13 }}>Interactive impression charts and conversion funnels will render as match pools are utilized.</div>
      </div>
    </div>
  );
}
