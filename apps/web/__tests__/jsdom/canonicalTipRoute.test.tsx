/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PerformerTipClientView } from '../../app/tip/[id]/PerformerTipClientView';
import * as functionsModule from '../../lib/firebase/functions';
import * as authModule from '../../lib/hooks/useAuth';
import { DiscoveryClient } from '../../lib/discovery/discoveryClient';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue(null),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardElement: () => <div data-testid="mock-card-element" />,
  PaymentRequestButtonElement: () => <div data-testid="mock-payment-request" />,
  useStripe: () => null,
  useElements: () => null,
}));

describe('Canonical Performer Tipping Route (/tip/[id]) Test Suite', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Default: unauthenticated user
    jest.spyOn(authModule, 'useAuth').mockReturnValue({
      user: null,
      status: 'unauthenticated',
      personaType: null,
      loading: false,
      error: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
    } as any);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.restoreAllMocks();
  });

  test('1. Resolves solo musician via resolvePerformerRecipient and shows details without login or location', async () => {
    const mockPerformerResponse = {
      performerId: 'artist_maya_lin',
      performerType: 'artist' as const,
      displayName: 'Maya Lin',
      slug: 'maya-lin',
      avatarUrl: 'https://cdn.crowdbeats.app/maya.jpg',
      bio: 'Soulful acoustic songwriting and live looping.',
      genres: ['Indie Folk', 'Acoustic'],
      isVerified: true,
      isLive: true,
      currentVenueName: 'The Casbah',
      canAcceptTips: true,
      canonicalTipUrl: 'https://crowdbeats.app/tip/artist_maya_lin',
    };

    jest.spyOn(functionsModule, 'callCallableFunction').mockImplementation(async (name: string, data: any) => {
      if (name === 'resolvePerformerRecipient') {
        return mockPerformerResponse as any;
      }
      throw new Error(`Unexpected function ${name}`);
    });

    await act(async () => {
      root.render(<PerformerTipClientView id="maya-lin" />);
    });

    // Performer Name
    expect(container.textContent).toContain('Maya Lin');
    // Solo Musician badge
    expect(container.textContent).toContain('Solo Musician');
    // Verified badge
    expect(container.textContent).toContain('Verified');
    // Genres
    expect(container.textContent).toContain('Indie Folk');
    // Active Venue
    expect(container.textContent).toContain('Live at The Casbah');
    // Live Now badge
    expect(container.textContent).toContain('Live Now');
    // Bio
    expect(container.textContent).toContain('Soulful acoustic songwriting');
    // Tip Presets ($5, $10, $20)
    expect(container.textContent).toContain('$5');
    expect(container.textContent).toContain('$10');
    expect(container.textContent).toContain('$20');
    // Fee disclosure
    expect(container.textContent).toContain('Crowdbeats charges a 6% platform fee');
    expect(container.textContent).toContain('No app download or location permission needed');
  });

  test('2. Resolves band performer with Band badge and genres', async () => {
    const mockBandResponse = {
      performerId: 'band_velvet_echo',
      performerType: 'band' as const,
      displayName: 'Velvet Echo',
      slug: 'velvet-echo',
      avatarUrl: 'https://cdn.crowdbeats.app/band.jpg',
      bio: 'Psychedelic surf rock trio from Southern California.',
      genres: ['Surf Rock', 'Psychedelic'],
      isVerified: true,
      isLive: false,
      canAcceptTips: true,
      canonicalTipUrl: 'https://crowdbeats.app/tip/band_velvet_echo',
    };

    jest.spyOn(functionsModule, 'callCallableFunction').mockImplementation(async (name: string) => {
      if (name === 'resolvePerformerRecipient') {
        return mockBandResponse as any;
      }
      throw new Error(`Unexpected function ${name}`);
    });

    await act(async () => {
      root.render(<PerformerTipClientView id="velvet-echo" />);
    });

    expect(container.textContent).toContain('Velvet Echo');
    expect(container.textContent).toContain('Band');
    expect(container.textContent).toContain('Surf Rock');
    expect(container.textContent).not.toContain('Live Now');
  });

  test('3. Truthfully handles ineligible/suspended performer: shows clear status and never substitutes another recipient', async () => {
    const mockIneligibleResponse = {
      performerId: 'artist_suspended',
      performerType: 'artist' as const,
      displayName: 'Former Performer',
      slug: 'former-performer',
      genres: ['Pop'],
      isVerified: false,
      isLive: false,
      canAcceptTips: false,
      eligibilityReason: 'ACCOUNT_SUSPENDED',
      canonicalTipUrl: 'https://crowdbeats.app/tip/artist_suspended',
    };

    jest.spyOn(functionsModule, 'callCallableFunction').mockImplementation(async (name: string) => {
      if (name === 'resolvePerformerRecipient') {
        return mockIneligibleResponse as any;
      }
      throw new Error('Not found');
    });

    await act(async () => {
      root.render(<PerformerTipClientView id="artist_suspended" />);
    });

    // Truthful notice
    expect(container.textContent).toContain('Former Performer');
    expect(container.textContent).toContain('This performer is not currently accepting tips');
    expect(container.textContent).toContain('ACCOUNT_SUSPENDED');
    // Does NOT render active tip amount button
    expect(container.textContent).not.toContain('Select Tip Amount');
  });

  test('4. Truthfully handles non-existent performer with Performer Unavailable state', async () => {
    jest.spyOn(functionsModule, 'callCallableFunction').mockImplementation(async () => {
      throw new Error('not-found: Performer nonexistent_user_123 not found.');
    });

    await act(async () => {
      root.render(<PerformerTipClientView id="nonexistent_user_123" />);
    });

    expect(container.textContent).toContain('Performer Unavailable');
    expect(container.textContent).toContain('nonexistent_user_123');
    expect(container.textContent).toContain('Crowdbeats never substitutes another recipient');
  });

  test('5. Unauthenticated guest: clicking tip triggers TipAuthGateModal, saves intent in sessionStorage, and redirects to /auth?returnUrl=/tip/${id}&tipCents=${amount}', async () => {
    const mockPerformerResponse = {
      performerId: 'artist_maya_lin',
      performerType: 'artist' as const,
      displayName: 'Maya Lin',
      slug: 'maya-lin',
      genres: ['Acoustic'],
      isVerified: true,
      isLive: true,
      canAcceptTips: true,
      canonicalTipUrl: 'https://crowdbeats.app/tip/artist_maya_lin',
    };

    jest.spyOn(functionsModule, 'callCallableFunction').mockImplementation(async (name: string) => {
      if (name === 'resolvePerformerRecipient') return mockPerformerResponse as any;
      throw new Error(`Unexpected function ${name}`);
    });

    await act(async () => {
      root.render(<PerformerTipClientView id="artist_maya_lin" />);
    });

    // Click Tip $10
    const tipButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Tip $10')
    );
    expect(tipButton).toBeDefined();

    await act(async () => {
      tipButton?.click();
    });

    // TipAuthGateModal should now be open
    expect(container.textContent).toContain('Sign in to tip Maya Lin');
    expect(container.textContent).toContain('You will return directly to confirm your $10 tip');

    // Click Continue with Google inside modal
    const continueBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Continue with Google')
    );
    expect(continueBtn).toBeDefined();

    await act(async () => {
      continueBtn?.click();
    });

    // Check sessionStorage preservation
    const savedTip = DiscoveryClient.getPendingTip();
    expect(savedTip).not.toBeNull();
    expect(savedTip?.creatorId).toBe('artist_maya_lin');
    expect(savedTip?.selectedTipAmountCents).toBe(1000);

    // Check redirection to auth with exact canonical returnUrl
    expect(mockPush).toHaveBeenCalledWith('/auth?returnUrl=/tip/artist_maya_lin&tipCents=1000');
  });

  test('6. Authenticated user: renders Stripe card checkout confirmation form', async () => {
    jest.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { uid: 'fan_123', email: 'fan@example.com' },
      status: 'authenticated',
      personaType: 'fan',
      loading: false,
      error: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
    } as any);

    const mockPerformerResponse = {
      performerId: 'artist_maya_lin',
      performerType: 'artist' as const,
      displayName: 'Maya Lin',
      slug: 'maya-lin',
      genres: ['Acoustic'],
      isVerified: true,
      isLive: true,
      canAcceptTips: true,
      canonicalTipUrl: 'https://crowdbeats.app/tip/artist_maya_lin',
    };

    jest.spyOn(functionsModule, 'callCallableFunction').mockImplementation(async (name: string) => {
      if (name === 'resolvePerformerRecipient') return mockPerformerResponse as any;
      throw new Error(`Unexpected function ${name}`);
    });

    await act(async () => {
      root.render(<PerformerTipClientView id="artist_maya_lin" />);
    });

    // Authenticated section is rendered
    expect(container.textContent).toContain('Confirm Tip Payment');
    expect(container.textContent).toContain('Confirm');
    expect(container.textContent).toContain('Crowdbeats charges a 6% platform fee');
  });

  test('Scenario 9: Tipping Performer A by QR preserves Performer A even when Performer B is physically closer', async () => {
    // Performer A: 10 miles away (scanned QR code)
    const mockPerformerA = {
      performerId: 'artist_a',
      performerType: 'artist' as const,
      displayName: 'Performer A Acoustic',
      slug: 'performer-a',
      genres: ['Acoustic'],
      isVerified: true,
      isLive: true,
      canAcceptTips: true,
      canonicalTipUrl: 'https://crowdbeats.app/tip/artist_a',
    };

    const resolveSpy = jest.spyOn(functionsModule, 'callCallableFunction').mockImplementation(async (name: string, data: any) => {
      if (name === 'resolvePerformerRecipient') {
        expect(data.identifier || data.performerId).toBe('artist_a');
        return mockPerformerA as any;
      }
      throw new Error(`Unexpected function ${name}`);
    });

    await act(async () => {
      root.render(<PerformerTipClientView id="artist_a" />);
    });

    // Performer A is rendered directly
    expect(container.textContent).toContain('Performer A Acoustic');
    expect(resolveSpy).toHaveBeenCalledWith('resolvePerformerRecipient', {
      identifier: 'artist_a',
    });
    // Never substitutes Performer B
    expect(container.textContent).not.toContain('Performer B');
  });

  test('Scenario 13: Changing a performer display name preserves existing QR destination and immutable performer ID', async () => {
    // Performer originally known as 'Old Name' updated to 'Renamed Artist Extraordinaire'
    const mockRenamedPerformer = {
      performerId: 'artist_immutable_123',
      performerType: 'artist' as const,
      displayName: 'Renamed Artist Extraordinaire',
      slug: 'renamed-artist',
      genres: ['Indie Rock'],
      isVerified: true,
      isLive: false,
      canAcceptTips: true,
      canonicalTipUrl: 'https://crowdbeats.app/tip/artist_immutable_123',
    };

    jest.spyOn(functionsModule, 'callCallableFunction').mockImplementation(async (name: string) => {
      if (name === 'resolvePerformerRecipient') return mockRenamedPerformer as any;
      throw new Error(`Unexpected function ${name}`);
    });

    // Fan scans physical QR printed months ago with immutable ID
    await act(async () => {
      root.render(<PerformerTipClientView id="artist_immutable_123" />);
    });

    // Displays the updated name while preserving immutable routing
    expect(container.textContent).toContain('Renamed Artist Extraordinaire');
    expect(container.textContent).toContain('Select Tip Amount');
  });
});
