'use client';

/**
 * CrowdbeatsMapLibre — React component wrapping the MapLibre GL map provider.
 *
 * Usage:
 *   import dynamic from 'next/dynamic';
 *   const CrowdbeatsMapLibre = dynamic(() => import('@/components/maps/CrowdbeatsMapLibre').then(m => m.CrowdbeatsMapLibre), { ssr: false });
 *
 * This component is 'use client' only — never SSR. Always load with ssr: false.
 * It handles: initialization, error fallback, responsive resize, and cleanup.
 */

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { ICrowdbeatsMapProvider, CrowdbeatsMapEventCallback } from '@/lib/maps/interfaces';
import type { CrowdbeatsCoordinate, CrowdbeatsBounds, CrowdbeatsMapMarker, MapTheme } from '@/lib/maps/types';
import { MapLibreFallback, MapLibreLoadingSkeleton } from './MapLibreFallback';

// Import MapLibre CSS — required for controls, popups, attribution
import 'maplibre-gl/dist/maplibre-gl.css';

// ─── Public API ──────────────────────────────────────────────────────────────

export interface CrowdbeatsMapLibreProps {
  theme?: MapTheme;
  center?: CrowdbeatsCoordinate;
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Called once when map tiles are fully loaded. */
  onLoad?: (loadTimeMs: number) => void;
  /** Called when the map encounters a fatal error. */
  onError?: (error: Error) => void;
  /** Called when the map center or zoom changes. */
  onMove?: (center: CrowdbeatsCoordinate, zoom: number, bounds: CrowdbeatsBounds) => void;
  /** Called when a marker is clicked. */
  onMarkerClick?: (markerId: string) => void;
  /** If true, renders a compact error fallback without retry button. */
  compactFallback?: boolean;
}

/** Imperative API exposed via ref for programmatic map control. */
export interface CrowdbeatsMapLibreRef {
  flyTo: (coord: CrowdbeatsCoordinate, zoomOrOptions?: number | import('@/lib/maps/types').FlyToOptions) => void;
  easeTo: (coord: CrowdbeatsCoordinate, options?: import('@/lib/maps/types').EaseOptions) => void;
  centerOnMarker: (coord: CrowdbeatsCoordinate, options?: import('@/lib/maps/types').EaseOptions) => void;
  fitBounds: (bounds: CrowdbeatsBounds, padding?: number) => void;
  addMarker: (marker: CrowdbeatsMapMarker) => string;
  removeMarker: (id: string) => void;
  clearAllMarkers: () => void;
  getZoom: () => number;
  getCenter: () => CrowdbeatsCoordinate;
  getBounds: () => CrowdbeatsBounds;
  showRoute: (route: import('@/lib/maps/types').CrowdbeatsRoute) => void;
  clearRoute: () => void;
  provider: ICrowdbeatsMapProvider | null;
  setTheme: (theme: MapTheme) => Promise<void>;
}

type MapStatus = 'loading' | 'loaded' | 'error';

// ─── Component ───────────────────────────────────────────────────────────────

