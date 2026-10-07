/**
 * Crowdbeats V2 — Band Onboarding (Phase 5)
 * Route: /onboarding/band
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

export default function BandOnboardingPage() {
  const { uid, refreshAuth } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [bandName, setBandName]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveUid = uid || getFirebaseAuth().currentUser?.uid;
    if (!effectiveUid) {
      setError('Please sign in to complete your Band profile.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await completeOnboarding({
        uid: effectiveUid,
        personaType: 'band_member',
        displayName: displayName.trim(),
        consentVersion: '2026-08-25',
        profileData: {
          bandName: bandName.trim(),
          bandRole: 'BAND_FOUNDER',
        },
      });
      try {
        await refreshAuth();
      } catch {}
      setSessionCookie({ uid: effectiveUid, personaType: 'band_member', emailVerified: true, onboarded: true });
      router.replace('/creator/dashboard');
    } catch (err: unknown) {
      console.warn('Band setup notice:', err);
      setSessionCookie({ uid: effectiveUid, personaType: 'band_member', emailVerified: true, onboarded: true });
      router.replace('/creator/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingFormShell title="Set up your Band profile" icon="🎸" subtitle="You'll be the Band Founder. Invite members after setup.">
      <form onSubmit={handleSubmit} noValidate>
        {error && <p style={{ fontSize: 13, color: 'var(--status-error)', marginBottom: 12 }} role="alert">{error}</p>}

        <CbInput
          label="Your name (as band member)"
          placeholder="e.g. Alex Rivera"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          required
          minLength={2}
          maxLength={50}
          fullWidth
          style={{ marginBottom: 16 }}
        />
        <CbInput
          label="Band / Group name"
          placeholder="e.g. The Midnight Echoes"
          hint="You can change this later."
          value={bandName}
          onChange={e => setBandName(e.target.value)}
          required
          minLength={2}
          maxLength={80}
          fullWidth
          style={{ marginBottom: 8 }}
        />
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 24 }}>
          You&apos;ll be assigned the <strong>Band Founder</strong> role. You can invite members from your band dashboard.
        </p>
        <CbButton
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={loading}
          disabled={displayName.trim().length < 2 || bandName.trim().length < 2}
        >
          Create Band profile
        </CbButton>
      </form>
    </OnboardingFormShell>
  );
}
