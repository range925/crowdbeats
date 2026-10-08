/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { DiscoverClientView } from '../../app/discover/DiscoverClientView';
import * as firestoreModule from '../../lib/firebase/firestore';
import * as authModule from '../../lib/hooks/useAuth';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/hooks/useLivePerformers', () => ({
  useLivePerformers: ({ lat, lng }: any) => {
    // If exploring San Diego (around lat 32.7) return live checkin
    const isSanDiego = lat && Math.abs(lat - 32.7157) < 0.5;
    if (isSanDiego) {
      return {
        performers: [
          {
            uid: 'maya-lin',
            performerName: 'Maya Lin',
            slug: 'maya-lin',
            type: 'artist',
            latitude: 32.7157,
            longitude: -117.1611,
            venueName: 'The Casbah',
            isLive: true,
            genres: ['Acoustic', 'Folk'],
            photoUrl: 'https://cdn.crowdbeats.app/maya.jpg',
            distanceMiles: 0.3,
            tipLink: '/tip/maya-lin',
            checkedInAt: new Date().toISOString(),
          },
        ],
        isLoading: false,
        error: null,
        liveCount: 1,
      };
    }
    // Remote or other city (e.g. Berlin): 0 performers!
    return {
      performers: [],
      isLoading: false,
      error: null,
      liveCount: 0,
    };
  },
}));

// Mock next/dynamic to synchronously render forwarded ref component
jest.mock('next/dynamic', () => () => {
  const React = require('react');
  return React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      flyTo: jest.fn(),
      easeTo: jest.fn(),
      centerOnMarker: jest.fn(),
      fitBounds: jest.fn(),
      addMarker: jest.fn(),
      removeMarker: jest.fn(),
      clearAllMarkers: jest.fn(),
      getZoom: () => 13,
      getCenter: () => props.center || { lat: 32.7157, lng: -117.1611 },
      getBounds: () => ({ sw: { lat: 32.6, lng: -117.2 }, ne: { lat: 32.8, lng: -117.0 } }),
      showRoute: jest.fn(),
      clearRoute: jest.fn(),
      provider: null,
      setTheme: jest.fn(),
    }));

    return (
      <div data-testid="mock-crowdbeats-maplibre" style={props.style}>
        <button
          data-testid="simulate-map-pan"
          onClick={() => {
            props.onMove?.({ lat: 30.2672, lng: -97.7431 }, 13, {
              sw: { lat: 30.2, lng: -97.8 },
              ne: { lat: 30.3, lng: -97.7 },
            });
          }}
        >
          Pan Map
        </button>
      </div>
    );
  });
});

// Mock MapLibre map component
jest.mock('@/components/maps/CrowdbeatsMapLibre', () => {
  const React = require('react');
  return {
    CrowdbeatsMapLibre: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        flyTo: jest.fn(),
        easeTo: jest.fn(),
        centerOnMarker: jest.fn(),
        fitBounds: jest.fn(),
        addMarker: jest.fn(),
        removeMarker: jest.fn(),
        clearAllMarkers: jest.fn(),
        getZoom: () => 13,
        getCenter: () => props.center || { lat: 32.7157, lng: -117.1611 },
        getBounds: () => ({ sw: { lat: 32.6, lng: -117.2 }, ne: { lat: 32.8, lng: -117.0 } }),
        showRoute: jest.fn(),
        clearRoute: jest.fn(),
        provider: null,
        setTheme: jest.fn(),
      }));

      return (
        <div data-testid="mock-crowdbeats-maplibre" style={props.style}>
          <button
            data-testid="simulate-map-pan"
            onClick={() => {
              props.onMove?.({ lat: 30.2672, lng: -97.7431 }, 13, {
                sw: { lat: 30.2, lng: -97.8 },
                ne: { lat: 30.3, lng: -97.7 },
              });
            }}
          >
            Pan Map
          </button>
        </div>
      );
    }),
  };
});

