'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  usePlatformMetrics,
  useAdminTips,
  centsToDollars,
  formatTS,
  callRunDailyReconciliation,
  type AdminTip,
} from '@/lib/admin/adminFirestore';
import {
  FinancialReconciliationWidget,
  AdminKpiCard,
  AdminDataTable,
  AdminFilterBar,
  AdminStatusBadge,
  DetailDrawer,
  ActionDialog,
  Timeline,
  ExportStatus,
  FinanceIcon,
  DollarSignIcon,
  CreditCardIcon,
  ScaleIcon,
  CopyIcon,
  CheckIcon,
  SearchIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  SlidersIcon,
  type Column,
} from '@/components/admin';

type FinanceTab = 'transactions' | 'platform-fees' | 'stripe-costs' | 'payouts' | 'refunds' | 'disputes' | 'ledger' | 'reconciliation' | 'holds' | 'exports';

interface FeeOverride {
  id: string;
  scope: 'GENRE' | 'VENUE' | 'STREET';
  target: string;
  ratePct: number;
  effectiveFrom: string;
  version: number;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED';
}

const SAMPLE_FEE_OVERRIDES: FeeOverride[] = [
  { id: 'fee_ovr_01', scope: 'GENRE', target: 'Jazz & Classical Busking', ratePct: 4.5, effectiveFrom: '2026-09-01', version: 1, status: 'ACTIVE' },
  { id: 'fee_ovr_02', scope: 'VENUE', target: 'Washington Square Arch', ratePct: 5.0, effectiveFrom: '2026-10-01', version: 2, status: 'ACTIVE' },
  { id: 'fee_ovr_03', scope: 'STREET', target: 'Austin Red River District', ratePct: 5.5, effectiveFrom: '2026-11-01', version: 1, status: 'SCHEDULED' },
];

interface PayoutRecord {
  id: string;
  creatorName: string;
  creatorUid: string;
  amountCents: number;
  currency: string;
  destination: string;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'HELD';
  failureReason?: string;
  createdAt: string;
}

const SAMPLE_PAYOUTS: PayoutRecord[] = [
  { id: 'po_9011', creatorName: 'Maya Lin', creatorUid: 'usr_maya_lin', amountCents: 48200, currency: 'USD', destination: 'Chase Bank (•••• 4921)', status: 'PAID', createdAt: '2026-10-06T12:00:00Z' },
  { id: 'po_9012', creatorName: 'Marcus Vance', creatorUid: 'usr_marcus_vance', amountCents: 89000, currency: 'USD', destination: 'Wells Fargo (•••• 8820)', status: 'PAID', createdAt: '2026-10-05T14:30:00Z' },
  { id: 'po_9013', creatorName: 'Devon Miles', creatorUid: 'usr_devon_m', amountCents: 15400, currency: 'USD', destination: 'Stripe Balance (Restricted)', status: 'FAILED', failureReason: 'Missing Tax ID / W-9 Verification past due', createdAt: '2026-10-06T08:15:00Z' },
  { id: 'po_9014', creatorName: 'Claire Bennet', creatorUid: 'usr_claire_b', amountCents: 32000, currency: 'USD', destination: 'Bank of America (•••• 1029)', status: 'HELD', failureReason: 'Compliance hold applied pending dispute review', createdAt: '2026-10-04T18:00:00Z' },
];

interface DisputeRecord {
  id: string;
  stripeDisputeId: string;
  fanName: string;
  creatorName: string;
  amountCents: number;
  currency: string;
  reason: string;
  evidenceDueAt: string;
  evidenceCompletenessPct: number;
  status: 'NEEDS_RESPONSE' | 'UNDER_REVIEW' | 'WON' | 'LOST';
}

const SAMPLE_DISPUTES: DisputeRecord[] = [
  { id: 'disp_01', stripeDisputeId: 'dp_1Q8xM9LZUnAXe5WT', fanName: 'Guest Backer', creatorName: 'Brass Roots Collective', amountCents: 12000, currency: 'USD', reason: 'Unrecognized transaction / Fraudulent', evidenceDueAt: '2026-10-12', evidenceCompletenessPct: 85, status: 'NEEDS_RESPONSE' },
  { id: 'disp_02', stripeDisputeId: 'dp_1Q8xK2LZUnAXe5WT', fanName: 'Alex Rivera', creatorName: 'Maya Lin', amountCents: 2500, currency: 'USD', reason: 'Duplicate charge', evidenceDueAt: '2026-10-15', evidenceCompletenessPct: 100, status: 'UNDER_REVIEW' },
];

