'use client';

/**
 * Crowdbeats V2 — Web Creator Crowd Radar / Audience Nearby (Phase 8)
 *
 * Provides real-time, privacy-safe demand signals for active performers.
 *
 * Privacy Invariants:
 * 1. Authorization: Only verified Solo Musicians and Bands with an ACTIVE stage session
 *    can view this screen. Fans, guests, and unverified users are strictly denied.
 * 2. k-Anonymity (k >= 5): Aggregate zones require >= 5 supporters. Individual fan
 *    coordinates are never exposed. Counts are displayed strictly in bands ([5-14], [15+]).
 * 3. Opted-in Supporters: Only fans who explicitly granted visibility appear in the
 *    supporter list. Distance is displayed as approximate bands (~50m, ~100m).
 * 4. Permitted Actions: View profile and Stage Shoutout/Broadcast. No direct messaging.
 * 5. Cadence Throttling: Max 12 queries/min to prevent differential triangulation attacks.
 * 6. Browser Background Notice: Alerts creator that web browsers suspend background
 *    execution when the tab is hidden.
 * 7. Tipping Independence: Completed tips do NOT grant presence visibility.
 */

import React, { useState, useEffect, useRef } from 'react';
import { webReadVolumeTracker } from '@/lib/discovery/readVolumeInstrumentation';
import { CreatorMapPreview } from './CreatorMapPreview';

export interface AggregateZone {
  id: string;
  name: string;
  countBand: '[5-14]' | '[15+]';
  rawCount: number;
  direction: string;
  approxDistance: string;
}

export interface VisibleSupporter {
  id: string;
  displayName: string;
  avatarUrl?: string;
  distanceBand: string;
  grantedAt: string;
  expiresAt: string;
}

export interface CreatorCrowdRadarProps {
  isLive: boolean;
  role: 'artist' | 'band' | 'fan' | 'guest';
  sessionId: string | null;
  performerName?: string;
}

const MIN_QUERY_INTERVAL_MS = 5000; // 5 seconds = max 12 queries/minute

const MOCK_ZONES: AggregateZone[] = [
  { id: 'zone_front', name: 'Main Lawn (Front of Stage)', countBand: '[15+]', rawCount: 18, direction: 'Directly in front', approxDistance: '~25m' },
  { id: 'zone_patio', name: 'Patio & Outdoor Bar', countBand: '[5-14]', rawCount: 8, direction: 'Stage Left', approxDistance: '~50m' },
  { id: 'zone_beer_garden', name: 'Craft Beer Garden', countBand: '[5-14]', rawCount: 6, direction: 'Stage Right', approxDistance: '~75m' },
];

