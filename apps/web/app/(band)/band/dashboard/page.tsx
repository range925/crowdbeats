/**
 * Crowdbeats V2 — Band Studio Dashboard (Phase 8)
 *
 * Overview metrics: Band gross revenue, active split breakdown, live status,
 * companion mobile app promo.
 */

import React from 'react';
import Link from 'next/link';

export default function BandDashboardPage() {
  return (
    <div style={{
      padding: '36px 40px',
      maxWidth: 1200,
      margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif",
      letterSpacing: '-0.015em',
      color: 'var(--text-primary, #1D1D1F)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary, #1D1D1F)', letterSpacing: '-0.024em' }}>
            Band Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 14, margin: 0 }}>
            Collective revenue overview, split distribution, and live stage performance tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link
            href="/band/splits"
            style={{
              background: 'rgba(0, 0, 0, 0.05)',
              color: 'var(--text-primary, #1D1D1F)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              padding: '10px 20px',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.15s ease'
            }}
          >
            <span>⚖️</span>
            <span>Split Configuration</span>
          </Link>
          <Link
            href="/band/members"
            style={{
              background: '#000000',
              color: '#FFFFFF',
              padding: '10px 22px',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🤝</span>
            <span>Manage Members</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Bento Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{
          background: 'var(--surface-1, #FFFFFF)',
          padding: 24,
          borderRadius: 18,
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Total Band Tips</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#30D158', letterSpacing: '-0.024em' }}>$18,450.00</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 6 }}>Distributed via Largest Remainder Method</div>
        </div>

        <div style={{
          background: 'var(--surface-1, #FFFFFF)',
          padding: 24,
          borderRadius: 18,
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Active Members</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', letterSpacing: '-0.024em' }}>4 Members</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 6 }}>All verified on Stripe Connect</div>
        </div>

        <div style={{
          background: 'var(--surface-1, #FFFFFF)',
          padding: 24,
          borderRadius: 18,
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Active Split Formula</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#000000', letterSpacing: '-0.024em' }}>OD-09 (100%)</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 6 }}>Largest Remainder Method certified</div>
        </div>

        <div style={{
          background: 'var(--surface-1, #FFFFFF)',
          padding: 24,
          borderRadius: 18,
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Live Sessions Logged</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', letterSpacing: '-0.024em' }}>12 Sessions</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 6 }}>Synced with mobile companion</div>
        </div>
      </div>

      {/* Quick Action Bento Banner */}
      <div
        style={{
          background: 'var(--surface-1, #FFFFFF)',
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          borderRadius: 20,
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div style={{ maxWidth: 680 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary, #1D1D1F)', marginBottom: 4 }}>
            📱 Go Live Together on the Crowdbeats Companion App
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', lineHeight: 1.4 }}>
            Start a live street session anywhere or link with an official stage venue. Real-time tips are calculated with exact OD-09 remainder arithmetic and deposited to all member Stripe accounts instantly.
          </div>
        </div>

        <Link
          href="/band/marketing"
          style={{
            background: 'rgba(0, 0, 0, 0.05)',
            color: 'var(--text-primary, #1D1D1F)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            padding: '10px 20px',
            borderRadius: 9999,
            fontWeight: 600,
            fontSize: 13,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s ease'
          }}
        >
          View Tip Links & QR
        </Link>
      </div>

      {/* Active Split Roster Allocation Card */}
      <div style={{
        background: 'var(--surface-1, #FFFFFF)',
        border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        borderRadius: 20,
        padding: '28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary, #1D1D1F)', letterSpacing: '-0.015em' }}>
              Active Split & Roster Allocation
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', margin: 0 }}>
              Live distribution formula using Largest Remainder Method (OD-09). Total allocation: 100.00%
            </p>
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#30D158',
            background: 'rgba(48, 209, 88, 0.12)',
            border: '1px solid rgba(48, 209, 88, 0.25)',
            padding: '4px 12px',
            borderRadius: 9999
          }}>
            ✓ OD-09 Verified (Zero Cent Drift)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            { name: 'David Naufahu', role: 'Band Leader / Lead Guitar', share: '35.0%', color: '#000000', status: 'Connected' },
            { name: 'Elena Rostova', role: 'Lead Vocals & Keyboards', share: '30.0%', color: '#30D158', status: 'Connected' },
            { name: 'Marcus Vance', role: 'Bass Guitar & Backing', share: '20.0%', color: '#FF9F0A', status: 'Connected' },
            { name: 'Tyler Reed', role: 'Drums & Acoustic Percussion', share: '15.0%', color: '#AF52DE', status: 'Connected' },
          ].map((m, idx) => (
            <div key={idx} style={{
              background: 'var(--surface-raised, #F4F4F6)',
              border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))',
              borderRadius: 14,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)' }}>{m.name}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: m.color }}>{m.share}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)' }}>{m.role}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary, #6E6E73)' }}>Stripe Express</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#30D158' }}>● {m.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
