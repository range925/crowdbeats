/**
 * Crowdbeats V2 — Next.js Route Guard Middleware (Phase 5)
 *
 * Runs on the edge before every request.
 * Reads the Firebase session cookie (set client-side after login).
 * Cookie name: __cb_session
 *
 * Route guard matrix:
 * - /auth/*        → must NOT be authenticated (redirect to dashboard)
 * - /auth/verify-email → must be signed in + unverified
 * - /onboarding/*  → must be authenticated + verified + unonboarded
 * - /account/*     → must be authenticated + onboarded (account settings, deletion)
 * - /fan/*         → must be authenticated + personaType=fan
 * - /artist/*      → must be authenticated + personaType=artist|band_member
 * - /venue/*       → must be authenticated + personaType=venue_manager
 * - /sponsor/*     → must be authenticated + personaType=sponsor_rep
 * - Everything else → public
 *
 * Expired/revoked sessions: client-side token probe clears cookie → redirect
 * lands here → no session cookie → redirect to /auth (no special edge handling needed).
 *
 * IMPORTANT: Session cookie has NO server-side signature verification in Phase 5.
 * Phase 6+ adds firebase-admin verifySessionCookie() in an API route.
 */

import { NextRequest, NextResponse } from 'next/server';
import { computeRouteGuard, type SessionData } from './lib/routeGuard';

const SESSION_COOKIE = '__cb_session';

function readSession(req: NextRequest): SessionData | null {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as SessionData;
  } catch {
    return null;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = readSession(req);

  const result = computeRouteGuard(pathname, session);

  if (result.action === 'redirect') {
    return NextResponse.redirect(new URL(result.destination, req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
