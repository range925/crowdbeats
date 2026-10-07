'use client';

/**
 * Crowdbeats — useNearbyDiscovery Hook (Phase 8 — Smart Clustering & Discovery)
 *
 * Connects the CrowdbeatsClusterEngine to the MapLibre map provider and
 * discovery UI. Synchronizes map markers and Nearby profile cards with the
 * visible map viewport.
 *
 * Features:
 *   1. Debounced viewport bounds tracking (150ms).
 *   2. Automatic clustering at zoom < maxClusterZoom (default: 14).
 *   3. Diffs and mounts Crowdbeats-native cluster badges and individual markers.
 *   4. Smooth cluster expansion on click (flyTo cluster.expansionZoom).
 *   5. Keeps Nearby profile cards strictly synchronized with the visible viewport.
 *   6. Zero additional Firebase queries during pan and zoom.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ICrowdbeatsMapProvider } from '@/lib/maps/interfaces';
import type { CrowdbeatsBounds, CrowdbeatsCoordinate, CrowdbeatsCluster } from '@/lib/maps/types';
import {
  CrowdbeatsClusterEngine,
  type ClusterPointItem,
  type CrowdbeatsClusterData,
} from '@/lib/maps/clustering';
import { liveCheckinToMarker } from '@/lib/maps/utils/markerNormalizers';
import type { LiveCheckin } from '@/lib/firebase/firestore';

export interface UseNearbyDiscoveryOptions {
  provider: ICrowdbeatsMapProvider | null;
  performers: LiveCheckin[];
  userLat?: number;
  userLng?: number;
  clusterRadius?: number;
  maxClusterZoom?: number;
  clusteringEnabled?: boolean;
  onPerformerSelect?: (performer: LiveCheckin) => void;
}

export interface UseNearbyDiscoveryResult {
  visiblePerformers: LiveCheckin[];
  clusters: CrowdbeatsClusterData[];
  unclustered: LiveCheckin[];
  totalCount: number;
  visibleCount: number;
  currentZoom: number;
  currentBounds: CrowdbeatsBounds | null;
  handleViewportChange: (center: CrowdbeatsCoordinate, zoom: number, bounds: CrowdbeatsBounds) => void;
  zoomToCluster: (cluster: CrowdbeatsClusterData) => void;
}

export function useNearbyDiscovery({
  provider,
  performers,
  clusterRadius = 60,
  maxClusterZoom = 14,
  clusteringEnabled = true,
  onPerformerSelect,
}: UseNearbyDiscoveryOptions): UseNearbyDiscoveryResult {
  const [currentZoom, setCurrentZoom] = useState(14);
  const [currentBounds, setCurrentBounds] = useState<CrowdbeatsBounds | null>(null);

  const clusterEngine = useMemo(
    () =>
      new CrowdbeatsClusterEngine({
        radius: clusterRadius,
        maxZoom: maxClusterZoom,
        minPoints: 2,
      }),
    [clusterRadius, maxClusterZoom]
  );

  const activeMarkersRef = useRef<Map<string, 'cluster' | 'performer'>>(new Map());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Convert LiveCheckin[] into ClusterPointItem[]
  const clusterItems = useMemo<ClusterPointItem[]>(() => {
    return performers.map((p) => ({
      id: p.uid,
      latitude: p.latitude,
      longitude: p.longitude,
      isLive: p.isLive,
      type: p.type,
      label: p.performerName,
      performerName: p.performerName,
      venueName: p.venueName,
      photoUrl: p.photoUrl,
      genres: p.genres,
      distanceMiles: p.distanceMiles,
      data: p,
    }));
  }, [performers]);

  // Compute clusters and unclustered items
  const { clusters, unclustered, visiblePoints } = useMemo(() => {
    if (!clusteringEnabled || currentZoom >= maxClusterZoom) {
      const visible = currentBounds
        ? clusterItems.filter((i) =>
            clusterEngine.isInBounds(i.latitude, i.longitude, currentBounds, 0.2)
          )
        : clusterItems;

      return {
        clusters: [] as CrowdbeatsClusterData[],
        unclustered: visible,
        visiblePoints: visible,
      };
    }

    const res = clusterEngine.cluster(
      clusterItems,
      currentZoom,
      { radius: clusterRadius, maxZoom: maxClusterZoom, minPoints: 2 },
      currentBounds ?? undefined
    );

    return {
      clusters: res.clusters,
      unclustered: res.unclustered,
      visiblePoints: res.visiblePoints,
    };
  }, [clusterEngine, clusterItems, currentZoom, currentBounds, clusteringEnabled, clusterRadius, maxClusterZoom]);

  // Map ClusterPointItem[] back to LiveCheckin[]
  const visiblePerformers = useMemo(() => {
    const itemMap = new Map<string, LiveCheckin>(performers.map((p) => [p.uid, p]));
    const result: LiveCheckin[] = [];
    for (const point of visiblePoints) {
      const orig = itemMap.get(point.id);
      if (orig) result.push(orig);
    }
    return result;
  }, [performers, visiblePoints]);

  const unclusteredPerformers = useMemo(() => {
    const itemMap = new Map<string, LiveCheckin>(performers.map((p) => [p.uid, p]));
    const result: LiveCheckin[] = [];
    for (const point of unclustered) {
      const orig = itemMap.get(point.id);
      if (orig) result.push(orig);
    }
    return result;
  }, [performers, unclustered]);

  // Smoothly zoom toward cluster contents
  const zoomToCluster = useCallback(
    (cluster: CrowdbeatsClusterData) => {
      if (!provider) return;
      const targetZoom = Math.min(cluster.expansionZoom, 16);
      provider.flyTo(cluster.position, targetZoom);
    },
    [provider]
  );

  // Synchronize markers on MapLibreMapProvider
  useEffect(() => {
    if (!provider) return;

    const nextMarkerIds = new Set<string>();
    const currentActive = activeMarkersRef.current;

    // 1. Add / update clusters
    for (const cluster of clusters) {
      nextMarkerIds.add(cluster.id);

      if (!currentActive.has(cluster.id)) {
        const clusterMarker: CrowdbeatsCluster = {
          id: cluster.id,
          type: 'cluster',
          position: cluster.position,
          count: cluster.count,
          hasLive: cluster.hasLive,
          liveCount: cluster.liveCount,
          expansionZoom: cluster.expansionZoom,
          bounds: cluster.bounds,
          markerIds: cluster.items.map((i) => i.id),
          label: `Cluster of ${cluster.count} acts`,
        };
        provider.addMarker(clusterMarker);
        currentActive.set(cluster.id, 'cluster');
      } else {
        provider.updateMarker(cluster.id, {
          position: cluster.position,
        });
      }
    }

    // 2. Add / update unclustered performers
    for (const perf of unclusteredPerformers) {
      const markerId = `live_${perf.uid}`;
      nextMarkerIds.add(markerId);

      if (!currentActive.has(markerId)) {
        const marker = liveCheckinToMarker(perf);
        provider.addMarker(marker);
        currentActive.set(markerId, 'performer');
      } else {
        provider.updateMarker(markerId, {
          position: { lat: perf.latitude, lng: perf.longitude },
        });
      }
    }

    // 3. Remove markers that are no longer visible or clustered
    currentActive.forEach((_, id) => {
      if (!nextMarkerIds.has(id)) {
        provider.removeMarker(id);
        currentActive.delete(id);
      }
    });
  }, [provider, clusters, unclusteredPerformers]);

  // Wire marker click events on the provider for clusters
  useEffect(() => {
    if (!provider) return;

    const handleMarkerClick = (payload: any) => {
      const markerId = payload.markerId as string;
      if (!markerId) return;

      if (markerId.startsWith('cb_cluster_') || markerId.startsWith('cb_venue_cluster_')) {
        const cl = clusters.find((c) => c.id === markerId);
        if (cl) {
          zoomToCluster(cl);
        }
      } else if (markerId.startsWith('live_')) {
        const uid = markerId.replace('live_', '');
        const perf = performers.find((p) => p.uid === uid);
        if (perf) {
          onPerformerSelect?.(perf);
        }
      }
    };

    provider.on('marker:click', handleMarkerClick);
    return () => {
      provider.off('marker:click', handleMarkerClick);
    };
  }, [provider, clusters, performers, zoomToCluster, onPerformerSelect]);

  // Debounced viewport tracking handler
  const handleViewportChange = useCallback(
    (center: CrowdbeatsCoordinate, zoom: number, bounds: CrowdbeatsBounds) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        setCurrentZoom(zoom);
        setCurrentBounds(bounds);
      }, 150);
    },
    []
  );

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (provider) {
        activeMarkersRef.current.forEach((_, id) => {
          try {
            provider.removeMarker(id);
          } catch {
            /* no-op */
          }
        });
        activeMarkersRef.current.clear();
      }
    };
  }, [provider]);

  return {
    visiblePerformers,
    clusters,
    unclustered: unclusteredPerformers,
    totalCount: performers.length,
    visibleCount: visiblePerformers.length,
    currentZoom,
    currentBounds,
    handleViewportChange,
    zoomToCluster,
  };
}