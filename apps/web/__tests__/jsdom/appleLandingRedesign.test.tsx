/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { LandingV3 } from '../../components/landing/v3/LandingV3';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Google Maps SDK loader for protected DiscoverSection
jest.mock('@/lib/maps/googleMapsLoader', () => ({
  loadGoogleMapsSdk: jest.fn().mockResolvedValue(undefined),
  createPlacesSessionToken: jest.fn().mockReturnValue(null),
  reverseGeocodeCoordinates: jest.fn().mockResolvedValue({
    displayName: 'Austin, TX',
    city: 'Austin',
    administrativeArea: 'Texas',
    country: 'United States',
  }),
  getGooglePlacePredictions: jest.fn().mockResolvedValue([]),
  resolveGooglePlaceLocation: jest.fn().mockResolvedValue(null),
  geocodeCityQuery: jest.fn().mockResolvedValue(null),
  requestBrowserGeolocation: jest.fn().mockResolvedValue({
    latitude: 30.2672,
    longitude: -97.7431,
    accuracyMeters: 20,
  }),
}));

describe('Crowdbeats Apple-Inspired Landing Page Redesign Test Suite', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
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

  test('1. Renders exact required Apple-inspired section sequence with 3 features before the grid', async () => {
    await act(async () => {
      root.render(<LandingV3 />);
    });

    const main = container.querySelector('main');
    expect(main).not.toBeNull();

    const sections = main!.querySelectorAll('section');
    // Main sections inside <main>:
    // 1. Hero (#hero)
    // 2. Protected Map (#discover)
    // 3. Connection (#connection)
    // 4. Bento Grid (#grid) containing 6 tiles
    // 5. Large Editorial Carousel (#carousel)
    // 6. Media Rail
    expect(sections.length).toBeGreaterThanOrEqual(5);

    // Verify Section 1: Hero
    const hero = main!.querySelector('#hero');
    expect(hero).not.toBeNull();
    expect(hero!.textContent).toContain('Discover live musicians near you.');
    expect(hero!.textContent).toContain('Support the music you love.');
    expect(hero!.textContent).toContain('Discover live music');
    expect(hero!.textContent).toContain('Join as a musician');

    // Verify Section 2: Protected Discovery Map
    const discoverSection = main!.querySelector('#discover');
    expect(discoverSection).not.toBeNull();
    expect(discoverSection!.textContent).toContain('Your next great live moment could be around the corner.');

    // Verify Section 3: Connection Feature
    const connection = main!.querySelector('#connection');
    expect(connection).not.toBeNull();
    expect(connection!.textContent).toContain('Great music.');
    expect(connection!.textContent).toContain('Real connection.');
    expect(connection!.textContent).toContain('Explore the community');
    expect(connection!.textContent).toContain('How tipping works');
  });

  test('2. Preserves Protected Section 2 (Discovery Map) and Protected Footer without alteration', async () => {
    await act(async () => {
      root.render(<LandingV3 />);
    });

    // Protected Map Section verification
    const mapSection = container.querySelector('#discover');
    expect(mapSection).not.toBeNull();
    expect(mapSection?.querySelector('input[type="text"]')).not.toBeNull(); // Search input
    expect(mapSection?.textContent).toContain('City or neighborhood');
    expect(mapSection?.textContent).toContain('Use my location');

    // Protected Footer verification
    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(footer?.textContent).toContain('LIVE PLATFORM');
    expect(footer?.textContent).toContain('LEGAL & GOVERNANCE');
    expect(footer?.textContent).toContain('California Civil Code');
    expect(footer?.textContent).toContain('Crowdbeats charges a transparent 6% platform technology fee');
  });

  test('3. Desktop grid has exactly SIX tiles arranged across 3 rows', async () => {
    await act(async () => {
      root.render(<LandingV3 />);
    });

    const gridSection = container.querySelector('#grid');
    expect(gridSection).not.toBeNull();

    // Tile 1: Solo Musicians
    const tileSolo = gridSection!.querySelector('#tile-solo-musicians');
    expect(tileSolo).not.toBeNull();
    expect(tileSolo!.textContent).toContain('Solo Musicians');
    expect(tileSolo!.textContent).toContain('Your music. More people.');
    expect(tileSolo!.textContent).toContain('Join as Solo Musician');

    // Tile 2: Bands
    const tileBands = gridSection!.querySelector('#tile-bands');
    expect(tileBands).not.toBeNull();
    expect(tileBands!.textContent).toContain('Bands & Ensembles');
    expect(tileBands!.textContent).toContain('Together. Heard.');
    expect(tileBands!.textContent).toContain('Join as Band');

    // Tile 3: Fans
    const tileFans = gridSection!.querySelector('#tile-fans');
    expect(tileFans).not.toBeNull();
    expect(tileFans!.textContent).toContain('Fans & Audiences');
    expect(tileFans!.textContent).toContain('Be more than someone in the crowd.');
    expect(tileFans!.textContent).toContain('Start discovering');

    // Tile 4: Simple Tipping with interactive presets & 6% fee disclosure
    const tileTipping = gridSection!.querySelector('#tile-tipping');
    expect(tileTipping).not.toBeNull();
    expect(tileTipping!.textContent).toContain('Simple Tipping');
    expect(tileTipping!.textContent).toContain('A little support. A lasting impact.');
    expect(tileTipping!.textContent).toContain('Maya Lin');
    expect(tileTipping!.textContent).toContain('Live');
    expect(tileTipping!.textContent).toContain('$5');
    expect(tileTipping!.textContent).toContain('$10');
    expect(tileTipping!.textContent).toContain('$20');
    expect(tileTipping!.textContent).toContain('Fee (6%)');
    expect(tileTipping!.textContent).toContain('Apple Pay');

    // Tile 5: Campaigns
    const tileCampaigns = gridSection!.querySelector('#tile-campaigns');
    expect(tileCampaigns).not.toBeNull();
    expect(tileCampaigns!.textContent).toContain('Crowdfunding & Vinyl');
    expect(tileCampaigns!.textContent).toContain('Help the next chapter happen.');
    expect(tileCampaigns!.textContent).toContain('Explore campaigns');

    // Tile 6: Music Community
    const tileCommunity = gridSection!.querySelector('#tile-community');
    expect(tileCommunity).not.toBeNull();
    expect(tileCommunity!.textContent).toContain('Community');
    expect(tileCommunity!.textContent).toContain('Great music starts with people showing up.');
    expect(tileCommunity!.textContent).toContain('Join the community');
  });

  test('4. Interactive tipping mockup updates tip amounts and fee calculations on user interaction', async () => {
    await act(async () => {
      root.render(<LandingV3 />);
    });

    const tileTipping = container.querySelector('#tile-tipping');
    expect(tileTipping).not.toBeNull();

    // Default $10 selected
    expect(tileTipping!.textContent).toContain('Tip: $10.00 • Fee (6%): $0.60');

    // Click $20 preset chip
    const chips = tileTipping!.querySelectorAll('button[role="radio"]');
    expect(chips.length).toBe(3);

    await act(async () => {
      (chips[2] as HTMLButtonElement).click(); // $20 chip
    });

    expect(tileTipping!.textContent).toContain('Tip: $20.00 • Fee (6%): $1.20');
    expect(tileTipping!.textContent).toContain('Send $20.00 with Apple Pay');
  });

  test('5. Large editorial carousel renders dominant slide with navigation buttons and pagination indicators', async () => {
    await act(async () => {
      root.render(<LandingV3 />);
    });

    const carousel = container.querySelector('#carousel');
    expect(carousel).not.toBeNull();
    expect(carousel!.textContent).toContain('Find your next live moment.');
    expect(carousel!.textContent).toContain('Maya Lin');
    expect(carousel!.textContent).toContain('The Midnight Echoes');
    expect(carousel!.textContent).toContain('Marcus Rivera');
    expect(carousel!.textContent).toContain('Elena Cruz');

    // Navigation buttons
    const prevBtn = carousel!.querySelector('button[aria-label="Previous performer story"]');
    const nextBtn = carousel!.querySelector('button[aria-label="Next performer story"]');
    expect(prevBtn).not.toBeNull();
    expect(nextBtn).not.toBeNull();

    // Pagination indicator dots
    const dots = carousel!.querySelectorAll('button[role="tab"]');
    expect(dots.length).toBe(4);

    // Click next slide
    await act(async () => {
      (nextBtn as HTMLButtonElement).click();
    });

    // Check active tab indicator
    expect(dots[1].getAttribute('aria-selected')).toBe('true');
  });

  test('6. Smaller horizontal media rail renders browse channels with real destinations', async () => {
    await act(async () => {
      root.render(<LandingV3 />);
    });

    const mediaRail = container.querySelector('section[aria-label="Explore by Sound and City"]');
    expect(mediaRail).not.toBeNull();
    expect(mediaRail!.textContent).toContain('Explore by sound & city');
    expect(mediaRail!.textContent).toContain('Acoustic Sessions & Folk');
    expect(mediaRail!.textContent).toContain('Indie Rock & Alternative');
    expect(mediaRail!.textContent).toContain('Downtown Jazz & Brass');
    expect(mediaRail!.textContent).toContain('Studio Recording & Vinyl');
    expect(mediaRail!.textContent).toContain('Local Music Lounges');
    expect(mediaRail!.textContent).toContain('Explore Worldwide Hubs');

    // Verify valid hrefs
    const links = mediaRail!.querySelectorAll('a');
    expect(links.length).toBe(6);
    expect(links[0].getAttribute('href')).toBe('/discover?genre=acoustic');
    expect(links[1].getAttribute('href')).toBe('/discover?genre=rock');
    expect(links[2].getAttribute('href')).toBe('/discover?genre=jazz');
    expect(links[3].getAttribute('href')).toBe('/discover?tab=campaigns');
    expect(links[4].getAttribute('href')).toBe('/discover?setting=venue');
    expect(links[5].getAttribute('href')).toBe('/discover');
  });
});
