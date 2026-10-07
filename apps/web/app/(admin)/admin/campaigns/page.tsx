'use client';

import React, { useState, useMemo } from 'react';
import {
  AdminKpiCard,
  AdminDataTable,
  AdminFilterBar,
  AdminStatusBadge,
  DetailDrawer,
  ActionDialog,
  Timeline,
  CampaignsIcon,
  DollarSignIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  UsersIcon,
  ExternalLinkIcon,
  type Column,
} from '@/components/admin';
import { centsToDollars } from '@/lib/admin/adminFirestore';

type CampaignTab = 'pending-review' | 'active' | 'completed' | 'rejected' | 'flagged' | 'rewards' | 'updates' | 'reports';

interface AdminCampaign {
  id: string;
  title: string;
  creatorName: string;
  creatorUid: string;
  creatorVerified: boolean;
  goalCents: number;
  pledgedCents: number;
  backersCount: number;
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'COMPLETED' | 'REJECTED' | 'FLAGGED';
  submittedAt: string;
  ageDays: number;
  flagsCount: number;
  category: string;
  story: string;
  rewards: Array<{
    id: string;
    title: string;
    amountCents: number;
    estimatedDelivery: string;
    backers: number;
    isOverdue?: boolean;
  }>;
}

const SAMPLE_CAMPAIGNS: AdminCampaign[] = [
  {
    id: 'cmp_01',
    title: 'Neon Horizon Debut Vinyl & UK Tour',
    creatorName: 'The Neon Drift',
    creatorUid: 'usr_leo_sterling',
    creatorVerified: true,
    goalCents: 1500000,
    pledgedCents: 1125000,
    backersCount: 184,
    status: 'ACTIVE',
    submittedAt: '2026-09-20T10:00:00Z',
    ageDays: 16,
    flagsCount: 0,
    category: 'Album Production & Vinyl Pressing',
    story: 'Crowdfunding our debut 12-track studio LP on limited-edition marbled violet vinyl, mastered specifically for analog pressings.',
    rewards: [
      { id: 'rew_1', title: 'Digital Album + Bonus Track', amountCents: 1500, estimatedDelivery: '2026-11-01', backers: 98 },
      { id: 'rew_2', title: 'Limited Vinyl LP + Signed Poster', amountCents: 4500, estimatedDelivery: '2026-12-15', backers: 64 },
    ],
  },
  {
    id: 'cmp_02',
    title: 'Tokyo Street Busking Documentary',
    creatorName: 'Maya Lin',
    creatorUid: 'usr_maya_lin',
    creatorVerified: true,
    goalCents: 800000,
    pledgedCents: 0,
    backersCount: 0,
    status: 'PENDING_REVIEW',
    submittedAt: '2026-10-05T14:20:00Z',
    ageDays: 1,
    flagsCount: 0,
    category: 'Film & Media',
    story: 'Documenting 3 weeks of solo acoustic street busking across Tokyo train stations and public plazas with 4K binaural audio gear.',
    rewards: [
      { id: 'rew_3', title: 'Early Access 4K Stream', amountCents: 2000, estimatedDelivery: '2027-01-20', backers: 0 },
    ],
  },
  {
    id: 'cmp_03',
    title: 'New Orleans Brass Summer Camp Scholarships',
    creatorName: 'Brass Roots Collective',
    creatorUid: 'usr_marcus_vance',
    creatorVerified: true,
    goalCents: 2000000,
    pledgedCents: 2040000,
    backersCount: 312,
    status: 'COMPLETED',
    submittedAt: '2026-08-01T09:00:00Z',
    ageDays: 66,
    flagsCount: 0,
    category: 'Community & Education',
    story: 'Funding 25 full scholarships for youth brass musicians to attend our 6-week summer masterclass in New Orleans.',
    rewards: [
      { id: 'rew_4', title: 'Sponsor Badge + VIP Concert Ticket', amountCents: 10000, estimatedDelivery: '2026-09-01', backers: 25, isOverdue: true },
    ],
  },
  {
    id: 'cmp_04',
    title: 'Unauthorized Re-press of Vintage Funk Samples',
    creatorName: 'Anonymous DJ',
    creatorUid: 'usr_anon_99',
    creatorVerified: false,
    goalCents: 500000,
    pledgedCents: 120000,
    backersCount: 14,
    status: 'FLAGGED',
    submittedAt: '2026-10-03T11:00:00Z',
    ageDays: 3,
    flagsCount: 4,
    category: 'DJ Mixtape',
    story: 'Pressing 500 bootleg vinyl copies of uncleared 1970s soul records.',
    rewards: [
      { id: 'rew_5', title: 'Bootleg Vinyl', amountCents: 3500, estimatedDelivery: '2026-11-10', backers: 14 },
    ],
  },
];

