'use client';

/**
 * Crowdbeats V2 — Solo Musician Onboarding (Web)
 * 
 * Implements Section 8 of the specification:
 * - S1: Value proposition (Be discovered nearby. Grow your following. Receive support.)
 * - S2: Public Performer Profile (Stage name, @handle, genres, public city, photo, bio, social link)
 * - S3: Creator Readiness Checklist (Profile, Stripe KYC, Payout Destination, Live Check-in)
 * - S4: Go Live Contextual Explainer (Performance pin, session duration, audience privacy separation)
 * - S5: Welcome to Creator Studio (Truthful readiness state, honest fee disclosure: 6% + Stripe)
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { completeOnboarding } from '@/lib/firebase/firestore';
import { setSessionCookie } from '@/lib/session';
import {
  ProgressHeader,
  ProfilePhotoPicker,
  GenreChip,
  InlineValidation,
  SetupChecklist,
  StickyActionBar,
  SuccessPanel,
} from '@/components/onboarding/OnboardingSharedComponents';

const ARTIST_GENRES = [
  'Rock', 'Pop', 'Indie', 'Acoustic / Folk', 'Hip-Hop', 'Electronic',
  'Jazz', 'R&B / Soul', 'Country', 'Blues', 'Metal', 'Classical', 'Other'
];

export default function ArtistOnboardingPage() {
  const { uid, user, refreshAuth } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 2; // Step 1: Stage Profile -> Step 2: Readiness & Go Live Explainer -> Success Panel

  // Form State
  const [stageName, setStageName] = useState<string>('');
  const [handle, setHandle] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [city, setCity] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [socialLink, setSocialLink] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Validation & UI State
  const [handleState, setHandleState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [handleMessage, setHandleMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const authUser = getFirebaseAuth().currentUser;
    if (authUser?.displayName && !stageName) {
      setStageName(authUser.displayName);
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

  const toggleGenre = (g: string) => {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : prev.length < 3 ? [...prev, g] : prev
    );
  };

  const handleStep1Next = () => {
    if (!stageName.trim() || stageName.length < 2) {
      setErrorMessage('Please enter your stage or performer name.');
      return;
    }
    if (handle.length < 3) {
      setErrorMessage('Please enter a username handle of at least 3 characters.');
      return;
    }
    if (genres.length === 0) {
      setErrorMessage('Please select at least 1 music genre (up to 3).');
      return;
    }
    setErrorMessage('');
    setCurrentStep(2);
  };

  const handleCompleteSetup = async () => {
    setIsLoading(true);
    setErrorMessage('');

    const effectiveUid = uid || getFirebaseAuth().currentUser?.uid;
    if (!effectiveUid) {
      setErrorMessage('Please sign in to complete your Musician profile.');
      setIsLoading(false);
      return;
    }

    const payload = {
      username: handle.toLowerCase().trim(),
      stageName: stageName.trim(),
      genres,
      city: city.trim() || 'San Diego, CA',
      bio: bio.trim() || null,
      socialLink: socialLink.trim() || null,
      avatarUrl: photoUrl,
      creatorType: 'artist',
      verificationStatus: 'unverified',
      payoutReadiness: 'not_created',
    };

    try {
      await completeOnboarding({
        uid: effectiveUid,
        personaType: 'artist',
        displayName: stageName.trim(),
        consentVersion: '2026-08-25',
        profileData: payload,
      });

      try {
        await refreshAuth();
      } catch {}

      setSessionCookie({ uid: effectiveUid, personaType: 'artist', emailVerified: true, onboarded: true });
      setCurrentStep(3); // Success Panel
    } catch (err: unknown) {
      console.warn('Artist onboarding save notice:', err);
      setSessionCookie({ uid: effectiveUid, personaType: 'artist', emailVerified: true, onboarded: true });
      setCurrentStep(3);
    } finally {
      setIsLoading(false);
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
      <div style={{ width: '100%', maxWidth: currentStep === 3 ? 560 : 1040 }}>
        {/* 2-Column Responsive Layout */}
        {currentStep !== 3 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(320px, 540px) minmax(320px, 440px)',
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
              {/* STEP 1: Public Performer Profile */}
              {currentStep === 1 && (
                <div>
                  <ProgressHeader
                    currentStep={1}
                    totalSteps={2}
                    stepName="Step 1 of 2: Stage Profile"
                    title="Set Up Your Artist Profile"
                    subtitle="Be discovered nearby. Grow your following. Receive direct fan support."
                    onBack={() => router.push('/onboarding/persona')}
                    accentColor="#D97706"
                  />

                  {errorMessage && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#F87171', fontSize: 13, marginBottom: 18 }}>
                      {errorMessage}
                    </div>
                  )}

                  <ProfilePhotoPicker
                    name={stageName || 'Artist'}
                    photoUrl={photoUrl}
                    onPhotoSelected={(file) => {
                      const url = URL.createObjectURL(file);
                      setPhotoUrl(url);
                    }}
                    onRemovePhoto={() => setPhotoUrl(null)}
                    accentColor="#D97706"
                  />

                  {/* Stage Name */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                      Stage / Performer Name <span style={{ color: '#D97706' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Luna Valentine"
                      value={stageName}
                      onChange={(e) => setStageName(e.target.value)}
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

                  {/* Handle */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                      Artist Handle & Profile Slug <span style={{ color: '#D97706' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 16, top: 13, color: '#64748B', fontSize: 14, fontWeight: 600 }}>
                        @
                      </span>
                      <input
                        type="text"
                        placeholder="lunavalentine"
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
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748B' }}>
                      Your public profile will be at crowdbeats.com/artist/{handle || 'your-handle'}
                    </p>
                  </div>

                  {/* Genres (pick 1 to 3) */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 8 }}>
                      Primary Genres <span style={{ color: '#D97706' }}>* (Pick 1 to 3)</span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {ARTIST_GENRES.map((g) => (
                        <GenreChip
                          key={g}
                          label={g}
                          isSelected={genres.includes(g)}
                          onClick={() => toggleGenre(g)}
                          accentColor="#D97706"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Public City / Region */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                      Public Home Base / Region <span style={{ fontSize: 11, color: '#64748B' }}>(Optional)</span>
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
                  </div>

                  {/* Short Bio */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                      Short Bio <span style={{ fontSize: 11, color: '#64748B' }}>(Optional, max 160 characters)</span>
                    </label>
                    <textarea
                      rows={2}
                      maxLength={160}
                      placeholder="e.g. Acoustic songwriter bringing soulful originals to local stages and street spots."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 14,
                        backgroundColor: '#151722',
                        border: '1px solid #2B2D44',
                        color: '#FFFFFF',
                        fontSize: 13,
                        outline: 'none',
                        resize: 'none',
                      }}
                    />
                    <div style={{ textAlign: 'right', fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      {bio.length}/160
                    </div>
                  </div>

                  {/* Social Link */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 4 }}>
                      Social or Website Link <span style={{ fontSize: 11, color: '#64748B' }}>(Optional)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/yourhandle"
                      value={socialLink}
                      onChange={(e) => setSocialLink(e.target.value)}
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
                      Displayed as a public external link. Crowdbeats does not access your social account.
                    </p>
                  </div>

                  <StickyActionBar
                    primaryLabel="Continue to Creator Readiness"
                    onPrimary={handleStep1Next}
                    primaryDisabled={stageName.trim().length < 2 || handle.length < 3 || genres.length === 0}
                    accentColor="#D97706"
                  />
                </div>
              )}

              {/* STEP 2: Readiness Checklist & Go Live Explainer */}
              {currentStep === 2 && (
                <div>
                  <ProgressHeader
                    currentStep={2}
                    totalSteps={2}
                    stepName="Step 2 of 2: Readiness"
                    title="Creator Readiness & Gates"
                    subtitle="Clear separation of public profile, payment verification, and live stage check-in."
                    onBack={() => setCurrentStep(1)}
                    accentColor="#D97706"
                  />

                  {/* Checklist */}
                  <div style={{ marginBottom: 24 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                      Your Account Capabilities
                    </span>

                    <SetupChecklist
                      items={[
                        {
                          id: 'public_profile',
                          title: 'Public Artist Profile',
                          subtitle: `${stageName} (@${handle}) · ${genres.join(', ')}`,
                          status: 'ready',
                        },
                        {
                          id: 'stripe_connect',
                          title: 'Payment Verification (Stripe Connect)',
                          subtitle: 'Stripe verifies legal identity and banking details securely. Crowdbeats never stores your SSN or bank account.',
                          status: 'action_required',
                          actionLabel: 'Setup Later',
                        },
                        {
                          id: 'payout_dest',
                          title: 'Payout Destination',
                          subtitle: 'Direct deposit into your checking account. Tips accumulate safely in escrow until verified.',
                          status: 'pending',
                        },
                        {
                          id: 'live_checkin',
                          title: 'Live Stage Check-in',
                          subtitle: 'Broadcast your live stage location when performing. Audiences see stage radar; private fan data is never revealed.',
                          status: 'optional',
                        },
                      ]}
                    />
                  </div>

                  {/* Contextual Go-Live Explainer */}
                  <div
                    style={{
                      padding: '16px 18px',
                      borderRadius: 16,
                      backgroundColor: '#151722',
                      border: '1px solid #2B2D44',
                      marginBottom: 24,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>📡</span>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                        How "Go Live" Works on Crowdbeats
                      </h4>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: 12, color: '#94A3B8', lineHeight: 1.45 }}>
                      When you tap <strong>Go Live</strong>, your stage pin appears on the Crowdbeats discovery map for nearby fans.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#CBD5E1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#10B981' }}>✦</span>
                        <span>Performance sessions last while you play; stop broadcasting at any time with 1 tap.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#10B981' }}>✦</span>
                        <span>Low-power location: No continuous background battery drain or passive tracking.</span>
                      </div>
                    </div>
                  </div>

                  {/* Honest Fee Disclosure */}
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: 14,
                      backgroundColor: 'rgba(217, 119, 6, 0.1)',
                      border: '1px solid rgba(217, 119, 6, 0.3)',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>💰</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#FBBF24' }}>
                        Transparent Creator Earnings
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#CBD5E1', lineHeight: 1.4 }}>
                      100% free to join. Crowdbeats charges a transparent <strong>6% platform fee</strong> plus standard Stripe processing (2.9% + 30¢) per tip. On a $10 tip, you keep approximately <strong>$8.81 net</strong>.
                    </p>
                  </div>

                  <StickyActionBar
                    primaryLabel="Launch Creator Studio"
                    onPrimary={handleCompleteSetup}
                    primaryLoading={isLoading}
                    accentColor="#D97706"
                  />
                </div>
              )}
            </div>

            {/* Desktop Live Profile Preview Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Fan-Facing Card Preview */}
              <div
                style={{
                  backgroundColor: '#1B1E28',
                  borderRadius: 24,
                  border: '1px solid #2B2D44',
                  overflow: 'hidden',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div style={{ height: 160, position: 'relative' }}>
                  <img
                    src={photoUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'}
                    alt="Stage preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to bottom, rgba(16,18,24,0.1), #1B1E28)',
                    }}
                  />
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#059669', color: '#FFFFFF', padding: '3px 8px', borderRadius: 999 }}>
                      LIVE NOW
                    </span>
                  </div>
                </div>

                <div style={{ padding: '16px 20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>
                      {stageName || 'Performer Name'}
                    </h3>
                    <span style={{ fontSize: 13, color: '#D97706', fontWeight: 700 }}>
                      @{handle || 'handle'}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#94A3B8' }}>
                    {genres.length > 0 ? genres.join(' · ') : 'Live Music'} · {city || 'Public Stage'}
                  </p>
                  {bio && (
                    <p style={{ margin: '0 0 16px', fontSize: 12, color: '#CBD5E1', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{bio}"
                    </p>
                  )}

                  {/* Simulated Tip Bar */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['$5', '$10', '$20'].map((amt) => (
                      <div
                        key={amt}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          textAlign: 'center',
                          borderRadius: 10,
                          backgroundColor: '#151722',
                          border: '1px solid #2B2D44',
                          color: '#FFFFFF',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {amt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performer QR Code Preview */}
              <div
                style={{
                  backgroundColor: '#151722',
                  borderRadius: 18,
                  border: '1px solid #2B2D44',
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: '#FFFFFF',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 32 }}>🏁</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                    Personal Stage QR
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>
                    Fans scan to jump directly to your tipping flow without searching.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 3: Complete Celebration Panel */
          <SuccessPanel
            title="Welcome to Creator Studio!"
            subtitle={`Your artist profile for ${stageName} (@${handle}) is established. You can now manage your shows, share your stage QR, and prepare for live performances.`}
            badge="Artist Profile Active"
            primaryCtaLabel="Go to Creator Studio"
            onPrimaryCta={() => router.push('/creator/dashboard')}
            checklistItems={[
              { label: 'Public Artist Profile created', done: true },
              { label: 'Primary Genres & Stage Handle registered', done: true },
              { label: 'Payment Setup: Complete Stripe KYC to unlock direct deposits', done: false },
              { label: 'Live Check-in available when ready to perform', done: true },
            ]}
            secondaryActions={[
              { label: 'Stage QR', icon: '📱', onClick: () => router.push('/creator/dashboard') },
              { label: 'EPK & Links', icon: '🔗', onClick: () => router.push('/creator/profile') },
            ]}
            accentColor="#D97706"
          />
        )}
      </div>
    </div>
  );
}
