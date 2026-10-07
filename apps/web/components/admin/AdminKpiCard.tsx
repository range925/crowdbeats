'use client';

import React from 'react';
import { ArrowUpRightIcon, ArrowDownRightIcon, AlertCircleIcon } from './AdminIcons';

export interface AdminKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  period?: string;
  countLabel?: string; // e.g. "4 / 28 failed" alongside percentages
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  isAdverse?: boolean; // When true, positive change is adverse (red), e.g. more failed payouts or open incidents
  icon?: React.ReactNode;
  accentColor?: string;
  tooltip?: string;
  sparklineData?: number[];
  onClick?: () => void;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const AdminKpiCard: React.FC<AdminKpiCardProps> = ({
  title,
  value,
  subtitle,
  period,
  countLabel,
  trend,
  isAdverse = false,
  icon,
  accentColor = 'var(--admin-accent-primary, #7C3AED)',
  tooltip,
  sparklineData,
  onClick,
  href,
  className = '',
  style,
}) => {
  // If adverse is true, invert the visual sentiment:
  // e.g., if trend.isPositive is true (number went up) but isAdverse is true, it is bad (error color)
  const isGood = trend ? (isAdverse ? !trend.isPositive : trend.isPositive) : true;

  const isClickable = Boolean(onClick || href);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    } else if (href) {
      window.location.href = href;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
      e.preventDefault();
      if (onClick) onClick();
      else if (href) window.location.href = href;
    }
  };

  return (
    <div
      title={tooltip}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      className={`admin-kpi-card ${isClickable ? 'admin-kpi-clickable' : ''} ${className}`.trim()}
      style={{
        background: 'var(--admin-surface-card, var(--surface-card, #FFFFFF))',
        padding: '18px 20px',
        borderRadius: 12,
        border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
        ...style,
      }}
    >
      {/* Top Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 10,
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--admin-text-secondary, var(--text-secondary, #64748B))',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </span>
            {period && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: 'var(--admin-surface-raised, #F1F5F9)',
                  color: 'var(--admin-text-tertiary, #94A3B8)',
                  textTransform: 'none',
                }}
              >
                {period}
              </span>
            )}
            {tooltip && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: 'var(--admin-text-tertiary, #94A3B8)',
                  cursor: 'help',
                }}
                title={tooltip}
                aria-label={`Definition: ${tooltip}`}
              >
                <AlertCircleIcon size={12} strokeWidth={2} />
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              marginTop: 4,
            }}
          >
            <div
              className="admin-tabular-nums"
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: 'var(--admin-text-primary, var(--text-primary, #0F172A))',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.15,
              }}
            >
              {value}
            </div>
            {countLabel && (
              <span
                className="admin-tabular-nums"
                style={{
                  fontSize: 12,
                  color: 'var(--admin-text-tertiary, #94A3B8)',
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {countLabel}
              </span>
            )}
          </div>
        </div>

        {icon && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--admin-surface-raised, var(--surface-raised, #F1F5F9))',
              border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      {/* Sparkline & Trend Footer Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 6,
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {trend && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: subtitle ? 2 : 0,
              }}
            >
              <span
                className="admin-tabular-nums"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 11,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  color: isGood
                    ? 'var(--admin-status-success, #10B981)'
                    : 'var(--admin-status-error, #EF4444)',
                  background: isGood
                    ? 'var(--admin-status-success-bg, rgba(16, 185, 129, 0.10))'
                    : 'var(--admin-status-error-bg, rgba(239, 68, 68, 0.10))',
                  border: `1px solid ${
                    isGood
                      ? 'rgba(16, 185, 129, 0.25)'
                      : 'rgba(239, 68, 68, 0.25)'
                  }`,
                  padding: '2px 6px',
                  borderRadius: 6,
                }}
              >
                {trend.isPositive ? (
                  <ArrowUpRightIcon size={12} strokeWidth={2.2} />
                ) : (
                  <ArrowDownRightIcon size={12} strokeWidth={2.2} />
                )}
                <span>{trend.value}</span>
              </span>
              {trend.label && (
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--admin-text-tertiary, var(--text-tertiary, #64748B))',
                  }}
                >
                  {trend.label}
                </span>
              )}
            </div>
          )}
          {subtitle && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--admin-text-tertiary, var(--text-tertiary, #64748B))',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {sparklineData && sparklineData.length > 1 && (
          <div style={{ flexShrink: 0 }}>
            <svg
              width="76"
              height="26"
              style={{ overflow: 'visible', display: 'block' }}
              aria-hidden="true"
            >
              {(() => {
                const max = Math.max(...sparklineData);
                const min = Math.min(...sparklineData);
                const range = max - min || 1;
                const points = sparklineData
                  .map((d, i) => {
                    const x = (i / (sparklineData.length - 1)) * 76;
                    const y = 23 - ((d - min) / range) * 19;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ');
                return (
                  <polyline
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                );
              })()}
            </svg>
          </div>
        )}
      </div>

      <style>{`
        .admin-kpi-clickable:hover {
          border-color: var(--admin-accent-primary, #7C3AED) !important;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.12) !important;
          transform: translateY(-1px);
        }
        .admin-kpi-clickable:focus-visible {
          outline: 2px solid var(--admin-accent-primary, #7C3AED);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};
