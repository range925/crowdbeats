'use client';

import React from 'react';
import styles from './appleLanding.module.css';
import { useLanding } from '../v3/LandingContext';

export function AppleHeroSection() {
  const { openRoleChooser } = useLanding();

  return (
    <section id="hero" className={`${styles.section} ${styles.darkSurface} ${styles.hero}`} aria-labelledby="hero-title">
      <div className={styles.heroMedia} aria-hidden="true">
        <img
          src="/landing/apple/hero_stage.jpg"
          alt="Charismatic female solo musician performing live on stage with acoustic guitar under warm venue lights"
          className={styles.heroMediaImg}
          loading="eager"
          fetchPriority="high"
        />
        <div className={styles.heroScrim} />
      </div>

      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Live Music Near You</p>
          <h1 id="hero-title" className={`${styles.headline} ${styles.heroHeadline}`}>
            Discover live musicians near you.{' '}
            <br />
            Support the music you love.
          </h1>
          <p className={styles.heroSubheadline}>
            Discover live solo musicians and bands near you—or explore music around the world.
          </p>
          <div className={styles.heroButtonRow}>
            <a href="#discover" className={`${styles.pillButton} ${styles.btnWhite}`}>
              Discover live music
            </a>
            <button
              type="button"
              className={`${styles.pillButton} ${styles.btnOutlineWhite}`}
              onClick={(e) => openRoleChooser('musician', e.currentTarget)}
            >
              Join as a musician
            </button>
          </div>
          <p className={styles.heroReassure}>
            Browse freely without an account. Discover performers on the map, or scan a performer&rsquo;s QR code to tip directly.
          </p>
        </div>
      </div>
    </section>
  );
}

export default AppleHeroSection;
