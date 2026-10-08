/**
 * Crowdbeats V2 — Session Cookie Manager (Phase 5)
 *
 * Sets/clears the __cb_session cookie that the middleware reads.
 * This is a lightweight dev-only session cookie. Not server-verified in Phase 5.
 * Phase 6+ will use firebase-admin verifySessionCookie() in an API Route.
 *
 * Cookie is:
 * - HttpOnly: false (must be readable by edge middleware in Next.js config)
 * - SameSite: Lax
 * - Secure: false on localhost, true in production
 * - Max-Age: 3600 * 24 * 7 (7 days)
 */

export interface SessionData {
  uid: string;
  personaType: string | null;
  emailVerified: boolean;
  onboarded: boolean;
  platformRole?: string | null;
  displayName?: string | null;
  email?: string | null;
}

const SESSION_COOKIE = '__cb_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function setSessionCookie(data: SessionData): void {
  if (typeof document === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  const value = encodeURIComponent(JSON.stringify(data));
  document.cookie = [
    `${SESSION_COOKIE}=${value}`,
    `max-age=${MAX_AGE}`,
    'path=/',
    'samesite=lax',
    isSecure ? 'secure' : '',
  ].filter(Boolean).join('; ');
}

export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=; max-age=0; path=/; samesite=lax`;
}

export function getSessionCookie(): SessionData | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const rawCookie = match.slice(SESSION_COOKIE.length + 1);
  return parseSessionCookie(rawCookie);
}

export function validateSessionData(data: unknown): SessionData | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj['uid'] !== 'string' || obj['uid'].trim().length === 0) return null;
  const personaType = typeof obj['personaType'] === 'string' ? obj['personaType'] : null;
  const emailVerified = Boolean(obj['emailVerified']);
  const onboarded = Boolean(obj['onboarded']);
  const platformRole = typeof obj['platformRole'] === 'string' ? obj['platformRole'] : null;
  const displayName = typeof obj['displayName'] === 'string' ? obj['displayName'] : null;
  const email = typeof obj['email'] === 'string' ? obj['email'] : null;

  return {
    uid: obj['uid'],
    personaType,
    emailVerified,
    onboarded,
    platformRole,
    displayName,
    email,
  };
}

export function parseSessionCookie(rawCookie: string | undefined): SessionData | null {
  if (!rawCookie || typeof rawCookie !== 'string') return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(rawCookie));
    return validateSessionData(parsed);
  } catch {
    return null;
  }
}

