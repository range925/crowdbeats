/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  DiscoverMap,
  getContextAwareZoom,
  MAP_STYLE_LIGHT,
  MAP_STYLE_DARK,
} from '../../components/landing/v3/DiscoverMap';
import type { LiveCheckin } from '@/lib/firebase/firestore';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock Google Maps JavaScript API
class MockLatLng {
  private _lat: number;
  private _lng: number;
  constructor(lat: number, lng: number) {
    this._lat = lat;
    this._lng = lng;
  }
  lat() {
    return this._lat;
  }
  lng() {
    return this._lng;
  }
}

class MockMap {
  center: MockLatLng;
  zoom: number;
  options: any;
  listeners: Record<string, Function[]> = {};

  constructor(element: HTMLElement, options: any) {
    this.center = new MockLatLng(options.center.lat, options.center.lng);
    this.zoom = options.zoom || 12;
    this.options = options;
  }

  setCenter(pos: { lat: number; lng: number }) {
    this.center = new MockLatLng(pos.lat, pos.lng);
  }
  getCenter() {
    return this.center;
  }
  setZoom(z: number) {
    this.zoom = z;
    this.trigger('zoom_changed');
  }
  getZoom() {
    return this.zoom;
  }
  setOptions(opts: any) {
    this.options = { ...this.options, ...opts };
  }
  panTo(pos: { lat: number; lng: number }) {
    this.setCenter(pos);
  }
  addListener(event: string, handler: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
    return {
      remove: () => {
        this.listeners[event] = this.listeners[event]?.filter((h) => h !== handler);
      },
    };
  }
  trigger(event: string, ...args: any[]) {
    this.listeners[event]?.forEach((h) => h(...args));
  }
}

class MockOverlayView {
  panes: any;
  projection: any;
  map: any = null;

  constructor() {
    const overlayMouseTarget = document.createElement('div');
    overlayMouseTarget.id = 'overlay-mouse-target';
    document.body.appendChild(overlayMouseTarget);
    this.panes = { overlayMouseTarget };
    this.projection = {
      fromLatLngToDivPixel: (latLng: any) => ({
        x: Math.round(latLng.lng() * 10),
        y: Math.round(latLng.lat() * 10),
      }),
    };
  }

  getPanes() {
    return this.panes;
  }
  getProjection() {
    return this.projection;
  }
  setMap(map: any) {
    this.map = map;
    if (map) {
      (this as any).onAdd?.();
      (this as any).draw?.();
    } else {
      (this as any).onRemove?.();
    }
  }
  static preventMapHitsAndClicksFrom = jest.fn();
}

const mockGoogle = {
  maps: {
    Map: MockMap,
    LatLng: MockLatLng,
    OverlayView: MockOverlayView,
    event: {
      trigger: jest.fn(),
    },
  },
};

(window as any).google = mockGoogle;

jest.mock('@/lib/maps/googleMapsLoader', () => ({
  loadGoogleMapsSdk: jest.fn().mockResolvedValue(undefined),
}));

const MOCK_PERFORMERS: LiveCheckin[] = [
  {
    uid: 'perf-1',
    performerName: 'Maya Solo',
    photoUrl: '',
    type: 'artist',
    genres: ['Acoustic', 'Folk'],
    venueName: 'Sunset Lounge',
    latitude: 32.7157,
    longitude: -117.1611,
    isLive: true,
    checkedInAt: '2026-10-07T20:00:00Z',
  },
  {
    uid: 'perf-2',
    performerName: 'The Groove Collective',
    photoUrl: '',
    type: 'band',
    genres: ['Funk', 'Jazz'],
    venueName: 'Blue Note',
    latitude: 32.72,
    longitude: -117.165,
    isLive: false,
    checkedInAt: '2026-10-07T19:30:00Z',
  },
  {
    uid: 'perf-3',
    performerName: 'Echoes Band',
    photoUrl: '',
    type: 'band',
    genres: ['Indie Rock'],
    venueName: 'Mercury Lounge',
    latitude: 32.73,
    longitude: -117.17,
    isLive: true,
    checkedInAt: '2026-10-07T20:15:00Z',
  },
];

