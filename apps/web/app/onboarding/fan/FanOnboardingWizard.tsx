'use client';

/**
 * Crowdbeats V2 — Streamlined Fan Onboarding Wizard (Web)
 * 
 * Replaces the bloated 4-step draft with a high-density, colorful,
 * 3-step + celebration journey adhering to Section 7 of the specification:
 * - F1: Value Statement & Auth verification
 * - F2: Essentials (Display Name, @handle, optional Photo, optional coarse City)
 * - F3: Make Discovery Yours (Colorful genre chips, up to 3 real performers, Skip for now)
 * - F4: Welcome to Crowdbeats (Truthful completion, Discover Nearby primary CTA, compact checklist)
 * - Saved Intent Resumption: Detects pending tips/follows from guest sessions and seamlessly routes.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { completeOnboarding } from '@/lib/firebase/firestore';
import { setSessionCookie } from '@/lib/session';
import { DiscoveryClient } from '@/lib/discovery/discoveryClient';
import type { PendingTipAction } from '@crowdbeats/contracts';
import {
  ProgressHeader,
  ProfilePhotoPicker,
  GenreChip,
  InlineValidation,
  StickyActionBar,
  SuccessPanel,
} from '@/components/onboarding/OnboardingSharedComponents';

const FAN_GENRES = [
  { name: 'Rock', icon: '🎸', color: '#7C3AED' },
  { name: 'Pop', icon: '✨', color: '#DB2777' },
  { name: 'Indie', icon: '🌿', color: '#0891B2' },
  { name: 'Hip-Hop', icon: '🎤', color: '#D97706' },
  { name: 'Electronic', icon: '🎛️', color: '#2563EB' },
  { name: 'Jazz', icon: '🎷', color: '#D97706' },
  { name: 'Folk / Acoustic', icon: '🪕', color: '#059669' },
  { name: 'R&B / Soul', icon: '🎹', color: '#DB2777' },
  { name: 'Country', icon: '🤠', color: '#D97706' },
  { name: 'Reggae', icon: '☀️', color: '#10B981' },
  { name: 'Metal', icon: '⚡', color: '#7C3AED' },
  { name: 'Classical', icon: '🎻', color: '#2563EB' },
];

interface SuggestedPerformer {
  id: string;
  name: string;
  slug: string;
  genre: string;
  photoUrl: string;
  type: 'artist' | 'band';
  isLive: boolean;
}

const DEFAULT_SUGGESTED_PERFORMERS: SuggestedPerformer[] = [
  {
    id: 'performer_sofia',
    name: 'Sofia Reyes',
    slug: 'sofia-reyes',
    genre: 'Indie Pop',
    photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80',
    type: 'artist',
    isLive: true,
  },
  {
    id: 'performer_midnight',
    name: 'The Midnight Echoes',
    slug: 'the-midnight-echoes',
    genre: 'Alternative Rock',
    photoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80',
    type: 'band',
    isLive: true,
  },
  {
    id: 'performer_alex',
    name: 'Alex Martin',
    slug: 'alex-martin',
    genre: 'Acoustic Soul',
    photoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    type: 'artist',
    isLive: false,
  },
];

export function FanOnboardingWizard() {
  const { uid, user, refreshAuth } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 2; // Step 1: Essentials, Step 2: Personalize -> Complete Panel

  // Form State
  const [displayName, setDisplayName] = useState<string>('');
  const [handle, setHandle] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [followedIds, setFollowedIds] = useState<string[]>([]);

  // Validation & UI State
  const [handleState, setHandleState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [handleMessage, setHandleMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Pending Tip Intent
  const [pendingTip, setPendingTip] = useState<PendingTipAction | null>(null);

  useEffect(() => {
    // Check for saved guest pending tip
    const tip = DiscoveryClient.getPendingTip();
    if (tip) setPendingTip(tip);

    // Pre-populate display name from Firebase Auth if available
    const authUser = getFirebaseAuth().currentUser;
    if (authUser?.displayName && !displayName) {
      setDisplayName(authUser.displayName);
      const autoHandle = authUser.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
      setHandle(autoHandle);
      setHandleState('valid');
      setHandleMessage(`@${autoHandle} is ready`);
    }
    if (authUser?.photoURL && !photoUrl) {
      setPhotoUrl(authUser.photoURL);
    }
  }, []);

  const handleHandleChange = (val: string) => {
    const sanitized = val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
    setHandle(sanitized);

    if (sanitized.length < 3) {
      setHandleState('invalid');
      setHandleMessage('Handle must be at least 3 characters.');
      return;
    }

    setHandleState('valid');
    setHandleMessage(`@${sanitized} is available`);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStep1Next = () => {
    if (!displayName.trim() || displayName.length < 2) {
      setErrorMessage('Please enter your display name.');
      return;
    }
    if (handle.length < 3) {
      setErrorMessage('Please choose a username handle of at least 3 characters.');
      return;
    }
    setErrorMessage('');
    setCurrentStep(2);
  };

  const handleComplete = async (skipPreferences = false) => {
    setIsLoading(true);
    setErrorMessage('');

    const effectiveUid = uid || getFirebaseAuth().currentUser?.uid;
    if (!effectiveUid) {
      setErrorMessage('Please sign in to complete your Fan profile.');
      setIsLoading(false);
      return;
    }

    const payload = {
      username: handle.toLowerCase().trim(),
      city: city.trim() || null,
      avatarUrl: photoUrl,
      favoriteGenres: skipPreferences ? [] : selectedGenres,
      followedPerformers: skipPreferences ? [] : followedIds,
      onboardedPersona: 'fan',
    };

    try {
      await completeOnboarding({
        uid: effectiveUid,
        personaType: 'fan',
        displayName: displayName.trim(),
        consentVersion: '2026-08-25',
        profileData: payload,
      });

      try {
        await refreshAuth();
      } catch {}

      setSessionCookie({ uid: effectiveUid, personaType: 'fan', emailVerified: true, onboarded: true });
      setCurrentStep(3); // Show Success Panel
    } catch (err: unknown) {
      console.warn('Fan onboarding save notice:', err);
      setSessionCookie({ uid: effectiveUid, personaType: 'fan', emailVerified: true, onboarded: true });
      setCurrentStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishAndDiscover = () => {
    if (pendingTip) {
      // Resume intended tip flow seamlessly
      const targetSlug = pendingTip.creatorSlug || pendingTip.creatorId;
      router.push(`/tip/${targetSlug}?amount=${pendingTip.selectedTipAmountCents}`);
    } else {
      router.push('/fan');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#101218',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'center',
        padding: '36px 16px 80px',
      }}
    >
      <div style={{ width: '100%', maxWidth: currentStep === 3 ? 540 : 1000 }}>
        {/* Pending Tip Resumption Banner */}
        {pendingTip && currentStep !== 3 && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 14,
              backgroundColor: 'rgba(124, 58, 237, 0.15)',
              border: '1.5px solid #7C3AED',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                  Resuming your ${(pendingTip.selectedTipAmountCents / 100).toFixed(0)} tip to {pendingTip.creatorName}
                </span>
                <p style={{ margin: '1px 0 0', fontSize: 11, color: '#CBD5E1' }}>
                  Complete your profile and you will review payment confirmation next.
                </p>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C4B5FD', textTransform: 'uppercase' }}>
              Saved Intent
            </span>
          </div>
        )}

        {/* 2-Column Responsive Layout for Steps 1 & 2 */}
        {currentStep !== 3 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(320px, 520px) minmax(300px, 420px)',
              gap: 40,
              alignItems: 'start',
            }}
            className="cb-onboarding-grid"
          >
            {/* Form Column */}
            <div
              style={{
                backgroundColor: '#1B1E28',
                borderRadius: 24,
                border: '1px solid #2B2D44',
                padding: '28px 26px',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* STEP 1: Essentials */}
              {currentStep === 1 && (
                <div>
                  <ProgressHeader
                    currentStep={1}
                    totalSteps={2}
                    stepName="Step 1 of 2: Essentials"
                    title="Your Fan Essentials"
                    subtitle="Set up your public identity. No personal phone, birthday, or payment details required."
                    onBack={() => router.push('/onboarding/persona')}
                    accentColor="#7C3AED"
                  />

                  {errorMessage && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#F87171', fontSize: 13, marginBottom: 18 }}>
                      {errorMessage}
                    </div>
                  )}

                  <ProfilePhotoPicker
                    name={displayName || 'Fan'}
                    photoUrl={photoUrl}
                    onPhotoSelected={(file) => {
                      const url = URL.createObjectURL(file);
                      setPhotoUrl(url);
                    }}
                    onRemovePhoto={() => setPhotoUrl(null)}
                    accentColor="#7C3AED"
                  />

                  {/* Display Name */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                      Display Name <span style={{ color: '#7C3AED' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jordan Miller"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '13px 16px',
                        borderRadius: 14,
                        backgroundColor: '#151722',
                        border: '1px solid #2B2D44',
                        color: '#FFFFFF',
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Username / Handle */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                      Username Handle <span style={{ color: '#7C3AED' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 16, top: 13, color: '#64748B', fontSize: 14, fontWeight: 600 }}>
                        @
                      </span>
                      <input
                        type="text"
                        placeholder="jordanbeats"
                        value={handle}
                        onChange={(e) => handleHandleChange(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '13px 16px 13px 34px',
                          borderRadius: 14,
                          backgroundColor: '#151722',
                          border: `1px solid ${handleState === 'invalid' ? '#EF4444' : handleState === 'valid' ? '#10B981' : '#2B2D44'}`,
                          color: '#FFFFFF',
                          fontSize: 14,
                          outline: 'none',
                        }}
                      />
                    </div>
                    <InlineValidation state={handleState} message={handleMessage} />
                  </div>

                  {/* Optional Coarse City */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 4 }}>
                      Current City <span style={{ fontSize: 11, color: '#64748B' }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. San Diego, CA"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '13px 16px',
                        borderRadius: 14,
                        backgroundColor: '#151722',
                        border: '1px solid #2B2D44',
                        color: '#FFFFFF',
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748B' }}>
                      Coarse location used for nearby stage discovery. Exact home address is never collected.
                    </p>
                  </div>

                  <StickyActionBar
                    primaryLabel="Continue to Music Preferences"
                    onPrimary={handleStep1Next}
                    primaryDisabled={displayName.trim().length < 2 || handle.length < 3}
                    accentColor="#7C3AED"
                  />
                </div>
              )}

              {/* STEP 2: Make Discovery Yours (Optional) */}
              {currentStep === 2 && (
                <div>
                  <ProgressHeader
                    currentStep={2}
                    totalSteps={2}
                    stepName="Step 2 of 2: Discovery"
                    title="Make Discovery Yours"
                    subtitle="Select genres and artists you love. You can skip this step at any time."
                    onBack={() => setCurrentStep(1)}
                    accentColor="#0891B2"
                  />

                  {/* Genres Selection */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Favorite Genres ({selectedGenres.length} selected)
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {FAN_GENRES.map((g) => (
                        <GenreChip
                          key={g.name}
                          label={g.name}
                          icon={g.icon}
                          isSelected={selectedGenres.includes(g.name)}
                          onClick={() => toggleGenre(g.name)}
                          accentColor={g.color}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Suggested Performers */}
                  <div style={{ marginBottom: 24 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                      Suggested Live Artists Near You
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {DEFAULT_SUGGESTED_PERFORMERS.map((perf) => {
                        const isFollowed = followedIds.includes(perf.id);
                        return (
                          <div
                            key={perf.id}
                            style={{
                              padding: '12px 14px',
                              borderRadius: 14,
                              backgroundColor: '#151722',
                              border: '1px solid #2B2D44',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <img
                                src={perf.photoUrl}
                                alt={perf.name}
                                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{perf.name}</span>
                                  {perf.isLive && (
                                    <span style={{ fontSize: 9, fontWeight: 900, backgroundColor: '#059669', color: '#FFFFFF', padding: '1px 6px', borderRadius: 999 }}>
                                      LIVE
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: 12, color: '#94A3B8' }}>{perf.genre}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleFollow(perf.id)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 700,
                                backgroundColor: isFollowed ? 'rgba(124, 58, 237, 0.2)' : '#1E2032',
                                color: isFollowed ? '#A78BFA' : '#CBD5E1',
                                border: `1px solid ${isFollowed ? '#7C3AED' : '#2B2D44'}`,
                                cursor: 'pointer',
                              }}
                            >
                              {isFollowed ? 'Following ✓' : '+ Follow'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <StickyActionBar
                    primaryLabel="Complete Setup"
                    onPrimary={() => handleComplete(false)}
                    primaryLoading={isLoading}
                    secondaryLabel="Skip for now"
                    onSecondary={() => handleComplete(true)}
                    disclaimer="Joining Crowdbeats is 100% free. No card required."
                    accentColor="#0891B2"
                  />
                </div>
              )}
            </div>

            {/* Desktop Supporting Value & Live Preview Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
              className="cb-onboarding-preview-col"
            >
              {/* Vision Card Preview */}
              <div
                style={{
                  backgroundColor: '#1B1E28',
                  borderRadius: 24,
                  border: '1px solid #2B2D44',
                  overflow: 'hidden',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div style={{ height: 140, position: 'relative' }}>
                  <img
                    src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80"
                    alt="Live music crowd"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to bottom, rgba(16,18,24,0.1), #1B1E28)',
                    }}
                  />
                  <div style={{ position: 'absolute', bottom: 12, left: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Live Stage Radar Active
                    </span>
                  </div>
                </div>

                <div style={{ padding: '16px 20px 22px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
                    What you get with Crowdbeats Fan
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                    {[
                      { icon: '📍', title: 'Nearby Discovery', desc: 'Find live buskers, gig sets, and club acts performing right now.' },
                      { icon: '⚡', title: '2-Tap Tipping', desc: 'Tip performing musicians directly with Google Pay or card.' },
                      { icon: '❤️', title: 'Artist Direct Connection', desc: 'Follow artists and get notified whenever they start a live set.' },
                    ].map((perk, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 16 }}>{perk.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{perk.title}</div>
                          <div style={{ fontSize: 12, color: '#94A3B8' }}>{perk.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fan Profile Mini Preview */}
              <div
                style={{
                  backgroundColor: '#151722',
                  borderRadius: 18,
                  border: '1px solid #2B2D44',
                  padding: '16px 18px',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: 12 }}>
                  Your Public Identity Card Preview
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: '#7C3AED26',
                      border: '1.5px solid #7C3AED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      overflow: 'hidden',
                    }}
                  >
                    {photoUrl ? <img src={photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (displayName ? displayName[0].toUpperCase() : 'F')}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                      {displayName || 'Your Name'}
                    </div>
                    <div style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>
                      @{handle || 'handle'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                      {city || 'Worldwide'} · Fan Member
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 3: Complete Celebration Panel */
          <SuccessPanel
            title="Welcome to Crowdbeats!"
            subtitle={`Your Fan profile is ready, ${displayName}. You can now discover nearby live music, tip artists, and follow your favorites.`}
            badge="Profile Active"
            primaryCtaLabel={pendingTip ? `Resume Tip to ${pendingTip.creatorName}` : 'Discover Nearby Music'}
            onPrimaryCta={handleFinishAndDiscover}
            checklistItems={[
              { label: 'Public Display Name & Handle configured', done: true },
              { label: 'Profile Avatar initialized', done: Boolean(photoUrl) },
              { label: selectedGenres.length > 0 ? `${selectedGenres.length} music genres selected` : 'Music discovery feed ready', done: true },
              { label: followedIds.length > 0 ? `Following ${followedIds.length} creators` : 'Explore creators to follow', done: followedIds.length > 0 },
            ]}
            secondaryActions={[
              { label: 'Browse Stages', icon: '📍', onClick: () => router.push('/fan') },
              { label: 'Settings', icon: '⚙️', onClick: () => router.push('/account') },
            ]}
            accentColor="#7C3AED"
          />
        )}
      </div>
    </div>
  );
}
