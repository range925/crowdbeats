import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { DiscoverClientView } from './DiscoverClientView';

export const metadata: Metadata = {
  title: 'Live Music Map & Discovery Worldwide | Crowdbeats',
  description:
    'Discover live music nearby and around the world on the Crowdbeats interactive stage map. Find solo musicians and bands currently playing live, explore venues, and tip performers directly.',
  openGraph: {
    title: 'Live Music Map & Discovery Worldwide | Crowdbeats',
    description:
      'Explore live musicians and bands currently playing on stage nearby and worldwide.',
    type: 'website',
    siteName: 'Crowdbeats',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Music Map & Discovery Worldwide | Crowdbeats',
    description:
      'Explore live musicians and bands currently playing on stage nearby and worldwide.',
  },
};

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--cb-bg-app, #FBFBFD)',
            color: 'var(--cb-text-secondary, #6E6E73)',
            fontSize: 14,
          }}
        >
          Loading live music discovery map…
        </div>
      }
    >
      <DiscoverClientView />
    </Suspense>
  );
}
