'use client';

/**
 * Crowdbeats V2 — Popular Creator Card (Web)
 * Used in the Top 3 Popular section on the Location-First Discovery page.
 *
 * Layout: Horizontal compact card with rank badge
 *   [ #N Rank ] [ Avatar ] [ Name + Verified ] [ AI summary ] [ Genres ] [ Tip btn ]
 */

import React from 'react';
import Link from 'next/link';
import type { PublicPerformerItem } from '@/lib/discovery/discoveryClient';

interface PopularCreatorCardProps {
  performer: PublicPerformerItem;
  rank: number;
  onTip: (performer: PublicPerformerItem) => void;
}

const RANK_COLORS: Record<number, { bg: string; text: string; glow: string }> = {
  1: { bg: 'linear-gradient(135deg, #F59E0B, #D97706)', text: '#000000', glow: 'rgba(245,158,11,0.45)' },
  2: { bg: 'linear-gradient(135deg, #94A3B8, #64748B)', text: '#000000', glow: 'rgba(148,163,184,0.35)' },
  3: { bg: 'linear-gradient(135deg, #B97333, #92400E)', text: '#FFFFFF', glow: 'rgba(185,115,51,0.35)' },
};

export const PopularCreatorCard: React.FC<PopularCreatorCardProps> = ({ performer, rank, onTip }) => {
  const rankStyle = RANK_COLORS[rank] ?? RANK_COLORS[3];

  return (
    <div
      style={{
        backgroundColor: 'var(--cb-surface-1, #151722)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'border-color 0.15s ease, background 0.15s ease',
      }}
    >
      {/* Rank badge */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: rankStyle.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: rankStyle.text,
          fontSize: 11,
          fontWeight: 900,
          flexShrink: 0,
          boxShadow: `0 2px 8px ${rankStyle.glow}`,
        }}
      >
        #{rank}
      </div>

      {/* Avatar */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          flexShrink: 0,
          overflow: 'hidden',
          backgroundColor: '#1E2030',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
        }}
      >
        {performer.photoUrl ? (
          <img
            src={performer.photoUrl}
            alt={performer.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          '\uD83C\uDFB5'
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Link
            href={`/${performer.type}/${performer.slug}`}
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#FFFFFF',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 150,
            }}
          >
            {performer.name}
          </Link>
          {performer.isVerified && (
            <span style={{ color: '#A855F7', fontSize: 12 }} title="Verified">&#x2713;</span>
          )}
          {performer.isLive && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '1px 6px',
                borderRadius: 9999,
                backgroundColor: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.5)',
                color: '#10B981',
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.06em',
              }}
            >
              &#9679; LIVE
            </span>
          )}
        </div>

        {performer.aiCardSummary && (
          <div
            style={{
              marginTop: 4,
              padding: '3px 8px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: '#CBD5E1',
                margin: 0,
                lineHeight: 1.35,
                fontStyle: 'italic',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              &ldquo;{performer.aiCardSummary}&rdquo;
            </p>
          </div>
        )}

        <div style={{ fontSize: 10, color: '#64748B', marginTop: 3 }}>
          {performer.genres.slice(0, 2).join(' \u00B7 ')}
        </div>
      </div>

      {/* Tip CTA */}
      <button
        type="button"
        onClick={() => onTip(performer)}
        style={{
          flexShrink: 0,
          padding: '7px 12px',
          borderRadius: 8,
          border: 'none',
          background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
        }}
      >
        &#x1F496; Tip
      </button>
    </div>
  );
};
