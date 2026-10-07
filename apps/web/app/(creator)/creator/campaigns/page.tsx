/**
 * Crowdbeats V2 — Creator Campaigns List (Phase 7)
 * 'use client' page listing all campaigns created by this musician.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CampaignItem {
  campaignId: string;
  title: string;
  description: string;
  goalCents: number;
  pledgedCents: number;
  backerCount: number;
  currency: string;
  status: string;
  deadline: string;
}

export default function CreatorCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'draft' | 'active' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/creator/campaigns')
      .then((res) => res.json())
      .then((data) => {
        if (data.campaigns) setCampaigns(data.campaigns);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = campaigns.filter((c) => filter === 'all' || c.status === filter);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
            Campaigns
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Crowdfunding projects, album pressings, tour funding, and equipment campaigns.
          </p>
        </div>
        <Link href="/creator/campaigns/new" style={{ textDecoration: 'none' }}>
          <button style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + Create Campaign
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
        {(['all', 'draft', 'active', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              textTransform: 'capitalize',
              background: filter === tab ? 'var(--accent-primary-subtle)' : 'transparent',
              color: filter === tab ? 'var(--accent-primary)' : 'var(--text-tertiary)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading campaigns...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--surface-card)', padding: 40, borderRadius: 12, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>No campaigns found</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 16 }}>Start your first crowdfunding project to engage your fans.</div>
          <Link href="/creator/campaigns/new" style={{ textDecoration: 'none' }}>
            <button style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Launch a Campaign
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map((c) => {
            const pct = Math.min(100, Math.floor(((c.pledgedCents || 0) / (c.goalCents || 1)) * 100));
            return (
              <Link key={c.campaignId} href={`/creator/campaigns/${c.campaignId}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--surface-card)', padding: 20, borderRadius: 12, border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 12, background: c.status === 'active' ? 'rgba(74,222,128,0.15)' : 'var(--surface-raised)', color: c.status === 'active' ? 'var(--status-success)' : 'var(--text-tertiary)' }}>
                      {c.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>{c.title}</h3>
                  <div style={{ background: 'var(--surface-raised)', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ background: 'var(--accent-primary)', width: `${pct}%`, height: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span><strong>${((c.pledgedCents || 0) / 100).toFixed(2)}</strong> pledged</span>
                    <span>{pct}% of ${((c.goalCents || 0) / 100).toFixed(0)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
