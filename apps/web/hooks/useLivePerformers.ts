'use client';

/**
 * Crowdbeats — useLivePerformers Hook (Phase 7)
 *
 * Subscribes to the Firebase checkins collection and returns the current
 * set of live performers. Automatically unsubscribes on unmount.
 *
 * @param options.lat          Optional: fan latitude for radius filter
 * @param options.lng          Optional: fan longitude
 * @param options.radiusMiles  Distance limit (default 50mi)
 * @param options.enabled      Pass false to pause subscription
 */

import { useState, useEffect, useRef } from 'react';
import {
  subscribeToNearbyPerformers,
  subscribeToAllLivePerformers,
  type LiveCheckin,
} from '@/lib/firebase/firestore';
import { mapObservability } from '@/lib/maps/observability';

export interface UseLivePerformersOptions {
  lat?: number;
  lng?: number;
  radiusMiles?: number;
  enabled?: boolean;
}

export interface UseLivePerformersResult {
  performers: LiveCheckin[];
  isLoading: boolean;
  error: string | null;
  liveCount: number;
}

export function useLivePerformers({
  lat,
  lng,
  radiusMiles = 50,
  enabled = true,
}: UseLivePerformersOptions = {}): UseLivePerformersResult {
  const [performers, setPerformers] = useState<LiveCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPerformers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const onData = (data: LiveCheckin[]) => {
      setPerformers(data);
      setIsLoading(false);
      setError(null);
    };

    const onError = (err: any) => {
      const errMsg = err?.message || 'Failed to fetch live performers';
      setError(errMsg);
      setIsLoading(false);
      mapObservability.recordEvent('firebase_live_error', errMsg, {
        provider: 'firestore',
        rawCoordinates: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
      });
    };

    if (lat !== undefined && lng !== undefined) {
      unsubRef.current = subscribeToNearbyPerformers(lat, lng, radiusMiles, onData, onError);
    } else {
      unsubRef.current = subscribeToAllLivePerformers(onData, onError);
    }

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, lat, lng, radiusMiles]);

  return { performers, isLoading, error, liveCount: performers.length };
}