/**
 * Crowdbeats Map Engine — Clustering Types (Phase 8)
 *
 * Types for spatial clustering of performers, bands, and venues.
 */

import type { CrowdbeatsBounds, CrowdbeatsCoordinate } from '../types';

export interface ClusterPointItem {
  id: string;
  latitude: number;
  longitude: number;
  isLive?: boolean;
  type?: string;
  label?: string;
  performerName?: string;
  venueName?: string;
  photoUrl?: string;
  genres?: string[];
  distanceMiles?: number;
  data?: Record<string, any>;
}

export interface CrowdbeatsClusterData {
  id: string;
  position: CrowdbeatsCoordinate;
  count: number;
  hasLive: boolean;
  liveCount: number;
  items: ClusterPointItem[];
  expansionZoom: number;
  bounds: CrowdbeatsBounds;
}

export interface ClusterEngineOptions {
  /** Cluster radius in screen pixels at current zoom level. Default: 60. */
  radius?: number;
  /** Max zoom level at which clusters will be formed. Default: 14. */
  maxZoom?: number;
  /** Minimum points required to form a cluster. Default: 2. */
  minPoints?: number;
}

export interface ClusterResult<T extends ClusterPointItem = ClusterPointItem> {
  /** Formed clusters at this zoom level. */
  clusters: CrowdbeatsClusterData[];
  /** Points that are not part of any cluster (isolated or at maxZoom). */
  unclustered: T[];
  /** Total points evaluated. */
  totalPoints: number;
  /** Points currently inside the viewport. */
  visiblePoints: T[];
}
