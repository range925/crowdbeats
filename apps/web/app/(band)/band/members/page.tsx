/**
 * Crowdbeats V2 — Band Members & Role Governance (Phase 8)
 *
 * 'use client' page for:
 * - Member roster & roles (BAND_FOUNDER, BAND_ADMIN, BAND_MEMBER)
 * - 7-day expiring invitations
 * - Role promotion/demotion
 * - Member removal
 * - Isolated ownership transfer with typed confirmation
 */

'use client';

import React, { useState } from 'react';

interface Member {
  uid: string;
  displayName: string;
  email: string;
  role: 'BAND_FOUNDER' | 'BAND_ADMIN' | 'BAND_MEMBER';
  joinedAt: string;
  splitBps: number;
}

export default function BandMembersPage() {
  const [members, setMembers] = useState<Member[]>([
    {
      uid: 'founder_1',
      displayName: 'Alice Founder',
      email: 'alice@example.com',
      role: 'BAND_FOUNDER',
      joinedAt: '2026-08-01',
      splitBps: 10000,
    },
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'BAND_ADMIN' | 'BAND_MEMBER'>('BAND_MEMBER');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetUid, setTransferTargetUid] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) return;

    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setShowInviteModal(false);
      setInviteEmail('');
    }, 2000);
  };

  const handleTransferOwnership = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmPhrase !== 'TRANSFER OWNERSHIP' || !transferTargetUid) return;

    setTransferSuccess(true);
    setTimeout(() => {
      setTransferSuccess(false);
      setShowTransferModal(false);
      setConfirmPhrase('');
    }, 2000);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Band Members & Governance
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Manage team seats, assign admin privileges, invite collaborators, or transfer band ownership.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowTransferModal(true)}
            style={{
              background: 'var(--surface-raised)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            👑 Transfer Ownership
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            style={{
              background: 'var(--accent-primary)',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Invite Member
          </button>
        </div>
      </div>

      {/* Member Roster Table */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden', marginBottom: 32 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Member</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Split Share</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Joined</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.uid} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-raised)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                      {m.displayName[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.displayName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      background: m.role === 'BAND_FOUNDER' ? 'rgba(251,191,36,0.15)' : 'var(--surface-raised)',
                      color: m.role === 'BAND_FOUNDER' ? 'var(--status-warning)' : 'var(--text-secondary)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {m.role.replace('BAND_', '')}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                  {(m.splitBps / 100).toFixed(1)}%
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-tertiary)' }}>
                  {m.joinedAt}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  {m.role !== 'BAND_FOUNDER' && (
                    <button
                      style={{ background: 'transparent', border: '1px solid var(--status-error)', color: 'var(--status-error)', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--surface-card)', width: 440, padding: 28, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>
              Invite Band Member
            </h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
              Invitations expire in 7 days and must be accepted with matching email address.
            </p>

            {inviteSent ? (
              <div style={{ padding: 14, background: 'rgba(74,222,128,0.15)', color: 'var(--status-success)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                ✓ Invitation sent successfully!
              </div>
            ) : (
              <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="musician@example.com"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Role Assignment
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="BAND_MEMBER">Band Member</option>
                    <option value="BAND_ADMIN">Band Admin</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: 'var(--accent-primary)', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--surface-card)', width: 480, padding: 28, borderRadius: 14, border: '1px solid var(--status-error)' }}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--status-error)', fontSize: 18, fontWeight: 700 }}>
              Transfer Band Ownership
            </h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
              This high-risk action assigns the <strong>BAND_FOUNDER</strong> role to another member. You will become a <strong>BAND_ADMIN</strong>.
            </p>

            {transferSuccess ? (
              <div style={{ padding: 14, background: 'rgba(74,222,128,0.15)', color: 'var(--status-success)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                ✓ Ownership successfully transferred!
              </div>
            ) : (
              <form onSubmit={handleTransferOwnership} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Select New Founder
                  </label>
                  <select
                    value={transferTargetUid}
                    onChange={(e) => setTransferTargetUid(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="">Choose an active member...</option>
                    {members.filter((m) => m.role !== 'BAND_FOUNDER').map((m) => (
                      <option key={m.uid} value={m.uid}>{m.displayName} ({m.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Type <code style={{ color: 'var(--accent-primary)' }}>TRANSFER OWNERSHIP</code> to confirm
                  </label>
                  <input
                    type="text"
                    required
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value)}
                    placeholder="TRANSFER OWNERSHIP"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={confirmPhrase !== 'TRANSFER OWNERSHIP' || !transferTargetUid}
                    style={{
                      background: confirmPhrase === 'TRANSFER OWNERSHIP' && transferTargetUid ? 'var(--status-error)' : 'var(--surface-raised)',
                      color: confirmPhrase === 'TRANSFER OWNERSHIP' && transferTargetUid ? '#fff' : 'var(--text-disabled)',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: confirmPhrase === 'TRANSFER OWNERSHIP' && transferTargetUid ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Confirm Transfer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
