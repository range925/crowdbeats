'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { SettingsToggle } from '@/components/settings/SettingsToggle';

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

export function PaymentsSection() {
  const { tipping, updateTipping } = useUserSettings();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const presetAmounts = tipping?.presetAmountsCents || [200, 500, 1000, 2000];

  return (
    <div>
      {toast && (
        <div style={{ position: 'sticky', top: 12, zIndex: 50, background: '#7C3AED', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 14, textAlign: 'center' }}>
          {toast}
        </div>
      )}

      {/* Fan Wallet Balance */}
      <div style={CARD}>
        <h3 style={TITLE}>Crowdbeats Tipping Wallet</h3>
        <p style={DESC}>Stored balance used for instant 1-Tap busker tips, stage boosts, and merch deposits.</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary, #FFFFFF)' }}>$0.00</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>USD Available</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => showToast('Wallet top-up opening Stripe checkout...')}
            style={{
              background: 'var(--accent-primary, #7C3AED)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            + Add Funds to Wallet
          </button>
          <Link
            href="/fan/receipts"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-primary, #FFFFFF)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 44,
            }}
          >
            View Tip Receipts
          </Link>
        </div>
      </div>

      {/* Quick-Tip Presets */}
      <div style={CARD}>
        <h3 style={TITLE}>Quick-Tip Presets</h3>
        <p style={DESC}>Default tip buttons shown when scanning a performer\'s QR code or tuning into a live set.</p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {presetAmounts.map((cents, idx) => (
            <div
              key={idx}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.3)',
                color: 'var(--accent-primary, #A78BFA)',
                fontWeight: 700,
                fontSize: 15,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              ${(cents / 100).toFixed(0)}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>1-Tap Instant Tipping</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)', marginTop: 2 }}>Skip checkout modal for tips under $20.</div>
          </div>
          <SettingsToggle
            checked={tipping.allowQuickOneTapTipping}
            onChange={(checked) => {
              updateTipping({ allowQuickOneTapTipping: checked });
              showToast('Tipping preferences updated ✓');
            }}
            label="Instant Tipping"
          />
        </div>
      </div>

      {/* Payment Methods */}
      <div style={CARD}>
        <h3 style={TITLE}>Saved Payment Methods</h3>
        <p style={DESC}>Credit cards, Apple Pay, and debit methods managed securely by Stripe.</p>
        <button
          type="button"
          onClick={() => showToast('Stripe card management coming in next update')}
          style={{
            background: 'transparent',
            color: 'var(--accent-primary, #A78BFA)',
            border: '1px dashed var(--border-subtle, #2B2D44)',
            borderRadius: 8,
            padding: '12px',
            width: '100%',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          + Add New Card via Stripe
        </button>
      </div>
    </div>
  );
}
