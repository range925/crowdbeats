/**
 * Crowdbeats V2 — Route Guard Unit Tests (Phase 5)
 *
 * Tests the pure computeRouteGuard() function — no Next.js runtime needed.
 * Covers:
 *  - UI hiding (unauthenticated can't reach protected routes)
 *  - Direct URL access (authenticated users redirected from auth pages)
 *  - All persona route guards
 *  - Account settings guard
 *  - Band member routing to /artist
 *  - Persona mismatch redirects
 *  - Public routes always pass
 *
 * "Test UI hiding and direct URL/callable/data access independently" — Phase 5 spec
 */

import { computeRouteGuard, type SessionData } from '../../lib/routeGuard';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NO_SESSION: null = null;

const UNVERIFIED_SESSION: SessionData = {
  uid: 'uid-1', personaType: null, emailVerified: false, onboarded: false,
};

const VERIFIED_SESSION: SessionData = {
  uid: 'uid-1', personaType: null, emailVerified: true, onboarded: false,
};

const FAN_SESSION: SessionData = {
  uid: 'uid-1', personaType: 'fan', emailVerified: true, onboarded: true,
};

const ARTIST_SESSION: SessionData = {
  uid: 'uid-1', personaType: 'artist', emailVerified: true, onboarded: true,
};

const BAND_SESSION: SessionData = {
  uid: 'uid-1', personaType: 'band_member', emailVerified: true, onboarded: true,
};

const VENUE_SESSION: SessionData = {
  uid: 'uid-1', personaType: 'venue_manager', emailVerified: true, onboarded: true,
};

