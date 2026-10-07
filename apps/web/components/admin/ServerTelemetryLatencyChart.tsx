'use client';

import React from 'react';
import { ServerIcon, LivePulseDot } from './AdminIcons';

interface TelemetryMetric {
  service: string;
  region: string;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  rps: number;
  status: 'HEALTHY' | 'DEGRADED' | 'OUTAGE';
  uptimePercent: number;
}

const DEFAULT_METRICS: TelemetryMetric[] = [
  { service: 'Cloud Functions API', region: 'us-central1', p50Ms: 38, p95Ms: 112, p99Ms: 240, rps: 184.5, status: 'HEALTHY', uptimePercent: 99.99 },
  { service: 'Cloud Firestore DB', region: 'us-central1 (multi-tenant)', p50Ms: 14, p95Ms: 42, p99Ms: 88, rps: 642.0, status: 'HEALTHY', uptimePercent: 100.0 },
  { service: 'Stripe Gateway Connector', region: 'api.stripe.com', p50Ms: 145, p95Ms: 290, p99Ms: 410, rps: 42.1, status: 'HEALTHY', uptimePercent: 99.98 },
  { service: 'Firebase Auth Tokens', region: 'global edge', p50Ms: 22, p95Ms: 65, p99Ms: 120, rps: 92.4, status: 'HEALTHY', uptimePercent: 100.0 },
  { service: 'Google Maps Geocoding', region: 'maps.googleapis.com', p50Ms: 78, p95Ms: 185, p99Ms: 310, rps: 28.0, status: 'HEALTHY', uptimePercent: 99.95 },
];

export const ServerTelemetryLatencyChart: React.FC<{ metrics?: TelemetryMetric[] }> = ({
  metrics = DEFAULT_METRICS,
}) => {
  return (
    <div
      style={{
        background: 'var(--admin-surface-card, var(--surface-card, #FFFFFF))',
        padding: '22px 24px',
        borderRadius: 12,
        border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
        boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ServerIcon
              size={18}
              strokeWidth={2.2}
              style={{ color: 'var(--admin-accent-primary, #7C3AED)' }}
            />
            <h2
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--admin-text-primary, var(--text-primary, #0F172A))',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Infrastructure Telemetry & SLA Latency Matrix
            </h2>
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--admin-text-secondary, var(--text-secondary, #64748B))',
              marginTop: 3,
            }}
          >
            P50, P95, and P99 latency percentiles across cloud run services and external gateways.
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--admin-status-success-bg, rgba(16, 185, 129, 0.10))',
            padding: '4px 10px',
            borderRadius: 20,
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          <LivePulseDot size={7} color="var(--admin-status-success, #10B981)" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--admin-status-success, #10B981)',
            }}
          >
            All Nodes Healthy
          </span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 12,
          }}
        >
          <thead>
            <tr
              style={{
                background: 'var(--admin-surface-raised, var(--surface-raised, #F8FAFC))',
                borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
                color: 'var(--admin-text-secondary, #64748B)',
              }}
            >
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>Service Node</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>Region</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>Throughput</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>P50 Latency</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>P95 Latency</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>P99 Latency</th>
              <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>30d Uptime</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  transition: 'background 0.15s ease',
                }}
              >
                <td style={{ padding: '12px 12px', fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background:
                          m.status === 'HEALTHY'
                            ? 'var(--admin-status-success, #10B981)'
                            : 'var(--admin-status-warning, #F59E0B)',
                      }}
                    />
                    <span>{m.service}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 12px', color: 'var(--admin-text-secondary, #64748B)', fontSize: 11 }}>
                  <span
                    style={{
                      background: 'var(--admin-surface-raised, #F1F5F9)',
                      border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontFamily: 'monospace',
                    }}
                  >
                    {m.region}
                  </span>
                </td>
                <td
                  className="admin-tabular-nums"
                  style={{
                    padding: '12px 12px',
                    color: 'var(--admin-text-primary, #0F172A)',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {m.rps.toFixed(1)} req/s
                </td>
                <td
                  className="admin-tabular-nums"
                  style={{
                    padding: '12px 12px',
                    color: 'var(--admin-status-success, #10B981)',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {m.p50Ms} ms
                </td>
                <td
                  className="admin-tabular-nums"
                  style={{
                    padding: '12px 12px',
                    color: 'var(--admin-status-warning, #F59E0B)',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {m.p95Ms} ms
                </td>
                <td
                  className="admin-tabular-nums"
                  style={{
                    padding: '12px 12px',
                    color: m.p99Ms > 300 ? 'var(--admin-status-error, #EF4444)' : 'var(--admin-text-secondary, #64748B)',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {m.p99Ms} ms
                </td>
                <td
                  className="admin-tabular-nums"
                  style={{
                    padding: '12px 12px',
                    textAlign: 'right',
                    fontWeight: 800,
                    color: 'var(--admin-text-primary, #0F172A)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {m.uptimePercent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
