/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import FanLayout, { FAN_NAV_GROUPS, BOTTOM_TABS } from '../../app/(fan)/layout';
import { DiscoveryNav } from '../../components/discovery/DiscoveryNav';
import { TipAuthGateModal } from '../../components/discovery/TipAuthGateModal';
import { DiscoveryClient } from '../../lib/discovery/discoveryClient';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mockPush = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/fan',
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
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

describe('Phase 8: Guest and Fan Navigation Deep Dive', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockPush.mockClear();
    sessionStorage.clear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  describe('Guest Navigation (Unauthenticated)', () => {
    beforeEach(() => {
      mockAuthState = {
        user: null,
        uid: null,
        status: 'unauthenticated',
        displayName: 'Guest',
        personaType: null,
        logout: jest.fn(),
      };
    });

    it('renders DiscoveryNav with guest browsing links and auth gate CTA', async () => {
      await act(async () => {
        root.render(<DiscoveryNav />);
      });

      // Guest can browse without login
      expect(container.textContent).toContain('Live Nearby');
      expect(container.textContent).toContain('Support');

      // Guest sees Sign In and Get Started
      const signInLinks = container.querySelectorAll('a[href="/auth"]');
      expect(signInLinks.length).toBeGreaterThan(0);

      // Verify no unauthorized role links in guest navigation
      const text = container.textContent || '';
      expect(text).not.toContain('Platform CRM');
      expect(text).not.toContain('Venue Stage Management');
      expect(text).not.toContain('Sponsor Escrow');
    });

    it('intercepts guest tipping with TipAuthGateModal and directs to /auth with pending tip', async () => {
      let closed = false;
      await act(async () => {
        root.render(
          <TipAuthGateModal
            isOpen={true}
            onClose={() => { closed = true; }}
            performerId="art_elena"
            performerSlug="elena-vance"
            performerName="Elena Vance"
            performerType="artist"
            initialAmountCents={2500}
            returnUrl="/artist/elena-vance"
          />
        );
      });

      expect(container.textContent).toContain('Elena Vance');
      expect(container.textContent).toContain('$25');
      expect(container.textContent).toContain('Sign in to tip Elena Vance');

      const proceedBtn = container.querySelector('button[aria-label="Continue with Google to confirm tip"]') as HTMLButtonElement;
      expect(proceedBtn).toBeTruthy();

      await act(async () => {
        proceedBtn.click();
      });

      // Verify pending tip saved in sessionStorage via DiscoveryClient
      const savedTip = DiscoveryClient.getPendingTip();
      expect(savedTip).not.toBeNull();
      expect(savedTip?.creatorSlug).toBe('elena-vance');
      expect(savedTip?.selectedTipAmountCents).toBe(2500);

      // Verify redirected to auth with returnUrl
      expect(mockPush).toHaveBeenCalledWith('/auth?returnUrl=/artist/elena-vance&tipCents=2500');
    });
  });

  describe('Fan Navigation (Authenticated)', () => {
    beforeEach(() => {
      mockAuthState = {
        user: { uid: 'usr_fan_42' },
        uid: 'usr_fan_42',
        status: 'authenticated',
        displayName: 'Acoustic Fan',
        personaType: 'fan',
        logout: jest.fn(),
      };
    });

    it('renders FanLayout with all fan authorized destinations including Discover and Profile', async () => {
      await act(async () => {
        root.render(
          <FanLayout>
            <div data-testid="fan-content">Fan Dashboard Content</div>
          </FanLayout>
        );
      });

      expect(container.textContent).toContain('Fan Dashboard Content');

      // Check all primary authorized fan destinations are present
      const allFanHrefs = FAN_NAV_GROUPS.flatMap(g => g.items.map(i => i.href));
      expect(allFanHrefs).toContain('/fan');
      expect(allFanHrefs).toContain('/discover');
      expect(allFanHrefs).toContain('/fan/nearby');
      expect(allFanHrefs).toContain('/fan/following');
      expect(allFanHrefs).toContain('/fan/tip');
      expect(allFanHrefs).toContain('/fan/receipts');
      expect(allFanHrefs).toContain('/account');
      expect(allFanHrefs).toContain('/fan/settings');
      expect(allFanHrefs).toContain('/fan/payment-methods');

      // Verify bottom tabs cover the 5 primary fan workflows
      const bottomTabHrefs = BOTTOM_TABS.map(t => t.href);
      expect(bottomTabHrefs).toEqual(['/fan', '/discover', '/fan/scan', '/fan/following', '/fan/payment-methods']);

      // Verify mobile hamburger button meets 44px touch target guideline
      const burgerBtn = container.querySelector('button[aria-label*="fan navigation menu"]') as HTMLElement;
      expect(burgerBtn).toBeTruthy();
      expect(burgerBtn.className).toContain('min-w-[44px]');
      expect(burgerBtn.className).toContain('min-h-[44px]');

      // Verify no unauthorized staff/admin/sponsor routes appear
      const allNavLinks = Array.from(container.querySelectorAll('a')).map(a => a.getAttribute('href'));
      expect(allNavLinks.some(h => h?.startsWith('/admin'))).toBe(false);
      expect(allNavLinks.some(h => h?.startsWith('/sponsor/settings'))).toBe(false);
      expect(allNavLinks.some(h => h?.startsWith('/venue/staff'))).toBe(false);
    });
  });
});
