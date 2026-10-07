'use client';

import React from 'react';
import { LivePulseDot, RefreshIcon } from './AdminIcons';

export interface FreshnessLabelProps {
  lastUpdated?: Date | string | number;
  isLive?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isStale?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const FreshnessLabel: React.FC<FreshnessLabelProps> = ({
  lastUpdated,
  isLive = true,
  onRefresh,
  isRefreshing = false,
  isStale = false,
  className = '',
  style,
}) => {
  const getLabel = () => {
    if (!lastUpdated) return 'Updated just now';
    if (typeof lastUpdated === 'string') return lastUpdated;
    try {
      const d = new Date(lastUpdated);
      const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diffSec < 10) return 'Updated just now';
      if (diffSec < 60) return `Updated ${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      return `Updated ${diffMin}m ago`;
    } catch {
      return 'Updated recently';
    }
  };

  return (
    <div
      className={`admin-freshness-label ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--admin-surface-card, #FFFFFF)',
        border: '1px solid var(--admin-border-subtle, #E2E8F0)',
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 12,
        color: isStale ? '#D97706' : 'var(--admin-text-secondary, #64748B)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <LivePulseDot
          size={6}
          color={isStale ? '#F59E0B' : isLive ? '#10B981' : '#94A3B8'}
        />
        <span style={{ fontWeight: 500 }}>
          {isStale ? 'Data may be stale' : getLabel()}
        </span>
      </div>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--admin-text-tertiary, #94A3B8)',
          }}
          title="Refresh operational telemetry"
          aria-label="Refresh operational telemetry"
        >
          <RefreshIcon
            size={12}
            className={isRefreshing ? 'admin-spin' : ''}
          />
        </button>
      )}

      <style>{`
        @keyframes adminSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .admin-spin {
          animation: adminSpin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
