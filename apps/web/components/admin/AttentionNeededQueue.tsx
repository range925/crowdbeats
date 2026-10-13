'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
  ShieldBadgeIcon,
  CreditCardIcon,
  ZapIcon,
  RefreshIcon,
  CheckCircleIcon,
  SupportIcon,
} from './AdminIcons';

export interface ExceptionQueueItem {
  id: string;
  category: 'MODERATION' | 'PAYOUT' | 'DISPUTE' | 'WEBHOOK' | 'SUPPORT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  description: string;
  timestamp: string;
  actionLabel: string;
  actionHref: string;
}

const DEFAULT_EXCEPTIONS: ExceptionQueueItem[] = [
  {
    id: 'exc_mod_9182',
    category: 'MODERATION',
    severity: 'CRITICAL',
    title: 'Flagged Live Audio Stream #stg_9182',
    description: '3 acoustic copyright matches detected on live set stream. Manual review required.',
    timestamp: '4m ago',
    actionLabel: 'Review Stream',
    actionHref: '/admin/support',
  },
  {
    id: 'exc_pay_4412',
    category: 'PAYOUT',
    severity: 'HIGH',
    title: '3 Payouts Exceeding $1,000 Threshold',
    description: 'Creator payouts totaling $4,120.00 awaiting compliance approval before ACH release.',
    timestamp: '18m ago',
    actionLabel: 'Audit Payouts',
    actionHref: '/admin/finance',
  },
  {
    id: 'exc_dsp_0199',
    category: 'DISPUTE',
    severity: 'HIGH',
    title: 'Stripe Radar Chargeback #ch_8912',
    description: 'Cardholder inquiry for $140.00 tip authorization. 48-hour evidence response window.',
    timestamp: '42m ago',
    actionLabel: 'View Ledger',
    actionHref: '/admin/finance',
  },
  {
    id: 'exc_whk_7710',
    category: 'WEBHOOK',
    severity: 'MEDIUM',
    title: 'Geofence Ingress Webhook Timeout',
    description: 'Venue sensor gateway returned 504 Gateway Timeout (3 retries recorded).',
    timestamp: '1h ago',
    actionLabel: 'Inspect Telemetry',
    actionHref: '/admin/platform',
  },
];

