'use client';

/**
 * Section 6 — Trust and final invitation (#join).
 * Provides two clear audience choices (Listeners / Performers)
 * and a compact, honest trust/pricing row inside the section.
 * The original footer renders immediately below this.
 */
import React from 'react';
import Link from 'next/link';
import { useLanding } from './LandingContext';
import l from './landing.module.css';
import s from './join.module.css';

const TRUST_ITEMS = [
  {
    title: 'Free to join',
    body: 'Fans and musicians create accounts at no cost.',
  },
  {
    title: 'Payments by Stripe',
    body: 'Tips and payouts are processed securely through Stripe.',
  },
  {
    title: 'Review before you pay',
    body: 'See your tip amount and details before you confirm.',
  },
  {
    title: 'Reporting and support',
    body: 'Report a problem or reach our team at any time.',
  },
];

export function JoinSection() {
  const { openRoleChooser } = useLanding();

  return (
    <section id="join" className={l.section} aria-labelledby="join-title">
      <div className={l.container}>
        <div className={s.wrapper}>
          {/* Header */}
          <div className={s.header}>
            <p className={l.eyebrow}>Join Crowdbeats</p>
            <h2 id="join-title" className={`${l.h2} ${s.headline}`}>
              Great music starts with people showing up.
            </h2>
            <p className={`${l.lead} ${s.lead}`}>
              Find a live moment to love — or bring your own music to the community.
            </p>
          </div>

          {/* Audience Choice Cards */}
          <div className={s.choices}>
            {/* Listeners */}
            <div className={s.choiceCard}>
              <div className={s.choiceInfo}>
                <h3 className={s.choiceTitle}>For listeners</h3>
                <p className={s.choiceBody}>
                  Explore who’s playing nearby, discover emerging talent, and support the artists that move you.
                </p>
              </div>
              <div className={s.choiceAction}>
                <a href="#discover" className={l.btn}>
                  Discover music
                </a>
              </div>
            </div>

            {/* Performers */}
            <div className={s.choiceCard}>
              <div className={s.choiceInfo}>
                <h3 className={s.choiceTitle}>For performers</h3>
                <p className={s.choiceBody}>
                  Solo or band, set up your profile, share your QR on stage, and start receiving direct support.
                </p>
              </div>
              <div className={s.choiceAction}>
                <button
                  type="button"
                  className={l.btnSecondary}
                  onClick={(e) => openRoleChooser('musician', e.currentTarget)}
                >
                  Join as a musician
                </button>
              </div>
            </div>
          </div>

          {/* Trust Divider & Trust Grid */}
          <div className={s.trustDivider} aria-hidden="true" />

          <div className={s.trustGrid}>
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className={s.trustItem}>
                <div className={s.trustItemTitle}>{item.title}</div>
                <p className={s.trustItemBody}>{item.body}</p>
              </div>
            ))}
          </div>

          {/* Verified Fee Sentence & Legal Links */}
          <div className={s.feeBlock}>
            <p className={s.feeSentence}>
              Joining Crowdbeats is free. A 6% platform fee is deducted from each tip, and Stripe payment-processing fees also apply.
            </p>
            <nav aria-label="Trust and compliance links" className={s.legalLinks}>
              <Link href="/legal/creator-monetization" className={s.legalLink}>
                How fees work
              </Link>
              <Link href="/legal/refunds" className={s.legalLink}>
                Refunds &amp; disputes
              </Link>
              <Link href="/legal/report-abuse" className={s.legalLink}>
                Report a problem
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}

export default JoinSection;
