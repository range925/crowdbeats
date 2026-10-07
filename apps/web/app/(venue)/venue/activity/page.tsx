'use client';

/**
 * Crowdbeats V2 — Venue Operations & Stage Activity
 * Route: /venue/activity
 *
 * Dedicated live operations feed for Venues:
 *   - Performer GPS geofence check-ins
 *   - Stage set started & completed logs
 *   - Live QR code traffic & scans
 *   - Stage tip volume aggregations
 */

import React, { useState } from 'react';

interface VenueActivityItem {
  id: string;
  type: 'checkin' | 'stage' | 'qr' | 'tip_volume';
  title: string;
  subtitle: string;
  metric?: string;
  timeAgo: string;
  performerName?: string;
  stageName?: string;
  statusTag?: string;
}

const INITIAL_VENUE_ACTIVITIES: VenueActivityItem[] = [
  {
    id: 'vact_1',
    type: 'checkin',
    title: 'Performer GPS Check-In',
    subtitle: 'Jake Rios entered Main Stage Geofence (100m radius)',
    timeAgo: '12m ago',
    performerName: 'Jake Rios',
    stageName: 'Main Acoustic Stage',
    statusTag: 'Live Beacon ON',
  },
  {
    id: 'vact_2',
    type: 'qr',
    title: 'High Table QR Scan Traffic',
    subtitle: '142 audience scans recorded on Patio Stage table stands',
    metric: '142 Scans',
    timeAgo: '35m ago',
    stageName: 'Patio Lounge Stage',
    statusTag: 'Peak Velocity',
  },
  {
    id: 'vact_3',
    type: 'tip_volume',
    title: 'Stage Tips Volume Milestone',
    subtitle: 'Surpassed $500 in total performer tips processed through venue tonight',
    metric: '$520.00 Total',
    timeAgo: '1h ago',
    statusTag: 'Venue Milestone',
  },
  {
    id: 'vact_4',
    type: 'stage',
    title: 'Stage Set Completed',
    subtitle: 'The Sunsets concluded 90m headline performance',
    timeAgo: '2h ago',
    performerName: 'The Sunsets',
    stageName: 'Main Stage',
    statusTag: 'Set Logged',
  },
  {
    id: 'vact_5',
    type: 'checkin',
    title: 'Performer GPS Check-In',
    subtitle: 'Elena Vance checked in via Sound Booth beacon',
    timeAgo: '4h ago',
    performerName: 'Elena Vance',
    stageName: 'Jazz Lounge',
    statusTag: 'Sound Check Ready',
  },
];

export default function VenueActivityPage() {
  const [filter, setFilter] = useState<'All' | 'Check-Ins' | 'Live Stages' | 'QR Traffic' | 'Tips Volume'>('All');
  const [activities] = useState<VenueActivityItem[]>(INITIAL_VENUE_ACTIVITIES);

  const filtered = activities.filter((act) => {
    if (filter === 'All') return true;
    if (filter === 'Check-Ins') return act.type === 'checkin';
    if (filter === 'Live Stages') return act.type === 'stage';
    if (filter === 'QR Traffic') return act.type === 'qr';
    if (filter === 'Tips Volume') return act.type === 'tip_volume';
    return true;
  });

  return (
    <div style={{ padding: '32px 40px', maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--cb-text-primary, var(--text-primary))' }}>
          Venue Stage Operations &amp; Activity
        </h1>
        <p style={{ color: 'var(--cb-text-secondary, var(--text-secondary))', fontSize: 14, margin: 0 }}>
          Real-time log of musician GPS arrivals, stage schedule status, anti-replay QR scan activity, and stage tip volume.
        </p>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Active Performers</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--cb-live-green, #059669)', marginTop: 4 }}>3 Live</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Checked into geofence</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Stage Tip Flow</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#60A5FA', marginTop: 4 }}>$840.00</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Tonight across stages</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>QR Scans Tonight</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>312 Scans</div>
          <div style={{ fontSize: 12, color: 'var(--cb-live-green, #059669)', marginTop: 2 }}>+28% vs last Saturday</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Stages Active</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#A855F7', marginTop: 4 }}>2 Stages</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Main &amp; Patio Stages</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        {(['All', 'Check-Ins', 'Live Stages', 'QR Traffic', 'Tips Volume'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            style={{
              padding: '8px 18px',
              borderRadius: 9999,
              border: filter === tab ? '1px solid #3B82F6' : '1px solid transparent',
              backgroundColor: filter === tab ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: filter === tab ? '#60A5FA' : 'var(--text-secondary)',
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
          let iconBg = 'rgba(59, 130, 246, 0.15)';
          let iconColor = '#60A5FA';

          if (item.type === 'checkin') {
            icon = '📍';
            iconBg = 'rgba(0, 240, 118, 0.15)';
            iconColor = '#00F076';
          } else if (item.type === 'qr') {
            icon = '📱';
            iconBg = 'rgba(168, 85, 247, 0.15)';
            iconColor = '#A855F7';
          } else if (item.type === 'stage') {
            icon = '🎭';
            iconBg = 'rgba(59, 130, 246, 0.15)';
            iconColor = '#60A5FA';
          } else if (item.type === 'tip_volume') {
            icon = '💰';
            iconBg = 'rgba(250, 204, 21, 0.15)';
            iconColor = '#FACC15';
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

              {item.metric && (
                <div style={{ fontWeight: 800, fontSize: 16, color: '#60A5FA', flexShrink: 0 }}>
                  {item.metric}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
