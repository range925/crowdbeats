/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import CreatorLayout, { CREATOR_NAV_GROUPS } from '../../app/(creator)/layout';
import BandStudioLayout, { BAND_NAV_GROUPS } from '../../app/(band)/layout';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/creator/dashboard',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

let mockAuthState: {
  user: any;
  uid: string | null;
  status: string;
  displayName: string | null;
  personaType: string | null;
  logout: jest.Mock;
} = {
  user: null,
  uid: null,
  status: 'unauthenticated',
  displayName: 'Guest',
  personaType: null,
  logout: jest.fn(),
};

// Mock useAuth
jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

describe('Phase 9: Solo Musician and Band Navigation', () => {
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

  describe('Solo Musician Navigation (Creator Studio)', () => {
    beforeEach(() => {
      mockAuthState = {
        user: { uid: 'art_solo_99' },
        uid: 'art_solo_99',
        status: 'authenticated',
        displayName: 'Elena Solo',
        personaType: 'artist',
        logout: jest.fn(),
      };
    });

    it('renders all creator workflows in categorized groups', async () => {
      await act(async () => {
        root.render(
          <CreatorLayout>
            <div>Solo Musician Main Content</div>
          </CreatorLayout>
        );
      });

      expect(container.textContent).toContain('Solo Musician Main Content');
      expect(container.textContent).toContain('Elena Solo');

      // Verify all creator workflows are reachable
      const allCreatorHrefs = CREATOR_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
      expect(allCreatorHrefs).toContain('/creator/dashboard');
      expect(allCreatorHrefs).toContain('/creator/activity');
      expect(allCreatorHrefs).toContain('/creator/profile');
      expect(allCreatorHrefs).toContain('/creator/performances');
      expect(allCreatorHrefs).toContain('/creator/campaigns');
      expect(allCreatorHrefs).toContain('/creator/contributions');
      expect(allCreatorHrefs).toContain('/creator/updates');
      expect(allCreatorHrefs).toContain('/creator/fans');
      expect(allCreatorHrefs).toContain('/creator/messages');
      expect(allCreatorHrefs).toContain('/creator/rewards');
      expect(allCreatorHrefs).toContain('/creator/sponsorships');
      expect(allCreatorHrefs).toContain('/creator/media');
      expect(allCreatorHrefs).toContain('/creator/payouts');
      expect(allCreatorHrefs).toContain('/creator/analytics');
      expect(allCreatorHrefs).toContain('/creator/marketing');
      expect(allCreatorHrefs).toContain('/creator/settings');
      expect(allCreatorHrefs).toContain('/creator/privacy');
      expect(allCreatorHrefs).toContain('/creator/security');

      // Verify band-specific governance links do NOT leak into creator studio
      expect(allCreatorHrefs).not.toContain('/band/splits');
      expect(allCreatorHrefs).not.toContain('/band/members');

      // Verify accessible mobile hamburger button with 44px min touch target
      const burger = container.querySelector('button[aria-label*="Creator Studio navigation menu"]') as HTMLElement;
      expect(burger).toBeTruthy();
      expect(burger.style.minWidth).toBe('44px');
      expect(burger.style.minHeight).toBe('44px');
    });

    it('denies access to unauthorized persona (fan trying to access creator portal)', async () => {
      const prevEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      mockAuthState = {
        user: { uid: 'usr_fan_1' },
        uid: 'usr_fan_1',
        status: 'authenticated',
        displayName: 'Regular Fan',
        personaType: 'fan',
        logout: jest.fn(),
      };

      await act(async () => {
        root.render(
          <CreatorLayout>
            <div>Restricted Content</div>
          </CreatorLayout>
        );
      });

      expect(container.textContent).toContain('Creator Studio Access Required');
      expect(container.textContent).not.toContain('Restricted Content');
      (process.env as any).NODE_ENV = prevEnv;
    });
  });

  describe('Band Studio Navigation', () => {
    beforeEach(() => {
      mockAuthState = {
        user: { uid: 'band_user_7' },
        uid: 'band_user_7',
        status: 'authenticated',
        displayName: 'The Sunsets Member',
        personaType: 'band_member',
        logout: jest.fn(),
      };
    });

    it('renders all band governance, splits, and roster workflows', async () => {
      await act(async () => {
        root.render(
          <BandStudioLayout>
            <div>Band Main Content</div>
          </BandStudioLayout>
        );
      });

      expect(container.textContent).toContain('Band Main Content');
      expect(container.textContent).toContain('The Sunsets Member');

      // Verify band-only governance and operational workflows
      const allBandHrefs = BAND_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
      expect(allBandHrefs).toContain('/band/dashboard');
      expect(allBandHrefs).toContain('/band/activity');
      expect(allBandHrefs).toContain('/band/profile');
      expect(allBandHrefs).toContain('/band/performances');
      expect(allBandHrefs).toContain('/band/campaigns');
      expect(allBandHrefs).toContain('/band/fans');
      expect(allBandHrefs).toContain('/band/messages');
      expect(allBandHrefs).toContain('/band/sponsors');
      expect(allBandHrefs).toContain('/band/media');
      expect(allBandHrefs).toContain('/band/marketing');

      // Band-only tools:
      expect(allBandHrefs).toContain('/band/members');
      expect(allBandHrefs).toContain('/band/splits');
      expect(allBandHrefs).toContain('/band/revenue');
      expect(allBandHrefs).toContain('/band/payouts');
      expect(allBandHrefs).toContain('/band/documents');
      expect(allBandHrefs).toContain('/band/analytics');

      // Settings:
      expect(allBandHrefs).toContain('/band/settings');
      expect(allBandHrefs).toContain('/band/privacy');
      expect(allBandHrefs).toContain('/band/security');

      // Verify accessible mobile hamburger button with 44px min touch target
      const burger = container.querySelector('button[aria-label*="Band Studio navigation menu"]') as HTMLElement;
      expect(burger).toBeTruthy();
      expect(burger.style.minWidth).toBe('44px');
      expect(burger.style.minHeight).toBe('44px');
    });

    it('denies access to unauthorized persona (fan trying to access band portal)', async () => {
      const prevEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      mockAuthState = {
        user: { uid: 'usr_fan_2' },
        uid: 'usr_fan_2',
        status: 'authenticated',
        displayName: 'Regular Fan',
        personaType: 'fan',
        logout: jest.fn(),
      };

      await act(async () => {
        root.render(
          <BandStudioLayout>
            <div>Band Restricted Content</div>
          </BandStudioLayout>
        );
      });

      expect(container.textContent).toContain('Band Studio Access Denied');
      expect(container.textContent).not.toContain('Band Restricted Content');
      (process.env as any).NODE_ENV = prevEnv;
    });
  });
});
