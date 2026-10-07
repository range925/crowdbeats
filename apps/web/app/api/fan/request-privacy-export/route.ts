// Crowdbeats V2 — Privacy Export API Route (Phase 6)
// POST /api/fan/request-privacy-export
// Server-side: reads session cookie, calls requestPrivacyExport via Firebase Admin SDK.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { SessionData } from '@/lib/session';
import { initAdmin } from '@/lib/firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

async function getSession(): Promise<SessionData | null> {
  try {
    const raw = (await cookies()).get('__cb_session')?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as SessionData;
  } catch {
    return null;
  }
}

export async function POST() {
  const session = await getSession();
  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.emailVerified) {
    return NextResponse.json({ error: 'Email verification required.' }, { status: 403 });
  }

  try {
    initAdmin();
    const db = getFirestore();
    const uid = session.uid;
    const exportRef = db.collection('privacyExportRequests').doc(uid);
    const existing = await exportRef.get();

    if (existing.exists) {
      const status = existing.data()?.['status'] as string;
      if (status === 'queued' || status === 'processing') {
        return NextResponse.json(
          { error: 'Export already in progress. You will receive an email when it is ready.' },
          { status: 409 },
        );
      }
    }

    await exportRef.set({
      uid,
      status: 'queued',
      requestedAt: FieldValue.serverTimestamp(),
      processedAt: null,
      downloadUrl: null,
      errorMessage: null,
    });

    return NextResponse.json({
      message: 'Export queued. You will receive an email within 48 hours.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
