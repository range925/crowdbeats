'use client';

import React, { useState } from 'react';
import { SettingsToggle } from '@/components/settings/SettingsToggle';
import { SettingsPicker } from '@/components/settings/SettingsPicker';

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

const GENRES_LIST = [
  'Indie Rock', 'Jazz', 'Hip-Hop', 'Folk', 'Electronic', 'Pop',
  'Blues', 'R&B', 'Country', 'Classical', 'Soul', 'Punk'
];

interface FanProfileEditorProps {
  initialData?: any;
  onSaveSuccess?: () => void;
}

export function FanProfileEditor({ initialData, onSaveSuccess }: FanProfileEditorProps) {
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [pronouns, setPronouns] = useState(initialData?.pronouns || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialData?.genres || ['Indie Rock', 'Jazz']);
  const [publicProfile, setPublicProfile] = useState(initialData?.publicProfileVisible ?? true);

  // Social Links
  const [spotify, setSpotify] = useState(initialData?.socialLinks?.spotify || '');
  const [instagram, setInstagram] = useState(initialData?.socialLinks?.instagram || '');
  const [tiktok, setTiktok] = useState(initialData?.socialLinks?.tiktok || '');
  const [youtube, setYoutube] = useState(initialData?.socialLinks?.youtube || '');

  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
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
          displayName,
          username,
          pronouns,
          bio,
          city,
          genres: selectedGenres,
          publicProfileVisible: publicProfile,
          socialLinks: {
            spotify,
            instagram,
            tiktok,
            youtube,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to save profile.');
      }

      setSavedMessage(true);
      onSaveSuccess?.();
      setTimeout(() => setSavedMessage(false), 2500);
    } catch (err: any) {
      setError(err?.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      {savedMessage && (
        <div style={{ position: 'sticky', top: 12, zIndex: 50, background: '#10B981', color: '#FFFFFF', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: 'center', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}>
          Fan Profile Saved Successfully ✓
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid #EF4444', color: '#EF4444', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Basic Fan Details */}
      <div style={CARD}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cb-text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          Identity & Details
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={LABEL}>Display Name</label>
            <input
              type="text"
              placeholder="e.g. Alex Rivera"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={INPUT}
              required
            />
          </div>

          <div>
            <label style={LABEL}>Username (@)</label>
            <input
              type="text"
              placeholder="e.g. alexrivera"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              style={INPUT}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={LABEL}>Pronouns (Optional)</label>
            <select
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              style={INPUT}
            >
              <option value="">Select or none</option>
              <option value="they/them">they / them</option>
              <option value="she/her">she / her</option>
              <option value="he/him">he / him</option>
              <option value="she/they">she / they</option>
              <option value="he/they">he / they</option>
            </select>
          </div>

          <div>
            <label style={LABEL}>Home City / Region</label>
            <input
              type="text"
              placeholder="e.g. Austin, TX"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={INPUT}
            />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ ...LABEL, marginBottom: 0 }}>Short Bio</label>
            <span style={{ fontSize: 11, color: bio.length > 280 ? '#EF4444' : 'var(--cb-text-muted, #64748B)' }}>
              {bio.length} / 300
            </span>
          </div>
          <textarea
            placeholder="Tell performers and concertgoers about your music vibe..."
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 300))}
            rows={3}
            style={{ ...INPUT, minHeight: 80, resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Music Interests & Genres */}
      <div style={CARD}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cb-text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Favorite Music Interests & Genres
        </div>
        <p style={{ fontSize: 13, color: 'var(--cb-text-secondary, #94A3B8)', margin: '0 0 14px' }}>
          We use this to prioritize nearby busker radar alerts and festival stage recommendations.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {GENRES_LIST.map((genre) => {
            const isSelected = selectedGenres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #06B6D4' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: isSelected ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
                  color: isSelected ? '#38BDF8' : 'var(--cb-text-secondary, #94A3B8)',
                  minHeight: 40,
                  transition: 'all 0.15s ease',
                }}
              >
                {genre} {isSelected ? '✓' : '+'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected Music & Social Handles */}
      <div style={CARD}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cb-text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          Connected Music & Socials
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <div>
            <label style={LABEL}>Spotify Profile URL</label>
            <input
              type="url"
              placeholder="https://open.spotify.com/user/..."
              value={spotify}
              onChange={(e) => setSpotify(e.target.value)}
              style={INPUT}
            />
          </div>

          <div>
            <label style={LABEL}>Instagram Handle</label>
            <input
              type="text"
              placeholder="@yourhandle"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              style={INPUT}
            />
          </div>

          <div>
            <label style={LABEL}>TikTok Handle</label>
            <input
              type="text"
              placeholder="@yourhandle"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              style={INPUT}
            />
          </div>

          <div>
            <label style={LABEL}>YouTube Channel URL</label>
            <input
              type="url"
              placeholder="https://youtube.com/@..."
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              style={INPUT}
            />
          </div>
        </div>
      </div>

      {/* Visibility Toggle & Save Button */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>Public Fan Profile Visibility</div>
            <div style={{ fontSize: 12, color: 'var(--cb-text-secondary, #94A3B8)', marginTop: 2 }}>
              Allow followed artists to see your public supporter badge in stage tip feeds.
            </div>
          </div>
          <SettingsToggle
            checked={publicProfile}
            onChange={setPublicProfile}
            label="Public"
          />
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              backgroundColor: '#06B6D4',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
              minHeight: 48,
              boxShadow: '0 4px 16px -2px rgba(6, 182, 212, 0.4)',
            }}
          >
            {saving ? 'Saving Profile...' : 'Save Fan Profile'}
          </button>
        </div>
      </div>
    </form>
  );
}
