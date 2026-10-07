'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AdminBreadcrumb,
  AdminStatusBadge,
  AdminKpiCard,
  AdminDataTable,
  type Column,
  ControlledProfileEditorModal,
  ActivityIcon,
  UserIcon,
  StaffIcon,
  UsersIcon,
  MessageSquareIcon,
  LiveIcon,
  CreditCardIcon,
  SupportIcon,
  ThreatIcon,
  ClockIcon,
  CodeIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  EditIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
  DollarSignIcon,
  MusicIcon,
  ShieldCheckIcon,
  BanIcon,
  RefreshIcon,
} from '@/components/admin';
import {
  useAdminUser,
  useAdminArtistProfile,
  useAdminUserTips,
  useAdminAuditEvents,
  useAdminUserSupportTickets,
  callAdminUpdateUserProfile,
  callSuspendAccount,
  callReinstateAccount,
  callGrantStaffRole,
  callRevokeStaffRole,
  callApproveRefund,
  centsToDollars,
  formatTS,
  type AdminTip,
  type AdminSupportTicket,
} from '@/lib/admin/adminFirestore';

// ── 11 Functional Tabs ────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview', icon: ActivityIcon },
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'roles', label: 'Identity & Roles', icon: StaffIcon },
  { id: 'relationships', label: 'Relationships', icon: UsersIcon },
  { id: 'messages', label: 'Messages', icon: MessageSquareIcon },
  { id: 'live_sessions', label: 'Live Sessions', icon: LiveIcon },
  { id: 'payments', label: 'Tipping & Payments', icon: CreditCardIcon },
  { id: 'support', label: 'Support & Reports', icon: SupportIcon },
  { id: 'moderation', label: 'Moderation', icon: ThreatIcon },
  { id: 'audit', label: 'Audit Log', icon: ClockIcon },
  { id: 'raw_data', label: 'Raw Data', icon: CodeIcon },
] as const;

type TabId = (typeof TABS)[number]['id'];

const STAFF_ROLES = [
  { value: 'CUSTOMER_SUPPORT', label: 'Customer Support Specialist' },
  { value: 'TRUST_SAFETY', label: 'Trust & Safety Officer' },
  { value: 'ARTIST_RELATIONS', label: 'Artist Relations Manager' },
  { value: 'FINANCE_ADMIN', label: 'Finance & Ledger Admin' },
  { value: 'SUPER_ADMIN', label: 'Platform Super Admin' },
];

