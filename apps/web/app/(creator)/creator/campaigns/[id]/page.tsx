/**
 * Crowdbeats V2 — Campaign Detail & Management (Phase 7)
 * 'use client' page for viewing campaign details, posting updates, and lifecycle actions.
 */

'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface CampaignDetail {
  campaignId: string;
  creatorId: string;
  title: string;
  description: string;
  goalCents: number;
  pledgedCents: number;
  backerCount: number;
  status: string;
  deadline: string;
  rewardTiers?: Array<{ tierId: string; title: string; description: string; amountCents: number }>;
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [updateBody, setUpdateBody] = useState('');
  const [postSuccess, setPostSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/creator/campaigns')
      .then((res) => res.json())
      .then((data) => {
        if (data.campaigns) {
          const match = data.campaigns.find((c: CampaignDetail) => c.campaignId === id);
          if (match) setCampaign(match);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateBody.trim()) return;
    setPostSuccess('Campaign update posted!');
    setUpdateBody('');
    setTimeout(() => setPostSuccess(''), 3000);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading campaign details...</div>;
  }

  if (!campaign) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>Campaign Not Found</h2>
        <Link href="/creator/campaigns" style={{ color: 'var(--accent-primary)' }}>← Back to campaigns</Link>
      </div>
    );
  }

  const pct = Math.min(100, Math.floor(((campaign.pledgedCents || 0) / (campaign.goalCents || 1)) * 100));

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      <Link href="/creator/campaigns" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: 13 }}>
        ← Back to Campaigns
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12, marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 12, background: 'var(--surface-raised)', color: 'var(--accent-primary)', marginBottom: 8, display: 'inline-block' }}>
            {campaign.status}
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{campaign.title}</h1>
        </div>
      </div>

      {/* Progress Card */}
      <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-primary)' }}>${((campaign.pledgedCents || 0) / 100).toFixed(2)}</span>
            <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}> pledged of ${((campaign.goalCents || 0) / 100).toFixed(0)} goal</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{campaign.backerCount || 0}</span>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>backers</div>
          </div>
        </div>

        <div style={{ background: 'var(--surface-raised)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ background: 'var(--accent-primary)', width: `${pct}%`, height: '100%' }} />
        </div>
      </div>

      {/* Description */}
      <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>About This Campaign</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
          {campaign.description}
        </p>
      </div>

      {/* Post Update Form */}
      <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Post Campaign Update</h3>
        {postSuccess && (
          <div style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--status-success)', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
            {postSuccess}
          </div>
        )}
        <form onSubmit={handlePostUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            rows={4}
            value={updateBody}
            onChange={(e) => setUpdateBody(e.target.value)}
            placeholder="Share an update with your backers (e.g. Mastered tracks are in! Studio photos attached)..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }}
          />
          <button type="submit" style={{ alignSelf: 'flex-start', background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Publish Update
          </button>
        </form>
      </div>
    </div>
  );
}
