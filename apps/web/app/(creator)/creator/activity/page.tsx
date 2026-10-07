'use client';

/**
 * Crowdbeats V2 — Creator Studio Live Activity Feed
 * Route: /creator/activity
 *
 * Dedicated live activity feed for Solo Musicians:
 *   - Real-time tips received with fan messages
 *   - Stage check-ins & completed set summaries
 *   - New fan followers
 *   - Sponsor tip matches
 *   - Bank payout transfers
 */

import React, { useState } from 'react';
import Link from 'next/link';

interface CreatorActivityItem {
  id: string;
  type: 'tip' | 'set' | 'follow' | 'sponsor' | 'payout';
  title: string;
  subtitle: string;
  amount?: string;
  timeAgo: string;
  fanName?: string;
  message?: string;
  venue?: string;
  statusTag?: string;
}

const INITIAL_CREATOR_ACTIVITIES: CreatorActivityItem[] = [
  {
    id: 'cact_1',
    type: 'tip',
    title: 'Live Tip from Sarah M.',
    subtitle: 'The Main Stage • Acoustic Showcase',
    amount: '+$25.00',
    timeAgo: '22m ago',
    fanName: 'Sarah M.',
    message: 'That fingerstyle picking on the second track gave me chills!',
    venue: 'The Main Stage',
    statusTag: 'Verified on Ledger',
  },
  {
    id: 'cact_2',
    type: 'sponsor',
    title: 'Sponsor Match: Monster Energy',
    subtitle: 'Matched Sarah M.\'s tip at 100%',
    amount: '+$25.00',
    timeAgo: '22m ago',
    venue: 'The Main Stage',
    statusTag: 'Match Disbursed',
  },
  {
    id: 'cact_3',
    type: 'tip',
    title: 'Live Tip from Devon K.',
    subtitle: 'The Main Stage • Acoustic Showcase',
    amount: '+$15.00',
    timeAgo: '1h ago',
    fanName: 'Devon K.',
    message: 'Best acoustic set at The Main Stage this year!',
    venue: 'The Main Stage',
    statusTag: 'Verified on Ledger',
  },
  {
    id: 'cact_4',
    type: 'follow',
    title: 'New Follower: Liam Vance',
    subtitle: 'Liam Vance (@liamvance) followed your artist profile',
    timeAgo: '2h ago',
    statusTag: 'Fan Alert',
  },
  {
    id: 'cact_5',
    type: 'set',
    title: 'Stage Check-In Verified',
    subtitle: 'GPS Geofence confirmed entry at The Main Stage',
    timeAgo: '3h ago',
    venue: 'The Main Stage',
    statusTag: 'Live Beacon Active',
  },
  {
    id: 'cact_6',
    type: 'tip',
    title: 'Live Tip from Alex River',
    subtitle: 'The Main Stage • Acoustic Showcase',
    amount: '+$50.00',
    timeAgo: '3h ago',
    fanName: 'Alex River',
    message: 'Keep inspiring us man!',
    venue: 'The Main Stage',
    statusTag: 'Verified on Ledger',
  },
  {
    id: 'cact_7',
    type: 'payout',
    title: 'Stripe Express Payout Initiated',
    subtitle: 'Transfer to Chase Checking (•••• 4821)',
    amount: '$345.80',
    timeAgo: '1d ago',
    statusTag: 'In Transit',
  },
];

export default function CreatorActivityPage() {
  const [filter, setFilter] = useState<'All' | 'Tips' | 'Live Sets' | 'Followers' | 'Payouts'>('All');
  const [activities] = useState<CreatorActivityItem[]>(INITIAL_CREATOR_ACTIVITIES);

  const filtered = activities.filter((act) => {
    if (filter === 'All') return true;
    if (filter === 'Tips') return act.type === 'tip' || act.type === 'sponsor';
    if (filter === 'Live Sets') return act.type === 'set';
    if (filter === 'Followers') return act.type === 'follow';
    if (filter === 'Payouts') return act.type === 'payout';
    return true;
  });

  return (
    <div style={{ padding: '32px 40px', maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--cb-text-primary, var(--text-primary))' }}>
          Live Creator Activity
        </h1>
        <p style={{ color: 'var(--cb-text-secondary, var(--text-secondary))', fontSize: 14, margin: 0 }}>
          Real-time stream of incoming fan tips, stage check-ins, follower spikes, and automated Stripe payout transfers.
        </p>
      </div>

      {/* Metrics Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Tips This Week</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--cb-live-green, #059669)', marginTop: 4 }}>$485.00</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>+18% from last week</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Followers</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>1,420</div>
          <div style={{ fontSize: 12, color: '#A855F7', marginTop: 2 }}>+34 new fans tonight</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Sets Played</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>12 Sets</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Across 4 venues</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Pending Payout</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#60A5FA', marginTop: 4 }}>$165.50</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Next automatic sweep: Mon</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        {(['All', 'Tips', 'Live Sets', 'Followers', 'Payouts'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            style={{
              padding: '8px 18px',
              borderRadius: 9999,
              border: filter === tab ? '1px solid var(--accent-primary)' : '1px solid transparent',
              backgroundColor: filter === tab ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
              color: filter === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
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
          let iconBg = 'rgba(124, 58, 237, 0.2)';
          let iconColor = '#A855F7';

          if (item.type === 'tip') {
            icon = '💜';
            iconBg = 'rgba(0, 240, 118, 0.15)';
            iconColor = '#00F076';
          } else if (item.type === 'sponsor') {
            icon = '🤝';
            iconBg = 'rgba(236, 72, 153, 0.15)';
            iconColor = '#EC4899';
          } else if (item.type === 'set') {
            icon = '🎙️';
            iconBg = 'rgba(59, 130, 246, 0.15)';
            iconColor = '#60A5FA';
          } else if (item.type === 'follow') {
            icon = '❤️';
            iconBg = 'rgba(236, 72, 153, 0.15)';
            iconColor = '#EC4899';
          } else if (item.type === 'payout') {
            icon = '💳';
            iconBg = 'rgba(74, 222, 128, 0.15)';
            iconColor = '#4ADE80';
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

                  {item.message && (
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 6, fontStyle: 'italic' }}>
                      "{item.message}"
                    </div>
                  )}
                </div>
              </div>

              {item.amount && (
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--cb-live-green, #059669)', flexShrink: 0 }}>
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
