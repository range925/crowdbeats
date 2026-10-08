'use client';

/**
 * Landing v3 — "Join Crowdbeats" role chooser (Nav agent).
 * Accessible modal dialog: focus trap, Escape / backdrop / close button → onClose
 * (LandingV3 restores focus to the opener). Monochrome surface (white/black).
 */
import React, { useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import type { RoleChooserFilter } from './LandingContext';
import { rememberSignupIntent, signupHref, type SignupRole } from './signupIntent';
import l from './landing.module.css';
import s from './roleChooser.module.css';

export interface RoleChooserProps {
  open: boolean;
  filter: RoleChooserFilter;
  onClose: () => void;
}

/* ── Shared a11y helpers (also used by LandingHeader's mobile drawer) ─────── */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('hidden') && el.getClientRects().length > 0,
  );
}

/** Keeps Tab / Shift+Tab inside `container`. Call from a keydown handler. */
export function trapTab(e: KeyboardEvent | React.KeyboardEvent, container: HTMLElement | null): void {
  if (e.key !== 'Tab' || !container) return;
  const items = getFocusable(container);
  if (items.length === 0) {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (e.shiftKey && (active === first || !container.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !container.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}

/** Locks page scroll while mounted/active; restores the previous value. */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prev;
    };
  }, [active]);
}

/* ── Content ─────────────────────────────────────────────────────────────── */
const CHOICES: { role: SignupRole; title: string; desc: string }[] = [
  { role: 'fan', title: 'Fan', desc: 'Discover live music nearby, follow performers, and tip the moments you love.' },
  { role: 'solo', title: 'Solo musician', desc: 'Create your artist profile, share your QR at shows, and receive tips.' },
  { role: 'band', title: 'Band', desc: 'Give your band one shared profile, with tools for members and splits.' },
];

function Arrow() {
  return (
    <svg className={s.arrow} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RoleChooser({ open, filter, onClose }: RoleChooserProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const firstChoiceRef = useRef<HTMLAnchorElement>(null);
  const titleId = useId();
  const descId = useId();
  const isMusician = filter === 'musician';
  const isFan = filter === 'fan';

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => firstChoiceRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        trapTab(e, panelRef.current);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const choices = isMusician
    ? CHOICES.filter((c) => c.role !== 'fan')
    : isFan
      ? CHOICES.filter((c) => c.role === 'fan')
      : CHOICES;

  return (
    <div
      className={s.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={s.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        data-filter={filter}
      >
        <button type="button" className={s.close} onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h2 id={titleId} className={s.title}>
          {isMusician ? 'How do you perform?' : isFan ? 'Join Crowdbeats as a Fan' : 'How do you want to join?'}
        </h2>
        <p id={descId} className={s.subtitle}>
          {isMusician
            ? 'Joining is free. Choose the profile that fits how you play.'
            : isFan
              ? 'Joining is free. Discover live music, follow your favorite acts, and tip directly.'
              : 'Joining is free. You\u2019ll confirm your role on the next step.'}
        </p>

        <ul className={s.choices}>
          {choices.map((c, i) => (
            <li key={c.role}>
              <Link
                ref={i === 0 ? firstChoiceRef : undefined}
                href={signupHref(c.role)}
                className={s.choice}
                data-role={c.role}
                onClick={() => rememberSignupIntent(c.role)}
              >
                <span className={s.choiceText}>
                  <span className={s.choiceTitle}>{c.title}</span>
                  <span className={s.choiceDesc}>{c.desc}</span>
                  <span className={l.srOnly}> — Continues to sign up</span>
                </span>
                <Arrow />
              </Link>
            </li>
          ))}
        </ul>

        <div className={s.footer}>
          {!isMusician && !isFan && (
            <p className={s.quiet}>
              Joining as a sponsor or venue?{' '}
              <Link href={signupHref('sponsor')} className={s.quietLink} onClick={() => rememberSignupIntent('sponsor')}>
                Sponsor
              </Link>
              <span aria-hidden="true"> · </span>
              <Link href={signupHref('venue')} className={s.quietLink} onClick={() => rememberSignupIntent('venue')}>
                Venue
              </Link>
            </p>
          )}
          <p className={s.quiet}>
            Already have an account?{' '}
            <Link href="/auth" className={s.quietLink}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
