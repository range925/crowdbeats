'use client';

import React, { useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { markRecentAuthSuccess } from '@/lib/security/recentAuth';

interface RecentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
  actionDescription?: string;
}

export function RecentAuthModal({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Confirm Sensitive Action',
  actionDescription = 'For your security, please confirm your current password before continuing.',
}: RecentAuthModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;

      if (!user || !user.email) {
        throw new Error('No active user found. Please sign in again.');
      }

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      markRecentAuthSuccess();
      setPassword('');
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect password. Please try again.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
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
          position: 'relative',
        }}
      >
        {/* Shield Icon Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: 'rgba(124, 58, 237, 0.10)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7C3AED',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', margin: 0 }}>
              {actionTitle}
            </h3>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Identity Re-Verification Required
            </span>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', lineHeight: 1.5, margin: '0 0 18px' }}>
          {actionDescription}
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #1D1D1F)', marginBottom: 6 }}>
              Current Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
                autoFocus
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: 10,
                  padding: '12px 42px 12px 14px',
                  color: '#1D1D1F',
                  fontSize: 14,
                  minHeight: 44,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: 4,
                  fontSize: 12,
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
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
              type="submit"
              disabled={loading || !password}
              style={{
                padding: '10px 22px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                backgroundColor: '#7C3AED',
                color: '#FFFFFF',
                border: 'none',
                cursor: loading || !password ? 'not-allowed' : 'pointer',
                opacity: loading || !password ? 0.6 : 1,
                minHeight: 44,
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
