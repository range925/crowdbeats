import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { MOCK_VENUES, PublicVenueItem } from '@/lib/discovery/discoveryClient';
import { DiscoveryNav } from '@/components/discovery/DiscoveryNav';
import { VenueProfileClientView } from './VenueProfileClientView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return MOCK_VENUES.map((v) => ({
    id: v.id,
  }));
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const venue = MOCK_VENUES.find((v) => v.id === id) || {
    name: 'Live Music Venue',
    city: 'San Diego',
    state: 'CA',
    description: 'Premier live music room on Crowdbeats.',
  };

  return {
    title: `${venue.name} — Live Music Venue on Crowdbeats`,
    description: venue.description ?? `Discover live stages and active musicians at ${venue.name}.`,
    openGraph: {
      title: `${venue.name} | Crowdbeats`,
      description: venue.description,
      type: 'website',
      siteName: 'Crowdbeats',
    },
  };
}

export default async function VenueProfilePage({ params }: PageProps) {
  const { id } = await params;
  const venue: PublicVenueItem = MOCK_VENUES.find((v) => v.id === id) || {
    id,
    name: 'The Main Stage',
    city: 'San Diego',
    state: 'CA',
    address: '450 Harbor Drive, San Diego, CA',
    latitude: 32.7157,
    longitude: -117.1611,
    activeMusicianCount: 2,
    distanceMiles: 0.3,
    description: 'Premier downtown live music room featuring multi-tier sound and intimate stage views.',
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicVenue',
    name: venue.name,
    address: venue.address,
    description: venue.description,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0C10', color: '#FFFFFF' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DiscoveryNav />
      <VenueProfileClientView venue={venue} />
    </div>
  );
}
