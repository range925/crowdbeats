'use client';

/**
 * CrowdbeatsMapBottomSheet (Phase 11 — Routing, Walking Directions & Destination Experience)
 *
 * Responsive, animated performer/venue detail sheet for the live map.
 * Features:
 *   - Smooth spring-like slide-up entrance & top drag handle
 *   - Performer avatar with live ring pulse
 *   - Walking / Driving / Cycling route mode toggle
 *   - Real-time route distance & duration metrics
 *   - 1-tap Apple Maps / Google Maps external navigation handoff
 *   - 1-tap artist tip and profile access
 */

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CbLiveBadge, CbPillButton, CbOutlineButton } from '@/components/ui';
import type { LiveCheckin } from '@/lib/firebase/firestore';
import type { RouteMode } from '@/lib/maps/routing';

export interface CrowdbeatsMapBottomSheetProps {
  /** Currently selected performer. Pass null to close/hide. */
  performer: LiveCheckin | null;
  /** Callback when user closes or dismisses the sheet. */
  onClose: () => void;
  /** Formatted directions or distance text (e.g. "4 min walk • 0.3 mi"). */
  directionsText?: string | null;
  /** Callback to request directions to this performer. */
  onGetDirections?: () => void;
  /** Whether routing request is in flight. */
  isDirectionsLoading?: boolean;
  /** Active travel mode. */
  routeMode?: RouteMode;
  /** Callback to switch travel mode. */
  onSelectRouteMode?: (mode: RouteMode) => void;
  /** Callback to open native device navigation app (Apple / Google Maps). */
  onOpenExternalNav?: () => void;
  /** Whether routing failed or permission was denied. */
  routeError?: string | null;
  /** Optional custom container CSS classes. */
  className?: string;
}

