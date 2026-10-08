'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { DiscoveryCampaign } from '@/lib/discovery/discoveryDataService';
import { BackCampaignModal } from './BackCampaignModal';

interface DiscoverCampaignsViewProps {
  campaigns: DiscoveryCampaign[] | readonly DiscoveryCampaign[];
}

const CAMPAIGN_CATEGORIES = [
  'All',
  'Album Production',
  'Vinyl Pressing',
  'Studio Album Recording',
  'Tour Support',
  'Community & Education',
  'Equipment & Media',
  'EP Production',
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '♪';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function DiscoverCampaignsView({ campaigns }: DiscoverCampaignsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'funded' | 'ending' | 'backers' | 'goal'>('funded');
  const [activeBackingCampaign, setActiveBackingCampaign] = useState<DiscoveryCampaign | null>(null);

  // Filter and sort campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter((c) => {
        // Category filter
        if (selectedCategory !== 'All') {
          const cat = (c.category || '').toLowerCase();
          if (!cat.includes(selectedCategory.toLowerCase())) return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = c.title.toLowerCase().includes(q);
          const matchesCreator = c.creatorName.toLowerCase().includes(q);
          const matchesDesc = (c.description || '').toLowerCase().includes(q);
          if (!matchesTitle && !matchesCreator && !matchesDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'funded') return b.percentFunded - a.percentFunded;
        if (sortBy === 'ending') return a.daysRemaining - b.daysRemaining;
        if (sortBy === 'backers') return b.backerCount - a.backerCount;
        if (sortBy === 'goal') return b.goalCents - a.goalCents;
        return 0;
      });
  }, [campaigns, selectedCategory, searchQuery, sortBy]);

  // Aggregate stats
  const totalPledgedCents = useMemo(() => {
    let sum = 0;
    for (const c of campaigns) {
      sum += c.pledgedCents || 0;
    }
    return sum;
  }, [campaigns]);

  const totalBackers = useMemo(() => {
    let count = 0;
    for (const c of campaigns) {
      count += c.backerCount || 0;
    }
    return count;
  }, [campaigns]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── 1. Hero Header Banner ── */}
      <section
        aria-label="Crowdfunding Header"
        style={{
          borderRadius: 24,
          padding: 'clamp(24px, 4vw, 36px)',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(168, 85, 247, 0.04) 100%)',
          border: '1px solid rgba(124, 58, 237, 0.24)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
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
            🚀 Fan-Powered Music Projects
          </span>
          <span style={{ fontSize: 13, color: 'var(--cb-text-muted, #86868B)' }}>
            Zero Platform Subscriptions
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
            Fund the next great sound.
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
            Directly back independent solo musicians and bands. Help fund debut albums, vinyl pressings, tour logistics, and studio production—with zero monthly platform subscription fees.
          </p>
        </div>

        {/* ── Metrics Overview Row ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginTop: 8,
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 16,
              backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
              border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cb-text-secondary, #6E6E73)' }}>
              Total Fan Funding
            </span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#7C3AED' }}>
              {formatCurrency(totalPledgedCents)}+
            </span>
            <span style={{ fontSize: 11, color: 'var(--cb-text-muted, #86868B)' }}>
              from {formatNumber(totalBackers)} dedicated fans
            </span>
          </div>

          <div
            style={{
              padding: '14px 18px',
              borderRadius: 16,
              backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
              border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cb-text-secondary, #6E6E73)' }}>
              Active Projects
            </span>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--cb-text-primary, #1D1D1F)' }}>
              {campaigns.length} Campaigns
            </span>
            <span style={{ fontSize: 11, color: 'var(--cb-text-muted, #86868B)' }}>
              Albums, vinyl, tours, and studio gear
            </span>
          </div>

          <div
            style={{
              padding: '14px 18px',
              borderRadius: 16,
              backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
              border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cb-text-secondary, #6E6E73)' }}>
              Artist Revenue Model
            </span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#22C55E' }}>
              100% Direct Payouts
            </span>
            <span style={{ fontSize: 11, color: 'var(--cb-text-muted, #86868B)' }}>
              Direct Stripe payouts · No monthly fee
            </span>
          </div>
        </div>
      </section>

      {/* ── 2. Filters & Search Bar ── */}
      <section
        aria-label="Campaign Filters"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Top Controls: Search Input + Sort Dropdown */}
        <div
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
                placeholder="Search campaigns by title, artist, or band..."
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
                  aria-label="Clear campaign search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--cb-text-secondary, #6E6E73)', fontWeight: 600 }}>
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '8px 14px',
                borderRadius: 9999,
                border: '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
                backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
                color: 'var(--cb-text-primary, #1D1D1F)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="funded">Most Funded (%)</option>
              <option value="ending">Ending Soon</option>
              <option value="backers">Most Backers</option>
              <option value="goal">Funding Goal</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none',
          }}
        >
          {CAMPAIGN_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 9999,
                  border: isActive ? '1px solid #7C3AED' : '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
                  backgroundColor: isActive ? 'rgba(124, 58, 237, 0.14)' : 'var(--cb-surface-1, #FFFFFF)',
                  color: isActive ? '#7C3AED' : 'var(--cb-text-secondary, #6E6E73)',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(124, 58, 237, 0.2)' : 'none',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 3. Active Campaigns Cards Grid ── */}
      <section aria-label="Campaigns List">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            fontSize: 14,
            color: 'var(--cb-text-secondary, #6E6E73)',
            fontWeight: 600,
          }}
        >
          <span>
            {filteredCampaigns.length === 1
              ? '1 campaign matching filter'
              : `${filteredCampaigns.length} campaigns matching filter`}
          </span>
          <span style={{ fontSize: 12, color: 'var(--cb-text-muted, #86868B)' }}>
            Updated in real-time
          </span>
        </div>

        {filteredCampaigns.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 24,
            }}
          >
            {filteredCampaigns.map((c) => {
              const isBand = c.creatorType === 'band';
              const percent = c.percentFunded;
              const clampedPercent = Math.min(Math.max(percent, 0), 100);
              const profileHref = isBand
                ? `/band/${c.creatorId.replace(/^(bnd_|art_|usr_)/, '')}`
                : `/artist/${c.creatorId.replace(/^(bnd_|art_|usr_)/, '')}`;

              return (
                <article
                  key={c.campaignId}
                  style={{
                    backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
                    border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
                    borderRadius: 22,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  {/* Hero Cover Image */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '56.25%', // 16:9
                      backgroundColor: '#1E293B',
                      overflow: 'hidden',
                    }}
                  >
                    {c.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.photoUrl}
                        alt={c.title}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontSize: 32,
                        }}
                      >
                        🎵
                      </div>
                    )}

                    {/* Status Chip Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        padding: '4px 10px',
                        borderRadius: 9999,
                        backgroundColor:
                          percent >= 100
                            ? 'rgba(34, 197, 94, 0.92)'
                            : c.daysRemaining <= 5
                              ? 'rgba(245, 158, 11, 0.92)'
                              : 'rgba(124, 58, 237, 0.92)',
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 700,
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      }}
                    >
                      {percent >= 100
                        ? '✓ Funded'
                        : `${c.daysRemaining} days left`}
                    </div>

                    {/* Category Tag Overlay */}
                    {c.category && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 12,
                          left: 12,
                          padding: '3px 9px',
                          borderRadius: 9999,
                          backgroundColor: 'rgba(0, 0, 0, 0.65)',
                          color: '#F3F4F6',
                          fontSize: 11,
                          fontWeight: 600,
                          backdropFilter: 'blur(6px)',
                        }}
                      >
                        {c.category}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div
                    style={{
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      gap: 14,
                    }}
                  >
                    {/* Creator Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: 'var(--cb-surface-2, #F4F4F6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#7C3AED',
                          border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(c.creatorName)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Link
                          href={profileHref}
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--cb-text-primary, #1D1D1F)',
                            textDecoration: 'none',
                          }}
                        >
                          {c.creatorName}
                        </Link>
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
                      </div>
                    </div>

                    {/* Campaign Title */}
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: 'var(--cb-text-primary, #1D1D1F)',
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      {c.title}
                    </h3>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--cb-text-secondary, #6E6E73)',
                        margin: 0,
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {c.description}
                    </p>

                    {/* Progress Bar & Percentage */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#7C3AED' }}>
                          {percent}% funded
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--cb-text-secondary, #6E6E73)' }}>
                          {c.daysRemaining > 0 ? `${c.daysRemaining} days left` : 'Completed'}
                        </span>
                      </div>

                      <div
                        style={{
                          width: '100%',
                          height: 8,
                          borderRadius: 9999,
                          backgroundColor: 'var(--cb-surface-2, #F4F4F6)',
                          overflow: 'hidden',
                          border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.04))',
                        }}
                      >
                        <div
                          style={{
                            width: `${clampedPercent}%`,
                            height: '100%',
                            borderRadius: 9999,
                            background: 'linear-gradient(90deg, #7C3AED, #A855F7)',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Metrics 3-Col Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        padding: '10px 0',
                        borderTop: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.06))',
                        borderBottom: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.06))',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cb-text-primary, #1D1D1F)' }}>
                          {formatCurrency(c.pledgedCents)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--cb-text-muted, #86868B)' }}>pledged</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cb-text-primary, #1D1D1F)' }}>
                          {formatCurrency(c.goalCents)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--cb-text-muted, #86868B)' }}>goal</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cb-text-primary, #1D1D1F)' }}>
                          {formatNumber(c.backerCount)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--cb-text-muted, #86868B)' }}>backers</div>
                      </div>
                    </div>

                    {/* Actions: Back Campaign & View Profile */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => setActiveBackingCampaign(c)}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          borderRadius: 9999,
                          border: 'none',
                          backgroundColor: '#7C3AED',
                          color: '#FFFFFF',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: '0 2px 10px rgba(124, 58, 237, 0.3)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>💖</span>
                        <span>Back Campaign</span>
                      </button>

                      <Link
                        href={profileHref}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 9999,
                          border: '1px solid var(--cb-border-medium, rgba(0, 0, 0, 0.12))',
                          backgroundColor: 'transparent',
                          color: 'var(--cb-text-secondary, #6E6E73)',
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty Search / Filter State */
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              backgroundColor: 'var(--cb-surface-1, #FFFFFF)',
              borderRadius: 24,
              border: '1px solid var(--cb-border-subtle, rgba(0, 0, 0, 0.08))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 44 }}>🔍</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--cb-text-primary, #1D1D1F)', margin: 0 }}>
              No campaigns found matching your filter
            </h3>
            <p style={{ fontSize: 14, color: 'var(--cb-text-secondary, #6E6E73)', margin: 0, maxWidth: 420 }}>
              Try searching for a different music category, artist name, or clear your filters to view all projects.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              style={{
                marginTop: 8,
                padding: '8px 18px',
                borderRadius: 9999,
                border: '1px solid #7C3AED',
                backgroundColor: 'rgba(124, 58, 237, 0.08)',
                color: '#7C3AED',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* ── 4. Callout Banner: "Start a Campaign" for Musicians ── */}
      <section
        aria-label="Musician Campaign Launch Callout"
        style={{
          borderRadius: 24,
          padding: 'clamp(24px, 4vw, 36px)',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#A855F7',
            }}
          >
            FOR MUSICIANS & BANDS
          </span>
          <h2
            style={{
              fontSize: 'clamp(20px, 3vw, 26px)',
              fontWeight: 800,
              margin: '8px 0',
              letterSpacing: '-0.01em',
            }}
          >
            Ready to fund your next album or tour?
          </h2>
          <p
            style={{
              fontSize: 14,
              color: '#94A3B8',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Keep 100% ownership of your master recordings and intellectual property. Fans fund your campaign directly through Stripe with zero monthly platform subscriptions.
          </p>
        </div>

        <Link
          href="/creator/campaigns"
          style={{
            padding: '12px 24px',
            borderRadius: 9999,
            backgroundColor: '#7C3AED',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          <span>Launch Your Campaign</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </section>

      {/* ── 5. Back Campaign Pledge Modal ── */}
      {activeBackingCampaign && (
        <BackCampaignModal
          campaign={activeBackingCampaign}
          onClose={() => setActiveBackingCampaign(null)}
        />
      )}
    </div>
  );
}
