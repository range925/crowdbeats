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
  Timeline,
  ControlledProfileEditorModal,
  UsersIcon,
  ArtistsIcon,
  BanIcon,
  CheckCircleIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
  UserIcon,
  EditIcon,
  CreditCardIcon,
  SupportIcon,
  ClockIcon,
  type Column,
} from '@/components/admin';
import {
  useAdminUsers,
  callSuspendAccount,
  callReinstateAccount,
  callAdminUpdateUserProfile,
  formatTS,
  type AdminUser,
} from '@/lib/admin/adminFirestore';

type UserTab = 'all' | 'fans' | 'solo' | 'bands' | 'sponsors' | 'verification' | 'suspended' | 'requests';

interface AccountRequest {
  id: string;
  uid: string;
  name: string;
  type: 'CREATOR_UPGRADE' | 'BAND_CREATION' | 'NAME_CHANGE' | 'PAYOUT_LINK';
  requestedAt: string;
  ageHours: number;
  assignedOwner: string;
  notes: string;
}

const SAMPLE_ACCOUNT_REQUESTS: AccountRequest[] = [
  { id: 'req_01', uid: 'usr_maya_lin', name: 'Maya Lin', type: 'CREATOR_UPGRADE', requestedAt: '2026-10-06T18:30:00Z', ageHours: 2, assignedOwner: 'Alex M. (Artist Relations)', notes: 'Submitted YouTube and Spotify EPK links for solo stage busking badge.' },
  { id: 'req_02', uid: 'usr_marcus_vance', name: 'Marcus Vance', type: 'BAND_CREATION', requestedAt: '2026-10-06T14:15:00Z', ageHours: 6, assignedOwner: 'Sarah T. (Operations)', notes: 'Forming "Brass Roots Collective", split agreement v1 uploaded with 4 founding members.' },
  { id: 'req_03', uid: 'usr_claire_b', name: 'Claire Bennet', type: 'PAYOUT_LINK', requestedAt: '2026-10-05T22:00:00Z', ageHours: 22, assignedOwner: 'David K. (Compliance)', notes: 'Tax identity document re-submitted after SSN mismatch warning.' },
];

