'use client';

import React, { useState } from 'react';
import { ShieldBadgeIcon, UsersIcon } from './AdminIcons';

export interface AdminLiveSessionHealthItem {
  sessionId: string;
  performerId: string;
  performerName?: string;
  status: string;
  type: string;
  createdAt: string;
  endsAt?: string;
  leaseRemainingSeconds: number;
  isExpired: boolean;
  canForceEnd: boolean; // True only if caller holds elevated force-end privilege

  sampleCount: number;
  acceptedSampleCount: number;
  rejectedSampleCount: number;
  uploadCount: number;
  lastHeartbeatSeq: number;
  consecutiveCheckInRejections: number;
  audienceCountBand: string; // '< 5', '5-14', '15+'
  activeZonesCount: number;
  errorCounts: {
    telemetryErrors: number;
    rulesViolations: number;
    rateLimitEvents: number;
  };
}

interface LiveSessionHealthViewProps {
  sessions?: AdminLiveSessionHealthItem[];
  currentUserRole?: string;
  onForceEnd?: (sessionId: string, reason: string) => Promise<void>;
}

const DEFAULT_MOCK_SESSIONS: AdminLiveSessionHealthItem[] = [
  {
    sessionId: 'sess_station_01',
    performerId: 'perf_the_strokes',
    performerName: 'The Strokes',
    status: 'active',
    type: 'stationary',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    leaseRemainingSeconds: 1800,
    isExpired: false,
    canForceEnd: true,
    sampleCount: 120,
    acceptedSampleCount: 120,
    rejectedSampleCount: 0,
    uploadCount: 40,
    lastHeartbeatSeq: 40,
    consecutiveCheckInRejections: 0,
    audienceCountBand: '15+',
    activeZonesCount: 1,
    errorCounts: {
      telemetryErrors: 0,
      rulesViolations: 0,
      rateLimitEvents: 0,
    },
  },
  {
    sessionId: 'sess_mobile_02',
    performerId: 'perf_marching_brass',
    performerName: 'Brass Transit Band',
    status: 'active',
    type: 'mobile',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    leaseRemainingSeconds: 450,
    isExpired: false,
    canForceEnd: false, // Simulates support user without force-end privilege
    sampleCount: 480,
    acceptedSampleCount: 468,
    rejectedSampleCount: 12,
    uploadCount: 160,
    lastHeartbeatSeq: 160,
    consecutiveCheckInRejections: 1,
    audienceCountBand: '5-14',
    activeZonesCount: 2,
    errorCounts: {
      telemetryErrors: 2,
      rulesViolations: 0,
      rateLimitEvents: 1,
    },
  },
];

