/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  NearestPerformerCard,
  PopularPerformerCard,
  CampaignCard,
  PerformerPreviewModal,
  PerformerPreviewDrawer,
  type NearestPerformer,
  type PopularPerformer,
  type Campaign,
} from '../../components/landing/v3/cards';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('Landing V3 Discovery Cards & Modals', () => {
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

  describe('NearestPerformerCard', () => {
    const mockPerformer: NearestPerformer = {
      id: 'perf-1',
      performerName: 'Elena Cruz',
      photoUrl: null,
      type: 'solo',
      genres: ['Indie Folk', 'Acoustic'],
      slug: 'elena-cruz',
      venueName: 'The Fillmore',
      distanceMiles: 0.3,
      isLive: true,
      tipId: 'perf-1',
    };

    it('renders performer details, rank badge, live now indicator, and actions', () => {
      act(() => {
        root.render(
          <NearestPerformerCard performer={mockPerformer} rank={1} isSelected={false} />
        );
      });

      expect(container.textContent).toContain('Elena Cruz');
      expect(container.textContent).toContain('Solo Musician');
      expect(container.textContent).toContain('1'); // rank badge
      expect(container.textContent).toContain('Live Now');
      expect(container.textContent).toContain('The Fillmore');
      expect(container.textContent).toContain('0.3 mi away');
      expect(container.textContent).toContain('Indie Folk');
      expect(container.textContent).toContain('EC'); // initials fallback
      expect(container.textContent).toContain('View profile');
      expect(container.textContent).toContain('Tip');

      const profileLink = container.querySelector('a[href="/artist/elena-cruz"]');
      expect(profileLink).not.toBeNull();

      const tipLink = container.querySelector('a[href="/tip/perf-1"]');
      expect(tipLink).not.toBeNull();
    });

    it('hides Live Now indicator when isLive is false', () => {
      const offlinePerformer: NearestPerformer = {
        ...mockPerformer,
        isLive: false,
      };

      act(() => {
        root.render(
          <NearestPerformerCard performer={offlinePerformer} rank={2} />
        );
      });

      expect(container.textContent).not.toContain('Live Now');
    });

    it('triggers onSelect when clicked or when Enter key is pressed', () => {
      const onSelect = jest.fn();

      act(() => {
        root.render(
          <NearestPerformerCard performer={mockPerformer} rank={1} onSelect={onSelect} />
        );
      });

      const card = container.querySelector('article');
      expect(card).not.toBeNull();

      act(() => {
        card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(onSelect).toHaveBeenCalledWith(mockPerformer);

      act(() => {
        card?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      });
      expect(onSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('PopularPerformerCard', () => {
    const mockPopular: PopularPerformer = {
      id: 'pop-1',
      performerName: 'The Velvet Waves',
      photoUrl: null,
      type: 'band',
      genres: ['Alt Rock', 'Post-Punk'],
      slug: 'the-velvet-waves',
      followersCount: 2450,
      originCity: 'San Francisco, CA',
      isVerified: true,
      rank: 1,
    };

    it('renders photo fallback, verified badge, formatted followers, and profile link', () => {
      act(() => {
        root.render(<PopularPerformerCard performer={mockPopular} />);
      });

      expect(container.textContent).toContain('The Velvet Waves');
      expect(container.textContent).toContain('Band');
      expect(container.textContent).toContain('#1 Popular');
      expect(container.textContent).toContain('2.5k followers');
      expect(container.textContent).toContain('San Francisco, CA');
      expect(container.textContent).toContain('Alt Rock');
      expect(container.textContent).toContain('View profile');

      const profileLink = container.querySelector('a[href="/band/the-velvet-waves"]');
      expect(profileLink).not.toBeNull();

      const verifiedBadge = container.querySelector('[aria-label="Verified performer"]');
      expect(verifiedBadge).not.toBeNull();
    });
  });

  describe('CampaignCard', () => {
    const mockCampaign: Campaign = {
      id: 'camp-1',
      title: 'Debut Vinyl: Coastal Rain',
      creatorName: 'Pacific Echoes',
      creatorType: 'band',
      pledgedDollars: 4850,
      goalDollars: 6000,
      backersCount: 142,
      daysRemaining: 12,
      isActive: true,
      category: 'Vinyl Pressing',
    };

    it('renders campaign metrics, % funded, and Back campaign CTA', () => {
      act(() => {
        root.render(<CampaignCard campaign={mockCampaign} />);
      });

      expect(container.textContent).toContain('Debut Vinyl: Coastal Rain');
      expect(container.textContent).toContain('Pacific Echoes');
      expect(container.textContent).toContain('81% funded');
      expect(container.textContent).toContain('$4,850');
      expect(container.textContent).toContain('$6,000');
      expect(container.textContent).toContain('142');
      expect(container.textContent).toContain('12 days left');
      expect(container.textContent).toContain('Back campaign');

      const backLink = container.querySelector('a[href="/creator/campaigns"]');
      expect(backLink).not.toBeNull();
    });
  });

  describe('PerformerPreviewModal', () => {
    const mockPerformer: NearestPerformer = {
      id: 'perf-modal-1',
      performerName: 'Elena Cruz',
      type: 'solo',
      genres: ['Indie Folk'],
      venueName: 'The Fillmore',
      distanceMiles: 0.3,
      isLive: true,
      slug: 'elena-cruz',
      tipId: 'perf-modal-1',
    };

    it('does not render when isOpen is false', () => {
      act(() => {
        root.render(
          <PerformerPreviewModal isOpen={false} performer={mockPerformer} onClose={jest.fn()} />
        );
      });

      expect(container.textContent).toBe('');
    });

    it('renders performer info and closes on close button and Escape key', () => {
      const onClose = jest.fn();

      act(() => {
        root.render(
          <PerformerPreviewModal isOpen={true} performer={mockPerformer} onClose={onClose} />
        );
      });

      expect(container.textContent).toContain('Elena Cruz');
      expect(container.textContent).toContain('The Fillmore');
      expect(container.textContent).toContain('Live Now');

      const closeButton = container.querySelector('button[aria-label="Close performer preview"]');
      expect(closeButton).not.toBeNull();

      act(() => {
        closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(onClose).toHaveBeenCalledTimes(1);

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('PerformerPreviewDrawer', () => {
    const mockPerformer: NearestPerformer = {
      id: 'perf-drawer-1',
      performerName: 'The Velvet Waves',
      type: 'band',
      genres: ['Alt Rock'],
      venueName: 'Bimbo’s 365 Club',
      distanceMiles: 1.2,
      isLive: false,
      slug: 'the-velvet-waves',
    };

    it('renders drawer content and responds to dismiss', () => {
      const onClose = jest.fn();

      act(() => {
        root.render(
          <PerformerPreviewDrawer isOpen={true} performer={mockPerformer} onClose={onClose} />
        );
      });

      expect(container.textContent).toContain('The Velvet Waves');
      expect(container.textContent).toContain('Band');
      expect(container.textContent).toContain('Bimbo’s 365 Club');
      expect(container.textContent).toContain('1.2 mi away');

      const closeButton = container.querySelector('button[aria-label="Close performer preview"]');
      expect(closeButton).not.toBeNull();

      act(() => {
        closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
