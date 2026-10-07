/**
 * Crowdbeats V2 — Sponsor Deals & Active Sponsorships (Phase 9)
 * Deal pipeline: Proposed, Negotiating, Active, Completed, Cancelled.
 */

'use client';

import React, { useState } from 'react';

export default function SponsorSponsorshipsPage() {
  const [deals, setDeals] = useState([
    {
      id: 'sp_1',
      title: 'West Coast Tour Headline Gear Endorsement',
      performerName: 'The Lunar Waves',
      performerType: 'band',
      valueAmountCents: 250000, // $2,500.00
      status: 'active',
      startsAt: '2026-08-15',
      endsAt: '2026-09-30',
    },
  ]);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Sponsorship Deals
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Manage active sponsorship contracts, milestones, and deliverable signoffs.
          </p>
        </div>

        <button
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
          + New Sponsorship Proposal
        </button>
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Sponsorship Campaign</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Performer</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Value</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Duration</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {d.title}
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                  {d.performerName} ({d.performerType})
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--accent-secondary)', fontWeight: 800 }}>
                  ${(d.valueAmountCents / 100).toFixed(2)}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--status-success)', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                    {d.status}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-tertiary)' }}>
                  {d.startsAt} → {d.endsAt}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <button style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                    View Contract ↗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
