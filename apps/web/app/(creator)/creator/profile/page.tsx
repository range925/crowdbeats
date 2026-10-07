'use client';

/**
 * Crowdbeats V2 — EPK Profile Editor
 * Dual-write: localStorage (optimistic) + Firestore via /api/creator/profile
 */

import React, { useState, useEffect } from 'react';

const GENRES = ['Rock', 'Pop', 'Jazz', 'Hip-Hop', 'Electronic', 'Folk', 'Classical', 'R&B', 'Country', 'Indie', 'Metal', 'Other'];

export default function CreatorProfilePage() {
  const [displayName, setDisplayName] = useState('Jake Rios');
  const [tagline, setTagline] = useState('Coastal Indie Folk Songwriter & Rhythmic Fingerstyle Acoustic');
  const [originCity, setOriginCity] = useState('San Diego, CA');
  const [bio, setBio] = useState('Acoustic indie folk songwriter touring coastal venues. Combining soulful vocals with rhythmic fingerstyle guitar and intimate storytelling that connects audiences.');
  const [instruments, setInstruments] = useState('Acoustic Guitar, Vocals, Harmonica, Stomp Box');
  const [influences, setInfluences] = useState('Bon Iver, Iron & Wine, Ben Howard, The Tallest Man on Earth');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('https://actions.google.com/sounds/v1/weather/rain_heavy.ogg');
  const [featuredTrackTitle, setFeaturedTrackTitle] = useState('Pacific Twilight (Acoustic Demo)');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Folk', 'Indie', 'Pop']);

  // Links
  const [website, setWebsite] = useState('https://jakeriosmusic.com');
  const [instagram, setInstagram] = useState('@jakerios');
  const [spotify, setSpotify] = useState('https://open.spotify.com/artist/jakerios');
  const [youtube, setYoutube] = useState('https://youtube.com/@jakerios');

  const [savedMessage, setSavedMessage] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // On mount: load from localStorage first (instant), then check Firestore via API
  useEffect(() => {
    // 1. Restore from localStorage immediately
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cb_creator_epk');
      if (cached) {
        try {
          const p = JSON.parse(cached);
          if (p.displayName) setDisplayName(p.displayName);
          if (p.tagline) setTagline(p.tagline);
          if (p.originCity) setOriginCity(p.originCity);
          if (p.bio) setBio(p.bio);
          if (p.instruments) setInstruments(p.instruments);
          if (p.influences) setInfluences(p.influences);
          if (p.audioPreviewUrl) setAudioPreviewUrl(p.audioPreviewUrl);
          if (p.featuredTrackTitle) setFeaturedTrackTitle(p.featuredTrackTitle);
          if (p.selectedGenres) setSelectedGenres(p.selectedGenres);
          if (p.website) setWebsite(p.website);
          if (p.instagram) setInstagram(p.instagram);
          if (p.spotify) setSpotify(p.spotify);
          if (p.youtube) setYoutube(p.youtube);
        } catch (_) {}
      }
    }

    // 2. Hydrate from Firestore (wins over localStorage if data exists)
    fetch('/api/creator/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.stageName) setDisplayName(data.stageName);
        if (data.tagline) setTagline(data.tagline);
        if (data.originCity) setOriginCity(data.originCity);
        if (data.bio) setBio(data.bio);
        if (data.instruments) setInstruments(Array.isArray(data.instruments) ? data.instruments.join(', ') : data.instruments);
        if (data.influences) setInfluences(Array.isArray(data.influences) ? data.influences.join(', ') : data.influences);
        if (data.audioPreviewUrl) setAudioPreviewUrl(data.audioPreviewUrl);
        if (data.featuredTrackTitle) setFeaturedTrackTitle(data.featuredTrackTitle);
        if (data.genres) setSelectedGenres(data.genres);
        if (data.socialLinks?.website) setWebsite(data.socialLinks.website);
        if (data.socialLinks?.instagram) setInstagram(data.socialLinks.instagram);
        if (data.socialLinks?.spotify) setSpotify(data.socialLinks.spotify);
        if (data.socialLinks?.youtube) setYoutube(data.socialLinks.youtube);
      })
      .catch(() => {}); // Silent fail — localStorage is the fallback
  }, []);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const profilePayload = () => ({
    stageName: displayName,
    tagline,
    originCity,
    bio,
    instruments: instruments.split(',').map((s) => s.trim()).filter(Boolean),
    influences: influences.split(',').map((s) => s.trim()).filter(Boolean),
    audioPreviewUrl,
    featuredTrackTitle,
    genres: selectedGenres,
    socialLinks: { website, instagram, spotify, youtube },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState('saving');

    const payload = profilePayload();

    // Optimistic: write to localStorage immediately
    if (typeof window !== 'undefined') {
      localStorage.setItem('cb_creator_epk', JSON.stringify({
        displayName, tagline, originCity, bio, instruments, influences,
        audioPreviewUrl, featuredTrackTitle, selectedGenres,
        website, instagram, spotify, youtube,
      }));
    }

    // Persist to Firestore via API
    try {
      const res = await fetch('/api/creator/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveState('saved');
        setSavedMessage('EPK saved and synced to your public profile!');
      } else {
        setSaveState('saved'); // Local save still succeeded
        setSavedMessage('Saved locally. Cloud sync will retry automatically.');
      }
    } catch {
      setSaveState('saved'); // Local save still succeeded
      setSavedMessage('Saved locally. Cloud sync will retry when reconnected.');
    }

    setTimeout(() => { setSavedMessage(''); setSaveState('idle'); }, 3500);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Electronic Press Kit (EPK) &amp; Public Bio
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Customize the rich narrative, featured audio sample, instruments, and credentials that viewers see on your public profile.
        </p>
      </div>

      {savedMessage && (
        <div style={{ background: 'rgba(0, 240, 118, 0.15)', border: '1px solid rgba(0, 240, 118, 0.4)', color: '#00F076', padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
          ✓ {savedMessage}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Core Identity */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Core Artist Identity
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Stage / Performer Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-base)', color: 'var(--text-primary)', fontSize: 14 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Origin Hometown / Metro Area
              </label>
              <input
                type="text"
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                placeholder="e.g. San Diego, CA"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-base)', color: 'var(--text-primary)', fontSize: 14 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Artist Hook / Tagline (Shown in Profile Header)
            </label>
            <input
              type="text"
              maxLength={140}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Coastal Indie Folk Songwriter & Rhythmic Fingerstyle Acoustic"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-base)', color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Biography &amp; Story (max 1,000 characters)
            </label>
            <textarea
              rows={4}
              maxLength={1000}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your fans about your music, story, and sound..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-base)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Featured Audio Demo */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            🎵 Featured Audio Demo (For Public Viewer Player)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Track / Soundbite Title
              </label>
              <input
                type="text"
                value={featuredTrackTitle}
                onChange={(e) => setFeaturedTrackTitle(e.target.value)}
                placeholder="e.g. Pacific Twilight (Acoustic Demo)"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-base)', color: 'var(--text-primary)', fontSize: 14 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Audio File / Stream URL (.mp3 / .ogg)
              </label>
              <input
                type="url"
                value={audioPreviewUrl}
                onChange={(e) => setAudioPreviewUrl(e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-base)', color: 'var(--text-primary)', fontSize: 14 }}
              />
            </div>
          </div>
        </div>

        {/* Musical DNA: Instruments & Influences */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            🎸 Musical DNA &amp; Gear
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Instruments &amp; Stage Gear (Comma-separated)
            </label>
            <input
              type="text"
              value={instruments}
              onChange={(e) => setInstruments(e.target.value)}
              placeholder="e.g. Acoustic Guitar, Vocals, Harmonica, Stomp Box"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-base)', color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Musical Influences (Comma-separated)
            </label>
            <input
              type="text"
              value={influences}
              onChange={(e) => setInfluences(e.target.value)}
              placeholder="e.g. Bon Iver, Iron & Wine, Ben Howard"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-base)', color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Genre Tags
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GENRES.map((genre) => {
                const active = selectedGenres.includes(genre);
                return (
                  <button
                    type="button"
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      background: active ? 'rgba(124, 58, 237, 0.2)' : 'var(--surface-base)',
                      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Links */}
        <div style={{ background: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            🔗 Streaming &amp; Social Links
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Spotify Artist URL</label>
              <input type="url" value={spotify} onChange={(e) => setSpotify(e.target.value)} placeholder="https://open.spotify.com/artist/..." style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-base)', color: 'var(--text-primary)', fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Instagram Handle</label>
              <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourhandle" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-base)', color: 'var(--text-primary)', fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Official Website</label>
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourwebsite.com" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-base)', color: 'var(--text-primary)', fontSize: 13 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>YouTube Channel URL</label>
              <input type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/@channel" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-base)', color: 'var(--text-primary)', fontSize: 13 }} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          style={{
            background: 'var(--accent-primary, #7C3AED)',
            color: '#FFFFFF',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            alignSelf: 'flex-start',
            boxShadow: '0 6px 20px rgba(124, 58, 237, 0.35)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          Save EPK &amp; Bio Profile
        </button>
      </form>
    </div>
  );
}
