/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import CreatorMarketingPage from '../../app/(creator)/creator/marketing/page';
import BandMarketingPage from '../../app/(band)/band/marketing/page';
import * as authModule from '../../lib/hooks/useAuth';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockImplementation((url: string) => {
    return Promise.resolve(`data:image/png;base64,mockQrFor_${encodeURIComponent(url)}`);
  }),
}));

describe('Creator & Band Marketing Persistent QR Generation Test Suite', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.restoreAllMocks();
  });

  test('CreatorMarketingPage displays canonical URL, download button, copy button, and immutable ID copy', async () => {
    jest.spyOn(authModule, 'useAuth').mockReturnValue({
      uid: 'musician_carlos_reyes',
      displayName: 'Carlos Reyes',
      user: { uid: 'musician_carlos_reyes' },
      status: 'authenticated',
      personaType: 'artist',
      loading: false,
      error: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
    } as any);

    await act(async () => {
      root.render(<CreatorMarketingPage />);
    });

    // Check heading
    expect(container.textContent).toContain('Direct Tipping QR Code & Links');

    // Check prominent copy
    expect(container.textContent).toContain('Share your QR code so fans can open your tipping page directly.');
    expect(container.textContent).toContain(
      'Your tipping QR code is permanent and tied to your immutable performer account'
    );
    expect(container.textContent).toContain('musician_carlos_reyes');

    // Check canonical URL input
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('https://crowdbeats.app/tip/musician_carlos_reyes');

    // Check action buttons
    expect(container.textContent).toContain('Copy Direct Tip Link');
    expect(container.textContent).toContain('Download QR Code');

    // Check distinction between permanent QR and 90-second live stage QR
    expect(container.textContent).toContain('Permanent Direct QR');
    expect(container.textContent).toContain('90-Second Dynamic Live Stage QR');
  });

  test('BandMarketingPage displays canonical URL, download button, copy button, and collective entity Stripe Connect copy', async () => {
    jest.spyOn(authModule, 'useAuth').mockReturnValue({
      uid: 'band_founder_123',
      displayName: 'The Sunsets',
      user: { uid: 'band_founder_123' },
      status: 'authenticated',
      personaType: 'band_member',
      loading: false,
      error: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
    } as any);

    localStorage.setItem(
      'cb_band_epk',
      JSON.stringify({
        bandId: 'bnd_the_sunsets',
        name: 'The Sunsets',
      })
    );

    await act(async () => {
      root.render(<BandMarketingPage />);
    });

    // Check heading
    expect(container.textContent).toContain('Direct Tipping QR Code & Links');

    // Check copy
    expect(container.textContent).toContain('Share your QR code so fans can open your band\'s tipping page directly.');
    expect(container.textContent).toContain('Collective Band Entity & Stripe Connect');
    expect(container.textContent).toContain('Tips received via this link and QR code route directly to the collective Band entity via Stripe Connect.');
    expect(container.textContent).toContain('Your band tipping QR code is permanent and tied to your immutable band identifier');
    expect(container.textContent).toContain('bnd_the_sunsets');

    // Check canonical URL input
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('https://crowdbeats.app/tip/bnd_the_sunsets');

    // Check action buttons
    expect(container.textContent).toContain('Copy Direct Tip Link');
    expect(container.textContent).toContain('Download QR Code');

    // Check distinction
    expect(container.textContent).toContain('Permanent Band Tip QR');
    expect(container.textContent).toContain('90-Second Dynamic Live Stage QR');
  });

  test('Scenario 13: Changing a performer display name preserves existing QR destination and immutable performer ID', async () => {
    // Stage name changes from 'Carlos Reyes' to 'Carlos Reyes & The Latin Groove'
    jest.spyOn(authModule, 'useAuth').mockReturnValue({
      uid: 'musician_carlos_reyes',
      displayName: 'Carlos Reyes & The Latin Groove',
      user: { uid: 'musician_carlos_reyes' },
      status: 'authenticated',
      personaType: 'artist',
      loading: false,
      error: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
    } as any);

    await act(async () => {
      root.render(<CreatorMarketingPage />);
    });

    // The canonical tip URL and immutable ID are strictly preserved
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input.value).toBe('https://crowdbeats.app/tip/musician_carlos_reyes');
    expect(container.textContent).toContain('musician_carlos_reyes');
    expect(container.textContent).toContain('Even if you change your stage name, fans will always reach your tipping page directly.');
  });
});
