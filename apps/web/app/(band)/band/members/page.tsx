'use client';

/**
 * Crowdbeats V2 — Band Members & Role Governance (Phase 12)
 *
 * Full-featured Band Member & Governance Console:
 * - Member roster & roles (BAND_FOUNDER, BAND_ADMIN, BAND_MEMBER)
 * - 7-day expiring invitations via inviteBandMember callable
 * - Role promotion & demotion via updateBandMemberRole callable
 * - Member departure / removal via removeBandMember callable
 * - Isolated ownership transfer with typed confirmation "TRANSFER OWNERSHIP"
 * - Enforcement of Owner/Manager/Member permissions
 */

import React, { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  useBandTreasury,
  callInviteBandMember,
  callUpdateBandMemberRole,
  callRemoveBandMember,
  callTransferBandOwnership,
} from '@/lib/band/bandCrm';
import type { BandRole } from '@crowdbeats/contracts';

export default function BandMembersPage() {
  const { user } = useAuth();
  const bandId = (user as any)?.bandId || (user as any)?.activeBandId || 'band_neon_pulse';
  const currentUid = user?.uid || '';

  const { treasury, loading, error, refresh } = useBandTreasury(bandId);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'BAND_ADMIN' | 'BAND_MEMBER'>('BAND_MEMBER');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Role update state
  const [roleTargetMember, setRoleTargetMember] = useState<{ uid: string; displayName: string; role: string } | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<'BAND_ADMIN' | 'BAND_MEMBER'>('BAND_MEMBER');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Remove member state
  const [removeTargetMember, setRemoveTargetMember] = useState<{ uid: string; displayName: string } | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  // Transfer ownership state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetUid, setTransferTargetUid] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Determine current user's role in the band
  const members = treasury?.members || [
    {
      uid: currentUid || 'usr_founder_1',
      displayName: user?.displayName || 'Band Leader',
      role: 'BAND_FOUNDER',
      splitBps: 10000,
      totalEarnedCents: 0,
      availableBalanceCents: 0,
      pendingKycBalanceCents: 0,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true,
    },
  ];

  const currentMember = members.find((m) => m.uid === currentUid);
  const currentRole = (currentMember?.role as BandRole) || 'BAND_FOUNDER';
  const isFounder = currentRole === 'BAND_FOUNDER';
  const isAdminOrFounder = ['BAND_FOUNDER', 'BAND_ADMIN'].includes(currentRole);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) return;

    setIsInviting(true);
    try {
      const res = await callInviteBandMember({
        bandId,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole as any,
        idempotencyKey: `inv_${Date.now()}`,
      });
      setFeedback({
        type: 'success',
        message: `Invitation sent to ${inviteEmail}! (Expires in 7 days)`,
      });
      setShowInviteModal(false);
      setInviteEmail('');
      refresh();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to send invitation.',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTargetMember) return;

    setIsUpdatingRole(true);
    try {
      await callUpdateBandMemberRole({
        bandId,
        memberUid: roleTargetMember.uid,
        newRole: newSelectedRole as any,
        idempotencyKey: `role_${Date.now()}`,
      });
      setFeedback({
        type: 'success',
        message: `Updated role for ${roleTargetMember.displayName} to ${newSelectedRole.replace('BAND_', '')}.`,
      });
      setRoleTargetMember(null);
      refresh();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update member role.',
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleRemoveMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeTargetMember) return;

    setIsRemoving(true);
    try {
      await callRemoveBandMember({
        bandId,
        memberUid: removeTargetMember.uid,
        reason: removeReason.trim() || undefined,
        idempotencyKey: `rem_${Date.now()}`,
      });
      setFeedback({
        type: 'success',
        message: `${removeTargetMember.displayName} removed from the active band roster.`,
      });
      setRemoveTargetMember(null);
      setRemoveReason('');
      refresh();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to remove member.',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmPhrase !== 'TRANSFER OWNERSHIP' || !transferTargetUid) return;

    setIsTransferring(true);
    try {
      await callTransferBandOwnership({
        bandId,
        targetUid: transferTargetUid,
        confirmationPhrase: 'TRANSFER OWNERSHIP',
        idempotencyKey: `trans_${Date.now()}`,
      });
      setFeedback({
        type: 'success',
        message: 'Band ownership successfully transferred!',
      });
      setShowTransferModal(false);
      setConfirmPhrase('');
      setTransferTargetUid('');
      refresh();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to transfer ownership.',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'BAND_FOUNDER':
        return { label: 'OWNER & FOUNDER', bg: 'rgba(251,191,36,0.15)', color: '#D97706', border: '1px solid rgba(251,191,36,0.3)' };
      case 'BAND_ADMIN':
        return { label: 'MANAGER / ADMIN', bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' };
      case 'BAND_MEMBER':
      default:
        return { label: 'MEMBER', bg: 'rgba(107,114,128,0.15)', color: '#6B7280', border: '1px solid rgba(107,114,128,0.3)' };
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', color: 'var(--text-primary, #1D1D1F)' }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🤝</span>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Band Members & Governance
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary, #6E6E73)', fontSize: 14, margin: '6px 0 0 38px' }}>
            Manage team seats (up to 20), assign admin privileges, invite collaborators, and isolate payout balances.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {isFounder && (
            <button
              onClick={() => setShowTransferModal(true)}
              style={{
                background: 'var(--surface-raised, #F5F5F7)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))',
                padding: '9px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              👑 Transfer Ownership
            </button>
          )}

          {isAdminOrFounder && (
            <button
              onClick={() => setShowInviteModal(true)}
              style={{
                background: '#000000',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Invite Member
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
            background: feedback.type === 'success' ? 'rgba(48, 209, 88, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: feedback.type === 'success' ? '#248A3D' : '#DC2626',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(48, 209, 88, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* ── Governance Status Banners ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #6E6E73)', marginBottom: 4 }}>ACTIVE ROSTER SEATS</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{members.length} / 20</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Maximum 20 active members permitted
          </div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #6E6E73)', marginBottom: 4 }}>YOUR PERMISSION LEVEL</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: isFounder ? '#D97706' : isAdminOrFounder ? '#8B5CF6' : '#1D1D1F' }}>
            {getRoleBadge(currentRole).label}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {isFounder ? 'Full ownership & split management' : isAdminOrFounder ? 'Can invite & manage roster' : 'Member access & isolated payout view'}
          </div>
        </div>

        <div style={{ background: 'var(--surface-card, #FFFFFF)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #6E6E73)', marginBottom: 4 }}>PAYOUT-DATA ISOLATION</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981' }}>
            Active & Enforced
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Individual balances isolated by platform rules
          </div>
        </div>
      </div>

      {/* ── Member Roster Table ──────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface-card, #FFFFFF)', borderRadius: 14, border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', overflow: 'hidden', marginBottom: 32 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised, #F5F5F7)', borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', color: 'var(--text-secondary, #6E6E73)' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Member & Identity</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Governance Role</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Split Share</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Payout Readiness</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const badge = getRoleBadge(m.role);
              const isSelf = m.uid === currentUid;

              return (
                <tr key={m.uid} style={{ borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.06))' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#1D1D1F',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {m.displayName ? m.displayName.slice(0, 2).toUpperCase() : 'BM'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {m.displayName} {isSelf && <span style={{ color: '#8B5CF6', fontSize: 11 }}>(You)</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary, #86868B)' }}>
                          ID: {m.uid.slice(0, 10)}...
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        border: badge.border,
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {badge.label}
                    </span>
                  </td>

                  <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                    {(m.splitBps / 100).toFixed(1)}%
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    {m.stripePayoutsEnabled ? (
                      <span style={{ color: '#10B981', fontWeight: 600, fontSize: 12 }}>✓ Payouts Ready</span>
                    ) : (
                      <span style={{ color: '#F59E0B', fontWeight: 600, fontSize: 12 }}>⏳ KYC Onboarding Pending</span>
                    )}
                  </td>

                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {isFounder && m.role !== 'BAND_FOUNDER' && (
                        <button
                          onClick={() => {
                            setRoleTargetMember(m);
                            setNewSelectedRole(m.role === 'BAND_ADMIN' ? 'BAND_MEMBER' : 'BAND_ADMIN');
                          }}
                          style={{
                            background: 'var(--surface-raised, #F5F5F7)',
                            border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))',
                            color: 'var(--text-primary)',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Change Role
                        </button>
                      )}

                      {isAdminOrFounder && m.role !== 'BAND_FOUNDER' && (!isSelf || m.role === 'BAND_MEMBER') && (
                        <button
                          onClick={() => setRemoveTargetMember(m)}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#DC2626',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Invite Member Modal ─────────────────────────────────────────────── */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#FFFFFF', maxWidth: 460, width: '100%', padding: 24, borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>
              Invite New Band Member
            </h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
              Invitations expire in 7 days. The recipient must accept with their authenticated Crowdbeats email address.
            </p>

            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle, rgba(0,0,0,0.15))',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Governance Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle, rgba(0,0,0,0.15))',
                    fontSize: 13,
                    background: '#FFFFFF',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="BAND_MEMBER">BAND MEMBER (Performance, split share, CRM view)</option>
                  <option value="BAND_ADMIN">BAND MANAGER / ADMIN (Member invites, campaigns, CRM management)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  disabled={isInviting}
                  style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--surface-raised, #F5F5F7)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  style={{ padding: '8px 18px', borderRadius: 8, background: '#000000', color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 700, cursor: isInviting ? 'not-allowed' : 'pointer' }}
                >
                  {isInviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Role Modal ──────────────────────────────────────────────── */}
      {roleTargetMember && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#FFFFFF', maxWidth: 440, width: '100%', padding: 24, borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>
              Update Role: {roleTargetMember.displayName}
            </h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
              Select the new permission level for this band member:
            </p>

            <form onSubmit={handleUpdateRoleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <select
                  value={newSelectedRole}
                  onChange={(e) => setNewSelectedRole(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle, rgba(0,0,0,0.15))',
                    fontSize: 13,
                    background: '#FFFFFF',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="BAND_MEMBER">BAND MEMBER</option>
                  <option value="BAND_ADMIN">BAND MANAGER / ADMIN</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setRoleTargetMember(null)}
                  disabled={isUpdatingRole}
                  style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--surface-raised, #F5F5F7)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingRole}
                  style={{ padding: '8px 18px', borderRadius: 8, background: '#000000', color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 700, cursor: isUpdatingRole ? 'not-allowed' : 'pointer' }}
                >
                  {isUpdatingRole ? 'Updating...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Remove Member Modal ────────────────────────────────────────────── */}
      {removeTargetMember && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#FFFFFF', maxWidth: 440, width: '100%', padding: 24, borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#DC2626' }}>
              Remove {removeTargetMember.displayName}?
            </h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
              This member will be removed from the active band roster and future tip splits. Past payout audit records will remain preserved on the ledger.
            </p>

            <form onSubmit={handleRemoveMemberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Reason for Departure (Optional)
                </label>
                <input
                  type="text"
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  placeholder="e.g. Schedule conflict, stepped down"
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle, rgba(0,0,0,0.15))',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setRemoveTargetMember(null)}
                  disabled={isRemoving}
                  style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--surface-raised, #F5F5F7)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRemoving}
                  style={{ padding: '8px 18px', borderRadius: 8, background: '#DC2626', color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 700, cursor: isRemoving ? 'not-allowed' : 'pointer' }}
                >
                  {isRemoving ? 'Removing...' : 'Confirm Removal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Transfer Ownership Modal ────────────────────────────────────────── */}
      {showTransferModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#FFFFFF', maxWidth: 480, width: '100%', padding: 24, borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#D97706' }}>
              👑 Transfer Band Ownership
            </h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
              Transferring ownership will pass full governance and split control to the selected member. Your role will be converted to <strong>BAND ADMIN</strong>.
            </p>

            <form onSubmit={handleTransferOwnership} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Select Successor
                </label>
                <select
                  value={transferTargetUid}
                  onChange={(e) => setTransferTargetUid(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle, rgba(0,0,0,0.15))',
                    fontSize: 13,
                    background: '#FFFFFF',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">-- Choose active member --</option>
                  {members.filter((m) => m.uid !== currentUid).map((m) => (
                    <option key={m.uid} value={m.uid}>
                      {m.displayName} ({m.role.replace('BAND_', '')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Type <span style={{ color: '#D97706', fontWeight: 800 }}>TRANSFER OWNERSHIP</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  placeholder="TRANSFER OWNERSHIP"
                  required
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle, rgba(0,0,0,0.15))',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  disabled={isTransferring}
                  style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--surface-raised, #F5F5F7)', border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring || confirmPhrase !== 'TRANSFER OWNERSHIP' || !transferTargetUid}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    background: confirmPhrase === 'TRANSFER OWNERSHIP' && transferTargetUid ? '#D97706' : '#9CA3AF',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: confirmPhrase === 'TRANSFER OWNERSHIP' && transferTargetUid ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isTransferring ? 'Transferring...' : 'Transfer Ownership'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
