/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { CbInput } from '../../components/ui/Input';
import { AccountCenterSearch } from '../../components/account-center/AccountCenterSearch';
import { DiscoveryNav } from '../../components/discovery/DiscoveryNav';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
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

describe('Phase 10: Touch Targets and Form Inputs Standardization', () => {
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

  describe('CbInput Component & Form Accessibility', () => {
    it('renders input with correct label association and accessible hint', () => {
      act(() => {
        root.render(
          <CbInput
            label="Stage Name"
            hint="Your public performer name"
            placeholder="e.g. Austin Neon"
            id="stage-name-input"
          />
        );
      });

      const label = container.querySelector('label[for="stage-name-input"]');
      expect(label).toBeTruthy();
      expect(label?.textContent).toBe('Stage Name');

      const input = container.querySelector('#stage-name-input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.placeholder).toBe('e.g. Austin Neon');

      const hint = container.querySelector('#stage-name-input-hint');
      expect(hint?.textContent).toBe('Your public performer name');
    });

    it('displays error message with role="alert" and sets aria-invalid="true"', () => {
      act(() => {
        root.render(
          <CbInput
            label="Email Address"
            errorText="Please enter a valid email address"
            id="email-input"
          />
        );
      });

      const input = container.querySelector('#email-input') as HTMLInputElement;
      expect(input.getAttribute('aria-invalid')).toBe('true');

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
      expect(alert?.textContent).toContain('Please enter a valid email address');
    });

    it('supports disabled state cleanly', () => {
      act(() => {
        root.render(
          <CbInput
            label="Locked Identifier"
            disabled
            value="cb_usr_12345"
            id="locked-input"
          />
        );
      });

      const input = container.querySelector('#locked-input') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });
  });

  describe('Discovery Navigation Touch Targets', () => {
    it('renders mobile menu trigger with min-width and min-height of at least 44px', () => {
      act(() => {
        root.render(<DiscoveryNav />);
      });

      const trigger = container.querySelector('button[aria-controls="cb-discovery-mobile-drawer"]') as HTMLButtonElement;
      expect(trigger).toBeTruthy();
      expect(trigger.className).toContain('cb-touch-target');
      expect(trigger.style.minWidth).toBe('44px');
      expect(trigger.style.minHeight).toBe('44px');
    });
  });

  describe('Account Center Search Input & Touch Targets', () => {
    it('renders search input with combobox role and aria-label', () => {
      const onResultClick = jest.fn();
      act(() => {
        root.render(<AccountCenterSearch onResultClick={onResultClick} />);
      });

      const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement;
      expect(searchInput).toBeTruthy();
      expect(searchInput.getAttribute('role')).toBe('combobox');
      expect(searchInput.getAttribute('aria-label')).toBe('Search settings');
    });

    it('filters settings and selects an option with accessible touch target', () => {
      const onResultClick = jest.fn();
      act(() => {
        root.render(<AccountCenterSearch onResultClick={onResultClick} />);
      });

      const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement;
      act(() => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        nativeInputValueSetter?.call(searchInput, 'password');
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      const options = container.querySelectorAll('[role="option"]');
      expect(options.length).toBeGreaterThan(0);

      const firstOption = options[0] as HTMLButtonElement;
      expect(firstOption.style.minHeight).toBe('44px');

      act(() => {
        firstOption.click();
      });

      expect(onResultClick).toHaveBeenCalled();
    });
  });
});
