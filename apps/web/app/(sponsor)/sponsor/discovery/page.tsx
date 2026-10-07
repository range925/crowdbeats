/**
 * Crowdbeats V2 — Sponsor Talent Discovery & Comparison (Phase 9)
 *
 * Privacy-preserving aggregate talent metrics: Verified artists & bands,
 * aggregate monthly listeners, tip engagement index, and sponsorship status.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Talent {
  id: string;
  name: string;
  type: 'artist' | 'band';
  genre: string;
  city: string;
  followerCohort: string;
  engagementRating: string;
  avgGigTipCents: number;
  openForSponsorship: boolean;
}

const TALENT_DIRECTORY: Talent[] = [
  {
    id: 't1',
    name: 'The Lunar Waves',
    type: 'band',
    genre: 'Indie Rock',
    city: 'San Francisco, CA',
    followerCohort: '5k - 10k',
    engagementRating: 'Top 5%',
    avgGigTipCents: 45000,
    openForSponsorship: true,
  },
  {
    id: 't2',
    name: 'Elena Cruz',
    type: 'artist',
    genre: 'Acoustic / Folk',
    city: 'Austin, TX',
    followerCohort: '10k - 25k',
    engagementRating: 'Top 2%',
    avgGigTipCents: 62000,
    openForSponsorship: true,
  },
  {
    id: 't3',
    name: 'Neon Velvet',
    type: 'band',
    genre: 'Synthpop',
    city: 'Los Angeles, CA',
    followerCohort: '25k+',
    engagementRating: 'Top 1%',
    avgGigTipCents: 110000,
    openForSponsorship: true,
  },
];

export default function SponsorDiscoveryPage() {
  const [filterGenre, setFilterGenre] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);

  const toggleShortlist = (id: string) => {
    if (shortlistedIds.includes(id)) {
      setShortlistedIds(shortlistedIds.filter((item) => item !== id));
    } else {
      setShortlistedIds([...shortlistedIds, id]);
    }
  };

  const filteredTalent = TALENT_DIRECTORY.filter((t) => {
    const matchesGenre = filterGenre === 'All' || t.genre.toLowerCase().includes(filterGenre.toLowerCase());
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.city.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        Talent Discovery & Comparison
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Discover vetted musicians with verified live stage performance history and privacy-preserving aggregate metrics.
      </p>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by artist, band name, or city..."
          style={{
            flex: 1,
            minWidth: 260,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        />

        <select
          value={filterGenre}
          onChange={(e) => setFilterGenre(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        >
          <option value="All">All Genres</option>
          <option value="Rock">Rock</option>
          <option value="Indie">Indie</option>
          <option value="Acoustic">Acoustic / Folk</option>
          <option value="Synthpop">Synthpop / Electronic</option>
        </select>
      </div>

      {/* Talent Table */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Performer</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Genre & Location</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Audience Cohort</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Engagement</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Avg Gig Yield</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTalent.map((t) => {
              const isShortlisted = shortlistedIds.includes(t.id);
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{t.type === 'band' ? '🥁' : '🎸'}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{t.type}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.genre}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{t.city}</div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                    {t.followerCohort}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--status-success)', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                      {t.engagementRating}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 700 }}>
                    ${(t.avgGigTipCents / 100).toFixed(0)} / gig
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button
                        onClick={() => toggleShortlist(t.id)}
                        style={{
                          background: isShortlisted ? 'var(--accent-secondary)' : 'var(--surface-raised)',
                          color: isShortlisted ? '#fff' : 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isShortlisted ? '★ Saved' : '☆ Save'}
                      </button>
                      <Link
                        href="/sponsor/sponsorships"
                        style={{
                          background: 'var(--accent-primary)',
                          color: '#FFFFFF',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        Propose Deal
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