export interface AttentionNeededQueueProps {
  items?: ExceptionQueueItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const AttentionNeededQueue: React.FC<AttentionNeededQueueProps> = ({
  items = DEFAULT_EXCEPTIONS,
  loading = false,
  error = null,
  onRetry,
  className = '',
  style,
}) => {
  const criticalCount = items.filter((i) => i.severity === 'CRITICAL').length;

  return (
    <div
      className={`admin-attention-queue ${className}`.trim()}
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
      {/* Header */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircleIcon
              size={18}
              strokeWidth={2.2}
              style={{ color: 'var(--admin-status-error, #EF4444)' }}
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
              Attention Needed
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              className="admin-tabular-nums"
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: loading
                  ? 'var(--admin-text-secondary, #64748B)'
                  : error
                  ? 'var(--admin-status-error, #EF4444)'
                  : items.length > 0
                  ? 'var(--admin-status-error, #EF4444)'
                  : 'var(--admin-status-success, #10B981)',
                background: loading
                  ? 'var(--admin-surface-raised, #F1F5F9)'
                  : error
                  ? 'var(--admin-status-error-bg, rgba(239, 68, 68, 0.10))'
                  : items.length > 0
                  ? 'var(--admin-status-error-bg, rgba(239, 68, 68, 0.10))'
                  : 'var(--admin-status-success-bg, rgba(16, 185, 129, 0.10))',
                border: loading
                  ? '1px solid var(--admin-border-subtle, #E2E8F0)'
                  : error
                  ? '1px solid rgba(239, 68, 68, 0.25)'
                  : items.length > 0
                  ? '1px solid rgba(239, 68, 68, 0.25)'
                  : '1px solid rgba(16, 185, 129, 0.25)',
                padding: '2px 8px',
                borderRadius: 12,
              }}
            >
              {loading
                ? 'Checking...'
                : error
                ? 'Error'
                : items.length === 0
                ? 'Clear (0)'
                : `${items.length} Pending ${criticalCount > 0 ? `(${criticalCount} Urgent)` : ''}`}
            </span>
          </div>
        </div>

        <p
          style={{
            fontSize: 12,
            color: 'var(--admin-text-secondary, var(--text-secondary, #64748B))',
            margin: '0 0 14px 0',
          }}
        >
          Actionable exceptions across moderation queues, payouts, and gateways.
        </p>

        {/* Exception Items List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--admin-surface-raised, var(--surface-raised, #F8FAFC))',
                  border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
                  borderLeft: '3px solid var(--admin-border-subtle, #E2E8F0)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 110,
                      height: 14,
                      background: 'var(--admin-border-subtle, #E2E8F0)',
                      borderRadius: 4,
                      opacity: 0.6,
                    }}
                  />
                  <div
                    style={{
                      width: 48,
                      height: 12,
                      background: 'var(--admin-border-subtle, #E2E8F0)',
                      borderRadius: 4,
                      opacity: 0.6,
                    }}
                  />
                </div>
                <div
                  style={{
                    width: '65%',
                    height: 14,
                    background: 'var(--admin-border-subtle, #E2E8F0)',
                    borderRadius: 4,
                    opacity: 0.8,
                  }}
                />
                <div
                  style={{
                    width: '88%',
                    height: 12,
                    background: 'var(--admin-border-subtle, #E2E8F0)',
                    borderRadius: 4,
                    opacity: 0.5,
                  }}
                />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: 'var(--admin-status-error, #EF4444)',
              fontSize: 13,
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircleIcon size={24} style={{ color: 'var(--admin-status-error, #EF4444)' }} />
            <div>
              <div style={{ fontWeight: 700 }}>Failed to load operational exceptions</div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', marginTop: 2 }}>{error}</div>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: 'var(--admin-surface-card, #FFFFFF)',
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  color: 'var(--admin-text-primary, #0F172A)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RefreshIcon size={12} />
                <span>Retry Queue</span>
              </button>
            )}
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: '32px 20px',
              textAlign: 'center',
              color: 'var(--admin-text-secondary, #64748B)',
              fontSize: 13,
              borderRadius: 8,
              background: 'var(--admin-surface-raised, #F8FAFC)',
              border: '1px dashed var(--admin-border-subtle, #E2E8F0)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--admin-status-success-bg, rgba(16, 185, 129, 0.10))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--admin-status-success, #10B981)',
              }}
            >
              <CheckCircleIcon size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)' }}>
                All queues clear
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', marginTop: 2 }}>
                No pending exceptions requiring administrator attention.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item) => {
              const isCritical = item.severity === 'CRITICAL';
              const isHigh = item.severity === 'HIGH';

              const badgeBorder = isCritical
                ? 'rgba(239, 68, 68, 0.3)'
                : isHigh
                ? 'rgba(245, 158, 11, 0.3)'
                : 'var(--admin-border-subtle, #E2E8F0)';

              const badgeColor = isCritical
                ? 'var(--admin-status-error, #EF4444)'
                : isHigh
                ? 'var(--admin-status-warning, #F59E0B)'
                : 'var(--admin-text-tertiary, #64748B)';

              const badgeBg = isCritical
                ? 'var(--admin-status-error-bg, rgba(239, 68, 68, 0.08))'
                : isHigh
                ? 'var(--admin-status-warning-bg, rgba(245, 158, 11, 0.08))'
                : 'var(--admin-surface-raised, #F1F5F9)';

              const CategoryIcon =
                item.category === 'MODERATION'
                  ? ShieldBadgeIcon
                  : item.category === 'PAYOUT' || item.category === 'DISPUTE'
                  ? CreditCardIcon
                  : item.category === 'SUPPORT'
                  ? SupportIcon
                  : ZapIcon;

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--admin-surface-raised, var(--surface-raised, #F8FAFC))',
                    border: `1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))`,
                    borderLeft: `3px solid ${badgeColor}`,
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    transition: 'background 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <CategoryIcon size={13} style={{ color: badgeColor, flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: badgeColor,
                        }}
                      >
                        {item.category}
                      </span>
                      <span
                        style={{
                          color: 'var(--admin-text-tertiary, #94A3B8)',
                          fontSize: 10,
                        }}
                      >
                        ·
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: badgeColor,
                          background: badgeBg,
                          border: `1px solid ${badgeBorder}`,
                          padding: '1px 5px',
                          borderRadius: 4,
                        }}
                      >
                        {item.severity}
                      </span>
                    </div>

                    <span
                      className="admin-tabular-nums"
                      style={{
                        fontSize: 10,
                        color: 'var(--admin-text-tertiary, #64748B)',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                      }}
                    >
                      {item.timestamp}
                    </span>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--admin-text-primary, var(--text-primary, #0F172A))',
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--admin-text-secondary, var(--text-secondary, #64748B))',
                        marginTop: 2,
                        lineHeight: 1.35,
                      }}
                    >
                      {item.description}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: 2,
                    }}
                  >
                    <Link
                      href={item.actionHref}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--admin-accent-primary, #7C3AED)',
                        textDecoration: 'none',
                      }}
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronRightIcon size={12} strokeWidth={2.2} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Quick Links to Support, CRM, and Finance */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 11,
        }}
      >
        <span style={{ color: 'var(--admin-text-tertiary, #64748B)', fontWeight: 500 }}>
          Direct Queue Links:
        </span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link
            href="/admin/support"
            style={{
              color: 'var(--admin-text-secondary, #475569)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Support
          </Link>
          <span style={{ color: 'var(--admin-border-subtle, #CBD5E1)' }}>·</span>
          <Link
            href="/admin/finance"
            style={{
              color: 'var(--admin-text-secondary, #475569)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Finance
          </Link>
          <span style={{ color: 'var(--admin-border-subtle, #CBD5E1)' }}>·</span>
          <Link
            href="/admin/crm"
            style={{
              color: 'var(--admin-text-secondary, #475569)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            CRM
          </Link>
        </div>
      </div>
    </div>
  );
};
