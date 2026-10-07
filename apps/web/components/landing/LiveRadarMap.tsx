'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { PublicPerformerItem, PublicVenueItem } from '@/lib/discovery/discoveryClient';
import { useTheme } from '@/components/theme/ThemeProvider';
import { loadMapLibre } from '@/lib/maps/engine/crowdbeatsMapEngine';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Props {
  performers: PublicPerformerItem[];
  venues: PublicVenueItem[];
  center: { lat: number; lng: number };
  cityName: string;
  onSelectPerformer?: (performer: PublicPerformerItem) => void;
}

type LayerMode = 'night' | 'radar' | 'density';

// ── OPENSTREETMAP STYLES (WebGL Acceleration via MapLibre GL) ────
// CARTO raster basemaps served via authenticated proxy endpoint with authorized Referer
// to eliminate both the 403 domain restrictions and the diagonal "API KEY REQUIRED" watermark
const CARTO_PROXY_BASE = '/api/maps/carto/rastertiles';

const OSM_STYLES = {
  // Dark Matter CartoDB tiles (100% OpenStreetMap data, ODbL)
  dark: {
    version: 8 as const,
    name: 'Crowdbeats OSM Dark',
    sources: {
      'osm-tiles': {
        type: 'raster' as const,
        tiles: [`${CARTO_PROXY_BASE}/dark_all/{z}/{x}/{y}.png`],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster' as const,
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
  // Positron CartoDB tiles (Light OpenStreetMap basemap)
  light: {
    version: 8 as const,
    name: 'Crowdbeats OSM Light',
    sources: {
      'osm-tiles': {
        type: 'raster' as const,
        tiles: [`${CARTO_PROXY_BASE}/light_all/{z}/{x}/{y}.png`],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster' as const,
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
  // Voyager CartoDB tiles (Radar Mode basemap)
  voyager: {
    version: 8 as const,
    name: 'Crowdbeats OSM Voyager',
    sources: {
      'osm-tiles': {
        type: 'raster' as const,
        tiles: [`${CARTO_PROXY_BASE}/voyager/{z}/{x}/{y}.png`],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster' as const,
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
  // Standard OpenStreetMap tiles (tile.openstreetmap.org)
  standard: {
    version: 8 as const,
    name: 'Standard OpenStreetMap',
    sources: {
      'osm-tiles': {
        type: 'raster' as const,
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster' as const,
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
  // Satellite Imagery with OSM attribution
  satellite: {
    version: 8 as const,
    name: 'OSM Satellite',
    sources: {
      'osm-tiles': {
        type: 'raster' as const,
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution:
          'Tiles &copy; Esri &mdash; &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster' as const,
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
};

function getStyleForMode(mode: LayerMode, isLight: boolean): any {
  if (mode === 'density') return OSM_STYLES.satellite;
  if (mode === 'radar') return OSM_STYLES.voyager;
  return isLight ? OSM_STYLES.light : OSM_STYLES.dark;
}

export interface StageRideTier {
  id: string;
  name: string;
  tagline: string;
  perk: string;
  amount: number;
  badge?: string;
  icon: string;
  etaMultiplier: string;
}

export const STAGE_TIERS: StageRideTier[] = [
  {
    id: 'tier_fan',
    name: 'Stage Fan',
    tagline: 'Standard Access',
    perk: 'Live stream audio & digital clap',
    amount: 5,
    icon: '⚡',
    etaMultiplier: 'Fastest',
  },
  {
    id: 'tier_pass',
    name: 'Front Row',
    tagline: 'VIP Stage Pass',
    perk: 'Lossless stream & chat badge',
    amount: 10,
    badge: 'Popular',
    icon: '🎟️',
    etaMultiplier: 'Direct',
  },
  {
    id: 'tier_supporter',
    name: 'Crowd Hero',
    tagline: 'Artist Supporter',
    perk: 'Direct song request & verified crown',
    amount: 25,
    badge: 'Top Pick',
    icon: '👑',
    etaMultiplier: 'Priority',
  },
  {
    id: 'tier_producer',
    name: 'Backstage',
    tagline: 'Producer Circle',
    perk: 'Exclusive post-show credit & meetup',
    amount: 50,
    badge: 'Elite',
    icon: '✨',
    etaMultiplier: 'Exclusive',
  },
];

// Fallback urban street grid pathway following city blocks
function computeShortestStreetGridPath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): { lat: number; lng: number }[] {
  const dLat = endLat - startLat;
  const dLng = endLng - startLng;
  if (Math.hypot(dLat, dLng) < 0.0001) {
    return [{ lat: startLat, lng: startLng }, { lat: endLat, lng: endLng }];
  }
  return [
    { lat: startLat, lng: startLng },
    { lat: startLat + dLat * 0.7, lng: startLng },
    { lat: startLat + dLat * 0.7, lng: endLng },
    { lat: endLat, lng: endLng },
  ];
}

export function LiveRadarMap({
  performers,
  venues,
  center,
  cityName,
  onSelectPerformer,
}: Props) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  // Lyft Design Palette (Light & Dark)
  const mp = useMemo(
    () => ({
      containerBg: isLight ? '#F4F6F9' : '#121622',
      containerBorder: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)',
      containerShadow: isLight
        ? '0 20px 60px -12px rgba(0,0,0,0.12), inset 0 1px 0 0 rgba(255,255,255,0.8)'
        : '0 28px 75px -12px rgba(0,0,0,0.85), inset 0 1px 0 0 rgba(255,255,255,0.12)',
      vignette: isLight
        ? 'radial-gradient(circle at 50% 50%, rgba(244,246,249,0.01) 0%, rgba(244,246,249,0.30) 100%)'
        : 'radial-gradient(circle at 50% 50%, rgba(18,22,34,0.05) 0%, rgba(18,22,34,0.55) 100%)',
      glassBg: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(18, 22, 34, 0.88)',
      glassBorder: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
      glassShadow: isLight ? '0 8px 24px rgba(0,0,0,0.08)' : '0 8px 24px rgba(0,0,0,0.5)',
      sheetBg: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(18, 22, 34, 0.94)',
      sheetBorder: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)',
      sheetShadow: isLight
        ? '0 16px 48px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)'
        : '0 24px 60px rgba(0,0,0,0.85), inset 0 1px 0 0 rgba(255,255,255,0.18)',
      handleColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.22)',
      btnBg: isLight ? 'rgba(255,255,255,0.94)' : 'rgba(22, 27, 42, 0.90)',
      btnBorder: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)',
      btnShadow: isLight ? '0 6px 18px rgba(0,0,0,0.08)' : '0 8px 24px rgba(0,0,0,0.5)',
      textPrimary: isLight ? '#0F172A' : '#FFFFFF',
      textSecondary: isLight ? '#475569' : '#94A3B8',
      textMuted: isLight ? '#8A96A8' : '#64748B',
      textSubtle: isLight ? '#64748B' : '#CBD5E1',
      searchText: isLight ? '#0F172A' : '#E2E8F0',
      youLabelBg: isLight ? '#FFFFFF' : '#121622',
      youLabelBorder: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)',
      youLabelText: isLight ? '#0F172A' : '#FFFFFF',
      detailStripBg: isLight ? '#F1F4F9' : 'rgba(255,255,255,0.05)',
      detailStripBorder: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)',
      tipPillBg: isLight ? '#F1F4F9' : 'rgba(255,255,255,0.06)',
      tipPillBorder: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
      lyftPink: '#FF007A',
      lyftPinkHover: '#E81274',
      lyftPinkGlow: 'rgba(255, 0, 122, 0.4)',
    }),
    [isLight]
  );

  const [selectedPerformer, setSelectedPerformer] = useState<PublicPerformerItem | null>(
    performers.find((p) => p.isLive) ?? performers[0] ?? null
  );
  const [selectedVenue, setSelectedVenue] = useState<PublicVenueItem | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'bands' | 'solo'>('all');
  const [layerMode, setLayerMode] = useState<LayerMode>('night');
  const [compassRotation, setCompassRotation] = useState(0);
  const [isLocationPulsing, setIsLocationPulsing] = useState(false);
  const [soundwavesActive, setSoundwavesActive] = useState(true);
  const [selectedTierId, setSelectedTierId] = useState<string>('tier_supporter');
  const [tipAmount, setTipAmount] = useState<number>(25);
  const [currentZoom, setCurrentZoom] = useState<number>(14);

  const centerLat = center.lat;
  const centerLng = center.lng;

  // Sync selected performer when city performers change
  useEffect(() => {
    setSelectedPerformer(performers.find((p) => p.isLive) ?? performers[0] ?? null);
    setSelectedVenue(null);
  }, [performers, centerLat, centerLng]);

  // Listener ("You") GPS simulated position near the center of town
  const userLocation = useMemo(
    () => ({
      name: `${cityName.split(',')[0]} Downtown, You`,
      lat: centerLat - 0.0035,
      lng: centerLng - 0.002,
    }),
    [centerLat, centerLng, cityName]
  );

  // Filter performers based on segmented control
  const filteredPerformers = useMemo(() => {
    return performers.filter((p) => {
      if (activeFilter === 'live') return p.isLive;
      if (activeFilter === 'bands') return p.type === 'band';
      if (activeFilter === 'solo') return p.type === 'artist';
      return true;
    });
  }, [performers, activeFilter]);

  // MapLibre DOM & instance refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Map markers: id -> ml.Marker
  const markersMapRef = useRef<Map<string, any>>(new Map());
  const portalContainersRef = useRef<{ [id: string]: HTMLDivElement }>({});
  const [portalContainers, setPortalContainers] = useState<{ [id: string]: HTMLDivElement }>({});

  // Route metadata
  const [rawRouteGeoPoints, setRawRouteGeoPoints] = useState<{ lat: number; lng: number }[] | null>(null);
  const [routeMeta, setRouteMeta] = useState<{ durationText: string; distanceMilesText: string } | null>(null);

  // Calculate shortest street-grid route following city blocks with solid lines
  useEffect(() => {
    const targetLat = selectedPerformer?.latitude ?? selectedVenue?.latitude ?? null;
    const targetLng = selectedPerformer?.longitude ?? selectedVenue?.longitude ?? null;

    if (!targetLat || !targetLng) {
      setRawRouteGeoPoints(null);
      setRouteMeta(null);
      return;
    }

    const streetPath = computeShortestStreetGridPath(
      userLocation.lat,
      userLocation.lng,
      targetLat,
      targetLng
    );
    const dMiles = Math.max(
      0.1,
      Number(
        Math.hypot(
          (targetLat - userLocation.lat) * 69,
          (targetLng - userLocation.lng) * 54
        ).toFixed(1)
      )
    );
    const walkMins = Math.max(1, Math.round(dMiles * 20));

    setRawRouteGeoPoints(streetPath);
    setRouteMeta({
      durationText: `${walkMins} min walk`,
      distanceMilesText: `${dMiles} mi`,
    });
  }, [selectedPerformer?.id, selectedVenue?.id, userLocation.lat, userLocation.lng]);

  // Synchronize GeoJSON route line layers
  const syncRoutePolyline = useCallback(
    (map: any, pts: { lat: number; lng: number }[] | null, lightTheme: boolean) => {
      if (!map || !map.isStyleLoaded()) return;

      const coords = pts && pts.length > 0 ? pts.map((p) => [p.lng, p.lat]) : [];
      const geojson: any = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
      };

      const source = map.getSource('cb-route-source');
      if (source) {
        source.setData(geojson);
      } else {
        map.addSource('cb-route-source', {
          type: 'geojson',
          data: geojson,
        });

        // Outer Glow Layer
        map.addLayer({
          id: 'cb-route-glow',
          type: 'line',
          source: 'cb-route-source',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': lightTheme ? 'rgba(232, 18, 116, 0.28)' : 'rgba(255, 0, 122, 0.38)',
            'line-width': 12,
            'line-blur': 6,
            'line-opacity': 0.85,
          },
        });

        // Solid Navigation Route Line
        map.addLayer({
          id: 'cb-route-solid',
          type: 'line',
          source: 'cb-route-source',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#FF007A',
            'line-width': 5,
            'line-opacity': 1.0,
          },
        });
      }
    },
    []
  );

  // Initialize MapLibre GL OpenStreetMap instance
  useEffect(() => {
    let isCancelled = false;

    loadMapLibre()
      .then((ml) => {
        if (isCancelled || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const initialStyle = getStyleForMode(layerMode, isLight);

          const map = new ml.Map({
            container: mapContainerRef.current,
            style: initialStyle as any,
            center: [centerLng, centerLat],
            zoom: 14,
            minZoom: 10,
            maxZoom: 19,
            attributionControl: false,
            dragRotate: false,
            touchPitch: false,
            pitchWithRotate: false,
          });

          map.on('zoom', () => {
            const z = map.getZoom();
            if (typeof z === 'number') setCurrentZoom(z);
          });

          map.on('error', (e: any) => {
            // Silently swallow cancelled tile requests during fast zoom/pan
            if (!e || e?.error?.status === 0 || e?.status === 0) return;
          });

          map.on('load', () => {
            if (isCancelled) return;
            mapInstanceRef.current = map;
            setMapLoaded(true);
            syncRoutePolyline(map, rawRouteGeoPoints, isLight);
          });
        } else {
          mapInstanceRef.current.easeTo({
            center: [centerLng, centerLat],
            zoom: 14,
            duration: 600,
          });
        }
      })
      .catch((err) => {
        console.error('[LiveRadarMapOSM] Failed to load MapLibre GL:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [centerLat, centerLng]);

  // Handle Layer Mode or Theme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    const nextStyle = getStyleForMode(layerMode, isLight);
    map.setStyle(nextStyle as any);

    map.once('style.load', () => {
      syncRoutePolyline(map, rawRouteGeoPoints, isLight);
    });
  }, [layerMode, isLight, mapLoaded, syncRoutePolyline, rawRouteGeoPoints]);

  // Update Route Polyline when coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;
    syncRoutePolyline(map, rawRouteGeoPoints, isLight);
  }, [rawRouteGeoPoints, mapLoaded, isLight, syncRoutePolyline]);

  // Adjust Polyline Street Route stroke weight dynamically according to zoom
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !map.isStyleLoaded()) return;

    let solidWeight = 5;
    if (currentZoom <= 11) solidWeight = 3.5;
    else if (currentZoom <= 13) solidWeight = 4.5;
    else if (currentZoom >= 17) solidWeight = 8;
    else if (currentZoom >= 15) solidWeight = 6.5;

    if (map.getLayer('cb-route-solid')) {
      map.setPaintProperty('cb-route-solid', 'line-width', solidWeight);
    }
    if (map.getLayer('cb-route-glow')) {
      map.setPaintProperty('cb-route-glow', 'line-width', solidWeight * 2.2);
    }
  }, [currentZoom, mapLoaded]);

  // Synchronize MapLibre Markers for all entities
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    let isCancelled = false;

    loadMapLibre().then((ml) => {
      if (isCancelled) return;

      const items: { id: string; lat: number; lng: number; isCenterAnchor?: boolean }[] = [
        { id: 'user_listener_puck', lat: userLocation.lat, lng: userLocation.lng, isCenterAnchor: true },
        ...venues.map((v) => ({ id: v.id, lat: v.latitude, lng: v.longitude })),
        ...performers.map((p) => ({ id: p.id, lat: p.latitude, lng: p.longitude })),
      ];

      const activeIds = new Set(items.map((it) => it.id));
      const markers = markersMapRef.current;
      const containers = portalContainersRef.current;

      // Remove obsolete markers
      for (const [id, markerInstance] of markers.entries()) {
        if (!activeIds.has(id)) {
          markerInstance.remove();
          markers.delete(id);
          delete containers[id];
        }
      }

      // Add or update markers
      for (const item of items) {
        if (markers.has(item.id)) {
          const marker = markers.get(item.id);
          marker.setLngLat([item.lng, item.lat]);
        } else {
          const div = document.createElement('div');
          div.id = `radar-overlay-${item.id}`;
          div.style.position = 'absolute';
          div.style.pointerEvents = 'auto';

          const marker = new ml.Marker({
            element: div,
            anchor: item.isCenterAnchor ? 'center' : 'bottom',
          })
            .setLngLat([item.lng, item.lat])
            .addTo(map);

          markers.set(item.id, marker);
          containers[item.id] = div;
        }
      }

      setPortalContainers({ ...containers });
    });

    return () => {
      isCancelled = true;
    };
  }, [mapLoaded, venues, performers, userLocation]);

  // Clean up markers and map on unmount
  useEffect(() => {
    return () => {
      for (const [, marker] of markersMapRef.current.entries()) {
        marker.remove();
      }
      markersMapRef.current.clear();
      portalContainersRef.current = {};
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Controls Handlers
  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  }, []);

  const handleCompassClick = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.easeTo({
        center: [center.lng, center.lat],
        bearing: 0,
        pitch: 0,
        zoom: 14,
        duration: 800,
      });
      setCompassRotation((prev) => prev + 360);
    }
  }, [center]);

  const handleLocationClick = useCallback(() => {
    if (mapInstanceRef.current) {
      setIsLocationPulsing(true);
      mapInstanceRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 16,
        essential: true,
        duration: 800,
      });
      setTimeout(() => setIsLocationPulsing(false), 2200);
    }
  }, [userLocation]);

  return (
    <div
      id="live-radar-map-container"
      style={{
        position: 'relative',
        borderRadius: 28,
        overflow: 'hidden',
        border: `1px solid ${mp.containerBorder}`,
        boxShadow: mp.containerShadow,
        backgroundColor: mp.containerBg,
        height: 680,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes lyft-pulse-wave {
              0% { transform: scale(0.85); opacity: 0.85; }
              70% { transform: scale(2.2); opacity: 0; }
              100% { transform: scale(0.85); opacity: 0; }
            }
            @keyframes lyft-fast-pulse {
              0% { transform: scale(0.9); opacity: 0.95; }
              70% { transform: scale(2.8); opacity: 0; }
              100% { transform: scale(0.9); opacity: 0; }
            }
            @keyframes cb-equalizer-bar {
              0%, 100% { height: 4px; }
              50% { height: 16px; }
            }
            @keyframes lyft-sheet-slide {
              0% { transform: translateY(24px) scale(0.97); opacity: 0; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
            .maplibregl-ctrl-bottom-right,
            .maplibregl-ctrl-bottom-left,
            .maplibregl-ctrl-top-right,
            .maplibregl-ctrl-top-left,
            .maplibregl-ctrl-attrib,
            .maplibregl-compact,
            .maplibregl-ctrl {
              display: none !important;
            }
          `,
        }}
      />

      {/* ── NATIVE HARDWARE-ACCELERATED OPENSTREETMAP CANVAS ────── */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
        }}
      />

      {/* ── MAP VIGNETTE OVERLAY ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: mp.vignette,
          pointerEvents: 'none',
          zIndex: 4,
        }}
      />

      {/* ── REACT PORTALS: ANCHORED DIRECTLY TO MAPLIBRE MARKERS ─── */}
      {/* 1. Listener Location Puck ("You") */}
      {portalContainers['user_listener_puck'] &&
        createPortal(
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
              transform: `scale(${Math.max(0.72, Math.min(1.35, 1 + (currentZoom - 14) * 0.08))})`,
              transformOrigin: '50% 50%',
              transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: 18,
            }}
          >
            {/* Concentric Audio Radar Wave */}
            <div
              style={{
                position: 'absolute',
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(255, 0, 122, 0.22)',
                animation: 'lyft-pulse-wave 2.4s ease-out infinite',
              }}
            />
            {isLocationPulsing && (
              <div
                style={{
                  position: 'absolute',
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: 'rgba(255, 0, 122, 0.45)',
                  animation: 'lyft-fast-pulse 0.9s ease-out infinite',
                }}
              />
            )}

            {/* Floating Listener Location Capsule */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  background: mp.youLabelBg,
                  backdropFilter: 'blur(16px)',
                  color: mp.youLabelText,
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  padding: '3px 10px',
                  borderRadius: 9999,
                  whiteSpace: 'nowrap',
                  border: `1px solid ${mp.youLabelBorder}`,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ color: '#FF007A' }}>🎧</span>
                <span>You · Listener Location</span>
              </div>
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: `5px solid ${mp.youLabelBg}`,
                }}
              />
            </div>

            {/* Center Listener Puck (White Ring with Magenta Core) */}
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 0 16px rgba(255, 0, 122, 0.85), 0 4px 10px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: '#FF007A',
                }}
              />
            </div>
          </div>,
          portalContainers['user_listener_puck']
        )}

      {/* 2. Destination Stage Beacons (🎪) */}
      {venues.map((venue) => {
        const container = portalContainers[venue.id];
        if (!container) return null;

        const isSelected = selectedVenue?.id === venue.id;
        const isHovered = hoveredId === venue.id;
        const zoomScale = Math.max(0.68, Math.min(1.35, 1 + (currentZoom - 14) * 0.08));
        const finalScale = (isSelected || isHovered ? 1.18 : 1) * zoomScale;

        return createPortal(
          <button
            type="button"
            key={venue.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedVenue(venue);
              setSelectedPerformer(null);
            }}
            onMouseEnter={() => setHoveredId(venue.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `scale(${finalScale})`,
              transformOrigin: '50% 100%',
              transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: isSelected ? 30 : 16,
            }}
          >
            {/* Destination Badge */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, #1E2538 0%, #0F1420 100%)',
                border: '2px solid rgba(255, 255, 255, 0.85)',
                borderRadius: 16,
                width: 42,
                height: 42,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                boxShadow: isSelected
                  ? '0 0 24px rgba(255, 0, 122, 0.8), 0 6px 18px rgba(0,0,0,0.5)'
                  : '0 6px 18px rgba(0,0,0,0.4)',
              }}
            >
              🎪
            </div>

            {/* Live Count Pill */}
            <div
              style={{
                background: '#FF007A',
                color: '#FFFFFF',
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.04em',
                padding: '2px 8px',
                borderRadius: 9999,
                marginTop: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                whiteSpace: 'nowrap',
              }}
            >
              {venue.activeMusicianCount} STAGE
            </div>
          </button>,
          container
        );
      })}

      {/* 3. Performer Pins */}
      {filteredPerformers.map((performer) => {
        const container = portalContainers[performer.id];
        if (!container) return null;

        const live = performer.isLive;
        const isSelected = selectedPerformer?.id === performer.id;
        const isHovered = hoveredId === performer.id;
        const zoomScale = Math.max(0.68, Math.min(1.35, 1 + (currentZoom - 14) * 0.08));
        const finalScale = (isSelected ? 1.22 : isHovered ? 1.14 : 1) * zoomScale;

        return createPortal(
          <button
            type="button"
            key={performer.id}
            data-radar-puck={performer.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPerformer(performer);
              setSelectedVenue(null);
            }}
            onMouseEnter={() => setHoveredId(performer.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `scale(${finalScale})`,
              transformOrigin: '50% 100%',
              transition: 'transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: isSelected ? 35 : live ? 26 : 18,
            }}
          >
            {/* Floating ETA Speech Bubble */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: isLight ? '#FFFFFF' : '#121622',
                  backdropFilter: 'blur(16px)',
                  color: isLight ? '#0F172A' : '#FFFFFF',
                  fontSize: 9.5,
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  padding: '3px 9px',
                  borderRadius: 9999,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                  border: `1px solid ${
                    isSelected
                      ? '#FF007A'
                      : live
                      ? '#10B981'
                      : isLight
                      ? 'rgba(0,0,0,0.1)'
                      : 'rgba(255, 255, 255, 0.15)'
                  }`,
                  whiteSpace: 'nowrap',
                }}
              >
                {live ? (
                  <>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        boxShadow: '0 0 6px #10B981',
                        display: 'inline-block',
                      }}
                    />
                    <span>
                      {isSelected && routeMeta ? routeMeta.durationText.toUpperCase() : '3 MIN WALK'}
                    </span>
                  </>
                ) : (
                  <span>
                    {isSelected && routeMeta ? `${routeMeta.distanceMilesText} AWAY` : '0.4 MI AWAY'}
                  </span>
                )}
              </div>
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: `5px solid ${isLight ? '#FFFFFF' : '#121622'}`,
                  marginTop: -1,
                }}
              />
            </div>

            {/* Performer Marker Disc */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: live
                  ? 'radial-gradient(circle at 35% 35%, #059669 0%, #064E3B 100%)'
                  : 'radial-gradient(circle at 35% 35%, #334155 0%, #0F172A 100%)',
                border: `2.5px solid ${
                  isSelected ? '#FF007A' : live ? '#10B981' : 'rgba(255, 255, 255, 0.3)'
                }`,
                boxShadow: isSelected
                  ? '0 0 28px rgba(255, 0, 122, 0.9), 0 8px 20px rgba(0,0,0,0.55)'
                  : live
                  ? '0 0 20px rgba(16, 185, 129, 0.7), 0 6px 16px rgba(0,0,0,0.45)'
                  : '0 6px 14px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {/* Face Photo */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <img
                  src={
                    performer.photoUrl ||
                    (performer.type === 'band'
                      ? '/instagram/repost_4_velvet_room_band.jpg'
                      : '/instagram/repost_1_tomwhite.jpg')
                  }
                  alt={performer.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      performer.type === 'band'
                        ? '/instagram/repost_4_velvet_room_band.jpg'
                        : '/instagram/repost_1_tomwhite.jpg';
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>

              {/* Type Badge: Solo 🎤 or Band 👥 */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 17,
                  height: 17,
                  borderRadius: '50%',
                  background:
                    performer.type === 'band'
                      ? 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)'
                      : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                  border: '1.5px solid #FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  zIndex: 2,
                }}
                title={performer.type === 'band' ? 'Band' : 'Solo Musician'}
              >
                {performer.type === 'band' ? '👥' : '🎤'}
              </div>

              {/* Soundwave equalizer micro-indicator inside puck if live */}
              {live && soundwavesActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 1.5,
                    height: 10,
                    zIndex: 3,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    padding: '1px 3px',
                    borderRadius: 4,
                  }}
                >
                  <span
                    style={{
                      width: 2,
                      background: '#34D399',
                      borderRadius: 1,
                      animation: 'cb-equalizer-bar 0.7s ease-in-out infinite alternate',
                    }}
                  />
                  <span
                    style={{
                      width: 2,
                      background: '#34D399',
                      borderRadius: 1,
                      animation: 'cb-equalizer-bar 0.5s ease-in-out infinite alternate 0.2s',
                    }}
                  />
                  <span
                    style={{
                      width: 2,
                      background: '#34D399',
                      borderRadius: 1,
                      animation: 'cb-equalizer-bar 0.8s ease-in-out infinite alternate 0.4s',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Marker Anchor Pointer */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: `6px solid ${isSelected ? '#FF007A' : live ? '#10B981' : '#334155'}`,
                marginTop: -1,
              }}
            />
          </button>,
          container
        );
      })}

      {/* ── TOP FLOATING BAR: UBER / LYFT "WHERE TO?" ROUTE CARD ── */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          zIndex: 40,
          pointerEvents: 'none',
        }}
      >
        {/* Uber/Lyft Route Itinerary Card */}
        <div
          style={{
            pointerEvents: 'auto',
            background: mp.sheetBg,
            backdropFilter: 'blur(32px) saturate(190%)',
            borderRadius: 20,
            padding: '12px 18px',
            border: `1px solid ${mp.sheetBorder}`,
            boxShadow: mp.sheetShadow,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minWidth: 320,
            maxWidth: 460,
            flex: '1 1 320px',
          }}
        >
          {/* Header Row: City & Live Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#FF007A', fontWeight: 800 }}>⚡</span>
              <span style={{ fontSize: 13, color: mp.textPrimary, fontWeight: 800 }}>
                {cityName} · Live Stage Radar
              </span>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                padding: '2px 8px',
                borderRadius: 9999,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              ● {performers.filter((p) => p.isLive).length} LIVE NOW
            </span>
          </div>

          {/* Route Dots & Labels (Uber / Lyft Pattern) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Vertical Route Dots Graphic */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                paddingTop: 3,
              }}
            >
              {/* Origin Dot (Green Listener Location) */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)',
                }}
              />
              <div
                style={{
                  width: 1.5,
                  height: 16,
                  backgroundColor: isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.25)',
                  borderRadius: 1,
                }}
              />
              {/* Destination Square (Stage / Street Fair Pin) */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: '#FF007A',
                  boxShadow: '0 0 6px rgba(255, 0, 122, 0.8)',
                }}
              />
            </div>

            {/* Origin & Destination Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: 12,
                    color: mp.textSecondary,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span>🎧</span>
                  <span>Your Location · Exploring Live Music</span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: 13,
                      color: mp.textPrimary,
                      fontWeight: 800,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedPerformer
                      ? selectedPerformer.name
                      : selectedVenue
                      ? selectedVenue.name
                      : 'Find Solo Musicians, Bands & Street Fairs'}
                  </span>
                  {selectedPerformer && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                        background:
                          selectedPerformer.type === 'band'
                            ? 'rgba(139, 92, 246, 0.16)'
                            : 'rgba(236, 72, 153, 0.16)',
                        color:
                          selectedPerformer.type === 'band' ? '#8B5CF6' : '#EC4899',
                      }}
                    >
                      {selectedPerformer.type === 'band' ? '🎸 Band' : '🎤 Solo'}
                    </span>
                  )}
                  {selectedPerformer?.currentVenueName && (
                    <span
                      style={{
                        fontSize: 11,
                        color: mp.textMuted,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      @ {selectedPerformer.currentVenueName}
                    </span>
                  )}
                  {selectedPerformer && !selectedPerformer.currentVenueName && (
                    <span
                      style={{
                        fontSize: 11,
                        color: mp.textMuted,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      @ Street Fair Stage
                    </span>
                  )}
                  {selectedVenue && !selectedPerformer && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                        background: 'rgba(255, 0, 122, 0.16)',
                        color: '#FF007A',
                      }}
                    >
                      🎪 Venue / Street Fair
                    </span>
                  )}
                </div>
                {routeMeta && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#FF007A',
                      whiteSpace: 'nowrap',
                      background: isLight ? 'rgba(255, 0, 122, 0.08)' : 'rgba(255, 0, 122, 0.16)',
                      padding: '2px 7px',
                      borderRadius: 6,
                    }}
                  >
                    {routeMeta.durationText}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Uber/Lyft Segmented Category Filter Chips */}
        <div
          style={{
            pointerEvents: 'auto',
            background: mp.glassBg,
            backdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: 9999,
            padding: '4px',
            border: `1px solid ${mp.glassBorder}`,
            boxShadow: mp.glassShadow,
            display: 'flex',
            gap: 4,
          }}
        >
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'live', label: '● Live' },
              { id: 'bands', label: '🎸 Bands' },
              { id: 'solo', label: '🎤 Solo' },
            ] as const
          ).map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, #FF007A 0%, #D91680 100%)'
                    : 'transparent',
                  color: isActive ? '#FFFFFF' : mp.textSecondary,
                  fontSize: 12,
                  fontWeight: isActive ? 800 : 600,
                  border: 'none',
                  borderRadius: 9999,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: isActive ? '0 3px 10px rgba(255, 0, 122, 0.4)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT FLOATING ACTION STACK (CIRCULAR CONTROLS) ───────── */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 40,
        }}
      >
        {/* Recenter Crosshairs Button */}
        <button
          type="button"
          onClick={handleLocationClick}
          title="Re-center My Location"
          aria-label="Re-center My Location"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: mp.btnBg,
            backdropFilter: 'blur(20px) saturate(180%)',
            border: `1px solid ${isLocationPulsing ? '#FF007A' : mp.btnBorder}`,
            boxShadow: isLocationPulsing ? '0 0 20px rgba(255, 0, 122, 0.75)' : mp.btnShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            color: isLocationPulsing ? '#FF007A' : mp.textPrimary,
            transition: 'all 0.2s ease',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="7" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </button>

        {/* North Compass Button */}
        <button
          type="button"
          onClick={handleCompassClick}
          title="Reset North Orientation"
          aria-label="Reset North Orientation"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: mp.btnBg,
            backdropFilter: 'blur(20px) saturate(180%)',
            border: `1px solid ${mp.btnBorder}`,
            boxShadow: mp.btnShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: `rotate(${compassRotation}deg)`,
          }}
        >
          <div style={{ position: 'relative', width: 22, height: 22 }}>
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '3.5px solid transparent',
                borderRight: '3.5px solid transparent',
                borderBottom: '9px solid #EF4444',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 2,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '3.5px solid transparent',
                borderRight: '3.5px solid transparent',
                borderTop: `9px solid ${mp.textSecondary}`,
              }}
            />
          </div>
        </button>

        {/* Layer Mode Toggle (Dark OSM / Standard OSM / Satellite OSM) */}
        <button
          type="button"
          onClick={() =>
            setLayerMode((prev) =>
              prev === 'night' ? 'radar' : prev === 'radar' ? 'density' : 'night'
            )
          }
          title={`Layer Mode: ${
            layerMode === 'night'
              ? 'Dark Matter'
              : layerMode === 'radar'
              ? 'Standard'
              : 'Satellite'
          }`}
          aria-label={`Layer Mode: ${layerMode}`}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: mp.btnBg,
            backdropFilter: 'blur(20px) saturate(180%)',
            border: `1px solid ${mp.btnBorder}`,
            boxShadow: mp.btnShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            fontSize: 17,
          }}
        >
          {layerMode === 'night' ? '🌙' : layerMode === 'radar' ? '🗺️' : '🛰️'}
        </button>

        {/* Live Soundwave Equalizer Toggle */}
        <button
          type="button"
          onClick={() => setSoundwavesActive((v) => !v)}
          title="Toggle Stage Equalizers"
          aria-label="Toggle Stage Equalizers"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: soundwavesActive ? 'rgba(16, 185, 129, 0.25)' : mp.btnBg,
            backdropFilter: 'blur(20px) saturate(180%)',
            border: `1px solid ${soundwavesActive ? '#10B981' : mp.btnBorder}`,
            boxShadow: mp.btnShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            fontSize: 17,
          }}
        >
          🔊
        </button>

        {/* Zoom Capsule (+ / −) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 22,
            background: mp.btnBg,
            backdropFilter: 'blur(20px) saturate(180%)',
            border: `1px solid ${mp.btnBorder}`,
            boxShadow: mp.btnShadow,
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            data-zoom-in
            onClick={handleZoomIn}
            disabled={currentZoom >= 19}
            title="Zoom In (+)"
            aria-label="Zoom In"
            style={{
              width: 44,
              height: 38,
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${mp.btnBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: currentZoom >= 19 ? 'not-allowed' : 'pointer',
              padding: 0,
              color: currentZoom >= 19 ? mp.textSecondary : mp.textPrimary,
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1,
              opacity: currentZoom >= 19 ? 0.35 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            +
          </button>
          <button
            type="button"
            data-zoom-out
            onClick={handleZoomOut}
            disabled={currentZoom <= 10}
            title="Zoom Out (−)"
            aria-label="Zoom Out"
            style={{
              width: 44,
              height: 38,
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: currentZoom <= 10 ? 'not-allowed' : 'pointer',
              padding: 0,
              color: currentZoom <= 10 ? mp.textSecondary : mp.textPrimary,
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1,
              opacity: currentZoom <= 10 ? 0.35 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            −
          </button>
        </div>
      </div>

      {/* ── FLOATING BOTTOM SHEET: UBER/LYFT RIDE-TIER STAGE DRAWER ─ */}
      {selectedPerformer && (
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            right: 14,
            maxWidth: 720,
            margin: '0 auto',
            background: mp.sheetBg,
            backdropFilter: 'blur(32px) saturate(190%)',
            borderRadius: 24,
            padding: '16px 20px',
            border: `1px solid ${mp.sheetBorder}`,
            boxShadow: mp.sheetShadow,
            zIndex: 50,
            animation: 'lyft-sheet-slide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 11,
          }}
        >
          {/* Pull Handle */}
          <div
            style={{
              width: 36,
              height: 4,
              backgroundColor: mp.handleColor,
              borderRadius: 9999,
              margin: '0 auto -4px',
            }}
          />

          {/* Performer Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Avatar Puck with Live Status */}
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  border: `2.5px solid ${selectedPerformer.isLive ? '#10B981' : '#FF007A'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: selectedPerformer.isLive
                    ? '0 4px 14px rgba(16, 185, 129, 0.4)'
                    : '0 4px 14px rgba(255, 0, 122, 0.4)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={
                      selectedPerformer.photoUrl ||
                      (selectedPerformer.type === 'band'
                        ? '/instagram/repost_4_velvet_room_band.jpg'
                        : '/instagram/repost_1_tomwhite.jpg')
                    }
                    alt={selectedPerformer.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        selectedPerformer.type === 'band'
                          ? '/instagram/repost_4_velvet_room_band.jpg'
                          : '/instagram/repost_1_tomwhite.jpg';
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>

                {/* Type Badge: Solo 🎤 or Band 👥 */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background:
                      selectedPerformer.type === 'band'
                        ? 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)'
                        : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                    border: '1.5px solid #FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                    zIndex: 2,
                  }}
                  title={selectedPerformer.type === 'band' ? 'Band' : 'Solo Musician'}
                >
                  {selectedPerformer.type === 'band' ? '👥' : '🎤'}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 17,
                      fontWeight: 900,
                      color: mp.textPrimary,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {selectedPerformer.name}
                  </span>
                  {selectedPerformer.isVerified && (
                    <span style={{ color: '#38BDF8', fontSize: 13 }} title="Verified Performer">✓</span>
                  )}
                  {selectedPerformer.isLive && (
                    <span
                      style={{
                        background: '#10B981',
                        color: '#FFFFFF',
                        fontSize: 9,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 9999,
                      }}
                    >
                      ● LIVE ON STAGE
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: mp.textSecondary,
                    marginTop: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: selectedPerformer.type === 'band' ? '#8B5CF6' : '#EC4899',
                    }}
                  >
                    {selectedPerformer.type === 'band' ? '🎸 Live Band' : '🎤 Solo Musician'}
                  </span>
                  <span>•</span>
                  <span>{selectedPerformer.genres.join(' • ')}</span>
                  <span>•</span>
                  <span>
                    {selectedPerformer.currentVenueName
                      ? `🎪 ${selectedPerformer.currentVenueName}`
                      : '🎪 Street Fair Stage'}
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedPerformer(null)}
              aria-label="Close"
              style={{
                background: mp.detailStripBg,
                border: 'none',
                color: mp.textSecondary,
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>

          {/* Live Stage Walking & Proximity Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: mp.detailStripBg,
              borderRadius: 14,
              padding: '8px 14px',
              border: `1px solid ${mp.detailStripBorder}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                color: mp.textPrimary,
              }}
            >
              <span>🚶‍♂️</span>
              <span style={{ fontWeight: 800, color: '#FF007A' }}>
                {routeMeta?.durationText || '3 min walk'}
              </span>
              <span style={{ color: mp.textMuted }}>•</span>
              <span style={{ color: mp.textSubtle }}>
                {routeMeta?.distanceMilesText
                  ? `${routeMeta.distanceMilesText} from your location`
                  : '0.2 mi from your location'}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11.5,
                color: '#10B981',
                fontWeight: 800,
              }}
            >
              <span>⚡ Street Route Active</span>
            </div>
          </div>

          {/* Uber / Lyft Style Tier Comparison Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 8,
            }}
          >
            {STAGE_TIERS.map((tier) => {
              const isSelected = tipAmount === tier.amount;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => {
                    setSelectedTierId(tier.id);
                    setTipAmount(tier.amount);
                  }}
                  style={{
                    position: 'relative',
                    borderRadius: 16,
                    padding: '10px 10px',
                    border: isSelected
                      ? '2px solid #FF007A'
                      : `1px solid ${mp.tipPillBorder}`,
                    background: isSelected
                      ? isLight
                        ? 'rgba(255, 0, 122, 0.06)'
                        : 'rgba(255, 0, 122, 0.14)'
                      : mp.tipPillBg,
                    boxShadow: isSelected
                      ? '0 6px 18px rgba(255, 0, 122, 0.25)'
                      : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.16s ease',
                  }}
                >
                  {/* Badge (e.g. Top Pick / Popular) */}
                  {tier.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -7,
                        right: 8,
                        background: isSelected ? '#FF007A' : '#64748B',
                        color: '#FFFFFF',
                        fontSize: 8.5,
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 9999,
                        letterSpacing: '0.02em',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                    >
                      {tier.badge}
                    </span>
                  )}

                  {/* Icon & Price */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{tier.icon}</span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 900,
                        color: isSelected ? '#FF007A' : mp.textPrimary,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      ${tier.amount}
                    </span>
                  </div>

                  {/* Tier Name */}
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: mp.textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                    }}
                  >
                    {tier.name}
                  </div>

                  {/* Tagline / Perk */}
                  <div
                    style={{
                      fontSize: 10,
                      color: mp.textSecondary,
                      marginTop: 2,
                      lineHeight: 1.25,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {tier.perk}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Checkout Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Payment Method Badge (Uber / Lyft style) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                borderRadius: 14,
                background: mp.detailStripBg,
                border: `1px solid ${mp.detailStripBorder}`,
                color: mp.textPrimary,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <span>💳</span>
              <span>Apple Pay</span>
              <span style={{ color: mp.textMuted }}>•••• 4242</span>
            </div>

            {/* Instant Tip Action CTA Button */}
            <button
              type="button"
              onClick={() => {
                if (onSelectPerformer) onSelectPerformer(selectedPerformer);
              }}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #FF007A 0%, #D91680 100%)',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: '-0.01em',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 22px rgba(255, 0, 122, 0.45)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.015)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              <span>Tip ${tipAmount} & Join Live Stage</span>
              <span>⚡</span>
            </button>
          </div>
        </div>
      )}

      {/* ── VENUE SELECTED FLOATING CARD ─────────────────────────── */}
      {selectedVenue && !selectedPerformer && (
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            right: 14,
            maxWidth: 580,
            margin: '0 auto',
            background: mp.sheetBg,
            backdropFilter: 'blur(32px) saturate(190%)',
            borderRadius: 22,
            padding: '16px 20px',
            border: '1px solid rgba(255, 0, 122, 0.3)',
            boxShadow: mp.sheetShadow,
            zIndex: 50,
            animation: 'lyft-sheet-slide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 34 }}>🎪</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: mp.textPrimary, fontWeight: 800, fontSize: 16 }}>
                  {selectedVenue.name}
                </span>
                <span
                  style={{
                    background: '#FF007A',
                    color: '#FFFFFF',
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 9999,
                  }}
                >
                  {selectedVenue.activeMusicianCount} MUSICIANS LIVE ON STAGE
                </span>
              </div>
              <div style={{ color: mp.textSecondary, fontSize: 12, marginTop: 2 }}>
                {selectedVenue.address ?? 'Live Music Venue & Street Fair Stage'} · 0.4 mi away
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedVenue(null)}
            aria-label="Close"
            style={{
              background: mp.detailStripBg,
              border: 'none',
              color: mp.textSecondary,
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
