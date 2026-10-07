/**
 * Crowdbeats V2 — Forgot Password (Phase 5)
 * Route: /auth/forgot-password
 *
 * Enumeration-resistant: always shows success message regardless of
 * whether the email exists.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { CbButton } from '@/components/ui/Button';
import { CbInput }  from '@/components/ui/Input';
import { CbBanner } from '@/components/ui/Components';
import { CrowdbeatsLogo }   from '@/components/ui/CbLogo';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await resetPassword(email); // never throws — enumeration-resistant
    setSent(true);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '24px 16px',
      background:     'var(--surface-base)',
    }}>
      <div style={{
        width:        '100%',
        maxWidth:     420,
        background:   'var(--surface-raised)',
        border:       '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding:      '36px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <Link
            href="/auth"
            style={{
              fontSize:       13,
              color:          'var(--text-tertiary)',
              textDecoration: 'none',
              display:        'inline-flex',
              alignItems:     'center',
              gap:            4,
            }}
          >
            ← Back to sign in
          </Link>
          <Link href="/" aria-label="Crowdbeats home">
            <CrowdbeatsLogo variant="emblem" height={28} surface="auto" ariaHidden />
          </Link>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          Reset your password
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.6 }}>
          Enter the email address associated with your account.
        </p>

        {sent ? (
          <CbBanner
            message="If this email is registered, you'll receive a reset link shortly. Check your spam folder if it doesn't arrive."
            status="success"
            onDismiss={() => {}}
          />
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <CbInput
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              fullWidth
              style={{ marginBottom: 20 }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                minHeight: 48,
                borderRadius: 9999,
                backgroundColor: '#000000',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'var(--cb-font-display)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D1D1F')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#000000')}
            >
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
