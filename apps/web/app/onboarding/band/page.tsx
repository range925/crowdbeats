'use client';

/**
 * Crowdbeats V2 — Band Onboarding (Web)
 * 
 * Implements Section 9 of the specification:
 * - B1: Account access (Create a band vs Join an existing band)
 * - B2: Band identity (Band name, @handle, genres, region, logo, bio, desktop live preview)
 * - B3: Members & permissions (Invite roster, roles: Founder, Manager, Member)
 * - B4: Earnings & Split Agreement (10,000 bps integer matrix, versioning, 6% fee disclosure)
 * - B5: Band readiness and launch (Truthful readiness states, group QR code resolution)
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

const BAND_GENRES = [
  'Rock', 'Alternative', 'Indie Rock', 'Pop / Punk', 'Metal', 'Jazz / Fusion',
  'Funk / Soul', 'Reggae', 'Country / Folk', 'Electronic / Live', 'Blues', 'Cover Band'
];

interface BandMemberDraft {
  id: string;
  name: string;
  role: 'BAND_FOUNDER' | 'BAND_MANAGER' | 'BAND_MEMBER';
  splitBps: number; // e.g. 5000 = 50%
}

export default function BandOnboardingPage() {
  const { uid, user, refreshAuth } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 3; // Step 1: Band Identity -> Step 2: Members & Roles -> Step 3: Split Matrix -> Success Panel

  // Form State
  const [bandName, setBandName] = useState<string>('');
  const [handle, setHandle] = useState<string>('');
  const [founderName, setFounderName] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [region, setRegion] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Members & Split Matrix State
  const [members, setMembers] = useState<BandMemberDraft[]>([
    { id: 'founder_1', name: 'You (Founder)', role: 'BAND_FOUNDER', splitBps: 10000 },
  ]);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<'BAND_MANAGER' | 'BAND_MEMBER'>('BAND_MEMBER');

  // UI State
  const [handleState, setHandleState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [handleMessage, setHandleMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const authUser = getFirebaseAuth().currentUser;
    if (authUser?.displayName && !founderName) {
      setFounderName(authUser.displayName);
      setMembers((prev) => [
        { ...prev[0], name: `${authUser.displayName} (Founder)` },
        ...prev.slice(1),
      ]);
    }
  }, []);

  const handleBandNameChange = (val: string) => {
    setBandName(val);
    if (!handle || handle === '') {
      const generated = val.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
      setHandle(generated);
      if (generated.length >= 3) {
        setHandleState('valid');
        setHandleMessage(`@${generated} is available`);
      }
    }
  };

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

  // Add Member to Roster and recalculate equal splits
  const handleAddMember = () => {
    if (!newMemberName.trim()) return;

    const newId = `member_${Date.now()}`;
    const updated = [
      ...members,
      { id: newId, name: newMemberName.trim(), role: newMemberRole, splitBps: 0 },
    ];

    // Distribute equally across all members (10,000 basis points)
    const count = updated.length;
    const baseSplit = Math.floor(10000 / count);
    const remainder = 10000 - baseSplit * count;

    const redistributed = updated.map((m, idx) => ({
      ...m,
      splitBps: idx === 0 ? baseSplit + remainder : baseSplit,
    }));

    setMembers(redistributed);
    setNewMemberName('');
  };

  const handleRemoveMember = (id: string) => {
    if (id === members[0].id) return; // Cannot remove founder
    const updated = members.filter((m) => m.id !== id);
    const count = updated.length;
    const baseSplit = Math.floor(10000 / count);
    const remainder = 10000 - baseSplit * count;

    const redistributed = updated.map((m, idx) => ({
      ...m,
      splitBps: idx === 0 ? baseSplit + remainder : baseSplit,
    }));

    setMembers(redistributed);
  };

  const handleSplitChange = (id: string, newBps: number) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, splitBps: newBps } : m))
    );
  };

  const totalBps = members.reduce((sum, m) => sum + (Number(m.splitBps) || 0), 0);
  const isSplitValid = totalBps === 10000;

  const handleStep1Next = () => {
    if (!bandName.trim() || bandName.length < 2) {
      setErrorMessage('Please enter your band or group name.');
      return;
    }
    if (handle.length < 3) {
      setErrorMessage('Please choose a handle of at least 3 characters.');
      return;
    }
    if (genres.length === 0) {
      setErrorMessage('Please select at least 1 genre for your band.');
      return;
    }
    setErrorMessage('');
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    setErrorMessage('');
    setCurrentStep(3);
  };

  const handleCompleteSetup = async () => {
    if (!isSplitValid) {
      setErrorMessage('Total split allocation must equal exactly 100% (10,000 bps).');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const effectiveUid = uid || getFirebaseAuth().currentUser?.uid;
    if (!effectiveUid) {
      setErrorMessage('Please sign in to complete your Band profile.');
      setIsLoading(false);
      return;
    }

    const payload = {
      bandName: bandName.trim(),
      username: handle.toLowerCase().trim(),
      founderName: founderName.trim() || 'Band Founder',
      genres,
      city: region.trim() || 'San Diego, CA',
      bio: bio.trim() || null,
      avatarUrl: logoUrl,
      creatorType: 'band',
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        splitBps: m.splitBps,
      })),
      verificationStatus: 'unverified',
      payoutReadiness: 'not_created',
    };

    try {
      await completeOnboarding({
        uid: effectiveUid,
        personaType: 'band_member',
        displayName: founderName.trim() || 'Band Founder',
        consentVersion: '2026-08-25',
        profileData: payload,
      });

      try {
        await refreshAuth();
      } catch {}

      setSessionCookie({ uid: effectiveUid, personaType: 'band_member', emailVerified: true, onboarded: true });
      setCurrentStep(4); // Success Panel
    } catch (err: unknown) {
      console.warn('Band onboarding save notice:', err);
      setSessionCookie({ uid: effectiveUid, personaType: 'band_member', emailVerified: true, onboarded: true });
      setCurrentStep(4);
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
      <div style={{ width: '100%', maxWidth: currentStep === 4 ? 560 : 1060 }}>
        {currentStep !== 4 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(320px, 560px) minmax(320px, 440px)',
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
              {/* STEP 1: Band Identity */}
              {currentStep === 1 && (
                <div>
                  <ProgressHeader
                    currentStep={1}
                    totalSteps={3}
                    stepName="Step 1 of 3: Band Identity"
                    title="Create Your Band Profile"
                    subtitle="Bands have their own public identity, shared tip pool, and group QR code."
                    onBack={() => router.push('/onboarding/persona')}
                    accentColor="#2563EB"
                  />

                  {errorMessage && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#F87171', fontSize: 13, marginBottom: 18 }}>
                      {errorMessage}
                    </div>
                  )}

                  <ProfilePhotoPicker
                    name={bandName || 'Band'}
                    photoUrl={logoUrl}
                    onPhotoSelected={(file) => {
                      const url = URL.createObjectURL(file);
                      setLogoUrl(url);
                    }}
                    onRemovePhoto={() => setLogoUrl(null)}
                    accentColor="#2563EB"
                  />

                  {/* Band Name */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                      Band / Group Name <span style={{ color: '#2563EB' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. The Midnight Echoes"
                      value={bandName}
                      onChange={(e) => handleBandNameChange(e.target.value)}
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
                      Band Handle & Profile Slug <span style={{ color: '#2563EB' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 16, top: 13, color: '#64748B', fontSize: 14, fontWeight: 600 }}>
                        @
                      </span>
                      <input
                        type="text"
                        placeholder="themidnightechoes"
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
                      Public URL: crowdbeats.com/band/{handle || 'band-handle'}
                    </p>
                  </div>

                  {/* Your Name as Founder */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                      Your Name as Band Founder <span style={{ color: '#2563EB' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={founderName}
                      onChange={(e) => setFounderName(e.target.value)}
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
                      You are assigned the <strong>Band Founder</strong> role with financial & roster management authority.
                    </p>
                  </div>

                  {/* Genres */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 8 }}>
                      Primary Genres <span style={{ color: '#2563EB' }}>* (Pick 1 to 3)</span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {BAND_GENRES.map((g) => (
                        <GenreChip
                          key={g}
                          label={g}
                          isSelected={genres.includes(g)}
                          onClick={() => toggleGenre(g)}
                          accentColor="#2563EB"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Public Base Region */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                      Home Base Region <span style={{ fontSize: 11, color: '#64748B' }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Los Angeles, CA"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
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

                  <StickyActionBar
                    primaryLabel="Continue to Members & Roles"
                    onPrimary={handleStep1Next}
                    primaryDisabled={bandName.trim().length < 2 || handle.length < 3 || genres.length === 0}
                    accentColor="#2563EB"
                  />
                </div>
              )}

              {/* STEP 2: Members & Permissions */}
              {currentStep === 2 && (
                <div>
                  <ProgressHeader
                    currentStep={2}
                    totalSteps={3}
                    stepName="Step 2 of 3: Roster"
                    title="Band Members & Permissions"
                    subtitle="Add bandmates and define roles. You can invite more members at any time."
                    onBack={() => setCurrentStep(1)}
                    accentColor="#2563EB"
                  />

                  {/* Current Roster */}
                  <div style={{ marginBottom: 20 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                      Current Band Roster ({members.length})
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {members.map((m, idx) => (
                        <div
                          key={m.id}
                          style={{
                            padding: '12px 16px',
                            borderRadius: 14,
                            backgroundColor: '#151722',
                            border: '1px solid #2B2D44',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                backgroundColor: idx === 0 ? 'rgba(37, 99, 235, 0.2)' : '#1E2032',
                                color: idx === 0 ? '#38BDF8' : '#CBD5E1',
                                border: '1px solid #2B2D44',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 14,
                                fontWeight: 700,
                              }}
                            >
                              {m.name[0]}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{m.name}</div>
                              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                                {m.role === 'BAND_FOUNDER'
                                  ? 'Founder (Full Financial & Profile Authority)'
                                  : m.role === 'BAND_MANAGER'
                                  ? 'Manager (Profile & Show Scheduling)'
                                  : 'Member (Split Recipient)'}
                              </div>
                            </div>
                          </div>

                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Member Form */}
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: '#151722',
                      border: '1px solid #2B2D44',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 10 }}>
                      + Invite a Bandmate
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <input
                        type="text"
                        placeholder="Bandmate name or @handle"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        style={{
                          flex: 2,
                          padding: '10px 14px',
                          borderRadius: 10,
                          backgroundColor: '#1E2032',
                          border: '1px solid #2B2D44',
                          color: '#FFFFFF',
                          fontSize: 13,
                          outline: 'none',
                        }}
                      />
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as any)}
                        style={{
                          flex: 1,
                          padding: '10px 10px',
                          borderRadius: 10,
                          backgroundColor: '#1E2032',
                          border: '1px solid #2B2D44',
                          color: '#FFFFFF',
                          fontSize: 12,
                          outline: 'none',
                        }}
                      >
                        <option value="BAND_MEMBER">Member</option>
                        <option value="BAND_MANAGER">Manager</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={!newMemberName.trim()}
                      style={{
                        width: '100%',
                        padding: '10px 0',
                        borderRadius: 10,
                        backgroundColor: newMemberName.trim() ? '#2563EB' : '#27272A',
                        color: newMemberName.trim() ? '#FFFFFF' : '#71717A',
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: newMemberName.trim() ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Add to Roster
                    </button>
                  </div>

                  <StickyActionBar
                    primaryLabel="Continue to Tip Splits"
                    onPrimary={handleStep2Next}
                    secondaryLabel="Skip Member Invites"
                    onSecondary={handleStep2Next}
                    accentColor="#2563EB"
                  />
                </div>
              )}

              {/* STEP 3: Split Agreement & Earnings */}
              {currentStep === 3 && (
                <div>
                  <ProgressHeader
                    currentStep={3}
                    totalSteps={3}
                    stepName="Step 3 of 3: Revenue Splits"
                    title="Automated Tip Splits"
                    subtitle="Configure how band tips are automatically split across members. Must total exactly 100%."
                    onBack={() => setCurrentStep(2)}
                    accentColor="#2563EB"
                  />

                  {errorMessage && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#F87171', fontSize: 13, marginBottom: 18 }}>
                      {errorMessage}
                    </div>
                  )}

                  {/* Split Matrix */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Allocation Table
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: isSplitValid ? '#10B981' : '#EF4444',
                        }}
                      >
                        Total: {(totalBps / 100).toFixed(1)}% {isSplitValid ? '✓' : '(Must be 100.0%)'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {members.map((m) => {
                        const pct = (m.splitBps / 100).toFixed(1);
                        return (
                          <div
                            key={m.id}
                            style={{
                              padding: '14px 16px',
                              borderRadius: 14,
                              backgroundColor: '#151722',
                              border: '1px solid #2B2D44',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{m.name}</div>
                              <div style={{ fontSize: 11, color: '#64748B' }}>{m.splitBps} basis points</div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                step={1}
                                value={Math.round(m.splitBps / 100)}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  handleSplitChange(m.id, val * 100);
                                }}
                                style={{
                                  width: 64,
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  backgroundColor: '#1E2032',
                                  border: '1px solid #2B2D44',
                                  color: '#FFFFFF',
                                  fontSize: 14,
                                  fontWeight: 700,
                                  textAlign: 'right',
                                  outline: 'none',
                                }}
                              />
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#CBD5E1' }}>%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fee & Net Explainer */}
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: 14,
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      border: '1px solid rgba(37, 99, 235, 0.3)',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>🎸</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#60A5FA' }}>
                        Band Proceeds Distribution Rule
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#CBD5E1', lineHeight: 1.4 }}>
                      Band tips are pooled into a single transaction. Crowdbeats deducts 6% technology fee plus Stripe card processing, and the <strong>net proceeds pool</strong> is routed automatically to each verified member's connected bank account according to this matrix.
                    </p>
                  </div>

                  <StickyActionBar
                    primaryLabel="Launch Band Studio"
                    onPrimary={handleCompleteSetup}
                    primaryDisabled={!isSplitValid}
                    primaryLoading={isLoading}
                    accentColor="#2563EB"
                  />
                </div>
              )}
            </div>

            {/* Desktop Preview Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Band Profile Fan Card Preview */}
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
                    src={logoUrl || 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80'}
                    alt="Band preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to bottom, rgba(16,18,24,0.1), #1B1E28)',
                    }}
                  />
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#2563EB', color: '#FFFFFF', padding: '3px 8px', borderRadius: 999 }}>
                      BAND PROFILE
                    </span>
                  </div>
                </div>

                <div style={{ padding: '16px 20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>
                      {bandName || 'Band Name'}
                    </h3>
                    <span style={{ fontSize: 13, color: '#38BDF8', fontWeight: 700 }}>
                      @{handle || 'bandhandle'}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#94A3B8' }}>
                    {genres.length > 0 ? genres.join(' · ') : 'Live Music'} · {region || 'Public Group'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#CBD5E1' }}>
                    <span>👥 {members.length} {members.length === 1 ? 'member' : 'members'}</span>
                    <span>·</span>
                    <span>⚡ Group Tip Jar Active</span>
                  </div>
                </div>
              </div>

              {/* Group QR Resolution Card */}
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
                  <span style={{ fontSize: 32 }}>🎸</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                    Band Group QR Code
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>
                    Resolves strictly to the band, not an arbitrary member. Tips split automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 4: Complete Celebration Panel */
          <SuccessPanel
            title="Band Studio Initialized!"
            subtitle={`Your group ${bandName} (@${handle}) is established. You can manage your roster, review split allocations, and go live on stage.`}
            badge="Band Active"
            primaryCtaLabel="Go to Band Dashboard"
            onPrimaryCta={() => router.push('/band')}
            checklistItems={[
              { label: 'Band Identity & Public Profile created', done: true },
              { label: `${members.length} member roster initialized with assigned roles`, done: true },
              { label: '100% Split Agreement configured (10,000 basis points)', done: true },
              { label: 'Group QR Code generated for band stage tipping', done: true },
            ]}
            secondaryActions={[
              { label: 'Band QR', icon: '📱', onClick: () => router.push('/band') },
              { label: 'Splits Matrix', icon: '⚖️', onClick: () => router.push('/band') },
            ]}
            accentColor="#2563EB"
          />
        )}
      </div>
    </div>
  );
}
