/**
 * Crowdbeats V2 — Band Treasury & Ledger (Phase 8)
 * Gross revenue, 6% platform fee deduction, and net split ledger.
 */

import React from 'react';

export default function BandRevenuePage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Band Treasury & Financial Ledger
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Double-entry accounting ledger of all incoming tips, 6% platform fees, and member credit allocations.
      </p>

      {/* Treasury Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Gross Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>$0.00</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>All tips & campaign pledges</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Platform Fees (6%)</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-tertiary)' }}>$0.00</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>600 bps standard take-rate</div>
        </div>

        <div style={{ background: 'var(--surface-card)', padding: 22, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Net Member Distributions</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-primary)' }}>$0.00</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Exact split allocated to members</div>
        </div>
      </div>

      {/* Ledger Table */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
          Recent Treasury Transactions
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Timestamp</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Entry Type</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Split Version</th>
              <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                No treasury transactions recorded yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
