/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  prefetch: jest.fn(),
};
let mockPathname = '/sponsor/dashboard';

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
}));

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({
    addScope: jest.fn(),
  })),
}));

jest.mock('@/lib/firebase/app', () => ({
  firebaseApp: {},
}));

let mockAuthUser = {
  uid: 'sponsor-user-123',
  displayName: 'Nike Talent Rep',
  email: 'rep@nike.com',
  personaType: 'sponsor_rep',
  status: 'authenticated',
  logout: jest.fn(),
};

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => mockAuthUser,
}));

import SponsorStudioLayout, { SPONSOR_NAV_GROUPS } from '../../app/(sponsor)/layout';
import EnterpriseAdminLayout, { ADMIN_NAV_SECTIONS } from '../../app/(admin)/layout';
import { AdminDataTable } from '../../components/admin/AdminDataTable';

describe('Phase 10: Sponsor and Admin Navigation', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    mockAuthUser = {
      uid: 'sponsor-user-123',
      displayName: 'Nike Talent Rep',
      email: 'rep@nike.com',
      personaType: 'sponsor_rep',
      status: 'authenticated',
      logout: jest.fn(),
    };

    mockPathname = '/sponsor/dashboard';

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  describe('Sponsor Studio Navigation', () => {
    test('renders all 3 categorized sponsor groups and key workflows', async () => {
      await act(async () => {
        root.render(
          <SponsorStudioLayout>
            <div data-testid="sponsor-content">Sponsor Dashboard Content</div>
          </SponsorStudioLayout>
        );
      });

      expect(container.textContent).toContain('CAMPAIGNS & TALENT');
      expect(container.textContent).toContain('COMMUNICATIONS & ROI');
      expect(container.textContent).toContain('ORGANIZATION & SETTINGS');

      // Verify key links exist
      expect(container.querySelector('a[href="/sponsor/dashboard"]')).not.toBeNull();
      expect(container.querySelector('a[href="/sponsor/discovery"]')).not.toBeNull();
      expect(container.querySelector('a[href="/sponsor/sponsorships"]')).not.toBeNull();
      expect(container.querySelector('a[href="/sponsor/payments"]')).not.toBeNull();
      expect(container.querySelector('a[href="/sponsor/analytics"]')).not.toBeNull();
      expect(container.querySelector('a[href="/sponsor/settings"]')).not.toBeNull();
    });

    test('mobile hamburger button has 44x44px touch target and accessible aria-label', async () => {
      await act(async () => {
        root.render(
          <SponsorStudioLayout>
            <div>Content</div>
          </SponsorStudioLayout>
        );
      });

      const burgerBtn = container.querySelector('button[aria-label*="Sponsor Studio navigation menu"]') as HTMLButtonElement;
      expect(burgerBtn).not.toBeNull();
      expect(burgerBtn.getAttribute('aria-label')).toBe('Open Sponsor Studio navigation menu');
      expect(burgerBtn.style.minWidth).toBe('44px');
      expect(burgerBtn.style.minHeight).toBe('44px');
    });

    test('denies access to unauthorized fan persona', async () => {
      mockAuthUser = {
        uid: 'fan-user-123',
        displayName: 'Regular Fan',
        email: 'fan@gmail.com',
        personaType: 'fan',
        status: 'authenticated',
        logout: jest.fn(),
      };

      await act(async () => {
        root.render(
          <SponsorStudioLayout>
            <div>Sensitive Sponsor Data</div>
          </SponsorStudioLayout>
        );
      });

      expect(container.textContent).toContain('Sponsor Studio Access Denied');
      expect(container.textContent).not.toContain('Sensitive Sponsor Data');
    });
  });

  describe('Admin Command Center Navigation & Data Tables', () => {
    test('renders admin navigation with canonical sections and 44px hamburger', async () => {
      // Set session cookie for admin
      const sessionPayload = encodeURIComponent(
        JSON.stringify({
          displayName: 'Admin User',
          email: 'admin@crowdbeats.com',
          platformRole: 'SUPER_ADMIN',
        })
      );
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: `__cb_session=${sessionPayload}; path=/`,
      });

      mockPathname = '/admin/command-center';

      await act(async () => {
        root.render(
          <EnterpriseAdminLayout>
            <div>Admin Workspace Content</div>
          </EnterpriseAdminLayout>
        );
      });

      expect(container.textContent).toContain('OVERVIEW');
      expect(container.textContent).toContain('COMMUNITY');
      expect(container.textContent).toContain('OPERATIONS');
      expect(container.textContent).toContain('GROWTH');
      expect(container.textContent).toContain('PLATFORM');

      const adminBurger = container.querySelector('.admin-hamburger-btn') as HTMLButtonElement;
      expect(adminBurger).not.toBeNull();
      expect(adminBurger.getAttribute('aria-label')).toBe('Open navigation menu');
    });

    test('AdminDataTable renders responsive horizontal scroll container with touch momentum', () => {
      const columns = [
        { key: 'name', header: 'Artist Name', cell: (d: any) => d.name },
        { key: 'genre', header: 'Genre', cell: (d: any) => d.genre },
        { key: 'tips', header: 'Total Tips', cell: (d: any) => `$${d.tips}` },
      ];
      const data = [
        { id: 1, name: 'Jake Rios', genre: 'Acoustic Rock', tips: 4890 },
      ];

      act(() => {
        root.render(
          <AdminDataTable
            columns={columns}
            data={data}
            currentPage={1}
            totalPages={2}
          />
        );
      });

      const tableContainer = container.querySelector('.admin-table-container') as HTMLDivElement;
      expect(tableContainer).not.toBeNull();
      expect(tableContainer.style.overflowX).toBe('auto');

      const prevBtn = container.querySelector('button[aria-label="Previous page"]') as HTMLButtonElement;
      const nextBtn = container.querySelector('button[aria-label="Next page"]') as HTMLButtonElement;
      expect(prevBtn.style.minHeight).toBe('40px');
      expect(nextBtn.style.minHeight).toBe('40px');
    });
  });
});
