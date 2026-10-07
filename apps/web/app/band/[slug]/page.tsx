import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { MOCK_PERFORMERS, PublicPerformerItem } from '@/lib/discovery/discoveryClient';
import { DiscoveryNav } from '@/components/discovery/DiscoveryNav';
import { BandProfileClientView } from './BandProfileClientView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return MOCK_PERFORMERS.filter((p) => p.type === 'band').map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const performer = MOCK_PERFORMERS.find((p) => p.slug === slug) || {
    name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    bio: 'Live band performing on Crowdbeats.',
    genres: ['Rock', 'Indie'],
  };

  return {
    title: `${performer.name} — Live Band on Crowdbeats`,
    description: performer.bio ?? `Discover ${performer.name} on Crowdbeats. Support live bands in real-time.`,
    openGraph: {
      title: `${performer.name} | Crowdbeats`,
      description: performer.bio,
      type: 'profile',
      siteName: 'Crowdbeats',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${performer.name} | Crowdbeats`,
      description: performer.bio,
    },
  };
}

export default async function BandProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const performer: PublicPerformerItem = MOCK_PERFORMERS.find(
    (p) => p.slug === slug
  ) || {
    id: slug,
    slug: slug,
    name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    type: 'band',
    bio: 'Dynamic live band blending authentic melodies with modern instrumentation.',
    genres: ['Rock', 'Indie Rock'],
    isVerified: true,
    isLive: true,
    currentVenueName: 'The Main Stage',
    distanceMiles: 0.3,
    latitude: 32.7157,
    longitude: -117.1611,
    popularityScore: 92,
    followersCount: 1800,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: performer.name,
    description: performer.bio,
    genre: performer.genres,
    location: performer.currentVenueName
      ? {
          '@type': 'Place',
          name: performer.currentVenueName,
        }
      : undefined,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0C10', color: '#FFFFFF' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DiscoveryNav />
      <React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading band...</div>}>
        <BandProfileClientView performer={performer} />
      </React.Suspense>
    </div>
  );
}
