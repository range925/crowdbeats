'use client';

/**
 * Crowdbeats V2 — Public Venue Card (Web)
 * 
 * Displays venue details, active performers count, and distance.
 */

import React from 'react';
import Link from 'next/link';
import type { PublicVenueItem } from '@/lib/discovery/discoveryClient';

interface VenueCardProps {
  venue: PublicVenueItem;
  isSelected?: boolean;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue, isSelected }) => {
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
        gap: 10,
        boxShadow: isSelected ? '0 8px 24px rgba(124, 58, 237, 0.25)' : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            backgroundColor: 'var(--cb-surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0,
          }}
        >
          🏟️
        </div>

        <div style={{ flex: 1 }}>
          <Link
            href={`/venue/${venue.id}`}
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#FFFFFF',
              textDecoration: 'none',
            }}
          >
            {venue.name}
          </Link>
          <div style={{ fontSize: 12, color: 'var(--cb-text-secondary)', marginTop: 2 }}>
            {venue.city}, {venue.state} · {venue.distanceMiles ?? 0.3} mi away
          </div>
          <div style={{ fontSize: 12, color: '#A855F7', fontWeight: 600, marginTop: 2 }}>
            {venue.activeMusicianCount} active performers tonight
          </div>
        </div>
      </div>

      {venue.description && (
        <p
          style={{
            fontSize: 12,
            color: 'var(--cb-text-muted)',
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {venue.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Link
          href={`/venue/${venue.id}`}
          style={{
            width: '100%',
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
          View Venue Details & Stages
        </Link>
      </div>
    </div>
  );
};
