'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useMapTheme } from '@/hooks/useMapTheme';
import { useLivePerformers } from '@/hooks/useLivePerformers';
import { useNearbyDiscovery } from '@/hooks/useNearbyDiscovery';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useRouteDirections } from '@/hooks/useRouteDirections';
import type { LiveCheckin } from '@/lib/firebase/firestore';
import { useLiveMapSync } from '@/hooks/useLiveMapSync';
import { CrowdbeatsMapLibre, type CrowdbeatsMapLibreRef } from '@/components/maps/CrowdbeatsMapLibre';
import { CrowdbeatsMapBottomSheet } from '@/components/maps/CrowdbeatsMapBottomSheet';
import type { MapTheme, CrowdbeatsSearchResult } from '@/lib/maps/types';
import type { RouteMode } from '@/lib/maps/routing';

// Test locations
const LOCATIONS = [
  { name: 'San Diego, CA', lat: 32.7157, lng: -117.1611, zoom: 13 },
  { name: 'New York, NY', lat: 40.7128, lng: -74.0060, zoom: 13 },
  { name: 'Nashville, TN', lat: 36.1627, lng: -86.7816, zoom: 14 },
  { name: 'New Orleans, LA', lat: 29.9511, lng: -90.0715, zoom: 15 },
  { name: 'Austin, TX', lat: 30.2672, lng: -97.7431, zoom: 14 },
] as const;

