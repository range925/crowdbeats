/**
 * Crowdbeats V2 -- User Settings API Route
 *
 * GET  /api/user/settings  -- read settings from Firestore users/{uid}/settings/preferences
 * PATCH /api/user/settings -- merge-write partial settings update to Firestore
 *
 * Auth: reads __cb_session cookie (uid required, any persona allowed)
 * Firestore path: users/{uid}/settings/preferences
 * (already protected in firestore.rules: allow read,write: if isOwner(userId))
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

// Default settings (mirrors contracts defaults)
const DEFAULT_SETTINGS = {
  notifications: {
    tipsReceived: true,
    payoutsAndTransfers: true,
    campaignMilestones: true,
    followedArtistsLive: true,
    nearbyStageAlerts: true,
    newReleases: true,
    newFollowers: true,
    fanMessages: true,
    bandInvitations: true,
    pushNotificationsEnabled: true,
    emailDigestsEnabled: true,
    smsAlertsEnabled: false,
  },
  privacy: {
    locationPrecision: 'precise' as const,
    profileDiscoverableInRadar: true,
    defaultAnonymousTipping: false,
    shareListeningActivity: true,
    telemetryAndAnalyticsConsent: true,
  },
  tipping: {
    defaultCurrency: 'USD' as const,
    presetAmountsCents: [200, 500, 1000, 2000] as [number, number, number, number],
    allowQuickOneTapTipping: true,
    requireBiometricConfirmationOverCents: 5000,
  },
  security: {
    biometricLockEnabled: false,
    requireReauthForFinancials: true,
    sessionTimeoutMinutes: 1440,
  },
  blockedUserIds: [] as string[],
};

export async function GET(_request: NextRequest) {
  const session = await _getSession();
  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    _initAdmin();
    const db = getFirestore();
    const doc = await db
      .collection('users')
      .doc(session.uid)
      .collection('settings')
      .doc('preferences')
      .get();

    if (!doc.exists) {
      // Return defaults if no settings saved yet
      return NextResponse.json({ ...DEFAULT_SETTINGS, uid: session.uid });
    }

    return NextResponse.json({ uid: session.uid, ...doc.data() });
  } catch (err) {
    console.error('[/api/user/settings GET]', err);
    return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await _getSession();
  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Only allow writing known top-level keys
  const ALLOWED_KEYS = ['notifications', 'privacy', 'tipping', 'security', 'blockedUserIds'];
  const filteredBody: Record<string, unknown> = {};
  for (const key of ALLOWED_KEYS) {
    if (key in body) {
      filteredBody[key] = body[key];
    }
  }

  if (Object.keys(filteredBody).length === 0) {
    return NextResponse.json({ error: 'No valid fields in body' }, { status: 400 });
  }

  try {
    _initAdmin();
    const db = getFirestore();
    await db
      .collection('users')
      .doc(session.uid)
      .collection('settings')
      .doc('preferences')
      .set(
        {
          ...filteredBody,
          uid: session.uid,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/user/settings PATCH]', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
