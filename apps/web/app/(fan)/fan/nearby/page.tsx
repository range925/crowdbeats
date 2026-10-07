'use client';

/**
 * Crowdbeats V2 — Fan Nearby Discovery  (Phase 7 — MapLibre + Firebase Live Now)
 * Route: /fan/nearby
 *
 * Architecture:
 *   useLivePerformers()   — Firebase real-time subscription to checkins
 *   useLiveMapSync()      — diffs performers → MapLibre marker add/update/remove
 *   CrowdbeatsMapLibre    — MapLibre map with Crowdbeats OSM theme (Phase 5)
 *   Phase 6 marker system — live pulse, zoom states, selection dimming
 *   Phase 11 routing      — vendor-neutral routing engine + CrowdbeatsMapBottomSheet
 */

import React, { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { CbLiveBadge, CbPillButton, CbOutlineButton } from '@/components/ui';
import { getVenuePlacePredictions } from '@/lib/maps/googleMapsLoader';
import { useAuth } from '@/lib/hooks/useAuth';
import { TipAuthGateModal } from '@/components/discovery/TipAuthGateModal';
import { POPULAR_CHECKIN_VENUES } from '@/lib/discovery/discoveryClient';
import { useLivePerformers } from '@/hooks/useLivePerformers';
import { useNearbyDiscovery } from '@/hooks/useNearbyDiscovery';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useRouteDirections } from '@/hooks/useRouteDirections';
import { CrowdbeatsMapBottomSheet } from '@/components/maps/CrowdbeatsMapBottomSheet';
import type { CrowdbeatsSearchResult } from '@/lib/maps/types';
import { useMapTheme } from '@/hooks/useMapTheme';
import { createUserMarker } from '@/lib/maps/utils/markerNormalizers';
import type { CrowdbeatsMapLibreRef } from '@/components/maps/CrowdbeatsMapLibre';
import type { LiveCheckin } from '@/lib/firebase/firestore';
import type { PlacePrediction } from '@/lib/maps/googleMapsLoader';

// Dynamic import — MapLibre needs the DOM
const CrowdbeatsMapLibre = dynamic(
  () => import('@/components/maps/CrowdbeatsMapLibre').then((m) => m.CrowdbeatsMapLibre),
  { ssr: false, loading: () => <MapLoadingState /> }
);

// ── Sub-components ────────────────────────────────────────────────────────────