describe('DiscoverMap Component & Styling', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  describe('Context-Aware Zoom Calculations', () => {
    it('returns zoom 15 for neighborhoods', () => {
      expect(getContextAwareZoom('North Park, San Diego, CA')).toBe(15);
      expect(getContextAwareZoom('Williamsburg, Brooklyn, NY')).toBe(15);
      expect(getContextAwareZoom('Downtown', 'neighborhood')).toBe(15);
      expect(getContextAwareZoom('SoHo', 'sublocality')).toBe(15);
    });

    it('returns zoom 13 for cities', () => {
      expect(getContextAwareZoom('San Diego, CA')).toBe(13);
      expect(getContextAwareZoom('Austin, TX')).toBe(13);
      expect(getContextAwareZoom('London, UK')).toBe(13);
      expect(getContextAwareZoom('Seattle', 'locality')).toBe(13);
    });

    it('returns zoom 8 for regions/states/countries', () => {
      expect(getContextAwareZoom('California')).toBe(8);
      expect(getContextAwareZoom('United States')).toBe(8);
      expect(getContextAwareZoom('Texas', 'administrative_area_level_1')).toBe(8);
    });

    it('honors explicit zoom if provided', () => {
      expect(getContextAwareZoom('San Diego, CA', 'city', 14)).toBe(14);
      expect(getContextAwareZoom('California', 'region', 10)).toBe(10);
    });
  });

  describe('Uber/Lyft Soft Neutral Map Styling', () => {
    it('defines light mode style with soft land, subtle parks, gentle water and golden highways', () => {
      // Land
      const landStyle = MAP_STYLE_LIGHT.find((s) => s.featureType === 'landscape');
      expect((landStyle?.stylers?.[0] as any)?.color).toBe('#f1f5f9');

      // Parks
      const parkStyle = MAP_STYLE_LIGHT.find((s) => s.featureType === 'poi.park' && s.elementType === 'geometry');
      expect((parkStyle?.stylers?.[0] as any)?.color).toBe('#dcfce7');

      // Water
      const waterStyle = MAP_STYLE_LIGHT.find((s) => s.featureType === 'water' && s.elementType === 'geometry');
      expect((waterStyle?.stylers?.[0] as any)?.color).toBe('#e0f2fe');

      // Highway
      const highwayStyle = MAP_STYLE_LIGHT.find((s) => s.featureType === 'road.highway' && s.elementType === 'geometry.fill');
      expect((highwayStyle?.stylers?.[0] as any)?.color).toBe('#fed7aa');

      // Commercial POI declutter
      const businessPoi = MAP_STYLE_LIGHT.find((s) => s.featureType === 'poi.business');
      expect((businessPoi?.stylers?.[0] as any)?.visibility).toBe('off');
    });

    it('defines dark mode style with soft neutral slate land and muted accents', () => {
      // Dark Land
      const darkLand = MAP_STYLE_DARK.find((s) => s.featureType === 'landscape');
      expect((darkLand?.stylers?.[0] as any)?.color).toBe('#1e293b');

      // Dark Parks
      const darkPark = MAP_STYLE_DARK.find((s) => s.featureType === 'poi.park' && s.elementType === 'geometry');
      expect((darkPark?.stylers?.[0] as any)?.color).toBe('#14532d');

      // Dark Water
      const darkWater = MAP_STYLE_DARK.find((s) => s.featureType === 'water' && s.elementType === 'geometry');
      expect((darkWater?.stylers?.[0] as any)?.color).toBe('#0f172a');

      // Dark Highway
      const darkHighway = MAP_STYLE_DARK.find((s) => s.featureType === 'road.highway' && s.elementType === 'geometry.fill');
      expect((darkHighway?.stylers?.[0] as any)?.color).toBe('#334155');
    });
  });

  describe('Map Rendering and Interactions', () => {
    it('renders the interactive map region with accessible label and zoom controls', async () => {
      await act(async () => {
        root.render(
          <DiscoverMap
            center={{ lat: 32.7157, lng: -117.1611, label: 'San Diego, CA' }}
            performers={MOCK_PERFORMERS}
          />
        );
      });

      const mapRegion = container.querySelector('[role="region"]');
      expect(mapRegion).toBeTruthy();
      expect(mapRegion?.getAttribute('aria-label')).toContain('San Diego, CA');

      // Control buttons (Zoom In, Zoom Out, Recenter)
      const zoomInBtn = container.querySelector('button[aria-label="Zoom in"]');
      const zoomOutBtn = container.querySelector('button[aria-label="Zoom out"]');
      const recenterBtn = container.querySelector('button[aria-label^="Recenter map"]');

      expect(zoomInBtn).toBeTruthy();
      expect(zoomOutBtn).toBeTruthy();
      expect(recenterBtn).toBeTruthy();
    });

    it('renders numbered markers matching Top performers with 1-based indexing', async () => {
      await act(async () => {
        root.render(
          <DiscoverMap
            center={{ lat: 32.7157, lng: -117.1611, label: 'San Diego, CA' }}
            performers={MOCK_PERFORMERS}
          />
        );
      });

      // Markers 1, 2, 3
      const marker1 = document.querySelector('button[data-marker-id="perf-1"]');
      const marker2 = document.querySelector('button[data-marker-id="perf-2"]');
      const marker3 = document.querySelector('button[data-marker-id="perf-3"]');

      expect(marker1).toBeTruthy();
      expect(marker2).toBeTruthy();
      expect(marker3).toBeTruthy();

      expect(marker1?.textContent).toContain('1');
      expect(marker2?.textContent).toContain('2');
      expect(marker3?.textContent).toContain('3');
    });

    it('distinguishes Solo Musician vs Band and renders Live indicator', async () => {
      await act(async () => {
        root.render(
          <DiscoverMap
            center={{ lat: 32.7157, lng: -117.1611, label: 'San Diego, CA' }}
            performers={MOCK_PERFORMERS}
          />
        );
      });

      const marker1 = document.querySelector('button[data-marker-id="perf-1"]');
      const marker2 = document.querySelector('button[data-marker-id="perf-2"]');

      // Solo vs Band in accessible label
      expect(marker1?.getAttribute('aria-label')).toContain('Solo Musician');
      expect(marker2?.getAttribute('aria-label')).toContain('Band');

      // Live indicator present on live performers (perf-1 and perf-3)
      const liveIndicator1 = marker1?.querySelector('[title="Live Now"]');
      const liveIndicator2 = marker2?.querySelector('[title="Live Now"]');

      expect(liveIndicator1).toBeTruthy();
      expect(liveIndicator2).toBeNull();
    });

    it('renders 5 fallback pins numbered 1 to 5 with NO live indicators when all isLive === false', async () => {
      const fallbackPerformers: LiveCheckin[] = Array.from({ length: 5 }, (_, i) => ({
        uid: `fallback-${i + 1}`,
        performerName: `Musician ${i + 1}`,
        photoUrl: '',
        type: i % 2 === 0 ? 'artist' : 'band',
        genres: ['Indie'],
        venueName: `Venue ${i + 1}`,
        latitude: 32.7157 + i * 0.01,
        longitude: -117.1611 + i * 0.01,
        isLive: false,
        checkedInAt: '2026-10-07T12:00:00Z',
      }));

      await act(async () => {
        root.render(
          <DiscoverMap
            center={{ lat: 32.7157, lng: -117.1611, label: 'San Diego, CA' }}
            performers={fallbackPerformers}
          />
        );
      });

      // All 5 pins exist
      for (let i = 1; i <= 5; i++) {
        const pin = document.querySelector(`button[data-marker-id="fallback-${i}"]`);
        expect(pin).toBeTruthy();
        expect(pin?.textContent).toContain(String(i));
      }

      // No live indicator exists on any marker
      const liveIndicators = document.querySelectorAll('[title="Live Now"]');
      expect(liveIndicators.length).toBe(0);
    });

    it('calls onSelectPerformer when a marker is clicked', async () => {
      const onSelectMock = jest.fn();

      await act(async () => {
        root.render(
          <DiscoverMap
            center={{ lat: 32.7157, lng: -117.1611, label: 'San Diego, CA' }}
            performers={MOCK_PERFORMERS}
            onSelectPerformer={onSelectMock}
          />
        );
      });

      const marker2 = document.querySelector('button[data-marker-id="perf-2"]') as HTMLButtonElement;
      expect(marker2).toBeTruthy();

      await act(async () => {
        marker2.click();
      });

      expect(onSelectMock).toHaveBeenCalledWith('perf-2');
    });

    it('renders the search center subtle ring marker', async () => {
      await act(async () => {
        root.render(
          <DiscoverMap
            center={{ lat: 32.7157, lng: -117.1611, label: 'San Diego, CA' }}
            performers={MOCK_PERFORMERS}
          />
        );
      });

      const centerMarker = document.querySelector('div[data-marker-id="search-center"]');
      expect(centerMarker).toBeTruthy();
      expect(centerMarker?.getAttribute('title')).toContain('San Diego, CA');
    });

    it('applies selected marker state with violet halo class and higher aria-pressed', async () => {
      await act(async () => {
        root.render(
          <DiscoverMap
            center={{ lat: 32.7157, lng: -117.1611, label: 'San Diego, CA' }}
            performers={MOCK_PERFORMERS}
            selectedId="perf-1"
          />
        );
      });

      const marker1 = document.querySelector('button[data-marker-id="perf-1"]');
      const marker2 = document.querySelector('button[data-marker-id="perf-2"]');

      expect(marker1?.getAttribute('aria-pressed')).toBe('true');
      expect(marker2?.getAttribute('aria-pressed')).toBe('false');
      expect(marker1?.className).toContain('markerSelected');
    });

    it('handles Zoom In, Zoom Out, and Recenter controls', async () => {
      await act(async () => {
        root.render(
          <DiscoverMap
            center={{ lat: 32.7157, lng: -117.1611, label: 'San Diego, CA' }}
            performers={MOCK_PERFORMERS}
          />
        );
      });

      const zoomInBtn = container.querySelector('button[aria-label="Zoom in"]') as HTMLButtonElement;
      const zoomOutBtn = container.querySelector('button[aria-label="Zoom out"]') as HTMLButtonElement;
      const recenterBtn = container.querySelector('button[aria-label^="Recenter map"]') as HTMLButtonElement;

      expect(zoomInBtn).toBeTruthy();
      expect(zoomOutBtn).toBeTruthy();
      expect(recenterBtn).toBeTruthy();

      await act(async () => {
        zoomInBtn.click();
      });

      await act(async () => {
        zoomOutBtn.click();
      });

      await act(async () => {
        recenterBtn.click();
      });
    });

    it('renders clustered grouping when zoomed out below zoom 11', async () => {
      await act(async () => {
        root.render(
          <DiscoverMap
            center={{ lat: 32.7157, lng: -117.1611, label: 'San Diego, CA', zoom: 9 }}
            performers={MOCK_PERFORMERS}
          />
        );
      });

      const clusterBtn = document.querySelector('button[data-marker-id="cluster-group"]');
      expect(clusterBtn).toBeTruthy();
      expect(clusterBtn?.textContent).toContain('Live');
    });
  });
});
