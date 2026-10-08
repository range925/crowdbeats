'use client';

/**
 * Landing v3 — Section 2: Discover nearby (#discover)
 *
 * Clean side-by-side live discovery experience matching user reference design:
 *  - Left panel:
 *      - Rounded location search with debounced autocomplete & "Use my location"
 *      - Real-time status indicator
 *      - Top 5 nearest live musicians matching map pin numbers (1-5)
 *      - Empty state when no live sets are active in the radius
 *  - Right panel:
 *      - Interactive Google Map with quiet neutral styling, POI decluttering,
 *        dark/light theme awareness, numbered pins 1-5, and floating controls.
 */
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { LiveCheckin } from '@/lib/firebase/firestore';
import type { PlacePrediction } from '@/lib/maps/googleMapsLoader';
import { DiscoverMap } from './DiscoverMap';
import { useNearbyDiscovery } from '@/lib/discovery/discoveryDataService';
import {
  NearestPerformerCard,
  PopularPerformerCard,
  CampaignCard,
  PerformerPreviewModal,
  type PreviewPerformer,
} from './cards';
import styles from './landing.module.css';
import d from './discover.module.css';

const DEFAULT_RADIUS_MILES = 25;
const MAX_CARDS = 5;

type Status = 'idle' | 'locating' | 'loading' | 'results' | 'empty' | 'error';
type ErrorKind = 'geocode' | 'location' | 'data';
type View = 'list' | 'map';
type DiscoveryTab = 'nearest' | 'popular' | 'campaigns';

interface Center {
  lat: number;
  lng: number;
  label: string;
  zoom?: number;
}

type LastAction = { kind: 'city'; query: string } | { kind: 'gps' } | null;

const DEFAULT_CENTER: Center = {
  lat: 32.7157,
  lng: -117.1611,
  label: 'San Diego, CA',
  zoom: 13,
};