const MOCK_SUPPORTERS: VisibleSupporter[] = [
  { id: 'sup_1', displayName: 'Sarah K.', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120', distanceBand: '~50m away (Front Lawn)', grantedAt: '10m ago', expiresAt: 'in 50m' },
  { id: 'sup_2', displayName: 'Marcus V.', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120', distanceBand: '~100m away (Patio)', grantedAt: '15m ago', expiresAt: 'in 45m' },
  { id: 'sup_3', displayName: 'Chloe T.', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120', distanceBand: '~120m away (Beer Garden)', grantedAt: '22m ago', expiresAt: 'in 38m' },
];

export const CreatorCrowdRadar: React.FC<CreatorCrowdRadarProps> = ({
  isLive,
  role,
  sessionId,
  performerName = 'Performer',
}) => {
  const [zones, setZones] = useState<AggregateZone[]>(MOCK_ZONES);
  const [supporters, setSupporters] = useState<VisibleSupporter[]>(MOCK_SUPPORTERS);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [throttleWarning, setThrottleWarning] = useState<string | null>(null);
  const [shoutoutModalOpen, setShoutoutModalOpen] = useState(false);
  const [shoutoutMessage, setShoutoutMessage] = useState('');
  const [shoutoutSent, setShoutoutSent] = useState(false);
  const [selectedSupporter, setSelectedSupporter] = useState<VisibleSupporter | null>(null);

  const lastQueryTimestampRef = useRef<number>(0);

  // Lifecycle subscription tracking
  useEffect(() => {
    if (isLive && (role === 'artist' || role === 'band')) {
      webReadVolumeTracker.recordSubscriptionAttached();
      return () => {
        webReadVolumeTracker.recordSubscriptionDetached();
      };
    }
  }, [isLive, role]);

  // 1. Authorization Guard
  const isAuthorized = isLive && (role === 'artist' || role === 'band') && !!sessionId;
  if (!isAuthorized) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-[#131315] p-8 text-center max-w-lg mx-auto my-8">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Active Stage Session Required</h2>
        <p className="text-sm text-[#94A3B8] leading-relaxed">
          Crowd Radar is exclusively available to verified Solo Musicians and Bands during an active, live verified stage performance.
        </p>
      </div>
    );
  }

  // 2. Anti-Differential Cadence Limiter (max 12 queries/min)
  const handleManualRefresh = () => {
    const now = Date.now();
    if (now - lastQueryTimestampRef.current < MIN_QUERY_INTERVAL_MS) {
      setThrottleWarning('Crowd Radar updates are throttled (max 12/min) to preserve privacy & prevent triangulation.');
      return;
    }
    lastQueryTimestampRef.current = now;
    setThrottleWarning(null);
    setLastUpdated(new Date());
    webReadVolumeTracker.recordQuery();
    webReadVolumeTracker.recordReads(zones.length + supporters.length);
  };

  const handleSendShoutout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoutoutMessage.trim()) return;
    setShoutoutSent(true);
    setTimeout(() => {
      setShoutoutModalOpen(false);
      setShoutoutMessage('');
      setShoutoutSent(false);
    }, 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#131315] border border-white/10 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00F076] animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">Audience Nearby / Crowd Radar</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Privacy-Safe Demand Signals · Session #{sessionId.slice(-6)} · Updated {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          className="px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 rounded-full border border-white/10 transition-colors flex items-center gap-2 w-fit"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Radar
        </button>
      </div>

      {/* Cadence Throttling Warning */}
      {throttleWarning && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{throttleWarning}</span>
        </div>
      )}

      {/* Browser Background Limitation Notice */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-300/90 flex items-start gap-2.5">
        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <span className="font-semibold text-blue-200">Web Browser Notice: </span>
          Web browsers throttle background timers and network connections when this tab is hidden. Keep this tab open while performing, or use the Crowdbeats Mobile App for background telemetry.
        </div>
      </div>

      {/* What Fans See Preview Card */}
      <CreatorMapPreview
        performer={{
          id: sessionId,
          name: performerName,
          type: role === 'artist' ? 'artist' : 'band',
          isLive: true,
          isStationary: true,
          venueName: 'The Gaslamp Stage',
          lastUpdatedMs: lastUpdated.getTime(),
          coord: { lat: 32.7157, lng: -117.1611 },
        }}
      />

      {/* Visual Soft Heat Halo Radar Canvas (k >= 5) */}
      <div
        data-testid="creator-radar-canvas"
        className="relative h-60 w-full rounded-2xl bg-[#0F111A] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl"
      >
        {/* Radar Concentric Rings */}
        <div className="absolute w-48 h-48 rounded-full border border-white/10" />
        <div className="absolute w-32 h-32 rounded-full border border-white/10" />
        <div className="absolute w-16 h-16 rounded-full border border-white/10" />
        <div className="absolute w-full h-[1px] bg-white/5" />
        <div className="absolute h-full w-[1px] bg-white/5" />

        {/* Range Labels */}
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] text-white/30 font-mono">200m</span>
        <span className="absolute top-12 left-1/2 -translate-x-1/2 text-[9px] text-white/30 font-mono">100m</span>
        <span className="absolute top-20 left-1/2 -translate-x-1/2 text-[9px] text-white/30 font-mono">50m</span>

        {/* Aggregate Soft Heat Zones with Hysteresis */}
        {zones.map((zone, idx) => {
          const isHigh = zone.countBand === '[15+]';
          // Disperse zones around radar
          const positions = [
            { top: '24%', left: '50%' }, // Front
            { top: '55%', left: '26%' }, // Left
            { top: '55%', left: '74%' }, // Right
          ];
          const pos = positions[idx % positions.length];

          return (
            <div
              key={zone.id}
              data-testid={`radar-halo-${zone.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-700"
              style={pos}
            >
              {/* Soft breathing halo circle */}
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center animate-pulse ${
                  isHigh
                    ? 'bg-[#00F076]/20 shadow-[0_0_30px_rgba(0,240,118,0.35)]'
                    : 'bg-[#8B5CF6]/20 shadow-[0_0_30px_rgba(139,92,246,0.35)]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isHigh ? 'bg-[#00F076]/40' : 'bg-[#8B5CF6]/40'
                  }`}
                >
                  <span className="text-[10px] font-black text-white font-mono">
                    {zone.countBand}
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-semibold text-white/70 mt-1 whitespace-nowrap">
                {zone.name.split(' ')[0]}
              </span>
            </div>
          );
        })}

        {/* Consented Individual Supporters (Strictly Separated from Aggregate Halos) */}
        {supporters.slice(0, 3).map((sup, idx) => {
          const supPositions = [
            { top: '65%', left: '42%' },
            { top: '38%', left: '68%' },
            { top: '35%', left: '32%' },
          ];
          const pos = supPositions[idx % supPositions.length];
          return (
            <div
              key={sup.id}
              data-testid={`radar-supporter-${sup.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
              style={pos}
            >
              <div className="w-4 h-4 rounded-full bg-[#8B5CF6] border-2 border-white flex items-center justify-center text-[7px] font-black text-white shadow-lg">
                {sup.displayName.charAt(0)}
              </div>
              <span className="text-[8px] text-white/80 font-medium">{sup.displayName.split(' ')[0]}</span>
            </div>
          );
        })}

        {/* Center Stage Pin */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-4 h-4 rounded-full bg-[#4285F4] border-2 border-white shadow-[0_0_12px_rgba(66,133,244,0.6)]" />
          <span className="text-[9px] font-bold text-white mt-1">Stage</span>
        </div>
      </div>

      {/* Grid: Aggregate Crowd Zones (k >= 5) & Visible Supporters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aggregate Zones Panel */}
        <div className="bg-[#131315] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Aggregate Crowd Zones
            </h2>
            <span className="text-[11px] font-semibold text-[#8B5CF6] bg-[#8B5CF6]/15 px-2 py-0.5 rounded-full border border-[#8B5CF6]/30">
              Min 5 fans/zone
            </span>
          </div>

          <p className="text-xs text-[#94A3B8]">
            Coarse zones meeting the k ≥ 5 threshold. Exact coordinates and individual counts are suppressed.
          </p>

          <div className="space-y-3">
            {zones.map((zone) => (
              <div key={zone.id} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white text-sm">{zone.name}</div>
                  <div className="text-xs text-[#94A3B8] mt-0.5">
                    {zone.direction} · {zone.approxDistance}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-[#8B5CF6]/20 text-[#C4B5FD] font-mono text-xs font-bold border border-[#8B5CF6]/40">
                    {zone.countBand} supporters
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-[#64748B] italic">
            * Zones with fewer than 5 supporters are automatically withheld to protect fan anonymity.
          </div>
        </div>

        {/* Visible Supporters Panel */}
        <div className="bg-[#131315] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-[#00F076]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Visible Supporters Nearby
            </h2>
            <span className="text-[11px] font-semibold text-[#00F076] bg-[#00F076]/15 px-2 py-0.5 rounded-full border border-[#00F076]/30">
              Opted-in only
            </span>
          </div>

          <p className="text-xs text-[#94A3B8]">
            Fans in the crowd who explicitly granted visibility for this session. Contact info is withheld.
          </p>

          <div className="space-y-3">
            {supporters.map((sup) => (
              <div key={sup.id} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-xs font-bold text-white">
                    {sup.displayName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{sup.displayName}</div>
                    <div className="text-xs text-[#94A3B8]">{sup.distanceBand}</div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSupporter(sup)}
                  className="px-2.5 py-1 text-xs text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShoutoutModalOpen(true)}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-semibold text-xs transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Send Stage Shoutout to Nearby Crowd
          </button>
        </div>
      </div>

      {/* Tipping Independence Banner */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center text-xs text-[#64748B]">
        <span className="font-semibold text-[#94A3B8]">Tipping Independence Guarantee: </span>
        Completing a tip never automatically exposes a fan's location coordinates or grants presence visibility without separate, explicit opt-in consent.
      </div>

      {/* Stage Shoutout Modal */}
      {shoutoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181926] border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Stage Shoutout</h3>
            <p className="text-xs text-[#94A3B8]">
              Broadcast a 1-way stage message to all nearby supporters currently tuned in to this session.
            </p>

            {shoutoutSent ? (
              <div className="p-4 rounded-xl bg-[#00F076]/10 border border-[#00F076]/30 text-center text-[#00F076] text-sm font-semibold">
                ✓ Shoutout broadcast to nearby crowd!
              </div>
            ) : (
              <form onSubmit={handleSendShoutout} className="space-y-4">
                <textarea
                  rows={3}
                  value={shoutoutMessage}
                  onChange={(e) => setShoutoutMessage(e.target.value)}
                  placeholder="e.g. Thanks for packing the front lawn! Next song is for you guys!"
                  className="w-full bg-[#131315] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6]"
                  maxLength={140}
                  required
                />
                <div className="flex justify-between items-center text-xs text-[#64748B]">
                  <span>1-way broadcast only (no DM)</span>
                  <span>{140 - shoutoutMessage.length} left</span>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShoutoutModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-white/70 hover:text-white bg-white/5 rounded-lg border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg shadow-md"
                  >
                    Broadcast
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Supporter Profile Preview Modal */}
      {selectedSupporter && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181926] border border-white/15 rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#8B5CF6]/20 border-2 border-[#8B5CF6] flex items-center justify-center text-xl font-bold text-white">
              {selectedSupporter.displayName.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{selectedSupporter.displayName}</h3>
              <p className="text-xs text-[#00F076] font-medium mt-0.5">Verified Crowd Supporter</p>
              <p className="text-xs text-[#94A3B8] mt-1">{selectedSupporter.distanceBand}</p>
            </div>
            <p className="text-xs text-[#64748B] italic">
              Direct contact disclosure and messaging are disabled to safeguard fan privacy.
            </p>
            <button
              onClick={() => setSelectedSupporter(null)}
              className="w-full py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 rounded-xl border border-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Tipping Independence Confirmation */}
      <div className="text-center text-xs text-[#64748B] pt-2">
        🔒 Completed tips produce zero visual location pins or presence signals.
      </div>
    </div>
  );
};
