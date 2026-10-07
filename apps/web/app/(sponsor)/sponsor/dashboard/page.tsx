/**
 * Crowdbeats V2 — Sponsor Studio Dashboard (Phase 9)
 *
 * Overview metrics: Campaign balance, active match pools, deals in progress, ROI.
 */

import React from 'react';
import Link from 'next/link';

export default function SponsorDashboardPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Sponsor Workspace
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Manage brand Campaign Budget, match live performer tips, and discover verified music talent.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/sponsor/discovery"
            style={{
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>🔍</span>
            <span>Discover Talent</span>
          </Link>
          <Link
            href="/sponsor/payments"
            style={{
              background: 'var(--accent-secondary)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>💳</span>
            <span>Fund Sponsor Account</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Available Campaign balance</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>$0.00</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Ready for tip matches and deals</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Active Match Pools</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>0</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>1:1 tip matching campaigns</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Total Matched Tips</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--accent-secondary)', letterSpacing: '-0.02em' }}>$0.00</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Disbursed directly to artists & bands</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Deals in Negotiation</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>0</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Custom sponsorship agreements</div>
        </div>
      </div>

      {/* Match Pool Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(255,151,186,0.12) 100%)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 14,
          padding: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
            🎯 Multiplier Match Pools: 2x Performer Tips
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 640 }}>
            Match audience tips dollar-for-dollar during live sets or festival stages. Your brand is credited on every live tip animation.
          </div>
        </div>

        <Link
          href="/sponsor/opportunities"
          style={{
            background: 'var(--surface-raised)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            padding: '10px 18px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          Create Match Pool
        </Link>
      </div>
    </div>
  );
}