export default function EnterpriseCampaignsPage() {
  const [activeTab, setActiveTab] = useState<CampaignTab>('pending-review');
  const [search, setSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<AdminCampaign | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState<{
    type: 'approve' | 'reject' | 'pause';
    campaign: AdminCampaign;
  } | null>(null);

  const filteredCampaigns = useMemo(() => {
    let list = SAMPLE_CAMPAIGNS;
    if (activeTab === 'pending-review') {
      list = list.filter((c) => c.status === 'PENDING_REVIEW');
    } else if (activeTab === 'active') {
      list = list.filter((c) => c.status === 'ACTIVE');
    } else if (activeTab === 'completed') {
      list = list.filter((c) => c.status === 'COMPLETED');
    } else if (activeTab === 'rejected') {
      list = list.filter((c) => c.status === 'REJECTED');
    } else if (activeTab === 'flagged') {
      list = list.filter((c) => c.status === 'FLAGGED' || c.flagsCount > 0);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => (
        c.title.toLowerCase().includes(q) ||
        c.creatorName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      ));
    }
    return list;
  }, [activeTab, search]);

  const handleRowClick = (c: AdminCampaign) => {
    setSelectedCampaign(c);
    setIsDrawerOpen(true);
  };

  const handleDecision = async (reason: string) => {
    if (!decisionAction) return;
    alert(`Campaign ${decisionAction.campaign.id} actioned: ${decisionAction.type.toUpperCase()} with reason: ${reason}`);
    setDecisionAction(null);
  };

  const columns: Column<AdminCampaign>[] = [
    {
      key: 'campaign',
      header: 'Campaign & Category',
      cell: (c) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)' }}>
            {c.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)', marginTop: 2 }}>
            {c.category} • ID: {c.id}
          </div>
        </div>
      ),
    },
    {
      key: 'creator',
      header: 'Creator',
      cell: (c) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>
            {c.creatorName}
          </div>
          <div style={{ fontSize: 11, color: c.creatorVerified ? '#059669' : '#D97706' }}>
            {c.creatorVerified ? '✓ Identity Verified' : '⚠ Verification Pending'}
          </div>
        </div>
      ),
    },
    {
      key: 'funding',
      header: 'Goal & Progress',
      cell: (c) => {
        const pct = Math.min(100, Math.round((c.pledgedCents / c.goalCents) * 100));
        return (
          <div style={{ minWidth: 160 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: '#10B981' }}>{centsToDollars(c.pledgedCents)}</span>
              <span style={{ color: 'var(--admin-text-tertiary, #94A3B8)' }}>of {centsToDollars(c.goalCents)} ({pct}%)</span>
            </div>
            <div style={{ height: 6, borderRadius: 9999, background: 'var(--admin-surface-raised, #F1F5F9)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#10B981' : '#8B5CF6', borderRadius: 9999 }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => (
        <AdminStatusBadge
          status={c.status}
          label={c.status.replace(/_/g, ' ')}
        />
      ),
    },
    {
      key: 'age',
      header: 'Age',
      cell: (c) => (
        <span style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)' }}>
          {c.ageDays}d in queue
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          {c.status === 'PENDING_REVIEW' && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDecisionAction({ type: 'approve', campaign: c });
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDecisionAction({ type: 'reject', campaign: c });
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'transparent',
                  color: '#DC2626',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reject
              </button>
            </>
          )}
          {c.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDecisionAction({ type: 'pause', campaign: c });
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                background: 'transparent',
                color: 'var(--admin-text-secondary, #64748B)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Pause
            </button>
          )}
        </div>
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
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              margin: 0,
              color: 'var(--admin-text-primary, #0F172A)',
              letterSpacing: '-0.025em',
            }}
          >
            Campaigns
          </h1>
          <p
            style={{
              color: 'var(--admin-text-secondary, #64748B)',
              fontSize: 13,
              margin: '4px 0 0',
              lineHeight: 1.4,
            }}
          >
            Crowdfunding review queue, milestone verification, escrow fund safety, and reward delivery tracking.
          </p>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. TOP FOUR CARDS
      ───────────────────────────────────────────────────────────────────────── */}
      <section aria-label="Campaign Overview Metrics">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          <AdminKpiCard
            title="Active Campaigns"
            value="18 Active"
            subtitle="Currently accepting pledges"
            trend={{ value: "+3 this month", isPositive: true }}
            icon={<CampaignsIcon size={18} strokeWidth={2.2} />}
            accentColor="#8B5CF6"
            tooltip="Live crowdfunding campaigns currently in progress and collecting fan pledges."
          />

          <AdminKpiCard
            title="Received Contributions"
            value="$48,250.00"
            subtitle="Gross volume in escrow"
            trend={{ value: "+24.8%", isPositive: true }}
            icon={<DollarSignIcon size={18} strokeWidth={2.2} />}
            accentColor="#10B981"
            tooltip="Total funds pledged and authorized by backers across active and completed campaigns."
          />

          <AdminKpiCard
            title="Pending Reviews"
            value="3 Reviews"
            subtitle="Awaiting admin approval"
            isAdverse={true}
            trend={{ value: "3 In Queue", isPositive: true, label: "avg age 1.2d" }}
            icon={<ClockIcon size={18} strokeWidth={2.2} />}
            accentColor="#F59E0B"
            tooltip="Submitted campaigns awaiting staff review of rewards, copyright, and creator identity."
          />

          <AdminKpiCard
            title="Overdue Rewards"
            value="1 Overdue"
            subtitle="Delivery past deadline"
            isAdverse={true}
            trend={{ value: "1 Tier", isPositive: true, label: "action required" }}
            icon={<AlertTriangleIcon size={18} strokeWidth={2.2} />}
            accentColor="#EF4444"
            tooltip="Creator reward tiers that have passed their estimated delivery date without fulfillment."
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
          { id: 'pending-review', label: 'Pending Review', count: 1 },
          { id: 'active', label: 'Active' },
          { id: 'completed', label: 'Completed' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'flagged', label: 'Flagged', count: 1 },
          { id: 'rewards', label: 'Rewards & Fulfillment' },
          { id: 'updates', label: 'Creator Updates' },
          { id: 'reports', label: 'Escrow Reports' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveTab(tab.id as CampaignTab)}
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
                    background: tab.id === 'flagged' ? '#EF4444' : 'var(--admin-accent-primary, #7C3AED)',
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
      {activeTab === 'rewards' ? (
        <section
          style={{
            background: 'var(--admin-surface-card, #FFFFFF)',
            borderRadius: 12,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Reward Fulfillment Obligations & Deadlines</h3>
            <p style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', margin: '2px 0 0' }}>
              Tracks physical merch pressing, vinyl shipments, and digital perk distribution
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Reward Tier</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Campaign</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Backers</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Price</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Estimated Delivery</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_CAMPAIGNS.flatMap((c) => c.rewards.map((r) => ({ ...r, campaignTitle: c.title }))).map((rew) => (
                <tr key={rew.id} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{rew.title}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--admin-text-secondary, #64748B)' }}>{rew.campaignTitle}</td>
                  <td style={{ padding: '14px 16px', fontVariantNumeric: 'tabular-nums' }}>{rew.backers} backers</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{centsToDollars(rew.amountCents)}</td>
                  <td style={{ padding: '14px 16px', color: rew.isOverdue ? '#DC2626' : 'inherit' }}>
                    {rew.estimatedDelivery} {rew.isOverdue && '(OVERDUE)'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <AdminStatusBadge
                      status={rew.isOverdue ? 'FLAGGED' : 'ACTIVE'}
                      label={rew.isOverdue ? 'OVERDUE' : 'ON TRACK'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <AdminFilterBar
              searchPlaceholder="Search campaigns by title, creator, or ID..."
              onSearchChange={setSearch}
            />
          </div>

          <AdminDataTable
            columns={columns}
            data={filteredCampaigns}
            onRowClick={handleRowClick}
            emptyStateMessage="No campaigns matching current filters."
          />
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          5. REVIEW WORKSPACE (PREVIEW LEFT + CHECKLIST RIGHT)
      ───────────────────────────────────────────────────────────────────────── */}
      {selectedCampaign && (
        <DetailDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={selectedCampaign.title}
          subtitle={`By ${selectedCampaign.creatorName} • Submitted ${selectedCampaign.submittedAt.slice(0, 10)}`}
          width={720}
          badge={
            <AdminStatusBadge
              status={selectedCampaign.status}
              label={selectedCampaign.status.replace(/_/g, ' ')}
            />
          }
          footerActions={
            selectedCampaign.status === 'PENDING_REVIEW' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDecisionAction({ type: 'reject', campaign: selectedCampaign });
                    setIsDrawerOpen(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'transparent',
                    color: '#DC2626',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reject with Reason
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDecisionAction({ type: 'approve', campaign: selectedCampaign });
                    setIsDrawerOpen(false);
                  }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#10B981',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Approve Publication
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  background: 'transparent',
                  color: 'var(--admin-text-secondary, #64748B)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Drawer
              </button>
            )
          }
        >
          {/* 2-Column Split: Content Preview Left + Checklist Right */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
            {/* Left: Content Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-tertiary, #94A3B8)', margin: '0 0 6px' }}>
                  Campaign Story & Pitch
                </h4>
                <div style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', lineHeight: 1.5, background: 'var(--admin-surface-raised, #F8FAFC)', padding: '14px', borderRadius: 8 }}>
                  {selectedCampaign.story}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-tertiary, #94A3B8)', margin: '0 0 8px' }}>
                  Reward Tiers ({selectedCampaign.rewards.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedCampaign.rewards.map((r) => (
                    <div key={r.id} style={{ padding: '10px 12px', border: '1px solid var(--admin-border-subtle, #E2E8F0)', borderRadius: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 13 }}>
                        <span>{r.title}</span>
                        <span style={{ color: '#10B981' }}>{centsToDollars(r.amountCents)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)', marginTop: 2 }}>
                        Est. Delivery: {r.estimatedDelivery} • {r.backers} backers
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Escrow Financial Ledger Breakdown */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-tertiary, #94A3B8)', margin: '0 0 8px' }}>
                  Escrow Funds Breakdown
                </h4>
                <div style={{ padding: '12px', background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 8, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Gross Pledged:</span>
                    <strong>{centsToDollars(selectedCampaign.pledgedCents)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Crowdbeats Platform Fee (6%):</span>
                    <span>{centsToDollars(selectedCampaign.pledgedCents * 0.06)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Estimated Stripe Processing (2.9% + $0.30):</span>
                    <span>{centsToDollars(selectedCampaign.pledgedCents * 0.032)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--admin-border-subtle, #E2E8F0)', paddingTop: 6, fontWeight: 700, color: '#10B981' }}>
                    <span>Creator Net Available:</span>
                    <span>{centsToDollars(selectedCampaign.pledgedCents * 0.908)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Structured Moderation Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-tertiary, #94A3B8)', margin: 0 }}>
                Moderation Checklist
              </h4>

              {[
                { label: 'Creator Identity Verified', pass: selectedCampaign.creatorVerified },
                { label: 'Stripe Payout Routing Configured', pass: selectedCampaign.creatorVerified },
                { label: 'Copyright & Audio Samples Cleared', pass: selectedCampaign.flagsCount === 0 },
                { label: 'Merch Delivery Feasibility Verified', pass: true },
                { label: 'Statutory Escrow Terms Accepted', pass: true },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: item.pass ? '#10B981' : '#EF4444' }}>
                    {item.pass ? '✓' : '✗'}
                  </span>
                  <span style={{ color: item.pass ? 'var(--admin-text-primary, #0F172A)' : '#DC2626', fontWeight: 500 }}>
                    {item.label}
                  </span>
                </div>
              ))}

              <div style={{ marginTop: 12, padding: '12px', background: 'rgba(124, 58, 237, 0.06)', borderRadius: 8, fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', lineHeight: 1.4 }}>
                <strong>Operational Policy:</strong> Approval releases the campaign to public discovery. Funds remain in escrow until the goal is achieved or campaign window expires.
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Decision Dialog */}
      {decisionAction && (
        <ActionDialog
          isOpen={Boolean(decisionAction)}
          onClose={() => setDecisionAction(null)}
          onConfirm={handleDecision}
          title={
            decisionAction.type === 'approve'
              ? 'Approve Crowdfunding Campaign'
              : decisionAction.type === 'reject'
              ? 'Reject Campaign Submission'
              : 'Pause Campaign'
          }
          targetDescription={`${decisionAction.campaign.title} (${decisionAction.campaign.creatorName})`}
          consequenceText={
            decisionAction.type === 'approve'
              ? 'Publishes the campaign to discovery and enables backer credit card pledge collection.'
              : decisionAction.type === 'reject'
              ? 'Rejects the campaign. The creator will be notified with your documented reason.'
              : 'Temporarily halts pledge collection and hides campaign from public discovery.'
          }
          isDestructive={decisionAction.type === 'reject'}
          confirmLabel={
            decisionAction.type === 'approve'
              ? 'Approve Publication'
              : decisionAction.type === 'reject'
              ? 'Reject Campaign'
              : 'Pause Campaign'
          }
          requiresReason={true}
        />
      )}
    </div>
  );
}
