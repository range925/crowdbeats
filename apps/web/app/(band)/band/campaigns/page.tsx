/**
 * Crowdbeats V2 — Band Campaigns (Phase 8)
 * Crowdfunding projects, album pressings, and tour financing for bands.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function BandCampaignsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'completed'>('all');

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Band Campaigns
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Crowdfund studio albums, vinyl pressings, and tour equipment shared across the band.
          </p>
        </div>

        <Link
          href="/creator/campaigns/new"
          style={{
            background: 'var(--accent-primary)',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          + New Band Campaign
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
        {(['all', 'active', 'draft', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              background: filter === tab ? 'var(--surface-raised)' : 'transparent',
              color: filter === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: filter === tab ? '1px solid var(--border-subtle)' : 'none',
              padding: '6px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Empty State */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>No Campaigns Found</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 440, margin: '0 auto 20px' }}>
          Launch a shared crowdfunding project with custom reward tiers for your band supporters.
        </div>
        <Link
          href="/creator/campaigns/new"
          style={{
            background: 'var(--accent-primary)',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Create First Campaign
        </Link>
      </div>
    </div>
  );
}
