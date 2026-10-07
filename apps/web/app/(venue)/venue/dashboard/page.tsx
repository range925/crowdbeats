/**
 * Crowdbeats V2 — Venue Studio Dashboard (Phase 9)
 *
 * Overview metrics: Tonight's lineup, stage occupancy, live tip volume, QR presets.
 */

import React from 'react';
import Link from 'next/link';

export default function VenueDashboardPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Venue Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Manage physical stage sessions, monitor live tipping velocity, and coordinate artist lineups.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/venue/stages"
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
            <span>🎭</span>
            <span>Configure Stages</span>
          </Link>
          <Link
            href="/venue/live"
            style={{
              background: 'var(--accent-primary)',
              color: '#FFFFFF',
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
            <span>📡</span>
            <span>Live Stage Feed</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Active Stages</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>1</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Configured for live sessions</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Tonight's Scheduled Sets</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>0</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Performers checked in</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Session Tips Logged</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-0.02em' }}>$0.00</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Audience tips at venue stages</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Venue Capacity</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>500</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Main room occupancy limit</div>
        </div>
      </div>

      {/* Live Stage Status Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(255,151,186,0.12) 0%, rgba(74,222,128,0.1) 100%)',
          border: '1px solid rgba(255,151,186,0.25)',
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
            📍 Physical & Virtual Stage Check-In
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 640 }}>
            Artists can check in automatically when within your venue’s 100m geofence radius or when assigned to a specific stage by staff.
          </div>
        </div>

        <Link
          href="/venue/live"
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
          Monitor Live Stages
        </Link>
      </div>
    </div>
  );
}
