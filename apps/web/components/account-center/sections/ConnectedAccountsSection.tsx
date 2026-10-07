'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  marginBottom: 20,
  overflow: 'hidden',
};

const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  minHeight: 56,
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  gap: 16,
};

export function ConnectedAccountsSection() {
  const auth = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const isGoogleLinked = auth.user?.providerData?.some((p) => p.providerId.includes('google'));

  return (
    <div>
      {toast && (
        <div style={{ position: 'sticky', top: 12, zIndex: 50, background: '#7C3AED', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 14, textAlign: 'center' }}>
          {toast}
        </div>
      )}

      <div style={CARD}>
        {/* Spotify */}
        <div style={ROW}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 24 }}>🎵</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>Spotify</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Sync your top artists and stream previews directly in your EPK.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => showToast('Spotify OAuth integration launching...')}
            style={{
              background: '#1DB954',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Connect Spotify
          </button>
        </div>

        {/* Apple Music */}
        <div style={ROW}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 24 }}>🍎</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>Apple Music</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Share playlists and link Apple Music subscription listening.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => showToast('Apple Music integration coming soon')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Connect
          </button>
        </div>

        {/* Google Sign-in */}
        <div style={ROW}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 24 }}>🔍</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>Google Account</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Single sign-on authentication and backup recovery.</div>
            </div>
          </div>
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '6px 12px',
            borderRadius: 6,
            background: isGoogleLinked ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
            color: isGoogleLinked ? '#10B981' : 'var(--text-secondary, #94A3B8)',
          }}>
            {isGoogleLinked ? 'Connected ✓' : 'Not Linked'}
          </span>
        </div>

        {/* Instagram */}
        <div style={{ ...ROW, borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 24 }}>📸</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>Instagram</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Display verified Instagram badge on your artist bio.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => showToast('Instagram social link coming in next release')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
