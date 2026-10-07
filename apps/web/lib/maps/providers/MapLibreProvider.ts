/**
 * Crowdbeats Map Engine — MapLibre Provider (Phase 2 Stub)
 *
 * Map RENDERING methods are stubs — they log a warning and no-op.
 * Rendering will be fully implemented in Phase 4.
 *
 * Geocoding and Routing are FULLY FUNCTIONAL via OSM Nominatim + OSRM.
 * These can be used by server-side code or tested independently of the map canvas.
 */

import type {
  ICrowdbeatsMapProvider,
  ICrowdbeatsGeocoderProvider,
  ICrowdbeatsPlacesProvider,
  ICrowdbeatsRoutingProvider,
  ICrowdbeatsStyleProvider,
  CrowdbeatsMapEvent,
  CrowdbeatsMapEventCallback,
} from '../interfaces';
import type {
  CrowdbeatsCoordinate,
  CrowdbeatsBounds,
  CrowdbeatsMapMarker,
  CrowdbeatsRoute,
  CrowdbeatsLayerSpec,
  CrowdbeatsSearchResult,
  MapInitOptions,
  EaseOptions,
} from '../types';
import { ProviderNotReadyError } from '../types';
import { createRoutingProvider } from '../routing';
import { getWalkingRoute, loadMapLibre, CROWDBEATS_MAP_STYLE_URL } from '../../maps/engine/crowdbeatsMapEngine';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const NOMINATIM_HEADERS = {
  'Accept-Language': 'en',
  'User-Agent': 'Crowdbeats-MapEngine/2.0 (crowdbeats.ai)',
};

// ─── Map Provider (Rendering Stub) ───────────────────────────────────────────

export class MapLibreMapProvider implements ICrowdbeatsMapProvider {
  readonly providerName = 'maplibre' as const;

  private mapInstance: any = null; // maplibre-gl Map — activated Phase 4
  private _initialized = false;

  get isInitialized(): boolean { return this._initialized; }

  async initializeMap(container: HTMLElement, options: MapInitOptions = {}): Promise<void> {
    const ml = await loadMapLibre();
    const styleUrl = CROWDBEATS_MAP_STYLE_URL(options.theme ?? 'dark');

    this.mapInstance = new ml.Map({
      container,
      style: styleUrl,
      center: [options.center?.lng ?? -117.1611, options.center?.lat ?? 32.7157],
      zoom: options.zoom ?? 14,
      attributionControl: false,
    });

    await new Promise<void>((resolve) => {
      this.mapInstance.once('load', resolve);
    });

    this._initialized = true;
  }

  destroyMap(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
    this._initialized = false;
  }

  flyTo(coord: CrowdbeatsCoordinate, zoomOrOptions?: number | any): void {
    if (!this.mapInstance) return;
    const opts = typeof zoomOrOptions === 'number' ? { zoom: zoomOrOptions } : (zoomOrOptions ?? {});
    this.mapInstance.flyTo({ center: [coord.lng, coord.lat], ...opts });
  }

  easeTo(coord: CrowdbeatsCoordinate, options: EaseOptions = {}): void {
    if (!this.mapInstance) return;
    this.mapInstance.easeTo({
      center: [coord.lng, coord.lat],
      ...(options.zoom !== undefined ? { zoom: options.zoom } : {}),
      ...(options.duration !== undefined ? { duration: options.duration } : {}),
      ...(options.offset ? { offset: options.offset } : {}),
    });
  }

  centerOnMarker(coord: CrowdbeatsCoordinate, options: EaseOptions = {}): void {
    this.easeTo(coord, {
      zoom: options.zoom ?? Math.max(this.getZoom(), 15),
      offset: options.offset ?? [0, -110],
      duration: options.duration ?? 600,
    });
  }

  fitBounds(bounds: CrowdbeatsBounds, padding = 50): void {
    if (!this.mapInstance) return;
    this.mapInstance.fitBounds(
      [[bounds.sw.lng, bounds.sw.lat], [bounds.ne.lng, bounds.ne.lat]],
      { padding }
    );
  }

