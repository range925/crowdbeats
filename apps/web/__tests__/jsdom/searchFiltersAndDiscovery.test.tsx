/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import SponsorDiscoveryPage from '../../app/(sponsor)/sponsor/discovery/page';
import * as sponsorCrmModule from '@/lib/sponsor/sponsorCrm';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/sponsor/discovery',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useAuth
jest.mock('@/lib/hooks/useAuth', () => ({
  useOptionalAuth: () => ({
    user: { orgId: 'org_redbull' },
    status: 'authenticated',
  }),
}));

// Mock useSponsorShortlist
const mockAdd = jest.fn();
const mockRemove = jest.fn();

jest.mock('@/lib/sponsor/sponsorCrm', () => ({
  useSponsorShortlist: () => ({
    items: [{ recipientId: 't1', recipientName: 'The Lunar Waves' }],
    add: mockAdd,
    remove: mockRemove,
  }),
}));

describe('Phase 13: Search, Filters & Discovery Standardization', () => {
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

  it('renders SponsorDiscoveryPage with responsive table container and minWidth', () => {
    act(() => {
      root.render(<SponsorDiscoveryPage />);
    });

    const wrap = container.querySelector('.cb-table-wrap') as HTMLElement;
    expect(wrap).not.toBeNull();

    const table = container.querySelector('table') as HTMLTableElement;
    expect(table).not.toBeNull();
    expect(table.style.minWidth).toBe('700px');

    expect(container.textContent).toContain('Talent Discovery & Comparison');
    expect(container.textContent).toContain('The Lunar Waves');
    expect(container.textContent).toContain('Elena Cruz');
    expect(container.textContent).toContain('Neon Velvet');
  });

  it('filters talent directory by genre in SponsorDiscoveryPage', () => {
    act(() => {
      root.render(<SponsorDiscoveryPage />);
    });

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).not.toBeNull();

    act(() => {
      select.value = 'Acoustic';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Should only contain Elena Cruz (Acoustic / Folk)
    expect(container.textContent).toContain('Elena Cruz');
    expect(container.textContent).not.toContain('The Lunar Waves');
    expect(container.textContent).not.toContain('Neon Velvet');
  });

  it('filters talent directory by search query in SponsorDiscoveryPage', () => {
    act(() => {
      root.render(<SponsorDiscoveryPage />);
    });

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).not.toBeNull();

    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set?.call(input, 'Austin');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Austin matches Elena Cruz
    expect(container.textContent).toContain('Elena Cruz');
    expect(container.textContent).not.toContain('The Lunar Waves');
  });

  it('triggers shortlist toggle action when clicking save button', () => {
    act(() => {
      root.render(<SponsorDiscoveryPage />);
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const savedButton = buttons.find((b) => b.textContent?.includes('★ Saved'));
    expect(savedButton).not.toBeUndefined();

    act(() => {
      savedButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mockRemove).toHaveBeenCalledWith('t1');
  });
});
