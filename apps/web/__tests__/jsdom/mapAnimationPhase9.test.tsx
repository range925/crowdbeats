/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

// Configure React act environment
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import {
  AnimatedPerformerMarker,
  WebPublicPerformer,
} from '../../components/maps/AnimatedPerformerMarker';
import { CreatorMapPreview } from '../../components/creator/CreatorMapPreview';
import { CreatorCrowdRadar } from '../../components/creator/CreatorCrowdRadar';

describe('Phase 9 — Map Animation & Feedback Component Tests (JSDOM)', () => {
  let container: HTMLDivElement;
  let root: Root;

  const venuePerformer: WebPublicPerformer = {
    id: 'perf_band_1',
    name: 'The Gaslamp Trio',
    type: 'band',
    isLive: true,
    isStationary: true,
    venueName: 'Gaslamp Theatre',
    lastUpdatedMs: Date.now() - 20_000,
    coord: { lat: 32.7157, lng: -117.1611 },
  };

  const mobilePerformer: WebPublicPerformer = {
    id: 'perf_solo_1',
    name: 'Wanderer Solo',
    type: 'artist',
    isLive: true,
    isStationary: false,
    lastUpdatedMs: Date.now() - 30_000,
    coord: { lat: 32.712, lng: -117.158 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('1. AnimatedPerformerMarker', () => {
    it('renders band performer with guitar icon and stationary anchor', () => {
      act(() => {
        root.render(<AnimatedPerformerMarker performer={venuePerformer} />);
      });

      expect(container.textContent).toContain('The Gaslamp Trio');
      expect(container.textContent).toContain('🎸');
      expect(container.querySelector('[data-testid="freshness-badge"]')?.textContent).toMatch(/Live/i);
      expect(container.querySelector('[data-testid="stationary-anchor"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="marker-breathing-halo"]')).not.toBeNull();
    });

    it('renders mobile performer with bear icon and coarse tip', () => {
      act(() => {
        root.render(<AnimatedPerformerMarker performer={mobilePerformer} />);
      });

      expect(container.textContent).toContain('Wanderer Solo');
      expect(container.textContent).toContain('🐻');
      expect(container.querySelector('[data-testid="freshness-badge"]')?.textContent).toMatch(/Approximate/i);
      expect(container.querySelector('[data-testid="coarse-centroid-tip"]')).not.toBeNull();
    });

    it('handles marker click correctly', () => {
      const handleClick = jest.fn();
      act(() => {
        root.render(<AnimatedPerformerMarker performer={venuePerformer} onClick={handleClick} />);
      });

      const button = container.querySelector('[role="button"]') as HTMLElement;
      expect(button).not.toBeNull();
      act(() => {
        button.click();
      });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. CreatorMapPreview ("What Fans See")', () => {
    it('renders stationary venue preview with truthful privacy disclosure', () => {
      act(() => {
        root.render(<CreatorMapPreview performer={venuePerformer} />);
      });

      expect(container.textContent).toContain('What Fans See');
      expect(container.textContent).toContain('🏛️ Verified Venue Pin (Anchored)');
      expect(container.textContent).toContain('Stationary session: Locked to Gaslamp Theatre');
    });

    it('renders mobile coarse preview with approximate area disclosure', () => {
      act(() => {
        root.render(<CreatorMapPreview performer={mobilePerformer} />);
      });

      expect(container.textContent).toContain('📍 100m Coarse Area Centroid');
      expect(container.textContent).toContain('Mobile session: Broadcast as an approximate 100m grid centroid');
    });
  });

  describe('3. CreatorCrowdRadar Soft Heat Halos & Segregation', () => {
    it('renders radar canvas with soft halos for aggregate zones meeting k >= 5', () => {
      act(() => {
        root.render(
          <CreatorCrowdRadar
            isLive={true}
            role="artist"
            sessionId="sess_gaslamp_live"
            performerName="Sarah Key"
          />
        );
      });

      // Radar Canvas & What Fans See Preview
      expect(container.querySelector('[data-testid="creator-radar-canvas"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="creator-map-preview-card"]')).not.toBeNull();

      // Soft Halos with Count Bands
      expect(container.querySelector('[data-testid="radar-halo-zone_front"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="radar-halo-zone_patio"]')).not.toBeNull();
      expect(container.textContent).toContain('[15+] supporters');
      expect(container.textContent).toContain('Min 5 fans/zone');

      // Suppresses raw individual counts
      expect(container.textContent).not.toContain('18 supporters');
      expect(container.textContent).not.toContain('8 supporters');

      // Consented Individual Supporters
      expect(container.textContent).toContain('Visible Supporters Nearby');
      expect(container.textContent).toContain('Sarah K.');
      expect(container.textContent).toContain('Marcus V.');

      // Tipping Independence Disclosure
      expect(container.textContent).toContain('Completed tips produce zero visual location pins');
    });
  });
});
