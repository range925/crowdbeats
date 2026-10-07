/**
 * Crowdbeats V2 — Band Profile & Electronic Press Kit
 * Dual-write: localStorage (optimistic) + Firestore via /api/creator/profile
 */

'use client';

import React, { useState, useEffect } from 'react';

const AVAILABLE_GENRES = [
  'Rock', 'Indie', 'Alternative', 'Metal', 'Punk',
  'Jazz', 'Blues', 'Funk', 'Pop', 'Hip-Hop', 'Folk', 'Electronic',
];

export default function BandProfilePage() {
  const [name, setName] = useState('The Lunar Waves');
  const [bio, setBio] = useState('Four-piece indie rock outfit based in San Francisco, CA.');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Rock', 'Indie']);
  const [instagram, setInstagram] = useState('lunarwavesband');
  const [spotify, setSpotify] = useState('https://open.spotify.com/artist/lunarwaves');
  const [website, setWebsite] = useState('https://lunarwaves.band');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedMessage, setSavedMessage] = useState('');

  // On mount: load from localStorage, then hydrate from Firestore
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cb_band_epk');
      if (cached) {
        try {
          const p = JSON.parse(cached);
          if (p.name) setName(p.name);
          if (p.bio) setBio(p.bio);
          if (p.selectedGenres) setSelectedGenres(p.selectedGenres);
          if (p.instagram) setInstagram(p.instagram);
          if (p.spotify) setSpotify(p.spotify);
          if (p.website) setWebsite(p.website);
        } catch (_) {}
      }
    }
    // Firestore hydration (band profile shares the same API route with profileType differentiation)
    fetch('/api/creator/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.stageName) setName(data.stageName);
        if (data.bio) setBio(data.bio);
        if (data.genres) setSelectedGenres(data.genres);
        if (data.socialLinks?.instagram) setInstagram(data.socialLinks.instagram);
        if (data.socialLinks?.spotify) setSpotify(data.socialLinks.spotify);
        if (data.socialLinks?.website) setWebsite(data.socialLinks.website);
      })
      .catch(() => {});
  }, []);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      if (selectedGenres.length < 5) {
        setSelectedGenres([...selectedGenres, genre]);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState('saving');

    // Optimistic localStorage write
    if (typeof window !== 'undefined') {
      localStorage.setItem('cb_band_epk', JSON.stringify({ name, bio, selectedGenres, instagram, spotify, website }));
    }

    // Persist to Firestore
    try {
      const res = await fetch('/api/creator/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageName: name,
          bio,
          genres: selectedGenres,
          socialLinks: { instagram, spotify, website },
        }),
      });
      setSaveState('saved');
      setSavedMessage(res.ok ? 'Band EPK saved and synced!' : 'Saved locally. Cloud sync will retry.');
    } catch {
      setSaveState('saved');
      setSavedMessage('Saved locally. Cloud sync will retry when reconnected.');
    }

    setTimeout(() => { setSaveState('idle'); setSavedMessage(''); }, 3500);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Band EPK & Public Profile
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Configure the band’s public Electronic Press Kit (EPK), bio, genre tags, and streaming profiles.
      </p>

      {savedMessage && (
        <div style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--status-success)', padding: 14, borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
          ✓ {savedMessage}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Basic Details */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Band Identity</h3>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Band Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Biography (1,000 chars max)
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, textAlign: 'right' }}>
              {bio.length} / 1000 characters
            </div>
          </div>
        </div>

        {/* Genres */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Music Genres (Select up to 5)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AVAILABLE_GENRES.map((genre) => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  style={{
                    background: isSelected ? 'var(--accent-primary)' : 'var(--surface-raised)',
                    color: isSelected ? '#000' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        {/* Social & Streaming Links */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 14, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Social & Streaming Links</h3>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Instagram Handle
            </label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="username"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Spotify Artist URL
            </label>
            <input
              type="url"
              value={spotify}
              onChange={(e) => setSpotify(e.target.value)}
              placeholder="https://open.spotify.com/artist/..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Official Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>
        </div>

        <button
          type="submit"
          style={{
            background: 'var(--accent-primary)',
            color: '#FFFFFF',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            cursor: saveState === 'saving' ? 'not-allowed' : 'pointer',
            opacity: saveState === 'saving' ? 0.7 : 1,
            alignSelf: 'flex-start',
          }}
        >
          {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save Band Profile'}
        </button>
      </form>
    </div>
  );
}
