'use client';

/**
 * Section 2 — #for-fans (Frontend B).
 * Editorial split: portrait image | numbered benefits + one illustrative preview card.
 * Copy limits follow FOUNDATION.md §5 (tip notes ≤ 200 chars, moderated; following exists).
 */
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './landing.module.css';
import s from './fans.module.css';
import { rememberSignupIntent, signupHref } from './signupIntent';

const BENEFITS = [
  {
    title: 'Find your favorites',
    body: 'Save and follow the performers you love so it’s easy to come back to their music.',
  },
  {
    title: 'Make your support personal',
    body: 'Send a tip with a short note — up to 200 characters, reviewed for safety.',
  },
  {
    title: 'Stay connected',
    body: 'Keep up with updates, shows and campaigns from the artists you follow, where they share them.',
  },
] as const;

const SAMPLE_NOTE = 'That last song made my night. Thank you!';
const SAMPLE_AMOUNTS = ['$5', '$10', '$20'] as const;

export function ForFansSection() {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgFailed, setImgFailed] = useState(false);

  // Static export: the image may 404 before hydration (onError would be missed).
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setImgFailed(true);
  }, []);

  return (
    <section id="for-fans" className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="for-fans-title">
      <div className={`${styles.container} ${s.grid}`}>
        <div className={s.media}>
          <div className={`${styles.imageFrame} ${s.frame}`}>
            {!imgFailed && (
              <img
                ref={imgRef}
                src="/landing/v3/fans-800.webp"
                srcSet="/landing/v3/fans-800.webp 800w, /landing/v3/fans-1400.webp 1400w"
                sizes="(min-width: 1240px) 560px, (min-width: 960px) 46vw, 100vw"
                width={800}
                height={1000}
                loading="lazy"
                decoding="async"
                alt="Fans cheering close to the stage while a musician performs live"
                onError={() => setImgFailed(true)}
              />
            )}
          </div>
        </div>

        <div className={s.copy}>
          <p className={styles.eyebrow}>For fans</p>
          <h2 id="for-fans-title" className={styles.h2}>
            Be more than someone in the crowd.
          </h2>
          <p className={`${styles.lead} ${s.lead}`}>
            Follow the artists who move you, show your support, and keep discovering what they do next.
          </p>

          <ol className={s.benefits}>
            {BENEFITS.map((b, i) => (
              <li key={b.title} className={s.benefit}>
                <span className={`${s.benefitNum} ${styles.num}`} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className={`${styles.h3} ${s.benefitTitle}`}>{b.title}</h3>
                  <p className={styles.body}>{b.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className={s.previewWrap}>
            <span className={styles.previewTag}>Preview</span>
            <div
              className={`${styles.card} ${s.preview}`}
              role="img"
              aria-label="Illustrative preview: following a performer and sending a tip with a short note."
            >
              <div className={s.pvRow}>
                <span className={s.pvAvatar} />
                <span className={s.pvWho}>
                  <span className={s.pvName}>Performer name</span>
                  <span className={s.pvSub}>Acoustic · Singer-songwriter</span>
                </span>
                <span className={s.pvFollow}>
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Following
                </span>
              </div>

              <div className={s.pvChips}>
                {SAMPLE_AMOUNTS.map((a, i) => (
                  <span key={a} className={`${s.pvChip} ${i === 1 ? s.pvChipOn : ''} ${styles.num}`}>
                    {a}
                  </span>
                ))}
              </div>

              <div className={s.pvNote}>
                <span className={s.pvNoteText}>{SAMPLE_NOTE}</span>
                <span className={`${s.pvCount} ${styles.num}`}>{SAMPLE_NOTE.length}/200</span>
              </div>

              <span className={s.pvSend}>Send tip</span>
            </div>
          </div>

          <div className={s.ctaBlock}>
            <p className={`${styles.meta} ${s.access}`}>
              Browsing performers is free and open to everyone. Following and tipping need a free fan account.
            </p>
            <div className={styles.ctaRow}>
              <Link href={signupHref('fan')} onClick={() => rememberSignupIntent('fan')} className={styles.btn}>
                Join as a fan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
