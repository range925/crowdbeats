'use client';

/**
 * Crowdbeats V2 — Nearby Creator Card (Web)
 * Used in the Top 5 Nearby section on the Location-First Discovery page.
 *
 * Layout: Horizontal compact card
 *   [ Avatar ] [ Name + Verified + LIVE badge ] [ AI summary ] [ Distance + Genre ] [ Tip btn ]
 */

import React from 'react';
import Link from 'next/link';
import type { PublicPerformerItem } from '@/lib/discovery/discoveryClient';

interface NearbyCreatorCardProps {
  performer: PublicPerformerItem;
  onTip: (performer: PublicPerformerItem) => void;
}

export const NearbyCreatorCard: React.FC<NearbyCreatorCardProps> = ({ performer, onTip }) => {
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
      {/* Avatar */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 10,
          flexShrink: 0,
          overflow: 'hidden',
          backgroundColor: '#1E2030',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          position: 'relative',
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
        {performer.isLive && (
          <div
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#10B981',
              border: '1.5px solid #0B0C10',
            }}
          />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
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
              maxWidth: 140,
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
          {performer.distanceMiles != null ? `${performer.distanceMiles} mi` : ''}{performer.distanceMiles != null && performer.genres.length > 0 ? ' \u00B7 ' : ''}{performer.genres.slice(0, 2).join(' \u00B7 ')}
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
