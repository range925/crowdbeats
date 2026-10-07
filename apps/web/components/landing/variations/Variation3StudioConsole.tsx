'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { DiscoveryLocation } from '@crowdbeats/contracts';
import {
  DEFAULT_DISCOVERY_LOCATION,
  MOCK_PERFORMERS,
  type PublicPerformerItem,
} from '@/lib/discovery/discoveryClient';
import { TipAuthGateModal } from '@/components/discovery/TipAuthGateModal';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CbFooter } from '@/components/ui/CbFooter';
import { AudioWaveformRibbon } from '@/components/landing/AudioWaveformRibbon';

export function Variation3StudioConsole() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [simulatorAmount, setSimulatorAmount] = useState<number>(50);
  const [bandSplitAmount, setBandSplitAmount] = useState<number>(200);
  const [selectedLocation, setSelectedLocation] = useState<DiscoveryLocation>(DEFAULT_DISCOVERY_LOCATION);

  // Band member custom percentages
  const [jakePct, setJakePct] = useState(40);
  const [mayaPct, setMayaPct] = useState(25);
  const [devonPct, setDevonPct] = useState(20);
  const [leoPct, setLeoPct] = useState(15);

  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [activeTipPerformer, setActiveTipPerformer] = useState<PublicPerformerItem | null>(null);
  const [audioMeterActive, setAudioMeterActive] = useState(true);

  // Transparent calculations
  const platformFee = (simulatorAmount * 0.06).toFixed(2);
  const stripeFee = ((simulatorAmount * 0.029) + 0.30).toFixed(2);
  const netArtist = Math.max(0, simulatorAmount - Number(platformFee) - Number(stripeFee)).toFixed(2);
  const artistPercent = ((Number(netArtist) / simulatorAmount) * 100).toFixed(1);

  // Band calculations
  const bandPlatformFee = (bandSplitAmount * 0.06).toFixed(2);
  const bandStripeFee = ((bandSplitAmount * 0.029) + 0.30).toFixed(2);
  const netBand = Math.max(0, bandSplitAmount - Number(bandPlatformFee) - Number(bandStripeFee));

  const payoutJake = (netBand * (jakePct / 100)).toFixed(2);
  const payoutMaya = (netBand * (mayaPct / 100)).toFixed(2);
  const payoutDevon = (netBand * (devonPct / 100)).toFixed(2);
  const payoutLeo = (netBand * (leoPct / 100)).toFixed(2);

  const handleTriggerTip = (performer: PublicPerformerItem) => {
    setActiveTipPerformer(performer);
    setIsTipModalOpen(true);
  };

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
      {/* 1. STUDIO CONSOLE HEADER */}
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
          padding: '0 clamp(16px, 4vw, 48px)',
          backgroundColor: 'var(--cb-surface-glass, rgba(15, 16, 23, 0.85))',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.1))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: '#1E1E28',
                border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.15))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              🎛️
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--cb-text-primary, #FFFFFF)' }}>
              CROWDBEATS <span style={{ color: 'var(--cb-purple-light, #A855F7)', fontWeight: 600, fontSize: 12 }}>CONSOLE PRO</span>
            </span>
          </Link>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--cb-live-green, #10B981)',
              fontSize: 10,
              fontWeight: 800,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            SYS: ONLINE • 142 CHANNELS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle variant="icon" />
          <Link
            href="/auth"
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              backgroundColor: 'var(--cb-surface-2, rgba(255, 255, 255, 0.08))',
              color: 'var(--cb-text-primary, #FFFFFF)',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.1))',
            }}
          >
            Console Login
          </Link>
          <Link
            href="/onboarding"
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              backgroundColor: 'var(--cb-purple-main, #7C3AED)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Deploy Stage &rarr;
          </Link>
        </div>
      </header>

      {/* 2. CONSOLE PRO HERO WORKBENCH */}
      <main id="main-content">
        <section
          style={{
            paddingTop: 110,
            paddingBottom: 64,
            paddingLeft: 'clamp(16px, 4vw, 48px)',
            paddingRight: 'clamp(16px, 4vw, 48px)',
            maxWidth: 1280,
            margin: '0 auto',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto 36px' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--cb-live-green, #10B981)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              LIVE MUSIC, FOUND IN THE MOMENT • STUDIO CONSOLE
            </span>
            <h1
              style={{
                fontSize: 'clamp(36px, 6vw, 68px)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                margin: '10px 0 16px',
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
            <p style={{ fontSize: 17, color: 'var(--cb-text-secondary, #94A3B8)', maxWidth: 660, margin: '0 auto 24px' }}>
              Discover solo musicians and bands performing near you. Tip in three taps—or go live and let nearby fans find you.
            </p>

            {/* Studio Console Dual CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <Link
                href="#channels"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 26px',
                  borderRadius: 8,
                  backgroundColor: 'var(--cb-purple-main, #7C3AED)',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono, monospace)',
                  boxShadow: 'var(--cb-purple-glow, 0 6px 20px rgba(124, 58, 237, 0.45))',
                }}
              >
                <span>Find Live Music [CH 01]</span>
              </Link>
              <Link
                href="/onboarding?role=artist"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  border: '1px solid var(--cb-border-medium, rgba(255, 255, 255, 0.16))',
                  color: 'var(--cb-text-primary, #FFFFFF)',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                <span>Start Performing &rarr;</span>
              </Link>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--cb-text-muted, #64748B)', margin: '8px 0 0', fontFamily: 'var(--font-mono, monospace)' }}>
                Free to join · 6% platform fee + standard Stripe processing · 100% transparent subledgers
              </p>
            </div>
          </div>

          {/* Console Workbench Card */}
          <div
            style={{
              backgroundColor: 'var(--cb-surface-1, #0F1017)',
              borderRadius: 20,
              border: '1px solid var(--cb-border-medium, rgba(255, 255, 255, 0.12))',
              padding: 'clamp(20px, 4vw, 36px)',
              boxShadow: 'var(--cb-card-shadow, 0 20px 60px rgba(0, 0, 0, 0.6))',
              marginBottom: 48,
            }}
          >
            {/* Top Toolbar: Audio Equalizer & Status Dials */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 24,
                borderBottom: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--cb-text-secondary, #94A3B8)' }}>
                  MASTER AUDIO BUS:
                </span>
                <div style={{ width: 140 }}>
                  <AudioWaveformRibbon height={24} barCount={18} colorTheme="purple" isPlaying={audioMeterActive} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>
                <div>
                  <span style={{ color: 'var(--cb-text-muted, #64748B)', display: 'block' }}>STAGE LATENCY</span>
                  <span style={{ fontWeight: 700, color: 'var(--cb-live-green, #10B981)' }}>&lt; 28 ms</span>
                </div>
                <div>
                  <span style={{ color: 'var(--cb-text-muted, #64748B)', display: 'block' }}>FEE RATE</span>
                  <span style={{ fontWeight: 700, color: 'var(--cb-purple-light, #A855F7)' }}>FLAT 6.0%</span>
                </div>
                <div>
                  <span style={{ color: 'var(--cb-text-muted, #64748B)', display: 'block' }}>TOTAL DISTRIBUTED</span>
                  <span style={{ fontWeight: 700, color: '#FFFFFF' }}>$284,500.00</span>
                </div>
              </div>
            </div>

            {/* Split Screen Workbench: Tip Routing & Band Ledger */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, paddingTop: 28 }}>
              {/* Channel 1: Single Tip Subledger */}
              <div
                style={{
                  backgroundColor: 'var(--cb-surface-2, rgba(255, 255, 255, 0.03))',
                  borderRadius: 16,
                  padding: '24px',
                  border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--cb-purple-light, #A855F7)' }}>
                    CHANNEL 01 • DIRECT FAN TIP
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-mono, monospace)' }}>
                    ${simulatorAmount}.00
                  </span>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={simulatorAmount}
                    onChange={(e) => setSimulatorAmount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--cb-purple-main, #7C3AED)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--cb-text-secondary, #94A3B8)' }}>Crowdbeats Tech (6%):</span>
                    <span style={{ color: 'var(--cb-purple-light, #A855F7)' }}>-${platformFee}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--cb-text-secondary, #94A3B8)' }}>Stripe Connect (2.9% + 30¢):</span>
                    <span style={{ color: 'var(--cb-verified-blue, #38BDF8)' }}>-${stripeFee}</span>
                  </div>
                  <div style={{ paddingTop: 12, borderTop: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.1))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: 'var(--cb-live-green, #10B981)' }}>ARTIST NET ({artistPercent}%):</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--cb-live-green, #10B981)' }}>${netArtist}</span>
                  </div>
                </div>
              </div>

              {/* Channel 2: Multi-Member Band Subledger */}
              <div
                style={{
                  backgroundColor: 'var(--cb-surface-2, rgba(255, 255, 255, 0.03))',
                  borderRadius: 16,
                  padding: '24px',
                  border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--cb-verified-blue, #38BDF8)' }}>
                    CHANNEL 02 • BAND CONTRACT SPLIT
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-mono, monospace)' }}>
                    ${bandSplitAmount}.00
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--cb-surface-1, #0F1017)' }}>
                    <span style={{ fontSize: 11, color: 'var(--cb-text-muted, #64748B)', display: 'block' }}>Jake (Vocals) - {jakePct}%</span>
                    <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)' }}>${payoutJake}</span>
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--cb-surface-1, #0F1017)' }}>
                    <span style={{ fontSize: 11, color: 'var(--cb-text-muted, #64748B)', display: 'block' }}>Maya (Keys) - {mayaPct}%</span>
                    <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)' }}>${payoutMaya}</span>
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--cb-surface-1, #0F1017)' }}>
                    <span style={{ fontSize: 11, color: 'var(--cb-text-muted, #64748B)', display: 'block' }}>Devon (Drums) - {devonPct}%</span>
                    <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)' }}>${payoutDevon}</span>
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--cb-surface-1, #0F1017)' }}>
                    <span style={{ fontSize: 11, color: 'var(--cb-text-muted, #64748B)', display: 'block' }}>Leo (Bass) - {leoPct}%</span>
                    <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)' }}>${payoutLeo}</span>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)', display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
                  <span>Automated Stripe Subledger:</span>
                  <span style={{ color: 'var(--cb-live-green, #10B981)', fontWeight: 700 }}>100% Resolved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Stage Channels Feed */}
          <div id="channels" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
              Active Stage Channels (3 Selected)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {MOCK_PERFORMERS.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: 'var(--cb-surface-1, #0F1017)',
                    borderRadius: 14,
                    padding: '16px 20px',
                    border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</span>
                      {p.isVerified && <span style={{ color: 'var(--cb-verified-blue, #38BDF8)' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)' }}>
                      {p.currentVenueName ?? 'Torrance Acoustic Lounge'} • 0.8 mi
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTriggerTip(p)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 6,
                      backgroundColor: 'var(--cb-purple-main, #7C3AED)',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Direct Tip ⚡
                  </button>
                </div>
              ))}
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
