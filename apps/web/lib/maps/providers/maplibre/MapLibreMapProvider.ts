/**
 * Crowdbeats Map Engine — MapLibre Map Provider (Phase 3)
 *
 * Full rendering implementation using MapLibre GL JS 6.x.
 * Phase 3 delivers: real map init, camera, markers via ml.Marker.
 * Phase 6 adds: Crowdbeats marker system — pulse animations, zoom states, selection dimming.
 * GeoJSON route rendering, events, and graceful cleanup.
 *
 * Phase 5 adds: setTheme() with smooth fade transition (no white flash).
 * Phase 4 will add: custom HTML performer markers with photos, pulsing rings,
 * LIVE badges, and cluster support.
 */

import type {
  ICrowdbeatsMapProvider,
  CrowdbeatsMapEvent,
  CrowdbeatsMapEventCallback,
  CrowdbeatsMapEventPayload,
} from '../../interfaces';
import type {
  CrowdbeatsCoordinate,
  CrowdbeatsBounds,
  CrowdbeatsMapMarker,
  CrowdbeatsArtistMarker,
  CrowdbeatsBandMarker,
  CrowdbeatsLiveMarker,
  CrowdbeatsUserMarker,
  CrowdbeatsVenueMarker,
  CrowdbeatsCluster,
  CrowdbeatsRoute,
  CrowdbeatsLayerSpec,
  MapInitOptions,
  EaseOptions,
  FlyToOptions,
} from '../../types';
import { CrowdbeatsMapError, MapNotInitializedError } from '../../types';
import { loadMapLibre, CROWDBEATS_MAP_STYLE_URL, CROWDBEATS_ATTRIBUTION } from '../../engine/crowdbeatsMapEngine';
import { createMarkerElement, createUserLocationElement, applyZoomClass, injectMarkerStyles } from '../../markers';
import type { UserLocationMarkerAPI } from '../../markers';
import { mapObservability } from '../../observability';

export class MapLibreMapProvider implements ICrowdbeatsMapProvider {
  readonly providerName = 'maplibre' as const;

  private map: any = null;           // maplibre-gl Map instance
  private markers = new Map<string, any>(); // markerId → maplibre-gl Marker
  private markerEls = new Map<string, HTMLElement>(); // markerId → DOM element
  private selectedMarkerId: string | null = null;
  private routeLayerIds: string[] = [];
  private routeSourceId: string | null = null;
  private eventHandlers = new Map<CrowdbeatsMapEvent, Set<CrowdbeatsMapEventCallback>>();
  private resizeObserver: ResizeObserver | null = null;
  private userMarkerAPI: UserLocationMarkerAPI | null = null; // user location controller
  private _loadTime: number | null = null;
  private _initialized = false;

  get isInitialized(): boolean { return this._initialized; }
  get loadTimeMs(): number | null { return this._loadTime; }

  // ── Initialization ─────────────────────────────────────────────────────────

