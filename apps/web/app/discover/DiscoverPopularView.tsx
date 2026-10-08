'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { PopularMusician } from '@/lib/discovery/discoveryDataService';

interface DiscoverPopularViewProps {
  musicians: PopularMusician[];
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return num.toString();
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '♪';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function DiscoverPopularView({ musicians }: DiscoverPopularViewProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'artist' | 'band'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredMusicians = useMemo(() => {
    return musicians.filter((m) => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesCity = (m.originCity || '').toLowerCase().includes(q);
        const matchesGenre = m.genres.some((g) => g.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesGenre) return false;
      }
      return true;
    });
  }, [musicians, typeFilter, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── 1. Hero Header Banner ── */}
      <section
        aria-label="Popular Musicians Header"
        style={{
          borderRadius: 24,
          padding: 'clamp(24px, 4vw, 36px)',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%)',
          border: '1px solid rgba(124, 58, 237, 0.24)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 8px 32px rgba(124, 58, 237, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#7C3AED',
              backgroundColor: 'rgba(124, 58, 237, 0.14)',
              padding: '4px 12px',
              borderRadius: 9999,
            }}
          >
            🌟 Verified Creators
          </span>
          <span style={{ fontSize: 13, color: 'var(--cb-text-muted, #86868B)' }}>
            Trending on Crowdbeats
          </span>
        </div>

        <div>
          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 850,
              color: 'var(--cb-text-primary, #1D1D1F)',
              margin: '0 0 10px',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            Popular musicians & bands.
          </h1>
          <p
            style={{
              fontSize: 'clamp(14px, 2vw, 17px)',
              color: 'var(--cb-text-secondary, #6E6E73)',
              margin: 0,
              maxWidth: 760,
              lineHeight: 1.5,
            }}
          >
            Explore verified independent performers building real connection on stage. Support their journey with direct tips, follow upcoming stage dates, and back their projects.
          </p>
        </div>
      </section>

      {/* ── 2. Filters & Search Bar ── */}
      <section
        aria-label="Musician Filters"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Search Field */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 300px',
            maxWidth: 480,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
              border: '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
              borderRadius: 9999,
              padding: '8px 16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            }}
          >
            <span style={{ fontSize: 16, color: 'var(--cb-text-muted, #86868B)', marginRight: 10 }}>
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artist, band name, genre, or city..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: 'var(--cb-text-primary, #1D1D1F)',
                fontSize: 14,
                fontWeight: 500,
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--cb-text-muted, #86868B)',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: '2px 6px',
                }}
                aria-label="Clear musician search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Type Filter Pills */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            style={{
              padding: '8px 16px',
              borderRadius: 9999,
              border: typeFilter === 'all' ? '1px solid #7C3AED' : '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
              backgroundColor: typeFilter === 'all' ? 'rgba(124, 58, 237, 0.14)' : 'var(--cb-surface-1, #FFFFFF)',
              color: typeFilter === 'all' ? '#7C3AED' : 'var(--cb-text-secondary, #6E6E73)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            All Creators
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('artist')}
            style={{
              padding: '8px 16px',
              borderRadius: 9999,
              border: typeFilter === 'artist' ? '1px solid #7C3AED' : '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
              backgroundColor: typeFilter === 'artist' ? 'rgba(124, 58, 237, 0.14)' : 'var(--cb-surface-1, #FFFFFF)',
              color: typeFilter === 'artist' ? '#7C3AED' : 'var(--cb-text-secondary, #6E6E73)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Solo Artists
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('band')}
            style={{
              padding: '8px 16px',
              borderRadius: 9999,
              border: typeFilter === 'band' ? '1px solid #7C3AED' : '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
              backgroundColor: typeFilter === 'band' ? 'rgba(124, 58, 237, 0.14)' : 'var(--cb-surface-1, #FFFFFF)',
              color: typeFilter === 'band' ? '#7C3AED' : 'var(--cb-text-secondary, #6E6E73)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Bands
          </button>
        </div>
      </section>

      {/* ── 3. Musicians Grid ── */}
      <section aria-label="Musicians Directory">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {filteredMusicians.map((m) => {
            const isBand = m.type === 'band';
            const profileHref = isBand
              ? `/band/${m.slug || m.id}`
              : `/artist/${m.slug || m.id}`;
            const tipHref = m.tipLink || `/tip/${m.id}`;

            return (
              <article
                key={m.id}
                style={{
                  backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
                  border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
                  borderRadius: 20,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 28px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.04)';
                }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  {/* Photo / Avatar */}
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      backgroundColor: 'var(--cb-surface-2, #F4F4F6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#7C3AED',
                      flexShrink: 0,
                      border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
                    }}
                  >
                    {m.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.photoUrl}
                        alt={m.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      getInitials(m.name)
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: 'var(--cb-text-primary, #1D1D1F)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.name}
                      </h3>
                      {m.isVerified && (
                        <span title="Verified Creator" style={{ color: '#7C3AED', fontSize: 14 }}>
                          ✓
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '1px 6px',
                          borderRadius: 4,
                          backgroundColor: isBand ? 'rgba(59, 130, 246, 0.12)' : 'rgba(124, 58, 237, 0.12)',
                          color: isBand ? '#2563EB' : '#7C3AED',
                        }}
                      >
                        {isBand ? 'Band' : 'Solo'}
                      </span>
                      {m.originCity && (
                        <span style={{ fontSize: 12, color: 'var(--cb-text-muted, #86868B)' }}>
                          • {m.originCity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Genres */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {m.genres.slice(0, 3).map((g) => (
                    <span
                      key={g}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: 'var(--cb-surface-2, #F4F4F6)',
                        color: 'var(--cb-text-secondary, #6E6E73)',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>

                {/* Metrics */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--cb-text-secondary, #6E6E73)',
                    paddingTop: 8,
                    borderTop: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.06))',
                    marginTop: 'auto',
                  }}
                >
                  <span>👥 {formatNumber(m.followersCount)} followers</span>
                  <span style={{ color: '#7C3AED', fontWeight: 600 }}>⭐ {m.popularityScore}% Score</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Link
                    href={profileHref}
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      borderRadius: 9999,
                      border: '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
                      backgroundColor: 'transparent',
                      color: 'var(--cb-text-primary, #1D1D1F)',
                      fontSize: 13,
                      fontWeight: 700,
                      textAlign: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    View Profile
                  </Link>

                  <Link
                    href={tipHref}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 9999,
                      border: 'none',
                      backgroundColor: '#7C3AED',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 700,
                      textAlign: 'center',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
                    }}
                  >
                    <span>💖</span>
                    <span>Tip</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
