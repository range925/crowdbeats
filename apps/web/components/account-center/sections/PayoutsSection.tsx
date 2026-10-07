'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
};

const TITLE: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--text-primary, #FFFFFF)',
  margin: '0 0 6px',
};

const DESC: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary, #94A3B8)',
  lineHeight: 1.5,
  marginBottom: 14,
};

export function PayoutsSection() {
  const auth = useAuth();
  const [connecting, setConnecting] = useState(false);

  const isEligible = auth.personaType === 'artist' || auth.personaType === 'band_member' || auth.personaType === 'venue_manager';

  if (!isEligible) {
    return (
      <div style={CARD}>
        <h3 style={TITLE}>Creator Payouts</h3>
        <p style={{ ...DESC, marginBottom: 0 }}>
          Payout distribution and Stripe Connect express accounts are only available to verified <strong>Artists</strong>, <strong>Band Members</strong>, and <strong>Venues</strong>. Fans and sponsors do not receive direct payouts.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stripe Connect */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h3 style={TITLE}>Stripe Connect Express</h3>
            <p style={{ ...DESC, marginBottom: 0 }}>Direct deposit payouts for stage tips, sponsor matches, and band splits.</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
            Action Required
          </span>
        </div>

        <div style={{ padding: 14, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)' }}>
            No bank account linked. Link your banking details via Stripe Connect to receive daily or weekly direct deposits.
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setConnecting(true);
            setTimeout(() => {
              setConnecting(false);
              alert('Redirecting to Stripe Connect onboarding...');
            }, 800);
          }}
          disabled={connecting}
          style={{
            background: 'var(--accent-primary, #7C3AED)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: connecting ? 'wait' : 'pointer',
            minHeight: 44,
          }}
        >
          {connecting ? 'Opening Stripe...' : 'Link Bank Account with Stripe'}
        </button>
      </div>

      {/* Payout Schedule */}
      <div style={CARD}>
        <h3 style={TITLE}>Payout Frequency</h3>
        <p style={DESC}>Choose how frequently your tips and sponsor escrow funds are transferred to your bank.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['Instant (1.5% fee)', 'Daily (Free)', 'Weekly on Mondays'].map((freq, idx) => (
            <div
              key={freq}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: idx === 1 ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                border: idx === 1 ? '1px solid #7C3AED' : '1px solid rgba(255,255,255,0.08)',
                color: idx === 1 ? '#FFFFFF' : 'var(--text-secondary, #94A3B8)',
                fontSize: 13,
                fontWeight: 600,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {freq}
            </div>
          ))}
        </div>
      </div>

      {/* Persona Payout Dashboard Shortcut */}
      <div style={{ ...CARD, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ ...TITLE, margin: 0 }}>Detailed Payout Ledger</h3>
          <p style={{ ...DESC, margin: '4px 0 0' }}>Inspect gross performer earnings, stage fees, and IRS 1099 tax summaries.</p>
        </div>
        <Link
          href={auth.personaType === 'venue_manager' ? '/venue/settings' : auth.personaType === 'band_member' ? '/band/settings' : '/creator/dashboard'}
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Open Studio Dashboard →
        </Link>
      </div>
    </div>
  );
}
