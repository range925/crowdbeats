/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { LocationEnergyDiagnosticsModal } from '../../components/debug/LocationEnergyDiagnosticsModal';
import { LiveSessionHealthView, type AdminLiveSessionHealthItem } from '../../components/admin/LiveSessionHealthView';
import { webLocationEnergyTracker } from '../../lib/observability/webLocationEnergyTracker';
import { webRemoteConfig } from '../../lib/config/webRemoteConfig';

describe('Phase 11: Web Observability & Admin Session Health (JSDOM)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    webLocationEnergyTracker.reset();
    webRemoteConfig.reset();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test('1. LocationEnergyDiagnosticsModal renders KPIs and emergency kill switches', async () => {
    webLocationEnergyTracker.recordUpload(1024, 4);

    await act(async () => {
      root.render(
        <LocationEnergyDiagnosticsModal isOpen={true} onClose={() => {}} />
      );
    });

    expect(container.textContent).toContain('Location & Energy Observability');
    expect(container.textContent).toContain('Privacy Invariant: Zero Coordinates Leaked');
    expect(container.textContent).toContain('Remote Config & Emergency Kill Switches');
    expect(container.textContent).toContain('Mobile Location Tracking');
    expect(container.textContent).toContain('1024 B');
  });

  test('2. Invariant verification button triggers self-audit cleanly', async () => {
    await act(async () => {
      root.render(
        <LocationEnergyDiagnosticsModal isOpen={true} onClose={() => {}} />
      );
    });

    const verifyButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Verify All 4 Invariants')
    );
    expect(verifyButton).toBeDefined();

    await act(async () => {
      verifyButton?.click();
    });

    expect(container.textContent).toContain('All 4 terminal invariants verified. Zero coordinates leaked.');
  });

  test('3. LiveSessionHealthView renders active sessions and k-anonymized audience bands', async () => {
    const mockSessions: AdminLiveSessionHealthItem[] = [
      {
        sessionId: 'sess_123',
        performerId: 'perf_band_01',
        performerName: 'The Rolling Beats',
        status: 'active',
        type: 'stationary',
        createdAt: new Date().toISOString(),
        leaseRemainingSeconds: 900,
        isExpired: false,
        canForceEnd: true,
        sampleCount: 60,
        acceptedSampleCount: 60,
        rejectedSampleCount: 0,
        uploadCount: 20,
        lastHeartbeatSeq: 20,
        consecutiveCheckInRejections: 0,
        audienceCountBand: '15+',
        activeZonesCount: 1,
        errorCounts: {
          telemetryErrors: 0,
          rulesViolations: 0,
          rateLimitEvents: 0,
        },
      },
    ];

    await act(async () => {
      root.render(
        <LiveSessionHealthView
          sessions={mockSessions}
          currentUserRole="SUPER_ADMIN"
        />
      );
    });

    expect(container.textContent).toContain('The Rolling Beats');
    expect(container.textContent).toContain('sess_123');
    expect(container.textContent).toContain('15m 0s');
    expect(container.textContent).toContain('15+');
    expect(container.textContent).toContain('(k-anonymized)');
    expect(container.textContent).toContain('Zero raw Fan coordinates');
  });

  test('4. LiveSessionHealthView enforces role separation: support is read-only, elevated can force end', async () => {
    const onForceEndMock = jest.fn().mockResolvedValue(undefined);

    const mockSessions: AdminLiveSessionHealthItem[] = [
      {
        sessionId: 'sess_support_only',
        performerId: 'perf_solo_01',
        performerName: 'Solo Guitarist',
        status: 'active',
        type: 'mobile',
        createdAt: new Date().toISOString(),
        leaseRemainingSeconds: 600,
        isExpired: false,
        canForceEnd: false, // General support tier
        sampleCount: 100,
        acceptedSampleCount: 100,
        rejectedSampleCount: 0,
        uploadCount: 30,
        lastHeartbeatSeq: 30,
        consecutiveCheckInRejections: 0,
        audienceCountBand: '5-14',
        activeZonesCount: 1,
        errorCounts: {
          telemetryErrors: 0,
          rulesViolations: 0,
          rateLimitEvents: 0,
        },
      },
      {
        sessionId: 'sess_admin_permitted',
        performerId: 'perf_band_02',
        performerName: 'Electric Avenue',
        status: 'active',
        type: 'stationary',
        createdAt: new Date().toISOString(),
        leaseRemainingSeconds: 1200,
        isExpired: false,
        canForceEnd: true, // Elevated tier
        sampleCount: 200,
        acceptedSampleCount: 200,
        rejectedSampleCount: 0,
        uploadCount: 50,
        lastHeartbeatSeq: 50,
        consecutiveCheckInRejections: 0,
        audienceCountBand: '15+',
        activeZonesCount: 1,
        errorCounts: {
          telemetryErrors: 0,
          rulesViolations: 0,
          rateLimitEvents: 0,
        },
      },
    ];

    await act(async () => {
      root.render(
        <LiveSessionHealthView
          sessions={mockSessions}
          currentUserRole="CUSTOMER_SUPPORT"
          onForceEnd={onForceEndMock}
        />
      );
    });

    // Session 1: Read-Only
    expect(container.textContent).toContain('🔒 Read-Only (Support)');

    // Session 2: Has Force End Session button
    const forceEndButtons = Array.from(container.querySelectorAll('button')).filter(
      (b) => b.textContent?.includes('Force End Session')
    );
    expect(forceEndButtons.length).toBe(1);

    // Click Force End Session to open elevated confirmation modal
    await act(async () => {
      forceEndButtons[0].click();
    });

    expect(container.textContent).toContain('Confirm Elevated Force-End');
    expect(container.textContent).toContain('Reason for Immediate Teardown (Mandatory Audit):');

    // Confirm force-end
    const confirmButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Force-End Session'
    );
    await act(async () => {
      confirmButton?.click();
    });

    expect(onForceEndMock).toHaveBeenCalledWith('sess_admin_permitted', 'policy_violation');
    expect(container.textContent).toContain('Session sess_admin_permitted force-ended successfully.');
  });
});