export function CrowdbeatsMapBottomSheet({
  performer,
  onClose,
  directionsText,
  onGetDirections,
  isDirectionsLoading = false,
  routeMode = 'walking',
  onSelectRouteMode,
  onOpenExternalNav,
  routeError,
  className = '',
}: CrowdbeatsMapBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!performer) return null;

  const isBand = performer.type === 'band';
  const profileSlug = performer.slug || (isBand ? 'band/' + performer.uid : 'artist/' + performer.uid);
  const tipUrl = performer.tipLink || ('/fan/tip?performer=' + performer.uid);

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-label={`${performer.performerName} Performance Details`}
      className={`absolute bottom-3 left-3 right-3 sm:left-6 sm:right-6 md:left-8 md:right-auto md:max-w-md bg-[#151722]/95 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-[#00F076]/30 shadow-[0_16px_48px_rgba(0,0,0,0.85),0_0_24px_rgba(0,240,118,0.15)] z-20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none transform translate-y-0 opacity-100 ${className}`}
    >
      {/* Top drag handle indicator (mobile UX) */}
      <div className="flex justify-center -mt-1 mb-3">
        <div className="w-10 h-1 rounded-full bg-[#2B2D44]" />
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close details"
        className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-[#1E2032] border border-[#2B2D44] text-[#94A3B8] hover:text-white hover:border-[#00F076]/40 flex items-center justify-center text-sm transition-colors"
      >
        ✕
      </button>

      {/* Performer Header */}
      <div className="flex items-start gap-3.5 pr-6">
        {/* Avatar with live ring */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-[#00F076] flex-shrink-0 bg-[#1E2032] shadow-[0_0_12px_rgba(0,240,118,0.25)]">
          {performer.photoUrl ? (
            <img
              src={performer.photoUrl}
              alt={performer.performerName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {isBand ? '🎸' : '🎵'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-white truncate">
              {performer.performerName}
            </h3>
            <CbLiveBadge label="LIVE NOW" />
            <span className="text-[10px] bg-[#1E2032] border border-[#2B2D44] text-[#94A3B8] px-2 py-0.5 rounded-full capitalize font-medium">
              {performer.type}
            </span>
          </div>

          {/* Venue & status */}
          <p className="text-xs text-[#00F076] font-semibold truncate mt-1 flex items-center gap-1.5">
            <span>📍</span>
            <span>{performer.venueName}</span>
          </p>

          {/* Walking distance & genres */}
          <div className="text-[11px] text-[#94A3B8] mt-1 flex items-center gap-2 flex-wrap">
            {directionsText ? (
              <span className="text-[#00F076] font-bold bg-[#00F076]/10 px-2.5 py-0.5 rounded-full border border-[#00F076]/30 flex items-center gap-1">
                <span>{routeMode === 'driving' ? '🚗' : routeMode === 'cycling' ? '🚲' : '🚶'}</span>
                <span>{directionsText}</span>
              </span>
            ) : (
              <span>
                {performer.distanceMiles != null
                  ? `${performer.distanceMiles} mi away`
                  : 'Nearby'}
              </span>
            )}

            {performer.genres && performer.genres.length > 0 && (
              <span className="text-[#64748B] truncate">
                • {performer.genres.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Route Mode Switcher & External Handoff (when route is calculated or loading) */}
      {(directionsText || isDirectionsLoading || routeError) && (
        <div className="mt-3.5 pt-3 border-t border-[#2B2D44]/70 flex items-center justify-between gap-2 flex-wrap">
          {/* Travel Mode Pills */}
          <div className="flex items-center gap-1 bg-[#1A1C28] p-1 rounded-xl border border-[#2B2D44]">
            {(['walking', 'driving', 'cycling'] as RouteMode[]).map((m) => {
              const active = routeMode === m;
              const icon = m === 'walking' ? '🚶' : m === 'driving' ? '🚗' : '🚲';
              const label = m === 'walking' ? 'Walk' : m === 'driving' ? 'Drive' : 'Bike';
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSelectRouteMode?.(m)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#00F076] text-black shadow-[0_0_10px_rgba(0,240,118,0.3)]'
                      : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{icon}</span>
                  <span className="hidden xs:inline">{label}</span>
                </button>
              );
            })}
          </div>

          {/* External App Handoff */}
          {onOpenExternalNav && (
            <button
              type="button"
              onClick={onOpenExternalNav}
              className="text-xs font-semibold text-[#00F076] hover:underline flex items-center gap-1 bg-[#00F076]/10 hover:bg-[#00F076]/20 px-2.5 py-1 rounded-lg border border-[#00F076]/30 transition-colors"
              title="Open turn-by-turn navigation in Maps app"
            >
              <span>↗</span>
              <span>Open in Maps</span>
            </button>
          )}
        </div>
      )}

      {/* Error / Permission warning notice */}
      {routeError && (
        <div className="mt-2 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2">
          <span>⚠️ {routeError}</span>
          {onOpenExternalNav && (
            <button
              type="button"
              onClick={onOpenExternalNav}
              className="text-white underline font-semibold flex-shrink-0"
            >
              Use Maps app
            </button>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#2B2D44]/70">
        {onGetDirections && (
          <button
            type="button"
            onClick={onGetDirections}
            disabled={isDirectionsLoading}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border border-[#2B2D44] text-[#94A3B8] hover:border-[#00F076] hover:text-white transition-all disabled:opacity-50 whitespace-nowrap bg-[#1A1C28]"
          >
            {isDirectionsLoading ? (
              <>⏳ Routing…</>
            ) : (
              <>{routeMode === 'driving' ? '🚗 Drive' : routeMode === 'cycling' ? '🚲 Bike' : '🚶 Route'}</>
            )}
          </button>
        )}

        <Link href={`/${profileSlug}`} className="flex-1">
          <CbOutlineButton
            label="Profile"
            isFullWidth
            className="!py-2 !text-xs whitespace-nowrap"
          />
        </Link>

        <Link href={tipUrl} className="flex-1">
          <CbPillButton
            label="💚 Tip Now"
            isFullWidth
            className="!py-2 !text-xs whitespace-nowrap !bg-[#00F076] !text-black font-bold hover:!opacity-95"
          />
        </Link>
      </div>
    </div>
  );
}
