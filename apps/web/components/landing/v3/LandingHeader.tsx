'use client';

/**
 * Landing v3 — header (Nav agent).
 * Monochrome bar (white/black by theme), For Musicians disclosure dropdown,
 * mobile drawer (< 960px) with focus trap, and the Join Crowdbeats trigger.
 *
 * Note: the legacy `.cb-landing-root` wrapper has `overflow-x: hidden`, which makes it
 * a scroll container and would break `position: sticky`; the bar is therefore
 * `position: fixed` with an in-flow spacer of the same height (visually identical).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanding } from './LandingContext';
import { trapTab, useBodyScrollLock } from './RoleChooser';
import l from './landing.module.css';
import s from './header.module.css';

import { CrowdbeatsLogo } from '@/components/ui/CbLogo';

const MUSICIAN_ITEMS = [
  { href: '#solo-musicians', title: 'Solo musicians', desc: 'Your profile, QR tips, payouts' },
  { href: '#bands', title: 'Bands', desc: 'One identity for your band' },
];

const MENU_ID = 'cb-musicians-menu';
const DRAWER_ID = 'cb-mobile-drawer';

function Logo() {
  return <CrowdbeatsLogo variant="horizontal" height={26} surface="light" priority ariaHidden />;
}

function Chevron() {
  return (
    <svg className={s.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LandingHeader() {
  const { openRoleChooser } = useLanding();

  /* ── Desktop dropdown ─────────────────────────────────────────────────── */
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLLIElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const pendingFocus = useRef<number | null>(null);

  const openMenu = useCallback((focusIndex: number | null = null) => {
    pendingFocus.current = focusIndex;
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    if (pendingFocus.current !== null) {
      itemRefs.current[pendingFocus.current]?.focus();
      pendingFocus.current = null;
    }
    const onPointer = (e: PointerEvent) => {
      if (!menuWrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu(true);
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, closeMenu]);

  const onToggleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (menuOpen) itemRefs.current[0]?.focus();
      else openMenu(0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const last = MUSICIAN_ITEMS.length - 1;
      if (menuOpen) itemRefs.current[last]?.focus();
      else openMenu(last);
    }
  };

  const onItemKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
    const count = MUSICIAN_ITEMS.length;
    let next: number | null = null;
    if (e.key === 'ArrowDown') next = (index + 1) % count;
    else if (e.key === 'ArrowUp') next = (index - 1 + count) % count;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = count - 1;
    if (next !== null) {
      e.preventDefault();
      itemRefs.current[next]?.focus();
    }
  };

  const onMenuWrapBlur = (e: React.FocusEvent<HTMLLIElement>) => {
    const to = e.relatedTarget as Node | null;
    if (menuOpen && to && !e.currentTarget.contains(to)) setMenuOpen(false);
  };

  /* ── Mobile drawer ────────────────────────────────────────────────────── */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  useBodyScrollLock(drawerOpen);

  const closeDrawer = useCallback((restoreFocus: boolean) => {
    setDrawerOpen(false);
    if (restoreFocus) requestAnimationFrame(() => burgerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const raf = requestAnimationFrame(() => drawerCloseRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDrawer(true);
      } else if (e.key === 'Tab') {
        trapTab(e, drawerRef.current);
      }
    };
    const mq = window.matchMedia('(min-width: 960px)');
    const onMq = () => {
      if (mq.matches) setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
    };
  }, [drawerOpen, closeDrawer]);

  /** Drawer link: unlock scroll synchronously so the browser's hash jump isn't blocked. */
  const onDrawerLinkClick = () => {
    document.body.style.overflow = '';
    closeDrawer(false);
  };

  const onDrawerJoin = () => {
    closeDrawer(false);
    openRoleChooser('all', burgerRef.current);
  };

  return (
    <>
      <div className={s.spacer} aria-hidden="true" />
      <header id="cb-header" className={s.header}>
        <div className={s.inner}>
          <Link href="/" className={s.brand} aria-label="Crowdbeats home">
            <Logo />
          </Link>

          <nav className={s.nav} aria-label="Primary">
            <ul className={s.navList}>
              <li className={s.navItem}>
                <a href="#discover" className={s.navLink}>
                  Discover
                </a>
              </li>
              <li className={s.navItem}>
                <a href="#for-fans" className={s.navLink}>
                  For Fans
                </a>
              </li>
              <li ref={menuWrapRef} className={`${s.navItem} ${s.hasMenu}`} onBlur={onMenuWrapBlur}>
                <a href="#for-musicians" className={s.navLink} onClick={() => setMenuOpen(false)}>
                  For Musicians
                </a>
                <button
                  ref={toggleRef}
                  type="button"
                  className={s.menuToggle}
                  aria-expanded={menuOpen}
                  aria-controls={MENU_ID}
                  aria-label="Show musician options"
                  onClick={() => (menuOpen ? closeMenu() : openMenu())}
                  onKeyDown={onToggleKeyDown}
                >
                  <Chevron />
                </button>
                <div id={MENU_ID} className={s.dropdown} hidden={!menuOpen}>
                  <ul className={s.dropdownList}>
                    {MUSICIAN_ITEMS.map((item, i) => (
                      <li key={item.href}>
                        <a
                          ref={(el) => {
                            itemRefs.current[i] = el;
                          }}
                          href={item.href}
                          className={s.dropdownItem}
                          onKeyDown={(e) => onItemKeyDown(e, i)}
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className={s.dropdownTitle}>{item.title}</span>
                          <span className={s.dropdownDesc}>{item.desc}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
              <li className={s.navItem}>
                <a href="#how-it-works" className={s.navLink}>
                  How It Works
                </a>
              </li>
            </ul>
          </nav>

          <div className={s.actions}>
            <Link href="/auth" className={s.signIn}>
              Sign In
            </Link>
            <button
              type="button"
              className={`${l.btn} ${s.join}`}
              onClick={(e) => openRoleChooser('all', e.currentTarget)}
            >
              Join Crowdbeats
            </button>
            <button
              ref={burgerRef}
              type="button"
              className={s.burger}
              aria-expanded={drawerOpen}
              aria-controls={DRAWER_ID}
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setDrawerOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — same monochrome surface as the bar */}
      <div
        ref={drawerRef}
        id={DRAWER_ID}
        className={s.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cb-drawer-title"
        hidden={!drawerOpen}
      >
        <h2 id="cb-drawer-title" className={l.srOnly}>
          Site navigation
        </h2>
        <div className={s.drawerTop}>
          <Link href="/" className={s.brand} aria-label="Crowdbeats home" onClick={onDrawerLinkClick}>
            <Logo />
          </Link>
          <button
            ref={drawerCloseRef}
            type="button"
            className={s.burger}
            aria-label="Close menu"
            onClick={() => closeDrawer(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav aria-label="Mobile" className={s.drawerNav}>
          <ul className={s.drawerList}>
            <li>
              <a href="#discover" className={s.drawerLink} onClick={onDrawerLinkClick}>
                Discover
              </a>
            </li>
            <li>
              <a href="#for-fans" className={s.drawerLink} onClick={onDrawerLinkClick}>
                For Fans
              </a>
            </li>
            <li>
              <a href="#for-musicians" className={s.drawerLink} onClick={onDrawerLinkClick}>
                For Musicians
              </a>
              <ul className={s.drawerSubList}>
                {MUSICIAN_ITEMS.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className={`${s.drawerLink} ${s.drawerSubLink}`} onClick={onDrawerLinkClick}>
                      <span>{item.title}</span>
                      <span className={s.drawerSubDesc}>{item.desc}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <a href="#how-it-works" className={s.drawerLink} onClick={onDrawerLinkClick}>
                How It Works
              </a>
            </li>
          </ul>
        </nav>
        <div className={s.drawerActions}>
          <button type="button" className={`${l.btn} ${s.drawerBtn}`} onClick={onDrawerJoin}>
            Join Crowdbeats
          </button>
          <Link href="/auth" className={`${l.btnSecondary} ${s.drawerBtn}`} onClick={onDrawerLinkClick}>
            Sign In
          </Link>
        </div>
      </div>
    </>
  );
}
