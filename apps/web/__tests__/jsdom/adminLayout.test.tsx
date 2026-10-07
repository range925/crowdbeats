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
let mockPathname = '/admin/command-center';

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
}));

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Trigger callback immediately with null so fallback cookie is checked
    callback(null);
    return () => {};
  }),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({
    addScope: jest.fn(),
  })),
}));

// Mock firebaseApp
jest.mock('@/lib/firebase/app', () => ({
  firebaseApp: {},
}));

import EnterpriseAdminLayout from '../../app/(admin)/layout';

describe('Enterprise Admin Layout (JSDOM)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Set mock session cookie with SUPER_ADMIN role
    const sessionPayload = encodeURIComponent(
      JSON.stringify({
        displayName: 'Sarah Connor',
        email: 'sarah.connor@crowdbeats.com',
        platformRole: 'SUPER_ADMIN',
      })
    );
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: `__cb_session=${sessionPayload}; path=/`,
    });

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

  test('renders enterprise administration shell with zero emojis and 6 canonical sections', async () => {
    await act(async () => {
      root.render(
        <EnterpriseAdminLayout>
          <div data-testid="test-child">Child Workspace Content</div>
        </EnterpriseAdminLayout>
      );
    });

    // Verify Child content rendered
    expect(container.querySelector('[data-testid="test-child"]')).not.toBeNull();
    expect(container.textContent).toContain('Child Workspace Content');

    // 1. Verify Brand Header
    expect(container.textContent).toContain('CROWDBEATS');
    expect(container.textContent).toContain('CONTROL PLANE');

    // 2. Verify all 5 Grouped Navigation Sections
    expect(container.textContent).toContain('OVERVIEW');
    expect(container.textContent).toContain('COMMUNITY');
    expect(container.textContent).toContain('OPERATIONS');
    expect(container.textContent).toContain('GROWTH');
    expect(container.textContent).toContain('PLATFORM');

    // 3. Verify All 14 Canonical Section Navigation Items
    expect(container.textContent).toContain('Command Center');
    expect(container.textContent).toContain('Users & Accounts');
    expect(container.textContent).toContain('Discovery & Live Map');
    expect(container.textContent).toContain('Musicians & Bands');
    expect(container.textContent).toContain('Campaigns');
    expect(container.textContent).toContain('Sponsors');
    expect(container.textContent).toContain('Payments & Finance');
    expect(container.textContent).toContain('Trust & Safety');
    expect(container.textContent).toContain('Support');
    expect(container.textContent).toContain('Content & Communications');
    expect(container.textContent).toContain('Analytics & Reports');
    expect(container.textContent).toContain('System Health & Integrations');
    expect(container.textContent).toContain('Security & Audit');
    expect(container.textContent).toContain('Settings & Admin Access');

    // 4. Verify Zero-Emoji Invariant: check entire textContent for Unicode emojis
    const emojiRegex = /\p{Extended_Pictographic}/u;
    const allText = container.textContent || '';
    expect(emojiRegex.test(allText)).toBe(false);

    // 5. Verify Outline SVGs are used extensively
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(15);

    // 6. Verify User Tray and Initials
    expect(container.textContent).toContain('Sarah Connor');
    expect(container.textContent).toContain('sarah.connor@crowdbeats.com');
    expect(container.textContent).toContain('SC'); // Initials
    expect(container.textContent).toContain('Production Environment');
    expect(container.textContent).toContain('Sign Out');

    // 7. Verify Topbar Elements
    expect(container.textContent).toContain('Live Operations');
    expect(container.textContent).toContain('SUPER ADMIN');

    // 8. Verify Theme Switcher
    const themeButtons = container.querySelectorAll('.admin-theme-btn');
    expect(themeButtons.length).toBe(3); // System, Light, Dark
  });

  test('quick search filters navigation items dynamically', async () => {
    await act(async () => {
      root.render(
        <EnterpriseAdminLayout>
          <div>Search Test</div>
        </EnterpriseAdminLayout>
      );
    });

    const searchInput = container.querySelector('input[placeholder="Search navigation..."]') as HTMLInputElement;
    expect(searchInput).not.toBeNull();

    // Type "Finance"
    await act(async () => {
      searchInput.value = 'Finance';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      // Also fire change for React state
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(searchInput, 'Finance');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(container.textContent).toContain('Payments & Finance');
  });
});