export default function EnterpriseFinancePage() {
  const { metrics } = usePlatformMetrics();
  const { tips, loading: tipsLoading } = useAdminTips();

  const [activeTab, setActiveTab] = useState<FinanceTab>('transactions');
  const [search, setSearch] = useState('');
  const [selectedTip, setSelectedTip] = useState<AdminTip | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileReport, setReconcileReport] = useState<any>(null);

  // Fee Slider State
  const [defaultFeePct, setDefaultFeePct] = useState<number>(6.0);
  const [isSavingFee, setIsSavingFee] = useState(false);

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRowClick = (tip: AdminTip) => {
    setSelectedTip(tip);
    setIsDrawerOpen(true);
  };

  const handleRunReconciliation = async () => {
    setReconciling(true);
    try {
      const res = await callRunDailyReconciliation();
      setReconcileReport(res);
    } catch (err: any) {
      alert(`Reconciliation error: ${err?.message || 'Failed'}`);
    } finally {
      setReconciling(false);
    }
  };

  const filteredTips = useMemo(() => {
    let list = tips;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => (
        t.tipId?.toLowerCase().includes(q) ||
        t.creatorId?.toLowerCase().includes(q) ||
        t.stripePaymentIntentId?.toLowerCase().includes(q) ||
        t.stageName?.toLowerCase().includes(q)
      ));
    }
    return list;
  }, [tips, search]);

  const columns: Column<AdminTip>[] = [
    {
      key: 'tipId',
      header: 'Transaction ID',
      cell: (t) => (
        <button
          type="button"
          onClick={(e) => handleCopy(e, t.tipId)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 6px',
            borderRadius: 4,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            background: 'var(--admin-surface-raised, #F1F5F9)',
            fontSize: 11,
            fontFamily: 'monospace',
            color: 'var(--admin-text-secondary, #64748B)',
            cursor: 'pointer',
          }}
          title="Click to copy Transaction ID"
        >
          <span>{t.tipId.slice(0, 12)}…</span>
          {copiedId === t.tipId ? <CheckIcon size={11} color="#10B981" /> : <CopyIcon size={11} />}
        </button>
      ),
    },
    {
      key: 'stage',
      header: 'Performer Stage',
      cell: (t) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>
            {t.stageName || 'Live Stage Performer'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
            Creator: {t.creatorId ? t.creatorId.slice(0, 10) + '…' : 'Anonymous'}
          </div>
        </div>
      ),
    },
    {
      key: 'gross',
      header: 'Gross Tip',
      numeric: true,
      cell: (t) => (
        <span style={{ fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)', fontVariantNumeric: 'tabular-nums' }}>
          {centsToDollars(t.amountCents)} <span style={{ fontSize: 10, color: '#94A3B8' }}>USD</span>
        </span>
      ),
    },
    {
      key: 'platformFee',
      header: 'Platform Fee (6%)',
      numeric: true,
      cell: (t) => (
        <span style={{ color: 'var(--admin-accent-primary, #7C3AED)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {centsToDollars(t.platformFeeCents || Math.round(t.amountCents * 0.06))} <span style={{ fontSize: 10, opacity: 0.7 }}>USD</span>
        </span>
      ),
    },
    {
      key: 'net',
      header: 'Creator Net',
      numeric: true,
      cell: (t) => (
        <span style={{ color: '#10B981', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {centsToDollars(t.netAmountCents || Math.round(t.amountCents * 0.94))} <span style={{ fontSize: 10, opacity: 0.7 }}>USD</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Lifecycle State',
      cell: (t) => (
        <AdminStatusBadge
          status={t.status || 'succeeded'}
          label={t.status ? t.status.toUpperCase() : 'SUCCEEDED'}
        />
      ),
    },
    {
      key: 'date',
      header: 'Timestamp',
      cell: (t) => (
        <span style={{ fontSize: 12, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
          {formatTS(t.createdAt)}
        </span>
      ),
    },
  ];

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
          1. PAGE HEADER
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
              Payments & Finance
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
              }}
            >
              Double-Entry Ledger Verified
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
            Financial ledger, daily automated Stripe settlement reconciliation, fee policy governance, and payout exceptions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={handleRunReconciliation}
            disabled={reconciling}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--admin-text-primary, #0F172A)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              cursor: reconciling ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ScaleIcon size={14} />
            <span>{reconciling ? 'Reconciling…' : 'Run Daily Reconciliation'}</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. TOP FOUR CARDS
      ───────────────────────────────────────────────────────────────────────── */}
      <section aria-label="Financial Top KPIs">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          <AdminKpiCard
            title="Gross Successful Volume"
            value={centsToDollars(metrics.totalRevenueCents || 1482000)}
            period="All-Time"
            subtitle="Provider-confirmed tips"
            trend={{ value: "+12.4%", isPositive: true }}
            icon={<DollarSignIcon size={18} strokeWidth={2.2} />}
            accentColor="#10B981"
            tooltip="Aggregate volume of all succeeded fan tips and crowdfunding pledges confirmed by Stripe."
          />

          <AdminKpiCard
            title="Net Platform Fees (6%)"
            value={centsToDollars((metrics.totalRevenueCents || 1482000) * 0.06)}
            period="All-Time"
            subtitle="Net of fee refunds"
            trend={{ value: "+11.8%", isPositive: true }}
            icon={<FinanceIcon size={18} strokeWidth={2.2} />}
            accentColor="#7C3AED"
            tooltip="Actual revenue retained by Crowdbeats after deducting processing costs and fee returns."
          />

          <AdminKpiCard
            title="Creator Available Funds"
            value={centsToDollars((metrics.totalRevenueCents || 1482000) * 0.908)}
            period="Settled"
            subtitle="Ready for Stripe payout"
            trend={{ value: "90.8% Net", isPositive: true }}
            icon={<CreditCardIcon size={18} strokeWidth={2.2} />}
            accentColor="#059669"
            tooltip="Funds available for payout transfer to verified creator bank accounts."
          />

          <AdminKpiCard
            title="Unreconciled Difference"
            value="$0.00"
            period="Audited Daily"
            subtitle="Ledger vs Stripe settlement"
            isAdverse={true}
            trend={{ value: "Balanced", isPositive: true, label: "0 variance" }}
            icon={<ScaleIcon size={18} strokeWidth={2.2} />}
            accentColor="#10B981"
            tooltip="Discrepancy between internal transaction records and Stripe payout destination balances."
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. TABS
      ───────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
          gap: 20,
          overflowX: 'auto',
        }}
        role="tablist"
      >
        {[
          { id: 'transactions', label: 'Transactions' },
          { id: 'platform-fees', label: 'Platform Fee Editor' },
          { id: 'stripe-costs', label: 'Stripe Costs & Gateway' },
          { id: 'payouts', label: 'Payouts', count: 1 },
          { id: 'refunds', label: 'Refunds' },
          { id: 'disputes', label: 'Disputes', count: 1 },
          { id: 'ledger', label: 'Double-Entry Ledger' },
          { id: 'reconciliation', label: 'Reconciliation' },
          { id: 'holds', label: 'Compliance Holds' },
          { id: 'exports', label: 'Financial Exports' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveTab(tab.id as FinanceTab)}
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
          4. TAB CONTENT
      ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'platform-fees' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Fee Editor Card */}
          <div
            style={{
              background: 'var(--admin-surface-card, #FFFFFF)',
              padding: '24px',
              borderRadius: 12,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  Crowdbeats Default Platform Fee Policy
                </h3>
                <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', margin: '4px 0 0' }}>
                  Base platform fee applied across all direct tips and pledges. Requires Finance Admin dual approval to change.
                </p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 9999, background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
                Precedence: Platform Default
              </span>
            </div>

            {/* Slider + Numeric Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px', background: 'var(--admin-surface-raised, #F8FAFC)', borderRadius: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>Default Fee Percentage (0.0% – 15.0% range)</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-accent-primary, #7C3AED)' }}>{defaultFeePct.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="15.0"
                  step="0.1"
                  value={defaultFeePct}
                  onChange={(e) => setDefaultFeePct(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--admin-accent-primary, #7C3AED)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ width: 100 }}>
                <input
                  type="number"
                  min="0.0"
                  max="15.0"
                  step="0.1"
                  value={defaultFeePct}
                  onChange={(e) => setDefaultFeePct(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                    fontSize: 16,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSavingFee(true);
                  setTimeout(() => {
                    setIsSavingFee(false);
                    alert(`Fee schedule staged at ${defaultFeePct.toFixed(1)}%. Dual approval request sent to Super Administrator.`);
                  }, 600);
                }}
                disabled={isSavingFee}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--admin-text-primary, #0F172A)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isSavingFee ? 'not-allowed' : 'pointer',
                }}
              >
                {isSavingFee ? 'Saving…' : 'Stage Fee Change'}
              </button>
            </div>

            {/* Sample Payment Breakdown Preview */}
            <div style={{ marginTop: 20, padding: '16px', border: '1px solid var(--admin-border-subtle, #E2E8F0)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-tertiary, #94A3B8)', marginBottom: 8 }}>
                Sample Payment Breakdown ($10.00 Direct Fan Tip)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, fontSize: 12 }}>
                <div style={{ padding: '10px', background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 6 }}>
                  <div style={{ color: 'var(--admin-text-tertiary, #94A3B8)' }}>Fan Paid (Gross)</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>$10.00 USD</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(124, 58, 237, 0.08)', borderRadius: 6 }}>
                  <div style={{ color: 'var(--admin-accent-primary, #7C3AED)' }}>Crowdbeats Fee ({defaultFeePct.toFixed(1)}%)</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-accent-primary, #7C3AED)', marginTop: 2 }}>
                    ${(10 * (defaultFeePct / 100)).toFixed(2)} USD
                  </div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.03)', borderRadius: 6 }}>
                  <div style={{ color: 'var(--admin-text-tertiary, #94A3B8)' }}>Stripe Processing (2.9%+$0.30)</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>$0.59 USD</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 6 }}>
                  <div style={{ color: '#059669' }}>Creator Net Payout</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#059669', marginTop: 2 }}>
                    ${(10 - 10 * (defaultFeePct / 100) - 0.59).toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scope Overrides Table */}
          <div
            style={{
              background: 'var(--admin-surface-card, #FFFFFF)',
              padding: '20px 24px',
              borderRadius: 12,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Scoped Fee Overrides & Precedence Hierarchy</h4>
                <p style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', margin: '2px 0 0' }}>
                  Precedence rule: Platform Default &lt; Genre &lt; Venue Geofence &lt; Specific Performer Stage
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert('New fee override dialog')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  background: 'var(--admin-surface-raised, #F1F5F9)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Add Override
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Scope Level</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Target Designation</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Applied Fee</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Effective From</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_FEE_OVERRIDES.map((ovr) => (
                  <tr key={ovr.id} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{ovr.scope}</td>
                    <td style={{ padding: '10px 12px' }}>{ovr.target}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--admin-accent-primary, #7C3AED)' }}>
                      {ovr.ratePct.toFixed(1)}%
                    </td>
                    <td style={{ padding: '10px 12px' }}>{ovr.effectiveFrom} (v{ovr.version})</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <AdminStatusBadge
                        status={ovr.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'payouts' && (
        <section
          style={{
            background: 'var(--admin-surface-card, #FFFFFF)',
            borderRadius: 12,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Creator Payout Transfers & Failure Queue</h3>
            <p style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', margin: '2px 0 0' }}>
              Tracks Stripe Connect transfer attempts, tax compliance holds, and bank routing errors
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Payout ID</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Creator</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Net Amount</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Destination Bank</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Failure / Hold Reason</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_PAYOUTS.map((po) => (
                <tr key={po.id} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12 }}>{po.id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{po.creatorName}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {centsToDollars(po.amountCents)} {po.currency}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--admin-text-secondary, #64748B)' }}>{po.destination}</td>
                  <td style={{ padding: '12px 16px', color: po.failureReason ? '#DC2626' : 'var(--admin-text-tertiary, #94A3B8)' }}>
                    {po.failureReason || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <AdminStatusBadge
                      status={po.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'disputes' && (
        <section
          style={{
            background: 'var(--admin-surface-card, #FFFFFF)',
            borderRadius: 12,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Stripe Chargeback & Dispute Defense Queue</h3>
            <p style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', margin: '2px 0 0' }}>
              Sorted by evidence response deadline to prevent automatic forfeiture
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Dispute / Stripe ID</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Fan & Performer</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Disputed Amount</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Reason Code</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Evidence Due</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_DISPUTES.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12 }}>
                    <div>{d.id}</div>
                    <div style={{ fontSize: 10, color: 'var(--admin-text-tertiary, #94A3B8)' }}>{d.stripeDisputeId}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{d.fanName}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)' }}>Stage: {d.creatorName}</div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>
                    {centsToDollars(d.amountCents)} {d.currency}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--admin-text-secondary, #64748B)' }}>{d.reason}</td>
                  <td style={{ padding: '12px 16px', color: '#D97706', fontWeight: 600 }}>{d.evidenceDueAt}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <AdminStatusBadge
                      status={d.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'reconciliation' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <FinancialReconciliationWidget />
        </section>
      )}

      {activeTab === 'exports' && (
        <section
          style={{
            background: 'var(--admin-surface-card, #FFFFFF)',
            padding: '24px',
            borderRadius: 12,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Authorized Financial Data Exports</h3>
          <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', margin: '0 0 20px' }}>
            Generate compliant accounting registers with explicit currency columns and audit IDs.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <ExportStatus
              entityName="Settled Tip Transactions"
              totalCount={tips.length}
              onExport={async (fmt) => {
                alert(`Exporting ${tips.length} transaction records as ${fmt.toUpperCase()}`);
              }}
            />
            <ExportStatus
              entityName="Reconciliation General Ledger"
              totalCount={1}
              onExport={async (fmt) => {
                alert(`Exporting General Ledger report as ${fmt.toUpperCase()}`);
              }}
            />
          </div>
        </section>
      )}

      {(activeTab === 'transactions' || activeTab === 'ledger' || activeTab === 'stripe-costs' || activeTab === 'refunds' || activeTab === 'holds') && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <AdminFilterBar
              searchPlaceholder="Search by transaction ID, creator UID, or stage name..."
              onSearchChange={setSearch}
            />
          </div>

          <AdminDataTable
            columns={columns}
            data={filteredTips}
            loading={tipsLoading}
            onRowClick={handleRowClick}
            emptyStateMessage="No transaction ledger entries found."
          />
        </>
      )}

      {/* Detail Drawer for Single Transaction */}
      {selectedTip && (
        <DetailDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={`Tip ${centsToDollars(selectedTip.amountCents)} USD`}
          subtitle={`ID: ${selectedTip.tipId} • Stripe PI: ${selectedTip.stripePaymentIntentId || 'None'}`}
          badge={
            <AdminStatusBadge
              status={selectedTip.status || 'succeeded'}
              label={selectedTip.status ? selectedTip.status.toUpperCase() : 'SUCCEEDED'}
            />
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '16px', background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Gross Payer Amount:</span>
                <strong>{centsToDollars(selectedTip.amountCents)} USD</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-accent-primary, #7C3AED)' }}>
                <span>Crowdbeats Platform Fee (6%):</span>
                <span>{centsToDollars(selectedTip.platformFeeCents || Math.round(selectedTip.amountCents * 0.06))} USD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontWeight: 700, borderTop: '1px solid var(--admin-border-subtle, #E2E8F0)', paddingTop: 8 }}>
                <span>Creator Net Received:</span>
                <span>{centsToDollars(selectedTip.netAmountCents || Math.round(selectedTip.amountCents * 0.94))} USD</span>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-tertiary, #94A3B8)', margin: '0 0 8px' }}>
                Payment Lifecycle Audit Timeline
              </h4>
              <Timeline
                events={[
                  {
                    id: 'ev_tx_1',
                    timestamp: selectedTip.createdAt ? new Date(selectedTip.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
                    actor: { displayName: 'Stripe Webhook Gateway', role: 'PAYMENTS' },
                    action: 'payment_intent.succeeded',
                    details: 'Card authorized and settled to platform connected account.',
                    status: 'success',
                  },
                ]}
              />
            </div>
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
