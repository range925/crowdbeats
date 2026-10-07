/**
 * Crowdbeats V2 — User Profile Image API Route
 *
 * POST /api/user/image
 * Updates the user's avatar image across Firestore users/{uid} and persona collections.
 *
 * Auth: Requires valid __cb_session cookie.
 * Invariant: Never allows unauthenticated or unauthorized writes to other users' avatars.
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

export async function POST(request: NextRequest) {
  const session = await _getSession();
  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      thumbnailUrl,
      cardUrl,
      fullUrl,
      thumbnailDataUrl,
      cardDataUrl,
      fullDataUrl,
      removePhoto,
    } = body;

    _initAdmin();
    const db = getFirestore();
    const uid = session.uid;
    const now = FieldValue.serverTimestamp();

    if (removePhoto) {
      // Remove photo from users/{uid}
      await db.collection('users').doc(uid).set(
        {
          photoUrl: null,
          photoVariants: null,
          updatedAt: now,
        },
        { merge: true }
      );

      // Update persona collections if present
      if (session.personaType === 'artist') {
        await db.collection('artistProfiles').doc(uid).set({ photoUrl: null, updatedAt: now }, { merge: true });
      } else if (session.personaType === 'fan') {
        await db.collection('fanProfiles').doc(uid).set({ photoUrl: null, updatedAt: now }, { merge: true });
      }

      return NextResponse.json({ success: true, removed: true });
    }

    const finalThumbnail = thumbnailUrl || thumbnailDataUrl;
    const finalCard = cardUrl || cardDataUrl;
    const finalFull = fullUrl || fullDataUrl;

    if (!finalCard && !finalThumbnail) {
      return NextResponse.json({ error: 'Invalid payload: No image data provided.' }, { status: 400 });
    }

    const primaryPhotoUrl = finalCard || finalThumbnail || finalFull;
    const photoVariants = {
      thumbnail: finalThumbnail || primaryPhotoUrl,
      card: finalCard || primaryPhotoUrl,
      full: finalFull || primaryPhotoUrl,
    };

    // 1. Update /users/{uid}
    await db.collection('users').doc(uid).set(
      {
        photoUrl: primaryPhotoUrl,
        photoVariants,
        updatedAt: now,
      },
      { merge: true }
    );

    // 2. Update persona profile document
    if (session.personaType === 'artist') {
      await db.collection('artistProfiles').doc(uid).set(
        {
          photoUrl: primaryPhotoUrl,
          updatedAt: now,
        },
        { merge: true }
      );
    } else if (session.personaType === 'fan') {
      await db.collection('fanProfiles').doc(uid).set(
        {
          photoUrl: primaryPhotoUrl,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    return NextResponse.json({
      success: true,
      photoUrl: primaryPhotoUrl,
      photoVariants,
    });
  } catch (err: any) {
    console.error('[/api/user/image] Error updating profile image:', err);
    return NextResponse.json({ error: 'Internal server error saving avatar asset.' }, { status: 500 });
  }
}
