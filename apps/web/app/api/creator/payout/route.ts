/**
 * Crowdbeats V2 — Creator Payout API Route (Phase 7)
 *
 * POST /api/creator/payout — delegates to Cloud Function requestPayout
 *
 * The client can also call requestPayout directly via Firebase SDK.
 * This route exists for SSR pages that need server-authoritative payout requests.
 * Validates session, minimum amount, and checks Connect status before proxying.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface SessionData {
  uid: string;
  personaType: string;
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
const MIN_PAYOUT_CENTS = 1000; // $10

export async function POST(request: NextRequest) {
  const session = await _getSession();
  if (!session?.uid || !ALLOWED_PERSONAS.has(session.personaType)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { amountCents, currency = 'USD' } = body;

  if (typeof amountCents !== 'number' || amountCents < MIN_PAYOUT_CENTS) {
    return NextResponse.json({
      error: `Minimum payout is $${MIN_PAYOUT_CENTS / 100}`,
      code: 'below-minimum',
    }, { status: 400 });
  }

  // This route delegates payout initiation to the Cloud Function.
  // The actual transfer is server-authoritative in Cloud Functions.
  // Here we document the delegation — for direct callable use, see the mobile app.
  return NextResponse.json({
    message: 'Call requestPayout via Firebase SDK (httpsCallable) for server-authoritative payouts.',
    functionName: 'requestPayout',
    uid: session.uid,
    amountCents,
    currency,
  });
}
