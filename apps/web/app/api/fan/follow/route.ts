/**
 * Crowdbeats V2 -- Fan Follow Toggle API
 * Route: /api/fan/follow
 *
 * POST { artistId } - creates follows/{uid}_{artistId}
 * DELETE { artistId } - removes follows/{uid}_{artistId}
 */

import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { SessionData } from "@/lib/session";

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

async function getAccessToken(): Promise<string | null> {
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/datastore"] });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token ?? null;
  } catch {
    return null;
  }
}

async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("__cb_session")?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as SessionData;
  } catch { return null; }
}

function buildHeaders(token: string | null, withContentType = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (withContentType) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.uid) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = (await req.json()) as { artistId: string };
  const { artistId } = body;
  if (!artistId) return NextResponse.json({ error: "artistId required" }, { status: 400 });

  const followId = `${session.uid}_${artistId}`;
  const url = `${FIRESTORE_BASE}/follows/${followId}`;
  const token = await getAccessToken();

  const docBody = {
    fields: {
      fanUid:    { stringValue: session.uid },
      artistId:  { stringValue: artistId },
      createdAt: { timestampValue: new Date().toISOString() },
    },
  };

  await fetch(url, {
    method: "PATCH",
    headers: buildHeaders(token),
    body: JSON.stringify(docBody),
  }).catch(() => {});

  return NextResponse.json({ followed: true, followId });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.uid) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = (await req.json()) as { artistId: string };
  const { artistId } = body;
  if (!artistId) return NextResponse.json({ error: "artistId required" }, { status: 400 });

  const followId = `${session.uid}_${artistId}`;
  const url = `${FIRESTORE_BASE}/follows/${followId}`;
  const token = await getAccessToken();

  await fetch(url, {
    method: "DELETE",
    headers: buildHeaders(token, false),
  }).catch(() => {});

  return NextResponse.json({ followed: false, followId });
}