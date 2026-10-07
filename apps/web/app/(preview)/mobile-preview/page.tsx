'use client';

/**
 * Crowdbeats V2 — Mobile Preview (Android + Apple Side-by-Side)
 *
 * Embeds the Flutter web build (localhost:8081) inside realistic
 * device frames for both:
 *   - Google Pixel 7  (Android)
 *   - Apple iPhone 15 Pro
 *
 * Shows both simultaneously so you can compare the layout across platforms.
 */

import React, { useState, useEffect } from 'react';

type ViewMode = 'both' | 'android' | 'ios';
type PersonaKey = 'fan' | 'solo' | 'band';

interface PersonaInfo {
  id: PersonaKey;
  label: string;
  icon: string;
  hash: string;
  badge: string;
  description: string;
  color: string;
}

const PERSONAS: PersonaInfo[] = [
  {
    id: 'fan',
    label: 'Fan',
    icon: '🎧',
    hash: '#/fan',
    badge: 'Public & Supporter',
    description: 'Location-first radar map, nearby live musicians (Jake Rios, Velvet Horizon), and instant 2-tap tips.',
    color: '#3B82F6',
  },
  {
    id: 'solo',
    label: 'Solo Musician',
    icon: '🎸',
    hash: '#/creator',
    badge: 'Creator Studio',
    description: 'Elena Cruz (Solo) creator station with check-in hero, balance ledger, today\'s tips, and Go Live control.',
    color: '#7C3AED',
  },
  {
    id: 'band',
    label: 'Band',
    icon: '🥁',
    hash: '#/band',
    badge: 'Band Command',
    description: 'Midnight Pulse collaborative hub with earnings ($1,245.00), split v2 transparency, and 3 active members.',
    color: '#EC4899',
  },
];

