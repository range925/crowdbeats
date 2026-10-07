/**
 * Crowdbeats V2 — Sponsor Team & Roles (Phase 9)
 * 'use client' page for team management, 7-day invitations, and role assignments.
 */

'use client';

import React, { useState } from 'react';

interface TeamMember {
  uid: string;
  displayName: string;
  email: string;
  role: 'SPONSOR_ADMIN' | 'SPONSOR_REP';
  joinedAt: string;
}

export default function SponsorTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      uid: 'admin_1',
      displayName: 'Alice Admin',
      email: 'alice@gibson.com',
      role: 'SPONSOR_ADMIN',
      joinedAt: '2026-08-01',
    },
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'SPONSOR_ADMIN' | 'SPONSOR_REP'>('SPONSOR_REP');
  const [inviteSent, setInviteSent] = useState(false);

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

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Sponsor Team & Members
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Assign Sponsor Admin and Sponsor Representative permissions to team members.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          style={{
            background: 'var(--accent-secondary)',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Invite Team Member
        </button>
      </div>

      {/* Team Members List */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Member</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Joined</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.uid} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.email}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      background: m.role === 'SPONSOR_ADMIN' ? 'rgba(139,92,246,0.15)' : 'var(--surface-raised)',
                      color: m.role === 'SPONSOR_ADMIN' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {m.role.replace('SPONSOR_', '')}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-tertiary)' }}>
                  {m.joinedAt}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  {m.role !== 'SPONSOR_ADMIN' && (
                    <button style={{ background: 'transparent', border: '1px solid var(--status-error)', color: 'var(--status-error)', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
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
              Invite Sponsor Team Member
            </h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
              Invitations expire in 7 days and must be accepted by matching corporate email.
            </p>

            {inviteSent ? (
              <div style={{ padding: 14, background: 'rgba(74,222,128,0.15)', color: 'var(--status-success)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                ✓ Invitation sent!
              </div>
            ) : (
              <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
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
                    <option value="SPONSOR_REP">Sponsor Representative</option>
                    <option value="SPONSOR_ADMIN">Sponsor Admin</option>
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
                    style={{ background: 'var(--accent-secondary)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    Send Invitation
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
