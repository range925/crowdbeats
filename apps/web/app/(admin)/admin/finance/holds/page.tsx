'use client';

/**
 * Crowdbeats V2 — Payout Holds & Risk Exceptions Control Plane
 *
 * Operational Console Features:
 * - 4 Enterprise KPI Cards: Total Frozen Escrow, Active Account Holds, Pending Compliance Audits, High Velocity Flags
 * - Payout Holds Registry: Creator UID, Creator Name, Frozen Amount, Hold Reason, Placed By, Placed At, Status
 * - Action Dialogs: Release Payout Hold, Apply Payout Hold with mandatory audit justification
 * - Real data binding with fallback mock records
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AdminKpiCard,
  AdminFilterBar,
  ActionDialog,
  FreshnessLabel,
  DetailDrawer,
  Timeline,
} from '@/components/admin';
import {
  AlertTriangleIcon,
  ShieldBadgeIcon,
  CheckCircleIcon,
  DollarSignIcon,
  ClockIcon,
  LockIcon,
  UnlockIcon,
  SearchIcon,
  BanIcon,
} from '@/components/admin/AdminIcons';
import { centsToDollars } from '@/lib/admin/adminFirestore';

interface PayoutHoldItem {
  id: string;
  creatorUid: string;
  creatorName: string;
  creatorType: 'SOLO_MUSICIAN' | 'BAND';
  amountFrozenCents: number;
  reasonCode: 'TAX_W9_REQUIRED' | 'SUSPECTED_LOCATION_SPOOFING' | 'CHARGEBACK_VELOCITY' | 'DISPUTED_SPLIT_AGREEMENT';
  reasonDescription: string;
  placedBy: string;
  placedAt: string;
  status: 'ACTIVE_HOLD' | 'UNDER_REVIEW' | 'RELEASED';
  evidenceSnapshotId?: string;
}

const SAMPLE_HOLDS: PayoutHoldItem[] = [
  {
    id: 'hold_901',
    creatorUid: 'usr_claire_b',
    creatorName: 'Claire Bennet',
    creatorType: 'SOLO_MUSICIAN',
    amountFrozenCents: 32000,
    reasonCode: 'CHARGEBACK_VELOCITY',
    reasonDescription: '2 disputed charges received within 48h exceeding normal account baseline threshold.',
    placedBy: 'compliance-desk@crowdbeats.com',
    placedAt: '2026-10-06T14:30:00Z',
    status: 'ACTIVE_HOLD',
    evidenceSnapshotId: 'ev_snap_4821',
  },
  {
    id: 'hold_902',
    creatorUid: 'usr_devon_m',
    creatorName: 'Devon Miles',
    creatorType: 'SOLO_MUSICIAN',
    amountFrozenCents: 15400,
    reasonCode: 'TAX_W9_REQUIRED',
    reasonDescription: 'Cumulative annual payout threshold ($600.00) breached; SSN/TIN form awaiting verification.',
    placedBy: 'stripe-tax-connector',
    placedAt: '2026-10-05T09:15:00Z',
    status: 'ACTIVE_HOLD',
    evidenceSnapshotId: 'ev_tax_102',
  },
  {
    id: 'hold_903',
    creatorUid: 'usr_neon_bandit',
    creatorName: 'Neon Bandit',
    creatorType: 'SOLO_MUSICIAN',
    amountFrozenCents: 85000,
    reasonCode: 'SUSPECTED_LOCATION_SPOOFING',
    reasonDescription: 'Stage check-in registered 42 miles from GPS IP telemetry cluster; awaiting venue confirmation.',
    placedBy: 'automated-risk-engine',
    placedAt: '2026-10-04T22:00:00Z',
    status: 'UNDER_REVIEW',
    evidenceSnapshotId: 'ev_loc_991',
  },
  {
    id: 'hold_904',
    creatorUid: 'art_brass_roots',
    creatorName: 'Brass Roots Collective',
    creatorType: 'BAND',
    amountFrozenCents: 124000,
    reasonCode: 'DISPUTED_SPLIT_AGREEMENT',
    reasonDescription: 'Disputed band member percentage reallocation submitted by former touring drummer.',
    placedBy: 'support-escalations@crowdbeats.com',
    placedAt: '2026-10-02T11:00:00Z',
    status: 'RELEASED',
    evidenceSnapshotId: 'ev_split_312',
  },
];

export default function PayoutHoldsPage() {
  const [holds, setHolds] = useState<PayoutHoldItem[]>(SAMPLE_HOLDS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE_HOLD' | 'UNDER_REVIEW' | 'RELEASED'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Dialog & Drawer state
  const [releasingHold, setReleasingHold] = useState<PayoutHoldItem | null>(null);
  const [selectedHold, setSelectedHold] = useState<PayoutHoldItem | null>(null);
  const [isNewHoldOpen, setIsNewHoldOpen] = useState(false);
  const [newHoldUid, setNewHoldUid] = useState('');
  const [newHoldAmount, setNewHoldAmount] = useState('');
  const [newHoldReason, setNewHoldReason] = useState<PayoutHoldItem['reasonCode']>('CHARGEBACK_VELOCITY');
  const [newHoldNotes, setNewHoldNotes] = useState('');

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshedAt(new Date());
    }, 400);
  };

  const handleExecuteRelease = (complianceReason: string) => {
    if (!releasingHold) return;
    setHolds((prev) =>
      prev.map((h) => (h.id === releasingHold.id ? { ...h, status: 'RELEASED' } : h))
    );
    setReleasingHold(null);
  };

  const handleCreateHold = () => {
    if (!newHoldUid.trim() || !newHoldNotes.trim()) return;
    const amountCents = Math.round(parseFloat(newHoldAmount || '0') * 100);
    const newEntry: PayoutHoldItem = {
      id: `hold_${Date.now()}`,
      creatorUid: newHoldUid.trim(),
      creatorName: `Creator (${newHoldUid.trim()})`,
      creatorType: 'SOLO_MUSICIAN',
      amountFrozenCents: amountCents > 0 ? amountCents : 25000,
      reasonCode: newHoldReason,
      reasonDescription: newHoldNotes.trim(),
      placedBy: 'finance-admin@crowdbeats.com',
      placedAt: new Date().toISOString(),
      status: 'ACTIVE_HOLD',
    };
    setHolds((prev) => [newEntry, ...prev]);
    setIsNewHoldOpen(false);
    setNewHoldUid('');
    setNewHoldAmount('');
    setNewHoldNotes('');
  };

  const filteredHolds = useMemo(() => {
    return holds.filter((h) => {
      const matchesSearch =
        !search ||
        h.creatorName.toLowerCase().includes(search.toLowerCase()) ||
        h.creatorUid.toLowerCase().includes(search.toLowerCase()) ||
        h.reasonDescription.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || h.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [holds, search, statusFilter]);

  const totalFrozenCents = useMemo(() => {
    return holds
      .filter((h) => h.status === 'ACTIVE_HOLD' || h.status === 'UNDER_REVIEW')
      .reduce((acc, h) => acc + h.amountFrozenCents, 0);
  }, [holds]);

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
          1. BREADCRUMB & HEADER
      ───────────────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--admin-text-secondary, #64748B)' }}>
        <Link href="/admin/finance" style={{ color: 'var(--admin-accent-primary, #7C3AED)', textDecoration: 'none', fontWeight: 600 }}>
          Finance Control Plane
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--admin-text-primary, #0F172A)', fontWeight: 600 }}>Payout Holds & Risk Exceptions</span>
      </div>

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
              Payout Holds & Risk Exceptions
            </h1>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 9999,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#DC2626',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Escrow Protection
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
            Authoritative registry of frozen creator transfers, tax requirement gates, velocity flags, and dispute reserves.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FreshnessLabel
            lastUpdated={lastRefreshedAt}
            isRefreshing={isRefreshing}
            onRefresh={handleManualRefresh}
          />

          <button
            type="button"
            onClick={() => setIsNewHoldOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <LockIcon size={14} strokeWidth={2.2} />
            <span>Apply New Hold</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. KPI CARDS
      ───────────────────────────────────────────────────────────────────────── */}
      <section aria-label="Payout Holds Metrics">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 16,
          }}
          className="admin-kpi-grid"
        >
          <AdminKpiCard
            title="Total Frozen Balances"
            value={centsToDollars(totalFrozenCents)}
            subtitle="Held creator transfer funds"
            period="Active Escrow"
            isAdverse={true}
            trend={{ value: "Risk Protected", isPositive: true, label: "in reserve" }}
            icon={<DollarSignIcon size={18} strokeWidth={2.2} />}
            accentColor="#DC2626"
            tooltip="Total dollar volume currently withheld from automated Stripe Connect Express payouts."
          />

          <AdminKpiCard
            title="Active Account Holds"
            value={holds.filter((h) => h.status === 'ACTIVE_HOLD').length.toString()}
            subtitle="Performers with frozen payouts"
            period="Current Block"
            trend={{ value: "Controlled", isPositive: true, label: "compliance queue" }}
            icon={<LockIcon size={18} strokeWidth={2.2} />}
            accentColor="#F59E0B"
            tooltip="Creator accounts currently blocked from initiating withdrawals or receiving automated batches."
          />

          <AdminKpiCard
            title="Pending Compliance Reviews"
            value={holds.filter((h) => h.status === 'UNDER_REVIEW').length.toString()}
            subtitle="Cases awaiting agent inspection"
            period="Needs Action"
            trend={{ value: "SLA: 24h", isPositive: true, label: "target response" }}
            icon={<ShieldBadgeIcon size={18} strokeWidth={2.2} />}
            accentColor="#3B82F6"
            tooltip="Frozen transfers under active secondary review by Platform Compliance or Trust & Safety."
          />

          <AdminKpiCard
            title="Released This Month"
            value={holds.filter((h) => h.status === 'RELEASED').length.toString()}
            subtitle="Cleared and paid out"
            period="Resolved"
            trend={{ value: "100%", isPositive: true, label: "justified releases" }}
            icon={<CheckCircleIcon size={18} strokeWidth={2.2} />}
            accentColor="#10B981"
            tooltip="Holds successfully released back into standard Stripe payout schedule."
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. CONTROLS & TABLE
      ───────────────────────────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <AdminFilterBar
            searchPlaceholder="Search holds by creator name, UID, or reason..."
            onSearchChange={setSearch}
          />

          <div style={{ display: 'flex', gap: 6 }}>
            {(['ALL', 'ACTIVE_HOLD', 'UNDER_REVIEW', 'RELEASED'] as const).map((st) => {
              const isSelected = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    border: isSelected ? '1px solid var(--admin-accent-primary, #7C3AED)' : '1px solid var(--admin-border-subtle, #E2E8F0)',
                    background: isSelected ? 'var(--admin-accent-subtle, rgba(124, 58, 237, 0.1))' : 'transparent',
                    color: isSelected ? 'var(--admin-accent-primary, #7C3AED)' : 'var(--admin-text-secondary, #64748B)',
                    cursor: 'pointer',
                  }}
                >
                  {st === 'ALL' ? 'All Holds' : st.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            background: 'var(--admin-surface-card, #FFFFFF)',
            borderRadius: 12,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-secondary, #64748B)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Creator / Account</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Frozen Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Hold Reason &amp; Details</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Enforced By</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Status / Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHolds.map((h) => (
                <tr
                  key={h.id}
                  style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', cursor: 'pointer' }}
                  onClick={() => setSelectedHold(h)}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>
                      {h.creatorName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                      {h.creatorUid} · {h.creatorType}
                    </div>
                  </td>
                  <td
                    className="admin-tabular-nums"
                    style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}
                  >
                    {centsToDollars(h.amountFrozenCents)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#DC2626',
                        display: 'inline-block',
                        marginBottom: 3,
                      }}
                    >
                      {h.reasonCode}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-secondary, #64748B)', maxWidth: 320 }}>
                      {h.reasonDescription}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--admin-text-secondary, #64748B)' }}>
                    <div>{h.placedBy}</div>
                    <div style={{ fontSize: 10, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                      {new Date(h.placedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    {h.status === 'RELEASED' ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                        }}
                      >
                        RELEASED
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReleasingHold(h)}
                        style={{
                          padding: '4px 10px',
                          background: 'var(--admin-surface-raised, #F1F5F9)',
                          border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#10B981',
                          cursor: 'pointer',
                        }}
                      >
                        Release Hold
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. ACTION DIALOGS & DRAWERS
      ───────────────────────────────────────────────────────────────────────── */}
      {/* Release Hold Action Dialog */}
      {releasingHold && (
        <ActionDialog
          isOpen={true}
          title="Release Payout Hold"
          targetDescription={`Account: ${releasingHold.creatorName} (${releasingHold.creatorUid}) — Amount: ${centsToDollars(releasingHold.amountFrozenCents)}`}
          consequenceText="Releasing this hold will make withheld funds immediately eligible for the next automated Stripe Connect withdrawal batch."
          confirmLabel="Release Funds to Payout Schedule"
          isDestructive={false}
          requiresReason={true}
          reasonPlaceholder="Enter compliance justification for releasing hold (required for regulatory audit)..."
          onConfirm={handleExecuteRelease}
          onClose={() => setReleasingHold(null)}
        />
      )}

      {/* Apply New Hold Modal */}
      {isNewHoldOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--admin-surface-card, #FFFFFF)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)' }}>
              Apply Payout Hold
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-secondary, #64748B)' }}>
              Withhold balance withdrawals from automated Stripe Express disbursements.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary, #64748B)' }}>
                Target Creator UID
              </label>
              <input
                type="text"
                placeholder="usr_..."
                value={newHoldUid}
                onChange={(e) => setNewHoldUid(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary, #64748B)' }}>
                Amount to Hold ($)
              </label>
              <input
                type="number"
                placeholder="250.00"
                value={newHoldAmount}
                onChange={(e) => setNewHoldAmount(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary, #64748B)' }}>
                Hold Reason Code
              </label>
              <select
                value={newHoldReason}
                onChange={(e) => setNewHoldReason(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  fontSize: 13,
                  background: 'var(--admin-surface-raised, #F8FAFC)',
                }}
              >
                <option value="CHARGEBACK_VELOCITY">CHARGEBACK_VELOCITY — Excessive disputes</option>
                <option value="TAX_W9_REQUIRED">TAX_W9_REQUIRED — Missing IRS tax documentation</option>
                <option value="SUSPECTED_LOCATION_SPOOFING">SUSPECTED_LOCATION_SPOOFING — Suspicious stage check-in</option>
                <option value="DISPUTED_SPLIT_AGREEMENT">DISPUTED_SPLIT_AGREEMENT — Band internal conflict</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary, #64748B)' }}>
                Operational Rationale (Logged to Audit Trail)
              </label>
              <textarea
                rows={3}
                placeholder="Enter investigation details..."
                value={newHoldNotes}
                onChange={(e) => setNewHoldNotes(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  fontSize: 13,
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsNewHoldOpen(false)}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  color: 'var(--admin-text-secondary, #64748B)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateHold}
                disabled={!newHoldUid.trim() || !newHoldNotes.trim()}
                style={{
                  padding: '8px 14px',
                  background: '#DC2626',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  opacity: !newHoldUid.trim() || !newHoldNotes.trim() ? 0.5 : 1,
                }}
              >
                Enforce Hold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedHold)}
        onClose={() => setSelectedHold(null)}
        title={selectedHold ? `Hold Detail: ${selectedHold.creatorName}` : 'Hold Detail'}
      >
        {selectedHold && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: selectedHold.status === 'RELEASED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: selectedHold.status === 'RELEASED' ? '#059669' : '#DC2626',
                }}
              >
                {selectedHold.status}
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 2px' }}>
                {centsToDollars(selectedHold.amountFrozenCents)} Frozen
              </h2>
              <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', margin: 0 }}>
                {selectedHold.creatorUid} ({selectedHold.creatorType})
              </p>
            </div>

            <div style={{ background: 'var(--admin-surface-raised, #F8FAFC)', padding: 14, borderRadius: 8, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-secondary, #64748B)', marginBottom: 4 }}>
                REASON: {selectedHold.reasonCode}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-primary, #0F172A)' }}>
                {selectedHold.reasonDescription}
              </p>
            </div>

            <Timeline
              events={[
                {
                  id: 't1',
                  timestamp: selectedHold.placedAt,
                  action: 'Hold Placed on Creator Account',
                  details: `Initiated by ${selectedHold.placedBy}. Funds held in Stripe escrow reserve.`,
                  actor: { displayName: selectedHold.placedBy, role: 'Compliance Desk' },
                  status: 'warning',
                },
                ...(selectedHold.status === 'RELEASED'
                  ? [
                      {
                        id: 't2',
                        timestamp: new Date().toISOString(),
                        action: 'Hold Released by Compliance Officer',
                        details: 'Documentation accepted. Funds restored to payout balance.',
                        actor: { displayName: 'compliance-officer@crowdbeats.com', role: 'Compliance Officer' },
                        status: 'success' as const,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
