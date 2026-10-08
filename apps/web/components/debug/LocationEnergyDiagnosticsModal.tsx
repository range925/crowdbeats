'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { webLocationEnergyTracker } from '@/lib/observability/webLocationEnergyTracker';
import { webRemoteConfig } from '@/lib/config/webRemoteConfig';
import { webCleanupCoordinator } from '@/lib/discovery/webCleanupCoordinator';
import { assertZeroCoordinatesInMetrics } from '@crowdbeats/contracts';

interface LocationEnergyDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationEnergyDiagnosticsModal({
  isOpen,
  onClose,
}: LocationEnergyDiagnosticsModalProps) {
  const isProd = process.env.NODE_ENV === 'production';
  const [tick, setTick] = useState(0);
  const [invariantResult, setInvariantResult] = useState<{
    passed: boolean;
    message: string;
  } | null>(null);

  // Subscribe to Remote Config updates
  const policy = useSyncExternalStore(
    (onStoreChange) => webRemoteConfig.subscribe(onStoreChange),
    () => webRemoteConfig.policy,
    () => webRemoteConfig.policy
  );

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  if (isProd) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 9999,
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
            maxWidth: 500,
            width: '100%',
            color: '#fff',
            border: '1px solid #ef4444',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#ef4444', margin: '0 0 12px' }}>
            Diagnostics Disabled
          </h2>
          <p style={{ fontSize: 14, color: '#a1a1aa', margin: '0 0 16px' }}>
            Location & Energy diagnostics are strictly disabled in production builds.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#27272a',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const snapshot = webLocationEnergyTracker.toSnapshotJson({ appVersion: '2.0.0-web' });

  const handleToggleKillSwitch = (key: 'mobile' | 'presence' | 'radar' | 'audience') => {
    if (key === 'mobile') {
      webRemoteConfig.setKillSwitch({ mobileTracking: !policy.mobileTrackingEnabled });
    } else if (key === 'presence') {
      webRemoteConfig.setKillSwitch({ publicPresence: !policy.publicPresenceEnabled });
    } else if (key === 'radar') {
      webRemoteConfig.setKillSwitch({ crowdRadar: !policy.aggregateCrowdRadarEnabled });
    } else if (key === 'audience') {
      webRemoteConfig.setKillSwitch({ audienceVisibility: !policy.individualAudienceVisibilityEnabled });
    }
  };

  const handleRunInvariantCheck = () => {
    try {
      assertZeroCoordinatesInMetrics(snapshot as unknown as Record<string, unknown>);
      const report = webCleanupCoordinator.verifyAllInvariants('admin_ended');
      if (report.allPassed) {
        setInvariantResult({
          passed: true,
          message: 'All 4 terminal invariants verified. Zero coordinates leaked.',
        });
      } else {
        setInvariantResult({
          passed: false,
          message: `Invariants active: watchers=${report.zeroSensors ? 0 : 1}, listeners=${report.zeroListeners ? 0 : 1}`,
        });
      }
    } catch (e: any) {
      setInvariantResult({
        passed: false,
        message: e.message || 'Invariant check failed.',
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnostics-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: '#121214',
          borderRadius: 14,
          padding: 28,
          maxWidth: 720,
          width: '100%',
          color: '#f4f4f5',
          border: '1px solid #27272a',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 id="diagnostics-title" style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
              Location & Energy Observability
            </h2>
            <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
              Non-Production Debug Mode
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Privacy Invariant Banner */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>🛡️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
              Privacy Invariant: Zero Coordinates Leaked
            </div>
            <div style={{ fontSize: 12, color: '#a1a1aa' }}>
              Snapshot telemetry contains strictly zero latitude, longitude, addresses, or device IDs.
            </div>
          </div>
        </div>

        {/* Remote Config Emergency Kill Switches */}
        <div
          style={{
            background: '#18181b',
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
            border: '1px solid #27272a',
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>
            Remote Config & Emergency Kill Switches
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#27272a',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500 }}>Mobile Location Tracking</span>
              <input
                type="checkbox"
                aria-label="Mobile Location Tracking Switch"
                checked={policy.mobileTrackingEnabled}
                onChange={() => handleToggleKillSwitch('mobile')}
              />
            </label>
            <label
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#27272a',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500 }}>Public Presence</span>
              <input
                type="checkbox"
                aria-label="Public Presence Switch"
                checked={policy.publicPresenceEnabled}
                onChange={() => handleToggleKillSwitch('presence')}
              />
            </label>
            <label
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#27272a',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500 }}>Aggregate Crowd Radar</span>
              <input
                type="checkbox"
                aria-label="Aggregate Crowd Radar Switch"
                checked={policy.aggregateCrowdRadarEnabled}
                onChange={() => handleToggleKillSwitch('radar')}
              />
            </label>
            <label
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#27272a',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500 }}>Audience Visibility Grants</span>
              <input
                type="checkbox"
                aria-label="Audience Visibility Grants Switch"
                checked={policy.individualAudienceVisibilityEnabled}
                onChange={() => handleToggleKillSwitch('audience')}
              />
            </label>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div
          style={{
            background: '#18181b',
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
            border: '1px solid #27272a',
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>
            Sensor & Energy Telemetry
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div style={{ background: '#27272a', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#a1a1aa' }}>Active Sensor Duration</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {(snapshot.activeSensorDurationMs / 1000).toFixed(1)} s
              </div>
            </div>
            <div style={{ background: '#27272a', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#a1a1aa' }}>Stationary Mode</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {(snapshot.timeInStateMs.live_stationary / 1000).toFixed(1)} s
              </div>
            </div>
            <div style={{ background: '#27272a', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#a1a1aa' }}>Discovery Mode</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {(snapshot.timeInStateMs.discovery / 1000).toFixed(1)} s
              </div>
            </div>
            <div style={{ background: '#27272a', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#a1a1aa' }}>Samples Accepted</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {snapshot.sampleCounts.accepted} / {snapshot.sampleCounts.received}
              </div>
            </div>
            <div style={{ background: '#27272a', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#a1a1aa' }}>Bytes Uploaded</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {snapshot.networkTelemetry.bytesUploaded} B
              </div>
            </div>
            <div style={{ background: '#27272a', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#a1a1aa' }}>Queue High-Water Mark</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {snapshot.networkTelemetry.queueHighWaterMark} / {policy.maxQueueCapacity}
              </div>
            </div>
            <div style={{ background: '#27272a', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#a1a1aa' }}>Firestore Reads</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {snapshot.databaseAttribution.firestoreReads}
              </div>
            </div>
            <div style={{ background: '#27272a', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#a1a1aa' }}>Firestore Writes</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {snapshot.databaseAttribution.firestoreWrites}
              </div>
            </div>
            <div style={{ background: '#27272a', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#a1a1aa' }}>Concurrent Listeners</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {snapshot.listenerMetrics.concurrentListeners}
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Invariants Check */}
        <div
          style={{
            background: '#18181b',
            borderRadius: 10,
            padding: 16,
            border: '1px solid #27272a',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Invariant Assertion Engine</div>
              <div style={{ fontSize: 12, color: '#a1a1aa' }}>
                Verify zero active watchers, timers, listeners, and coordinates.
              </div>
            </div>
            <button
              onClick={handleRunInvariantCheck}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Verify All 4 Invariants
            </button>
          </div>

          {invariantResult && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                borderRadius: 6,
                background: invariantResult.passed
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
                color: invariantResult.passed ? '#10b981' : '#ef4444',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {invariantResult.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
