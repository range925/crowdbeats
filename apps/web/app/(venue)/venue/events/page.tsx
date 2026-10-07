/**
 * Crowdbeats V2 — Venue Event Schedule (Phase 9)
 * Event calendar, scheduled nights, lineups, and door times.
 */

import React from 'react';

export default function VenueEventsPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Venue Event Schedule
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Scheduled gig nights, door times, and multi-act performance lineups.
          </p>
        </div>

        <button
          style={{
            background: 'var(--accent-primary)',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Schedule Event
        </button>
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
          No Upcoming Events Scheduled
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
          Add scheduled performances or festival stages to coordinate door staff and artist check-in.
        </div>
      </div>
    </div>
  );
}
