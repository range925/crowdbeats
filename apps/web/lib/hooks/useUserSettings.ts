'use client';

/**
 * Crowdbeats V2 -- useUserSettings hook
 *
 * Dual-write strategy:
 *   1. On mount: load from localStorage immediately (instant), then fetch from
 *      /api/user/settings (Firestore wins if data exists there).
 *   2. On update: write to local state + localStorage immediately (optimistic),
 *      then fire-and-forget PATCH /api/user/settings.
 *
 * localStorage keys are all uid-scoped to prevent cross-account bleed.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  PrivacyPreferences,
  DEFAULT_PRIVACY_PREFERENCES,
  TippingPreferences,
  DEFAULT_TIPPING_PREFERENCES,
  SecurityPreferences,
  DEFAULT_SECURITY_PREFERENCES,
} from '@crowdbeats/contracts';

function persistToFirestore(partial: {
  notifications?: NotificationPreferences;
  privacy?: PrivacyPreferences;
  tipping?: TippingPreferences;
  security?: SecurityPreferences;
}) {
  // Fire-and-forget: do not block UI on network
  fetch('/api/user/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial),
  }).catch(() => {
    // Silent fail -- localStorage is the offline cache
  });
}

export function useUserSettings() {
  const auth = useAuth();
  const uid = auth.uid;

  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [privacy, setPrivacy] = useState<PrivacyPreferences>(DEFAULT_PRIVACY_PREFERENCES);
  const [tipping, setTipping] = useState<TippingPreferences>(DEFAULT_TIPPING_PREFERENCES);
  const [security, setSecurity] = useState<SecurityPreferences>(DEFAULT_SECURITY_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    // Step 1: Load from localStorage immediately for instant display
    if (typeof window !== 'undefined') {
      const savedNotifs = localStorage.getItem(`cb_notifs_${uid}`);
      if (savedNotifs) {
        try { setNotifications(JSON.parse(savedNotifs)); } catch (_) {}
      }
      const savedPriv = localStorage.getItem(`cb_priv_${uid}`);
      if (savedPriv) {
        try { setPrivacy(JSON.parse(savedPriv)); } catch (_) {}
      }
      const savedTipping = localStorage.getItem(`cb_tipping_${uid}`);
      if (savedTipping) {
        try { setTipping(JSON.parse(savedTipping)); } catch (_) {}
      }
      const savedSecurity = localStorage.getItem(`cb_security_${uid}`);
      if (savedSecurity) {
        try { setSecurity(JSON.parse(savedSecurity)); } catch (_) {}
      }
    }
    setLoading(false);

    // Step 2: Hydrate from Firestore (wins if server data exists)
    fetch('/api/user/settings')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data: {
        notifications?: Partial<NotificationPreferences>;
        privacy?: Partial<PrivacyPreferences>;
        tipping?: Partial<TippingPreferences>;
        security?: Partial<SecurityPreferences>;
      }) => {
        if (data.notifications) setNotifications((prev) => ({ ...prev, ...data.notifications }));
        if (data.privacy) setPrivacy((prev) => ({ ...prev, ...data.privacy }));
        if (data.tipping) setTipping((prev) => ({ ...prev, ...data.tipping }));
        if (data.security) setSecurity((prev) => ({ ...prev, ...data.security }));
        setIsSynced(true);
        setSyncError(null);
      })
      .catch((err: Error) => {
        // Non-fatal: localStorage data is still shown
        setSyncError(err.message);
        setIsSynced(false);
      });
  }, [uid]);

  const updateNotifications = useCallback((updated: Partial<NotificationPreferences>) => {
    setNotifications((prev) => {
      const next = { ...prev, ...updated };
      if (typeof window !== 'undefined' && uid) {
        localStorage.setItem(`cb_notifs_${uid}`, JSON.stringify(next));
      }
      persistToFirestore({ notifications: next });
      return next;
    });
  }, [uid]);

  const updatePrivacy = useCallback((updated: Partial<PrivacyPreferences>) => {
    setPrivacy((prev) => {
      const next = { ...prev, ...updated };
      if (typeof window !== 'undefined' && uid) {
        localStorage.setItem(`cb_priv_${uid}`, JSON.stringify(next));
      }
      persistToFirestore({ privacy: next });
      return next;
    });
  }, [uid]);

  const updateTipping = useCallback((updated: Partial<TippingPreferences>) => {
    setTipping((prev) => {
      const next = { ...prev, ...updated };
      if (typeof window !== 'undefined' && uid) {
        localStorage.setItem(`cb_tipping_${uid}`, JSON.stringify(next));
      }
      persistToFirestore({ tipping: next });
      return next;
    });
  }, [uid]);

  const updateSecurity = useCallback((updated: Partial<SecurityPreferences>) => {
    setSecurity((prev) => {
      const next = { ...prev, ...updated };
      if (typeof window !== 'undefined' && uid) {
        localStorage.setItem(`cb_security_${uid}`, JSON.stringify(next));
      }
      persistToFirestore({ security: next });
      return next;
    });
  }, [uid]);

  return {
    notifications,
    privacy,
    tipping,
    security,
    loading,
    isSynced,
    syncError,
    updateNotifications,
    updatePrivacy,
    updateTipping,
    updateSecurity,
  };
}
