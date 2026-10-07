/**
 * Crowdbeats V2 — Sponsor Messages Portal (Phase 9)
 * Deal communications and negotiations.
 */

import React from 'react';

export default function SponsorMessagesPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Sponsor Messaging
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Direct communications with performers, booking managers, and festival organizers.
      </p>

      <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
          Sponsor Messaging Channels
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13, maxWidth: 440, margin: '0 auto' }}>
          Negotiation threads and deal proposals will populate here when you initiate a sponsorship offer.
        </div>
      </div>
    </div>
  );
}
