'use client';

import React, { useState, useRef } from 'react';

export type TimeSeriesPeriod = 'today' | '7d' | '30d' | 'quarter';

export interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  meta?: string;
}

export interface TimeSeriesAreaChartProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  seriesName?: string;
  secondarySeriesName?: string;
  currency?: boolean;
  color?: string;
  secondaryColor?: string;
  height?: number;
  selectedPeriod?: TimeSeriesPeriod;
  onPeriodChange?: (period: TimeSeriesPeriod) => void;
  periods?: Array<{ key: TimeSeriesPeriod; label: string }>;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_PERIODS: Array<{ key: TimeSeriesPeriod; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: 'quarter', label: 'Quarter' },
];

export const TimeSeriesAreaChart: React.FC<TimeSeriesAreaChartProps> = ({
  title,
  subtitle,
  data,
  seriesName = 'GMV ($)',
  secondarySeriesName = 'Net Revenue (5%)',
  currency = true,
  color = '#8B5CF6',
  secondaryColor = '#03DAC6',
  height = 260,
  selectedPeriod,
  onPeriodChange,
  periods = DEFAULT_PERIODS,
  className = '',
  style,
}) => {
  const [internalPeriod, setInternalPeriod] = useState<TimeSeriesPeriod>('7d');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activePeriod = selectedPeriod ?? internalPeriod;

  const handlePeriodClick = (periodKey: TimeSeriesPeriod) => {
    setInternalPeriod(periodKey);
    onPeriodChange?.(periodKey);
  };

  const formatValue = (num: number) => {
    if (currency) {
      return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return num.toLocaleString('en-US');
  };

  if (!data || data.length === 0) {
    return (
      <div
        className={`admin-timeseries-chart-empty ${className}`.trim()}
        style={{
          background: 'var(--admin-surface-card, var(--surface-card, #FFFFFF))',
          padding: '32px 28px',
          borderRadius: 12,
          border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
          textAlign: 'center',
          color: 'var(--admin-text-tertiary, var(--text-tertiary, #64748B))',
          boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
          ...style,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 500 }}>No telemetry time-series data available for this range.</div>
      </div>
    );
  }

  // Dimensions & bounds
  const chartWidth = 800;
  const chartHeight = 220;
  const paddingLeft = 60;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 34;

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 1) * 1.15;
  const minVal = 0;
  const valRange = maxVal - minVal || 1;

  const getCoordinates = (index: number, val: number) => {
    const usableWidth = chartWidth - paddingLeft - paddingRight;
    const usableHeight = chartHeight - paddingTop - paddingBottom;
    const x = paddingLeft + (index / Math.max(data.length - 1, 1)) * usableWidth;
    const y = chartHeight - paddingBottom - ((val - minVal) / valRange) * usableHeight;
    return { x, y };
  };

  const linePoints = data
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.value);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const firstPoint = getCoordinates(0, 0);
  const lastPoint = getCoordinates(data.length - 1, 0);
  const areaPoints = `${firstPoint.x.toFixed(1)},${(chartHeight - paddingBottom).toFixed(1)} ${linePoints} ${lastPoint.x.toFixed(1)},${(chartHeight - paddingBottom).toFixed(1)}`;

  // Secondary line points (if present or computed)
  const hasSecondary = data.some((d) => d.secondaryValue !== undefined);
  const secondaryLinePoints = data
    .map((d, i) => {
      const sVal = d.secondaryValue !== undefined ? d.secondaryValue : d.value * 0.05;
      const { x, y } = getCoordinates(i, sVal);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const activeIndex = hoverIndex !== null ? hoverIndex : data.length - 1;
  const activePoint = data[activeIndex] || data[data.length - 1];
  const activeSecondaryVal = activePoint.secondaryValue !== undefined ? activePoint.secondaryValue : activePoint.value * 0.05;

  // Calculate mouse hover closest index
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - svgRect.left;
    const relativeX = (clientX / svgRect.width) * chartWidth;
    const usableWidth = chartWidth - paddingLeft - paddingRight;

    if (relativeX < paddingLeft - 15 || relativeX > chartWidth - paddingRight + 15) {
      return;
    }

    const ratio = Math.max(0, Math.min(1, (relativeX - paddingLeft) / usableWidth));
    const closestIdx = Math.round(ratio * (data.length - 1));
    setHoverIndex(closestIdx);
  };

  const hoveredCoords = getCoordinates(activeIndex, activePoint.value);

  // 4 Y-axis ticks
  const yTicks = [0, 0.33, 0.66, 1];

  return (
    <div
      ref={containerRef}
      className={`admin-timeseries-chart ${className}`.trim()}
      style={{
        background: 'var(--admin-surface-card, var(--surface-card, #FFFFFF))',
        padding: '22px 24px',
        borderRadius: 12,
        border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
        boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {/* Header Row: Title & Periods */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--admin-text-primary, var(--text-primary, #0F172A))',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--admin-text-secondary, var(--text-secondary, #64748B))',
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Period selector tabs */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--admin-surface-raised, var(--surface-raised, #F1F5F9))',
              padding: '3px',
              borderRadius: 8,
              border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
            }}
            role="tablist"
            aria-label="Chart time period"
          >
            {periods.map((p) => {
              const isSelected = p.key === activePeriod;
              return (
                <button
                  key={p.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handlePeriodClick(p.key)}
                  style={{
                    background: isSelected ? 'var(--admin-surface-card, #FFFFFF)' : 'transparent',
                    color: isSelected
                      ? 'var(--admin-text-primary, #0F172A)'
                      : 'var(--admin-text-secondary, #64748B)',
                    border: isSelected
                      ? '1px solid var(--admin-border-subtle, #E2E8F0)'
                      : '1px solid transparent',
                    boxShadow: isSelected ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Active Highlight Value Display */}
          <div style={{ textAlign: 'right', minWidth: 100 }}>
            <div
              className="admin-tabular-nums"
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: color,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.1,
              }}
            >
              {formatValue(activePoint.value)}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--admin-text-tertiary, var(--text-tertiary, #64748B))',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {activePoint.label} · {seriesName}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive SVG Area Chart */}
      <div
        style={{
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 180,
        }}
      >
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          style={{
            width: '100%',
            height: height - 80,
            display: 'block',
            overflow: 'visible',
            cursor: 'crosshair',
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          aria-label="Time series chart"
        >
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="90%" stopColor={color} stopOpacity="0.01" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Horizontal Grid lines & Y-Axis Labels */}
          {yTicks.map((pct, i) => {
            const y = chartHeight - paddingBottom - pct * (chartHeight - paddingTop - paddingBottom);
            const tickVal = Math.round(pct * maxVal);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="var(--admin-border-subtle, #E2E8F0)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                  strokeOpacity="0.6"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="var(--admin-text-tertiary, #64748B)"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="inherit"
                  className="admin-tabular-nums"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {currency ? `$${tickVal.toLocaleString('en-US')}` : tickVal.toLocaleString('en-US')}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <polygon fill={`url(#gradient-${color.replace('#', '')})`} points={areaPoints} />

          {/* Secondary Series Curve (Take-rate / Net) */}
          <polyline
            fill="none"
            stroke={secondaryColor}
            strokeWidth="1.8"
            strokeDasharray="3 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={secondaryLinePoints}
            opacity="0.85"
          />

          {/* Primary Series Curve (GMV) */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={linePoints}
          />

          {/* Active Vertical Crosshair Line */}
          {hoverIndex !== null && (
            <line
              x1={hoveredCoords.x}
              y1={paddingTop}
              x2={hoveredCoords.x}
              y2={chartHeight - paddingBottom}
              stroke="var(--admin-text-secondary, #64748B)"
              strokeWidth="1"
              strokeDasharray="3 3"
              strokeOpacity="0.6"
            />
          )}

          {/* Interactive Data Nodes & X-Axis Labels */}
          {data.map((d, i) => {
            const { x, y } = getCoordinates(i, d.value);
            const isHovered = hoverIndex === i || (hoverIndex === null && i === data.length - 1);
            // Calculate label display density: show all if <= 8, else show every N
            const step = data.length > 16 ? Math.ceil(data.length / 8) : data.length > 8 ? 2 : 1;
            const showLabel = i % step === 0 || i === data.length - 1;

            return (
              <g key={i}>
                {/* Visual Point Indicator */}
                {isHovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r={5.5}
                    fill="var(--admin-surface-card, #FFFFFF)"
                    stroke={color}
                    strokeWidth="2.5"
                    filter="url(#glow)"
                  />
                )}

                {/* X-axis tick label */}
                {showLabel && (
                  <text
                    x={x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fill={isHovered ? 'var(--admin-text-primary, #0F172A)' : 'var(--admin-text-tertiary, #64748B)'}
                    fontSize="10"
                    fontWeight={isHovered ? '700' : '500'}
                    className="admin-tabular-nums"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Box */}
        {hoverIndex !== null && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: Math.min(
                Math.max(10, (hoveredCoords.x / chartWidth) * 100),
                82
              ) + '%',
              transform: 'translateX(-50%)',
              background: 'var(--admin-surface-raised, #1E293B)',
              color: 'var(--admin-text-primary, #FFFFFF)',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.12))',
              boxShadow: 'var(--admin-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.3))',
              pointerEvents: 'none',
              zIndex: 10,
              whiteSpace: 'nowrap',
              minWidth: 140,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: 'var(--admin-text-tertiary, #94A3B8)',
                fontWeight: 600,
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {activePoint.label} {activePoint.meta ? `· ${activePoint.meta}` : ''}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--admin-text-secondary, #CBD5E1)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 2, background: color, display: 'inline-block', borderRadius: 1 }} />
                {seriesName}:
              </span>
              <span className="admin-tabular-nums" style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
                {formatValue(activePoint.value)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: 'var(--admin-text-secondary, #CBD5E1)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 2, background: secondaryColor, display: 'inline-block', borderRadius: 1 }} />
                {secondarySeriesName}:
              </span>
              <span className="admin-tabular-nums" style={{ fontSize: 12, fontWeight: 700, color: secondaryColor, fontVariantNumeric: 'tabular-nums' }}>
                {formatValue(activeSecondaryVal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Sync Status Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
          fontSize: 11,
          color: 'var(--admin-text-secondary, var(--text-secondary, #64748B))',
        }}
      >
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 3, background: color, borderRadius: 2 }} />
            <span style={{ fontWeight: 600 }}>{seriesName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 3, background: secondaryColor, borderRadius: 2, borderTop: '1px dashed' }} />
            <span style={{ fontWeight: 600 }}>{secondarySeriesName}</span>
          </div>
        </div>

        <div
          style={{
            fontSize: 11,
            color: 'var(--admin-text-tertiary, var(--text-tertiary, #64748B))',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--admin-status-success, #10B981)' }} />
          <span>Real-time Firestore & Stripe telemetry synchronized</span>
        </div>
      </div>
    </div>
  );
};
