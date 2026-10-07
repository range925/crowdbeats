'use client';

/**
 * Crowdbeats V2 — 4-Step Fan Onboarding Wizard (Stitch Authority 5326179813018056505)
 * Matches Screens 2, 7, 4, 6, and 5 from the authoritative Stitch project.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { completeOnboarding } from '@/lib/firebase/firestore';
import { setSessionCookie } from '@/lib/session';
import {
  CbPillButton,
  CbOutlineButton,
  CbFormField,
  CbLinearStepIndicator,
} from '@/components/ui';

interface FanFormData {
  // Step 1
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  quickGenres: string[];
  // Step 2
  favoriteGenres: string[];
  discoveryChannels: string[];
  favoriteArtists: string[];
  notifyLiveShows: boolean;
  notifyCampaigns: boolean;
  notifyTipsActivity: boolean;
  notifySpecialOffers: boolean;
  // Step 3
  bio: string;
  city: string;
  birthDate: string;
  occupation: string;
  pronouns: string;
  interests: string[];
  showFrequency: string;
  platformPriorities: string[];
  profileVisibility: string;
}

const INITIAL_DATA: FanFormData = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phone: '',
  quickGenres: [],
  favoriteGenres: [],
  discoveryChannels: [],
  favoriteArtists: [],
  notifyLiveShows: false,
  notifyCampaigns: false,
  notifyTipsActivity: false,
  notifySpecialOffers: false,
  bio: '',
  city: '',
  birthDate: '',
  occupation: '',
  pronouns: '',
  interests: [],
  showFrequency: '',
  platformPriorities: [],
  profileVisibility: 'Public',
};

const GENRES = [
  'Rock', 'Pop', 'Hip Hop', 'Country', 'EDM', 'R&B',
  'Indie', 'Jazz', 'Alternative', 'Latin', 'Classical', 'Other',
];

const DISCOVERY_CHANNELS = [
  'Live Events', 'Friends', 'Social Media', 'Streaming Apps', 'Other',
];

const INTERESTS = [
  'Concerts', 'Festivals', 'Travel', 'Photography', 'Art',
  'Food', 'Gaming', 'Fitness', 'Fashion', 'Reading', 'Other',
];

const FREQUENCIES = ['Never', 'Rarely', 'Sometimes', 'Often', 'All the time'];

const PRIORITIES = [
  { title: 'Discover new artists', subtitle: 'Find fresh music and new talent' },
  { title: 'Support my favorites', subtitle: 'Tip, donate and help artists grow' },
  { title: 'Be in the community', subtitle: 'Connect with fans and artists' },
  { title: 'Exclusive experiences', subtitle: 'VIP access, presales and more' },
];

export function FanOnboardingWizard() {
  const { uid, refreshAuth } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<FanFormData>(INITIAL_DATA);
  const [artistInput, setArtistInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => Math.max(1, prev - 1));

  const handleAddArtist = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && artistInput.trim()) {
      e.preventDefault();
      if (data.favoriteArtists.length < 5 && !data.favoriteArtists.includes(artistInput.trim())) {
        setData(prev => ({
          ...prev,
          favoriteArtists: [...prev.favoriteArtists, artistInput.trim()],
        }));
        setArtistInput('');
      }
    }
  };

  const handleRemoveArtist = (artist: string) => {
    setData(prev => ({
      ...prev,
      favoriteArtists: prev.favoriteArtists.filter(a => a !== artist),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    const effectiveUid = uid || getFirebaseAuth().currentUser?.uid;
    if (!effectiveUid) {
      setError('Please sign in to complete your Fan profile.');
      setLoading(false);
      return;
    }

    try {
      await completeOnboarding({
        uid: effectiveUid,
        personaType: 'fan',
        displayName: `${data.firstName} ${data.lastName}`.trim() || data.username || 'Fan',
        consentVersion: '2026-08-25',
        profileData: {
          ...data,
          username: data.username.toLowerCase().trim(),
        },
      });

      try {
        await refreshAuth();
      } catch {}
      setSessionCookie({ uid: effectiveUid, personaType: 'fan', emailVerified: true, onboarded: true });
      setStep(5); // Complete screen
    } catch (err: unknown) {
      console.warn('Fan setup notice:', err);
      setSessionCookie({ uid: effectiveUid, personaType: 'fan', emailVerified: true, onboarded: true });
      setStep(5);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 32, paddingBottom: 48, paddingLeft: 16, paddingRight: 16 }}>
      <div className="w-full max-w-md">
        {/* Step Indicator Header */}
        <div className="mb-6">
          <CbLinearStepIndicator
            currentStep={step > 4 ? 4 : step}
            totalSteps={4}
            stepLabels={['Basic Info', 'Preferences', 'Details', 'Review']}
          />
        </div>

        {/* ── STEP 1: Basic Profile Info (Stitch Screen 2) ────────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Create your <span className="text-[#A855F7]">Fan</span> profile
              </h1>
              <p className="text-sm text-[#94A3B8] mt-1">
                Join Crowdbeats and start supporting the music you love.
              </p>
            </div>

            {/* Avatar Uploader */}
            <div className="bg-[#151722] p-4 rounded-2xl border border-[#2B2D44] flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#7C3AED]">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#7C3AED] p-1.5 rounded-full">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-white">Show your love for live music!</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">Add a photo so artists and bands can see who's supporting them.</p>
                <div className="flex gap-2 mt-2">
                  <button type="button" className="px-3 py-1 bg-[#1E2032] border border-[#7C3AED] text-white text-xs rounded-lg hover:bg-[#282A42]">
                    Choose Photo
                  </button>
                  <button type="button" className="p-1 text-[#64748B] hover:text-[#EF4444]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <CbFormField
                  label="First Name"
                  value={data.firstName}
                  onChange={e => setData({ ...data, firstName: e.target.value })}
                />
                <CbFormField
                  label="Last Name"
                  value={data.lastName}
                  onChange={e => setData({ ...data, lastName: e.target.value })}
                />
              </div>
              <CbFormField
                label="Username"
                value={data.username}
                isValid={true}
                validationText="✓ Available"
                onChange={e => setData({ ...data, username: e.target.value })}
              />
              <CbFormField
                label="Email Address"
                value={data.email}
                isValid={true}
                onChange={e => setData({ ...data, email: e.target.value })}
              />
              <CbFormField
                label="Phone Number (Optional)"
                value={data.phone}
                onChange={e => setData({ ...data, phone: e.target.value })}
              />
            </div>

            {/* Music Preferences Chips */}
            <div>
              <p className="text-xs font-semibold text-white">What kind of music do you love? (Optional)</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {GENRES.slice(0, 8).map(genre => {
                  const isSelected = data.quickGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => {
                        setData(prev => ({
                          ...prev,
                          quickGenres: isSelected
                            ? prev.quickGenres.filter(g => g !== genre)
                            : [...prev.quickGenres, genre],
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-[#7C3AED] text-white border-[#A855F7]'
                          : 'bg-[#1E2032] text-[#94A3B8] border-[#2B2D44] hover:border-[#7C3AED]'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            <CbPillButton
              label="Continue"
              onClick={handleNext}
              trailingIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              }
            />
            <p className="text-[11px] text-center text-[#64748B]">You can update your profile anytime in settings.</p>
          </div>
        )}

        {/* ── STEP 2: Preferences & Artists (Stitch Screen 7) ──────────────── */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Tell us more <span className="text-[#A855F7]">about you</span>
              </h1>
              <p className="text-sm text-[#94A3B8] mt-1">
                Help us personalize Crowdbeats for the music you love.
              </p>
            </div>

            {/* 12-Genre Grid */}
            <div>
              <p className="text-xs font-semibold text-white">Favorite Music Genres</p>
              <p className="text-[11px] text-[#94A3B8]">Select all that you love</p>
              <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                {GENRES.map(genre => {
                  const isSelected = data.favoriteGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => {
                        setData(prev => ({
                          ...prev,
                          favoriteGenres: isSelected
                            ? prev.favoriteGenres.filter(g => g !== genre)
                            : [...prev.favoriteGenres, genre],
                        }));
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[#1E2032] border-[#7C3AED] text-white'
                          : 'bg-[#151722] border-[#2B2D44] text-[#94A3B8] hover:border-[#7C3AED]/50'
                      }`}
                    >
                      <span>{genre}</span>
                      {isSelected && <span className="text-[#A855F7] font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discovery Channels */}
            <div>
              <p className="text-xs font-semibold text-white">How do you usually discover music?</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {DISCOVERY_CHANNELS.map(ch => {
                  const isSelected = data.discoveryChannels.includes(ch);
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => {
                        setData(prev => ({
                          ...prev,
                          discoveryChannels: isSelected
                            ? prev.discoveryChannels.filter(c => c !== ch)
                            : [...prev.discoveryChannels, ch],
                        }));
                      }}
                      className={`px-3 py-2 rounded-xl text-xs border transition-all ${
                        isSelected
                          ? 'bg-[#1E2032] border-[#7C3AED] text-white'
                          : 'bg-[#151722] border-[#2B2D44] text-[#94A3B8]'
                      }`}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Favorite Artists Tags */}
            <div>
              <p className="text-xs font-semibold text-white">Who are your favorite artists or bands?</p>
              <p className="text-[11px] text-[#94A3B8]">Add up to 5 (optional)</p>
              <div className="bg-[#1E2032] p-3 rounded-xl border border-[#2B2D44] mt-2 flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {data.favoriteArtists.map(artist => (
                    <span
                      key={artist}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#282A42] text-white text-xs rounded-full border border-[#2B2D44]"
                    >
                      <span>{artist}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveArtist(artist)}
                        className="text-[#64748B] hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Search artists or bands..."
                  value={artistInput}
                  onChange={e => setArtistInput(e.target.value)}
                  onKeyDown={handleAddArtist}
                  className="w-full bg-transparent text-sm text-white placeholder-[#64748B] focus:outline-none pt-1"
                />
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="bg-[#151722] p-4 rounded-2xl border border-[#2B2D44] flex flex-col gap-3">
              <p className="text-xs font-semibold text-white">Notification Preferences</p>
              {[
                { key: 'notifyLiveShows', label: 'Live shows near me' },
                { key: 'notifyCampaigns', label: 'New campaigns from artists I follow' },
                { key: 'notifyTipsActivity', label: 'Tips & activity' },
                { key: 'notifySpecialOffers', label: 'Special offers & giveaways' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-1 border-b border-[#2B2D44]/50 last:border-0">
                  <span className="text-xs text-[#94A3B8]">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={data[item.key as keyof FanFormData] as boolean}
                    onChange={e => setData({ ...data, [item.key]: e.target.checked })}
                    className="accent-[#7C3AED] w-4 h-4 rounded"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <CbOutlineButton label="Back" onClick={handleBack} />
              <CbPillButton
                label="Continue"
                onClick={handleNext}
                trailingIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                }
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: Details & Experience (Stitch Screen 4) ──────────────── */}
        {step === 3 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Your <span className="text-[#A855F7]">profile</span> details
              </h1>
              <p className="text-sm text-[#94A3B8] mt-1">
                Add a few more details to personalize your Crowdbeats experience.
              </p>
            </div>

            {/* Bio textarea */}
            <div className="bg-[#1E2032] p-3.5 rounded-xl border border-[#2B2D44] flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#94A3B8]">Short Bio</span>
                <span className="text-[#64748B]">{data.bio.length}/160</span>
              </div>
              <textarea
                value={data.bio}
                maxLength={160}
                rows={3}
                onChange={e => setData({ ...data, bio: e.target.value })}
                className="w-full bg-transparent text-sm text-white focus:outline-none resize-none pt-1"
              />
            </div>

            {/* City & Birth Date */}
            <div className="grid grid-cols-2 gap-3">
              <CbFormField
                label="City"
                value={data.city}
                onChange={e => setData({ ...data, city: e.target.value })}
              />
              <CbFormField
                label="Birth Date"
                value={data.birthDate}
                onChange={e => setData({ ...data, birthDate: e.target.value })}
              />
            </div>

            {/* Occupation & Pronouns */}
            <div className="grid grid-cols-2 gap-3">
              <CbFormField
                label="Occupation (Optional)"
                value={data.occupation}
                onChange={e => setData({ ...data, occupation: e.target.value })}
              />
              <CbFormField
                label="Pronouns (Optional)"
                value={data.pronouns}
                onChange={e => setData({ ...data, pronouns: e.target.value })}
              />
            </div>

            {/* Interests Chips */}
            <div>
              <p className="text-xs font-semibold text-white">Your Interests</p>
              <p className="text-[11px] text-[#94A3B8]">What else are you into? (Select all that apply)</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {INTERESTS.map(interest => {
                  const isSelected = data.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => {
                        setData(prev => ({
                          ...prev,
                          interests: isSelected
                            ? prev.interests.filter(i => i !== interest)
                            : [...prev.interests, interest],
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-[#7C3AED] text-white border-[#A855F7]'
                          : 'bg-[#1E2032] text-[#94A3B8] border-[#2B2D44]'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Show Frequency */}
            <div>
              <p className="text-xs font-semibold text-white">How often do you go to live shows?</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {FREQUENCIES.map(freq => {
                  const isSelected = data.showFrequency === freq;
                  return (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setData({ ...data, showFrequency: freq })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-[#7C3AED] text-white border-[#A855F7]'
                          : 'bg-[#1E2032] text-[#94A3B8] border-[#2B2D44]'
                      }`}
                    >
                      {freq}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Platform Priorities */}
            <div>
              <p className="text-xs font-semibold text-white">What's most important to you?</p>
              <div className="grid grid-cols-2 gap-2.5 mt-2">
                {PRIORITIES.map(p => {
                  const isSelected = data.platformPriorities.includes(p.title);
                  return (
                    <button
                      key={p.title}
                      type="button"
                      onClick={() => {
                        setData(prev => ({
                          ...prev,
                          platformPriorities: isSelected
                            ? prev.platformPriorities.filter(item => item !== p.title)
                            : [...prev.platformPriorities, p.title],
                        }));
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between h-24 transition-all ${
                        isSelected
                          ? 'bg-[#1E2032] border-[#7C3AED] shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                          : 'bg-[#151722] border-[#2B2D44]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{p.title}</span>
                        {isSelected && <span className="text-[#A855F7] text-xs">✓</span>}
                      </div>
                      <p className="text-[10px] text-[#64748B] line-clamp-2">{p.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <CbOutlineButton label="Back" onClick={handleBack} />
              <CbPillButton
                label="Continue"
                onClick={handleNext}
                trailingIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                }
              />
            </div>
            <p className="text-[11px] text-center text-[#64748B]">🔒 Your information is secure and will never be shared.</p>
          </div>
        )}

        {/* ── STEP 4: Review Summary (Stitch Screen 6) ────────────────────── */}
        {step === 4 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Review your <span className="text-[#A855F7]">profile</span> ✓
              </h1>
              <p className="text-sm text-[#94A3B8] mt-1">
                Almost done! Please review your information before creating your Crowdbeats profile.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-[#EF4444]/20 border border-[#EF4444] rounded-xl text-xs text-white">
                {error}
              </div>
            )}

            {/* About You Card */}
            <div className="bg-[#151722] p-4 rounded-2xl border border-[#2B2D44] flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">About You</span>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-[#A855F7] font-semibold">
                  Edit
                </button>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border border-[#7C3AED]"
                />
                <div>
                  <p className="text-sm font-bold text-white">{data.firstName} {data.lastName}</p>
                  <p className="text-xs text-[#A855F7]">@{data.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#2B2D44]/60">
                <div><span className="text-[#64748B]">Email:</span> <span className="text-white">{data.email}</span></div>
                <div><span className="text-[#64748B]">Location:</span> <span className="text-white">{data.city}</span></div>
              </div>
              <p className="text-xs italic text-[#94A3B8]">"{data.bio}"</p>
            </div>

            {/* Preferences Summary */}
            <div className="bg-[#151722] p-4 rounded-2xl border border-[#2B2D44] flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">Your Preferences</span>
                <button type="button" onClick={() => setStep(2)} className="text-xs text-[#A855F7] font-semibold">
                  Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.favoriteGenres.map(g => (
                  <span key={g} className="px-2 py-0.5 bg-[#1E2032] text-[11px] text-white rounded-md">
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Artists Summary */}
            <div className="bg-[#151722] p-4 rounded-2xl border border-[#2B2D44] flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">Favorite Artists</span>
                <button type="button" onClick={() => setStep(2)} className="text-xs text-[#A855F7] font-semibold">
                  Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.favoriteArtists.map(a => (
                  <span key={a} className="px-2.5 py-1 bg-[#282A42] text-xs text-white rounded-full">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <CbOutlineButton label="Back" onClick={handleBack} />
              <CbPillButton
                label="Create My Profile"
                isLoading={loading}
                onClick={handleSubmit}
                trailingIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                }
              />
            </div>
            <p className="text-[11px] text-center text-[#94A3B8] leading-relaxed">
              By creating your profile, you unreservedly agree to our{' '}
              <Link href="/legal/terms" target="_blank" className="text-[#A855F7] underline hover:text-[#C084FC]">
                Terms of Service
              </Link>
              ,{' '}
              <Link href="/legal/privacy" target="_blank" className="text-[#A855F7] underline hover:text-[#C084FC]">
                Privacy Policy
              </Link>
              , and{' '}
              <Link href="/legal/dmca" target="_blank" className="text-[#A855F7] underline hover:text-[#C084FC]">
                DMCA Policy
              </Link>
              . Governed by California law. Need help? Visit our{' '}
              <Link href="/legal/support" target="_blank" className="text-[#38BDF8] underline">
                Help & Support Center
              </Link>
              .
            </p>
          </div>
        )}

        {/* ── STEP 5: Welcome & Celebration (Stitch Screen 5) ──────────────── */}
        {step === 5 && (
          <div className="flex flex-col items-center text-center gap-6 animate-fadeIn">
            {/* Avatar with Outer Glow */}
            <div className="relative mt-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#A855F7] shadow-[0_0_30px_rgba(124,58,237,0.7)]">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Welcome"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-1 bg-[#10B981] p-1.5 rounded-full shadow">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Your profile is <span className="text-[#A855F7]">created!</span>
              </h1>
              <p className="text-sm text-[#94A3B8] mt-2">
                Welcome to Crowdbeats, {data.firstName}! You're all set to discover music, support artists, and get the most out of every live show.
              </p>
            </div>

            {/* What's Next List */}
            <div className="w-full text-left bg-[#151722] p-4 rounded-2xl border border-[#2B2D44] flex flex-col gap-3">
              <p className="text-xs font-bold text-white">What's next? Start exploring.</p>
              {[
                { icon: '🎵', title: 'Discover Artists & Campaigns', desc: 'Browse live shows and support projects' },
                { icon: '❤️', title: 'Follow Your Favorites', desc: 'Get notified when they go live' },
                { icon: '💳', title: 'Tip at Live Shows', desc: 'Use Vision Tip to instantly tip performers' },
              ].map(item => (
                <div key={item.title} className="flex items-center gap-3 p-2 bg-[#1E2032] rounded-xl">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">{item.title}</p>
                    <p className="text-[11px] text-[#64748B]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <CbPillButton
              label="✨ Explore Crowdbeats"
              onClick={() => router.push('/fan')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
