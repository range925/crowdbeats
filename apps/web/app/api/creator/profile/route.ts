/**
 * Crowdbeats V2 -- Creator Profile API Route
 *
 * GET  /api/creator/profile  -- read artist/band profile from Firestore
 * PATCH /api/creator/profile -- update artist/band EPK fields in Firestore
 *
 * Auth: __cb_session cookie, persona must be artist or band_member
 * Firestore paths:
 *   artists (artistId == uid for solo artists)
 *   bands   (founderUid == uid for band founders -- not yet implemented fully)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function _initAdmin() {
  if (getApps().length > 0) return;
  initializeApp({ credential: applicationDefault() });
}

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

const CREATOR_PERSONAS = new Set(['artist', 'band_member']);

// Fields allowed for client-side updates (server-only fields excluded)
const ALLOWED_ARTIST_UPDATE_KEYS = new Set([
  'stageName', 'bio', 'tagline', 'originCity', 'instruments',
  'influences', 'accolades', 'audioPreviewUrl', 'featuredTrackTitle',
  'showFanWall', 'genres', 'socialLinks', 'photoUrl', 'coverUrl',
]);

export async function GET(_request: NextRequest) {
  const session = await _getSession();
  if (!session?.uid || !CREATOR_PERSONAS.has(session.personaType)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    _initAdmin();
    const db = getFirestore();

    // Try artistProfiles first (solo artist)
    const artistDoc = await db.collection('artistProfiles').doc(session.uid).get();
    if (artistDoc.exists) {
      const data = artistDoc.data()!;
      // Strip server-only fields before returning
      const { totalTipsReceivedCents: _, stripeAccountId: __, bankLinked: ___, ...safe } = data as Record<string, unknown>;
      return NextResponse.json({ profileType: 'artist', ...safe });
    }

    // Not found -- return empty skeleton
    return NextResponse.json({ profileType: 'artist', artistId: session.uid, ownerUid: session.uid });
  } catch (err) {
    console.error('[/api/creator/profile GET]', err);
    return NextResponse.json({ error: 'Failed to read profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await _getSession();
  if (!session?.uid || !CREATOR_PERSONAS.has(session.personaType)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Filter to only allowed update keys
  const filteredBody: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_ARTIST_UPDATE_KEYS.has(key)) {
      filteredBody[key] = value;
    }
  }

  if (Object.keys(filteredBody).length === 0) {
    return NextResponse.json({ error: 'No valid profile fields in body' }, { status: 400 });
  }

  // Field length validation
  if (typeof filteredBody.bio === 'string' && filteredBody.bio.length > 1000) {
    return NextResponse.json({ error: 'Bio exceeds 1000 character limit' }, { status: 400 });
  }
  if (typeof filteredBody.stageName === 'string' && filteredBody.stageName.length > 80) {
    return NextResponse.json({ error: 'Stage name exceeds 80 character limit' }, { status: 400 });
  }
  if (typeof filteredBody.tagline === 'string' && filteredBody.tagline.length > 140) {
    return NextResponse.json({ error: 'Tagline exceeds 140 character limit' }, { status: 400 });
  }

  try {
    _initAdmin();
    const db = getFirestore();

    await db.collection('artistProfiles').doc(session.uid).set(
      {
        ...filteredBody,
        artistId: session.uid,
        ownerUid: session.uid,
        updatedAt: new Date().toISOString(),
        v: 2,
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/creator/profile PATCH]', err);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
