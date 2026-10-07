'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { DiscoveryLocation } from '@crowdbeats/contracts';
import {
  DEFAULT_DISCOVERY_LOCATION,
  CURATED_LOCATIONS,
  MOCK_PERFORMERS,
  DiscoveryClient,
  type PublicPerformerItem,
} from '@/lib/discovery/discoveryClient';
import { TipAuthGateModal } from '@/components/discovery/TipAuthGateModal';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CbFooter } from '@/components/ui/CbFooter';
import { AudioWaveformRibbon } from '@/components/landing/AudioWaveformRibbon';

export function Variation1ProMinimal() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedLocation, setSelectedLocation] = useState<DiscoveryLocation>(DEFAULT_DISCOVERY_LOCATION);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'live' | 'nearby' | 'popular' | 'venues'>('live');
  const [activePersona, setActivePersona] = useState<'artist' | 'band' | 'venue' | 'fan'>('artist');

  const [simulatorAmount, setSimulatorAmount] = useState<number>(25);
  const [bandSplitAmount, setBandSplitAmount] = useState<number>(100);

  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [activeTipPerformer, setActiveTipPerformer] = useState<PublicPerformerItem | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<DiscoveryLocation[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim().length > 1) {
      setSuggestions(DiscoveryClient.searchLocations(val));
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectLocation = (loc: DiscoveryLocation) => {
    setSelectedLocation(loc);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleTriggerTip = (performer: PublicPerformerItem) => {
    setActiveTipPerformer(performer);
    setIsTipModalOpen(true);
  };

  const filteredPerformers = MOCK_PERFORMERS.filter((p) => {
    if (selectedGenre !== 'All' && !p.genres.some((g) => g.toLowerCase().includes(selectedGenre.toLowerCase()))) {
      return false;
    }
    if (activeTab === 'live') return p.isLive;
    if (activeTab === 'popular') return p.popularRank != null;
    return true;
  });

  const genres = ['All', 'Acoustic', 'Indie Rock', 'Jazz & Soul', 'Folk', 'Electronic'];

  // 6% Platform fee + standard Stripe (2.9% + 30¢)
  const platformFeeNum = simulatorAmount * 0.06;
  const stripeFeeNum = simulatorAmount * 0.029 + 0.3;
  const artistTakeHomeNum = Math.max(0, simulatorAmount - platformFeeNum - stripeFeeNum);

  const platformFee = platformFeeNum.toFixed(2);
  const stripeFee = stripeFeeNum.toFixed(2);
  const artistTakeHome = artistTakeHomeNum.toFixed(2);
  const artistPercent = ((artistTakeHomeNum / simulatorAmount) * 100).toFixed(1);

  // Band Split
  const bandPlatformFeeNum = bandSplitAmount * 0.06;
  const bandStripeFeeNum = bandSplitAmount * 0.029 + 0.3;
  const netBandPool = Math.max(0, bandSplitAmount - bandPlatformFeeNum - bandStripeFeeNum);

  const splitJake = (netBandPool * 0.4).toFixed(2);
  const splitMaya = (netBandPool * 0.25).toFixed(2);
  const splitDevon = (netBandPool * 0.2).toFixed(2);
  const splitLeo = (netBandPool * 0.15).toFixed(2);

  return (
    <div
      className="cb-theme-transition"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--cb-bg-app, #050507)',
        color: 'var(--cb-text-primary, #FFFFFF)',
        fontFamily: 'var(--font-dm-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        overflowX: 'hidden',
      }}
    >
      {/* 1. APPLE MINIMAL STICKY NAVIGATION */}
      <header
        role="banner"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(16px, 4vw, 56px)',
          backgroundColor: 'var(--cb-surface-glass, rgba(15, 16, 23, 0.8))',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: 'linear-gradient(135deg, #7C3AED 0%, #38BDF8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isDark ? '0 4px 16px rgba(124, 58, 237, 0.35)' : '0 2px 8px rgba(124, 58, 237, 0.2)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 12V16M8 8V20M12 4V24M16 10V18M20 12V16" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--cb-text-primary, #FFFFFF)',
              }}
            >
              CROWDBEATS
            </span>
          </Link>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 10px',
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.10)',
              border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--cb-live-green, #10B981)',
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'var(--cb-live-green, #10B981)',
                boxShadow: '0 0 8px #10B981',
              }}
            />
            <span>142 STAGES LIVE</span>
          </div>
        </div>

        <nav aria-label="Desktop Navigation" style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="cb-desktop-nav">
          <a href="#radar" style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Live Radar</a>
          <a href="#economics" style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Fair Economics (6%)</a>
          <a href="#splits" style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Band Splits</a>
          <a href="#personas" style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Personas</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle variant="icon" />
          
          <Link
            href="/auth"
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              backgroundColor: 'var(--cb-toggle-bg, rgba(255, 255, 255, 0.06))',
              border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.12))',
              color: 'var(--cb-text-primary, #FFFFFF)',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Sign In
          </Link>

          <Link
            href="/onboarding"
            style={{
              padding: '8px 18px',
              borderRadius: 9999,
              backgroundColor: 'var(--cb-purple-main, #7C3AED)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: 'var(--cb-purple-glow, 0 4px 16px rgba(124, 58, 237, 0.4))',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Take The Stage</span>
            <span>→</span>
          </Link>
        </div>
      </header>

      {/* 2. APPLE-CLEAN HERO SECTION */}
      <main id="main-content">
        <section
          aria-labelledby="hero-title"
          style={{
            position: 'relative',
            minHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 120,
            paddingBottom: 64,
            paddingLeft: 'clamp(16px, 4vw, 40px)',
            paddingRight: 'clamp(16px, 4vw, 40px)',
            background: isDark
              ? 'radial-gradient(ellipse at 50% 25%, rgba(124, 58, 237, 0.16) 0%, transparent 60%), #050507'
              : 'radial-gradient(ellipse at 50% 20%, rgba(109, 40, 217, 0.08) 0%, transparent 60%), #FBFBFD',
          }}
        >
          {/* Minimal Pill Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 18px',
              borderRadius: 9999,
              backgroundColor: 'var(--cb-surface-2, rgba(22, 24, 34, 0.8))',
              border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.1))',
              backdropFilter: 'blur(16px)',
              marginBottom: 28,
            }}
          >
            <span style={{ fontSize: 13 }}>✨</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--cb-live-green, #10B981)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Live Music, Found In The Moment • Zero Subscriptions
            </span>
          </div>

          {/* Cupertino Bold Hero Typography */}
          <div style={{ maxWidth: 880, textAlign: 'center', marginBottom: 20 }}>
            <h1
              id="hero-title"
              style={{
                fontSize: 'clamp(38px, 6.5vw, 76px)',
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                margin: '0 0 20px',
                color: 'var(--cb-text-primary, #FFFFFF)',
              }}
            >
              Find the music.{' '}
              <span
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #FFFFFF 30%, #A855F7 70%, #38BDF8 100%)'
                    : 'linear-gradient(135deg, #1D1D1F 20%, #7C3AED 60%, #4F46E5 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                  display: 'inline-block',
                }}
              >
                Fuel the moment.
              </span>
            </h1>
            <p
              style={{
                fontSize: 'clamp(17px, 2.2vw, 21px)',
                lineHeight: 1.5,
                color: 'var(--cb-text-secondary, #94A3B8)',
                maxWidth: 680,
                margin: '0 auto 24px',
                fontWeight: 400,
              }}
            >
              Discover solo musicians and bands performing near you. Tip in three taps—or go live and let nearby fans find you.
            </p>

            {/* Apple Pro Minimal Dual CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <Link
                href="#radar"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 28px',
                  borderRadius: 9999,
                  backgroundColor: 'var(--cb-purple-main, #7C3AED)',
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: 'var(--cb-purple-glow, 0 6px 20px rgba(124, 58, 237, 0.45))',
                }}
              >
                <span>Find Live Music</span>
              </Link>
              <Link
                href="/onboarding?role=artist"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 26px',
                  borderRadius: 9999,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  border: '1px solid var(--cb-border-medium, rgba(255, 255, 255, 0.16))',
                  color: 'var(--cb-text-primary, #FFFFFF)',
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <span>Start Performing</span>
                <span>→</span>
              </Link>
            </div>

            {/* Quiet Tertiary Link & Trust Microcopy */}
            <div style={{ marginBottom: 12 }}>
              <a
                href="#personas"
                style={{
                  color: 'var(--cb-text-secondary, #94A3B8)',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                See How It Works ↓
              </a>
              <p style={{ fontSize: 12, color: 'var(--cb-text-muted, #64748B)', margin: '8px 0 0' }}>
                Free to join · 6% platform fee + standard Stripe fees · You control when your location is shared
              </p>
            </div>
          </div>

          {/* Minimal Location Search Pill */}
          <div style={{ width: '100%', maxWidth: 640, position: 'relative', marginBottom: 28, zIndex: 30 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--cb-surface-1, #0F1017)',
                border: '1px solid var(--cb-border-medium, rgba(255, 255, 255, 0.14))',
                borderRadius: 9999,
                padding: '6px 6px 6px 20px',
                boxShadow: 'var(--cb-card-shadow, 0 12px 36px rgba(0, 0, 0, 0.3))',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cb-purple-light, #A855F7)" strokeWidth="2.2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search city or venue (San Diego, Austin, Torrance)..."
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--cb-text-primary, #FFFFFF)',
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                  aria-label="Search city or venue"
                />
              </div>
              <a
                href="#radar"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'var(--cb-purple-main, #7C3AED)',
                  color: '#FFFFFF',
                  borderRadius: 9999,
                  padding: '10px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>Explore Stages</span>
                <span>&rarr;</span>
              </a>
            </div>

            {suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--cb-surface-1, #0F1017)',
                  borderRadius: 16,
                  border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.1))',
                  padding: '8px 0',
                  boxShadow: 'var(--cb-card-shadow, 0 16px 40px rgba(0, 0, 0, 0.4))',
                  zIndex: 40,
                }}
              >
                {suggestions.map((loc) => (
                  <button
                    key={loc.placeId}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 20px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--cb-text-primary, #FFFFFF)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    <span>{loc.city}, {loc.administrativeArea}</span>
                    <span style={{ fontSize: 12, color: 'var(--cb-live-green, #10B981)', fontWeight: 600 }}>Active Stages</span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--cb-text-muted, #64748B)', fontWeight: 600 }}>Curated:</span>
              {CURATED_LOCATIONS.slice(0, 4).map((loc) => (
                <button
                  key={loc.placeId}
                  type="button"
                  onClick={() => setSelectedLocation(loc)}
                  style={{
                    background: selectedLocation.placeId === loc.placeId ? 'var(--cb-purple-dim, rgba(124, 58, 237, 0.2))' : 'var(--cb-surface-2, rgba(255, 255, 255, 0.05))',
                    border: '1px solid ' + (selectedLocation.placeId === loc.placeId ? 'var(--cb-purple-light, #A855F7)' : 'var(--cb-border-subtle, rgba(255, 255, 255, 0.08))'),
                    color: selectedLocation.placeId === loc.placeId ? 'var(--cb-text-primary, #FFFFFF)' : 'var(--cb-text-secondary, #94A3B8)',
                    borderRadius: 9999,
                    padding: '3px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {loc.city}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Live Performer Hero Card (Apple Pro Style) */}
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              backgroundColor: 'var(--cb-surface-1, #0F1017)',
              borderRadius: 20,
              border: '1px solid var(--cb-border-medium, rgba(255, 255, 255, 0.12))',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              boxShadow: 'var(--cb-card-shadow, 0 12px 36px rgba(0, 0, 0, 0.5))',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #38BDF8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 20,
                  color: '#FFFFFF',
                }}
              >
                M
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--cb-text-primary, #FFFFFF)' }}>Maya Lin & The Pulse</span>
                  <span style={{ color: 'var(--cb-verified-blue, #38BDF8)', fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cb-live-green, #10B981)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--cb-live-green, #10B981)' }} />
                    LIVE
                  </span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--cb-text-secondary, #94A3B8)' }}>
                  Acoustic Lounge • Torrance, CA (0.4 mi away)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 9999,
                  backgroundColor: 'var(--cb-surface-2, rgba(255, 255, 255, 0.08))',
                  border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.1))',
                  color: 'var(--cb-text-primary, #FFFFFF)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                aria-label={isPlayingAudio ? 'Pause live acoustic snippet' : 'Play live acoustic snippet'}
              >
                <span>{isPlayingAudio ? '❚❚ Pause' : '▶ Sample'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = MOCK_PERFORMERS[0];
                  if (p) handleTriggerTip(p);
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: 9999,
                  backgroundColor: 'var(--cb-purple-main, #7C3AED)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Tip $10 ⚡
              </button>
            </div>

            {/* Audio Waveform Ribbon (Stitch Iteration 3) */}
            <div style={{ width: '100%', paddingTop: 10, borderTop: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cb-text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Acoustic Stage Frequency
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cb-live-green, #10B981)' }}>
                  ● 44.1 kHz
                </span>
              </div>
              <AudioWaveformRibbon height={20} barCount={28} colorTheme="purple" isPlaying={isPlayingAudio} />
            </div>
          </div>
        </section>

        {/* 3. LIVE STAGE RADAR */}
        <section
          id="radar"
          aria-labelledby="radar-heading"
          style={{
            padding: '80px clamp(16px, 4vw, 56px)',
            maxWidth: 1240,
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ color: 'var(--cb-live-green, #10B981)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Real-Time Proximity
              </span>
              <h2 id="radar-heading" style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '6px 0' }}>
                Stages in {selectedLocation.city}
              </h2>
              <p style={{ fontSize: 15, color: 'var(--cb-text-secondary, #94A3B8)', margin: 0 }}>
                Verified artists performing live right now. Instant 2-tap tips via Apple Pay.
              </p>
            </div>

            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--cb-surface-1, #0F1017)',
                borderRadius: 9999,
                padding: 4,
                border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
              }}
            >
              {(['live', 'nearby', 'popular', 'venues'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 9999,
                    border: 'none',
                    backgroundColor: activeTab === tab ? 'var(--cb-purple-main, #7C3AED)' : 'transparent',
                    color: activeTab === tab ? '#FFFFFF' : 'var(--cb-text-secondary, #94A3B8)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {tab === 'live' ? '🔥 Live' : tab === 'nearby' ? '📍 Nearby' : tab === 'popular' ? '⭐ Trending' : '🎪 Venues'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 20 }}>
            {genres.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 9999,
                  backgroundColor: selectedGenre === genre ? 'var(--cb-purple-dim, rgba(124, 58, 237, 0.15))' : 'var(--cb-surface-1, #0F1017)',
                  border: '1px solid ' + (selectedGenre === genre ? 'var(--cb-purple-light, #A855F7)' : 'var(--cb-border-subtle, rgba(255, 255, 255, 0.08))'),
                  color: selectedGenre === genre ? 'var(--cb-text-primary, #FFFFFF)' : 'var(--cb-text-secondary, #94A3B8)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {genre}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))', gap: 24 }}>
            {filteredPerformers.map((performer) => (
              <article
                key={performer.id}
                style={{
                  backgroundColor: 'var(--cb-surface-1, #0F1017)',
                  borderRadius: 20,
                  border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--cb-card-shadow, 0 10px 30px rgba(0, 0, 0, 0.3))',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.05))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #7C3AED 0%, #38BDF8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 18,
                        color: '#FFFFFF',
                      }}
                    >
                      {performer.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cb-text-primary, #FFFFFF)' }}>{performer.name}</span>
                        {performer.isVerified && <span style={{ color: 'var(--cb-verified-blue, #38BDF8)', fontSize: 13 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)' }}>{performer.genres.join(' • ')}</span>
                    </div>
                  </div>
                  {performer.isLive && (
                    <span style={{ padding: '3px 8px', borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.12)', color: 'var(--cb-live-green, #10B981)', fontSize: 11, fontWeight: 800 }}>
                      LIVE
                    </span>
                  )}
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  {performer.currentVenueName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--cb-text-secondary, #CBD5E1)' }}>
                      <span>🎪</span>
                      <span>{performer.currentVenueName}</span>
                      <span>•</span>
                      <span style={{ color: 'var(--cb-live-green, #10B981)', fontWeight: 600 }}>0.8 mi away</span>
                    </div>
                  )}
                  <p style={{ fontSize: 13, color: 'var(--cb-text-secondary, #94A3B8)', lineHeight: 1.5, margin: 0 }}>
                    {performer.aiCardSummary ?? 'Energetic live performance with soulful melodies and crowd-favorite originals.'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--cb-text-muted, #64748B)' }}>
                    <span>👥 {performer.followersCount.toLocaleString()} fans</span>
                    <span style={{ color: 'var(--cb-rank-gold, #F59E0B)', fontWeight: 600 }}>⭐ Verified Stage</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px 20px',
                    borderTop: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.05))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Link
                    href={'/artist/' + performer.slug}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px',
                      borderRadius: 8,
                      backgroundColor: 'var(--cb-surface-2, rgba(255, 255, 255, 0.06))',
                      color: 'var(--cb-text-primary, #FFFFFF)',
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    View Stage
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleTriggerTip(performer)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 8,
                      backgroundColor: 'var(--cb-purple-main, #7C3AED)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Tip Now ⚡
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 4. TRANSPARENT ECONOMICS TIP CALCULATOR */}
        <section
          id="economics"
          aria-labelledby="economics-heading"
          style={{
            padding: '80px clamp(16px, 4vw, 56px)',
            backgroundColor: 'var(--cb-surface-2, #0B0D14)',
            borderTop: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
            borderBottom: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
          }}
        >
          <div style={{ maxWidth: 1040, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
              <span style={{ color: 'var(--cb-purple-light, #A855F7)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Radical Transparency
              </span>
              <h2 id="economics-heading" style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '8px 0' }}>
                We Only Win When Artists Win.
              </h2>
              <p style={{ fontSize: 16, color: 'var(--cb-text-secondary, #94A3B8)', margin: 0, lineHeight: 1.5 }}>
                Flat <strong>6% Crowdbeats platform fee</strong> + standard <strong>Stripe.com</strong> processing (2.9% + 30¢).
                Zero monthly subscription fees.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'center' }}>
              {/* Interactive Calculator Card */}
              <div
                style={{
                  backgroundColor: 'var(--cb-surface-1, #0F1017)',
                  borderRadius: 24,
                  padding: '32px',
                  border: '1px solid var(--cb-border-medium, rgba(168, 85, 247, 0.3))',
                  boxShadow: 'var(--cb-card-shadow, 0 16px 40px rgba(0, 0, 0, 0.4))',
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Test The Tip Breakdown</h3>
                <p style={{ fontSize: 13, color: 'var(--cb-text-secondary, #94A3B8)', margin: '0 0 20px' }}>
                  Select or drag any audience tip amount to calculate net take-home earnings:
                </p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                  {[5, 10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSimulatorAmount(amt)}
                      style={{
                        flex: 1,
                        minWidth: 50,
                        padding: '8px 0',
                        borderRadius: 10,
                        border: '1px solid ' + (simulatorAmount === amt ? 'var(--cb-purple-main, #7C3AED)' : 'var(--cb-border-subtle, rgba(255, 255, 255, 0.1))'),
                        backgroundColor: simulatorAmount === amt ? 'var(--cb-purple-main, #7C3AED)' : 'var(--cb-surface-2, rgba(255, 255, 255, 0.04))',
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--cb-text-secondary, #94A3B8)', marginBottom: 8 }}>
                    <span>Custom Tip:</span>
                    <span style={{ color: 'var(--cb-text-primary, #FFFFFF)', fontWeight: 800, fontSize: 16 }}>${simulatorAmount}.00</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={simulatorAmount}
                    onChange={(e) => setSimulatorAmount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--cb-purple-main, #7C3AED)', cursor: 'pointer' }}
                    aria-label="Adjust custom tip amount slider"
                  />
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--cb-surface-2, rgba(0, 0, 0, 0.3))',
                    borderRadius: 16,
                    padding: '20px',
                    border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.06))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                    <span style={{ color: 'var(--cb-text-secondary, #94A3B8)' }}>Gross Fan Tip:</span>
                    <span style={{ fontWeight: 700 }}>${simulatorAmount}.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                    <span style={{ color: 'var(--cb-text-secondary, #94A3B8)' }}>Crowdbeats Tech Fee (6%):</span>
                    <span style={{ color: 'var(--cb-purple-light, #A855F7)', fontWeight: 600 }}>-${platformFee}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                    <span style={{ color: 'var(--cb-text-secondary, #94A3B8)' }}>Stripe Processing (2.9% + 30¢):</span>
                    <span style={{ color: 'var(--cb-verified-blue, #38BDF8)', fontWeight: 600 }}>-${stripeFee}</span>
                  </div>

                  <div style={{ paddingTop: 12, borderTop: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.1))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--cb-live-green, #10B981)', display: 'block' }}>
                        Artist Net Payout (~{artistPercent}%):
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--cb-text-muted, #64748B)' }}>Direct deposit to bank via Stripe Connect</span>
                    </div>
                    <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--cb-live-green, #10B981)', fontFamily: 'var(--font-mono, monospace)' }}>
                      ${artistTakeHome}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comparison & Guarantees */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  style={{
                    backgroundColor: 'var(--cb-purple-dim, rgba(124, 58, 237, 0.1))',
                    border: '1px solid var(--cb-purple-light, rgba(168, 85, 247, 0.3))',
                    borderRadius: 20,
                    padding: '24px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>🏆</span>
                    <h4 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--cb-text-primary, #FFFFFF)' }}>Crowdbeats Fair Model</h4>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--cb-text-secondary, #CBD5E1)', margin: '0 0 10px', lineHeight: 1.5 }}>
                    Zero monthly subscriptions. 90-94% of audience tips land straight in the creator bank account without hidden withdrawal penalties.
                  </p>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cb-live-green, #10B981)' }}>✓ 0% Monthly Subscriptions</span>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--cb-surface-1, #0F1017)',
                    border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
                    borderRadius: 20,
                    padding: '24px',
                    opacity: 0.85,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>❌</span>
                    <h4 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--cb-text-secondary, #94A3B8)' }}>Traditional Merch & Tip Jars</h4>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--cb-text-muted, #64748B)', margin: 0, lineHeight: 1.5 }}>
                    Venues take 15% to 30% merch cuts. Physical tip jars lose up to 80% of potential tips due to cashless audiences.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. AUTOMATED BAND REVENUE SPLITS */}
        <section
          id="splits"
          aria-labelledby="splits-heading"
          style={{
            padding: '80px clamp(16px, 4vw, 56px)',
            maxWidth: 1120,
            margin: '0 auto',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
            <span style={{ color: 'var(--cb-verified-blue, #38BDF8)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Subledger Contract Engine
            </span>
            <h2 id="splits-heading" style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '8px 0' }}>
              Zero-Drama Band Revenue Splits.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--cb-text-secondary, #94A3B8)', margin: 0, lineHeight: 1.5 }}>
              Tips divide instantly into each band member individual bank account via automated Stripe subledgers.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--cb-surface-1, #0F1017)',
              borderRadius: 24,
              padding: 'clamp(20px, 4vw, 36px)',
              border: '1px solid var(--cb-border-medium, rgba(56, 189, 248, 0.25))',
              boxShadow: 'var(--cb-card-shadow, 0 20px 50px rgba(0, 0, 0, 0.4))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cb-verified-blue, #38BDF8)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Live Band Example:
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 0' }}>The Neon Soundwave (4 Members)</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--cb-text-secondary, #94A3B8)' }}>Live Tip:</span>
                {[50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBandSplitAmount(amt)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      border: '1px solid ' + (bandSplitAmount === amt ? 'var(--cb-verified-blue, #38BDF8)' : 'var(--cb-border-subtle, rgba(255, 255, 255, 0.1))'),
                      backgroundColor: bandSplitAmount === amt ? 'var(--cb-verified-blue, #38BDF8)' : 'var(--cb-surface-2, rgba(255, 255, 255, 0.05))',
                      color: bandSplitAmount === amt ? '#050507' : 'var(--cb-text-primary, #FFFFFF)',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { name: 'Jake Vance', role: 'Lead Vocals & Guitar', percent: '40%', payout: splitJake, color: '#7C3AED' },
                { name: 'Maya Lin', role: 'Keyboards & Synth', percent: '25%', payout: splitMaya, color: '#A855F7' },
                { name: 'Devon Cole', role: 'Drums & Percussion', percent: '20%', payout: splitDevon, color: '#38BDF8' },
                { name: 'Leo Gomez', role: 'Bass Guitar', percent: '15%', payout: splitLeo, color: '#10B981' },
              ].map((member, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: 'var(--cb-surface-2, rgba(255, 255, 255, 0.03))',
                    borderRadius: 16,
                    padding: '18px',
                    border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{member.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 12, backgroundColor: member.color + '25', color: member.color }}>
                      {member.percent}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)' }}>{member.role}</span>
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.06))' }}>
                    <span style={{ fontSize: 11, color: 'var(--cb-text-muted, #64748B)', display: 'block' }}>Instant Deposit:</span>
                    <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)' }}>${member.payout}</span>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13,
                color: 'var(--cb-text-secondary, #CBD5E1)',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <span>⚡ <strong>100% Automated:</strong> Subledger resolves in real-time via Stripe Connect. On ${bandSplitAmount}: ${netBandPool.toFixed(2)} is distributed directly to member bank accounts.</span>
              <Link href="/onboarding/band" style={{ color: 'var(--cb-verified-blue, #38BDF8)', fontWeight: 700, textDecoration: 'none' }}>Create Band Roster &rarr;</Link>
            </div>
          </div>
        </section>

        {/* 6. PERSONAS ENGINE */}
        <section
          id="personas"
          aria-labelledby="personas-heading"
          style={{
            padding: '80px clamp(16px, 4vw, 56px)',
            backgroundColor: 'var(--cb-surface-2, #0B0D14)',
            borderTop: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
          }}
        >
          <div style={{ maxWidth: 1040, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 40px' }}>
              <h2 id="personas-heading" style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
                Built for Every Role in Live Music.
              </h2>
              <p style={{ fontSize: 16, color: 'var(--cb-text-secondary, #94A3B8)', margin: 0 }}>
                Whether you hold the microphone, mix sound, book the venue, or cheer from the front row.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
              {[
                { id: 'artist', label: 'Solo Artists', icon: '🎸' },
                { id: 'band', label: 'Bands & Crews', icon: '🥁' },
                { id: 'venue', label: 'Venues & Stages', icon: '🎪' },
                { id: 'fan', label: 'Music Fans', icon: '🎧' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePersona(p.id as any)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 18px',
                    borderRadius: 9999,
                    border: '1px solid ' + (activePersona === p.id ? 'var(--cb-purple-main, #7C3AED)' : 'var(--cb-border-subtle, rgba(255, 255, 255, 0.1))'),
                    backgroundColor: activePersona === p.id ? 'var(--cb-purple-main, #7C3AED)' : 'var(--cb-surface-1, #0F1017)',
                    color: activePersona === p.id ? '#FFFFFF' : 'var(--cb-text-secondary, #94A3B8)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            <div
              style={{
                backgroundColor: 'var(--cb-surface-1, #0F1017)',
                borderRadius: 24,
                padding: 'clamp(24px, 5vw, 44px)',
                border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.1))',
              }}
            >
              {activePersona === 'artist' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, alignItems: 'center' }}>
                  <div>
                    <span style={{ color: 'var(--cb-purple-light, #A855F7)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>For Solo Creators</span>
                    <h3 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0 14px' }}>Turn Audience Applause into Direct Digital Income.</h3>
                    <p style={{ fontSize: 15, color: 'var(--cb-text-secondary, #CBD5E1)', lineHeight: 1.6, margin: '0 0 24px' }}>
                      Check in to any venue in 10 seconds. Your dynamic QR code displays instantly on your phone or mic stand. Fans tip via Apple Pay and Google Pay without downloading an app. Keep ~94% net payout with a transparent 6% platform fee and zero subscription lock-in.
                    </p>
                    <Link
                      href="/onboarding/artist"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        backgroundColor: 'var(--cb-purple-main, #7C3AED)',
                        color: '#FFFFFF',
                        borderRadius: 10,
                        padding: '12px 22px',
                        fontSize: 14,
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      <span>Claim Artist Stage</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'var(--cb-surface-2, rgba(255, 255, 255, 0.03))',
                      borderRadius: 18,
                      padding: '24px',
                      border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700 }}>⚡ Dynamic Stage QR Token</span>
                    <div
                      style={{
                        width: 140,
                        height: 140,
                        backgroundColor: 'var(--cb-bg-app, #050507)',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed var(--cb-purple-light, rgba(168, 85, 247, 0.4))',
                      }}
                    >
                      <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--cb-purple-light, #A855F7)' }}>QR SCAN</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--cb-text-muted, #64748B)', textAlign: 'center' }}>
                      Save to Apple Wallet or project to venue monitors.
                    </span>
                  </div>
                </div>
              )}

              {activePersona === 'band' && (
                <div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Multi-Account Band Contracts</h3>
                  <p style={{ color: 'var(--cb-text-secondary, #CBD5E1)', margin: '0 0 20px', lineHeight: 1.6 }}>
                    Split tips and tour pledges automatically to each member's personal bank account without manual accounting.
                  </p>
                  <Link
                    href="/onboarding/band"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: 'var(--cb-verified-blue, #38BDF8)',
                      color: '#050507',
                      borderRadius: 10,
                      padding: '12px 22px',
                      fontSize: 14,
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    Create Band Roster &rarr;
                  </Link>
                </div>
              )}

              {activePersona === 'venue' && (
                <div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Foot Traffic & Live Radar Boost</h3>
                  <p style={{ color: 'var(--cb-text-secondary, #CBD5E1)', margin: '0 0 20px', lineHeight: 1.6 }}>
                    When musicians perform on your stage, your venue glows in real-time on our discovery radar, driving beverage sales and patron return visits.
                  </p>
                  <Link
                    href="/onboarding/venue"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: 'var(--cb-live-green, #10B981)',
                      color: '#050507',
                      borderRadius: 10,
                      padding: '12px 22px',
                      fontSize: 14,
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    Register Venue Stage &rarr;
                  </Link>
                </div>
              )}

              {activePersona === 'fan' && (
                <div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Direct Musician Connection</h3>
                  <p style={{ color: 'var(--cb-text-secondary, #CBD5E1)', margin: '0 0 20px', lineHeight: 1.6 }}>
                    Tip directly in 2 taps, request favorite songs, and earn supporter badges for local shows.
                  </p>
                  <Link
                    href="/onboarding/fan"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: 'var(--cb-rank-gold, #F59E0B)',
                      color: '#050507',
                      borderRadius: 10,
                      padding: '12px 22px',
                      fontSize: 14,
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    Join As Fan &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 7. CINEMATIC CLOSING BANNER */}
        <section
          aria-labelledby="cta-heading"
          style={{
            position: 'relative',
            padding: '90px clamp(16px, 4vw, 56px)',
            textAlign: 'center',
            backgroundColor: 'var(--cb-bg-app, #050507)',
          }}
        >
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <h2 id="cta-heading" style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
              Ready to Take The Stage?
            </h2>
            <p style={{ fontSize: 17, color: 'var(--cb-text-secondary, #CBD5E1)', margin: '0 0 32px', lineHeight: 1.6 }}>
              Join thousands of independent musicians, bands, and live music venues. Zero monthly subscriptions. Transparent 6% platform fee + Stripe processing.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Link
                href="/onboarding/artist"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 28px',
                  borderRadius: 9999,
                  backgroundColor: 'var(--cb-purple-main, #7C3AED)',
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: 'var(--cb-purple-glow, 0 8px 24px rgba(124, 58, 237, 0.4))',
                }}
              >
                <span>Launch Artist Studio</span>
                <span>→</span>
              </Link>
              <Link
                href="/auth"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 24px',
                  borderRadius: 9999,
                  backgroundColor: 'var(--cb-surface-2, rgba(255, 255, 255, 0.08))',
                  border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.12))',
                  color: 'var(--cb-text-primary, #FFFFFF)',
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>Sign In</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

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
          initialAmountCents={simulatorAmount * 100}
        />
      )}

      <CbFooter />
    </div>
  );
}
