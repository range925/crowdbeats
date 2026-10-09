'use client';

/**
 * Crowdbeats V2 — DiscoverMap Component
 * Interactive Uber/Lyft-inspired Google Map component for Live Discovery (#discover).
 *
 * Responsibilities:
 *  - Quiet, premium Uber/Lyft-inspired map presentation with soft neutral land, subtle parks,
 *    gentle water, and clear highways, while commercial POI/transit clutter is hidden.
 *  - Full dark mode support responding to `html[data-theme='dark']` via MutationObserver.
 *  - Responsive container with 20-24px rounded corners and preserved Google attribution.
 *  - Smooth camera movement (600-1000ms transition) using Google Maps native APIs.
 *  - Context-aware zoom: Neighborhoods (14-15), Cities (12-13), Regions/Countries (7-9).
 *  - Honors `prefers-reduced-motion` with immediate movement.
 *  - Cancel / supersede previous camera transition if a new search is selected.
 *  - Top 5 numbered SVG markers (1 to 5) with Solo Musician vs Band distinctions,
 *    Live Now pulsing green indicator, and selected violet halo (#7C3AED / #A78BFA).
 *  - Search center marker: subtle hollow ring at selected search coordinates.
 *  - Floating map controls: Zoom In (+), Zoom Out (-), Recenter, and "Search this area" pill.
 */

import React, { useCallback, useEffect, useLayoutEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LiveCheckin } from '@/lib/firebase/firestore';
import styles from './map.module.css';

export interface DiscoverMapCenter {
  lat: number;
  lng: number;
  label: string;
  zoom?: number;
  placeType?: 'neighborhood' | 'city' | 'region' | 'country' | string;
}

export interface DiscoverMapProps {
  center: DiscoverMapCenter;
  performers: LiveCheckin[];
  selectedId?: string | null;
  onSelect?: (uid: string) => void;
  onSelectPerformer?: (uid: string) => void;
  onSearchArea?: (newCenter: { lat: number; lng: number; zoom: number }) => void;
  visibleKey?: string;
  className?: string;
  style?: React.CSSProperties;
}

/* ── Map Style: Light Mode ──────────────────────────────────────────────── */
export const MAP_STYLE_LIGHT: google.maps.MapTypeStyle[] = [
  // Commercial POI declutter: hide store & business icons so Crowdbeats live music pins stand out
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.station', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  // Soft neutral land (#f1f5f9)
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
  // Subtle parks (#dcfce7)
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dcfce7' }, { visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#15803d' }] },
  // Gentle water (#e0f2fe)
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0f2fe' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0369a1' }] },
  // Clear highways (#fed7aa)
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#fed7aa' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#fdba74' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#9a3412' }] },
  // Local and arterial roads
  { featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.local', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  // Administrative labels
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#1e293b' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
];

