import React from 'react';

export function CrowdbeatsJsonLd() {
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Crowdbeats',
      alternateName: 'Crowdbeats V2',
      url: 'https://crowdbeats.com',
      description:
        'Where Fans Fuel The Music. Direct live artist tipping in 2 taps, real-time stage radar, automated band revenue splits, and 0% monthly subscriptions.',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://crowdbeats.com/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Crowdbeats',
      url: 'https://crowdbeats.com',
      logo: 'https://crowdbeats.com/crowdbeats-logo-on-dark.png',
      description: 'The premier direct-to-creator live music technology and tipping platform.',
      sameAs: [
        'https://twitter.com/crowdbeats',
        'https://instagram.com/crowdbeats',
        'https://github.com/crowdbeats',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Crowdbeats Live Music Platform',
      applicationCategory: 'MusicApplication',
      operatingSystem: 'iOS, Android, Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free to join for fans, solo musicians, bands, and live music venues.',
      },
      featureList: [
        'Direct artist tipping in 2 taps via Google Pay or card',
        'Real-time venue check-in radar with GPS stage proximity',
        'Automated multi-member band revenue splits with Stripe Connect',
        'Transparent 6% platform fee with zero monthly subscription fees',
        'Dynamic stage QR tokens for mic stands and venue monitors',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does Crowdbeats tipping work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Fans can discover nearby live gigs or scan an artist stage QR code to tip in 2 taps using Google Pay or card with zero app downloads required.',
          },
        },
        {
          '@type': 'Question',
          name: 'What are the fees for musicians on Crowdbeats?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Crowdbeats charges a transparent 6% platform technology fee. Standard Stripe processing (2.9% + 30¢) is deducted, and the remaining net payout (~90-94%) is deposited directly into the musician bank account. There are 0% monthly subscription fees.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do automated band splits work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Bands configure member revenue percentages (e.g. Lead Vocals 40%, Keys 25%, Drums 20%, Bass 15%). When an audience tip is received, the Crowdbeats subledger automatically divides and deposits each member agreed share directly into their individual bank account via Stripe Connect.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do venues benefit from Crowdbeats?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'When artists check into venue stages, the venue lights up on the Crowdbeats Live Stage Radar, driving free foot traffic, beverage sales, and patron engagement.',
          },
        },
      ],
    },
  ];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
