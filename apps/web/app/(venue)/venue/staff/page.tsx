/**
 * Crowdbeats V2 — Venue Staff & Roles (Phase 9)
 * 'use client' page for venue team roster, permissions, and 7-day invitations.
 */

'use client';

import React, { useState } from 'react';

interface StaffMember {
  uid: string;
  displayName: string;
  email: string;
  role: 'VENUE_OWNER' | 'VENUE_MANAGER' | 'VENUE_STAFF';
  joinedAt: string;
}

export default function VenueStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([
    {
      uid: 'owner_1',
      displayName: 'Oscar Owner',
      email: 'oscar@fillmore.com',
      role: 'VENUE_OWNER',
      joinedAt: '2026-08-01',
    },
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'VENUE_MANAGER' | 'VENUE_STAFF'>('VENUE_STAFF');
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
            Venue Staff & Team Roles
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Manage door staff, sound technicians, and managers with role-based stage access.
          </p>
        </div>

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
          + Invite Staff Member
        </button>
      </div>

      {/* Staff List Table */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Staff Member</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Joined</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.uid} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.email}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      background: s.role === 'VENUE_OWNER' ? 'rgba(251,191,36,0.15)' : 'var(--surface-raised)',
                      color: s.role === 'VENUE_OWNER' ? 'var(--status-warning)' : 'var(--text-secondary)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {s.role.replace('VENUE_', '')}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-tertiary)' }}>
                  {s.joinedAt}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  {s.role !== 'VENUE_OWNER' && (
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
              Invite Venue Staff
            </h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
              Invitations expire in 7 days and grant access to stage monitors and check-in tools.
            </p>

            {inviteSent ? (
              <div style={{ padding: 14, background: 'rgba(74,222,128,0.15)', color: 'var(--status-success)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                ✓ Staff invitation sent!
              </div>
            ) : (
              <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Staff Email
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="staff@venue.com"
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
                    <option value="VENUE_STAFF">Venue Staff (Monitor & Check-in)</option>
                    <option value="VENUE_MANAGER">Venue Manager (Stage Config & Booking)</option>
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
    </div>
  );
}
