'use client';

/**
 * Section 3 — #how-it-works (Frontend B).
 * Two labeled 3-step sequences with code-rendered mini phone previews (illustrative).
 * Desktop: both groups visible as two rows. Mobile (<768px, JS on): accessible role
 * switcher (tablist) shows one group at a time. Without JS both groups render stacked.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './landing.module.css';
import s from './howItWorks.module.css';
import { useLanding } from './LandingContext';

type GroupKey = 'fans' | 'artists';

type Screen = 'discover' | 'choose' | 'sent' | 'profile' | 'qr' | 'cashout';

interface Step {
  title: string;
  body: string;
  screen: Screen;
}

const GROUPS: { key: GroupKey; tab: string; title: string; steps: Step[] }[] = [
  {
    key: 'fans',
    tab: 'Fans',
    title: 'For fans',
    steps: [
      {
        title: 'Discover on the map',
        body: 'Browse nearby solo musicians and bands or explore cities worldwide.',
        screen: 'discover',
      },
      {
        title: 'Choose a performer to tip',
        body: 'Select a performer from the map or scan their personal QR code.',
        screen: 'choose',
      },
      {
        title: 'Confirm and send support',
        body: 'Sign in when ready to confirm your tip directly to the performer.',
        screen: 'sent',
      },
    ],
  },
  {
    key: 'artists',
    tab: 'Solo musicians & bands',
    title: 'For solo musicians & bands',
    steps: [
      {
        title: 'Create your profile & payout setup',
        body: 'Set up your Solo Musician or Band profile and connect payouts through Stripe.',
        screen: 'profile',
      },
      {
        title: 'Go live & share your QR',
        body: 'Go live, share your performance location, and help nearby fans discover you. Share your QR code so fans can open your tipping page directly.',
        screen: 'qr',
      },
      {
        title: 'Receive tips and cash out',
        body: 'Follow tips as they arrive from nearby map discovery and QR scans, and cash out once eligible.',
        screen: 'cashout',
      },
    ],
  },
];

const MOBILE_QUERY = '(max-width: 767px)';

/* ── Mini phone screens (decorative; the step text carries the meaning) ── */

