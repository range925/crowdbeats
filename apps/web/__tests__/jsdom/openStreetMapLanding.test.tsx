/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { LiveRadarMap } from '../../components/landing/LiveRadarMap';
import type { PublicPerformerItem, PublicVenueItem } from '../../lib/discovery/discoveryClient';

// Mock ThemeProvider
jest.mock('../../components/theme/ThemeProvider', () => ({
  useTheme: () => ({ resolvedTheme: 'dark', theme: 'dark', setTheme: jest.fn() }),
}));

// Mock crowdbeatsMapEngine
jest.mock('@/lib/maps/engine/crowdbeatsMapEngine', () => ({
  loadMapLibre: jest.fn().mockResolvedValue(require('maplibre-gl')),
}));

describe('OpenStreetMap Web Landing Page Integration (JSDOM)', () => {
  let container: HTMLDivElement;
  let root: Root;

  const mockPerformers: PublicPerformerItem[] = [
    {
      id: 'perf_1',
      name: 'Maya Lin',
      slug: 'maya-lin',
      type: 'artist',
      genres: ['Indie Pop', 'Acoustic'],
      isLive: true,
      latitude: 32.7157,
      longitude: -117.1611,
      currentVenueName: 'The Casbah',
      isVerified: true,
      popularityScore: 92,
      followersCount: 1400,
    },
    {
      id: 'perf_2',
      name: 'The Neon Vibe',
      slug: 'the-neon-vibe',
      type: 'band',
      genres: ['Synthwave', 'Rock'],
      isLive: false,
      latitude: 32.718,
      longitude: -117.165,
      isVerified: true,
      popularityScore: 85,
      followersCount: 2200,
    },
  ];

  const mockVenues: PublicVenueItem[] = [
    {
      id: 'venue_1',
      name: 'The Casbah',
      latitude: 32.72,
      longitude: -117.17,
      activeMusicianCount: 2,
      address: '2501 Kettner Blvd',
      city: 'San Diego',
      state: 'CA',
    },
  ];

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

  test('renders map container with clean interface and verified watermark removal', async () => {
    await act(async () => {
      root.render(
        <LiveRadarMap
          performers={mockPerformers}
          venues={mockVenues}
          center={{ lat: 32.7157, lng: -117.1611 }}
          cityName="San Diego, CA"
        />
      );
    });

    // 1. Container presence
    const mapContainer = container.querySelector('#live-radar-map-container');
    expect(mapContainer).not.toBeNull();

    // 2. Clean header title
    expect(container.textContent).toContain('Live Stage Radar');
    expect(container.textContent).toContain('San Diego, CA');

    // 3. Verify watermark badge and attribution links are removed
    expect(container.textContent).not.toContain('© OpenStreetMap contributors');
    const osmLink = container.querySelector('a[href="https://www.openstreetmap.org/copyright"]');
    expect(osmLink).toBeNull();

    // 4. Live indicators and performer count
    expect(container.textContent).toContain('1 LIVE NOW');

    // 5. Performer details in bottom drawer (first live performer is auto-selected)
    expect(container.textContent).toContain('Maya Lin');
    expect(container.textContent).toContain('● LIVE ON STAGE');
    expect(container.textContent).toContain('Street Route Active');
  });

  test('supports filter switches and layer mode buttons', async () => {
    await act(async () => {
      root.render(
        <LiveRadarMap
          performers={mockPerformers}
          venues={mockVenues}
          center={{ lat: 32.7157, lng: -117.1611 }}
          cityName="San Diego, CA"
        />
      );
    });

    // Segmented filters
    expect(container.textContent).toContain('All');
    expect(container.textContent).toContain('● Live');
    expect(container.textContent).toContain('🎸 Bands');
    expect(container.textContent).toContain('🎤 Solo');

    // Layer mode button
    const layerBtn = container.querySelector('button[title*="Layer Mode"]');
    expect(layerBtn).not.toBeNull();
  });

  test('renders Uber/Lyft mobility layout with route itinerary and stage tiers', async () => {
    await act(async () => {
      root.render(
        <LiveRadarMap
          performers={mockPerformers}
          venues={mockVenues}
          center={{ lat: 32.7157, lng: -117.1611 }}
          cityName="San Diego, CA"
        />
      );
    });

    // 1. Crowdbeats Itinerary card with listener location and artist/stage destination
    expect(container.textContent).toContain('Your Location · Exploring Live Music');
    expect(container.textContent).toContain('Maya Lin');
    expect(container.textContent).toContain('Solo Musician');
    expect(container.textContent).toContain('The Casbah');

    // 2. Uber/Lyft Stage Tier Cards
    expect(container.textContent).toContain('Stage Fan');
    expect(container.textContent).toContain('$5');
    expect(container.textContent).toContain('Front Row');
    expect(container.textContent).toContain('$10');
    expect(container.textContent).toContain('Crowd Hero');
    expect(container.textContent).toContain('$25');
    expect(container.textContent).toContain('Backstage');
    expect(container.textContent).toContain('$50');

    // 3. Payment Method & Action CTA
    expect(container.textContent).toContain('Apple Pay');
    expect(container.textContent).toContain('Tip $25 & Join Live Stage');

    // 4. Clicking a different tier ($50 Backstage) updates the action CTA
    const producerBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Backstage')
    );
    expect(producerBtn).toBeDefined();

    await act(async () => {
      producerBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Tip $50 & Join Live Stage');
  });
});

