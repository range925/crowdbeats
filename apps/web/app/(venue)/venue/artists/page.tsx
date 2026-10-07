/**
 * Crowdbeats V2 — Venue Artist Roster (Phase 9)
 * Directory of performing musicians and bands hosted at the venue.
 */

import React from 'react';

export default function VenueArtistsPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Performer Directory & Booking History
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Roster of solo musicians, bands, and touring acts that have performed on your stages.
      </p>

      <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎸</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
          No Performers on Record
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
          Performers who check in to your venue stages will automatically be added to your venue roster.
        </div>
      </div>
    </div>
  );
}
