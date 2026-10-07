'use client';

/**
 * Crowdbeats V2 — Public Performer Card (Web)
 * 
 * Displays artist/band details, live indicator, distance, genres,
 * and direct tip triggering with auth gating.
 */

import React from 'react';
import Link from 'next/link';
import type { PublicPerformerItem } from '@/lib/discovery/discoveryClient';
import { stripHtml } from '@/lib/security/sanitize';

interface PerformerCardProps {
  performer: PublicPerformerItem;
  onTip: (performer: PublicPerformerItem) => void;
  isSelected?: boolean;
}

export const PerformerCard: React.FC<PerformerCardProps> = ({
  performer,
  onTip,
  isSelected,
}) => {
  return (
    <div
      style={{
        backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.15)' : 'var(--cb-surface-1)',
        border: isSelected
          ? '1px solid var(--cb-purple-light)'
          : '1px solid var(--cb-border-subtle)',
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 0.15s ease',
        boxShadow: isSelected ? '0 8px 24px rgba(124, 58, 237, 0.25)' : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 14 }}>
        {/* Avatar / Photo */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: 'var(--cb-surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            flexShrink: 0,
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {performer.photoUrl ? (
            <img
              src={performer.photoUrl}
              alt={performer.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            '🎵'
          )}
        </div>

        {/* Performer Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link
              href={`/${performer.type}/${performer.slug}`}
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#FFFFFF',
                textDecoration: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {performer.name}
            </Link>
            {performer.isVerified && (
              <span style={{ color: '#A855F7', fontSize: 13 }} title="Verified Performer">
                ✓
              </span>
            )}
            {performer.isLive && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 6px',
                  borderRadius: 9999,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#10B981',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                ● LIVE
              </span>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--cb-text-secondary)', marginTop: 2 }}>
            {performer.genres.slice(0, 2).join(' · ')} · {performer.distanceMiles ?? 0.3} mi away
          </div>

          {performer.currentVenueName && (
            <div style={{ fontSize: 11, color: '#A855F7', fontWeight: 600, marginTop: 2 }}>
              @ {performer.currentVenueName}
            </div>
          )}
        </div>
      </div>

      {/* Bio snippet */}
      {performer.bio && (
        <p
          style={{
            fontSize: 12,
            color: 'var(--cb-text-muted)',
            lineHeight: 1.4,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {stripHtml(performer.bio)}
        </p>
      )}

      {/* Actions: View Profile & Tip */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Link
          href={`/${performer.type}/${performer.slug}`}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            textAlign: 'center',
            textDecoration: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          View Profile
        </Link>
        <button
          type="button"
          onClick={() => onTip(performer)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>💖</span>
          <span>Tip $20</span>
        </button>
      </div>
    </div>
  );
};
