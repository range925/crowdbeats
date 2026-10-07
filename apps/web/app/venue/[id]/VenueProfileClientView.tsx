'use client';

/**
 * Crowdbeats V2 — Venue Profile Interactive View (Client)
 *
 * Rich viewer experience featuring:
 *   - Venue amenities badges
 *   - Capacity and sound system highlights
 *   - Active stage directory with live performers
 *   - Map routing link
 */

import React from 'react';
import Link from 'next/link';
import type { PublicVenueItem } from '@/lib/discovery/discoveryClient';

interface VenueProfileClientViewProps {
  venue: PublicVenueItem;
}

export const VenueProfileClientView: React.FC<VenueProfileClientViewProps> = ({
  venue,
}) => {
  const defaultStages = [
    { name: 'Main Acoustic Stage', performer: 'Jake Rios', status: 'LIVE NOW' },
    { name: 'Patio Lounge Stage', performer: 'The Sunsets', status: 'STARTS 9:30 PM' },
  ];

  const stagesToRender = venue.stages && venue.stages.length > 0 ? venue.stages : defaultStages;

  const defaultAmenities = [
    'Full Craft Bar',
    'Multi-Tier Sound System',
    'Outdoor Patio',
    'Sound Engineer On-Site',
    'Wheelchair Accessible',
  ];

  const amenitiesToRender = venue.amenities && venue.amenities.length > 0 ? venue.amenities : defaultAmenities;

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Banner */}
      <div
        style={{
          minHeight: 220,
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(15, 17, 26, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: 28,
          marginBottom: 32,
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              backgroundColor: '#1E2032',
              border: '2px solid rgba(59, 130, 246, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              flexShrink: 0,
            }}
          >
            🏟️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                {venue.name}
              </h1>
              <span
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#60A5FA',
                  padding: '2px 8px',
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                VERIFIED VENUE
              </span>
            </div>
            <div style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 14, marginTop: 6 }}>
              📍 {venue.address ?? `${venue.city}, ${venue.state}`} · {venue.distanceMiles ?? 0.3} mi away
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Overview & Live Stages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* About Section */}
          <section
            style={{
              backgroundColor: 'var(--cb-surface-1, #151722)',
              borderRadius: 20,
              padding: 24,
              border: '1px solid var(--cb-border-subtle, #2B2D44)',
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', color: '#FFFFFF' }}>
              About the Venue
            </h2>
            <p style={{ color: 'var(--cb-text-secondary, #94A3B8)', lineHeight: 1.7, fontSize: 15, margin: '0 0 20px' }}>
              {venue.description}
            </p>

            {/* Venue Amenities */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#60A5FA', marginBottom: 10 }}>
                Venue Amenities &amp; Features
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {amenitiesToRender.map((amenity) => (
                  <span
                    key={amenity}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      color: '#93C5FD',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ✓ {amenity}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Active Stages Tonight */}
          <section
            style={{
              backgroundColor: 'var(--cb-surface-1, #151722)',
              borderRadius: 20,
              padding: 24,
              border: '1px solid var(--cb-border-subtle, #2B2D44)',
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🎭</span> Active Stages &amp; Sets Tonight
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stagesToRender.map((stage) => (
                <div
                  key={stage.name}
                  style={{
                    backgroundColor: '#1E2032',
                    borderRadius: 14,
                    padding: 18,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#FFFFFF' }}>{stage.name}</div>
                    {stage.performer && (
                      <div style={{ color: 'var(--cb-text-secondary, #94A3B8)', fontSize: 13, marginTop: 4 }}>
                        Featuring: <strong style={{ color: '#A855F7' }}>{stage.performer}</strong>
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      padding: '5px 12px',
                      borderRadius: 9999,
                      backgroundColor: stage.status.includes('LIVE') ? 'rgba(0, 240, 118, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      border: stage.status.includes('LIVE') ? '1px solid rgba(0, 240, 118, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
                      color: stage.status.includes('LIVE') ? '#00F076' : '#CBD5E1',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {stage.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Info Box */}
        <div>
          <div
            style={{
              backgroundColor: 'var(--cb-surface-1, #151722)',
              border: '1px solid var(--cb-border-subtle, #2B2D44)',
              borderRadius: 24,
              padding: 26,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              position: 'sticky',
              top: 24,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
              Venue Information
            </h3>
            <div style={{ fontSize: 13, color: 'var(--cb-text-secondary, #94A3B8)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>📍 <strong>Address:</strong> {venue.address ?? `${venue.city}, ${venue.state}`}</div>
              <div>👥 <strong>Capacity:</strong> {venue.capacity ?? 350} guests</div>
              <div>🎙️ <strong>Check-In Geofence:</strong> Active GPS 100m radius</div>
              <div>🍸 <strong>Bar &amp; Food:</strong> Full craft cocktail bar &amp; kitchen</div>
            </div>

            <Link
              href="/fan/nearby"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                color: '#60A5FA',
                fontSize: 14,
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>🗺️</span> Find Venue on Live Map
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};
