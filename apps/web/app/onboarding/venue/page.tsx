/**
 * Crowdbeats V2 — Venue Onboarding (Phase 5)
 * Route: /onboarding/venue
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { completeOnboarding } from '@/lib/firebase/firestore';
import { setSessionCookie } from '@/lib/session';
import { CbButton } from '@/components/ui/Button';
import { CbInput }  from '@/components/ui/Input';
import { OnboardingFormShell } from '../fan/page';

export default function VenueOnboardingPage() {
  const { uid, refreshAuth } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [venueName, setVenueName]     = useState('');
  const [city, setCity]               = useState('');
  const [country, setCountry]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveUid = uid || getFirebaseAuth().currentUser?.uid;
    if (!effectiveUid) {
      setError('Please sign in to complete your Venue profile.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await completeOnboarding({
        uid: effectiveUid,
        personaType: 'venue_manager',
        displayName: displayName.trim(),
        consentVersion: '2026-08-25',
        profileData: {
          venueName: venueName.trim(),
          city: city.trim(),
          country: country.trim(),
          venueRole: 'VENUE_OWNER',
        },
      });
      try {
        await refreshAuth();
      } catch {}
      setSessionCookie({ uid: effectiveUid, personaType: 'venue_manager', emailVerified: true, onboarded: true });
      router.replace('/venue/dashboard');
    } catch (err: unknown) {
      console.warn('Venue setup notice:', err);
      setSessionCookie({ uid: effectiveUid, personaType: 'venue_manager', emailVerified: true, onboarded: true });
      router.replace('/venue/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const isValid = displayName.trim().length >= 2 && venueName.trim().length >= 2 && city.trim().length >= 1;

  return (
    <OnboardingFormShell title="Set up your Venue profile" icon="🏟️" subtitle="Manage stages, host shows, and support live music in your space.">
      <form onSubmit={handleSubmit} noValidate>
        {error && <p style={{ fontSize: 13, color: 'var(--status-error)', marginBottom: 12 }} role="alert">{error}</p>}

        <CbInput
          label="Your name (venue manager)"
          placeholder="e.g. Sarah Chen"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          required
          minLength={2}
          maxLength={50}
          fullWidth
          style={{ marginBottom: 16 }}
        />
        <CbInput
          label="Venue name"
          placeholder="e.g. The Velvet Room"
          value={venueName}
          onChange={e => setVenueName(e.target.value)}
          required
          minLength={2}
          maxLength={80}
          fullWidth
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <CbInput
            label="City"
            placeholder="Auckland"
            value={city}
            onChange={e => setCity(e.target.value)}
            required
            fullWidth
          />
          <CbInput
            label="Country"
            placeholder="New Zealand"
            value={country}
            onChange={e => setCountry(e.target.value)}
            fullWidth
          />
        </div>
        <CbButton type="submit" variant="primary" size="lg" fullWidth isLoading={loading} disabled={!isValid}>
          Create Venue profile
        </CbButton>
      </form>
    </OnboardingFormShell>
  );
}