/* ── Map Style: Dark Mode ───────────────────────────────────────────────── */
export const MAP_STYLE_DARK: google.maps.MapTypeStyle[] = [
  // 1. Base Geometry & Canvas: Deep midnight charcoal-blue (#162332)
  { elementType: 'geometry', stylers: [{ color: '#162332' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#162332' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#162332' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#162332' }] },
  { featureType: 'landscape.natural.terrain', elementType: 'geometry', stylers: [{ color: '#162332' }] },

  // 2. Base Typography & Halo
  { elementType: 'labels.text.fill', stylers: [{ color: '#7c93a8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#14202c' }, { weight: 2 }] },

  // 3. Commercial POI & Transit Decluttering: Hide business/store icons and minor subdivisions
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.station', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },

  // 4. Parks / Natural Vegetation: Muted cyan-teal slate (#17383f), soft sage teal labels (#5ca294)
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#17383f' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#17383f' }] },
  { featureType: 'poi.park', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#5ca294' }] },
  { featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#112229' }, { weight: 2 }] },

  // 5. Water: Deep midnight navy (#0d1927) with subtle darker stroke (#09121c)
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1927' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#0d1927' }] },
  { featureType: 'water', elementType: 'geometry.stroke', stylers: [{ color: '#09121c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3e5b76' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#0d1927' }] },

  // 6. Highway & Road Hierarchy
  // Major Highways (I-5, 805, 8, 94): Clear steel-blue (#385875 fill, #1b2b3a stroke) with shields
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#385875' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1b2b3a' }, { weight: 1.2 }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry.fill', stylers: [{ color: '#385875' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry.stroke', stylers: [{ color: '#1b2b3a' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#8faec7' }] },
  { featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{ color: '#14202c' }] },

  // Arterial Roads: Slate blue (#24384a fill, #172533 stroke)
  { featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{ color: '#24384a' }] },
  { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#172533' }] },

  // Local Roads: Subtle dark slate (#1b2a38 fill, #14202c stroke)
  { featureType: 'road.local', elementType: 'geometry.fill', stylers: [{ color: '#1b2a38' }] },
  { featureType: 'road.local', elementType: 'geometry.stroke', stylers: [{ color: '#14202c' }] },

  // General Road fallback geometry & labels: Muted blue-gray text (#6f859a fill, #14202c stroke)
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1b2a38' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#14202c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6f859a' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#14202c' }] },

  // 7. Administrative & Locality Typography
  // Locality ("San Diego"): Crisp, bold white text (#ffffff fill, #131f2b stroke with weight 3)
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.stroke', stylers: [{ color: '#131f2b' }, { weight: 3 }] },

  // Neighborhoods: Simplified with muted fill (#7c93a8) and dark stroke (#14202c)
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#7c93a8' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.stroke', stylers: [{ color: '#14202c' }, { weight: 2 }] },
];

/** Check if current HTML theme is dark mode */
function isDarkTheme(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

/** Check if user prefers reduced motion */
function checkPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

/**
 * Context-aware zoom calculation:
 *  - Neighborhoods: 14-15
 *  - Cities: 12-13
 *  - Regions/Countries: 7-9
 */
export function getContextAwareZoom(
  label?: string,
  placeType?: string,
  explicitZoom?: number
): number {
  if (typeof explicitZoom === 'number' && explicitZoom > 0) {
    return explicitZoom;
  }

  if (placeType) {
    const pt = placeType.toLowerCase();
    if (
      pt.includes('neighborhood') ||
      pt.includes('sublocality') ||
      pt.includes('premise') ||
      pt.includes('address') ||
      pt.includes('point_of_interest')
    ) {
      return 15;
    }
    if (pt.includes('locality') || pt.includes('city') || pt.includes('town')) {
      return 13;
    }
    if (
      pt.includes('administrative_area') ||
      pt.includes('state') ||
      pt.includes('region') ||
      pt.includes('country')
    ) {
      return 8;
    }
  }

  if (!label) return 13;

  const parts = label.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return 15; // e.g. "North Park, San Diego, CA"
  } else if (parts.length === 2) {
    return 13; // e.g. "San Diego, CA"
  } else if (parts.length === 1) {
    return 8; // e.g. "California", "United States"
  }

  return 13;
}

/* ── Solo Musician SVG Icon ──────────────────────────────────────────────── */
function SoloIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

/* ── Band SVG Icon ───────────────────────────────────────────────────────── */
function BandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6Z" />
      <path d="M20 7v7.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V11h4V7h-6Z" />
    </svg>
  );
}

/* ── Main DiscoverMap Component ─────────────────────────────────────────── */
export function DiscoverMap({
  center,
  performers,
  selectedId = null,
  onSelect,
  onSelectPerformer,
  onSearchArea,
  visibleKey,
  className,
  style,
}: DiscoverMapProps) {
  const mapRegionId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const [overlayContainer, setOverlayContainer] = useState<HTMLDivElement | null>(null);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(() =>
    getContextAwareZoom(center.label, center.placeType, center.zoom)
  );
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);

  // Unified performer selection handler
  const handleSelect = useCallback(
    (uid: string) => {
      if (onSelectPerformer) {
        onSelectPerformer(uid);
      } else if (onSelect) {
        onSelect(uid);
      }
    },
    [onSelectPerformer, onSelect]
  );

  // Animation frame reference for smooth camera movement
  const cameraAnimRef = useRef<number | null>(null);
  const lastCenterRef = useRef<{ lat: number; lng: number }>({
    lat: center.lat,
    lng: center.lng,
  });

  // Top 5 performers matching the Top 5 cards
  const topPerformers = performers.slice(0, 5);

  /* ── Smooth Camera Transition ─────────────────────────────────────────── */
  const animateCameraTo = useCallback(
    (
      targetCenter: { lat: number; lng: number },
      targetZoom?: number,
      durationMs: number = 800
    ) => {
      const map = mapRef.current;
      if (!map) return;

      // Cancel / supersede any previous camera transition
      if (cameraAnimRef.current !== null) {
        cancelAnimationFrame(cameraAnimRef.current);
        cameraAnimRef.current = null;
      }

      // Honor prefers-reduced-motion: immediate pan/zoom
      if (checkPrefersReducedMotion()) {
        map.setCenter(targetCenter);
        if (typeof targetZoom === 'number') {
          map.setZoom(targetZoom);
        }
        lastCenterRef.current = { lat: targetCenter.lat, lng: targetCenter.lng };
        return;
      }

      const curCenter = map.getCenter();
      if (!curCenter) {
        map.setCenter(targetCenter);
        if (typeof targetZoom === 'number') map.setZoom(targetZoom);
        lastCenterRef.current = { lat: targetCenter.lat, lng: targetCenter.lng };
        return;
      }

      const startLat = curCenter.lat();
      const startLng = curCenter.lng();
      const deltaLat = targetCenter.lat - startLat;
      const deltaLng = targetCenter.lng - startLng;

      const startZoom = map.getZoom() ?? targetZoom ?? 13;
      const hasZoomChange = typeof targetZoom === 'number' && targetZoom !== startZoom;

      const startTime = performance.now();

      function step(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        // Smooth cubic ease-out: 1 - (1 - t)^3
        const ease = 1 - Math.pow(1 - progress, 3);

        const curLat = startLat + deltaLat * ease;
        const curLng = startLng + deltaLng * ease;

        map?.setCenter({ lat: curLat, lng: curLng });

        if (hasZoomChange && targetZoom !== undefined) {
          const zoomProgress = 1 - Math.pow(1 - progress, 2);
          const nextZoom = Math.round(startZoom + (targetZoom - startZoom) * zoomProgress);
          if (map?.getZoom() !== nextZoom) {
            map?.setZoom(nextZoom);
          }
        }

        if (progress < 1) {
          cameraAnimRef.current = requestAnimationFrame(step);
        } else {
          map?.setCenter(targetCenter);
          if (typeof targetZoom === 'number') {
            map?.setZoom(targetZoom);
          }
          cameraAnimRef.current = null;
          lastCenterRef.current = { lat: targetCenter.lat, lng: targetCenter.lng };
        }
      }

      cameraAnimRef.current = requestAnimationFrame(step);
    },
    []
  );

  /* ── 1. Map Initialization ─────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { loadGoogleMapsSdk } = await import('@/lib/maps/googleMapsLoader');
        await loadGoogleMapsSdk();

        if (cancelled || !canvasRef.current || !window.google?.maps?.Map) {
          if (!cancelled && !window.google?.maps?.Map) setFailed(true);
          return;
        }

        const initialZoom = getContextAwareZoom(center.label, center.placeType, center.zoom);
        const map = new google.maps.Map(canvasRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: initialZoom,
          styles: isDarkTheme() ? MAP_STYLE_DARK : MAP_STYLE_LIGHT,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'cooperative',
          keyboardShortcuts: true,
        });

        // Track zoom changes for clustering and controls
        map.addListener('zoom_changed', () => {
          const z = map.getZoom();
          if (typeof z === 'number') {
            setCurrentZoom(z);
          }
        });

        // Detect manual drag away from center to display "Search this area"
        map.addListener('dragend', () => {
          const c = map.getCenter();
          if (c) {
            const dLat = Math.abs(c.lat() - center.lat);
            const dLng = Math.abs(c.lng() - center.lng);
            if (dLat > 0.012 || dLng > 0.012) {
              setShowSearchThisArea(true);
            }
          }
        });

        // Initialize Custom Overlay for SVG markers
        const overlayContainerEl = document.createElement('div');
        overlayContainerEl.className = styles.markersOverlay;

        // Prevent click/touch gestures on markers from dragging the map
        const overlayViewClass = google.maps.OverlayView as unknown as {
          preventMapHitsAndClicksFrom?: (element: HTMLElement) => void;
        };
        if (typeof overlayViewClass.preventMapHitsAndClicksFrom === 'function') {
          overlayViewClass.preventMapHitsAndClicksFrom(overlayContainerEl);
        }

        const overlay = new google.maps.OverlayView();
        overlay.onAdd = function () {
          const panes = this.getPanes();
          panes?.overlayMouseTarget.appendChild(overlayContainerEl);
        };

        overlay.draw = function () {
          const projection = this.getProjection();
          if (!projection) return;

          const elements = overlayContainerEl.querySelectorAll<HTMLElement>('[data-marker-id]');
          elements.forEach((el) => {
            const latStr = el.getAttribute('data-lat');
            const lngStr = el.getAttribute('data-lng');
            if (latStr && lngStr) {
              const lat = parseFloat(latStr);
              const lng = parseFloat(lngStr);
              if (!isNaN(lat) && !isNaN(lng)) {
                const pt = projection.fromLatLngToDivPixel(new google.maps.LatLng(lat, lng));
                if (pt) {
                  el.style.left = `${pt.x}px`;
                  el.style.top = `${pt.y}px`;
                }
              }
            }
          });
        };

        overlay.onRemove = function () {
          overlayContainerEl.remove();
        };

        overlay.setMap(map);
        overlayRef.current = overlay;
        setOverlayContainer(overlayContainerEl);

        mapRef.current = map;
        setReady(true);
        requestAnimationFrame(() => {
          if (map && window.google?.maps?.event) {
            google.maps.event.trigger(map, 'resize');
            map.setCenter({ lat: center.lat, lng: center.lng });
          }
        });
      } catch (err) {
        console.error('[DiscoverMap] Initialization failed:', err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (cameraAnimRef.current !== null) {
        cancelAnimationFrame(cameraAnimRef.current);
        cameraAnimRef.current = null;
      }
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 2. Dark Mode MutationObserver ────────────────────────────────────── */
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    const observer = new MutationObserver(() => {
      const dark = isDarkTheme();
      map.setOptions({ styles: dark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, [ready]);

  /* ── 3. Resize and Visibility Observer ─────────────────────────────────── */
  useEffect(() => {
    if (!ready || !canvasRef.current || !mapRef.current) return;
    const map = mapRef.current;

    const handleResize = () => {
      if (window.google?.maps?.event && map) {
        google.maps.event.trigger(map, 'resize');
        overlayRef.current?.draw();
      }
    };

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(handleResize);
      ro.observe(canvasRef.current);
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleResize();
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [ready, visibleKey]);

  /* ── 4. Reacting to Center Location Updates ────────────────────────────── */
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    const prev = lastCenterRef.current;
    const hasCenterChanged =
      Math.abs(prev.lat - center.lat) > 0.0001 || Math.abs(prev.lng - center.lng) > 0.0001;

    if (hasCenterChanged) {
      const targetZoom = getContextAwareZoom(center.label, center.placeType, center.zoom);
      setShowSearchThisArea(false);
      animateCameraTo({ lat: center.lat, lng: center.lng }, targetZoom, 800);
    }
  }, [ready, center.lat, center.lng, center.label, center.placeType, center.zoom, animateCameraTo]);

  /* ── 5. Reacting to Performer Selection (Pan to selected) ──────────────── */
  useEffect(() => {
    if (!ready || !mapRef.current || !selectedId) return;
    const selected = performers.find((p) => p.uid === selectedId);
    if (selected) {
      if (checkPrefersReducedMotion()) {
        mapRef.current.setCenter({ lat: selected.latitude, lng: selected.longitude });
      } else {
        mapRef.current.panTo({ lat: selected.latitude, lng: selected.longitude });
      }
    }
  }, [ready, selectedId, performers]);

  /* ── 6. Trigger Overlay Draw on Marker State Changes ──────────────────── */
  useLayoutEffect(() => {
    if (!ready || !overlayRef.current) return;
    // Trigger overlay repositioning after React mounts/updates the portal elements
    const frame = requestAnimationFrame(() => {
      overlayRef.current?.draw();
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, topPerformers, selectedId, center.lat, center.lng, currentZoom]);

  /* ── 7. Fullscreen Event Synchronization ───────────────────────────────── */
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = Boolean(
        document.fullscreenElement &&
          containerRef.current &&
          document.fullscreenElement === containerRef.current
      );
      setIsFullscreen(isFull);
      if (mapRef.current && window.google?.maps?.event) {
        google.maps.event.trigger(mapRef.current, 'resize');
        overlayRef.current?.draw();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
    };
  }, []);

  /* ── Control Button Actions ───────────────────────────────────────────── */
  const handleToggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        } else if ((containerRef.current as unknown as { webkitRequestFullscreen?: () => void })?.webkitRequestFullscreen) {
          (containerRef.current as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as unknown as { webkitExitFullscreen?: () => void })?.webkitExitFullscreen) {
          (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
        }
      }
    } catch {
      // Gracefully ignore environments without fullscreen support
    }
  }, []);

  const handleZoomIn = () => {
    if (!mapRef.current) return;
    const z = mapRef.current.getZoom() ?? 12;
    mapRef.current.setZoom(z + 1);
  };

  const handleZoomOut = () => {
    if (!mapRef.current) return;
    const z = mapRef.current.getZoom() ?? 12;
    mapRef.current.setZoom(Math.max(1, z - 1));
  };

  const handleRecenter = () => {
    const targetZoom = getContextAwareZoom(center.label, center.placeType, center.zoom);
    setShowSearchThisArea(false);
    animateCameraTo({ lat: center.lat, lng: center.lng }, targetZoom, 800);
  };

  // Currently selected performer (if any)
  const selectedPerformer = performers.find((p) => p.uid === selectedId);

  const handleDirectionsClick = useCallback(() => {
    const destLat = selectedPerformer ? selectedPerformer.latitude : center.lat;
    const destLng = selectedPerformer ? selectedPerformer.longitude : center.lng;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [selectedPerformer, center.lat, center.lng]);

  const handleOpenInMapsClick = useCallback(() => {
    const query = encodeURIComponent(center.label || 'San Diego, CA');
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [center.label]);

  const handleSearchThisAreaClick = () => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter();
    const z = mapRef.current.getZoom() ?? 13;
    setShowSearchThisArea(false);
    if (c) {
      onSearchArea?.({
        lat: c.lat(),
        lng: c.lng(),
        zoom: z,
      });
    }
  };

  /* ── Cluster Click (Expand to show individual pins) ───────────────────── */
  const handleClusterClick = (clusterLat: number, clusterLng: number) => {
    animateCameraTo({ lat: clusterLat, lng: clusterLng }, 13, 700);
  };

  // Determine if clustering should be active (e.g. zoomed out to regional level < 11)
  const isClustered = currentZoom < 11 && topPerformers.length > 1;

  // Calculate cluster centroid if active
  const clusterCentroid = isClustered
    ? {
        lat: topPerformers.reduce((acc, p) => acc + p.latitude, 0) / topPerformers.length,
        lng: topPerformers.reduce((acc, p) => acc + p.longitude, 0) / topPerformers.length,
      }
    : null;

  if (failed) {
    return (
      <div className={`${styles.mapContainer} ${styles.fallbackContainer} ${className ?? ''}`} style={style}>
        <p className={styles.fallbackTitle}>Map preview unavailable</p>
        <p className={styles.fallbackBody}>
          The live performer list is active. Use &ldquo;Open in Google Maps&rdquo; on any performer card for walking directions.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.mapContainer} ${className ?? ''}`}
      style={style}
      role="region"
      aria-label={`Interactive map of live music performers near ${center.label}`}
    >
      {/* ── Native Google Maps Canvas ── */}
      <div ref={canvasRef} id={mapRegionId} className={styles.mapCanvas} />

      {/* ── Loading Spinner Veil ── */}
      {!ready && (
        <div className={styles.mapLoading} aria-hidden="true">
          <span className={styles.spinner} />
        </div>
      )}

      {/* ── Top-Right Controls Stack (Fullscreen & Recenter) ── */}
      {ready && (
        <div className={styles.topControlsGroup} role="toolbar" aria-label="Map view controls">
          <button
            type="button"
            className={`${styles.topControlBtn} ${styles.controlBtn}`}
            onClick={handleToggleFullscreen}
            aria-label={isFullscreen ? 'Exit full screen' : 'Toggle full screen'}
            title={isFullscreen ? 'Exit full screen' : 'Toggle full screen'}
          >
            {isFullscreen ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <polyline points="14 20 14 14 20 14" />
                <polyline points="10 4 10 10 4 10" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <polyline points="21 14 21 21 14 21" />
                <polyline points="3 10 3 3 10 3" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className={`${styles.topControlBtn} ${styles.controlBtn}`}
            onClick={handleRecenter}
            aria-label={`Recenter map on ${center.label}`}
            title={`Recenter on ${center.label}`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="7" />
              <line x1="12" y1="2" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="2" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Bottom-Right: Vertical Zoom Capsule (Zoom In & Zoom Out) ── */}
      {ready && (
        <div className={styles.zoomCapsule} role="group" aria-label="Zoom controls">
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <div data-testid="zoom-divider" className={styles.zoomDivider} aria-hidden="true" />
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Bottom Floating Action Buttons: Directions & Open in Maps ── */}
      {ready && (
        <div className={styles.bottomActionsGroup} role="toolbar" aria-label="Map navigation actions">
          <button
            type="button"
            className={styles.actionPillBtn}
            onClick={handleDirectionsClick}
            aria-label={
              selectedPerformer
                ? `Get directions to ${selectedPerformer.performerName}`
                : `Get directions to ${center.label || 'current location'}`
            }
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={styles.actionPillIcon}
            >
              <polyline points="15 14 20 9 15 4" />
              <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
            </svg>
            <span>Directions</span>
          </button>

          <button
            type="button"
            className={styles.actionPillBtn}
            onClick={handleOpenInMapsClick}
            aria-label={`Open ${center.label || 'San Diego, CA'} in Google Maps`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={styles.actionPillIcon}
            >
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            <span>Open in Maps</span>
          </button>
        </div>
      )}

      {/* ── "Search this area" Pill Button (Top-Center) ── */}
      {ready && showSearchThisArea && (
        <button
          type="button"
          className={styles.searchAreaPill}
          onClick={handleSearchThisAreaClick}
          aria-label="Search performers in this area"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Search this area</span>
        </button>
      )}

      {/* ── React Portal for Numbered SVG Markers and Overlays ── */}
      {ready &&
        overlayContainer &&
        createPortal(
          <>
            {/* Search Center Marker: Subtle Hollow Ring */}
            <div
              data-marker-id="search-center"
              data-lat={center.lat}
              data-lng={center.lng}
              className={styles.centerMarker}
              title={`Search center: ${center.label}`}
              aria-hidden="true"
            >
              <span className={styles.centerMarkerPulse} />
              <span className={styles.centerMarkerInner} />
            </div>

            {/* Clustered Group Marker (Zoomed Out Mode) */}
            {isClustered && clusterCentroid ? (
              <button
                type="button"
                data-marker-id="cluster-group"
                data-lat={clusterCentroid.lat}
                data-lng={clusterCentroid.lng}
                className={styles.clusterMarker}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClusterClick(clusterCentroid.lat, clusterCentroid.lng);
                }}
                aria-label={`${topPerformers.length} live performers nearby. Click to zoom in.`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6Z" />
                </svg>
                <span>{topPerformers.length} Live</span>
              </button>
            ) : (
              /* Top 5 Numbered Pins (Zoomed In Mode) */
              topPerformers.map((p, idx) => {
                const markerNumber = idx + 1;
                const isSelected = p.uid === selectedId;
                const isBand = p.type === 'band';

                return (
                  <button
                    key={p.uid}
                    type="button"
                    data-marker-id={p.uid}
                    data-lat={p.latitude}
                    data-lng={p.longitude}
                    className={[styles.markerWrapper, isSelected && (styles.markerSelected || 'markerSelected')]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(p.uid);
                    }}
                    aria-label={`${markerNumber}. ${p.performerName} (${isBand ? 'Band' : 'Solo Musician'}), performing at ${p.venueName}${p.isLive ? ', live now' : ''}`}
                    aria-pressed={isSelected}
                  >
                    <div className={styles.pinContainer}>
                      {/* Custom SVG Pin Body */}
                      <svg className={styles.pinSvg} viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M22 50 C22 50 4 32.5 4 20 C4 10.059 12.059 2 22 2 C31.941 2 40 10.059 40 20 C40 32.5 22 50 22 50 Z"
                          className={styles.pinPath}
                        />
                        <circle cx="22" cy="20" r="13" className={styles.pinDisc} />
                      </svg>

                      {/* Solo vs Band Distinction Icon */}
                      <span className={styles.iconWrapper}>
                        {isBand ? <BandIcon /> : <SoloIcon />}
                      </span>

                      {/* Numbered Badge (1 to 5) */}
                      <span className={styles.numberBadge}>
                        {markerNumber}
                      </span>

                      {/* Live Now Pulsing Ring / Green Glow Indicator */}
                      {p.isLive && (
                        <span className={styles.liveIndicator} title="Live Now">
                          <span className={styles.livePulseRing} />
                          <span className={styles.liveDot} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </>,
          overlayContainer
        )}
    </div>
  );
}

export default DiscoverMap;
