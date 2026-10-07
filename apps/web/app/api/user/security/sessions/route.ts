/**
 * Crowdbeats V2 — Session Revocation API
 *
 * POST /api/user/security/sessions
 * Body: { action: 'revoke_one' | 'revoke_others' | 'revoke_all', sessionId?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body?.action;
    const targetSessionId = body?.sessionId;

    if (!action || !['revoke_one', 'revoke_others', 'revoke_all'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    _initAdmin();
    const db = getFirestore();
    const adminAuth = getAuth();
    const uid = session.uid;
    const now = FieldValue.serverTimestamp();

    if (action === 'revoke_one' && targetSessionId) {
      // Mark specific session revoked
      await db
        .collection('users')
        .doc(uid)
        .collection('sessions')
        .doc(targetSessionId)
        .set({ isRevoked: true, revokedAt: now }, { merge: true });

      // Log alert
      await db.collection('users').doc(uid).collection('securityAlerts').add({
        type: 'session_revoked',
        severity: 'info',
        title: 'Device Session Terminated',
        description: `Session (${targetSessionId}) was remotely terminated.`,
        timestamp: new Date().toISOString(),
        resolved: true,
      });

      return NextResponse.json({ success: true, action, targetSessionId });
    }

    if (action === 'revoke_others') {
      // Revoke all other sessions in Firestore
      const sessionsSnap = await db
        .collection('users')
        .doc(uid)
        .collection('sessions')
        .where('isRevoked', '==', false)
        .get();

      const batch = db.batch();
      sessionsSnap.docs.forEach((doc) => {
        if (doc.id !== 'current_web_session' && doc.id !== targetSessionId) {
          batch.update(doc.ref, { isRevoked: true, revokedAt: now });
        }
      });
      await batch.commit();

      // Revoke Firebase Refresh Tokens on server so other devices cannot refresh
      try {
        await adminAuth.revokeRefreshTokens(uid);
      } catch (e) {
        console.warn('revokeRefreshTokens non-fatal warning:', e);
      }

      await db.collection('users').doc(uid).collection('securityAlerts').add({
        type: 'session_revoked',
        severity: 'warning',
        title: 'All Other Sessions Signed Out',
        description: 'All active sessions except this current device have been invalidated.',
        timestamp: new Date().toISOString(),
        resolved: true,
      });

      return NextResponse.json({ success: true, action });
    }

    if (action === 'revoke_all') {
      // Revoke all sessions including current
      const sessionsSnap = await db
        .collection('users')
        .doc(uid)
        .collection('sessions')
        .where('isRevoked', '==', false)
        .get();

      const batch = db.batch();
      sessionsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, { isRevoked: true, revokedAt: now });
      });
      await batch.commit();

      try {
        await adminAuth.revokeRefreshTokens(uid);
      } catch (e) {
        console.warn('revokeRefreshTokens non-fatal warning:', e);
      }

      const response = NextResponse.json({ success: true, action });
      response.cookies.set('__cb_session', '', {
        path: '/',
        expires: new Date(0),
      });

      return response;
    }

    return NextResponse.json({ error: 'Unsupported revocation mode.' }, { status: 400 });
  } catch (err: any) {
    console.error('[/api/user/security/sessions POST] Error:', err);
    return NextResponse.json({ error: 'Failed to revoke sessions.' }, { status: 500 });
  }
}
