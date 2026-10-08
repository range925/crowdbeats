'use client';

import React, { useState } from 'react';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

interface PhoneCardProps {
  stepNumber: string;
  badge: string;
  title: string;
}

export function HowItWorksPhones() {
  const [activeTab, setActiveTab] = useState<'all' | 'fans' | 'musicians'>('all');

  return (
    <div className="w-full">
      {/* Category Filter Pills (Mobile / Quick Switcher) */}
      <div className="flex md:hidden items-center justify-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All 6 Steps
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fans')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'fans'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          For Fans
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('musicians')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'musicians'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          For Musicians
        </button>
      </div>

      {/* 6-Phone Container: Responsive horizontal scroll on mobile, full grid on desktop */}
      <div className="relative w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
        <div className="flex items-start justify-center gap-4 lg:gap-5 min-w-[1440px] px-4 mx-auto">

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* PHONE 1: FOR FANS — STEP 1: DISCOVER                                */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div
            className={`w-[240px] shrink-0 transition-opacity duration-300 ${
              activeTab === 'musicians' ? 'hidden md:block opacity-40' : 'opacity-100'
            }`}
          >
            {/* iPhone Hardware Shell */}
            <div className="relative rounded-[40px] p-[3px] bg-gradient-to-b from-[#7F1D1D] via-[#450A0A] to-[#280505] shadow-[0_20px_45px_-12px_rgba(127,29,29,0.3)]">
              <div className="relative rounded-[37px] p-[2px] bg-black">
                {/* Screen Canvas */}
                <div className="relative w-full h-[500px] rounded-[35px] bg-[#FAF8FC] overflow-hidden flex flex-col justify-between p-3 select-none text-slate-900 font-sans">
                  
                  {/* Top Bar: Dynamic Island + Crowdbeats Header */}
                  <div>
                    {/* Dynamic Island */}
                    <div className="w-16 h-3.5 bg-black rounded-full mx-auto mb-2" />
                    
                    {/* App Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-[2px] text-purple-600">
                          <span className="w-[2px] h-3 bg-purple-600 rounded-full" />
                          <span className="w-[2px] h-4 bg-purple-600 rounded-full" />
                          <span className="w-[2px] h-2 bg-purple-600 rounded-full" />
                          <span className="w-[2px] h-5 bg-purple-600 rounded-full" />
                          <span className="w-[2px] h-3 bg-purple-600 rounded-full" />
                        </div>
                        <span className="text-[11px] font-black tracking-tight text-slate-900">Crowdbeats</span>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.35-4.35" />
                        </svg>
                      </div>
                    </div>

                    {/* Screen Title */}
                    <h3 className="text-base font-extrabold tracking-tight text-slate-900 mb-2">Discover</h3>

                    {/* Vector Map Preview Card */}
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200/80 bg-[#E8EDF5] shadow-inner mb-2.5">
                      {/* Stylized Map Grids / Roads */}
                      <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 200 120">
                        <path d="M-10 30 Q 80 50 210 20" stroke="#CBD5E1" strokeWidth="6" fill="none" />
                        <path d="M40 -10 Q 50 70 80 130" stroke="#CBD5E1" strokeWidth="8" fill="none" />
                        <path d="M120 -10 Q 140 60 160 130" stroke="#CBD5E1" strokeWidth="5" fill="none" />
                        <path d="M-10 80 Q 90 90 210 70" stroke="#CBD5E1" strokeWidth="6" fill="none" />
                        <rect x="90" y="35" width="45" height="35" rx="6" fill="#DCFCE7" />
                        <rect x="15" y="65" width="30" height="25" rx="4" fill="#E2E8F0" />
                      </svg>

                      {/* Nearby Solo Pins */}
                      <div className="absolute top-4 left-6 w-5 h-5 rounded-full border border-white shadow-sm bg-purple-500 overflow-hidden">
                        <div className="w-full h-full bg-slate-300 flex items-center justify-center text-[7px] font-bold text-white">JR</div>
                      </div>
                      <div className="absolute bottom-4 right-8 w-5 h-5 rounded-full border border-white shadow-sm bg-purple-500 overflow-hidden">
                        <div className="w-full h-full bg-slate-400 flex items-center justify-center text-[7px] font-bold text-white">TS</div>
                      </div>
                      <div className="absolute top-5 right-6 w-5 h-5 rounded-full border border-white shadow-sm bg-purple-500 overflow-hidden">
                        <div className="w-full h-full bg-slate-500 flex items-center justify-center text-[7px] font-bold text-white">CR</div>
                      </div>

                      {/* Main Maya Performer Pin */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <div className="relative">
                          <span className="absolute -inset-1 rounded-full bg-purple-500/30 animate-ping" />
                          <div className="relative w-8 h-8 rounded-full border-2 border-white shadow-md overflow-hidden bg-purple-600">
                            <img
                              src="/maya_avatar.webp"
                              alt="Maya"
                              className="w-full h-full object-cover"
                              loading="eager"
                            />
                          </div>
                        </div>
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-purple-600 -mt-[1px]" />
                      </div>
                    </div>

                    {/* Live Now Subheading */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">Live Now</span>
                      <span className="text-[10px] font-bold text-purple-600 cursor-pointer">See all</span>
                    </div>

                    {/* Performer Card */}
                    <div className="rounded-xl bg-white border border-slate-200/80 p-2 shadow-sm">
                      <div className="relative w-full h-20 rounded-lg overflow-hidden mb-1.5 bg-slate-100">
                        <img
                          src="/maya_stage.webp"
                          alt="Maya Live"
                          className="w-full h-full object-cover"
                          loading="eager"
                        />
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-purple-600 text-white font-black text-[8px] tracking-wider uppercase flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          LIVE
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-slate-900 leading-tight">Maya</div>
                          <div className="text-[9px] text-slate-500 font-medium flex items-center gap-0.5">
                            <svg className="w-2.5 h-2.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            Acoustic • 0.2 mi
                          </div>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action: Tip Button */}
                  <button
                    type="button"
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-purple-300 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                  >
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    Tip
                  </button>
                </div>
              </div>
            </div>
          </div>


          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* PHONE 2: FOR FANS — STEP 2: CONFIRM MUSICIAN                        */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div
            className={`w-[240px] shrink-0 transition-opacity duration-300 ${
              activeTab === 'musicians' ? 'hidden md:block opacity-40' : 'opacity-100'
            }`}
          >
            {/* iPhone Hardware Shell */}
            <div className="relative rounded-[40px] p-[3px] bg-gradient-to-b from-[#064E3B] via-[#022C22] to-[#011713] shadow-[0_20px_45px_-12px_rgba(6,78,59,0.3)]">
              <div className="relative rounded-[37px] p-[2px] bg-black">
                {/* Screen Canvas */}
                <div className="relative w-full h-[500px] rounded-[35px] bg-[#FAF8FC] overflow-hidden flex flex-col justify-between p-3 select-none text-slate-900 font-sans">
                  
                  {/* Top Bar + Title */}
                  <div>
                    <div className="w-16 h-3.5 bg-black rounded-full mx-auto mb-2" />
                    
                    {/* Back Arrow + Logo */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M15 19l-7-7 7-7" />
                        </svg>
                      </div>
                      <CrowdbeatsLogo variant="horizontal" height={16} surface="light" />
                      <div className="w-5" />
                    </div>

                    <h3 className="text-base font-extrabold tracking-tight text-slate-900 mb-2">Confirm musician</h3>

                    {/* Artist Hero Photo Card */}
                    <div className="rounded-xl bg-white border border-slate-200/80 overflow-hidden shadow-sm mb-3">
                      <div className="relative w-full h-28 bg-slate-100">
                        <img
                          src="/maya_stage.webp"
                          alt="Maya Hero"
                          className="w-full h-full object-cover"
                          loading="eager"
                        />
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-bold text-slate-900">Maya</div>
                        <div className="text-[9px] text-slate-500 font-medium flex items-center gap-0.5">
                          <svg className="w-2.5 h-2.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          Acoustic • 0.2 mi
                        </div>
                      </div>
                    </div>

                    {/* Tip Amount Pills */}
                    <div className="mb-3">
                      <span className="text-[10px] font-bold text-slate-600 mb-1.5 block">Tip amount</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        <div className="py-1 text-center bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800">$5</div>
                        <div className="py-1 text-center bg-purple-600 text-white rounded-lg text-[11px] font-bold shadow-sm shadow-purple-300">$10</div>
                        <div className="py-1 text-center bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800">$20</div>
                        <div className="py-1 text-center bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-center">Custom</div>
                      </div>
                    </div>

                    {/* Payment Method Row */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 mb-1.5 block">Payment method</span>
                      <div className="bg-white border border-slate-200/90 rounded-xl p-2 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-[#1434CB] text-white font-black italic text-[9px] rounded leading-none">VISA</span>
                          <span className="text-[11px] font-bold text-slate-800">Visa •••• 4242</span>
                        </div>
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Confirm & Tip Action */}
                  <button
                    type="button"
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-purple-300 transition-transform active:scale-95"
                  >
                    Confirm & tip
                  </button>
                </div>
              </div>
            </div>
          </div>


          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* PHONE 3: FOR FANS — STEP 3: TIP SENT!                               */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div
            className={`w-[240px] shrink-0 transition-opacity duration-300 ${
              activeTab === 'musicians' ? 'hidden md:block opacity-40' : 'opacity-100'
            }`}
          >
            {/* iPhone Hardware Shell */}
            <div className="relative rounded-[40px] p-[3px] bg-gradient-to-b from-[#4C1D95] via-[#2E1065] to-[#170535] shadow-[0_20px_45px_-12px_rgba(76,29,149,0.3)]">
              <div className="relative rounded-[37px] p-[2px] bg-black">
                {/* Screen Canvas */}
                <div className="relative w-full h-[500px] rounded-[35px] bg-[#FAF8FC] overflow-hidden flex flex-col justify-between p-3 select-none text-slate-900 font-sans">
                  
                  {/* Top Bar + Success Celebration */}
                  <div>
                    <div className="w-16 h-3.5 bg-black rounded-full mx-auto mb-2" />
                    
                    {/* Logo in Center */}
                    <div className="flex items-center justify-center mb-4">
                      <CrowdbeatsLogo variant="horizontal" height={16} surface="light" />
                    </div>

                    {/* Celebration Starburst Checkmark */}
                    <div className="flex flex-col items-center justify-center my-2">
                      <div className="relative">
                        {/* Radiant Sparkle Rays */}
                        <svg className="w-20 h-20 text-purple-300/60 absolute -inset-2 animate-spin-slow" viewBox="0 0 100 100" fill="currentColor">
                          <circle cx="50" cy="10" r="2.5" />
                          <circle cx="90" cy="50" r="2.5" />
                          <circle cx="50" cy="90" r="2.5" />
                          <circle cx="10" cy="50" r="2.5" />
                          <circle cx="78" cy="22" r="2" />
                          <circle cx="78" cy="78" r="2" />
                          <circle cx="22" cy="78" r="2" />
                          <circle cx="22" cy="22" r="2" />
                        </svg>

                        {/* Central Purple Checkmark Circle */}
                        <div className="relative w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-300">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 mt-3 tracking-tight">Tip sent!</h3>
                      <div className="text-sm font-extrabold text-purple-600 mt-0.5">$10 to Maya</div>
                      <p className="text-[10px] text-slate-500 font-medium text-center mt-1 px-2 leading-tight">
                        Thanks for supporting live music.
                      </p>
                    </div>

                    {/* Maya Mini Profile Card */}
                    <div className="rounded-xl bg-white border border-slate-200/80 p-2 flex items-center gap-2.5 shadow-sm mt-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                        <img
                          src="/maya_avatar.webp"
                          alt="Maya"
                          className="w-full h-full object-cover"
                          loading="eager"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Maya</div>
                        <div className="text-[9px] text-slate-500 font-medium">Acoustic • 0.2 mi</div>
                      </div>
                    </div>
                  </div>

                  {/* View Receipt Button */}
                  <button
                    type="button"
                    className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold text-xs border border-purple-200/80 transition-colors"
                  >
                    View receipt
                  </button>
                </div>
              </div>
            </div>
          </div>


          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* PHONE 4: FOR MUSICIANS — STEP 1: VERIFY IDENTIFICATION             */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div
            className={`w-[240px] shrink-0 transition-opacity duration-300 ${
              activeTab === 'fans' ? 'hidden md:block opacity-40' : 'opacity-100'
            }`}
          >
            {/* iPhone Hardware Shell */}
            <div className="relative rounded-[40px] p-[3px] bg-gradient-to-b from-[#9CA3AF] via-[#6B7280] to-[#374151] shadow-[0_20px_45px_-12px_rgba(0,0,0,0.18)]">
              <div className="relative rounded-[37px] p-[2px] bg-black">
                {/* Screen Canvas */}
                <div className="relative w-full h-[500px] rounded-[35px] bg-[#FAF8FC] overflow-hidden flex flex-col justify-between p-3 select-none text-slate-900 font-sans">
                  
                  {/* Top Bar + Identity Details */}
                  <div>
                    <div className="w-16 h-3.5 bg-black rounded-full mx-auto mb-2" />
                    
                    {/* Back Arrow + Logo */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M15 19l-7-7 7-7" />
                        </svg>
                      </div>
                      <CrowdbeatsLogo variant="horizontal" height={16} surface="light" />
                      <div className="w-5" />
                    </div>

                    <h3 className="text-base font-extrabold tracking-tight text-slate-900 mb-3">Verify identification</h3>

                    {/* Verified User Illustration Badge */}
                    <div className="flex flex-col items-center justify-center my-3">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-inner">
                          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                        {/* Green Verified Badge */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-sm">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 mt-2.5 tracking-tight">Identity verified</h4>
                      <p className="text-[10px] text-slate-500 font-medium text-center px-2 mt-1 leading-snug">
                        Your identity has been verified and you&apos;re ready to receive tips.
                      </p>
                    </div>

                    {/* Bank Connected Row */}
                    <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex items-center justify-between shadow-sm mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-5-8L2 7v2h19V7l-9-5z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-900 leading-tight">Bank connected</div>
                          <div className="text-[9px] text-slate-500 font-medium">Bank •••• 6789</div>
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Stripe Notice */}
                    <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 font-medium mt-4">
                      <span>Payouts by</span>
                      <span className="font-black text-slate-800 tracking-tight">stripe</span>
                    </div>
                  </div>

                  {/* Continue Action */}
                  <button
                    type="button"
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-purple-300 transition-transform active:scale-95"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>


          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* PHONE 5: FOR MUSICIANS — STEP 2: PLAY & RECEIVE TIPS               */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div
            className={`w-[240px] shrink-0 transition-opacity duration-300 ${
              activeTab === 'fans' ? 'hidden md:block opacity-40' : 'opacity-100'
            }`}
          >
            {/* iPhone Hardware Shell */}
            <div className="relative rounded-[40px] p-[3px] bg-gradient-to-b from-[#B45309] via-[#78350F] to-[#451A03] shadow-[0_20px_45px_-12px_rgba(180,83,9,0.3)]">
              <div className="relative rounded-[37px] p-[2px] bg-black">
                {/* Screen Canvas */}
                <div className="relative w-full h-[500px] rounded-[35px] bg-[#FAF8FC] overflow-hidden flex flex-col justify-between p-3 select-none text-slate-900 font-sans">
                  
                  {/* Top Bar + Live Stage */}
                  <div>
                    <div className="w-16 h-3.5 bg-black rounded-full mx-auto mb-2" />
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-[2px] text-purple-600">
                          <span className="w-[2px] h-3 bg-purple-600 rounded-full" />
                          <span className="w-[2px] h-4 bg-purple-600 rounded-full" />
                          <span className="w-[2px] h-2 bg-purple-600 rounded-full" />
                          <span className="w-[2px] h-5 bg-purple-600 rounded-full" />
                          <span className="w-[2px] h-3 bg-purple-600 rounded-full" />
                        </div>
                        <span className="text-[11px] font-black tracking-tight text-slate-900">Crowdbeats</span>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold tracking-tight text-slate-900 mb-2">Play & receive tips</h3>

                    {/* Stage Hero Performance with Live Tip Overlay */}
                    <div className="relative rounded-xl overflow-hidden border border-slate-200/80 shadow-sm mb-2.5 bg-slate-900">
                      <div className="relative w-full h-24">
                        <img
                          src="/maya_stage.webp"
                          alt="Maya Playing"
                          className="w-full h-full object-cover"
                          loading="eager"
                        />
                        {/* Red Live Indicator */}
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[8px] tracking-wider uppercase flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          LIVE
                        </span>
                        {/* Viewers Badge */}
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white font-bold text-[8px] flex items-center gap-1">
                          👁 42
                        </span>

                        {/* Floating Live Tip Toast Notification */}
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-white/95 backdrop-blur-md rounded-lg p-1.5 shadow-md flex items-center gap-1.5 border border-white">
                          <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[8px] font-bold">
                            ★
                          </div>
                          <div className="text-[9px] font-extrabold text-slate-900 leading-tight">
                            New tip received! <span className="text-purple-600">$10</span> from a fan 🎉
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="rounded-xl bg-white border border-slate-200/90 p-2 flex items-center justify-between shadow-sm mb-2.5">
                      <div>
                        <div className="text-[10px] font-bold text-slate-900">Your QR code</div>
                        <div className="text-[8px] text-slate-500 font-medium leading-tight">Fans can tip you during your set.</div>
                      </div>
                      {/* Stylized Vector QR Code */}
                      <div className="w-10 h-10 bg-white border border-slate-300 rounded p-1 flex flex-col justify-between shadow-inner shrink-0">
                        <div className="flex justify-between">
                          <div className="w-2.5 h-2.5 bg-slate-900 rounded-[1px] p-[1px]"><div className="w-full h-full bg-white rounded-[1px]" /></div>
                          <div className="w-2.5 h-2.5 bg-slate-900 rounded-[1px] p-[1px]"><div className="w-full h-full bg-white rounded-[1px]" /></div>
                        </div>
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mx-auto" />
                        <div className="flex justify-between">
                          <div className="w-2.5 h-2.5 bg-slate-900 rounded-[1px] p-[1px]"><div className="w-full h-full bg-white rounded-[1px]" /></div>
                          <div className="w-2.5 h-2.5 bg-slate-800 rounded-[1px]" />
                        </div>
                      </div>
                    </div>

                    {/* Tips Received List */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-900">Tips received</span>
                        <span className="text-[9px] font-bold text-purple-600 cursor-pointer">See all</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-[8px] flex items-center justify-center">A</div>
                            <div>
                              <div className="text-[9px] font-bold text-slate-900 leading-tight">$10 from Alex</div>
                              <div className="text-[8px] text-slate-400">2 min ago</div>
                            </div>
                          </div>
                          <span className="text-purple-600 text-xs">♥</span>
                        </div>
                        <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 font-bold text-[8px] flex items-center justify-center">T</div>
                            <div>
                              <div className="text-[9px] font-bold text-slate-900 leading-tight">$5 from Taylor</div>
                              <div className="text-[8px] text-slate-400">18 min ago</div>
                            </div>
                          </div>
                          <span className="text-purple-600 text-xs">♥</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[8px] text-center text-slate-400 font-medium">Stage Session Active</div>
                </div>
              </div>
            </div>
          </div>


          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* PHONE 6: FOR MUSICIANS — STEP 3: CASH OUT                          */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div
            className={`w-[240px] shrink-0 transition-opacity duration-300 ${
              activeTab === 'fans' ? 'hidden md:block opacity-40' : 'opacity-100'
            }`}
          >
            {/* iPhone Hardware Shell */}
            <div className="relative rounded-[40px] p-[3px] bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#020617] shadow-[0_20px_45px_-12px_rgba(30,41,59,0.3)]">
              <div className="relative rounded-[37px] p-[2px] bg-black">
                {/* Screen Canvas */}
                <div className="relative w-full h-[500px] rounded-[35px] bg-[#FAF8FC] overflow-hidden flex flex-col justify-between p-3 select-none text-slate-900 font-sans">
                  
                  {/* Top Bar + Balance Details */}
                  <div>
                    <div className="w-16 h-3.5 bg-black rounded-full mx-auto mb-2" />
                    
                    {/* Centered Logo */}
                    <div className="flex items-center justify-center mb-2">
                      <CrowdbeatsLogo variant="horizontal" height={16} surface="light" />
                    </div>

                    <h3 className="text-base font-extrabold tracking-tight text-slate-900 mb-2">Cash out</h3>

                    {/* Available Balance Card */}
                    <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-sm mb-2.5">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[10px] font-bold">Available balance</span>
                        <span className="text-[9px] font-bold text-slate-400">ⓘ</span>
                      </div>
                      <div className="flex items-baseline gap-1 my-1">
                        <span className="text-2xl font-black text-slate-900 tracking-tight">$84.00</span>
                        <span className="text-slate-400 text-xs">▾</span>
                      </div>
                      <div className="text-[8px] text-slate-400 font-medium">Your earnings from tips</div>
                    </div>

                    {/* Destination Bank Row */}
                    <div className="bg-white border border-slate-200/90 rounded-xl p-2 flex items-center justify-between shadow-sm mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-5-8L2 7v2h19V7l-9-5z"/>
                          </svg>
                        </div>
                        <span className="text-[11px] font-bold text-slate-800">Bank •••• 6789</span>
                      </div>
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Cash Out Button */}
                    <button
                      type="button"
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-purple-300 transition-transform active:scale-95 mb-2"
                    >
                      Cash out
                    </button>

                    {/* Stripe Notice */}
                    <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 font-medium mb-3">
                      <span>Payouts by</span>
                      <span className="font-black text-slate-800 tracking-tight">stripe</span>
                    </div>

                    {/* Recent Tips List */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-900">Recent tips</span>
                        <span className="text-[9px] font-bold text-purple-600 cursor-pointer">See all</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-[8px] flex items-center justify-center">A</div>
                            <div>
                              <div className="text-[9px] font-bold text-slate-900 leading-tight">$10 from Alex</div>
                              <div className="text-[8px] text-slate-400">2 min ago</div>
                            </div>
                          </div>
                          <span className="text-emerald-600 font-extrabold text-[10px]">+ $10</span>
                        </div>
                        <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 font-bold text-[8px] flex items-center justify-center">T</div>
                            <div>
                              <div className="text-[9px] font-bold text-slate-900 leading-tight">$5 from Taylor</div>
                              <div className="text-[8px] text-slate-400">18 min ago</div>
                            </div>
                          </div>
                          <span className="text-emerald-600 font-extrabold text-[10px]">+ $5</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[8px] text-center text-slate-400 font-medium">Stripe Connect Ready</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
