/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

// Configure React act environment
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { CreatorCrowdRadar } from '../../components/creator/CreatorCrowdRadar';
import { TipAuthGateModal } from '../../components/discovery/TipAuthGateModal';
import { DiscoveryClient } from '../../lib/discovery/discoveryClient';
import type { PendingTipAction } from '@crowdbeats/contracts';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Phase 8: Web Creator Crowd Radar & Tip Gate (JSDOM)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  // 1. Role authorization guard
  test('1. Creator Crowd Radar denies unauthorized fan or inactive session', async () => {
    // Scenario A: Fan role
    await act(async () => {
      root.render(
        <CreatorCrowdRadar
          isLive={true}
          role="fan"
          sessionId="sess_123"
        />
      );
    });
    expect(container.textContent).toContain('Active Stage Session Required');

    // Scenario B: Artist but not live
    await act(async () => {
      root.render(
        <CreatorCrowdRadar
          isLive={false}
          role="artist"
          sessionId={null}
        />
      );
    });
    expect(container.textContent).toContain('Active Stage Session Required');
  });

  // 2. Authorized Solo/Band renders aggregate zones and privacy signals
  test('2. Authorized Solo/Band session renders aggregate zones with k >= 5 count bands', async () => {
    await act(async () => {
      root.render(
        <CreatorCrowdRadar
          isLive={true}
          role="artist"
          sessionId="sess_live_123"
          performerName="Jake Rios"
        />
      );
    });

    // Title and status
    expect(container.textContent).toContain('Audience Nearby / Crowd Radar');
    expect(container.textContent).toContain('Privacy-Safe Demand Signals');

    // Aggregate Zones & k >= 5 badge
    expect(container.textContent).toContain('Aggregate Crowd Zones');
    expect(container.textContent).toContain('Min 5 fans/zone');

    // Count bands (zero exact numbers)
    expect(container.textContent).toContain('[15+] supporters');
    expect(container.textContent).toContain('[5-14] supporters');
  });

  // 3. Browser Background Notice & Tipping Independence Guarantee
  test('3. Displays browser background limitation notice and tipping independence guarantee', async () => {
    await act(async () => {
      root.render(
        <CreatorCrowdRadar
          isLive={true}
          role="artist"
          sessionId="sess_live_123"
        />
      );
    });

    // Browser Background Notice
    expect(container.textContent).toContain('Web Browser Notice:');
    expect(container.textContent).toContain('Web browsers throttle background timers and network connections');

    // Tipping Independence Guarantee
    expect(container.textContent).toContain('Tipping Independence Guarantee:');
    expect(container.textContent).toContain("never automatically exposes a fan's location coordinates");
  });

  // 4. Opted-in supporters and Stage Shoutout broadcast
  test('4. Displays opted-in supporters and stage shoutout broadcast', async () => {
    await act(async () => {
      root.render(
        <CreatorCrowdRadar
          isLive={true}
          role="artist"
          sessionId="sess_live_123"
        />
      );
    });

    // Visible supporters with approximate distance bands
    expect(container.textContent).toContain('Sarah K.');
    expect(container.textContent).toContain('~50m away (Front Lawn)');
    expect(container.textContent).toContain('Send Stage Shoutout to Nearby Crowd');
  });

  // 5. Tip Auth Gate Modal preserves context and redirects unauthenticated guest
  test('5. TipAuthGateModal renders and DiscoveryClient preserves tip context across auth', async () => {
    await act(async () => {
      root.render(
        <TipAuthGateModal
          isOpen={true}
          onClose={() => {}}
          performerId="perf_123"
          performerSlug="jake-rios"
          performerName="Jake Rios"
          performerType="artist"
          initialAmountCents={2500}
        />
      );
    });

    expect(container.textContent).toContain('Sign in to tip Jake Rios');
    expect(container.textContent).toContain('Continue with Google');

    // Verify Pending Tip persistence via DiscoveryClient
    const action: PendingTipAction = {
      creatorId: 'perf_123',
      creatorSlug: 'jake-rios',
      creatorName: 'Jake Rios',
      creatorType: 'artist',
      selectedTipAmountCents: 2500,
      currency: 'USD',
      sourceScreen: 'web_discovery',
      timestamp: Date.now(),
    };

    DiscoveryClient.savePendingTip(action);
    const retrieved = DiscoveryClient.getPendingTip();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.creatorId).toBe('perf_123');
    expect(retrieved?.selectedTipAmountCents).toBe(2500);

    DiscoveryClient.clearPendingTip();
    expect(DiscoveryClient.getPendingTip()).toBeNull();
  });
});