export function LiveSessionHealthView({
  sessions = DEFAULT_MOCK_SESSIONS,
  currentUserRole = 'CUSTOMER_SUPPORT',
  onForceEnd,
}: LiveSessionHealthViewProps) {
  const [selectedSessionForEnd, setSelectedSessionForEnd] = useState<AdminLiveSessionHealthItem | null>(null);
  const [forceEndReason, setForceEndReason] = useState<string>('policy_violation');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleConfirmForceEnd = async () => {
    if (!selectedSessionForEnd) return;
    setIsSubmitting(true);
    setActionMessage(null);

    try {
      if (onForceEnd) {
        await onForceEnd(selectedSessionForEnd.sessionId, forceEndReason);
      }
      setActionMessage({
        text: `Session ${selectedSessionForEnd.sessionId} force-ended successfully.`,
        isError: false,
      });
      setSelectedSessionForEnd(null);
    } catch (err: any) {
      setActionMessage({
        text: err.message || 'Failed to force-end session.',
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 20,
            borderRadius: 8,
            backgroundColor: actionMessage.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${actionMessage.isError ? '#ef4444' : '#10b981'}`,
            color: actionMessage.isError ? '#ef4444' : '#10b981',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Admin Privilege Context Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: '#1f1f23',
          border: '1px solid #27272a',
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldBadgeIcon size={20} style={{ color: 'var(--admin-accent-primary, #818cf8)' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5' }}>
              Admin Session Health Console — Strict Privacy Invariant
            </div>
            <div style={{ fontSize: 12, color: '#a1a1aa' }}>
              Zero raw Fan coordinates or routine audience identities are disclosed to platform operators.
            </div>
          </div>
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          Role: {currentUserRole}
        </div>
      </div>

      {/* Sessions Table / Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sessions.map((session) => (
          <div
            key={session.sessionId}
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#f4f4f5' }}>
                    {session.performerName || session.performerId}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      backgroundColor: session.type === 'stationary' ? 'rgba(3, 218, 198, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: session.type === 'stationary' ? '#03DAC6' : '#f59e0b',
                    }}
                  >
                    {session.type}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontWeight: 700,
                      backgroundColor: session.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: session.status === 'active' ? '#10b981' : '#ef4444',
                    }}
                  >
                    {session.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#71717a', marginTop: 4, fontFamily: 'monospace' }}>
                  ID: {session.sessionId} | Started: {new Date(session.createdAt).toLocaleTimeString()}
                </div>
              </div>

              {/* Force End Action Section */}
              <div>
                {session.canForceEnd ? (
                  <button
                    onClick={() => setSelectedSessionForEnd(session)}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Force End Session
                  </button>
                ) : (
                  <div
                    title="Elevated permission required (Super Admin, Trust & Safety, Executive). Read-only for general support."
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#27272a',
                      color: '#71717a',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'not-allowed',
                    }}
                  >
                    🔒 Read-Only (Support)
                  </div>
                )}
              </div>
            </div>

            {/* Health & Observability Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                background: '#121214',
                padding: 14,
                borderRadius: 8,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#a1a1aa' }}>Lease Remaining</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: session.leaseRemainingSeconds < 300 ? '#f59e0b' : '#f4f4f5' }}>
                  {Math.floor(session.leaseRemainingSeconds / 60)}m {session.leaseRemainingSeconds % 60}s
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#a1a1aa' }}>Upload Count</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f4f4f5' }}>
                  {session.uploadCount} ({session.lastHeartbeatSeq} seq)
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#a1a1aa' }}>Samples (Acc/Rej)</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f4f4f5' }}>
                  {session.acceptedSampleCount} / <span style={{ color: session.rejectedSampleCount > 0 ? '#f59e0b' : '#a1a1aa' }}>{session.rejectedSampleCount}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#a1a1aa' }}>Audience Count Band</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <UsersIcon size={14} style={{ color: '#818cf8' }} />
                  <span>{session.audienceCountBand}</span>
                  <span style={{ fontSize: 10, color: '#71717a' }}>(k-anonymized)</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#a1a1aa' }}>Check-in Errors</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: session.consecutiveCheckInRejections > 0 ? '#ef4444' : '#10b981' }}>
                  {session.consecutiveCheckInRejections} consecutive
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#a1a1aa' }}>Telemetry Violations</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: session.errorCounts.telemetryErrors > 0 ? '#ef4444' : '#10b981' }}>
                  {session.errorCounts.telemetryErrors} errors
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Elevated Force End Confirmation Modal */}
      {selectedSessionForEnd && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#18181b',
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              border: '1px solid #ef4444',
              color: '#f4f4f5',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ef4444', margin: '0 0 12px' }}>
              Confirm Elevated Force-End
            </h3>
            <p style={{ fontSize: 13, color: '#a1a1aa', margin: '0 0 16px', lineHeight: 1.5 }}>
              This will immediately revoke the lease for session <strong style={{ color: '#fff' }}>{selectedSessionForEnd.sessionId}</strong>,
              trigger terminal sensor cleanup on the performer device, and remove public map pins.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#d4d4d8' }}>
                Reason for Immediate Teardown (Mandatory Audit):
              </label>
              <select
                aria-label="Force End Reason"
                value={forceEndReason}
                onChange={(e) => setForceEndReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#27272a',
                  color: '#fff',
                  border: '1px solid #3f3f46',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <option value="policy_violation">Policy Violation / Fraudulent Location</option>
                <option value="safety_hazard">Physical Safety / Incident Escalation</option>
                <option value="technical_glitch">Runaway Battery Drain / Sensor Malfunction</option>
                <option value="user_reported">User Dispute / Account Compromise</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedSessionForEnd(null)}
                disabled={isSubmitting}
                style={{
                  padding: '8px 16px',
                  background: '#27272a',
                  color: '#d4d4d8',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmForceEnd}
                disabled={isSubmitting}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {isSubmitting ? 'Terminating...' : 'Force-End Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
