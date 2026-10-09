'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './appleLanding.module.css';
import { useLanding } from '../v3/LandingContext';
import { signupHref, rememberSignupIntent } from '../v3/signupIntent';

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
              <Link
                href={signupHref('solo')}
                onClick={() => rememberSignupIntent('solo')}
                className={`${styles.pillButton} ${styles.btnWhite}`}
              >
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
              <Link
                href={signupHref('band')}
                onClick={() => rememberSignupIntent('band')}
                className={`${styles.pillButton} ${styles.btnWhite}`}
              >
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
                onClick={(e) => openRoleChooser('fan', e.currentTarget)}
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
              Direct tips with Google Pay or card. Transparent 6% platform fee with server-verified payouts.
            </p>
            <div className={styles.buttonRow}>
              <Link href="/tip/art_maya_lin" className={`${styles.pillButton} ${styles.btnBlack}`}>
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

              <Link href={`/tip/art_maya_lin?amount=${selectedTip * 100}`} className={styles.tipPayButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Send ${selectedTip}.00 Tip
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
              <Link href="/discover?tab=campaigns" className={`${styles.pillButton} ${styles.btnBlack}`}>
                Explore campaigns
              </Link>
              <Link href="/creator/campaigns" className={`${styles.pillButton} ${styles.btnOutlineBlack}`}>
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
