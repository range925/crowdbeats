'use client';

/**
 * Crowdbeats Landing v3 — integration root (lead-owned).
 *
 * Structure (FOUNDATION.md §2): header → hero → six sections → untouched CbFooter.
 * The outer `cb-landing-root` wrapper and its inline style are kept byte-identical
 * to the legacy landing so the footer inherits exactly the same properties.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { CbFooter } from '@/components/ui/CbFooter';
import styles from './landing.module.css';
import { LandingContext, type RoleChooserFilter } from './LandingContext';
import { LandingHeader } from './LandingHeader';
import { RoleChooser } from './RoleChooser';
import { AppleHeroSection } from '../apple/AppleHeroSection';
import { DiscoverSection } from './DiscoverSection';
import { AppleConnectionSection } from '../apple/AppleConnectionSection';
import { AppleBentoGrid } from '../apple/AppleBentoGrid';
import { AppleEditorialCarousel } from '../apple/AppleEditorialCarousel';
import { AppleMediaRail } from '../apple/AppleMediaRail';

export function LandingV3() {
  const [chooserOpen, setChooserOpen] = useState(false);
  const [chooserFilter, setChooserFilter] = useState<RoleChooserFilter>('all');
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const openRoleChooser = useCallback((filter: RoleChooserFilter = 'all', returnFocusTo?: HTMLElement | null) => {
    returnFocusRef.current =
      returnFocusTo ?? (typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null);
    setChooserFilter(filter);
    setChooserOpen(true);
  }, []);

  const closeRoleChooser = useCallback(() => {
    setChooserOpen(false);
    const el = returnFocusRef.current;
    if (el && typeof el.focus === 'function') {
      requestAnimationFrame(() => el.focus());
    }
  }, []);

  const ctx = useMemo(() => ({ openRoleChooser }), [openRoleChooser]);

  return (
    <div
      className="cb-landing-root"
      style={{
        backgroundColor: '#FCF8FB',
        color: '#1B1B1D',
        fontFamily: 'var(--font-inter, Inter, sans-serif)',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      <LandingContext.Provider value={ctx}>
        <div className={styles.root}>
          <a href="#main" className={`${styles.srOnly} ${styles.skipLink}`}>
            Skip to content
          </a>
          <LandingHeader />
          <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
            <AppleHeroSection />
            <DiscoverSection />
            <AppleConnectionSection />
            <AppleBentoGrid />
            <AppleEditorialCarousel />
            <AppleMediaRail />
          </main>
          <RoleChooser open={chooserOpen} filter={chooserFilter} onClose={closeRoleChooser} />
        </div>
      </LandingContext.Provider>

      {/* Protected footer — rendered exactly as before; do not wrap or restyle. */}
      <CbFooter />
    </div>
  );
}

export default LandingV3;