export const CrowdbeatsMapLibre = forwardRef<CrowdbeatsMapLibreRef, CrowdbeatsMapLibreProps>(
  function CrowdbeatsMapLibre(
    {
      theme = 'dark',
      center,
      zoom = 14,
      className,
      style,
      onLoad,
      onError,
      onMove,
      onMarkerClick,
      compactFallback = false,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const providerRef = useRef<ICrowdbeatsMapProvider | null>(null);
    const destroyedRef = useRef(false);
    const retryCountRef = useRef(0);

    const [status, setStatus] = useState<MapStatus>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [loadTime, setLoadTime] = useState<number | null>(null);

    // Expose imperative API
    useImperativeHandle(ref, () => ({
      flyTo: (coord, z) => providerRef.current?.flyTo(coord, z),
      easeTo: (coord, opts) => providerRef.current?.easeTo(coord, opts),
      centerOnMarker: (coord, opts) => providerRef.current?.centerOnMarker(coord, opts),
      fitBounds: (bounds, padding) => providerRef.current?.fitBounds(bounds, padding),
      addMarker: (marker) => providerRef.current?.addMarker(marker) ?? marker.id,
      removeMarker: (id) => providerRef.current?.removeMarker(id),
      clearAllMarkers: () => providerRef.current?.clearAllMarkers(),
      getZoom: () => providerRef.current?.getZoom() ?? zoom,
      getCenter: () => providerRef.current?.getCenter() ?? (center ?? { lat: 32.7157, lng: -117.1611 }),
      getBounds: () => providerRef.current?.getBounds() ?? { sw: { lat: 32.65, lng: -117.25 }, ne: { lat: 32.78, lng: -117.07 } },
      showRoute: (route) => providerRef.current?.showRoute(route),
      clearRoute: () => providerRef.current?.clearRoute(),
      provider: providerRef.current,
      setTheme: async (t) => {
        const p = providerRef.current as any;
        if (p?.setTheme) await p.setTheme(t);
      },
    }));

    const initMap = useCallback(async () => {
      if (!containerRef.current) return;
      if (destroyedRef.current) return;

      setStatus('loading');
      setErrorMsg('');

      const t0 = performance.now();

      try {
        // Lazy-import the provider to avoid SSR issues
        const { MapLibreMapProvider, primeMapLibreGlobal } = await import('@/lib/maps/providers/maplibre');
        await primeMapLibreGlobal();

        if (destroyedRef.current) return;

        // Destroy previous instance if retrying
        if (providerRef.current) {
          providerRef.current.destroyMap();
          providerRef.current = null;
        }

        const provider = new MapLibreMapProvider();
        providerRef.current = provider;

        await provider.initializeMap(containerRef.current!, {
          theme,
          center,
          zoom,
        });

        if (destroyedRef.current) {
          provider.destroyMap();
          return;
        }

        // Wire events
        const moveHandler: CrowdbeatsMapEventCallback = () => {
          onMove?.(provider.getCenter(), provider.getZoom(), provider.getBounds());
        };
        provider.on('moveend', moveHandler);
        provider.on('zoom', moveHandler);

        const markerClickHandler: CrowdbeatsMapEventCallback = (payload) => {
          if (payload.markerId) onMarkerClick?.(payload.markerId);
        };
        provider.on('marker:click', markerClickHandler);

        const elapsed = Math.round(performance.now() - t0);
        setLoadTime(elapsed);
        setStatus('loaded');
        onLoad?.(elapsed);

        console.info(`[CrowdbeatsMapLibre] Loaded in ${elapsed}ms (theme: ${theme})`);
      } catch (err) {
        if (destroyedRef.current) return;
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[CrowdbeatsMapLibre] Init failed:', error);
        setErrorMsg(error.message);
        setStatus('error');
        onError?.(error);
      }
    }, [theme, center, zoom]);

    // Initialize on mount
    useEffect(() => {
      destroyedRef.current = false;
      void initMap();

      return () => {
        destroyedRef.current = true;
        providerRef.current?.destroyMap();
        providerRef.current = null;
      };
    }, [initMap]);

    const handleRetry = useCallback(() => {
      retryCountRef.current += 1;
      void initMap();
    }, [initMap]);

    // Error state
    if (status === 'error') {
      return (
        <div
          className={className}
          style={{ width: '100%', height: '100%', ...style }}
        >
          <MapLibreFallback
            message={errorMsg}
            onRetry={retryCountRef.current < 2 ? handleRetry : undefined}
            theme={theme}
            compact={compactFallback}
          />
        </div>
      );
    }

    return (
      <div
        className={className}
        style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}
        aria-label="Interactive map"
      >
        {/* Loading overlay */}
        {status === 'loading' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            pointerEvents: 'none',
          }}>
            <MapLibreLoadingSkeleton theme={theme} />
          </div>
        )}


        {/* Map canvas container */}
        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%' }}
          data-testid="maplibre-container"
        />
      </div>
    );
  }
);

CrowdbeatsMapLibre.displayName = 'CrowdbeatsMapLibre';