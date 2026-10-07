'use client';

import React from 'react';
import { useAdminUsers, usePlatformMetrics } from '@/lib/admin/adminFirestore';

export default function EnterpriseCommunityPage() {
  const { metrics, loading: metricsLoading } = usePlatformMetrics();
  const { users: recentUsers, loading: usersLoading } = useAdminUsers({ limitN: 10 });
  const { users: fanUsers, loading: fansLoading } = useAdminUsers({ personaFilter: 'fan', limitN: 1000 });

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Community & Fan Engagement
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Platform-wide fan loyalty metrics, top tipper cohorts, and audience retention graphs.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface-card)', padding: 20, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Total Platform Fans</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-primary)' }}>
            {fansLoading ? '...' : fanUsers.length + '+'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Active fan accounts</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 20, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Total Platform Users</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-secondary)' }}>
            {metricsLoading ? '...' : metrics.totalUsers}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>All registered personas</div>
        </div>
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
          Recent Signups
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>User</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Persona</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {usersLoading ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  Loading recent signups...
                </td>
              </tr>
            ) : recentUsers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  No recent signups.
                </td>
              </tr>
            ) : (
              recentUsers.map(u => (
                <tr key={u.uid} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 600 }}>{u.displayName || 'Unknown'}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'var(--surface-raised)' }}>
                      {u.personaType || 'None'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-tertiary)' }}>
                    {u.createdAt ? u.createdAt.toDate().toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
