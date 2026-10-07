'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAdminTips, centsToDollars, formatTS, callApproveRefund } from '@/lib/admin/adminFirestore';

export default function RefundsPage() {
  const { tips: allTips, loading, error } = useAdminTips();
  const tips = allTips.filter(t => t.status === 'refunded');
  const totalCents = tips.reduce((acc, t) => acc + t.amountCents, 0);

  const [isRefunding, setIsRefunding] = useState(false);

  const handleIssueRefund = async () => {
    const tipId = window.prompt('Enter the Tip ID to refund:');
    if (!tipId) return;
    const reason = window.prompt('Enter reason for refund:');
    if (!reason) return;

    setIsRefunding(true);
    try {
      await callApproveRefund(tipId, reason);
      alert('Refund issued successfully.');
      window.location.reload();
    } catch (e: any) {
      alert('Error issuing refund: ' + e.message);
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1300, margin: '0 auto', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
        <Link href="/admin/finance" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          Finance Control Plane
        </Link>
        <span>/</span>
        <span>Refunds</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>Refunds</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Refunded tips and chargebacks.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={handleIssueRefund} 
            disabled={isRefunding}
            style={{ padding: '8px 14px', background: '#EF4444', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: isRefunding ? 'not-allowed' : 'pointer', opacity: isRefunding ? 0.7 : 1 }}
          >
            {isRefunding ? 'Processing...' : 'Issue Refund'}
          </button>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 14px', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Refresh Live Data
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Total Refunded</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{centsToDollars(totalCents)}</div>
        </div>
        <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Record Count</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{tips.length}</div>
        </div>
      </div>

      {/* Data Table */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: 14 }}>
          Refund Records
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13, minWidth: '900px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Tip ID</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Fan UID</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Creator UID</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Refunded Amount</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Payment Intent</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center' }}>Loading...</td></tr>}
              {!loading && tips.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No refunded charges found.
                  </td>
                </tr>
              )}
              {!loading && tips.map(tip => (
                <tr key={tip.tipId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>{tip.tipId}</td>
                  <td style={{ padding: '12px 20px' }}>{formatTS(tip.createdAt)}</td>
                  <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>{tip.fanUid.slice(0, 8)}...</td>
                  <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>{tip.creatorId.slice(0, 8)}...</td>
                  <td style={{ padding: '12px 20px', fontWeight: 600, color: '#EF4444' }}>-{centsToDollars(tip.amountCents)}</td>
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
