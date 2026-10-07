/**
 * Crowdbeats Map Engine — External Navigation Handoff (Phase 11)
 *
 * Provides platform-aware deep links to Apple Maps, Google Maps, and Waze.
 * Allows users to easily hand off live turn-by-turn navigation to their device's
 * preferred native application.
 */

import type { CrowdbeatsCoordinate } from '../types';
import type { ExternalNavigationOptions } from './types';

export function getAppleMapsUrl(options: ExternalNavigationOptions): string {
  const { destination, destinationName, mode = 'walking' } = options;
  const dirflg = mode === 'walking' ? 'w' : 'd';
  const q = destinationName ? encodeURIComponent(destinationName) : `${destination.lat},${destination.lng}`;
  return `https://maps.apple.com/?daddr=${destination.lat},${destination.lng}&q=${q}&dirflg=${dirflg}`;
}

export function getGoogleMapsUrl(options: ExternalNavigationOptions): string {
  const { destination, destinationName, origin, mode = 'walking' } = options;
  const travelmode = mode === 'driving' ? 'driving' : mode === 'cycling' ? 'bicycling' : 'walking';
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=${travelmode}`;
  if (origin) {
    url += `&origin=${origin.lat},${origin.lng}`;
  }
  if (destinationName) {
    url += `&destination_place_id=${encodeURIComponent(destinationName)}`;
  }
  return url;
}

export function getWazeUrl(options: ExternalNavigationOptions): string {
  const { destination } = options;
  return `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`;
}

export function getDeviceNavigationUrl(options: ExternalNavigationOptions): {
  url: string;
  platform: 'apple' | 'google';
} {
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) {
      return { url: getAppleMapsUrl(options), platform: 'apple' };
    }
  }
  return { url: getGoogleMapsUrl(options), platform: 'google' };
}
