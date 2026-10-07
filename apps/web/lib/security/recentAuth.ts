/**
 * Crowdbeats V2 — Recent Authentication (Step-Up) Service
 *
 * Enforces a strict 5-minute recent authentication window for sensitive operations:
 * - Email change
 * - Password change
 * - MFA / 2FA modifications
 * - Payout account changes (Stripe Express bank/card)
 * - Account privacy data export
 * - Account deletion
 *
 * Invariant: Never silently execute these operations without verifying authentication recency.
 */

export const RECENT_AUTH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const STORAGE_KEY = 'cb_last_recent_auth_timestamp';

let inMemoryTimestamp: number | null = null;

export function getRecentAuthTimestamp(): number | null {
  if (inMemoryTimestamp !== null) {
    return inMemoryTimestamp;
  }
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

export function isRecentAuthValid(): boolean {
  const timestamp = getRecentAuthTimestamp();
  if (!timestamp) return false;
  const elapsed = Date.now() - timestamp;
  return elapsed >= 0 && elapsed < RECENT_AUTH_WINDOW_MS;
}

export function getRecentAuthRemainingSeconds(): number {
  const timestamp = getRecentAuthTimestamp();
  if (!timestamp) return 0;
  const remainingMs = RECENT_AUTH_WINDOW_MS - (Date.now() - timestamp);
  return Math.max(0, Math.floor(remainingMs / 1000));
}

export function markRecentAuthSuccess(): void {
  const now = Date.now();
  inMemoryTimestamp = now;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(now));
      window.dispatchEvent(new CustomEvent('cb_recent_auth_updated', { detail: { timestamp: now } }));
    } catch {
      // non-fatal
    }
  }
}

export function invalidateRecentAuth(): void {
  inMemoryTimestamp = null;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('cb_recent_auth_updated', { detail: { timestamp: null } }));
    } catch {
      // non-fatal
    }
  }
}