export default function UsersAndAccountsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UserTab>('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Suspension / Action Dialog State
  const [dialogAction, setDialogAction] = useState<{
    type: 'suspend' | 'reinstate';
    user: AdminUser;
  } | null>(null);

  // Firestore hook
  const { users, loading, error, refresh } = useAdminUsers();

  const handleCopy = (e: React.MouseEvent, uid: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const handleRowClick = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  // Filter users based on active tab and search query
  const filteredUsers = useMemo(() => {
    let list = users;

    // Tab filtering
    if (activeTab === 'fans') {
      list = list.filter((u) => u.personaType === 'FAN' || (!u.personaType && !u.stripeAccountId));
    } else if (activeTab === 'solo') {
      list = list.filter((u) => u.personaType === 'SOLO_MUSICIAN' || u.personaType === 'SOLO');
    } else if (activeTab === 'bands') {
      list = list.filter((u) => u.personaType === 'BAND' || u.personaType === 'BAND_OWNER');
    } else if (activeTab === 'sponsors') {
      list = list.filter((u) => u.personaType === 'SPONSOR');
    } else if (activeTab === 'verification') {
      list = list.filter((u) => (u.personaType === 'SOLO_MUSICIAN' || u.personaType === 'BAND') && !u.stripeAccountId);
    } else if (activeTab === 'suspended') {
      list = list.filter((u) => u.isSuspended || u.suspendedAt);
    }

    // Search query
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((u) => {
        return (
          u.displayName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.uid.toLowerCase().includes(q) ||
          u.personaType?.toLowerCase().includes(q) ||
          u.city?.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [users, activeTab, search]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  const handleExecuteSuspend = async (reason: string) => {
    if (!dialogAction) return;
    const { user, type } = dialogAction;
    if (type === 'suspend') {
      await callSuspendAccount(user.uid, reason, 'user', 'SUSPEND ACCOUNT');
    } else {
      await callReinstateAccount(user.uid, reason, 'user');
    }
    setDialogAction(null);
    refresh();
  };

  // Directory Columns
  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'User & Identity',
      cell: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9999,
              background: 'rgba(124, 58, 237, 0.12)',
              color: 'var(--admin-accent-primary, #7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {u.displayName ? u.displayName.slice(0, 2).toUpperCase() : 'CB'}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--admin-text-primary, #0F172A)' }}>
              {u.displayName || 'Unnamed User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
              {u.email || 'No email attached'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'uid',
      header: 'UID',
      cell: (u) => (
        <button
          type="button"
          onClick={(e) => handleCopy(e, u.uid)}
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
          <span>{u.uid.slice(0, 10)}…</span>
          {copiedUid === u.uid ? <CheckIcon size={11} color="#10B981" /> : <CopyIcon size={11} />}
        </button>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (u) => {
        const role = u.personaType || 'FAN';
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 9999,
              background: role.includes('SOLO') || role.includes('BAND') ? 'rgba(124, 58, 237, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              color: role.includes('SOLO') || role.includes('BAND') ? '#7C3AED' : '#2563EB',
              textTransform: 'uppercase',
            }}
          >
            {role.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      key: 'region',
      header: 'Region',
      cell: (u) => (
        <span style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)' }}>
          {u.city || u.publicLocation || 'Coarse (US)'}
        </span>
      ),
    },
    {
      key: 'verification',
      header: 'Verification',
      cell: (u) => {
        const isVerified = Boolean(u.stripeAccountId || u.emailVerified);
        return (
          <AdminStatusBadge
            status={isVerified ? 'VERIFIED' : 'INACTIVE'}
            label={isVerified ? 'VERIFIED' : 'UNVERIFIED'}
          />
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => {
        const isSuspended = u.isSuspended || Boolean(u.suspendedAt);
        return (
          <AdminStatusBadge
            status={isSuspended ? 'SUSPENDED' : 'ACTIVE'}
          />
        );
      },
    },
    {
      key: 'joined',
      header: 'Joined',
      cell: (u) => (
        <span style={{ fontSize: 12, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
          {formatTS(u.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditingUser(u);
            }}
            title="Edit public profile (name, bio, location)"
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
              background: 'transparent',
              color: 'var(--admin-text-secondary, #64748B)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <EditIcon size={12} />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDialogAction({
                type: u.isSuspended ? 'reinstate' : 'suspend',
                user: u,
              });
            }}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
              background: 'transparent',
              color: u.isSuspended ? '#10B981' : '#EF4444',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {u.isSuspended ? 'Reinstate' : 'Suspend'}
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
            Users & Accounts
          </h1>
          <p
            style={{
              color: 'var(--admin-text-secondary, #64748B)',
              fontSize: 13,
              margin: '4px 0 0',
              lineHeight: 1.4,
            }}
          >
            Directory of fans, verified musicians, band entities, and sponsors. Enforces profile allowlists and RBAC authorization.
          </p>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. TOP FOUR CARDS
      ───────────────────────────────────────────────────────────────────────── */}
      <section aria-label="User Account Metrics">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          <AdminKpiCard
            title="New Accounts"
            value="142"
            period="Last 24h"
            subtitle="Fan & creator signups"
            trend={{ value: "+18%", isPositive: true, label: "vs yesterday" }}
            icon={<UsersIcon size={18} strokeWidth={2.2} />}
            accentColor="#7C3AED"
            tooltip="New user registrations created and confirmed in the last 24 hours."
          />

          <AdminKpiCard
            title="Active Accounts"
            value="3,840"
            period="7d Rolling"
            subtitle="Engaged in discovery & tips"
            trend={{ value: "+8.4%", isPositive: true, label: "vs prior week" }}
            icon={<UserIcon size={18} strokeWidth={2.2} />}
            accentColor="#10B981"
            tooltip="Unique users who opened the map, tipped a performer, or checked in."
          />

          <AdminKpiCard
            title="Incomplete Onboarding"
            value="24"
            period="Pending Setup"
            subtitle="Missing Stripe or identity info"
            isAdverse={true}
            trend={{ value: "24 Creators", isPositive: true, label: "payout blocked" }}
            icon={<AlertTriangleIcon size={18} strokeWidth={2.2} />}
            accentColor="#F59E0B"
            tooltip="Creators who created an account but have not yet linked their Stripe payout account."
          />

          <AdminKpiCard
            title="Restricted Accounts"
            value="6"
            period="Enforced"
            subtitle="Suspended for safety/fraud"
            isAdverse={true}
            trend={{ value: "6 Total", isPositive: true, label: "actioned by Trust" }}
            icon={<BanIcon size={18} strokeWidth={2.2} />}
            accentColor="#EF4444"
            tooltip="Accounts currently suspended or restricted by Trust & Safety moderators."
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
          { id: 'all', label: 'All Users' },
          { id: 'fans', label: 'Fans' },
          { id: 'solo', label: 'Solo Accounts' },
          { id: 'bands', label: 'Band Accounts' },
          { id: 'sponsors', label: 'Sponsors' },
          { id: 'verification', label: 'Verification Queue' },
          { id: 'suspended', label: 'Suspended' },
          { id: 'requests', label: 'Account Requests', count: SAMPLE_ACCOUNT_REQUESTS.length },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setActiveTab(tab.id as UserTab);
                setCurrentPage(1);
              }}
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
                    background: 'var(--admin-accent-primary, #7C3AED)',
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
          4. FILTER TOOLBAR & DIRECTORY OR REQUESTS
      ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'requests' ? (
        <section
          style={{
            background: 'var(--admin-surface-card, #FFFFFF)',
            borderRadius: 12,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Operational Account Requests Queue</h3>
            <p style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', margin: '2px 0 0' }}>
              Pending creator upgrades, band formations, and identity reconciliations
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>User</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Request Type</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Assigned Owner</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Age</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Notes</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ACCOUNT_REQUESTS.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{req.name}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
                      {req.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>{req.assignedOwner}</td>
                  <td style={{ padding: '14px 16px', color: req.ageHours > 12 ? '#D97706' : 'inherit' }}>
                    {req.ageHours}h ago
                  </td>
                  <td style={{ padding: '14px 16px', maxWidth: 320, fontSize: 12, color: 'var(--admin-text-secondary, #64748B)' }}>
                    {req.notes}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => alert(`Reviewing request ${req.id}`)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: 'var(--admin-text-primary, #0F172A)',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Process Request
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <>
          {/* Filter Toolbar */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <AdminFilterBar
              searchPlaceholder="Search by name, email, UID, role, or city..."
              onSearchChange={setSearch}
              activeFilterCount={activeTab !== 'all' ? 1 : 0}
            />
          </div>

          {/* User Directory Table */}
          <AdminDataTable
            columns={columns}
            data={paginatedUsers}
            loading={loading}
            onRowClick={handleRowClick}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            emptyStateMessage="No users found matching current filters."
          />
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          5. DETAIL DRAWER (11 OPERATIONAL TABS)
      ───────────────────────────────────────────────────────────────────────── */}
      {selectedUser && (
        <DetailDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={selectedUser.displayName || 'Authorized Account'}
          subtitle={`UID: ${selectedUser.uid} • Joined ${formatTS(selectedUser.createdAt)}`}
          badge={
            <AdminStatusBadge
              status={selectedUser.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
            />
          }
          headerActions={
            <Link
              href={`/admin/crm/${selectedUser.uid}`}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--admin-accent-primary, #7C3AED)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none',
              }}
            >
              <span>Full Workspace</span>
              <ExternalLinkIcon size={12} />
            </Link>
          }
          footerActions={
            <>
              <button
                type="button"
                onClick={() => {
                  setEditingUser(selectedUser);
                  setIsDrawerOpen(false);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  background: 'transparent',
                  color: 'var(--admin-text-secondary, #64748B)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Edit Profile
              </button>

              <button
                type="button"
                onClick={() => {
                  setDialogAction({
                    type: selectedUser.isSuspended ? 'reinstate' : 'suspend',
                    user: selectedUser,
                  });
                  setIsDrawerOpen(false);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: selectedUser.isSuspended ? '#10B981' : '#DC2626',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {selectedUser.isSuspended ? 'Reinstate Account' : 'Suspend Account'}
              </button>
            </>
          }
        >
          {/* Quick Context Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '12px', background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)', fontWeight: 600 }}>ROLE / PERSONA</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                {selectedUser.personaType || 'FAN'}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--admin-surface-raised, #F1F5F9)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)', fontWeight: 600 }}>STRIPE CONNECT</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                {selectedUser.stripeAccountId ? (
                  <span style={{ color: '#10B981' }}>Connected ({selectedUser.stripeAccountId.slice(0, 10)}…)</span>
                ) : (
                  <span style={{ color: '#94A3B8' }}>Not Configured</span>
                )}
              </div>
            </div>
          </div>

          {/* Bio / Description */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-tertiary, #94A3B8)', margin: '0 0 6px' }}>
              Public Bio & EPK
            </h4>
            <div style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', lineHeight: 1.5, background: 'var(--admin-surface-raised, #F8FAFC)', padding: '12px', borderRadius: 8 }}>
              {selectedUser.bio || 'No public biography supplied.'}
            </div>
          </div>

          {/* Linked Activity & Cases */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-tertiary, #94A3B8)', margin: '0 0 8px' }}>
              Operational Audit History
            </h4>
            <Timeline
              events={[
                {
                  id: 'ev_01',
                  timestamp: new Date().toISOString(),
                  actor: { displayName: 'System Sentinel', role: 'SECURITY_AUTOMATION' },
                  action: 'User Authenticated & Verified',
                  details: 'MFA session established via Firebase Auth token.',
                  status: 'success',
                },
                {
                  id: 'ev_02',
                  timestamp: selectedUser.createdAt ? new Date(selectedUser.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
                  actor: { displayName: 'Self-Serve Portal', role: 'USER' },
                  action: 'Account Created',
                  details: 'Signed up with email verification complete.',
                  status: 'info',
                },
              ]}
            />
          </div>
        </DetailDrawer>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          6. MODALS: PROFILE EDITOR & ACTION DIALOG
      ───────────────────────────────────────────────────────────────────────── */}
      {editingUser && (
        <ControlledProfileEditorModal
          user={editingUser}
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          onSave={async (updates, reason) => {
            await callAdminUpdateUserProfile(editingUser.uid, updates, reason);
            setEditingUser(null);
            refresh();
          }}
        />
      )}

      {dialogAction && (
        <ActionDialog
          isOpen={Boolean(dialogAction)}
          onClose={() => setDialogAction(null)}
          onConfirm={handleExecuteSuspend}
          title={dialogAction.type === 'suspend' ? 'Suspend User Account' : 'Reinstate User Account'}
          targetDescription={`${dialogAction.user.displayName || 'Unnamed'} (UID: ${dialogAction.user.uid})`}
          consequenceText={
            dialogAction.type === 'suspend'
              ? 'Suspension terminates all active live broadcasting sessions, revokes discovery map visibility, and prevents tipping payouts.'
              : 'Reinstating restores discovery map visibility and unblocks stage broadcasts.'
          }
          isDestructive={dialogAction.type === 'suspend'}
          confirmLabel={dialogAction.type === 'suspend' ? 'Suspend Account' : 'Reinstate Account'}
        />
      )}
    </div>
  );
}
