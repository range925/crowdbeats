'use client';

/**
 * Crowdbeats V2 — Dedicated Public Discover Page Client View
 * Route: /discover
 *
 * Requirements:
 * - Primary destination for public live music discovery nearby and worldwide
 * - Map exploration (MapLibre / Google Maps) synchronized with performer result cards
 * - Global search input for cities, regions, and countries
 * - "Search this area" button after panning or zooming the map
 * - Visible explored area badge (e.g. "Exploring London, United Kingdom" or "Near you")
 * - "Return to my location" button when browser geolocation is permitted
 * - Does NOT snap back to device location while exploring another city
 * - Honest empty states: "No performers found in this area." Never substitute distant performers
 * - Each performer card has a direct link/button to `/tip/${performerId}` or `/artist/${slug}`
 * - Supports light and dark modes and responsive mobile/tablet/desktop layouts
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DiscoveryNav } from '@/components/discovery/DiscoveryNav';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useLivePerformers } from '@/hooks/useLivePerformers';
import { CURATED_LOCATIONS, MOCK_PERFORMERS } from '@/lib/discovery/discoveryClient';
import type { CrowdbeatsCoordinate, CrowdbeatsBounds, CrowdbeatsMapMarker } from '@/lib/maps/types';
import type { CrowdbeatsMapLibreRef } from '@/components/maps/CrowdbeatsMapLibre';
import { liveCheckinToMarker, createUserMarker } from '@/lib/maps/utils/markerNormalizers';
import { reverseGeocodeCoordinates } from '@/lib/maps/googleMapsLoader';
import type { LiveCheckin } from '@/lib/firebase/firestore';
import { DiscoverCampaignsView } from './DiscoverCampaignsView';
import { DiscoverPopularView } from './DiscoverPopularView';
import {
  getTopCampaigns,
  getPopularMusicians,
  CURATED_CAMPAIGNS,
  type DiscoveryCampaign,
  type PopularMusician,
} from '@/lib/discovery/discoveryDataService';

// Dynamically import MapLibre for client-only rendering
const CrowdbeatsMapLibre = dynamic(
  () => import('@/components/maps/CrowdbeatsMapLibre').then((m) => m.CrowdbeatsMapLibre),
  {
    ssr: false,
    loading: () => <DiscoverMapSkeleton />,
  }
);

function DiscoverMapSkeleton() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 460,
        backgroundColor: 'var(--cb-surface-2, #F4F4F6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderRadius: 20,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: '3px solid rgba(124, 58, 237, 0.2)',
          borderTopColor: '#7C3AED',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ fontSize: 13, color: 'var(--cb-text-muted, #86868B)' }}>Loading map…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const DEFAULT_CENTER: { lat: number; lng: number; displayName: string; city: string } = {
  lat: 32.7157,
  lng: -117.1611,
  displayName: 'San Diego, California',
  city: 'San Diego',
};

const GENRE_FILTERS = ['All', 'Acoustic', 'Rock', 'Indie', 'Jazz & Soul', 'Electronic', 'Folk', 'Pop'];

const POPULAR_MUSIC_CITIES = [
  { name: 'Austin, TX', lat: 30.2672, lng: -97.7431, displayName: 'Austin, Texas' },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278, displayName: 'London, United Kingdom' },
  { name: 'Nashville, TN', lat: 36.1627, lng: -86.7816, displayName: 'Nashville, Tennessee' },
  { name: 'New York, NY', lat: 40.7128, lng: -74.006, displayName: 'New York, New York' },
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, displayName: 'Tokyo, Japan' },
  { name: 'Berlin, DE', lat: 52.52, lng: 13.405, displayName: 'Berlin, Germany' },
];

export function DiscoverClientView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Map reference
  const mapRef = useRef<CrowdbeatsMapLibreRef | null>(null);

  // Exploration Center State
  const [exploredLocation, setExploredLocation] = useState(DEFAULT_CENTER);
  const [isNearYou, setIsNearYou] = useState(false);
  const [userGpsLocation, setUserGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermissionError, setLocationPermissionError] = useState<string | null>(null);

  // Map panning & "Search this area" state
  const [currentMapCenter, setCurrentMapCenter] = useState<CrowdbeatsCoordinate>({
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
  });
  const [lastSearchedCenter, setLastSearchedCenter] = useState<CrowdbeatsCoordinate>({
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
  });
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);

  // Genre filtering & Selection
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedPerformerId, setSelectedPerformerId] = useState<string | null>(null);

  // Mobile View Toggle: 'map' vs 'list'
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list');

  // Search autocomplete hook
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    isLoading: isSearchLoading,
    clearResults: clearSearchResults,
  } = useLocationSearch({ minChars: 2, debounceMs: 250 });

  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Discovery Tab Navigation ('live' | 'popular' | 'campaigns')
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'live' | 'popular' | 'campaigns'>(() => {
    if (tabParam === 'campaigns') return 'campaigns';
    if (tabParam === 'popular') return 'popular';
    return 'live';
  });

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'campaigns') setActiveTab('campaigns');
    else if (t === 'popular') setActiveTab('popular');
    else if (t === 'live' || !t) setActiveTab('live');
  }, [searchParams]);

  const handleTabChange = useCallback(
    (newTab: 'live' | 'popular' | 'campaigns') => {
      setActiveTab(newTab);
      const params = new URLSearchParams(searchParams.toString());
      if (newTab === 'live') {
        params.delete('tab');
      } else {
        params.set('tab', newTab);
      }
      const queryString = params.toString();
      const newUrl = queryString ? `/discover?${queryString}` : '/discover';
      router.replace(newUrl, { scroll: false });
    },
    [router, searchParams]
  );

  // Campaigns & Popular Musicians data
  const [campaigns, setCampaigns] = useState<DiscoveryCampaign[] | readonly DiscoveryCampaign[]>([]);
  const [popularMusicians, setPopularMusicians] = useState<PopularMusician[]>([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getTopCampaigns().catch(() => CURATED_CAMPAIGNS),
      getPopularMusicians().catch(() => []),
    ]).then(([camp, pop]) => {
      if (isMounted) {
        setCampaigns(camp.length > 0 ? camp : CURATED_CAMPAIGNS);
        setPopularMusicians(pop);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Initialize from URL query parameters (e.g. /discover?q=Austin or /discover?lat=...&lng=...)
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('city');
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (!isNaN(lat) && !isNaN(lng)) {
        const customLoc = {
          lat,
          lng,
          displayName: qParam || 'Custom Location',
          city: qParam || 'Selected Area',
        };
        setExploredLocation(customLoc);
        setCurrentMapCenter({ lat, lng });
        setLastSearchedCenter({ lat, lng });
        return;
      }
    }

    if (qParam) {
      const qLower = qParam.toLowerCase();
      const match = CURATED_LOCATIONS.find(
        (loc) => loc.city.toLowerCase().includes(qLower) || loc.displayName.toLowerCase().includes(qLower)
      );
      if (match) {
        const matchedLoc = {
          lat: match.latitude,
          lng: match.longitude,
          displayName: match.displayName,
          city: match.city,
        };
        setExploredLocation(matchedLoc);
        setCurrentMapCenter({ lat: match.latitude, lng: match.longitude });
        setLastSearchedCenter({ lat: match.latitude, lng: match.longitude });
      }
    }
  }, [searchParams]);

  // 2. Query live performers from Firestore around the currently explored location
  const { performers: firestorePerformers, isLoading: isLiveLoading } = useLivePerformers({
    lat: exploredLocation.lat,
    lng: exploredLocation.lng,
    radiusMiles: 30,
    enabled: true,
  });

  // 3. Assemble strictly truthful performers for this geographic area
  const localPerformers: LiveCheckin[] = useMemo(() => {
    // If Firestore returned live checkins within 30 miles, use them
    if (firestorePerformers && firestorePerformers.length > 0) {
      return firestorePerformers;
    }

    // For local development / offline demo:
    // Only return mock performers if they are genuinely within 30 miles of the explored location.
    // Strictly honest: if 0 performers are in this city, return []!
    const inRangeMocks: LiveCheckin[] = [];
    for (const mock of MOCK_PERFORMERS) {
      const dist = haversineDistanceMiles(
        exploredLocation.lat,
        exploredLocation.lng,
        mock.latitude,
        mock.longitude
      );
      if (dist <= 30) {
        inRangeMocks.push({
          uid: mock.id,
          performerName: mock.name,
          slug: mock.slug,
          type: mock.type,
          latitude: mock.latitude,
          longitude: mock.longitude,
          venueName: mock.currentVenueName || 'Live Stage',
          isLive: mock.isLive,
          genres: mock.genres ? [...mock.genres] : [],
          photoUrl: mock.photoUrl || '',
          checkedInAt: new Date().toISOString(),
          distanceMiles: parseFloat(dist.toFixed(1)),
          tipLink: `/tip/${mock.id}`,
        });
      }
    }

    return inRangeMocks.sort((a, b) => (a.distanceMiles ?? 99) - (b.distanceMiles ?? 99));
  }, [firestorePerformers, exploredLocation.lat, exploredLocation.lng]);

  // Filter performers by genre
  const filteredPerformers = useMemo(() => {
    if (selectedGenre === 'All') return localPerformers;
    return localPerformers.filter(
      (p) => p.genres && p.genres.some((g) => g.toLowerCase().includes(selectedGenre.toLowerCase()))
    );
  }, [localPerformers, selectedGenre]);

  // 4. Synchronize map markers whenever filtered performers change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof map.clearAllMarkers !== 'function') return;

    map.clearAllMarkers();

    // Add user marker if GPS is active
    if (userGpsLocation && typeof map.addMarker === 'function') {
      map.addMarker(createUserMarker(userGpsLocation.lat, userGpsLocation.lng));
    }

    // Add performer markers
    if (typeof map.addMarker === 'function') {
      filteredPerformers.forEach((p) => {
        const marker = liveCheckinToMarker(p);
        map.addMarker(marker);
      });
    }
  }, [filteredPerformers, userGpsLocation]);

  // 5. Map pan/zoom callback: triggers "Search this area" if moved significantly
  const handleMapMove = useCallback(
    (center: CrowdbeatsCoordinate) => {
      setCurrentMapCenter(center);
      const distMiles = haversineDistanceMiles(
        center.lat,
        center.lng,
        lastSearchedCenter.lat,
        lastSearchedCenter.lng
      );
      // If user has panned more than 0.8 miles away from last search, show button
      if (distMiles > 0.8) {
        setShowSearchThisArea(true);
      }
    },
    [lastSearchedCenter]
  );

  // 6. "Search this area" action
  const handleSearchThisArea = async () => {
    setShowSearchThisArea(false);
    setLastSearchedCenter(currentMapCenter);
    setIsNearYou(false);

    try {
      // Reverse geocode to get a readable label
      const geoRes = await reverseGeocodeCoordinates(currentMapCenter.lat, currentMapCenter.lng);
      setExploredLocation({
        lat: currentMapCenter.lat,
        lng: currentMapCenter.lng,
        displayName: geoRes.displayName || `${geoRes.city || 'This Area'}, ${geoRes.country || ''}`,
        city: geoRes.city || 'This Area',
      });
    } catch {
      setExploredLocation({
        lat: currentMapCenter.lat,
        lng: currentMapCenter.lng,
        displayName: 'Explored Area',
        city: 'Map Area',
      });
    }
  };

  // 7. "Return to my location" action (Browser Geolocation)
  const handleReturnToMyLocation = () => {
    setLocationPermissionError(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationPermissionError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setUserGpsLocation(coords);
        setIsNearYou(true);
        setShowSearchThisArea(false);
        setCurrentMapCenter(coords);
        setLastSearchedCenter(coords);

        // Fly map to user location
        mapRef.current?.flyTo(coords, 14);

        // Reverse geocode user location
        try {
          const rev = await reverseGeocodeCoordinates(coords.lat, coords.lng);
          setExploredLocation({
            lat: coords.lat,
            lng: coords.lng,
            displayName: rev.displayName || `${rev.city}, ${rev.administrativeArea}`,
            city: rev.city || 'Your Location',
          });
        } catch {
          setExploredLocation({
            lat: coords.lat,
            lng: coords.lng,
            displayName: 'Your Location',
            city: 'Near You',
          });
        }
      },
      (err) => {
        let msg = 'Location access was not granted.';
        if (err.code === 1) msg = 'Location permission was denied. You can search any city above.';
        else if (err.code === 2) msg = 'Location is unavailable. Please check device GPS.';
        setLocationPermissionError(msg);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // 8. Select location from autocomplete search
  const handleSelectLocation = (loc: {
    lat: number;
    lng: number;
    displayName: string;
    city: string;
    bounds?: CrowdbeatsBounds;
  }) => {
    setSearchQuery(loc.displayName);
    setIsSearchDropdownOpen(false);
    clearSearchResults();
    setIsNearYou(false); // DOES NOT snap back to device location!
    setShowSearchThisArea(false);

    const newTarget = {
      lat: loc.lat,
      lng: loc.lng,
      displayName: loc.displayName,
      city: loc.city,
    };

    setExploredLocation(newTarget);
    setCurrentMapCenter({ lat: loc.lat, lng: loc.lng });
    setLastSearchedCenter({ lat: loc.lat, lng: loc.lng });

    if (loc.bounds && mapRef.current) {
      mapRef.current.fitBounds(loc.bounds, 50);
    } else if (mapRef.current) {
      mapRef.current.flyTo({ lat: loc.lat, lng: loc.lng }, 13);
    }
  };

  // 9. Synchronize clicking a card with map centering
  const handleCardClick = (performer: LiveCheckin) => {
    setSelectedPerformerId(performer.uid);
    mapRef.current?.easeTo({ lat: performer.latitude, lng: performer.longitude }, { duration: 600 });
  };

  // 10. Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Explored Badge Text
  const exploredBadgeText = isNearYou
    ? `Near you (${exploredLocation.city})`
    : `Exploring ${exploredLocation.displayName}`;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--cb-bg-app, #FBFBFD)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <DiscoveryNav />

      {/* Main Discover Layout */}
      <main
        role="main"
        aria-label="Live Music Discovery"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 1600,
          margin: '0 auto',
          width: '100%',
          padding: '16px clamp(12px, 2vw, 24px) 40px',
          boxSizing: 'border-box',
          gap: 16,
        }}
      >
        {/* ── Top Discover Navigation Tabs ── */}
        <nav
          aria-label="Discovery categories"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            overflowX: 'auto',
            paddingBottom: 4,
            borderBottom: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
          }}
        >
          <button
            type="button"
            onClick={() => handleTabChange('live')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 600,
              border:
                activeTab === 'live'
                  ? '1px solid #7C3AED'
                  : '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
              backgroundColor:
                activeTab === 'live' ? '#7C3AED' : 'var(--cb-surface-1, #FFFFFF)',
              color: activeTab === 'live' ? '#FFFFFF' : 'var(--cb-text-primary, #1D1D1F)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === 'live' ? '0 4px 12px rgba(124, 58, 237, 0.25)' : 'none',
            }}
          >
            <span>📍</span>
            <span>Live Stages</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('popular')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 600,
              border:
                activeTab === 'popular'
                  ? '1px solid #7C3AED'
                  : '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
              backgroundColor:
                activeTab === 'popular' ? '#7C3AED' : 'var(--cb-surface-1, #FFFFFF)',
              color:
                activeTab === 'popular' ? '#FFFFFF' : 'var(--cb-text-primary, #1D1D1F)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === 'popular' ? '0 4px 12px rgba(124, 58, 237, 0.25)' : 'none',
            }}
          >
            <span>🌟</span>
            <span>Popular Musicians</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('campaigns')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 600,
              border:
                activeTab === 'campaigns'
                  ? '1px solid #7C3AED'
                  : '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
              backgroundColor:
                activeTab === 'campaigns' ? '#7C3AED' : 'var(--cb-surface-1, #FFFFFF)',
              color:
                activeTab === 'campaigns' ? '#FFFFFF' : 'var(--cb-text-primary, #1D1D1F)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === 'campaigns' ? '0 4px 12px rgba(124, 58, 237, 0.25)' : 'none',
            }}
          >
            <span>🚀</span>
            <span>Campaigns</span>
            {campaigns.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 999,
                  backgroundColor:
                    activeTab === 'campaigns'
                      ? 'rgba(255, 255, 255, 0.28)'
                      : 'rgba(124, 58, 237, 0.12)',
                  color: activeTab === 'campaigns' ? '#FFFFFF' : '#7C3AED',
                  fontWeight: 700,
                }}
              >
                {campaigns.length}
              </span>
            )}
          </button>
        </nav>

        {activeTab === 'campaigns' ? (
          <DiscoverCampaignsView campaigns={campaigns.length > 0 ? campaigns : CURATED_CAMPAIGNS} />
        ) : activeTab === 'popular' ? (
          <DiscoverPopularView musicians={popularMusicians} />
        ) : (
          <>
            {/* ── Search & Location Controls Bar ── */}
            <section
              aria-label="Location and City Search"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
          {/* Autocomplete Input Container */}
          <div
            ref={searchContainerRef}
            style={{
              position: 'relative',
              flex: '1 1 340px',
              maxWidth: 580,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
                border: '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
                borderRadius: 9999,
                padding: '8px 16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 16, color: 'var(--cb-text-muted, #86868B)', marginRight: 10 }}>
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                onFocus={() => setIsSearchDropdownOpen(true)}
                placeholder="Search cities, regions, countries (e.g. Austin, London)…"
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--cb-text-primary, #1D1D1F)',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    clearSearchResults();
                    setIsSearchDropdownOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--cb-text-muted, #86868B)',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: '2px 6px',
                  }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Autocomplete Results Dropdown */}
            {isSearchDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 6,
                  backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
                  border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.1))',
                  borderRadius: 16,
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.15)',
                  zIndex: 100,
                  maxHeight: 320,
                  overflowY: 'auto',
                  padding: '6px 0',
                }}
              >
                {isSearchLoading ? (
                  <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--cb-text-muted, #86868B)' }}>
                    Searching locations…
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((res) => (
                    <button
                      key={res.placeId}
                      type="button"
                      onClick={() =>
                        handleSelectLocation({
                          lat: res.coordinate.lat,
                          lng: res.coordinate.lng,
                          displayName: res.displayName,
                          city: res.city,
                          bounds: res.bounds,
                        })
                      }
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 16px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--cb-text-primary, #1D1D1F)',
                        cursor: 'pointer',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--cb-surface-2, #F4F4F6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>📍</span>
                      <span style={{ fontWeight: 600 }}>{res.displayName}</span>
                    </button>
                  ))
                ) : (
                  <div>
                    <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 700, color: 'var(--cb-text-muted, #86868B)', textTransform: 'uppercase' }}>
                      Popular Live Music Hubs
                    </div>
                    {POPULAR_MUSIC_CITIES.map((city) => (
                      <button
                        key={city.name}
                        type="button"
                        onClick={() =>
                          handleSelectLocation({
                            lat: city.lat,
                            lng: city.lng,
                            displayName: city.displayName,
                            city: city.name,
                          })
                        }
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '9px 16px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--cb-text-primary, #1D1D1F)',
                          cursor: 'pointer',
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--cb-surface-2, #F4F4F6)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span>🎶</span>
                        <span>{city.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location Actions: Explored Badge + Return to my location button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Visible Explored Area Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 9999,
                backgroundColor: 'rgba(124, 58, 237, 0.12)',
                border: '1px solid rgba(124, 58, 237, 0.28)',
                color: '#7C3AED',
                fontSize: 13,
                fontWeight: 700,
                maxWidth: 360,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <span>📍</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {exploredBadgeText}
              </span>
            </div>

            {/* "Return to my location" button */}
            <button
              type="button"
              onClick={handleReturnToMyLocation}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 9999,
                border: '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
                backgroundColor: isNearYou ? '#7C3AED' : 'var(--cb-surface-1, #FFFFFF)',
                color: isNearYou ? '#FFFFFF' : 'var(--cb-text-primary, #1D1D1F)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
              title="Locate live music playing near you"
            >
              <span>🧭</span>
              <span>Return to my location</span>
            </button>
          </div>
        </section>

        {/* Location Permission / Notification Warning */}
        {locationPermissionError && (
          <div
            role="status"
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              backgroundColor: 'rgba(234, 88, 12, 0.1)',
              border: '1px solid rgba(234, 88, 12, 0.3)',
              color: '#EA580C',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{locationPermissionError}</span>
            <button
              type="button"
              onClick={() => setLocationPermissionError(null)}
              style={{ background: 'none', border: 'none', color: '#EA580C', cursor: 'pointer', fontSize: 13 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Mobile View Segmented Control */}
        <div
          style={{
            display: 'flex',
            borderRadius: 12,
            backgroundColor: 'var(--cb-surface-2, #F4F4F6)',
            padding: 4,
            gap: 4,
          }}
          className="mobile-only-toggle"
        >
          <button
            type="button"
            onClick={() => setMobileView('map')}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 8,
              border: 'none',
              backgroundColor: mobileView === 'map' ? 'var(--cb-surface-1, #FFFFFF)' : 'transparent',
              color: mobileView === 'map' ? '#7C3AED' : 'var(--cb-text-secondary, #6E6E73)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: mobileView === 'map' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
            }}
          >
            🗺️ Map View
          </button>
          <button
            type="button"
            onClick={() => setMobileView('list')}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 8,
              border: 'none',
              backgroundColor: mobileView === 'list' ? 'var(--cb-surface-1, #FFFFFF)' : 'transparent',
              color: mobileView === 'list' ? '#7C3AED' : 'var(--cb-text-secondary, #6E6E73)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: mobileView === 'list' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
            }}
          >
            📋 Performer List ({filteredPerformers.length})
          </button>
        </div>

        {/* ── Main Responsive Content Area (Split Screen on Desktop) ── */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(340px, 460px) 1fr',
            gap: 20,
            minHeight: '620px',
          }}
          className="discover-grid-layout"
        >
          {/* ── LEFT: Performer Results Feed & Genre Filters ── */}
          <section
            aria-label="Live Performers in Area"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              height: '100%',
              overflow: 'hidden',
            }}
            className={`discover-list-panel ${mobileView === 'map' ? 'hide-on-mobile' : ''}`}
          >
            {/* Genre Filter Pills */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 4,
                scrollbarWidth: 'none',
              }}
            >
              {GENRE_FILTERS.map((genre) => {
                const isActive = selectedGenre === genre;
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setSelectedGenre(genre)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 9999,
                      border: isActive ? '1px solid #7C3AED' : '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
                      backgroundColor: isActive ? 'rgba(124, 58, 237, 0.12)' : 'var(--cb-surface-1, #FFFFFF)',
                      color: isActive ? '#7C3AED' : 'var(--cb-text-secondary, #6E6E73)',
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>

            {/* Results Count & Status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 13,
                color: 'var(--cb-text-secondary, #6E6E73)',
              }}
            >
              <span>
                {filteredPerformers.length === 1
                  ? '1 live performer found'
                  : `${filteredPerformers.length} live performers found`}
              </span>
              <span style={{ fontSize: 11, color: 'var(--cb-text-muted, #86868B)' }}>
                Within 30 miles
              </span>
            </div>

            {/* Scrollable Performer Cards Feed */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                paddingRight: 4,
              }}
            >
              {isLiveLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--cb-text-muted, #86868B)' }}>
                  Scanning for live stages…
                </div>
              ) : filteredPerformers.length > 0 ? (
                filteredPerformers.map((p) => {
                  const isSelected = selectedPerformerId === p.uid;
                  const isBand = p.type === 'band';

                  return (
                    <article
                      key={p.uid}
                      onClick={() => handleCardClick(p)}
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(124, 58, 237, 0.08)'
                          : 'var(--cb-surface-1, #FFFFFF)',
                        border: isSelected
                          ? '2px solid #7C3AED'
                          : '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
                        borderRadius: 18,
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected
                          ? '0 8px 24px rgba(124, 58, 237, 0.15)'
                          : '0 2px 8px rgba(0, 0, 0, 0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 14 }}>
                        {/* Performer Avatar */}
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 14,
                            backgroundColor: 'var(--cb-surface-2, #F4F4F6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 26,
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
                          }}
                        >
                          {p.photoUrl ? (
                            <img
                              src={p.photoUrl}
                              alt={p.performerName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span>{isBand ? '🎸' : '🎤'}</span>
                          )}
                        </div>

                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Link
                              href={`/${p.type || 'artist'}/${p.slug || p.uid}`}
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: 'var(--cb-text-primary, #1D1D1F)',
                                textDecoration: 'none',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {p.performerName}
                            </Link>

                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 6px',
                                borderRadius: 9999,
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#10B981',
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                              }}
                            >
                              ● LIVE
                            </span>
                          </div>

                          <div style={{ fontSize: 12, color: 'var(--cb-text-secondary, #6E6E73)', marginTop: 2 }}>
                            <span>{isBand ? 'Band' : 'Solo Musician'}</span>
                            {p.genres && p.genres.length > 0 && (
                              <span> · {p.genres.slice(0, 2).join(', ')}</span>
                            )}
                            {typeof p.distanceMiles === 'number' && (
                              <span> · {p.distanceMiles} mi away</span>
                            )}
                          </div>

                          {p.venueName && (
                            <div style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, marginTop: 4 }}>
                              📍 @ {p.venueName}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Actions: Tip Button & View Profile */}
                      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                        <Link
                          href={`/${p.type || 'artist'}/${p.slug || p.uid}`}
                          style={{
                            flex: 1,
                            padding: '9px 12px',
                            borderRadius: 10,
                            border: '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
                            backgroundColor: 'transparent',
                            color: 'var(--cb-text-primary, #1D1D1F)',
                            fontSize: 13,
                            fontWeight: 600,
                            textAlign: 'center',
                            textDecoration: 'none',
                            boxSizing: 'border-box',
                          }}
                        >
                          View Profile
                        </Link>

                        <Link
                          href={`/tip/${p.uid}?amount=10`}
                          style={{
                            flex: 1,
                            padding: '9px 12px',
                            borderRadius: 10,
                            border: 'none',
                            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                            color: '#FFFFFF',
                            fontSize: 13,
                            fontWeight: 700,
                            textAlign: 'center',
                            textDecoration: 'none',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            boxSizing: 'border-box',
                          }}
                        >
                          <span>💖</span>
                          <span>Tip $10</span>
                        </Link>
                      </div>
                    </article>
                  );
                })
              ) : (
                /* ── Honest Empty State ── */
                <div
                  style={{
                    backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
                    border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
                    borderRadius: 20,
                    padding: '36px 20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 36 }}>🎵</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--cb-text-primary, #1D1D1F)', margin: 0 }}>
                    No performers found in this area.
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--cb-text-secondary, #6E6E73)', margin: 0, lineHeight: 1.5, maxWidth: 320 }}>
                    Musicians and bands appear here when they are checked in and live on stage. Try searching another city or expanding your map view.
                  </p>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--cb-text-muted, #86868B)',
                      backgroundColor: 'var(--cb-surface-2, #F4F4F6)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      marginTop: 4,
                    }}
                  >
                    🛡️ <strong>Honesty Guarantee:</strong> We never substitute distant performers from other cities.
                  </div>

                  <div style={{ marginTop: 12, width: '100%' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--cb-text-secondary, #6E6E73)', marginBottom: 8 }}>
                      Explore active music hubs:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                      {POPULAR_MUSIC_CITIES.slice(0, 4).map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() =>
                            handleSelectLocation({
                              lat: c.lat,
                              lng: c.lng,
                              displayName: c.displayName,
                              city: c.name,
                            })
                          }
                          style={{
                            padding: '5px 10px',
                            borderRadius: 9999,
                            backgroundColor: 'var(--cb-surface-2, #F4F4F6)',
                            border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
                            color: '#7C3AED',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── RIGHT: Map Exploration Canvas ── */}
          <section
            aria-label="Map Canvas"
            style={{
              position: 'relative',
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.1))',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.06)',
              minHeight: 480,
            }}
            className={`discover-map-panel ${mobileView === 'list' ? 'hide-on-mobile' : ''}`}
          >
            {/* Interactive MapLibre Map */}
            <CrowdbeatsMapLibre
              ref={mapRef}
              theme={resolvedTheme}
              center={{ lat: exploredLocation.lat, lng: exploredLocation.lng }}
              zoom={13}
              onMove={handleMapMove}
              onMarkerClick={(markerId) => {
                const perfId = markerId.replace(/^live_/, '');
                setSelectedPerformerId(perfId);
              }}
              style={{ width: '100%', height: '100%' }}
            />

            {/* ── Floating "Search this area" Button ── */}
            {showSearchThisArea && (
              <div
                style={{
                  position: 'absolute',
                  top: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 20,
                }}
              >
                <button
                  type="button"
                  onClick={handleSearchThisArea}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 9999,
                    backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
                    border: '1px solid #7C3AED',
                    color: '#7C3AED',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>🔍</span>
                  <span>Search this area</span>
                </button>
              </div>
            )}

            {/* Floating Quick GPS button on map corner */}
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                right: 20,
                zIndex: 20,
              }}
            >
              <button
                type="button"
                onClick={handleReturnToMyLocation}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
                  border: '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  cursor: 'pointer',
                }}
                title="Return to my location"
                aria-label="Return to my location"
              >
                🎯
              </button>
            </div>
          </section>
        </div>
        </>
      )}
      </main>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 900px) {
          .discover-grid-layout {
            grid-template-columns: 1fr !important;
          }
          .mobile-only-toggle {
            display: flex !important;
          }
          .hide-on-mobile {
            display: none !important;
          }
        }
        @media (min-width: 901px) {
          .mobile-only-toggle {
            display: none !important;
          }
          .hide-on-mobile {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
