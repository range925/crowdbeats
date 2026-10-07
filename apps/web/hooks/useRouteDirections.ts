'use client';

/**
 * Crowdbeats — useRouteDirections Hook (Phase 11 — Routing & Walking Directions)
 *
 * Coordinates origin, destination, routing engine calls, distance evaluation,
 * and external navigation app handoff.
 */

import { useState, useCallback, useRef } from 'react';
import type { CrowdbeatsCoordinate, CrowdbeatsRoute } from '@/lib/maps/types';
import {
  type RouteMode,
  getAppleMapsUrl,
  getGoogleMapsUrl,
  getWazeUrl,
  getDeviceNavigationUrl,
} from '@/lib/maps/routing';
import { mapObservability } from '@/lib/maps/observability';

export interface UseRouteDirectionsOptions {
  origin?: CrowdbeatsCoordinate | null;
  destination?: CrowdbeatsCoordinate | null;
  destinationName?: string;
  initialMode?: RouteMode;
  onRouteCalculated?: (route: CrowdbeatsRoute) => void;
}

export interface UseRouteDirectionsReturn {
  route: CrowdbeatsRoute | null;
  isLoading: boolean;
  error: string | null;
  isPermissionDenied: boolean;
  isNearby: boolean;
  mode: RouteMode;
  setMode: (mode: RouteMode) => void;
  requestRoute: (
    dest?: CrowdbeatsCoordinate | null,
    orig?: CrowdbeatsCoordinate | null,
    reqMode?: RouteMode
  ) => Promise<CrowdbeatsRoute | null>;
  clearRoute: () => void;
  openExternalNavigation: () => void;
  externalUrls: { apple: string; google: string; waze: string } | null;
}

export function useRouteDirections({
  origin: initialOrigin = null,
  destination: initialDestination = null,
  destinationName = '',
  initialMode = 'walking',
  onRouteCalculated,
}: UseRouteDirectionsOptions = {}): UseRouteDirectionsReturn {
  const [route, setRoute] = useState<CrowdbeatsRoute | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [mode, setModeState] = useState<RouteMode>(initialMode);

  const abortControllerRef = useRef<AbortController | null>(null);

  const resolveOrigin = useCallback(async (provided?: CrowdbeatsCoordinate | null): Promise<CrowdbeatsCoordinate> => {
    if (provided) return provided;
    if (initialOrigin) return initialOrigin;

    // Try browser geolocation
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 6000,
            maximumAge: 30000,
            enableHighAccuracy: true,
          });
        });
        setIsPermissionDenied(false);
        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } catch (err: any) {
        if (err?.code === 1) { // PERMISSION_DENIED
          setIsPermissionDenied(true);
        }
      }
    }

    // Fallback: Default to San Diego reference coordinate
    return { lat: 32.7157, lng: -117.1611 };
  }, [initialOrigin]);

  const requestRoute = useCallback(async (
    destOverride?: CrowdbeatsCoordinate | null,
    origOverride?: CrowdbeatsCoordinate | null,
    modeOverride?: RouteMode
  ): Promise<CrowdbeatsRoute | null> => {
    const dest = destOverride || initialDestination;
    if (!dest) {
      setError('Destination coordinates are missing');
      return null;
    }

    const currentMode = modeOverride || mode;
    setIsLoading(true);
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const orig = await resolveOrigin(origOverride);

      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originLat: orig.lat,
          originLng: orig.lng,
          destLat: dest.lat,
          destLng: dest.lng,
          travelMode: currentMode,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Failed to calculate route (${res.status})`);
      }

      const calculatedRoute: CrowdbeatsRoute = await res.json();
      setRoute(calculatedRoute);
      setIsLoading(false);
      if (onRouteCalculated) {
        onRouteCalculated(calculatedRoute);
      }
      return calculatedRoute;
    } catch (err: any) {
      if (err?.name === 'AbortError') return null;
      console.error('[useRouteDirections] Error:', err);
      const msg = err?.message || 'Unable to calculate directions';
      mapObservability.recordEvent('routing_error', msg, {
        provider: 'routing',
        details: { mode: currentMode },
      });
      setError(msg);
      setIsLoading(false);
      return null;
    }
  }, [initialDestination, mode, resolveOrigin, onRouteCalculated]);

  const clearRoute = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setRoute(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const setMode = useCallback((newMode: RouteMode) => {
    setModeState(newMode);
    if (route) {
      // Recompute with updated mode
      requestRoute(route.destination, route.origin, newMode);
    }
  }, [route, requestRoute]);

  const effectiveDest = route?.destination || initialDestination;
  const effectiveOrig = route?.origin || initialOrigin;

  const externalUrls = effectiveDest ? {
    apple: getAppleMapsUrl({ destination: effectiveDest, destinationName, origin: effectiveOrig || undefined, mode }),
    google: getGoogleMapsUrl({ destination: effectiveDest, destinationName, origin: effectiveOrig || undefined, mode }),
    waze: getWazeUrl({ destination: effectiveDest, destinationName }),
  } : null;

  const openExternalNavigation = useCallback(() => {
    if (!effectiveDest) return;
    const { url } = getDeviceNavigationUrl({
      destination: effectiveDest,
      destinationName,
      origin: effectiveOrig || undefined,
      mode,
    });
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [effectiveDest, destinationName, effectiveOrig, mode]);

  const isNearby = route ? route.distanceMiles <= 5 : true;

  return {
    route,
    isLoading,
    error,
    isPermissionDenied,
    isNearby,
    mode,
    setMode,
    requestRoute,
    clearRoute,
    openExternalNavigation,
    externalUrls,
  };
}
