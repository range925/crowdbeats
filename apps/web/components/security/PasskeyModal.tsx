'use client';

import React, { useState } from 'react';
import { registerPasskey } from '@/lib/security/passkeys';

interface PasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userDisplayName?: string | null;
  userEmail?: string | null;
}

export function PasskeyModal({
  isOpen,
  onClose,
  onSuccess,
  userDisplayName,
  userEmail,
}: PasskeyModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreatePasskey = async () => {
    setLoading(true);
    setError(null);

    try {
      const passkey = await registerPasskey(userDisplayName || 'User', userEmail || 'member@crowdbeats.com');
      if (passkey) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Passkey creation failed.');
    } finally {
      setLoading(false);
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
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: 'var(--surface-card, #FFFFFF)',
          border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.10))',
          borderRadius: 18,
          padding: 24,
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', margin: 0 }}>
              Create a Passkey
            </h3>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              FIDO2 / WebAuthn Standard
            </span>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', lineHeight: 1.5, margin: '0 0 16px' }}>
          Passkeys let you sign in to Crowdbeats using your fingerprint, face, or device PIN (Touch ID, Face ID, Windows Hello). They are phishing-resistant and cryptographically tied to this device.
        </p>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: 'rgba(239, 68, 68, 0.10)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#DC2626',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: '#F1F5F9',
              color: '#1D1D1F',
              border: '1px solid #CBD5E1',
              cursor: loading ? 'not-allowed' : 'pointer',
              minHeight: 44,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreatePasskey}
            disabled={loading}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              backgroundColor: '#059669',
              color: '#FFFFFF',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              minHeight: 44,
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
            }}
          >
            {loading ? 'Prompting Device...' : 'Continue with Biometrics / PIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
