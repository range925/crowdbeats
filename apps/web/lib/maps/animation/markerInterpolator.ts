/**
 * Crowdbeats V2 — Marker Interpolation Engine (Phase 9)
 *
 * Uber/Lyft-quality perceived smoothness for MapLibre / Web maps:
 * - Frame rate decoupled from network tick rate (60/120fps RAF loop)
 * - Teleportation guard (>500m): snaps with cross-fade rather than city-wide sweep
 * - Stationary venue invariant: strictly locked to canonical coordinates (0 fake movement)
 * - Mobile coarse invariant: interpolates only between published 100m grid centroids
 * - Reduced-motion compliance: prefers-reduced-motion snaps immediately
 * - Lifecycle awareness: pauses RAF loops when document is hidden
 */

import {
  computeMarkerFreshness,
  MarkerFreshnessInfo,
  MarkerFreshnessState,
  TELEPORT_THRESHOLDS,
} from '@crowdbeats/contracts';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface InterpolationOptions {
  durationMs?: number;
  teleportThresholdMeters?: number;
  onUpdate: (coord: Coordinate, opacity: number) => void;
  onComplete?: () => void;
}

/**
 * Calculates great-circle distance between two points in meters using Haversine formula.
 */
export function haversineDistanceMeters(a: Coordinate, b: Coordinate): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

/**
 * Cubic ease in-out curve: slow start, smooth acceleration, gentle deceleration.
 */
export function cubicEaseInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class MarkerInterpolator {
  private currentCoord: Coordinate;
  private isStationary: boolean;
  private rafId: number | null = null;
  private isHidden = false;

  constructor(initialCoord: Coordinate, isStationary = false) {
    this.currentCoord = { ...initialCoord };
    this.isStationary = isStationary;

    // Attach visibility observer if in browser
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = () => {
    if (typeof document !== 'undefined') {
      this.isHidden = document.visibilityState === 'hidden';
      if (this.isHidden && this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }
  };

  public getPosition(): Coordinate {
    return { ...this.currentCoord };
  }

  public setStationary(stationary: boolean) {
    this.isStationary = stationary;
    if (stationary && this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Check if reduced motion is preferred by user
   */
  public isReducedMotion(): boolean {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }

  /**
   * Smoothly interpolate or snap to target coordinate
   */
  public animateTo(target: Coordinate, options: InterpolationOptions): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    const {
      durationMs = TELEPORT_THRESHOLDS.defaultAnimationDurationMs,
      teleportThresholdMeters = TELEPORT_THRESHOLDS.maxInterpolationDistanceMeters,
      onUpdate,
      onComplete,
    } = options;

    const startCoord = { ...this.currentCoord };
    const distanceMeters = haversineDistanceMeters(startCoord, target);

    // Invariant 1: Stationary venue session must NEVER fake movement or drift!
    if (this.isStationary) {
      this.currentCoord = { ...target };
      onUpdate(this.currentCoord, 1.0);
      onComplete?.();
      return;
    }

    // Invariant 2: Reduced motion collapses tween duration to zero
    if (this.isReducedMotion() || this.isHidden) {
      this.currentCoord = { ...target };
      onUpdate(this.currentCoord, 1.0);
      onComplete?.();
      return;
    }

    // Invariant 3: Teleportation guard (>500m): snap with cross-fade instead of sweep
    if (distanceMeters > teleportThresholdMeters) {
      this.executeTeleportFade(target, onUpdate, onComplete);
      return;
    }

    // Invariant 4: 60/120fps client-side cubic interpolation
    let startTime: number | null = null;

    const tick = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);
      const easedProgress = cubicEaseInOut(progress);

      this.currentCoord = {
        lat: startCoord.lat + (target.lat - startCoord.lat) * easedProgress,
        lng: startCoord.lng + (target.lng - startCoord.lng) * easedProgress,
      };

      onUpdate(this.currentCoord, 1.0);

      if (progress < 1.0) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.currentCoord = { ...target };
        this.rafId = null;
        onComplete?.();
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private executeTeleportFade(
    target: Coordinate,
    onUpdate: (coord: Coordinate, opacity: number) => void,
    onComplete?: () => void
  ) {
    const fadeDuration = TELEPORT_THRESHOLDS.fadeTransitionDurationMs;
    const halfFade = fadeDuration / 2;
    let startTime: number | null = null;

    const fadeTick = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;

      if (elapsed < halfFade) {
        // Fade out
        const opacity = Math.max(0.1, 1.0 - (elapsed / halfFade) * 0.9);
        onUpdate(this.currentCoord, opacity);
        this.rafId = requestAnimationFrame(fadeTick);
      } else if (elapsed < fadeDuration) {
        // Snap coordinate at bottom of fade and fade in
        this.currentCoord = { ...target };
        const opacity = Math.min(1.0, 0.1 + ((elapsed - halfFade) / halfFade) * 0.9);
        onUpdate(this.currentCoord, opacity);
        this.rafId = requestAnimationFrame(fadeTick);
      } else {
        this.currentCoord = { ...target };
        onUpdate(this.currentCoord, 1.0);
        this.rafId = null;
        onComplete?.();
      }
    };

    this.rafId = requestAnimationFrame(fadeTick);
  }

  public destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
}

export { computeMarkerFreshness };
export type { MarkerFreshnessInfo, MarkerFreshnessState };
