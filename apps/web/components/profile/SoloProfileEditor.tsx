'use client';

import React, { useState } from 'react';
import { CheckIcon } from '@/components/account-center/AccountCenterIcons';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 22,
  marginBottom: 20,
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
};

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#FFFFFF',
  marginBottom: 6,
};

const INPUT: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#FFFFFF',
  fontSize: 14,
  minHeight: 44,
  fontFamily: 'inherit',
  outline: 'none',
};

const PERFORMANCE_TYPES = ['Street & Busking', 'Club & Acoustic', 'Festival & Concert', 'Virtual Live Stream'];
const AVAILABILITY_STATUSES = ['Available for Booking', 'Touring', 'Recording / Hiatus'];
const BOOKING_PREFS = ['Direct Email', 'Talent Agent', 'Direct Message (Crowdbeats)'];
const INSTRUMENTS_SUGGESTIONS = ['Acoustic Guitar', 'Electric Guitar', 'Vocals', 'Keys & Piano', 'Bass', 'Drums', 'Saxophone', 'Violin', 'DJ / Launchpad', 'Trumpet', 'Cello'];

interface SoloProfileEditorProps {
  initialData?: any;
  onSaveSuccess?: () => void;
}

export function SoloProfileEditor({ initialData, onSaveSuccess }: SoloProfileEditorProps) {
  const [stageName, setStageName] = useState(initialData?.stageName || initialData?.displayName || '');
  const [tagline, setTagline] = useState(initialData?.tagline || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [originCity, setOriginCity] = useState(initialData?.originCity || initialData?.city || '');
  const [musicStyle, setMusicStyle] = useState(initialData?.musicStyle || 'Indie Acoustic / Live Loop');
  const [performanceType, setPerformanceType] = useState(initialData?.performanceType || 'Street & Busking');
  const [availability, setAvailability] = useState(initialData?.availability || 'Available for Booking');
  const [bookingPref, setBookingPref] = useState(initialData?.bookingPreference || 'Direct Email');

  // Multi-selects
  const [genres, setGenres] = useState<string[]>(initialData?.genres || ['Indie Folk', 'Acoustic']);
  const [genreInput, setGenreInput] = useState('');
  const [instruments, setInstruments] = useState<string[]>(initialData?.instruments || ['Acoustic Guitar', 'Vocals']);

  // Music & Social Links
  const [website, setWebsite] = useState(initialData?.socialLinks?.web || initialData?.website || '');
  const [spotify, setSpotify] = useState(initialData?.socialLinks?.spotify || '');
  const [youtube, setYoutube] = useState(initialData?.socialLinks?.youtube || '');
  const [instagram, setInstagram] = useState(initialData?.socialLinks?.instagram || '');
  const [tiktok, setTiktok] = useState(initialData?.socialLinks?.tiktok || '');
  const [soundcloud, setSoundcloud] = useState(initialData?.socialLinks?.soundcloud || '');

  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInstrument = (inst: string) => {
    setInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  };

  const addGenre = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && genreInput.trim()) {
      e.preventDefault();
      if (!genres.includes(genreInput.trim())) {
        setGenres([...genres, genreInput.trim()]);
      }
      setGenreInput('');
    }
  };

  const removeGenre = (genreToRemove: string) => {
    setGenres(genres.filter((g) => g !== genreToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: stageName,
          bio,
          city: originCity,
          tagline,
          musicStyle,
          performanceType,
          availability,
          bookingPreference: bookingPref,
          genres,
          instruments,
          website,
          socialLinks: {
            web: website,
            spotify,
            youtube,
            instagram,
            tiktok,
            soundcloud,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to update creator profile.');
      }

      setSavedMessage(true);
      onSaveSuccess?.();
      setTimeout(() => setSavedMessage(false), 2500);
    } catch (err: any) {
      setError(err?.message || 'Error updating artist EPK profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      {savedMessage && (
        <div style={{ position: 'sticky', top: 12, zIndex: 50, background: '#10B981', color: '#FFFFFF', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: 'center', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}>
          Artist Profile & EPK Saved ✓
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid #EF4444', color: '#EF4444', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Verification Status Banner */}
      <div
        style={{
          ...CARD,
          background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(18,20,28,0.85) 100%)',
          borderColor: 'rgba(168,85,247,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cb-purple-light, #A855F7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Verified Performer Credentials
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
            Solo Musician & Performer Identity
          </div>
        </div>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: 20,
            backgroundColor: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: '#10B981',
            fontSize: 12,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CheckIcon size={12} strokeWidth={2.5} />
          Verified Artist
        </span>
      </div>

      {/* Core Artist Identity */}
      <div style={CARD}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cb-text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          Stage Identity & Bio
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={LABEL}>Artist / Stage Name</label>
            <input
              type="text"
              placeholder="e.g. Luna Sol"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              style={INPUT}
              required
            />
          </div>

          <div>
            <label style={LABEL}>Origin City / Tour Base</label>
            <input
              type="text"
              placeholder="e.g. Nashville, TN"
              value={originCity}
              onChange={(e) => setOriginCity(e.target.value)}
              style={INPUT}
            />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={LABEL}>One-Line Tagline / Headline</label>
          <input
            type="text"
            placeholder="e.g. Indie-soul storyteller looping live beats on street corners and intimate stages"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            style={INPUT}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ ...LABEL, marginBottom: 0 }}>Artist EPK Bio</label>
            <span style={{ fontSize: 11, color: bio.length > 550 ? '#EF4444' : 'var(--cb-text-muted, #64748B)' }}>
              {bio.length} / 600
            </span>
          </div>
          <textarea
            placeholder="Describe your musical journey, discography highlights, and live performance energy..."
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 600))}
            rows={4}
            style={{ ...INPUT, minHeight: 96, resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Musical Style & Instruments */}
      <div style={CARD}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cb-text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          Sound, Style & Instrumentation
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={LABEL}>Primary Music Style / Sonic Signature</label>
          <input
            type="text"
            placeholder="e.g. Neo-Soul / Live Acoustic Looping"
            value={musicStyle}
            onChange={(e) => setMusicStyle(e.target.value)}
            style={INPUT}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={LABEL}>Genres (Press Enter to add)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {genres.map((g) => (
              <span
                key={g}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 16,
                  backgroundColor: 'rgba(168,85,247,0.15)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  color: '#A855F7',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {g}
                <button
                  type="button"
                  onClick={() => removeGenre(g)}
                  style={{ background: 'none', border: 'none', color: '#A855F7', cursor: 'pointer', padding: 0 }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add a genre and press Enter..."
            value={genreInput}
            onChange={(e) => setGenreInput(e.target.value)}
            onKeyDown={addGenre}
            style={INPUT}
          />
        </div>

        <div>
          <label style={LABEL}>Instruments Played</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {INSTRUMENTS_SUGGESTIONS.map((inst) => {
              const active = instruments.includes(inst);
              return (
                <button
                  key={inst}
                  type="button"
                  onClick={() => toggleInstrument(inst)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: active ? '1px solid #A855F7' : '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: active ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#FFFFFF' : 'var(--cb-text-secondary, #94A3B8)',
                    minHeight: 38,
                  }}
                >
                  {inst} {active ? '✓' : '+'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gig Logistics & Availability */}
      <div style={CARD}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cb-text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          Live Performance & Booking Logistics
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div>
            <label style={LABEL}>Performance Format</label>
            <select
              value={performanceType}
              onChange={(e) => setPerformanceType(e.target.value)}
              style={INPUT}
            >
              {PERFORMANCE_TYPES.map((pt) => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={LABEL}>Booking Availability</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              style={INPUT}
            >
              {AVAILABILITY_STATUSES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={LABEL}>Booking Contact Preference</label>
            <select
              value={bookingPref}
              onChange={(e) => setBookingPref(e.target.value)}
              style={INPUT}
            >
              {BOOKING_PREFS.map((bp) => (
                <option key={bp} value={bp}>{bp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Official Links & Music Streaming */}
      <div style={CARD}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cb-text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          Official Links & Streaming Profiles
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <div>
            <label style={LABEL}>Official Artist Website</label>
            <input
              type="url"
              placeholder="https://artistname.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              style={INPUT}
            />
          </div>

          <div>
            <label style={LABEL}>Spotify Artist Profile</label>
            <input
              type="url"
              placeholder="https://open.spotify.com/artist/..."
              value={spotify}
              onChange={(e) => setSpotify(e.target.value)}
              style={INPUT}
            />
          </div>

          <div>
            <label style={LABEL}>YouTube Channel</label>
            <input
              type="url"
              placeholder="https://youtube.com/@..."
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              style={INPUT}
            />
          </div>

          <div>
            <label style={LABEL}>SoundCloud Profile</label>
            <input
              type="url"
              placeholder="https://soundcloud.com/..."
              value={soundcloud}
              onChange={(e) => setSoundcloud(e.target.value)}
              style={INPUT}
            />
          </div>

          <div>
            <label style={LABEL}>Instagram Handle</label>
            <input
              type="text"
              placeholder="@artistname"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              style={INPUT}
            />
          </div>

          <div>
            <label style={LABEL}>TikTok Handle</label>
            <input
              type="text"
              placeholder="@artistname"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              style={INPUT}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 28px',
            borderRadius: 12,
            backgroundColor: 'var(--cb-purple-main, #7C3AED)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1,
            minHeight: 48,
            boxShadow: '0 4px 20px -2px rgba(124, 58, 237, 0.5)',
          }}
        >
          {saving ? 'Saving Artist EPK...' : 'Save Artist Profile'}
        </button>
      </div>
    </form>
  );
}