  setZoom(zoom: number): void { this.mapInstance?.setZoom(zoom); }
  getZoom(): number { return this.mapInstance?.getZoom() ?? 14; }
  getCenter(): CrowdbeatsCoordinate {
    const c = this.mapInstance?.getCenter();
    return c ? { lat: c.lat, lng: c.lng } : { lat: 32.7157, lng: -117.1611 };
  }
  getBounds(): CrowdbeatsBounds {
    const b = this.mapInstance?.getBounds();
    if (!b) return { sw: { lat: 32.65, lng: -117.25 }, ne: { lat: 32.78, lng: -117.07 } };
    return {
      sw: { lat: b.getSouth(), lng: b.getWest() },
      ne: { lat: b.getNorth(), lng: b.getEast() },
    };
  }

  // Marker methods — Phase 4 will implement custom HTML markers via MapLibre Marker class
  addMarker(_marker: CrowdbeatsMapMarker): string {
    console.warn('[MapLibreProvider] addMarker — full implementation in Phase 4');
    return _marker.id;
  }
  removeMarker(_markerId: string): void {}
  updateMarker(_markerId: string, _updates: Partial<CrowdbeatsMapMarker>): void {}
  selectMarker(_markerId: string): void {}
  deselectMarker(_markerId: string): void {}
  clearAllMarkers(): void {}

  addGeoJsonSource(id: string, data: object): void {
    if (!this.mapInstance) return;
    if (this.mapInstance.getSource(id)) {
      (this.mapInstance.getSource(id) as any).setData(data);
    } else {
      this.mapInstance.addSource(id, { type: 'geojson', data });
    }
  }

  updateGeoJsonSource(id: string, data: object): void {
    const src = this.mapInstance?.getSource(id);
    if (src) (src as any).setData(data);
    else this.addGeoJsonSource(id, data);
  }

  removeGeoJsonSource(id: string): void {
    if (this.mapInstance?.getSource(id)) this.mapInstance.removeSource(id);
  }

  addLayer(layer: CrowdbeatsLayerSpec): void {
    if (!this.mapInstance) return;
    if (!this.mapInstance.getLayer(layer.id)) {
      this.mapInstance.addLayer({
        id: layer.id,
        type: layer.type,
        source: layer.sourceId,
        paint: layer.paint ?? {},
        layout: layer.layout ?? {},
        filter: layer.filter,
      }, layer.beforeId);
    }
  }

  removeLayer(layerId: string): void {
    if (this.mapInstance?.getLayer(layerId)) this.mapInstance.removeLayer(layerId);
  }

  showRoute(route: CrowdbeatsRoute): void {
    if (!this.mapInstance) return;
    this.clearRoute();
    const geojson = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: route.coordinates },
    };
    this.addGeoJsonSource('cb-route', geojson);
    this.addLayer({ id: 'cb-route-glow', type: 'line', sourceId: 'cb-route', paint: { 'line-color': '#00F076', 'line-width': 10, 'line-blur': 6, 'line-opacity': 0.35 } });
    this.addLayer({ id: 'cb-route-solid', type: 'line', sourceId: 'cb-route', paint: { 'line-color': '#00F076', 'line-width': 4, 'line-opacity': 0.9 } });
    this.fitBounds({
      sw: { lat: Math.min(route.origin.lat, route.destination.lat), lng: Math.min(route.origin.lng, route.destination.lng) },
      ne: { lat: Math.max(route.origin.lat, route.destination.lat), lng: Math.max(route.origin.lng, route.destination.lng) },
    }, 80);
  }

  clearRoute(): void {
    this.removeLayer('cb-route-glow');
    this.removeLayer('cb-route-solid');
    this.removeGeoJsonSource('cb-route');
  }

  on(event: CrowdbeatsMapEvent, callback: CrowdbeatsMapEventCallback): void {
    this.mapInstance?.on(event, callback);
  }
  off(event: CrowdbeatsMapEvent, callback: CrowdbeatsMapEventCallback): void {
    this.mapInstance?.off(event, callback);
  }
}

