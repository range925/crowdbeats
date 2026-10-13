/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ArtistProfileClientView } from '../../app/artist/[slug]/ArtistProfileClientView';
import { BandProfileClientView } from '../../app/band/[slug]/BandProfileClientView';
import { AudioPreviewPlayer } from '../../components/discovery/AudioPreviewPlayer';
import { TipAuthGateModal } from '../../components/discovery/TipAuthGateModal';
import { PublicPerformerItem } from '../../lib/discovery/discoveryClient';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/artist/jake-rios',
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

const mockArtist: PublicPerformerItem = {
  id: 'art_123',
  slug: 'jake-rios',
  name: 'Jake Rios',
  type: 'artist',
  bio: 'Indie acoustic singer-songwriter touring coastal stages.',
  genres: ['Acoustic', 'Indie Folk'],
  tagline: 'Raw acoustic melodies and honest storytelling',
  originCity: 'San Diego, CA',
  isVerified: true,
  isLive: true,
  currentVenueName: 'The Ocean Lounge',
  distanceMiles: 0.5,
  latitude: 32.7157,
  longitude: -117.1611,
  popularityScore: 90,
  followersCount: 3420,
  featuredTrackTitle: 'Pacific Coast Highway (Live)',
  audioPreviewUrl: 'https://example.com/demo.mp3',
  accolades: ['Top Local Artist 2025', 'NPR Tiny Desk Contestant'],
  instruments: ['Acoustic Guitar', 'Harmonica'],
  influences: ['Bob Dylan', 'Gregory Alan Isakov'],
};

const mockBand: PublicPerformerItem = {
  id: 'band_456',
  slug: 'the-sunsets',
  name: 'The Sunsets',
  type: 'band',
  bio: 'High energy 4-piece surf rock band based in Ocean Beach.',
  genres: ['Surf Rock', 'Garage Indie'],
  tagline: 'Sun-drenched reverbs and fuzz guitars',
  originCity: 'Ocean Beach, CA',
  isVerified: true,
  isLive: true,
  currentVenueName: 'The Main Stage',
  distanceMiles: 1.2,
  latitude: 32.7157,
  longitude: -117.1611,
  popularityScore: 92,
  followersCount: 5600,
  featuredTrackTitle: 'Endless Wave (Studio Cut)',
  accolades: ['San Diego Music Awards Nominee'],
  rosterPreview: [
    { name: 'Kai Jensen', role: 'Lead Guitar', instrument: 'Fender Stratocaster' },
    { name: 'Milo Vance', role: 'Drums', instrument: 'Ludwig Classic' },
    { name: 'Leo Cruz', role: 'Bass', instrument: 'Fender Precision Bass' },
  ],
  recentTippers: [
    {
      id: 'tip_1',
      fanName: 'Alex Rivers',
      timeAgo: '12m ago',
      amountFormatted: '$20.00',
      message: 'Killer sound on the main stage!',
    },
  ],
};

describe('Phase 12: Public Persona & Profile Pages Standardization', () => {
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

  it('renders ArtistProfileClientView with responsive layout and light mode cards', () => {
    act(() => {
      root.render(<ArtistProfileClientView performer={mockArtist} />);
    });

    const layout = container.querySelector('.cb-profile-layout');
    expect(layout).not.toBeNull();

    const cards = container.querySelectorAll('.cb-profile-card');
    expect(cards.length).toBeGreaterThanOrEqual(3);

    expect(container.textContent).toContain('Jake Rios');
    expect(container.textContent).toContain('Pacific Coast Highway (Live)');
    expect(container.textContent).toContain('The Ocean Lounge');
  });

  it('renders BandProfileClientView with band lineup and split transparency notice', () => {
    act(() => {
      root.render(<BandProfileClientView performer={mockBand} />);
    });

    const layout = container.querySelector('.cb-profile-layout');
    expect(layout).not.toBeNull();

    expect(container.textContent).toContain('The Sunsets');
    expect(container.textContent).toContain('Kai Jensen');
    expect(container.textContent).toContain('Lead Guitar');
    expect(container.textContent).toContain('Split automatically across all 4 members');
  });

  it('renders AudioPreviewPlayer with accessible 44px play button and light theme tokens', () => {
    act(() => {
      root.render(
        <AudioPreviewPlayer
          title="Summer Nights"
          artistName="The Sunsets"
          durationText="0:45 Preview"
        />
      );
    });

    const playButton = container.querySelector('button') as HTMLButtonElement;
    expect(playButton).not.toBeNull();
    expect(playButton.getAttribute('aria-label')).toContain('Play preview of Summer Nights');
    expect(playButton.style.width).toBe('44px');
    expect(playButton.style.height).toBe('44px');
  });

  it('renders TipAuthGateModal in light mode with clear fee transparency breakdown', () => {
    act(() => {
      root.render(
        <TipAuthGateModal
          isOpen={true}
          onClose={jest.fn()}
          performerId="art_123"
          performerSlug="jake-rios"
          performerName="Jake Rios"
          performerType="artist"
          initialAmountCents={2000}
        />
      );
    });

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();

    expect(container.textContent).toContain('Sign in to tip Jake Rios');
    expect(container.textContent).toContain('Crowdbeats Platform Fee (6%)');
    expect(container.textContent).toContain('Stripe Processing & Connect Fees');
    expect(container.textContent).toContain('Est. Jake Rios Net Proceeds');
  });
});
