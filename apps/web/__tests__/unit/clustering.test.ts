/**
 * Crowdbeats Map Engine — Spatial Clustering Engine Unit Tests (Phase 8)
 * Tests: Mercator projection, spatial hashing grid, cluster aggregation,
 * expansion zoom calculation, co-located point grouping, and viewport filtering.
 */

import {
  CrowdbeatsClusterEngine,
  project,
  unproject,
  type ClusterPointItem,
} from '@/lib/maps/clustering';

describe('CrowdbeatsClusterEngine', () => {
  describe('Mercator Projection', () => {
    it('projects and unprojects coordinates with high precision', () => {
      const lat = 32.7157;
      const lng = -117.1611;
      const zoom = 12;

      const px = project(lat, lng, zoom);
      expect(px.x).toBeGreaterThan(0);
      expect(px.y).toBeGreaterThan(0);

      const coord = unproject(px.x, px.y, zoom);
      expect(coord.lat).toBeCloseTo(lat, 4);
      expect(coord.lng).toBeCloseTo(lng, 4);
    });

    it('handles equator and prime meridian', () => {
      const px = project(0, 0, 10);
      const coord = unproject(px.x, px.y, 10);
      expect(coord.lat).toBeCloseTo(0, 4);
      expect(coord.lng).toBeCloseTo(0, 4);
    });
  });

  describe('Clustering Logic', () => {
    const engine = new CrowdbeatsClusterEngine({ radius: 60, maxZoom: 14, minPoints: 2 });

    it('returns empty result for empty items array', () => {
      const res = engine.cluster([], 10);
      expect(res.clusters).toHaveLength(0);
      expect(res.unclustered).toHaveLength(0);
      expect(res.totalPoints).toBe(0);
    });

    it('combines nearby performers into a cluster when zoomed out', () => {
      // 3 performers in downtown San Diego (within a few blocks of each other)
      const performers: ClusterPointItem[] = [
        { id: 'p1', latitude: 32.7157, longitude: -117.1611, isLive: true, performerName: 'Band A' },
        { id: 'p2', latitude: 32.7160, longitude: -117.1615, isLive: false, performerName: 'Band B' },
        { id: 'p3', latitude: 32.7155, longitude: -117.1608, isLive: true, performerName: 'Band C' },
      ];

      // At zoom 10 (city/regional level), these should form 1 cluster
      const res = engine.cluster(performers, 10);
      expect(res.clusters).toHaveLength(1);
      expect(res.unclustered).toHaveLength(0);

      const cluster = res.clusters[0];
      expect(cluster.count).toBe(3);
      expect(cluster.hasLive).toBe(true);
      expect(cluster.liveCount).toBe(2);
      expect(cluster.position.lat).toBeCloseTo(32.7157, 3);
      expect(cluster.position.lng).toBeCloseTo(-117.1611, 3);
    });

    it('marks cluster as inactive when no performers are live', () => {
      const offlinePerformers: ClusterPointItem[] = [
        { id: 'p1', latitude: 32.7157, longitude: -117.1611, isLive: false },
        { id: 'p2', latitude: 32.7160, longitude: -117.1615, isLive: false },
      ];

      const res = engine.cluster(offlinePerformers, 10);
      expect(res.clusters).toHaveLength(1);
      expect(res.clusters[0].hasLive).toBe(false);
      expect(res.clusters[0].liveCount).toBe(0);
    });

    it('leaves isolated performers unclustered', () => {
      const performers: ClusterPointItem[] = [
        { id: 'sd', latitude: 32.7157, longitude: -117.1611, isLive: true },
        { id: 'la', latitude: 34.0522, longitude: -118.2437, isLive: false },
      ];

      const res = engine.cluster(performers, 10);
      expect(res.clusters).toHaveLength(0);
      expect(res.unclustered).toHaveLength(2);
      expect(res.unclustered.map((p) => p.id)).toEqual(expect.arrayContaining(['sd', 'la']));
    });

    it('breaks apart clusters when zoom is at or beyond maxZoom', () => {
      const performers: ClusterPointItem[] = [
        { id: 'p1', latitude: 32.7157, longitude: -117.1611, isLive: true },
        { id: 'p2', latitude: 32.7180, longitude: -117.1650, isLive: false },
      ];

      // Zoom 15 >= maxZoom 14
      const res = engine.cluster(performers, 15);
      expect(res.clusters).toHaveLength(0);
      expect(res.unclustered).toHaveLength(2);
    });

    it('calculates expansion zoom correctly', () => {
      const performers: ClusterPointItem[] = [
        { id: 'p1', latitude: 32.7157, longitude: -117.1611, isLive: true },
        { id: 'p2', latitude: 32.7250, longitude: -117.1700, isLive: true },
      ];

      const res = engine.cluster(performers, 10);
      expect(res.clusters).toHaveLength(1);
      const cluster = res.clusters[0];
      expect(cluster.expansionZoom).toBeGreaterThan(10);
      expect(cluster.expansionZoom).toBeLessThanOrEqual(14);
    });

    it('groups co-located performers at same venue when zoomed in', () => {
      const venueActs: ClusterPointItem[] = [
        { id: 'act1', latitude: 32.7291, longitude: -117.1706, isLive: true, venueName: 'The Casbah' },
        { id: 'act2', latitude: 32.7291, longitude: -117.1706, isLive: true, venueName: 'The Casbah' },
        { id: 'act3', latitude: 32.7291, longitude: -117.1706, isLive: false, venueName: 'The Casbah' },
      ];

      const res = engine.cluster(venueActs, 15);
      expect(res.clusters).toHaveLength(1);
      expect(res.clusters[0].count).toBe(3);
      expect(res.clusters[0].hasLive).toBe(true);
      expect(res.clusters[0].liveCount).toBe(2);
    });
  });

  describe('Viewport Filtering', () => {
    const engine = new CrowdbeatsClusterEngine();

    it('accurately detects coordinates within bounding box', () => {
      const bounds = {
        sw: { lat: 32.70, lng: -117.20 },
        ne: { lat: 32.75, lng: -117.10 },
      };

      expect(engine.isInBounds(32.72, -117.15, bounds, 0)).toBe(true);
      expect(engine.isInBounds(32.80, -117.15, bounds, 0)).toBe(false);
      expect(engine.isInBounds(32.72, -117.25, bounds, 0)).toBe(false);
      expect(engine.isInBounds(32.752, -117.15, bounds, 0.1)).toBe(true);
    });

    it('filters cluster candidates by viewport bounds', () => {
      const performers: ClusterPointItem[] = [
        { id: 'sd', latitude: 32.7157, longitude: -117.1611, isLive: true },
        { id: 'ny', latitude: 40.7128, longitude: -74.0060, isLive: true },
      ];

      const sdBounds = {
        sw: { lat: 32.65, lng: -117.25 },
        ne: { lat: 32.78, lng: -117.07 },
      };

      const res = engine.cluster(performers, 12, undefined, sdBounds);
      expect(res.totalPoints).toBe(2);
      expect(res.visiblePoints).toHaveLength(1);
      expect(res.visiblePoints[0].id).toBe('sd');
    });
  });
});