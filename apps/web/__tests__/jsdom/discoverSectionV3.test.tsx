/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { DiscoverSection } from '../../components/landing/v3/DiscoverSection';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock Google Maps Loader
const mockGetGooglePlacePredictions = jest.fn().mockResolvedValue([
  {
    placeId: 'place_austin',
    mainText: 'Austin',
    secondaryText: 'TX, USA',
    fullText: 'Austin, TX, USA',
  },
  {
    placeId: 'place_austin_music',
    mainText: 'Austin City Limits',
    secondaryText: 'Austin, TX, USA',
    fullText: 'Austin City Limits, Austin, TX, USA',
  },
]);

const mockResolveGooglePlaceLocation = jest.fn().mockResolvedValue({
  placeId: 'place_austin',
  city: 'Austin',
  administrativeArea: 'Texas',
  country: 'United States',
  latitude: 30.2672,
  longitude: -97.7431,
  displayName: 'Austin, TX, USA',
});

const mockGeocodeCityQuery = jest.fn().mockResolvedValue({
  placeId: 'geo_austin',
  city: 'Austin',
  administrativeArea: 'Texas',
  country: 'United States',
  latitude: 30.2672,
  longitude: -97.7431,
  displayName: 'Austin, TX, USA',
});

const mockRequestBrowserGeolocation = jest.fn().mockResolvedValue({
  latitude: 30.2672,
  longitude: -97.7431,
  accuracyMeters: 15,
});

jest.mock('@/lib/maps/googleMapsLoader', () => ({
  loadGoogleMapsSdk: jest.fn().mockResolvedValue(undefined),
  createPlacesSessionToken: jest.fn().mockReturnValue(null),
  reverseGeocodeCoordinates: jest.fn().mockResolvedValue({
    displayName: 'Austin, TX',
    city: 'Austin',
    administrativeArea: 'Texas',
    country: 'United States',
  }),
  DEFAULT_DISCOVERY_CENTER: { lat: 32.7157, lng: -117.1611, label: 'San Diego, CA', zoom: 12 },
  getGooglePlacePredictions: (...args: any[]) => mockGetGooglePlacePredictions(...args),
  resolveGooglePlaceLocation: (...args: any[]) => mockResolveGooglePlaceLocation(...args),
  geocodeCityQuery: (...args: any[]) => mockGeocodeCityQuery(...args),
  requestBrowserGeolocation: (...args: any[]) => mockRequestBrowserGeolocation(...args),
}));

// Mock Firestore subscribeToNearbyPerformers
jest.mock('@/lib/firebase/firestore', () => ({
  subscribeToNearbyPerformers: jest.fn(() => jest.fn()),
}));

