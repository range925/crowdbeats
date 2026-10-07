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

export interface BandRosterItem {
  name: string;
  instrument: string;
  role: string;
  uid?: string;
  photoUrl?: string;
}

const COMMON_GENRES = ['Alternative Rock', 'Indie Pop', 'Jazz Fusion', 'Hard Rock', 'Post-Punk', 'Funk / Soul', 'Metal', 'Electronic / Live'];

interface BandProfileEditorProps {
  initialData?: any;
  onSaveSuccess?: () => void;
}

export function BandProfileEditor({ initialData, onSaveSuccess }: BandProfileEditorProps) {
  const [bandName, setBandName] = useState(initialData?.name || initialData?.displayName || '');
  const [tagline, setTagline] = useState(initialData?.tagline || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [originCity, setOriginCity] = useState(initialData?.originCity || initialData?.city || '');
  const [bookingPref, setBookingPref] = useState(initialData?.bookingPreference || 'Management Email');

  // Genres
  const [genres, setGenres] = useState<string[]>(initialData?.genres || ['Alternative Rock', 'Indie Pop']);
  const [genreInput, setGenreInput] = useState('');

  // Roster
  const [roster, setRoster] = useState<BandRosterItem[]>(
    initialData?.rosterPreview && initialData.rosterPreview.length > 0
      ? initialData.rosterPreview
      : [
          { name: 'Alex Rivera', role: 'Frontperson', instrument: 'Lead Vocals & Rhythm Guitar' },
          { name: 'Jordan Hayes', role: 'Band Member', instrument: 'Bass & Backing Vocals' },
          { name: 'Sam Chen', role: 'Band Member', instrument: 'Drums & Percussion' },
        ]
  );
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Band Member');
  const [newMemberInstrument, setNewMemberInstrument] = useState('');

  // Socials
  const [website, setWebsite] = useState(initialData?.socialLinks?.web || initialData?.website || '');
  const [spotify, setSpotify] = useState(initialData?.socialLinks?.spotify || '');
  const [youtube, setYoutube] = useState(initialData?.socialLinks?.youtube || '');
  const [instagram, setInstagram] = useState(initialData?.socialLinks?.instagram || '');
  const [tiktok, setTiktok] = useState(initialData?.socialLinks?.tiktok || '');

  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = () => {
    if (!newMemberName.trim()) return;
    setRoster((prev) => [
      ...prev,
      {
        name: newMemberName.trim(),
        role: newMemberRole.trim() || 'Band Member',
        instrument: newMemberInstrument.trim() || 'Musician',
      },
    ]);
    setNewMemberName('');
    setNewMemberRole('Band Member');
    setNewMemberInstrument('');
  };

  const removeMember = (index: number) => {
    setRoster((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleGenre = (genre: string) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: bandName,
          tagline,
          bio,
          city: originCity,
          genres,
          bookingPreference: bookingPref,
          rosterPreview: roster,
          socialLinks: {
            web: website,
            spotify,
            youtube,
            instagram,
            tiktok,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save band profile.');
      }

      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3500);
      onSaveSuccess?.();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      {/* 1. Band Identity */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C084FC',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Band Identity</h3>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
              Your band's public name, tagline, and story presented across Crowdbeats
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={LABEL}>Band Name</label>
            <input
              type="text"
              style={INPUT}
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="e.g. Midnight Echoes"
              required
            />
          </div>

          <div>
            <label style={LABEL}>Home Market / Origin City</label>
            <input
              type="text"
              style={INPUT}
              value={originCity}
              onChange={(e) => setOriginCity(e.target.value)}
              placeholder="e.g. Austin, TX"
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={LABEL}>Tagline / Hook</label>
          <input
            type="text"
            style={INPUT}
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. High-energy indie fusion delivering electrifying festival performances"
            maxLength={140}
          />
          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', textAlign: 'right', marginTop: 4 }}>
            {tagline.length}/140
          </div>
        </div>

        <div>
          <label style={LABEL}>Band Biography & Press Narrative</label>
          <textarea
            style={{ ...INPUT, minHeight: 110, resize: 'vertical' }}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share your band's formation, notable tours, discography highlights, and artistic vision..."
            maxLength={600}
          />
          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', textAlign: 'right', marginTop: 4 }}>
            {bio.length}/600
          </div>
        </div>
      </div>

      {/* 2. Band Roster */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Band Roster & Lineup</h3>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
              Showcase each active band musician, their instruments, and role
            </p>
          </div>
        </div>

        {/* Existing roster items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {roster.map((member, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(168, 85, 247, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 14,
                    color: '#C084FC',
                  }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>{member.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                    <span style={{ color: '#A855F7', fontWeight: 500 }}>{member.role}</span> &bull; {member.instrument}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeMember(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(239, 68, 68, 0.8)',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Remove Member"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Add member subform */}
        <div
          style={{
            padding: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginBottom: 12 }}>
            + Add Band Member
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 12 }}>
            <input
              type="text"
              style={INPUT}
              placeholder="Musician Name"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
            />
            <input
              type="text"
              style={INPUT}
              placeholder="Role (e.g. Lead Vocals, Founder)"
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
            />
            <input
              type="text"
              style={INPUT}
              placeholder="Instrument(s) (e.g. Lead Guitar)"
              value={newMemberInstrument}
              onChange={(e) => setNewMemberInstrument(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={addMember}
            disabled={!newMemberName.trim()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: newMemberName.trim() ? '#A855F7' : 'rgba(255, 255, 255, 0.08)',
              color: newMemberName.trim() ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
              border: 'none',
              cursor: newMemberName.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Add to Lineup
          </button>
        </div>
      </div>

      {/* 3. Genres */}
      <div style={CARD}>
        <label style={{ ...LABEL, fontSize: 15, marginBottom: 8 }}>Band Musical Genres</label>
        <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.55)', marginBottom: 14 }}>
          Select the primary genres that describe your collective sound
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {COMMON_GENRES.map((g) => {
            const selected = genres.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  border: selected ? '1px solid #A855F7' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: selected ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: selected ? '#E9D5FF' : 'rgba(255, 255, 255, 0.75)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {selected ? '✓ ' : ''}{g}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          style={INPUT}
          placeholder="Type a custom genre and press Enter..."
          value={genreInput}
          onChange={(e) => setGenreInput(e.target.value)}
          onKeyDown={addGenre}
        />
      </div>

      {/* 4. Booking Preference & Official Links */}
      <div style={CARD}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>
          Booking & Digital Presences
        </h3>

        <div style={{ marginBottom: 16 }}>
          <label style={LABEL}>Booking Inquiries Routing</label>
          <select
            style={{ ...INPUT, cursor: 'pointer' }}
            value={bookingPref}
            onChange={(e) => setBookingPref(e.target.value)}
          >
            <option value="Management Email" style={{ backgroundColor: '#1A1C26' }}>Management Email / Booking Agent</option>
            <option value="Direct Message" style={{ backgroundColor: '#1A1C26' }}>Direct In-App Message (Crowdbeats)</option>
            <option value="Official Website" style={{ backgroundColor: '#1A1C26' }}>Official Website Booking Form</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div>
            <label style={LABEL}>Official Website</label>
            <input
              type="url"
              style={INPUT}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourband.com"
            />
          </div>
          <div>
            <label style={LABEL}>Spotify Artist Page</label>
            <input
              type="url"
              style={INPUT}
              value={spotify}
              onChange={(e) => setSpotify(e.target.value)}
              placeholder="https://open.spotify.com/artist/..."
            />
          </div>
          <div>
            <label style={LABEL}>YouTube Channel</label>
            <input
              type="url"
              style={INPUT}
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              placeholder="https://youtube.com/@band"
            />
          </div>
          <div>
            <label style={LABEL}>Instagram</label>
            <input
              type="text"
              style={INPUT}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@band_official"
            />
          </div>
          <div>
            <label style={LABEL}>TikTok</label>
            <input
              type="text"
              style={INPUT}
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="@band_music"
            />
          </div>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {savedMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            borderRadius: 10,
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ADE80',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <CheckIcon size={16} color="#4ADE80" />
          <span>Band profile updated successfully!</span>
        </div>
      )}

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 28px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            backgroundColor: '#A855F7',
            color: '#FFFFFF',
            border: 'none',
            cursor: saving ? 'wait' : 'pointer',
            boxShadow: '0 4px 16px rgba(168, 85, 247, 0.4)',
            transition: 'all 0.15s ease',
          }}
        >
          {saving ? 'Saving...' : 'Save Band Profile'}
        </button>
      </div>
    </form>
  );
}
