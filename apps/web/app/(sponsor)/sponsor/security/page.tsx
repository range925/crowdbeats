'use client';

import React from 'react';
import { SecurityCenter } from '@/components/security/SecurityCenter';

export default function SponsorSecurityPage() {
  return (
    <div style={{ padding: '24px 32px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Sponsor Security & Treasury Protection
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Protect your brand identity, escrow authorization, and active team sessions
        </p>
      </div>

      <SecurityCenter />
    </div>
  );
}
