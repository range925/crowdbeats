'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { SecuritySessionCard } from '@/components/settings/SecuritySessionCard';
import { SuspiciousActivityModal } from '@/components/security/SuspiciousActivityModal';
import { RecentAuthModal } from '@/components/security/RecentAuthModal';
import { useRecentAuth } from '@/lib/hooks/useRecentAuth';
import type { AuthSession } from '@crowdbeats/contracts';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 22,
  marginBottom: 20,
};

export function DevicesSessionsSection() {
  const auth = useAuth();
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [suspiciousTargetSession, setSuspiciousTargetSession] = useState<AuthSession | null>(null);

  const {
    isReauthModalOpen,
    reauthOptions,
    requireRecentAuth,
    handleReauthSuccess,
    closeReauthModal,
  } = useRecentAuth();

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/user/security');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [auth.uid]);

  const showFeedback = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleRevokeOne = async (sessionId: string) => {
    try {
      const res = await fetch('/api/user/security/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke_one', sessionId }),
      });
      if (res.ok) {
        showFeedback('Device session signed out.');
        fetchSessions();
      }
    } catch {
      // non-fatal
    }
  };

  const handleRevokeOthers = async () => {
    await requireRecentAuth(
      async () => {
        try {
          const res = await fetch('/api/user/security/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'revoke_others' }),
          });
          if (res.ok) {
            showFeedback('All other devices have been signed out.');
            fetchSessions();
          }
        } catch {
          // non-fatal
        }
      },
      {
        title: 'Sign Out All Other Devices',
        description: 'Verify your password to terminate sessions across all other hardware.',
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
        } catch {
          // non-fatal
        }
      },
      {
        title: 'Sign Out Everywhere',
        description: 'Please confirm your identity to terminate all active sessions.',
      }
    );
  };

  return (
    <div>
      {statusMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34D399',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          ✓ {statusMsg}
        </div>
      )}

      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
              Trusted Devices & Active Sessions
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
              Hardware authorized to access your Crowdbeats profile and creator tools ({auth.email ?? 'you'}).
            </p>
          </div>

          <button
            type="button"
            onClick={handleRevokeOthers}
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
            Sign Out Other Devices
          </button>
        </div>

        {/* Sessions list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {sessions.length > 0 ? (
            sessions.map((sess) => (
              <SecuritySessionCard
                key={sess.sessionId}
                device={sess.device}
                deviceType={sess.deviceType}
                browser={sess.browser}
                location={sess.approxLocation}
                lastActive={sess.lastActive ? 'Active now' : 'Recently'}
                isCurrentDevice={sess.isCurrentDevice}
                onRevoke={() => handleRevokeOne(sess.sessionId)}
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
              color: 'rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
            }}
          >
            Sign Out Everywhere (All Devices)
          </button>
        </div>
      </div>

      {/* Suspicious Activity Modal */}
      <SuspiciousActivityModal
        session={suspiciousTargetSession}
        isOpen={!!suspiciousTargetSession}
        onClose={() => setSuspiciousTargetSession(null)}
        onSessionRevoked={(id) => {
          showFeedback('Suspicious device terminated.');
          fetchSessions();
        }}
      />

      {/* Recent Auth Modal */}
      <RecentAuthModal
        isOpen={isReauthModalOpen}
        onClose={closeReauthModal}
        onSuccess={handleReauthSuccess}
        actionTitle={reauthOptions.title}
        actionDescription={reauthOptions.description}
      />
    </div>
  );
}
