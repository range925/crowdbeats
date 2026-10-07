'use client';
import React from 'react';
import Link from 'next/link';
import { useAdminTips, centsToDollars, formatTS, callApproveRefund, usePlatformMetrics } from '@/lib/admin/adminFirestore';

export default function DisputesPage() {
  const { tips, loading, error } = useAdminTips();

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1300, margin: '0 auto', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
        <Link href="/admin/finance" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          Finance Control Plane
        </Link>
        <span>/</span>
        <span>Disputes</span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>Disputes</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>View detailed disputes data in Stripe.</p>
      </div>

      <div style={{ background: '#F9FAFB', padding: 24, borderRadius: 12, border: '1px dashed #D1D5DB', marginBottom: 32, textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18, color: '#111827' }}>Coming Soon — Connect Stripe Dashboard</h2>
        <p style={{ margin: '0 0 16px', color: '#4B5563', fontSize: 14 }}>Full native management for disputes is being built. For now, manage this directly in Stripe.</p>
        <a href="https://dashboard.stripe.com/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 20px', background: '#635BFF', color: 'white', textDecoration: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
          Open Stripe Dashboard ↗
        </a>
      </div>

      {loading && <div>Loading tips data...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      
      {!loading && !error && (
        <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: 14 }}>
            Recent Tips Data
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Tip ID</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Fan UID</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tips.slice(0, 5).map(tip => (
                <tr key={tip.tipId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 20px' }}>{tip.tipId}</td>
                  <td style={{ padding: '12px 20px' }}>{tip.fanUid}</td>
                  <td style={{ padding: '12px 20px' }}>{centsToDollars(tip.amountCents)}</td>
                  <td style={{ padding: '12px 20px' }}>{tip.status}</td>
                </tr>
              ))}
              {tips.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No tips found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
