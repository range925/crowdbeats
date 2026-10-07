'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './appleLanding.module.css';
import { useLanding } from '../v3/LandingContext';

export function AppleBentoGrid() {
  const { openRoleChooser } = useLanding();
  const [selectedTip, setSelectedTip] = useState<number>(10);

  const feeAmount = (selectedTip * 0.06).toFixed(2);
  const netAmount = (selectedTip - parseFloat(feeAmount) - 0.59).toFixed(2);

  return (
    <section id="grid" className={`${styles.section} ${styles.gridSection}`} aria-label="Crowdbeats Platform Features">
      <div className={styles.gridContainer}>
        {/* ── ROW 1, TILE 1: Solo Musicians ─────────────────────────────── */}
        <div id="tile-solo-musicians" className={`${styles.tile} ${styles.tileDark}`}>
          <div className={styles.tileContent}>
            <p className={styles.eyebrow}>Solo Musicians</p>
            <h3 className={styles.tileTitle}>Your music. More people.</h3>
            <p className={styles.tileSubline}>
              Go live, share your stage location, and accept direct fan tips without costly subscription fees or equipment.
            </p>
            <div className={styles.buttonRow}>
              <Link href="/creator/onboarding" className={`${styles.pillButton} ${styles.btnWhite}`}>
                Join as Solo Musician
              </Link>
              <button
                type="button"
                className={`${styles.pillButton} ${styles.btnOutlineWhite}`}
                onClick={(e) => openRoleChooser('musician', e.currentTarget)}
              >
                Learn more
              </button>
            </div>
          </div>
          <div className={styles.tileVisualContainer}>
            <img
              src="/landing/apple/tile_solo.jpg"
              alt="Solo musician with guitar on stage under warm spotlight"
              className={styles.tileImage}
              loading="lazy"
              width={640}
              height={480}
            />
          </div>
        </div>

        {/* ── ROW 1, TILE 2: Bands ──────────────────────────────────────── */}
        <div id="tile-bands" className={`${styles.tile} ${styles.tileDark}`}>
          <div className={styles.tileContent}>
            <p className={styles.eyebrow}>Bands & Ensembles</p>
            <h3 className={styles.tileTitle}>Together. Heard.</h3>
            <p className={styles.tileSubline}>
              Check in as a band, broadcast your gig to nearby fans on the map, and receive unified payouts via Stripe Connect.
            </p>
            <div className={styles.buttonRow}>
              <Link href="/band/onboarding" className={`${styles.pillButton} ${styles.btnWhite}`}>
                Join as Band
              </Link>
              <button
                type="button"
                className={`${styles.pillButton} ${styles.btnOutlineWhite}`}
                onClick={(e) => openRoleChooser('musician', e.currentTarget)}
              >
                Learn more
              </button>
            </div>
          </div>
          <div className={styles.tileVisualContainer}>
            <img
              src="/landing/apple/tile_band.jpg"
              alt="Four-piece indie rock band collaborating with intense energy on a live concert stage"
              className={styles.tileImage}
              loading="lazy"
              width={640}
              height={480}
            />
          </div>
        </div>

        {/* ── ROW 2, TILE 3: Fans ───────────────────────────────────────── */}
        <div id="tile-fans" className={`${styles.tile} ${styles.tileLight}`}>
          <div className={styles.tileContent}>
            <p className={styles.eyebrow}>Fans & Audiences</p>
            <h3 className={styles.tileTitle}>Be more than someone in the crowd.</h3>
            <p className={styles.tileSubline}>
              Discover independent talent near you, follow artists on tour, and support the local music scene directly.
            </p>
            <div className={styles.buttonRow}>
              <Link href="/discover" className={`${styles.pillButton} ${styles.btnBlack}`}>
                Start discovering
              </Link>
              <button
                type="button"
                className={`${styles.pillButton} ${styles.btnOutlineBlack}`}
                onClick={(e) => openRoleChooser('all', e.currentTarget)}
              >
                Fan benefits
              </button>
            </div>
          </div>
          <div className={styles.tileVisualContainer}>
            <img
              src="/landing/apple/tile_fans.jpg"
              alt="Enthusiastic music fans laughing and smiling together in an intimate venue crowd"
              className={styles.tileImage}
              loading="lazy"
              width={640}
              height={480}
            />
          </div>
        </div>

        {/* ── ROW 2, TILE 4: Simple Tipping ─────────────────────────────── */}
        <div id="tile-tipping" className={`${styles.tile} ${styles.tileWhite}`}>
          <div className={styles.tileContent}>
            <p className={styles.eyebrow}>Simple Tipping</p>
            <h3 className={styles.tileTitle}>A little support. A lasting impact.</h3>
            <p className={styles.tileSubline}>
              Direct tips with Apple Pay, Google Pay, or card. Transparent 6% platform fee with server-verified payouts.
            </p>
            <div className={styles.buttonRow}>
              <Link href="/tip/artist_maya_lin" className={`${styles.pillButton} ${styles.btnBlack}`}>
                Try tipping
              </Link>
              <a href="#discover" className={`${styles.textLink}`}>
                Find performers nearby &rarr;
              </a>
            </div>
          </div>
          <div className={styles.tileVisualContainer} style={{ padding: '0 20px', alignItems: 'center' }}>
            {/* Accurate composited product UI card */}
            <div className={styles.tippingMockupCard}>
              <div className={styles.tippingHeader}>
                <div
                  className={styles.tippingAvatar}
                  style={{
                    backgroundImage: 'url(/landing/apple/carousel_maya.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div>
                  <h4 className={styles.tippingArtistName}>
                    Maya Lin
                    <span className={styles.liveBadge}>
                      <span className={styles.liveDot} />
                      Live
                    </span>
                  </h4>
                  <span style={{ fontSize: '12px', color: '#6E6E73' }}>The Starlight Room • Acoustic Set</span>
                </div>
              </div>

              <div className={styles.presetRow} role="radiogroup" aria-label="Tip Amount Selection">
                {[5, 10, 20].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    role="radio"
                    aria-checked={selectedTip === amt}
                    className={`${styles.presetChip} ${selectedTip === amt ? styles.presetChipSelected : ''}`}
                    onClick={() => setSelectedTip(amt)}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className={styles.feeNotice}>
                Tip: ${selectedTip}.00 • Fee (6%): ${feeAmount} • Net: ${netAmount}
              </div>

              <Link href={`/tip/artist_maya_lin?amount=${selectedTip * 100}`} className={styles.applePayButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.02-.49 2.63-1.24z"/>
                </svg>
                Send ${selectedTip}.00 with Apple Pay
              </Link>
            </div>
          </div>
        </div>

        {/* ── ROW 3, TILE 5: Campaigns ──────────────────────────────────── */}
        <div id="tile-campaigns" className={`${styles.tile} ${styles.tileLight}`}>
          <div className={styles.tileContent}>
            <p className={styles.eyebrow}>Crowdfunding & Vinyl</p>
            <h3 className={styles.tileTitle}>Help the next chapter happen.</h3>
            <p className={styles.tileSubline}>
              Support vinyl pressings, tours, and studio albums directly with your favourite independent performers.
            </p>
            <div className={styles.buttonRow}>
              <Link href="/creator/studio" className={`${styles.pillButton} ${styles.btnBlack}`}>
                Explore campaigns
              </Link>
              <Link href="/discover" className={`${styles.pillButton} ${styles.btnOutlineBlack}`}>
                Featured projects
              </Link>
            </div>
          </div>
          <div className={styles.tileVisualContainer}>
            <img
              src="/landing/apple/tile_campaign.jpg"
              alt="Analog recording studio with musician holding guitar, mixing console, and vinyl records"
              className={styles.tileImage}
              loading="lazy"
              width={640}
              height={480}
            />
          </div>
        </div>

        {/* ── ROW 3, TILE 6: Music Community ────────────────────────────── */}
        <div id="tile-community" className={`${styles.tile} ${styles.tileDark}`}>
          <div className={styles.tileContent}>
            <p className={styles.eyebrow}>Community</p>
            <h3 className={styles.tileTitle}>Great music starts with people showing up.</h3>
            <p className={styles.tileSubline}>
              Independent venues, local musicians, and passionate fans coming together to build authentic music culture.
            </p>
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={`${styles.pillButton} ${styles.btnWhite}`}
                onClick={(e) => openRoleChooser('all', e.currentTarget)}
              >
                Join the community
              </button>
              <Link href="/discover" className={`${styles.pillButton} ${styles.btnOutlineWhite}`}>
                Explore stages
              </Link>
            </div>
          </div>
          <div className={styles.tileVisualContainer}>
            <img
              src="/landing/apple/tile_community.jpg"
              alt="Diverse group of music lovers and artists laughing and enjoying drinks together in a music lounge"
              className={styles.tileImage}
              loading="lazy"
              width={640}
              height={480}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default AppleBentoGrid;
