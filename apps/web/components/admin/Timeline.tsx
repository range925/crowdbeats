'use client';

import React from 'react';
import { ClockIcon, CheckCircleIcon, AlertTriangleIcon } from './AdminIcons';

export interface TimelineEvent {
  id: string;
  timestamp: string | number | Date;
  actor: {
    displayName: string;
    email?: string;
    role?: string;
  };
  action: string;
  details?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  diff?: {
    field: string;
    before: any;
    after: any;
  }[];
}

export interface TimelineProps {
  events: TimelineEvent[];
  emptyMessage?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  emptyMessage = 'No historical events recorded.',
  className = '',
  style,
}) => {
  if (events.length === 0) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: 'var(--admin-text-tertiary, #94A3B8)',
          fontSize: 13,
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  const formatUtc = (ts: string | number | Date) => {
    try {
      const d = new Date(ts);
      return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    } catch {
      return String(ts);
    }
  };

  return (
    <div
      className={`admin-timeline ${className}`.trim()}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        paddingLeft: 24,
        borderLeft: '2px solid var(--admin-border-subtle, #E2E8F0)',
        ...style,
      }}
    >
      {events.map((ev, idx) => {
        const isSuccess = ev.status === 'success' || !ev.status;
        const isError = ev.status === 'error';
        const isWarning = ev.status === 'warning';

        const dotColor = isError
          ? '#EF4444'
          : isWarning
          ? '#F59E0B'
          : isSuccess
          ? '#10B981'
          : 'var(--admin-accent-primary, #7C3AED)';

        return (
          <div
            key={ev.id || idx}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {/* Timeline Dot */}
            <div
              style={{
                position: 'absolute',
                left: -31,
                top: 2,
                width: 12,
                height: 12,
                borderRadius: 9999,
                background: dotColor,
                border: '2px solid var(--admin-surface-card, #FFFFFF)',
                boxShadow: `0 0 0 2px ${dotColor}33`,
              }}
              aria-hidden="true"
            />

            {/* Header: Actor + Timestamp */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--admin-text-primary, #0F172A)',
                  }}
                >
                  {ev.action}
                </span>
                {ev.actor.role && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(124, 58, 237, 0.08)',
                      color: 'var(--admin-accent-primary, #7C3AED)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {ev.actor.role.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-tertiary, #94A3B8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <ClockIcon size={12} />
                <span>{formatUtc(ev.timestamp)}</span>
              </div>
            </div>

            {/* Actor Meta */}
            <div style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)' }}>
              by <strong>{ev.actor.displayName}</strong>{' '}
              {ev.actor.email && <span style={{ opacity: 0.8 }}>({ev.actor.email})</span>}
            </div>

            {/* Details */}
            {ev.details && (
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--admin-text-secondary, #64748B)',
                  margin: '2px 0 0',
                  lineHeight: 1.4,
                  background: 'var(--admin-surface-raised, #F8FAFC)',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                }}
              >
                {ev.details}
              </p>
            )}

            {/* Optional Diffs */}
            {ev.diff && ev.diff.length > 0 && (
              <div
                style={{
                  marginTop: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {ev.diff.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      padding: '4px 8px',
                      background: 'rgba(0, 0, 0, 0.03)',
                      borderRadius: 4,
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <span style={{ color: 'var(--admin-text-secondary, #64748B)', fontWeight: 600 }}>
                      {d.field}:
                    </span>
                    <span style={{ color: '#EF4444', textDecoration: 'line-through' }}>
                      {String(d.before)}
                    </span>
                    <span>→</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>{String(d.after)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
