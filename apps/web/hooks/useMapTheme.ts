'use client';

/**
 * useMapTheme — Crowdbeats Map Theme Hook (Phase 5)
 *
 * Detects system dark/light preference and exposes a manual override.
 * Used by map components to pass the correct theme to MapLibre.
 *
 * Usage:
 *   const { theme, setTheme, isSystem } = useMapTheme();
 *   // theme: 'dark' | 'light'
 *   // isSystem: true when following OS preference, false when overridden
 */

import { useState, useEffect, useCallback } from 'react';
import type { MapTheme } from '@/lib/maps/types';

// Server-side default: dark (matches Crowdbeats default)
const DEFAULT_THEME: MapTheme = 'dark';

export interface MapThemeState {
  /** Active theme: 'dark' | 'light' */
  theme: MapTheme;
  /** Manually set a theme override (ignores system preference). Pass null to restore system. */
  setTheme: (t: MapTheme | null) => void;
  /** True when theme follows OS preference (no manual override). */
  isSystem: boolean;
}

export function useMapTheme(initialOverride?: MapTheme | null): MapThemeState {
  // Start with dark (SSR-safe default) until we can read system preference
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(true);
  const [override, setOverride] = useState<MapTheme | null>(initialOverride ?? null);
  const [hasMounted, setHasMounted] = useState(false);

  // Detect system preference (client-side only)
  useEffect(() => {
    setHasMounted(true);
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mq.matches);

    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((t: MapTheme | null) => {
    setOverride(t);
  }, []);

  // Before hydration: use dark (prevents SSR mismatch)
  const theme: MapTheme = !hasMounted
    ? DEFAULT_THEME
    : (override ?? (systemPrefersDark ? 'dark' : 'light'));

  return { theme, setTheme, isSystem: override === null };
}

/**
 * useSystemTheme — lightweight version that only reads OS preference.
 * Does not support manual override.
 */
export function useSystemTheme(): MapTheme {
  const [prefersDark, setPrefersDark] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setPrefersDark(mq.matches);
    const h = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return prefersDark ? 'dark' : 'light';
}
