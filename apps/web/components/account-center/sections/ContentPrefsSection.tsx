'use client';

import React, { useState } from 'react';
import { SettingsToggle } from '@/components/settings/SettingsToggle';
import { SettingsPicker } from '@/components/settings/SettingsPicker';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
};

const GENRES = [
  'Rock', 'Jazz', 'Hip-Hop', 'Electronic', 'Folk', 'Blues',
  'Pop', 'Country', 'Classical', 'R&B', 'Metal', 'Indie',
];

export function ContentPrefsSection() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Indie', 'Jazz', 'Electronic']);
  const [maturity, setMaturity] = useState('standard');
  const [autoPlay, setAutoPlay] = useState(true);
  const [showRadar, setShowRadar] = useState(true);
  const [toast, setToast] = useState(false);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSave = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  return (
    <div>
      {toast && (
        <div style={{ position: 'sticky', top: 12, zIndex: 50, background: '#10B981', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>
          Content preferences saved ✓
        </div>
      )}

      {/* Musical Genres */}
      <div style={CARD}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>Favorite Genres</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', marginBottom: 14 }}>
          Select genres you love to fine-tune nearby busker discovery and stage recommendations.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {GENRES.map((g) => {
            const active = selectedGenres.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: active ? '1px solid #7C3AED' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? 'var(--accent-primary, #7C3AED)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#FFFFFF' : 'var(--text-secondary, #94A3B8)',
                  minHeight: 44,
                  transition: 'all 0.15s ease',
                }}
              >
                {g} {active ? '✓' : '+'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Media Playback & Maturity */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>Auto-Play Audio Previews</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Automatically sample track previews when scrolling artist press kits.</div>
          </div>
          <SettingsToggle checked={autoPlay} onChange={setAutoPlay} label="Auto-Play Previews" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>Show Nearby in Radar</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Enable radar scanning for buskers within walking distance.</div>
          </div>
          <SettingsToggle checked={showRadar} onChange={setShowRadar} label="Radar Scanning" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>Content Maturity Filter</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94A3B8)' }}>Filter explicit lyrics or mature stage event announcements.</div>
          </div>
          <div style={{ width: 160 }}>
            <SettingsPicker
              value={maturity}
              onChange={setMaturity}
              options={[
                { value: 'family', label: 'Family Friendly' },
                { value: 'standard', label: 'Standard' },
                { value: 'mature', label: 'Unfiltered' },
              ]}
            />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              background: 'var(--accent-primary, #7C3AED)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Save Content Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
