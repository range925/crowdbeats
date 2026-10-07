'use client';

import React from 'react';
import { SecurityCenter } from '@/components/security/SecurityCenter';

export default function FanSecurityPage() {
  return (
    <div style={{ padding: '24px 32px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Security & Account Protection
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Manage your credentials, 2FA settings, passkeys, and active device sessions
        </p>
      </div>

      <SecurityCenter />
    </div>
  );
}
