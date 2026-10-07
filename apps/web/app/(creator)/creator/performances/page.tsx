'use client';

/**
 * Crowdbeats V2 — Creator Go Live Check-In
 * Route: /creator/performances
 *
 * This is Crowdbeats' core feature: solo musicians check in to a real venue
 * so fans nearby can discover them, follow their journey, and tip them instantly.
 *
 * Flow: Pick your venue → Go Live → You appear on every nearby fan's map → They tip you
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  goLive,
  checkOut,
  getMyCheckin,
  type LiveCheckin,
} from '@/lib/firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import {
  getVenuePlacePredictions,
  requestBrowserGeolocation,
  type PlacePrediction,
} from '@/lib/maps/googleMapsLoader';
import { POPULAR_CHECKIN_VENUES } from '@/lib/discovery/discoveryClient';

type PageState = 'loading' | 'offline' | 'live' | 'idle';

function formatDuration(isoStart: string): string {
  const ms = Date.now() - new Date(isoStart).getTime();
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function CreatorPerformancesPage() {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [currentSession, setCurrentSession] = useState<LiveCheckin | null>(null);
  const [duration, setDuration] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [venueQuery, setVenueQuery] = useState('');
  const [venueSuggestions, setVenueSuggestions] = useState<PlacePrediction[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<{ name: string; lat: number; lng: number; id?: string } | null>(null);
  const [isGoingLive, setIsGoingLive] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [lastSession, setLastSession] = useState<LiveCheckin | null>(null);
  const venueDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uid = getFirebaseAuth().currentUser?.uid ?? '';

  // Load current session on mount
  useEffect(() => {
    if (!uid) { setPageState('idle'); return; }
    getMyCheckin(uid).then((session) => {
      if (session?.isLive) {
        setCurrentSession(session);
        setPageState('live');
      } else {
        if (session) setLastSession(session);
        setPageState('idle');
      }
    }).catch(() => setPageState('idle'));
  }, [uid]);

  // Live duration ticker
  useEffect(() => {
    if (pageState === 'live' && currentSession?.checkedInAt) {
      setDuration(formatDuration(currentSession.checkedInAt));
      durationRef.current = setInterval(() => {
        setDuration(formatDuration(currentSession.checkedInAt));
      }, 1000);
    }
    return () => { if (durationRef.current) clearInterval(durationRef.current); };
  }, [pageState, currentSession]);

  // Venue search debounce
  useEffect(() => {
    if (venueDebounceRef.current) clearTimeout(venueDebounceRef.current);
    if (!venueQuery || venueQuery.length < 2) { setVenueSuggestions([]); return; }
    venueDebounceRef.current = setTimeout(async () => {
      const q = venueQuery.toLowerCase();
      const curated = POPULAR_CHECKIN_VENUES.filter(
        (v) => v.name.toLowerCase().includes(q) || v.city.toLowerCase().includes(q)
      ).map((v) => ({
        placeId: v.placeId, mainText: v.name,
        secondaryText: `${v.city}, ${v.state} ${v.emoji}`,
        fullText: v.address, latitude: v.latitude, longitude: v.longitude,
      }));
      const google = await getVenuePlacePredictions(venueQuery).catch(() => []);
      const seen = new Set(curated.map((c) => c.placeId));
      setVenueSuggestions([...curated, ...google.filter((g) => g.placeId && !seen.has(g.placeId))].slice(0, 8));
    }, 280);
  }, [venueQuery]);

  const handleGoLive = useCallback(async () => {
    if (!selectedVenue || !uid) return;
    setIsGoingLive(true);
    setGeoError(null);
    try {
      let lat = selectedVenue.lat;
      let lng = selectedVenue.lng;
      // Try to get more precise GPS if available
      try {
        const geo = await requestBrowserGeolocation();
        lat = geo.latitude;
        lng = geo.longitude;
      } catch { /* use venue lat/lng */ }

      const user = getFirebaseAuth().currentUser;
      const displayName = user?.displayName || 'Solo Artist';
      const photoUrl = user?.photoURL || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80';

      await goLive(uid, {
        performerName: displayName,
        photoUrl,
        type: 'artist',
        genres: [],
        slug: uid,
        venueName: selectedVenue.name,
        venueId: selectedVenue.id,
        latitude: lat,
        longitude: lng,
        tipLink: `/fan/tip?performer=${uid}`,
      });

      const session: LiveCheckin = {
        uid, performerName: displayName, photoUrl, type: 'artist',
        genres: [], slug: uid, venueName: selectedVenue.name,
        latitude: lat, longitude: lng, isLive: true,
        checkedInAt: new Date().toISOString(),
      };
      setCurrentSession(session);
      setPageState('live');
      setShowModal(false);
    } catch (err: any) {
      setGeoError(err?.message || 'Failed to go live. Check your connection.');
    } finally {
      setIsGoingLive(false);
    }
  }, [selectedVenue, uid]);

  const handleEndSession = useCallback(async () => {
    if (!uid) return;
    setIsEndingSession(true);
    try {
      await checkOut(uid);
      setLastSession(currentSession);
      setCurrentSession(null);
      setPageState('idle');
    } catch (err: any) {
      setGeoError(err?.message || 'Failed to end session.');
    } finally {
      setIsEndingSession(false);
    }
  }, [uid, currentSession]);

  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-[#64748B] text-sm flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          Loading your session…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto px-4 py-6">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Live Performances</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Check in to a venue and go live — fans nearby will see you on the map and can tip you instantly.
        </p>
      </div>

      {/* ── LIVE STATUS CARD ──────────────────────────────────────────────── */}
      {pageState === 'live' && currentSession ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#00F076]/10 via-[#0D1117] to-[#7C3AED]/10 border border-[#00F076]/30 rounded-3xl p-6 flex flex-col gap-5">
          {/* Pulsing live ring */}
          <div className="absolute top-5 right-5 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F076] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00F076]" />
            </span>
            <span className="text-xs font-black text-[#00F076] tracking-widest uppercase">You're Live</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#00F076] flex-shrink-0">
              <img src={currentSession.photoUrl} alt={currentSession.performerName} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-white">{currentSession.performerName}</h2>
              <p className="text-[#00F076] font-semibold text-sm mt-0.5">📍 {currentSession.venueName}</p>
              <p className="text-[#94A3B8] text-xs mt-1">Fans nearby can see you and tip you right now</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-black/30 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">{duration}</p>
              <p className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">Duration</p>
            </div>
            <div className="bg-black/30 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-[#00F076]">Live</p>
              <p className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">Status</p>
            </div>
            <div className="bg-black/30 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">🎵</p>
              <p className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">On the Map</p>
            </div>
          </div>

          {/* Share link */}
          <div className="bg-black/20 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-[#64748B]">Your fan tip link</p>
              <p className="text-xs text-[#A855F7] font-mono truncate">crowdbeats.io/fan/tip?performer={uid}</p>
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(`https://crowdbeats-01.web.app/fan/tip?performer=${uid}`)}
              className="text-xs bg-[#1E2032] border border-[#2B2D44] text-[#94A3B8] hover:text-white px-3 py-1.5 rounded-full transition flex-shrink-0"
            >
              Copy
            </button>
          </div>

          {/* End session */}
          <button
            type="button"
            onClick={handleEndSession}
            disabled={isEndingSession}
            className="w-full py-3 rounded-2xl border-2 border-red-500/50 text-red-400 font-bold text-sm hover:bg-red-500/10 transition disabled:opacity-50"
          >
            {isEndingSession ? 'Ending session…' : '🔴 End Session'}
          </button>

          {geoError && <p className="text-xs text-red-400 text-center">{geoError}</p>}
        </div>

      ) : (
        /* ── NOT LIVE — Go Live CTA ────────────────────────────────────── */
        <div className="bg-[#0D1117] border border-[#2B2D44] rounded-3xl p-6 flex flex-col items-center gap-5 text-center">
          <div className="w-20 h-20 rounded-full bg-[#00F076]/10 border-2 border-[#00F076]/30 flex items-center justify-center text-4xl">
            🎸
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Ready to Perform?</h2>
            <p className="text-sm text-[#94A3B8] mt-2 max-w-sm mx-auto">
              Check in to your venue and go live. Fans within <strong className="text-white">5 miles</strong> will see you on the Crowdbeats map and can tip you with one tap.
            </p>
          </div>

          {lastSession && (
            <div className="w-full bg-[#151722] border border-[#2B2D44] rounded-2xl px-4 py-3 text-left">
              <p className="text-[11px] text-[#64748B] uppercase tracking-wider font-semibold mb-1">Last Session</p>
              <p className="text-sm font-semibold text-white">{lastSession.venueName}</p>
              <p className="text-xs text-[#94A3B8]">{lastSession.checkedInAt ? new Date(lastSession.checkedInAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00F076] to-[#00c863] text-black font-black text-base tracking-tight hover:opacity-90 transition shadow-[0_0_32px_rgba(0,240,118,0.25)]"
          >
            🟢 Go Live Now
          </button>
          <p className="text-[11px] text-[#64748B]">
            You'll be visible on the Crowdbeats fan map until you tap "End Session"
          </p>
        </div>
      )}

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      {pageState === 'idle' && (
        <div className="bg-[#151722] border border-[#2B2D44] rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-4">How It Works</h3>
          <div className="flex flex-col gap-3">
            {[
              { icon: '📍', title: 'Check in to your venue', desc: 'Pick the bar, café, or street corner you\'re performing at' },
              { icon: '🟢', title: 'Go Live', desc: 'Your profile pin appears on the Crowdbeats fan map instantly' },
              { icon: '💚', title: 'Fans tip you', desc: 'Fans nearby see you on the map and tip you in one tap — no searching required' },
              { icon: '📱', title: 'Works on web & app', desc: 'Check in from your phone browser or the Crowdbeats app — same experience' },
            ].map((step) => (
              <div key={step.title} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{step.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="text-xs text-[#94A3B8]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VENUE SELECTION MODAL ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#0D1117] border border-[#2B2D44] rounded-3xl w-full max-w-md p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Where are you performing?</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-white text-2xl leading-none">×</button>
            </div>

            {/* Venue search */}
            <div className="relative">
              <div className="flex items-center bg-[#151722] border border-[#2B2D44] focus-within:border-[#00F076] rounded-2xl px-4 py-3 transition-colors">
                <span className="mr-2 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder="Search venue: The Casbah, Blue Note, Stubb's..."
                  value={venueQuery}
                  onChange={(e) => setVenueQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent text-sm text-white placeholder-[#64748B] focus:outline-none"
                />
              </div>

              {venueSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#151722] border border-[#2B2D44] rounded-2xl overflow-hidden shadow-2xl z-10">
                  {venueSuggestions.map((s) => (
                    <button
                      key={s.placeId}
                      type="button"
                      onClick={() => {
                        setSelectedVenue({
                          name: s.mainText,
                          lat: (s as any).latitude ?? 0,
                          lng: (s as any).longitude ?? 0,
                          id: s.placeId,
                        });
                        setVenueQuery(s.mainText);
                        setVenueSuggestions([]);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1E2032] transition text-left"
                    >
                      <span className="text-lg flex-shrink-0">🎵</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{s.mainText}</p>
                        {s.secondaryText && <p className="text-xs text-[#64748B] truncate">{s.secondaryText}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick venue picks */}
            {!selectedVenue && (
              <div>
                <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-2">Popular Venues</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {POPULAR_CHECKIN_VENUES.slice(0, 8).map((v) => (
                    <button
                      key={v.placeId}
                      type="button"
                      onClick={() => {
                        setSelectedVenue({ name: v.name, lat: v.latitude, lng: v.longitude, id: v.placeId });
                        setVenueQuery(v.name);
                      }}
                      className="flex-shrink-0 flex flex-col items-center gap-1 bg-[#1E2032] border border-[#2B2D44] hover:border-[#00F076]/60 rounded-xl px-3 py-2 transition min-w-[88px] text-center"
                    >
                      <span className="text-lg">{v.emoji}</span>
                      <span className="text-[10px] font-semibold text-white leading-tight">{v.name}</span>
                      <span className="text-[9px] text-[#64748B]">{v.city}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected venue confirmation */}
            {selectedVenue && (
              <div className="bg-[#00F076]/10 border border-[#00F076]/30 rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">📍</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{selectedVenue.name}</p>
                  <p className="text-xs text-[#00F076]">Ready to go live here</p>
                </div>
                <button type="button" onClick={() => { setSelectedVenue(null); setVenueQuery(''); }} className="text-[#64748B] hover:text-white ml-auto flex-shrink-0">×</button>
              </div>
            )}

            {geoError && <p className="text-xs text-red-400">{geoError}</p>}

            <button
              type="button"
              onClick={handleGoLive}
              disabled={!selectedVenue || isGoingLive}
              className="w-full py-4 rounded-2xl font-black text-base transition disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-[#00F076] to-[#00c863] text-black hover:opacity-90 shadow-[0_0_24px_rgba(0,240,118,0.3)]"
            >
              {isGoingLive
                ? <span className="flex items-center justify-center gap-2"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Going Live…</span>
                : '🟢 Go Live Now'
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
