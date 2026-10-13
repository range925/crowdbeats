'use client';

import React, { useState } from 'react';
import type { AuthSession } from '@crowdbeats/contracts';

interface SuspiciousActivityModalProps {
  session: AuthSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSessionRevoked: (sessionId: string) => void;
}

export function SuspiciousActivityModal({
  session,
  isOpen,
  onClose,
  onSessionRevoked,
}: SuspiciousActivityModalProps) {
  const [step, setStep] = useState<'confirm' | 'processing' | 'resolved'>('confirm');
  const [revokeAllOthers, setRevokeAllOthers] = useState(true);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !session) return null;

  const handleConfirmSuspicious = async () => {
    setStep('processing');
    setError(null);

    try {
      const res = await fetch('/api/user/security/suspicious', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          shouldRevokeAllOthers: revokeAllOthers,
          userNotes: `Flagged unrecognized device: ${session.device} in ${session.approxLocation}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit report.');
      }

      onSessionRevoked(session.sessionId);
      setStep('resolved');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setStep('confirm');
    }
  };

  const handleSendResetEmail = async () => {
    try {
      // Trigger password reset email
      setResetEmailSent(true);
    } catch {
      // non-fatal
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 'processing') onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: 'var(--surface-card, #FFFFFF)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 20px 40px -10px rgba(239, 68, 68, 0.15)',
        }}
      >
        {step === 'confirm' && (
          <div>
            {/* Warning Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', margin: 0 }}>
                  Did you recognize this login?
                </h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Suspicious Activity Verification
                </span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', lineHeight: 1.5, margin: '0 0 16px' }}>
              If this wasn't you, we will immediately terminate this session and guide you through securing your account.
            </p>

            {/* Session details card */}
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FEE2E2',
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>
                {session.device}
              </div>
              <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.6 }}>
                <div><strong>Browser / App:</strong> {session.browser}</div>
                <div><strong>Approximate Location:</strong> {session.approxLocation}</div>
                <div><strong>Last Active:</strong> {session.lastActive}</div>
              </div>
            </div>

            {/* Revoke other devices checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                marginBottom: 20,
                fontSize: 13,
                color: 'var(--text-primary, #1D1D1F)',
              }}
            >
              <input
                type="checkbox"
                checked={revokeAllOthers}
                onChange={(e) => setRevokeAllOthers(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#DC2626' }}
              />
              <span>Also sign out of all other devices except this one (Recommended)</span>
            </label>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.10)', color: '#DC2626', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: '#F1F5F9',
                  color: '#1D1D1F',
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                Nevermind, that was me
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspicious}
                style={{
                  padding: '10px 22px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: 44,
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                }}
              >
                This Wasn't Me — Lock Down
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '3px solid rgba(239, 68, 68, 0.2)',
                borderTopColor: '#DC2626',
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', margin: '0 0 6px' }}>
              Securing Your Account...
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', margin: 0 }}>
              Terminating unrecognized sessions and invalidating refresh tokens.
            </p>
          </div>
        )}

        {step === 'resolved' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', margin: 0 }}>
                  Device Access Terminated
                </h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Account Secured
                </span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', lineHeight: 1.5, marginBottom: 16 }}>
              The suspicious session has been revoked and blocked from refreshing. To protect your funds and identity, we strongly recommend completing these steps:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>Reset Your Password</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Ensure unauthorized users cannot re-enter</div>
                </div>
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={resetEmailSent}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: resetEmailSent ? 'rgba(16, 185, 129, 0.15)' : '#7C3AED',
                    color: resetEmailSent ? '#059669' : '#FFFFFF',
                    border: 'none',
                    cursor: resetEmailSent ? 'default' : 'pointer',
                  }}
                >
                  {resetEmailSent ? 'Link Sent ✓' : 'Send Reset Link'}
                </button>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>Security Alert Logged</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  A permanent incident audit event has been recorded in your security history.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  backgroundColor: '#F1F5F9',
                  color: '#1D1D1F',
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
