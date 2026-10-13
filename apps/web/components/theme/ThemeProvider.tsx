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
  // Web Theme Policy: Standardized approved light mode
  return 'light';
}

function applyThemeToDom(_resolvedTheme?: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  // Crowdbeats V2 — Standardized Web Light Mode Policy
  root.setAttribute('data-theme', 'light');
  root.dataset.theme = 'light';
  root.style.colorScheme = 'light';
  root.classList.remove('dark');
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
  const [preference, setPreference] = useState<ThemePreference>('light');

  // Compute resolved theme — locked to 'light' for web
  const resolvedTheme: ResolvedTheme = 'light';
  const systemTheme: ResolvedTheme = 'light';

  // Initial load: ensure light mode is applied to DOM and overwrite any legacy dark preferences
  useEffect(() => {
    applyThemeToDom('light');

    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      localStorage.setItem(LEGACY_THEME_STORAGE_KEY, 'light');
      localStorage.setItem('crowdbeats_admin_theme', 'light');
      localStorage.setItem('crowdbeats_theme', 'light');
    } catch {
      // LocalStorage access may fail in private mode
    }
  }, []);

  // Sync preference with authenticated Firestore user profile (for cross-platform profile integrity)
  // but NEVER allow cloud dark preference to activate web dark mode
  useEffect(() => {
    const uid = auth?.uid;
    if (!uid) return;

    let isSubscribed = true;
    getUserThemePreference(uid)
      .then((cloudPref) => {
        if (!isSubscribed || !cloudPref) return;
        // Keep web DOM light even if user has a dark preference stored from mobile
        applyThemeToDom('light');
      })
      .catch((err) => {
        console.warn('[ThemeProvider] Cloud theme sync error:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [auth?.uid]);

  // Apply DOM attributes on mount and updates
  useEffect(() => {
    applyThemeToDom('light');
  }, []);

  const setThemePreference = useCallback(
    (newPref: ThemePreference) => {
      // Web Theme Policy: Web stays light mode
      setPreference('light');
      try {
        localStorage.setItem(THEME_STORAGE_KEY, 'light');
      } catch {}

      // If user is authenticated, sync to Firestore for mobile native apps
      if (auth?.uid && newPref) {
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
    // Web stays light mode
    setThemePreference('light');
  }, [setThemePreference]);

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
        data-theme="light"
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
