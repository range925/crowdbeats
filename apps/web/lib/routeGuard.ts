/**
 * Crowdbeats V2 — Route Guard Logic (testable pure function)
 *
 * Extracted from proxy.ts for unit testing without Next.js runtime.
 * Called by proxy() — DO NOT call from anywhere else.
 */

export interface SessionData {
  uid: string;
  personaType: string | null;
  emailVerified: boolean;
  onboarded: boolean;
}

export type GuardResult =
  | { action: 'next' }
  | { action: 'redirect'; destination: string };

/**
 * Pure route guard. Returns the action to take for a given pathname + session.
 * All redirect destinations are relative paths (no origin).
 */
export function computeRouteGuard(
  pathname: string,
  session: SessionData | null,
): GuardResult {
  const isAuthed    = !!session?.uid;
  const isVerified  = session?.emailVerified ?? false;
  const isOnboarded = session?.onboarded ?? false;
  const persona     = session?.personaType ?? null;

  // Always allow: static assets, API routes, gallery, Next internals, and public profiles
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/gallery') ||
    pathname === '/favicon.ico' ||
    /^\/artist\/[^/]+$/.test(pathname) ||
    /^\/band\/[^/]+$/.test(pathname) ||
    /^\/venue\/[^/]+$/.test(pathname)
  ) {
    return { action: 'next' };
  }

  // ── /auth/verify-email — exempt from general /auth/* redirect ───────────────
  // Must check BEFORE the /auth/* block below to avoid self-redirect loop.
  if (pathname === '/auth/verify-email') {
    // Fully authed → go to dashboard
    if (isAuthed && isVerified && isOnboarded && persona) {
      return { action: 'redirect', destination: `/${_toDashboardSlug(persona)}` };
    }
    return { action: 'next' };
  }

  // ── /auth/* — must NOT be signed in ───────────────────────────────────────
  if (pathname.startsWith('/auth')) {
    if (isAuthed && isVerified && isOnboarded && persona) {
      return { action: 'redirect', destination: `/${_toDashboardSlug(persona)}` };
    }
    if (isAuthed && isVerified && !isOnboarded) {
      return { action: 'redirect', destination: '/onboarding' };
    }
    if (isAuthed && !isVerified) {
      return { action: 'redirect', destination: '/auth/verify-email' };
    }
    return { action: 'next' };
  }

  // ── /onboarding/* — must be authed + verified + unonboarded ───────────────
  if (pathname.startsWith('/onboarding')) {
    if (!isAuthed) return { action: 'redirect', destination: '/auth' };
    if (!isVerified) return { action: 'redirect', destination: '/auth/verify-email' };
    if (isOnboarded && persona) {
      return { action: 'redirect', destination: `/${_toDashboardSlug(persona)}` };
    }
    return { action: 'next' };
  }

  // ── Protected persona dashboards ──────────────────────────────────────────
  const personaRoutes: Record<string, string[]> = {
    '/fan':     ['fan'],
    '/artist':  ['artist', 'band_member'],
    '/creator': ['artist', 'band_member'],
    '/venue':   ['venue_manager'],
    '/sponsor': ['sponsor_rep'],
  };

  for (const [prefix, allowedPersonas] of Object.entries(personaRoutes)) {
    if (pathname.startsWith(prefix)) {
      if (process.env.NODE_ENV === 'development' && (pathname.startsWith('/creator') || pathname.startsWith('/fan'))) {
        return { action: 'next' };
      }
      if (pathname === '/artist') {
        return { action: 'redirect', destination: '/creator/dashboard' };
      }
      if (!isAuthed) return { action: 'redirect', destination: '/auth' };
      if (!isVerified) return { action: 'redirect', destination: '/auth/verify-email' };
      if (!isOnboarded) return { action: 'redirect', destination: '/onboarding' };
      if (!persona || !allowedPersonas.includes(persona)) {
        return { action: 'redirect', destination: `/${_toDashboardSlug(persona ?? '')}` };
      }
      return { action: 'next' };
    }
  }

  // ── /admin/* — enterprise admin control plane (must be authed) ─────────────
  if (pathname.startsWith('/admin')) {
    if (!isAuthed) return { action: 'redirect', destination: '/auth' };
    return { action: 'next' };
  }

  // ── /account/* — account settings + deletion ──────────────────────────────
  if (pathname.startsWith('/account')) {
    if (!isAuthed) return { action: 'redirect', destination: '/auth' };
    if (!isVerified) return { action: 'redirect', destination: '/auth/verify-email' };
    if (!isOnboarded) return { action: 'redirect', destination: '/onboarding' };
    return { action: 'next' };
  }

  return { action: 'next' };
}

function _toDashboardSlug(personaType: string): string {
  switch (personaType) {
    case 'fan':           return 'fan';
    case 'artist':        return 'creator/dashboard';
    case 'venue_manager': return 'venue';
    case 'sponsor_rep':   return 'sponsor';
    case 'band_member':   return 'creator/dashboard';
    default:              return 'fan';
  }
}
