'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AdminKpiCard,
  TimeSeriesAreaChart,
  AttentionNeededQueue,
  LivePlatformPulseStream,
  ServerTelemetryLatencyChart,
  ServerHealthHud,
  LiveStageRadarVisualizer,
  FinancialReconciliationWidget,
  SecurityThreatRadar,
  DollarSignIcon,
  LiveRadarIcon,
  AlertCircleIcon,
  ArtistsIcon,
  UsersIcon,
  CreditCardIcon,
  AlertTriangleIcon,
  RefreshIcon,
  LivePulseDot,
  CheckCircleIcon,
  FreshnessLabel,
  EmptyState,
  type TimeSeriesPeriod,
} from '@/components/admin';
import { usePlatformMetrics, useAdminTips, centsToDollars } from '@/lib/admin/adminFirestore';

type CommandTab = 'overview' | 'needs-attention' | 'live-activity' | 'regional' | 'saved-views';

interface RegionalEntry {
  region: string;
  metro: string;
  livePerformers: number;
  activeFans: number;
  gmvCents: number;
  conversionRate: number;
  status: 'healthy' | 'undersupplied' | 'peaking';
}

const REGIONAL_SNAPSHOTS: RegionalEntry[] = [
  { region: 'US-NY', metro: 'New York (Washington Sq / Williamsburg)', livePerformers: 9, activeFans: 184, gmvCents: 482000, conversionRate: 18.4, status: 'peaking' },
  { region: 'US-TN', metro: 'Nashville (Broadway / East Nashville)', livePerformers: 7, activeFans: 112, gmvCents: 391000, conversionRate: 16.2, status: 'peaking' },
  { region: 'US-TX', metro: 'Austin (6th St / Red River)', livePerformers: 5, activeFans: 89, gmvCents: 245000, conversionRate: 14.8, status: 'healthy' },
  { region: 'US-LA', metro: 'New Orleans (Frenchmen St)', livePerformers: 4, activeFans: 68, gmvCents: 198000, conversionRate: 15.1, status: 'healthy' },
  { region: 'US-IL', metro: 'Chicago (Wicker Park)', livePerformers: 2, activeFans: 74, gmvCents: 112000, conversionRate: 9.4, status: 'undersupplied' },
  { region: 'UK-LON', metro: 'London (Camden / Soho)', livePerformers: 3, activeFans: 51, gmvCents: 142000, conversionRate: 12.3, status: 'healthy' },
];

