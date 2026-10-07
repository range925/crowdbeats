'use client';

/**
 * Crowdbeats V2 — AR Camera Performer Detection & QR Scanner (Stitch Screens 3 & 12)
 * Route: /fan/scan
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { CbLiveBadge, CbPillButton } from '@/components/ui';

const EMOJI_REACTIONS = ['🔥', '❤️', '⚡', '👏', '🙌'];
const QUICK_AMOUNTS = [500, 1000, 2000];

export default function ArScannerPage() {
  const [instantTipCents, setInstantTipCents] = useState(500);
  const [selectedEmoji, setSelectedEmoji] = useState('🔥');
  const [torch, setTorch] = useState(false);
  const [tipped, setTipped] = useState(false);

  const amountDisplay = `$${(instantTipCents / 100).toFixed(2)}`;

  return (
    <div className="relative w-full max-w-md mx-auto h-[620px] bg-black rounded-3xl overflow-hidden border border-[#2B2D44] shadow-2xl flex flex-col justify-between p-4">
      {/* ── Background Live Stage Camera Feed Simulation ──────────────────── */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80"
          alt="Stage camera view"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {/* ── Top Controls ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between">
        <Link href="/fan">
          <button type="button" className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80">
            ✕
          </button>
        </Link>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#2B2D44]">
          <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wide">AR VISION TIP</span>
        </div>

        <button
          type="button"
          onClick={() => setTorch(!torch)}
          className={`p-2 rounded-full backdrop-blur-md transition-colors ${
            torch ? 'bg-amber-400 text-black' : 'bg-black/60 text-white'
          }`}
        >
          ⚡
        </button>
      </div>

      {/* ── Center AR Targeting Reticle (Stitch Screens 3 & 12) ────────────── */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        <div className="mb-2 px-2.5 py-0.5 rounded-md bg-black/90 border border-[#00FF66] text-[10px] font-extrabold text-[#00FF66] tracking-wider shadow-[0_0_12px_rgba(0,255,102,0.4)]">
          ● PERFORMER DETECTED • 98% MATCH
        </div>

        {/* Reticle Box with Corners */}
        <div className="relative w-56 h-56 rounded-2xl border border-[#00FF66]/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.2)]">
          {/* 4 Corner Brackets */}
          <span className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-[#00FF66]" />
          <span className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-[#00FF66]" />
          <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-[#00FF66]" />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-[#00FF66]" />

          <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#00FF66]" />
          </div>
        </div>

        <div className="mt-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white font-bold">
          Luna & The Waves (Indie Pop)
        </div>
      </div>

      {/* ── Bottom Glassmorphic Instant Tipping Drawer (Stitch Screen 12) ─── */}
      <div className="relative z-10 bg-[#151722]/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-3">
        {/* Performer Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#7C3AED]">
              <img
                src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150&auto=format&fit=crop&q=80"
                alt="Luna & The Waves"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Luna & The Waves</h3>
              <p className="text-[10px] text-[#A855F7]">The Casbah • Main Stage</p>
            </div>
          </div>
          <CbLiveBadge />
        </div>

        {/* Quick Amount Selector */}
        <div className="grid grid-cols-3 gap-2">
          {QUICK_AMOUNTS.map((cents) => {
            const isSelected = instantTipCents === cents;
            return (
              <button
                key={cents}
                type="button"
                onClick={() => setInstantTipCents(cents)}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-[#7C3AED] text-white border-[#A855F7] shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                    : 'bg-[#1E2032] text-[#94A3B8] border-[#2B2D44] hover:text-white'
                }`}
              >
                ${cents / 100}
              </button>
            );
          })}
        </div>

        {/* Emoji Reactions */}
        <div className="flex items-center justify-around py-0.5">
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setSelectedEmoji(emoji)}
              className={`p-1.5 rounded-full text-lg transition-transform ${
                selectedEmoji === emoji ? 'bg-[#7C3AED]/30 scale-125 border border-[#7C3AED]' : 'hover:scale-110'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Instant 1-Tap CTA */}
        {tipped ? (
          <div className="py-2.5 rounded-full bg-[#10B981] text-white text-xs font-bold text-center">
            ✓ Tipped {amountDisplay} to Luna & The Waves!
          </div>
        ) : (
          <CbPillButton
            label={`⚡ Instant Tip ${amountDisplay}`}
            onClick={() => {
              setTipped(true);
              setTimeout(() => setTipped(false), 3000);
            }}
            className="!py-2.5 !text-xs"
          />
        )}
      </div>
    </div>
  );
}
