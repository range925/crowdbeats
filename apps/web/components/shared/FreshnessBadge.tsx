'use client';

import React from 'react';
import type { MetricFreshness, MetricSamplingMetadata } from '@crowdbeats/contracts';

export interface FreshnessBadgeProps {
  freshness: MetricFreshness;
  delaySeconds?: number;
  sampling?: MetricSamplingMetadata;
  calculatedAt?: string;
  className?: string;
}

export function FreshnessBadge({
  freshness,
  delaySeconds,
  sampling,
  calculatedAt,
  className,
}: FreshnessBadgeProps) {
  let label = 'REAL-TIME';
  let badgeColor = '#10B981';
  let badgeBg = 'rgba(16, 185, 129, 0.12)';
  let badgeBorder = 'rgba(16, 185, 129, 0.25)';
  let dotAnimation = 'cbLivePulse 2s ease-in-out infinite';
  let tooltip = 'Calculated in real-time from transactional event stream';

  if (freshness === 'DELAYED') {
    const minutes = delaySeconds ? Math.round(delaySeconds / 60) : 15;
    label = `DELAYED (~${minutes}m)`;
    badgeColor = '#D97706';
    badgeBg = 'rgba(245, 158, 11, 0.12)';
    badgeBorder = 'rgba(245, 158, 11, 0.28)';
    dotAnimation = 'none';
    tooltip = `Metric reflects rollup data with approximately ${minutes} minutes calculation delay`;
  } else if (freshness === 'ESTIMATED') {
    const moe = sampling?.marginOfErrorPct ? ` (±${sampling.marginOfErrorPct}%)` : '';
    label = `ESTIMATED${moe}`;
    badgeColor = '#0284C7';
    badgeBg = 'rgba(2, 132, 199, 0.12)';
    badgeBorder = 'rgba(2, 132, 199, 0.28)';
    dotAnimation = 'none';
    const conf = sampling?.confidenceLevel ? `${Math.round(sampling.confidenceLevel * 100)}% confidence` : '';
    tooltip = `Statistically sampled projection${conf ? ` with ${conf}` : ''}${sampling?.marginOfErrorPct ? ` and ±${sampling.marginOfErrorPct}% margin of error` : ''}`;
  }

  if (calculatedAt) {
    try {
      const timeStr = new Date(calculatedAt).toLocaleTimeString();
      tooltip += ` (As of ${timeStr})`;
    } catch {
      // ignore
    }
  }

  return (
    <span
      className={className}
      role="status"
      aria-label={`Metric freshness: ${label}`}
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 7px',
        borderRadius: 9999,
        background: badgeBg,
        border: `1px solid ${badgeBorder}`,
        color: badgeColor,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'var(--cb-font-display, -apple-system, sans-serif)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: badgeColor,
          display: 'inline-block',
          animation: dotAnimation,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
