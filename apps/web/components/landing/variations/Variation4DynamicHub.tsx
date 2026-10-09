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

export function Variation4DynamicHub() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<'artist' | 'band' | 'venue' | 'fan'>('artist');
  const [simulatorAmount, setSimulatorAmount] = useState<number>(25);

  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [activeTipPerformer, setActiveTipPerformer] = useState<PublicPerformerItem | null>(null);

  // Fee calculation
  const platformFee = (simulatorAmount * 0.06).toFixed(2);
  const stripeFee = ((simulatorAmount * 0.029) + 0.30).toFixed(2);
  const artistTakeHome = Math.max(0, simulatorAmount - Number(platformFee) - Number(stripeFee)).toFixed(2);

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
      {/* 1. DYNAMIC FLOATING ISLAND NAVBAR */}
      <header
        role="banner"
        style={{
          position: 'fixed',
          top: 20,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)'}`,
            borderRadius: isIslandExpanded ? 24 : 9999,
            padding: isIslandExpanded ? '16px 24px' : '8px 18px',
            maxWidth: isIslandExpanded ? 580 : 420,
            width: '90%',
            boxShadow: isDark
              ? '0 16px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(124, 58, 237, 0.3)'
              : '0 16px 36px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7C3AED, #38BDF8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 900,
                  color: '#FFFFFF',
                }}
              >
                C
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: isDark ? '#FFFFFF' : '#1D1D1F' }}>
                Crowdbeats Hub
              </span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsIslandExpanded(!isIslandExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  borderRadius: 9999,
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.10)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--cb-live-green, #10B981)',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--cb-live-green, #10B981)' }} />
                <span>142 LIVE</span>
                <span style={{ fontSize: 10 }}>{isIslandExpanded ? '▲' : '▼'}</span>
              </button>

              <ThemeToggle variant="icon" />
            </div>
          </div>

          {/* Expanded Dynamic Island Panel */}
          {isIslandExpanded && (
            <div
              style={{
                paddingTop: 12,
                borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#6E6E73', fontWeight: 600 }}>
                Active Stage Channels:
              </span>
              {MOCK_PERFORMERS.slice(0, 2).map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>🎸</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#FFFFFF' : '#1D1D1F' }}>{p.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTriggerTip(p)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 9999,
                      backgroundColor: 'var(--cb-purple-main, #7C3AED)',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Tip $10 ⚡
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 2. DYNAMIC AMBIENT HERO */}
      <main id="main-content">
        <section
          style={{
            paddingTop: 140,
            paddingBottom: 64,
            paddingLeft: 'clamp(16px, 4vw, 48px)',
            paddingRight: 'clamp(16px, 4vw, 48px)',
            maxWidth: 1040,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto 32px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 9999,
                backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)',
                border: '1px solid var(--cb-purple-light, #A855F7)',
                marginBottom: 20,
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
                LIVE MUSIC, FOUND IN THE MOMENT • DYNAMIC HUB
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(38px, 6.5vw, 72px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                margin: '0 0 18px',
              }}
            >
              Find the music.{' '}
              <span
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #A855F7 0%, #38BDF8 100%)'
                    : 'linear-gradient(135deg, #6D28D9 0%, #0284C7 100%)',
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
            <p style={{ fontSize: 18, color: 'var(--cb-text-secondary, #94A3B8)', lineHeight: 1.5, margin: '0 auto 24px', maxWidth: 660 }}>
              Discover solo musicians and bands performing near you. Tip in three taps—or go live and let nearby fans find you.
            </p>

            {/* Dynamic Hub Dual CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <Link
                href="#roles"
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
                Find Live Music
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
                Start Performing &rarr;
              </Link>
            </div>

            <div style={{ marginBottom: 24 }}>
              <a
                href="#calculator"
                style={{
                  color: 'var(--cb-text-secondary, #94A3B8)',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                See Fair 6% Economics ↓
              </a>
              <p style={{ fontSize: 12, color: 'var(--cb-text-muted, #64748B)', margin: '8px 0 0' }}>
                Free to join · 6% platform fee + standard Stripe fees · You control when your location is shared
              </p>
            </div>

            {/* Audio Waveform Ribbon (Stitch Iteration 3) */}
            <div style={{ maxWidth: 440, margin: '0 auto 28px', padding: '10px 18px', borderRadius: 16, backgroundColor: 'var(--cb-surface-1, #0F1017)', border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cb-text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Acoustic Stage Waveform
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cb-live-green, #10B981)' }}>
                  ● 44.1 kHz Live
                </span>
              </div>
              <AudioWaveformRibbon height={22} barCount={26} colorTheme="gradient" />
            </div>
          </div>

          {/* Ambient Role Cards Grid */}
          <div
            id="roles"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20,
              marginBottom: 56,
              scrollMarginTop: 80,
            }}
          >
            {[
              {
                id: 'artist',
                icon: '🎸',
                title: 'Solo Artists',
                desc: 'Generate dynamic QR stage tokens. Keep ~94% net payout with zero subscription cost.',
                cta: 'Claim Stage',
                href: '/onboarding/artist',
              },
              {
                id: 'band',
                icon: '🥁',
                title: 'Bands & Crews',
                desc: 'Automated Stripe subledger splits direct into every member personal bank account.',
                cta: 'Configure Split',
                href: '/onboarding/band',
              },
              {
                id: 'venue',
                icon: '🎪',
                title: 'Venues & Stages',
                desc: 'Free discovery radar boost. Drive drink sales and foot traffic when artists check in.',
                cta: 'Register Venue',
                href: '/onboarding/venue',
              },
              {
                id: 'fan',
                icon: '🎧',
                title: 'Music Lovers',
                desc: 'Instant 2-tap tips via Google Pay or card. Discover nearby gigs and song request queuing.',
                cta: 'Explore Gigs',
                href: '/fan',
              },
            ].map((card) => (
              <div
                key={card.id}
                style={{
                  backgroundColor: 'var(--cb-surface-1, #0F1017)',
                  borderRadius: 20,
                  border: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  boxShadow: 'var(--cb-card-shadow, 0 8px 24px rgba(0, 0, 0, 0.3))',
                }}
              >
                <div>
                  <span style={{ fontSize: 28, display: 'block', marginBottom: 12 }}>{card.icon}</span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{card.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--cb-text-secondary, #94A3B8)', lineHeight: 1.5, margin: 0 }}>
                    {card.desc}
                  </p>
                </div>
                <Link
                  href={card.href}
                  style={{
                    marginTop: 20,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--cb-purple-light, #A855F7)',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <span>{card.cta}</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            ))}
          </div>

          {/* Quick Tip Fee Simulator Widget */}
          <div
            id="calculator"
            style={{
              backgroundColor: 'var(--cb-surface-1, #0F1017)',
              borderRadius: 24,
              border: '1px solid var(--cb-border-medium, rgba(168, 85, 247, 0.3))',
              padding: '32px',
              maxWidth: 600,
              margin: '0 auto 64px',
              textAlign: 'left',
              scrollMarginTop: 80,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--cb-purple-light, #A855F7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Instant Tip Calculator
            </span>
            <h3 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 16px' }}>Transparent 6% Technology Fee</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[10, 25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSimulatorAmount(amt)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 8,
                    border: '1px solid ' + (simulatorAmount === amt ? 'var(--cb-purple-main, #7C3AED)' : 'var(--cb-border-subtle, rgba(255, 255, 255, 0.1))'),
                    backgroundColor: simulatorAmount === amt ? 'var(--cb-purple-main, #7C3AED)' : 'transparent',
                    color: simulatorAmount === amt ? '#FFFFFF' : 'var(--cb-text-secondary, #94A3B8)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--cb-border-subtle, rgba(255, 255, 255, 0.08))' }}>
              <div>
                <span style={{ fontSize: 14, color: 'var(--cb-text-secondary, #94A3B8)', display: 'block' }}>
                  Artist Takes Home:
                </span>
                <span style={{ fontSize: 11, color: 'var(--cb-text-muted, #64748B)' }}>After 6% + Stripe processing</span>
              </div>
              <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--cb-live-green, #10B981)', fontFamily: 'var(--font-mono, monospace)' }}>
                ${artistTakeHome}
              </span>
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
