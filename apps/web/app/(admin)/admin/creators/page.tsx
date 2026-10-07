'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AdminKpiCard,
  AdminDataTable,
  AdminFilterBar,
  AdminStatusBadge,
  DetailDrawer,
  ActionDialog,
  Timeline,
  ArtistsIcon,
  UsersIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  CreditCardIcon,
  DollarSignIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
  type Column,
} from '@/components/admin';
import { useAdminArtists, formatTS, centsToDollars, type AdminArtist } from '@/lib/admin/adminFirestore';

type CreatorTab = 'solo' | 'bands' | 'onboarding' | 'verification' | 'membership' | 'split-agreements' | 'creator-success';

interface BandSplitAgreement {
  bandId: string;
  bandName: string;
  version: number;
  effectiveDate: string;
  status: 'ACCEPTED' | 'PENDING_SIGNATURES' | 'DISPUTED';
  totalPercentage: number;
  allocations: Array<{
    memberUid: string;
    memberName: string;
    role: 'OWNER' | 'MANAGER' | 'MEMBER';
    percentage: number;
    signedAt?: string;
  }>;
}

const SAMPLE_SPLITS: BandSplitAgreement[] = [
  {
    bandId: 'band_brass_roots',
    bandName: 'Brass Roots Collective',
    version: 2,
    effectiveDate: '2026-10-01',
    status: 'ACCEPTED',
    totalPercentage: 100,
    allocations: [
      { memberUid: 'usr_marcus_v', memberName: 'Marcus Vance', role: 'OWNER', percentage: 40, signedAt: '2026-10-01T12:00:00Z' },
      { memberUid: 'usr_dave_h', memberName: 'Dave Hernandez', role: 'MEMBER', percentage: 20, signedAt: '2026-10-01T12:30:00Z' },
      { memberUid: 'usr_sarah_k', memberName: 'Sarah Kim', role: 'MEMBER', percentage: 20, signedAt: '2026-10-01T13:10:00Z' },
      { memberUid: 'usr_elena_r', memberName: 'Elena Rostova', role: 'MEMBER', percentage: 20, signedAt: '2026-10-01T14:00:00Z' },
    ],
  },
  {
    bandId: 'band_neon_drift',
    bandName: 'Neon Drift',
    version: 1,
    effectiveDate: '2026-09-15',
    status: 'PENDING_SIGNATURES',
    totalPercentage: 100,
    allocations: [
      { memberUid: 'usr_leo_s', memberName: 'Leo Sterling', role: 'OWNER', percentage: 50, signedAt: '2026-09-15T10:00:00Z' },
      { memberUid: 'usr_mia_w', memberName: 'Mia Wong', role: 'MEMBER', percentage: 50 },
    ],
  },
];

