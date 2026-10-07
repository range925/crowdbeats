'use client';

import React from 'react';
import {
  ActivityIcon,
  DollarSignIcon,
  LiveRadarIcon,
  CampaignsIcon,
  CreditCardIcon,
  ShieldBadgeIcon,
  LivePulseDot,
} from './AdminIcons';

export interface PulseEvent {
  id: string;
  type: 'TIP' | 'CHECKIN' | 'CAMPAIGN' | 'PAYOUT' | 'SECURITY';
  actor: string;
  description: string;
  amountDollars?: number;
  timeAgo: string;
  badgeColor?: string;
  status?: string;
}

const DEFAULT_EVENTS: PulseEvent[] = [
  {
    id: 'p1',
    type: 'TIP',
    actor: 'Fan @sarah_m',
    description: 'Tipped $25.00 to Elena Cruz at Sunset Lounge',
    amountDollars: 25.0,
    timeAgo: '2m ago',
    status: 'Settled',
  },
  {
    id: 'p2',
    type: 'CHECKIN',
    actor: 'The Midnight Echoes',
    description: 'Stage check-in confirmed at The Casbah (40/30/30 split)',
    timeAgo: '8m ago',
    status: 'Broadcasting',
  },
  {
    id: 'p3',
    type: 'CAMPAIGN',
    actor: 'Backer @alex_k',
    description: 'Pledged $100.00 to West Coast Tour Album crowdfunding',
    amountDollars: 100.0,
    timeAgo: '14m ago',
    status: 'Captured',
  },
  {
    id: 'p4',
    type: 'PAYOUT',
    actor: 'David Naufahu',
    description: 'Stripe Express direct payout of $480.00 to Chase (••••4821)',
    amountDollars: 480.0,
    timeAgo: '22m ago',
    status: 'Processed',
  },
  {
    id: 'p5',
    type: 'SECURITY',
    actor: 'System WAF',
    description: 'Rate limit blocked 42 rapid requests from 198.51.100.4',
    timeAgo: '35m ago',
    status: 'Mitigated',
  },
];

interface LivePlatformPulseStreamProps {
  events?: PulseEvent[];
  className?: string;
  style?: React.CSSProperties;
}

export const LivePlatformPulseStream: React.FC<LivePlatformPulseStreamProps> = ({
  events = DEFAULT_EVENTS,
  className = '',
  style,
}) => {
  const getEventMeta = (type: PulseEvent['type']) => {
    switch (type) {
      case 'TIP':
        return {
          icon: DollarSignIcon,
          color: 'var(--admin-status-success, #10B981)',
          bg: 'var(--admin-status-success-bg, rgba(16, 185, 129, 0.10))',
          border: 'rgba(16, 185, 129, 0.25)',
          label: 'TIP',
        };
      case 'CHECKIN':
        return {
          icon: LiveRadarIcon,
          color: 'var(--admin-accent-primary, #7C3AED)',
          bg: 'var(--admin-accent-subtle, rgba(124, 58, 237, 0.10))',
          border: 'rgba(124, 58, 237, 0.25)',
          label: 'STAGE',
        };
      case 'CAMPAIGN':
        return {
          icon: CampaignsIcon,
          color: 'var(--admin-status-info, #3B82F6)',
          bg: 'var(--admin-status-info-bg, rgba(59, 130, 246, 0.10))',
          border: 'rgba(59, 130, 246, 0.25)',
          label: 'PLEDGE',
        };
      case 'PAYOUT':
        return {
          icon: CreditCardIcon,
          color: '#8B5CF6',
          bg: 'rgba(139, 92, 246, 0.10)',
          border: 'rgba(139, 92, 246, 0.25)',
          label: 'PAYOUT',
        };
      case 'SECURITY':
        return {
          icon: ShieldBadgeIcon,
          color: 'var(--admin-status-warning, #F59E0B)',
          bg: 'var(--admin-status-warning-bg, rgba(245, 158, 11, 0.10))',
          border: 'rgba(245, 158, 11, 0.25)',
          label: 'WAF',
        };
    }
  };

  return (
    <div
      className={`admin-pulse-stream ${className}`.trim()}
      style={{
        background: 'var(--admin-surface-card, var(--surface-card, #FFFFFF))',
        padding: '22px 24px',
        borderRadius: 12,
        border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
        boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      <div>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ActivityIcon
              size={18}
              strokeWidth={2.2}
              style={{ color: 'var(--admin-accent-primary, #7C3AED)' }}
            />
            <h2
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--admin-text-primary, var(--text-primary, #0F172A))',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Live Telemetry & Activity Pulse
            </h2>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--admin-status-success-bg, rgba(16, 185, 129, 0.10))',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '3px 10px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--admin-status-success, #10B981)',
              letterSpacing: '0.03em',
            }}
          >
            <LivePulseDot size={7} color="var(--admin-status-success, #10B981)" />
            <span>STREAMING LIVE</span>
          </div>
        </div>

        <p
          style={{
            fontSize: 12,
            color: 'var(--admin-text-secondary, var(--text-secondary, #64748B))',
            margin: '0 0 16px 0',
          }}
        >
          Multi-tenant event telemetry stream across live stages, tip splits, and security perimeters.
        </p>

        {/* Event List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map((ev) => {
            const meta = getEventMeta(ev.type);
            const Icon = meta.icon;

            return (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--admin-surface-raised, var(--surface-raised, #F8FAFC))',
                  border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
                  gap: 12,
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: meta.bg,
                      border: `1px solid ${meta.border}`,
                      color: meta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} strokeWidth={2.2} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: meta.color,
                          background: meta.bg,
                          padding: '1px 6px',
                          borderRadius: 4,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {meta.label}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: 'var(--admin-text-primary, var(--text-primary, #0F172A))',
                          fontSize: 13,
                        }}
                      >
                        {ev.actor}
                      </span>
                      {ev.status && (
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--admin-text-tertiary, #94A3B8)',
                            fontWeight: 500,
                          }}
                        >
                          · {ev.status}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        color: 'var(--admin-text-secondary, var(--text-secondary, #64748B))',
                        fontSize: 12,
                        marginTop: 2,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ev.description}
                    </div>
                  </div>
                </div>

                <div
                  className="admin-tabular-nums"
                  style={{
                    fontSize: 11,
                    color: 'var(--admin-text-tertiary, var(--text-tertiary, #64748B))',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                    textAlign: 'right',
                  }}
                >
                  {ev.timeAgo}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 10,
          borderTop: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: 'var(--admin-text-tertiary, var(--text-tertiary, #64748B))',
        }}
      >
        <span>WebSocket Concurrency: 120 connected clients</span>
        <span
          className="admin-tabular-nums"
          style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
        >
          Avg Latency: 18ms
        </span>
      </div>
    </div>
  );
};
