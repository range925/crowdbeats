'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import styles from './appleLanding.module.css';

interface CarouselSlideData {
  id: string;
  name: string;
  genre: string;
  venue: string;
  description: string;
  image: string;
  profileUrl: string;
  tipUrl: string;
}

const CAROUSEL_SLIDES: CarouselSlideData[] = [
  {
    id: 'maya-lin',
    name: 'Maya Lin',
    genre: 'Indie Folk & Acoustic',
    venue: 'The Starlight Room • Austin, TX',
    description: 'Intimate acoustic sessions, delicate fingerpicking, and poetic storytelling in warm candlelit venues.',
    image: '/landing/apple/carousel_maya.jpg',
    profileUrl: '/artist/maya-lin',
    tipUrl: '/tip/art_maya_lin',
  },
  {
    id: 'midnight-echoes',
    name: 'The Midnight Echoes',
    genre: 'Indie Rock / Alternative',
    venue: 'Camden Underground • London, UK',
    description: 'Raw live energy, anthemic dual-guitar choruses, and full-room singalongs that define the weekend.',
    image: '/landing/apple/carousel_echoes.jpg',
    profileUrl: '/band/the-midnight-echoes',
    tipUrl: '/tip/the-midnight-echoes',
  },
  {
    id: 'marcus-rivera',
    name: 'Marcus Rivera',
    genre: 'Latin Jazz & Brass',
    venue: 'Blue Note Lounge • San Diego, CA',
    description: 'Soulful tenor saxophone improvisations and infectious Latin syncopation over warm analog Rhodes.',
    image: '/landing/apple/carousel_marcus.jpg',
    profileUrl: '/artist/marcus-rivera',
    tipUrl: '/tip/marcus-rivera',
  },
  {
    id: 'elena-cruz',
    name: 'Elena Cruz',
    genre: 'Coastal Acoustic & Americana',
    venue: 'Belly Up Tavern • Solana Beach, CA',
    description: 'Heartfelt songwriting, resonant dreadnought acoustics, and an authentic connection with every table.',
    image: '/landing/apple/hero_stage.jpg',
    profileUrl: '/artist/elena-cruz',
    tipUrl: '/tip/elena-cruz',
  },
];

export function AppleEditorialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : CAROUSEL_SLIDES.length - 1));
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev < CAROUSEL_SLIDES.length - 1 ? prev + 1 : 0));
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      nextSlide();
    } else if (distance < -50) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      id="carousel"
      className={`${styles.section} ${styles.carouselSection}`}
      aria-label="Featured Performer Stories Carousel"
      onKeyDown={onKeyDown}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <div className={styles.carouselHeader}>
        <div>
          <p className={styles.eyebrow}>Live Discovery</p>
          <h2 className={styles.carouselTitle}>Find your next live moment.</h2>
        </div>
        <div className={styles.carouselNavButtons}>
          <button
            type="button"
            className={styles.navCircleButton}
            onClick={prevSlide}
            aria-label="Previous performer story"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.navCircleButton}
            onClick={nextSlide}
            aria-label="Next performer story"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={styles.carouselViewport}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={styles.carouselTrack}
          style={{
            transform: `translateX(calc(50% - (clamp(320px, 75vw, 1080px) / 2) - (${currentIndex} * (clamp(320px, 75vw, 1080px) + clamp(16px, 3vw, 32px)))))`,
          }}
        >
          {CAROUSEL_SLIDES.map((slide, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={slide.id}
                className={`${styles.carouselSlide} ${isActive ? styles.carouselSlideActive : ''}`}
                aria-hidden={!isActive}
              >
                <img
                  src={slide.image}
                  alt={`${slide.name} live performance`}
                  className={styles.carouselSlideImg}
                  loading="lazy"
                  width={1080}
                  height={608}
                />
                <div className={styles.carouselSlideOverlay}>
                  <p className={styles.eyebrow} style={{ color: '#2DD4BF', marginBottom: '6px' }}>
                    {slide.genre} • {slide.venue}
                  </p>
                  <h3 className={styles.carouselPerformerName}>{slide.name}</h3>
                  <p className={styles.carouselPerformerBio}>{slide.description}</p>
                  <div className={styles.buttonRow}>
                    <Link href={slide.tipUrl} className={`${styles.pillButton} ${styles.btnWhite}`}>
                      Tip directly
                    </Link>
                    <Link href={slide.profileUrl} className={`${styles.pillButton} ${styles.btnOutlineWhite}`}>
                      View profile
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.carouselIndicators} role="tablist" aria-label="Carousel pagination">
        {CAROUSEL_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`Go to slide ${index + 1}: ${slide.name}`}
            className={`${styles.carouselDot} ${index === currentIndex ? styles.carouselDotActive : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}

export default AppleEditorialCarousel;
