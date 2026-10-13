'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AdminKpiCard,
  AdminDataTable,
  AdminFilterBar,
  AdminStatusBadge,
  DetailDrawer,
  ActionDialog,
  UsersIcon,
  ArtistsIcon,
  CheckCircleIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
  UserIcon,
  MusicIcon,
  CreditCardIcon,
  SupportIcon,
  ClockIcon,
  ShieldCheckIcon,
  type Column,
} from '@/components/admin';
import {
  useAdminCrmDirectory,
  useAdminCrmCaseHistory,
  callUpdateCrmVerificationStatus,
  callAddCrmInternalNote,
  centsToDollars,
} from '@/lib/admin/adminFirestore';
import type { CrmDirectoryItem, CrmDirectoryFilter } from '@crowdbeats/contracts';

type CrmTab = 'all' | 'fans' | 'solo' | 'bands' | 'sponsors' | 'verification' | 'cases';

export default function UnifiedAdminCrmPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CrmTab>('all');
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedItem, setSelectedItem] = useState<CrmDirectoryItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'notes' | 'cases'>('overview');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // New Note State
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState<string | null>(null);

  // Verification Dialog State
  const [verifyDialogAction, setVerifyDialogAction] = useState<{
    item: CrmDirectoryItem;
    targetVerified: boolean;
  } | null>(null);

  // Construct CRM Directory Query Filter
  const directoryFilter = useMemo<CrmDirectoryFilter>(() => {
    let entityType: CrmDirectoryFilter['entityType'] = 'all';
    let verFilter = verificationFilter;

    if (activeTab === 'fans') entityType = 'fan';
    else if (activeTab === 'solo') entityType = 'solo_musician';
    else if (activeTab === 'bands') entityType = 'band';
    else if (activeTab === 'sponsors') entityType = 'sponsor';
    else if (activeTab === 'verification') {
      entityType = 'all';
      verFilter = 'unverified';
    }

    return {
      entityType,
      verificationStatus: verFilter,
      accountStatus: accountStatusFilter,
      searchQuery: search,
      limit: 250,
    };
  }, [activeTab, verificationFilter, accountStatusFilter, search]);

  const { items, totalCount, loading, error, refresh } = useAdminCrmDirectory(directoryFilter);
  const { cases, loading: casesLoading, refresh: refreshCases } = useAdminCrmCaseHistory(
    selectedItem ? selectedItem.uid : null
  );

  const handleCopy = (e: React.MouseEvent, uid: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const handleRowClick = (item: CrmDirectoryItem) => {
    setSelectedItem(item);
    setDrawerTab('overview');
    setNoteFeedback(null);
    setNewNoteText('');
    setIsDrawerOpen(true);
  };

  const handleConfirmVerification = async (reason: string) => {
    if (!verifyDialogAction) return;
    const { item, targetVerified } = verifyDialogAction;

    let targetType: 'user' | 'artist' | 'band' | 'sponsor' = 'user';
    if (item.personaType === 'band') targetType = 'band';
    else if (item.personaType === 'sponsor') targetType = 'sponsor';
    else if (item.personaType === 'solo_musician' || item.personaType === 'solo') targetType = 'artist';

    await callUpdateCrmVerificationStatus({
      targetUid: item.uid,
      targetType,
      verified: targetVerified,
      reason,
    });

    setVerifyDialogAction(null);
    refresh();
    if (selectedItem && selectedItem.uid === item.uid) {
      setSelectedItem({
        ...selectedItem,
        verificationStatus: targetVerified ? 'verified' : 'unverified',
      });
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !newNoteText.trim()) return;

    setIsSubmittingNote(true);
    setNoteFeedback(null);
    try {
      await callAddCrmInternalNote({
        targetUid: selectedItem.uid,
        note: newNoteText.trim(),
      });
      setNewNoteText('');
      setNoteFeedback('Note saved to CRM audit log.');
      refresh();
    } catch (err: any) {
      setNoteFeedback(err?.message || 'Failed to save internal note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // KPIs calculation from items
  const kpis = useMemo(() => {
    let fans = 0;
    let solo = 0;
    let bands = 0;
    let sponsors = 0;
    let verified = 0;
    let unverified = 0;

    items.forEach((i) => {
      const p = (i.personaType || '').toLowerCase();
      if (p.includes('fan')) fans++;
      else if (p.includes('solo') || p.includes('artist')) solo++;
      else if (p.includes('band')) bands++;
      else if (p.includes('sponsor')) sponsors++;

      if (i.verificationStatus === 'verified') verified++;
      else unverified++;
    });

    return { total: items.length, fans, solo, bands, sponsors, verified, unverified };
  }, [items]);

  // Pagination
  const totalPages = Math.ceil(items.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage]);

  const columns: Column<CrmDirectoryItem>[] = [
    {
      key: 'name',
      header: 'Customer / Entity',
      cell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: item.personaType === 'band' ? 8 : 9999,
              background:
                item.personaType === 'band'
                  ? 'rgba(236, 72, 153, 0.12)'
                  : item.personaType === 'sponsor'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(124, 58, 237, 0.12)',
              color:
                item.personaType === 'band'
                  ? '#EC4899'
                  : item.personaType === 'sponsor'
                  ? '#10B981'
                  : '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {item.displayName ? item.displayName.slice(0, 2).toUpperCase() : 'CB'}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>
              {item.displayName || 'Unnamed Entity'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
              {item.email || (item.stageName ? `Stage: ${item.stageName}` : 'No email attached')}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'uid',
      header: 'UID',
      cell: (item) => (
        <button
          type="button"
          onClick={(e) => handleCopy(e, item.uid)}
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
          title="Click to copy UID"
        >
          {item.uid.slice(0, 10)}...
          {copiedUid === item.uid ? (
            <CheckIcon size={12} color="#10B981" />
          ) : (
            <CopyIcon size={12} />
          )}
        </button>
      ),
    },
    {
      key: 'persona',
      header: 'Persona',
      cell: (item) => {
        const p = (item.personaType || '').toLowerCase();
        let label = 'FAN';
        let status: 'info' | 'purple' | 'success' | 'warning' = 'info';

        if (p.includes('solo') || p.includes('artist')) {
          label = 'SOLO MUSICIAN';
          status = 'purple';
        } else if (p.includes('band')) {
          label = 'BAND';
          status = 'warning';
        } else if (p.includes('sponsor')) {
          label = 'SPONSOR';
          status = 'success';
        }

        return <AdminStatusBadge status={status} label={label} />;
      },
    },
    {
      key: 'verification',
      header: 'Verification',
      cell: (item) => {
        const isVerified = item.verificationStatus === 'verified';
        return (
          <AdminStatusBadge
            status={isVerified ? 'VERIFIED' : 'PENDING'}
            label={isVerified ? 'VERIFIED' : 'UNVERIFIED'}
          />
        );
      },
    },
    {
      key: 'financials',
      header: 'Lifetime Volume',
      align: 'right',
      cell: (item) => (
        <div
          style={{
            fontWeight: 600,
            color: 'var(--admin-text-primary, #0F172A)',
            fontFamily: 'var(--cb-font-mono, monospace)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {centsToDollars(item.totalMonetaryCents)}
        </div>
      ),
    },
    {
      key: 'city',
      header: 'City / Genre',
      cell: (item) => (
        <div style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)' }}>
          {item.city || item.genre || '—'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(item);
            }}
            style={{
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 4,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
              background: 'var(--admin-surface-card, #FFFFFF)',
              color: 'var(--admin-accent-primary, #7C3AED)',
              cursor: 'pointer',
            }}
          >
            Quick View
          </button>
          <Link
            href={`/admin/crm/${item.uid}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 6px',
              borderRadius: 4,
              color: 'var(--admin-text-tertiary, #94A3B8)',
              textDecoration: 'none',
            }}
            title="Open Full 11-Tab User Workspace"
          >
            <ExternalLinkIcon size={14} />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--admin-text-primary, #0F172A)' }}>
            Unified Administration CRM
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--admin-text-secondary, #64748B)' }}>
            Searchable cross-persona directory for Fans, Solo Musicians, Bands, and Sponsors with verified audit trails.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => refresh()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
              background: 'var(--admin-surface-card, #FFFFFF)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--admin-text-primary, #0F172A)',
              cursor: 'pointer',
            }}
          >
            Refresh Directory
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <AdminKpiCard
          title="Total CRM Profiles"
          value={kpis.total.toLocaleString()}
          trend={{ value: `${kpis.fans} Fans`, isPositive: true }}
          icon={<UsersIcon size={18} />}
          subtitle="Unified cross-persona directory"
        />
        <AdminKpiCard
          title="Solo Musicians"
          value={kpis.solo.toLocaleString()}
          trend={{ value: `${kpis.solo} Solo`, isPositive: true }}
          icon={<ArtistsIcon size={18} />}
          subtitle="Verified creator accounts"
        />
        <AdminKpiCard
          title="Bands & Groups"
          value={kpis.bands.toLocaleString()}
          trend={{ value: `${kpis.bands} Bands`, isPositive: true }}
          icon={<MusicIcon size={18} />}
          subtitle="Registered band groups"
        />
        <AdminKpiCard
          title="Verified Profiles"
          value={kpis.verified.toLocaleString()}
          trend={{ value: `${kpis.unverified} Queue`, isPositive: kpis.unverified === 0 }}
          icon={<ShieldCheckIcon size={18} />}
          subtitle={kpis.unverified > 0 ? 'Action Queue' : 'Compliant'}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', gap: 8 }}>
        {[
          { id: 'all', label: 'All Personas' },
          { id: 'fans', label: 'Fans' },
          { id: 'solo', label: 'Solo Musicians' },
          { id: 'bands', label: 'Bands' },
          { id: 'sponsors', label: 'Sponsors' },
          { id: 'verification', label: 'Verification Queue', count: kpis.unverified },
          { id: 'cases', label: 'Case History', count: 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as CrmTab);
              setCurrentPage(1);
            }}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? 'var(--admin-accent-primary, #7C3AED)' : 'var(--admin-text-secondary, #64748B)',
              borderBottom: activeTab === tab.id ? '2px solid var(--admin-accent-primary, #7C3AED)' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 9999,
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#EF4444',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <AdminFilterBar
        onSearchChange={(q) => {
          setSearch(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search CRM by name, email, stage name, genre, city, or UID..."
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                background: 'var(--admin-surface-card, #FFFFFF)',
                fontSize: 12,
                color: 'var(--admin-text-primary, #0F172A)',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified / Pending</option>
            </select>
            <select
              value={accountStatusFilter}
              onChange={(e) => {
                setAccountStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                background: 'var(--admin-surface-card, #FFFFFF)',
                fontSize: 12,
                color: 'var(--admin-text-primary, #0F172A)',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        }
      />

      {/* Directory Table */}
      {/* Directory Table */}
      <AdminDataTable
        columns={columns}
        data={paginatedItems.map((item) => ({ ...item, id: item.uid }))}
        loading={loading}
        onRowClick={handleRowClick}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyStateMessage="No customer or entity profiles matched the specified criteria."
      />

      {/* DetailDrawer Quick View */}
      {selectedItem && (
        <DetailDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={selectedItem.displayName || 'CRM Customer Profile'}
          subtitle={`UID: ${selectedItem.uid}`}
          width={560}
          badge={
            <AdminStatusBadge
              status={selectedItem.verificationStatus === 'verified' ? 'VERIFIED' : 'PENDING'}
              label={selectedItem.verificationStatus === 'verified' ? 'VERIFIED' : 'UNVERIFIED'}
            />
          }
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'notes', label: 'Internal Staff Notes' },
            { id: 'cases', label: `Case History (${cases.length})` },
          ]}
          activeTab={drawerTab}
          onTabChange={(tabId) => setDrawerTab(tabId as any)}
          headerActions={
            <Link
              href={`/admin/crm/${selectedItem.uid}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                background: 'var(--admin-accent-primary, #7C3AED)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Open Workspace
              <ExternalLinkIcon size={12} />
            </Link>
          }
        >
          {drawerTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Profile Card */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  background: 'var(--admin-surface-raised, #F8FAFC)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 9999,
                    background: 'rgba(124, 58, 237, 0.15)',
                    color: '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  {selectedItem.displayName ? selectedItem.displayName.slice(0, 2).toUpperCase() : 'CB'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)' }}>
                    {selectedItem.displayName || 'Unnamed Entity'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)' }}>
                    {selectedItem.email || 'No email attached'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <AdminStatusBadge
                      status={selectedItem.accountStatus === 'active' ? 'ACTIVE' : 'SUSPENDED'}
                      label={selectedItem.accountStatus.toUpperCase()}
                    />
                    <AdminStatusBadge
                      status="ACTIVE"
                      label={(selectedItem.personaType || 'FAN').toUpperCase()}
                    />
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--admin-border-subtle, #E2E8F0)', background: 'var(--admin-surface-card, #FFFFFF)' }}>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-secondary, #64748B)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.02em' }}>
                    Lifetime Financial Volume
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)', marginTop: 4, fontFamily: 'var(--cb-font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
                    {centsToDollars(selectedItem.totalMonetaryCents)}
                  </div>
                </div>
                <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--admin-border-subtle, #E2E8F0)', background: 'var(--admin-surface-card, #FFFFFF)' }}>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-secondary, #64748B)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.02em' }}>
                    Connected Network
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)', marginTop: 4 }}>
                    {selectedItem.relationshipsCount} followers / peers
                  </div>
                </div>
              </div>

              {/* Verification Governance Section */}
              <div style={{ padding: 16, borderRadius: 8, border: '1px solid var(--admin-border-subtle, #E2E8F0)', background: 'var(--admin-surface-card, #FFFFFF)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>
                      Verification Status
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', marginTop: 2 }}>
                      {selectedItem.verificationStatus === 'verified'
                        ? 'Profile holds verified platform authenticity badge.'
                        : 'Profile is unverified. Staff review required for badge.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setVerifyDialogAction({
                        item: selectedItem,
                        targetVerified: selectedItem.verificationStatus !== 'verified',
                      })
                    }
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background:
                        selectedItem.verificationStatus === 'verified'
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'rgba(16, 185, 129, 0.1)',
                      color:
                        selectedItem.verificationStatus === 'verified' ? '#DC2626' : '#059669',
                    }}
                  >
                    {selectedItem.verificationStatus === 'verified' ? 'Revoke Verification' : 'Verify Account'}
                  </button>
                </div>
              </div>

              {/* Stripe Connect Section */}
              <div style={{ padding: 16, borderRadius: 8, border: '1px solid var(--admin-border-subtle, #E2E8F0)', background: 'var(--admin-surface-card, #FFFFFF)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CreditCardIcon size={18} color="var(--admin-text-secondary, #64748B)" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>
                      Stripe Connect Payout Status
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)' }}>
                      {selectedItem.stripeConnected
                        ? 'Connected & capable of receiving payouts.'
                        : 'No Stripe Connect account attached.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {drawerTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)' }}>
                Internal administrative notes are strictly restricted to authorized staff roles. Dual-written to audit trails.
              </div>

              <form onSubmit={handleAddInternalNote} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  rows={4}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record an operational note, verification rationale, or customer inquiry..."
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                    background: 'var(--admin-surface-card, #FFFFFF)',
                    color: 'var(--admin-text-primary, #0F172A)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {noteFeedback && (
                    <span style={{ fontSize: 12, color: noteFeedback.includes('Failed') ? '#DC2626' : '#059669' }}>
                      {noteFeedback}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmittingNote || !newNoteText.trim()}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      background: 'var(--admin-accent-primary, #7C3AED)',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                      cursor: isSubmittingNote || !newNoteText.trim() ? 'not-allowed' : 'pointer',
                      opacity: isSubmittingNote || !newNoteText.trim() ? 0.6 : 1,
                      marginLeft: 'auto',
                    }}
                  >
                    {isSubmittingNote ? 'Saving...' : 'Add Internal Note'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {drawerTab === 'cases' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {casesLoading ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-secondary, #64748B)', fontSize: 13 }}>
                  Loading case history...
                </div>
              ) : cases.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-tertiary, #94A3B8)', fontSize: 13 }}>
                  No active support requests, reports, or payout compliance holds found for this profile.
                </div>
              ) : (
                cases.map((c) => (
                  <div
                    key={c.caseId}
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                      background: 'var(--admin-surface-card, #FFFFFF)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-accent-primary, #7C3AED)' }}>
                        {c.type}
                      </span>
                      <AdminStatusBadge
                        status={c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'RESOLVED' : 'PENDING'}
                        label={c.status}
                      />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                      Opened: {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </DetailDrawer>
      )}

      {/* Action Dialog for Verification Status Changes */}
      {verifyDialogAction && (
        <ActionDialog
          isOpen={true}
          onClose={() => setVerifyDialogAction(null)}
          onConfirm={handleConfirmVerification}
          title={
            verifyDialogAction.targetVerified
              ? 'Grant Verification Status'
              : 'Revoke Verification Status'
          }
          targetDescription={`${verifyDialogAction.item.displayName || verifyDialogAction.item.uid} (${verifyDialogAction.item.personaType || 'Entity'})`}
          consequenceText={
            verifyDialogAction.targetVerified
              ? 'Granting verification awards the official platform trust badge, elevated search discovery ranking, and unlocks monetization features.'
              : 'Revoking verification removes the authenticity badge and flags the profile for review.'
          }
          confirmLabel={
            verifyDialogAction.targetVerified ? 'Approve Verification' : 'Revoke Verification'
          }
          isDestructive={!verifyDialogAction.targetVerified}
          requiresReason={true}
          reasonPlaceholder="Enter compliance or artist relations operational justification (required for audit trail)..."
        />
      )}
    </div>
  );
}
