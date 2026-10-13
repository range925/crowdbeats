/**
 * @jest-environment jsdom
 */

// Crowdbeats V2 — Persona Navigation Patterns Unit & JSDOM Tests (Phase 8)

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import FanLayout, { FAN_NAV_GROUPS, BOTTOM_TABS } from '../../app/(fan)/layout';
import CreatorLayout, { CREATOR_NAV_GROUPS } from '../../app/(creator)/layout';
import BandStudioLayout, { BAND_NAV_GROUPS } from '../../app/(band)/layout';
import SponsorStudioLayout, { SPONSOR_NAV_GROUPS } from '../../app/(sponsor)/layout';
import VenueStudioLayout, { VENUE_NAV_GROUPS } from '../../app/(venue)/layout';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let mockPathname = '/fan';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

let mockPersonaType = 'admin';

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123' },
    uid: 'test-user-123',
    status: 'authenticated',
    displayName: 'Elena Vance',
    personaType: mockPersonaType,
    logout: jest.fn(),
  }),
}));

describe('Phase 8: Persona-Specific Navigation Patterns (JSDOM)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  describe('Fan Portal Navigation', () => {
    beforeEach(() => {
      mockPathname = '/fan';
    });

    test('defines 2 distinct semantic navigation groups with 12 total items', () => {
      expect(FAN_NAV_GROUPS).toHaveLength(2);
      expect(FAN_NAV_GROUPS[0].title).toBe('DISCOVER & LIVE');
      expect(FAN_NAV_GROUPS[1].title).toBe('WALLET & SETTINGS');

      const totalItems = FAN_NAV_GROUPS.reduce((acc, g) => acc + g.items.length, 0);
      expect(totalItems).toBe(14);
    });

    test('renders 5 high-frequency thumb-zone tabs in mobile bottom bar', async () => {
      expect(BOTTOM_TABS).toHaveLength(5);

      await act(async () => {
        root.render(<FanLayout><div id="fan-child">Fan Child Content</div></FanLayout>);
      });

      const bottomNav = container.querySelector('nav[aria-label="Mobile navigation"]');
      expect(bottomNav).not.toBeNull();

      const tabs = bottomNav?.querySelectorAll('a');
      expect(tabs).toHaveLength(5);
      expect(tabs?.[0].textContent).toContain('Home');
      expect(tabs?.[0].getAttribute('aria-current')).toBe('page');
      expect(tabs?.[1].textContent).toContain('Map');
      expect(tabs?.[1].getAttribute('aria-current')).toBeNull();
    });
  });

  describe('Creator Studio Navigation', () => {
    beforeEach(() => {
      mockPathname = '/creator/dashboard';
    });

    test('defines 3 distinct studio groups: STUDIO, COMMUNITY & EARNINGS, SETTINGS & SECURITY', () => {
      expect(CREATOR_NAV_GROUPS).toHaveLength(3);
      expect(CREATOR_NAV_GROUPS[0].title).toBe('STUDIO');
      expect(CREATOR_NAV_GROUPS[1].title).toBe('COMMUNITY & EARNINGS');
      expect(CREATOR_NAV_GROUPS[2].title).toBe('SETTINGS & SECURITY');
    });

    test('renders desktop sidebar navigation with active route aria-current="page"', async () => {
      await act(async () => {
        root.render(<CreatorLayout><div id="creator-child">Creator Child Content</div></CreatorLayout>);
      });

      const desktopAside = container.querySelector('.creator-sidebar-desktop');
      expect(desktopAside).not.toBeNull();

      const activeLink = desktopAside?.querySelector('a[aria-current="page"]');
      expect(activeLink).not.toBeNull();
      expect(activeLink?.getAttribute('href')).toBe('/creator/dashboard');
    });
  });

  describe('Band Studio Navigation', () => {
    beforeEach(() => {
      mockPathname = '/band/dashboard';
    });

    test('defines 4 governance & operational groups with 19 total items', () => {
      expect(BAND_NAV_GROUPS).toHaveLength(4);
      expect(BAND_NAV_GROUPS[0].title).toBe('BAND OVERVIEW');
      expect(BAND_NAV_GROUPS[1].title).toBe('COMMUNITY & MONETIZATION');
      expect(BAND_NAV_GROUPS[2].title).toBe('MANAGEMENT & GOVERNANCE');
      expect(BAND_NAV_GROUPS[3].title).toBe('SETTINGS & SECURITY');

      const totalItems = BAND_NAV_GROUPS.reduce((acc, g) => acc + g.items.length, 0);
      expect(totalItems).toBe(19);
    });

    test('renders desktop sidebar with active route aria-current="page"', async () => {
      await act(async () => {
        root.render(<BandStudioLayout><div id="band-child">Band Child Content</div></BandStudioLayout>);
      });

      const desktopAside = container.querySelector('.band-sidebar-desktop');
      expect(desktopAside).not.toBeNull();

      const activeLink = desktopAside?.querySelector('a[aria-current="page"]');
      expect(activeLink).not.toBeNull();
      expect(activeLink?.getAttribute('href')).toBe('/band/dashboard');
    });
  });

  describe('Sponsor Studio Navigation', () => {
    beforeEach(() => {
      mockPathname = '/sponsor/dashboard';
    });

    test('defines 3 talent & ROI groups with 16 total items', () => {
      expect(SPONSOR_NAV_GROUPS).toHaveLength(3);
      expect(SPONSOR_NAV_GROUPS[0].title).toBe('CAMPAIGNS & TALENT');
      expect(SPONSOR_NAV_GROUPS[1].title).toBe('COMMUNICATIONS & ROI');
      expect(SPONSOR_NAV_GROUPS[2].title).toBe('ORGANIZATION & SETTINGS');

      const totalItems = SPONSOR_NAV_GROUPS.reduce((acc, g) => acc + g.items.length, 0);
      expect(totalItems).toBe(16);
    });

    test('renders desktop sidebar with active route aria-current="page"', async () => {
      await act(async () => {
        root.render(<SponsorStudioLayout><div id="sponsor-child">Sponsor Child Content</div></SponsorStudioLayout>);
      });

      const desktopAside = container.querySelector('.sponsor-sidebar-desktop');
      expect(desktopAside).not.toBeNull();

      const activeLink = desktopAside?.querySelector('a[aria-current="page"]');
      expect(activeLink).not.toBeNull();
      expect(activeLink?.getAttribute('href')).toBe('/sponsor/dashboard');
    });
  });

  describe('Venue Studio Navigation', () => {
    beforeEach(() => {
      mockPathname = '/venue/dashboard';
    });

    test('defines 3 stages & live groups with 13 total items', () => {
      expect(VENUE_NAV_GROUPS).toHaveLength(3);
      expect(VENUE_NAV_GROUPS[0].title).toBe('STAGES & LIVE');
      expect(VENUE_NAV_GROUPS[1].title).toBe('DIRECTORY & INSIGHTS');
      expect(VENUE_NAV_GROUPS[2].title).toBe('OPERATIONS & SETTINGS');

      const totalItems = VENUE_NAV_GROUPS.reduce((acc, g) => acc + g.items.length, 0);
      expect(totalItems).toBe(13);
    });

    test('renders desktop sidebar with active route aria-current="page"', async () => {
      await act(async () => {
        root.render(<VenueStudioLayout><div id="venue-child">Venue Child Content</div></VenueStudioLayout>);
      });

      const desktopAside = container.querySelector('.venue-sidebar-desktop');
      expect(desktopAside).not.toBeNull();

      const activeLink = desktopAside?.querySelector('a[aria-current="page"]');
      expect(activeLink).not.toBeNull();
      expect(activeLink?.getAttribute('href')).toBe('/venue/dashboard');
    });
  });
});
