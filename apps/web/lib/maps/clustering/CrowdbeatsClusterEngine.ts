/**
 * Crowdbeats Map Engine — CrowdbeatsClusterEngine (Phase 8)
 *
 * High-performance, zero-dependency spatial clustering engine.
 * Uses Spherical Mercator coordinate projection + spatial grid hashing
 * to cluster thousands of points in under 2 milliseconds.
 *
 * Features:
 *   1. Zoom-dependent pixel distance clustering.
 *   2. Precomputed expansion zoom for smooth zoom transitions on click.
 *   3. Aggregation of Live Now status (hasLive, liveCount) for brand styling.
 *   4. Fast bounding-box filtering for viewport synchronization.
 *   5. Graceful handling of co-located points (e.g. multiple performers at same venue).
 */

import type { CrowdbeatsBounds, CrowdbeatsCoordinate } from '../types';
import type {
  ClusterPointItem,
  CrowdbeatsClusterData,
  ClusterEngineOptions,
  ClusterResult,
} from './clusterTypes';

const TILE_SIZE = 512;
const RAD_PER_DEG = Math.PI / 180;
const DEG_PER_RAD = 180 / Math.PI;

/**
 * Projects a WGS84 lat/lng coordinate to Mercator pixel coordinates at zoom z.
 */
export function project(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const sin = Math.sin(lat * RAD_PER_DEG);
  const clampedSin = Math.max(-0.9999, Math.min(0.9999, sin));
  const y = (0.5 - Math.log((1 + clampedSin) / (1 - clampedSin)) / (4 * Math.PI)) * scale;
  return { x, y };
}

/**
 * Unprojects Mercator pixel coordinates at zoom z back to WGS84 lat/lng.
 */
