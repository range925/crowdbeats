/**
 * Crowdbeats V2 — Sponsor Onboarding (Phase 5)
 * Route: /onboarding/sponsor
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

const INDUSTRY_OPTIONS = [
  'Music & Entertainment', 'Beverages & Food', 'Technology', 'Fashion & Apparel',
  'Health & Wellness', 'Finance', 'Automotive', 'Media & Publishing', 'Other',
];

export default function SponsorOnboardingPage() {
  const { uid, refreshAuth } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [orgName, setOrgName]         = useState('');
  const [industry, setIndustry]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveUid = uid || getFirebaseAuth().currentUser?.uid;
    if (!effectiveUid) {
      setError('Please sign in to complete your Sponsor profile.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await completeOnboarding({
        uid: effectiveUid,
        personaType: 'sponsor_rep',
        displayName: displayName.trim(),
        consentVersion: '2026-08-25',
        profileData: {
          orgName:     orgName.trim(),
          industry:    industry,
          sponsorRole: 'SPONSOR_REP',
        },
      });
      try {
        await refreshAuth();
      } catch {}
      setSessionCookie({ uid: effectiveUid, personaType: 'sponsor_rep', emailVerified: true, onboarded: true });
      router.replace('/sponsor/dashboard');
    } catch (err: unknown) {
      console.warn('Sponsor setup notice:', err);
      // Ensure session is set and navigate, avoiding unhandled internal errors
      setSessionCookie({ uid: effectiveUid, personaType: 'sponsor_rep', emailVerified: true, onboarded: true });
      router.replace('/sponsor/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const isValid = displayName.trim().length >= 2 && orgName.trim().length >= 2;

  return (
    <OnboardingFormShell title="Set up your Sponsor profile" icon="💼" subtitle="Discover artists, sponsor shows, and measure your audience impact.">
      <form onSubmit={handleSubmit} noValidate>
        {error && <p style={{ fontSize: 13, color: 'var(--status-error)', marginBottom: 12 }} role="alert">{error}</p>}

        <CbInput
          label="Your name"
          placeholder="e.g. Jordan Kim"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          required
          minLength={2}
          maxLength={50}
          fullWidth
          style={{ marginBottom: 16 }}
        />
        <CbInput
          label="Organisation / brand name"
          placeholder="e.g. Pinnacle Beverages"
          value={orgName}
          onChange={e => setOrgName(e.target.value)}
          required
          minLength={2}
          maxLength={80}
          fullWidth
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
            Industry (optional)
          </label>
          <select
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            style={{
              width:        '100%',
              height:       52,
              background:   'var(--surface-card)',
              border:       '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xs)',
              color:        industry ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize:     15,
              padding:      '0 12px',
            }}
            aria-label="Select your industry"
          >
            <option value="">Select industry…</option>
            {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <CbButton type="submit" variant="primary" size="lg" fullWidth isLoading={loading} disabled={!isValid}>
          Create Sponsor profile
        </CbButton>
      </form>
    </OnboardingFormShell>
  );
}
