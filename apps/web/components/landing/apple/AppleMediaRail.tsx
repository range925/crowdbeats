'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import styles from './appleLanding.module.css';

interface RailItem {
  id: string;
  tag: string;
  name: string;
  href: string;
  image: string;
}

const RAIL_ITEMS: RailItem[] = [
  {
    id: 'acoustic',
    tag: 'Genre Spotlight',
    name: 'Acoustic Sessions & Folk',
    href: '/discover?genre=acoustic',
    image: '/landing/apple/hero_stage.jpg',
  },
  {
    id: 'rock',
    tag: 'Live Bands',
    name: 'Indie Rock & Alternative',
    href: '/discover?genre=rock',
    image: '/landing/apple/tile_band.jpg',
  },
  {
    id: 'jazz',
    tag: 'Late Night',
    name: 'Downtown Jazz & Brass',
    href: '/discover?genre=jazz',
    image: '/landing/apple/carousel_marcus.jpg',
  },
  {
    id: 'studios',
    tag: 'Behind the Scenes',
    name: 'Studio Recording & Vinyl',
    href: '/discover?tab=campaigns',
    image: '/landing/apple/tile_campaign.jpg',
  },
  {
    id: 'community',
    tag: 'Social Spaces',
    name: 'Local Music Lounges',
    href: '/discover?setting=venue',
    image: '/landing/apple/tile_community.jpg',
  },
  {
    id: 'worldwide',
    tag: 'Global Discovery',
    name: 'Explore Worldwide Hubs',
    href: '/discover',
    image: '/landing/apple/connection_stage.jpg',
  },
];

export function AppleMediaRail() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className={`${styles.section} ${styles.mediaRailSection}`} aria-label="Explore by Sound and City">
      <div className={styles.mediaRailHeader}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p className={styles.eyebrow} style={{ color: '#A1A1A6' }}>Browse Channels</p>
            <h3 className={styles.mediaRailTitle}>Explore by sound & city</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={styles.navCircleButton}
              style={{ width: '36px', height: '36px' }}
              onClick={() => scroll('left')}
              aria-label="Scroll channels left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.navCircleButton}
              style={{ width: '36px', height: '36px' }}
              onClick={() => scroll('right')}
              aria-label="Scroll channels right"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.mediaRailScroll} ref={scrollRef}>
        {RAIL_ITEMS.map((item) => (
          <Link key={item.id} href={item.href} className={styles.railCard}>
            <div
              className={styles.railCardBg}
              style={{ backgroundImage: `url(${item.image})` }}
              aria-hidden="true"
            />
            <div className={styles.railCardOverlay} aria-hidden="true" />
            <div className={styles.railCardContent}>
              <p className={styles.railCardTag}>{item.tag}</p>
              <h4 className={styles.railCardName}>{item.name}</h4>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default AppleMediaRail;