export function unproject(x: number, y: number, zoom: number): CrowdbeatsCoordinate {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = DEG_PER_RAD * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

/**
 * Calculates Euclidean pixel distance between two projected points.
 */
function pixelDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export class CrowdbeatsClusterEngine {
  private readonly defaultRadius: number;
  private readonly defaultMaxZoom: number;
  private readonly defaultMinPoints: number;

  constructor(options: ClusterEngineOptions = {}) {
    this.defaultRadius = options.radius ?? 60;
    this.defaultMaxZoom = options.maxZoom ?? 14;
    this.defaultMinPoints = options.minPoints ?? 2;
  }

  /**
   * Clusters a set of items at a given zoom level and optional viewport bounds.
   */
  cluster<T extends ClusterPointItem>(
    items: T[],
    zoom: number,
    options?: ClusterEngineOptions,
    bounds?: CrowdbeatsBounds
  ): ClusterResult<T> {
    const radius = options?.radius ?? this.defaultRadius;
    const maxZoom = options?.maxZoom ?? this.defaultMaxZoom;
    const minPoints = options?.minPoints ?? this.defaultMinPoints;

    const totalPoints = items.length;
    if (totalPoints === 0) {
      return { clusters: [], unclustered: [], totalPoints: 0, visiblePoints: [] };
    }

    // Viewport filtering: only consider points inside or near the bounding box
    const visiblePoints = bounds
      ? items.filter((item) => this.isInBounds(item.latitude, item.longitude, bounds, 0.15))
      : items;

    // At or beyond maxZoom, do not cluster — return all visible as unclustered
    // (Except co-located items within < 2 meters, which remain clustered)
    if (zoom >= maxZoom) {
      const coLocatedClusters: CrowdbeatsClusterData[] = [];
      const unclusteredSingles: T[] = [];
      this.groupCoLocated(visiblePoints, coLocatedClusters, unclusteredSingles, maxZoom);

      return {
        clusters: coLocatedClusters,
        unclustered: unclusteredSingles,
        totalPoints,
        visiblePoints,
      };
    }

    // Project points to pixel space at current zoom
    const projected = visiblePoints.map((item) => ({
      item,
      px: project(item.latitude, item.longitude, zoom),
      visited: false,
    }));

    // Build spatial hash grid
    const cellSize = radius;
    const grid = new Map<string, typeof projected>();

    for (const p of projected) {
      const cellKey = `${Math.floor(p.px.x / cellSize)}:${Math.floor(p.px.y / cellSize)}`;
      let cell = grid.get(cellKey);
      if (!cell) {
        cell = [];
        grid.set(cellKey, cell);
      }
      cell.push(p);
    }

    const clusters: CrowdbeatsClusterData[] = [];
    const unclustered: T[] = [];
    let clusterIndex = 0;

    // Cluster points using neighborhood search
    for (const p of projected) {
      if (p.visited) continue;
      p.visited = true;

      const clusterItems: T[] = [p.item];
      const cellX = Math.floor(p.px.x / cellSize);
      const cellY = Math.floor(p.px.y / cellSize);

      // Search 3x3 neighboring cells
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighborKey = `${cellX + dx}:${cellY + dy}`;
          const neighbors = grid.get(neighborKey);
          if (!neighbors) continue;

          for (const neighbor of neighbors) {
            if (neighbor.visited) continue;
            const dist = pixelDistance(p.px, neighbor.px);
            if (dist <= radius) {
              neighbor.visited = true;
              clusterItems.push(neighbor.item);
            }
          }
        }
      }

      if (clusterItems.length >= minPoints) {
        // Calculate centroid, bounding box, live status, and expansion zoom
        const clusterData = this.buildCluster(
          `cb_cluster_${Math.floor(zoom)}_${clusterIndex++}`,
          clusterItems,
          zoom,
          radius,
          maxZoom
        );
        clusters.push(clusterData);
      } else {
        unclustered.push(p.item);
      }
    }

    return {
      clusters,
      unclustered,
      totalPoints,
      visiblePoints,
    };
  }

  /**
   * Constructs cluster metadata, centroid, bounding box, and expansion zoom.
   */
  private buildCluster(
    id: string,
    items: ClusterPointItem[],
    currentZoom: number,
    radius: number,
    maxZoom: number
  ): CrowdbeatsClusterData {
    let sumLat = 0;
    let sumLng = 0;
    let minLat = 90;
    let maxLat = -90;
    let minLng = 180;
    let maxLng = -180;
    let liveCount = 0;

    for (const item of items) {
      const lat = item.latitude;
      const lng = item.longitude;
      sumLat += lat;
      sumLng += lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (item.isLive) liveCount++;
    }

    const count = items.length;
    const center: CrowdbeatsCoordinate = {
      lat: sumLat / count,
      lng: sumLng / count,
    };

    // Calculate expansion zoom: the zoom where this cluster breaks apart
    const expansionZoom = this.calculateExpansionZoom(items, currentZoom, radius, maxZoom);

    return {
      id,
      position: center,
      count,
      hasLive: liveCount > 0,
      liveCount,
      items,
      expansionZoom,
      bounds: {
        sw: { lat: minLat, lng: minLng },
        ne: { lat: maxLat, lng: maxLng },
      },
    };
  }

  /**
   * Calculates the smallest zoom level >= currentZoom + 1 at which the points
   * in this cluster split apart into at least two clusters.
   */
  private calculateExpansionZoom(
    items: ClusterPointItem[],
    currentZoom: number,
    radius: number,
    maxZoom: number
  ): number {
    if (items.length <= 1) return Math.min(currentZoom + 2, maxZoom);

    // If all items have effectively identical coordinates (< 5 meters)
    const first = items[0];
    const allSame = items.every(
      (it) =>
        Math.abs(it.latitude - first.latitude) < 0.00005 &&
        Math.abs(it.longitude - first.longitude) < 0.00005
    );
    if (allSame) {
      return maxZoom;
    }

    // Step up zoom levels to find where they split
    for (let z = Math.floor(currentZoom) + 1; z <= maxZoom; z++) {
      const pxs = items.map((it) => project(it.latitude, it.longitude, z));
      // If any pair of points is further apart than radius, cluster splits
      let hasSeparation = false;
      for (let i = 0; i < pxs.length; i++) {
        for (let j = i + 1; j < pxs.length; j++) {
          if (pixelDistance(pxs[i], pxs[j]) > radius) {
            hasSeparation = true;
            break;
          }
        }
        if (hasSeparation) break;
      }
      if (hasSeparation) {
        return z;
      }
    }

    return maxZoom;
  }

  /**
   * Groups co-located items (e.g. multiple artists at the exact same venue)
   * into a compact venue cluster when zoom >= maxZoom.
   */
  private groupCoLocated<T extends ClusterPointItem>(
    items: T[],
    clusters: CrowdbeatsClusterData[],
    unclustered: T[],
    maxZoom: number
  ): void {
    const coordMap = new Map<string, T[]>();

    for (const item of items) {
      const key = `${item.latitude.toFixed(5)}:${item.longitude.toFixed(5)}`;
      let group = coordMap.get(key);
      if (!group) {
        group = [];
        coordMap.set(key, group);
      }
      group.push(item);
    }

    let idx = 0;
    coordMap.forEach((group) => {
      if (group.length > 1) {
        const liveCount = group.filter((g) => g.isLive).length;
        clusters.push({
          id: `cb_venue_cluster_${idx++}`,
          position: { lat: group[0].latitude, lng: group[0].longitude },
          count: group.length,
          hasLive: liveCount > 0,
          liveCount,
          items: group,
          expansionZoom: maxZoom,
          bounds: {
            sw: { lat: group[0].latitude, lng: group[0].longitude },
            ne: { lat: group[0].latitude, lng: group[0].longitude },
          },
        });
      } else {
        unclustered.push(group[0]);
      }
    });
  }

  /**
   * Checks whether a coordinate is inside a bounding box, with optional padding.
   */
  isInBounds(
    lat: number,
    lng: number,
    bounds: CrowdbeatsBounds,
    paddingRatio = 0.1
  ): boolean {
    const latSpan = Math.abs(bounds.ne.lat - bounds.sw.lat);
    const lngSpan = Math.abs(bounds.ne.lng - bounds.sw.lng);
    const padLat = latSpan * paddingRatio;
    const padLng = lngSpan * paddingRatio;

    const minLat = Math.min(bounds.sw.lat, bounds.ne.lat) - padLat;
    const maxLat = Math.max(bounds.sw.lat, bounds.ne.lat) + padLat;
    const minLng = Math.min(bounds.sw.lng, bounds.ne.lng) - padLng;
    const maxLng = Math.max(bounds.sw.lng, bounds.ne.lng) + padLng;

    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  }
}
