/**
 * Crowdbeats V2 — Sponsor Saved Talent Shortlist (Phase 9)
 * Quick access to bookmarked artists, bands, and stage performers.
 */

'use client';

import React from 'react';
import Link from 'next/link';

export default function SponsorShortlistPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Saved Talent Shortlist
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Bookmarked performers for future seasonal campaigns or festival match pools.
      </p>

      <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
          Your Shortlist is Empty
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 20 }}>
          Bookmark performers while browsing the Talent Discovery directory.
        </div>
        <Link
          href="/sponsor/discovery"
          style={{
            background: 'var(--accent-secondary)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Explore Talent Directory
        </Link>
      </div>
    </div>
  );
}
