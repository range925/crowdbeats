'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import { TipAuthGateModal } from '@/components/discovery/TipAuthGateModal';
import { InstagramShowcase } from '@/components/landing/InstagramShowcase';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

interface Performer {
  id: string;
  name: string;
  slug: string;
  avatarLetter: string;
  avatarGradient: string;
  genres: string;
  genreCategory: string;
  venueName: string;
  venueDistance: string;
  description: string;
  followers: string;
  badge: string;
  type: 'artist' | 'band';
}

const SAMPLE_PERFORMERS: Performer[] = [
  {
    id: 'perf-jake-rios',
    name: 'Jake Rios',
    slug: 'jake-rios',
    avatarLetter: 'J',
    avatarGradient: 'from-purple-500 to-indigo-600',
    genres: 'Acoustic • Indie Folk • Pop',
    genreCategory: 'Acoustic',
    venueName: 'The Holding Company',
    venueDistance: '0.8 mi away',
    description: 'Acoustic indie folk artist performing live original songs at Ocean Beach coastal stages.',
    followers: '1,420 followers',
    badge: 'Top Performer',
    type: 'artist',
  },
  {
    id: 'perf-maya-lin',
    name: 'Maya Lin',
    slug: 'maya-lin',
    avatarLetter: 'M',
    avatarGradient: 'from-cyan-500 to-blue-600',
    genres: 'Electronic • Ambient • Pop',
    genreCategory: 'Electronic',
    venueName: 'Ocean Acoustic Club',
    venueDistance: '1.2 mi away',
    description: 'Electronic ambient artist blending synthesizers and live vocal loops for deep immersive shows.',
    followers: '980 followers',
    badge: 'Top Performer',
    type: 'artist',
  },
  {
    id: 'perf-the-sunsets',
    name: 'The Sunsets',
    slug: 'the-sunsets',
    avatarLetter: 'S',
    avatarGradient: 'from-pink-500 to-rose-600',
    genres: 'Rock • Indie Rock • Alternative',
    genreCategory: 'Indie Rock',
    venueName: 'The Main Stage SD',
    venueDistance: '2.4 mi away',
    description: 'High-energy 4-piece indie rock band with explosive brass hooks performing all-original anthems live.',
    followers: '2,350 followers',
    badge: 'Top Performer',
    type: 'band',
  },
];

