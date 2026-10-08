'use client';

/**
 * Section 5 — #build-your-next-chapter (canvas-alt). Owner: Frontend C.
 * One large Campaigns panel + two equal supporting panels (Following & updates, QR support).
 */
import React, { useEffect, useRef, useState } from 'react';
import styles from './landing.module.css';
import c from './chapter.module.css';
import { useLanding } from './LandingContext';

/** Lazy image that hides itself if the asset is missing, leaving the frame background visible. */
function FrameImg(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0 && el.currentSrc) setFailed(true);
  }, []);
  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- static export; alt passed via props
    <img
      ref={ref}
      {...props}
      onError={() => setFailed(true)}
      style={failed ? { visibility: 'hidden' } : undefined}
    />
  );
}

/** Decorative QR-like glyph (not a scannable code). */
function QrGlyph() {
  // 7x7 finder patterns at three corners + a fixed sprinkle of modules.
  const cells: Array<[number, number]> = [
    [9, 1], [11, 1], [12, 2], [9, 3], [10, 4], [12, 5], [9, 6], [11, 7],
    [1, 9], [3, 9], [4, 10], [6, 9], [7, 11], [2, 12], [5, 12],
    [9, 9], [10, 10], [12, 9], [11, 11], [13, 12], [9, 12], [10, 13], [13, 14],
    [15, 9], [17, 10], [16, 12], [18, 13], [15, 15], [17, 16], [19, 15],
    [9, 15], [11, 16], [10, 18], [12, 17], [13, 19], [9, 19],
    [15, 18], [18, 18], [16, 19], [19, 19], [15, 3], [14, 6], [13, 8],
  ];
  const finder = (x: number, y: number) => (
    <g key={`f${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x={x + 2} y={y + 2} width="3" height="3" rx="0.8" fill="currentColor" />
    </g>
  );
  return (
    <svg className={c.qr} viewBox="0 0 21 21" width="112" height="112" aria-hidden="true" focusable="false">
      {finder(0.5, 0.5)}
      {finder(13.5, 0.5)}
      {finder(0.5, 13.5)}
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" rx="0.25" fill="currentColor" />
      ))}
    </svg>
  );
}

function BellGlyph() {
  return (
    <svg className={c.icon} viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path
        d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16zM10 20.5a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NextChapterSection() {
  const { openRoleChooser } = useLanding();

  return (
    <section
      id="build-your-next-chapter"
      className={`${styles.section} ${styles.sectionAlt}`}
      aria-labelledby="build-your-next-chapter-title"
    >
      <div className={styles.container}>
        <div className={c.head}>
          <div className={c.headText}>
            <p className={styles.eyebrow}>Beyond one performance</p>
            <h2 id="build-your-next-chapter-title" className={`${styles.h2} ${c.title}`}>
              One performance can be the start of something bigger.
            </h2>
          </div>
          <p className={`${styles.lead} ${c.lead}`}>
            The people who stopped to listen can stay part of the story—through the next set, the next release and
            the goals that make them possible.
          </p>
        </div>

        <div className={c.grid}>
          {/* Main panel — Campaigns */}
          <article className={`${styles.card} ${c.main}`} aria-labelledby="chapter-campaigns-title">
            <div className={c.mediaWrap}>
            <div className={`${styles.imageFrame} ${c.mainMedia}`}>
              <FrameImg
                src="/landing/v3/chapter-1000.webp"
                srcSet="/landing/v3/chapter-1000.webp 1000w, /landing/v3/chapter-1600.webp 1600w"
                sizes="(min-width: 1240px) 680px, (min-width: 960px) 56vw, 100vw"
                width={1000}
                height={667}
                alt="A musician recording in a small studio, headphones on, working on new material"
                loading="lazy"
                decoding="async"
              />
            </div>
              <div className={c.preview} role="group" aria-label="Illustrative campaign preview">
                <div className={c.previewTop}>
                  <span className={styles.previewTag}>Preview</span>
                  <span className={c.previewKicker}>Campaign</span>
                </div>
                <p className={c.previewTitle}>Record the debut EP</p>
                <div className={c.bar} aria-hidden="true">
                  <span className={c.barFill} />
                </div>
                <p className={c.previewMeta}>Fans follow progress toward the goal</p>
              </div>
            </div>
            <div className={c.mainBody}>
              <p className={c.kicker}>Campaigns</p>
              <h3 id="chapter-campaigns-title" className={`${styles.h3} ${c.mainTitle}`}>
                Let fans help fund what you make next.
              </h3>
              <p className={`${styles.body} ${c.text}`}>
                Set a specific creative goal—a recording, a tour stop, new gear—and give your audience a clear way to
                back it.
              </p>
            </div>
          </article>

          {/* Supporting panels */}
          <div className={c.side}>
            <article className={`${styles.card} ${c.panel}`} aria-labelledby="chapter-follow-title">
              <span className={c.iconWrap}>
                <BellGlyph />
              </span>
              <div className={c.panelBody}>
                <p className={c.kicker}>Following &amp; updates</p>
                <h3 id="chapter-follow-title" className={styles.h3}>
                  Keep your community in the loop.
                </h3>
                <p className={`${styles.body} ${c.text}`}>
                  Fans who follow you can keep up with where you’re playing and what you’re working on.
                </p>
              </div>
            </article>

            <article className={`${styles.card} ${c.panel} ${c.panelQr}`} aria-labelledby="chapter-qr-title">
              <div className={c.panelBody}>
                <p className={c.kicker}>QR support</p>
                <h3 id="chapter-qr-title" className={styles.h3}>
                  From a live moment to a tip in one scan.
                </h3>
                <p className={`${styles.body} ${c.text}`}>
                  Your code takes fans straight to your profile, where they can follow or send a tip.
                </p>
              </div>
              <div className={c.qrWrap}>
                <QrGlyph />
              </div>
            </article>
          </div>
        </div>

        <div className={c.foot}>
          <button
            type="button"
            className={styles.btn}
            onClick={(e) => openRoleChooser('musician', e.currentTarget)}
          >
            Start your artist profile
          </button>
          <p className={styles.meta}>Free to join. Choose solo or band in the next step.</p>
        </div>
      </div>
    </section>
  );
}

export default NextChapterSection;
