'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getUserThemePreference,
  updateUserThemePreference,
} from '@/lib/firebase/firestore';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextType {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  setThemePreference: (pref: ThemePreference) => void;
  // Backward-compatible aliases
  theme: ResolvedTheme;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEME_STORAGE_KEY = 'crowdbeats-theme-preference';
export const LEGACY_THEME_STORAGE_KEY = 'crowdbeats_theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyThemeToDom(resolvedTheme: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', resolvedTheme);
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

function useOptionalAuth() {
  try {
    return useAuth();
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const auth = useOptionalAuth();
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  const [preference, setPreference] = useState<ThemePreference>('light');
  const [isMounted, setIsMounted] = useState(false);

  // Compute resolved theme — support dark, light, and system
  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (preference === 'dark') return 'dark';
    if (preference === 'light') return 'light';
    return systemTheme;
  }, [preference, systemTheme]);

  // Initial load from localStorage & setup OS listener
  useEffect(() => {
    setIsMounted(true);

    let initialPref: ThemePreference = 'light';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        initialPref = stored;
      }
    } catch {
      // LocalStorage access may fail in private mode
    }

    const sysTheme = getSystemTheme();
    setSystemTheme(sysTheme);
    setPreference(initialPref);
    const resolved = initialPref === 'system' ? sysTheme : initialPref;
    applyThemeToDom(resolved);
  }, []);

  // System theme dynamic listener
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    try {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    } catch {
      // Ignored in unsupported environments
    }
  }, []);

  // Sync preference with authenticated Firestore user profile
  useEffect(() => {
    const uid = auth?.uid;
    if (!uid) return;

    let isSubscribed = true;
    getUserThemePreference(uid)
      .then((cloudPref) => {
        if (!isSubscribed || !cloudPref) return;
        setPreference(cloudPref);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, cloudPref);
        } catch {}
      })
      .catch((err) => {
        console.warn('[ThemeProvider] Cloud theme sync error:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [auth?.uid]);

  // Apply DOM attributes on resolved theme change
  useEffect(() => {
    applyThemeToDom(resolvedTheme);
  }, [resolvedTheme]);

  const setThemePreference = useCallback(
    (newPref: ThemePreference) => {
      setPreference(newPref);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newPref);
      } catch {}

      // If user is authenticated, sync to Firestore
      if (auth?.uid) {
        updateUserThemePreference(auth.uid, newPref).catch((err) => {
          console.warn('[ThemeProvider] Failed to persist theme to Firestore:', err);
        });
      }
    },
    [auth?.uid]
  );

  // Backward compatibility methods
  const setTheme = useCallback(
    (newTheme: 'light' | 'dark') => {
      setThemePreference(newTheme);
    },
    [setThemePreference]
  );

  const toggleTheme = useCallback(() => {
    const next: ResolvedTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemePreference(next);
  }, [resolvedTheme, setThemePreference]);

  return (
    <ThemeContext.Provider
      value={{
        themePreference: preference,
        resolvedTheme,
        systemTheme,
        setThemePreference,
        theme: resolvedTheme,
        setTheme,
        toggleTheme,
      }}
    >
      <div
        className="cb-theme-transition"
        data-theme={resolvedTheme}
        style={{ minHeight: '100%' }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback safe context if used outside provider
    return {
      themePreference: 'light' as ThemePreference,
      resolvedTheme: 'light' as ResolvedTheme,
      systemTheme: 'light' as ResolvedTheme,
      setThemePreference: () => {},
      theme: 'light' as ResolvedTheme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