export default function MobilePreviewPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey>('fan');
  const flutterUrl = 'http://localhost:8081';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('persona') as PersonaKey | null;
      if (p === 'band' || p === 'solo' || p === 'fan') {
        setSelectedPersona(p);
      } else if (window.location.hash.includes('band')) {
        setSelectedPersona('band');
      } else if (window.location.hash.includes('creator')) {
        setSelectedPersona('solo');
      }
    }
  }, []);

  const activePersona = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];
  const currentUrl = `${flutterUrl}/${activePersona.hash}`;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#08090e',
        color: '#f4f4f5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 16px 60px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ── HEADER BAR ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 1080,
          marginBottom: 32,
          padding: '14px 20px',
          backgroundColor: '#111218',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 28 }}>📱</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.02em' }}>
              Crowdbeats Mobile Preview
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#71717a' }}>
              Flutter on{' '}
              <a href={flutterUrl} target="_blank" rel="noreferrer" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>
                localhost:8081
              </a>{' '}
              · Location-First Discovery
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View mode toggle */}
          <div style={{ display: 'flex', backgroundColor: '#1c1c24', borderRadius: 10, padding: 3, gap: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
            {([
              { id: 'both', label: '⊞ Both' },
              { id: 'android', label: '🤖 Android' },
              { id: 'ios', label: '🍎 iOS' },
            ] as { id: ViewMode; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                style={{
                  padding: '5px 14px',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 700,
                  backgroundColor: viewMode === id ? '#7C3AED' : 'transparent',
                  color: viewMode === id ? '#fff' : '#71717a',
                  transition: 'all 0.15s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '7px 14px',
              backgroundColor: '#1c1c24',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#a1a1aa',
              borderRadius: 10,
              fontSize: 12,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ↗ Full Screen
          </a>
        </div>
      </div>

      {/* ── PERSONA SELECTOR BAR (FAN / SOLO / BAND) ────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: 1080,
          marginBottom: 28,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            backgroundColor: '#111218',
            borderRadius: 14,
            padding: 4,
            gap: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {PERSONAS.map((p) => {
            const isSelected = selectedPersona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 18px',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 700,
                  backgroundColor: isSelected ? p.color : 'transparent',
                  color: isSelected ? '#ffffff' : '#a1a1aa',
                  boxShadow: isSelected ? `0 2px 12px ${p.color}55` : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 16 }}>{p.icon}</span>
                <span>{p.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 6,
                    backgroundColor: isSelected ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.06)',
                    color: isSelected ? '#ffffff' : '#71717a',
                    fontWeight: 600,
                  }}
                >
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Persona quick description */}
        <div
          style={{
            fontSize: 12,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 680,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ color: activePersona.color, fontWeight: 700 }}>● {activePersona.label}:</span>
          <span>{activePersona.description}</span>
          <code style={{ fontSize: 11, color: '#64748b', backgroundColor: '#13141c', padding: '2px 6px', borderRadius: 4 }}>
            {activePersona.hash}
          </code>
        </div>
      </div>

      {/* ── DEVICE FRAMES ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 48,
          alignItems: 'flex-start',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* ─── ANDROID: Google Pixel 7 ──────────────────────────────── */}
        {(viewMode === 'both' || viewMode === 'android') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🤖</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fafafa' }}>Google Pixel 7</div>
                <div style={{ fontSize: 11, color: '#71717a' }}>Android 14 · 412 × 892</div>
              </div>
            </div>

            {/* Pixel 7 frame — dark matte aluminium */}
            <div
              style={{
                position: 'relative',
                width: 380,
                /* total height including bezels */
                borderRadius: 46,
                backgroundColor: '#1a1a1a',
                padding: '14px 10px',
                boxShadow: [
                  '0 0 0 1.5px #2a2a2a',
                  '0 0 0 3px #0e0e0e',
                  '0 30px 60px rgba(0,0,0,0.7)',
                  'inset 0 0 0 1px rgba(255,255,255,0.04)',
                ].join(', '),
              }}
            >
              {/* Punch-hole camera */}
              <div
                style={{
                  width: '100%',
                  height: 28,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#0a0a0a', border: '2px solid #2a2a2a' }} />
              </div>

              {/* Screen viewport */}
              <div
                style={{
                  width: '100%',
                  height: 748,
                  borderRadius: 8,
                  overflow: 'hidden',
                  backgroundColor: '#0B0C10',
                  position: 'relative',
                }}
              >
                <iframe
                  key={`android-${selectedPersona}`}
                  src={currentUrl}
                  title="Android Pixel 7 Preview"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>

              {/* Android home bar */}
              <div style={{ height: 22, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
                <div style={{ width: 134, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' }} />
              </div>

              {/* Power button */}
              <div
                style={{
                  position: 'absolute',
                  right: -4,
                  top: 140,
                  width: 4,
                  height: 60,
                  backgroundColor: '#1f1f1f',
                  borderRadius: '0 4px 4px 0',
                  border: '1px solid #2a2a2a',
                }}
              />
              {/* Volume buttons */}
              <div
                style={{
                  position: 'absolute',
                  left: -4,
                  top: 120,
                  width: 4,
                  height: 40,
                  backgroundColor: '#1f1f1f',
                  borderRadius: '4px 0 0 4px',
                  border: '1px solid #2a2a2a',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: -4,
                  top: 170,
                  width: 4,
                  height: 40,
                  backgroundColor: '#1f1f1f',
                  borderRadius: '4px 0 0 4px',
                  border: '1px solid #2a2a2a',
                }}
              />
            </div>
          </div>
        )}

        {/* ─── iOS: Apple iPhone 15 Pro ─────────────────────────────── */}
        {(viewMode === 'both' || viewMode === 'ios') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🍎</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fafafa' }}>Apple iPhone 15 Pro</div>
                <div style={{ fontSize: 11, color: '#71717a' }}>iOS 17 · 393 × 852</div>
              </div>
            </div>

            {/* iPhone 15 Pro frame — titanium brushed */}
            <div
              style={{
                position: 'relative',
                width: 380,
                borderRadius: 56,
                backgroundColor: '#2c2c2e',
                padding: '16px 10px 10px',
                boxShadow: [
                  '0 0 0 1.5px #3a3a3c',
                  '0 0 0 3.5px #1c1c1e',
                  '0 30px 60px rgba(0,0,0,0.7)',
                  'inset 0 0 0 1px rgba(255,255,255,0.06)',
                ].join(', '),
                background: 'linear-gradient(160deg, #3a3a3c 0%, #2c2c2e 40%, #1c1c1e 100%)',
              }}
            >
              {/* Dynamic Island */}
              <div
                style={{
                  width: '100%',
                  height: 34,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 126,
                    height: 34,
                    backgroundColor: '#000',
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                  }}
                >
                  {/* Front camera */}
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#1a1a1e' }} />
                  {/* Face ID sensor */}
                  <div style={{ width: 28, height: 8, borderRadius: 6, backgroundColor: '#111' }} />
                </div>
              </div>

              {/* Screen viewport */}
              <div
                style={{
                  width: '100%',
                  height: 748,
                  borderRadius: 44,
                  overflow: 'hidden',
                  backgroundColor: '#0B0C10',
                  position: 'relative',
                }}
              >
                <iframe
                  key={`ios-${selectedPersona}`}
                  src={currentUrl}
                  title="iPhone 15 Pro Preview"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>

              {/* iOS Home Indicator */}
              <div style={{ height: 22, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 6 }}>
                <div style={{ width: 134, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' }} />
              </div>

              {/* Side button (right) */}
              <div
                style={{
                  position: 'absolute',
                  right: -4,
                  top: 180,
                  width: 4,
                  height: 80,
                  backgroundColor: '#3a3a3c',
                  borderRadius: '0 4px 4px 0',
                }}
              />
              {/* Silent toggle (left top) */}
              <div
                style={{
                  position: 'absolute',
                  left: -4,
                  top: 130,
                  width: 4,
                  height: 30,
                  backgroundColor: '#3a3a3c',
                  borderRadius: '4px 0 0 4px',
                }}
              />
              {/* Volume up (left) */}
              <div
                style={{
                  position: 'absolute',
                  left: -4,
                  top: 175,
                  width: 4,
                  height: 50,
                  backgroundColor: '#3a3a3c',
                  borderRadius: '4px 0 0 4px',
                }}
              />
              {/* Volume down (left) */}
              <div
                style={{
                  position: 'absolute',
                  left: -4,
                  top: 235,
                  width: 4,
                  height: 50,
                  backgroundColor: '#3a3a3c',
                  borderRadius: '4px 0 0 4px',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER NOTE ────────────────────────────────────────────────── */}
      <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', maxWidth: 700 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#71717a' }}>
          Both frames embed the native Flutter mobile client running on <code style={{ color: '#22c55e', backgroundColor: '#13141c', padding: '2px 6px', borderRadius: 4 }}>localhost:8081</code>.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="http://localhost:8081/#/fan" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
            🎧 Open Fan Standalone ↗
          </a>
          <span style={{ color: '#27272a' }}>•</span>
          <a href="http://localhost:8081/#/creator" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
            🎸 Open Solo Standalone ↗
          </a>
          <span style={{ color: '#27272a' }}>•</span>
          <a href="http://localhost:8081/#/band" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#f472b6', textDecoration: 'none', fontWeight: 600 }}>
            🥁 Open Band Standalone ↗
          </a>
          <span style={{ color: '#27272a' }}>•</span>
          <a href="/preview" style={{ fontSize: 12, color: '#a1a1aa', textDecoration: 'none', fontWeight: 600 }}>
            🎭 Next.js Web Preview Studio →
          </a>
        </div>
      </div>
    </div>
  );
}