function MapLoadingState() {
  return (
    <div className="w-full h-[520px] rounded-3xl bg-[#0a0b0e] border border-[#2B2D44] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <svg className="w-8 h-8 animate-spin text-[#00F076]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p className="text-sm text-[#64748B]">Loading map…</p>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'map' | 'radar' | 'list';
type DetectionState = 'idle' | 'detecting' | 'detected' | 'error';

const GENRES = ['All', 'Acoustic', 'Rock', 'Jazz & Soul', 'Electronic', 'Folk', 'R&B'];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NearbyMapPage() {
  // Location
  const [viewMode, setViewMode]               = useState<ViewMode>('map');
  const [selectedGenre, setSelectedGenre]     = useState('All');
  const [detectionState, setDetectionState]   = useState<DetectionState>('idle');
  const [detectionError, setDetectionError]   = useState<string | null>(null);
  const [userLocation, setUserLocation]       = useState<{ lat: number; lng: number } | null>(null);
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(false);

  // Venue search
  const [venueQuery, setVenueQuery]           = useState('');
  const [venueSuggestions, setVenueSuggestions] = useState<Array<{placeId:string;mainText:string;secondaryText?:string;latitude?:number;longitude?:number}>>([]);
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false);
  const venueDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected performer (bottom sheet)
  const [selectedPerformer, setSelectedPerformer] = useState<LiveCheckin | null>(null);
  const [directionsText, setDirectionsText]   = useState<string | null>(null);
  const [isFollowingLocation, setIsFollowingLocation] = useState(true);

  // Auth & Tip Gate Modal
  const { status } = useAuth();
  const isAuthenticated = status === 'authenticated';

  const [tipModalState, setTipModalState] = useState<{
    isOpen: boolean;
    performerId: string;
    performerSlug: string;
    performerName: string;
    performerType: 'artist' | 'band';
  }>({
    isOpen: false,
    performerId: '',
    performerSlug: '',
    performerName: '',
    performerType: 'artist',
  });

  const handleTipClick = (perf: LiveCheckin) => {
    if (!isAuthenticated) {
      setTipModalState({
        isOpen: true,
        performerId: perf.uid,
        performerSlug: (perf as any).performerSlug || perf.uid,
        performerName: perf.performerName,
        performerType: perf.type === 'band' ? 'band' : 'artist',
      });
    } else {
      window.location.href = perf.tipLink || `/fan/tip?performer=${perf.uid}`;
    }
  };

  // Map ref
  const mapRef = useRef<CrowdbeatsMapLibreRef | null>(null);
  const [mapProvider, setMapProvider] = useState<any | null>(null);

  // Theme
  const { theme } = useMapTheme();
  // Phase 10: Provider-neutral Location & City Autocomplete
  const {
    query: locationSearchQuery,
    setQuery: setLocationSearchQuery,
    results: locationSuggestions,
    isLoading: isLocationSearching,
    clearResults: clearLocationSuggestions,
    isCached: isLocationSearchCached,
  } = useLocationSearch({ minChars: 3, debounceMs: 300 });

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const handleSelectLocationResult = useCallback((item: CrowdbeatsSearchResult) => {
    setLocationSearchQuery(item.displayName);
    setShowLocationDropdown(false);
    clearLocationSuggestions();

    const coord = item.coordinate;
    setUserLocation(coord);
    setDetectionState('detected');
    setSelectedPerformer(null);

    // If result has bounding box, smoothly fit bounds; otherwise fly to coord
    if (item.bounds && mapRef.current) {
      mapRef.current.fitBounds(item.bounds, 60);
    } else if (mapRef.current) {
      mapRef.current.flyTo(coord, 13);
    }
  }, [clearLocationSuggestions, setLocationSearchQuery]);

  // Firebase live data — only subscribe once location is detected
  const { performers, isLoading: liveLoading, liveCount } = useLivePerformers({
    lat: userLocation?.lat,
    lng: userLocation?.lng,
    radiusMiles: 5,
    enabled: detectionState === 'detected',
  });

  // Phase 11: Route directions hook
  const {
    route: activeRoute,
    isLoading: routeLoading,
    error: routeError,
    mode: routeMode,
    setMode: setRouteMode,
    requestRoute,
    clearRoute,
    openExternalNavigation,
  } = useRouteDirections({
    origin: userLocation,
    destination: selectedPerformer ? { lat: selectedPerformer.latitude, lng: selectedPerformer.longitude } : null,
    destinationName: selectedPerformer?.venueName || selectedPerformer?.performerName,
    onRouteCalculated: (route) => {
      mapRef.current?.showRoute(route);
    },
  });

  const handleCloseBottomSheet = useCallback(() => {
    setSelectedPerformer(null);
    clearRoute();
    mapRef.current?.clearRoute();
  }, [clearRoute]);

  // Phase 8: Smart clustering + Viewport synchronization
  const {
    visiblePerformers,
    clusters,
    handleViewportChange,
    visibleCount,
  } = useNearbyDiscovery({
    provider: mapProvider,
    performers,
    userLat: userLocation?.lat,
    userLng: userLocation?.lng,
    onPerformerSelect: (perf) => {
      setSelectedPerformer(perf);
      clearRoute();
      mapRef.current?.clearRoute();
      mapRef.current?.provider?.selectMarker(`live_${perf.uid}`);
      mapRef.current?.provider?.centerOnMarker({ lat: perf.latitude, lng: perf.longitude });
    },
  });

  // ── Venue autocomplete ────────────────────────────────────────────────────

  const handleVenueQuery = useCallback((q: string) => {
    setVenueQuery(q);
    if (venueDebounceRef.current) clearTimeout(venueDebounceRef.current);
    if (!q || q.length < 2) { setVenueSuggestions([]); return; }
    venueDebounceRef.current = setTimeout(async () => {
      const ql = q.toLowerCase();
      const curated = POPULAR_CHECKIN_VENUES
        .filter((v) => v.name.toLowerCase().includes(ql) || v.city.toLowerCase().includes(ql))
        .map((v) => ({ placeId: v.placeId, mainText: v.name, secondaryText: v.city + ', ' + v.state + ' ' + v.emoji, fullText: v.address, latitude: v.latitude, longitude: v.longitude }));
      const googleSuggs: Array<{placeId:string;mainText:string;secondaryText?:string}> = await fetch('/api/places/autocomplete?q=' + encodeURIComponent(q) + '&intent=venue').then((r) => r.ok ? r.json() : []).catch(() => []);
      const seen = new Set(curated.map((c) => c.placeId));
      const merged = [...curated, ...googleSuggs.filter((g) => g.placeId && !seen.has(g.placeId))].slice(0, 7);
      setVenueSuggestions(merged);
      setShowVenueSuggestions(merged.length > 0);
    }, 280);
  }, []);

  // ── GPS detection ─────────────────────────────────────────────────────────

  const handleDetectLocation = useCallback(() => {
    setDetectionState('detecting');
    setDetectionError(null);
    setSelectedPerformer(null);

    if (!navigator.geolocation) {
      setDetectionState('error');
      setDetectionError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        setDetectionState('detected');

        // Add user location marker once map is ready
        setTimeout(() => {
          if (mapProvider) {
            const um = createUserMarker(lat, lng, pos.coords.accuracy);
            mapProvider.removeMarker('user_self'); // remove stale
            mapProvider.addMarker(um);
            mapProvider.flyTo({ lat, lng }, 14);
          }
        }, 500);
      },
      (err) => {
        setDetectionState('error');
        const msg =
          err.code === 1 ? 'Location permission denied. Please enable location access in your browser settings.' :
          err.code === 2 ? 'Could not determine your location. Try again.' :
          'Location request timed out. Please try again.';
        setDetectionError(msg);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, [mapProvider]);

  // ── Map event handlers ────────────────────────────────────────────────────

  const handleMapLoad = useCallback(() => {
    // Grab provider after map initialises
    if (mapRef.current?.provider) {
      setMapProvider(mapRef.current.provider);
    }
  }, []);

  const handleMarkerClick = useCallback((markerId: string) => {
    const uid = markerId.replace('live_', '');
    const perf = performers.find((p) => p.uid === uid);
    if (perf) {
      setSelectedPerformer(perf);
      setDirectionsText(null);
      mapRef.current?.provider?.selectMarker(markerId);
      mapRef.current?.provider?.flyTo({ lat: perf.latitude, lng: perf.longitude }, undefined);
    }
  }, [performers]);

  const handleGetDirections = useCallback(async () => {
    if (!selectedPerformer || !userLocation) return;
    setDirectionsText('Calculating route…');
    try {
      const { lat, lng } = { lat: selectedPerformer.latitude, lng: selectedPerformer.longitude };
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: userLocation,
          destination: { lat, lng },
          mode: 'walking',
        }),
      });
      if (!res.ok) throw new Error('Route API error');
      const data = await res.json();
      if (data.durationText && data.distanceMilesText) {
        setDirectionsText(data.durationText + ' • ' + data.distanceMilesText + ' walking');
        mapRef.current?.provider?.fitBounds(
          { sw: { lat: Math.min(userLocation.lat, lat), lng: Math.min(userLocation.lng, lng) },
            ne: { lat: Math.max(userLocation.lat, lat), lng: Math.max(userLocation.lng, lng) } },
          80
        );
      } else {
        throw new Error('No route');
      }
    } catch {
      const dist = selectedPerformer.distanceMiles;
      setDirectionsText(dist != null ? dist + ' mi away' : 'Nearby');
    }
  }, [selectedPerformer, userLocation]);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filteredPerformers = performers.filter(
    (p) => selectedGenre === 'All' || p.genres.some((g) => g.toLowerCase().includes(selectedGenre.toLowerCase()))
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl mx-auto pb-24 md:pb-12">

      {/* Live banner */}
      {detectionState === 'detected' && liveCount > 0 && !notifBannerDismissed && (
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#00F076]/20 to-[#7C3AED]/15 border border-[#00F076]/40 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F076] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00F076]" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">🎵 {liveCount} musician{liveCount !== 1 ? 's' : ''} performing near you right now</p>
              <p className="text-xs text-[#A1A1AA]">Tap a pin and tip them instantly</p>
            </div>
          </div>
          <button type="button" onClick={() => setNotifBannerDismissed(true)} className="text-[#64748B] hover:text-white text-lg">×</button>
        </div>
      )}

      {/* Empty state */}
      {detectionState === 'detected' && liveCount === 0 && !liveLoading && (
        <div className="flex items-center gap-3 bg-[#151722] border border-[#2B2D44] rounded-2xl px-4 py-3">
          <span className="text-2xl flex-shrink-0">🎵</span>
          <div>
            <p className="text-sm font-semibold text-white">No artists live near you right now</p>
            <p className="text-xs text-[#64748B] mt-0.5">Updates in real time — the moment a musician checks in within 5 miles they appear here.</p>
          </div>
        </div>
      )}

      {/* Location error */}
      {detectionState === 'error' && detectionError && (
        <div className="flex items-center gap-3 bg-red-950/40 border border-red-700/40 rounded-2xl px-4 py-3">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-sm text-red-300">{detectionError}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3 bg-[#151722] p-3.5 rounded-2xl border border-[#2B2D44]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Venue search */}
          <div className="relative flex-1">
            <div className="flex items-center bg-[#1E2032] rounded-full px-3.5 py-2 border border-[#2B2D44] focus-within:border-[#7C3AED] transition-colors">
              <svg className="w-4 h-4 text-[#64748B] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="text" placeholder="Search venue: The Casbah, Blue Note, Bluebird Café…"
                value={venueQuery}
                onChange={(e) => { handleVenueQuery(e.target.value); setShowVenueSuggestions(true); }}
                onFocus={() => venueQuery.length >= 2 && setShowVenueSuggestions(true)}
                onBlur={() => setTimeout(() => setShowVenueSuggestions(false), 200)}
                className="w-full bg-transparent text-xs text-white placeholder-[#64748B] focus:outline-none"
              />
              {venueQuery && <button type="button" onClick={() => { setVenueQuery(''); setVenueSuggestions([]); }} className="text-[#64748B] hover:text-white ml-1">×</button>}
            </div>
            {showVenueSuggestions && venueSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E2032] border border-[#2B2D44] rounded-2xl overflow-hidden shadow-2xl z-30">
                {venueSuggestions.map((s) => (
                  <button key={s.placeId} type="button"
                    onMouseDown={() => { setVenueQuery(s.mainText); setShowVenueSuggestions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#2B2D44] transition text-left">
                    <span className="text-base">🎵</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{s.mainText}</p>
                      {s.secondaryText && <p className="text-[11px] text-[#64748B] truncate">{s.secondaryText}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GPS button */}
          <button type="button" onClick={handleDetectLocation} disabled={detectionState === 'detecting'}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
              detectionState === 'detected' ? 'bg-[#00F076]/20 text-[#00F076] border border-[#00F076]/40'
              : detectionState === 'detecting' ? 'bg-[#7C3AED]/30 text-[#A855F7] border border-[#7C3AED]/40 animate-pulse'
              : 'bg-[#7C3AED] text-white hover:bg-[#6D28D9] border border-transparent'
            }`}>
            {detectionState === 'detecting' ? <>Detecting…</> : detectionState === 'detected' ? <>✅ Location Active</> : <>📍 Find Artists Near Me</>}
          </button>

          {/* View switcher */}
          <div className="flex items-center gap-1 bg-[#1E2032] p-1 rounded-full border border-[#2B2D44] self-end sm:self-auto">
            {(['map', 'radar', 'list'] as ViewMode[]).map((mode) => (
              <button key={mode} type="button" onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === mode ? 'bg-[#7C3AED] text-white shadow' : 'text-[#94A3B8] hover:text-white'}`}>
                {mode === 'map' ? '🗺️ Map' : mode === 'radar' ? '📡 Radar' : '📋 List'}
              </button>
            ))}
          </div>
        </div>

        {filteredPerformers.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {GENRES.map((g) => (
              <button key={g} type="button" onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${selectedGenre === g ? 'bg-[#7C3AED] text-white border-[#A855F7]' : 'bg-[#151722] text-[#94A3B8] border-[#2B2D44] hover:border-[#7C3AED]'}`}>
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Idle CTA */}
      {detectionState === 'idle' && (
        <div className="flex flex-col items-center gap-5 py-14 px-4 bg-[#0D1117] rounded-3xl border border-dashed border-[#2B2D44] text-center">
          <div className="w-20 h-20 rounded-full bg-[#7C3AED]/10 border-2 border-[#7C3AED]/30 flex items-center justify-center text-4xl">🗺️</div>
          <div>
            <h3 className="text-lg font-black text-white">Find Live Musicians Near You</h3>
            <p className="text-sm text-[#94A3B8] mt-2 max-w-sm mx-auto leading-relaxed">
              Musicians check in when they&apos;re performing. See them on the <strong className="text-white">Crowdbeats Live Map</strong> and tip in one tap.
            </p>
          </div>
          <button type="button" onClick={handleDetectLocation}
            className="flex items-center gap-2 bg-gradient-to-r from-[#00F076] to-[#7C3AED] text-white font-black px-8 py-3 rounded-full text-sm hover:opacity-90 transition shadow-[0_0_32px_rgba(0,240,118,0.2)]">
            📍 Open Live Map
          </button>
        </div>
      )}

      {/* Detecting spinner */}
      {detectionState === 'detecting' && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <svg className="w-8 h-8 animate-spin text-[#7C3AED]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-sm text-[#94A3B8]">Detecting your location and loading map…</p>
        </div>
      )}

      {/* ── MapLibre Map (Phase 7) ─────────────────────────────────────────── */}
      {viewMode === 'map' && (
        <div className={`relative w-full h-[520px] rounded-3xl overflow-hidden border border-[#2B2D44] shadow-2xl ${detectionState !== 'detected' ? 'hidden' : ''}`}>
          <CrowdbeatsMapLibre
            ref={mapRef}
            center={userLocation ?? { lat: 34.0522, lng: -118.2437 }}
            zoom={detectionState === 'detected' ? 14 : 10}
            theme={theme}
            className="w-full h-full"
            onLoad={handleMapLoad}
            onMarkerClick={handleMarkerClick}
          />

          {/* Live indicator overlay */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-[#00F076]/40 px-3 py-1.5 rounded-full pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-[#00F076] animate-pulse flex-shrink-0" />
            <span className="text-[10px] font-bold text-[#00F076]">
              {visibleCount > 0 ? `LIVE — ${visibleCount} in view` : liveCount > 0 ? `LIVE — ${liveCount} nearby` : 'LIVE MAP'}
            </span>
          </div>

          {/* Selected performer bottom sheet (Phase 11) */}
          {selectedPerformer && (
            <CrowdbeatsMapBottomSheet
              performer={selectedPerformer}
              onClose={handleCloseBottomSheet}
              directionsText={activeRoute ? `${activeRoute.durationText} • ${activeRoute.distanceMilesText}` : null}
              isDirectionsLoading={routeLoading}
              routeMode={routeMode}
              onSelectRouteMode={setRouteMode}
              onGetDirections={() => {
                if (selectedPerformer) {
                  requestRoute({ lat: selectedPerformer.latitude, lng: selectedPerformer.longitude });
                }
              }}
              onOpenExternalNav={openExternalNavigation}
              routeError={routeError}
            />
          )}
        </div>
      )}

      {/* Radar View */}
      {viewMode === 'radar' && filteredPerformers.length > 0 && (
        <div className="relative w-full h-[520px] bg-[#07080B] rounded-3xl overflow-hidden border border-[#2B2D44] shadow-2xl">
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#1E2032_1px,transparent_1px),linear-gradient(to_bottom,#1E2032_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-[#00F076]/20 border border-[#00F076]/40 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#00F076] animate-pulse flex-shrink-0" />
            <span className="text-[10px] font-bold text-[#00F076]">RADAR VIEW</span>
          </div>
          {userLocation && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 animate-ping absolute" />
              <div className="w-4 h-4 rounded-full bg-[#3B82F6] border-2 border-white shadow-[0_0_12px_#3B82F6]" />
              <div className="absolute -bottom-5 text-[9px] text-[#3B82F6] font-semibold whitespace-nowrap">You</div>
            </div>
          )}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[480px] h-[480px] rounded-full border border-[#7C3AED]/30 animate-spin [animation-duration:8s] bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(124,58,237,0.3)_360deg)]" />
            <div className="absolute w-[320px] h-[320px] rounded-full border border-[#7C3AED]/15" />
            <div className="absolute w-[160px] h-[160px] rounded-full border border-[#7C3AED]/20" />
          </div>
          {filteredPerformers.map((perf, idx) => {
            const xPct = 15 + ((idx * 37) % 72);
            const yPct = 20 + ((idx * 23) % 60);
            const isSelected = selectedPerformer?.uid === perf.uid;
            return (
              <button key={perf.uid} type="button" onClick={() => { setSelectedPerformer(perf); setDirectionsText(null); }}
                style={{ top: yPct + '%', left: xPct + '%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-10">
                <div className="relative">
                  <span className="absolute -inset-1.5 rounded-full bg-[#00F076] opacity-60 animate-ping" />
                  <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-transform duration-200 group-hover:scale-110 border-[#00F076] ${isSelected ? 'ring-4 ring-[#00F076]/40 scale-110' : ''}`}>
                    {perf.photoUrl ? <img src={perf.photoUrl} alt={perf.performerName} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full bg-[#1E2032] flex items-center justify-center text-xl">🎵</div>}
                  </div>
                  <span className="absolute -top-1 -right-1 bg-[#00F076] text-black text-[7px] font-black px-1 rounded shadow">LIVE</span>
                </div>
                <div className="mt-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] text-white font-semibold whitespace-nowrap shadow max-w-[80px] truncate">{perf.performerName}</div>
                {perf.distanceMiles != null && <div className="text-[8px] text-[#00F076] mt-0.5">{perf.distanceMiles} mi</div>}
              </button>
            );
          })}
          {selectedPerformer && (
            <div className="absolute bottom-4 left-4 right-4 bg-[#151722]/95 backdrop-blur-xl p-4 rounded-2xl border border-[#00F076]/20 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#00F076] flex-shrink-0">
                  {selectedPerformer.photoUrl ? <img src={selectedPerformer.photoUrl} alt={selectedPerformer.performerName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#1E2032] flex items-center justify-center text-2xl">🎵</div>}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">{selectedPerformer.performerName}</h3>
                    <CbLiveBadge label="LIVE NOW" />
                  </div>
                  <p className="text-xs text-[#00F076] font-medium truncate mt-0.5">{selectedPerformer.venueName}</p>
                  <p className="text-[11px] text-[#94A3B8]">{selectedPerformer.distanceMiles != null ? selectedPerformer.distanceMiles + ' mi away' : 'Nearby'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                <CbOutlineButton label="Directions" className="!py-2 !px-4 !text-xs" />
                <button
                  type="button"
                  onClick={() => handleTipClick(selectedPerformer)}
                >
                  <CbPillButton label="💚 Tip Now" isFullWidth={false} className="!py-2 !px-5 !text-xs whitespace-nowrap !bg-[#00F076] !text-black hover:!opacity-90" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Radar empty state */}
      {viewMode === 'radar' && filteredPerformers.length === 0 && detectionState === 'detected' && (
        <div className="relative w-full h-[320px] bg-[#07080B] rounded-3xl overflow-hidden border border-[#2B2D44] flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#1E2032_1px,transparent_1px),linear-gradient(to_bottom,#1E2032_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[320px] h-[320px] rounded-full border border-[#7C3AED]/20 animate-spin [animation-duration:8s] bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(124,58,237,0.15)_360deg)]" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-2 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/30 flex items-center justify-center text-2xl">📡</div>
            <p className="text-sm font-bold text-white">Scanning for artists…</p>
            <p className="text-xs text-[#64748B]">The radar updates in real time as musicians check in nearby</p>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && filteredPerformers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPerformers.map((perf) => (
            <div key={perf.uid} className="bg-[#151722] rounded-2xl overflow-hidden border border-[#00F076]/20 flex flex-col">
              <div className="relative h-40 bg-[#1E2032] flex items-center justify-center">
                {perf.photoUrl ? <img src={perf.photoUrl} alt={perf.performerName} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-5xl">🎵</div>}
                <div className="absolute inset-0 bg-gradient-to-t from-[#151722] via-black/30 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <CbLiveBadge />
                  <span className="bg-black/60 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded-full capitalize font-medium">{perf.type}</span>
                </div>
                {perf.distanceMiles != null && <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-[11px] text-[#00F076] font-bold">📍 {perf.distanceMiles} mi</div>}
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{perf.performerName}</h3>
                  <p className="text-xs text-[#00F076] font-medium mt-0.5">{perf.venueName}</p>
                  {perf.genres.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {perf.genres.slice(0, 3).map((g) => (<span key={g} className="text-[10px] bg-[#1E2032] border border-[#2B2D44] text-[#94A3B8] px-2 py-0.5 rounded-full">{g}</span>))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <CbOutlineButton label="View Profile" isFullWidth className="!py-2 !text-xs" />
                  <button
                    type="button"
                    onClick={() => handleTipClick(perf)}
                    className="flex-1"
                  >
                    <CbPillButton label="💚 Tip Now" isFullWidth className="!py-2 !text-xs !bg-[#00F076] !text-black hover:!opacity-90" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Popular Venues */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">🎪 Popular Music Venues</h4>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {POPULAR_CHECKIN_VENUES.slice(0, 10).map((v) => (
            <button key={v.placeId} type="button"
              onClick={() => { setVenueQuery(v.name); setShowVenueSuggestions(false); }}
              className="flex-shrink-0 flex flex-col items-center gap-1 bg-[#151722] border border-[#2B2D44] hover:border-[#7C3AED] rounded-xl px-3 py-2.5 transition min-w-[100px] text-center">
              <span className="text-xl">{v.emoji}</span>
              <span className="text-[10px] font-semibold text-white leading-tight">{v.name}</span>
              <span className="text-[9px] text-[#64748B]">{v.city}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Push notification CTA */}
      {detectionState === 'detected' && (
        <div className="flex items-center justify-between gap-3 bg-[#151722] border border-[#2B2D44] rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="text-xs font-bold text-white">Get notified when artists go live near you</p>
              <p className="text-[11px] text-[#64748B]">Never miss a musician performing nearby</p>
            </div>
          </div>
          <button type="button"
            onClick={() => { if ('Notification' in window) { Notification.requestPermission().then((p) => { if (p === 'granted') alert('You will be notified when artists go live near you!'); }); } }}
            className="bg-[#7C3AED] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#6D28D9] transition flex-shrink-0">
            Enable
          </button>
        </div>
      )}

      {/* Tip Auth Gate Modal for Unauthenticated Guests */}
      <TipAuthGateModal
        isOpen={tipModalState.isOpen}
        onClose={() => setTipModalState((prev) => ({ ...prev, isOpen: false }))}
        performerId={tipModalState.performerId}
        performerSlug={tipModalState.performerSlug}
        performerName={tipModalState.performerName}
        performerType={tipModalState.performerType}
      />
    </div>
  );
}
