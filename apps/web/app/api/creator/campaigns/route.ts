/**
 * Crowdbeats V2 — Creator Campaigns API Route (Phase 7)
 *
 * GET /api/creator/campaigns — list this creator's campaigns
 * POST /api/creator/campaigns — create new campaign draft
 *
 * The actual Cloud Function is the authoritative writer.
 * GET reads from Firestore directly via Admin SDK for SSR performance.
 * POST calls the createCampaign Cloud Function via HTTP.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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

const ALLOWED_PERSONAS = new Set(['artist', 'band_member']);

export async function GET(request: NextRequest) {
  const session = await _getSession();
  if (!session?.uid || !ALLOWED_PERSONAS.has(session.personaType)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    _initAdmin();
    const db = getFirestore();
    const snap = await db
      .collection('campaigns')
      .where('creatorId', '==', session.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const campaigns = snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        campaignId: d.id,
        // Convert Timestamps to ISO strings for JSON transport
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
        deadline: data.deadline,
        publishedAt: data.publishedAt instanceof Timestamp
          ? data.publishedAt.toDate().toISOString()
          : (data.publishedAt ?? null),
      };
    });

    return NextResponse.json({ campaigns });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await _getSession();
  if (!session?.uid || !ALLOWED_PERSONAS.has(session.personaType)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, description, goalCents, currency = 'USD', deadline, rewardTiers } = body;

  // Validate required fields
  if (!title || typeof title !== 'string' || (title as string).trim().length === 0) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  if (typeof goalCents !== 'number' || goalCents < 1000) {
    return NextResponse.json({ error: 'goalCents must be >= 1000 ($10)' }, { status: 400 });
  }
  if (!deadline || isNaN(Date.parse(deadline as string)) || new Date(deadline as string) <= new Date()) {
    return NextResponse.json({ error: 'deadline must be a future date' }, { status: 400 });
  }

  try {
    _initAdmin();
    const db = getFirestore();
    const { v4: uuidv4 } = await import('uuid');
    const campaignId = uuidv4();
    const now = Timestamp.now();

    await db.collection('campaigns').doc(campaignId).set({
      campaignId,
      creatorId: session.uid,
      title: (title as string).trim().substring(0, 120),
      description: typeof description === 'string' ? description.substring(0, 5000) : '',
      goalCents: Math.floor(goalCents as number),
      pledgedCents: 0,
      backerCount: 0,
      currency,
      status: 'draft',
      deadline,
      rewardTiers: Array.isArray(rewardTiers) ? rewardTiers : [],
      mediaUrls: [],
      stripeProductId: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ campaignId, status: 'draft' }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
