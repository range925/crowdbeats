/**
 * Crowdbeats V2 — Creator Fans & Top Tippers (Phase 7)
 * 'use client' page showing follower list and top tippers overview.
 */

'use client';

import React, { useState } from 'react';

export default function CreatorFansPage() {
  const [tab, setTab] = useState<'followers' | 'tippers'>('followers');

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
        Fan Audience & Supporters
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Your community of followers and top tippers from live performances.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
        <button
          onClick={() => setTab('followers')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: tab === 'followers' ? 'var(--accent-primary-subtle)' : 'transparent',
            color: tab === 'followers' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
          }}
        >
          Followers (0)
        </button>
        <button
          onClick={() => setTab('tippers')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: tab === 'tippers' ? 'var(--accent-primary-subtle)' : 'transparent',
            color: tab === 'tippers' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
          }}
        >
          Top Tippers (30d)
        </button>
      </div>

      <div style={{ background: 'var(--surface-card)', padding: 40, borderRadius: 12, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>❤️</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
          {tab === 'followers' ? 'No followers yet' : 'No tips received in the last 30 days'}
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
          {tab === 'followers'
            ? 'Fans can follow your artist profile from the mobile app or web page.'
            : 'Go live on the Crowdbeats mobile app to start receiving tips from fans around you.'}
        </div>
      </div>
    </div>
  );
}
