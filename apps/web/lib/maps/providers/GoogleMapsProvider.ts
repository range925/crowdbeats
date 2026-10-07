/**
 * Crowdbeats Map Engine — Google Maps Provider (Phase 2)
 *
 * Implements all Crowdbeats map interfaces using the Google Maps JS API.
 * This is the ONLY file in the codebase permitted to:
 *   - Import from googleMapsLoader.ts
 *   - Reference window.google.maps.*
 *   - Use google.maps.MapTypeStyle[]
 *
 * Business logic and feature components must NEVER import this file directly.
 * They use the interfaces (ICrowdbeatsMapProvider, etc.) via the factory.
 */

import type {
  ICrowdbeatsMapProvider,
  ICrowdbeatsGeocoderProvider,
  ICrowdbeatsPlacesProvider,
  ICrowdbeatsRoutingProvider,
  ICrowdbeatsStyleProvider,
  CrowdbeatsMapEvent,
  CrowdbeatsMapEventCallback,
  CrowdbeatsMapEventPayload,
} from '../interfaces';
import type {
  CrowdbeatsCoordinate,
  CrowdbeatsBounds,
  CrowdbeatsMapMarker,
  CrowdbeatsArtistMarker,
  CrowdbeatsBandMarker,
  CrowdbeatsLiveMarker,
  CrowdbeatsUserMarker,
  CrowdbeatsVenueMarker,
  CrowdbeatsRoute,
  CrowdbeatsLayerSpec,
  CrowdbeatsSearchResult,
  MapInitOptions,
  EaseOptions,
} from '../types';
import { MapNotInitializedError, CrowdbeatsMapError } from '../types';
import {
  loadGoogleMapsSdk,
  getGooglePlacePredictions,
  getVenuePlacePredictions,
  resolveGooglePlaceLocation,
  geocodeCityQuery,
  calculateGoogleWalkingRoute,
  type PlacePrediction,
} from '../../maps/googleMapsLoader';

// ─── Dark / Light map styles ─────────────────────────────────────────────────
// Canonical style arrays used by fan nearby map and landing radar.

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0b0c10' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0c10' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2032' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2b2d44' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b0c10' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

const LIGHT_MAP_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

// ─── Map Provider ─────────────────────────────────────────────────────────────

export class GoogleMapsMapProvider implements ICrowdbeatsMapProvider {
  readonly providerName = 'google' as const;

  private mapInstance: any = null; // google.maps.Map — typed as any to avoid importing @types/google.maps globally
  private markers = new Map<string, any>(); // markerId → AdvancedMarkerElement
  private selectedMarkerId: string | null = null;
  private routePolylines: any[] = [];
  private geoJsonSources = new Map<string, any>(); // Google doesn't have a source concept; stored for compat
  private layers = new Map<string, any>();
  private eventHandlers = new Map<CrowdbeatsMapEvent, Set<CrowdbeatsMapEventCallback>>();
  private markerCounter = 0;

  get isInitialized(): boolean {
    return this.mapInstance !== null;
  }

  async initializeMap(container: HTMLElement, options: MapInitOptions = {}): Promise<void> {
    await loadGoogleMapsSdk();
    const gmaps = (window as any).google?.maps;
    if (!gmaps) throw new CrowdbeatsMapError('Google Maps SDK failed to load', 'SDK_LOAD_FAILED', 'google');

    const { Map: GMap } = await gmaps.importLibrary('maps');
    const center = options.center ?? { lat: 32.7157, lng: -117.1611 }; // San Diego fallback

    this.mapInstance = new GMap(container, {
      center: { lat: center.lat, lng: center.lng },
      zoom: options.zoom ?? 14,
      mapId: 'crowdbeats_live_map',
      styles: options.theme === 'light' ? LIGHT_MAP_STYLES : DARK_MAP_STYLES,
      disableDefaultUI: false,
      gestureHandling: 'greedy',
    });

    // Wire native map events to our event system
    this.mapInstance.addListener('click', (e: any) => {
      this._emit('click', {
        type: 'click',
        coordinate: { lat: e.latLng.lat(), lng: e.latLng.lng() },
        originalEvent: e.domEvent,
      });
    });
    this.mapInstance.addListener('idle', () => this._emit('moveend', { type: 'moveend' }));
    this._emit('load', { type: 'load' });
  }

