/**
 * Crowdbeats V2 — Fan Onboarding Page (Stitch Authority 5326179813018056505)
 * Route: /onboarding/fan
 */

'use client';

import React from 'react';
import { FanOnboardingWizard } from './FanOnboardingWizard';

export default function FanOnboardingPage() {
  return <FanOnboardingWizard />;
}

export function OnboardingFormShell({
  title,
  icon,
  subtitle,
  children,
}: {
  title: string;
  icon: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px 64px' }}>
      <div style={{ width: '100%', maxWidth: 448, background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }} aria-hidden="true">{icon}</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{title}</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
