/**
 * Crowdbeats V2 — Band Fans & Supporters (Phase 8)
 * Tabbed view for followers and top tippers across band sessions.
 */

'use client';

import React, { useState } from 'react';

export default function BandFansPage() {
  const [tab, setTab] = useState<'followers' | 'tippers'>('followers');

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Band Audience & Fans
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Followers, top tipping supporters, and collective audience reach.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => setTab('followers')}
          style={{
            background: tab === 'followers' ? 'var(--accent-primary)' : 'var(--surface-raised)',
            color: tab === 'followers' ? '#000' : 'var(--text-secondary)',
            border: 'none',
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Followers (0)
        </button>
        <button
          onClick={() => setTab('tippers')}
          style={{
            background: tab === 'tippers' ? 'var(--accent-primary)' : 'var(--surface-raised)',
            color: tab === 'tippers' ? '#000' : 'var(--text-secondary)',
            border: 'none',
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Top Supporters (30d)
        </button>
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
          {tab === 'followers' ? 'No Band Followers Yet' : 'No Recent Tips Received'}
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
          Perform live or share your band profile link to build your following.
        </div>
      </div>
    </div>
  );
}
