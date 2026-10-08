'use client';

/**
 * Landing v3 — Hero (Frontend A).
 *
 * Always-dark surface (`styles.dark`) with one art-directed photograph:
 *  - Desktop/tablet (≥768px): 16:9 image fills the hero, subject right; the
 *    headline zone sits left over a dark left→right scrim.
 *  - Mobile (<768px): dedicated 4:5 crop on top; text block below, pulled up
 *    over the image's dark lower third with a bottom scrim.
 * If the image is missing or fails, the frame stays a neutral dark surface
 * (the <img> is hidden instead of showing a broken-image icon).
 */
import React, { useEffect, useRef, useState } from 'react';
import styles from './landing.module.css';
import hero from './hero.module.css';
import { useLanding } from './LandingContext';

const HERO_ALT =
  'A young female singer-guitarist performs live on stage with an acoustic guitar under warm stage lighting.';

export function HeroSection() {
  const { openRoleChooser } = useLanding();
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgFailed, setImgFailed] = useState(false);

  // The image may have failed before hydration attached onError — check once.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setImgFailed(true);
  }, []);

  return (
    <section
      id="top"
      className={`${styles.section} ${styles.dark} ${hero.hero}`}
      aria-labelledby="top-title"
    >
      <div className={hero.media} aria-hidden={imgFailed || undefined}>
        {!imgFailed && (
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet="/landing/v3/hero-mobile-750.webp 750w, /landing/v3/hero-mobile-1080.webp 1080w"
              sizes="100vw"
              width={1080}
              height={1350}
            />
            <img
              ref={imgRef}
              className={hero.img}
              src="/landing/v3/hero-desktop-1920.webp"
              srcSet="/landing/v3/hero-desktop-1280.webp 1280w, /landing/v3/hero-desktop-1920.webp 1920w, /landing/v3/hero-desktop-2560.webp 2560w"
              sizes="100vw"
              width={1920}
              height={1080}
              alt={HERO_ALT}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              onError={() => setImgFailed(true)}
            />
          </picture>
        )}
        <div className={hero.scrim} aria-hidden="true" />
      </div>

      <div className={`${styles.container} ${hero.inner}`}>
        <div className={hero.copy}>
          <p className={`${styles.eyebrow} ${hero.eyebrow}`}>Live music near you</p>
          <h1 id="top-title" className={`${styles.h1} ${hero.title}`}>
            Discover live music near you.
          </h1>
          <p className={`${styles.lead} ${hero.lead}`}>
            Find solo musicians and bands nearby—or explore music around the world.
          </p>
          <div className={`${styles.ctaRow} ${hero.ctas}`}>
            <a href="#discover" className={`${styles.btn} ${styles.btnLg} ${hero.cta}`}>
              Discover live music
            </a>
            <button
              type="button"
              className={`${styles.btnSecondary} ${styles.btnLg} ${hero.cta} ${hero.ctaSecondary}`}
              onClick={(e) => openRoleChooser('musician', e.currentTarget)}
            >
              Join as a musician
            </button>
          </div>
          <p className={hero.reassure}>
            Browse freely without an account. Discover performers on the map, or scan a performer&rsquo;s QR code to tip directly.
          </p>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