function setInputValue(input: HTMLInputElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  nativeInputValueSetter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('DiscoverSection V3 UX & Accessibility Tests', () => {
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

  test('renders rounded search bar pill with combobox attributes and NO standalone "or [Use my location]"', () => {
    act(() => {
      root.render(<DiscoverSection />);
    });

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(searchInput).not.toBeNull();
    expect(searchInput.getAttribute('role')).toBe('combobox');
    expect(searchInput.getAttribute('aria-autocomplete')).toBe('list');
    expect(searchInput.getAttribute('aria-expanded')).toBe('false');

    // Standalone "or" text and old locBtn should NOT exist in the form
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    const orText = Array.from(form?.querySelectorAll('span') || []).find(
      (s) => s.textContent?.trim() === 'or'
    );
    expect(orText).toBeUndefined();

    // Dropdown should NOT be in the DOM when query is empty
    const dropdown = container.querySelector('[role="listbox"]');
    expect(dropdown).toBeNull();
  });

  test('shows concise hint when 1-2 characters typed and persistent "Use my location" button', () => {
    act(() => {
      root.render(<DiscoverSection />);
    });

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;

    act(() => {
      searchInput.focus();
      setInputValue(searchInput, 'Au');
    });

    expect(searchInput.getAttribute('aria-expanded')).toBe('true');

    // Hint text should be visible
    expect(container.textContent).toContain('Type at least 3 characters to search');

    // Persistent "Use my location" action button should be present in the dropdown
    const useLocationBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Use my location')
    );
    expect(useLocationBtn).not.toBeNull();
  });

  test('displays clear button (✕) when input has text and clears on click', () => {
    act(() => {
      root.render(<DiscoverSection />);
    });

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;

    // Initially clear button should not be present
    expect(container.querySelector('button[aria-label="Clear search input"]')).toBeNull();

    act(() => {
      searchInput.focus();
      setInputValue(searchInput, 'Denver');
    });

    const clearBtn = container.querySelector('button[aria-label="Clear search input"]') as HTMLButtonElement;
    expect(clearBtn).not.toBeNull();

    act(() => {
      clearBtn.click();
    });

    expect(searchInput.value).toBe('');
  });

  test('Escape key closes the dropdown', () => {
    act(() => {
      root.render(<DiscoverSection />);
    });

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;

    act(() => {
      searchInput.focus();
      setInputValue(searchInput, 'Au');
    });

    expect(searchInput.getAttribute('aria-expanded')).toBe('true');

    act(() => {
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(searchInput.getAttribute('aria-expanded')).toBe('false');
  });

  test('clicking outside search container closes the dropdown', () => {
    act(() => {
      root.render(<DiscoverSection />);
    });

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;

    act(() => {
      searchInput.focus();
      setInputValue(searchInput, 'Au');
    });

    expect(searchInput.getAttribute('aria-expanded')).toBe('true');

    // Click outside on document body
    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(searchInput.getAttribute('aria-expanded')).toBe('false');
  });

  test('mobile toggle switches data-view from list to map', () => {
    act(() => {
      root.render(<DiscoverSection />);
    });

    const layout = container.querySelector('[data-view]');
    expect(layout?.getAttribute('data-view')).toBe('list');

    const toggleBtns = container.querySelectorAll('[role="group"][aria-label="Results view"] button');
    expect(toggleBtns.length).toBe(2);

    const mapBtn = toggleBtns[1] as HTMLButtonElement;
    expect(mapBtn.textContent?.trim()).toBe('Map');

    act(() => {
      mapBtn.click();
    });

    expect(layout?.getAttribute('data-view')).toBe('map');
  });

  test('loads suggestions when 3+ characters typed and handles selection via click', async () => {
    act(() => {
      root.render(<DiscoverSection />);
    });

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;

    await act(async () => {
      searchInput.focus();
      setInputValue(searchInput, 'Austin');
      // Wait for debounce timeout
      await new Promise((r) => setTimeout(r, 300));
    });

    const listbox = container.querySelector('[role="listbox"]');
    expect(listbox).not.toBeNull();

    const options = container.querySelectorAll('[role="option"]');
    expect(options.length).toBe(2);
    expect(options[0].textContent).toContain('Austin');

    await act(async () => {
      (options[0] as HTMLElement).click();
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockResolveGooglePlaceLocation).toHaveBeenCalledWith('place_austin', 'Austin, TX, USA');
  });

  test('arrow down keys cycle active descendant across suggestions', async () => {
    act(() => {
      root.render(<DiscoverSection />);
    });

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;

    await act(async () => {
      searchInput.focus();
      setInputValue(searchInput, 'Austin');
      await new Promise((r) => setTimeout(r, 300));
    });

    // Press ArrowDown to select first suggestion
    act(() => {
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });

    const options = container.querySelectorAll('[role="option"]');
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(searchInput.getAttribute('aria-activedescendant')).toBe(options[0].id);

    // Press ArrowDown to select second suggestion
    act(() => {
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    expect(options[1].getAttribute('aria-selected')).toBe('true');
  });

  test('clicking "Use my location" calls requestBrowserGeolocation and closes dropdown', async () => {
    act(() => {
      root.render(<DiscoverSection />);
    });

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;

    act(() => {
      searchInput.focus();
      setInputValue(searchInput, 'Au');
    });

    const useLocationBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Use my location')
    );
    expect(useLocationBtn).not.toBeNull();

    await act(async () => {
      useLocationBtn?.click();
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockRequestBrowserGeolocation).toHaveBeenCalledTimes(1);
    expect(searchInput.getAttribute('aria-expanded')).toBe('false');
  });

  test('displays notice banner with expand search and try another city when no live sets are active', () => {
    act(() => {
      root.render(<DiscoverSection />);
    });

    // Check notice banner
    expect(container.textContent).toContain('No live sets in this radius right now');
    expect(container.textContent).toContain('Within 25 mi');

    // Find "Expand search (+25 mi)" button and click
    const expandBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Expand search (+25 mi)')
    );
    expect(expandBtn).toBeDefined();

    act(() => {
      expandBtn?.click();
    });

    // Radius should be updated to 50 mi
    expect(container.textContent).toContain('Within 50 mi');

    // Find "Try another city" button
    const tryCityBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Try another city')
    );
    expect(tryCityBtn).toBeDefined();

    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(document.activeElement).not.toBe(searchInput);

    act(() => {
      tryCityBtn?.click();
    });

    expect(document.activeElement).toBe(searchInput);
  });

  test('renders 3 discovery groups in order: nearest musicians, popular musicians, top campaigns', async () => {
    await act(async () => {
      root.render(<DiscoverSection />);
      await new Promise((r) => setTimeout(r, 60));
    });

    // Group 1: Nearest / Other musicians nearby
    expect(container.textContent).toContain('Other musicians nearby');
    expect(container.textContent).toContain('Jake Rios');

    // Group 2: Popular musicians
    expect(container.textContent).toContain('Popular musicians');
    expect(container.textContent).toContain('Top verified solo artists & bands');
    const discoverLink = container.querySelector('a[href="/discover"]');
    expect(discoverLink).not.toBeNull();

    // Group 3: Top campaigns
    expect(container.textContent).toContain('Top campaigns');
    expect(container.textContent).toContain('Support active projects funded by local fans');
    const campaignsLink = container.querySelector('a[href="/creator/campaigns"]');
    expect(campaignsLink).not.toBeNull();
  });

  test('tabs switch between nearest, popular, and campaigns panels with accessible attributes', async () => {
    await act(async () => {
      root.render(<DiscoverSection />);
      await new Promise((r) => setTimeout(r, 60));
    });

    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).not.toBeNull();

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(3);

    // Default tab: nearest is selected
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(tabs[2].getAttribute('aria-selected')).toBe('false');

    const panelNearest = container.querySelector('#panel-nearest');
    const panelPopular = container.querySelector('#panel-popular');
    const panelCampaigns = container.querySelector('#panel-campaigns');

    expect(panelNearest?.hasAttribute('hidden')).toBe(false);
    expect(panelPopular?.hasAttribute('hidden')).toBe(true);
    expect(panelCampaigns?.hasAttribute('hidden')).toBe(true);

    // Click tab 2 (Popular Musicians)
    act(() => {
      (tabs[1] as HTMLElement).click();
    });

    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(panelNearest?.hasAttribute('hidden')).toBe(true);
    expect(panelPopular?.hasAttribute('hidden')).toBe(false);

    // Click tab 3 (Top Campaigns)
    act(() => {
      (tabs[2] as HTMLElement).click();
    });

    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    expect(panelCampaigns?.hasAttribute('hidden')).toBe(false);
  });
});