export function CrowdbeatsWebLanding() {
  const citySelectId = useId();
  // City & Genre Filter
  const [selectedCity, setSelectedCity] = useState('San Diego');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Tip Calculator State (default: $460)
  const [tipAmount, setTipAmount] = useState<number>(460);

  // Band Split State (default: $100)
  const [bandTipAmount, setBandTipAmount] = useState<number>(100);

  // Role Tab State
  const [selectedRole, setSelectedRole] = useState<'solo' | 'band' | 'venue' | 'fan'>('solo');

  // Tip Modal State
  const [activePerformer, setActivePerformer] = useState<Performer | null>(null);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);

  // Calculator calculations
  const platformFee = tipAmount * 0.06;
  const stripeFee = tipAmount * 0.029 + 0.3;
  const netPayout = Math.max(0, tipAmount - platformFee - stripeFee);

  // Band Split calculations
  const bandPlatformFee = bandTipAmount * 0.06;
  const bandStripeFee = bandTipAmount * 0.029 + 0.3;
  const bandNetPool = Math.max(0, bandTipAmount - bandPlatformFee - bandStripeFee);
  const split1 = (bandNetPool * 0.4).toFixed(2);
  const split2 = (bandNetPool * 0.25).toFixed(2);
  const split3 = (bandNetPool * 0.2).toFixed(2);
  const split4 = (bandNetPool * 0.15).toFixed(2);

  // Filter performers
  const filteredPerformers = SAMPLE_PERFORMERS.filter((p) => {
    if (selectedGenre === 'All' || selectedGenre === 'Live Now') return true;
    return p.genreCategory.toLowerCase().includes(selectedGenre.toLowerCase());
  });

  const handleOpenTip = (performer: Performer) => {
    setActivePerformer(performer);
    setIsTipModalOpen(true);
  };

  return (
    <div className="bg-[#07070A] text-zinc-100 antialiased selection:bg-purple-500 selection:text-white min-h-screen relative overflow-x-hidden font-sans">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-600/20 blur-[130px] rounded-full" />
        <div className="absolute top-[35%] -left-48 w-[600px] h-[600px] bg-indigo-600/15 blur-[140px] rounded-full" />
        <div className="absolute top-[65%] -right-48 w-[600px] h-[600px] bg-cyan-600/15 blur-[140px] rounded-full" />
      </div>

      {/* STICKY HEADER NAVIGATION */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 glass-panel bg-[#07070A]/75 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Link className="flex items-center gap-2.5 group" href="/">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="Crowdbeats" className="w-full h-full object-contain" />
              </div>
              <span
                className="text-xl font-extrabold tracking-tight uppercase flex items-center gap-1.5"
                style={{
                  background: 'linear-gradient(90deg, #00F076 0%, #FFFFFF 60%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }}
              >
                Crowdbeats
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-semibold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>142 STAGES LIVE</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-zinc-300">
            <a className="hover:text-purple-400 transition-colors" href="#radar">
              Live Radar
            </a>
            <a className="hover:text-purple-400 transition-colors" href="#economics">
              Economics
            </a>
            <a className="hover:text-purple-400 transition-colors" href="#band-splits">
              Band Splits
            </a>
            <a className="hover:text-purple-400 transition-colors" href="#creators">
              For Artists
            </a>
            <a className="hover:text-purple-400 transition-colors" href="#venues">
              Venues
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              className="hidden md:inline-flex items-center text-sm font-semibold text-zinc-300 hover:text-white px-3 py-2 transition-colors"
              href="#radar"
            >
              Explore Stages
            </a>
            <Link
              className="text-sm font-semibold text-zinc-200 hover:text-white px-3.5 py-2 transition-colors"
              href="/auth"
            >
              Sign In
            </Link>
            <Link
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#8B5CF6] text-white text-sm font-semibold hover:opacity-95 shadow-md shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              href="/auth?mode=register"
            >
              Take The Stage
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-xs sm:text-sm font-semibold text-purple-300 backdrop-blur-md mb-8 shadow-sm">
              <span>✨</span>
              <span>Next-Generation Live Music Economics • 0% Subscription Fees</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
              Where Fans Fuel <span className="text-gradient-purple">The Music.</span>
            </h1>

            <p className="text-base sm:text-xl text-zinc-400 max-w-3xl font-normal leading-relaxed mb-10">
              Direct artist tipping with 2 taps. Real-time venue check-ins. Automated band splits. Transparent direct
              payouts. Flat 6% Crowdbeats platform fee + standard Stripe.com processing (2.9% + 30¢). Zero monthly
              subscriptions.
            </p>

            {/* Search Input Bar */}
            <div className="w-full max-w-3xl glass-panel bg-zinc-900/80 border border-white/10 rounded-2xl sm:rounded-full p-2 sm:p-2.5 shadow-2xl shadow-purple-500/10 mb-6">
              <form
                className="flex flex-col sm:flex-row items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = document.getElementById('radar');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="flex items-center gap-3 w-full px-4 py-2 text-zinc-400">
                  <span className="material-symbols-outlined text-purple-400">search</span>
                  <input
                    className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm sm:text-base text-white placeholder-zinc-500 p-0"
                    placeholder="Search city or venue (e.g. San Diego, Austin, Torrance)..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  className="w-full sm:w-auto shrink-0 px-6 py-3 rounded-xl sm:rounded-full bg-[#8B5CF6] text-white text-sm font-semibold hover:bg-purple-600 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  type="submit"
                >
                  <span>Explore Stages</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </form>
            </div>

            {/* Trending Cities */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-zinc-400 mb-16">
              <span className="uppercase tracking-wider text-[11px] font-semibold text-zinc-500 mr-1">
                Trending Cities:
              </span>
              {['San Diego, CA', 'Austin, TX', 'Nashville, TN', 'Los Angeles', 'London'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    const cleanCity = city.split(',')[0];
                    setSelectedCity(cleanCity);
                    const el = document.getElementById('radar');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-white/5 transition-all cursor-pointer"
                >
                  {city}
                </button>
              ))}
            </div>

            {/* 4 STAT CARDS */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
              <div className="glass-panel p-6 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-purple-500/40 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Volume</span>
                  <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 material-symbols-outlined text-lg">
                    payments
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-purple-400 transition-colors">
                  $284,500+
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-medium">Instant payouts via Stripe</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-purple-500/40 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Transparent Cut</span>
                  <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 material-symbols-outlined text-lg">
                    verified_user
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-purple-400 transition-colors">
                  6% + Stripe
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-medium">0% Monthly. No hidden fees</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-purple-500/40 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Live Footprint</span>
                  <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 material-symbols-outlined text-lg">
                    location_on
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-purple-400 transition-colors">
                  1,280+ Stages
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-medium">Across 24 curated music cities</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-purple-500/40 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Fan Speed</span>
                  <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 material-symbols-outlined text-lg">
                    bolt
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-purple-400 transition-colors">
                  &lt; 3 Seconds
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-medium">Instant Google Pay &amp; Card</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS — PHONE MOCKUP SECTION (WHITE BACKGROUND) ─────────────────── */}
        <section className="py-24 border-t border-black/5 border-b border-black/5 relative overflow-hidden bg-white" id="how-it-works">
          <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section header */}
            <div className="text-center mb-12 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/15 bg-black/5 text-xs font-extrabold text-black uppercase tracking-widest mb-5">
                How It Works
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight">
                Fans find the music. Musicians feel the support.
              </h2>
              <p className="text-base sm:text-lg text-black mt-4 max-w-2xl mx-auto leading-relaxed">
                Discover live musicians nearby, follow your favorites, and send a tip in moments. Performing solo or with a band? Get discovered, receive tips, and cash out to your bank.
              </p>
            </div>

            {/* 6-Phone Mockup Showcase (Full Width, Pure White Background, Lossless Responsive Display) */}
            <div className="w-full flex justify-center items-center bg-white">
              <picture className="w-full block" style={{ aspectRatio: '7680 / 2281' }}>
                {/* Desktop viewports (>= 768px): Deliver Full 7680w Ultra-Res Master or 3840w 4K */}
                <source
                  media="(min-width: 768px)"
                  type="image/webp"
                  srcSet="/crowdbeats_mockups_ultra.webp?v=7680ultra 7680w, /crowdbeats_mockups_3840.webp?v=7680ultra 3840w"
                  sizes="(max-width: 1560px) 100vw, 1560px"
                />
                <source
                  media="(min-width: 768px)"
                  type="image/png"
                  srcSet="/Crowdbeats-Second-Section-master-png.png?v=7680ultra 7680w, /crowdbeats_mockups_3840.png?v=7680ultra 3840w"
                  sizes="(max-width: 1560px) 100vw, 1560px"
                />
                {/* Mobile viewports (< 768px): Optimized mobile tiers */}
                <source
                  type="image/webp"
                  srcSet="/crowdbeats_mockups_2048.webp?v=7680ultra 2048w, /crowdbeats_mockups_1024.webp?v=7680ultra 1024w"
                  sizes="100vw"
                />
                <source
                  type="image/png"
                  srcSet="/crowdbeats_mockups_2048.png?v=7680ultra 2048w, /crowdbeats_mockups_1024.png?v=7680ultra 1024w"
                  sizes="100vw"
                />
                <img
                  src="/Crowdbeats-Second-Section-master-png.png?v=7680ultra"
                  alt="Crowdbeats 6-Phone App Experience — Discover, Confirm Payment, Tip Sent, Verify Identity, Play & Receive Tips, Cash Out"
                  width={7680}
                  height={2281}
                  loading="eager"
                  decoding="async"
                  className="w-full h-auto block object-contain bg-white"
                  style={{ aspectRatio: '7680 / 2281' }}
                />
              </picture>
            </div>
          </div>
        </section>

        {/* ── @crowdbeatsllc INSTAGRAM SHOWCASE ───────────────────── */}
        <InstagramShowcase />


        {/* LIVE STAGE RADAR SECTION */}
        <section className="py-20 border-t border-white/5 relative" id="radar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs tracking-widest uppercase mb-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Stage Radar
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor={citySelectId} className="text-3xl sm:text-4xl font-extrabold text-white cursor-pointer">
                    Performances in
                  </label>
                  <div className="relative inline-block">
                    <select
                      id={citySelectId}
                      aria-label="Select City"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="appearance-none bg-zinc-800 text-purple-400 font-extrabold text-2xl sm:text-3xl border-0 rounded-xl pr-9 pl-3 py-0.5 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="San Diego">San Diego</option>
                      <option value="Austin">Austin</option>
                      <option value="Nashville">Nashville</option>
                      <option value="Los Angeles">Los Angeles</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-purple-500 text-lg">
                      expand_more
                    </span>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 mt-1.5">
                  Verified artists currently checked into stages. Tap any card to test the instant direct tip flow.
                </p>
              </div>

              {/* Genre Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {['All', 'Live Now', 'Acoustic', 'Indie Rock', 'Jazz & Soul', 'Electronic'].map((genre) => {
                  const isActive = selectedGenre === genre;
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                          : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:border-purple-500'
                      }`}
                    >
                      {genre === 'Live Now' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Performer Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredPerformers.map((performer) => (
                <div
                  key={performer.id}
                  className="glass-panel rounded-2xl bg-zinc-900/80 border border-white/10 p-6 flex flex-col justify-between hover:border-purple-500/50 hover:shadow-glow-purple transition-all duration-300 group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${performer.avatarGradient} text-white font-bold flex items-center justify-center text-lg shadow-md`}
                        >
                          {performer.avatarLetter}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                              {performer.name}
                            </h3>
                            <span className="material-symbols-outlined text-purple-500 text-base">verified</span>
                          </div>
                          <span className="text-xs text-zinc-400 font-medium">{performer.genres}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-800/60 border border-white/5 space-y-1.5 mb-4">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-1 text-zinc-300">
                          <span className="material-symbols-outlined text-purple-500 text-sm">nightlife</span>
                          {performer.venueName}
                        </span>
                        <span className="text-zinc-500">{performer.venueDistance}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{performer.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 pb-2">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">group</span> {performer.followers}
                      </span>
                      <span className="flex items-center gap-1 text-amber-500 font-medium">
                        <span className="material-symbols-outlined text-sm">star</span> {performer.badge}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center gap-2 mt-4">
                    <Link
                      href={`/artist/${performer.slug}`}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 text-center transition"
                    >
                      View Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenTip(performer)}
                      className="flex-1 py-2.5 rounded-xl bg-[#8B5CF6] text-white text-xs font-bold hover:opacity-95 shadow-md shadow-purple-500/20 flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <span>Tip Now</span>
                      <span className="material-symbols-outlined text-sm">bolt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RADICAL FINANCIAL TRANSPARENCY / TIP CALCULATOR */}
        <section className="py-24 border-t border-white/5 relative bg-[#09090D]/50" id="economics">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Radical Financial Transparency
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-2 mb-4 tracking-tight">
                We Only Win When Artists Win.
              </h2>
              <p className="text-base sm:text-lg text-zinc-400">
                No monthly subscriptions. Crowdbeats charges a transparent{' '}
                <strong className="text-white">6% platform fee</strong>, and Stripe processes payments at standard
                rates (2.9% + 30¢), with the entire net balance deposited directly into the artist's bank account.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Interactive Tip Simulator */}
              <div className="lg:col-span-7 glass-panel rounded-3xl bg-zinc-900/90 border border-white/10 p-6 sm:p-8 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Test The Tip Breakdown</h3>
                      <p className="text-xs text-zinc-400">
                        Choose or slide any tip amount to see how much the musician keeps.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      Instant Simulation
                    </span>
                  </div>

                  {/* Preset Pills */}
                  <div className="grid grid-cols-5 gap-2 mb-6">
                    {[10, 25, 50, 100, 460].map((amt) => {
                      const isSelected = tipAmount === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setTipAmount(amt)}
                          className={`tip-pill py-2 text-center rounded-xl font-bold text-sm transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#8B5CF6] text-white border border-transparent shadow-md shadow-purple-500/20'
                              : 'bg-zinc-800 text-zinc-300 hover:border-purple-500 border border-transparent'
                          }`}
                        >
                          ${amt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Range Slider */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-400 mb-2">
                      <span>Audience Tip Volume</span>
                      <span className="text-base text-purple-400 font-extrabold">${tipAmount.toFixed(2)}</span>
                    </div>
                    <input
                      aria-label="Tip volume slider"
                      className="w-full accent-purple-600 bg-zinc-800 rounded-lg cursor-pointer"
                      id="tipSlider"
                      max={1000}
                      min={5}
                      step={5}
                      type="range"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(parseFloat(e.target.value))}
                    />
                  </div>

                  {/* Fee Breakdown Details */}
                  <div className="space-y-3.5 border-t border-white/10 pt-6 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Gross Fan Tip:</span>
                      <span className="font-bold text-white">${tipAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        Crowdbeats Platform Fee (6%):
                        <span className="material-symbols-outlined text-xs text-purple-500">info</span>
                      </span>
                      <span className="font-semibold text-rose-400">-${platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        Stripe Processing Fee (2.9% + 30¢):
                        <span className="material-symbols-outlined text-xs text-blue-500">lock</span>
                      </span>
                      <span className="font-semibold text-rose-400">-${stripeFee.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Payout Callout */}
                <div className="mt-8 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      Artist Net Payout (~{((netPayout / tipAmount) * 100).toFixed(1)}%)
                    </span>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Directly transferred to bank account via Stripe Connect
                    </p>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-400">${netPayout.toFixed(2)}</div>
                </div>
              </div>

              {/* Sidecards Comparison */}
              <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
                <div className="glass-panel p-6 rounded-3xl bg-zinc-900/90 border border-emerald-500/30 shadow-lg relative overflow-hidden flex-1">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold material-symbols-outlined text-xl">
                      workspace_premium
                    </span>
                    <h4 className="font-extrabold text-white text-lg">Crowdbeats Model</h4>
                  </div>
                  <ul className="space-y-2.5 text-sm text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-emerald-500 text-lg shrink-0">done</span>
                      <span>
                        <strong>0% Monthly Subscriptions.</strong> Only pay when tips are collected.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-emerald-500 text-lg shrink-0">done</span>
                      <span>
                        <strong>Automated band splits</strong> distributed directly into each personal bank.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-emerald-500 text-lg shrink-0">done</span>
                      <span>
                        <strong>Direct payouts</strong> via standard Stripe Connect infrastructure.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="glass-panel p-6 rounded-3xl bg-zinc-900/50 border border-rose-500/20 relative overflow-hidden flex-1">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 font-bold material-symbols-outlined text-xl">
                      cancel
                    </span>
                    <h4 className="font-extrabold text-white text-lg">Traditional Merch &amp; Venues</h4>
                  </div>
                  <ul className="space-y-2.5 text-sm text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-rose-500 text-lg shrink-0">close</span>
                      <span>
                        Venues &amp; promoters taking <strong>15%–30% merch cuts</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-rose-500 text-lg shrink-0">close</span>
                      <span>
                        Physical tip jars suffer from <strong>cash scarcity</strong> (fans carry cards/phones).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-rose-500 text-lg shrink-0">close</span>
                      <span>Post-show awkward cash counting and manual Venmo math.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BAND REVENUE SPLITS SECTION */}
        <section className="py-24 border-t border-white/5 relative" id="band-splits">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Multi-Member Contract Engine
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-2 mb-4 tracking-tight">
                Zero-Drama Band Revenue Splits.
              </h2>
              <p className="text-base sm:text-lg text-zinc-400">
                When a fan tips a band on Crowdbeats, our subledger engine automatically divides and deposits each
                member's agreed percentage into their bank account.
              </p>
            </div>

            <div className="glass-panel rounded-3xl bg-zinc-900/90 border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-white/10">
                <div>
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                    Simulated Live Band:
                  </span>
                  <h3 className="text-2xl font-black text-white">The Neon Soundwave (4 Members)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-semibold mr-1">Live Fan Tip:</span>
                  {[50, 100, 250].map((amt) => {
                    const isSelected = bandTipAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setBandTipAmount(amt)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#8B5CF6] text-white border border-transparent shadow-sm'
                            : 'bg-zinc-800 text-zinc-300 hover:border-purple-500 border border-transparent'
                        }`}
                      >
                        ${amt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 Members */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
                <div className="p-5 rounded-2xl bg-zinc-800/60 border border-white/5 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-white">Jake Vance</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">40%</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4">Lead Vocals &amp; Guitar</p>
                  <div className="text-xs text-zinc-500 font-medium">Instant Member Deposit:</div>
                  <div className="text-2xl font-black text-white mt-1">${split1}</div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-800/60 border border-white/5 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-white">Maya Lin</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">25%</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4">Keyboards &amp; Synth</p>
                  <div className="text-xs text-zinc-500 font-medium">Instant Member Deposit:</div>
                  <div className="text-2xl font-black text-white mt-1">${split2}</div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-800/60 border border-white/5 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-white">Devon Cole</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">20%</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4">Drums &amp; Percussion</p>
                  <div className="text-xs text-zinc-500 font-medium">Instant Member Deposit:</div>
                  <div className="text-2xl font-black text-white mt-1">${split3}</div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-800/60 border border-white/5 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-white">Leo Gomez</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">15%</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4">Bass Guitar</p>
                  <div className="text-xs text-zinc-500 font-medium">Instant Member Deposit:</div>
                  <div className="text-2xl font-black text-white mt-1">${split4}</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-base">bolt</span>
                  <span>
                    <strong>100% Automated:</strong> Subledger resolves instantly via Stripe. On ${bandTipAmount}:
                    Crowdbeats fee is ${bandPlatformFee.toFixed(2)} (6%), Stripe fee is ${bandStripeFee.toFixed(2)}, and
                    ${bandNetPool.toFixed(2)} is distributed directly to member bank accounts.
                  </span>
                </div>
                <Link className="text-purple-400 hover:underline font-bold shrink-0" href="/band/splits">
                  Create Band Roster →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* BUILT FOR EVERY SIDE OF LIVE MUSIC */}
        <section className="py-24 border-t border-white/5 relative bg-[#09090D]/50" id="creators">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Built for Every Side of Live Music.
              </h2>
              <p className="text-base sm:text-lg text-zinc-400 mt-3">
                Whether you are holding the guitar, raising a glass, mixing sound, or booking the room.
              </p>
              <div className="inline-flex p-1.5 rounded-full bg-zinc-800/80 border border-white/5 mt-8 max-w-full overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedRole('solo')}
                  className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedRole === 'solo' ? 'bg-[#8B5CF6] text-white shadow-sm' : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  Solo Musicians
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('band')}
                  className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedRole === 'band' ? 'bg-[#8B5CF6] text-white shadow-sm' : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  Bands &amp; Crews
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('venue')}
                  className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedRole === 'venue' ? 'bg-[#8B5CF6] text-white shadow-sm' : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  Venues &amp; Bars
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('fan')}
                  className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedRole === 'fan' ? 'bg-[#8B5CF6] text-white shadow-sm' : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  Music Fans
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-3xl bg-zinc-900/90 border border-white/10 p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-widest">
                  <span>
                    {selectedRole === 'solo' && 'For Solo Creators'}
                    {selectedRole === 'band' && 'For Touring Bands & Crews'}
                    {selectedRole === 'venue' && 'For Live Venues & Bars'}
                    {selectedRole === 'fan' && 'For Live Music Enthusiasts'}
                  </span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  {selectedRole === 'solo' && 'Turn Audience Applause into Direct Digital Income.'}
                  {selectedRole === 'band' && 'Automate Split Payouts For Every Gig.'}
                  {selectedRole === 'venue' && 'Fill Stages with Verified Local Headliners.'}
                  {selectedRole === 'fan' && 'Fuel Your Favorite Musicians with 2 Taps.'}
                </h3>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                  {selectedRole === 'solo' &&
                    'Check in to any venue in 10 seconds. Your dynamic QR code displays instantly on your phone or mic stand. Fans tip via Google Pay or card without downloading an app.'}
                  {selectedRole === 'band' &&
                    'No more post-show cash counting or awkward manual Venmo requests. Each band member connects their bank account via Stripe Connect, and splits deposit automatically.'}
                  {selectedRole === 'venue' &&
                    'Access real-time verified check-in data, broadcast live stages to nearby fans, and turn live concerts into packed nights with zero ticketing markups.'}
                  {selectedRole === 'fan' &&
                    'Discover verified stages in real-time within your city. Send direct tips with zero subscription overhead, request songs, and support grassroots local arts.'}
                </p>
                <div className="pt-2">
                  <Link
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#8B5CF6] text-white text-sm font-semibold hover:opacity-95 shadow-md shadow-purple-600/30 transition"
                    href={
                      selectedRole === 'venue'
                        ? '/venue/dashboard'
                        : selectedRole === 'band'
                        ? '/band/dashboard'
                        : selectedRole === 'fan'
                        ? '/fan'
                        : '/auth?mode=register'
                    }
                  >
                    <span>
                      {selectedRole === 'venue'
                        ? 'Register Venue'
                        : selectedRole === 'band'
                        ? 'Setup Band Hub'
                        : selectedRole === 'fan'
                        ? 'Explore Stages'
                        : 'Claim Artist Stage'}
                    </span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                </div>
              </div>

              {/* Dynamic QR Token Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 p-6 border border-white/10 shadow-2xl text-center relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 w-28 h-28 bg-purple-500/20 rounded-full blur-2xl" />
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-6">
                    <span className="font-bold flex items-center gap-1 text-purple-400">
                      <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                      Dynamic Stage QR Token
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      ACTIVE
                    </span>
                  </div>
                  <div className="bg-white p-6 rounded-2xl inline-block shadow-inner mb-4">
                    <div className="w-44 h-44 border-4 border-slate-900 rounded-xl p-2 flex flex-col justify-between items-center relative">
                      <div className="flex justify-between w-full">
                        <div className="w-9 h-9 bg-slate-950 rounded-lg p-1.5">
                          <div className="w-full h-full bg-white rounded" />
                        </div>
                        <div className="w-9 h-9 bg-slate-950 rounded-lg p-1.5">
                          <div className="w-full h-full bg-white rounded" />
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white">
                        <CrowdbeatsLogo variant="emblem" height={36} surface="light" />
                      </div>
                      <div className="flex justify-between w-full">
                        <div className="w-9 h-9 bg-slate-950 rounded-lg p-1.5">
                          <div className="w-full h-full bg-white rounded" />
                        </div>
                        <div className="w-9 h-9 bg-zinc-400 rounded-sm grid grid-cols-2 gap-1 p-1">
                          <div className="bg-slate-950" />
                          <div className="bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-white font-black tracking-widest text-sm uppercase">CROWDBEATS QR</div>
                  <p className="text-zinc-400 text-xs mt-1">
                    Print, save to phone lock screen, or project onto stage monitors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* READY TO TAKE THE STAGE CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
              Ready to Take The Stage?
            </h2>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join thousands of independent musicians, passionate bands, vibrant venues, and music lovers across the
              nation. Zero monthly costs. Transparent 6% platform fee + standard Stripe.com processing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#8B5CF6] text-white text-base font-bold hover:opacity-95 shadow-xl shadow-purple-600/30 hover:scale-105 transition-all duration-200"
                href="/creator/dashboard"
              >
                Launch Artist Studio →
              </Link>
              <a
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-base font-semibold border border-white/10 transition-all"
                href="#radar"
              >
                Explore as Guest
              </a>
            </div>
          </div>
        </section>

        {/* OUR WHY BANNER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="glass-panel rounded-2xl bg-zinc-900/60 border border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 material-symbols-outlined text-2xl">
                campaign
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">Our Why: Empowering Live Music — 100% Free</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 uppercase">
                    Free to join &amp; explore
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Discover live concerts, broadcast sessions, and support artists with zero subscription dues. When
                  voluntary tips move, Crowdbeats takes a transparent 6% technology fee plus direct Stripe processing
                  costs to power the community.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                className="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-bold hover:opacity-90 shadow-sm"
                href="/auth?mode=register"
              >
                Join Crowdbeats →
              </Link>
              <Link
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold"
                href="/legal/support"
              >
                Help &amp; Support
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#050508] text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Live Platform</h5>
              <ul className="space-y-2.5">
                <li>
                  <Link className="hover:text-purple-500 transition" href="#radar">
                    Live Concert Discovery
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-purple-500 transition flex items-center gap-1" href="/preview">
                    <span className="material-symbols-outlined text-xs text-purple-400">palette</span> Persona Previews
                    (5 Roles)
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-purple-500 transition" href="#radar">
                    Nearby Music Stages
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-purple-500 transition" href="#radar">
                    Featured Solo Artists
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-purple-500 transition" href="#venues">
                    Live Stages &amp; Venues
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Help &amp; Support</h5>
              <ul className="space-y-2.5">
                <li>
                  <Link className="text-purple-400 font-semibold hover:underline" href="/legal/support">
                    Help &amp; Support Center ↗
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-purple-500 transition" href="/legal/support#faq">
                    Frequently Asked Questions
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-purple-500 transition" href="/legal/support#ticket">
                    Open Support Ticket
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-purple-500 transition" href="/legal/refunds">
                    Refund &amp; Tip Dispute Policy
                  </Link>
                </li>
                <li>
                  <a className="hover:text-purple-500 transition" href="mailto:contact@crowdbeats.ai">
                    Contact: support@crowdbeats.ai
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Legal &amp; Governance</h5>
              <ul className="space-y-2.5">
                <li>
                  <Link className="hover:text-purple-500 transition" href="/legal/terms">
                    Terms of Service (CA Law)
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-purple-500 transition" href="/legal/privacy">
                    Privacy Policy (CCPA / GDPR)
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-purple-500 transition" href="/legal/dmca">
                    DMCA &amp; Copyright Policy
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-purple-500 transition" href="/legal/aup">
                    Acceptable Use Policy
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-purple-500 transition" href="/legal/creator-monetization">
                    Creator Monetization &amp; Splits
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Trust &amp; Reporting</h5>
              <ul className="space-y-2.5">
                <li>
                  <Link className="text-rose-500 hover:underline font-semibold" href="/legal/copyright-report">
                    Submit DMCA Notice Form →
                  </Link>
                </li>
                <li>
                  <Link className="text-rose-500 hover:underline font-semibold" href="/legal/report-abuse">
                    Report Abuse &amp; Safety →
                  </Link>
                </li>
                <li>
                  <a className="hover:text-purple-500 transition" href="mailto:dmca@crowdbeats.ai">
                    dmca@crowdbeats.ai
                  </a>
                </li>
                <li>
                  <a className="hover:text-purple-500 transition" href="mailto:legal@crowdbeats.ai">
                    legal@crowdbeats.ai
                  </a>
                </li>
                <li>
                  <Link className="hover:text-purple-500 transition" href="/legal/law-enforcement">
                    Law Enforcement Guidelines
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] leading-relaxed">
            <div>
              <p>
                <strong className="text-zinc-300">Crowdbeats LLC</strong> • San Francisco, California, USA • Governing
                Law: State of California
              </p>
              <p className="text-zinc-500 mt-1 max-w-3xl">
                © 2026 Crowdbeats LLC. All rights reserved. 100% Free platform for solo musicians, bands, and fans with
                zero subscription dues. On voluntary live tips and campaign contributions, Crowdbeats charges a
                transparent 6% technology fee; Stripe payment-processing and Stripe Connect fees are separate and
                additional. Voluntary tips are disbursed in real time and non-refundable except where mandated by law.
                Exclusive venue and jurisdiction: San Francisco County, California.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0 font-medium">
              <Link className="hover:underline" href="/legal/terms">
                Terms
              </Link>
              <Link className="hover:underline" href="/legal/privacy">
                Privacy
              </Link>
              <Link className="hover:underline" href="/legal/dmca">
                DMCA
              </Link>
              <Link className="hover:underline" href="/legal/support">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Tip Authentication Gate Modal */}
      {activePerformer && (
        <TipAuthGateModal
          isOpen={isTipModalOpen}
          onClose={() => {
            setIsTipModalOpen(false);
            setActivePerformer(null);
          }}
          performerId={activePerformer.id}
          performerSlug={activePerformer.slug}
          performerName={activePerformer.name}
          performerType={activePerformer.type}
          initialAmountCents={tipAmount * 100}
        />
      )}
    </div>
  );
}