const SPONSOR_SESSION: SessionData = {
  uid: 'uid-1', personaType: 'sponsor_rep', emailVerified: true, onboarded: true,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function next(pathname: string, session: SessionData | null = NO_SESSION) {
  return computeRouteGuard(pathname, session);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('computeRouteGuard', () => {

  // ── Public routes ─────────────────────────────────────────────────────────

  describe('public routes', () => {
    const PUBLIC = ['/', '/about', '/gallery', '/_next/static/js/main.js', '/favicon.ico', '/api/health'];

    PUBLIC.forEach(path => {
      it(`passes ${path} with no session`, () => {
        expect(next(path, NO_SESSION)).toEqual({ action: 'next' });
      });
      it(`passes ${path} with full fan session`, () => {
        expect(next(path, FAN_SESSION)).toEqual({ action: 'next' });
      });
    });
  });

  // ── /auth/* ───────────────────────────────────────────────────────────────

  describe('/auth/* — must not be signed in', () => {
    it('allows unauthenticated user to /auth', () => {
      expect(next('/auth', NO_SESSION)).toEqual({ action: 'next' });
    });

    it('redirects fully-authed fan away from /auth → /fan', () => {
      expect(next('/auth', FAN_SESSION)).toEqual({ action: 'redirect', destination: '/fan' });
    });

    it('redirects fully-authed artist away from /auth → /creator/dashboard', () => {
      expect(next('/auth', ARTIST_SESSION)).toEqual({ action: 'redirect', destination: '/creator/dashboard' });
    });

    it('redirects fully-authed venue_manager away from /auth → /venue', () => {
      expect(next('/auth', VENUE_SESSION)).toEqual({ action: 'redirect', destination: '/venue' });
    });

    it('redirects fully-authed sponsor_rep away from /auth → /sponsor', () => {
      expect(next('/auth', SPONSOR_SESSION)).toEqual({ action: 'redirect', destination: '/sponsor' });
    });

    it('redirects unverified-but-authed user from /auth → /auth/verify-email', () => {
      expect(next('/auth', UNVERIFIED_SESSION)).toEqual({ action: 'redirect', destination: '/auth/verify-email' });
    });

    it('redirects verified-but-unonboarded user from /auth → /onboarding', () => {
      expect(next('/auth', VERIFIED_SESSION)).toEqual({ action: 'redirect', destination: '/onboarding' });
    });
  });

  // ── /auth/verify-email ────────────────────────────────────────────────────

  describe('/auth/verify-email', () => {
    it('allows unverified user', () => {
      expect(next('/auth/verify-email', UNVERIFIED_SESSION)).toEqual({ action: 'next' });
    });

    it('allows unauthenticated (shows login)', () => {
      // Falls through to /auth/* → redirect check — has no session, passes
      expect(next('/auth/verify-email', NO_SESSION)).toEqual({ action: 'next' });
    });
  });

  // ── /onboarding/* ─────────────────────────────────────────────────────────

  describe('/onboarding/* — must be authed + verified + unonboarded', () => {
    it('redirects unauthenticated to /auth', () => {
      expect(next('/onboarding', NO_SESSION)).toEqual({ action: 'redirect', destination: '/auth' });
    });

    it('redirects unverified to /auth/verify-email', () => {
      expect(next('/onboarding', UNVERIFIED_SESSION)).toEqual({ action: 'redirect', destination: '/auth/verify-email' });
    });

    it('allows verified + unonboarded user', () => {
      expect(next('/onboarding', VERIFIED_SESSION)).toEqual({ action: 'next' });
    });

    it('allows /onboarding/persona for unonboarded', () => {
      expect(next('/onboarding/persona', VERIFIED_SESSION)).toEqual({ action: 'next' });
    });

    it('redirects already-onboarded fan away from /onboarding → /fan', () => {
      expect(next('/onboarding', FAN_SESSION)).toEqual({ action: 'redirect', destination: '/fan' });
    });

    it('redirects already-onboarded artist away from /onboarding → /creator/dashboard', () => {
      expect(next('/onboarding', ARTIST_SESSION)).toEqual({ action: 'redirect', destination: '/creator/dashboard' });
    });
  });

  // ── /fan/* ────────────────────────────────────────────────────────────────

  describe('/fan/* — requires fan persona', () => {
    it('allows fan session', () => {
      expect(next('/fan', FAN_SESSION)).toEqual({ action: 'next' });
    });

    it('allows /fan/tips for fan', () => {
      expect(next('/fan/tips', FAN_SESSION)).toEqual({ action: 'next' });
    });

    it('blocks unauthenticated → /auth', () => {
      expect(next('/fan', NO_SESSION)).toEqual({ action: 'redirect', destination: '/auth' });
    });

    it('blocks unverified → /auth/verify-email', () => {
      expect(next('/fan', UNVERIFIED_SESSION)).toEqual({ action: 'redirect', destination: '/auth/verify-email' });
    });

    it('blocks unonboarded → /onboarding', () => {
      expect(next('/fan', VERIFIED_SESSION)).toEqual({ action: 'redirect', destination: '/onboarding' });
    });

    it('redirects artist from /fan → /creator/dashboard (persona mismatch)', () => {
      expect(next('/fan', ARTIST_SESSION)).toEqual({ action: 'redirect', destination: '/creator/dashboard' });
    });

    it('redirects venue_manager from /fan → /venue (persona mismatch)', () => {
      expect(next('/fan', VENUE_SESSION)).toEqual({ action: 'redirect', destination: '/venue' });
    });
  });

  // ── /artist/* ─────────────────────────────────────────────────────────────

  describe('/artist/* — redirects to /creator/dashboard', () => {
    it('redirects artist session to /creator/dashboard', () => {
      expect(next('/artist', ARTIST_SESSION)).toEqual({ action: 'redirect', destination: '/creator/dashboard' });
    });

    it('redirects band_member session to /creator/dashboard', () => {
      expect(next('/artist', BAND_SESSION)).toEqual({ action: 'redirect', destination: '/creator/dashboard' });
    });

    it('redirects fan to /creator/dashboard', () => {
      expect(next('/artist', FAN_SESSION)).toEqual({ action: 'redirect', destination: '/creator/dashboard' });
    });

    it('redirects unauthenticated to /creator/dashboard', () => {
      expect(next('/artist', NO_SESSION)).toEqual({ action: 'redirect', destination: '/creator/dashboard' });
    });
  });

  // ── /venue/* ──────────────────────────────────────────────────────────────

  describe('/venue/* — requires venue_manager persona', () => {
    it('allows venue_manager', () => {
      expect(next('/venue', VENUE_SESSION)).toEqual({ action: 'next' });
    });

    it('blocks fan from /venue → /fan', () => {
      expect(next('/venue', FAN_SESSION)).toEqual({ action: 'redirect', destination: '/fan' });
    });

    it('blocks unauthenticated → /auth', () => {
      expect(next('/venue', NO_SESSION)).toEqual({ action: 'redirect', destination: '/auth' });
    });
  });

  // ── /sponsor/* ────────────────────────────────────────────────────────────

  describe('/sponsor/* — requires sponsor_rep persona', () => {
    it('allows sponsor_rep', () => {
      expect(next('/sponsor', SPONSOR_SESSION)).toEqual({ action: 'next' });
    });

    it('blocks artist from /sponsor → /creator/dashboard', () => {
      expect(next('/sponsor', ARTIST_SESSION)).toEqual({ action: 'redirect', destination: '/creator/dashboard' });
    });
  });

  // ── /account/* ────────────────────────────────────────────────────────────

  describe('/account/* — requires authenticated + onboarded', () => {
    it('allows fully-authed fan', () => {
      expect(next('/account', FAN_SESSION)).toEqual({ action: 'next' });
    });

    it('allows /account/settings for artist', () => {
      expect(next('/account/settings', ARTIST_SESSION)).toEqual({ action: 'next' });
    });

    it('blocks unauthenticated → /auth', () => {
      expect(next('/account', NO_SESSION)).toEqual({ action: 'redirect', destination: '/auth' });
    });

    it('blocks unverified → /auth/verify-email', () => {
      expect(next('/account', UNVERIFIED_SESSION)).toEqual({ action: 'redirect', destination: '/auth/verify-email' });
    });

    it('blocks unonboarded → /onboarding', () => {
      expect(next('/account', VERIFIED_SESSION)).toEqual({ action: 'redirect', destination: '/onboarding' });
    });
  });

  // ── Direct URL / no-session attack ────────────────────────────────────────

  describe('Direct URL access with no session (security)', () => {
    const PROTECTED = [
      '/fan', '/fan/tips', '/creator/dashboard', '/venue', '/sponsor',
      '/onboarding', '/onboarding/persona', '/onboarding/fan',
      '/account', '/account/settings',
    ];

    PROTECTED.forEach(path => {
      it(`blocks direct URL access to ${path} with no session → /auth`, () => {
        const result = computeRouteGuard(path, null);
        expect(result.action).toBe('redirect');
        expect((result as { action: string; destination: string }).destination).toBe('/auth');
      });
    });

    it('redirects direct URL access to /artist to /creator/dashboard', () => {
      const result = computeRouteGuard('/artist', null);
      expect(result).toEqual({ action: 'redirect', destination: '/creator/dashboard' });
    });
  });

  // ── Protected /creator and /admin routes (Change Set 2) ───────────────────

  describe('/creator/* — creator studio guard', () => {
    it('blocks unauthenticated access to /creator → /auth', () => {
      expect(next('/creator/dashboard', NO_SESSION)).toEqual({ action: 'redirect', destination: '/auth' });
    });

    it('allows artist session to /creator/dashboard', () => {
      expect(next('/creator/dashboard', ARTIST_SESSION)).toEqual({ action: 'next' });
    });

    it('allows band_member session to /creator/dashboard', () => {
      expect(next('/creator/dashboard', BAND_SESSION)).toEqual({ action: 'next' });
    });

    it('redirects fan session away from /creator → /fan', () => {
      expect(next('/creator/dashboard', FAN_SESSION)).toEqual({ action: 'redirect', destination: '/fan' });
    });
  });

  describe('/admin/* — enterprise admin guard', () => {
    it('blocks unauthenticated access to /admin → /auth', () => {
      expect(next('/admin/command-center', NO_SESSION)).toEqual({ action: 'redirect', destination: '/auth' });
    });

    it('allows authenticated session to enter admin layout (layout verifies staff role)', () => {
      expect(next('/admin/command-center', ARTIST_SESSION)).toEqual({ action: 'next' });
    });
  });

  // ── Cookie malformation (null/empty session) ──────────────────────────────

  describe('malformed / empty session', () => {
    it('treats null session as unauthenticated', () => {
      expect(next('/fan', null)).toEqual({ action: 'redirect', destination: '/auth' });
    });
  });
});
