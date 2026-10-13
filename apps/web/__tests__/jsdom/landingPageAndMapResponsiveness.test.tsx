/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/navigation
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
}));

jest.mock('@/lib/firebase/app', () => ({
  firebaseApp: {},
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    uid: null,
    status: 'unauthenticated',
    logout: jest.fn(),
  }),
}));

// Mock google maps loader
jest.mock('@/lib/maps/googleMapsLoader', () => ({
  loadGoogleMapsSdk: jest.fn().mockResolvedValue(true),
  getAutocompleteSuggestions: jest.fn().mockResolvedValue([]),
  geocodeAddress: jest.fn().mockResolvedValue({ lat: 32.7157, lng: -117.1611, label: 'San Diego, CA' }),
}));

// Mock nearby discovery hook
jest.mock('@/lib/discovery/discoveryDataService', () => ({
  useNearbyDiscovery: () => ({
    livePerformers: [
      {
        id: 'maya-lin-1',
        name: 'Maya Lin',
        type: 'artist',
        genres: ['Acoustic', 'Indie Folk'],
        slug: 'maya-lin',
        venueName: 'The Casbah',
        distanceMiles: 0.8,
        isLive: true,
        photoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
        tipLink: '/tip/maya-lin',
      },
      {
        id: 'electric-avenue-2',
        name: 'Electric Avenue',
        type: 'band',
        genres: ['Funk', 'Rock'],
        slug: 'electric-avenue',
        venueName: 'Belly Up Tavern',
        distanceMiles: 2.4,
        isLive: true,
        photoUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80',
        tipLink: '/tip/electric-avenue',
      },
    ],
    nearestPerformers: [],
    popularMusicians: [
      {
        id: 'sol-mar-popular',
        name: 'Sol Mar',
        type: 'artist',
        genres: ['Neo-Soul'],
        slug: 'sol-mar',
        followersCount: 14200,
        originCity: 'San Diego, CA',
        isVerified: true,
        rank: 1,
        popularityScore: 98,
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
        tipLink: '/tip/sol-mar',
      },
    ],
    topCampaigns: [
      {
        campaignId: 'camp-debut-vinyl',
        title: 'Debut Vinyl Record Pressing',
        creatorName: 'The Midnight Echoes',
        creatorType: 'band',
        pledgedCents: 450000,
        goalCents: 500000,
        percentFunded: 90,
        backerCount: 142,
        daysRemaining: 8,
        status: 'active',
        category: 'Album Funding',
        description: 'Help us press our self-titled debut vinyl record at Sun King pressing plant.',
        photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

import { LandingV3 } from '@/components/landing/v3/LandingV3';
import { DiscoverSection } from '@/components/landing/v3/DiscoverSection';
import { MAP_STYLE_LIGHT, DiscoverMap } from '@/components/landing/v3/DiscoverMap';
import { NearestPerformerCard } from '@/components/landing/v3/cards/NearestPerformerCard';
import { PopularPerformerCard } from '@/components/landing/v3/cards/PopularPerformerCard';
import { CampaignCard } from '@/components/landing/v3/cards/CampaignCard';

describe('Phase 11: Landing Page and Map Responsiveness', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
  });

  test('LandingV3 renders the complete landing section hierarchy including Section 2 Discover and CbFooter', async () => {
    await act(async () => {
      root.render(<LandingV3 />);
    });

    // 1. Verify header exists with mobile hamburger trigger
    const header = container.querySelector('header');
    expect(header).not.toBeNull();
    const burgerBtn = header?.querySelector('button[aria-label="Open menu"]');
    expect(burgerBtn).not.toBeNull();

    // 2. Verify Hero Section exists
    const heroSection = container.querySelector('#hero');
    expect(heroSection).not.toBeNull();
    expect(heroSection?.textContent).toContain('Discover live musicians near you');

    // 3. Verify Section 2 Discover section exists
    const discoverSection = container.querySelector('#discover');
    expect(discoverSection).not.toBeNull();

    // 4. Verify Apple Story sections exist
    expect(container.querySelector('#connection')).not.toBeNull();
    expect(container.querySelector('#grid')).not.toBeNull();
    expect(container.querySelector('#carousel')).not.toBeNull();
    expect(container.querySelector('section[aria-label="Explore by Sound and City"]')).not.toBeNull();

    // 5. Verify CbFooter is present and protected
    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
  });

  test('DiscoverSection renders search form with accessible attributes, placeholder, and location action', async () => {
    await act(async () => {
      root.render(<DiscoverSection />);
    });

    const searchInput = container.querySelector('input[type="text"][role="combobox"]') as HTMLInputElement;
    expect(searchInput).not.toBeNull();
    expect(searchInput.getAttribute('inputmode')).toBe('search');
    expect(searchInput.placeholder).toContain('Search city or neighborhood');
    expect(searchInput.getAttribute('aria-autocomplete')).toBe('list');

    // Submit / explore button
    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).not.toBeNull();
    expect(submitBtn.getAttribute('aria-label')).toBe('Explore nearby music');
  });

  test('DiscoverSection renders tabs for Nearest Musicians, Popular, and Campaigns with accessible tab switching', async () => {
    await act(async () => {
      root.render(<DiscoverSection />);
    });

    const tabList = container.querySelector('div[role="tablist"]');
    expect(tabList).not.toBeNull();

    const tabs = tabList?.querySelectorAll('button[role="tab"]');
    expect(tabs?.length).toBe(3);

    const nearestTab = tabs?.[0] as HTMLButtonElement;
    const popularTab = tabs?.[1] as HTMLButtonElement;
    const campaignsTab = tabs?.[2] as HTMLButtonElement;

    expect(nearestTab.getAttribute('aria-selected')).toBe('true');
    expect(popularTab.getAttribute('aria-selected')).toBe('false');
    expect(campaignsTab.getAttribute('aria-selected')).toBe('false');

    // Click Popular tab
    await act(async () => {
      popularTab.click();
    });

    expect(popularTab.getAttribute('aria-selected')).toBe('true');
    expect(nearestTab.getAttribute('aria-selected')).toBe('false');

    // Popular panel should be visible
    const popularPanel = container.querySelector('#panel-popular');
    expect(popularPanel?.hasAttribute('hidden')).toBe(false);

    // Click Campaigns tab
    await act(async () => {
      campaignsTab.click();
    });

    expect(campaignsTab.getAttribute('aria-selected')).toBe('true');
    const campaignsPanel = container.querySelector('#panel-campaigns');
    expect(campaignsPanel?.hasAttribute('hidden')).toBe(false);
  });

  test('NearestPerformerCard, PopularPerformerCard, and CampaignCard render with accessible actions and metadata', async () => {
    const mockPerformer = {
      id: 'maya-lin',
      performerName: 'Maya Lin',
      type: 'artist' as const,
      genres: ['Acoustic', 'Folk'],
      slug: 'maya-lin',
      venueName: 'The Casbah',
      distanceMiles: 0.5,
      isLive: true,
      tipLink: '/tip/maya-lin',
    };

    const mockPopular = {
      id: 'sol-mar',
      performerName: 'Sol Mar',
      type: 'artist' as const,
      genres: ['Neo-Soul'],
      slug: 'sol-mar',
      followersCount: 15400,
      originCity: 'San Diego, CA',
      isVerified: true,
      rank: 1,
      popularityScore: 98,
      tipLink: '/tip/sol-mar',
    };

    const mockCampaign = {
      id: 'camp-1',
      campaignId: 'camp-1',
      title: 'Debut Studio Album',
      creatorName: 'The Midnight Echoes',
      creatorType: 'band' as const,
      pledgedDollars: 4500,
      goalDollars: 5000,
      percentFunded: 90,
      backersCount: 120,
      daysRemaining: 7,
      status: 'active',
      category: 'Album',
      description: 'Support our first studio album',
    };

    await act(async () => {
      root.render(
        <div>
          <NearestPerformerCard performer={mockPerformer} rank={1} isSelected={false} />
          <PopularPerformerCard performer={mockPopular} />
          <CampaignCard campaign={mockCampaign} />
        </div>
      );
    });

    // Check Nearest card
    const nearestArticle = container.querySelector('article[aria-label*="Maya Lin"]');
    expect(nearestArticle).not.toBeNull();
    expect(nearestArticle?.textContent).toContain('Live Now');
    expect(nearestArticle?.textContent).toContain('The Casbah');
    expect(nearestArticle?.textContent).toContain('0.5 mi away');

    // Check Popular card
    const popularArticle = container.querySelector('article[aria-label*="Sol Mar"]');
    expect(popularArticle).not.toBeNull();
    expect(popularArticle?.textContent).toContain('15.4k followers');
    expect(popularArticle?.textContent).toContain('San Diego, CA');

    // Check Campaign card
    const campaignArticle = container.querySelector('article[aria-label*="Debut Studio Album"]');
    expect(campaignArticle).not.toBeNull();
    expect(campaignArticle?.textContent).toContain('90% funded');
    expect(campaignArticle?.textContent).toContain('$4,500');
    expect(campaignArticle?.textContent).toContain('7 days left');
  });

  test('MAP_STYLE_LIGHT maintains high contrast, legible labels and POI decluttering', () => {
    // Verify commercial POI decluttering
    const poiStyle = MAP_STYLE_LIGHT.find((s) => s.featureType === 'poi.business');
    expect((poiStyle?.stylers?.[0] as any)?.visibility).toBe('off');

    // Verify locality label contrast
    const localityStyle = MAP_STYLE_LIGHT.find((s) => s.featureType === 'administrative.locality');
    const localityColor = (localityStyle?.stylers?.[0] as any)?.color;
    expect(localityColor).toBe('#1e293b'); // High contrast dark slate-900

    // Verify neighborhood label contrast
    const neighborhoodStyle = MAP_STYLE_LIGHT.find((s) => s.featureType === 'administrative.neighborhood');
    const neighborhoodColor = (neighborhoodStyle?.stylers?.[0] as any)?.color;
    expect(neighborhoodColor).toBe('#475569'); // High contrast slate-600

    // Verify parks text fill
    const parkTextStyle = MAP_STYLE_LIGHT.find(
      (s) => s.featureType === 'poi.park' && s.elementType === 'labels.text.fill'
    );
    expect((parkTextStyle?.stylers?.[0] as any)?.color).toBe('#15803d'); // Green-700 on Green-100

    // Verify water text fill
    const waterTextStyle = MAP_STYLE_LIGHT.find(
      (s) => s.featureType === 'water' && s.elementType === 'labels.text.fill'
    );
    expect((waterTextStyle?.stylers?.[0] as any)?.color).toBe('#0369a1'); // Sky-700 on Sky-100
  });
});
