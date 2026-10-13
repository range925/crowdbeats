/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useMobileDrawer } from '../../lib/hooks/useMobileDrawer';
import { ResponsiveMobileDrawer } from '../../components/navigation/ResponsiveMobileDrawer';
import { DiscoveryNav } from '../../components/discovery/DiscoveryNav';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/navigation
let mockPathname = '/';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useAuth
jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    uid: null,
    status: 'unauthenticated',
    displayName: 'Guest',
    personaType: 'fan',
    logout: jest.fn(),
  }),
}));

function TestDrawerHarness() {
  const {
    isOpen,
    close,
    triggerProps,
    drawerRef,
    closeButtonRef,
  } = useMobileDrawer({ drawerId: 'test-mobile-drawer' });

  return (
    <div>
      <button type="button" data-testid="test-hamburger-btn" {...triggerProps}>
        {isOpen ? '✕' : '☰'}
      </button>

      <ResponsiveMobileDrawer
        isOpen={isOpen}
        onClose={close}
        drawerRef={drawerRef}
        closeButtonRef={closeButtonRef}
        drawerId="test-mobile-drawer"
        title="Test Navigation Drawer"
        personaLabel="Test Persona"
        footer={<button type="button" id="drawer-footer-btn">Sign Out</button>}
      >
        <nav>
          <a href="/link1" id="drawer-link-1">Link 1</a>
          <a href="/link2" id="drawer-link-2">Link 2</a>
        </nav>
      </ResponsiveMobileDrawer>
    </div>
  );
}

describe('Phase 7: Mobile Hamburger Navigation & Accessibility (JSDOM)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    document.body.style.overflow = '';
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    document.body.style.overflow = '';
  });

  test('Hamburger trigger initially has aria-expanded="false" and references drawer ID', async () => {
    await act(async () => {
      root.render(<TestDrawerHarness />);
    });

    const button = container.querySelector('[data-testid="test-hamburger-btn"]');
    expect(button).not.toBeNull();
    expect(button?.getAttribute('aria-expanded')).toBe('false');
    expect(button?.getAttribute('aria-controls')).toBe('test-mobile-drawer');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  test('Clicking hamburger opens drawer, sets aria-expanded="true", and locks body scroll', async () => {
    await act(async () => {
      root.render(<TestDrawerHarness />);
    });

    const button = container.querySelector('[data-testid="test-hamburger-btn"]') as HTMLButtonElement;
    await act(async () => {
      button.click();
    });

    expect(button.getAttribute('aria-expanded')).toBe('true');
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('id')).toBe('test-mobile-drawer');
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('Clicking close button closes drawer and restores body scroll', async () => {
    await act(async () => {
      root.render(<TestDrawerHarness />);
    });

    const button = container.querySelector('[data-testid="test-hamburger-btn"]') as HTMLButtonElement;
    await act(async () => {
      button.click();
    });

    const closeBtn = container.querySelector('button[aria-label="Close navigation menu"]') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();

    await act(async () => {
      closeBtn.click();
    });

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.style.overflow).toBe('');
  });

  test('Pressing Escape key closes drawer', async () => {
    await act(async () => {
      root.render(<TestDrawerHarness />);
    });

    const button = container.querySelector('[data-testid="test-hamburger-btn"]') as HTMLButtonElement;
    await act(async () => {
      button.click();
    });

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
    });

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  test('DiscoveryNav integrates accessible hamburger trigger and drawer', async () => {
    await act(async () => {
      root.render(<DiscoveryNav />);
    });

    const hamburger = container.querySelector('button[aria-controls="cb-discovery-mobile-drawer"]') as HTMLButtonElement;
    expect(hamburger).not.toBeNull();
    expect(hamburger.getAttribute('aria-expanded')).toBe('false');

    await act(async () => {
      hamburger.click();
    });

    expect(hamburger.getAttribute('aria-expanded')).toBe('true');
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('Live Nearby Stages');
    expect(dialog?.textContent).toContain('Persona Previews (5 Roles)');
  });
});
