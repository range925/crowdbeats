'use client';

/**
 * Crowdbeats V2 — Animated Performer Marker (Phase 9 Web)
 *
 * Uber/Lyft-quality map feedback component with client-side interpolation:
 * - Frame-rate decoupled interpolation (60/120fps RAF loop)
 * - Teleportation guard (>500m): snaps with cross-fade rather than city-wide sweep
 * - Stationary venue invariant: anchored coordinates (zero fake movement), subtle breathing pulse
 * - Mobile coarse invariant: interpolates only between published 100m grid centroids
 * - Freshness badges: Live, Updated just now, Updated Xm ago, Approximate area, Reconnecting, Ended
 * - Reduced-motion compliance: respects prefers-reduced-motion media query
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  MarkerInterpolator,
  Coordinate,
  computeMarkerFreshness,
  MarkerFreshnessInfo,
} from '@/lib/maps/animation/markerInterpolator';

export interface WebPublicPerformer {
  id: string;
  name: string;
  type: 'artist' | 'band';
  isLive: boolean;
  isStationary: boolean;
  venueName?: string;
  lastUpdatedMs: number;
  endsAtMs?: number;
  coord: Coordinate;
}

export interface AnimatedPerformerMarkerProps {
  performer: WebPublicPerformer;
  onClick?: () => void;
  enablePulse?: boolean;
}

export const AnimatedPerformerMarker: React.FC<AnimatedPerformerMarkerProps> = ({
  performer,
  onClick,
  enablePulse = true,
}) => {
  const [currentCoord, setCurrentCoord] = useState<Coordinate>(performer.coord);
  const [opacity, setOpacity] = useState<number>(1.0);
  const interpolatorRef = useRef<MarkerInterpolator | null>(null);

  // Initialize interpolator once
  useEffect(() => {
    interpolatorRef.current = new MarkerInterpolator(performer.coord, performer.isStationary);
    return () => {
      interpolatorRef.current?.destroy();
      interpolatorRef.current = null;
    };
  }, []);

  // Update stationary mode on prop change
  useEffect(() => {
    interpolatorRef.current?.setStationary(performer.isStationary);
  }, [performer.isStationary]);

  // Animate to new coordinate when target changes
  useEffect(() => {
    if (!interpolatorRef.current) return;

    interpolatorRef.current.animateTo(performer.coord, {
      onUpdate: (newCoord, newOpacity) => {
        setCurrentCoord(newCoord);
        setOpacity(newOpacity);
      },
    });
  }, [performer.coord.lat, performer.coord.lng]);

  const freshness: MarkerFreshnessInfo = computeMarkerFreshness({
    lastUpdatedMs: performer.lastUpdatedMs,
    isLive: performer.isLive,
    isStationary: performer.isStationary,
    endsAtMs: performer.endsAtMs,
  });

  const isLive = performer.isLive && freshness.state !== 'ended';
  const isStationary = performer.isStationary;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      data-testid={`animated-marker-${performer.id}`}
      data-lat={currentCoord.lat.toFixed(5)}
      data-lng={currentCoord.lng.toFixed(5)}
      data-stationary={isStationary ? 'true' : 'false'}
      data-freshness={freshness.state}
      className="relative flex flex-col items-center cursor-pointer select-none focus:outline-none transition-opacity duration-150"
      style={{
        opacity,
        willChange: 'transform, opacity',
      }}
    >
      {/* 1. Name & Freshness Badge Pill */}
      <div
        className={`px-2.5 py-1 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-lg border border-white/20 ${
          isStationary ? 'bg-[#10B981]' : isLive ? 'bg-[#8B5CF6]' : 'bg-[#64748B]'
        }`}
        style={{
          boxShadow: `0 4px 14px ${freshness.color}40`,
        }}
      >
        <span>{performer.type === 'band' ? '🎸' : '🐻'}</span>
        <span className="truncate max-w-[130px]">{performer.name}</span>

        {/* Freshness Badge */}
        <span
          data-testid="freshness-badge"
          className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white"
          style={{ color: freshness.color }}
        >
          {freshness.label}
        </span>
      </div>

      {/* 2. Anchor Point & Breathing Pulse Halo */}
      <div className="relative flex items-center justify-center mt-1">
        {/* Breathing Halo for Live/Stationary Session */}
        {isLive && enablePulse && (
          <div
            data-testid="marker-breathing-halo"
            className="absolute w-8 h-8 rounded-full border-2 animate-ping pointer-events-none opacity-40 motion-reduce:hidden"
            style={{
              borderColor: freshness.color,
              backgroundColor: `${freshness.color}20`,
            }}
          />
        )}

        {/* Pin Tip / Anchor */}
        {isStationary ? (
          <div
            data-testid="stationary-anchor"
            className="w-3 h-3 rounded-full bg-white border-2 border-[#10B981] shadow-md"
          />
        ) : (
          <div
            data-testid="coarse-centroid-tip"
            className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px]"
            style={{ borderTopColor: isLive ? '#8B5CF6' : '#64748B' }}
          />
        )}
      </div>
    </div>
  );
};
