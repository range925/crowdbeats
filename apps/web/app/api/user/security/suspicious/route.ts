/**
 * Crowdbeats V2 — Suspicious Login & "This wasn't me" Incident Reporting API
 *
 * POST /api/user/security/suspicious
 * Body: { sessionId: string, userNotes?: string, shouldRevokeAllOthers?: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { SuspiciousReportResponse } from '@crowdbeats/contracts';

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
    const sessionId = body?.sessionId;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }

    _initAdmin();
    const db = getFirestore();
    const adminAuth = getAuth();
    const uid = session.uid;
    const now = FieldValue.serverTimestamp();
    const timestampStr = new Date().toISOString();

    // 1. Immediately terminate the suspicious session
    await db
      .collection('users')
      .doc(uid)
      .collection('sessions')
      .doc(sessionId)
      .set(
        {
          isRevoked: true,
          revokedAt: now,
          flaggedSuspicious: true,
          flaggedReason: body.userNotes || 'Reported by user as "This wasn\'t me"',
        },
        { merge: true }
      );

    // 2. If user requested, revoke all other sessions as precaution
    if (body.shouldRevokeAllOthers) {
      const sessionsSnap = await db
        .collection('users')
        .doc(uid)
        .collection('sessions')
        .where('isRevoked', '==', false)
        .get();

      const batch = db.batch();
      sessionsSnap.docs.forEach((doc) => {
        if (doc.id !== 'current_web_session') {
          batch.update(doc.ref, { isRevoked: true, revokedAt: now });
        }
      });
      await batch.commit();

      try {
        await adminAuth.revokeRefreshTokens(uid);
      } catch (e) {
        console.warn('revokeRefreshTokens warning:', e);
      }
    }

    // 3. Create high-severity security alert in audit log
    const incidentRef = await db.collection('users').doc(uid).collection('securityAlerts').add({
      type: 'suspicious_login',
      severity: 'critical',
      title: 'Suspicious Device Session Flagged',
      description: `You reported a login from session (${sessionId}) as unrecognized. Access was immediately terminated.`,
      timestamp: timestampStr,
      resolved: false,
      metadata: {
        sessionId,
        userNotes: body.userNotes || null,
      },
    });

    const responseData: SuspiciousReportResponse = {
      success: true,
      incidentId: incidentRef.id,
      revokedSessionId: sessionId,
      recommendedActions: [
        'reset_password',
        'review_connected_accounts',
        'enable_two_factor',
        'verify_payout_settings',
      ],
      timestamp: timestampStr,
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error('[/api/user/security/suspicious POST] Error:', err);
    return NextResponse.json({ error: 'Failed to record suspicious activity report.' }, { status: 500 });
  }
}
