/**
 * Crowdbeats V2 — Web Discovery JSDOM Tests (Phase 3)
 */

import { DiscoveryClient } from '../../lib/discovery/discoveryClient';
import type { PendingTipAction } from '@crowdbeats/contracts';

describe('Web Tip Auth Gate Persistence (JSDOM)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('correctly saves, retrieves, and clears pending tip context', () => {
    const tipAction: PendingTipAction = {
      creatorId: 'art_jake_rios',
      creatorSlug: 'jake-rios',
      creatorName: 'Jake Rios',
      creatorType: 'artist',
      selectedTipAmountCents: 2000,
      currency: 'USD',
      sourceScreen: 'web_discovery',
      timestamp: Date.now(),
    };

    expect(DiscoveryClient.getPendingTip()).toBeNull();

    DiscoveryClient.savePendingTip(tipAction);
    const retrieved = DiscoveryClient.getPendingTip();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.creatorSlug).toBe('jake-rios');
    expect(retrieved?.selectedTipAmountCents).toBe(2000);
    expect(retrieved?.creatorName).toBe('Jake Rios');

    DiscoveryClient.clearPendingTip();
    expect(DiscoveryClient.getPendingTip()).toBeNull();
  });
});
