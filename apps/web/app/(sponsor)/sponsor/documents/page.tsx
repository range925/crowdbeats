/**
 * Crowdbeats V2 — Sponsor Contracts & Legal Documents (Phase 9)
 * Bilateral agreements, deliverable reviews, and brand safety policies.
 */

import React from 'react';

export default function SponsorDocumentsPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Contracts & Legal Documents
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Fully executed bilateral sponsorship agreements, deliverable sign-offs, and compliance documents.
      </p>

      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Agreement Title</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Recipient</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Executed Date</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Headline Endorsement Master Agreement
              </td>
              <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                The Lunar Waves (Band)
              </td>
              <td style={{ padding: '16px 20px', color: 'var(--text-tertiary)' }}>
                2026-08-15
              </td>
              <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                <span style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--status-success)', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                  Signed & Funded
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
