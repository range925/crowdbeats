/**
 * Crowdbeats V2 — Unified User Profile API Route
 *
 * GET  /api/user/profile — Read full profile across users/{uid} and persona document
 * PATCH /api/user/profile — Update general and persona-specific fields with validation
 *
 * Auth: Requires valid __cb_session cookie.
 * Invariant: Never allows changing immutable roles or server-only financial fields.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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

// Allowlisted fields for users/{uid} updates
const ALLOWED_USER_FIELDS = new Set([
  'displayName',
  'username',
  'bio',
  'tagline',
  'pronouns',
  'city',
  'genres',
  'instruments',
  'musicInterests',
  'website',
  'socialLinks',
  'publicProfileVisible',
  'performanceType',
  'availability',
  'bookingPreference',
  'musicStyle',
  'orgName',
  'industry',
  'sponsorInterests',
  'rosterPreview',
]);

export async function GET(_request: NextRequest) {
  const session = await _getSession();
  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    _initAdmin();
    const db = getFirestore();
    const uid = session.uid;

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    let personaData: Record<string, any> = {};

    if (session.personaType === 'artist') {
      const artistDoc = await db.collection('artistProfiles').doc(uid).get();
      if (artistDoc.exists) personaData = artistDoc.data() || {};
    } else if (session.personaType === 'fan') {
      const fanDoc = await db.collection('fanProfiles').doc(uid).get();
      if (fanDoc.exists) personaData = fanDoc.data() || {};
    } else if (session.personaType === 'band_member') {
      // Find band where user is member or founder
      const bandsSnap = await db.collection('bands').where('founderUid', '==', uid).limit(1).get();
      if (!bandsSnap.empty) {
        personaData = bandsSnap.docs[0].data() || {};
      }
    } else if (session.personaType === 'sponsor' || session.personaType === 'sponsor_rep') {
      const sponsorSnap = await db.collection('sponsorOrgs').where('adminUid', '==', uid).limit(1).get();
      if (!sponsorSnap.empty) {
        personaData = sponsorSnap.docs[0].data() || {};
      }
    }

    return NextResponse.json({
      uid,
      personaType: session.personaType,
      user: userData,
      persona: personaData,
    });
  } catch (err: any) {
    console.error('[/api/user/profile GET] Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve profile data.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await _getSession();
  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    // Validate and sanitize allowed fields
    for (const [k, v] of Object.entries(body)) {
      if (!ALLOWED_USER_FIELDS.has(k)) continue;

      if (k === 'displayName' || k === 'username' || k === 'city' || k === 'pronouns' || k === 'orgName' || k === 'industry') {
        if (typeof v === 'string') updates[k] = v.slice(0, 100).trim();
      } else if (k === 'bio') {
        if (typeof v === 'string') updates[k] = v.slice(0, 600).trim();
      } else if (k === 'tagline') {
        if (typeof v === 'string') updates[k] = v.slice(0, 140).trim();
      } else if (k === 'website') {
        if (typeof v === 'string') updates[k] = v.slice(0, 200).trim();
      } else if (k === 'publicProfileVisible') {
        updates[k] = Boolean(v);
      } else if (k === 'genres' || k === 'instruments' || k === 'musicInterests' || k === 'sponsorInterests') {
        if (Array.isArray(v)) {
          updates[k] = v.slice(0, 20).map((item) => String(item).slice(0, 40));
        }
      } else if (k === 'rosterPreview') {
        if (Array.isArray(v)) {
          updates[k] = v.slice(0, 30).map((m: any) => ({
            name: String(m.name || '').slice(0, 100),
            instrument: String(m.instrument || '').slice(0, 60),
            role: String(m.role || '').slice(0, 60),
            uid: m.uid ? String(m.uid).slice(0, 128) : undefined,
            photoUrl: m.photoUrl ? String(m.photoUrl).slice(0, 500) : undefined,
          }));
        }
      } else if (k === 'socialLinks') {
        if (typeof v === 'object' && v !== null) {
          const links: Record<string, string> = {};
          for (const [platform, url] of Object.entries(v)) {
            if (typeof url === 'string') links[platform] = url.slice(0, 250);
          }
          updates[k] = links;
        }
      } else {
        updates[k] = v;
      }
    }

    _initAdmin();
    const db = getFirestore();
    const uid = session.uid;
    const now = FieldValue.serverTimestamp();
    updates.updatedAt = now;

    // 1. Update users/{uid}
    await db.collection('users').doc(uid).set(updates, { merge: true });

    // 2. Dual-write to persona document
    if (session.personaType === 'artist') {
      const artistUpdates: Record<string, any> = { updatedAt: now };
      if (updates.displayName) artistUpdates.stageName = updates.displayName;
      if (updates.bio !== undefined) artistUpdates.bio = updates.bio;
      if (updates.tagline !== undefined) artistUpdates.tagline = updates.tagline;
      if (updates.city !== undefined) artistUpdates.originCity = updates.city;
      if (updates.genres !== undefined) artistUpdates.genres = updates.genres;
      if (updates.instruments !== undefined) artistUpdates.instruments = updates.instruments;
      if (updates.socialLinks !== undefined) artistUpdates.socialLinks = updates.socialLinks;
      await db.collection('artistProfiles').doc(uid).set(artistUpdates, { merge: true });
    } else if (session.personaType === 'fan') {
      const fanUpdates: Record<string, any> = { updatedAt: now };
      if (updates.displayName) fanUpdates.displayName = updates.displayName;
      if (updates.bio !== undefined) fanUpdates.bio = updates.bio;
      await db.collection('fanProfiles').doc(uid).set(fanUpdates, { merge: true });
    } else if (session.personaType === 'band_member') {
      const bandsSnap = await db.collection('bands').where('founderUid', '==', uid).limit(1).get();
      if (!bandsSnap.empty) {
        const bandUpdates: Record<string, any> = { updatedAt: now };
        if (updates.displayName) bandUpdates.name = updates.displayName;
        if (updates.bio !== undefined) bandUpdates.bio = updates.bio;
        if (updates.tagline !== undefined) bandUpdates.tagline = updates.tagline;
        if (updates.city !== undefined) bandUpdates.originCity = updates.city;
        if (updates.genres !== undefined) bandUpdates.genres = updates.genres;
        if (updates.socialLinks !== undefined) bandUpdates.socialLinks = updates.socialLinks;
        if (updates.rosterPreview !== undefined) bandUpdates.rosterPreview = updates.rosterPreview;
        await bandsSnap.docs[0].ref.set(bandUpdates, { merge: true });
      }
    } else if (session.personaType === 'sponsor' || session.personaType === 'sponsor_rep') {
      const sponsorSnap = await db.collection('sponsorOrgs').where('adminUid', '==', uid).limit(1).get();
      if (!sponsorSnap.empty) {
        const sponsorUpdates: Record<string, any> = { updatedAt: now };
        if (updates.orgName || updates.displayName) sponsorUpdates.name = updates.orgName || updates.displayName;
        if (updates.bio !== undefined) sponsorUpdates.description = updates.bio;
        if (updates.website !== undefined) sponsorUpdates.website = updates.website;
        if (updates.industry !== undefined) sponsorUpdates.industry = updates.industry;
        await sponsorSnap.docs[0].ref.set(sponsorUpdates, { merge: true });
      }
    }

    return NextResponse.json({
      success: true,
      updatedFields: Object.keys(updates),
    });
  } catch (err: any) {
    console.error('[/api/user/profile PATCH] Error:', err);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
