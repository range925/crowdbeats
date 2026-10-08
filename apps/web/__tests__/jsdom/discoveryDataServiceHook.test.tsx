/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useNearbyDiscovery } from '../../lib/discovery/discoveryDataService';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock firebase/firestore
const mockOnSnapshot = jest.fn();

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    collection: jest.fn(() => 'mock-collection'),
    query: jest.fn((...args) => ({ _queryArgs: args })),
    where: jest.fn((field, op, val) => ({ field, op, val })),
    limit: jest.fn((n) => ({ limit: n })),
    getDocs: jest.fn().mockResolvedValue({ empty: true, forEach: () => {} }),
    onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  };
});

jest.mock('../../lib/firebase/firestore', () => {
  const actual = jest.requireActual('../../lib/firebase/firestore');
  return {
    ...actual,
    getFirebaseFirestore: jest.fn(() => ({})),
  };
});

function TestDiscoveryConsumer({
  center,
  radiusMiles,
  onState,
}: {
  center: { lat: number; lng: number; label: string };
  radiusMiles: number;
  onState: (state: any) => void;
}) {
  const discovery = useNearbyDiscovery(center, radiusMiles);
  React.useEffect(() => {
    onState(discovery);
  }, [discovery, onState]);

  return <div data-testid="consumer">{discovery.nearestPerformers.length} performers</div>;
}

describe('useNearbyDiscovery Hook (JSDOM)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
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

  test('initializes with fallback performers when no active checkins are present and never marks them live', async () => {
    let latestState: any = null;
    let snapshotCallback: any;

    mockOnSnapshot.mockImplementation((q, onNext) => {
      snapshotCallback = onNext;
      return () => {};
    });

    await act(async () => {
      root.render(
        <TestDiscoveryConsumer
          center={{ lat: 32.7157, lng: -117.1611, label: 'San Diego, CA' }}
          radiusMiles={25}
          onState={(state) => {
            latestState = state;
          }}
        />
      );
    });

    expect(latestState).not.toBeNull();
    expect(latestState.nearestPerformers.length).toBe(5);
    expect(latestState.isFallback).toBe(true);
    expect(latestState.nearestPerformers.every((p: any) => p.isLive === false)).toBe(true);
    expect(latestState.popularMusicians.length).toBeGreaterThanOrEqual(1);
    expect(latestState.topCampaigns.length).toBeGreaterThanOrEqual(1);
  });

  test('switches to live performers when snapshot receives genuine active check-in', async () => {
    let latestState: any = null;
    let snapshotCallback: any;

    mockOnSnapshot.mockImplementation((q, onNext) => {
      snapshotCallback = onNext;
      return () => {};
    });

    await act(async () => {
      root.render(
        <TestDiscoveryConsumer
          center={{ lat: 32.7157, lng: -117.1611, label: 'San Diego, CA' }}
          radiusMiles={25}
          onState={(state) => {
            latestState = state;
          }}
        />
      );
    });

    // Fire snapshot with real live performer
    await act(async () => {
      snapshotCallback({
        forEach: (cb: any) => {
          cb({
            data: () => ({
              uid: 'live_user_1',
              performerName: 'The Live Act',
              type: 'band',
              photoUrl: 'http://img.jpg',
              genres: ['Rock'],
              venueName: 'Gaslamp Lounge',
              latitude: 32.7158,
              longitude: -117.1612,
              isLive: true,
              checkedInAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
              visibility: 'public',
              slug: 'the-live-act',
            }),
          });
        },
      });
    });

    expect(latestState.isFallback).toBe(false);
    expect(latestState.livePerformers.length).toBe(1);
    expect(latestState.livePerformers[0].id).toBe('live_user_1');
    expect(latestState.livePerformers[0].isLive).toBe(true);
    expect(latestState.fallbackPerformers.length).toBe(5);
    expect(latestState.fallbackPerformers.every((p: any) => p.isLive === false)).toBe(true);
  });

  test('dynamically updates subscription when radiusMiles expands (e.g. 25 -> 50 miles)', async () => {
    let latestState: any = null;
    let snapshotCallback: any;
    const unsubMock = jest.fn();

    mockOnSnapshot.mockImplementation((q, onNext) => {
      snapshotCallback = onNext;
      return unsubMock;
    });

    const center = { lat: 32.7157, lng: -117.1611, label: 'San Diego, CA' };

    // Initial render with 25 miles
    await act(async () => {
      root.render(
        <TestDiscoveryConsumer
          center={center}
          radiusMiles={25}
          onState={(state) => {
            latestState = state;
          }}
        />
      );
    });

    // Performer at ~35 miles (e.g. Encinitas/Carlsbad north of San Diego, lat: 33.1581, lng: -117.3506 is ~32 miles)
    const northCountyPerformer = {
      uid: 'live_encinitas',
      performerName: 'Coastal Acoustic',
      type: 'artist',
      genres: ['Folk'],
      venueName: 'Encinitas Stage',
      latitude: 33.0370, // ~23.5 miles north
      longitude: -117.2920,
      isLive: true,
      checkedInAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      visibility: 'public',
      slug: 'coastal-acoustic',
    };

    // A performer at ~45 miles (Oceanside Pier, lat: 33.1959, lng: -117.3831 is ~35.5 miles)
    const oceansidePerformer = {
      uid: 'live_oceanside',
      performerName: 'Oceanside Trio',
      type: 'band',
      genres: ['Surf Rock'],
      venueName: 'Pier Stage',
      latitude: 33.1959,
      longitude: -117.3831,
      isLive: true,
      checkedInAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      visibility: 'public',
      slug: 'oceanside-trio',
    };

    // At 25 miles, Oceanside (~35.5 mi) is outside radius
    await act(async () => {
      snapshotCallback({
        forEach: (cb: any) => {
          cb({ data: () => oceansidePerformer });
        },
      });
    });

    // Since it's outside 25 miles, no live checkins qualify -> fallback is true
    expect(latestState.isFallback).toBe(true);
    expect(latestState.livePerformers.length).toBe(0);

    // Now user expands radius to 50 miles!
    await act(async () => {
      root.render(
        <TestDiscoveryConsumer
          center={center}
          radiusMiles={50}
          onState={(state) => {
            latestState = state;
          }}
        />
      );
    });

    // Unsubscribe from previous listener was called
    expect(unsubMock).toHaveBeenCalled();

    // Trigger snapshot for the new subscription at 50 miles
    await act(async () => {
      snapshotCallback({
        forEach: (cb: any) => {
          cb({ data: () => oceansidePerformer });
        },
      });
    });

    // Now Oceanside is inside the 50 mi radius!
    expect(latestState.isFallback).toBe(false);
    expect(latestState.livePerformers.length).toBe(1);
    expect(latestState.livePerformers[0].id).toBe('live_oceanside');
    expect(latestState.livePerformers[0].distanceMiles).toBeGreaterThan(25);
    expect(latestState.livePerformers[0].distanceMiles).toBeLessThanOrEqual(50);
  });
});

