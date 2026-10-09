/**
 * Crowdbeats V2 — Creator Connect API Route
 *
 * POST /api/creator/connect — creates/refreshes a Stripe Connect Express account link
 *
 * Calls Stripe directly using STRIPE_SECRET_KEY (no firebase-admin needed).
 * Session auth via __cb_session cookie.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface SessionData {
  uid: string;
  personaType: string;
  emailVerified: boolean;
  onboarded: boolean;
}

async function _getSession(): Promise<SessionData | null> {
  try {
    const raw = (await cookies()).get('__cb_session')?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as SessionData;
  } catch {
    return null;
  }
}

const ALLOWED_PERSONAS = new Set(['artist', 'band_member']);
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ?? '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://crowdbeats-01.web.app';

export async function GET() {
  const session = await _getSession();
  if (!session?.uid || !ALLOWED_PERSONAS.has(session.personaType)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ requiresAction: true, actionType: 'create_account', chargesEnabled: false, payoutsEnabled: false });
}

export async function POST() {
  const session = await _getSession();
  if (!session?.uid || !ALLOWED_PERSONAS.has(session.personaType)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!STRIPE_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured on server' }, { status: 500 });
  }

  try {
    // 1. Create (or reuse) a Stripe Connect Express account for this uid
    //    In production, store/fetch the stripeAccountId from Firestore.
    //    For demo: create a new Express account keyed to the uid metadata.
    const accountRes = await fetch('https://api.stripe.com/v1/accounts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        type: 'express',
        country: 'US',
        'capabilities[card_payments][requested]': 'true',
        'capabilities[transfers][requested]': 'true',
        'metadata[crowdbeats_uid]': session.uid,
      }).toString(),
    });

    const account = await accountRes.json() as { id?: string; error?: { message: string } };
    if (!account.id) {
      return NextResponse.json({ error: account.error?.message ?? 'Failed to create Connect account' }, { status: 500 });
    }

    // 2. Create account link for onboarding
    const linkRes = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        account: account.id,
        refresh_url: `${APP_URL}/creator/payouts?connect=refresh`,
        return_url:  `${APP_URL}/creator/payouts?connect=success`,
        type: 'account_onboarding',
      }).toString(),
    });

    const link = await linkRes.json() as { url?: string; error?: { message: string } };
    if (!link.url) {
      return NextResponse.json({ error: link.error?.message ?? 'Failed to create account link' }, { status: 500 });
    }

    return NextResponse.json({ accountLinkUrl: link.url, accountId: account.id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
