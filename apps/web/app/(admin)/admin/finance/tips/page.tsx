'use client';

import React from 'react';
import Link from 'next/link';
import { useAdminTips, centsToDollars, formatTS } from '@/lib/admin/adminFirestore';

export default function TipsPage() {
  const { tips, loading, error, totalCents } = useAdminTips();

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1300, margin: '0 auto', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
        <Link href="/admin/finance" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          Finance Control Plane
        </Link>
        <span>/</span>
        <span>Tips and Supporter Payments</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>Tips and Supporter Payments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Fan-to-creator tipping transactions and live stage contributions.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ padding: '8px 14px', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
            Export CSV
          </button>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 14px', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Refresh Live Data
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Total Volume</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{centsToDollars(totalCents)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>All time tips</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Record Count</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{tips.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Total tips</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Loading Status</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: loading ? 'var(--status-warning)' : 'var(--status-success)', marginTop: 4 }}>
            {loading ? 'Loading...' : 'Loaded'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{error ? error : 'Connected to Firestore'}</div>
        </div>
      </div>

      {/* Data Table */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: 14 }}>
          Tips Records
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13, minWidth: '900px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Tip ID</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Fan UID</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Creator UID</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Gross</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Fee</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Net</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Payment Intent</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} style={{ padding: '48px 20px', textAlign: 'center' }}>Loading...</td></tr>}
              {!loading && tips.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No active records found.
                  </td>
                </tr>
              )}
              {!loading && tips.map(tip => (
                <tr key={tip.tipId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>{tip.tipId}</td>
                  <td style={{ padding: '12px 20px' }}>{formatTS(tip.createdAt)}</td>
                  <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>{tip.fanUid.slice(0, 8)}...</td>
                  <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>{tip.creatorId.slice(0, 8)}...</td>
                  <td style={{ padding: '12px 20px', fontWeight: 600 }}>{centsToDollars(tip.amountCents)}</td>
                  <td style={{ padding: '12px 20px' }}>{centsToDollars(tip.platformFeeCents)}</td>
                  <td style={{ padding: '12px 20px' }}>{centsToDollars(tip.netAmountCents)}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                      background: tip.status === 'succeeded' || tip.status === 'completed' ? 'rgba(16,185,129,0.1)' : tip.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      color: tip.status === 'succeeded' || tip.status === 'completed' ? '#10B981' : tip.status === 'failed' ? '#EF4444' : '#F59E0B'
                    }}>
                      {tip.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>{tip.stripePaymentIntentId || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
