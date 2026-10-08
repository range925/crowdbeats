'use client';

/**
 * Crowdbeats V2 — Landing Page Live Stage Radar Map
 *
 * Real Google Maps embed with:
 *  - Worldwide Places autocomplete search (city / state / country)
 *  - Map pans + zooms to selected search result (like Google Maps)
 *  - "Use Current Location" GPS button
 *  - Performer markers pinned to map
 *  - Dark map style matching Crowdbeats brand
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  loadGoogleMapsSdk,
  getGooglePlacePredictions,
  resolveGooglePlaceLocation,
  requestBrowserGeolocation,
  type PlacePrediction,
} from '@/lib/maps/googleMapsLoader';

// ── Demo performer pins shown on the map ──────────────────────────────────────
const DEMO_PERFORMERS = [
  { id: 'jake-rios',   name: 'Jake Rios',       lat: 32.7157, lng: -117.1611, genre: 'Indie Rock',   category: 'solo',  venue: 'Balboa Park Stage'   },
  { id: 'the-sunsets', name: 'The Sunsets',      lat: 32.7220, lng: -117.1500, genre: 'Jazz & Soul',  category: 'band',  venue: 'Gaslamp Quarter'     },
  { id: 'maya-lin',    name: 'Maya Lin',         lat: 32.7080, lng: -117.1560, genre: 'Acoustic',     category: 'solo',  venue: 'Little Italy Piazza' },
  { id: 'carlos-r',   name: 'Carlos Reyes',     lat: 32.7300, lng: -117.1700, genre: 'Latin Soul',   category: 'solo',  venue: 'North Park Music Hall'},
  { id: 'elena-v',    name: 'Elena Vance',      lat: 32.7100, lng: -117.1650, genre: 'Folk',         category: 'solo',  venue: 'Ocean Beach Pier'    },
];

// Google Maps dark style — matches Crowdbeats black brand
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0b0b0d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0b0d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

// Google Maps light style — clean minimal for light mode
const LIGHT_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5f3e0' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#4a7c59' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e8f5' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6d9eeb' }] },
];

// Default center: San Diego (demo performers are here)
const DEFAULT_CENTER = { lat: 32.7157, lng: -117.1611 };
const DEFAULT_ZOOM = 13;

interface Props {
  isLight?: boolean;
}

export default function LandingMapSection({ isLight = false }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');
  const [activePerformer, setActivePerformer] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Initialize Google Map ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        await loadGoogleMapsSdk();
        if (cancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          styles: isLight ? LIGHT_MAP_STYLE : DARK_MAP_STYLE,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'cooperative',
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();

        // Place performer markers
        DEMO_PERFORMERS.forEach((p) => {
          const isSolo = p.category === 'solo';
          const marker = new google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map,
            title: p.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: isSolo ? '#8B5CF6' : '#F59E0B',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            },
            animation: google.maps.Animation.DROP,
          });

          marker.addListener('click', () => {
            setActivePerformer(p.id);
            infoWindowRef.current?.setContent(`
              <div style="font-family:-apple-system,sans-serif;padding:8px;min-width:160px;background:#161617;color:#F5F5F7;border-radius:10px;">
                <div style="font-weight:700;font-size:14px;margin-bottom:2px;">${p.name}</div>
                <div style="font-size:12px;color:#86868B;">${p.genre}</div>
                <div style="font-size:11px;color:#2DD4BF;margin-top:4px;">📍 ${p.venue}</div>
                <div style="margin-top:8px;display:flex;gap:6px;">
                  <span style="background:#8B5CF6;color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;">$5</span>
                  <span style="background:#8B5CF6;color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;">$10</span>
                  <span style="background:#8B5CF6;color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;">$20</span>
                </div>
              </div>
            `);
            infoWindowRef.current?.open(map, marker);
          });

          markersRef.current.push(marker);
        });

        if (!cancelled) setMapReady(true);
      } catch (err) {
        if (!cancelled) setMapError('Unable to load Google Maps. Check your connection.');
        console.error('[LandingMap] init error:', err);
      }
    }

    initMap();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync map style when theme changes ─────────────────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({
        styles: isLight ? LIGHT_MAP_STYLE : DARK_MAP_STYLE,
      });
    }
  }, [isLight]);

  // ── Places autocomplete debounce ───────────────────────────────────────────
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setSuggestions([]);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const preds = await getGooglePlacePredictions(val);
        setSuggestions(preds);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  // ── Select autocomplete result → pan map ───────────────────────────────────
  const handleSelectSuggestion = useCallback(async (pred: PlacePrediction) => {
    setShowDropdown(false);
    setSuggestions([]);
    setSearchQuery(pred.fullText);
    setSearching(true);

    try {
      const loc = await resolveGooglePlaceLocation(pred.placeId, pred.fullText);
      if (loc && mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: loc.latitude, lng: loc.longitude });
        mapInstanceRef.current.setZoom(12);
      }
    } catch (err) {
      console.warn('[LandingMap] location resolve error:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  // ── Use Current Location ───────────────────────────────────────────────────
  const handleCurrentLocation = useCallback(async () => {
    setGeoStatus('Detecting location…');
    try {
      const { latitude, longitude } = await requestBrowserGeolocation();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: latitude, lng: longitude });
        mapInstanceRef.current.setZoom(14);

        new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: mapInstanceRef.current,
          title: 'You are here',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#30D158',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        });
      }
      setGeoStatus('📍 Location found');
      setTimeout(() => setGeoStatus(''), 3000);
    } catch (err) {
      setGeoStatus(typeof err === 'string' ? err : 'Location unavailable');
      setTimeout(() => setGeoStatus(''), 4000);
    }
  }, []);

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.closest('.cb-landing-search')?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const border = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const cardBg = isLight ? '#FFFFFF' : '#161617';
  const textPrimary = isLight ? '#1D1D1F' : '#F5F5F7';
  const textSecondary = isLight ? '#6E6E73' : '#86868B';

  return (
    <section
      id="discovery-stage"
      style={{
        width: '100%',
        backgroundColor: isLight ? '#FFFFFF' : '#0B0B0D',
        borderTop: `1px solid ${border}`,
        borderBottom: `1px solid ${border}`,
        padding: 'clamp(48px, 6vw, 80px) clamp(20px, 4vw, 48px)',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>

        {/* ── Section header ── */}
        <div style={{ marginBottom: 28 }}>
          <span style={{ color: '#2DD4BF', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Live Stage Radar
          </span>
          <h2 style={{ fontFamily: 'var(--cb-font-display)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, letterSpacing: '-0.024em', lineHeight: 1.12, margin: '0 0 6px', color: textPrimary }}>
            The next great performance is nearby.
          </h2>
          <p style={{ fontSize: 15, color: textSecondary, margin: 0 }}>
            Search any city, town, or country worldwide — then discover live performers near there.
          </p>
        </div>

        {/* ── Search bar + location button row ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>

          {/* Search input with autocomplete */}
          <div
            className="cb-landing-search"
            style={{ position: 'relative', flex: '1 1 300px', maxWidth: 520 }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderRadius: 9999,
              backgroundColor: cardBg,
              border: `1px solid ${border}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search city, town, state, or country…"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setShowDropdown(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setShowDropdown(false); setSuggestions([]); }
                  if (e.key === 'Enter' && suggestions.length > 0) handleSelectSuggestion(suggestions[0]);
                }}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  WebkitAppearance: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  color: textPrimary,
                  fontFamily: 'var(--cb-font-body, -apple-system, sans-serif)',
                }}
              />
              {searching && (
                <span style={{ fontSize: 12, color: textSecondary, flexShrink: 0 }}>Searching…</span>
              )}
              {searchQuery && !searching && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSuggestions([]); setShowDropdown(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, fontSize: 16, padding: 0, flexShrink: 0 }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Autocomplete dropdown with "Use Current Location" option on top */}
            {showDropdown && searchQuery.trim().length > 0 && (
              <div style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                right: 0,
                backgroundColor: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 14,
                boxShadow: isLight
                  ? '0 16px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)'
                  : '0 16px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05)',
                zIndex: 1000,
                overflow: 'hidden',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}>
                {/* ── Option: Use Current Location (Always at the top) ── */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowDropdown(false);
                    setSearchQuery('Current Location');
                    handleCurrentLocation();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: `1px solid ${border}`,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isLight ? '#F5F5F7' : '#1D1D1F')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      backgroundColor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#10B981',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Use Current Location</span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 9999,
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                        }}
                      >
                        GPS
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: textSecondary, marginTop: 1 }}>
                      Find live stages and musicians near you right now
                    </div>
                  </div>
                </button>

                {/* ── Section header for place suggestions ── */}
                {suggestions.length > 0 && (
                  <div
                    style={{
                      padding: '8px 16px 4px',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: textSecondary,
                      backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    Places & Cities
                  </div>
                )}

                {/* ── Searching indicator ── */}
                {searching && suggestions.length === 0 && (
                  <div style={{ padding: '12px 16px', fontSize: 13, color: textSecondary, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⏳</span>
                    <span>Searching places for &ldquo;{searchQuery}&rdquo;…</span>
                  </div>
                )}

                {/* ── Autocomplete suggestions ── */}
                {suggestions.map((pred, i) => (
                  <button
                    key={pred.placeId || i}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(pred); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '11px 16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: i < suggestions.length - 1 ? `1px solid ${border}` : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isLight ? '#F5F5F7' : '#1D1D1F')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary, marginBottom: 2 }}>
                      📍 {pred.mainText}
                    </div>
                    {pred.secondaryText && (
                      <div style={{ fontSize: 12, color: textSecondary }}>{pred.secondaryText}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>


          {/* Status badge */}
          {geoStatus && (
            <div style={{
              padding: '6px 14px',
              borderRadius: 9999,
              backgroundColor: 'rgba(45,212,191,0.15)',
              color: '#2DD4BF',
              fontSize: 12,
              fontWeight: 600,
            }}>
              {geoStatus}
            </div>
          )}
        </div>

        {/* ── Real Google Map ── */}
        <div style={{
          borderRadius: 20,
          overflow: 'hidden',
          border: `1px solid ${border}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          position: 'relative',
        }}>
          {/* Map container — Google Maps renders here */}
          <div
            ref={mapRef}
            style={{ width: '100%', height: 520 }}
          />

          {/* Loading overlay */}
          {!mapReady && !mapError && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#0B0B0D',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}>
              <div style={{ fontSize: 32 }}>🗺️</div>
              <p style={{ color: '#86868B', fontSize: 14, margin: 0 }}>Loading map…</p>
            </div>
          )}

          {/* Error overlay */}
          {mapError && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#0B0B0D',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: 24,
            }}>
              <div style={{ fontSize: 32 }}>⚠️</div>
              <p style={{ color: '#86868B', fontSize: 14, margin: 0, textAlign: 'center' }}>{mapError}</p>
            </div>
          )}

          {/* Performer legend overlay */}
          {mapReady && (
            <div style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              backgroundColor: 'rgba(11,11,13,0.88)',
              backdropFilter: 'blur(12px)',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              gap: 14,
              fontSize: 12,
              color: '#F5F5F7',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#8B5CF6', display: 'inline-block' }} />
                Solo Artist
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }} />
                Band
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#30D158', display: 'inline-block' }} />
                You
              </span>
            </div>
          )}
        </div>

        {/* ── Performer count badge ── */}
        {mapReady && (
          <div style={{ marginTop: 12, fontSize: 12, color: textSecondary, textAlign: 'right' }}>
            {DEMO_PERFORMERS.length} live performers shown · Click a marker to tip
          </div>
        )}
      </div>
    </section>
  );
}
