/**
 * Crowdbeats Map Engine — Shared Location Provider
 *
 * Uses the W3C Geolocation API directly — zero vendor dependency.
 * Both Google Maps and MapLibre providers delegate location to this class.
 */

import type { ICrowdbeatsLocationProvider } from '../interfaces';
import type { CrowdbeatsCoordinate } from '../types';

export class CrowdbeatsLocationProvider implements ICrowdbeatsLocationProvider {
  private watchId: number | null = null;

  async getCurrentLocation(): Promise<{ coordinate: CrowdbeatsCoordinate; accuracyMeters: number }> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject('Your browser does not support location detection.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          coordinate: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracyMeters: pos.coords.accuracy,
        }),
        (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              reject('Location permission denied. Enable location in your browser settings.'); break;
            case err.POSITION_UNAVAILABLE:
              reject('Location unavailable. Check your device GPS.'); break;
            case err.TIMEOUT:
              reject('Location request timed out. Try again.'); break;
            default:
              reject('Unable to detect your location.');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  }

  watchLocation(
    callback: (coord: CrowdbeatsCoordinate, accuracyMeters: number) => void,
    onError?: (error: string) => void
  ): () => void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onError?.('Geolocation not supported.');
      return () => {};
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => callback(
        { lat: pos.coords.latitude, lng: pos.coords.longitude },
        pos.coords.accuracy
      ),
      (err) => onError?.(`Location watch error: ${err.message}`),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => this.stopWatchingLocation();
  }

  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

/** Singleton shared across all map providers. */
export const locationProvider = new CrowdbeatsLocationProvider();