function Check({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Deterministic QR-like pattern (decorative only — not a scannable code). */
function QrPattern() {
  const cells = useMemo(() => {
    const n = 21;
    const out: [number, number][] = [];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    const inFinder = (x: number, y: number) =>
      (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!inFinder(x, y) && rnd() > 0.52) out.push([x, y]);
      }
    }
    return out;
  }, []);
  const finder = (x: number, y: number) => (
    <g key={`f${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="var(--l-card)" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" />
    </g>
  );
  return (
    <svg viewBox="-1 -1 23 23" className={s.qr} aria-hidden="true" shapeRendering="crispEdges">
      <rect x={-1} y={-1} width={23} height={23} fill="var(--l-card)" />
      {finder(0, 0)}
      {finder(14, 0)}
      {finder(0, 14)}
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
    </svg>
  );
}

function MiniScreen({ screen }: { screen: Screen }) {
  let content: React.ReactNode;
  switch (screen) {
    case 'discover':
      content = (
        <>
          <div className={s.mTitle}>Discover</div>
          <div className={s.mSearch}>
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Search a city
          </div>
          {[
            ['Performer', 'Acoustic'],
            ['Band', 'Indie rock'],
          ].map(([name, genre], i) => (
            <div key={name} className={`${s.mRow} ${i === 0 ? s.mRowOn : ''}`}>
              <span className={s.mAvatar} />
              <span className={s.mRowText}>
                <span className={s.mStrong}>{name}</span>
                <span className={s.mMuted}>{genre}</span>
              </span>
              <span className={s.mChevron}>›</span>
            </div>
          ))}
        </>
      );
      break;
    case 'choose':
      content = (
        <>
          <div className={s.mTitle}>Send a tip</div>
          <div className={s.mChips}>
            {['$5', '$10', '$20'].map((a, i) => (
              <span key={a} className={`${s.mChip} ${i === 1 ? s.mChipOn : ''} ${styles.num}`}>
                {a}
              </span>
            ))}
          </div>
          <div className={s.mField}>Add a note (optional)</div>
          <div className={s.mBtn}>Confirm</div>
          <div className={`${s.mMuted} ${s.mCenter}`}>Payment by Stripe</div>
        </>
      );
      break;
    case 'sent':
      content = (
        <div className={s.mDone}>
          <span className={s.mDoneIcon}>
            <Check size={22} />
          </span>
          <span className={s.mDoneTitle}>Tip sent</span>
          <span className={s.mMuted}>Thanks for supporting live music.</span>
          <span className={s.mBubble}>“Loved the set!”</span>
        </div>
      );
      break;
    case 'profile':
      content = (
        <>
          <div className={s.mProfile}>
            <span className={`${s.mAvatar} ${s.mAvatarLg}`} />
            <span className={s.mRowText}>
              <span className={s.mStrong}>Your profile</span>
              <span className={s.mMuted}>Solo or band</span>
            </span>
          </div>
          <ul className={s.mList}>
            <li>
              <span className={`${s.mTick} ${s.mTickOn}`}>
                <Check size={10} />
              </span>
              Profile details
            </li>
            <li>
              <span className={`${s.mTick} ${s.mTickOn}`}>
                <Check size={10} />
              </span>
              Payout setup
            </li>
            <li>
              <span className={s.mTick} />
              Verification
              <span className={s.mPill}>In review</span>
            </li>
          </ul>
        </>
      );
      break;
    case 'qr':
      content = (
        <>
          <div className={s.mLiveRow}>
            <span className={s.mStrong}>Go live</span>
            <span className={s.mSwitch}>
              <span />
            </span>
          </div>
          <div className={s.mQrWrap}>
            <QrPattern />
          </div>
          <div className={`${s.mMuted} ${s.mCenter}`}>Share your QR</div>
        </>
      );
      break;
    case 'cashout':
      content = (
        <>
          <div className={s.mMuted}>Balance</div>
          <div className={`${s.mBalance} ${styles.num}`}>$15.00</div>
          <div className={s.mTipRow}>
            <span>Tip received</span>
            <span className={styles.num}>+ $10</span>
          </div>
          <div className={s.mTipRow}>
            <span>Tip received</span>
            <span className={styles.num}>+ $5</span>
          </div>
          <div className={`${s.mBtn} ${s.mBtnGhost}`}>Cash out when eligible</div>
        </>
      );
      break;
  }
  return (
    <div className={s.phone} aria-hidden="true">
      <div className={s.phoneBar}>
        <span />
      </div>
      <div className={s.phoneBody}>{content}</div>
    </div>
  );
}

export function HowItWorksSection() {
  const { openRoleChooser } = useLanding();
  const [active, setActive] = useState<GroupKey>('fans');
  const [isMobile, setIsMobile] = useState(false);
  const tabRefs = useRef<Record<GroupKey, HTMLButtonElement | null>>({ fans: null, artists: null });

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const onTabKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    const keys = GROUPS.map((g) => g.key);
    const idx = keys.indexOf(active);
    let next: GroupKey | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = keys[(idx + 1) % keys.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = keys[(idx - 1 + keys.length) % keys.length];
    else if (e.key === 'Home') next = keys[0];
    else if (e.key === 'End') next = keys[keys.length - 1];
    if (next) {
      e.preventDefault();
      setActive(next);
      tabRefs.current[next]?.focus();
    }
  }, [active]);

  const tabsOn = isMobile; // only true after hydration on small screens

  return (
    <section id="how-it-works" className={styles.section} aria-labelledby="how-it-works-title">
      <div className={styles.container}>
        <header className={s.head}>
          <p className={styles.eyebrow}>How it works</p>
          <h2 id="how-it-works-title" className={styles.h2}>
            A few simple steps. A real connection.
          </h2>
          <p className={`${styles.lead} ${s.lead}`}>
            Whether you’re in the crowd or on stage, here’s how support gets from one to the other.
          </p>
        </header>

        <div className={s.tabsRow} hidden={!tabsOn}>
          <div role="tablist" aria-label="Show steps for" className={s.tablist}>
            {GROUPS.map((g) => (
              <button
                key={g.key}
                ref={(el) => {
                  tabRefs.current[g.key] = el;
                }}
                type="button"
                role="tab"
                id={`hiw-tab-${g.key}`}
                aria-selected={active === g.key}
                aria-controls={`hiw-panel-${g.key}`}
                tabIndex={active === g.key ? 0 : -1}
                className={s.tab}
                onClick={() => setActive(g.key)}
                onKeyDown={onTabKeyDown}
              >
                {g.tab}
              </button>
            ))}
          </div>
        </div>

        <div className={s.previewRow}>
          <span className={styles.previewTag}>Preview</span>
          <span className={styles.meta}>Simplified screens for illustration.</span>
        </div>

        <div className={s.groups}>
          {GROUPS.map((g) => (
            <div
              key={g.key}
              id={`hiw-panel-${g.key}`}
              className={s.group}
              {...(tabsOn
                ? { role: 'tabpanel', 'aria-labelledby': `hiw-tab-${g.key}`, hidden: active !== g.key }
                : { role: 'group', 'aria-labelledby': `hiw-group-${g.key}` })}
            >
              <h3 id={`hiw-group-${g.key}`} className={`${s.groupTitle} ${tabsOn ? styles.srOnly : ''}`}>
                <span className={s.groupDot} aria-hidden="true" />
                {g.title}
              </h3>
              <ol className={s.steps}>
                {g.steps.map((step, i) => (
                  <li key={step.title} className={s.step}>
                    <MiniScreen screen={step.screen} />
                    <div className={s.stepText}>
                      <span className={`${s.stepNum} ${styles.num}`} aria-hidden="true">
                        {i + 1}
                      </span>
                      <div>
                        <h4 className={s.stepTitle}>
                          <span className={styles.srOnly}>Step {i + 1}: </span>
                          {step.title}
                        </h4>
                        <p className={styles.body}>{step.body}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              {g.key === 'artists' && (
                <ul className={s.caveats}>
                  <li className={styles.meta}>Artist verification is required before receiving tips and isn’t instant.</li>
                  <li className={styles.meta}>Cash-out timing depends on your account and Stripe payout status.</li>
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className={`${styles.ctaRow} ${s.ctas}`}>
          <a href="#discover" className={styles.btn}>
            Start discovering
          </a>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={(e) => openRoleChooser('musician', e.currentTarget)}
          >
            Create an artist profile
          </button>
        </div>
      </div>
    </section>
  );
}