  destroyMap(): void {
    this.clearAllMarkers();
    this.clearRoute();
    this.eventHandlers.clear();
    this.mapInstance = null;
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  flyTo(coord: CrowdbeatsCoordinate, zoomOrOptions?: number | any): void {
    this._requireMap();
    const zoom = typeof zoomOrOptions === 'number' ? zoomOrOptions : zoomOrOptions?.zoom;
    this.mapInstance.panTo({ lat: coord.lat, lng: coord.lng });
    if (zoom !== undefined) this.mapInstance.setZoom(zoom);
  }

  easeTo(coord: CrowdbeatsCoordinate, options: EaseOptions = {}): void {
    this._requireMap();
    this.mapInstance.panTo({ lat: coord.lat, lng: coord.lng });
    if (options.zoom !== undefined) this.mapInstance.setZoom(options.zoom);
  }

  centerOnMarker(coord: CrowdbeatsCoordinate, options: EaseOptions = {}): void {
    this._requireMap();
    this.mapInstance.panTo({ lat: coord.lat, lng: coord.lng });
    if (options.zoom !== undefined) this.mapInstance.setZoom(options.zoom);
  }

  fitBounds(bounds: CrowdbeatsBounds, padding = 50): void {
    this._requireMap();
    const gmaps = (window as any).google.maps;
    const b = new gmaps.LatLngBounds(
      { lat: bounds.sw.lat, lng: bounds.sw.lng },
      { lat: bounds.ne.lat, lng: bounds.ne.lng }
    );
    this.mapInstance.fitBounds(b, padding);
  }

  setZoom(zoom: number): void { this._requireMap(); this.mapInstance.setZoom(zoom); }
  getZoom(): number { this._requireMap(); return this.mapInstance.getZoom() ?? 14; }
  getCenter(): CrowdbeatsCoordinate {
    this._requireMap();
    const c = this.mapInstance.getCenter();
    return { lat: c.lat(), lng: c.lng() };
  }
  getBounds(): CrowdbeatsBounds {
    this._requireMap();
    const b = this.mapInstance.getBounds();
    if (!b) return { sw: { lat: 32.65, lng: -117.25 }, ne: { lat: 32.78, lng: -117.07 } };
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    return {
      sw: { lat: sw.lat(), lng: sw.lng() },
      ne: { lat: ne.lat(), lng: ne.lng() },
    };
  }

  // ── Markers ────────────────────────────────────────────────────────────────

  addMarker(marker: CrowdbeatsMapMarker): string {
    this._requireMap();
    const id = marker.id || `gm_${++this.markerCounter}`;
    const el = this._buildMarkerElement(marker);

    const gmaps = (window as any).google.maps;
    // AdvancedMarkerElement requires mapId on the map
    const addAdvancedMarker = async () => {
      const { AdvancedMarkerElement } = await gmaps.importLibrary('marker');
      const instance = new AdvancedMarkerElement({
        map: this.mapInstance,
        position: { lat: marker.position.lat, lng: marker.position.lng },
        content: el,
        title: marker.label,
        zIndex: marker.zIndex,
      });
      instance.addListener('click', () => {
        this._emit('marker:click', { type: 'marker:click', markerId: id, coordinate: marker.position });
      });
      this.markers.set(id, instance);
    };
    void addAdvancedMarker();
    return id;
  }

  removeMarker(markerId: string): void {
    const m = this.markers.get(markerId);
    if (m) { m.map = null; this.markers.delete(markerId); }
    if (this.selectedMarkerId === markerId) this.selectedMarkerId = null;
  }

  updateMarker(markerId: string, updates: Partial<CrowdbeatsMapMarker>): void {
    const m = this.markers.get(markerId);
    if (!m) return;
    if (updates.position) m.position = { lat: updates.position.lat, lng: updates.position.lng };
    if (updates.label) m.title = updates.label;
    if (updates.zIndex !== undefined) m.zIndex = updates.zIndex;
  }

  selectMarker(markerId: string): void {
    if (this.selectedMarkerId) this.deselectMarker(this.selectedMarkerId);
    const m = this.markers.get(markerId);
    if (m?.element) m.element.classList.add('cb-marker--selected');
    this.selectedMarkerId = markerId;
  }

  deselectMarker(markerId: string): void {
    const m = this.markers.get(markerId);
    if (m?.element) m.element.classList.remove('cb-marker--selected');
    if (this.selectedMarkerId === markerId) this.selectedMarkerId = null;
  }

  clearAllMarkers(): void {
    this.markers.forEach((m) => { m.map = null; });
    this.markers.clear();
    this.selectedMarkerId = null;
  }

  // ── Layers / GeoJSON ───────────────────────────────────────────────────────
  // Note: Google Maps JS API doesn't have a native data-layer source model like MapLibre.
  // GeoJSON is supported via google.maps.Data layer.

  addGeoJsonSource(id: string, data: object): void {
    this._requireMap();
    const gmaps = (window as any).google.maps;
    const dataLayer = new gmaps.Data({ map: this.mapInstance });
    dataLayer.addGeoJson(data);
    this.geoJsonSources.set(id, dataLayer);
  }

  updateGeoJsonSource(id: string, data: object): void {
    const existing = this.geoJsonSources.get(id);
    if (existing) {
      existing.forEach((f: any) => existing.remove(f));
      existing.addGeoJson(data);
    } else {
      this.addGeoJsonSource(id, data);
    }
  }

  removeGeoJsonSource(id: string): void {
    const layer = this.geoJsonSources.get(id);
    if (layer) { layer.setMap(null); this.geoJsonSources.delete(id); }
  }

  addLayer(_layer: CrowdbeatsLayerSpec): void {
    // Google Maps JS API manages rendering via Data layers and Overlays, not discrete
    // named layers like MapLibre. This is a no-op at the abstraction level —
    // style is applied when GeoJSON source is added.
  }

  removeLayer(layerId: string): void {
    this.removeGeoJsonSource(layerId); // best-effort
  }

  // ── Routes ─────────────────────────────────────────────────────────────────

  showRoute(route: CrowdbeatsRoute): void {
    this._requireMap();
    this.clearRoute();
    const gmaps = (window as any).google.maps;

    // Convert [lng, lat] GeoJSON pairs → google.maps.LatLng objects
    const path = route.coordinates.map(([lng, lat]: [number, number]) =>
      new gmaps.LatLng(lat, lng)
    );

    // Glow layer (wider, semi-transparent)
    const glow = new gmaps.Polyline({
      path,
      map: this.mapInstance,
      strokeColor: '#00F076',
      strokeOpacity: 0.3,
      strokeWeight: 10,
      zIndex: 1,
    });

    // Solid layer (narrower, opaque)
    const solid = new gmaps.Polyline({
      path,
      map: this.mapInstance,
      strokeColor: '#00F076',
      strokeOpacity: 0.9,
      strokeWeight: 4,
      zIndex: 2,
    });

    this.routePolylines = [glow, solid];

    // Fit bounds to show full route
    const b = new gmaps.LatLngBounds();
    b.extend({ lat: route.origin.lat, lng: route.origin.lng });
    b.extend({ lat: route.destination.lat, lng: route.destination.lng });
    this.mapInstance.fitBounds(b, 80);
  }

  clearRoute(): void {
    this.routePolylines.forEach((p) => p.setMap(null));
    this.routePolylines = [];
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  on(event: CrowdbeatsMapEvent, callback: CrowdbeatsMapEventCallback): void {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, new Set());
    this.eventHandlers.get(event)!.add(callback);
  }

  off(event: CrowdbeatsMapEvent, callback: CrowdbeatsMapEventCallback): void {
    this.eventHandlers.get(event)?.delete(callback);
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private _requireMap(): void {
    if (!this.mapInstance) throw new MapNotInitializedError('google');
  }

  private _emit(event: CrowdbeatsMapEvent, payload: CrowdbeatsMapEventPayload): void {
    this.eventHandlers.get(event)?.forEach((cb) => cb(payload));
  }

  private _buildMarkerElement(marker: CrowdbeatsMapMarker): HTMLDivElement {
    const el = document.createElement('div');
    el.className = `cb-marker cb-marker--${marker.type}`;

    switch (marker.type) {
      case 'live':
      case 'artist': {
        const m = marker as CrowdbeatsLiveMarker | CrowdbeatsArtistMarker;
        const photoUrl = 'photoUrl' in m ? m.photoUrl : undefined;
        const name = 'performerName' in m ? m.performerName : ('stageName' in m ? m.stageName : marker.label);
        el.innerHTML = `
          <div style="position:relative;cursor:pointer">
            <div style="width:48px;height:48px;border-radius:50%;border:2px solid #00F076;overflow:hidden;background:#1a1a2e">
              ${photoUrl ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover" alt="${name}" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#00F076;font-size:18px">♪</div>`}
            </div>
            <div style="position:absolute;top:-8px;right:-8px;background:#00F076;color:#000;font-size:9px;font-weight:700;padding:2px 4px;border-radius:4px">LIVE</div>
            <div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid rgba(0,240,118,0.4);animation:cb-pulse 1.5s ease-in-out infinite"></div>
          </div>`;
        break;
      }
      case 'user': {
        el.innerHTML = `
          <div style="position:relative">
            <div style="width:16px;height:16px;border-radius:50%;background:#4A90E2;border:2px solid #fff;box-shadow:0 0 0 3px rgba(74,144,226,0.3)"></div>
            <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(74,144,226,0.3);animation:cb-pulse 2s ease-in-out infinite"></div>
          </div>`;
        break;
      }
      case 'venue': {
        const v = marker as CrowdbeatsVenueMarker;
        el.innerHTML = `
          <div style="background:#1a1a2e;border:1px solid #00F076;border-radius:8px;padding:4px 8px;color:#00F076;font-size:11px;font-weight:600;white-space:nowrap;cursor:pointer">
            📍 ${v.venueName}
          </div>`;
        break;
      }
      default:
        el.innerHTML = `<div style="width:12px;height:12px;border-radius:50%;background:#00F076;border:2px solid #fff"></div>`;
    }

    return el;
  }
}

// ─── Geocoder Provider ────────────────────────────────────────────────────────

export class GoogleMapsGeocoderProvider implements ICrowdbeatsGeocoderProvider {
  readonly providerName = 'google' as const;

  async searchLocation(query: string): Promise<CrowdbeatsSearchResult[]> {
    const predictions = await getGooglePlacePredictions(query);
    return predictions.map((p: PlacePrediction) => ({
      placeId: p.placeId,
      displayName: p.fullText,
      city: p.mainText,
      country: '',
      coordinate: { lat: 0, lng: 0 }, // resolved lazily via resolvePlaceId
      source: 'google' as const,
    }));
  }

  async resolvePlaceId(placeId: string): Promise<CrowdbeatsSearchResult | null> {
    const loc = await resolveGooglePlaceLocation(placeId);
    if (!loc) return null;
    return {
      placeId: loc.placeId,
      displayName: loc.displayName,
      city: loc.city,
      administrativeArea: loc.administrativeArea,
      country: loc.country,
      coordinate: { lat: loc.latitude, lng: loc.longitude },
      source: 'google' as const,
    };
  }

  async reverseGeocode(coord: CrowdbeatsCoordinate): Promise<CrowdbeatsSearchResult | null> {
    const loc = await geocodeCityQuery(`${coord.lat},${coord.lng}`);
    if (!loc) return null;
    return {
      placeId: loc.placeId,
      displayName: loc.displayName,
      city: loc.city,
      administrativeArea: loc.administrativeArea,
      country: loc.country,
      coordinate: { lat: loc.latitude, lng: loc.longitude },
      source: 'google' as const,
    };
  }
}

// ─── Places Provider ─────────────────────────────────────────────────────────

export class GoogleMapsPlacesProvider implements ICrowdbeatsPlacesProvider {
  readonly providerName = 'google' as const;

  async searchVenues(query: string): Promise<CrowdbeatsSearchResult[]> {
    const predictions = await getVenuePlacePredictions(query);
    return predictions.map((p: PlacePrediction) => ({
      placeId: p.placeId,
      displayName: p.fullText,
      city: p.mainText,
      country: '',
      coordinate: { lat: 0, lng: 0 },
      source: 'google' as const,
    }));
  }

  async resolveVenueId(placeId: string): Promise<CrowdbeatsSearchResult | null> {
    const loc = await resolveGooglePlaceLocation(placeId);
    if (!loc) return null;
    return {
      placeId: loc.placeId,
      displayName: loc.displayName,
      city: loc.city,
      country: loc.country,
      coordinate: { lat: loc.latitude, lng: loc.longitude },
      source: 'google' as const,
    };
  }
}

// ─── Routing Provider ────────────────────────────────────────────────────────

export class GoogleMapsRoutingProvider implements ICrowdbeatsRoutingProvider {
  readonly providerName = 'google' as const;

  async calculateRoute(
    origin: CrowdbeatsCoordinate,
    destination: CrowdbeatsCoordinate,
    mode: 'walking' | 'driving' = 'walking'
  ): Promise<CrowdbeatsRoute | null> {
    const result = await calculateGoogleWalkingRoute(
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng }
    );
    if (!result) return null;

    // Convert Google's {lat,lng} points to GeoJSON [lng, lat] pairs
    const coordinates: [number, number][] = result.points.map(
      (p: { lat: number; lng: number }) => [p.lng, p.lat]
    );

    return {
      coordinates,
      origin,
      destination,
      durationText: result.durationText,
      distanceMilesText: result.distanceMilesText,
      distanceMiles: parseFloat(result.distanceMilesText) || 0,
      durationSeconds: 0, // Google doesn't return seconds in JS API
      mode: 'walking',
    };
  }
}

// ─── Style Provider ──────────────────────────────────────────────────────────

export class GoogleMapsStyleProvider implements ICrowdbeatsStyleProvider {
  readonly providerName = 'google' as const;

  getStyleConfig(theme: 'dark' | 'light'): unknown {
    return theme === 'light' ? LIGHT_MAP_STYLES : DARK_MAP_STYLES;
  }
}