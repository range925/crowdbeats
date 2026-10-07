'use client';

/**
 * Crowdbeats V2 — Discovery Map Component (Web)
 * 
 * Full-fidelity Google Maps Night / Dark Theme interactive map.
 * Complete with road networks, water bodies, Google Maps UI chrome,
 * custom musician drop-pin markers, venue pins, and live stage indicators.
 */

import React, { useState } from 'react';
import type { PublicPerformerItem, PublicVenueItem } from '@/lib/discovery/discoveryClient';
import type { DiscoveryLocation } from '@crowdbeats/contracts';

interface DiscoveryMapProps {
  location: DiscoveryLocation;
  performers: PublicPerformerItem[];
  venues: PublicVenueItem[];
  onSelectPerformer: (performer: PublicPerformerItem) => void;
  onSelectVenue: (venue: PublicVenueItem) => void;
  onTip: (performer: PublicPerformerItem) => void;
}

export const DiscoveryMap: React.FC<DiscoveryMapProps> = ({
  location,
  performers,
  venues,
  onSelectPerformer,
  onSelectVenue,
  onTip,
}) => {
  const [selectedPerformer, setSelectedPerformer] = useState<PublicPerformerItem | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<PublicVenueItem | null>(null);
  const [mapType, setMapType] = useState<'map' | 'satellite'>('map');
  const [zoomLevel, setZoomLevel] = useState<number>(14);

  const handlePerformerClick = (p: PublicPerformerItem) => {
    setSelectedVenue(null);
    setSelectedPerformer(p);
    onSelectPerformer(p);
  };

  const handleVenueClick = (v: PublicVenueItem) => {
    setSelectedPerformer(null);
    setSelectedVenue(v);
    onSelectVenue(v);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 540,
        backgroundColor: '#1A1D28',
        borderRadius: 20,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* ── 1. GOOGLE MAPS NIGHT BASEMAP VECTOR CANVAS ── */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
        viewBox="0 0 800 540"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>

        {/* Base Landmass */}
        <rect width="800" height="540" fill={mapType === 'satellite' ? '#141820' : '#1A1D28'} />

        {/* Coastline / Water Body */}
        <path
          d="M 0 0 L 160 0 Q 140 160 100 280 T 130 540 L 0 540 Z"
          fill="url(#oceanGrad)"
          stroke="#1E293B"
          strokeWidth="2"
        />
        <text x="30" y="270" fill="#334155" fontSize="11" fontWeight="700" letterSpacing="3.0">
          PACIFIC OCEAN
        </text>

        {/* Parks & Open Spaces */}
        <rect x="420" y="80" width="90" height="60" rx="12" fill="#14241D" />
        <text x="440" y="115" fill="#22C55E" opacity="0.4" fontSize="9" fontWeight="600">DEL AMO PARK</text>
        <rect x="260" y="360" width="110" height="50" rx="12" fill="#14241D" />
        <text x="280" y="390" fill="#22C55E" opacity="0.4" fontSize="9" fontWeight="600">COLUMBIA PARK</text>

        {/* Minor City Street Grid */}
        <g stroke="#242938" strokeWidth="1.2">
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={`h-${i}`} x1="120" y1={30 + i * 28} x2="800" y2={30 + i * 28} />
          ))}
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={`v-${i}`} x1={160 + i * 36} y1="0" x2={160 + i * 36} y2="540" />
          ))}
        </g>

        {/* Major Arterial Boulevards */}
        <g stroke="#2E374D" strokeWidth="4" fill="none">
          {/* Torrance Blvd */}
          <path d="M 120 260 Q 400 250 800 265" />
          {/* Hawthorne Blvd */}
          <path d="M 390 0 Q 400 270 415 540" />
          {/* Sepulveda Blvd */}
          <path d="M 110 420 Q 450 410 800 430" />
          {/* Crenshaw Blvd */}
          <path d="M 580 0 Q 590 270 600 540" />
          {/* Carson St */}
          <path d="M 140 140 Q 450 135 800 145" />
        </g>

        {/* Interstate Freeways (I-405, CA-1 / PCH, CA-91) */}
        <g stroke="#3E475C" strokeWidth="7" fill="none">
          <path d="M 520 0 Q 560 220 680 540" />
          <path d="M 160 0 Q 145 200 135 540" />
          <path d="M 140 70 Q 500 65 800 75" />
        </g>
        <g stroke="#556485" strokeWidth="3.5" fill="none">
          <path d="M 520 0 Q 560 220 680 540" />
          <path d="M 160 0 Q 145 200 135 540" />
          <path d="M 140 70 Q 500 65 800 75" />
        </g>

        {/* Highway Shields */}
        {/* I-405 Shield */}
        <rect x="580" y="220" width="26" height="18" rx="4" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1" />
        <text x="593" y="233" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle">405</text>

        {/* CA-1 Shield */}
        <rect x="142" y="110" width="22" height="16" rx="3" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1" />
        <text x="153" y="122" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle">1</text>

        {/* CA-91 Shield */}
        <rect x="420" y="60" width="22" height="16" rx="3" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1" />
        <text x="431" y="72" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle">91</text>

        {/* District & Street Labels */}
        <text x="440" y="240" fill="#F1F5F9" fontSize="16" fontWeight="800" letterSpacing="1.5">
          {location.city.toUpperCase()}
        </text>
        <text x="175" y="85" fill="#94A3B8" fontSize="11" fontWeight="600">Redondo Beach</text>
        <text x="590" y="380" fill="#94A3B8" fontSize="11" fontWeight="600">Harbor City</text>
        <text x="260" y="252" fill="#64748B" fontSize="9" fontWeight="500">Torrance Blvd</text>
        <text x="395" y="120" fill="#64748B" fontSize="9" fontWeight="500" transform="rotate(86, 395, 120)">Hawthorne Blvd</text>
        <text x="240" y="412" fill="#64748B" fontSize="9" fontWeight="500">Sepulveda Blvd</text>
      </svg>

      {/* ── 2. GOOGLE MAPS TOP-LEFT CONTROLS (MAP / SATELLITE TOGGLE) ── */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 20,
          backgroundColor: 'rgba(30, 34, 48, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 8,
          display: 'flex',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        <button
          type="button"
          onClick={() => setMapType('map')}
          style={{
            padding: '6px 12px',
            border: 'none',
            backgroundColor: mapType === 'map' ? '#7C3AED' : 'transparent',
            color: mapType === 'map' ? '#FFFFFF' : '#94A3B8',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => setMapType('satellite')}
          style={{
            padding: '6px 12px',
            border: 'none',
            backgroundColor: mapType === 'satellite' ? '#7C3AED' : 'transparent',
            color: mapType === 'satellite' ? '#FFFFFF' : '#94A3B8',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Satellite
        </button>
      </div>

      {/* ── 3. GOOGLE MAPS TOP-RIGHT CONTROLS (COMPASS, FULLSCREEN) ── */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Compass */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'rgba(30, 34, 48, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            color: '#EA4335',
            cursor: 'pointer',
          }}
          title="Compass"
        >
          🧭
        </div>

        {/* Zoom Controls */}
        <div
          style={{
            backgroundColor: 'rgba(30, 34, 48, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 1, 18))}
            style={{
              width: 32,
              height: 30,
              border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 1, 10))}
            style={{
              width: 32,
              height: 30,
              border: 'none',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            −
          </button>
        </div>
      </div>

      {/* ── 4. SIGNATURE GOOGLE MAPS GPS USER LOCATION DOT ── */}
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '48%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: 'rgba(66, 133, 244, 0.25)',
            border: '1px solid rgba(66, 133, 244, 0.5)',
          }}
        />
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: '#4285F4',
            border: '3px solid #FFFFFF',
            boxShadow: '0 0 12px rgba(66, 133, 244, 0.8)',
          }}
        />
      </div>

      {/* ── 5. MUSICIAN DROP-PIN MARKERS (UBER / LYFT MAP VEHICLE STYLE) ── */}
      {performers.map((p, idx) => {
        const offsets = [
          { top: '30%', left: '38%' },
          { top: '62%', left: '60%' },
          { top: '26%', left: '70%' },
          { top: '74%', left: '30%' },
          { top: '42%', left: '78%' },
        ];
        const pos = offsets[idx] ?? { top: '50%', left: '50%' };
        const isSelected = selectedPerformer?.id === p.id;
        const isLive = p.isLive;
        const isSolo = p.type !== 'band';

        return (
          <div
            key={p.id}
            onClick={() => handlePerformerClick(p)}
            style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              transform: isSelected ? 'translate(-50%, -90%) scale(1.12)' : 'translate(-50%, -90%)',
              zIndex: isSelected ? 45 : (isLive ? 35 : 25),
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: isSelected ? 'drop-shadow(0 0 16px rgba(124, 58, 237, 0.9))' : undefined,
            }}
          >
            {/* Grounding Radar Pulse Halo (Uber / Lyft Street Locator Effect) */}
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                width: isSolo ? 46 : 38,
                height: 18,
                borderRadius: '50%',
                backgroundColor: isLive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(168, 85, 247, 0.35)',
                boxShadow: isLive
                  ? '0 0 14px rgba(16, 185, 129, 0.85)'
                  : '0 0 14px rgba(168, 85, 247, 0.85)',
                transform: 'scaleY(0.55)',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />

            {/* Top Stage Avatar (Noticeable Bear Icons: Solo Bear with Mic, Band Bear with Full Electric Guitar) */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: 2,
              }}
            >
              {isSolo ? (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Glowing Aura ring for Solo Musician */}
                  {isLive && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: -4,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, transparent 70%)',
                        animation: 'pulse 2s infinite',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: `2.5px solid ${isLive ? '#10B981' : '#C084FC'}`,
                      boxShadow: isLive
                        ? '0 0 16px rgba(16, 185, 129, 0.8), 0 4px 10px rgba(0, 0, 0, 0.6)'
                        : '0 0 12px rgba(192, 132, 252, 0.6), 0 4px 10px rgba(0, 0, 0, 0.6)',
                      transition: 'transform 0.2s ease',
                      backgroundColor: '#1E1B4B',
                    }}
                  >
                    <img
                      src={p.photoUrl || '/instagram/repost_1_tomwhite.jpg'}
                      alt={p.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/instagram/repost_1_tomwhite.jpg';
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                  {/* Live Mini Microphone Pip */}
                  {isLive && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        fontSize: 8,
                        fontWeight: 900,
                        padding: '1px 5px',
                        borderRadius: 9999,
                        border: '1.5px solid #000000',
                        boxShadow: '0 0 8px #10B981',
                        letterSpacing: '0.04em',
                        zIndex: 3,
                      }}
                    >
                      LIVE
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Glowing Aura ring for Band */}
                  {isLive && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: -4,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.45) 0%, transparent 70%)',
                        animation: 'pulse 2s infinite',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: `2.5px solid ${isLive ? '#EC4899' : '#E879F9'}`,
                      boxShadow: isLive
                        ? '0 0 18px rgba(236, 72, 153, 0.9), 0 4px 10px rgba(0, 0, 0, 0.6)'
                        : '0 0 12px rgba(217, 70, 239, 0.6), 0 4px 10px rgba(0, 0, 0, 0.6)',
                      transition: 'transform 0.2s ease',
                      backgroundColor: '#3B0764',
                    }}
                  >
                    <img
                      src={p.photoUrl || '/instagram/repost_4_velvet_room_band.jpg'}
                      alt={p.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/instagram/repost_4_velvet_room_band.jpg';
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                  {/* Live Mini Band Pip */}
                  {isLive && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        backgroundColor: '#EC4899',
                        color: '#FFFFFF',
                        fontSize: 8,
                        fontWeight: 900,
                        padding: '1px 5px',
                        borderRadius: 9999,
                        border: '1.5px solid #000000',
                        boxShadow: '0 0 8px #EC4899',
                        letterSpacing: '0.04em',
                        zIndex: 3,
                      }}
                    >
                      LIVE
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Musician / Band Name Underneath (No Bubble Container) */}
            <span
              style={{
                position: 'relative',
                zIndex: 3,
                fontSize: 12,
                fontWeight: 800,
                color: isSelected ? '#A855F7' : '#FFFFFF',
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.95), 0 0 10px rgba(0, 0, 0, 0.9)',
                whiteSpace: 'nowrap',
                marginTop: 2,
                letterSpacing: '-0.01em',
              }}
            >
              {p.name}
            </span>
          </div>
        );
      })}

      {/* ── 6. VENUE MARKERS ── */}
      {venues.map((v, idx) => {
        const offsets = [
          { top: '38%', left: '22%' },
          { top: '18%', left: '50%' },
          { top: '68%', left: '76%' },
        ];
        const pos = offsets[idx] ?? { top: '50%', left: '50%' };
        const isSelected = selectedVenue?.id === v.id;

        return (
          <div
            key={v.id}
            onClick={() => handleVenueClick(v)}
            style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              transform: 'translate(-50%, -100%)',
              zIndex: isSelected ? 35 : 20,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#1E2032',
                border: '1.5px solid rgba(168, 85, 247, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              🏟️
            </div>
            <div
              style={{
                marginTop: 2,
                padding: '1px 6px',
                borderRadius: 4,
                backgroundColor: 'rgba(15, 17, 26, 0.85)',
                color: '#CBD5E1',
                fontSize: 9,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {v.name}
            </div>
          </div>
        );
      })}


      {/* ── 8. BOTTOM SELECTION PREVIEW CARD ── */}
      {selectedPerformer && (
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            right: 14,
            zIndex: 50,
            backgroundColor: 'rgba(21, 23, 34, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(124, 58, 237, 0.5)',
            borderRadius: 16,
            padding: 14,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                backgroundColor: '#1E2032',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              <img
                src={
                  selectedPerformer.photoUrl ||
                  (selectedPerformer.type === 'band'
                    ? '/instagram/repost_4_velvet_room_band.jpg'
                    : '/instagram/repost_1_tomwhite.jpg')
                }
                alt={selectedPerformer.name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    selectedPerformer.type === 'band'
                      ? '/instagram/repost_4_velvet_room_band.jpg'
                      : '/instagram/repost_1_tomwhite.jpg';
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 10,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
            <div>
              <div style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{selectedPerformer.name}</span>
                {selectedPerformer.isLive && (
                  <span style={{ color: '#10B981', fontSize: 10, fontWeight: 800, backgroundColor: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: 4 }}>
                    ● LIVE
                  </span>
                )}
              </div>
              <div style={{ color: 'var(--cb-text-secondary)', fontSize: 12 }}>
                @{selectedPerformer.currentVenueName ?? 'Main Stage'} · {selectedPerformer.distanceMiles ?? 0.3} mi away
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => onTip(selectedPerformer)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
              }}
            >
              Tip $20
            </button>
            <button
              type="button"
              onClick={() => setSelectedPerformer(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cb-text-muted)',
                fontSize: 16,
                cursor: 'pointer',
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