// ─── Geocoder (OSM Nominatim) ────────────────────────────────────────────────

export class MapLibreGeocoderProvider implements ICrowdbeatsGeocoderProvider {
  readonly providerName = 'maplibre' as const;

  async searchLocation(query: string): Promise<CrowdbeatsSearchResult[]> {
    if (!query || query.length < 2) return [];
    try {
      const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=8`;
      const res = await fetch(url, { headers: NOMINATIM_HEADERS, signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];
      const data = await res.json() as any[];
      return data.map((r) => this._nominatimToResult(r));
    } catch { return []; }
  }

  async resolvePlaceId(placeId: string): Promise<CrowdbeatsSearchResult | null> {
    // OSM place IDs are numeric osm_id strings from Nominatim
    try {
      const url = `${NOMINATIM_BASE}/lookup?osm_ids=${placeId}&format=jsonv2&addressdetails=1`;
      const res = await fetch(url, { headers: NOMINATIM_HEADERS, signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const data = await res.json() as any[];
      return data[0] ? this._nominatimToResult(data[0]) : null;
    } catch { return null; }
  }

  async reverseGeocode(coord: CrowdbeatsCoordinate): Promise<CrowdbeatsSearchResult | null> {
    try {
      const url = `${NOMINATIM_BASE}/reverse?lat=${coord.lat}&lon=${coord.lng}&format=jsonv2&addressdetails=1`;
      const res = await fetch(url, { headers: NOMINATIM_HEADERS, signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      return this._nominatimToResult(data);
    } catch { return null; }
  }

  private _nominatimToResult(r: any): CrowdbeatsSearchResult {
    const addr = r.address ?? {};
    return {
      placeId: `osm_${r.osm_id ?? r.place_id}`,
      displayName: r.display_name ?? '',
      city: addr.city ?? addr.town ?? addr.village ?? addr.county ?? '',
      administrativeArea: addr.state ?? '',
      country: addr.country ?? '',
      coordinate: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) },
      source: 'osm' as const,
    };
  }
}

// ─── Places (OSM Overpass for establishments) ─────────────────────────────────

export class MapLibrePlacesProvider implements ICrowdbeatsPlacesProvider {
  readonly providerName = 'maplibre' as const;

  async searchVenues(query: string): Promise<CrowdbeatsSearchResult[]> {
    // Use Nominatim with amenity bias for venue search
    if (!query || query.length < 2) return [];
    try {
      const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=8&featuretype=settlement,building`;
      const res = await fetch(url, { headers: NOMINATIM_HEADERS, signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];
      const data = await res.json() as any[];
      return data.map((r) => ({
        placeId: `osm_${r.osm_id ?? r.place_id}`,
        displayName: r.display_name ?? '',
        city: r.address?.city ?? r.address?.town ?? '',
        country: r.address?.country ?? '',
        coordinate: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) },
        source: 'osm' as const,
      }));
    } catch { return []; }
  }

  async resolveVenueId(placeId: string): Promise<CrowdbeatsSearchResult | null> {
    const geocoder = new MapLibreGeocoderProvider();
    return geocoder.resolvePlaceId(placeId);
  }
}

// ─── Routing (Vendor-Agnostic Phase 11) ──────────────────────────────────────

export class MapLibreRoutingProvider implements ICrowdbeatsRoutingProvider {
  readonly providerName = 'maplibre' as const;
  private delegate = createRoutingProvider();

  async calculateRoute(
    origin: CrowdbeatsCoordinate,
    destination: CrowdbeatsCoordinate,
    mode: 'walking' | 'driving' | 'cycling' = 'walking'
  ): Promise<CrowdbeatsRoute | null> {
    return this.delegate.calculateRoute(origin, destination, mode);
  }
}

// ─── Style Provider ──────────────────────────────────────────────────────────

export class MapLibreStyleProvider implements ICrowdbeatsStyleProvider {
  readonly providerName = 'maplibre' as const;

  getStyleConfig(theme: 'dark' | 'light'): unknown {
    return CROWDBEATS_MAP_STYLE_URL(theme);
  }
}