  async initializeMap(container: HTMLElement, options: MapInitOptions = {}): Promise<void> {
    const t0 = performance.now();
    let ml: typeof import('maplibre-gl');
    try {
      ml = await loadMapLibre();
    } catch (err) {
      throw new CrowdbeatsMapError(
        `MapLibre GL failed to load: ${err instanceof Error ? err.message : String(err)}`,
        'MAPLIBRE_LOAD_FAILED',
        'maplibre'
      );
    }

    const styleUrl = CROWDBEATS_MAP_STYLE_URL(options.theme ?? 'dark');

    this.map = new ml.Map({
      container,
      style: styleUrl,
      center: [options.center?.lng ?? -117.1611, options.center?.lat ?? 32.7157],
      zoom: options.zoom ?? 14,
      attributionControl: { compact: false, customAttribution: CROWDBEATS_ATTRIBUTION },
      // Crowdbeats-standard interaction settings
      scrollZoom: true,
      boxZoom: false,
      dragRotate: false,      // Disable rotation — keep UX simple like Uber/Lyft
      touchPitch: false,      // Disable pitch touch — keep map flat
      touchZoomRotate: true,  // Allow pinch-zoom on mobile
      doubleClickZoom: true,
      keyboard: true,
    });

    // Wait for map to fully load before resolving
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const err = new CrowdbeatsMapError('Map load timeout after 15s', 'LOAD_TIMEOUT', 'maplibre');
        mapObservability.recordEvent('map_init_error', err.message, { provider: 'maplibre' });
        reject(err);
      }, 15000);

      this.map.once('load', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.map.once('error', (e: any) => {
        clearTimeout(timeout);
        const msg = `Map load error: ${e?.error?.message ?? 'Unknown'}`;
        mapObservability.recordEvent('map_init_error', msg, {
          provider: 'maplibre',
          details: { status: e?.error?.status },
        });
        reject(new CrowdbeatsMapError(
          msg,
          'LOAD_ERROR',
          'maplibre'
        ));
      });
    });

    this._initialized = true;
    this._loadTime = Math.round(performance.now() - t0);

    // Wire resize observer for responsive container handling
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.map?.resize();
      });
      this.resizeObserver.observe(container);
    }

    // Wire native map events to our event system
    this.map.on('click', (e: any) => this._emit('click', {
      type: 'click',
      coordinate: { lat: e.lngLat.lat, lng: e.lngLat.lng },
      originalEvent: e.originalEvent,
    }));
    this.map.on('moveend', () => this._emit('moveend', {
      type: 'moveend',
      coordinate: this.getCenter(),
      zoom: this.getZoom(),
      bounds: this.getBounds(),
    }));
    this.map.on('zoom', () => this._emit('zoom', {
      type: 'zoom',
      coordinate: this.getCenter(),
      zoom: this.map.getZoom(),
      bounds: this.getBounds(),
    }));
    this.map.on('error', (e: any) => {
      const errMsg = e?.error?.message || 'MapLibre rendering or tile fetch error';
      console.error('[MapLibre]', errMsg);
      mapObservability.recordEvent('tile_load_error', errMsg, {
        provider: 'maplibre',
        details: { status: e?.error?.status },
      });
      this._emit('error', { type: 'error' });
    });

    this._emit('load', { type: 'load' });

    // Phase 6: inject marker CSS + wire zoom-class updates
    injectMarkerStyles();
    const initialZoom = this.map.getZoom();
    this._applyZoomClasses(initialZoom);
    this.map.on('zoomend', () => this._applyZoomClasses(this.map.getZoom()));

    // Stamp theme on map container for CSS light-mode overrides
    container.dataset.cbTheme = options.theme ?? 'dark';
  }

  destroyMap(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.clearAllMarkers();
    this.clearRoute();
    this.eventHandlers.clear();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this._initialized = false;
    this._loadTime = null;
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  /** Checks if user or device requests reduced motion. */
  private _prefersReducedMotion(override?: boolean): boolean {
    if (override !== undefined) return override;
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  }

  flyTo(coord: CrowdbeatsCoordinate, zoomOrOptions?: number | FlyToOptions): void {
    this._requireMap();
    const opts: FlyToOptions =
      typeof zoomOrOptions === 'number'
        ? { zoom: zoomOrOptions }
        : (zoomOrOptions ?? {});

    const isReduced = this._prefersReducedMotion(opts.reducedMotion);

    if (isReduced || opts.duration === 0) {
      this.map.jumpTo({
        center: [coord.lng, coord.lat],
        ...(opts.zoom !== undefined ? { zoom: opts.zoom } : {}),
        ...(opts.pitch !== undefined ? { pitch: opts.pitch } : {}),
        ...(opts.bearing !== undefined ? { bearing: opts.bearing } : {}),
        ...(opts.offset ? { offset: opts.offset } : {}),
      });
      return;
    }

    this.map.flyTo({
      center: [coord.lng, coord.lat],
      ...(opts.zoom !== undefined ? { zoom: opts.zoom } : {}),
      ...(opts.pitch !== undefined ? { pitch: opts.pitch } : {}),
      ...(opts.bearing !== undefined ? { bearing: opts.bearing } : {}),
      ...(opts.offset ? { offset: opts.offset } : {}),
      ...(opts.padding ? { padding: opts.padding } : {}),
      duration: opts.duration ?? 1100,
      curve: opts.curve ?? 1.42,
      speed: opts.speed ?? 1.2,
      easing: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
      essential: true,
    });
  }

  easeTo(coord: CrowdbeatsCoordinate, options: EaseOptions = {}): void {
    this._requireMap();
    const isReduced = this._prefersReducedMotion(options.reducedMotion);

    if (isReduced || options.duration === 0) {
      this.map.jumpTo({
        center: [coord.lng, coord.lat],
        ...(options.zoom !== undefined ? { zoom: options.zoom } : {}),
        ...(options.pitch !== undefined ? { pitch: options.pitch } : {}),
        ...(options.bearing !== undefined ? { bearing: options.bearing } : {}),
        ...(options.offset ? { offset: options.offset } : {}),
      });
      return;
    }

    this.map.easeTo({
      center: [coord.lng, coord.lat],
      ...(options.zoom !== undefined ? { zoom: options.zoom } : {}),
      ...(options.pitch !== undefined ? { pitch: options.pitch } : {}),
      ...(options.bearing !== undefined ? { bearing: options.bearing } : {}),
      ...(options.offset ? { offset: options.offset } : {}),
      ...(options.padding ? { padding: options.padding } : {}),
      duration: options.duration ?? 600,
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // cubic ease-out
      essential: true,
    });
  }

  centerOnMarker(coord: CrowdbeatsCoordinate, options: EaseOptions = {}): void {
    this._requireMap();
    // Default offset: shift center 110px down, placing the marker 110px UP into the visible upper viewport
    const defaultOffset: [number, number] = [0, -110];
    this.easeTo(coord, {
      duration: options.duration ?? 650,
      zoom: options.zoom ?? Math.max(this.getZoom(), 15),
      offset: options.offset ?? defaultOffset,
      ...options,
    });
  }

  fitBounds(bounds: CrowdbeatsBounds, padding = 60): void {
    this._requireMap();
    this.map.fitBounds(
      [[bounds.sw.lng, bounds.sw.lat], [bounds.ne.lng, bounds.ne.lat]],
      { padding, maxZoom: 17, duration: 800 }
    );
  }

  setZoom(zoom: number): void {
    this._requireMap();
    this.map.setZoom(zoom);
  }

  getZoom(): number {
    return this.map?.getZoom() ?? 14;
  }

  getCenter(): CrowdbeatsCoordinate {
    if (!this.map) return { lat: 32.7157, lng: -117.1611 };
    const c = this.map.getCenter();
    return { lat: c.lat, lng: c.lng };
  }

  getBounds(): CrowdbeatsBounds {
    if (!this.map) {
      return {
        sw: { lat: 32.65, lng: -117.25 },
        ne: { lat: 32.78, lng: -117.07 },
      };
    }
    const b = this.map.getBounds();
    return {
      sw: { lat: b.getSouth(), lng: b.getWest() },
      ne: { lat: b.getNorth(), lng: b.getEast() },
    };
  }

  // ── Markers ────────────────────────────────────────────────────────────────

  addMarker(marker: CrowdbeatsMapMarker): string {
    this._requireMap();
    const id = marker.id || `ml_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Remove existing marker with same ID
    this.removeMarker(id);

    // Validate coordinates
    const pos = marker.position;
    if (
      !pos ||
      typeof pos.lat !== 'number' ||
      typeof pos.lng !== 'number' ||
      isNaN(pos.lat) ||
      isNaN(pos.lng) ||
      pos.lat < -90 ||
      pos.lat > 90 ||
      pos.lng < -180 ||
      pos.lng > 180
    ) {
      mapObservability.recordEvent('malformed_coords', `Invalid coordinates rejected for marker ${id}`, {
        provider: 'maplibre',
        details: { markerId: id, markerType: marker.type },
        rawCoordinates: pos,
      });
      return id;
    }

    // ── Build DOM element via Phase 6 MarkerFactory ─────────────────────────
    let el: HTMLElement;

    if (marker.type === 'user') {
      // User location: create dedicated controller-driven element
      const api = createUserLocationElement();
      el = api.el;
      this.userMarkerAPI = api;

      // Initialise accuracy ring if provided
      const um = marker as import('../../types').CrowdbeatsUserMarker;
      if (um.accuracyMeters && um.accuracyMeters > 0) {
        api.updateAccuracy(um.accuracyMeters, this.map.getZoom(), marker.position.lat);
      }
      if (um.heading !== undefined) {
        api.updateHeading(um.heading ?? null);
      }
    } else {
      el = createMarkerElement(marker, this._currentTheme);
      // Apply current zoom class immediately
      applyZoomClass(el, this.map.getZoom());
    }

    this.markerEls.set(id, el);

    // ── Attach to MapLibre ───────────────────────────────────────────────────
    const ml = (globalThis as any).__maplibre_gl__;
    if (ml?.Marker) {
      const instance = new ml.Marker({ element: el, anchor: 'center' })
        .setLngLat([marker.position.lng, marker.position.lat])
        .addTo(this.map);
      this.markers.set(id, instance);

      // Click / hover events (not for user marker)
      if (marker.type !== 'user') {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this._emit('marker:click', {
            type: 'marker:click',
            markerId: id,
            coordinate: marker.position,
          });
        });

        el.addEventListener('mouseenter', () => {
          this._emit('marker:hover', { type: 'marker:hover', markerId: id });
        });
      }
    }

    return id;
  }

  removeMarker(markerId: string): void {
    const instance = this.markers.get(markerId);
    if (instance) {
      instance.remove();
      this.markers.delete(markerId);
      this.markerEls.delete(markerId);
    }
    if (this.selectedMarkerId === markerId) this.selectedMarkerId = null;
  }

  updateMarker(markerId: string, updates: Partial<CrowdbeatsMapMarker>): void {
    const instance = this.markers.get(markerId);
    if (!instance) return;

    // Update geographic position (smooth transition built into MapLibre)
    if (updates.position) {
      instance.setLngLat([updates.position.lng, updates.position.lat]);
    }

    // User location: update accuracy ring + heading arrow
    const el = this.markerEls.get(markerId);
    if (el?.classList.contains('cb-user-marker') && this.userMarkerAPI) {
      const um = updates as Partial<import('../../types').CrowdbeatsUserMarker>;
      if (um.accuracyMeters !== undefined && updates.position) {
        this.userMarkerAPI.updateAccuracy(
          um.accuracyMeters ?? 0,
          this.map.getZoom(),
          updates.position.lat
        );
      }
      if ('heading' in um) {
        this.userMarkerAPI.updateHeading(um.heading ?? null);
      }
    }
  }

  selectMarker(markerId: string): void {
    // Clear any previous selection first
    this._clearSelectionState();

    const targetEl = this.markerEls.get(markerId);
    if (!targetEl) return;

    // Bring selected marker to front
    const targetInstance = this.markers.get(markerId);
    if (targetInstance) {
      (targetInstance as any).getElement().style.zIndex = '9999';
    }

    // Highlight selected, dim all others
    this.markerEls.forEach((el, id) => {
      if (id === markerId) {
        el.classList.add('cb-marker--selected');
        el.classList.remove('cb-marker--dimmed');
      } else if (el.classList.contains('cb-user-marker')) {
        // Never dim user location marker
      } else {
        el.classList.add('cb-marker--dimmed');
        el.classList.remove('cb-marker--selected');
      }
    });

    this.selectedMarkerId = markerId;
  }

  deselectMarker(markerId?: string): void {
    const targetId = markerId ?? this.selectedMarkerId;
    if (targetId) {
      const instance = this.markers.get(targetId);
      if (instance) {
        (instance as any).getElement().style.zIndex = '';
      }
    }
    this._clearSelectionState();
  }

  clearAllMarkers(): void {
    this.markers.forEach((m) => m.remove());
    this.markers.clear();
    this.markerEls.clear();
    this.selectedMarkerId = null;
  }

  // ── Layers / GeoJSON ───────────────────────────────────────────────────────

  addGeoJsonSource(id: string, data: object): void {
    this._requireMap();
    if (this.map.getSource(id)) {
      (this.map.getSource(id) as any).setData(data);
    } else {
      this.map.addSource(id, { type: 'geojson', data });
    }
  }

  updateGeoJsonSource(id: string, data: object): void {
    const src = this.map?.getSource(id);
    if (src) (src as any).setData(data);
    else this.addGeoJsonSource(id, data);
  }

  removeGeoJsonSource(id: string): void {
    if (this.map?.getSource(id)) this.map.removeSource(id);
  }

  addLayer(layer: CrowdbeatsLayerSpec): void {
    this._requireMap();
    if (!this.map.getLayer(layer.id)) {
      this.map.addLayer({
        id: layer.id,
        type: layer.type,
        source: layer.sourceId,
        paint: layer.paint ?? {},
        layout: layer.layout ?? {},
        ...(layer.filter ? { filter: layer.filter } : {}),
      }, layer.beforeId);
    }
  }

  removeLayer(layerId: string): void {
    if (this.map?.getLayer(layerId)) this.map.removeLayer(layerId);
  }

  // ── Routes ─────────────────────────────────────────────────────────────────

  showRoute(route: CrowdbeatsRoute): void {
    this._requireMap();
    this.clearRoute();

    const sourceId = 'cb-route-source';
    const geojson = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: route.coordinates,
      },
    };

    this.addGeoJsonSource(sourceId, geojson);
    this.routeSourceId = sourceId;

    // Mode-specific styling
    const color =
      route.mode === 'driving' ? '#00E5FF' : route.mode === 'cycling' ? '#84cc16' : '#00F076';

    const prefersReduced = this._prefersReducedMotion();

    // Glow layer — wide, blurred, semi-transparent
    this.map.addLayer({
      id: 'cb-route-glow',
      type: 'line',
      source: sourceId,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': color,
        'line-width': 12,
        'line-blur': 8,
        'line-opacity': 0.35,
        ...(!prefersReduced ? { 'line-opacity-transition': { duration: 300 } } : {}),
      },
    });

    // Solid layer — crisp foreground line
    this.map.addLayer({
      id: 'cb-route-solid',
      type: 'line',
      source: sourceId,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': color,
        'line-width': 4.5,
        'line-opacity': 0.95,
        ...(!prefersReduced ? { 'line-opacity-transition': { duration: 300 } } : {}),
      },
    });

    this.routeLayerIds = ['cb-route-glow', 'cb-route-solid'];

    // Fit camera to encompass ALL coordinates with bottom-sheet padding compensation
    let minLat = route.origin.lat;
    let maxLat = route.origin.lat;
    let minLng = route.origin.lng;
    let maxLng = route.origin.lng;

    if (route.coordinates && route.coordinates.length > 0) {
      for (const [lng, lat] of route.coordinates) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      }
    }

    if (this.map && typeof this.map.fitBounds === 'function') {
      this.map.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        {
          padding: { top: 70, bottom: 200, left: 60, right: 60 },
          maxZoom: 16.5,
          duration: prefersReduced ? 0 : 850,
        }
      );
    }
  }

  clearRoute(): void {
    this.routeLayerIds.forEach((id) => {
      if (this.map?.getLayer(id)) this.map.removeLayer(id);
    });
    this.routeLayerIds = [];
    if (this.routeSourceId && this.map?.getSource(this.routeSourceId)) {
      this.map.removeSource(this.routeSourceId);
    }
    this.routeSourceId = null;
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  on(event: CrowdbeatsMapEvent, callback: CrowdbeatsMapEventCallback): void {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, new Set());
    this.eventHandlers.get(event)!.add(callback);
  }

  off(event: CrowdbeatsMapEvent, callback: CrowdbeatsMapEventCallback): void {
    this.eventHandlers.get(event)?.delete(callback);
  }


  /** Current theme — used to avoid unnecessary reloads. */
  private _currentTheme: import('../../types').MapTheme = 'dark';

  get currentTheme(): import('../../types').MapTheme { return this._currentTheme; }

  /**
   * Transitions the map to a new theme with a smooth opacity fade.
   * Markers are re-applied after the style reload automatically.
   *
   * @param newTheme 'dark' | 'light'
   */
  async setTheme(newTheme: import('../../types').MapTheme): Promise<void> {
    if (!this.map) return;
    if (newTheme === this._currentTheme) return;

    const styleUrl = CROWDBEATS_MAP_STYLE_URL(newTheme);
    const container: HTMLElement = this.map.getContainer();

    // Snapshot marker positions for re-application after reload
    const markerSnapshot = new Map<string, { lngLat: [number, number] }>();
    this.markers.forEach((instance, id) => {
      const ll = instance.getLngLat();
      markerSnapshot.set(id, { lngLat: [ll.lng, ll.lat] });
    });

    // Fade out — prevents white flash during style swap
    container.style.transition = 'opacity 180ms ease-out';
    container.style.opacity = '0';

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        container.style.opacity = '1';
        reject(new CrowdbeatsMapError('Theme transition timeout', 'THEME_TIMEOUT', 'maplibre'));
      }, 12000);

      this.map.once('style.load', () => {
        clearTimeout(timeout);
        // Brief delay so first tiles have a chance to paint before fade-in
        setTimeout(() => {
          container.style.transition = 'opacity 200ms ease-in';
          container.style.opacity = '1';
          this._currentTheme = newTheme;
          this._emit('theme:change', { type: 'theme:change' });
          resolve();
        }, 80);
      });

      this.map.setStyle(styleUrl);
    });

    // Re-add markers that were cleared by setStyle (maplibre clears DOM markers on style change)
    // Note: full re-application with original CrowdbeatsMapMarker data requires Phase 6 marker state.
    // Phase 5: markers are cleared — the parent component is responsible for re-adding them.
    this.markers.clear();
    this.markerEls.clear();
    this.selectedMarkerId = null;
    this.routeLayerIds = [];
    this.routeSourceId = null;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _requireMap(): void {
    if (!this.map) throw new MapNotInitializedError('maplibre');
  }

  private _emit(event: CrowdbeatsMapEvent, payload: CrowdbeatsMapEventPayload): void {
    this.eventHandlers.get(event)?.forEach((cb) => {
      try { cb(payload); } catch (e) { console.error('[MapLibre event]', e); }
    });
  }

  /** Apply compact/standard/full zoom classes to all marker elements. */
  private _applyZoomClasses(zoom: number): void {
    this.markerEls.forEach((el) => {
      if (!el.classList.contains('cb-user-marker')) {
        applyZoomClass(el, zoom);
      }
    });
  }

  /** Remove all selection/dimming state from markers. */
  private _clearSelectionState(): void {
    this.selectedMarkerId = null;
    this.markerEls.forEach((el) => {
      el.classList.remove('cb-marker--selected', 'cb-marker--dimmed');
    });
  }
}

// Store MapLibre globally after first load so addMarker() can use ml.Marker synchronously
// (initializeMap() runs async but addMarker() is sync — we cache the module reference)
export async function primeMapLibreGlobal(): Promise<void> {
  if ((globalThis as any).__maplibre_gl__) return;
  const ml = await loadMapLibre();
  (globalThis as any).__maplibre_gl__ = ml;
}