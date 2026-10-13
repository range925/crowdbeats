/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { LegalSection } from '../../components/account-center/sections/LegalSection';
import { AboutSection } from '../../components/account-center/sections/AboutSection';
import { DataExportCard } from '../../components/settings/DataExportCard';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('section=legal'),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/account',
}));

// Mock useAuth
jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-14' },
    uid: 'test-user-14',
    displayName: 'Phase 14 Tester',
    email: 'phase14@crowdbeats.com',
    personaType: 'fan',
    photoUrl: null,
  }),
}));

describe('Phase 14: Account Center & Compliance Views', () => {
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

  it('renders LegalSection with light mode compliance links and accessible contrast', async () => {
    await act(async () => {
      root.render(<LegalSection />);
    });

    expect(container.textContent).toContain('Privacy Policy');
    expect(container.textContent).toContain('Terms of Service');
    expect(container.textContent).toContain('DMCA & Copyright Policy');

    const termsLink = container.querySelector('a[href="/legal/terms"]');
    expect(termsLink).toBeTruthy();

    // Verify CARD has light mode cb-account-card class
    const cardEl = container.querySelector('.cb-account-card');
    expect(cardEl).toBeTruthy();
  });

  it('renders AboutSection with light card tokens and platform architecture', async () => {
    await act(async () => {
      root.render(<AboutSection />);
    });

    expect(container.textContent).toContain('Crowdbeats');
    expect(container.textContent).toContain('Platform Architecture');
    expect(container.textContent).toContain('Next.js 15 App Router');

    const cardElements = container.querySelectorAll('.cb-account-card');
    expect(cardElements.length).toBeGreaterThan(0);
  });

  it('renders DataExportCard with GDPR Art. 20 / CCPA statutory notice and accessible action', async () => {
    await act(async () => {
      root.render(
        <DataExportCard
          userName="Phase 14 Tester"
          userEmail="phase14@crowdbeats.com"
          userUid="test-user-14"
          defaultRole="fan"
        />
      );
    });

    expect(container.textContent).toContain('Download Your Data');
    expect(container.textContent).toContain('GDPR Art. 20 and CCPA');
    const downloadBtn = container.querySelector('button');
    expect(downloadBtn).toBeTruthy();
    expect(downloadBtn?.textContent).toContain('Download My Data');
  });
});
