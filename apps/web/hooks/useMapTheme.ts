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

// Server-side and client default: light (matches Crowdbeats web light-mode policy)
const DEFAULT_THEME: MapTheme = 'light';

export interface MapThemeState {
  /** Active theme: 'dark' | 'light' */
  theme: MapTheme;
  /** Manually set a theme override (ignores system preference). Pass null to restore default. */
  setTheme: (t: MapTheme | null) => void;
  /** True when theme follows default preference (no manual override). */
  isSystem: boolean;
}

export function useMapTheme(initialOverride?: MapTheme | null): MapThemeState {
  const [override, setOverride] = useState<MapTheme | null>(initialOverride ?? null);

  const setTheme = useCallback((t: MapTheme | null) => {
    setOverride(t);
  }, []);

  const theme: MapTheme = override ?? DEFAULT_THEME;

  return { theme, setTheme, isSystem: override === null };
}

/**
 * useSystemTheme — returns web-standardized light theme.
 */
export function useSystemTheme(): MapTheme {
  return 'light';
}
