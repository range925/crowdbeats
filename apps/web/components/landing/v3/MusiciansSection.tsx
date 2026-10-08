'use client';

/**
 * Section 4 — #for-musicians (always dark). Owner: Frontend C.
 * Contains two anchored editorial sub-blocks: #solo-musicians and #bands.
 */
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './landing.module.css';
import m from './musicians.module.css';
import { signupHref, rememberSignupIntent, type SignupRole } from './signupIntent';

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

interface Block {
  id: 'solo-musicians' | 'bands';
  role: Extract<SignupRole, 'solo' | 'band'>;
  kicker: string;
  title: string;
  body: string;
  benefits: string[];
  cta: string;
  primary: boolean;
  img: { base: string; w: number; h: number; alt: string; ratio: 'portrait' | 'landscape' };
}

const BLOCKS: Block[] = [
  {
    id: 'solo-musicians',
    role: 'solo',
    kicker: 'For solo performers',
    title: 'Solo musicians',
    body: 'A dedicated artist profile that travels with you—from busking on the street to headlining the main stage.',
    benefits: [
      'Appear in real time on the live geolocation map when you perform',
      'Personal QR code for an instant, direct tipping shortcut',
      'Public performer profile fans can discover, follow, and support worldwide',
      'Transparent, real-time visibility into all incoming tips',
      'Direct payouts to your bank account via Stripe once eligible',
    ],
    cta: 'Join as a solo musician',
    primary: true,
    img: {
      base: '/landing/v3/solo',
      w: 800,
      h: 1000,
      alt: 'A solo guitarist singing into a microphone under warm stage light',
      ratio: 'portrait',
    },
  },
  {
    id: 'bands',
    role: 'band',
    kicker: 'For groups & ensembles',
    title: 'Bands',
    body: 'Show up as one united act. Pin your band on the map, coordinate members, and split support transparently.',
    benefits: [
      'Band discovery on the live map whenever you perform together',
      'Shared band QR code for direct on-stage tipping from the crowd',
      'Single verified band identity with member roster coordination',
      'Built-in tip splitting tools configured across your entire lineup',
      'Connected Stripe payouts with clear group earnings accounting',
    ],
    cta: 'Create your band profile',
    primary: false,
    img: {
      base: '/landing/v3/band',
      w: 800,
      h: 600,
      alt: 'A band performing together on a small stage in front of an audience',
      ratio: 'landscape',
    },
  },
];

const WHY = [
  {
    title: 'Live map discovery',
    text: 'Go live at your performance location so nearby fans discover your set in real time.',
  },
  {
    title: 'Direct QR tipping',
    text: 'Display your personal or band QR code on stage as an instant shortcut for fans to open your tipping page.',
  },
  {
    title: 'Lasting connection',
    text: 'Turn live listeners into long-term followers across every city and venue you play.',
  },
];

function Check() {
  return (
    <svg className={m.check} viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="9.25" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M6 10.2l2.6 2.6L14 7.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MusiciansSection() {
  return (
    <section
      id="for-musicians"
      className={`${styles.section} ${styles.dark} ${m.section}`}
      aria-labelledby="for-musicians-title"
    >
      <div className={styles.container}>
        <header className={m.intro}>
          <p className={styles.eyebrow}>For musicians</p>
          <h2 id="for-musicians-title" className={`${styles.h2} ${m.title}`}>
            Bring your music. Build what comes next.
          </h2>
          <p className={`${styles.lead} ${m.lead}`}>
            Crowdbeats puts solo musicians and bands on the map for nearby fans to discover, with direct QR
            tipping shortcuts that turn live moments into lasting support.
          </p>
        </header>

        <ul className={m.why} aria-label="Why join Crowdbeats">
          {WHY.map((w) => (
            <li key={w.title} className={m.whyItem}>
              <span className={m.whyTitle}>{w.title}</span>
              <span className={m.whyText}>{w.text}</span>
            </li>
          ))}
        </ul>

        <div className={m.blocks}>
          {BLOCKS.map((b, i) => (
            <div
              key={b.id}
              id={b.id}
              className={`${styles.anchor} ${m.block} ${i % 2 === 1 ? m.blockReverse : ''}`}
            >
              <div className={`${styles.imageFrame} ${m.media} ${b.img.ratio === 'portrait' ? m.portrait : m.landscape}`}>
                <FrameImg
                  src={`${b.img.base}-800.webp`}
                  srcSet={`${b.img.base}-800.webp 800w, ${b.img.base}-1400.webp 1400w`}
                  sizes="(min-width: 1240px) 680px, (min-width: 960px) 55vw, 100vw"
                  width={b.img.w}
                  height={b.img.h}
                  alt={b.img.alt}
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className={m.copy}>
                <p className={m.kicker}>{b.kicker}</p>
                <h3 id={`${b.id}-title`} className={`${styles.h3} ${m.blockTitle}`}>
                  {b.title}
                </h3>
                <p className={`${styles.body} ${m.body}`}>{b.body}</p>
                <ul className={m.benefits}>
                  {b.benefits.map((x) => (
                    <li key={x}>
                      <Check />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
                <div className={styles.ctaRow}>
                  <Link
                    href={signupHref(b.role)}
                    className={b.primary ? styles.btn : styles.btnSecondary}
                    onClick={() => rememberSignupIntent(b.role)}
                  >
                    {b.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className={`${styles.meta} ${m.note}`}>
          Joining is free. Verification and payout setup are required before you can receive tips, and support from
          fans varies from performance to performance.
        </p>
      </div>
    </section>
  );
}

export default MusiciansSection;