describe('Dedicated Public Discover Page (/discover) Test Suite', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Default unauthenticated user for DiscoveryNav
    jest.spyOn(authModule, 'useAuth').mockReturnValue({
      user: null,
      status: 'unauthenticated',
      personaType: null,
      loading: false,
      error: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
    } as any);

    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: jest.fn((success) => {
        success({
          coords: {
            latitude: 34.0522,
            longitude: -118.2437,
            accuracy: 10,
          },
        });
      }),
    };
    (global.navigator as any).geolocation = mockGeolocation;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.restoreAllMocks();
  });

  test('1. Renders map exploration, global search input, and visible explored area badge', async () => {
    await act(async () => {
      root.render(<DiscoverClientView />);
    });

    // Global search input
    const searchInput = container.querySelector('input[placeholder*="Search cities"]');
    expect(searchInput).not.toBeNull();

    // Explored Area Badge
    expect(container.textContent).toContain('Exploring San Diego, California');

    // "Return to my location" button
    expect(container.textContent).toContain('Return to my location');

    // Map canvas
    expect(container.querySelector('[data-testid="mock-crowdbeats-maplibre"]')).not.toBeNull();
  });

  test('2. Global search input autocomplete selects a city and does NOT snap back to device location', async () => {
    await act(async () => {
      root.render(<DiscoverClientView />);
    });

    const searchInput = container.querySelector('input[placeholder*="Search cities"]') as HTMLInputElement;

    // Type "Austin" to open dropdown
    await act(async () => {
      searchInput.focus();
    });

    // Select Austin from popular hubs
    const austinButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Austin, TX')
    );
    expect(austinButton).toBeDefined();

    await act(async () => {
      austinButton?.click();
    });

    // Badge should now be exploring Austin
    expect(container.textContent).toContain('Exploring Austin, Texas');

    // Crucially: does NOT snap back to device location automatically
    expect(container.textContent).not.toContain('Near you');
  });

  test('3. Honest empty states: shows "No performers found in this area." and never substitutes distant performers', async () => {
    // When exploring a city with 0 performers (e.g. Berlin in mock or empty remote area)
    mockSearchParams = new URLSearchParams('q=Berlin');

    await act(async () => {
      root.render(<DiscoverClientView />);
    });

    expect(container.textContent).toContain('Exploring Berlin, Germany');
    expect(container.textContent).toContain('No performers found in this area.');
    expect(container.textContent).toContain('We never substitute distant performers from other cities');
  });

  test('4. Performer cards have direct links to /tip/${performerId} and /artist/${slug}', async () => {
    // San Diego has mock performers
    await act(async () => {
      root.render(<DiscoverClientView />);
    });

    // Card should render with live performer
    const tipLink = container.querySelector('a[href*="/tip/"]');
    expect(tipLink).not.toBeNull();
    expect(tipLink?.getAttribute('href')).toContain('/tip/');

    const profileLink = container.querySelector('a[href*="/artist/"], a[href*="/band/"]');
    expect(profileLink).not.toBeNull();
  });

  test('5. "Search this area" button appears after panning/zooming the map', async () => {
    await act(async () => {
      root.render(<DiscoverClientView />);
    });

    expect(container.textContent).not.toContain('Search this area');

    // Simulate panning the map
    const panButton = container.querySelector('[data-testid="simulate-map-pan"]') as HTMLButtonElement;
    await act(async () => {
      panButton?.click();
    });

    // "Search this area" button should now be visible
    expect(container.textContent).toContain('Search this area');

    // Clicking "Search this area"
    const searchAreaBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Search this area')
    );
    await act(async () => {
      searchAreaBtn?.click();
    });

    // Button should now be dismissed
    expect(container.textContent).not.toContain('Search this area');
  });

  test('6. "Return to my location" button requests browser geolocation upon user click', async () => {
    await act(async () => {
      root.render(<DiscoverClientView />);
    });

    // Geolocation was NOT called on load
    expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();

    // Click "Return to my location"
    const returnBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Return to my location')
    );

    await act(async () => {
      returnBtn?.click();
    });

    // Geolocation WAS called on click
    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();

    // Badge indicates Near you
    expect(container.textContent).toContain('Near you');
  });
});
