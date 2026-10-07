'use client';

import React, { useState } from 'react';
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

export function Variation2ResonanceKeynote() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedLocation, setSelectedLocation] = useState<DiscoveryLocation>(DEFAULT_DISCOVERY_LOCATION);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'live' | 'nearby' | 'popular' | 'venues'>('live');

  const [simulatorAmount, setSimulatorAmount] = useState<number>(50);
  const [bandSplitAmount, setBandSplitAmount] = useState<number>(100);

  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [activeTipPerformer, setActiveTipPerformer] = useState<PublicPerformerItem | null>(null);
  const [suggestions, setSuggestions] = useState<DiscoveryLocation[]>([]);
  const [isWaveformActive, setIsWaveformActive] = useState(true);

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

  const genres = ['All', 'Acoustic', 'Indie Rock', 'Jazz & Soul', 'Electronic'];

  // Fee calculation
  const platformFee = (simulatorAmount * 0.06).toFixed(2);
  const stripeFee = ((simulatorAmount * 0.029) + 0.30).toFixed(2);
  const artistTakeHome = Math.max(0, simulatorAmount - Number(platformFee) - Number(stripeFee)).toFixed(2);
  const artistPercent = ((Number(artistTakeHome) / simulatorAmount) * 100).toFixed(1);

  // Band Split
  const netBandPool = Math.max(0, bandSplitAmount - (bandSplitAmount * 0.06) - (bandSplitAmount * 0.029 + 0.3));
  const splitJake = (netBandPool * 0.40).toFixed(2);
  const splitMaya = (netBandPool * 0.25).toFixed(2);
  const splitDevon = (netBandPool * 0.20).toFixed(2);
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
      {/* 1. KEYNOTE FROSTED NAVBAR */}
      <header
        role="banner"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(16px, 5vw, 64px)',
          backgroundColor: 'var(--cb-surface-glass, rgba(15, 16, 23, 0.8))',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderBottom: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 16 }}>⚡</span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--cb-text-primary, #FFFFFF)' }}>
            Crowdbeats <span style={{ fontWeight: 400, color: 'var(--cb-purple-light, #A855F7)', fontSize: 13 }}>Resonance</span>
          </span>
        </Link>

        <nav aria-label="Keynote Navigation" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="#showcase" style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 13, fontWeight: 500 }}>Live Sound</a>
          <a href="#economics" style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 13, fontWeight: 500 }}>6% Standard</a>
          <a href="#splits" style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 13, fontWeight: 500 }}>Band Engine</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle variant="icon" />
          <Link
            href="/onboarding"
            style={{
              padding: '7px 18px',
              borderRadius: 9999,
              backgroundColor: 'var(--cb-text-primary, #FFFFFF)',
              color: 'var(--cb-bg-app, #050507)',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
            }}
          >
            Start Live Stage
          </Link>
        </div>
      </header>

      {/* 2. KEYNOTE EDITORIAL HERO */}
      <main id="main-content">
        <section
          style={{
            position: 'relative',
            minHeight: '94vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 100,
            paddingBottom: 64,
            paddingLeft: 'clamp(16px, 5vw, 64px)',
            paddingRight: 'clamp(16px, 5vw, 64px)',
            backgroundImage: isDark
              ? 'radial-gradient(ellipse at 50% 10%, rgba(168, 85, 247, 0.22) 0%, transparent 65%), linear-gradient(180deg, rgba(5, 5, 7, 0.6) 0%, #050507 100%), url("/crowdbeats_hero_bg.png")'
              : 'radial-gradient(ellipse at 50% 10%, rgba(124, 58, 237, 0.1) 0%, transparent 65%), linear-gradient(180deg, rgba(251, 251, 253, 0.8) 0%, #FBFBFD 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 15%',
          }}
        >
          <div style={{ maxWidth: 980, textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 14px',
                borderRadius: 9999,
                backgroundColor: 'var(--cb-surface-glass, rgba(15, 16, 23, 0.8))',
                border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.1))',
                marginBottom: 24,
                backdropFilter: 'blur(12px)',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--cb-live-green, #10B981)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cb-text-secondary, #94A3B8)', letterSpacing: '0.04em' }}>
                SPATIAL SOUND RESONANCE • 142 ACTIVE STAGES
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(42px, 7vw, 84px)',
                fontWeight: 900,
                lineHeight: 1.02,
                letterSpacing: '-0.04em',
                margin: '0 0 24px',
              }}
            >
              Live music.{' '}
              <span
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #A855F7 0%, #38BDF8 60%, #10B981 100%)'
                    : 'linear-gradient(135deg, #7C3AED 0%, #0284C7 60%, #059669 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                  display: 'inline-block',
                }}
              >
                Directly amplified.
              </span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(18px, 2.4vw, 24px)',
                lineHeight: 1.45,
                color: 'var(--cb-text-secondary, #CBD5E1)',
                maxWidth: 720,
                margin: '0 auto 36px',
                fontWeight: 400,
              }}
            >
              Instant 2-tap tips via Apple Pay. Interactive stage radar with GPS proximity.
              Automated band payouts with zero monthly subscription overhead.
            </p>

            {/* Live Web Audio Frequency Ribbon (Stitch Loop Iteration 3) */}
            <AudioWaveformRibbon
              height={36}
              barCount={32}
              colorTheme="gradient"
              isActive={isWaveformActive}
              style={{ maxWidth: 440, margin: '0 auto 36px' }}
            />

            {/* City Discovery Bar */}
            <div style={{ maxWidth: 620, margin: '0 auto', position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--cb-surface-1, #0F1017)',
                  borderRadius: 9999,
                  border: '1px solid var(--cb-border-medium, rgba(168, 85, 247, 0.3))',
                  padding: '6px 8px 6px 20px',
                  boxShadow: 'var(--cb-card-shadow, 0 16px 40px rgba(0, 0, 0, 0.4))',
                }}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Find live stages in San Diego, Austin, Torrance..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--cb-text-primary, #FFFFFF)',
                    fontSize: 15,
                  }}
                />
                <a
                  href="#showcase"
                  style={{
                    padding: '10px 22px',
                    borderRadius: 9999,
                    backgroundColor: 'var(--cb-purple-main, #7C3AED)',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Tune In &rarr;
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
                        padding: '10px 20px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--cb-text-primary, #FFFFFF)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      {loc.city}, {loc.administrativeArea}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. KEYNOTE BENTO SHOWCASE */}
        <section id="showcase" style={{ padding: '80px clamp(16px, 5vw, 64px)', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
            <span style={{ color: 'var(--cb-purple-light, #A855F7)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              The Bento Grid
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '8px 0' }}>
              Checked-In Performers
            </h2>
            <p style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 15, margin: 0 }}>
              Live in {selectedLocation.city}. Tap to test 2-tap contactless tipping.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))', gap: 24 }}>
            {filteredPerformers.slice(0, 3).map((p, idx) => (
              <div
                key={p.id}
                style={{
                  backgroundColor: 'var(--cb-surface-1, #0F1017)',
                  borderRadius: 24,
                  border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  boxShadow: 'var(--cb-card-shadow, 0 12px 30px rgba(0, 0, 0, 0.3))',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        color: '#FFFFFF',
                      }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</span>
                        {p.isVerified && <span style={{ color: 'var(--cb-verified-blue, #38BDF8)' }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)' }}>{p.genres[0]}</span>
                    </div>
                  </div>
                  {p.isLive && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cb-live-green, #10B981)', padding: '2px 8px', borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
                      LIVE NOW
                    </span>
                  )}
                </div>

                <p style={{ fontSize: 13, color: 'var(--cb-text-secondary, #94A3B8)', lineHeight: 1.5, margin: 0 }}>
                  {p.aiCardSummary}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.06))' }}>
                  <span style={{ fontSize: 12, color: 'var(--cb-text-muted, #64748B)' }}>📍 {p.currentVenueName ?? 'Torrance Live Lounge'}</span>
                  <button
                    type="button"
                    onClick={() => handleTriggerTip(p)}
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
              </div>
            ))}
          </div>
        </section>

        {/* 4. KEYNOTE ECONOMICS SECTION */}
        <section id="economics" style={{ padding: '80px clamp(16px, 5vw, 64px)', backgroundColor: 'var(--cb-surface-2, #0B0D14)' }}>
          <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
            <span style={{ color: 'var(--cb-live-green, #10B981)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
              The 6% Direct Model
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '8px 0 16px' }}>
              Transparent. Direct. Zero Recurring Subscriptions.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--cb-text-secondary, #94A3B8)', margin: '0 auto 36px', maxWidth: 640 }}>
              Drag to simulate any fan tip amount and calculate instant net artist payout:
            </p>

            <div
              style={{
                backgroundColor: 'var(--cb-surface-1, #0F1017)',
                borderRadius: 24,
                padding: '36px',
                border: '1px solid var(--cb-border-medium, rgba(168, 85, 247, 0.3))',
                maxWidth: 640,
                margin: '0 auto',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: 'var(--cb-text-secondary, #94A3B8)' }}>Audience Tip:</span>
                <span style={{ fontSize: 24, fontWeight: 800 }}>${simulatorAmount}.00</span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={simulatorAmount}
                onChange={(e) => setSimulatorAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cb-purple-main, #7C3AED)', marginBottom: 24, cursor: 'pointer' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--cb-text-secondary, #94A3B8)' }}>Crowdbeats Tech Fee (6%):</span>
                  <span style={{ color: 'var(--cb-purple-light, #A855F7)', fontWeight: 600 }}>-${platformFee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--cb-text-secondary, #94A3B8)' }}>Stripe.com Processing (2.9% + 30¢):</span>
                  <span style={{ color: 'var(--cb-verified-blue, #38BDF8)', fontWeight: 600 }}>-${stripeFee}</span>
                </div>
                <div style={{ paddingTop: 14, borderTop: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.1))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--cb-live-green, #10B981)' }}>
                    Musician Direct Deposit (~{artistPercent}%):
                  </span>
                  <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--cb-live-green, #10B981)', fontFamily: 'var(--font-mono, monospace)' }}>
                    ${artistTakeHome}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. BAND SPLITS & CTA */}
        <section id="splits" style={{ padding: '80px clamp(16px, 5vw, 64px)', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
            Instant Band Revenue Splits
          </h2>
          <p style={{ fontSize: 16, color: 'var(--cb-text-secondary, #94A3B8)', margin: '0 auto 36px', maxWidth: 640 }}>
            Every fan tip divides into member bank accounts automatically: Lead (40%), Keys (25%), Drums (20%), Bass (15%).
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
            <div style={{ padding: '16px 24px', borderRadius: 16, backgroundColor: 'var(--cb-surface-1, #0F1017)', border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))' }}>
              <span style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)', display: 'block' }}>Lead Vocals (40%)</span>
              <span style={{ fontSize: 22, fontWeight: 800 }}>${splitJake}</span>
            </div>
            <div style={{ padding: '16px 24px', borderRadius: 16, backgroundColor: 'var(--cb-surface-1, #0F1017)', border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))' }}>
              <span style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)', display: 'block' }}>Keyboards (25%)</span>
              <span style={{ fontSize: 22, fontWeight: 800 }}>${splitMaya}</span>
            </div>
            <div style={{ padding: '16px 24px', borderRadius: 16, backgroundColor: 'var(--cb-surface-1, #0F1017)', border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))' }}>
              <span style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)', display: 'block' }}>Drums (20%)</span>
              <span style={{ fontSize: 22, fontWeight: 800 }}>${splitDevon}</span>
            </div>
            <div style={{ padding: '16px 24px', borderRadius: 16, backgroundColor: 'var(--cb-surface-1, #0F1017)', border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))' }}>
              <span style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)', display: 'block' }}>Bass (15%)</span>
              <span style={{ fontSize: 22, fontWeight: 800 }}>${splitLeo}</span>
            </div>
          </div>

          <Link
            href="/onboarding"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '16px 36px',
              borderRadius: 9999,
              backgroundColor: 'var(--cb-purple-main, #7C3AED)',
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: 'var(--cb-purple-glow, 0 8px 28px rgba(124, 58, 237, 0.5))',
            }}
          >
            <span>Launch Your Stage &rarr;</span>
          </Link>
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
