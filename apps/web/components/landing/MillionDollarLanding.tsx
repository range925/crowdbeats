'use client';

/**
 * Crowdbeats V2 — Authoritative Public Landing Page (Stitch Project 14673587965252723053)
 *
 * Implements the approved Stitch design with pixel-accurate visual parity,
 * Cupertino-clean restraint, and full preservation of existing routing, discovery,
 * tip simulation, and legal compliance.
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CbFooter } from '@/components/ui/CbFooter';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';
import LandingMapSection from '@/components/landing/LandingMapSection';
import { TipAuthGateModal } from '@/components/discovery/TipAuthGateModal';
import type { PublicPerformerItem } from '@/lib/discovery/discoveryClient';

export function MillionDollarLanding() {
  const isLight = true;

  // Navigation and header scroll state
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active filter chip in Discovery
  const [activeFilter, setActiveFilter] = useState<string>('All Live (14)');
  const [mobileDiscoveryView, setMobileDiscoveryView] = useState<'list' | 'map'>('list');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('jake-rios');
  const [mapZoom, setMapZoom] = useState<number>(1.15);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMapDragging, setIsMapDragging] = useState<boolean>(false);
  const mapDragStartRef = useRef<{ startX: number; startY: number; panX: number; panY: number }>({ startX: 0, startY: 0, panX: 0, panY: 0 });

  // Interactive Fee Calculator in Artist Story
  const feeAmounts = [10, 25, 50, 100];
  const [selectedFeeAmount, setSelectedFeeAmount] = useState<number>(25);

  // Tip Modal integration
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [activeTipPerformer, setActiveTipPerformer] = useState<PublicPerformerItem | null>(null);

  // Geolocation notification state
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  // Scroll listener for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Escape listener & body scroll lock for mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Focus search input when search is opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle geolocation explicitly requested by user
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation not supported by this browser.');
      return;
    }
    setGeoStatus('Locating nearby stages…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus(`Active stage radar locked (Lat: ${pos.coords.latitude.toFixed(2)}, Lng: ${pos.coords.longitude.toFixed(2)})`);
        setTimeout(() => setGeoStatus(null), 4000);
      },
      () => {
        setGeoStatus('Location access declined. Showing curated San Diego stages.');
        setTimeout(() => setGeoStatus(null), 4000);
      }
    );
  };

  // Open modal with safe mock performer
  const handleQuickTip = (
    name: string,
    id: string,
    amount: number,
    extra?: { photoUrl?: string; type?: 'artist' | 'band'; venue?: string; genres?: string[] }
  ) => {
    setActiveTipPerformer({
      id,
      name,
      slug: id,
      type: extra?.type || 'artist',
      genres: extra?.genres || ['Acoustic', 'Indie Folk'],
      isLive: true,
      isVerified: true,
      bio: extra?.type === 'band' ? 'Live energetic indie band' : 'Live acoustic performer',
      photoUrl: extra?.photoUrl || '/stitch/luna_hollis_stage.jpg',
      currentVenueName: extra?.venue || 'The Gaslamp Stage',
      distanceMiles: 0.3,
      latitude: 32.7157,
      longitude: -117.1611,
      popularityScore: 94,
      followersCount: 3412,
    });
    setSelectedFeeAmount(amount);
    setIsTipModalOpen(true);
  };

  // Calculate live fee numbers for fee calculator
  const techFee = (selectedFeeAmount * 0.06).toFixed(2);
  const stripeFee = (selectedFeeAmount * 0.029 + 0.3).toFixed(2);
  const netReceived = (selectedFeeAmount - parseFloat(techFee) - parseFloat(stripeFee)).toFixed(2);
  const netPercent = ((parseFloat(netReceived) / selectedFeeAmount) * 100).toFixed(1);

  // Performer cards and map locations data
  interface MapLocationItem {
    id: string;
    name: string;
    category: 'solo' | 'band' | 'fan';
    categoryLabel: string;
    categoryIcon: string;
    badgeColor: string;
    venue: string;
    rawVenue: string;
    meta: string;
    image?: string;
    defaultTip: number;
    distance: string;
    walkTime: string;
    supporters: string;
    mapCoords: { left: string; top: string };
    status: string;
    genres: string[];
    isTopThreeCard: boolean;
  }

  const mapLocations: MapLocationItem[] = [
    {
      id: 'jake-rios',
      name: 'Jake Rios',
      category: 'solo',
      categoryLabel: 'Solo Musician',
      categoryIcon: '🎸',
      badgeColor: '#8B5CF6',
      venue: 'The Gaslamp Stage • 0.3 mi away',
      rawVenue: 'The Gaslamp Stage (Main Stage)',
      meta: 'Acoustic • Indie Folk • 96 listeners',
      image: '/instagram/repost_5_gaslamp_solo.jpg',
      defaultTip: 10,
      distance: '0.3 mi away',
      walkTime: '3 min walk',
      supporters: '28 supporters checked in',
      mapCoords: { left: '55%', top: '58%' },
      status: 'Live Acoustic Session',
      genres: ['Acoustic', 'Indie Folk'],
      isTopThreeCard: true,
    },
    {
      id: 'the-sunsets',
      name: 'The Sunsets',
      category: 'band',
      categoryLabel: 'Live Band (4-Piece)',
      categoryIcon: '🥁',
      badgeColor: '#F59E0B',
      venue: 'The Casbah Live Den • 0.8 mi away',
      rawVenue: 'The Casbah Live Stage',
      meta: 'Alternative Rock • 142 listeners',
      image: '/instagram/repost_4_velvet_room_band.jpg',
      defaultTip: 10,
      distance: '0.8 mi away',
      walkTime: '9 min walk',
      supporters: '54 supporters checked in',
      mapCoords: { left: '36%', top: '24%' },
      status: 'High-Energy Live Set',
      genres: ['Alternative Rock', 'Indie'],
      isTopThreeCard: true,
    },
    {
      id: 'pacific-echoes',
      name: 'Pacific Echoes',
      category: 'band',
      categoryLabel: 'Indie Duo Band',
      categoryIcon: '🎸',
      badgeColor: '#F59E0B',
      venue: 'Ocean Beach Pavilion • 1.2 mi away',
      rawVenue: 'Ocean Beach Amphitheater',
      meta: 'Coastal Indie • Vocal Duo • 88 listeners',
      image: '/instagram/repost_2_stage_lead.jpg',
      defaultTip: 10,
      distance: '1.2 mi away',
      walkTime: '14 min walk',
      supporters: '19 supporters checked in',
      mapCoords: { left: '16%', top: '68%' },
      status: 'Sunset Soundcheck',
      genres: ['Coastal Indie', 'Vocal Duo'],
      isTopThreeCard: true,
    },
    {
      id: 'elena-cruz',
      name: 'Elena Cruz',
      category: 'solo',
      categoryLabel: 'Solo Musician',
      categoryIcon: '🎻',
      badgeColor: '#8B5CF6',
      venue: 'Little Italy Piazza • 0.5 mi away',
      rawVenue: 'Little Italy Piazza Del Sol',
      meta: 'Violin & Ambient Loop • 74 listeners',
      image: '/instagram/repost_3_acoustic_boardwalk.jpg',
      defaultTip: 10,
      distance: '0.5 mi away',
      walkTime: '6 min walk',
      supporters: '33 supporters checked in',
      mapCoords: { left: '38%', top: '42%' },
      status: 'Live Electric Violin',
      genres: ['Violin', 'Ambient Loop'],
      isTopThreeCard: false,
    },
    {
      id: 'harbor-brass',
      name: 'Harbor Brass Ensemble',
      category: 'band',
      categoryLabel: '6-Piece Live Band',
      categoryIcon: '🎺',
      badgeColor: '#F59E0B',
      venue: 'Embarcadero Marina • 1.4 mi away',
      rawVenue: 'Embarcadero South Stage',
      meta: 'Brass Funk & Jazz • 115 listeners',
      image: '/instagram/repost_9_horn_section.jpg',
      defaultTip: 10,
      distance: '1.4 mi away',
      walkTime: '18 min walk',
      supporters: '42 supporters checked in',
      mapCoords: { left: '74%', top: '70%' },
      status: 'Live Brass Jam',
      genres: ['Brass Funk', 'Jazz Ensemble'],
      isTopThreeCard: false,
    },
    {
      id: 'fan-nearby',
      name: 'You (Nearby Fan)',
      category: 'fan',
      categoryLabel: 'Fan Location Nearby',
      categoryIcon: '🎧',
      badgeColor: '#10B981',
      venue: 'Gaslamp Quarter, 5th & Market',
      rawVenue: 'Your Current Position (Downtown)',
      meta: 'Live stage radar active • 5 performers nearby',
      defaultTip: 0,
      distance: '0.0 mi',
      walkTime: 'You are here',
      supporters: 'Stage Radar Locked',
      mapCoords: { left: '48%', top: '50%' },
      status: 'Active Radar',
      genres: ['Live Music Discovery'],
      isTopThreeCard: false,
    },
  ];

  // The 3 cards to display on the left
  const livePerformers = mapLocations.filter((item) => item.isTopThreeCard);
  const selectedLocation = mapLocations.find((loc) => loc.id === selectedLocationId) || mapLocations[0];

  const handleZoomIn = () => setMapZoom((prev) => Math.min(2.2, parseFloat((prev + 0.25).toFixed(2))));
  const handleZoomOut = () => setMapZoom((prev) => Math.max(0.85, parseFloat((prev - 0.25).toFixed(2))));
  const handleResetZoom = () => {
    setMapZoom(1.15);
    setMapPan({ x: 0, y: 0 });
    setSelectedLocationId('fan-nearby');
  };

  const handleMapMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    setIsMapDragging(true);
    mapDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panX: mapPan.x,
      panY: mapPan.y,
    };
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (!isMapDragging) return;
    const dx = e.clientX - mapDragStartRef.current.startX;
    const dy = e.clientY - mapDragStartRef.current.startY;
    const maxPanX = 160 * (mapZoom - 0.4);
    const maxPanY = 120 * (mapZoom - 0.4);
    setMapPan({
      x: Math.max(-maxPanX, Math.min(maxPanX, mapDragStartRef.current.panX + dx)),
      y: Math.max(-maxPanY, Math.min(maxPanY, mapDragStartRef.current.panY + dy)),
    });
  };

  const handleMapMouseUp = () => {
    setIsMapDragging(false);
  };

  const handleMapWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setMapZoom((prev) => Math.max(0.85, Math.min(2.2, parseFloat((prev + delta).toFixed(2)))));
  };

  const handleMapDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    setMapZoom((prev) => Math.min(2.2, parseFloat((prev + 0.35).toFixed(2))));
  };

  const handleMapTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if ((e.target as HTMLElement).closest('button, a, input')) return;
      setIsMapDragging(true);
      mapDragStartRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        panX: mapPan.x,
        panY: mapPan.y,
      };
    }
  };

  const handleMapTouchMove = (e: React.TouchEvent) => {
    if (!isMapDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - mapDragStartRef.current.startX;
    const dy = e.touches[0].clientY - mapDragStartRef.current.startY;
    const maxPanX = 160 * (mapZoom - 0.4);
    const maxPanY = 120 * (mapZoom - 0.4);
    setMapPan({
      x: Math.max(-maxPanX, Math.min(maxPanX, mapDragStartRef.current.panX + dx)),
      y: Math.max(-maxPanY, Math.min(maxPanY, mapDragStartRef.current.panY + dy)),
    });
  };

  const handleMapTouchEnd = () => {
    setIsMapDragging(false);
  };

  const getScaleBarInfo = (zoom: number) => {
    if (zoom >= 1.6) {
      return { width: 70, label: '250 ft (75 m)', mode: 'Street Level' };
    } else if (zoom >= 1.3) {
      return { width: 85, label: '500 ft (150 m)', mode: 'Neighborhood Level' };
    } else if (zoom >= 1.0) {
      return { width: 95, label: '0.25 mi (400 m)', mode: 'District Level' };
    } else {
      return { width: 110, label: '0.5 mi (800 m)', mode: 'Metro Level' };
    }
  };
  const scaleBar = getScaleBarInfo(mapZoom);

  const isLocationHighlighted = (category: 'solo' | 'band' | 'fan') => {
    if (activeFilter === 'All Live (14)') return true;
    if (activeFilter === '● Solo Artists') return category === 'solo' || category === 'fan';
    if (activeFilter === 'Bands & Ensembles') return category === 'band' || category === 'fan';
    if (activeFilter === 'Acoustic & Folk') return category === 'solo' || category === 'fan';
    if (activeFilter === 'Indie Rock') return category === 'band' || category === 'fan';
    return true;
  };

  return (
    <div
      className="cb-landing-root"
      style={{
        backgroundColor: isLight ? '#FCF8FB' : '#07080D',
        color: isLight ? '#1B1B1D' : '#F5F5F7',
        fontFamily: 'var(--font-inter, Inter, sans-serif)',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PHASE 4: STICKY GLOBAL HEADER                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          zIndex: 50,
          backgroundColor: '#1D1D1F',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: isScrolled
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isScrolled
            ? '0 4px 20px rgba(0, 0, 0, 0.5)'
            : 'none',
          transition: 'all 0.25s ease-in-out',
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            height: 52,
            margin: '0 auto',
            padding: '0 clamp(16px, 4vw, 36px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Brand Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
            aria-label="Crowdbeats Home"
          >
            <CrowdbeatsLogo variant="horizontal" height={26} surface="dark" priority />
          </Link>

          {/* Center Navigation (Desktop) */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 28,
            }}
            className="md-nav-cluster"
          >
            {[
              { label: 'Discover', href: '#discovery-stage' },
              { label: 'For Artists', href: '#artist-story' },
              { label: 'Campaigns', href: '/creator/campaigns' },
              { label: 'How It Works', href: '#three-steps' },
              { label: 'Safety', href: '#trust-safety' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Controls: Search, Theme, Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search Button */}
            <button
              type="button"
              aria-label="Search live stages and performers"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>

            {/* Sign In */}
            <Link
              href="/auth"
              style={{
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                padding: '6px 10px',
              }}
            >
              Sign In
            </Link>

            {/* Get Started Button */}
            <Link
              href="/auth?mode=register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 32,
                padding: '0 14px',
                borderRadius: 8,
                backgroundColor: '#7C3AED',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              Get Started
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              aria-label="Open mobile navigation menu"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md-mobile-menu-btn"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search Overlay Drawer */}
        {isSearchOpen && (
          <div
            style={{
              padding: '12px clamp(16px, 4vw, 36px)',
              backgroundColor: '#1D1D1F',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              maxWidth: 1440,
              margin: '0 auto',
            }}
          >
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, town, artist, or venue…"
              style={{
                flex: 1,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #262629',
                backgroundColor: '#0A0A0B',
                color: '#FFFFFF',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#A1A1AA',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </header>

      {/* Mobile Drawer (Sheet) with Escape, backdrop, focus trap */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMobileMenuOpen(false);
          }}
        >
          <div
            style={{
              width: '82%',
              maxWidth: 320,
              height: '100%',
              backgroundColor: '#1D1D1F',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <span style={{ fontFamily: 'var(--font-manrope, Manrope, sans-serif)', fontWeight: 800, fontSize: 18, color: '#FFFFFF' }}>
                  Menu
                </span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  { label: 'Discover', href: '#discovery-stage' },
                  { label: 'For Artists', href: '#artist-story' },
                  { label: 'Campaigns', href: '/creator/campaigns' },
                  { label: 'How It Works', href: '#three-steps' },
                  { label: 'Safety & Trust', href: '#trust-safety' },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#F5F5F7',
                      textDecoration: 'none',
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 24, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Link
                href="/auth?mode=register"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 10,
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
                Get Started
              </Link>
              <Link
                href="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PHASE 5A: HERO SECTION (4K CONCERT STAGE & 3-PHONE MASTER)         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          backgroundColor: '#1D1D1F',
          color: '#FFFFFF',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >

        {/* SEO & Screen Reader Accessibility */}
        <h1 className="sr-only">
          Discover. Confirm. Tip. — Find live music. Support the moment.
        </h1>
        <p className="sr-only">
          Crowdbeats helps fans discover live musicians nearby, confirm a payment method, and tip in three simple taps—while artists earn, fund what comes next, and grow a following.
        </p>

        {/* Hero Master Showcase — lounge stage (5016×2463 master, responsive WebP) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 1920,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#1D1D1F',
          }}
        >
          <picture style={{ width: '100%', display: 'block', aspectRatio: '5016 / 2463' }}>
            {/* Browser picks the smallest variant covering rendered width × DPR */}
            <source
              type="image/webp"
              srcSet="/hero5_1080.webp?v=1 1080w, /hero5_1920.webp?v=1 1920w, /hero5_3840.webp?v=1 3840w"
              sizes="(max-width: 1920px) 100vw, 1920px"
            />
            {/* Full-resolution master fallback */}
            <img
              src="/hero5.jpg?v=1"
              alt="Crowdbeats at a live music lounge — Velvet Miles performing on stage while fans hold phones showing Discover, Confirm a $10 tip, and Tip sent"
              width={5016}
              height={2463}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              style={{
                position: 'relative',
                width: '100%',
                height: 'auto',
                aspectRatio: '5016 / 2463',
                display: 'block',
                objectFit: 'contain',
                backgroundColor: '#1D1D1F',
              }}
            />
          </picture>

          {/* Bottom fade: blends the photo's busy lower edge into the CTA strip (stays below the phones) */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '8%',
              background: 'linear-gradient(180deg, rgba(29, 29, 31, 0) 0%, rgba(29, 29, 31, 0.7) 60%, #1D1D1F 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Action CTAs & Trust Badges — Seamlessly below the hero visual */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: 960,
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: '0 auto',
            padding: '20px 24px clamp(32px, 4vw, 48px)',
            backgroundColor: '#1D1D1F',
          }}
        >
          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
            <a
              href="#discovery-stage"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 9999,
                backgroundColor: '#7C3AED',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 24px rgba(124, 58, 237, 0.55), 0 2px 8px rgba(0, 0, 0, 0.4)',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
              </svg>
              Find Live Music
            </a>
            <a
              href="#artist-story"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 9999,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                transition: 'background-color 0.15s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
              </svg>
              Join as an Artist
            </a>
          </div>

          <p style={{ fontSize: 13, color: '#A1A1AA', letterSpacing: '0.02em', margin: 0, textShadow: '0 1px 8px rgba(0, 0, 0, 0.8)' }}>
            Free to join • Secure payments • Built for solo artists and bands
          </p>
        </div>
      </section>

{/* PHASE 5B: HOW IT WORKS — 8K MASTER SHOWCASE (CRISP 8K ON WHITE)   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="three-steps"
        style={{
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: 'clamp(64px, 8vw, 104px) clamp(16px, 3vw, 40px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 1640, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40, maxWidth: 840, margin: '0 auto 40px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.04)', color: '#000000', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 18 }}>
              How It Works
            </span>
            <h2 style={{ fontFamily: 'var(--cb-font-display)', fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.024em', lineHeight: 1.15, margin: '0 0 14px', color: '#000000' }}>
              Fans find the music. Musicians feel the support.
            </h2>
            <p style={{ fontSize: 16, color: '#000000', lineHeight: 1.6, margin: '0 auto', maxWidth: 640 }}>
              Discover live musicians nearby, follow your favorites, and send a tip in moments. Performing solo or with a band? Get discovered, receive tips, and cash out to your bank.
            </p>
          </div>

          {/* 6-Phone Mockup Showcase (Full Width, Pure White Background, Lossless Responsive Display) */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 1640,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
            }}
          >
            <picture style={{ width: '100%', display: 'block', aspectRatio: '7680 / 2281' }}>
              {/* Desktop viewports (>= 768px): Deliver Full 7680w Ultra-Res Master or 3840w 4K */}
              <source
                media="(min-width: 768px)"
                type="image/webp"
                srcSet="/crowdbeats_mockups_ultra.webp?v=7680ultra 7680w, /crowdbeats_mockups_3840.webp?v=7680ultra 3840w"
                sizes="(max-width: 1640px) 100vw, 1640px"
              />
              <source
                media="(min-width: 768px)"
                type="image/png"
                srcSet="/Crowdbeats-Second-Section-master-png.png?v=7680ultra 7680w, /crowdbeats_mockups_3840.png?v=7680ultra 3840w"
                sizes="(max-width: 1640px) 100vw, 1640px"
              />
              {/* Mobile viewports (< 768px): Optimized mobile tiers */}
              <source
                type="image/webp"
                srcSet="/crowdbeats_mockups_2048.webp?v=7680ultra 2048w, /crowdbeats_mockups_1024.webp?v=7680ultra 1024w"
                sizes="100vw"
              />
              <source
                type="image/png"
                srcSet="/crowdbeats_mockups_2048.png?v=7680ultra 2048w, /crowdbeats_mockups_1024.png?v=7680ultra 1024w"
                sizes="100vw"
              />
              <img
                src="/Crowdbeats-Second-Section-master-png.png?v=7680ultra"
                alt="Crowdbeats 6-Phone App Experience — Discover, Confirm Payment, Tip Sent, Verify Identity, Play & Receive Tips, Cash Out"
                width={7680}
                height={2281}
                loading="eager"
                decoding="async"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '7680 / 2281',
                  display: 'block',
                  objectFit: 'contain',
                  imageRendering: 'auto',
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                  backgroundColor: '#FFFFFF',
                }}
              />
            </picture>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PHASE 5C: LIVE STAGE RADAR — REAL GOOGLE MAPS                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <LandingMapSection isLight={isLight} />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PHASE 5D: ARTIST STORY (DARK ELEVATED OBSIDIAN PANEL)              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="artist-story"
        style={{
          position: 'relative',
          width: '100%',
          backgroundColor: '#07080B',
          color: '#FFFFFF',
          overflow: 'hidden',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 48px)',
        }}
      >
        {/* Full-bleed Ambient Glows */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: '2%',
            width: 640,
            height: 640,
            borderRadius: '50%',
            backgroundColor: 'rgba(124, 58, 237, 0.22)',
            filter: 'blur(160px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            left: '2%',
            width: 540,
            height: 540,
            borderRadius: '50%',
            backgroundColor: 'rgba(45, 212, 191, 0.12)',
            filter: 'blur(150px)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            width: '100%',
            position: 'relative',
            zIndex: 2,
          }}
        >

          {/* Heading */}
          <div style={{ maxWidth: 720, marginBottom: 48, position: 'relative', zIndex: 2 }}>
            <span
              style={{
                color: '#2DD4BF',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 8,
              }}
            >
              For Solo Artists and Bands
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-manrope, Manrope, sans-serif)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                margin: '0 0 14px',
                color: '#FFFFFF',
              }}
            >
              Play. Earn. Grow.
            </h2>
            <p style={{ fontSize: 16, color: '#D4D4D8', lineHeight: 1.6, margin: 0 }}>
              Go live, receive tips, launch campaigns, and turn a passing crowd into the people who come back. No upfront fees, no confusing equipment.
            </p>
          </div>

          {/* 3 Pillars */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
              marginBottom: 48,
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Pillar 1: Go Live */}
            <div
              style={{
                backgroundColor: '#161618',
                borderRadius: 20,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    marginBottom: 20,
                  }}
                >
                  📡
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#FFFFFF' }}>
                  Instant Stage Check-In
                </h3>
                <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.6, margin: '0 0 20px' }}>
                  Check in to any venue in 10 seconds. Your dynamic QR code displays instantly on your phone or mic stand. Fans tip via Google Pay or card without downloading an app.
                </p>
              </div>
              <div
                style={{
                  backgroundColor: '#0F0F11',
                  padding: '10px 14px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: '#D4D4D8',
                }}
              >
                <span style={{ color: '#2DD4BF' }}>▦</span>
                Instant stage token ready
              </div>
            </div>

            {/* Pillar 2: Earn (Interactive Fee Calculator) */}
            <div
              style={{
                backgroundColor: '#161618',
                borderRadius: 20,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    marginBottom: 20,
                  }}
                >
                  💳
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#FFFFFF' }}>
                  Real-Time Direct Deposit
                </h3>
                <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.6, margin: '0 0 16px' }}>
                  Transparent 6% platform fee. Connect via Stripe and receive direct funds before you leave the stage.
                </p>
              </div>

              {/* Fee Calculator Interactive Widget */}
              <div
                style={{
                  backgroundColor: '#0F0F11',
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#A1A1AA' }}>Simulate Tip</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {feeAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSelectedFeeAmount(amt)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: selectedFeeAmount === amt ? '#7C3AED' : '#262629',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: '#A1A1AA', paddingTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Platform Tech Fee (6%)</span>
                    <span>-${techFee}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Stripe Connect (2.9% + 30¢)</span>
                    <span>-${stripeFee}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2DD4BF', fontWeight: 700, paddingTop: 6, borderTop: '1px solid #262629' }}>
                    <span>You Receive</span>
                    <span>${netReceived} ({netPercent}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 3: Grow */}
            <div
              style={{
                backgroundColor: '#161618',
                borderRadius: 20,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    marginBottom: 20,
                  }}
                >
                  👥
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#FFFFFF' }}>
                  Turn Crowds Into Patrons
                </h3>
                <p style={{ fontSize: 14, color: '#A1A1AA', lineHeight: 1.6, margin: '0 0 20px' }}>
                  Every fan who tips can opt-in to follow you. When you book a new gig or launch an album crowdfund, reach them directly with zero social algorithm penalties.
                </p>
              </div>
              <div
                style={{
                  backgroundColor: '#0F0F11',
                  padding: '10px 14px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: '#D4D4D8',
                }}
              >
                <span style={{ color: '#D8B4FE' }}>🔔</span>
                100% direct fan delivery
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              paddingTop: 24,
              borderTop: '1px solid #262629',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href="/onboarding/artist"
                style={{
                  padding: '12px 24px',
                  borderRadius: 9999,
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
                }}
              >
                Launch Artist Studio
              </Link>
              <a
                href="#three-steps"
                style={{
                  padding: '12px 24px',
                  borderRadius: 9999,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                See How It Works
              </a>
            </div>
            <p style={{ fontSize: 12, color: '#A1A1AA', margin: 0, maxWidth: 440 }}>
              Free to join. Crowdbeats charges a transparent 6% platform technology fee per voluntary tip transaction; Stripe payment processing is separate.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PHASE 5E: BESPOKE 2×2 FEATURE BENTO GRID                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          width: '100%',
          backgroundColor: isLight ? '#FFFFFF' : '#0E0E12',
          borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
          borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
          padding: 'clamp(72px, 9vw, 120px) clamp(20px, 4vw, 48px)',
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 28,
            }}
          >
          {/* Feature A: Artist Campaigns (Light Panel) */}
          <div
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#141416',
              borderRadius: 24,
              padding: 'clamp(28px, 4vw, 40px)',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${isLight ? '#EAE7EA' : 'rgba(255,255,255,0.06)'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ color: '#7C3AED', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Artist Campaigns
              </span>
              <h3 style={{ fontFamily: 'var(--font-manrope, Manrope, sans-serif)', fontSize: 24, fontWeight: 700, margin: '0 0 10px', color: isLight ? '#1B1B1D' : '#FFFFFF' }}>
                Fund what comes next.
              </h3>
              <p style={{ fontSize: 14, color: isLight ? '#4A4455' : '#A1A1AA', lineHeight: 1.6, margin: '0 0 24px' }}>
                Enable fans to crowdfund your upcoming vinyl pressing, tour gas, or studio time with zero monthly subscriptions.
              </p>

              {/* Inset Campaign Card */}
              <div
                style={{
                  backgroundColor: isLight ? '#F6F3F5' : '#1F1F23',
                  padding: 18,
                  borderRadius: 16,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: isLight ? '#1B1B1D' : '#FFFFFF' }}>
                    EP Recording: "Coastal Rain"
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 9999, backgroundColor: 'rgba(45, 212, 191, 0.15)', color: '#0F766E' }}>
                    81% Funded
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, backgroundColor: isLight ? '#EAE7EA' : '#262629', borderRadius: 9999, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ width: '81%', height: '100%', backgroundColor: '#7C3AED' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: isLight ? '#4A4455' : '#A1A1AA' }}>
                  <span><strong>$4,850</strong> pledged</span>
                  <span>Goal: $6,000</span>
                  <span>142 backers</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: `1px solid ${isLight ? '#F0EDEF' : '#262629'}` }}>
              <span style={{ fontSize: 12, color: isLight ? '#7B7487' : '#71717A' }}>All-or-keep flexibility • Instant payouts</span>
              <Link
                href="/creator/campaigns"
                style={{ color: '#7C3AED', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
              >
                Explore Campaigns →
              </Link>
            </div>
          </div>

          {/* Feature B: Fan Direct (Dark Obsidian Panel) */}
          <div
            style={{
              backgroundColor: '#161618',
              borderRadius: 24,
              padding: 'clamp(28px, 4vw, 40px)',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ color: '#2DD4BF', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Fan Direct
              </span>
              <h3 style={{ fontFamily: 'var(--font-manrope, Manrope, sans-serif)', fontSize: 24, fontWeight: 700, margin: '0 0 10px', color: '#FFFFFF' }}>
                Turn listeners into regulars.
              </h3>
              <p style={{ fontSize: 14, color: '#D4D4D8', lineHeight: 1.6, margin: '0 0 24px' }}>
                Own your fan relationships completely. Notify local followers 2 hours before you go live at a nearby venue.
              </p>

              {/* Fan Alert Mockup */}
              <div
                style={{
                  backgroundColor: '#202024',
                  padding: 16,
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(45, 212, 191, 0.2)', color: '#2DD4BF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    💬
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>Automated Stage Alert</span>
                    <span style={{ fontSize: 11, color: '#A1A1AA' }}>Delivered to 482 nearby San Diego patrons</span>
                  </div>
                </div>
                <div style={{ backgroundColor: '#141416', padding: '10px 12px', borderRadius: 10, fontSize: 12, color: '#D4D4D8', fontStyle: 'italic' }}>
                  "Luna Hollis is on stage at The Sunset Lounge in 20 minutes! Acoustic session starting."
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #262629' }}>
              <span style={{ fontSize: 12, color: '#A1A1AA' }}>Zero algorithmic throttling</span>
              <Link
                href="/fan/following"
                style={{ color: '#2DD4BF', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
              >
                See Fan Tools →
              </Link>
            </div>
          </div>

          {/* Feature C: Band Split Smart Engine (Light Panel) */}
          <div
            style={{
              backgroundColor: isLight ? '#F6F3F5' : '#141416',
              borderRadius: 24,
              padding: 'clamp(28px, 4vw, 40px)',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${isLight ? '#EAE7EA' : 'rgba(255,255,255,0.06)'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ color: '#7C3AED', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Band Engine
              </span>
              <h3 style={{ fontFamily: 'var(--font-manrope, Manrope, sans-serif)', fontSize: 24, fontWeight: 700, margin: '0 0 10px', color: isLight ? '#1B1B1D' : '#FFFFFF' }}>
                One band. Clear splits.
              </h3>
              <p style={{ fontSize: 14, color: isLight ? '#4A4455' : '#A1A1AA', lineHeight: 1.6, margin: '0 0 24px' }}>
                Zero drama band payout engine. Tips and merchandise proceeds are automatically calculated and disbursed directly to individual member bank accounts.
              </p>

              {/* Inset Split Visualizer */}
              <div
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : '#1F1F23',
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: isLight ? '#4A4455' : '#A1A1AA', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, color: isLight ? '#1B1B1D' : '#FFFFFF' }}>The Neon Soundwave (4 Members)</span>
                  <span>Tip Pool: $100.00</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center', fontSize: 11 }}>
                  <div style={{ backgroundColor: isLight ? '#F0EDEF' : '#262629', padding: '8px 4px', borderRadius: 8 }}>
                    <span style={{ display: 'block', color: '#7C3AED', fontWeight: 800 }}>40%</span>
                    <span>Vocals</span>
                  </div>
                  <div style={{ backgroundColor: isLight ? '#F0EDEF' : '#262629', padding: '8px 4px', borderRadius: 8 }}>
                    <span style={{ display: 'block', color: '#7C3AED', fontWeight: 800 }}>25%</span>
                    <span>Keys</span>
                  </div>
                  <div style={{ backgroundColor: isLight ? '#F0EDEF' : '#262629', padding: '8px 4px', borderRadius: 8 }}>
                    <span style={{ display: 'block', color: '#7C3AED', fontWeight: 800 }}>20%</span>
                    <span>Drums</span>
                  </div>
                  <div style={{ backgroundColor: isLight ? '#F0EDEF' : '#262629', padding: '8px 4px', borderRadius: 8 }}>
                    <span style={{ display: 'block', color: '#7C3AED', fontWeight: 800 }}>15%</span>
                    <span>Bass</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: `1px solid ${isLight ? '#EAE7EA' : '#262629'}` }}>
              <span style={{ fontSize: 12, color: isLight ? '#7B7487' : '#71717A' }}>Direct individual 1099 tracking</span>
              <Link
                href="/band/splits"
                style={{ color: '#7C3AED', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
              >
                Multi-Member Splits →
              </Link>
            </div>
          </div>

          {/* Feature D: Dynamic Stage Placard & QR (Obsidian Dark Panel) */}
          <div
            style={{
              backgroundColor: '#0A0A0B',
              borderRadius: 24,
              padding: 'clamp(28px, 4vw, 40px)',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ color: '#2DD4BF', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Touchless In-Person
              </span>
              <h3 style={{ fontFamily: 'var(--font-manrope, Manrope, sans-serif)', fontSize: 24, fontWeight: 700, margin: '0 0 10px', color: '#FFFFFF' }}>
                Support starts with a scan.
              </h3>
              <p style={{ fontSize: 14, color: '#D4D4D8', lineHeight: 1.6, margin: '0 0 24px' }}>
                Print high-resolution stage tokens or project dynamic QR on venue monitors. Includes NFC tap compatibility for instant frictionless support.
              </p>

              {/* Placard Inset */}
              <div
                style={{
                  backgroundColor: '#18181C',
                  padding: 20,
                  borderRadius: 16,
                  textAlign: 'center',
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 72,
                    height: 72,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    color: '#000000',
                    fontSize: 36,
                    marginBottom: 8,
                  }}
                >
                  ▦
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>crowdbeats.ai/luna-hollis</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#A1A1AA' }}>Tap phone or scan camera to support</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #262629' }}>
              <span style={{ fontSize: 12, color: '#A1A1AA' }}>Vector PDF & PNG generator included</span>
              <Link
                href="/creator/dashboard"
                style={{ color: '#2DD4BF', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
              >
                Download Kit →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PHASE 5F: TRUST AND CLARITY SECTION                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="trust-safety"
        style={{
          width: '100%',
          backgroundColor: isLight ? '#F8F6F8' : '#07080B',
          borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
          borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
          padding: 'clamp(72px, 9vw, 120px) clamp(20px, 4vw, 48px)',
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            width: '100%',
          }}
        >
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
          <span style={{ color: '#7C3AED', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            High Trust Guarantee
          </span>
          <h2 style={{ fontFamily: 'var(--font-manrope, Manrope, sans-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: isLight ? '#1B1B1D' : '#F5F5F7' }}>
            Designed for clarity. Built on integrity.
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
          }}
        >
          {/* Pillar 1 */}
          <div
            style={{
              padding: 24,
              borderRadius: 20,
              backgroundColor: isLight ? '#F6F3F5' : '#161618',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: isLight ? '#FFFFFF' : '#232328', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#7C3AED', marginBottom: 14 }}>
              🛡
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: isLight ? '#1B1B1D' : '#FFFFFF' }}>
              Verified Performers
            </h4>
            <p style={{ fontSize: 13, color: isLight ? '#4A4455' : '#A1A1AA', lineHeight: 1.5, margin: 0 }}>
              GPS geo-verified check-ins ensure fans support the exact musician performing live on that stage, preventing impersonation.
            </p>
          </div>

          {/* Pillar 2 */}
          <div
            style={{
              padding: 24,
              borderRadius: 20,
              backgroundColor: isLight ? '#F6F3F5' : '#161618',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: isLight ? '#FFFFFF' : '#232328', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#006B5F', marginBottom: 14 }}>
              🔒
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: isLight ? '#1B1B1D' : '#FFFFFF' }}>
              Stripe-Powered Security
            </h4>
            <p style={{ fontSize: 13, color: isLight ? '#4A4455' : '#A1A1AA', lineHeight: 1.5, margin: 0 }}>
              Bank-grade encryption, Stripe Connect compliance, and instant real-time bank deposits with complete PCI-DSS conformance.
            </p>
          </div>

          {/* Pillar 3 */}
          <div
            style={{
              padding: 24,
              borderRadius: 20,
              backgroundColor: isLight ? '#F6F3F5' : '#161618',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: isLight ? '#FFFFFF' : '#232328', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#7C3AED', marginBottom: 14 }}>
              🏷
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: isLight ? '#1B1B1D' : '#FFFFFF' }}>
              100% Upfront Pricing
            </h4>
            <p style={{ fontSize: 13, color: isLight ? '#4A4455' : '#A1A1AA', lineHeight: 1.5, margin: 0 }}>
              Crowdbeats charges a transparent 6% technology fee. No hidden service margins, monthly subscription lock-ins, or cashout penalties.
            </p>
          </div>

          {/* Pillar 4 */}
          <div
            style={{
              padding: 24,
              borderRadius: 20,
              backgroundColor: isLight ? '#F6F3F5' : '#161618',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: isLight ? '#FFFFFF' : '#232328', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#006B5F', marginBottom: 14 }}>
              ⚖
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: isLight ? '#1B1B1D' : '#FFFFFF' }}>
              Safety & Fair Disputes
            </h4>
            <p style={{ fontSize: 13, color: isLight ? '#4A4455' : '#A1A1AA', lineHeight: 1.5, margin: 0 }}>
              Real human dispute review, DMCA safe harbor, and active stage moderation honoring California state consumer protection law.
            </p>
          </div>
        </div>
      </div>
    </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PHASE 5G: FINAL CALL TO ACTION SECTION                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          backgroundColor: isLight ? '#FFFFFF' : '#0A0A0D',
          borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
          padding: 'clamp(96px, 12vw, 160px) clamp(20px, 4vw, 48px)',
          overflow: 'hidden',
        }}
      >
        {/* Subtle ambient lighting */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 720,
            height: 420,
            borderRadius: '50%',
            backgroundColor: 'rgba(124, 58, 237, 0.08)',
            filter: 'blur(140px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            maxWidth: 840,
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <span style={{ color: '#7C3AED', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
            Get Started Today
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-manrope, Manrope, sans-serif)',
              fontSize: 'clamp(28px, 4.5vw, 42px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 16px',
              maxWidth: 640,
              color: isLight ? '#1B1B1D' : '#F5F5F7',
            }}
          >
            Ready to hear what’s happening nearby?
          </h2>
          <p style={{ fontSize: 16, color: isLight ? '#4A4455' : '#A1A1AA', lineHeight: 1.6, maxWidth: 580, margin: '0 auto 36px' }}>
            Find a live artist, support the music, or take the stage with Crowdbeats. Free for all fans and artists forever.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
            <a
              href="#discovery-stage"
              style={{
                padding: '14px 28px',
                borderRadius: 9999,
                backgroundColor: '#7C3AED',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35)',
              }}
            >
              Find Live Music
            </a>
            <a
              href="#artist-story"
              style={{
                padding: '14px 28px',
                borderRadius: 9999,
                backgroundColor: isLight ? '#FFFFFF' : '#232328',
                border: `1px solid ${isLight ? '#EAE7EA' : 'rgba(255,255,255,0.1)'}`,
                color: isLight ? '#1B1B1D' : '#FFFFFF',
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Join as an Artist
            </a>
          </div>

          <Link
            href="/auth"
            style={{
              fontSize: 13,
              color: isLight ? '#4A4455' : '#A1A1AA',
              textDecoration: 'none',
            }}
          >
            Already a member? <span style={{ fontWeight: 700, color: '#7C3AED', textDecoration: 'underline' }}>Sign in</span>
          </Link>
        </div>
      </section>

      {/* Tip Modal Gate */}
      {activeTipPerformer && (
        <TipAuthGateModal
          isOpen={isTipModalOpen}
          onClose={() => {
            setIsTipModalOpen(false);
            setActiveTipPerformer(null);
          }}
          performerId={activeTipPerformer.id}
          performerSlug={activeTipPerformer.slug}
          performerName={activeTipPerformer.name}
          performerType={activeTipPerformer.type}
          initialAmountCents={selectedFeeAmount * 100}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PHASE 6: GLOBAL FOOTER (100% IA & Legal Preserved)                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <CbFooter />

      {/* Responsive styling overrides */}
      <style jsx global>{`
        @media (min-width: 768px) {
          .md-nav-cluster {
            display: flex !important;
          }
          .md-mobile-menu-btn {
            display: none !important;
          }
        }

        @media (max-width: 767px) {
          .md-nav-cluster {
            display: none !important;
          }
          .md-mobile-menu-btn {
            display: flex !important;
          }
        }

        @keyframes cb-radar-ping {
          0% { transform: scale(0.92); opacity: 0.7; }
          50% { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(0.92); opacity: 0.7; }
        }

        @keyframes cb-radar-wave {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.85; }
          50% { opacity: 0.45; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }

        @keyframes cb-dash-flow {
          to { stroke-dashoffset: -20; }
        }

        @keyframes cb-radar-sweep {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
