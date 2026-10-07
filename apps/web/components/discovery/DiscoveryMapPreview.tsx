'use client';

/**
 * Crowdbeats V2 — DiscoveryMapPreview Web Component
 * 
 * Authentic Google Maps Night / Dark theme interactive preview.
 * Renders realistic Google Maps road network, freeways, water bodies,
 * street names, Google watermark, zoom controls, and musician drop-pin markers.
 */

import React from 'react';
import type { PublicPerformerItem } from '@/lib/discovery/discoveryClient';

interface DiscoveryMapPreviewProps {
  locationName: string;
  performers: PublicPerformerItem[];
  onTapExpand: () => void;
}

export const DiscoveryMapPreview: React.FC<DiscoveryMapPreviewProps> = ({
  locationName,
  performers,
  onTapExpand,
}) => {
  const representativePins = performers.slice(0, 4);

  return (
    <div
      onClick={onTapExpand}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onTapExpand();
      }}
      style={{
        position: 'relative',
        height: 220,
        backgroundColor: '#1A1D28',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#7C3AED';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* ── 1. REALISTIC GOOGLE MAPS NIGHT BASEMAP (SVG VECTOR) ── */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
        viewBox="0 0 640 220"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Water gradient */}
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          {/* Freeway glow */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base Landmass */}
        <rect width="640" height="220" fill="#1A1D28" />

        {/* Pacific Coastline / Bay Geometry */}
        <path
          d="M 0 0 L 130 0 Q 110 70 80 120 T 100 220 L 0 220 Z"
          fill="url(#waterGrad)"
          stroke="#1E293B"
          strokeWidth="1.5"
        />
        <text x="20" y="115" fill="#334155" fontSize="9" fontWeight="700" letterSpacing="2.5">
          PACIFIC OCEAN
        </text>

        {/* Green Parks */}
        <rect x="340" y="30" width="55" height="35" rx="8" fill="#14241D" />
        <text x="350" y="52" fill="#22C55E" opacity="0.4" fontSize="7" fontWeight="600">PARK</text>
        <rect x="210" y="150" width="60" height="28" rx="8" fill="#14241D" />

        {/* Minor City Street Grid */}
        <g stroke="#242938" strokeWidth="1">
          <line x1="120" y1="25" x2="640" y2="25" />
          <line x1="110" y1="55" x2="640" y2="55" />
          <line x1="90" y1="85" x2="640" y2="85" />
          <line x1="85" y1="115" x2="640" y2="115" />
          <line x1="88" y1="145" x2="640" y2="145" />
          <line x1="95" y1="175" x2="640" y2="175" />
          <line x1="100" y1="205" x2="640" y2="205" />

          <line x1="160" y1="0" x2="160" y2="220" />
          <line x1="200" y1="0" x2="200" y2="220" />
          <line x1="240" y1="0" x2="240" y2="220" />
          <line x1="280" y1="0" x2="280" y2="220" />
          <line x1="320" y1="0" x2="320" y2="220" />
          <line x1="360" y1="0" x2="360" y2="220" />
          <line x1="400" y1="0" x2="400" y2="220" />
          <line x1="440" y1="0" x2="440" y2="220" />
          <line x1="480" y1="0" x2="480" y2="220" />
          <line x1="520" y1="0" x2="520" y2="220" />
          <line x1="560" y1="0" x2="560" y2="220" />
          <line x1="600" y1="0" x2="600" y2="220" />
        </g>

        {/* Major Arterial Boulevards (Torrance Blvd, Hawthorne Blvd, Sepulveda Blvd) */}
        <g stroke="#2E374D" strokeWidth="3" fill="none">
          {/* Torrance Blvd */}
          <path d="M 100 110 Q 300 105 640 112" />
          {/* Hawthorne Blvd */}
          <path d="M 310 0 Q 315 110 325 220" />
          {/* Sepulveda Blvd */}
          <path d="M 90 175 Q 350 170 640 180" />
        </g>

        {/* Interstate Freeways (I-405 & CA-1 / PCH) */}
        <g stroke="#414D66" strokeWidth="5" fill="none">
          <path d="M 430 0 Q 460 90 540 220" />
          <path d="M 130 0 Q 115 80 110 220" />
        </g>
        <g stroke="#556485" strokeWidth="2.5" fill="none">
          <path d="M 430 0 Q 460 90 540 220" />
          <path d="M 130 0 Q 115 80 110 220" />
        </g>

        {/* Highway Shields */}
        {/* I-405 Shield */}
        <rect x="470" y="90" width="22" height="16" rx="3" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1" />
        <text x="481" y="102" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle">405</text>

        {/* CA-1 Shield */}
        <rect x="118" y="45" width="18" height="14" rx="3" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1" />
        <text x="127" y="56" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle">1</text>

        {/* Street & Area Labels */}
        <text x="350" y="95" fill="#E2E8F0" fontSize="13" fontWeight="800" letterSpacing="1">
          {locationName.toUpperCase()}
        </text>
        <text x="145" y="38" fill="#94A3B8" fontSize="9" fontWeight="600">Redondo Beach</text>
        <text x="440" y="160" fill="#94A3B8" fontSize="9" fontWeight="600">Del Amo</text>
        <text x="210" y="105" fill="#64748B" fontSize="8" fontWeight="500">Torrance Blvd</text>
        <text x="315" y="40" fill="#64748B" fontSize="8" fontWeight="500" transform="rotate(85, 315, 40)">Hawthorne Blvd</text>
      </svg>

      {/* ── 2. GOOGLE MAPS CONTROLS (ZOOM & COMPASS) ── */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {/* Compass Button */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            backgroundColor: 'rgba(32, 36, 48, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#EA4335',
          }}
          title="Compass (North)"
        >
          🧭
        </div>

        {/* Zoom In/Out Widget */}
        <div
          style={{
            backgroundColor: 'rgba(32, 36, 48, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              width: 26,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            +
          </div>
          <div
            style={{
              width: 26,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            −
          </div>
        </div>
      </div>

      {/* ── 3. SIGNATURE GOOGLE MAPS BLUE GPS DOT ── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '48%',
          transform: 'translate(-50%, -50%)',
          zIndex: 8,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Pulsing blue accuracy ring */}
        <div
          style={{
            position: 'absolute',
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: 'rgba(66, 133, 244, 0.25)',
            border: '1px solid rgba(66, 133, 244, 0.5)',
          }}
        />
        {/* Solid blue dot with white border */}
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#4285F4',
            border: '2.5px solid #FFFFFF',
            boxShadow: '0 0 10px rgba(66, 133, 244, 0.8)',
          }}
        />
      </div>

      {/* ── 4. GOOGLE MAPS MUSICIAN PIN DROPS (UBER / LYFT MAP STYLE) ── */}
      {representativePins.map((p, idx) => {
        const positions = [
          { top: '32%', left: '34%' },
          { top: '65%', left: '62%' },
          { top: '28%', left: '72%' },
          { top: '72%', left: '26%' },
        ];
        const pos = positions[idx] ?? { top: '50%', left: '50%' };
        const isLive = p.isLive;
        const isSolo = p.type !== 'band';

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              transform: 'translate(-50%, -90%)',
              zIndex: 15,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Grounding Radar Pulse Halo (Uber / Lyft Street Locator Effect) */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                width: isSolo ? 38 : 32,
                height: 14,
                borderRadius: '50%',
                backgroundColor: isLive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(168, 85, 247, 0.35)',
                boxShadow: isLive
                  ? '0 0 10px rgba(16, 185, 129, 0.8)'
                  : '0 0 10px rgba(168, 85, 247, 0.8)',
                transform: 'scaleY(0.55)',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />

            {/* Top Stage Avatar (Noticeable 44px Bear for Solo Musicians) */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {isSolo ? (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: `2px solid ${isLive ? '#10B981' : '#C084FC'}`,
                      boxShadow: isLive
                        ? '0 0 12px rgba(16, 185, 129, 0.8), 0 3px 8px rgba(0, 0, 0, 0.6)'
                        : '0 0 8px rgba(192, 132, 252, 0.6), 0 3px 8px rgba(0, 0, 0, 0.6)',
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
                  {isLive && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        fontSize: 7,
                        fontWeight: 900,
                        padding: '1px 4px',
                        borderRadius: 9999,
                        border: '1px solid #000000',
                        boxShadow: '0 0 6px #10B981',
                        zIndex: 3,
                      }}
                    >
                      LIVE
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: `2px solid ${isLive ? '#EC4899' : '#E879F9'}`,
                      boxShadow: isLive
                        ? '0 0 14px rgba(236, 72, 153, 0.9), 0 3px 8px rgba(0, 0, 0, 0.6)'
                        : '0 0 8px rgba(217, 70, 239, 0.6), 0 3px 8px rgba(0, 0, 0, 0.6)',
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
                  {isLive && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        backgroundColor: '#EC4899',
                        color: '#FFFFFF',
                        fontSize: 7,
                        fontWeight: 900,
                        padding: '1px 4px',
                        borderRadius: 9999,
                        border: '1px solid #000000',
                        boxShadow: '0 0 6px #EC4899',
                        zIndex: 3,
                      }}
                    >
                      BAND
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
                fontSize: 11,
                fontWeight: 800,
                color: '#FFFFFF',
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


      {/* ── 6. BOTTOM EXPAND CTA BAR ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          padding: '10px 16px',
          background: 'linear-gradient(180deg, rgba(21, 23, 34, 0.6) 0%, rgba(21, 23, 34, 0.98) 100%)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>
            {representativePins.length} live stages in {locationName}
          </span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#A855F7', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>Expand Map</span>
          <span>➔</span>
        </span>
      </div>
    </div>
  );
};
