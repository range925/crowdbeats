// Crowdbeats V2 — Fan Receipts Page (Phase 6)
// Route: /fan/receipts
// Server Component: lists the fan's tip receipts with status filters.

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { SessionData } from '@/lib/session';
import { initAdmin } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

interface TipReceipt {
  tipId: string;
  recipientName: string | null;
  amountCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  currency: string;
  status: string;
  createdAt: { _seconds: number } | null;
  isAnonymous: boolean;
}

function formatCents(cents: number): string {
  const d = Math.floor(cents / 100);
  const c = cents % 100;
  return `$${d}.${c.toString().padStart(2, '0')}`;
}

function formatDate(ts: { _seconds: number } | null): string {
  if (!ts) return 'Unknown';
  const d = new Date(ts._seconds * 1000);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function statusColor(status: string): string {
  switch (status) {
    case 'succeeded': return 'text-green-400';
    case 'refunded':  return 'text-blue-400';
    case 'failed':    return 'text-red-400';
    default:          return 'text-amber-400';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'succeeded': return 'Confirmed';
    case 'refunded':  return 'Refunded';
    case 'failed':    return 'Failed';
    case 'processing':return 'Processing';
    default:          return 'Pending';
  }
}

async function getSession(): Promise<SessionData | null> {
  try {
    const raw = (await cookies()).get('__cb_session')?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as SessionData;
  } catch {
    return null;
  }
}

async function getFanReceipts(uid: string): Promise<TipReceipt[]> {
  try {
    initAdmin();
    const db = getFirestore();
    const snap = await db
      .collection('tips')
      .where('fanUid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snap.docs.map((doc) => {
      const d = doc.data();
      return {
        tipId: doc.id,
        recipientName: (d['recipientName'] as string | null) ?? null,
        amountCents: (d['amountCents'] as number) ?? 0,
        platformFeeCents: (d['platformFeeCents'] as number) ?? 0,
        netAmountCents: (d['netAmountCents'] as number) ?? 0,
        currency: (d['currency'] as string) ?? 'USD',
        status: (d['status'] as string) ?? 'pending',
        createdAt: (d['createdAt'] as { _seconds: number } | null) ?? null,
        isAnonymous: Boolean(d['isAnonymous']),
      };
    });
  } catch {
    return [];
  }
}

export default async function ReceiptsPage() {
  const session = await getSession();
  if (!session?.uid) redirect('/auth?next=/fan/receipts');

  const receipts = await getFanReceipts(session.uid);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ margin: 0 }}>Tip Receipts & Ledger</h1>
          <p style={{ color: '#94A3B8', fontSize: 13, margin: '4px 0 0 0' }}>
            Verified live tipping receipts and California-governed payment records.
          </p>
        </div>

        <a
          href="/statement/pdf?uid=usr_fan_self&role=fan&year=2026"
          target="_blank"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            backgroundColor: '#7C3AED',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)',
          }}
        >
          <span>📥</span>
          <span>Download Statement (PDF)</span>
        </a>
      </div>

      {receipts.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-white/4 py-16 text-center">
          <p className="text-4xl">🧾</p>
          <p className="mt-3 text-white/50">No tips yet.</p>
          <p className="mt-1 text-sm text-white/30">
            Open the Crowdbeats app and scan a performer&apos;s QR code.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {receipts.map((r) => (
            <div
              key={r.tipId}
              className="flex items-center justify-between rounded-xl border border-white/8
                         bg-white/4 px-5 py-4 transition-colors hover:bg-white/6"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {r.recipientName ?? 'Artist'}
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${statusColor(r.status)}`}
                  >
                    {statusLabel(r.status)}
                  </span>
                  <span className="text-xs text-white/40">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
              </div>
              <div className="ml-4 shrink-0 text-right">
                <p className="text-lg font-bold">
                  {formatCents(r.amountCents)}
                </p>
                <p className="text-xs text-white/40">
                  Creator got {formatCents(r.netAmountCents)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-white/30">
        Showing up to 50 most recent receipts.
        Full history available in the Crowdbeats app.
      </p>
    </div>
  );
}
