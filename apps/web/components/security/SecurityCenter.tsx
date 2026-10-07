'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { SecuritySessionCard } from '@/components/settings/SecuritySessionCard';
import { RecentAuthModal } from './RecentAuthModal';
import { useRecentAuth } from '@/lib/hooks/useRecentAuth';
import { ChangePasswordModal } from './ChangePasswordModal';
import { SuspiciousActivityModal } from './SuspiciousActivityModal';
import { PasskeyModal } from './PasskeyModal';
import { isPasskeySupported, getLocalPasskeys, removePasskeyFromStorage } from '@/lib/security/passkeys';
import { isBiometricUnlockEnabled, setBiometricUnlockEnabled, BIOMETRIC_SECURITY_DISCLAIMER } from '@/lib/security/biometrics';
import type { SecurityOverview, AuthSession } from '@crowdbeats/contracts';

const CARD: React.CSSProperties = {
  backgroundColor: 'var(--surface-card, #FFFFFF)',
  border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))',
  borderRadius: 16,
  padding: 22,
  marginBottom: 20,
};

const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 0',
  borderBottom: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.06))',
  gap: 16,
  flexWrap: 'wrap',
};

export function SecurityCenter() {
  const auth = useAuth();
  const [securityData, setSecurityData] = useState<SecurityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Modals state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [suspiciousTargetSession, setSuspiciousTargetSession] = useState<AuthSession | null>(null);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const [passkeysSupported, setPasskeysSupported] = useState(false);
  const [localPasskeys, setLocalPasskeys] = useState(getLocalPasskeys());

  // Local biometric toggle
  const [biometricsEnabled, setBiometricsEnabled] = useState(isBiometricUnlockEnabled());

  // Recent auth hook
  const {
    isReauthModalOpen,
    reauthOptions,
    requireRecentAuth,
    handleReauthSuccess,
    closeReauthModal,
  } = useRecentAuth();

  const fetchSecurity = async () => {
    try {
      const res = await fetch('/api/user/security');
      if (!res.ok) throw new Error('Failed to load security overview.');
      const data = await res.json();
      setSecurityData(data);
    } catch (err: any) {
      setError(err.message || 'Error connecting to security services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurity();
    isPasskeySupported().then(setPasskeysSupported);
  }, [auth.uid]);

  const showFeedback = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // 1. Password Reset Link
  const handleSendForgotPassword = async () => {
    if (!auth.email) return;
    try {
      await auth.resetPassword(auth.email);
      showFeedback('Password reset link sent to ' + auth.email);
    } catch {
      setError('Could not send reset link. Please try again.');
    }
  };

  // 2. 2FA Toggle (Enforced via Recent Auth)
  const handleToggle2FA = async () => {
    const targetState = !securityData?.twoFactorEnabled;

    await requireRecentAuth(
      async () => {
        try {
          const res = await fetch('/api/user/security', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ twoFactorEnabled: targetState }),
          });
          if (!res.ok) throw new Error('Failed to update 2FA.');
          showFeedback(targetState ? 'Two-factor protection enabled.' : 'Two-factor protection disabled.');
          fetchSecurity();
        } catch (err: any) {
          setError(err.message || 'Failed to update 2FA.');
        }
      },
      {
        title: targetState ? 'Enable Two-Factor Protection' : 'Disable Two-Factor Protection',
        description: 'Modifying multi-factor protection requires verifying your identity.',
      }
    );
  };

  // 3. Session Revocation
  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch('/api/user/security/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke_one', sessionId }),
      });
      if (!res.ok) throw new Error('Failed to revoke session.');
      showFeedback('Session terminated.');
      fetchSecurity();
    } catch (err: any) {
      setError(err.message || 'Failed to terminate session.');
    }
  };

  const handleRevokeOtherSessions = async () => {
    await requireRecentAuth(
      async () => {
        try {
          const res = await fetch('/api/user/security/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'revoke_others' }),
          });
          if (!res.ok) throw new Error('Failed to revoke sessions.');
          showFeedback('All other active sessions have been signed out.');
          fetchSecurity();
        } catch (err: any) {
          setError(err.message || 'Failed to revoke other sessions.');
        }
      },
      {
        title: 'Sign Out All Other Devices',
        description: 'Please re-verify your credentials to terminate sessions across all other hardware.',
      }
    );
  };

  const handleSignOutEverywhere = async () => {
    await requireRecentAuth(
      async () => {
        try {
          await fetch('/api/user/security/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'revoke_all' }),
          });
          await auth.logout();
          window.location.href = '/auth';
        } catch (err: any) {
          setError(err.message || 'Failed to sign out everywhere.');
        }
      },
      {
        title: 'Sign Out Everywhere',
        description: 'Confirm your password to terminate all active sessions and log out immediately.',
      }
    );
  };

  // 4. Biometric Toggle
  const handleToggleBiometrics = () => {
    const next = !biometricsEnabled;
    setBiometricsEnabled(next);
    setBiometricUnlockEnabled(next);
    showFeedback(next ? 'Biometric app unlock enabled for this device.' : 'Biometric unlock disabled.');
  };

  // 5. Passkey Removal
  const handleRemovePasskey = (id: string) => {
    removePasskeyFromStorage(id);
    setLocalPasskeys(getLocalPasskeys());
    showFeedback('Passkey removed from this device.');
  };

  const hasGoogle = securityData?.connectedProviders.includes('google.com');
  const hasApple = securityData?.connectedProviders.includes('apple.com');
  const hasPassword = securityData?.hasPassword ?? true;

  return (
    <div style={{ width: '100%' }}>
      {/* Toast Feedback */}
      {statusMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34D399',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>✓</span>
          <span>{statusMsg}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* 1. Sign-in Methods & Credentials */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', margin: 0 }}>Sign-In & Credentials</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', margin: 0 }}>
              Primary contact channels and authenticated login methods
            </p>
          </div>
        </div>

        {/* Email */}
        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #1D1D1F)' }}>Primary Email</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 2 }}>
              Used for sign-in, tip payouts, and security notices
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-primary, #1D1D1F)', fontFamily: 'monospace' }}>
              {auth.email || 'None'}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 12,
                backgroundColor: auth.email ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: auth.email ? '#10B981' : '#F59E0B',
                border: auth.email ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              {auth.email ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>

        {/* Phone */}
        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #1D1D1F)' }}>Phone Number</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 2 }}>
              Required for high-value payout SMS authentication
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)' }}>
            {securityData?.phone || 'Not Linked (Optional)'}
          </span>
        </div>

        {/* Password */}
        <div style={ROW}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #1D1D1F)' }}>Password</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 2 }}>
              {securityData?.passwordLastChanged
                ? `Last updated on ${new Date(securityData.passwordLastChanged).toLocaleDateString()}`
                : 'Secured via standard password authentication'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                color: '#C084FC',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                cursor: 'pointer',
              }}
            >
              Change Password
            </button>
            <button
              type="button"
              onClick={handleSendForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #6E6E73)',
                fontSize: 12,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* Connected Authentication Providers */}
        <div style={{ ...ROW, borderBottom: 'none' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #1D1D1F)' }}>Connected Authentication Providers</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 2 }}>
              Sign in with 1-tap using linked federated identity services
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: hasGoogle ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: hasGoogle ? '#10B981' : 'rgba(255, 255, 255, 0.4)',
                border: hasGoogle ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              Google {hasGoogle ? '✓ Linked' : ''}
            </span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: hasApple ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: hasApple ? '#10B981' : 'rgba(255, 255, 255, 0.4)',
                border: hasApple ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              Apple {hasApple ? '✓ Linked' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Two-Factor Authentication, Passkeys & Biometrics */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', margin: 0 }}>Advanced Protection & Biometrics</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', margin: 0 }}>
              Hardware security keys, biometric locks, and multi-factor validation
            </p>
          </div>
        </div>

        {/* 2FA Toggle */}
        <div style={ROW}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #1D1D1F)' }}>Two-Factor Authentication (2FA)</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 2 }}>
              Requires a verification code or authenticator check when logging in from new devices
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggle2FA}
            style={{
              padding: '8px 18px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              backgroundColor: securityData?.twoFactorEnabled ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
              color: securityData?.twoFactorEnabled ? '#000000' : 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              cursor: 'pointer',
              minHeight: 36,
            }}
          >
            {securityData?.twoFactorEnabled ? 'Enabled ✓' : 'Turn On 2FA'}
          </button>
        </div>

        {/* Passkeys */}
        <div style={ROW}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #1D1D1F)' }}>Passkeys (FIDO2 / WebAuthn)</span>
              {passkeysSupported && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' }}>
                  Supported on this device
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 2 }}>
              Sign in instantly with Touch ID, Face ID, or Windows Hello without typing passwords
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPasskeyModalOpen(true)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#34D399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
              minHeight: 36,
            }}
          >
            + Add Passkey
          </button>
        </div>

        {/* Passkeys List */}
        {localPasskeys.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '8px 0 16px', paddingLeft: 12 }}>
            {localPasskeys.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--text-primary, #1D1D1F)' }}>🔑 {p.name}</div>
                <button
                  type="button"
                  onClick={() => handleRemovePasskey(p.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(239, 68, 68, 0.8)',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mobile / Local Biometric App Unlock */}
        <div style={{ ...ROW, borderBottom: 'none' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #1D1D1F)' }}>
              Device Biometric App Unlock (Face ID / Touch ID)
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 2 }}>
              Requires fingerprint or face scan to unlock the Crowdbeats application on this device
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary, #6E6E73)', marginTop: 6, fontStyle: 'italic', maxWidth: 480 }}>
              ℹ️ {BIOMETRIC_SECURITY_DISCLAIMER}
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleBiometrics}
            style={{
              padding: '8px 18px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              backgroundColor: biometricsEnabled ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
              color: biometricsEnabled ? '#000000' : 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              cursor: 'pointer',
              minHeight: 36,
            }}
          >
            {biometricsEnabled ? 'Active ✓' : 'Enable'}
          </button>
        </div>
      </div>

      {/* 3. Trusted Devices & Active Sessions */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', margin: 0 }}>Active Devices & Sessions</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', margin: 0 }}>
                Manage hardware authorized to access your Crowdbeats creator wallet and feed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRevokeOtherSessions}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#F87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              cursor: 'pointer',
              minHeight: 36,
            }}
          >
            Sign Out All Other Devices
          </button>
        </div>

        {/* Sessions list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {securityData?.sessions && securityData.sessions.length > 0 ? (
            securityData.sessions.map((sess) => (
              <SecuritySessionCard
                key={sess.sessionId}
                device={sess.device}
                deviceType={sess.deviceType}
                browser={sess.browser}
                location={sess.approxLocation}
                lastActive={sess.lastActive ? 'Active now' : 'Recently'}
                isCurrentDevice={sess.isCurrentDevice}
                onRevoke={() => handleRevokeSession(sess.sessionId)}
                onFlagSuspicious={() => setSuspiciousTargetSession(sess)}
              />
            ))
          ) : (
            <SecuritySessionCard
              device="Current Web Browser"
              deviceType="desktop"
              browser="Web Browser"
              location="Austin, TX, United States"
              lastActive="Active now"
              isCurrentDevice={true}
            />
          )}
        </div>

        {/* Global sign out action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 16 }}>
          <button
            type="button"
            onClick={handleSignOutEverywhere}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: 'transparent',
              color: 'var(--text-secondary, #6E6E73)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
            }}
          >
            Sign Out of All Devices (Everywhere)
          </button>
        </div>
      </div>

      {/* 4. Security Alerts & Activity Timeline */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C084FC',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #1D1D1F)', margin: 0 }}>Security Activity & Alerts</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', margin: 0 }}>
              Recent sign-ins, credential modifications, and security incident audits
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {securityData?.recentAlerts && securityData.recentAlerts.length > 0 ? (
            securityData.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #1D1D1F)' }}>{alert.title}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 6,
                        backgroundColor:
                          alert.severity === 'critical'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : alert.severity === 'warning'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                        color:
                          alert.severity === 'critical'
                            ? '#EF4444'
                            : alert.severity === 'warning'
                            ? '#F59E0B'
                            : '#60A5FA',
                        textTransform: 'uppercase',
                      }}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary, #6E6E73)', marginTop: 3 }}>
                    {alert.description}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary, #6E6E73)', whiteSpace: 'nowrap' }}>
                  {new Date(alert.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-secondary, #6E6E73)', padding: '12px 0' }}>
              No critical security alerts. Your account status is normal.
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Step-Up Recent Authentication Modal */}
      <RecentAuthModal
        isOpen={isReauthModalOpen}
        onClose={closeReauthModal}
        onSuccess={handleReauthSuccess}
        actionTitle={reauthOptions.title}
        actionDescription={reauthOptions.description}
      />

      {/* 2. Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccess={() => {
          showFeedback('Password changed successfully.');
          fetchSecurity();
        }}
      />

      {/* 3. Suspicious Activity ("This wasn't me") Remediation Modal */}
      <SuspiciousActivityModal
        session={suspiciousTargetSession}
        isOpen={!!suspiciousTargetSession}
        onClose={() => setSuspiciousTargetSession(null)}
        onSessionRevoked={(revokedId) => {
          showFeedback('Suspicious device revoked.');
          fetchSecurity();
        }}
      />

      {/* 4. Passkey Registration Modal */}
      <PasskeyModal
        isOpen={isPasskeyModalOpen}
        onClose={() => setIsPasskeyModalOpen(false)}
        onSuccess={() => {
          showFeedback('Passkey created successfully.');
          setLocalPasskeys(getLocalPasskeys());
          fetchSecurity();
        }}
        userDisplayName={auth.displayName}
        userEmail={auth.email}
      />
    </div>
  );
}
