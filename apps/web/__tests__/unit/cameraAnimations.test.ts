/**
 * Crowdbeats Map Engine — Camera & Interaction Animations Unit Tests (Phase 9)
 * Tests: flyTo, easeTo, centerOnMarker with offset, reduced motion overrides.
 */

import { MapLibreMapProvider } from '@/lib/maps/providers/maplibre';
import type { CrowdbeatsCoordinate } from '@/lib/maps/types';

// Mock maplibre-gl Map instance
const mockMapInstance = {
  flyTo: jest.fn(),
  easeTo: jest.fn(),
  jumpTo: jest.fn(),
  fitBounds: jest.fn(),
  getZoom: jest.fn().mockReturnValue(14),
  getCenter: jest.fn().mockReturnValue({ lat: 32.7157, lng: -117.1611 }),
  getBounds: jest.fn().mockReturnValue({
    getSouth: () => 32.65,
    getWest: () => -117.25,
    getNorth: () => 32.78,
    getEast: () => -117.07,
  }),
  on: jest.fn(),
  once: jest.fn((event, cb) => { if (typeof cb === 'function') cb(); }),
  off: jest.fn(),
  remove: jest.fn(),
};

describe('Camera Animations (Phase 9)', () => {
  let provider: MapLibreMapProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new MapLibreMapProvider();
    (provider as any).map = mockMapInstance;
    (provider as any)._initialized = true;
  });

  describe('flyTo transitions', () => {
    const dest: CrowdbeatsCoordinate = { lat: 36.1627, lng: -86.7816 };

    it('performs calibrated smooth flight with number zoom', () => {
      provider.flyTo(dest, 15);
      expect(mockMapInstance.flyTo).toHaveBeenCalledWith(expect.objectContaining({
        center: [-86.7816, 36.1627],
        zoom: 15,
        duration: 1100,
        curve: 1.42,
        speed: 1.2,
        essential: true,
      }));
    });

    it('respects custom flyTo options', () => {
      provider.flyTo(dest, { zoom: 16, duration: 2000, curve: 1.8 });
      expect(mockMapInstance.flyTo).toHaveBeenCalledWith(expect.objectContaining({
        center: [-86.7816, 36.1627],
        zoom: 16,
        duration: 2000,
        curve: 1.8,
      }));
    });

    it('switches to instant jumpTo when reduced motion is requested', () => {
      provider.flyTo(dest, { zoom: 15, reducedMotion: true });
      expect(mockMapInstance.jumpTo).toHaveBeenCalledWith(expect.objectContaining({
        center: [-86.7816, 36.1627],
        zoom: 15,
      }));
      expect(mockMapInstance.flyTo).not.toHaveBeenCalled();
    });
  });

  describe('easeTo transitions', () => {
    const target: CrowdbeatsCoordinate = { lat: 32.7114, lng: -117.1599 };

    it('performs smooth micro-pan with cubic ease-out', () => {
      provider.easeTo(target, { zoom: 15, duration: 500 });
      expect(mockMapInstance.easeTo).toHaveBeenCalledWith(expect.objectContaining({
        center: [-117.1599, 32.7114],
        zoom: 15,
        duration: 500,
        essential: true,
      }));
    });

    it('switches to instant jumpTo when reduced motion is active', () => {
      provider.easeTo(target, { reducedMotion: true });
      expect(mockMapInstance.jumpTo).toHaveBeenCalledWith(expect.objectContaining({
        center: [-117.1599, 32.7114],
      }));
      expect(mockMapInstance.easeTo).not.toHaveBeenCalled();
    });
  });

  describe('centerOnMarker with bottom-sheet offset compensation', () => {
    const markerCoord: CrowdbeatsCoordinate = { lat: 32.7157, lng: -117.1611 };

    it('applies default [0, -110] vertical offset to reserve space for bottom sheet', () => {
      provider.centerOnMarker(markerCoord);
      expect(mockMapInstance.easeTo).toHaveBeenCalledWith(expect.objectContaining({
        center: [-117.1611, 32.7157],
        offset: [0, -110],
        duration: 650,
      }));
    });

    it('allows overriding offset and zoom for custom sheet sizes', () => {
      provider.centerOnMarker(markerCoord, { offset: [0, -150], zoom: 16 });
      expect(mockMapInstance.easeTo).toHaveBeenCalledWith(expect.objectContaining({
        center: [-117.1611, 32.7157],
        offset: [0, -150],
        zoom: 16,
      }));
    });
  });
});