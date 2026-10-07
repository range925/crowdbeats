/**
 * Crowdbeats V2 — Campaign Contributions Ledger (Phase 7)
 * Table of backer pledges across all campaigns.
 */

import React from 'react';

export default function CreatorContributionsPage() {
  return (
    <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
        Contributions & Backers
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        All backer pledges held in Campaign Budget or captured for your active and completed campaigns.
      </p>

      <div style={{ background: 'var(--surface-card)', borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-raised)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Backer</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Campaign</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Reward Tier</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Amount</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                No contributions received yet.<br />
                <span style={{ fontSize: 12, marginTop: 4, display: 'inline-block' }}>
                  Create and launch an active campaign to start receiving fan pledges!
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