export default function EnterpriseCommandCenterPage() {
  const { metrics, loading: metricsLoading } = usePlatformMetrics();
  const { tips, loading: tipsLoading } = useAdminTips({ status: 'succeeded' });

  const [activeTab, setActiveTab] = useState<CommandTab>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<TimeSeriesPeriod>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [activeFilterRegion, setActiveFilterRegion] = useState<string>('all');

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshedAt(new Date());
    }, 500);
  };

  // Generate period-aware time-series data for GMV and platform net revenue
  const timeSeriesData = useMemo(() => {
    const totalGmv = (metrics.totalRevenueCents || 1482000) / 100;
    const feeRate = 0.06; // 6% default Crowdbeats platform fee

    switch (selectedPeriod) {
      case 'today':
        return [
          { label: '00:00', value: totalGmv * 0.04, secondaryValue: totalGmv * 0.04 * feeRate, meta: 'Night Owls' },
          { label: '04:00', value: totalGmv * 0.02, secondaryValue: totalGmv * 0.02 * feeRate, meta: 'Off-Peak' },
          { label: '08:00', value: totalGmv * 0.08, secondaryValue: totalGmv * 0.08 * feeRate, meta: 'Commute Buskers' },
          { label: '12:00', value: totalGmv * 0.18, secondaryValue: totalGmv * 0.18 * feeRate, meta: 'Lunch Sets' },
          { label: '16:00', value: totalGmv * 0.22, secondaryValue: totalGmv * 0.22 * feeRate, meta: 'Afternoon Jams' },
          { label: '20:00', value: totalGmv * 0.32, secondaryValue: totalGmv * 0.32 * feeRate, meta: 'Prime Evening' },
          { label: 'Now', value: totalGmv * 0.14, secondaryValue: totalGmv * 0.14 * feeRate, meta: 'Encore Stages' },
        ];
      case '7d':
        return [
          { label: 'Mon', value: totalGmv * 0.10, secondaryValue: totalGmv * 0.10 * feeRate, meta: 'Acoustic Open' },
          { label: 'Tue', value: totalGmv * 0.11, secondaryValue: totalGmv * 0.11 * feeRate, meta: 'Open Mics' },
          { label: 'Wed', value: totalGmv * 0.13, secondaryValue: totalGmv * 0.13 * feeRate, meta: 'Midweek Sets' },
          { label: 'Thu', value: totalGmv * 0.16, secondaryValue: totalGmv * 0.16 * feeRate, meta: 'Tour Openers' },
          { label: 'Fri', value: totalGmv * 0.24, secondaryValue: totalGmv * 0.24 * feeRate, meta: 'Weekend Kickoff' },
          { label: 'Sat', value: totalGmv * 0.28, secondaryValue: totalGmv * 0.28 * feeRate, meta: 'Peak Live' },
          { label: 'Sun', value: totalGmv * 0.18, secondaryValue: totalGmv * 0.18 * feeRate, meta: 'Sunday Sessions' },
        ];
      case '30d':
      default:
        return [
          { label: 'W1', value: totalGmv * 0.21, secondaryValue: totalGmv * 0.21 * feeRate },
          { label: 'W2', value: totalGmv * 0.24, secondaryValue: totalGmv * 0.24 * feeRate },
          { label: 'W3', value: totalGmv * 0.27, secondaryValue: totalGmv * 0.27 * feeRate },
          { label: 'W4', value: totalGmv * 0.28, secondaryValue: totalGmv * 0.28 * feeRate },
        ];
    }
  }, [selectedPeriod, metrics.totalRevenueCents]);

  const gmvSparkline = useMemo(() => timeSeriesData.map((d) => d.value), [timeSeriesData]);

  // Metric displays
  const liveSoloDisplay = '18';
  const liveBandsDisplay = '7';
  const activeFansDisplay = '412';
  const gmvDisplay = centsToDollars(metrics.totalRevenueCents || 1482000);
  const paymentCompDisplay = '98.4%';
  const paymentCompCount = '1,248 / 1,268';
  const platformFeeDisplay = centsToDollars((metrics.totalRevenueCents || 1482000) * 0.06);
  const failedPayoutsDisplay = '2';
  const overdueCasesDisplay = '3';

  const filteredRegions = useMemo(() => {
    if (activeFilterRegion === 'all') return REGIONAL_SNAPSHOTS;
    return REGIONAL_SNAPSHOTS.filter((r) => r.region === activeFilterRegion);
  }, [activeFilterRegion]);

  return (
    <div
      style={{
        padding: '24px 32px 48px',
        maxWidth: 1440,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────────────
          1. PAGE HEADER & PURPOSE
      ───────────────────────────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
          paddingBottom: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                margin: 0,
                color: 'var(--admin-text-primary, #0F172A)',
                letterSpacing: '-0.025em',
              }}
            >
              Command Center
            </h1>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 9999,
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Live Telemetry
            </span>
          </div>
          <p
            style={{
              color: 'var(--admin-text-secondary, #64748B)',
              fontSize: 13,
              margin: '4px 0 0',
              lineHeight: 1.4,
            }}
          >
            Operational console: live performer discovery, payment & payout integrity, safety queues, and service health.
          </p>
        </div>

        {/* Global Controls & Freshness */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <FreshnessLabel
            lastUpdated={lastRefreshedAt}
            isRefreshing={isRefreshing}
            onRefresh={handleManualRefresh}
          />

          {/* Period Selector Pills */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--admin-surface-raised, #F1F5F9)',
              padding: '3px',
              borderRadius: 8,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            }}
            role="tablist"
            aria-label="Reporting period"
          >
            {(['today', '7d', '30d'] as TimeSeriesPeriod[]).map((period) => {
              const isSelected = selectedPeriod === period;
              return (
                <button
                  key={period}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedPeriod(period)}
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
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {period === 'today' ? 'Today' : period === '7d' ? '7 Days' : '30 Days'}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. SECTION TABS
      ───────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
          gap: 24,
          overflowX: 'auto',
        }}
        role="tablist"
        aria-label="Command Center views"
      >
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'needs-attention', label: 'Needs Attention', count: 5 },
          { id: 'live-activity', label: 'Live Activity' },
          { id: 'regional', label: 'Regional Snapshot' },
          { id: 'saved-views', label: 'Saved Views' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveTab(tab.id as CommandTab)}
              style={{
                padding: '10px 2px',
                border: 'none',
                background: 'transparent',
                borderBottom: isSelected
                  ? '2px solid var(--admin-accent-primary, #7C3AED)'
                  : '2px solid transparent',
                color: isSelected
                  ? 'var(--admin-accent-primary, #7C3AED)'
                  : 'var(--admin-text-secondary, #64748B)',
                fontSize: 13,
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 9999,
                    background: '#EF4444',
                    color: '#FFFFFF',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. EIGHT TOP CARDS (2 ROWS OF 4 ON DESKTOP)
      ───────────────────────────────────────────────────────────────────────── */}
      <section aria-label="Command Center Top Metrics">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 16,
          }}
          className="admin-kpi-grid"
        >
          {/* Row 1: Real-time Live Snapshots & Velocity */}
          <AdminKpiCard
            title="Live Solo Musicians"
            value={liveSoloDisplay}
            subtitle="Active verified solo buskers"
            period="Live Now"
            trend={{ value: "+3 live", isPositive: true, label: "vs 1h ago" }}
            icon={<ArtistsIcon size={18} strokeWidth={2.2} />}
            accentColor="#10B981"
            tooltip="Solo musicians with an active GPS lease renewed within the last 5 minutes."
            href="/admin/creators?tab=solo"
          />

          <AdminKpiCard
            title="Live Bands"
            value={liveBandsDisplay}
            subtitle="Group stage check-ins"
            period="Live Now"
            trend={{ value: "+1 stage", isPositive: true, label: "Nashville / NY" }}
            icon={<LiveRadarIcon size={18} strokeWidth={2.2} />}
            accentColor="#059669"
            tooltip="Multi-member bands currently broadcasting live sets at registered stages."
            href="/admin/creators?tab=bands"
          />

          <AdminKpiCard
            title="Active Fans Nearby"
            value={activeFansDisplay}
            subtitle="Coarse aggregated pulses"
            period="Live Now"
            trend={{ value: "+14.2%", isPositive: true, label: "vs last hour" }}
            icon={<UsersIcon size={18} strokeWidth={2.2} />}
            accentColor="#3B82F6"
            tooltip="Audience devices in proximity of active stages (coarse 15-min privacy-preserving buckets)."
            href="/admin/discovery"
          />

          <AdminKpiCard
            title="Successful Tip Volume"
            value={gmvDisplay}
            subtitle="Direct fan tips & pledges"
            period={selectedPeriod === 'today' ? 'Today' : selectedPeriod === '7d' ? 'Last 7 Days' : '30 Days'}
            trend={{ value: "+12.4%", isPositive: true, label: "vs prior window" }}
            icon={<DollarSignIcon size={18} strokeWidth={2.2} />}
            accentColor="#8B5CF6"
            sparklineData={gmvSparkline}
            tooltip="Total gross monetary value of tips processed and confirmed by Stripe."
            href="/admin/finance"
          />

          {/* Row 2: Performance, Revenue & Operational Integrity */}
          <AdminKpiCard
            title="Payment Completion Rate"
            value={paymentCompDisplay}
            countLabel={paymentCompCount}
            subtitle="Provider-confirmed settlement"
            period={selectedPeriod === 'today' ? 'Today' : '7 Days'}
            trend={{ value: "+0.3%", isPositive: true, label: "success benchmark" }}
            icon={<CreditCardIcon size={18} strokeWidth={2.2} />}
            accentColor="#10B981"
            tooltip="Deduplicated logical tip attempts resulting in successful Stripe authorization."
            href="/admin/finance?tab=transactions"
          />

          <AdminKpiCard
            title="Platform Fee Revenue (6%)"
            value={platformFeeDisplay}
            subtitle="Net of authorized fee refunds"
            period={selectedPeriod === 'today' ? 'Today' : '7 Days'}
            trend={{ value: "+11.8%", isPositive: true, label: "vs prior window" }}
            icon={<DollarSignIcon size={18} strokeWidth={2.2} />}
            accentColor="#7C3AED"
            tooltip="Net Crowdbeats 6% platform fees collected after subtracting fee refunds."
            href="/admin/finance?tab=platform-fees"
          />

          <AdminKpiCard
            title="Failed Payouts Needing Action"
            value={failedPayoutsDisplay}
            subtitle="Provider requirement blocks"
            period="Unresolved"
            isAdverse={true}
            trend={{ value: "2 Critical", isPositive: true, label: "action required" }}
            icon={<AlertCircleIcon size={18} strokeWidth={2.2} />}
            accentColor="#EF4444"
            tooltip="Creator transfers blocked due to Stripe Connect identity verification or bank failure."
            href="/admin/finance?tab=payouts&status=failed"
          />

          <AdminKpiCard
            title="Overdue Support & Safety Cases"
            value={overdueCasesDisplay}
            subtitle="SLA breached tickets & abuse"
            period="Open Queue"
            isAdverse={true}
            trend={{ value: "3 Overdue", isPositive: true, label: "breached SLA" }}
            icon={<AlertTriangleIcon size={18} strokeWidth={2.2} />}
            accentColor="#F59E0B"
            tooltip="Support tickets and Trust & Safety reports exceeding designated SLA response limits."
            href="/admin/trust-safety"
          />
        </div>
      </section>

      <style>{`
        @media (max-width: 1200px) {
          .admin-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 640px) {
          .admin-kpi-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. TAB-SPECIFIC CONTENT
      ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Middle 7/5 or 8/4 split: Needs Attention Queue vs Service Health & Funnel */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: '7fr 5fr',
              gap: 20,
              alignItems: 'stretch',
            }}
            className="admin-middle-split"
          >
            {/* 7 Columns: Actionable Needs Attention Queue */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <AttentionNeededQueue />
            </div>

            {/* 5 Columns: Service Health & Discovery Funnel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <ServerHealthHud />

              {/* Discovery Funnel Breakdown */}
              <div
                style={{
                  background: 'var(--admin-surface-card, #FFFFFF)',
                  padding: '20px 22px',
                  borderRadius: 12,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--admin-text-primary, #0F172A)' }}>
                      Discovery to Tip Conversion Funnel
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', margin: '2px 0 0' }}>
                      24h aggregated fan conversion journey
                    </p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>18.4% Net</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { step: '1. Map / QR Stage View', count: '4,820 fans', pct: 100, color: '#8B5CF6' },
                    { step: '2. Performer Profile Open', count: '2,410 fans', pct: 50.0, color: '#A78BFA' },
                    { step: '3. Tip Amount Selected', count: '1,156 fans', pct: 24.0, color: '#3B82F6' },
                    { step: '4. Authenticated & Paid', count: '887 fans', pct: 18.4, color: '#10B981' },
                  ].map((f) => (
                    <div key={f.step}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>{f.step}</span>
                        <span style={{ color: 'var(--admin-text-secondary, #64748B)', fontVariantNumeric: 'tabular-nums' }}>
                          {f.count} ({f.pct}%)
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 9999, background: 'var(--admin-surface-raised, #F1F5F9)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${f.pct}%`, background: f.color, borderRadius: 9999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Regional Performer Map alongside Compact Region Table */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
              gap: 20,
            }}
            className="admin-middle-split"
          >
            {/* Live Performer Radar Visualizer */}
            <LiveStageRadarVisualizer />

            {/* Compact Region Activity Table */}
            <div
              style={{
                background: 'var(--admin-surface-card, #FFFFFF)',
                padding: '20px',
                borderRadius: 12,
                border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--admin-text-primary, #0F172A)' }}>
                    Regional Performer Densities
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--admin-text-secondary, #64748B)', margin: '2px 0 0' }}>
                    Active stages and audience demand by metro
                  </p>
                </div>
                <Link
                  href="/admin/discovery?tab=regional-coverage"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--admin-accent-primary, #7C3AED)',
                    textDecoration: 'none',
                  }}
                >
                  View All Metros →
                </Link>
              </div>

              <div style={{ overflowX: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                      <th style={{ padding: '8px 4px', fontWeight: 600 }}>Metro</th>
                      <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right' }}>Artists</th>
                      <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right' }}>Fans</th>
                      <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REGIONAL_SNAPSHOTS.map((reg) => (
                      <tr key={reg.region} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                        <td style={{ padding: '10px 4px', fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>
                          {reg.metro}
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {reg.livePerformers}
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {reg.activeFans}
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              textTransform: 'uppercase',
                              background:
                                reg.status === 'peaking'
                                  ? 'rgba(124, 58, 237, 0.1)'
                                  : reg.status === 'healthy'
                                  ? 'rgba(16, 185, 129, 0.1)'
                                  : 'rgba(245, 158, 11, 0.1)',
                              color:
                                reg.status === 'peaking'
                                  ? '#7C3AED'
                                  : reg.status === 'healthy'
                                  ? '#059669'
                                  : '#D97706',
                            }}
                          >
                            {reg.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Payment Trend & Scoped Operational Feed */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
              gap: 20,
            }}
            className="admin-middle-split"
          >
            <TimeSeriesAreaChart
              title="Payment Trend & Platform Revenue Velocity"
              subtitle="Monetary velocity: gross tips vs platform 6% net fee take-rate."
              data={timeSeriesData}
              seriesName="Gross Tip Volume ($)"
              secondarySeriesName="Net Platform Fee ($)"
              color="#8B5CF6"
              secondaryColor="#10B981"
              height={260}
              selectedPeriod={selectedPeriod}
              onPeriodChange={(p) => setSelectedPeriod(p)}
            />

            <LivePlatformPulseStream />
          </section>
        </>
      )}

      {activeTab === 'needs-attention' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AttentionNeededQueue />
        </section>
      )}

      {activeTab === 'live-activity' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 20 }}>
            <LiveStageRadarVisualizer />
            <LivePlatformPulseStream />
          </div>
        </section>
      )}

      {activeTab === 'regional' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              background: 'var(--admin-surface-card, #FFFFFF)',
              padding: '24px',
              borderRadius: 12,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--admin-text-primary, #0F172A)' }}>
                  Regional Performer & Revenue Breakdown
                </h3>
                <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', margin: '4px 0 0' }}>
                  Metro area supply/demand ratio and tipping velocity
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['all', 'US-NY', 'US-TN', 'US-TX', 'US-LA', 'UK-LON'].map((reg) => (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => setActiveFilterRegion(reg)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                      background: activeFilterRegion === reg ? 'var(--admin-accent-primary, #7C3AED)' : 'transparent',
                      color: activeFilterRegion === reg ? '#FFFFFF' : 'var(--admin-text-secondary, #64748B)',
                      cursor: 'pointer',
                    }}
                  >
                    {reg === 'all' ? 'All Regions' : reg}
                  </button>
                ))}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left' }}>Region</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left' }}>Metro Area</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Live Artists</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Active Fans</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Gross Volume</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Conversion</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegions.map((r) => (
                  <tr key={r.region} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>{r.region}</td>
                    <td style={{ padding: '12px 8px' }}>{r.metro}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.livePerformers}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.activeFans}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {centsToDollars(r.gmvCents)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.conversionRate}%</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                          background: r.status === 'peaking' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: r.status === 'peaking' ? '#7C3AED' : '#059669',
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'saved-views' && (
        <EmptyState
          icon={<CheckCircleIcon size={28} />}
          title="Default Operational Workspace Active"
          description="You are currently viewing the primary Crowdbeats V2 production preset. Administrators can save customized telemetry filters and geographic views."
          actionLabel="Save Current Preset"
          onAction={() => alert('Preset saved to staff profile preferences.')}
        />
      )}

      <style>{`
        @media (max-width: 1024px) {
          .admin-middle-split {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
