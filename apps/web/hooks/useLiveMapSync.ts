'use client';

/**
 * Crowdbeats — useLiveMapSync Hook (Phase 7)
 *
 * Bridges LiveCheckin[] from Firebase into a MapLibreMapProvider without
 * reloading the map. Diffs the incoming performer set against the current
 * set of markers and issues granular add/update/remove calls.
 *
 * Live event lifecycle:
 *   Performer goes live   -> Firebase snapshot -> addMarker (live pulse begins)
 *   Position update       -> updateMarker (smooth reposition)
 *   Session ends          -> removeMarker (marker disappears)
 */

import { useEffect, useRef } from 'react';
import type { ICrowdbeatsMapProvider } from '@/lib/maps/interfaces';
import { liveCheckinToMarker } from '@/lib/maps/utils/markerNormalizers';
import type { LiveCheckin } from '@/lib/firebase/firestore';

export interface UseLiveMapSyncOptions {
  /** MapLibre provider instance — pass null if not yet initialised. */
  provider: ICrowdbeatsMapProvider | null;
  /** Current live performer list from useLivePerformers. */
  performers: LiveCheckin[];
}

export interface UseLiveMapSyncResult {
  /** Number of performer markers currently on the map. */
  syncedCount: number;
}

export function useLiveMapSync({
  provider,
  performers,
}: UseLiveMapSyncOptions): UseLiveMapSyncResult {
  // Track which performer UIDs are currently on the map
  const activeMarkersRef = useRef<Map<string, LiveCheckin>>(new Map());
  const syncedCountRef = useRef(0);

  useEffect(() => {
    if (!provider) return;

    const incoming = new Map<string, LiveCheckin>(
      performers.map((p) => [p.uid, p])
    );
    const current = activeMarkersRef.current;

    // Removed: performer no longer live
    current.forEach((_, uid) => {
      if (!incoming.has(uid)) {
        provider.removeMarker(`live_${uid}`);
        current.delete(uid);
      }
    });

    // Added or position-updated
    incoming.forEach((checkin, uid) => {
      const markerId = `live_${uid}`;
      const prev = current.get(uid);

      if (!prev) {
        // New performer — add marker (triggers live pulse animation)
        const marker = liveCheckinToMarker(checkin);
        provider.addMarker(marker);
        current.set(uid, checkin);
      } else {
        // Position changed > ~10m — reposition without re-adding
        const latDelta = Math.abs(checkin.latitude - prev.latitude);
        const lngDelta = Math.abs(checkin.longitude - prev.longitude);
        if (latDelta > 0.0001 || lngDelta > 0.0001) {
          provider.updateMarker(markerId, {
            position: { lat: checkin.latitude, lng: checkin.longitude },
          } as any);
          current.set(uid, checkin);
        }
      }
    });

    syncedCountRef.current = current.size;
  }, [provider, performers]);

  // Cleanup all markers on unmount
  useEffect(() => {
    return () => {
      if (!provider) return;
      activeMarkersRef.current.forEach((_, uid) => {
        try { provider.removeMarker(`live_${uid}`); } catch { /* no-op */ }
      });
      activeMarkersRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  return { syncedCount: syncedCountRef.current };
}