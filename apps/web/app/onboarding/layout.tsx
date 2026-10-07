/**
 * Crowdbeats V2 — Onboarding Layout (Phase 5)
 * Wraps all /onboarding/* pages with auth guard + progress indicator.
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

const STEPS = [
  { path: '/onboarding',         label: 'Agree to Terms' },
  { path: '/onboarding/persona', label: 'Choose Role' },
  { path: '/onboarding/',        label: 'Your Profile' }, // matches /onboarding/[persona]
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme } = useTheme();

  const stepIndex = pathname === '/onboarding'
    ? 0
    : pathname === '/onboarding/persona'
    ? 1
    : 2;

  return (
    <div style={{
      minHeight:    '100vh',
      background:   'var(--surface-base)',
      display:      'flex',
      flexDirection:'column',
    }}>
      {/* Top Branding Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--surface-raised)',
      }}>
        <Link href="/" aria-label="Crowdbeats home">
          <CrowdbeatsLogo variant="horizontal" height={28} surface={theme === 'light' ? 'light' : 'dark'} ariaHidden />
        </Link>
      </div>
      {/* Progress bar */}
      <div style={{
        height:     4,
        background: 'var(--border-subtle)',
        position:   'relative',
      }}>
        <div
          style={{
            position:   'absolute',
            left:       0,
            top:        0,
            height:     '100%',
            background: 'var(--accent-primary)',
            width:      `${((stepIndex + 1) / 3) * 100}%`,
            transition: 'width var(--duration-slow) var(--ease-spring)',
          }}
          role="progressbar"
          aria-valuenow={stepIndex + 1}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label={`Step ${stepIndex + 1} of 3`}
        />
      </div>

      {/* Step labels */}
      <div style={{
        display:       'flex',
        justifyContent:'center',
        gap:           0,
        borderBottom:  '1px solid var(--border-subtle)',
        background:    'var(--surface-raised)',
      }}>
        {STEPS.map((step, i) => (
          <div
            key={step.label}
            style={{
              padding:   '12px 20px',
              fontSize:  12,
              fontWeight:i === stepIndex ? 600 : 400,
              color:     i <= stepIndex ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              borderBottom: i === stepIndex ? '2px solid var(--accent-primary)' : '2px solid transparent',
              marginBottom: -1,
              userSelect:'none',
            }}
          >
            {i + 1}. {step.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {children}
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '20px 16px',
        fontSize: 12,
        color: 'var(--text-tertiary, #64748B)',
        borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
        background: 'var(--surface-raised, rgba(18, 20, 31, 0.6))',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '8px 16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/legal/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
            Terms of Service
          </a>
          <span style={{ color: '#475569' }}>•</span>
          <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
            Privacy Policy
          </a>
          <span style={{ color: '#475569' }}>•</span>
          <a href="/legal/dmca" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
            DMCA Policy
          </a>
          <span style={{ color: '#475569' }}>•</span>
          <a href="/legal/support" target="_blank" rel="noopener noreferrer" style={{ color: '#38BDF8', textDecoration: 'none' }}>
            Help & Support
          </a>
        </div>
        <div>Step {stepIndex + 1} of 3 — Crowdbeats LLC · All Rights Reserved</div>
      </footer>
    </div>
  );
}
