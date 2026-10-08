'use client';

import React from 'react';
import Link from 'next/link';
import styles from './appleLanding.module.css';

export function AppleConnectionSection() {
  return (
    <>
      <div id="how-it-works" style={{ scrollMarginTop: '80px' }} aria-hidden="true" />
      <section id="connection" style={{ scrollMarginTop: '80px' }} className={`${styles.section} ${styles.connectionSection}`} aria-labelledby="connection-title">
        <div className={styles.readableContainer}>
          <div className={styles.connectionInner}>
            <p className={styles.eyebrow}>Live Moments</p>
            <h2 id="connection-title" className={styles.headline} style={{ color: '#000000' }}>
              Great music.{' '}
              <br />
              Real connection.
            </h2>
            <p className={styles.subheadline} style={{ color: '#000000' }}>
              Discover independent performers, follow their creative journey, and support the music you love right from your phone.
            </p>
            <div className={styles.buttonRow}>
              <Link href="/discover" className={`${styles.pillButton} ${styles.btnBlack}`}>
                Explore the community
              </Link>
              <a href="#tile-tipping" className={`${styles.pillButton} ${styles.btnOutlineBlack}`}>
                How tipping works
              </a>
            </div>

          <div className={styles.connectionImageFrame}>
            <img
              src="/landing/apple/connection_stage.jpg"
              alt="Charismatic musician singing at a keyboard and connecting intimately with a cheering, diverse audience in a live music venue"
              className={styles.connectionImage}
              loading="lazy"
              width={1320}
              height={742}
            />
          </div>
        </div>
      </div>
    </section>
  </>
);
}

export default AppleConnectionSection;
