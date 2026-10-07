/**
 * Crowdbeats V2 — Venue Live Stage Monitor (Phase 9)
 * Real-time monitoring of live stage sessions, active QR tokens, and tip stream.
 */

'use client';

import React, { useState } from 'react';

export default function VenueLivePage() {
  const [activeSession, setActiveSession] = useState<{
    id: string;
    stageName: string;
    performerName: string;
    startedAt: string;
    tipsCents: number;
    tipCount: number;
  } | null>(null);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Live Stage Session Monitor
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Real-time stage feeds, live QR rotation, and active audience tipping velocity.
      </p>

      {activeSession ? (
        <div style={{ background: 'var(--surface-card)', padding: 28, borderRadius: 16, border: '2px solid var(--status-success)', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--status-success)', animation: 'pulse 1.5s infinite' }} />
              <span style={{ color: 'var(--status-success)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>
                STAGE LIVE: {activeSession.stageName}
              </span>
            </div>
            <button
              onClick={() => setActiveSession(null)}
              style={{ background: 'var(--status-error)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
            >
              End Session
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                {activeSession.performerName}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                Started at {activeSession.startedAt}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-primary)' }}>
                ${(activeSession.tipsCents / 100).toFixed(2)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {activeSession.tipCount} tips received
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-card)', padding: 48, borderRadius: 14, border: '1px solid var(--border-subtle)', textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📡</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
            All Stages Are Currently Idle
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, maxWidth: 460, margin: '0 auto 20px' }}>
            No live performer is actively running a stage session. Start a session from the stage configuration page or mobile companion.
          </div>
          <button
            onClick={() =>
              setActiveSession({
                id: 'sess_demo',
                stageName: 'Main Stage',
                performerName: 'The Lunar Waves',
                startedAt: new Date().toLocaleTimeString(),
                tipsCents: 12500,
                tipCount: 8,
              })
            }
            style={{
              background: 'var(--accent-primary)',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Launch Test Stage Session
          </button>
        </div>
      )}
    </div>
  );
}
