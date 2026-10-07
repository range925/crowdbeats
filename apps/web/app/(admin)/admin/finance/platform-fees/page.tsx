'use client';

import React from 'react';
import Link from 'next/link';
import { useAdminTips, centsToDollars } from '@/lib/admin/adminFirestore';

export default function PlatformFeesPage() {
  const { tips, loading, error } = useAdminTips();
  
  const successfulTips = tips.filter(t => t.status === 'succeeded' || t.status === 'completed');
  const totalPlatformFees = successfulTips.reduce((acc, t) => acc + t.platformFeeCents, 0);

  const feesByCreator = successfulTips.reduce((acc, tip) => {
    if (!acc[tip.creatorId]) {
      acc[tip.creatorId] = { totalFeesCents: 0, count: 0 };
    }
    acc[tip.creatorId].totalFeesCents += tip.platformFeeCents;
    acc[tip.creatorId].count += 1;
    return acc;
  }, {} as Record<string, { totalFeesCents: number, count: number }>);

  const creatorRows = Object.keys(feesByCreator).map(creatorId => ({
    creatorId,
    ...feesByCreator[creatorId]
  })).sort((a, b) => b.totalFeesCents - a.totalFeesCents);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1300, margin: '0 auto', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
        <Link href="/admin/finance" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          Finance Control Plane
        </Link>
        <span>/</span>
        <span>Platform Fees</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>Platform Fees</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Platform fees retained, aggregated by creator.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 14px', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Refresh Live Data
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Total Platform Fees</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-primary)' }}>{centsToDollars(totalPlatformFees)}</div>
        </div>
        <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Creators with Fees</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{creatorRows.length}</div>
        </div>
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: 14 }}>
          Fees by Creator
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13, minWidth: '600px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Creator UID</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Tip Count</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Total Fees Retained</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={3} style={{ padding: '48px 20px', textAlign: 'center' }}>Loading...</td></tr>}
              {!loading && creatorRows.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No platform fees collected.
                  </td>
                </tr>
              )}
              {!loading && creatorRows.map(row => (
                <tr key={row.creatorId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>{row.creatorId}</td>
                  <td style={{ padding: '12px 20px' }}>{row.count}</td>
                  <td style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--accent-primary)' }}>{centsToDollars(row.totalFeesCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
