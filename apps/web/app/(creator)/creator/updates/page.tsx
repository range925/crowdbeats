/**
 * Crowdbeats V2 — Campaign Updates Feed (Phase 7)
 * Feed of all updates posted by the creator across campaigns.
 */

import React from 'react';

export default function CreatorUpdatesPage() {
  return (
    <div style={{ padding: '24px 32px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
        Campaign Updates
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Broadcasts and progress reports sent to your campaign backers.
      </p>

      <div style={{ background: 'var(--surface-card)', padding: 40, borderRadius: 12, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>No updates posted yet</div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
          Updates can be posted directly from any active campaign page to notify your backers.
        </div>
      </div>
    </div>
  );
}