const MOBILE_VIEWPORTS = [
  { name: 'iPhone 15', width: 393, height: 852 },
  { name: 'Galaxy S24', width: 384, height: 832 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Full width', width: 0, height: 0 }, // 0 = full
] as const;

const label = (text: string, color = '#9ca3af') => ({
  color, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
});

const btn = (active = false, color = '#00F076') => ({
  background: active ? color : 'rgba(255,255,255,0.05)',
  color: active ? '#000' : '#e5e7eb',
  border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600,
  cursor: 'pointer' as const, fontFamily: 'system-ui, sans-serif',
  whiteSpace: 'nowrap' as const, transition: 'all 0.15s',
});

export function MapTestPanel() {
  const mapRef = useRef<CrowdbeatsMapLibreRef>(null);
  const { theme, setTheme: setThemeState, isSystem } = useMapTheme();
  const [mapKey, setMapKey] = useState(0);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13);
  const [center, setCenter] = useState('San Diego, CA');
  const [markerCount, setMarkerCount] = useState(0);
  const [viewport, setViewport] = useState<(typeof MOBILE_VIEWPORTS)[number]>(MOBILE_VIEWPORTS[3]);
  const [testLog, setTestLog] = useState<string[]>([]);

  const log = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setTestLog((prev) => [`[${ts}] ${msg}`, ...prev].slice(0, 35));
  }, []);

  // Phase 11 — Routing & Directions
  const {
    route: testRoute,
    isLoading: testRouteLoading,
    error: testRouteError,
    mode: testRouteMode,
    setMode: setTestRouteMode,
    requestRoute: requestTestRoute,
    clearRoute: clearTestRoute,
    openExternalNavigation: openTestExternalNav,
    externalUrls: testExternalUrls,
  } = useRouteDirections({
    onRouteCalculated: (r) => {
      log(`🚶 Route calculated: ${r.distanceMilesText} (${r.durationText}, mode: ${r.mode})`);
      mapRef.current?.showRoute(r);
    },
  });

  const handleTestNearbyRoute = useCallback(async () => {
    log('🚶 Computing walking route to The Casbah (0.7 mi)…');
    const origin = { lat: 32.7157, lng: -117.1611 };
    const dest = { lat: 32.7248, lng: -117.1691 };
    await requestTestRoute(dest, origin, 'walking');
    setTestSheetPerformer({
      uid: 'casbah_act',
      performerName: 'The Casbah Live Trio',
      photoUrl: '',
      type: 'band',
      genres: ['Indie Rock'],
      venueName: 'The Casbah',
      latitude: dest.lat,
      longitude: dest.lng,
      isLive: true,
      checkedInAt: new Date().toISOString(),
      distanceMiles: 0.7,
    });
  }, [log, requestTestRoute]);

  const handleTestFarRoute = useCallback(async () => {
    log('🚗 Computing driving route to Belly Up Tavern (19.8 mi)…');
    const origin = { lat: 32.7157, lng: -117.1611 };
    const dest = { lat: 32.9922, lng: -117.2713 };
    await requestTestRoute(dest, origin, 'driving');
    setTestSheetPerformer({
      uid: 'belly_up_act',
      performerName: 'Solana Sunset Band',
      photoUrl: '',
      type: 'band',
      genres: ['Reggae', 'Funk'],
      venueName: 'Belly Up Tavern',
      latitude: dest.lat,
      longitude: dest.lng,
      isLive: true,
      checkedInAt: new Date().toISOString(),
      distanceMiles: 19.8,
    });
  }, [log, requestTestRoute]);

  const handleClearRoute = useCallback(() => {
    clearTestRoute();
    mapRef.current?.clearRoute();
    log('🧹 Cleared route line from map');
  }, [clearTestRoute, log]);

  // Phase 10 — Location Search & Autocomplete
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    isLoading: searchLoading,
    error: searchError,
    clearResults: clearSearchResults,
    isCached: searchCached,
  } = useLocationSearch({ debounceMs: 300, minChars: 3 });

  const handleSelectSearchResult = useCallback((result: CrowdbeatsSearchResult) => {
    log(`📍 Selected ${result.displayName} (${result.source})`);
    setCenter(result.displayName);
    if (result.bounds) {
      log(`📐 Fitting bounding box for ${result.city || result.displayName}…`);
      mapRef.current?.fitBounds(result.bounds, 40);
    } else {
      log(`✈️ Flying to ${result.displayName}…`);
      mapRef.current?.flyTo(result.coordinate, { zoom: 13 });
    }
  }, [log]);

  // Phase 9 — Uber/Lyft-Class Camera & Animations
  const [reducedMotion, setReducedMotion] = useState(false);
  const [testSheetPerformer, setTestSheetPerformer] = useState<LiveCheckin | null>(null);

  const testFlyToNashville = useCallback(() => {
    log('✈️ Flying to Nashville (Uber/Lyft flight arc)…');
    mapRef.current?.flyTo({ lat: 36.1627, lng: -86.7816 }, {
      zoom: 14,
      duration: 1200,
      reducedMotion,
    });
  }, [log, reducedMotion]);

  const testEaseToGaslamp = useCallback(() => {
    log('🚗 Easing to Gaslamp Quarter (smooth micro-pan)…');
    mapRef.current?.easeTo({ lat: 32.7114, lng: -117.1599 }, {
      zoom: 15,
      duration: 600,
      reducedMotion,
    });
  }, [log, reducedMotion]);

  const testCenterWithOffset = useCallback(() => {
    log('🎯 Centering on marker with +110px bottom-sheet offset compensation…');
    const target = { lat: 32.7157, lng: -117.1611 };
    mapRef.current?.centerOnMarker(target, {
      zoom: 16,
      offset: [0, -110],
      duration: 650,
      reducedMotion,
    });
    setTestSheetPerformer({
      uid: 'test_act_1',
      performerName: 'The Electric Waves',
      photoUrl: '',
      type: 'band',
      genres: ['Indie Rock', 'Synthpop'],
      venueName: 'The Casbah',
      latitude: target.lat,
      longitude: target.lng,
      isLive: true,
      checkedInAt: new Date().toISOString(),
      distanceMiles: 0.3,
    });
  }, [log, reducedMotion]);

  // Phase 8 — Smart Clustering
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [mockPerformers, setMockPerformers] = useState<LiveCheckin[]>([]);

  const handleAddMockClusterActs = useCallback((count: number) => {
    const c = mapRef.current?.getCenter() ?? { lat: 32.7157, lng: -117.1611 };
    const newActs: LiveCheckin[] = [];
    const genres = ['Indie Rock', 'Jazz', 'Acoustic', 'Hip-Hop', 'Electronic', 'R&B'];

    for (let i = 0; i < count; i++) {
      const dLat = (Math.random() - 0.5 + Math.random() - 0.5) * 0.08;
      const dLng = (Math.random() - 0.5 + Math.random() - 0.5) * 0.08;
      const isLiveAct = Math.random() > 0.35;

      newActs.push({
        uid: `mock_${Date.now()}_${i}`,
        performerName: `Performer ${i + 1}`,
        photoUrl: '',
        type: i % 3 === 0 ? 'band' : 'artist',
        genres: [genres[i % genres.length]],
        venueName: `Venue ${(i % 12) + 1}`,
        latitude: c.lat + dLat,
        longitude: c.lng + dLng,
        isLive: isLiveAct,
        checkedInAt: new Date().toISOString(),
      });
    }

    setMockPerformers((prev) => [...prev, ...newActs]);
    log(`⚡ Generated ${count} mock acts for clustering test`);
  }, [log]);

  const handleClearMockActs = useCallback(() => {
    setMockPerformers([]);
    log('🧹 Cleared all mock clustering acts');
  }, [log]);

  const [firebaseSyncEnabled, setFirebaseSyncEnabled] = useState(false);
  const [mapProvider, setMapProvider] = useState<any | null>(null);

  const { performers, liveCount, isLoading: liveLoading } = useLivePerformers({
    enabled: firebaseSyncEnabled,
  });

  const allPerformers = firebaseSyncEnabled ? [...performers, ...mockPerformers] : mockPerformers;

  const {
    visiblePerformers,
    clusters,
    unclustered,
    handleViewportChange,
    visibleCount,
  } = useNearbyDiscovery({
    provider: mapProvider,
    performers: allPerformers,
    clusteringEnabled,
    onPerformerSelect: (perf) => {
      log(`🎤 Selected act: ${perf.performerName} at ${perf.venueName}`);
    },
  });

  const handleLoad = useCallback((ms: number) => {
    setLoadTime(ms);
    setError(null);
    log(`✅ Map loaded in ${ms}ms`);
    if (mapRef.current?.provider) {
      setMapProvider(mapRef.current.provider);
    }
  }, [log]);

  const handleError = useCallback((err: Error) => {
    setError(err.message);
    log(`❌ Error: ${err.message}`);
  }, [log]);

  const handleMove = useCallback((c: { lat: number; lng: number }, z: number) => {
    setZoom(Math.round(z * 10) / 10);
  }, []);

  const flyTo = useCallback((loc: typeof LOCATIONS[number]) => {
    mapRef.current?.flyTo({ lat: loc.lat, lng: loc.lng }, loc.zoom);
    setCenter(loc.name);
    log(`🗺 Flew to ${loc.name}`);
  }, [log]);

  const zoomIn = useCallback(() => {
    mapRef.current?.provider?.setZoom((mapRef.current?.getZoom() ?? 14) + 1);
    log('🔍 Zoomed in');
  }, [log]);

  const zoomOut = useCallback(() => {
    mapRef.current?.provider?.setZoom((mapRef.current?.getZoom() ?? 14) - 1);
    log('🔎 Zoomed out');
  }, [log]);

  const addTestMarker = useCallback(() => {
    const c = mapRef.current?.getCenter() ?? { lat: 32.7157, lng: -117.1611 };
    const offset = () => (Math.random() - 0.5) * 0.01;
    const id = mapRef.current?.addMarker({
      id: `test_live_${Date.now()}`,
      type: 'live',
      position: { lat: c.lat + offset(), lng: c.lng + offset() },
      label: 'Test Performer',
      performerId: 'test',
      performerType: 'artist',
      performerName: 'Test Performer',
      venueName: 'Test Venue',
      checkedInAt: new Date().toISOString(),
    } as any) ?? '';
    if (id) {
      setMarkerCount((n) => n + 1);
      log(`📍 Added live marker (${id.slice(-6)})`);
    }
  }, [log]);

  const addUserMarker = useCallback(() => {
    const c = mapRef.current?.getCenter() ?? { lat: 32.7157, lng: -117.1611 };
    mapRef.current?.addMarker({
      id: 'user_self',
      type: 'user',
      position: c,
      label: 'You (test)',
    });
    log('🔵 Added user marker');
  }, [log]);

  const clearMarkers = useCallback(() => {
    mapRef.current?.clearAllMarkers();
    setMarkerCount(0);
    log('🗑 Cleared all markers');
  }, [log]);

  const remount = useCallback(() => {
    setMapKey((k) => k + 1);
    setLoadTime(null);
    setError(null);
    setMarkerCount(0);
    log('🔄 Remounting map (tests cleanup)');
  }, [log]);

  const [themeSwitching, setThemeSwitching] = useState(false);

  const toggleTheme = useCallback(async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    if (mapRef.current?.setTheme && !themeSwitching) {
      setThemeSwitching(true);
      try {
        await mapRef.current.setTheme(nextTheme);
        setThemeState(nextTheme);
        setMarkerCount(0);
        log(`🎨 Smooth theme → ${nextTheme}`);
      } catch (e) {
        setThemeState(nextTheme);
        remount();
        log(`⚠️ Theme fallback remount → ${nextTheme}`);
      } finally {
        setThemeSwitching(false);
      }
    } else {
      setThemeState(nextTheme);
      remount();
    }
  }, [theme, themeSwitching, setThemeState, remount, log]);

  const containerStyle = viewport.width > 0 ? {
    width: viewport.width,
    height: viewport.height,
    maxWidth: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
    flexShrink: 0,
    position: 'relative' as const,
  } : {
    width: '100%',
    height: 480,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative' as const,
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0b0c10',
      color: '#e5e7eb', fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px 20px',
    }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(90deg, #00F076 0%, #fff 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CROWDbeats
          </span>
          <span style={{ color: '#4b5563', fontSize: 14 }}>Map Engine Test — Phase 11 Routing & Walking Directions</span>
          <span style={{ marginLeft: 'auto', background: 'rgba(0,240,118,0.1)', color: '#00F076', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid rgba(0,240,118,0.3)' }}>
            MapLibre GL 6.x
          </span>
        </div>
        <p style={{ color: '#4b5563', fontSize: 13, margin: 0 }}>
          DEV ONLY — Multi-engine routing, walking directions, and navigation handoff test suite
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 20, alignItems: 'start' }}>

        {/* Map area */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', background: '#111318', borderRadius: 16, padding: 20, minHeight: 520 }}>
            <div style={containerStyle}>
              <CrowdbeatsMapLibre
                key={mapKey}
                ref={mapRef}
                theme={theme}
                center={LOCATIONS[0]}
                zoom={13}
                onLoad={handleLoad}
                onError={handleError}
                onMove={(c, z, b) => {
                  handleMove(c, z);
                  handleViewportChange(c, z, b);
                }}
                style={{ width: '100%', height: '100%' }}
              />

              {/* Bottom sheet test render with Phase 11 routing */}
              {testSheetPerformer && (
                <CrowdbeatsMapBottomSheet
                  performer={testSheetPerformer}
                  onClose={() => {
                    setTestSheetPerformer(null);
                    handleClearRoute();
                  }}
                  directionsText={testRoute ? `${testRoute.durationText} • ${testRoute.distanceMilesText}` : null}
                  isDirectionsLoading={testRouteLoading}
                  routeMode={testRouteMode}
                  onSelectRouteMode={setTestRouteMode}
                  onGetDirections={() => {
                    if (testSheetPerformer) {
                      requestTestRoute({ lat: testSheetPerformer.latitude, lng: testSheetPerformer.longitude });
                    }
                  }}
                  onOpenExternalNav={openTestExternalNav}
                  routeError={testRouteError}
                />
              )}
            </div>
          </div>

          {/* Status bar */}
          <div style={{
            marginTop: 12, padding: '10px 16px',
            background: '#111318', borderRadius: 10,
            display: 'flex', gap: 20, flexWrap: 'wrap' as const, alignItems: 'center',
          }}>
            <span style={{ ...label('Load'), color: '#4b5563' }}>Status:</span>
            <span style={{ color: error ? '#ef4444' : loadTime ? '#00F076' : '#facc15', fontWeight: 700, fontSize: 12 }}>
              {error ? '❌ Error' : loadTime ? `✅ Ready (${loadTime}ms)` : '⏳ Loading'}
            </span>
            <span style={{ color: '#4b5563', fontSize: 12 }}>Zoom: <strong style={{ color: '#e5e7eb' }}>{zoom}</strong></span>
            <span style={{ color: '#4b5563', fontSize: 12 }}>Center: <strong style={{ color: '#e5e7eb' }}>{center}</strong></span>
            <span style={{ color: '#4b5563', fontSize: 12 }}>Markers: <strong style={{ color: '#e5e7eb' }}>{markerCount}</strong></span>
            <span style={{ color: '#4b5563', fontSize: 12 }}>Route: <strong style={{ color: testRoute ? '#00F076' : '#9ca3af' }}>{testRoute ? `${testRoute.distanceMilesText} (${testRoute.mode})` : 'None'}</strong></span>
          </div>

          {/* Viewport selector */}
          <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' as const, alignItems: 'center' }}>
            <span style={label('Viewport:')}>Viewport:</span>
            {MOBILE_VIEWPORTS.map((vp) => (
              <button key={vp.name} style={btn(viewport.name === vp.name)} onClick={() => { setViewport(vp); log(`📱 Viewport: ${vp.name}`); }}>
                {vp.name}
              </button>
            ))}
          </div>
        </div>

        {/* Control panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Phase 11 — Routing & Walking Directions */}
          <section style={{ background: '#111318', borderRadius: 12, padding: 16, border: '1px solid rgba(0,240,118,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ ...label('Routing'), color: '#00F076' }}>🚶 Routing & Directions (Phase 11)</div>
              {testRouteLoading && (
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, background: 'rgba(0,240,118,0.15)', color: '#00F076', fontWeight: 700 }}>
                  CALCULATING…
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Presets */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  style={{ ...btn(), flex: 1, fontSize: 11 }}
                  onClick={handleTestNearbyRoute}
                >
                  🚶 Nearby (0.7 mi)
                </button>
                <button
                  style={{ ...btn(), flex: 1, fontSize: 11 }}
                  onClick={handleTestFarRoute}
                >
                  🚗 Far (19.8 mi)
                </button>
              </div>

              {/* Mode Toggle */}
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 8 }}>
                {(['walking', 'driving', 'cycling'] as RouteMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTestRouteMode(m)}
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      fontSize: 10,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: testRouteMode === m ? '#00F076' : 'transparent',
                      color: testRouteMode === m ? '#000' : '#9ca3af',
                      textTransform: 'capitalize',
                    }}
                  >
                    {m === 'walking' ? '🚶 Walk' : m === 'driving' ? '🚗 Drive' : '🚲 Bike'}
                  </button>
                ))}
              </div>

              {/* Telemetry info */}
              {testRoute && (
                <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5, background: 'rgba(0,240,118,0.05)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(0,240,118,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 700, marginBottom: 2 }}>
                    <span>Active Route:</span>
                    <span style={{ color: '#00F076' }}>{testRoute.distanceMilesText} • {testRoute.durationText}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span>Waypoints:</span>
                    <span>{testRoute.coordinates.length} points</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span>Travel Mode:</span>
                    <span style={{ textTransform: 'capitalize' }}>{testRoute.mode}</span>
                  </div>
                </div>
              )}

              {/* External app handoffs */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  style={{ ...btn(), flex: 1, fontSize: 10, padding: '5px 8px' }}
                  onClick={openTestExternalNav}
                  disabled={!testRoute}
                >
                  ↗ Open Device Maps
                </button>
                {testRoute && (
                  <button
                    style={{ ...btn(false, '#ef4444'), fontSize: 10, padding: '5px 8px' }}
                    onClick={handleClearRoute}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Phase 10 — Location Search & Autocomplete Test */}
          <section style={{ background: '#111318', borderRadius: 12, padding: 16, border: '1px solid rgba(0,240,118,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ ...label('Search'), color: '#00F076' }}>🔍 Location Search (Phase 10)</div>
              {searchCached && (
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, background: 'rgba(0,240,118,0.15)', color: '#00F076', fontWeight: 700 }}>
                  CACHED (0ms)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type city, state, country (≥3 chars)..."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 12,
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {searchResults.length > 0 && (
                <div style={{
                  maxHeight: 140,
                  overflowY: 'auto',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {searchResults.map((item) => (
                    <div
                      key={item.placeId}
                      onClick={() => handleSelectSearchResult(item)}
                      style={{
                        padding: '6px 8px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                      }}
                    >
                      <span>{item.city || item.displayName}</span>
                      <span style={{ fontSize: 9, color: '#00F076' }}>{item.source}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Phase 9 — Uber/Lyft Camera & Animations */}
          <section style={{ background: '#111318', borderRadius: 12, padding: 16, border: '1px solid rgba(0,240,118,0.2)' }}>
            <div style={{ ...label('Motion'), marginBottom: 10 }}>🎬 Camera & Motion (Phase 9)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                style={btn(reducedMotion, '#eab308')}
                onClick={() => {
                  const next = !reducedMotion;
                  setReducedMotion(next);
                  log(next ? '⚡ Reduced Motion: ON (instant jumps)' : '🎬 Reduced Motion: OFF (smooth flights)');
                }}
              >
                {reducedMotion ? '⚡ Reduced Motion: ON' : '🎬 Smooth Motion: ON'}
              </button>

              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ ...btn(), flex: 1, fontSize: 11 }} onClick={testFlyToNashville}>
                  ✈️ FlyTo Nashville
                </button>
                <button style={{ ...btn(), flex: 1, fontSize: 11 }} onClick={testEaseToGaslamp}>
                  🚗 EaseTo Gaslamp
                </button>
              </div>

              <button
                style={{ ...btn(), fontSize: 11, background: 'rgba(0,240,118,0.1)', borderColor: 'rgba(0,240,118,0.4)', color: '#00F076' }}
                onClick={testCenterWithOffset}
              >
                🎯 Center + Bottom Sheet Offset
              </button>
            </div>
          </section>

          {/* Phase 8 — Smart Clustering Test */}
          <section style={{ background: '#111318', borderRadius: 12, padding: 16, border: '1px solid rgba(0,240,118,0.2)' }}>
            <div style={{ ...label('Clustering'), marginBottom: 10 }}>⚡ Smart Clustering (Phase 8)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  style={{ ...btn(clusteringEnabled, '#00F076'), flex: 1 }}
                  onClick={() => {
                    const next = !clusteringEnabled;
                    setClusteringEnabled(next);
                    log(next ? '⚡ Clustering: ON' : '⚡ Clustering: OFF');
                  }}
                >
                  {clusteringEnabled ? '⚡ Clusters: ON' : '⚡ Clusters: OFF'}
                </button>
                {mockPerformers.length > 0 && (
                  <button
                    style={{ ...btn(false, '#ef4444') }}
                    onClick={handleClearMockActs}
                  >
                    Clear ({mockPerformers.length})
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  style={{ ...btn(), flex: 1, fontSize: 11, padding: '6px 8px' }}
                  onClick={() => handleAddMockClusterActs(50)}
                >
                  +50 Acts
                </button>
                <button
                  style={{ ...btn(), flex: 1, fontSize: 11, padding: '6px 8px' }}
                  onClick={() => handleAddMockClusterActs(200)}
                >
                  +200 Acts
                </button>
              </div>
            </div>
          </section>

          {/* Camera controls */}
          <section style={{ background: '#111318', borderRadius: 12, padding: 16 }}>
            <div style={{ ...label('Camera'), marginBottom: 10 }}>📹 Camera Presets</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ ...btn(), flex: 1 }} onClick={zoomIn}>Zoom In +</button>
                <button style={{ ...btn(), flex: 1 }} onClick={zoomOut}>Zoom Out −</button>
              </div>
              {LOCATIONS.map((loc) => (
                <button key={loc.name} style={btn(center === loc.name)} onClick={() => flyTo(loc)}>
                  {loc.name}
                </button>
              ))}
            </div>
          </section>

          {/* Render Controls */}
          <section style={{ background: '#111318', borderRadius: 12, padding: 16 }}>
            <div style={{ ...label('Render'), marginBottom: 10 }}>🎨 Render Controls</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button style={btn(false, themeSwitching ? '#4b5563' : '#00F076')} onClick={toggleTheme} disabled={themeSwitching}>
                {themeSwitching ? 'Transitioning…' : `Toggle Theme (${theme === 'dark' ? '→ Light' : '→ Dark'})`}
              </button>
              <button style={btn()} onClick={remount}>
                Remount (test cleanup)
              </button>
            </div>
          </section>

          {/* Test log */}
          <section style={{ background: '#111318', borderRadius: 12, padding: 16 }}>
            <div style={{ ...label('Log'), marginBottom: 10 }}>📋 Event Log</div>
            <div style={{
              maxHeight: 180, overflowY: 'auto' as const,
              fontFamily: 'monospace', fontSize: 11,
              display: 'flex', flexDirection: 'column', gap: 3,
            }}>
              {testLog.length === 0 && (
                <span style={{ color: '#4b5563' }}>No events yet…</span>
              )}
              {testLog.map((entry, i) => (
                <div key={i} style={{ color: '#9ca3af' }}>{entry}</div>
              ))}
            </div>
          </section>

          {/* Verification checklist */}
          <section style={{ background: '#111318', borderRadius: 12, padding: 16 }}>
            <div style={{ ...label('Migration Progress'), marginBottom: 10 }}>✅ Migration Progress</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#9ca3af' }}>
              {[
                { name: 'Phase 3: MapLibre GL 6.x rendering', done: !!loadTime },
                { name: 'Phase 7: Firebase Live Sync', done: firebaseSyncEnabled || liveCount > 0 },
                { name: 'Phase 8: Supercluster discovery', done: clusteringEnabled },
                { name: 'Phase 9: Uber/Lyft camera & bottom sheet', done: true },
                { name: 'Phase 10: Location search & geocoding', done: true },
                { name: 'Phase 11: Routing & walking directions', done: !!testRoute },
              ].map((item) => (
                <div key={item.name} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: item.done ? '#00F076' : '#4b5563' }}>
                    {item.done ? '✓' : '○'}
                  </span>
                  {item.name}
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: '#111318', borderRadius: 8, fontSize: 12, color: '#4b5563' }}>
        <strong style={{ color: '#6b7280' }}>Phase 11 Note:</strong> Multi-engine routing abstraction supports OSRM, Valhalla, GraphHopper, Maptiler, and Google fallback with automated straight-line geodesic resilience and native device navigation handoff.
      </div>
    </div>
  );
}
