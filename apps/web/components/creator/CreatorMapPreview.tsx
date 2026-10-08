'use client';

/**
 * Crowdbeats V2 — Creator Map Preview ("What Fans See") (Phase 9 Web)
 *
 * Previews the exact map representation fans see:
 * - Stationary venue sessions: Anchored venue pin with halo and venue name.
 * - Mobile sessions: 100m coarse grid centroid with approximate indicator.
 * - Truthful disclosure of privacy guarantees (raw GPS is never broadcast).
 */

import React from 'react';
import {
  AnimatedPerformerMarker,
  WebPublicPerformer,
} from '@/components/maps/AnimatedPerformerMarker';
import {
  computeMarkerFreshness,
  MarkerFreshnessInfo,
} from '@/lib/maps/animation/markerInterpolator';

export interface CreatorMapPreviewProps {
  performer: WebPublicPerformer;
  className?: string;
}

export const CreatorMapPreview: React.FC<CreatorMapPreviewProps> = ({
  performer,
  className = '',
}) => {
  const freshness: MarkerFreshnessInfo = computeMarkerFreshness({
    lastUpdatedMs: performer.lastUpdatedMs,
    isLive: performer.isLive,
    isStationary: performer.isStationary,
    endsAtMs: performer.endsAtMs,
  });

  return (
    <div
      data-testid="creator-map-preview-card"
      className={`rounded-2xl border border-[#8B5CF6]/30 bg-[#131315] p-5 space-y-4 shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <h2 className="text-base font-bold text-white">What Fans See</h2>
        </div>

        <span
          className="px-2.5 py-0.5 rounded-full text-xs font-extrabold border"
          style={{
            color: freshness.color,
            borderColor: `${freshness.color}40`,
            backgroundColor: `${freshness.color}15`,
          }}
        >
          {freshness.label}
        </span>
      </div>

      {/* Simulated Map Canvas */}
      <div className="relative h-32 w-full rounded-xl bg-[#0F111A] border border-white/10 flex items-center justify-center overflow-hidden">
        {/* Grid lines background */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Live Marker Preview */}
        <div className="relative z-10">
          <AnimatedPerformerMarker performer={performer} enablePulse={false} />
        </div>

        {/* Pin Type Pill */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1 rounded-md bg-black/80 text-[11px] text-white/80 font-medium whitespace-nowrap border border-white/10">
          {performer.isStationary
            ? '🏛️ Verified Venue Pin (Anchored)'
            : '📍 100m Coarse Area Centroid'}
        </div>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="flex items-start gap-2 text-xs text-[#94A3B8] leading-relaxed">
        <svg className="w-4 h-4 text-[#00F076] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>
          {performer.isStationary
            ? `Stationary session: Locked to ${performer.venueName || 'verified venue'}. Zero movement or drift is broadcast to fans.`
            : 'Mobile session: Broadcast as an approximate 100m grid centroid. Raw GPS telemetry is never revealed or interpolated.'}
        </span>
      </div>
    </div>
  );
};
