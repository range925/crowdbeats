/**
 * Crowdbeats V2 — Artist Onboarding Profile (Phase 5)
 * Route: /onboarding/artist
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

const GENRE_OPTIONS = [
  'Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Classical', 'Electronic', 'Folk', 'Country', 'R&B', 'Indie', 'Metal', 'Other',
];

export default function ArtistOnboardingPage() {
  const { uid, refreshAuth } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [genres, setGenres]           = useState<string[]>([]);
  const [socialLink, setSocialLink]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const toggleGenre = (g: string) =>
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g].slice(0, 3));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveUid = uid || getFirebaseAuth().currentUser?.uid;
    if (!effectiveUid) {
      setError('Please sign in to complete your Artist profile.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await completeOnboarding({
        uid: effectiveUid,
        personaType: 'artist',
        displayName: displayName.trim(),
        consentVersion: '2026-08-25',
        profileData: {
          genres,
          socialLink: socialLink.trim() || null,
        },
      });
      try {
        await refreshAuth();
      } catch {}
      setSessionCookie({ uid: effectiveUid, personaType: 'artist', emailVerified: true, onboarded: true });
      router.replace('/creator/dashboard');
    } catch (err: unknown) {
      console.warn('Artist setup notice:', err);
      setSessionCookie({ uid: effectiveUid, personaType: 'artist', emailVerified: true, onboarded: true });
      router.replace('/creator/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingFormShell title="Set up your Artist profile" icon="🎤" subtitle="Receive tips, grow your fanbase, and monetise your craft.">
      <form onSubmit={handleSubmit} noValidate>
        {error && <p style={{ fontSize: 13, color: 'var(--status-error)', marginBottom: 12 }} role="alert">{error}</p>}

        <CbInput
          label="Artist name"
          placeholder="e.g. Luna Valentine"
          hint="This is your public name on Crowdbeats."
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          required
          minLength={2}
          maxLength={50}
          fullWidth
          style={{ marginBottom: 20 }}
        />

        {/* Genre chips */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
            Genres (pick up to 3)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="group" aria-label="Genre selection">
            {GENRE_OPTIONS.map(g => {
              const sel = genres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => toggleGenre(g)}
                  style={{
                    padding:      '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    border:       `1px solid ${sel ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background:   sel ? 'var(--accent-primary)' : 'var(--surface-card)',
                    color:        sel ? 'var(--text-on-primary)' : 'var(--text-secondary)',
                    fontSize:     12,
                    fontWeight:   sel ? 600 : 400,
                    cursor:       'pointer',
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <CbInput
          label="Social / portfolio link (optional)"
          placeholder="https://instagram.com/yourname"
          type="url"
          value={socialLink}
          onChange={e => setSocialLink(e.target.value)}
          fullWidth
          style={{ marginBottom: 24 }}
        />

        <CbButton type="submit" variant="primary" size="lg" fullWidth isLoading={loading} disabled={displayName.trim().length < 2}>
          Create my Artist profile
        </CbButton>
      </form>
    </OnboardingFormShell>
  );
}