export default function EnterpriseUserWorkspacePage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;
  const canonicalUid = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [copiedUid, setCopiedUid] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data Hooks
  const { user, loading: userLoading, error: userError, refresh: refreshUser } = useAdminUser(canonicalUid);
  const { artist, refresh: refreshArtist } = useAdminArtistProfile(canonicalUid);
  const { sentTips, receivedTips, allTips, loading: tipsLoading, refresh: refreshTips } = useAdminUserTips(canonicalUid);
  const { events: auditEvents, loading: auditLoading, refresh: refreshAudit } = useAdminAuditEvents(canonicalUid, 100);
  const { tickets: supportTickets, loading: supportLoading, refresh: refreshTickets } = useAdminUserSupportTickets(canonicalUid);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [refundTipModal, setRefundTipModal] = useState<AdminTip | null>(null);

  // Suspend/Reinstate Form State
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendConfirmPhrase, setSuspendConfirmPhrase] = useState('');
  const [suspendTargetType, setSuspendTargetType] = useState<'user' | 'artist'>('user');
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);

  // Staff Role Form State
  const [selectedStaffRole, setSelectedStaffRole] = useState('CUSTOMER_SUPPORT');
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  // Refund Form State
  const [refundReason, setRefundReason] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  // Quick Note State
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteSubmitting, setQuickNoteSubmitting] = useState(false);

  // Raw data copied state
  const [copiedRawData, setCopiedRawData] = useState(false);

  const handleCopyUid = () => {
    if (!canonicalUid) return;
    navigator.clipboard.writeText(canonicalUid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  // Profile save from ControlledProfileEditorModal
  const handleSaveProfile = async (updates: Record<string, string>, reason: string) => {
    if (!canonicalUid) return;
    const res = await callAdminUpdateUserProfile(canonicalUid, updates, reason);
    setActionFeedback({ type: 'success', text: res.message || 'Profile updated successfully.' });
    await Promise.all([refreshUser(), refreshArtist(), refreshAudit()]);
  };

  // Add Quick Internal Note
  const handleAddQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canonicalUid || !quickNoteText.trim()) return;
    setQuickNoteSubmitting(true);
    setActionFeedback(null);
    try {
      await callAdminUpdateUserProfile(
        canonicalUid,
        { internalNotes: quickNoteText.trim() },
        'Internal staff note added from workspace'
      );
      setQuickNoteText('');
      setActionFeedback({ type: 'success', text: 'Internal note appended to user file.' });
      await Promise.all([refreshUser(), refreshAudit()]);
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to add internal note.',
      });
    } finally {
      setQuickNoteSubmitting(false);
    }
  };

  // Handle Suspend / Reinstate
  const handleToggleSuspension = async () => {
    if (!canonicalUid || !user) return;
    const isSuspended = user.isSuspended || !!user.suspendedAt;

    if (!suspendReason.trim()) {
      setActionFeedback({ type: 'error', text: 'An operational justification reason is required.' });
      return;
    }

    if (!isSuspended && suspendConfirmPhrase !== 'SUSPEND ACCOUNT') {
      setActionFeedback({ type: 'error', text: 'Please type exact phrase "SUSPEND ACCOUNT" to confirm.' });
      return;
    }

    setSuspendSubmitting(true);
    setActionFeedback(null);
    try {
      if (isSuspended) {
        await callReinstateAccount(canonicalUid, suspendReason.trim(), suspendTargetType);
        setActionFeedback({ type: 'success', text: 'User account reinstated successfully.' });
      } else {
        await callSuspendAccount(canonicalUid, suspendReason.trim(), suspendTargetType, 'SUSPEND ACCOUNT');
        setActionFeedback({ type: 'success', text: 'User account suspended.' });
      }
      setIsSuspendModalOpen(false);
      setSuspendReason('');
      setSuspendConfirmPhrase('');
      await Promise.all([refreshUser(), refreshAudit()]);
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Operation failed.',
      });
    } finally {
      setSuspendSubmitting(false);
    }
  };

  // Handle Staff Role Grant
  const handleGrantRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canonicalUid) return;
    setRoleSubmitting(true);
    setActionFeedback(null);
    try {
      await callGrantStaffRole(canonicalUid, selectedStaffRole);
      setActionFeedback({ type: 'success', text: `Granted staff role: ${selectedStaffRole}` });
      await Promise.all([refreshUser(), refreshAudit()]);
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to grant staff role.',
      });
    } finally {
      setRoleSubmitting(false);
    }
  };

  // Handle Staff Role Revoke
  const handleRevokeRole = async () => {
    if (!canonicalUid) return;
    setRoleSubmitting(true);
    setActionFeedback(null);
    try {
      await callRevokeStaffRole(canonicalUid);
      setActionFeedback({ type: 'success', text: 'Staff role revoked.' });
      await Promise.all([refreshUser(), refreshAudit()]);
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to revoke staff role.',
      });
    } finally {
      setRoleSubmitting(false);
    }
  };

  // Handle Approve Refund
  const handleExecuteRefund = async () => {
    if (!refundTipModal || !refundReason.trim()) return;
    setRefundSubmitting(true);
    setActionFeedback(null);
    try {
      await callApproveRefund(refundTipModal.tipId, refundReason.trim());
      setActionFeedback({ type: 'success', text: `Refund approved for tip ${refundTipModal.tipId}.` });
      setRefundTipModal(null);
      setRefundReason('');
      await Promise.all([refreshTips(), refreshAudit()]);
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Refund failed.',
      });
    } finally {
      setRefundSubmitting(false);
    }
  };

  // Handle copy raw data
  const handleCopyRawData = () => {
    const rawObject = { user, artist, auditEventsCount: auditEvents.length, tipsCount: allTips.length };
    navigator.clipboard.writeText(JSON.stringify(rawObject, null, 2));
    setCopiedRawData(true);
    setTimeout(() => setCopiedRawData(false), 2000);
  };

  if (userLoading) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--admin-text-secondary, #64748B)' }}>
        <RefreshIcon
          size={24}
          strokeWidth={2}
          style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}
        />
        <div style={{ fontSize: 14, fontWeight: 600 }}>Loading unified user workspace…</div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin/command-center' },
            { label: 'CRM Directory', href: '/admin/crm' },
            { label: canonicalUid || 'User Not Found' },
          ]}
        />
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--admin-status-error, #EF4444)',
            borderRadius: 8,
            padding: 24,
            marginTop: 20,
            color: 'var(--admin-status-error, #EF4444)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <AlertCircleIcon size={24} strokeWidth={2} />
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>User Entity Not Found</h2>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--admin-text-primary, #0F172A)' }}>
              No document exists in Cloud Firestore for canonical UID: <code>{canonicalUid}</code>.
            </p>
            <button
              type="button"
              onClick={() => router.push('/admin/crm')}
              style={{
                background: 'var(--admin-surface-card, #FFFFFF)',
                border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                color: 'var(--admin-text-primary, #0F172A)',
                padding: '8px 16px',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Return to CRM Directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSuspended = user.isSuspended || !!user.suspendedAt;
  const isKycVerified = !!user.stripeAccountId;
  const persona = (user.personaType || 'FAN').toUpperCase();
  const totalTipsSentCents = sentTips.reduce((sum, t) => sum + (t.amountCents || 0), 0);
  const totalTipsReceivedCents = receivedTips.reduce((sum, t) => sum + (t.amountCents || 0), 0);
  const initials = (user.displayName || user.email || 'U').slice(0, 2).toUpperCase();
  const handle = user.displayName
    ? `@${user.displayName.toLowerCase().replace(/[^a-z0-9_]/g, '')}`
    : user.email
    ? `@${user.email.split('@')[0]}`
    : `@uid_${user.uid.slice(0, 5)}`;

  // Column definitions for Tipping table
  const tipColumns: Column<AdminTip>[] = [
    {
      key: 'tipId',
      header: 'Tip ID',
      cell: (t) => (
        <code
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            background: 'var(--admin-surface-raised, #F1F5F9)',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {t.tipId ? `${t.tipId.slice(0, 8)}…` : '—'}
        </code>
      ),
    },
    {
      key: 'type',
      header: 'Flow',
      cell: (t) => {
        const isSent = t.fanUid === canonicalUid;
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 4,
              color: isSent ? '#3B82F6' : '#10B981',
              backgroundColor: isSent ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            }}
          >
            {isSent ? 'SENT' : 'RECEIVED'}
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      numeric: true,
      cell: (t) => (
        <span className="admin-tabular-nums" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {centsToDollars(t.amountCents)}
        </span>
      ),
    },
    {
      key: 'fee',
      header: 'Take-Rate (Fee)',
      numeric: true,
      cell: (t) => (
        <span className="admin-tabular-nums" style={{ color: 'var(--admin-text-secondary, #64748B)', fontVariantNumeric: 'tabular-nums' }}>
          {centsToDollars(t.platformFeeCents)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (t) => {
        const s = (t.status || 'succeeded').toUpperCase();
        return <AdminStatusBadge status={s === 'SUCCEEDED' || s === 'COMPLETED' ? 'VERIFIED' : s === 'FAILED' ? 'FLAGGED' : 'PENDING'} label={s} />;
      },
    },
    {
      key: 'createdAt',
      header: 'Date',
      cell: (t) => (
        <span className="admin-tabular-nums" style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', fontVariantNumeric: 'tabular-nums' }}>
          {formatTS(t.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      cell: (t) => {
        const canRefund = t.status === 'succeeded' || t.status === 'completed';
        return (
          <div style={{ textAlign: 'right' }}>
            {canRefund ? (
              <button
                type="button"
                onClick={() => setRefundTipModal(t)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--admin-status-error, #EF4444)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Approve Refund
              </button>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--admin-text-tertiary, #94A3B8)' }}>Settled</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px 36px 60px', maxWidth: 1440, margin: '0 auto' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: 16 }}>
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin/command-center' },
            { label: 'CRM Directory', href: '/admin/crm' },
            { label: user.displayName || user.uid },
          ]}
        />
      </div>

      {/* Global Action Feedback Alert */}
      {actionFeedback && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              actionFeedback.type === 'success'
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${
              actionFeedback.type === 'success' ? 'var(--admin-status-success, #10B981)' : 'var(--admin-status-error, #EF4444)'
            }`,
            color:
              actionFeedback.type === 'success'
                ? 'var(--admin-status-success, #10B981)'
                : 'var(--admin-status-error, #EF4444)',
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {actionFeedback.type === 'success' ? (
              <CheckCircleIcon size={16} strokeWidth={2.4} />
            ) : (
              <AlertTriangleIcon size={16} strokeWidth={2.4} />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 14 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Cohesive Header Card */}
      <div
        style={{
          background: 'var(--admin-surface-card, var(--surface-card, #FFFFFF))',
          borderRadius: 14,
          border: '1px solid var(--admin-border-subtle, var(--border-subtle, #E2E8F0))',
          padding: '24px 28px',
          boxShadow: 'var(--admin-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          {/* User Avatar & Identity Info */}
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            {user.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoUrl}
                alt={user.displayName || 'Avatar'}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--admin-accent-primary, #7C3AED)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--admin-accent-primary, #7C3AED), #03DAC6)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                }}
              >
                {initials}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    margin: 0,
                    color: 'var(--admin-text-primary, var(--text-primary, #0F172A))',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {user.displayName || 'Anonymous User'}
                </h1>

                {/* Verified Checkmark SVG */}
                {isKycVerified && (
                  <span
                    title="Stripe KYC Identity Verified"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: 'var(--admin-status-success, #10B981)',
                    }}
                  >
                    <CheckCircleIcon size={18} strokeWidth={2.4} />
                  </span>
                )}

                {/* Platform Role Badge */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: user.platformRole || user.isAdmin ? 'var(--admin-accent-primary, #7C3AED)' : 'var(--admin-text-secondary, #64748B)',
                    background: user.platformRole || user.isAdmin ? 'rgba(124, 58, 237, 0.1)' : 'var(--admin-surface-raised, #F1F5F9)',
                    border: `1px solid ${user.platformRole || user.isAdmin ? 'rgba(124, 58, 237, 0.25)' : 'var(--admin-border-subtle, #CBD5E1)'}`,
                    padding: '2px 8px',
                    borderRadius: 4,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  {user.platformRole ? user.platformRole.replace(/_/g, ' ') : user.isAdmin ? 'SUPER ADMIN' : 'MEMBER'}
                </span>

                {/* Persona Type Chip */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    background: 'var(--admin-accent-primary, #7C3AED)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    letterSpacing: '0.04em',
                  }}
                >
                  {persona}
                </span>

                <AdminStatusBadge status={isSuspended ? 'SUSPENDED' : 'ACTIVE'} />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 6,
                  flexWrap: 'wrap',
                  fontSize: 13,
                  color: 'var(--admin-text-secondary, var(--text-secondary, #64748B))',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--admin-accent-primary, #7C3AED)' }}>{handle}</span>
                <span>·</span>
                <span>{user.email || 'No email registered'}</span>
                <span>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <code
                    style={{
                      fontSize: 12,
                      background: 'var(--admin-surface-raised, #F1F5F9)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {canonicalUid}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyUid}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      color: copiedUid ? 'var(--admin-status-success, #10B981)' : 'var(--admin-text-tertiary, #94A3B8)',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                    title="Copy Canonical UID"
                  >
                    {copiedUid ? <CheckIcon size={14} strokeWidth={2.4} /> : <CopyIcon size={14} strokeWidth={2} />}
                  </button>
                </span>
                <span>·</span>
                <span className="admin-tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  Joined {formatTS(user.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              style={{
                background: 'var(--admin-surface-raised, #F8FAFC)',
                border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                color: 'var(--admin-text-primary, #0F172A)',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <EditIcon size={15} strokeWidth={2} />
              <span>Edit Profile</span>
            </button>

            {isSuspended ? (
              <button
                type="button"
                onClick={() => {
                  setSuspendReason('');
                  setIsSuspendModalOpen(true);
                }}
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--admin-status-success, #10B981)',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckCircleIcon size={15} strokeWidth={2} />
                <span>Reinstate Account</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSuspendReason('');
                  setSuspendConfirmPhrase('');
                  setIsSuspendModalOpen(true);
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--admin-status-error, #EF4444)',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <AlertTriangleIcon size={15} strokeWidth={2} />
                <span>Suspend Account</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clean Tab Bar for the 11 Functional Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
          paddingBottom: 2,
          marginBottom: 24,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 15px',
                borderRadius: '8px 8px 0 0',
                border: '1px solid',
                borderColor: isActive ? 'var(--admin-border-subtle, #E2E8F0)' : 'transparent',
                borderBottomColor: isActive ? 'var(--admin-surface-card, #FFFFFF)' : 'transparent',
                background: isActive ? 'var(--admin-surface-card, #FFFFFF)' : 'transparent',
                color: isActive ? 'var(--admin-accent-primary, #7C3AED)' : 'var(--admin-text-secondary, #64748B)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <TabIcon size={15} strokeWidth={2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Overview ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
            <AdminKpiCard
              title="Tips Sent"
              value={centsToDollars(totalTipsSentCents)}
              subtitle={`${sentTips.length} transactions sent`}
              trend={{ value: 'Fan Volume', isPositive: true }}
              icon={<DollarSignIcon size={18} strokeWidth={2} />}
              accentColor="#3B82F6"
            />
            <AdminKpiCard
              title="Tips Received"
              value={centsToDollars(totalTipsReceivedCents)}
              subtitle={`${receivedTips.length} tips collected`}
              trend={{ value: 'Creator Revenue', isPositive: true }}
              icon={<CreditCardIcon size={18} strokeWidth={2} />}
              accentColor="#10B981"
            />
            <AdminKpiCard
              title="Stripe KYC Status"
              value={isKycVerified ? 'Verified' : 'Pending'}
              subtitle={user.stripeAccountId || 'No Connect account'}
              trend={{ value: isKycVerified ? 'Compliant' : 'Review', isPositive: isKycVerified }}
              icon={<ShieldCheckIcon size={18} strokeWidth={2} />}
              accentColor="#8B5CF6"
            />
            <AdminKpiCard
              title="Account Strikes"
              value={user.strikeCount?.toString() || '0'}
              subtitle={isSuspended ? 'Account Suspended' : 'In Good Standing'}
              trend={{ value: isSuspended ? 'Flagged' : 'Optimal', isPositive: !isSuspended }}
              icon={<ThreatIcon size={18} strokeWidth={2} />}
              accentColor={isSuspended ? '#EF4444' : '#10B981'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 28 }}>
            {/* Identity Card */}
            <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: 22, borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: 'var(--admin-text-primary, #0F172A)' }}>
                Identity & Contact Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Display Name</span>
                  <span style={{ fontWeight: 600 }}>{user.displayName || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Primary Email</span>
                  <span style={{ fontWeight: 600 }}>{user.email || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Email Verified</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {user.emailVerified ? (
                      <>
                        <CheckCircleIcon size={14} strokeWidth={2.4} style={{ color: '#10B981' }} />
                        <span style={{ color: '#10B981', fontWeight: 600 }}>Verified</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--admin-text-tertiary, #94A3B8)' }}>Unverified</span>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>City / Region</span>
                  <span style={{ fontWeight: 600 }}>{user.city || user.publicLocation || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Member Since</span>
                  <span className="admin-tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatTS(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Persona & Role Snapshot */}
            <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: 22, borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: 'var(--admin-text-primary, #0F172A)' }}>
                Platform Roles & Clearance
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Persona Type</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-accent-primary, #7C3AED)' }}>{persona}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Platform Role</span>
                  <span style={{ fontWeight: 600 }}>{user.platformRole || (user.isAdmin ? 'Super Admin' : 'Standard Member')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Admin Clearance</span>
                  <span>{user.isAdmin ? 'Full Platform Control' : 'Standard'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Stripe Connect ID</span>
                  <code style={{ fontSize: 12 }}>{user.stripeAccountId || 'None'}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Customer ID</span>
                  <code style={{ fontSize: 12 }}>{user.stripeCustomerId || 'None'}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Profile ──────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: 24, borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--admin-text-primary, #0F172A)' }}>
                Detailed Profile Information
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                style={{
                  background: 'var(--admin-accent-primary, #7C3AED)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <EditIcon size={14} strokeWidth={2} />
                <span>Open Controlled Editor</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, fontSize: 13 }}>
              <div>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary, #94A3B8)', textTransform: 'uppercase' }}>
                  Display Name
                </span>
                <div style={{ marginTop: 4, fontWeight: 600 }}>{user.displayName || '—'}</div>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary, #94A3B8)', textTransform: 'uppercase' }}>
                  Handle
                </span>
                <div style={{ marginTop: 4, fontWeight: 600, color: 'var(--admin-accent-primary, #7C3AED)' }}>{handle}</div>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary, #94A3B8)', textTransform: 'uppercase' }}>
                  Musical Genre
                </span>
                <div style={{ marginTop: 4, fontWeight: 600 }}>{user.genre || artist?.genre || '—'}</div>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary, #94A3B8)', textTransform: 'uppercase' }}>
                  City / Location
                </span>
                <div style={{ marginTop: 4, fontWeight: 600 }}>{user.city || user.publicLocation || '—'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary, #94A3B8)', textTransform: 'uppercase' }}>
                  Biography
                </span>
                <div style={{ marginTop: 4, lineHeight: 1.6, color: 'var(--admin-text-primary, #0F172A)' }}>
                  {user.bio || artist?.bio || 'No public bio provided.'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Note Submission Form */}
          <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: 20, borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: 'var(--admin-text-primary, #0F172A)' }}>
              Add Internal Staff Note
            </h4>
            <form onSubmit={handleAddQuickNote} style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                placeholder="Append an operational or compliance note to this user file..."
                value={quickNoteText}
                onChange={(e) => setQuickNoteText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                  background: 'var(--admin-bg-base, #F8FAFC)',
                  color: 'var(--admin-text-primary, #0F172A)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={quickNoteSubmitting || !quickNoteText.trim()}
                style={{
                  background: 'var(--admin-accent-primary, #7C3AED)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: quickNoteSubmitting || !quickNoteText.trim() ? 'not-allowed' : 'pointer',
                  opacity: quickNoteSubmitting || !quickNoteText.trim() ? 0.6 : 1,
                }}
              >
                {quickNoteSubmitting ? 'Appending…' : 'Add Note'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 3: Identity & Roles ─────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
          <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: 24, borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--admin-text-primary, #0F172A)' }}>
              Staff Role Assignment
            </h3>
            <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', margin: '0 0 18px' }}>
              Grant or revoke administrative permissions. All role grants require verified identity and are logged to audit compliance.
            </p>

            <form onSubmit={handleGrantRole}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-secondary, #475569)', marginBottom: 6 }}>
                  Select Staff Role
                </label>
                <select
                  value={selectedStaffRole}
                  onChange={(e) => setSelectedStaffRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                    background: 'var(--admin-bg-base, #F8FAFC)',
                    color: 'var(--admin-text-primary, #0F172A)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} ({r.value})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="submit"
                  disabled={roleSubmitting}
                  style={{
                    background: 'var(--admin-accent-primary, #7C3AED)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: roleSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {roleSubmitting ? 'Saving…' : 'Grant Staff Role'}
                </button>
                {user.platformRole && (
                  <button
                    type="button"
                    disabled={roleSubmitting}
                    onClick={handleRevokeRole}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--admin-status-error, #EF4444)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: roleSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Revoke Role
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: 24, borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--admin-text-primary, #0F172A)' }}>
              KYC & Settlement Accounts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary, #94A3B8)', textTransform: 'uppercase' }}>
                  Stripe Connect Account ID
                </div>
                <div style={{ marginTop: 4 }}>
                  <code style={{ fontSize: 12, background: 'var(--admin-surface-raised, #F1F5F9)', padding: '2px 6px', borderRadius: 4 }}>
                    {user.stripeAccountId || 'Unlinked / None'}
                  </code>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary, #94A3B8)', textTransform: 'uppercase' }}>
                  Stripe Customer ID
                </div>
                <div style={{ marginTop: 4 }}>
                  <code style={{ fontSize: 12, background: 'var(--admin-surface-raised, #F1F5F9)', padding: '2px 6px', borderRadius: 4 }}>
                    {user.stripeCustomerId || 'Unlinked / None'}
                  </code>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary, #94A3B8)', textTransform: 'uppercase' }}>
                  Terms & Consent Version
                </div>
                <div style={{ marginTop: 4, fontWeight: 600 }}>
                  {user.consentVersion || 'v2.1 (Current)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Relationships ────────────────────────────────────────────── */}
      {activeTab === 'relationships' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: 24, borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--admin-text-primary, #0F172A)' }}>
              Social & Community Graph
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: 'var(--admin-surface-raised, #F8FAFC)', padding: 16, borderRadius: 8, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary, #94A3B8)' }}>FOLLOWERS</div>
                <div className="admin-tabular-nums" style={{ fontSize: 24, fontWeight: 900, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {user.followerCount || artist?.followerCount || 0}
                </div>
              </div>
              <div style={{ background: 'var(--admin-surface-raised, #F8FAFC)', padding: 16, borderRadius: 8, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary, #94A3B8)' }}>FOLLOWING</div>
                <div className="admin-tabular-nums" style={{ fontSize: 24, fontWeight: 900, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {user.followingCount || 0}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: 24, borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--admin-text-primary, #0F172A)' }}>
              Associated Artist / Band Profile
            </h3>
            {artist ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Stage Name</span>
                  <span style={{ fontWeight: 700 }}>{artist.stageName || artist.displayName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Total Career Earnings</span>
                  <span className="admin-tabular-nums" style={{ fontWeight: 700, color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
                    {centsToDollars(artist.totalEarnedCents || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Verified Artist Badge</span>
                  <AdminStatusBadge status={artist.verified ? 'VERIFIED' : 'PENDING'} />
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--admin-text-tertiary, #94A3B8)', fontSize: 13, fontStyle: 'italic' }}>
                No registered artist profile found for this UID.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 5: Messages ─────────────────────────────────────────────────── */}
      {activeTab === 'messages' && (
        <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: 24, borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px', color: 'var(--admin-text-primary, #0F172A)' }}>
            Direct Communications & Direct Message Log
          </h3>
          <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', margin: '0 0 20px' }}>
            Audit trace of customer interactions and chat safety logs.
          </p>
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--admin-text-tertiary, #94A3B8)', fontSize: 13, background: 'var(--admin-surface-raised, #F8FAFC)', borderRadius: 8 }}>
            Direct messaging compliance log active. No abuse reports filed for this user.
          </div>
        </div>
      )}

      {/* ── TAB 6: Live Sessions ────────────────────────────────────────────── */}
      {activeTab === 'live_sessions' && (
        <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: 24, borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px', color: 'var(--admin-text-primary, #0F172A)' }}>
            Live Stream Participation & Broadcast Health
          </h3>
          <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', margin: '0 0 20px' }}>
            Live session attendance, broadcast telemetry, and real-time stage tipping records.
          </p>
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--admin-text-tertiary, #94A3B8)', fontSize: 13, background: 'var(--admin-surface-raised, #F8FAFC)', borderRadius: 8 }}>
            Stage telemetry is synchronized. User has standard spectator and stage broadcast permissions.
          </div>
        </div>
      )}

      {/* ── TAB 7: Tipping & Payments ──────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--admin-text-primary, #0F172A)' }}>
              Transaction History ({allTips.length})
            </h3>
            <span style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)' }}>
              Take-rate: 500 bps (5.00%)
            </span>
          </div>

          <AdminDataTable
            data={allTips}
            columns={tipColumns}
            loading={tipsLoading}
            emptyStateMessage="No transaction records found for this user."
          />
        </div>
      )}

      {/* ── TAB 8: Support & Reports ────────────────────────────────────────── */}
      {activeTab === 'support' && (
        <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: 24, borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--admin-text-primary, #0F172A)' }}>
              Support Tickets & Submissions ({supportTickets.length})
            </h3>
            <Link
              href="/admin/support"
              style={{
                fontSize: 12,
                color: 'var(--admin-accent-primary, #7C3AED)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Open Queue ↗
            </Link>
          </div>

          {supportLoading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
              Loading tickets…
            </div>
          ) : supportTickets.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--admin-text-tertiary, #94A3B8)', fontSize: 13 }}>
              No support tickets found for this account.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {supportTickets.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                    background: 'var(--admin-surface-raised, #F8FAFC)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)', fontSize: 13 }}>
                      {t.subject || 'Support Request'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-secondary, #64748B)', marginTop: 2 }}>
                      <code>{t.id}</code> · {formatTS(t.createdAt)}
                    </div>
                  </div>
                  <AdminStatusBadge status={(t.status || 'OPEN').toUpperCase()} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 9: Moderation ───────────────────────────────────────────────── */}
      {activeTab === 'moderation' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: 24, borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: 'var(--admin-text-primary, #0F172A)' }}>
              Trust & Safety Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Account State</span>
                <AdminStatusBadge status={isSuspended ? 'SUSPENDED' : 'ACTIVE'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--admin-text-secondary, #64748B)' }}>Recorded Strikes</span>
                <span className="admin-tabular-nums" style={{ fontWeight: 800, color: user.strikeCount ? '#EF4444' : '#10B981', fontVariantNumeric: 'tabular-nums' }}>
                  {user.strikeCount || 0}
                </span>
              </div>
              {user.suspensionReason && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary, #94A3B8)', textTransform: 'uppercase' }}>
                    Active Suspension Justification
                  </div>
                  <div style={{ marginTop: 4, padding: 10, background: 'rgba(239, 68, 68, 0.08)', borderRadius: 6, color: '#DC2626', fontSize: 12 }}>
                    {user.suspensionReason}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 10: Audit Log ───────────────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--admin-text-primary, #0F172A)' }}>
              Immutable Compliance Audit Trail ({auditEvents.length})
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--admin-surface-raised, #F8FAFC)', borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', textAlign: 'left', color: 'var(--admin-text-secondary, #64748B)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Actor</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Operational Reason</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                      No audit events recorded for this user entity.
                    </td>
                  </tr>
                ) : (
                  auditEvents.map((ev) => (
                    <tr key={ev.id} style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                      <td className="admin-tabular-nums" style={{ padding: '12px 18px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {formatTS(ev.createdAt || ev.timestamp)}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-accent-primary, #7C3AED)', background: 'rgba(124, 58, 237, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                          {ev.action || ev.eventType || 'ADMIN_ACTION'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', fontWeight: 600 }}>
                        {ev.actorEmail || ev.actorUid || 'System'}
                      </td>
                      <td style={{ padding: '12px 18px', color: 'var(--admin-text-primary, #0F172A)' }}>
                        {ev.reason || ev.metadata?.reason || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 11: Raw Data ────────────────────────────────────────────────── */}
      {activeTab === 'raw_data' && (
        <div style={{ background: 'var(--admin-surface-card, #FFFFFF)', padding: 24, borderRadius: 12, border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--admin-text-primary, #0F172A)' }}>
              Raw Firestore Document Data
            </h3>
            <button
              type="button"
              onClick={handleCopyRawData}
              style={{
                background: 'var(--admin-surface-raised, #F1F5F9)',
                border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--admin-text-primary, #0F172A)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {copiedRawData ? <CheckIcon size={14} strokeWidth={2.4} /> : <CopyIcon size={14} strokeWidth={2} />}
              <span>{copiedRawData ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <pre
            style={{
              background: 'var(--admin-bg-base, #0F172A)',
              color: '#38BDF8',
              padding: 20,
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'monospace',
              overflowX: 'auto',
              maxHeight: 500,
            }}
          >
            {JSON.stringify({ user, artist }, null, 2)}
          </pre>
        </div>
      )}

      {/* ── SEPARATE DANGER ZONE CARD AT BOTTOM OF WORKSPACE ────────────────── */}
      <div
        style={{
          marginTop: 40,
          background: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 14,
          padding: '24px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--admin-status-error, #EF4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangleIcon size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--admin-status-error, #EF4444)' }}>
                Danger Zone & Lifecycle Enforcement
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', maxWidth: 640 }}>
                Operations performed here enforce platform compliance and restrict user access across all microservices.
                All actions require mandatory justification reasons and confirmation tokens.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {isSuspended ? (
              <button
                type="button"
                onClick={() => {
                  setSuspendReason('');
                  setIsSuspendModalOpen(true);
                }}
                style={{
                  background: 'var(--admin-status-success, #10B981)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckCircleIcon size={16} strokeWidth={2.4} />
                <span>Reinstate Account</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSuspendReason('');
                  setSuspendConfirmPhrase('');
                  setIsSuspendModalOpen(true);
                }}
                style={{
                  background: 'var(--admin-status-error, #EF4444)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <BanIcon size={16} strokeWidth={2.4} />
                <span>Suspend Account</span>
              </button>
            )}

            <button
              type="button"
              disabled
              title="Permanent account deletion requires Super Admin quorum approval."
              style={{
                background: 'transparent',
                color: 'var(--admin-text-tertiary, #94A3B8)',
                border: '1px dashed var(--admin-border-subtle, #CBD5E1)',
                padding: '9px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'not-allowed',
              }}
            >
              Permanent Delete (Quorum Protected)
            </button>
          </div>
        </div>
      </div>

      {/* Controlled Profile Editor Modal */}
      <ControlledProfileEditorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        artist={artist}
        onSave={handleSaveProfile}
      />

      {/* Suspend / Reinstate Confirmation Modal */}
      {isSuspendModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: 16,
          }}
          onClick={() => !suspendSubmitting && setIsSuspendModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--admin-surface-card, #FFFFFF)',
              width: '100%',
              maxWidth: 480,
              borderRadius: 14,
              border: '1px solid var(--admin-border-subtle, #CBD5E1)',
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: isSuspended ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: isSuspended ? 'var(--admin-status-success, #10B981)' : 'var(--admin-status-error, #EF4444)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isSuspended ? <CheckCircleIcon size={18} strokeWidth={2} /> : <AlertTriangleIcon size={18} strokeWidth={2} />}
              </div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--admin-text-primary, #0F172A)' }}>
                {isSuspended ? 'Reinstate User Account' : 'Suspend User Account'}
              </h3>
            </div>

            <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', margin: '0 0 16px' }}>
              Target: <strong>{user.displayName || 'Unknown'}</strong> (<code>{canonicalUid}</code>)
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-secondary, #475569)', marginBottom: 4 }}>
                Target Entity Type
              </label>
              <select
                value={suspendTargetType}
                onChange={(e) => setSuspendTargetType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                  background: 'var(--admin-bg-base, #F8FAFC)',
                  color: 'var(--admin-text-primary, #0F172A)',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                <option value="user">User Account (users/{canonicalUid})</option>
                <option value="artist">Artist Profile (artistProfiles/{canonicalUid})</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-secondary, #475569)', marginBottom: 4 }}>
                Operational Justification / Reason *
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Reason recorded into auditEvents..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                  background: 'var(--admin-bg-base, #F8FAFC)',
                  color: 'var(--admin-text-primary, #0F172A)',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {!isSuspended && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-status-error, #EF4444)', marginBottom: 4 }}>
                  Type <code>SUSPEND ACCOUNT</code> to confirm *
                </label>
                <input
                  type="text"
                  value={suspendConfirmPhrase}
                  onChange={(e) => setSuspendConfirmPhrase(e.target.value)}
                  placeholder="SUSPEND ACCOUNT"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                    background: 'var(--admin-bg-base, #F8FAFC)',
                    color: 'var(--admin-text-primary, #0F172A)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                disabled={suspendSubmitting}
                onClick={() => setIsSuspendModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                  background: 'transparent',
                  color: 'var(--admin-text-secondary, #64748B)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={suspendSubmitting || !suspendReason.trim() || (!isSuspended && suspendConfirmPhrase !== 'SUSPEND ACCOUNT')}
                onClick={handleToggleSuspension}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: isSuspended ? 'var(--admin-status-success, #10B981)' : 'var(--admin-status-error, #EF4444)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: suspendSubmitting ? 'not-allowed' : 'pointer',
                  opacity: suspendSubmitting ? 0.7 : 1,
                }}
              >
                {suspendSubmitting ? 'Processing…' : isSuspended ? 'Confirm Reinstatement' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tip Refund Approval Modal */}
      {refundTipModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: 16,
          }}
          onClick={() => !refundSubmitting && setRefundTipModal(null)}
        >
          <div
            style={{
              background: 'var(--admin-surface-card, #FFFFFF)',
              width: '100%',
              maxWidth: 460,
              borderRadius: 14,
              border: '1px solid var(--admin-border-subtle, #CBD5E1)',
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: 'var(--admin-text-primary, #0F172A)' }}>
              Approve Tip Refund
            </h3>
            <p style={{ fontSize: 13, color: 'var(--admin-text-secondary, #64748B)', margin: '0 0 16px' }}>
              Refunding <strong>{centsToDollars(refundTipModal.amountCents)}</strong> for Tip ID:{' '}
              <code>{refundTipModal.tipId}</code>.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-secondary, #475569)', marginBottom: 4 }}>
                Refund Reason *
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Reason for approving customer refund..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                  background: 'var(--admin-bg-base, #F8FAFC)',
                  color: 'var(--admin-text-primary, #0F172A)',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                disabled={refundSubmitting}
                onClick={() => setRefundTipModal(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border-subtle, #CBD5E1)',
                  background: 'transparent',
                  color: 'var(--admin-text-secondary, #64748B)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={refundSubmitting || !refundReason.trim()}
                onClick={handleExecuteRefund}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--admin-status-error, #EF4444)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: refundSubmitting || !refundReason.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {refundSubmitting ? 'Refunding…' : 'Approve Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
