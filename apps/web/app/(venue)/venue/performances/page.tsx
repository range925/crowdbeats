/**
 * Crowdbeats V2 — Venue Performance Logs (Phase 9)
 * Historical log of live sets and stage sessions hosted at this venue.
 */

import React from 'react';

export default function VenuePerformancesPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Venue Performance History
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Archived records of completed stage sets, performer check-in times, and session tip totals.
      </p>

      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Date & Time</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Stage</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Performer</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Duration</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Audience Tips</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No Performance Sessions Logged</div>
                <div style={{ fontSize: 12 }}>Completed sessions will automatically appear in this historical record.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
