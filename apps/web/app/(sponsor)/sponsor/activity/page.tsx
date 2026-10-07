'use client';

/**
 * Crowdbeats V2 — Sponsor Campaign & Match Activity
 * Route: /sponsor/activity
 *
 * Dedicated live campaign feed for Sponsors:
 *   - Real-time matched fan tips
 *   - Escrow balance deposits & transfers
 *   - Campaign milestone events
 *   - Inbound performer partnership pitches
 */

import React, { useState } from 'react';

interface SponsorActivityItem {
  id: string;
  type: 'match' | 'escrow' | 'milestone' | 'pitch';
  title: string;
  subtitle: string;
  amount?: string;
  timeAgo: string;
  artistName?: string;
  venueName?: string;
  statusTag?: string;
}

const INITIAL_SPONSOR_ACTIVITIES: SponsorActivityItem[] = [
  {
    id: 'sact_1',
    type: 'match',
    title: 'Matched Fan Tip (100% Match)',
    subtitle: 'Matched $25 tip for Sarah M. backing Jake Rios',
    amount: '-$25.00',
    timeAgo: '22m ago',
    artistName: 'Jake Rios',
    venueName: 'The Main Stage',
    statusTag: 'Disbursed',
  },
  {
    id: 'sact_2',
    type: 'match',
    title: 'Matched Fan Tip (100% Match)',
    subtitle: 'Matched $40 tip for Jordan P. backing The Sunsets',
    amount: '-$40.00',
    timeAgo: '1h ago',
    artistName: 'The Sunsets',
    venueName: 'The Main Stage',
    statusTag: 'Disbursed',
  },
  {
    id: 'sact_3',
    type: 'milestone',
    title: 'Campaign Milestone Reached: 50% Match Cap',
    subtitle: 'San Diego Indie Showcase Pool has matched $1,250 across 14 artists',
    timeAgo: '3h ago',
    statusTag: 'Active Milestone',
  },
  {
    id: 'sact_4',
    type: 'pitch',
    title: 'Inbound Partnership Pitch',
    subtitle: 'Elena Vance submitted pitch for Jazz & Cocktails Residency',
    timeAgo: '5h ago',
    artistName: 'Elena Vance',
    statusTag: 'Awaiting Review',
  },
  {
    id: 'sact_5',
    type: 'escrow',
    title: 'Escrow Pool Funded',
    subtitle: 'Added $2,500.00 via Corporate ACH to Summer Live Match Pool',
    amount: '+$2,500.00',
    timeAgo: '2d ago',
    statusTag: 'Settled on Ledger',
  },
];

export default function SponsorActivityPage() {
  const [filter, setFilter] = useState<'All' | 'Matches' | 'Escrow' | 'Milestones' | 'Pitches'>('All');
  const [activities] = useState<SponsorActivityItem[]>(INITIAL_SPONSOR_ACTIVITIES);

  const filtered = activities.filter((act) => {
    if (filter === 'All') return true;
    if (filter === 'Matches') return act.type === 'match';
    if (filter === 'Escrow') return act.type === 'escrow';
    if (filter === 'Milestones') return act.type === 'milestone';
    if (filter === 'Pitches') return act.type === 'pitch';
    return true;
  });

  return (
    <div style={{ padding: '32px 40px', maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--cb-text-primary, var(--text-primary))' }}>
          Sponsor Match &amp; Campaign Activity
        </h1>
        <p style={{ color: 'var(--cb-text-secondary, var(--text-secondary))', fontSize: 14, margin: 0 }}>
          Real-time activity ledger of matched fan tips, escrow disbursements, campaign milestone reach, and inbound artist applications.
        </p>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Tips Matched</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#EC4899', marginTop: 4 }}>$1,850.00</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Across 42 live sets</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Artists Supported</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>18 Musicians</div>
          <div style={{ fontSize: 12, color: 'var(--cb-live-green, #059669)', marginTop: 2 }}>In San Diego metro</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Escrow Balance</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--cb-live-green, #059669)', marginTop: 4 }}>$3,150.00</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Available to match</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Fan Brand Reach</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#60A5FA', marginTop: 4 }}>8,420</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Impressions on live tips</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        {(['All', 'Matches', 'Escrow', 'Milestones', 'Pitches'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            style={{
              padding: '8px 18px',
              borderRadius: 9999,
              border: filter === tab ? '1px solid #EC4899' : '1px solid transparent',
              backgroundColor: filter === tab ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
              color: filter === tab ? '#F472B6' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((item) => {
          let icon = '⚡';
          let iconBg = 'rgba(236, 72, 153, 0.15)';
          let iconColor = '#EC4899';

          if (item.type === 'match') {
            icon = '🤝';
            iconBg = 'rgba(236, 72, 153, 0.15)';
            iconColor = '#EC4899';
          } else if (item.type === 'escrow') {
            icon = '💰';
            iconBg = 'rgba(0, 240, 118, 0.15)';
            iconColor = '#00F076';
          } else if (item.type === 'milestone') {
            icon = '🏆';
            iconBg = 'rgba(250, 204, 21, 0.15)';
            iconColor = '#FACC15';
          } else if (item.type === 'pitch') {
            icon = '📥';
            iconBg = 'rgba(59, 130, 246, 0.15)';
            iconColor = '#60A5FA';
          }

          return (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--surface-card)',
                borderRadius: 16,
                padding: '18px 22px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: iconBg,
                    color: iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                      {item.title}
                    </span>
                    {item.statusTag && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {item.statusTag}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {item.subtitle} • {item.timeAgo}
                  </div>
                </div>
              </div>

              {item.amount && (
                <div style={{ fontWeight: 800, fontSize: 16, color: item.amount.startsWith('+') ? '#00F076' : '#EC4899', flexShrink: 0 }}>
                  {item.amount}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