/* ── DiscoverSection Component ──────────────────────────────────────────── */
export function DiscoverSection() {
  const inputId = useId();
  const hintId = useId();
  const listboxId = useId();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const [activeTab, setActiveTab] = useState<DiscoveryTab>('nearest');

  const [status, setStatus] = useState<Status>('idle');
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [center, setCenter] = useState<Center>(DEFAULT_CENTER);
  const [radiusMiles, setRadiusMiles] = useState(DEFAULT_RADIUS_MILES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewPerformer, setPreviewPerformer] = useState<PreviewPerformer | null>(null);
  const [view, setView] = useState<View>('list');

  const [lastAction, setLastAction] = useState<LastAction>(null);
  const requestSeq = useRef(0);
  const autocompleteSeq = useRef(0);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const actionBtnRef = useRef<HTMLButtonElement>(null);
  const suggestionsListRef = useRef<HTMLUListElement>(null);

  // Discovery data hook for nearest performers, popular acts, and top campaigns
  const discovery = useNearbyDiscovery(center, radiusMiles);

  // Source for Top 5 cards and map pins: genuine live checkins if active, else nearby fallback
  const displayPerformers = useMemo(() => {
    return (discovery.livePerformers.length > 0 ? discovery.livePerformers : discovery.nearestPerformers).slice(
      0,
      MAX_CARDS
    );
  }, [discovery.livePerformers, discovery.nearestPerformers]);

  // Map performers mapped to LiveCheckin interface for DiscoverMap pins
  const mapPerformers: LiveCheckin[] = useMemo(() => {
    return displayPerformers.map((p) => ({
      uid: p.id,
      performerName: p.name,
      photoUrl: p.photoUrl || '',
      type: p.type === 'band' ? 'band' : 'artist',
      genres: p.genres || [],
      slug: p.slug,
      venueName: p.venueName || '',
      latitude: p.latitude ?? center.lat,
      longitude: p.longitude ?? center.lng,
      isLive: p.isLive,
      checkedInAt: p.checkedInAt || new Date().toISOString(),
      tipLink: p.tipLink,
      distanceMiles: p.distanceMiles,
    }));
  }, [displayPerformers, center.lat, center.lng]);

  const fail = useCallback((kind: ErrorKind, msg: string) => {
    setErrorKind(kind);
    setErrorMsg(msg);
    setStatus('error');
  }, []);

  const searchCity = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      setIsOpen(false);
      setSuggestions([]);
      setActiveIndex(-1);

      setLastAction({ kind: 'city', query: q });
      if (q.length < 2) {
        fail('geocode', 'Enter a city or neighborhood, for example “Austin, TX”.');
        return;
      }
      const seq = ++requestSeq.current;
      setStatus('loading');
      setErrorKind(null);
      try {
        const { geocodeCityQuery } = await import('@/lib/maps/googleMapsLoader');
        const loc = await geocodeCityQuery(q);
        if (seq !== requestSeq.current) return;
        if (!loc) {
          fail('geocode', `We couldn’t find “${q}”. Check the spelling or try a nearby city.`);
          return;
        }
        setSelectedId(null);
        setCenter({
          lat: loc.latitude,
          lng: loc.longitude,
          label: loc.displayName || loc.city || q,
          zoom: 13,
        });
        setStatus('results');
      } catch {
        if (seq !== requestSeq.current) return;
        fail('geocode', 'City search is unavailable right now. Please try again in a moment.');
      }
    },
    [fail]
  );

  const fetchMyLocation = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setIsOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);

    setLastAction({ kind: 'gps' });
    const seq = ++requestSeq.current;
    setStatus('locating');
    setErrorKind(null);
    try {
      const { requestBrowserGeolocation, reverseGeocodeCoordinates } = await import('@/lib/maps/googleMapsLoader');
      const pos = await requestBrowserGeolocation();
      if (seq !== requestSeq.current) return;

      const geo = await reverseGeocodeCoordinates(pos.latitude, pos.longitude);
      const friendlyLabel = geo?.displayName || geo?.city || 'Current location';

      if (seq !== requestSeq.current) return;
      setSelectedId(null);
      setQuery(friendlyLabel);
      setCenter({
        lat: pos.latitude,
        lng: pos.longitude,
        label: friendlyLabel,
        zoom: 14,
      });
      setStatus('results');
    } catch (err: unknown) {
      if (seq !== requestSeq.current) return;
      const code = typeof err === 'object' && err !== null && 'code' in err ? (err as { code: number }).code : null;
      if (code === 1) {
        fail('location', 'Location permission was denied. You can still search by city above.');
      } else {
        fail('location', 'Couldn’t find your location. Please check your browser settings or search by city.');
      }
    }
  }, [fail]);

  // Debounced Autocomplete Predictions
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const seq = ++autocompleteSeq.current;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const { getGooglePlacePredictions, createPlacesSessionToken } = await import('@/lib/maps/googleMapsLoader');
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = createPlacesSessionToken();
        }
        const preds = await getGooglePlacePredictions(trimmed, sessionTokenRef.current || undefined);
        if (seq === autocompleteSeq.current) {
          setSuggestions(preds);
          setLoadingSuggestions(false);
        }
      } catch {
        if (seq === autocompleteSeq.current) {
          setSuggestions([]);
          setLoadingSuggestions(false);
        }
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = useCallback(
    async (pred: PlacePrediction) => {
      setIsOpen(false);
      setSuggestions([]);
      setActiveIndex(-1);
      setQuery(pred.mainText);
      sessionTokenRef.current = null;

      const seq = ++requestSeq.current;
      setStatus('loading');
      setErrorKind(null);
      setLastAction({ kind: 'city', query: pred.mainText });

      try {
        const { resolveGooglePlaceLocation } = await import('@/lib/maps/googleMapsLoader');
        const loc = await resolveGooglePlaceLocation(pred.placeId, pred.fullText);
        if (seq !== requestSeq.current) return;
        if (!loc) {
          fail('geocode', `We couldn’t find details for “${pred.mainText}”. Try another location.`);
          return;
        }
        setSelectedId(null);
        setCenter({
          lat: loc.latitude,
          lng: loc.longitude,
          label: loc.displayName || loc.city || pred.mainText,
          zoom: 13,
        });
        setStatus('results');
      } catch {
        if (seq !== requestSeq.current) return;
        fail('geocode', 'Failed to load location details. Please try again.');
      }
    },
    [fail]
  );

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleUseMyLocation = () => {
    setIsOpen(false);
    setActiveIndex(-1);
    void fetchMyLocation();
  };

  const handleSearchArea = useCallback(
    async (newCenter: { lat: number; lng: number; zoom: number }) => {
      const seq = ++requestSeq.current;
      try {
        const { reverseGeocodeCoordinates } = await import('@/lib/maps/googleMapsLoader');
        const geo = await reverseGeocodeCoordinates(newCenter.lat, newCenter.lng);
        if (seq !== requestSeq.current) return;
        const label = geo?.displayName || geo?.city || `${newCenter.lat.toFixed(2)}, ${newCenter.lng.toFixed(2)}`;
        setCenter({
          lat: newCenter.lat,
          lng: newCenter.lng,
          label,
          zoom: newCenter.zoom,
        });
        setQuery(label);
      } catch {
        if (seq !== requestSeq.current) return;
        setCenter({
          lat: newCenter.lat,
          lng: newCenter.lng,
          label: `${newCenter.lat.toFixed(2)}, ${newCenter.lng.toFixed(2)}`,
          zoom: newCenter.zoom,
        });
      }
    },
    []
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalOptions = suggestions.length + 1; // +1 for "Use my location" button

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && query.trim().length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((prev) => (prev + 1) % totalOptions);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen && query.trim().length > 0) {
        setIsOpen(true);
        setActiveIndex(totalOptions - 1);
      } else {
        setActiveIndex((prev) => (prev <= 0 ? totalOptions - 1 : prev - 1));
      }
    } else if (e.key === 'Enter') {
      if (isOpen && activeIndex >= 0) {
        e.preventDefault();
        if (activeIndex < suggestions.length) {
          void handleSelectSuggestion(suggestions[activeIndex]);
        } else if (activeIndex === suggestions.length) {
          handleUseMyLocation();
        }
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    }
  };

  useEffect(() => {
    if (activeIndex >= 0 && activeIndex < suggestions.length && suggestionsListRef.current) {
      const el = suggestionsListRef.current.children[activeIndex] as HTMLElement | undefined;
      if (typeof el?.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, suggestions.length]);

  const retry = useCallback(() => {
    const a = lastAction;
    if (!a) return;
    if (a.kind === 'gps') void fetchMyLocation();
    else void searchCity(a.query);
  }, [lastAction, fetchMyLocation, searchCity]);

  // Handle marker selection on map -> highlight card, scroll into view & open preview modal
  const handleSelectPerformer = useCallback(
    (uid: string) => {
      setSelectedId(uid);
      const el = cardRefs.current.get(uid);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      const perf = displayPerformers.find((p) => p.id === uid);
      if (perf) {
        setPreviewPerformer({
          id: perf.id,
          performerName: perf.name,
          name: perf.name,
          photoUrl: perf.photoUrl,
          type: perf.type,
          genres: perf.genres,
          slug: perf.slug,
          venueName: perf.venueName,
          distanceMiles: perf.distanceMiles,
          isLive: perf.isLive,
          tipLink: perf.tipLink,
        });
      }
    },
    [displayPerformers]
  );

  const handleExpandSearch = useCallback(() => {
    setRadiusMiles((prev) => prev + 25);
  }, []);

  const handleFocusSearch = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, currentTab: DiscoveryTab) => {
    const tabs: DiscoveryTab[] = ['nearest', 'popular', 'campaigns'];
    const currentIndex = tabs.indexOf(currentTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextTab = tabs[(currentIndex + 1) % tabs.length];
      setActiveTab(nextTab);
      document.getElementById(`tab-${nextTab}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
      setActiveTab(prevTab);
      document.getElementById(`tab-${prevTab}`)?.focus();
    }
  }, []);

  const busy = status === 'loading' || status === 'locating' || discovery.isLoading;
  const isLive = discovery.livePerformers.length > 0;

  let statusText = '';
  if (status === 'locating') {
    statusText = 'Requesting your location…';
  } else if (status === 'loading') {
    statusText = center ? `Looking for live music near ${center.label}…` : 'Searching…';
  } else if (status === 'error') {
    statusText = errorMsg;
  } else if (isLive) {
    statusText =
      discovery.livePerformers.length > MAX_CARDS
        ? `Showing ${MAX_CARDS} of ${discovery.livePerformers.length} performers live within ${radiusMiles} miles of ${center.label}.`
        : `${discovery.livePerformers.length} ${discovery.livePerformers.length === 1 ? 'performer' : 'performers'} live within ${radiusMiles} miles of ${center.label}.`;
  } else {
    statusText = `No one is live within ${radiusMiles} miles of ${center.label} right now.`;
  }

  return (
    <section id="discover" className={`${styles.section} ${d.section}`} aria-labelledby="discover-title">
      <div className={styles.container}>
        <header className={d.head}>
          <p className={styles.eyebrow}>Discover nearby</p>
          <h2 id="discover-title" className={styles.h2}>
            Your next great live moment could be around the corner.
          </h2>
          <p className={`${styles.lead} ${d.lead}`}>
            No account needed. Explore solo musicians and bands who are checked in and performing near you, see
            where they&rsquo;re playing, and choose whom to support.
          </p>
        </header>

        {/* ── Search bar centered above map ── */}
        <div className={d.searchSection}>
          <form
            className={d.form}
            role="search"
            aria-label="Find live music nearby"
            onSubmit={(e) => {
              e.preventDefault();
              setIsOpen(false);
              setActiveIndex(-1);
              void searchCity(query);
            }}
          >
            <label htmlFor={inputId} className={d.label}>
              City or neighborhood
            </label>

            <div className={d.searchContainer} ref={searchContainerRef}>
              <div className={`${d.searchBar} ${isFocused ? d.searchBarFocused : ''}`}>
                <span className={d.searchIcon} aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    focusable="false"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  id={inputId}
                  ref={inputRef}
                  className={d.searchInput}
                  type="text"
                  inputMode="search"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Search city or neighborhood (e.g. Austin, TX)"
                  value={query}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuery(val);
                    const trimmed = val.trim();
                    if (trimmed.length >= 3) {
                      setIsOpen(true);
                      setLoadingSuggestions(true);
                    } else if (trimmed.length > 0) {
                      setIsOpen(true);
                      setSuggestions([]);
                      setLoadingSuggestions(false);
                    } else {
                      setIsOpen(false);
                      setSuggestions([]);
                      setLoadingSuggestions(false);
                    }
                  }}
                  onFocus={() => {
                    setIsFocused(true);
                    if (query.trim().length > 0) setIsOpen(true);
                  }}
                  onBlur={() => {
                    setIsFocused(false);
                  }}
                  onKeyDown={handleKeyDown}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={isOpen && query.trim().length > 0}
                  aria-controls={listboxId}
                  aria-activedescendant={
                    activeIndex >= 0 && activeIndex < suggestions.length
                      ? `${listboxId}-opt-${activeIndex}`
                      : activeIndex === (suggestions.length > 0 ? suggestions.length : 0)
                        ? `${listboxId}-action`
                        : undefined
                  }
                  aria-describedby={hintId}
                />
                {query.length > 0 && (
                  <button
                    type="button"
                    className={d.clearBtn}
                    onClick={handleClear}
                    aria-label="Clear search input"
                    tabIndex={-1}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      focusable="false"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
                <button
                  type="submit"
                  className={d.submitBtn}
                  disabled={busy}
                  aria-label="Explore nearby music"
                  tabIndex={-1}
                >
                  {busy ? (
                    <span className={d.btnSpinner} aria-hidden="true" />
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      focusable="false"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {isOpen && query.trim().length > 0 && (
                <div className={d.dropdown} onMouseDown={(e) => e.preventDefault()}>
                  {query.trim().length < 3 ? (
                    <div className={d.dropdownHint} role="status">
                      Type at least 3 characters to search
                    </div>
                  ) : loadingSuggestions ? (
                    <div className={d.dropdownStatus} role="status">
                      <span className={d.spinner} aria-hidden="true" />
                      <span>Finding locations…</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <ul
                      id={listboxId}
                      ref={suggestionsListRef}
                      role="listbox"
                      className={d.suggestionsList}
                      aria-label="Location suggestions"
                    >
                      {suggestions.map((item, idx) => (
                        <li
                          key={item.placeId || `${item.fullText}-${idx}`}
                          id={`${listboxId}-opt-${idx}`}
                          role="option"
                          aria-selected={activeIndex === idx}
                          className={`${d.suggestionItem} ${activeIndex === idx ? d.suggestionActive : ''}`}
                          onClick={() => void handleSelectSuggestion(item)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <span className={d.suggestionIcon} aria-hidden="true">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              focusable="false"
                            >
                              <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Z" />
                              <circle cx="12" cy="9" r="2.5" />
                            </svg>
                          </span>
                          <div className={d.suggestionText}>
                            <span className={d.suggestionMain}>{item.mainText}</span>
                            {item.secondaryText && (
                              <span className={d.suggestionSecondary}>{item.secondaryText}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className={d.dropdownEmpty} role="status">
                      No matching locations found
                    </div>
                  )}

                  <div className={d.dropdownDivider} />

                  <div className={d.dropdownBottom}>
                    <button
                      ref={actionBtnRef}
                      id={`${listboxId}-action`}
                      type="button"
                      className={`${d.dropdownActionBtn} ${
                        activeIndex === (suggestions.length > 0 ? suggestions.length : 0)
                          ? d.dropdownActionActive
                          : ''
                      }`}
                      onClick={handleUseMyLocation}
                      onMouseDown={(e) => e.preventDefault()}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          setIsOpen(false);
                          inputRef.current?.focus();
                        }
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                        className={d.actionIcon}
                      >
                        <path
                          fill="currentColor"
                          d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 3h-2.07A7 7 0 0 0 13 5.07V3h-2v2.07A7 7 0 0 0 5.07 11H3v2h2.07A7 7 0 0 0 11 18.93V21h2v-2.07A7 7 0 0 0 18.93 13H21v-2Zm-9 6a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"
                        />
                      </svg>
                      <span>Use my location</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p id={hintId} className={`${styles.meta} ${d.hint}`}>
              We only ask for your location when you tap &ldquo;Use my location&rdquo;. Results cover {radiusMiles}{' '}
              miles.
            </p>
          </form>
        </div>

        {/* ── Discovery Layout & Controls ── */}
        <div className={d.layout} data-view={view}>
          {/* Mobile View Toggle */}
          <div className={d.toggle} role="group" aria-label="Results view">
            <button
              type="button"
              className={d.toggleBtn}
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              List
            </button>
            <button
              type="button"
              className={d.toggleBtn}
              aria-pressed={view === 'map'}
              onClick={() => setView('map')}
            >
              Map
            </button>
          </div>

          {/* ── 3/4 Width Interactive Map (Center Aligned) ── */}
          <div className={d.mapPanel34}>
            <DiscoverMap
              center={center}
              performers={mapPerformers}
              selectedId={selectedId}
              onSelectPerformer={handleSelectPerformer}
              onSearchArea={handleSearchArea}
              visibleKey={activeTab}
            />
          </div>

        {/* Status / Notice Banner */}
        {!isLive && !busy && (
          <div className={d.noticeBannerWrapper}>
            <div className={d.noticeBanner} role="status">
              <div className={d.noticeBannerHeader}>
                <span className={d.noticeBannerIcon} aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    focusable="false"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <h4 className={d.noticeBannerTitle}>No live sets in this radius right now</h4>
              </div>
              <p className={d.noticeBannerText}>
                Showing other musicians based near {center.label}. You can expand your search radius or try searching another city.
              </p>
              <div className={d.noticeActions}>
                <button
                  type="button"
                  className={d.noticeBtn}
                  onClick={handleExpandSearch}
                  aria-label={`Expand search radius to ${radiusMiles + 25} miles`}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  <span>Expand search (+25 mi)</span>
                </button>
                <button
                  type="button"
                  className={d.noticeBtn}
                  onClick={handleFocusSearch}
                >
                  <span>Try another city</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <p className={d.srOnlyStatus} role="status" aria-live="polite" aria-atomic="true">
          {statusText}
        </p>

        {status === 'error' && (
          <div className={`${d.message} ${d.error}`}>
            <p className={styles.h3}>
              {errorKind === 'location'
                ? 'Location unavailable'
                : errorKind === 'geocode'
                  ? 'We couldn’t find that place'
                  : 'Something went wrong'}
            </p>
            <p className={styles.body}>{errorMsg}</p>
            {lastAction && (
              <button type="button" className={`${styles.btnSecondary} ${d.retry}`} onClick={retry}>
                Try again
              </button>
            )}
          </div>
        )}

        {/* ── Discovery Tabs Bar (Shortens Section) ── */}
        <div className={d.tabsContainer}>
          <div className={d.tabBar} role="tablist" aria-label="Discovery categories">
            <button
              type="button"
              role="tab"
              id="tab-nearest"
              aria-selected={activeTab === 'nearest'}
              aria-controls="panel-nearest"
              tabIndex={activeTab === 'nearest' ? 0 : -1}
              className={`${d.tabBtn} ${activeTab === 'nearest' ? d.tabBtnActive : ''}`}
              onClick={() => setActiveTab('nearest')}
              onKeyDown={(e) => handleTabKeyDown(e, 'nearest')}
            >
              <span className={d.tabDot} aria-hidden="true" />
              <span>{isLive ? 'Top 5 Nearest' : 'Nearest Musicians'}</span>
              <span className={`${d.tabBadge} ${isLive ? d.tabBadgeLive : ''}`}>
                {isLive ? 'Live' : displayPerformers.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-popular"
              aria-selected={activeTab === 'popular'}
              aria-controls="panel-popular"
              tabIndex={activeTab === 'popular' ? 0 : -1}
              className={`${d.tabBtn} ${activeTab === 'popular' ? d.tabBtnActive : ''}`}
              onClick={() => setActiveTab('popular')}
              onKeyDown={(e) => handleTabKeyDown(e, 'popular')}
            >
              <span>Popular Musicians</span>
              <span className={d.tabBadge}>{discovery.popularMusicians.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-campaigns"
              aria-selected={activeTab === 'campaigns'}
              aria-controls="panel-campaigns"
              tabIndex={activeTab === 'campaigns' ? 0 : -1}
              className={`${d.tabBtn} ${activeTab === 'campaigns' ? d.tabBtnActive : ''}`}
              onClick={() => setActiveTab('campaigns')}
              onKeyDown={(e) => handleTabKeyDown(e, 'campaigns')}
            >
              <span>Top Campaigns</span>
              <span className={d.tabBadge}>{discovery.topCampaigns.length}</span>
            </button>
          </div>
        </div>

        {/* ── Full Width Widgets Container ── */}
        <div className={d.fullWidthWidgets}>
          {/* Tab Panel 1: Top 5 Nearest */}
          <div
            id="panel-nearest"
            role="tabpanel"
            aria-labelledby="tab-nearest"
            className={`${d.tabPanel} ${activeTab !== 'nearest' ? d.tabPanelHidden : ''}`}
            hidden={activeTab !== 'nearest'}
          >
            <div className={d.groupHeader}>
              <div className={d.groupTitleBlock}>
                <div className={d.groupTitleRow}>
                  <h3 className={d.groupTitle}>
                    {isLive ? 'Top 5 nearest musicians' : 'Other musicians nearby'}
                  </h3>
                  <span className={`${d.groupBadge} ${isLive ? d.groupBadgeLive : ''}`}>
                    {isLive ? 'Live now' : `Nearest to ${center.label}`} · Within {radiusMiles} mi
                  </span>
                </div>
                <p className={d.groupSubtitle}>
                  {isLive
                    ? 'Numbered 1–5 matching map pins. Currently checked in and performing.'
                    : 'Local musicians and bands based near this area.'}
                </p>
              </div>
            </div>

            {displayPerformers.length > 0 ? (
              <ul className={d.gridNearest5} aria-label={isLive ? 'Live performers' : 'Musicians nearby'}>
                {displayPerformers.map((p, idx) => (
                  <li
                    key={p.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(p.id, el);
                      else cardRefs.current.delete(p.id);
                    }}
                  >
                    <NearestPerformerCard
                      performer={{
                        id: p.id,
                        performerName: p.name,
                        photoUrl: p.photoUrl,
                        type: p.type,
                        genres: p.genres,
                        slug: p.slug,
                        venueName: p.venueName,
                        distanceMiles: p.distanceMiles,
                        isLive: p.isLive,
                        tipLink: p.tipLink,
                      }}
                      rank={idx + 1}
                      isSelected={p.id === selectedId}
                      onSelect={(perf) => handleSelectPerformer(perf.id)}
                      onPreview={(perf) => setPreviewPerformer(perf)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className={d.message}>
                <p className={styles.h3}>No musicians found in this radius</p>
                <p className={styles.body}>
                  Try expanding your search radius or searching for a different city or neighborhood.
                </p>
              </div>
            )}
          </div>

          {/* Tab Panel 2: Popular Musicians */}
          <div
            id="panel-popular"
            role="tabpanel"
            aria-labelledby="tab-popular"
            className={`${d.tabPanel} ${activeTab !== 'popular' ? d.tabPanelHidden : ''}`}
            hidden={activeTab !== 'popular'}
          >
            <div className={d.groupHeader}>
              <div className={d.groupTitleBlock}>
                <h3 className={d.groupTitle}>Popular musicians</h3>
                <p className={d.groupSubtitle}>
                  Top verified solo artists &amp; bands with active followings
                </p>
              </div>
              <Link href="/discover" className={d.groupLink}>
                <span>View all</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            <ul className={d.gridPopularFull} aria-label="Popular musicians">
              {discovery.popularMusicians.map((p) => (
                <li key={p.id}>
                  <PopularPerformerCard
                    performer={{
                      id: p.id,
                      performerName: p.name,
                      photoUrl: p.photoUrl,
                      type: p.type,
                      genres: p.genres,
                      slug: p.slug,
                      followersCount: p.followersCount,
                      originCity: p.originCity,
                      isVerified: p.isVerified,
                      rank: p.rank,
                      popularityScore: p.popularityScore,
                      tipLink: p.tipLink,
                    }}
                    compact={false}
                    onPreview={(perf) => setPreviewPerformer(perf)}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Tab Panel 3: Top Campaigns */}
          <div
            id="panel-campaigns"
            role="tabpanel"
            aria-labelledby="tab-campaigns"
            className={`${d.tabPanel} ${activeTab !== 'campaigns' ? d.tabPanelHidden : ''}`}
            hidden={activeTab !== 'campaigns'}
          >
            <div className={d.groupHeader}>
              <div className={d.groupTitleBlock}>
                <h3 className={d.groupTitle}>Top campaigns</h3>
                <p className={d.groupSubtitle}>
                  Support active projects funded by local fans
                </p>
              </div>
              <Link href="/creator/campaigns" className={d.groupLink}>
                <span>View all</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            <ul className={d.gridCampaignsFull} aria-label="Top campaigns">
              {discovery.topCampaigns.map((c) => (
                <li key={c.campaignId}>
                  <CampaignCard
                    campaign={{
                      id: c.campaignId,
                      campaignId: c.campaignId,
                      title: c.title,
                      creatorName: c.creatorName,
                      creatorType: c.creatorType,
                      pledgedCents: c.pledgedCents,
                      goalCents: c.goalCents,
                      percentFunded: c.percentFunded,
                      backerCount: c.backerCount,
                      daysRemaining: c.daysRemaining,
                      status: c.status,
                      photoUrl: c.photoUrl,
                      category: c.category,
                      description: c.description,
                    }}
                    compact={false}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>


        <p className={`${styles.meta} ${d.footnote}`}>
          Only performers who are checked in and publicly live appear. Distances are straight-line estimates.
        </p>
      </div>

      {/* Performer Preview Modal */}
      <PerformerPreviewModal
        isOpen={previewPerformer !== null}
        performer={previewPerformer}
        onClose={() => setPreviewPerformer(null)}
      />
    </section>
  );
}

export default DiscoverSection;