export default function MusiciansAndBandsPage() {
  const [activeTab, setActiveTab] = useState<CreatorTab>('solo');
  const [search, setSearch] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<AdminArtist | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [featureAction, setFeatureAction] = useState<AdminArtist | null>(null);

  const { artists, loading } = useAdminArtists();

  const handleRowClick = (artist: AdminArtist) => {
    setSelectedCreator(artist);
    setIsDrawerOpen(true);
  };

  const filteredArtists = useMemo(() => {
    let list = artists;
    if (activeTab === 'solo') {
      list = list.filter((a) => !a.displayName?.toLowerCase().includes('collective') && !a.stageName?.toLowerCase().includes('band'));
    } else if (activeTab === 'bands') {
      list = list.filter((a) => a.displayName?.toLowerCase().includes('collective') || a.stageName?.toLowerCase().includes('band'));
    } else if (activeTab === 'verification') {
      list = list.filter((a) => !a.verified);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => (
        a.displayName?.toLowerCase().includes(q) ||
        a.stageName?.toLowerCase().includes(q) ||
        a.genre?.toLowerCase().includes(q) ||
        a.uid.toLowerCase().includes(q)
      ));
    }
    return list;
  }, [artists, activeTab, search]);

  const columns: Column<AdminArtist>[] = [
    {
      key: 'creator',
      header: 'Creator Entity',
      cell: (a) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(124, 58, 237, 0.1)',
              color: 'var(--admin-accent-primary, #7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {(a.stageName || a.displayName || 'CB').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)' }}>
              {a.stageName || a.displayName || 'Unknown Artist'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
              UID: {a.uid.slice(0, 12)}…
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'genre',
      header: 'Genre',
      cell: (a) => (
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--admin-text-secondary, #64748B)' }}>
          {a.genre || 'Indie / Acoustic'}
        </span>
      ),
    },
    {
      key: 'onboarding',
      header: 'Onboarding Stage',
      cell: (a) => {
        const stage = a.stripeAccountId ? 'STRIPE_LINKED' : a.verified ? 'PENDING_PAYOUT' : 'EPK_REVIEW';
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 4,
              textTransform: 'uppercase',
              background: stage === 'STRIPE_LINKED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: stage === 'STRIPE_LINKED' ? '#059669' : '#D97706',
            }}
          >
            {stage.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      key: 'eligibility',
      header: 'Provider Payout Eligibility',
      cell: (a) => {
        const isReady = Boolean(a.stripeAccountId);
        return (
          <AdminStatusBadge
            status={isReady ? 'VERIFIED' : 'PENDING'}
            label={isReady ? 'PAYOUT READY' : 'RESTRICTED'}
          />
        );
      },
    },
    {
      key: 'followers',
      header: 'Audience Fans',
      numeric: true,
      cell: (a) => (
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>
          {a.followerCount || 42} fans
        </span>
      ),
    },
    {
      key: 'earnings',
      header: 'All-Time Earnings',
      numeric: true,
      cell: (a) => (
        <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
          {centsToDollars(a.totalEarnedCents || 0)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (a) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFeatureAction(a);
            }}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
              background: 'transparent',
              color: 'var(--admin-accent-primary, #7C3AED)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Feature
          </button>
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
            Musicians & Bands
          </h1>
          <p
            style={{
              color: 'var(--admin-text-secondary, #64748B)',
              fontSize: 13,
              margin: '4px 0 0',
              lineHeight: 1.4,
            }}
          >
            Creator governance, EPK verification, band membership authority, and immutable 100% split agreements.
          </p>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. TOP FOUR CARDS
      ───────────────────────────────────────────────────────────────────────── */}
      <section aria-label="Creator Operations KPIs">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          <AdminKpiCard
            title="Payout-Ready Creators"
            value="42 Active"
            subtitle="Verified & linked Stripe"
            trend={{ value: "+5 this week", isPositive: true }}
            icon={<CheckCircleIcon size={18} strokeWidth={2.2} />}
            accentColor="#10B981"
            tooltip="Performers who have met all Stripe identity verification and bank routing criteria."
          />

          <AdminKpiCard
            title="Blocked Onboarding"
            value="8 Blocked"
            subtitle="Missing Stripe documents"
            isAdverse={true}
            trend={{ value: "8 Action Req", isPositive: true, label: "prompt sent" }}
            icon={<AlertTriangleIcon size={18} strokeWidth={2.2} />}
            accentColor="#F59E0B"
            tooltip="Performers unable to receive fan payouts due to pending identity verification."
          />

          <AdminKpiCard
            title="Active Touring Bands"
            value="14 Bands"
            subtitle="Multi-member ensembles"
            trend={{ value: "+2 new", isPositive: true }}
            icon={<ArtistsIcon size={18} strokeWidth={2.2} />}
            accentColor="#8B5CF6"
            tooltip="Registered bands with active split allocations and verified manager authority."
          />

          <AdminKpiCard
            title="Unresolved Split Issues"
            value="2 Action Req"
            subtitle="Pending member signatures"
            isAdverse={true}
            trend={{ value: "2 Pending", isPositive: true, label: "review needed" }}
            icon={<CreditCardIcon size={18} strokeWidth={2.2} />}
            accentColor="#EF4444"
            tooltip="Bands with split agreements pending signature or allocation discrepancy."
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
          { id: 'solo', label: 'Solo Musicians' },
          { id: 'bands', label: 'Bands' },
          { id: 'onboarding', label: 'Onboarding Funnel' },
          { id: 'verification', label: 'Verification Queue' },
          { id: 'membership', label: 'Band Membership & Authority' },
          { id: 'split-agreements', label: 'Split Agreements' },
          { id: 'creator-success', label: 'Creator Success' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveTab(tab.id as CreatorTab)}
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
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. TAB CONTENT
      ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'onboarding' && (
        <section
          style={{
            background: 'var(--admin-surface-card, #FFFFFF)',
            padding: '24px',
            borderRadius: 12,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Creator Onboarding Velocity</h3>
          <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', margin: '0 0 24px' }}>
            Lifecycle transition rates from signup to first live stage tip collection.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            {[
              { step: '1. Account Created', count: '68 Artists', time: 'Day 0', pct: '100%' },
              { step: '2. EPK / Media Added', count: '54 Artists', time: '+1.2 Days', pct: '79.4%' },
              { step: '3. Stripe Connected', count: '42 Artists', time: '+2.8 Days', pct: '61.7%' },
              { step: '4. First Live Tip', count: '38 Artists', time: '+4.1 Days', pct: '55.8%' },
            ].map((s, idx) => (
              <div key={s.step} style={{ padding: '16px', background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-accent-primary, #7C3AED)' }}>{s.step}</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{s.count}</div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-tertiary, #94A3B8)', marginTop: 2 }}>Avg: {s.time} ({s.pct})</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'split-agreements' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              background: 'var(--admin-surface-card, #FFFFFF)',
              padding: '20px 24px',
              borderRadius: 12,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Band Split Agreements & Earnings Allocation</h3>
                <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', margin: '4px 0 0' }}>
                  Audits contractual split allocations totaling exactly 100%. Admins cannot edit agreed split percentages unilaterally.
                </p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
                Immutable Ledger Contract
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {SAMPLE_SPLITS.map((split) => (
                <div
                  key={split.bandId}
                  style={{
                    padding: '18px',
                    borderRadius: 10,
                    border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                    background: 'var(--admin-surface-raised, #F8FAFC)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                        {split.bandName} — Version {split.version}
                      </h4>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                        Effective Date: {split.effectiveDate} • Total Allocation: {split.totalPercentage}%
                      </div>
                    </div>
                    <AdminStatusBadge
                      status={split.status}
                      label={split.status.replace(/_/g, ' ')}
                    />
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Band Member</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Authority Role</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Agreed Split</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Signature Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {split.allocations.map((alloc) => (
                        <tr key={alloc.memberUid} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{alloc.memberName}</td>
                          <td style={{ padding: '8px' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.05)' }}>
                              {alloc.role}
                            </span>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {alloc.percentage}%
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            {alloc.signedAt ? (
                              <span style={{ color: '#10B981', fontWeight: 600 }}>✓ Signed ({alloc.signedAt.slice(0, 10)})</span>
                            ) : (
                              <span style={{ color: '#F59E0B', fontWeight: 600 }}>⏳ Awaiting Signature</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {(activeTab === 'solo' || activeTab === 'bands' || activeTab === 'verification' || activeTab === 'membership' || activeTab === 'creator-success') && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <AdminFilterBar
              searchPlaceholder="Search musicians by stage name, genre, UID..."
              onSearchChange={setSearch}
            />
          </div>

          <AdminDataTable
            columns={columns}
            data={filteredArtists}
            loading={loading}
            onRowClick={handleRowClick}
            emptyStateMessage="No creator records matching current filter."
          />
        </>
      )}

      {/* Detail Drawer */}
      {selectedCreator && (
        <DetailDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={selectedCreator.stageName || selectedCreator.displayName || 'Creator'}
          subtitle={`UID: ${selectedCreator.uid} • Created ${formatTS(selectedCreator.createdAt)}`}
          badge={
            <AdminStatusBadge
              status={selectedCreator.verified ? 'VERIFIED' : 'PENDING'}
            />
          }
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'earnings', label: 'Earnings & Tips' },
            { id: 'epk', label: 'EPK & Media' },
          ]}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px', background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)', fontWeight: 700 }}>STRIPE CONNECT ACCOUNT</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: selectedCreator.stripeAccountId ? '#10B981' : '#D97706' }}>
                {selectedCreator.stripeAccountId || 'No Stripe Account Linked'}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                Biography & Press Summary
              </h4>
              <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', lineHeight: 1.5, margin: 0 }}>
                {selectedCreator.bio || 'No artist biography provided.'}
              </p>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* Feature Creator Dialog */}
      {featureAction && (
        <ActionDialog
          isOpen={Boolean(featureAction)}
          onClose={() => setFeatureAction(null)}
          onConfirm={(reason) => {
            alert(`Creator featured with reason: ${reason}`);
            setFeatureAction(null);
          }}
          title="Feature Creator on Landing Discovery"
          targetDescription={`${featureAction.stageName || featureAction.displayName} (${featureAction.genre || 'Indie'})`}
          consequenceText="Promotes the creator to the top of the local discovery carousel and landing showcase for 7 days."
          confirmLabel="Feature Creator"
        />
      )}
    </div>
  );
}
