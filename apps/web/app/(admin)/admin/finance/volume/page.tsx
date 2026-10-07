'use client';

import React from 'react';
import Link from 'next/link';
import { useAdminTips, centsToDollars } from '@/lib/admin/adminFirestore';

export default function VolumePage() {
  const { tips, loading, error } = useAdminTips();

  const volumeByDate = tips.reduce((acc, tip) => {
    if (!tip.createdAt) return acc;
    const dateStr = tip.createdAt.toDate().toLocaleDateString();
    if (!acc[dateStr]) {
      acc[dateStr] = { date: dateStr, count: 0, totalGrossCents: 0, totalNetCents: 0, totalPlatformFeeCents: 0 };
    }
    
    // Only count successful tips towards volume
    if (tip.status === 'succeeded' || tip.status === 'completed') {
      acc[dateStr].count += 1;
      acc[dateStr].totalGrossCents += tip.amountCents;
      acc[dateStr].totalNetCents += tip.netAmountCents;
      acc[dateStr].totalPlatformFeeCents += tip.platformFeeCents;
    }
    return acc;
  }, {} as Record<string, { date: string, count: number, totalGrossCents: number, totalNetCents: number, totalPlatformFeeCents: number }>);

  // Filter out dates with 0 successful tips, sort by date descending
  const rows = Object.values(volumeByDate)
    .filter(row => row.count > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1300, margin: '0 auto', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
        <Link href="/admin/finance" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          Finance Control Plane
        </Link>
        <span>/</span>
        <span>Tip Volume Over Time</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>Tip Volume Over Time</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Daily aggregated tip volume and revenue.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 14px', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Refresh Live Data
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: 14 }}>
          Daily Volume
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13, minWidth: '700px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Tip Count</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Gross Volume</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Net to Creators</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Platform Fees</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center' }}>Loading...</td></tr>}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No tip volume found.
                  </td>
                </tr>
              )}
              {!loading && rows.map(row => (
                <tr key={row.date} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 600 }}>{row.date}</td>
                  <td style={{ padding: '12px 20px' }}>{row.count}</td>
                  <td style={{ padding: '12px 20px', fontWeight: 600 }}>{centsToDollars(row.totalGrossCents)}</td>
                  <td style={{ padding: '12px 20px' }}>{centsToDollars(row.totalNetCents)}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--accent-primary)' }}>{centsToDollars(row.totalPlatformFeeCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
